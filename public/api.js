// API client — all fetch calls to the backend

async function apiCall(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 401) {
    // Session expired — redirect to login
    window.location.href = '/?error=session_expired';
    throw new Error('Session expired');
  }

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.code = data.code;
    err.status = res.status;
    throw err;
  }

  return data;
}

export async function getMe() {
  // Don't use apiCall — a 401 here is expected (not logged in), not an error
  const res = await fetch('/api/me', { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function getEvents() {
  return apiCall('/api/events');
}

export async function setMeetingLink(meetingLink) {
  return apiCall('/api/set-meeting-link', {
    method: 'POST',
    body: JSON.stringify({ meetingLink }),
  });
}

export async function selectEvent(eventId, eventName, meetingLink) {
  return apiCall('/api/select-event', {
    method: 'POST',
    body: JSON.stringify({ eventId, eventName, meetingLink }),
  });
}

export async function runOCR(imageBase64, mediaType) {
  return apiCall('/api/ocr', {
    method: 'POST',
    body: JSON.stringify({ image: imageBase64, mediaType }),
  });
}

export async function enrichContact({ firstname, lastname, company }) {
  return apiCall('/api/enrich', {
    method: 'POST',
    body: JSON.stringify({ firstname, lastname, company }),
  });
}

export async function submitScan({ firstname, lastname, email, company, jobtitle, notes, leadType, warmth }) {
  return apiCall('/api/submit-scan', {
    method: 'POST',
    body: JSON.stringify({ firstname, lastname, email, company, jobtitle, notes, leadType, warmth }),
  });
}

export async function getScanHistory() {
  return apiCall('/api/scan-history');
}

export async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  sessionStorage.clear();
  window.location.href = '/';
}

export async function getConfig() {
  try {
    const res = await fetch('/api/config');
    return res.ok ? res.json() : {};
  } catch {
    return {};
  }
}
