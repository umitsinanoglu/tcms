import React, { useState, useRef, useEffect } from 'react';
import { Project, UserRole } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ThemeSelector } from './ThemeSelector';
import { TTBLogo } from './TTBLogo';
import {
  PlusCircle,
  LayoutDashboard,
  Layers,
  Play,
  FileText,
  FolderKanban,
  ChevronDown,
  Check,
  Search,
  X,
  ExternalLink,
  BookOpen,
  Users,
  Shield,
  ShieldAlert,
  UserCheck,
  Eye,
  LogOut,
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
  onOpenUserManagement?: () => void;
}


export const Header: React.FC<HeaderProps> = ({
  projects = [],
  selectedProject,
  activeView = 'DASHBOARD',
  onTabChange,
  onSelectProject,
  onOpenNewProject,
  onOpenUserManagement,
}) => {
  const { currentUser, users, role, switchUser, switchRole, can, isAdmin, isViewer } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsUserDropdownOpen(false);
      }
    };

    if (isDropdownOpen || isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      if (isDropdownOpen) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen, isUserDropdownOpen]);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return {
          label: 'ADMIN',
          bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
      case 'TEST_LEAD':
        return {
          label: 'LEAD',
          bg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        };
      case 'TESTER':
        return {
          label: 'TESTER',
          bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'VIEWER':
        return {
          label: 'VIEWER',
          bg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
        };
      default:
        return {
          label: r,
          bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        };
    }
  };

  const currentBadge = getRoleBadge(role);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-40 sticky top-0 transition-colors duration-200 select-none">
      {/* Left: Brand Logo & Test Plan Navigation Combobox */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Official Türk Ticaret Bankası Logo & Brand */}
        <div
          onClick={() => onTabChange && onTabChange('DASHBOARD')}
          className="flex items-center shrink-0 cursor-pointer hover:opacity-90 transition-opacity group"
          title="Dashboard'a Git"
        >
          <TTBLogo variant="horizontal" height={34} showSubtitle={true} subtitleText="Test Yönetim Sistemi" />
        </div>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />

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
                <span className="truncate max-w-[110px] sm:max-w-[160px] md:max-w-[200px] font-semibold text-slate-800 dark:text-slate-100">
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

              {/* Dropdown Footer: New Plan Action (Visible only if user can create project) */}
              {can('CREATE_PROJECT') && (
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center: Main View Navigation Tabs (Dashboard, Explorer, Runs, Reports) */}
      {onTabChange && (
        <nav className="flex items-center bg-slate-100 dark:bg-slate-950/70 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-inner text-xs">
          <button
            type="button"
            onClick={() => onTabChange('DASHBOARD')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeView === 'DASHBOARD'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title={selectedProject ? `Dashboard: ${selectedProject.name}` : 'Test Planı Dashboard'}
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('EXPLORER')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeView === 'EXPLORER'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Test Case Explorer ve Ağaç Yapısı"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Explorer</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('RUNS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeView === 'RUNS'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Test Koşuları ve Yürütme"
          >
            <Play className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Test Koşuları</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('REPORTS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeView === 'REPORTS'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Raporlama ve Analitik Hub"
          >
            <FileText className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            <span className="hidden sm:inline">Raporlama</span>
          </button>
        </nav>
      )}

      {/* Right: RBAC User Profile, Theme Switcher, Swagger Docs & Action Button */}
      <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
        {/* Viewer Mode Alert Indicator */}
        {isViewer && (
          <div
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-[11px] font-medium"
            title="Gözlemci modundasınız. Veriler üzerinde değişiklik yapamazsınız."
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Salt Okunur</span>
          </div>
        )}

        {/* User Switcher / Profile Popover */}
        <div className="relative" ref={userDropdownRef}>
          <button
            type="button"
            onClick={() => setIsUserDropdownOpen((prev) => !prev)}
            className={`flex items-center space-x-2 p-1 sm:px-2.5 sm:py-1 rounded-xl border text-xs font-medium transition-all ${
              isUserDropdownOpen
                ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-600 ring-2 ring-rose-500/20 shadow-sm'
                : 'bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
            title="Kullanıcı / Rol Değiştir"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
            )}

            <div className="hidden lg:flex flex-col items-start text-left min-w-0 max-w-[120px]">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                {currentUser?.name || 'Kullanıcı'}
              </span>
            </div>

            {/* Role Badge */}
            <span
              className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${currentBadge.bg} shrink-0`}
            >
              {currentBadge.label}
            </span>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                isUserDropdownOpen ? 'rotate-180 text-rose-500' : ''
              }`}
            />
          </button>

          {/* User Popover Menu */}
          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
              {/* Current Profile Summary */}
              <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center space-x-3">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm shrink-0">
                    {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentUser?.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser?.email}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span
                      className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${currentBadge.bg}`}
                    >
                      {role}
                    </span>
                    {currentUser?.department && (
                      <span className="text-[9px] text-slate-400 truncate">
                        {currentUser.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Fast User Switch List (Phase 1 Testing Convenience) */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Hızlı Hesap & Rol Değiştir:
                </span>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {users.map((u) => {
                    const isSelected = currentUser?.id === u.id;
                    const badge = getRoleBadge(u.role);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          switchUser(u);
                          setIsUserDropdownOpen(false);
                        }}
                        className={`w-full text-left p-1.5 rounded-xl flex items-center justify-between text-xs transition-colors ${
                          isSelected
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {u.name.charAt(0)}
                            </div>
                          )}
                          <span className="truncate max-w-[130px] font-medium">{u.name}</span>
                        </div>
                        <span
                          className={`font-mono text-[8px] font-bold px-1.5 py-0.2 rounded border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin Actions: User Management */}
              {isAdmin && onOpenUserManagement && (
                <div className="p-1.5 bg-slate-50/50 dark:bg-slate-900/50">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      onOpenUserManagement();
                    }}
                    className="w-full flex items-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>Kullanıcı & Rol Yönetimi</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Swagger / OpenAPI Docs Link */}
        <a
          href={
            process.env.NEXT_PUBLIC_API_URL
              ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '/api/docs')
              : 'http://localhost:3001/api/docs'
          }
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100/90 dark:bg-slate-800/80 hover:bg-rose-50/80 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800/50 rounded-xl transition-all shadow-sm shrink-0"
          title="OpenAPI / Swagger API Dokümantasyonunu Aç (Yeni Sekme)"
        >
          <BookOpen className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="hidden md:inline font-semibold">Swagger Docs</span>
          <ExternalLink className="w-3 h-3 opacity-50 shrink-0 ml-0.5" />
        </a>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />

        {/* Theme Selector Component */}
        <ThemeSelector />

        {/* Primary Action Button: 'Yeni Test Planı' (Hidden for Viewer and Tester roles) */}
        {can('CREATE_PROJECT') && (
          <button
            onClick={onOpenNewProject}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 rounded-xl text-white transition-all shadow-md shadow-rose-600/20 active:scale-95 shrink-0 cursor-pointer"
            title="Yeni Test Planı / Proje Oluştur"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="sm:inline hidden">Yeni Test Planı</span>
          </button>
        )}
      </div>
    </header>
  );
};

