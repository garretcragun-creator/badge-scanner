import { c, font, fontMono } from '../styles.js';

const { createElement: h, useState } = React;

export function Field(props) {
  const [focused, setFocused] = useState(false);

  const baseStyle = {
    width: '100%',
    background: focused ? 'rgba(255,255,255,0.07)' : c.inputBg,
    border: '1px solid ' + (focused ? c.primary : c.inputBorder),
    borderRadius: 12,
    padding: '13px 16px',
    color: c.text,
    fontSize: 15,
    fontFamily: props.mono ? fontMono : font,
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 3px ' + c.inputFocus : 'none',
    transition: 'all 0.25s ease',
  };

  // Select dropdown
  if (props.options) {
    return h('div', { style: { marginBottom: 16 } },
      h('label', {
        style: {
          display: 'block', fontSize: 10, fontWeight: 600, color: c.textMuted,
          textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 7, fontFamily: font,
        },
      }, props.label),
      h('select', {
        value: props.value,
        onChange: (e) => props.onChange(e.target.value),
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
        style: Object.assign({}, baseStyle, {
          appearance: 'none',
          WebkitAppearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239CA3AF' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: 36,
          cursor: 'pointer',
        }),
      },
        h('option', { value: '' }, props.placeholder || 'Select...'),
        ...props.options.map(opt =>
          h('option', { key: opt.value, value: opt.value }, opt.label)
        ),
      ),
    );
  }

  // Text input
  return h('div', { style: { marginBottom: 16 } },
    h('label', {
      style: {
        display: 'block', fontSize: 10, fontWeight: 600, color: c.textMuted,
        textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 7, fontFamily: font,
      },
    }, props.label),
    h('input', {
      type: props.type || 'text',
      value: props.value,
      placeholder: props.placeholder,
      onChange: (e) => props.onChange(e.target.value),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      style: baseStyle,
    }),
  );
}
