import { c, font, fontDisplay, wrapper, cardStyle } from '../styles.js';
import { LogoHeader } from '../components/Logo.js';
import { PrimaryBtn, SecondaryBtn } from '../components/Buttons.js';
import { BackButton } from '../components/BackButton.js';
import { Field } from '../components/Field.js';
import { ErrorBanner } from '../components/ErrorBanner.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
const { createElement: h, useRef, useState, useEffect, useCallback } = React;

const LEAD_TYPE_OPTIONS = [
  { value: 'Prospect', label: 'Prospect' },
  { value: 'Customer', label: 'Customer' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Vendor', label: 'Vendor' },
  { value: 'Other', label: 'Other' },
];

const WARMTH_OPTIONS = [
  { value: 'Hot', label: 'Hot' },
  { value: 'Warm', label: 'Warm' },
  { value: 'Cold', label: 'Cold' },
];

export function ReviewScreen({ user, photo, ocrData, setOcrData, notes, setNotes, ocrLoading, error, onSubmit, onBack, onChangeEvent, selectedEvent, submitting, enrichStatus, leadType, setLeadType, warmth, setWarmth }) {
  const recognitionRef = useRef(null);
  const preRecordingNotesRef = useRef('');
  const [isListening, setIsListening] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  const hasSpeechAPI = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    const ref = recognitionRef.current;
    if (ref) {
      try { ref.stop(); } catch (e) { /* ignore */ }
      // Force-abort if stop doesn't fire onend within 2s
      setTimeout(() => {
        try { ref.abort(); } catch (e) { /* ignore */ }
      }, 2000);
    }
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const toggleVoice = () => {
    if (!hasSpeechAPI) return;
    if (isListening) {
      stopListening();
      return;
    }

    // Capture notes content before recording starts
    preRecordingNotesRef.current = notes;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false; // Only final results — prevents duplication
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        }
      }
      const base = preRecordingNotesRef.current;
      setNotes((base ? base + ' ' : '') + finalTranscript.trim());
    };

    recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  const updateField = (field) => (value) => {
    setOcrData((d) => ({ ...d, [field]: value }));
  };

  return h('div', { style: wrapper },
    h('div', { style: Object.assign({}, cardStyle, { maxWidth: 480 }) },
      h(LogoHeader, { user }),

      // Back button
      h(BackButton, { onClick: onBack, label: 'Back to Scanner' }),

      // Selected event indicator with change option
      selectedEvent ? h('div', {
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: c.primarySoft, border: '1px solid rgba(251,191,36,0.1)',
          borderRadius: 14, padding: '10px 16px', marginBottom: 20,
        },
      },
        h('div', {
          style: { fontSize: 12, color: c.textSecondary },
        },
          h('span', { style: { color: c.textMuted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5 } }, 'Event: '),
          h('span', { style: { fontWeight: 700, color: c.primary, fontFamily: fontDisplay } }, selectedEvent.name),
        ),
        onChangeEvent ? h('button', {
          onClick: onChangeEvent,
          style: {
            background: 'rgba(255,255,255,0.06)', border: '1px solid ' + c.cardBorder,
            color: c.textSecondary, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            fontFamily: font, borderRadius: 8, padding: '5px 10px', transition: 'all 0.2s',
          },
        }, 'Change') : null,
      ) : null,

      // Photo thumbnail with gradient overlay
      photo ? h('div', {
        style: {
          marginBottom: 24, borderRadius: 16, overflow: 'hidden',
          border: '1px solid ' + c.cardBorder, maxHeight: 160, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#000', animation: 'fadeInUp 0.4s ease both',
        },
      },
        h('img', { src: photo, alt: 'Badge', style: { width: '100%', objectFit: 'cover', maxHeight: 160, opacity: 0.85 } }),
        h('div', {
          style: {
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 50,
            background: 'linear-gradient(transparent, rgba(12,14,19,0.9))',
          },
        }),
      ) : null,

      // Section header
      h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
          animation: 'fadeInUp 0.4s ease both 0.1s',
        },
      },
        h('div', {
          style: { width: 3, height: 22, borderRadius: 2, background: c.primaryGrad },
        }),
        h('h3', {
          style: { fontSize: 16, fontWeight: 700, color: c.text, margin: 0, fontFamily: fontDisplay },
        }, ocrLoading ? 'Extracting contact info...' : 'Extracted Contact'),
      ),

      ocrLoading
        ? h(LoadingSpinner, { message: 'Analyzing badge with AI...' })
        : h('div', { style: { animation: 'fadeInUp 0.4s ease both 0.15s' } },
            // Name fields (side by side)
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' } },
              h(Field, { key: 'fn', label: 'First Name', value: ocrData.firstname, onChange: updateField('firstname'), placeholder: 'Jane' }),
              h(Field, { key: 'ln', label: 'Last Name', value: ocrData.lastname, onChange: updateField('lastname'), placeholder: 'Doe' }),
            ),
            h(Field, { key: 'em', label: 'Email', value: ocrData.email, onChange: updateField('email'), placeholder: 'jane@company.com', mono: true }),

            // Apollo enrichment status
            enrichStatus ? h('div', {
              style: {
                marginTop: -12, marginBottom: 16, fontSize: 11, fontWeight: 500,
                color: enrichStatus === 'searching' ? c.textMuted
                  : enrichStatus === 'found' ? c.accent
                  : c.textMuted,
              },
            }, enrichStatus === 'searching' ? 'Looking up email via Apollo...'
              : enrichStatus === 'found' ? 'Email enriched via Apollo'
              : enrichStatus === 'not_found' ? 'No email found in Apollo'
              : null,
            ) : null,
            h(Field, { key: 'co', label: 'Company', value: ocrData.company, onChange: updateField('company'), placeholder: 'Acme Inc' }),
            h(Field, { key: 'jt', label: 'Job Title', value: ocrData.jobtitle, onChange: updateField('jobtitle'), placeholder: 'VP of Marketing' }),

            // Lead qualification (side by side)
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' } },
              h(Field, {
                key: 'lt',
                label: 'Lead Type', value: leadType, onChange: setLeadType,
                options: LEAD_TYPE_OPTIONS, placeholder: 'Select type...',
              }),
              h(Field, {
                key: 'wm',
                label: 'Warmth', value: warmth, onChange: setWarmth,
                options: WARMTH_OPTIONS, placeholder: 'Select warmth...',
              }),
            ),

            // Notes section
            h('div', { style: { marginBottom: 20 } },
              h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 } },
                h('label', {
                  style: {
                    fontSize: 10, fontWeight: 600, color: c.textMuted,
                    textTransform: 'uppercase', letterSpacing: 1.8,
                  },
                }, 'Notes'),
                hasSpeechAPI ? h('button', {
                  onClick: toggleVoice,
                  type: 'button',
                  style: {
                    background: isListening ? c.dangerBg : 'rgba(255,255,255,0.04)',
                    color: isListening ? c.danger : c.textMuted,
                    border: '1px solid ' + (isListening ? 'rgba(248,113,113,0.3)' : c.cardBorder),
                    borderRadius: 99, padding: '5px 14px', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: font, display: 'flex', alignItems: 'center',
                    gap: 6, transition: 'all 0.2s',
                  },
                },
                  isListening ? 'Stop' : 'Voice',
                  isListening ? h('span', {
                    style: {
                      width: 6, height: 6, borderRadius: 99, background: c.danger,
                      animation: 'pulse 1s infinite',
                    },
                  }) : null,
                ) : null,
              ),
              h('textarea', {
                value: notes,
                onChange: (e) => setNotes(e.target.value),
                placeholder: 'Add context, talking points, follow-up reminders...',
                rows: 3,
                onFocus: () => setNotesFocused(true),
                onBlur: () => setNotesFocused(false),
                style: {
                  width: '100%',
                  background: notesFocused ? 'rgba(255,255,255,0.07)' : c.inputBg,
                  border: '1px solid ' + (notesFocused ? c.primary : c.inputBorder),
                  borderRadius: 12, padding: '13px 16px', color: c.text, fontSize: 14,
                  fontFamily: font, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  lineHeight: 1.7, transition: 'all 0.25s ease',
                  boxShadow: notesFocused ? '0 0 0 3px ' + c.inputFocus : 'none',
                },
              }),
            ),

            h(ErrorBanner, { error }),

            h('div', { style: { display: 'flex', gap: 10, marginTop: 4 } },
              h(PrimaryBtn, {
                onClick: onSubmit,
                disabled: (!ocrData.email && !ocrData.firstname) || submitting,
                style: { flex: 1 },
              }, submitting ? 'Saving...' : 'Save Contact'),
              h(SecondaryBtn, { onClick: onBack }, 'Cancel'),
            ),
          ),
    ),
  );
}
