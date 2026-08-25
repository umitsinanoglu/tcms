import React, { useState, useEffect, useRef } from 'react';
import { SuiteTreeNode, TestCase, Project } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  GripVertical,
  Layers,
  Search,
  Pencil,
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  SkipForward,
  Slash,
  Maximize2,
  Minimize2,
  FolderPlus,
  FilePlus,
  FolderKanban,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  LayoutDashboard,
  ClipboardList,
  Activity,
  BarChart3,
} from 'lucide-react';

export type SidebarTab = 'DASHBOARD' | 'PLANS' | 'EXPLORER' | 'RUNS' | 'REPORTS';

interface AppSidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  tree: SuiteTreeNode[];
  rootTestCases?: TestCase[];
  testPlansCount?: number;
  testRunsCount?: number;
  selectedCaseId: string | null;
  selectedSuiteId?: string | null;
  onSelectProject: (project: Project) => void;
  onOpenNewProject: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onSelectCase: (testCase: TestCase) => void;
  onSelectSuite?: (suite: SuiteTreeNode) => void;
  onAddSubSuite: (parentSuiteId: string) => void;
  onEditSuite?: (suite: SuiteTreeNode) => void;
  onDeleteSuite?: (suiteId: string) => void;
  onAddCaseInSuite: (suiteId: string) => void;
  onOpenNewSuite?: () => void;
  onOpenNewCase?: () => void;
  onRunCase?: (testCase: TestCase) => void;
  onRunSuite?: (suite: SuiteTreeNode) => void;
  onReorderSuite?: (suiteId: string, targetParentId: string | null, newOrder: number) => void;
  isLoadingTree?: boolean;
}

type StatusFilter = 'ALL' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'UNTESTED';

