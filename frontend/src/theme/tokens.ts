export type ThemeId = 'crimson-dark' | 'crimson-light';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  swatchColors: [string, string, string]; // Preview swatch colors for selector
}

export interface DesignTokens {
  colors: {
    background: string;
    surface: string;
    surfaceSecondary: string;
    border: string;
    textMain: string;
    textMuted: string;
    accentPrimary: string;
    accentGradient: string;
    accentHover: string;
    glassPanelBg: string;
    glassPanelBorder: string;
    scrollbarTrack: string;
    scrollbarThumb: string;
  };
  radii: {
    card: string;
    button: string;
    pill: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    accentGlow: string;
  };
}

export const THEME_METADATA: Record<ThemeId, ThemeMeta> = {
  'crimson-dark': {
    id: 'crimson-dark',
    name: 'Crimson Coral (Koyu)',
    description: 'Derin arduvaz fon ve canlı mercan-kırmızı gradyanlı koyu arayüz',
    swatchColors: ['#191e28', '#ff4b6e', '#222938'],
  },
  'crimson-light': {
    id: 'crimson-light',
    name: 'Crimson Coral (Açık)',
    description: 'Açık pastel fon ve canlı mercan-kırmızı vurgulu açık arayüz',
    swatchColors: ['#f0f3f8', '#ff4b6e', '#ffffff'],
  },
};
