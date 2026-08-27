import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Project, TestCase, TestPlan } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ThemeSelector } from './ThemeSelector';
import { TTBLogo } from './TTBLogo';
import {
  Users,
  Eye,
  LogOut,
  ChevronDown,
  FolderKanban,
  Search,
  X,
  Check,
  Pencil,
  Trash2,
  Plus,
  HelpCircle,
  Bell,
  FileText,
  ClipboardList,
  BookOpen,
} from 'lucide-react';

interface HeaderProps {
  projects?: Project[];
  selectedProject?: Project | null;
  testCases?: TestCase[];
  testPlans?: TestPlan[];
  onSelectProject?: (project: Project) => void;
  onOpenNewProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onNavigateHome?: () => void;
  onOpenUserManagement?: () => void;
  onSelectCase?: (testCase: TestCase) => void;
  onSelectPlan?: (plan: TestPlan) => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects = [],
  selectedProject = null,
  testCases = [],
  testPlans = [],
  onSelectProject,
  onOpenNewProject,
  onEditProject,
  onDeleteProject,
  onNavigateHome,
  onOpenUserManagement,
  onSelectCase,
  onSelectPlan,
}) => {
  const { currentUser, role, isAdmin, isViewer, can, logout } = useAuth();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  // Global Top Navigation Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const projectSearchInputRef = useRef<HTMLInputElement>(null);
  const globalSearchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        globalSearchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      if (e.key === 'Escape') {
        setIsUserDropdownOpen(false);
        setIsProjectDropdownOpen(false);
        setIsSearchFocused(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const userInitial = currentUser?.name?.trim() ? currentUser.name.trim().charAt(0).toUpperCase() : 'U';

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return { label: 'ADMIN', bg: 'bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] border-[#b83a4b]/30' };
      case 'TEST_LEAD':
        return { label: 'LEAD', bg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' };
      case 'TESTER':
        return { label: 'TESTER', bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
      case 'VIEWER':
        return { label: 'VIEWER', bg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30' };
      default:
        return { label: r, bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
    }
  };

  const roleBadge = getRoleBadge(role);

  // Filter projects for selector
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  // Global search filtering results
  const searchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedCases = testCases.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    ).slice(0, 5);

    const matchedPlans = testPlans.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.version.toLowerCase().includes(q) ||
        (p.scope && p.scope.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedProj = projects.filter(
      (p) => p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)
    ).slice(0, 3);

    return {
      cases: matchedCases,
      plans: matchedPlans,
      projects: matchedProj,
      total: matchedCases.length + matchedPlans.length + matchedProj.length,
    };
  }, [globalSearchQuery, testCases, testPlans, projects]);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-40 sticky top-0 transition-colors duration-200 select-none">
      {/* Left Area: Official Brand Logo + Top Project Selector */}
      <div className="flex items-center space-x-4 sm:space-x-6 shrink-0 min-w-0">
        {/* Brand Logo */}
        <div
          onClick={onNavigateHome}
          className="flex items-center shrink-0 cursor-pointer hover:opacity-95 transition-opacity"
          title="Ana Sayfa / Dashboard"
        >
          <TTBLogo variant="horizontal" height={44} showSubtitle={true} subtitleText="Test Yönetim Sistemi" />
        </div>

        {/* Vertical Divider */}
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block shrink-0" />

        {/* Top Active Project Selector Combobox */}
        {onSelectProject && (
          <div className="relative hidden md:block" ref={projectDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsProjectDropdownOpen((prev) => !prev);
                if (!isProjectDropdownOpen) {
                  setTimeout(() => projectSearchInputRef.current?.focus(), 50);
                }
              }}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl border text-left transition-all duration-150 cursor-pointer max-w-[260px] lg:max-w-[320px] ${
                isProjectDropdownOpen
                  ? 'bg-slate-50 dark:bg-[#1d232f] border-[#b83a4b]/50 ring-2 ring-[#b83a4b]/20 shadow-sm'
                  : 'bg-slate-100/80 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-[#1d232f] border-slate-200/80 dark:border-slate-700/70 hover:border-[#b83a4b]/30'
              }`}
              title="Aktif Test Projesini Değiştir"
            >
              <FolderKanban className="w-4.5 h-4.5 text-[#b83a4b] shrink-0" />
              {selectedProject ? (
                <div className="flex items-center space-x-2 min-w-0 flex-1 truncate">
                  <span className="font-mono text-xs font-bold text-[#b83a4b] dark:text-[#d66b7a] bg-[#b83a4b]/10 px-1.5 py-0.5 rounded border border-[#b83a4b]/20 shrink-0">
                    [{selectedProject.key}]
                  </span>
                  <span className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">
                    {selectedProject.name}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium truncate">Proje Seçin...</span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isProjectDropdownOpen ? 'rotate-180 text-[#b83a4b]' : ''
                }`}
              />
            </button>

            {/* Project Switcher Popover Menu */}
            {isProjectDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
                {/* Search Box */}
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      ref={projectSearchInputRef}
                      type="text"
                      placeholder="Proje ara..."
                      value={projectSearchQuery}
                      onChange={(e) => setProjectSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 pl-8 pr-7 py-2 focus:outline-none focus:ring-1 focus:ring-[#b83a4b]/50"
                    />
                    {projectSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setProjectSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Projects List */}
                <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-4 px-3 text-slate-400 text-xs">
                      <FolderKanban className="w-6 h-6 mx-auto mb-1 opacity-30 text-slate-400" />
                      <p>Proje bulunamadı</p>
                    </div>
                  ) : (
                    filteredProjects.map((p) => {
                      const isSelected = selectedProject?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (onSelectProject) onSelectProject(p);
                            setIsProjectDropdownOpen(false);
                            setProjectSearchQuery('');
                          }}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all group ${
                            isSelected
                              ? 'bg-[#b83a4b]/10 dark:bg-[#b83a4b]/15 border border-[#b83a4b]/30 text-[#b83a4b] dark:text-[#d66b7a] font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 pr-2 flex-1">
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/20 shrink-0">
                              [{p.key}]
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-100 group-hover:text-[#b83a4b] transition-colors">
                                {p.name}
                              </p>
                              {p.description && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            {isSelected && <Check className="w-4 h-4 text-[#b83a4b] shrink-0" />}
                            {onEditProject && can('EDIT_PROJECT') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsProjectDropdownOpen(false);
                                  onEditProject(p);
                                }}
                                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Projeyi Düzenle"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteProject && can('DELETE_PROJECT') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsProjectDropdownOpen(false);
                                  if (confirm(`'${p.name}' adlı Test Projesini silmek istediğinize emin misiniz?`)) {
                                    onDeleteProject(p.id);
                                  }
                                }}
                                className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Projeyi Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* New Project Action */}
                {can('CREATE_PROJECT') && onOpenNewProject && (
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProjectDropdownOpen(false);
                        onOpenNewProject();
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-[#b83a4b] dark:text-[#d66b7a] hover:bg-[#b83a4b]/10 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Yeni Test Projesi Oluştur</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Area: Top Search Bar + Quick Actions */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5 shrink-0">
        {/* 1. Top Navigation Search Bar with ⌘K */}
        <div className="relative" ref={searchContainerRef}>
          <div
            className={`flex items-center space-x-2 bg-slate-100/90 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-[#1d232f] border transition-all duration-150 rounded-xl px-3 py-2 ${
              isSearchFocused
                ? 'bg-white dark:bg-[#1d232f] border-[#b83a4b]/50 ring-2 ring-[#b83a4b]/20 shadow-sm'
                : 'border-slate-200/80 dark:border-slate-700/70 hover:border-[#b83a4b]/30'
            }`}
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={globalSearchInputRef}
              type="text"
              placeholder="Senaryo, plan veya proje ara..."
              value={globalSearchQuery}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              className="w-28 sm:w-44 md:w-56 lg:w-64 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {globalSearchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setGlobalSearchQuery('');
                  globalSearchInputRef.current?.focus();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700/70 rounded border border-slate-200 dark:border-slate-600 shadow-2xs">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Global Search Results Flyout */}
          {isSearchFocused && globalSearchQuery.trim().length > 0 && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-[420px] flex flex-col">
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Arama Sonuçları ({searchResults?.total || 0})</span>
                <span className="font-mono text-[10px] text-slate-400">ESC ile kapat</span>
              </div>

              <div className="overflow-y-auto p-2 space-y-3 flex-1">
                {(!searchResults || searchResults.total === 0) && (
                  <div className="text-center py-6 px-3 text-slate-400 text-xs">
                    <Search className="w-6 h-6 mx-auto mb-1 opacity-30 text-slate-400" />
                    <p>&quot;{globalSearchQuery}&quot; ile eşleşen kayıt bulunamadı.</p>
                  </div>
                )}

                {/* Test Scenarios */}
                {searchResults && searchResults.cases.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-[#b83a4b]" />
                      <span>Test Senaryoları</span>
                    </div>
                    <div className="space-y-0.5">
                      {searchResults.cases.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            if (onSelectCase) onSelectCase(c);
                            setIsSearchFocused(false);
                            setGlobalSearchQuery('');
                          }}
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                                {c.code}
                              </span>
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#b83a4b] truncate">
                                {c.title}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {c.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Plans */}
                {searchResults && searchResults.plans.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                      <ClipboardList className="w-3 h-3 text-emerald-500" />
                      <span>Test Planları</span>
                    </div>
                    <div className="space-y-0.5">
                      {searchResults.plans.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (onSelectPlan) onSelectPlan(p);
                            setIsSearchFocused(false);
                            setGlobalSearchQuery('');
                          }}
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#b83a4b] truncate">
                              {p.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                              <span>{p.version}</span>
                              {p.environment && <span>• {p.environment}</span>}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {searchResults && searchResults.projects.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                      <FolderKanban className="w-3 h-3 text-[#b83a4b]" />
                      <span>Projeler</span>
                    </div>
                    <div className="space-y-0.5">
                      {searchResults.projects.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (onSelectProject) onSelectProject(p);
                            setIsSearchFocused(false);
                            setGlobalSearchQuery('');
                          }}
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/20">
                              [{p.key}]
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#b83a4b] truncate">
                              {p.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Help / Docs Button */}
        <a
          href={
            process.env.NEXT_PUBLIC_API_URL
              ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '/api/docs')
              : 'http://localhost:3001/api/docs'
          }
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#b83a4b] dark:hover:text-[#d66b7a] bg-slate-100/90 dark:bg-slate-800/80 hover:bg-[#b83a4b]/10 dark:hover:bg-[#b83a4b]/15 border border-slate-200 dark:border-slate-700 hover:border-[#b83a4b]/30 dark:hover:border-[#b83a4b]/40 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
          title="Yardım ve API Dokümantasyonu (Yeni Sekme)"
          aria-label="Yardım"
        >
          <BookOpen className="w-4.5 h-4.5 text-[#b83a4b]" />
        </a>

        {/* 3. Notification Bell with Badge */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#b83a4b] dark:hover:text-[#d66b7a] bg-slate-100/90 dark:bg-slate-800/80 hover:bg-[#b83a4b]/10 dark:hover:bg-[#b83a4b]/15 border border-slate-200 dark:border-slate-700 hover:border-[#b83a4b]/30 dark:hover:border-[#b83a4b]/40 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer relative"
            title="Bildirimler (3 Yeni)"
            aria-label="Bildirimler"
          >
            <Bell className="w-4.5 h-4.5 text-[#b83a4b]" />
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#b83a4b] text-white font-bold text-[9px] flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900">
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-76 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Bildirimler</span>
                <span className="text-[10px] font-bold text-[#b83a4b] font-mono">3 Okunmamış</span>
              </div>
              <div className="p-2 space-y-1.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Sprint 13 Regresyon Tamamlandı</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">210 testten %76 başarı oranı ile sonuçlandı.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Yeni Test Planı Eklendi</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ödeme Modülü Test Planı aktif edildi.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Jira Entegrasyonu Güncellendi</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Kayıtlı senaryolar senkronize edildi.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Viewer Mode Alert Indicator */}
        {isViewer && (
          <div
            className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold"
            title="Gözlemci modundasınız. Veriler üzerinde değişiklik yapamazsınız."
          >
            <Eye className="w-4 h-4" />
            <span>Salt Okunur</span>
          </div>
        )}

        {/* 5. Admin: User Management Icon Button */}
        {isAdmin && onOpenUserManagement && (
          <button
            type="button"
            onClick={onOpenUserManagement}
            className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#b83a4b] dark:hover:text-[#d66b7a] bg-slate-100/90 dark:bg-slate-800/80 hover:bg-[#b83a4b]/10 dark:hover:bg-[#b83a4b]/15 border border-slate-200 dark:border-slate-700 hover:border-[#b83a4b]/30 dark:hover:border-[#b83a4b]/40 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            title="Kullanıcı & Rol Yönetimi"
            aria-label="Kullanıcı Yönetimi"
          >
            <Users className="w-4.5 h-4.5 text-[#b83a4b]" />
          </button>
        )}

        {/* 6. Theme Selector Button */}
        <ThemeSelector />

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />

        {/* 7. User Profile Avatar & Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            type="button"
            onClick={() => setIsUserDropdownOpen((prev) => !prev)}
            className={`flex items-center space-x-2 p-1.5 pl-2 pr-3 rounded-full border transition-all duration-200 cursor-pointer ${
              isUserDropdownOpen
                ? 'bg-slate-100 dark:bg-[#1d232f] border-[#b83a4b]/50 ring-2 ring-[#b83a4b]/20 shadow-sm'
                : 'bg-slate-100/80 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-[#1d232f] border-slate-200/80 dark:border-slate-700/70 hover:border-[#b83a4b]/30'
            }`}
            title={`Kullanıcı: ${currentUser?.name || 'Kullanıcı'} (${role})`}
            aria-label="Kullanıcı Menüsü"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#821c2b] to-[#b83a4b] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {userInitial}
            </div>
            <div className="hidden sm:flex flex-col text-left min-w-0 max-w-[120px]">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {currentUser?.name || 'Ahmet Yılmaz'}
              </span>
              <span className="text-[10px] text-slate-400 truncate leading-tight font-medium">
                {role === 'ADMIN' ? 'Admin' : role === 'TEST_LEAD' ? 'Test Lead' : role === 'TESTER' ? 'Tester' : 'Viewer'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* User Popover Menu */}
          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
              {/* Profile Card Header */}
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#821c2b] to-[#b83a4b] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentUser?.name || 'Ahmet Yılmaz'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                    {currentUser?.email || 'ahmet.yilmaz@company.com'}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${roleBadge.bg}`}>
                      {roleBadge.label}
                    </span>
                    {currentUser?.department && (
                      <span className="text-[10px] text-slate-400 truncate">&bull; {currentUser.department}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout Action */}
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Oturumu Kapat</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
