import { c, font, fontDisplay, wrapper, cardStyle } from '../styles.js';
import { LogoHeader } from '../components/Logo.js';
import { PrimaryBtn } from '../components/Buttons.js';
import { ErrorBanner } from '../components/ErrorBanner.js';

const { createElement: h } = React;

export function LoginScreen({ error }) {
  return h('div', { style: wrapper },
    h('div', { style: cardStyle },
      h(LogoHeader, { showUser: false }),

      // Feature pills
      h('div', {
        style: {
          display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
          marginBottom: 32, animation: 'fadeInUp 0.5s ease both 0.15s',
        },
      },
        ['Scan Badges', 'AI Extract', 'HubSpot Sync', 'Book Meetings'].map((label, i) =>
          h('span', {
            key: i,
            style: {
              fontSize: 11, fontWeight: 600, color: c.textMuted,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 99, padding: '5px 14px', letterSpacing: 0.5,
            },
          }, label)
        ),
      ),

      h('p', {
        style: {
          color: c.textSecondary, fontSize: 15, lineHeight: 1.8,
          textAlign: 'center', marginBottom: 32, fontWeight: 400,
          animation: 'fadeInUp 0.5s ease both 0.25s',
        },
      }, 'Scan conference badges, enrich contacts, and book meetings \u2014 all connected to HubSpot.'),

      h(ErrorBanner, { error }),

      h('div', { style: { animation: 'fadeInUp 0.5s ease both 0.35s' } },
        h(PrimaryBtn, {
          onClick: () => { window.location.href = '/auth/hubspot'; },
          style: { width: '100%' },
        }, 'Sign in with HubSpot'),
      ),

      // Subtle bottom accent line
      h('div', {
        style: {
          marginTop: 28, height: 2, borderRadius: 2,
          background: 'linear-gradient(90deg, transparent, ' + c.primaryGlow + ', transparent)',
        },
      }),
    ),
  );
}
