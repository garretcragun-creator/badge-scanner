import { c, fontDisplay } from '../styles.js';

const { createElement: h } = React;

export function StatLogo({ height = 36 }) {
  return h('div', {
    style: { display: 'inline-flex', alignItems: 'center', gap: 10 },
  },
    h('img', {
      src: './stat-logo.png',
      alt: 'Stat',
      style: { height: height * 0.95, width: 'auto' },
    }),
    h('span', {
      style: {
        fontFamily: fontDisplay, fontSize: height * 1.1,
        fontWeight: 800, color: c.text, letterSpacing: -1.5, lineHeight: 1,
      },
    }, 'Stat'),
  );
}

export function LogoHeader({ user, showUser = true }) {
  return h('div', { style: { marginBottom: 32, textAlign: 'center' } },
    h(StatLogo, { height: 36 }),
    h('div', {
      style: {
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: 4, color: c.textMuted, marginTop: 6,
        fontFamily: fontDisplay,
      },
    }, 'Badge Scanner'),
    showUser && user ? h('div', {
      style: {
        fontSize: 12, color: c.textSecondary, marginTop: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        animation: 'fadeInUp 0.4s ease both 0.2s',
      },
    },
      h('span', {
        style: {
          width: 6, height: 6, borderRadius: 99, background: c.accent,
          display: 'inline-block', boxShadow: '0 0 8px ' + c.accent,
        },
      }),
      h('span', { style: { fontWeight: 500 } }, user.name),
    ) : null,
  );
}
