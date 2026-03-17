import { c, font, fontDisplay, wrapper, cardStyle } from '../styles.js';
import { LogoHeader } from '../components/Logo.js';
import { PrimaryBtn, SecondaryBtn } from '../components/Buttons.js';
import { Field } from '../components/Field.js';
import { ErrorBanner } from '../components/ErrorBanner.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
const { createElement: h, useRef, useState } = React;

export function ReviewScreen({ user, photo, ocrData, setOcrData, notes, setNotes, ocrLoading, error, onSubmit, onRescan, submitting, enrichStatus }) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const hasSpeechAPI = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const toggleVoice = () => {
    if (!hasSpeechAPI) return;
    if (isListening) {
      recognitionRef.current && recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setNotes((prev) => (prev.endsWith(' ') || prev === '' ? prev : prev + ' ') + t);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const updateField = (field) => (value) => {
    setOcrData((d) => ({ ...d, [field]: value }));
  };

  return h('div', { style: wrapper },
    h('div', { style: Object.assign({}, cardStyle, { maxWidth: 480 }) },
      h(LogoHeader, { user }),

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
              h(Field, { label: 'First Name', value: ocrData.firstname, onChange: updateField('firstname'), placeholder: 'Jane' }),
              h(Field, { label: 'Last Name', value: ocrData.lastname, onChange: updateField('lastname'), placeholder: 'Doe' }),
            ),
            h(Field, { label: 'Email', value: ocrData.email, onChange: updateField('email'), placeholder: 'jane@company.com', mono: true }),

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
            h(Field, { label: 'Company', value: ocrData.company, onChange: updateField('company'), placeholder: 'Acme Inc' }),
            h(Field, { label: 'Job Title', value: ocrData.jobtitle, onChange: updateField('jobtitle'), placeholder: 'VP of Marketing' }),

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
                onFocus: (e) => {
                  e.target.style.borderColor = c.primary;
                  e.target.style.boxShadow = '0 0 0 3px ' + c.inputFocus;
                  e.target.style.background = 'rgba(255,255,255,0.07)';
                },
                onBlur: (e) => {
                  e.target.style.borderColor = c.inputBorder;
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = c.inputBg;
                },
                style: {
                  width: '100%', background: c.inputBg, border: '1px solid ' + c.inputBorder,
                  borderRadius: 12, padding: '13px 16px', color: c.text, fontSize: 14,
                  fontFamily: font, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  lineHeight: 1.7, transition: 'all 0.25s ease',
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
              h(SecondaryBtn, { onClick: onRescan }, 'Rescan'),
            ),
          ),
    ),
  );
}
