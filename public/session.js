// Client-side storage helpers for UI state persistence
// sessionStorage = per-tab state (event, scan history)
// localStorage = persistent across sessions (meeting link keyed by email)

const KEYS = {
  selectedEvent: 'stat_selectedEvent',
  selectedEventPersist: 'stat_selectedEvent_persist', // localStorage backup
  scanHistory: 'stat_scanHistory',
  meetingLink: 'stat_meetingLink_', // suffixed with email
};

export function saveSelectedEvent(event) {
  if (event) {
    sessionStorage.setItem(KEYS.selectedEvent, JSON.stringify(event));
    // Also persist to localStorage so it survives OAuth re-login redirects
    try { localStorage.setItem(KEYS.selectedEventPersist, JSON.stringify(event)); } catch { /* ignore */ }
  } else {
    sessionStorage.removeItem(KEYS.selectedEvent);
    try { localStorage.removeItem(KEYS.selectedEventPersist); } catch { /* ignore */ }
  }
}

export function loadSelectedEvent() {
  try {
    // Try sessionStorage first (current tab), fall back to localStorage (survives re-login)
    const raw = sessionStorage.getItem(KEYS.selectedEvent);
    if (raw) return JSON.parse(raw);
    const persisted = localStorage.getItem(KEYS.selectedEventPersist);
    return persisted ? JSON.parse(persisted) : null;
  } catch {
    return null;
  }
}

export function saveScanHistory(history) {
  sessionStorage.setItem(KEYS.scanHistory, JSON.stringify(history));
}

export function loadScanHistory() {
  try {
    const raw = sessionStorage.getItem(KEYS.scanHistory);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToScanHistory(entry) {
  const history = loadScanHistory();
  history.unshift(entry);
  saveScanHistory(history);
  return history;
}

export function clearSession() {
  sessionStorage.removeItem(KEYS.selectedEvent);
  sessionStorage.removeItem(KEYS.scanHistory);
}

// Meeting link persistence (localStorage, survives session expiry)
export function saveMeetingLink(email, link) {
  if (!email) return;
  try {
    localStorage.setItem(KEYS.meetingLink + email.toLowerCase(), link || '');
  } catch { /* ignore */ }
}

export function loadMeetingLink(email) {
  if (!email) return '';
  try {
    return localStorage.getItem(KEYS.meetingLink + email.toLowerCase()) || '';
  } catch {
    return '';
  }
}
