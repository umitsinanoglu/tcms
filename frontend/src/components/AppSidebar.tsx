import React, { useState, useEffect } from 'react';
import { Project } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Activity,
  BarChart3,
  Bug,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from 'lucide-react';

export type SidebarTab = 'DASHBOARD' | 'PLANS' | 'EXPLORER' | 'RUNS' | 'DEFECTS' | 'REPORTS' | 'SETTINGS';

interface AppSidebarProps {
  projects?: Project[];
  selectedProject?: Project | null;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  testCasesCount?: number;
  testPlansCount?: number;
  testRunsCount?: number;
  defectsCount?: number;
  onOpenUserManagement?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  selectedProject,
  activeTab,
  onTabChange,
  testCasesCount = 0,
  testPlansCount = 0,
  testRunsCount = 0,
  defectsCount = 0,
  onOpenUserManagement,
}) => {
  const { isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tcms_sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('tcms_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Main Navigation Items Config
  const navItems = [
    {
      id: 'DASHBOARD' as SidebarTab,
      label: 'Ana Sayfa',
      icon: LayoutDashboard,
    },
    {
      id: 'PLANS' as SidebarTab,
      label: 'Test Planları',
      icon: ClipboardList,
      badge: testPlansCount > 0 ? testPlansCount : undefined,
    },
    {
      id: 'EXPLORER' as SidebarTab,
      label: 'Test Senaryoları',
      icon: FileText,
      badge: testCasesCount > 0 ? testCasesCount : undefined,
    },
    {
      id: 'RUNS' as SidebarTab,
      label: 'Test Koşumları',
      icon: Activity,
      badge: testRunsCount > 0 ? testRunsCount : undefined,
    },
    {
      id: 'DEFECTS' as SidebarTab,
      label: 'Defectler & Hatalar',
      icon: Bug,
      badge: defectsCount > 0 ? defectsCount : undefined,
    },
    {
      id: 'REPORTS' as SidebarTab,
      label: 'Test Raporları',
      icon: BarChart3,
    },
    {
      id: 'SETTINGS' as SidebarTab,
      label: 'Sistem Ayarları',
      icon: Settings,
    },
  ];


  // Collapsed Sidebar View
  if (isCollapsed) {
    return (
      <aside className="w-16 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col items-center py-3 h-[calc(100vh-4rem)] select-none transition-all duration-300 z-20 shrink-0 justify-between">
        <div className="flex flex-col items-center space-y-3 w-full">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-[var(--accent-primary)]/10 text-slate-600 dark:text-slate-300 hover:text-[var(--accent-primary)] transition-colors shadow-xs mb-1 cursor-pointer"
            title="Menüyü Genişlet"
          >
            <PanelLeftOpen className="w-4.5 h-4.5" />
          </button>

          {/* Active Project Key Badge */}
          {selectedProject && (
            <div
              onClick={toggleCollapsed}
              className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-mono font-bold text-xs flex items-center justify-center border border-[var(--accent-primary)]/30 mb-1 cursor-pointer shadow-xs"
              title={`Proje: ${selectedProject.name}`}
            >
              {selectedProject.name.charAt(0).toLocaleUpperCase('tr-TR')}
            </div>
          )}

          {/* Nav Icons */}
          <div className="flex flex-col space-y-2 w-full px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                    isActive
                      ? 'bg-[var(--accent-primary)] text-white shadow-md shadow-[var(--accent-dark)]/30 scale-105 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  style={isActive ? { background: 'var(--accent-gradient)' } : undefined}
                  title={item.label}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {item.badge !== undefined && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--accent-primary)] ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsed Footer: Admin Settings Icon & Expand Toggle */}
        <div className="flex flex-col items-center space-y-2 w-full px-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => onTabChange('SETTINGS')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                activeTab === 'SETTINGS'
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm shadow-[var(--accent-dark)]/30'
                  : 'text-slate-500 hover:text-[var(--accent-primary)] dark:text-slate-400 dark:hover:text-[var(--accent-primary)] hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={activeTab === 'SETTINGS' ? { background: 'var(--accent-gradient)' } : undefined}
              title="Sistem & Yönetim Ayarları"
              aria-label="Yönetim Ayarları"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Menüyü Genişlet"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // Expanded Sidebar View (240px)
  return (
    <aside className="w-[240px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col h-[calc(100vh-4rem)] select-none transition-all duration-300 z-20 shrink-0 justify-between">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 1. Header: Section Title & Collapse Action */}
        <div className="p-2.5 px-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#141821]/90 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Navigasyon Menüsü
          </span>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Sol Menüyü Daralt"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Primary Nav List */}
        <div className="p-2.5 space-y-1 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm shadow-[var(--accent-dark)]/25 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
                style={isActive ? { background: 'var(--accent-gradient)' } : undefined}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Project Summary Card */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Proje Özeti
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs py-0.5 border-b border-slate-200/50 dark:border-slate-800/60">
                <span>Test Planları:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{testPlansCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs py-0.5 border-b border-slate-200/50 dark:border-slate-800/60">
                <span>Test Senaryoları:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{testCasesCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs py-0.5 border-b border-slate-200/50 dark:border-slate-800/60">
                <span>Test Koşumları:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{testRunsCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs py-0.5">
                <span>Açık Defectler:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{defectsCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Footer: Admin Settings Button (Sol Alt Köşe) + Collapse Action */}
      <div className="p-2.5 px-3 border-t border-slate-100 dark:border-slate-800/80 shrink-0 flex items-center justify-between gap-1 bg-slate-50/50 dark:bg-[#141821]/80">
        {/* Admin Settings Button (Bottom Left) */}
        {isAdmin ? (
          <button
            type="button"
            onClick={() => onTabChange('SETTINGS')}
            className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'SETTINGS'
                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                : 'text-slate-700 dark:text-slate-300 hover:text-[var(--accent-primary)] hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title="Sistem & Yönetim Ayarları"
            aria-label="Yönetim Ayarları"
          >
            <Settings className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="text-[11px]">Ayarlar</span>
          </button>
        ) : (
          <div />
        )}

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Sol Menüyü Daralt"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">Daralt</span>
        </button>
      </div>
    </aside>
  );
};