export const AppSidebar: React.FC<AppSidebarProps> = ({
  projects,
  selectedProject,
  activeTab,
  onTabChange,
  tree,
  rootTestCases = [],
  testPlansCount = 0,
  testRunsCount = 0,
  selectedCaseId,
  selectedSuiteId,
  onSelectProject,
  onOpenNewProject,
  onEditProject,
  onDeleteProject,
  onSelectCase,
  onSelectSuite,
  onAddSubSuite,
  onEditSuite,
  onDeleteSuite,
  onAddCaseInSuite,
  onOpenNewSuite,
  onOpenNewCase,
  onRunCase,
  onRunSuite,
  onReorderSuite,
  isLoadingTree = false,
}) => {
  const { can } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [draggedSuiteId, setDraggedSuiteId] = useState<string | null>(null);
  const [dragOverSuiteId, setDragOverSuiteId] = useState<string | null>(null);
  const [isRootDragOver, setIsRootDragOver] = useState(false);

  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const projectSearchInputRef = useRef<HTMLInputElement>(null);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tcms_sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  // Close project dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    if (isProjectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => projectSearchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectDropdownOpen]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('tcms_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Subtree check for drag & drop
  const isSubTreeContainsId = (rootNode: SuiteTreeNode, targetId: string): boolean => {
    if (rootNode.id === targetId) return true;
    if (rootNode.children) {
      for (const child of rootNode.children) {
        if (isSubTreeContainsId(child, targetId)) return true;
      }
    }
    return false;
  };

  const findNodeInTree = (nodes: SuiteTreeNode[], id: string): SuiteTreeNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findNodeInTree(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const isInvalidDropTarget = (draggedId: string | null, targetId: string): boolean => {
    if (!draggedId) return false;
    if (draggedId === targetId) return true;
    const draggedNode = findNodeInTree(tree, draggedId);
    if (draggedNode) {
      return isSubTreeContainsId(draggedNode, targetId);
    }
    return false;
  };

  const toggleExpand = (suiteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedMap((prev) => {
      const current = prev[suiteId] ?? true;
      return { ...prev, [suiteId]: !current };
    });
  };

  const handleExpandAll = () => {
    const map: Record<string, boolean> = {};
    const traverse = (nodes: SuiteTreeNode[]) => {
      nodes.forEach((n) => {
        map[n.id] = true;
        if (n.children) traverse(n.children);
      });
    };
    traverse(tree);
    setExpandedMap(map);
  };

  const handleCollapseAll = () => {
    const map: Record<string, boolean> = {};
    const traverse = (nodes: SuiteTreeNode[]) => {
      nodes.forEach((n) => {
        map[n.id] = false;
        if (n.children) traverse(n.children);
      });
    };
    traverse(tree);
    setExpandedMap(map);
  };

  const getLatestStatusBadge = (testCase: TestCase) => {
    const latestResult = testCase.results && testCase.results.length > 0 ? testCase.results[0] : null;
    const status = latestResult?.status;

    switch (status) {
      case 'PASSED':
        return (
          <span
            className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono font-bold"
            title={`Sonuç: PASSED (${latestResult?.executedAt ? new Date(latestResult.executedAt).toLocaleTimeString() : ''})`}
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>PASS</span>
          </span>
        );
      case 'FAILED':
        return (
          <span
            className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-mono font-bold"
            title={`Sonuç: FAILED ${latestResult?.errorMessage ? `- ${latestResult.errorMessage}` : ''}`}
          >
            <XCircle className="w-2.5 h-2.5" />
            <span>FAIL</span>
          </span>
        );
      case 'SKIPPED':
        return (
          <span
            className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30 font-mono font-bold"
            title="Sonuç: SKIPPED"
          >
            <SkipForward className="w-2.5 h-2.5" />
            <span>SKIP</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span
            className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono font-bold"
            title="Sonuç: BLOCKED"
          >
            <Slash className="w-2.5 h-2.5" />
            <span>BLOCK</span>
          </span>
        );
      default:
        return (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700/50 font-mono"
            title="Henüz koşturulmadı"
          >
            -
          </span>
        );
    }
  };

  const handleDragStart = (e: React.DragEvent, suiteId: string) => {
    e.stopPropagation();
    setDraggedSuiteId(suiteId);
    e.dataTransfer.setData('text/plain', suiteId);
  };

  const handleDragEnd = () => {
    setDraggedSuiteId(null);
    setDragOverSuiteId(null);
    setIsRootDragOver(false);
  };

  const handleDragOverSuite = (e: React.DragEvent, targetSuiteId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedSuiteId && !isInvalidDropTarget(draggedSuiteId, targetSuiteId)) {
      setDragOverSuiteId(targetSuiteId);
      setIsRootDragOver(false);
    }
  };

  const handleDropSuite = (e: React.DragEvent, targetSuiteId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSuiteId(null);
    if (draggedSuiteId && !isInvalidDropTarget(draggedSuiteId, targetSuiteId) && onReorderSuite) {
      onReorderSuite(draggedSuiteId, targetSuiteId, 0);
      setDraggedSuiteId(null);
    }
  };

  const handleDragOverRoot = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedSuiteId) {
      setIsRootDragOver(true);
      setDragOverSuiteId(null);
    }
  };

  const handleDropRoot = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRootDragOver(false);
    if (draggedSuiteId && onReorderSuite) {
      onReorderSuite(draggedSuiteId, null, 0);
      setDraggedSuiteId(null);
    }
  };

  const matchCaseStatus = (tc: TestCase) => {
    if (statusFilter === 'ALL') return true;
    const status = tc.results && tc.results.length > 0 ? tc.results[0].status : 'UNTESTED';
    if (statusFilter === 'UNTESTED') return !tc.results || tc.results.length === 0;
    return status === statusFilter;
  };

  // Filter projects by search query
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(projectSearchQuery.toLowerCase()))
  );

  // Flatten all cases to compute total cases count
  const getAllCasesCount = (nodes: SuiteTreeNode[]): number => {
    let count = 0;
    nodes.forEach((n) => {
      if (n.testCases) count += n.testCases.length;
      if (n.children) count += getAllCasesCount(n.children);
    });
    return count;
  };

  const totalCasesCount = (rootTestCases?.length || 0) + getAllCasesCount(tree);

  // Render Suite Node recursively
  const renderSuiteNode = (node: SuiteTreeNode, depth: number = 0) => {
    const isExpanded = expandedMap[node.id] ?? true;
    const isBeingDragged = draggedSuiteId === node.id;
    const isDragOver = dragOverSuiteId === node.id;
    const isSuiteSelected = selectedSuiteId === node.id;

    // Filter test cases
    const filteredCases = (node.testCases || []).filter((c) => {
      const matchesSearch = caseSearchQuery
        ? c.title.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(caseSearchQuery.toLowerCase())
        : true;
      const matchesStatus = matchCaseStatus(c);
      return matchesSearch && matchesStatus;
    });

    const indentPx = depth * 14 + 4;
    const caseIndentPx = depth * 14 + 20;

    return (
      <div key={node.id} className="select-none">
        {/* Suite Header Card */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOverSuite(e, node.id)}
          onDrop={(e) => handleDropSuite(e, node.id)}
          onClick={(e) => {
            toggleExpand(node.id, e);
            if (onSelectSuite) onSelectSuite(node);
          }}
          style={{ paddingLeft: `${indentPx}px` }}
          className={`group flex items-center justify-between py-1 pr-1.5 rounded-lg cursor-pointer transition-all duration-150 relative ${
            isBeingDragged ? 'opacity-40 border-2 border-dashed border-[#b83a4b]' : ''
          } ${
            isDragOver
              ? 'bg-[#b83a4b]/20 border-2 border-[#b83a4b] scale-[1.01]'
              : isSuiteSelected
              ? 'bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] font-semibold border-l-2 border-[#b83a4b]'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-1.5 min-w-0 flex-1">
            <span
              className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Sıralamayı veya ebeveyni değiştirmek için sürükleyin"
            >
              <GripVertical className="w-3 h-3 shrink-0" />
            </span>

            <button
              type="button"
              onClick={(e) => toggleExpand(node.id, e)}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500 shrink-0" />
            )}

            <span className="text-xs truncate font-medium flex-1 min-w-0" title={node.name}>
              {node.name}
            </span>

            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
              {node.testCases?.length || 0}
            </span>
          </div>

          {/* Quick Suite Actions */}
          <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
            {can('CREATE_SUITE') && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSubSuite(node.id);
                }}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                title="Alt Suite Ekle"
              >
                <FolderPlus className="w-3 h-3" />
              </button>
            )}
            {can('CREATE_CASE') && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddCaseInSuite(node.id);
                }}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                title="Suite İçine Test Senaryosu Ekle"
              >
                <FilePlus className="w-3 h-3" />
              </button>
            )}
            {onEditSuite && can('EDIT_SUITE') && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSuite(node);
                }}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                title="Suite Düzenle"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            {onDeleteSuite && can('DELETE_SUITE') && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`'${node.name}' adlı Test Suite'i silmek istediğinize emin misiniz?`)) {
                    onDeleteSuite(node.id);
                  }
                }}
                className="p-1 rounded hover:bg-rose-500/20 text-rose-500"
                title="Suite Sil"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-Suites and Cases */}
        {isExpanded && (
          <div className="space-y-0.5 mt-0.5">
            {/* Render Sub-Suites */}
            {node.children && node.children.map((child) => renderSuiteNode(child, depth + 1))}

            {/* Render Test Cases in Suite */}
            {filteredCases.map((tc) => {
              const isSelected = selectedCaseId === tc.id;
              return (
                <div
                  key={tc.id}
                  onClick={() => onSelectCase(tc)}
                  style={{ paddingLeft: `${caseIndentPx}px` }}
                  className={`group flex items-center justify-between py-1 pr-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] font-semibold border-l-2 border-[#b83a4b] shadow-sm'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#b83a4b]' : 'text-slate-400'}`} />
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      {tc.code}
                    </span>
                    <span className="text-xs truncate flex-1 min-w-0" title={tc.title}>
                      {tc.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-1">
                    {getLatestStatusBadge(tc)}
                    {onRunCase && can('EXECUTE_RUN') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRunCase(tc);
                        }}
                        className="p-1 rounded hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hızlı Koştur"
                      >
                        <Play className="w-2.5 h-2.5 fill-emerald-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Filter root test cases
  const filteredRootCases = rootTestCases.filter((c) => {
    const matchesSearch = caseSearchQuery
      ? c.title.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(caseSearchQuery.toLowerCase())
      : true;
    const matchesStatus = matchCaseStatus(c);
    return matchesSearch && matchesStatus;
  });

  // Navigation Items Config (Requirement 5)
  const navItems: {
    id: SidebarTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }[] = [
    {
      id: 'DASHBOARD',
      label: 'Ana Sayfa',
      icon: LayoutDashboard,
    },
    {
      id: 'PLANS',
      label: 'Test Planları',
      icon: ClipboardList,
      badge: testPlansCount > 0 ? testPlansCount : undefined,
    },
    {
      id: 'EXPLORER',
      label: 'Test Senaryoları',
      icon: Layers,
      badge: totalCasesCount > 0 ? totalCasesCount : undefined,
    },
    {
      id: 'RUNS',
      label: 'Test Koşumları',
      icon: Activity,
      badge: testRunsCount > 0 ? testRunsCount : undefined,
    },
    {
      id: 'REPORTS',
      label: 'Test Raporları',
      icon: BarChart3,
    },
  ];

  // Collapsed Sidebar View
  if (isCollapsed) {
    return (
      <aside className="w-16 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col items-center py-3 h-[calc(100vh-3.5rem)] select-none transition-all duration-300 z-20 shrink-0">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-[#b83a4b]/10 text-slate-600 dark:text-slate-300 hover:text-[#b83a4b] transition-colors shadow-sm mb-3"
          title="Sol Menüyü Genişlet"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        {/* Active Project Icon Badge */}
        {selectedProject && (
          <div
            onClick={toggleCollapsed}
            className="w-10 h-10 rounded-xl bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] font-mono font-bold text-xs flex items-center justify-center border border-[#b83a4b]/30 mb-3 cursor-pointer"
            title={`Çalışılan Proje: [${selectedProject.key}] ${selectedProject.name}`}
          >
            {selectedProject.key.slice(0, 3)}
          </div>
        )}

        <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800 mb-3" />

        {/* Collapsed Navigation Icons */}
        <div className="space-y-2 flex flex-col items-center w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white shadow-md shadow-[#821c2b]/30 scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
                {isActive && (
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#b83a4b] rounded-r" />
                )}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  // Expanded Sidebar View
  return (
    <aside className="w-[310px] sm:w-[330px] lg:w-[350px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col h-[calc(100vh-3.5rem)] select-none transition-all duration-300 z-20 shrink-0">
      {/* 1. Header: "Çalışılan Proje" Combobox & Collapse Action (Requirement 4 & 5) */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141821]/80">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Çalışılan Proje
          </span>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Sol Menüyü Daralt"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Project Selector Dropdown Button */}
        <div className="relative" ref={projectDropdownRef}>
          <button
            type="button"
            onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
              isProjectDropdownOpen
                ? 'bg-white dark:bg-[#1d232f] border-[#b83a4b]/50 ring-2 ring-[#b83a4b]/20 shadow-sm'
                : 'bg-white dark:bg-[#1d232f] hover:border-[#b83a4b]/30 border-slate-200 dark:border-slate-700/80 shadow-xs'
            }`}
          >
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <FolderKanban className="w-4 h-4 text-[#b83a4b] shrink-0" />
              {selectedProject ? (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-[10px] font-bold text-[#b83a4b] dark:text-[#d66b7a] bg-[#b83a4b]/10 px-1.5 py-0.2 rounded border border-[#b83a4b]/20 shrink-0">
                      [{selectedProject.key}]
                    </span>
                    <span className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
                      {selectedProject.name}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">Proje Seçin...</span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                isProjectDropdownOpen ? 'rotate-180 text-[#b83a4b]' : ''
              }`}
            />
          </button>

          {/* Project Switcher Popover */}
          {isProjectDropdownOpen && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
              {/* Search Box */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={projectSearchInputRef}
                    type="text"
                    placeholder="Proje ara..."
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 pl-8 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#b83a4b]/50"
                  />
                  {projectSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setProjectSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Projects List */}
              <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
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
                          onSelectProject(p);
                          setIsProjectDropdownOpen(false);
                          setProjectSearchQuery('');
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all group ${
                          isSelected
                            ? 'bg-[#b83a4b]/10 dark:bg-[#b83a4b]/15 border border-[#b83a4b]/30 text-[#b83a4b] dark:text-[#d66b7a] font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0 pr-2 flex-1">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/30 shrink-0">
                            [{p.key}]
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs truncate font-medium text-slate-800 dark:text-slate-200 group-hover:text-[#b83a4b] transition-colors">
                              {p.name}
                            </p>
                            {p.description && (
                              <p className="text-[10px] text-slate-400 truncate">{p.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#b83a4b] shrink-0" />}
                          {onEditProject && can('EDIT_PROJECT') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsProjectDropdownOpen(false);
                                onEditProject(p);
                              }}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Projeyi Düzenle"
                            >
                              <Pencil className="w-3 h-3" />
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
                              className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Projeyi Sil"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* New Project Action */}
              {can('CREATE_PROJECT') && (
                <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProjectDropdownOpen(false);
                      onOpenNewProject();
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-[#b83a4b] dark:text-[#d66b7a] hover:bg-[#b83a4b]/10 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yeni Test Projesi Oluştur</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Primary Nav List (Ana Sayfa, Test Planları, Test Senaryoları, Test Koşumları, Test Raporları) */}
      <div className="p-3 space-y-1 border-b border-slate-200 dark:border-slate-800">
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
                  ? 'bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white shadow-md shadow-[#821c2b]/25 translate-x-1'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Dynamic Sub-Content Section */}
      {activeTab === 'EXPLORER' ? (
        /* Test Explorer Tree Section */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Sub Header & Tree Toolbar */}
          <div className="p-2 px-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Klasör & Senaryo Ağacı
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                  title="Tümünü Genişlet"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                  title="Tümünü Daralt"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
                {onOpenNewSuite && can('CREATE_SUITE') && (
                  <button
                    type="button"
                    onClick={onOpenNewSuite}
                    className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#b83a4b]/10 text-slate-600 dark:text-slate-300 hover:text-[#b83a4b] text-[10px] font-medium"
                    title="Yeni Test Suite Ekle"
                  >
                    <FolderPlus className="w-2.5 h-2.5" />
                    <span>Suite</span>
                  </button>
                )}
                {onOpenNewCase && can('CREATE_CASE') && (
                  <button
                    type="button"
                    onClick={onOpenNewCase}
                    className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#b83a4b]/10 text-slate-600 dark:text-slate-300 hover:text-[#b83a4b] text-[10px] font-medium"
                    title="Yeni Test Case Ekle"
                  >
                    <FilePlus className="w-2.5 h-2.5" />
                    <span>Case</span>
                  </button>
                )}
              </div>
            </div>

            {/* Case Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Senaryo veya kod ara..."
                value={caseSearchQuery}
                onChange={(e) => setCaseSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 pl-8 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#b83a4b]/50"
              />
              {caseSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCaseSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[9px] font-mono">
              {(['ALL', 'PASSED', 'FAILED', 'BLOCKED', 'UNTESTED'] as StatusFilter[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-1.5 py-0.5 rounded border transition-colors ${
                    statusFilter === st
                      ? 'bg-[#b83a4b] text-white border-[#821c2b] font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'TÜMÜ' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Tree Scroll Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Root Drop Zone for Drag & Drop */}
            <div
              onDragOver={handleDragOverRoot}
              onDrop={handleDropRoot}
              className={`py-0.5 px-2 rounded-lg text-center text-[10px] transition-colors ${
                isRootDragOver
                  ? 'bg-[#b83a4b]/20 border-2 border-dashed border-[#b83a4b] text-[#b83a4b] dark:text-[#d66b7a] font-bold'
                  : 'text-slate-400'
              }`}
            >
              {isRootDragOver && '📂 Ana Dizine (Kök Seviyeye) Bırak'}
            </div>

            {isLoadingTree ? (
              <div className="text-center py-6 text-xs text-slate-400">Yükleniyor...</div>
            ) : tree.length === 0 && filteredRootCases.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <Layers className="w-8 h-8 mx-auto mb-1.5 opacity-40 text-slate-400" />
                <p>Henüz suite veya senaryo eklenmedi.</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {/* Root Cases */}
                {filteredRootCases.length > 0 && (
                  <div className="space-y-0.5 mb-2 pb-1.5 border-b border-slate-200/70 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 rounded-xl p-1.5 shadow-xs">
                    <div
                      onClick={() => {
                        if (onSelectSuite) {
                          onSelectSuite({
                            id: '__root_cases__',
                            name: "Kök Test Senaryoları (Suite'siz)",
                            orderIndex: 0,
                            parentId: null,
                            children: [],
                            testCases: rootTestCases,
                          });
                        }
                      }}
                      className="flex items-center justify-between space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-1 py-1 cursor-pointer hover:text-[#b83a4b] transition-colors group"
                      title="Tüm kök senaryoları liste görünümünde aç"
                    >
                      <div className="flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#b83a4b] shrink-0" />
                        <span>Kök Senaryolar ({filteredRootCases.length})</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 group-hover:text-[#b83a4b] font-normal transition-colors">
                        Tümünü Gör →
                      </span>
                    </div>
                    {filteredRootCases.map((tc) => {
                      const isSelected = selectedCaseId === tc.id;
                      return (
                        <div
                          key={tc.id}
                          onClick={() => onSelectCase(tc)}
                          style={{ paddingLeft: '6px' }}
                          className={`group flex items-center justify-between py-1.5 pr-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? 'bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] font-semibold border-l-2 border-[#b83a4b] shadow-sm'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                            <FileText
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-[#b83a4b]' : 'text-slate-400'
                              }`}
                            />
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                              {tc.code}
                            </span>
                            <span className="text-xs truncate flex-1 min-w-0" title={tc.title}>
                              {tc.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 shrink-0 ml-1">
                            {getLatestStatusBadge(tc)}
                            {onRunCase && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRunCase(tc);
                                }}
                                className="p-1 rounded hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Hızlı Koş"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Render Tree Hierarchy */}
                {tree.map((node) => renderSuiteNode(node, 0))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Summary Footer or Context Card for non-Explorer views */
        <div className="flex-1 p-3 overflow-y-auto space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Proje Özeti
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs">
                <span>Test Planları:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{testPlansCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs">
                <span>Test Senaryoları:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{totalCasesCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs">
                <span>Test Koşumları:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{testRunsCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
