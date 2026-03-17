// Client-side sessionStorage helpers for UI state persistence across refreshes

const KEYS = {
  selectedEvent: 'stat_selectedEvent',
  scanHistory: 'stat_scanHistory',
};

export function saveSelectedEvent(event) {
  if (event) {
    sessionStorage.setItem(KEYS.selectedEvent, JSON.stringify(event));
  } else {
    sessionStorage.removeItem(KEYS.selectedEvent);
  }
}

export function loadSelectedEvent() {
  try {
    const raw = sessionStorage.getItem(KEYS.selectedEvent);
    return raw ? JSON.parse(raw) : null;
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
