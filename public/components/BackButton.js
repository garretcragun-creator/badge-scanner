import { c, font } from '../styles.js';

const { createElement: h } = React;

export function BackButton({ onClick, label }) {
  return h('button', {
    onClick,
    style: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'none', border: 'none', color: c.textMuted,
      fontSize: 13, fontWeight: 600, fontFamily: font,
      cursor: 'pointer', padding: '6px 0', marginBottom: 16,
      transition: 'color 0.2s ease',
    },
    onMouseEnter: (e) => { e.currentTarget.style.color = c.primary; },
    onMouseLeave: (e) => { e.currentTarget.style.color = c.textMuted; },
  },
    h('svg', {
      width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
    },
      h('polyline', { points: '15 18 9 12 15 6' }),
    ),
    label || 'Back',
  );
}
