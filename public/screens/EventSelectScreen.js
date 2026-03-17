import { c, font, fontDisplay, fontMono, wrapper, cardStyle } from '../styles.js';
import { LogoHeader } from '../components/Logo.js';
import { SecondaryBtn } from '../components/Buttons.js';
import { ErrorBanner } from '../components/ErrorBanner.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';

const { createElement: h } = React;

function EventCard({ event, onSelect, index }) {
  const startDate = event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const location = [event.venue, event.city, event.stateRegion].filter(Boolean).join(', ');

  return h('div', {
    onClick: () => onSelect(event),
    style: {
      padding: '18px 20px', borderRadius: 16,
      border: '1px solid ' + c.cardBorder,
      cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      background: 'rgba(255,255,255,0.02)',
      marginBottom: 10,
      animation: `fadeInUp 0.4s ease both ${0.1 + index * 0.05}s`,
    },
    onMouseEnter: (e) => {
      e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)';
      e.currentTarget.style.boxShadow = '0 0 0 1px rgba(251,191,36,0.1), 0 4px 20px rgba(0,0,0,0.2)';
      e.currentTarget.style.background = 'rgba(251,191,36,0.04)';
      e.currentTarget.style.transform = 'translateY(-1px)';
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.borderColor = c.cardBorder;
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
      e.currentTarget.style.transform = 'translateY(0)';
    },
  },
    h('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 } },
      h('div', { style: { flex: 1 } },
        h('div', { style: { fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 6, fontFamily: fontDisplay } }, event.name),
        h('div', { style: { display: 'flex', gap: 12, flexWrap: 'wrap' } },
          startDate ? h('span', { style: { fontSize: 12, color: c.textSecondary, display: 'flex', alignItems: 'center', gap: 4 } },
            h('span', { style: { opacity: 0.5 } }, '\u2022'),
            startDate,
          ) : null,
          location ? h('span', { style: { fontSize: 12, color: c.textMuted, display: 'flex', alignItems: 'center', gap: 4 } },
            h('span', { style: { opacity: 0.5 } }, '\u2022'),
            location,
          ) : null,
        ),
      ),
      event.type ? h('span', {
        style: {
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
          color: c.primary, background: c.primarySoft,
          border: '1px solid rgba(251,191,36,0.12)',
          padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0,
        },
      }, event.type) : null,
    ),
  );
}

export function EventSelectScreen({ user, events, loading, error, onSelect, onLogout }) {
  return h('div', { style: wrapper },
    h('div', { style: Object.assign({}, cardStyle, { maxWidth: 480 }) },
      h(LogoHeader, { user }),

      h('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } },
        h('div', {
          style: {
            width: 3, height: 22, borderRadius: 2,
            background: c.primaryGrad,
          },
        }),
        h('h3', {
          style: { fontSize: 16, fontWeight: 700, color: c.text, margin: 0, fontFamily: fontDisplay },
        }, 'Select Event'),
      ),
      h('p', {
        style: { fontSize: 13, color: c.textMuted, marginBottom: 24, lineHeight: 1.6, paddingLeft: 13 },
      }, 'Choose which event you\'re scanning badges for.'),

      h(ErrorBanner, { error }),

      loading
        ? h(LoadingSpinner, { message: 'Loading events...' })
        : events.length === 0
          ? h('div', {
              style: {
                textAlign: 'center', padding: '32px 16px', color: c.textMuted, fontSize: 14,
                lineHeight: 1.7, background: 'rgba(255,255,255,0.02)', borderRadius: 16,
                border: '1px dashed ' + c.cardBorder,
              },
            },
              'No events configured for badge scanning.',
              h('br'),
              h('span', { style: { fontSize: 12, color: c.textMuted, opacity: 0.7 } },
                'Enable "Available in Lead Capture App" on the event in HubSpot.'),
            )
          : h('div', {
              style: { maxHeight: 380, overflowY: 'auto', marginBottom: 16, paddingRight: 4 },
            },
              events.map((event, i) => h(EventCard, { key: event.id, event, onSelect, index: i }))
            ),

      h('div', {
        style: { borderTop: '1px solid ' + c.cardBorder, paddingTop: 16, marginTop: 8 },
      },
        h(SecondaryBtn, { onClick: onLogout, style: { width: '100%' } }, 'Logout'),
      ),
    ),
  );
}
