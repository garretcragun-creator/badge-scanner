import { c, fontMono, fontDisplay, wrapper, cardStyle } from '../styles.js';
import { LogoHeader } from '../components/Logo.js';
import { PrimaryBtn, SuccessBtn } from '../components/Buttons.js';

const { createElement: h } = React;

export function DoneScreen({ user, ocrData, result, selectedEvent, onScanNext }) {
  const name = [ocrData.firstname, ocrData.lastname].filter(Boolean).join(' ');

  // Build pre-filled meeting link
  let meetingUrl = '';
  if (result && result.meetingUrl) {
    const params = new URLSearchParams({
      firstName: ocrData.firstname || '',
      lastName: ocrData.lastname || '',
      email: ocrData.email || '',
      company: ocrData.company || '',
    });
    meetingUrl = result.meetingUrl + (result.meetingUrl.includes('?') ? '&' : '?') + params.toString();
  }

  return h('div', { style: wrapper },
    h('div', { style: Object.assign({}, cardStyle, { textAlign: 'center' }) },
      h(LogoHeader, { user }),

      // Success icon with animated entrance
      h('div', {
        style: {
          width: 72, height: 72, margin: '8px auto 24px', borderRadius: 99,
          background: 'rgba(52,211,153,0.1)',
          border: '1px solid rgba(52,211,153,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'successPop 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
          boxShadow: '0 0 40px rgba(52,211,153,0.1), 0 0 80px rgba(52,211,153,0.05)',
        },
      },
        h('svg', {
          width: 30, height: 30, viewBox: '0 0 24 24', fill: 'none',
          stroke: c.accent, strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round',
        },
          h('polyline', {
            points: '20 6 9 17 4 12',
            style: {
              strokeDasharray: 24, strokeDashoffset: 0,
              animation: 'checkDraw 0.5s ease both 0.3s',
            },
          }),
        ),
      ),

      h('h2', {
        style: {
          fontSize: 22, fontWeight: 800, marginBottom: 8, color: c.text,
          fontFamily: fontDisplay, animation: 'fadeInUp 0.4s ease both 0.2s',
        },
      }, 'Contact Created'),

      name ? h('p', {
        style: {
          color: c.textSecondary, fontSize: 15, marginBottom: 6,
          animation: 'fadeInUp 0.4s ease both 0.3s',
        },
      },
        h('span', { style: { fontWeight: 700, color: c.text } }, name),
        ocrData.company ? ' from ' + ocrData.company : '',
      ) : null,

      // Event registration confirmation
      selectedEvent ? h('p', {
        style: {
          color: c.textMuted, fontSize: 13, marginBottom: 8,
          animation: 'fadeInUp 0.4s ease both 0.35s',
        },
      },
        'Registered for ',
        h('span', { style: { fontWeight: 600, color: c.primary } }, selectedEvent.name),
      ) : null,

      // Contact ID chip
      result && result.contactId ? h('div', {
        style: {
          display: 'inline-block', marginBottom: 24,
          animation: 'fadeInUp 0.4s ease both 0.4s',
        },
      },
        h('span', {
          style: {
            color: c.textMuted, fontSize: 11, fontFamily: fontMono,
            background: 'rgba(255,255,255,0.04)', padding: '6px 16px',
            borderRadius: 99, border: '1px solid ' + c.cardBorder,
            letterSpacing: 0.5,
          },
        }, 'ID: ' + result.contactId),
      ) : null,

      // Warnings
      result && result.warnings ? h('div', {
        style: {
          color: c.warningText, fontSize: 12, marginBottom: 20, padding: '10px 14px',
          background: c.warningBg, borderRadius: 12,
          border: '1px solid ' + c.warningBorder, textAlign: 'left', lineHeight: 1.6,
          animation: 'fadeInUp 0.4s ease both 0.35s',
        },
      }, result.warnings.join('. ')) : null,

      // Action buttons
      h('div', {
        style: {
          display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16,
          animation: 'fadeInUp 0.4s ease both 0.45s',
        },
      },
        meetingUrl ? h(SuccessBtn, {
          onClick: () => window.open(meetingUrl, '_blank'),
          style: { width: '100%' },
        }, 'Book Meeting Now') : null,
        h(PrimaryBtn, { onClick: onScanNext, style: { width: '100%' } }, 'Scan Next Badge'),
      ),

      // Decorative bottom accent
      h('div', {
        style: {
          marginTop: 28, height: 2, borderRadius: 2,
          background: 'linear-gradient(90deg, transparent, ' + c.accentGlow + ', transparent)',
        },
      }),
    ),
  );
}
