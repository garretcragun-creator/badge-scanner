import { c, font, fontDisplay, fontMono, wrapper, cardStyle } from '../styles.js';
import { LogoHeader } from '../components/Logo.js';
import { PrimaryBtn, SecondaryBtn } from '../components/Buttons.js';
import { BackButton } from '../components/BackButton.js';

const { createElement: h, useState } = React;

export function SettingsScreen({ user, onBack, onSaveMeetingLink, onLogout }) {
  const [link, setLink] = useState(user?.meetingLink || '');
  const [focused, setFocused] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSaveMeetingLink(link.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return h('div', { style: wrapper },
    h('div', { style: Object.assign({}, cardStyle, { maxWidth: 480 }) },
      h(LogoHeader, { user }),

      h(BackButton, { onClick: onBack }),

      // Section header
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } },
        h('div', {
          style: { width: 3, height: 22, borderRadius: 2, background: c.primaryGrad },
        }),
        h('h3', {
          style: { fontSize: 16, fontWeight: 700, color: c.text, margin: 0, fontFamily: fontDisplay },
        }, 'Settings'),
      ),
      h('p', {
        style: { fontSize: 13, color: c.textMuted, marginBottom: 24, lineHeight: 1.6, paddingLeft: 13 },
      }, 'Manage your meeting link and account settings.'),

      // Meeting Link section
      h('div', { style: { marginBottom: 24, animation: 'fadeInUp 0.4s ease both 0.1s' } },
        h('label', {
          style: {
            display: 'block', fontSize: 10, fontWeight: 600, color: c.textMuted,
            textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 7, fontFamily: font,
          },
        }, 'Meeting Link'),
        h('input', {
          type: 'url',
          value: link,
          placeholder: 'https://meetings.hubspot.com/your-name',
          onChange: (e) => { setLink(e.target.value); setSaved(false); },
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
        h('p', {
          style: { fontSize: 11, color: c.textMuted, marginTop: 6, lineHeight: 1.5 },
        }, 'Contacts you scan will see a "Book Meeting" button linking to this URL.'),
      ),

      h('div', { style: { display: 'flex', gap: 10, marginBottom: 32 } },
        h(PrimaryBtn, {
          onClick: handleSave,
          disabled: saved,
          style: { flex: 1 },
        }, saved ? 'Saved!' : 'Save Meeting Link'),
      ),

      // Account info
      h('div', {
        style: {
          padding: '16px 18px', borderRadius: 14,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid ' + c.cardBorder, marginBottom: 24,
          animation: 'fadeInUp 0.4s ease both 0.2s',
        },
      },
        h('div', {
          style: { fontSize: 10, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
        }, 'Account'),
        user ? h('div', null,
          h('div', { style: { fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 4 } }, user.name || 'Unknown'),
          h('div', { style: { fontSize: 12, color: c.textMuted, fontFamily: fontMono } }, user.email || ''),
        ) : null,
      ),

      // Logout
      h('div', { style: { borderTop: '1px solid ' + c.cardBorder, paddingTop: 16 } },
        h(SecondaryBtn, {
          onClick: onLogout,
          style: { width: '100%', color: c.danger },
        }, 'Logout'),
      ),
    ),
  );
}
