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
        model: 'claude-sonnet-4-6',
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
              text: `You are an expert OCR system for reading conference badges. Extract the ATTENDEE's contact information from this badge photo.

BADGE LAYOUT (typical hierarchy):
- ATTENDEE NAME: The largest, most prominent text. First and last name may be on separate lines.
- COMPANY: Usually smaller text below or above the name. This is the attendee's employer.
- JOB TITLE: Often near the company name, sometimes omitted entirely.
- EMAIL: Rarely printed on conference badges. Only extract if you see an actual @ symbol on the badge.

CRITICAL RULES:
- NEVER guess or construct an email address. Only return an email if one is clearly printed on the badge. Most badges will not have one — leave it as "".
- Distinguish the ATTENDEE's company from the EVENT/CONFERENCE name. The event name is often at the top or bottom of the badge in branding (e.g., "SaaStr Annual", "Dreamforce", "HIMSS"). Do NOT put the event name as the company.
- If a lanyard, glare, finger, or plastic holder obscures text, extract what you can see and leave unclear fields as "".
- For names, use title case (e.g., "John Smith" not "JOHN SMITH").
- For company names, use standard capitalization (e.g., "Acme Corp" not "ACME CORP"), unless it's a known acronym/brand (e.g., "IBM", "AWS").
- For email, always lowercase.

Return ONLY a JSON object with exactly these fields:
{
  "firstname": "",
  "lastname": "",
  "email": "",
  "company": "",
  "jobtitle": ""
}

Leave any field as "" if not visible on the badge. No other text, markdown, or explanation — just the JSON.`,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      let userMessage = 'OCR service error';
      if (response.status === 401) userMessage = 'OCR API key is invalid or expired.';
      else if (response.status === 413) userMessage = 'Image is too large for OCR. Try a smaller image.';
      else if (response.status === 429) userMessage = 'OCR rate limit reached. Please wait a moment and try again.';
      else if (response.status === 529) userMessage = 'OCR service is temporarily overloaded. Please try again.';
      return res.status(502).json({ error: userMessage, code: 'OCR_API_ERROR' });
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
