import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Project, TestCase, TestPlan, TestRun, Defect, SuiteTreeNode } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ThemeSelector } from './ThemeSelector';
import { TTBLogo } from './TTBLogo';
import {
  Eye,
  LogOut,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Search,
  X,
  Check,
  Pencil,
  Trash2,
  Plus,
  FileText,
  ClipboardList,
  PlayCircle,
  Bug,
  BookOpen,
  LayoutDashboard,
  ChevronsUpDown,
} from 'lucide-react';
import { SidebarTab } from './AppSidebar';

interface HeaderProps {
  projects?: Project[];
  selectedProject?: Project | null;
  testCases?: TestCase[];
  testPlans?: TestPlan[];
  testRuns?: TestRun[];
  defects?: Defect[];
  activeTab?: SidebarTab;
  selectedSuite?: SuiteTreeNode | null;
  selectedCase?: TestCase | null;
  selectedPlan?: TestPlan | null;
  selectedRun?: TestRun | null;
  onSelectProject?: (project: Project) => void;
  onOpenNewProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onNavigateHome?: () => void;
  onSelectCase?: (testCase: TestCase) => void;
  onSelectPlan?: (plan: TestPlan) => void;
  onSelectRun?: (run: TestRun) => void;
  onSelectDefect?: (defect: Defect) => void;
  onTabChange?: (tab: SidebarTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects = [],
  selectedProject = null,
  testCases = [],
  testPlans = [],
  testRuns = [],
  defects = [],
  activeTab = 'DASHBOARD',
  selectedSuite = null,
  selectedCase = null,
  selectedPlan = null,
  selectedRun = null,
  onSelectProject,
  onOpenNewProject,
  onEditProject,
  onDeleteProject,
  onNavigateHome,
  onSelectCase,
  onSelectPlan,
  onSelectRun,
  onSelectDefect,
  onTabChange,
}) => {
  const { currentUser, role, isViewer, can, logout } = useAuth();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  // Global Top Navigation Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const projectSearchInputRef = useRef<HTMLInputElement>(null);
  const globalSearchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Compute single-letter uppercase avatar initial (proper Turkish character support, e.g. Ümit -> Ü)
  const userInitial = currentUser?.name?.trim()
    ? currentUser.name.trim().charAt(0).toLocaleUpperCase('tr-TR')
    : 'U';

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return { label: 'ADMIN', bg: 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/30' };
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

    const matchedCases = (testCases || []).filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    ).slice(0, 5);

    const matchedPlans = (testPlans || []).filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.version?.toLowerCase().includes(q) ||
        (p.scope && p.scope.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedRuns = (testRuns || []).filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.version?.toLowerCase().includes(q) ||
        r.environment?.toLowerCase().includes(q) ||
        (r.executedBy && r.executedBy.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedDefects = (defects || []).filter(
      (d) =>
        d.key?.toLowerCase().includes(q) ||
        d.title?.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        (d.jiraBugKey && d.jiraBugKey.toLowerCase().includes(q)) ||
        (d.assignedTo && d.assignedTo.toLowerCase().includes(q)) ||
        (d.environment && d.environment.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedProj = (projects || []).filter(
      (p) => p.name?.toLowerCase().includes(q) || p.key?.toLowerCase().includes(q)
    ).slice(0, 3);

    return {
      cases: matchedCases,
      plans: matchedPlans,
      runs: matchedRuns,
      defects: matchedDefects,
      projects: matchedProj,
      total:
        matchedCases.length +
        matchedPlans.length +
        matchedRuns.length +
        matchedDefects.length +
        matchedProj.length,
    };
  }, [globalSearchQuery, testCases, testPlans, testRuns, defects, projects]);

  // Current active leaf item for breadcrumbs
  const getActiveLeaf = () => {
    if (activeTab === 'PLANS') {
      return selectedPlan ? selectedPlan.title : 'Test Planları';
    }
    if (activeTab === 'EXPLORER') {
      if (selectedCase) return `${selectedCase.code} - ${selectedCase.title}`;
      if (selectedSuite) return selectedSuite.name;
      return 'Test Senaryoları';
    }
    if (activeTab === 'RUNS') {
      return selectedRun ? selectedRun.title : 'Test Koşumları';
    }
    if (activeTab === 'DEFECTS') {
      return 'Defectler & Hatalar';
    }
    if (activeTab === 'REPORTS') {
      return 'Test Raporları';
    }
    return null;
  };

  const activeLeaf = getActiveLeaf();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between z-40 sticky top-0 transition-colors duration-200 select-none">
      {/* Left Area: Official Brand Logo aligned with Sidebar (240px) */}
      <div className="w-[240px] h-full px-3.5 border-r border-slate-200 dark:border-slate-800 flex items-center shrink-0">
        <div
          onClick={onNavigateHome}
          className="flex items-center shrink-0 cursor-pointer hover:opacity-95 transition-opacity"
          title="Ana Sayfa / Dashboard"
        >
          <TTBLogo variant="horizontal" height={38} showSubtitle={false} />
        </div>
      </div>

      {/* Main Bar: Breadcrumb Hierarchy & Global Controls */}
      <div className="flex-1 flex items-center justify-between px-4 sm:px-6 min-w-0 h-full">
        {/* Dynamic Breadcrumb Hierarchy (Screenshot Style) */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0 overflow-hidden truncate">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center space-x-1 text-slate-600 dark:text-slate-300 hover:text-[var(--accent-primary)] transition-colors font-medium cursor-pointer shrink-0"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />

          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[var(--accent-primary)] transition-colors font-medium cursor-pointer shrink-0"
          >
            Projeler
          </button>

          {selectedProject && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
              <span
                onClick={() => onTabChange?.('DASHBOARD')}
                className="font-semibold text-slate-700 dark:text-slate-200 hover:text-[var(--accent-primary)] transition-colors cursor-pointer truncate max-w-[140px] md:max-w-[200px]"
                title={selectedProject.name}
              >
                {selectedProject.name}
              </span>
            </>
          )}

          {activeLeaf && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px] md:max-w-[240px]">
                {activeLeaf}
              </span>
            </>
          )}
        </nav>

        {/* Right Area: Compact Search, Project Selector (En sağa yaslı), Docs, Theme, Single Letter Avatar */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
        {/* 1. Compact Global Search Bar */}
        <div className="relative" ref={searchContainerRef}>
          <div
            className={`flex items-center space-x-2 bg-slate-100/90 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-[#1d232f] border transition-all duration-150 rounded-xl px-2.5 py-1.5 w-40 sm:w-52 md:w-60 ${
              isSearchFocused
                ? 'bg-white dark:bg-[#1d232f] border-[var(--accent-primary)]/50 ring-2 ring-[var(--accent-primary)]/20 shadow-sm'
                : 'border-slate-200/80 dark:border-slate-700/70 hover:border-[var(--accent-primary)]/30'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={globalSearchInputRef}
              type="text"
              placeholder="Ara..."
              value={globalSearchQuery}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none min-w-0"
            />
            {globalSearchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setGlobalSearchQuery('');
                  globalSearchInputRef.current?.focus();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white dark:bg-slate-700/70 rounded border border-slate-200 dark:border-slate-600 shadow-2xs shrink-0">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Search Flyout */}
          {isSearchFocused && globalSearchQuery.trim().length > 0 && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-[440px] flex flex-col">
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Arama Sonuçları ({searchResults?.total || 0})</span>
                <span className="font-mono text-[10px] text-slate-400">ESC</span>
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
                      <FileText className="w-3 h-3 text-[var(--accent-primary)]" />
                      <span>Test Senaryoları ({searchResults.cases.length})</span>
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
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent-primary)] truncate">
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
                      <span>Test Planları ({searchResults.plans.length})</span>
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
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent-primary)] truncate">
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

                {/* Test Runs */}
                {searchResults && searchResults.runs.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                      <PlayCircle className="w-3 h-3 text-cyan-500" />
                      <span>Test Koşumları ({searchResults.runs.length})</span>
                    </div>
                    <div className="space-y-0.5">
                      {searchResults.runs.map((r) => {
                        const getRunBadgeStyle = (st: string) => {
                          switch (st) {
                            case 'COMPLETED':
                              return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                            case 'IN_PROGRESS':
                              return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
                            case 'FAILED':
                              return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                            default:
                              return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
                          }
                        };

                        return (
                          <div
                            key={r.id}
                            onClick={() => {
                              if (onSelectRun) onSelectRun(r);
                              setIsSearchFocused(false);
                              setGlobalSearchQuery('');
                            }}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors group"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent-primary)] truncate">
                                {r.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                                <span>{r.version}</span>
                                {r.environment && <span>• {r.environment}</span>}
                                {r.executedBy && <span>• {r.executedBy}</span>}
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${getRunBadgeStyle(r.status)}`}>
                              {r.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Defects */}
                {searchResults && searchResults.defects.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                      <Bug className="w-3 h-3 text-rose-500" />
                      <span>Defectler & Hatalar ({searchResults.defects.length})</span>
                    </div>
                    <div className="space-y-0.5">
                      {searchResults.defects.map((d) => {
                        const getSeverityBadgeStyle = (sev: string) => {
                          switch (sev) {
                            case 'BLOCKER':
                            case 'CRITICAL':
                              return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                            case 'MAJOR':
                              return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                            default:
                              return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
                          }
                        };

                        return (
                          <div
                            key={d.id}
                            onClick={() => {
                              if (onSelectDefect) onSelectDefect(d);
                              setIsSearchFocused(false);
                              setGlobalSearchQuery('');
                            }}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors group"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                                  {d.key}
                                </span>
                                {d.jiraBugKey && (
                                  <span className="font-mono text-[9px] font-semibold px-1 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                                    {d.jiraBugKey}
                                  </span>
                                )}
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent-primary)] truncate">
                                  {d.title}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                                {d.environment && <span>{d.environment}</span>}
                                {d.assignedTo && <span>• {d.assignedTo}</span>}
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${getSeverityBadgeStyle(d.severity)}`}>
                              {d.severity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {searchResults && searchResults.projects.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                      <FolderKanban className="w-3 h-3 text-[var(--accent-primary)]" />
                      <span>Projeler ({searchResults.projects.length})</span>
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
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                              [{p.key}]
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent-primary)] truncate">
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

        {/* 2. Compact Project Selector (Icon + Name Only, Kısaltma Yok, En Sağa Yaslı) */}
        {onSelectProject && (
          <div className="relative shrink-0" ref={projectDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsProjectDropdownOpen((prev) => !prev);
                if (!isProjectDropdownOpen) {
                  setTimeout(() => projectSearchInputRef.current?.focus(), 50);
                }
              }}
              className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border text-left transition-all duration-150 cursor-pointer max-w-[180px] sm:max-w-[220px] ${
                isProjectDropdownOpen
                  ? 'bg-slate-50 dark:bg-[#1d232f] border-[var(--accent-primary)]/50 ring-2 ring-[var(--accent-primary)]/20 shadow-sm'
                  : 'bg-slate-100/80 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-[#1d232f] border-slate-200/80 dark:border-slate-700/70 hover:border-[var(--accent-primary)]/30'
              }`}
              title={selectedProject ? `Aktif Proje: ${selectedProject.name}` : 'Proje Seçin'}
            >
              {/* Meaningful colored project icon badge */}
              <div className="w-5 h-5 rounded-md bg-[var(--accent-primary)] text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs">
                {selectedProject?.name?.charAt(0).toLocaleUpperCase('tr-TR') || 'P'}
              </div>

              {selectedProject ? (
                <span className="text-xs font-bold truncate text-slate-900 dark:text-slate-100 flex-1">
                  {selectedProject.name}
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium truncate flex-1">Proje Seçin</span>
              )}

              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Project Switcher Popover Menu */}
            {isProjectDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
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
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 pl-8 pr-7 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/50"
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
                              ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 pr-2 flex-1">
                            <div className="w-6 h-6 rounded-md bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold text-xs flex items-center justify-center shrink-0">
                              {p.name.charAt(0).toLocaleUpperCase('tr-TR')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent-primary)] transition-colors">
                                {p.name}
                              </p>
                              {p.description && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            {isSelected && <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />}
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
                      className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors cursor-pointer"
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

        {/* Viewer Alert */}
        {isViewer && (
          <div
            className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold"
            title="Gözlemci modundasınız. Veriler üzerinde değişiklik yapamazsınız."
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Salt Okunur</span>
          </div>
        )}

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />

        {/* 3. Theme Selector */}
        <ThemeSelector />

        {/* 4. Help / Docs Button */}
        <a
          href={
            process.env.NEXT_PUBLIC_API_URL
              ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '/api/docs')
              : 'http://localhost:3001/api/docs'
          }
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[var(--accent-primary)] bg-slate-100/90 dark:bg-slate-800/80 hover:bg-[var(--accent-primary)]/10 border border-slate-200 dark:border-slate-700 hover:border-[var(--accent-primary)]/30 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
          title="Yardım ve API Dokümantasyonu (Yeni Sekme)"
          aria-label="Yardım"
        >
          <BookOpen className="w-4 h-4 text-[var(--accent-primary)]" />
        </a>

        {/* 5. User Profile: ONLY Single Letter Circular Avatar */}
        <div className="relative" ref={userDropdownRef}>
          <button
            type="button"
            onClick={() => setIsUserDropdownOpen((prev) => !prev)}
            className={`w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs transition-all duration-200 cursor-pointer hover:brightness-110 hover:ring-2 hover:ring-[var(--accent-primary)]/40 ${
              isUserDropdownOpen ? 'ring-2 ring-[var(--accent-primary)] scale-105' : ''
            }`}
            style={{ background: 'var(--accent-gradient)' }}
            title={`Kullanıcı: ${currentUser?.name || 'Kullanıcı'} (${role})`}
            aria-label="Kullanıcı Menüsü"
          >
            {userInitial}
          </button>

          {/* User Popover Menu */}
          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
              {/* Profile Card Header */}
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: 'var(--accent-gradient)' }}
                >
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
    </div>
  </header>
);
};
