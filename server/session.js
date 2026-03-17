const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join(__dirname, '..', '.sessions.json');

// Load sessions from disk on startup
let sessions;
try {
  const data = fs.readFileSync(SESSION_FILE, 'utf8');
  const parsed = JSON.parse(data);
  sessions = new Map(parsed);
  console.log(`Restored ${sessions.size} session(s) from disk`);
} catch {
  sessions = new Map();
}

// Persist sessions to disk (debounced to avoid excessive writes)
let saveTimer = null;
function persistSessions() {
  if (saveTimer) return; // Already scheduled
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.writeFileSync(SESSION_FILE, JSON.stringify([...sessions]), 'utf8');
    } catch (e) {
      console.warn('Failed to persist sessions:', e.message);
    }
  }, 1000);
}

function createSession(data) {
  const id = crypto.randomUUID();
  sessions.set(id, {
    ...data,
    createdAt: Date.now(),
    scanHistory: [],
    selectedEvent: null,
  });
  persistSessions();
  return id;
}

function getSession(id) {
  return sessions.get(id) || null;
}

function updateSession(id, updates) {
  const session = sessions.get(id);
  if (!session) return null;
  Object.assign(session, updates);
  persistSessions();
  return session;
}

function destroySession(id) {
  sessions.delete(id);
  persistSessions();
}

module.exports = { createSession, getSession, updateSession, destroySession };
