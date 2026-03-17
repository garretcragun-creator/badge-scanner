if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) { /* dotenv optional locally */ }
}
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRoutes = require('./server/auth');
const ocrRoutes = require('./server/ocr');
const { requireAuth } = require('./server/middleware');
const { updateSession } = require('./server/session');
const { upsertContact, createNote, upsertCompany, associateContactWithCompany } = require('./server/hubspot');
const hapily = require('./server/hapily');
const { enrichContact } = require('./server/apollo');

const app = express();

// Health check — must come before any middleware
app.get('/health', (req, res) => res.json({ ok: true }));

app.use(express.json({ limit: '10mb' })); // Large limit for base64 images
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  },
}));

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
    meetingLink: req.session.meetingLink || '',
  });
});

// ─── API: OCR ─────────────────────────────────────────────────────
app.use('/api/ocr', ocrRoutes);

// ─── API: Apollo enrichment (find email from name/company) ─────────
app.post('/api/enrich', requireAuth, async (req, res) => {
  const { firstname, lastname, company } = req.body;
  try {
    const result = await enrichContact({ firstname, lastname, company });
    res.json(result);
  } catch (err) {
    console.error('Enrich error:', err);
    res.status(500).json({ enriched: false, reason: 'Enrichment failed' });
  }
});

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

// ─── API: Save user's meeting link ────────────────────────────────
app.post('/api/set-meeting-link', requireAuth, (req, res) => {
  const { meetingLink } = req.body;
  updateSession(req.sessionId, { meetingLink: meetingLink || '' });
  res.json({ ok: true });
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
  const { firstname, lastname, email, company, jobtitle, notes, leadType, warmth } = req.body;
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
    // Set lead status if warmth provided
    if (warmth) {
      contactProperties.hs_lead_status = warmth === 'Hot' ? 'OPEN' : warmth === 'Warm' ? 'IN_PROGRESS' : 'NEW';
    }
    // Set Hapily event lead capture trigger — tells Hapily to associate contact with event
    if (selectedEvent.id) {
      contactProperties.event_leadcapture_trigger = selectedEvent.id;
    }

    const { contactId, updated } = await upsertContact(accessToken, contactProperties);

    // Step 2: Create/find company and associate with contact (best-effort)
    let companyId = null;
    if (company || email) {
      try {
        const companyResult = await upsertCompany(accessToken, { companyName: company, email });
        if (companyResult) {
          companyId = companyResult.companyId;
          await associateContactWithCompany(accessToken, contactId, companyId);
        }
      } catch (e) {
        warnings.push('Company association failed');
        console.warn('Company upsert/associate failed:', e.message);
      }
    }

    // Step 3: Create note with qualification info (best-effort)
    if (notes || leadType || warmth) {
      try {
        let noteBody = '';
        const qualParts = [];
        if (leadType) qualParts.push(`Lead Type: ${leadType}`);
        if (warmth) qualParts.push(`Warmth: ${warmth}`);
        if (qualParts.length > 0) noteBody += qualParts.join(' | ') + '\n\n';
        if (notes) noteBody += notes;
        noteBody = noteBody.trim();
        if (noteBody) await createNote(accessToken, contactId, noteBody);
      } catch (e) {
        warnings.push('Note creation failed');
        console.warn('Note creation failed:', e.message);
      }
    }

    // Step 4: Create Hapily registrant (best-effort)
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

    // Step 5: Determine meeting link (user's default > event-level > global)
    const meetingUrl = req.session.meetingLink || selectedEvent.meetingLink || MEETING_LINK || '';

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
      companyId,
      timestamp: new Date().toISOString(),
    };
    req.session.scanHistory.push(scanEntry);

    res.json({
      contactId,
      updated,
      registrantId: registrantResult?.registrantId || null,
      companyId,
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

app.listen(PORT, () => {
  console.log(`Badge Scanner running on port ${PORT}`);
  if (BASE_URL) console.log(`OAuth redirect: ${BASE_URL}/auth/callback`);
});
