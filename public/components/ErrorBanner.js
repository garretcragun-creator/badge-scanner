import { c } from '../styles.js';

const { createElement: h } = React;

export function ErrorBanner({ error }) {
  if (!error) return null;
  return h('div', {
    style: {
      color: c.danger, fontSize: 13, marginBottom: 16, padding: '12px 16px',
      background: c.dangerBg, borderRadius: 12,
      border: '1px solid rgba(248,113,113,0.15)', lineHeight: 1.5,
      animation: 'fadeInUp 0.3s ease both',
    },
  }, error);
}
