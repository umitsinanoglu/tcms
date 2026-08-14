export type ThemeId = 'light' | 'dark' | 'crimson';

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
  light: {
    id: 'light',
    name: 'Açık Tema',
    description: 'Ferah ve temiz standart açık arayüz',
    swatchColors: ['#ffffff', '#3b82f6', '#f8fafc'],
  },
  dark: {
    id: 'dark',
    name: 'Koyu Tema',
    description: 'Göz yormayan koyu gri / lacivert arayüz',
    swatchColors: ['#111827', '#3b82f6', '#090d16'],
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Coral',
    description: 'Derin arduvaz fon ve canlı mercan-kırmızı gradyanlar',
    swatchColors: ['#1e2430', '#ff4b6e', '#28303d'],
  },
};
