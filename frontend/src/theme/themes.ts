import { DesignTokens, ThemeId } from './tokens';

export const themePresets: Record<ThemeId, DesignTokens> = {
  'crimson-dark': {
    colors: {
      background: '#191e28',
      surface: '#222938',
      surfaceSecondary: '#2b3447',
      border: '#333f54',
      textMain: '#f8fafc',
      textMuted: '#94a3b8',
      accentPrimary: '#ff4b6e',
      accentGradient: 'linear-gradient(135deg, #ff4b6e 0%, #d82b4b 100%)',
      accentHover: '#ff6b87',
      glassPanelBg: 'rgba(34, 41, 56, 0.85)',
      glassPanelBorder: 'rgba(255, 75, 110, 0.18)',
      scrollbarTrack: '#141822',
      scrollbarThumb: '#2d374a',
    },
    radii: {
      card: '14px',
      button: '10px',
      pill: '9999px',
    },
    shadows: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.4)',
      md: '0 4px 12px rgba(0, 0, 0, 0.35)',
      lg: '0 12px 24px rgba(0, 0, 0, 0.45)',
      accentGlow: '0 0 25px rgba(255, 75, 110, 0.45)',
    },
  },
  'crimson-light': {
    colors: {
      background: '#f0f3f8',
      surface: '#ffffff',
      surfaceSecondary: '#e8ecf3',
      border: '#d5ddea',
      textMain: '#191e28',
      textMuted: '#64748b',
      accentPrimary: '#ff4b6e',
      accentGradient: 'linear-gradient(135deg, #ff4b6e 0%, #d82b4b 100%)',
      accentHover: '#e6385b',
      glassPanelBg: 'rgba(255, 255, 255, 0.9)',
      glassPanelBorder: 'rgba(255, 75, 110, 0.2)',
      scrollbarTrack: '#e8ecf3',
      scrollbarThumb: '#cbd5e1',
    },
    radii: {
      card: '14px',
      button: '10px',
      pill: '9999px',
    },
    shadows: {
      sm: '0 1px 2px rgba(255, 75, 110, 0.05)',
      md: '0 4px 12px rgba(25, 30, 40, 0.08)',
      lg: '0 12px 24px rgba(25, 30, 40, 0.12)',
      accentGlow: '0 0 20px rgba(255, 75, 110, 0.35)',
    },
  },
};
