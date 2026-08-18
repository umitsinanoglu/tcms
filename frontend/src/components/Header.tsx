'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Project } from '@/services/api';
import { ThemeSelector } from './ThemeSelector';
import {
  PlusCircle,
  CheckCircle2,
  BarChart3,
  Layers,
  Play,
  FolderKanban,
  ChevronDown,
  Check,
  Search,
  X,
} from 'lucide-react';

interface HeaderProps {
  projects?: Project[];
  selectedProject?: Project | null;
  activeView?: 'EXPLORER' | 'DASHBOARD' | 'RUNS';
  onTabChange?: (tab: 'EXPLORER' | 'DASHBOARD' | 'RUNS') => void;
  onSelectProject?: (project: Project) => void;
  onOpenNewProject: () => void;
  onOpenNewSuite?: () => void;
  onOpenNewCase?: () => void;
  onOpenManualRun?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects = [],
  selectedProject,
  activeView = 'DASHBOARD',
  onTabChange,
  onSelectProject,
  onOpenNewProject,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-40 sticky top-0 transition-colors duration-200 select-none">
      {/* Left: Brand Logo & Test Plan Navigation Combobox */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Brand Logo */}
        <div
          onClick={() => onTabChange && onTabChange('DASHBOARD')}
          className="flex items-center space-x-2.5 shrink-0 cursor-pointer hover:opacity-90 transition-opacity group"
          title="Top Dashboard'a Git"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent leading-none">
              TCMS
            </h1>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">Test Management</span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />

        {/* Test Plan Navigation Combobox */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer select-none ${
              isDropdownOpen
                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500/50 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 shadow-sm'
                : 'bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
            title="Test Planı Seç / Değiştir"
          >
            <FolderKanban className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            {selectedProject ? (
              <div className="flex items-center space-x-1.5 min-w-0">
                <span className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 shrink-0">
                  [{selectedProject.key}]
                </span>
                <span className="truncate max-w-[120px] sm:max-w-[180px] md:max-w-[220px] font-semibold text-slate-800 dark:text-slate-100">
                  {selectedProject.name}
                </span>
              </div>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 font-medium">Test Planı Seçin...</span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                isDropdownOpen ? 'rotate-180 text-rose-500' : ''
              }`}
            />
          </button>

          {/* Combobox Dropdown Popover */}
          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 sm:w-84 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
              {/* Header / Search Input */}
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Test planı ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 pl-8 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Projects List */}
              <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-6 px-3 text-slate-400 dark:text-slate-500 text-xs">
                    <FolderKanban className="w-6 h-6 mx-auto mb-1.5 opacity-30 text-slate-400" />
                    <p>Test planı bulunamadı</p>
                  </div>
                ) : (
                  filteredProjects.map((p) => {
                    const isSelected = selectedProject?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectProject?.(p);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-all group ${
                          isSelected
                            ? 'bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0">
                            [{p.key}]
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs truncate font-medium text-slate-800 dark:text-slate-200 group-hover:text-rose-500 transition-colors">
                              {p.name}
                            </p>
                            {p.description && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected && <Check className="w-3.5 h-3.5 text-rose-500 shrink-0 ml-1" />}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer: New Plan Action */}
              <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenNewProject();
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Yeni Test Planı Oluştur</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Main View Navigation Tabs (Dashboard, Explorer, Runs) */}
      <nav className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => onTabChange && onTabChange('DASHBOARD')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all duration-150 ${
            activeView === 'DASHBOARD'
              ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Top Dashboard ve Metrikler"
        >
          <BarChart3 className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:inline hidden">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('EXPLORER')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all duration-150 ${
            activeView === 'EXPLORER'
              ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Test Case Explorer ve Ağaç Yapısı"
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:inline hidden">Explorer</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('RUNS')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all duration-150 ${
            activeView === 'RUNS'
              ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Test Koşuları ve Raporlama"
        >
          <Play className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:inline hidden">Test Koşuları</span>
        </button>
      </nav>

      {/* Right: Theme Switcher & Primary Action Button */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />

        {/* Theme Selector Component */}
        <ThemeSelector />

        {/* Primary Action Button: 'Yeni Test Planı' */}
        <button
          onClick={onOpenNewProject}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 rounded-lg text-white transition-all shadow-md shadow-rose-600/20 active:scale-95 shrink-0 cursor-pointer"
          title="Yeni Test Planı / Proje Oluştur"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span className="sm:inline hidden">Yeni Test Planı</span>
        </button>
      </div>
    </header>
  );
};
