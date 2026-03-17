const crypto = require('crypto');

// In-memory session store. Sessions are lost on server restart — acceptable for a conference app.
const sessions = new Map();

function createSession(data) {
  const id = crypto.randomUUID();
  sessions.set(id, {
    ...data,
    createdAt: Date.now(),
    scanHistory: [],
    selectedEvent: null,
  });
  return id;
}

function getSession(id) {
  return sessions.get(id) || null;
}

function updateSession(id, updates) {
  const session = sessions.get(id);
  if (!session) return null;
  Object.assign(session, updates);
  return session;
}

function destroySession(id) {
  sessions.delete(id);
}

module.exports = { createSession, getSession, updateSession, destroySession };
