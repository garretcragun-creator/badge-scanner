import * as api from './api.js';
import * as store from './session.js';
import { LoginScreen } from './screens/LoginScreen.js';
import { EventSelectScreen } from './screens/EventSelectScreen.js';
import { ScanScreen } from './screens/ScanScreen.js';
import { ReviewScreen } from './screens/ReviewScreen.js';
import { ProcessingScreen } from './screens/ProcessingScreen.js';
import { DoneScreen } from './screens/DoneScreen.js';

const { createElement: h, useState, useEffect } = React;

const SCREENS = { LOGIN: 0, EVENT_SELECT: 1, SCAN: 2, REVIEW: 3, PROCESSING: 4, DONE: 5 };

function App() {
  const [screen, setScreen] = useState(SCREENS.LOGIN);
  const [user, setUser] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [ocrData, setOcrData] = useState({ firstname: '', lastname: '', email: '', company: '', jobtitle: '' });
  const [notes, setNotes] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [processing, setProcessing] = useState({ step: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('error')) {
      const errType = params.get('error');
      setError(errType === 'session_expired' ? 'Session expired. Please sign in again.' : 'Authentication failed. Please try again.');
      window.history.replaceState({}, '', '/');
      setSessionChecked(true);
      return;
    }

    // Clear auth=success from URL
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, '', '/');
    }

    // Check if we have an active session
    api.getMe().then(userData => {
      setUser(userData);
      const savedEvent = userData.selectedEvent || store.loadSelectedEvent();
      const savedHistory = store.loadScanHistory();
      setScanHistory(savedHistory);

      if (savedEvent) {
        setSelectedEvent(savedEvent);
        setScreen(SCREENS.SCAN);
      } else {
        setScreen(SCREENS.EVENT_SELECT);
        loadEvents();
      }
    }).catch(() => {
      // Not authenticated
    }).finally(() => {
      setSessionChecked(true);
    });
  }, []);

  const loadEvents = async () => {
    setEventsLoading(true);
    setError(null);
    try {
      const data = await api.getEvents();
      setEvents(data.events || []);
      if (data.warning) setError(data.warning);
    } catch (err) {
      setError(err.message);
    }
    setEventsLoading(false);
  };

  const handleSelectEvent = async (event) => {
    try {
      await api.selectEvent(event.id, event.name, event.meetingLink);
      const eventData = { id: event.id, name: event.name, meetingLink: event.meetingLink || '' };
      setSelectedEvent(eventData);
      store.saveSelectedEvent(eventData);
      setError(null);
      setScreen(SCREENS.SCAN);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileSelect = async (imageDataUrl) => {
    setPhoto(imageDataUrl);
    setScreen(SCREENS.REVIEW);
    setError(null);
    setOcrLoading(true);
    try {
      const base64 = imageDataUrl.split(',')[1];
      const mediaType = (imageDataUrl.match(/data:(.*?);/) || [])[1] || 'image/jpeg';
      const fields = await api.runOCR(base64, mediaType);
      setOcrData({
        firstname: fields.firstname || '',
        lastname: fields.lastname || '',
        email: fields.email || '',
        company: fields.company || '',
        jobtitle: fields.jobtitle || '',
      });
    } catch (err) {
      console.error('OCR error:', err);
      setError('OCR extraction failed \u2014 please fill in the fields manually.');
    }
    setOcrLoading(false);
  };

  const handleManualEntry = () => {
    setPhoto(null);
    setOcrData({ firstname: '', lastname: '', email: '', company: '', jobtitle: '' });
    setScreen(SCREENS.REVIEW);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setScreen(SCREENS.PROCESSING);
    setProcessing({ step: 1 });

    try {
      // Step 1: Creating contact
      setProcessing({ step: 1 });
      await new Promise(r => setTimeout(r, 300)); // Brief delay for visual feedback

      // Step 2: Registering attendee
      setProcessing({ step: 2 });

      const data = await api.submitScan({
        firstname: ocrData.firstname,
        lastname: ocrData.lastname,
        email: ocrData.email,
        company: ocrData.company,
        jobtitle: ocrData.jobtitle,
        notes,
      });

      // Step 3: Meeting link
      setProcessing({ step: 3 });
      await new Promise(r => setTimeout(r, 300));

      setResult(data);

      // Update scan history
      const entry = {
        contactId: data.contactId,
        firstname: ocrData.firstname,
        lastname: ocrData.lastname,
        email: ocrData.email,
        company: ocrData.company,
        jobtitle: ocrData.jobtitle,
        timestamp: new Date().toISOString(),
      };
      const newHistory = store.addToScanHistory(entry);
      setScanHistory(newHistory);

      setScreen(SCREENS.DONE);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setScreen(SCREENS.REVIEW);
    }
    setSubmitting(false);
  };

  const resetForNextScan = () => {
    setPhoto(null);
    setOcrData({ firstname: '', lastname: '', email: '', company: '', jobtitle: '' });
    setNotes('');
    setError(null);
    setResult(null);
    setScreen(SCREENS.SCAN);
  };

  const handleChangeEvent = () => {
    setSelectedEvent(null);
    store.saveSelectedEvent(null);
    setScreen(SCREENS.EVENT_SELECT);
    loadEvents();
  };

  const handleLogout = () => {
    api.logout();
  };

  // Don't render until session check completes (prevent flash of login screen)
  if (!sessionChecked) {
    return h('div', {
      style: {
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0C0E13',
      },
    },
      h('div', {
        style: {
          width: 36, height: 36, borderRadius: 99,
          border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#FBBF24',
          animation: 'spin 0.8s linear infinite',
        },
      }),
    );
  }

  switch (screen) {
    case SCREENS.LOGIN:
      return h(LoginScreen, { error });

    case SCREENS.EVENT_SELECT:
      return h(EventSelectScreen, {
        user, events, loading: eventsLoading, error,
        onSelect: handleSelectEvent, onLogout: handleLogout,
      });

    case SCREENS.SCAN:
      return h(ScanScreen, {
        user, selectedEvent, scanHistory, error,
        onFileSelect: handleFileSelect, onManualEntry: handleManualEntry,
        onChangeEvent: handleChangeEvent, onLogout: handleLogout,
      });

    case SCREENS.REVIEW:
      return h(ReviewScreen, {
        user, photo, ocrData, setOcrData, notes, setNotes,
        ocrLoading, error, onSubmit: handleSubmit, onRescan: resetForNextScan,
        submitting,
      });

    case SCREENS.PROCESSING:
      return h(ProcessingScreen, { user, step: processing.step });

    case SCREENS.DONE:
      return h(DoneScreen, {
        user, ocrData, result, selectedEvent,
        onScanNext: resetForNextScan,
      });

    default:
      return null;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(h(App));
