export const tokens = {
  surface: {
    base: 'rgba(255, 255, 255, 0.035)',
    elevated: 'rgba(255, 255, 255, 0.055)',
    subtle: 'rgba(255, 255, 255, 0.02)',
    input: 'rgba(0, 0, 0, 0.3)',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    default: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.18)',
    accent: 'rgba(52, 211, 153, 0.3)',
  },
  shadow: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    md: '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)',
    lg: '0 8px 40px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
    glow: {
      green: '0 0 30px rgba(52, 211, 153, 0.08)',
      cyan: '0 0 30px rgba(34, 211, 238, 0.08)',
      purple: '0 0 30px rgba(167, 139, 250, 0.08)',
      amber: '0 0 30px rgba(251, 191, 36, 0.08)',
    },
  },
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  blur: {
    sm: 'blur(8px)',
    md: 'blur(16px)',
    lg: 'blur(24px)',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
} as const;
