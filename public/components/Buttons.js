import { c, font } from '../styles.js';

const { createElement: h } = React;

export function PrimaryBtn(props) {
  return h('button', {
    onClick: props.onClick,
    disabled: props.disabled,
    style: Object.assign({
      fontFamily: font, fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 14,
      padding: '15px 28px', cursor: props.disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'inline-flex', alignItems: 'center', gap: 8,
      justifyContent: 'center', opacity: props.disabled ? 0.35 : 1,
      background: c.primaryGrad, color: c.primaryText,
      boxShadow: props.disabled ? 'none' : '0 4px 20px ' + c.primaryGlow + ', 0 1px 3px rgba(0,0,0,0.2)',
      letterSpacing: 0.3,
    }, props.style || {}),
  }, props.children);
}

export function SecondaryBtn(props) {
  return h('button', {
    onClick: props.onClick,
    disabled: props.disabled,
    style: Object.assign({
      fontFamily: font, fontWeight: 600, fontSize: 14,
      background: 'rgba(255,255,255,0.06)', color: c.textSecondary,
      border: '1px solid ' + c.cardBorder, borderRadius: 12,
      padding: '13px 20px', cursor: 'pointer',
      transition: 'all 0.25s ease',
      display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
      opacity: props.disabled ? 0.4 : 1,
      backdropFilter: 'blur(8px)',
    }, props.style || {}),
  }, props.children);
}

export function SuccessBtn(props) {
  return h('button', {
    onClick: props.onClick,
    style: Object.assign({
      fontFamily: font, fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 14,
      padding: '15px 28px', cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
      background: c.accentGrad, color: '#042f2e',
      boxShadow: '0 4px 24px ' + c.accentGlow + ', 0 1px 3px rgba(0,0,0,0.2)',
      letterSpacing: 0.3,
    }, props.style || {}),
  }, props.children);
}
