// Design tokens — "Conference Premium" dark theme
// Deep charcoal base, warm amber accent, glass-morphism cards
export const c = {
  // Backgrounds
  bg: '#0C0E13',
  bgGrad: 'radial-gradient(ellipse at 20% 0%, rgba(251,191,36,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(251,191,36,0.04) 0%, transparent 50%), #0C0E13',
  surface: '#14161D',
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardHover: 'rgba(255,255,255,0.07)',

  // Primary — warm amber
  primary: '#FBBF24',
  primaryMuted: '#D97706',
  primaryGrad: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
  primaryGlow: 'rgba(251,191,36,0.2)',
  primarySoft: 'rgba(251,191,36,0.08)',
  primaryText: '#0C0E13', // text on primary bg

  // Success — emerald
  accent: '#34D399',
  accentGlow: 'rgba(52,211,153,0.15)',
  accentGrad: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',

  // Text
  white: '#FFFFFF',
  text: '#F1F2F4',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  // Danger
  danger: '#F87171',
  dangerBg: 'rgba(248,113,113,0.1)',

  // Warning
  warningText: '#FCD34D',
  warningBg: 'rgba(252,211,77,0.08)',
  warningBorder: 'rgba(252,211,77,0.15)',

  // Input
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.1)',
  inputFocus: 'rgba(251,191,36,0.3)',
};

export const font = "'Outfit', 'DM Sans', system-ui, sans-serif";
export const fontDisplay = "'Outfit', system-ui, sans-serif";
export const fontMono = "'IBM Plex Mono', 'JetBrains Mono', monospace";

export const wrapper = {
  minHeight: '100vh',
  background: c.bgGrad,
  fontFamily: font,
  color: c.text,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
  position: 'relative',
};

export const cardStyle = {
  background: c.card,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid ' + c.cardBorder,
  borderRadius: 24,
  padding: 32,
  width: '100%',
  maxWidth: 440,
  boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
  animation: 'cardEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
};
