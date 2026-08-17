'use client';

import React from 'react';
import { Project } from '@/services/api';
import { ThemeSelector } from './ThemeSelector';
import {
  PlusCircle,
  CheckCircle2,
  LayoutDashboard,
  Play,
  FileText,
} from 'lucide-react';

interface HeaderProps {
  projects?: Project[];
  selectedProject?: Project | null;
  activeView?: 'EXPLORER' | 'DASHBOARD' | 'RUNS' | 'REPORTS';
  onTabChange?: (tab: 'EXPLORER' | 'DASHBOARD' | 'RUNS' | 'REPORTS') => void;
  onSelectProject?: (project: Project) => void;
  onOpenNewProject: () => void;
  onOpenNewSuite?: () => void;
  onOpenNewCase?: () => void;
  onOpenManualRun?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView = 'DASHBOARD',
  onTabChange,
  onOpenNewProject,
}) => {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-40 sticky top-0 transition-colors duration-200">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center space-x-3 shrink-0">
        <div
          onClick={() => onTabChange && onTabChange('DASHBOARD')}
          className="flex items-center space-x-2.5 shrink-0 cursor-pointer hover:opacity-90 transition-opacity group"
          title="Top Dashboard'a Git"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent leading-none">
              TCMS
            </h1>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">Test Management</span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0 ml-1 hidden sm:block" />
      </div>

      {/* Middle: Navigation Tabs Switcher */}
      {onTabChange && (
        <nav className="flex items-center bg-slate-100 dark:bg-slate-950/70 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-inner">
          <button
            onClick={() => onTabChange('DASHBOARD')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'DASHBOARD'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Dashboard & Test Planı Özeti"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dashboard</span>
          </button>

          <button
            onClick={() => onTabChange('RUNS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'RUNS'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Test Koşumları ve Geçmiş"
          >
            <Play className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Koşumlar</span>
          </button>

          <button
            onClick={() => onTabChange('REPORTS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'REPORTS'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Raporlama ve Analitik Hub"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden md:inline">Raporlama</span>
          </button>
        </nav>
      )}

      {/* Right: Theme Switcher & Primary Action Button */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />

        {/* Theme Selector Component */}
        <ThemeSelector />

        {/* Primary Action Button: 'Yeni Test Planı' */}
        <button
          onClick={onOpenNewProject}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 rounded-lg text-white transition-all shadow-md shadow-rose-600/20 active:scale-95 shrink-0"
          title="Yeni Test Planı / Proje Oluştur"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>Yeni Test Planı</span>
        </button>
      </div>
    </header>
  );
};



