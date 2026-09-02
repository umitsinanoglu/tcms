'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeId, ThemeMeta, THEME_METADATA, DesignTokens } from '../theme/tokens';
import { themePresets } from '../theme/themes';

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  tokens: DesignTokens;
  availableThemes: ThemeMeta[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>('crimson-dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('tcms_theme') as ThemeId | null;
    if (
      savedTheme === 'azure-blue' ||
      savedTheme === 'crimson-dark' ||
      savedTheme === 'crimson-light' ||
      savedTheme === 'corporate-light'
    ) {
      setThemeState(savedTheme);
    } else {
      setThemeState('azure-blue');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

    // Reset classes & attributes
    root.classList.remove(
      'dark',
      'theme-crimson',
      'theme-light',
      'theme-corporate-light',
      'theme-crimson-light',
      'theme-azure-blue'
    );
    root.removeAttribute('data-theme');

    root.setAttribute('data-theme', theme);

    if (theme === 'crimson-dark') {
      root.classList.add('dark', 'theme-crimson');
    } else if (theme === 'corporate-light') {
      root.classList.add('theme-light', 'theme-corporate-light');
    } else if (theme === 'azure-blue') {
      root.classList.add('theme-light', 'theme-azure-blue');
    } else {
      root.classList.add('theme-light', 'theme-crimson-light');
    }

    localStorage.setItem('tcms_theme', theme);
  }, [theme, mounted]);

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
  };

  const tokens = themePresets[theme] || themePresets['crimson-dark'];
  const availableThemes = Object.values(THEME_METADATA);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, tokens, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
