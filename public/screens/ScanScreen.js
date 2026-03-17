import { c, font, fontDisplay, wrapper, cardStyle } from '../styles.js';
import { LogoHeader } from '../components/Logo.js';
import { SecondaryBtn } from '../components/Buttons.js';
import { ErrorBanner } from '../components/ErrorBanner.js';
import { ScanHistoryItem } from '../components/ScanHistoryItem.js';

const { createElement: h, useRef } = React;

export function ScanScreen({ user, selectedEvent, scanHistory, error, onFileSelect, onManualEntry, onChangeEvent, onLogout, onSettings }) {
  const fileInputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onFileSelect(ev.target.result);
    reader.readAsDataURL(file);
  };

  return h('div', { style: wrapper },
    h('div', { style: cardStyle },
      h(LogoHeader, { user }),

      // Selected event indicator
      selectedEvent ? h('div', {
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: c.primarySoft, border: '1px solid rgba(251,191,36,0.1)',
          borderRadius: 14, padding: '12px 16px', marginBottom: 24,
          animation: 'fadeInUp 0.4s ease both 0.1s',
        },
      },
        h('div', null,
          h('div', {
            style: {
              fontSize: 10, fontWeight: 600, color: c.textMuted,
              textTransform: 'uppercase', letterSpacing: 1.5,
            },
          }, 'Scanning for'),
          h('div', {
            style: { fontSize: 14, fontWeight: 700, color: c.primary, marginTop: 3, fontFamily: fontDisplay },
          }, selectedEvent.name),
        ),
        h('button', {
          onClick: onChangeEvent,
          style: {
            background: 'rgba(255,255,255,0.06)', border: '1px solid ' + c.cardBorder,
            color: c.textSecondary, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: font, borderRadius: 8, padding: '6px 12px',
            transition: 'all 0.2s',
          },
        }, 'Change'),
      ) : null,

      h('input', { ref: fileInputRef, type: 'file', accept: 'image/*', capture: 'environment', onChange: handleFile, style: { display: 'none' } }),

      // Upload zone
      h('div', {
        onClick: () => fileInputRef.current && fileInputRef.current.click(),
        style: {
          border: '2px dashed rgba(251,191,36,0.2)', borderRadius: 20,
          padding: '52px 24px', textAlign: 'center', cursor: 'pointer',
          background: 'rgba(251,191,36,0.03)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          marginBottom: 20, animation: 'fadeInUp 0.5s ease both 0.15s',
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)';
          e.currentTarget.style.background = 'rgba(251,191,36,0.06)';
          e.currentTarget.style.transform = 'scale(1.01)';
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.borderColor = 'rgba(251,191,36,0.2)';
          e.currentTarget.style.background = 'rgba(251,191,36,0.03)';
          e.currentTarget.style.transform = 'scale(1)';
        },
      },
        // Camera icon with glow
        h('div', {
          style: {
            width: 64, height: 64, margin: '0 auto 20px', borderRadius: 18,
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'glowPulse 3s ease-in-out infinite',
          },
        },
          h('svg', { width: 30, height: 30, viewBox: '0 0 24 24', fill: 'none', stroke: c.primary, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' },
            h('rect', { x: 2, y: 3, width: 20, height: 18, rx: 2 }),
            h('circle', { cx: 12, cy: 13, r: 4 }),
            h('path', { d: 'M12 3v2' }),
          ),
        ),
        h('p', {
          style: { fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 8, fontFamily: fontDisplay },
        }, 'Take Photo or Upload Badge'),
        h('p', {
          style: { fontSize: 13, color: c.textMuted, margin: 0, lineHeight: 1.5 },
        }, 'Opens camera on mobile, or select a file on desktop'),
      ),

      // Manual entry link
      h('div', {
        style: { textAlign: 'center', marginBottom: 20, animation: 'fadeInUp 0.5s ease both 0.25s' },
      },
        h('button', {
          onClick: onManualEntry,
          style: {
            background: 'none', border: 'none', color: c.primary, fontSize: 13,
            fontWeight: 600, fontFamily: font, cursor: 'pointer', padding: '8px 0',
            borderBottom: '1px dashed rgba(251,191,36,0.3)', transition: 'all 0.2s',
          },
        }, 'Enter details manually instead'),
      ),

      // Scan history
      scanHistory && scanHistory.length > 0 ? h('div', {
        style: { animation: 'fadeInUp 0.5s ease both 0.3s' },
      },
        h('div', { style: { borderTop: '1px solid ' + c.cardBorder, paddingTop: 16, marginBottom: 8 } },
          h('div', {
            style: {
              fontSize: 10, fontWeight: 600, color: c.textMuted,
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10,
            },
          }, 'Recent Scans'),
        ),
        scanHistory.slice(0, 5).map((scan, i) =>
          h(ScanHistoryItem, { key: i, scan })
        ),
      ) : null,

      // Bottom actions
      h('div', { style: { borderTop: '1px solid ' + c.cardBorder, paddingTop: 16, display: 'flex', gap: 10 } },
        h(SecondaryBtn, { onClick: onSettings, style: { padding: '13px 14px' } },
          h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            h('circle', { cx: 12, cy: 12, r: 3 }),
            h('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' }),
          ),
        ),
        h(SecondaryBtn, { onClick: onLogout, style: { flex: 1 } }, 'Logout'),
      ),

      error ? h('div', { style: { marginTop: 12 } }, h(ErrorBanner, { error })) : null,
    ),
  );
}
