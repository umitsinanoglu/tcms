import React, { useState, useEffect } from 'react';
import { Project, TestCase, SuiteTreeNode } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Activity,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export type SidebarTab = 'DASHBOARD' | 'PLANS' | 'EXPLORER' | 'RUNS' | 'REPORTS';

interface AppSidebarProps {
  projects?: Project[];
  selectedProject?: Project | null;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  tree?: SuiteTreeNode[];
  rootTestCases?: TestCase[];
  testCasesCount?: number;
  testPlansCount?: number;
  testRunsCount?: number;
  selectedCaseId?: string | null;
  selectedSuiteId?: string | null;
  onSelectProject?: (project: Project) => void;
  onOpenNewProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onSelectCase?: (testCase: TestCase) => void;
  onSelectSuite?: (suite: SuiteTreeNode) => void;
  onAddSubSuite?: (parentSuiteId: string) => void;
  onEditSuite?: (suite: SuiteTreeNode) => void;
  onDeleteSuite?: (suiteId: string) => void;
  onAddCaseInSuite?: (suiteId: string) => void;
  onOpenNewSuite?: () => void;
  onOpenNewCase?: () => void;
  onRunCase?: (testCase: TestCase) => void;
  onRunSuite?: (suite: SuiteTreeNode) => void;
  onReorderSuite?: (suiteId: string, targetParentId: string | null, newOrder: number) => void;
  isLoadingTree?: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  selectedProject,
  activeTab,
  onTabChange,
  testCasesCount = 0,
  testPlansCount = 0,
  testRunsCount = 0,
}) => {
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
      id: 'REPORTS' as SidebarTab,
      label: 'Test Raporları',
      icon: BarChart3,
    },
  ];

  // Collapsed Sidebar View
  if (isCollapsed) {
    return (
      <aside className="w-18 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col items-center py-4 h-[calc(100vh-4rem)] select-none transition-all duration-300 z-20 shrink-0 justify-between">
        <div className="flex flex-col items-center space-y-4 w-full">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-[#b83a4b]/10 text-slate-600 dark:text-slate-300 hover:text-[#b83a4b] transition-colors shadow-xs mb-2 cursor-pointer"
            title="Menüyü Genişlet"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>

          {/* Active Project Icon Badge */}
          {selectedProject && (
            <div
              onClick={toggleCollapsed}
              className="w-11 h-11 rounded-xl bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] font-mono font-bold text-xs flex items-center justify-center border border-[#b83a4b]/30 mb-2 cursor-pointer shadow-xs"
              title={`Proje: [${selectedProject.key}] ${selectedProject.name}`}
            >
              {selectedProject.key.slice(0, 3)}
            </div>
          )}

          {/* Nav Icons */}
          <div className="flex flex-col space-y-2.5 w-full px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white shadow-md shadow-[#821c2b]/30 scale-105 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                  {item.badge !== undefined && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#b83a4b] ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Expand Trigger */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Menüyü Genişlet"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  // Expanded Sidebar View (Compact 230px - 240px)
  return (
    <aside className="w-[230px] sm:w-[240px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col h-[calc(100vh-4rem)] select-none transition-all duration-300 z-20 shrink-0 justify-between">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 1. Header: Section Title & Collapse Action */}
        <div className="p-3 px-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#141821]/90 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Navigasyon Menüsü
          </span>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white shadow-md shadow-[#821c2b]/25 translate-x-0.5 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
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
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs py-0.5">
                <span>Test Koşumları:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{testRunsCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Footer: Collapse Action */}
      <div className="p-2.5 px-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
          <span>Menüyü Daralt</span>
        </button>
      </div>
    </aside>
  );
};
