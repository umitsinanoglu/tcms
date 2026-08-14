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
  activeView?: 'EXPLORER' | 'DASHBOARD' | 'TRACEABILITY';
  onTabChange?: (tab: 'EXPLORER' | 'DASHBOARD' | 'TRACEABILITY') => void;
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
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-30 sticky top-0 transition-colors duration-200">
      {/* Brand & Project Dropdown */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent leading-none">
              TCMS
            </h1>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Test Case Management</span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800" />

        {/* Project Selector */}
        <div className="flex items-center space-x-2">
          <div className="relative group">
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const proj = projects.find((p) => p.id === e.target.value);
                if (proj) onSelectProject(proj);
              }}
              className="appearance-none bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-lg px-3.5 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer min-w-[180px]"
            >
              {projects.length === 0 ? (
                <option value="">Proje Bulunamadı</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key}] {p.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={onOpenNewProject}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Yeni Proje Ekle"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        {activeView !== undefined && onTabChange && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1 space-x-1 text-xs">
            <button
              onClick={() => onTabChange('EXPLORER')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                activeView === 'EXPLORER'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Explorer</span>
            </button>

            <button
              onClick={() => onTabChange('DASHBOARD')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                activeView === 'DASHBOARD'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange('TRACEABILITY')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                activeView === 'TRACEABILITY'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Traceability</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons & Theme Switcher */}
      <div className="flex items-center space-x-3">
        {/* Theme Selector Component */}
        <ThemeSelector />

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5" />

        <button
          onClick={onOpenNewSuite}
          disabled={!selectedProject}
          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
        >
          <FolderPlus className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Yeni Suite</span>
        </button>

        <button
          onClick={onOpenNewCase}
          disabled={!selectedProject}
          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
        >
          <FilePlus className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span>Yeni Case</span>
        </button>

        <button
          onClick={onOpenManualRun}
          disabled={!selectedProject}
          className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all shadow-md shadow-emerald-600/20 active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run Manual Test</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        <a
          href="http://localhost:3001/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50"
          title="OpenAPI / Swagger Dokümantasyonunu Aç"
        >
          <span>Swagger Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
};

