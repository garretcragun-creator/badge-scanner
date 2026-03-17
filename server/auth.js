const express = require('express');
const fetch = require('node-fetch');
const { createSession, destroySession } = require('./session');
const { COOKIE_NAME } = require('./middleware');

const router = express.Router();

const OAUTH_SCOPES = [
  'crm.objects.contacts.write',
  'crm.objects.contacts.read',
  'crm.schemas.custom.read',
  'crm.objects.custom.read',
  'crm.objects.custom.write',
  'oauth',
].join(' ');

// Redirect to HubSpot OAuth
router.get('/hubspot', (req, res) => {
  const redirectUri = `${process.env.BASE_URL}/auth/callback`;
  const url = `https://app.hubspot.com/oauth/authorize?client_id=${process.env.HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(OAUTH_SCOPES)}`;
  res.redirect(url);
});

// Exchange code for tokens, create session, set cookie
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing authorization code');

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: `${process.env.BASE_URL}/auth/callback`,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Token exchange failed:', err);
      return res.redirect('/?error=auth_failed');
    }

    const tokens = await tokenRes.json();

    // Get user info from token introspection
    const userRes = await fetch('https://api.hubapi.com/oauth/v1/access-tokens/' + tokens.access_token);
    const userInfo = userRes.ok ? await userRes.json() : {};

    let ownerName = userInfo.user || 'Unknown';
    let ownerEmail = userInfo.user || '';
    let ownerId = '';

    // Find the HubSpot owner by email
    try {
      const ownersRes = await fetch(
        'https://api.hubapi.com/crm/v3/owners?' + new URLSearchParams({ email: ownerEmail, limit: 1 }),
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );
      if (ownersRes.ok) {
        const ownersData = await ownersRes.json();
        if (ownersData.results?.length > 0) {
          const owner = ownersData.results[0];
          ownerId = owner.id;
          ownerName = [owner.firstName, owner.lastName].filter(Boolean).join(' ') || ownerName;
        }
      }
    } catch (e) {
      console.warn('Could not fetch owner:', e.message);
    }

    // Create server-side session (tokens never sent to client)
    const sessionId = createSession({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      ownerName,
      ownerEmail,
      hubspotOwnerId: ownerId,
    });

    // Set HttpOnly cookie and redirect
    const isProduction = process.env.NODE_ENV === 'production' || process.env.BASE_URL?.startsWith('https');
    res.cookie(COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    res.redirect('/?auth=success');
  } catch (err) {
    console.error('OAuth error:', err);
    res.redirect('/?error=auth_failed');
  }
});

// Logout
router.post('/logout', (req, res) => {
  const cookies = require('./middleware').parseCookies(req.headers.cookie);
  const sessionId = cookies[COOKIE_NAME];
  if (sessionId) {
    destroySession(sessionId);
  }
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

module.exports = router;
