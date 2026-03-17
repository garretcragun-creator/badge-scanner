const fetch = require('node-fetch');
const { getSession, updateSession } = require('./session');

const COOKIE_NAME = 'session_id';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    cookies[name] = rest.join('=');
  });
  return cookies;
}

async function refreshAccessToken(session) {
  const res = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.HUBSPOT_CLIENT_ID,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET,
      refresh_token: session.refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Token refresh failed:', res.status, text);
    return false;
  }

  const data = await res.json();
  session.accessToken = data.access_token;
  session.refreshToken = data.refresh_token;
  session.expiresAt = Date.now() + data.expires_in * 1000;
  return true;
}

// Middleware: validates session cookie, auto-refreshes token if needed
async function requireAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[COOKIE_NAME];

  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated', code: 'NO_SESSION' });
  }

  const session = getSession(sessionId);
  if (!session) {
    return res.status(401).json({ error: 'Session expired', code: 'SESSION_EXPIRED' });
  }

  // Auto-refresh token if within buffer
  if (session.expiresAt - Date.now() < TOKEN_REFRESH_BUFFER_MS) {
    const refreshed = await refreshAccessToken(session);
    if (!refreshed) {
      return res.status(401).json({ error: 'Token refresh failed. Please log in again.', code: 'TOKEN_REFRESH_FAILED' });
    }
    updateSession(sessionId, session);
  }

  req.session = session;
  req.sessionId = sessionId;
  next();
}

module.exports = { requireAuth, parseCookies, COOKIE_NAME };
