import { c, font, fontMono } from '../styles.js';

const { createElement: h } = React;

export function ScanHistoryItem({ scan, onClick }) {
  const name = [scan.firstname, scan.lastname].filter(Boolean).join(' ') || scan.email || 'Unknown';
  const time = new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return h('div', {
    onClick,
    style: {
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
      borderRadius: 12, cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease', background: 'transparent',
    },
    onMouseEnter: (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; },
    onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent'; },
  },
    h('div', {
      style: {
        width: 36, height: 36, borderRadius: 10, background: c.primarySoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: c.primary, flexShrink: 0,
        border: '1px solid rgba(251,191,36,0.12)',
      },
    }, (scan.firstname?.[0] || scan.email?.[0] || '?').toUpperCase()),
    h('div', { style: { flex: 1, minWidth: 0 } },
      h('div', {
        style: {
          fontSize: 14, fontWeight: 600, color: c.text,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        },
      }, name),
      scan.company ? h('div', {
        style: {
          fontSize: 12, color: c.textMuted,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        },
      }, scan.company) : null,
    ),
    h('div', {
      style: { fontSize: 11, color: c.textMuted, fontFamily: fontMono, flexShrink: 0, opacity: 0.7 },
    }, time),
  );
}
