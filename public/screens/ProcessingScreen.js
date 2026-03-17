import { c, fontDisplay, wrapper, cardStyle } from '../styles.js';
import { LogoHeader } from '../components/Logo.js';

const { createElement: h } = React;

const STEPS = [
  { label: 'Creating contact in HubSpot', icon: '\uD83D\uDC64' },
  { label: 'Registering as event attendee', icon: '\uD83C\uDFAB' },
  { label: 'Preparing meeting link', icon: '\uD83D\uDCC5' },
];

export function ProcessingScreen({ user, step }) {
  return h('div', { style: wrapper },
    h('div', { style: Object.assign({}, cardStyle, { textAlign: 'center' }) },
      h(LogoHeader, { user }),

      h('div', { style: { margin: '24px 0 12px' } },
        // Animated spinner with amber glow
        h('div', {
          style: {
            width: 56, height: 56, margin: '0 auto 32px', borderRadius: 99,
            border: '2px solid rgba(255,255,255,0.06)',
            borderTopColor: c.primary,
            animation: 'spin 0.8s linear infinite',
            boxShadow: '0 0 20px rgba(251,191,36,0.1)',
          },
        }),

        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' } },
          STEPS.map((s, i) => {
            const active = step === i + 1;
            const done = step > i + 1;
            const pending = step < i + 1;
            return h('div', {
              key: i,
              style: {
                display: 'flex', alignItems: 'center', gap: 14,
                opacity: pending ? 0.25 : 1,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: '10px 14px', borderRadius: 14,
                background: active ? c.primarySoft : 'transparent',
                border: active ? '1px solid rgba(251,191,36,0.1)' : '1px solid transparent',
                animation: `fadeInUp 0.4s ease both ${0.1 + i * 0.08}s`,
              },
            },
              h('span', {
                style: {
                  width: 32, height: 32, borderRadius: 10,
                  background: done ? c.accentGlow : active ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                  border: done ? '1px solid rgba(52,211,153,0.2)' : active ? '1px solid rgba(251,191,36,0.15)' : '1px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  transition: 'all 0.3s ease',
                },
              }, done ? '\u2713' : s.icon),
              h('span', {
                style: {
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  color: active ? c.text : done ? c.accent : c.textSecondary,
                  fontFamily: fontDisplay, transition: 'color 0.3s ease',
                },
              }, s.label),
            );
          }),
        ),
      ),
    ),
  );
}
