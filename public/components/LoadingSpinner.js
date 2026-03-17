import { c } from '../styles.js';

const { createElement: h } = React;

export function LoadingSpinner({ size = 36, message }) {
  return h('div', {
    style: {
      textAlign: 'center', padding: '36px 0', color: c.textMuted,
      animation: 'fadeInUp 0.4s ease both',
    },
  },
    h('div', {
      style: {
        width: size, height: size, margin: '0 auto 16px', borderRadius: 99,
        border: '2px solid rgba(255,255,255,0.06)',
        borderTopColor: c.primary,
        animation: 'spin 0.8s linear infinite',
      },
    }),
    message ? h('div', {
      style: { fontSize: 13, fontWeight: 500, letterSpacing: 0.2 },
    }, message) : null,
  );
}
