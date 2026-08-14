'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Palette, Check, Sparkles, Sun, Moon } from 'lucide-react';
import { ThemeId } from '@/theme/tokens';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeIcon = (id: ThemeId) => {
    switch (id) {
      case 'light':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'dark':
        return <Moon className="w-4 h-4 text-blue-400" />;
      case 'crimson':
        return <Sparkles className="w-4 h-4 text-rose-400" />;
      default:
        return <Palette className="w-4 h-4 text-indigo-400" />;
    }
  };

  const activeThemeMeta = availableThemes.find((t) => t.id === theme) || availableThemes[0];

  return (
    <div className="relative inline-block text-left z-50" ref={menuRef}>
      {/* Theme Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
        title="Tema Seçici"
      >
        <div className="flex items-center space-x-1.5">
          {getThemeIcon(theme)}
          <span className="text-xs font-semibold">{activeThemeMeta.name}</span>
        </div>
        <div className="flex items-center space-x-0.5 ml-1">
          {activeThemeMeta.swatchColors.map((color, idx) => (
            <span
              key={idx}
              className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl p-2 animate-in fade-in zoom-in-95 duration-150 z-50">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Tema Seçimi
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Design System v2</span>
          </div>

          <div className="mt-1 space-y-1">
            {availableThemes.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 text-slate-900 dark:text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getThemeIcon(t.id)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold">{t.name}</span>
                        {t.id === 'crimson' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-md">
                            Yeni
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {t.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      {t.swatchColors.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
