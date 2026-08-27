'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export interface TTBLogoProps {
  variant?: 'full' | 'horizontal' | 'emblem' | 'compact';
  height?: number;
  className?: string;
  showSubtitle?: boolean;
  subtitleText?: string;
  colorMode?: 'auto' | 'original' | 'coral' | 'white' | 'slate';
}

/**
 * TTBLogo - Official Türk Ticaret Bankası Brand Logo Component
 * Seamlessly adapts according to the active theme ('crimson-dark' | 'crimson-light').
 */
export const TTBLogo: React.FC<TTBLogoProps> = ({
  variant = 'horizontal',
  height = 44,
  className = '',
  showSubtitle = true,
  subtitleText = 'Test Yönetim Sistemi',
  colorMode = 'auto',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'crimson-dark';

  // Determine asset paths based on theme & colorMode
  const getEmblemSrc = () => {
    if (colorMode === 'original') return '/brand/ttb-emblem-red.png';
    if (colorMode === 'coral') return '/brand/ttb-emblem-coral.png';
    if (colorMode === 'white') return '/brand/ttb-emblem-white.png';
    if (colorMode === 'slate') return '/brand/ttb-emblem-slate.png';
    return '/brand/ttb-emblem-red.png';
  };

  const getTextSrc = () => {
    if (colorMode === 'original') return '/brand/ttb-text-red.png';
    if (colorMode === 'coral') return '/brand/ttb-text-coral.png';
    if (colorMode === 'white') return '/brand/ttb-text-white.png';
    if (colorMode === 'slate') return '/brand/ttb-text-slate.png';
    return isDark ? '/brand/ttb-text-white.png' : '/brand/ttb-text-red.png';
  };

  // Emblem Only Variant
  if (variant === 'emblem') {
    return (
      <div
        className={`inline-flex items-center justify-center relative select-none transition-transform duration-200 hover:scale-105 ${className}`}
        style={{ height: `${height}px`, width: `${Math.round(height * 1.3)}px` }}
      >
        <img
          src={getEmblemSrc()}
          alt="Türk Ticaret Bankası Amblem"
          className="h-full w-auto object-contain drop-shadow-sm filter transition-all duration-200"
          style={{ maxHeight: `${height}px` }}
        />
      </div>
    );
  }

  // Full Horizontal Brand Logo (Emblem + Typography + TCMS Subtitle)
  if (variant === 'horizontal' || variant === 'full') {
    return (
      <div className={`inline-flex items-center space-x-3 sm:space-x-3.5 select-none ${className}`}>
        {/* Emblem */}
        <div
          className="relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
          style={{ height: `${height}px`, width: `${Math.round(height * 1.25)}px` }}
        >
          <img
            src={getEmblemSrc()}
            alt="Türk Ticaret Bankası"
            className="h-full w-auto object-contain transition-all duration-200 drop-shadow-sm"
            style={{ maxHeight: `${height}px` }}
          />
        </div>

        {/* Separator / Typography & Subtitle */}
        <div className="flex flex-col justify-center shrink-0">
          <div
            className="relative"
            style={{ height: `${Math.round(height * 0.65)}px` }}
          >
            <img
              src={getTextSrc()}
              alt="Türk Ticaret Bankası"
              className="h-full w-auto object-contain transition-all duration-200"
              style={{ maxHeight: `${Math.round(height * 0.65)}px` }}
            />
          </div>

          {showSubtitle && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] rounded-md border border-[#b83a4b]/30 font-mono leading-none">
                TCMS
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline leading-none">
                {subtitleText}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compact Variant
  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      <div
        className="relative shrink-0 rounded-xl p-1.5 bg-[#b83a4b]/10 border border-[#b83a4b]/20 shadow-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
        style={{ height: `${height}px`, width: `${height}px` }}
      >
        <img
          src={getEmblemSrc()}
          alt="Türk Ticaret Bankası Logo"
          className="h-full w-auto object-contain transition-all duration-200 drop-shadow-sm"
          style={{ maxHeight: `${Math.round(height * 0.85)}px` }}
        />
      </div>

      <div className="flex flex-col justify-center">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-950 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent leading-none">
            TCMS
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/25 uppercase tracking-wide leading-none font-mono">
            TTB
          </span>
        </div>
        {showSubtitle && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-1 leading-none">
            Türk Ticaret Bankası
          </span>
        )}
      </div>
    </div>
  );
};
