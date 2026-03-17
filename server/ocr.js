const express = require('express');
const fetch = require('node-fetch');
const { requireAuth } = require('./middleware');

const router = express.Router();

// POST /api/ocr — Extract contact info from badge image using Claude Vision
router.post('/', requireAuth, async (req, res) => {
  const { image, mediaType } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image provided', code: 'MISSING_IMAGE' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OCR not configured. ANTHROPIC_API_KEY is missing.', code: 'NO_API_KEY' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/jpeg',
                data: image,
              },
            },
            {
              type: 'text',
              text: `Extract the following information from this conference badge or business card image. Return ONLY a JSON object with these fields:
{
  "firstname": "",
  "lastname": "",
  "email": "",
  "company": "",
  "jobtitle": ""
}

If a field cannot be determined, leave it as an empty string. Do not include any other text, markdown formatting, or explanation — just the JSON object.`,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return res.status(502).json({ error: 'OCR service error', code: 'OCR_API_ERROR' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Parse JSON from response (handle potential markdown wrapping)
    let fields;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      fields = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (parseErr) {
      console.error('OCR JSON parse error:', parseErr.message, 'Raw text:', text);
      fields = {};
    }

    res.json({
      firstname: fields.firstname || '',
      lastname: fields.lastname || '',
      email: fields.email || '',
      company: fields.company || '',
      jobtitle: fields.jobtitle || '',
    });
  } catch (err) {
    console.error('OCR error:', err);
    res.status(500).json({ error: 'OCR processing failed', code: 'OCR_FAILED' });
  }
});

module.exports = router;
