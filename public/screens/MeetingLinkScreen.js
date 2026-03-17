import { c, font, fontDisplay, fontMono, wrapper, cardStyle } from '../styles.js';
import { LogoHeader } from '../components/Logo.js';
import { PrimaryBtn, SecondaryBtn } from '../components/Buttons.js';

const { createElement: h, useState } = React;

export function MeetingLinkScreen({ user, onSave, onSkip }) {
  const [link, setLink] = useState('');
  const [focused, setFocused] = useState(false);

  return h('div', { style: wrapper },
    h('div', { style: Object.assign({}, cardStyle, { maxWidth: 480 }) },
      h(LogoHeader, { user }),

      h('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } },
        h('div', {
          style: { width: 3, height: 22, borderRadius: 2, background: c.primaryGrad },
        }),
        h('h3', {
          style: { fontSize: 16, fontWeight: 700, color: c.text, margin: 0, fontFamily: fontDisplay },
        }, 'Meeting Link'),
      ),
      h('p', {
        style: { fontSize: 13, color: c.textMuted, marginBottom: 24, lineHeight: 1.6, paddingLeft: 13 },
      }, 'Paste your HubSpot meeting link so contacts can book time with you after scanning.'),

      h('div', { style: { marginBottom: 24, animation: 'fadeInUp 0.4s ease both 0.1s' } },
        h('label', {
          style: {
            display: 'block', fontSize: 10, fontWeight: 600, color: c.textMuted,
            textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 7, fontFamily: font,
          },
        }, 'Your Meeting Link'),
        h('input', {
          type: 'url',
          value: link,
          placeholder: 'https://meetings.hubspot.com/your-name',
          onChange: (e) => setLink(e.target.value),
          onFocus: () => setFocused(true),
          onBlur: () => setFocused(false),
          style: {
            width: '100%',
            background: focused ? 'rgba(255,255,255,0.07)' : c.inputBg,
            border: '1px solid ' + (focused ? c.primary : c.inputBorder),
            borderRadius: 12, padding: '13px 16px', color: c.text, fontSize: 14,
            fontFamily: fontMono, outline: 'none', boxSizing: 'border-box',
            boxShadow: focused ? '0 0 0 3px ' + c.inputFocus : 'none',
            transition: 'all 0.25s ease',
          },
        }),
      ),

      h('div', { style: { display: 'flex', gap: 10 } },
        h(PrimaryBtn, {
          onClick: () => onSave(link.trim()),
          disabled: !link.trim(),
          style: { flex: 1 },
        }, 'Save'),
        h(SecondaryBtn, { onClick: onSkip }, 'Skip'),
      ),
    ),
  );
}
