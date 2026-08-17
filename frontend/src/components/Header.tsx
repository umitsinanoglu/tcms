'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  FolderKanban,
  Check,
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuiteClick = () => {
    if (!selectedProject && projects.length === 0) {
      onOpenNewProject();
    } else {
      onOpenNewSuite();
    }
  };

  const handleCaseClick = () => {
    if (!selectedProject && projects.length === 0) {
      onOpenNewProject();
    } else {
      onOpenNewCase();
    }
  };

  const handleRunClick = () => {
    if (!selectedProject && projects.length === 0) {
      onOpenNewProject();
    } else {
      onOpenManualRun();
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between z-40 sticky top-0 transition-colors duration-200 gap-2">
      {/* Left: Brand & Project Combobox & Navigation Tabs */}
      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        {/* Brand Logo */}
        <div
          onClick={() => onTabChange && onTabChange('DASHBOARD')}
          className="flex items-center space-x-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity group"
          title="Top Dashboard'a Git"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent leading-none">
              TCMS
            </h1>
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono">Test Management</span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />

        {/* Project Selection Combobox */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all shadow-sm max-w-[200px] sm:max-w-[260px]"
            title="Aktif Test Planı / Proje Seçin"
          >
            <FolderKanban className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">
              {selectedProject ? (
                <>
                  <span className="font-mono text-[10px] text-rose-600 dark:text-rose-400 mr-1">
                    [{selectedProject.key}]
                  </span>
                  {selectedProject.name}
                </>
              ) : projects.length === 0 ? (
                <span className="text-amber-500 font-normal">Proje Bulunamadı</span>
              ) : (
                <span className="text-slate-500">Proje Seçin...</span>
              )}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Combobox Dropdown Popover */}
          {isDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                <span>Test Planları ({projects.length})</span>
                {selectedProject && <span className="font-mono text-rose-500">Seçili</span>}
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {projects.length === 0 ? (
                  <div className="px-3 py-3 text-center text-slate-400 dark:text-slate-500">
                    <p className="mb-1">Veritabanında proje yok.</p>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenNewProject();
                      }}
                      className="text-rose-500 hover:underline font-semibold"
                    >
                      + İlk Projeyi Oluştur
                    </button>
                  </div>
                ) : (
                  projects.map((p) => {
                    const isSelected = selectedProject?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProject(p);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                          isSelected ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            {p.key}
                          </span>
                          <span className="truncate">{p.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-rose-500 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 px-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenNewProject();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Yeni Test Planı Oluştur</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Switcher Tabs (Dashboard, Explorer, Runs) */}
        {activeView !== undefined && onTabChange && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1 space-x-0.5 text-xs shrink-0">
            <button
              onClick={() => onTabChange('DASHBOARD')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-md font-medium transition-colors ${
                activeView === 'DASHBOARD'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Top Dashboard Gösterimi"
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Top Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange('EXPLORER')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-md font-medium transition-colors ${
                activeView === 'EXPLORER'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Explorer & Suite Ağacı Gösterimi"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Explorer</span>
            </button>

            <button
              onClick={() => onTabChange('RUNS')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-md font-medium transition-colors ${
                activeView === 'RUNS'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Test Koşum Geçmişi ve Sonuçları"
            >
              <GitBranch className="w-3.5 h-3.5 shrink-0" />
              <span>Test Koşumları</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Quick Action Buttons & Theme Switcher */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Quick Action: Yeni Suite */}
        <button
          onClick={handleSuiteClick}
          className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg transition-colors"
          title="Yeni Test Suite Ekle"
        >
          <FolderPlus className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>Yeni Suite</span>
        </button>

        {/* Quick Action: Yeni Case */}
        <button
          onClick={handleCaseClick}
          className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg transition-colors"
          title="Yeni Test Case Ekle"
        >
          <FilePlus className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>Yeni Case</span>
        </button>

        {/* Quick Action: Test Koşusu */}
        <button
          onClick={handleRunClick}
          className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition-colors"
          title="Test Koşumu Başlat (Manuel Run)"
        >
          <Play className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 shrink-0" />
          <span>Test Koşusu</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0 hidden sm:block" />

        {/* Theme Selector Component */}
        <ThemeSelector />

        <a
          href="http://localhost:3001/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden xl:flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 shrink-0"
          title="OpenAPI / Swagger Dokümantasyonunu Aç"
        >
          <span>API Docs</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>

        {/* Primary Action Button: 'Yeni Test Planı' */}
        <button
          onClick={onOpenNewProject}
          className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 rounded-lg text-white transition-all shadow-md shadow-rose-600/20 active:scale-95 shrink-0"
          title="Yeni Test Planı / Proje Oluştur"
        >
          <PlusCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Yeni Test Planı</span>
          <span className="sm:hidden">Yeni Plan</span>
        </button>
      </div>
    </header>
  );
};


