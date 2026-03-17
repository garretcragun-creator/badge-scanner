import * as api from './api.js';
import * as store from './session.js';
import { LoginScreen } from './screens/LoginScreen.js';
import { MeetingLinkScreen } from './screens/MeetingLinkScreen.js';
import { EventSelectScreen } from './screens/EventSelectScreen.js';
import { ScanScreen } from './screens/ScanScreen.js';
import { ReviewScreen } from './screens/ReviewScreen.js';
import { ProcessingScreen } from './screens/ProcessingScreen.js';
import { DoneScreen } from './screens/DoneScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';

const { createElement: h, useState, useEffect } = React;

const SCREENS = { LOGIN: 0, MEETING_LINK: 1, EVENT_SELECT: 2, SCAN: 3, REVIEW: 4, PROCESSING: 5, DONE: 6, SETTINGS: 7 };

// Resize image to keep OCR payloads small and reliable
function resizeImage(dataUrl, maxDim = 1600, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim) {
        // Already small enough — just re-encode as JPEG to normalize format
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', quality));
        return;
      }
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // Fallback to original on error
    img.src = dataUrl;
  });
}

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
  const [enrichStatus, setEnrichStatus] = useState(null);
  const [leadType, setLeadType] = useState('');
  const [warmth, setWarmth] = useState('');

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

    // Clear auth=success from URL — this is a fresh login
    const isFreshLogin = params.get('auth') === 'success';
    if (isFreshLogin) {
      window.history.replaceState({}, '', '/');
    }

    // Check if we have an active session
    api.getMe().then(userData => {
      setUser(userData);
      const savedEvent = userData.selectedEvent || store.loadSelectedEvent();
      const savedHistory = store.loadScanHistory();
      setScanHistory(savedHistory);

      // Restore meeting link from localStorage if server doesn't have one
      if (!userData.meetingLink && userData.email) {
        const savedLink = store.loadMeetingLink(userData.email);
        if (savedLink) {
          // Silently restore to server session
          api.setMeetingLink(savedLink).then(() => {
            setUser(prev => ({ ...prev, meetingLink: savedLink }));
          }).catch(() => {});
        }
      }

      if (isFreshLogin && !userData.meetingLink) {
        // Check localStorage backup before prompting
        const localLink = userData.email ? store.loadMeetingLink(userData.email) : '';
        if (localLink) {
          // Restore from localStorage, skip prompt
          api.setMeetingLink(localLink).then(() => {
            setUser(prev => ({ ...prev, meetingLink: localLink }));
          }).catch(() => {});
          if (savedEvent) {
            setSelectedEvent(savedEvent);
            setScreen(SCREENS.SCAN);
          } else {
            setScreen(SCREENS.EVENT_SELECT);
            loadEvents();
          }
        } else {
          // No saved link anywhere — prompt for it
          setScreen(SCREENS.MEETING_LINK);
        }
      } else if (savedEvent) {
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

  const handleSaveMeetingLink = async (link) => {
    try {
      await api.setMeetingLink(link);
      setUser(prev => ({ ...prev, meetingLink: link }));
      // Persist to localStorage as backup (keyed by user email)
      if (user && user.email) {
        store.saveMeetingLink(user.email, link);
      }
    } catch (e) {
      console.warn('Failed to save meeting link:', e.message);
    }
    setScreen(SCREENS.EVENT_SELECT);
    loadEvents();
  };

  const handleSkipMeetingLink = () => {
    setScreen(SCREENS.EVENT_SELECT);
    loadEvents();
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
    setScreen(SCREENS.REVIEW);
    setError(null);
    setOcrLoading(true);
    setEnrichStatus(null);
    try {
      const resized = await resizeImage(imageDataUrl);
      setPhoto(resized);
      const base64 = resized.split(',')[1];
      const mediaType = 'image/jpeg'; // resizeImage always outputs JPEG
      const fields = await api.runOCR(base64, mediaType);
      const ocrResult = {
        firstname: fields.firstname || '',
        lastname: fields.lastname || '',
        email: fields.email || '',
        company: fields.company || '',
        jobtitle: fields.jobtitle || '',
      };
      setOcrData(ocrResult);
      setOcrLoading(false);

      // Auto-enrich via Apollo if no email found
      if (!ocrResult.email && (ocrResult.firstname || ocrResult.lastname)) {
        setEnrichStatus('searching');
        try {
          const enriched = await api.enrichContact({
            firstname: ocrResult.firstname,
            lastname: ocrResult.lastname,
            company: ocrResult.company,
          });
          if (enriched.enriched && enriched.email) {
            setOcrData(prev => ({
              ...prev,
              email: enriched.email,
              company: enriched.company || prev.company,
              jobtitle: enriched.jobtitle || prev.jobtitle,
            }));
            setEnrichStatus('found');
          } else {
            setEnrichStatus('not_found');
          }
        } catch (e) {
          setEnrichStatus('not_found');
        }
      }
    } catch (err) {
      console.error('OCR error:', err);
      setError('OCR extraction failed \u2014 please fill in the fields manually.');
      setOcrLoading(false);
    }
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
        leadType,
        warmth,
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
    setLeadType('');
    setWarmth('');
    setError(null);
    setResult(null);
    setEnrichStatus(null);
    setScreen(SCREENS.SCAN);
  };

  const handleChangeEvent = () => {
    setSelectedEvent(null);
    store.saveSelectedEvent(null);
    setScreen(SCREENS.EVENT_SELECT);
    loadEvents();
  };

  const handleBackToScan = () => {
    setError(null);
    setScreen(SCREENS.SCAN);
  };

  const handleOpenSettings = () => {
    setScreen(SCREENS.SETTINGS);
  };

  const handleBackFromSettings = () => {
    // Go back to scan if event selected, otherwise event select
    if (selectedEvent) {
      setScreen(SCREENS.SCAN);
    } else {
      setScreen(SCREENS.EVENT_SELECT);
    }
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

    case SCREENS.MEETING_LINK:
      return h(MeetingLinkScreen, {
        user, onSave: handleSaveMeetingLink, onSkip: handleSkipMeetingLink,
      });

    case SCREENS.EVENT_SELECT:
      return h(EventSelectScreen, {
        user, events, loading: eventsLoading, error,
        onSelect: handleSelectEvent, onLogout: handleLogout,
        onSettings: handleOpenSettings,
      });

    case SCREENS.SCAN:
      return h(ScanScreen, {
        user, selectedEvent, scanHistory, error,
        onFileSelect: handleFileSelect, onManualEntry: handleManualEntry,
        onChangeEvent: handleChangeEvent, onLogout: handleLogout,
        onSettings: handleOpenSettings,
      });

    case SCREENS.REVIEW:
      return h(ReviewScreen, {
        user, photo, ocrData, setOcrData, notes, setNotes,
        ocrLoading, error, onSubmit: handleSubmit, onBack: handleBackToScan,
        onChangeEvent: handleChangeEvent, selectedEvent,
        submitting, enrichStatus, leadType, setLeadType, warmth, setWarmth,
      });

    case SCREENS.PROCESSING:
      return h(ProcessingScreen, { user, step: processing.step });

    case SCREENS.DONE:
      return h(DoneScreen, {
        user, ocrData, result, selectedEvent,
        onScanNext: resetForNextScan,
      });

    case SCREENS.SETTINGS:
      return h(SettingsScreen, {
        user, onBack: handleBackFromSettings,
        onSaveMeetingLink: async (link) => {
          try {
            await api.setMeetingLink(link);
            setUser(prev => ({ ...prev, meetingLink: link }));
            if (user && user.email) {
              store.saveMeetingLink(user.email, link);
            }
          } catch (e) {
            console.warn('Failed to save meeting link:', e.message);
          }
        },
        onLogout: handleLogout,
      });

    default:
      return null;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(h(App));
