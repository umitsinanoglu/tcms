'use client';

import React from 'react';
import { Project } from '@/services/api';
import { ThemeSelector } from './ThemeSelector';
import {
  FolderPlus,
  FilePlus,
  Play,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  ChevronDown,
  BarChart3,
  Layers,
  GitBranch,
} from 'lucide-react';

interface HeaderProps {
  projects: Project[];
  selectedProject: Project | null;
  activeView?: 'EXPLORER' | 'DASHBOARD' | 'RUNS';
  onTabChange?: (tab: 'EXPLORER' | 'DASHBOARD' | 'RUNS') => void;
  onSelectProject: (project: Project) => void;
  onOpenNewProject: () => void;
  onOpenNewSuite: () => void;
  onOpenNewCase: () => void;
  onOpenManualRun: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  selectedProject,
  activeView,
  onTabChange,
  onSelectProject,
  onOpenNewProject,
  onOpenNewSuite,
  onOpenNewCase,
  onOpenManualRun,
}) => {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-40 sticky top-0 transition-colors duration-200 gap-2">
      {/* Brand & Navigation */}
      <div className="flex items-center space-x-3 sm:space-x-5 shrink-0">
        <div
          onClick={() => onTabChange && onTabChange('DASHBOARD')}
          className="flex items-center space-x-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity group"
          title="Top Dashboard'a Git"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent leading-none">
              TCMS
            </h1>
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">Test Management</span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />

        {/* View Switcher Tabs (Dashboard & Test Koşumları) */}
        {activeView !== undefined && onTabChange && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1 space-x-1 text-xs shrink-0">
            <button
              onClick={() => onTabChange('DASHBOARD')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-md font-medium transition-colors ${
                activeView === 'DASHBOARD'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Top Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange('RUNS')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-md font-medium transition-colors ${
                activeView === 'RUNS'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 shrink-0" />
              <span>Test Koşumları</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons & Theme Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Theme Selector Component */}
        <ThemeSelector />

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

        <a
          href="http://localhost:3001/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 shrink-0"
          title="OpenAPI / Swagger Dokümantasyonunu Aç"
        >
          <span>API Docs</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>

        {/* Far Right: 'Yeni Test Planı' Button */}
        <button
          onClick={onOpenNewProject}
          className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 rounded-lg text-white transition-all shadow-md shadow-rose-600/20 active:scale-95 shrink-0"
          title="Yeni Test Planı Oluştur"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>Yeni Test Planı</span>
        </button>
      </div>
    </header>
  );
};

