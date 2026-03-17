import { c, font, fontMono } from '../styles.js';

const { createElement: h } = React;

export function Field(props) {
  return h('div', { style: { marginBottom: 16 } },
    h('label', {
      style: {
        display: 'block', fontSize: 10, fontWeight: 600, color: c.textMuted,
        textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 7, fontFamily: font,
      },
    }, props.label),
    h('input', {
      type: 'text',
      value: props.value,
      placeholder: props.placeholder,
      onChange: (e) => props.onChange(e.target.value),
      onFocus: (e) => {
        e.target.style.borderColor = c.primary;
        e.target.style.boxShadow = '0 0 0 3px ' + c.inputFocus;
        e.target.style.background = 'rgba(255,255,255,0.07)';
      },
      onBlur: (e) => {
        e.target.style.borderColor = c.inputBorder;
        e.target.style.boxShadow = 'none';
        e.target.style.background = c.inputBg;
      },
      style: {
        width: '100%', background: c.inputBg,
        border: '1px solid ' + c.inputBorder,
        borderRadius: 12, padding: '13px 16px', color: c.text, fontSize: 15,
        fontFamily: props.mono ? fontMono : font, outline: 'none', boxSizing: 'border-box',
        transition: 'all 0.25s ease',
      },
    })
  );
}
