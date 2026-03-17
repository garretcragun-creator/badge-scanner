require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRoutes = require('./server/auth');
const ocrRoutes = require('./server/ocr');
const { requireAuth } = require('./server/middleware');
const { updateSession } = require('./server/session');
const { upsertContact, createNote } = require('./server/hubspot');
const hapily = require('./server/hapily');

const app = express();

// Health check — must come before any middleware
app.get('/health', (req, res) => res.json({ ok: true }));

app.use(express.json({ limit: '10mb' })); // Large limit for base64 images
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const { MEETING_LINK, PORT = 3000, BASE_URL } = process.env;

// ─── Auth routes ──────────────────────────────────────────────────
app.use('/auth', authRoutes);

// ─── API: Current user info ───────────────────────────────────────
app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    name: req.session.ownerName,
    email: req.session.ownerEmail,
    hubspotOwnerId: req.session.hubspotOwnerId,
    selectedEvent: req.session.selectedEvent || null,
  });
});

// ─── API: OCR ─────────────────────────────────────────────────────
app.use('/api/ocr', ocrRoutes);

// ─── API: Fetch Hapily events for lead capture ────────────────────
app.get('/api/events', requireAuth, async (req, res) => {
  try {
    const result = await hapily.getLeadCaptureEvents(req.session.accessToken);
    res.json(result);
  } catch (err) {
    console.error('Events fetch error:', err);
    if (err.code === 'MISSING_SCOPES') {
      return res.status(403).json({
        error: err.message,
        code: 'MISSING_SCOPES',
        events: [],
      });
    }
    res.status(500).json({ error: 'Failed to load events', events: [] });
  }
});

// ─── API: Select an event to scan for ─────────────────────────────
app.post('/api/select-event', requireAuth, (req, res) => {
  const { eventId, eventName, meetingLink } = req.body;
  if (!eventId) return res.status(400).json({ error: 'Event ID required' });

  updateSession(req.sessionId, {
    selectedEvent: { id: eventId, name: eventName, meetingLink: meetingLink || '' },
  });

  res.json({ ok: true });
});

// ─── API: Submit a badge scan ─────────────────────────────────────
app.post('/api/submit-scan', requireAuth, async (req, res) => {
  const { firstname, lastname, email, company, jobtitle, notes } = req.body;
  const { accessToken, hubspotOwnerId, selectedEvent, ownerEmail, ownerName } = req.session;

  if (!selectedEvent) {
    return res.status(400).json({ error: 'No event selected', code: 'NO_EVENT' });
  }

  const warnings = [];

  try {
    // Step 1: Create or update contact
    const contactProperties = {
      firstname: firstname || '',
      lastname: lastname || '',
      email: email || '',
      company: company || '',
      jobtitle: jobtitle || '',
    };
    if (hubspotOwnerId) {
      contactProperties.hubspot_owner_id = hubspotOwnerId;
    }

    const { contactId, updated } = await upsertContact(accessToken, contactProperties);

    // Step 2: Create note (best-effort)
    if (notes) {
      try {
        await createNote(accessToken, contactId, notes);
      } catch (e) {
        warnings.push('Note creation failed');
        console.warn('Note creation failed:', e.message);
      }
    }

    // Step 3: Create Hapily registrant (best-effort)
    let registrantResult;
    try {
      registrantResult = await hapily.createRegistrant(accessToken, {
        contactId,
        eventId: selectedEvent.id,
        eventName: selectedEvent.name,
        firstname,
        lastname,
        email,
        company,
        jobtitle,
      });
      if (registrantResult.skipped) {
        warnings.push(`Registrant not created: ${registrantResult.reason}`);
      }
    } catch (e) {
      warnings.push('Registrant creation failed');
      console.warn('Registrant creation failed:', e.message);
    }

    // Step 4: Determine meeting link (event-level overrides global)
    const meetingUrl = selectedEvent.meetingLink || MEETING_LINK || '';

    // Add to scan history in session
    const scanEntry = {
      contactId,
      firstname,
      lastname,
      email,
      company,
      jobtitle,
      updated,
      registrantId: registrantResult?.registrantId || null,
      timestamp: new Date().toISOString(),
    };
    req.session.scanHistory.push(scanEntry);

    res.json({
      contactId,
      updated,
      registrantId: registrantResult?.registrantId || null,
      meetingUrl,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (err) {
    console.error('Submit scan error:', err);
    res.status(500).json({ error: 'Failed to create contact', code: 'SUBMIT_FAILED' });
  }
});

// ─── API: Scan history ────────────────────────────────────────────
app.get('/api/scan-history', requireAuth, (req, res) => {
  res.json({ history: req.session.scanHistory || [] });
});

// ─── API: Config (non-secret values for the client) ───────────────
app.get('/api/config', (req, res) => {
  res.json({
    meetingLink: MEETING_LINK || '',
  });
});

// ─── SPA fallback ─────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Badge Scanner running on port ${PORT}`);
  if (BASE_URL) console.log(`OAuth redirect: ${BASE_URL}/auth/callback`);
});
