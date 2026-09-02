export type ThemeId = 'crimson-dark' | 'crimson-light' | 'corporate-light' | 'azure-blue';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  swatchColors: [string, string, string]; // Preview swatch colors for selector
}

export interface StatusToken {
  bg: string;
  text: string;
  border: string;
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
    accentDark: string;
    accentGradient: string;
    accentHover: string;
    glassPanelBg: string;
    glassPanelBorder: string;
    scrollbarTrack: string;
    scrollbarThumb: string;
  };
  status: {
    passed: StatusToken;
    failed: StatusToken;
    blocked: StatusToken;
    inProgress: StatusToken;
    draft: StatusToken;
  };
  radii: {
    sm: string;
    card: string;
    button: string;
    container: string;
    pill: string;
  };
  shadows: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    accentGlow: string;
  };
}

export const THEME_METADATA: Record<ThemeId, ThemeMeta> = {
  'azure-blue': {
    id: 'azure-blue',
    name: 'Azure Mavisi (Jira Teması)',
    description: 'Jira tarzı sade beyaz zemin üzerine canlı Azure mavisi ve dengeli kontrast',
    swatchColors: ['#f4f5f7', '#0c66e4', '#ffffff'],
  },
  'crimson-dark': {
    id: 'crimson-dark',
    name: 'Kurumsal Grafit (Koyu)',
    description: 'Derin arduvaz zemin ve mat kurumsal kırmızı vurgulu koyu tema',
    swatchColors: ['#141821', '#b83a4b', '#1d232f'],
  },
  'crimson-light': {
    id: 'crimson-light',
    name: 'Kurumsal Kırmızı (Açık)',
    description: 'Açık kurumsal zemin ve mat kurumsal kırmızı vurgulu aydınlık tema',
    swatchColors: ['#f2f5f8', '#b83a4b', '#ffffff'],
  },
  'corporate-light': {
    id: 'corporate-light',
    name: 'Kurumsal Platin & Gri (Açık)',
    description: 'Göz yormayan gri-platin zemin, siyah tipografi ve sade kırmızı detaylar',
    swatchColors: ['#eef2f6', '#991b1b', '#ffffff'],
  },
};

