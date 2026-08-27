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
      case 'crimson-light':
        return (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-200 group-hover:rotate-45" />
        );
      case 'crimson-dark':
      default:
        return (
          <Moon className="w-4 h-4 text-[#b83a4b] dark:text-[#d66b7a] transition-transform duration-200 group-hover:-rotate-12" />
        );
    }
  };

  const activeThemeMeta = availableThemes.find((t) => t.id === theme) || availableThemes[0];

  return (
    <div className="relative inline-block text-left z-[100]" ref={menuRef}>
      {/* Theme Trigger Button - Compact Icon View */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group w-8 sm:w-9 h-8 sm:h-9 flex items-center justify-center rounded-xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/40 cursor-pointer shrink-0"
        title={`Tema Seçici: ${activeThemeMeta.name}`}
        aria-label="Tema Seçici"
      >
        {getThemeIcon(theme)}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl drop-shadow-2xl backdrop-blur-xl p-2 animate-in fade-in zoom-in-95 duration-150 z-[100]">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-[#b83a4b]" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Tema Tercihi
              </span>
            </div>
            <span className="text-[10px] text-[#b83a4b] dark:text-[#d66b7a] font-mono font-semibold">Kurumsal Kırmızı</span>
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
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-[#b83a4b]/10 dark:bg-[#b83a4b]/15 border border-[#b83a4b]/30 text-slate-900 dark:text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getThemeIcon(t.id)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold">{t.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {t.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      {t.swatchColors.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#b83a4b] flex-shrink-0" />}
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
