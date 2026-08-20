import React, { useState, useEffect } from 'react';
import { SuiteTreeNode, TestCase, Project } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
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
  Sparkles,
  Check,
} from 'lucide-react';

interface AppSidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  tree: SuiteTreeNode[];
  rootTestCases?: TestCase[];
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
  tree,
  rootTestCases = [],
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
  const { can, isViewer } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [draggedSuiteId, setDraggedSuiteId] = useState<string | null>(null);
  const [dragOverSuiteId, setDragOverSuiteId] = useState<string | null>(null);
  const [isRootDragOver, setIsRootDragOver] = useState(false);

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

  const [collapsedProjectsMap, setCollapsedProjectsMap] = useState<Record<string, boolean>>({});

  const toggleExpand = (suiteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedMap((prev) => {
      const current = prev[suiteId] ?? true;
      return { ...prev, [suiteId]: !current };
    });
  };

  const toggleProjectExpand = (projectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedProjectsMap((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'BLOCKER':
        return 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'CRITICAL':
        return 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'NORMAL':
        return 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'LOW':
        return 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'WEB':
        return 'text-emerald-500 dark:text-emerald-400';
      case 'MOBILE':
        return 'text-purple-500 dark:text-purple-400';
      case 'API':
        return 'text-cyan-500 dark:text-cyan-400';
      default:
        return 'text-slate-400';
    }
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
            className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 font-mono font-bold"
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
            className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-mono font-bold"
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
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Render Suite Node recursively
  const renderSuiteNode = (node: SuiteTreeNode, depth: number = 0) => {
    const isExpanded = expandedMap[node.id] ?? true;
    const isBeingDragged = draggedSuiteId === node.id;
    const isDragOver = dragOverSuiteId === node.id;
    const isSuiteSelected = selectedSuiteId === node.id;

    // Filter test cases
    const filteredCases = (node.testCases || []).filter((c) => {
      const matchesSearch = searchQuery
        ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesStatus = matchCaseStatus(c);
      return matchesSearch && matchesStatus;
    });

    const indentPx = depth * 14 + 4;
    const caseIndentPx = depth * 14 + 22;

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
            isBeingDragged ? 'opacity-40 border-2 border-dashed border-rose-500' : ''
          } ${
            isDragOver
              ? 'bg-rose-500/20 border-2 border-rose-500 scale-[1.01]'
              : isSuiteSelected
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold border-l-2 border-rose-500'
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
                title="Suite İçine Test Case Ekle"
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
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold border-l-2 border-rose-500 shadow-sm'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-rose-500' : 'text-slate-400'}`} />
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
    const matchesSearch = searchQuery
      ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesStatus = matchCaseStatus(c);
    return matchesSearch && matchesStatus;
  });

  // Render Collapsed Sidebar Rail
  if (isCollapsed) {
    return (
      <aside className="w-16 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col items-center py-3 h-[calc(100vh-4rem)] select-none transition-all duration-300 z-20 shrink-0">
        {/* Expand Trigger Button */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors shadow-sm mb-4"
          title="Sol Menüyü Genişlet"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        {/* Add Project Shortcut */}
        {can('CREATE_PROJECT') && (
          <button
            type="button"
            onClick={onOpenNewProject}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors mb-3"
            title="Yeni Test Planı Ekle"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800 my-1" />

        {/* Collapsed Project Key Icons List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 px-1 w-full flex flex-col items-center">
          {projects.map((p) => {
            const isSelected = selectedProject?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProject(p)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition-all relative group ${
                  isSelected
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={`[${p.key}] ${p.name}`}
              >
                <span>{p.key.slice(0, 3)}</span>
                {isSelected && (
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-rose-500 rounded-r" />
                )}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  // Render Full Expanded Sidebar
  return (
    <aside className="w-[360px] sm:w-[380px] lg:w-[400px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col h-[calc(100vh-4rem)] select-none transition-all duration-300 z-20 shrink-0">
      {/* 1. Header & Collapse Action */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800/90 flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <FolderKanban className="w-4 h-4 text-rose-500 shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">
            Test Planı
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
            {projects.length} Plan
          </span>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {can('CREATE_PROJECT') && (
            <button
              type="button"
              onClick={onOpenNewProject}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
              title="Yeni Test Planı Oluştur"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Sol Menüyü Daralt"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Search Bar ("Test planı veya anahtar ara") */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Test planı veya anahtar ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 pl-8 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors shadow-xs"
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

      {/* 3. Test Plans Cards & Hierarchical Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Test Plans Section Header */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Test Planları ({filteredProjects.length})
          </span>
        </div>

        {/* Test Plan Cards List */}
        <div className="space-y-1.5">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-6 px-3 text-slate-400 text-xs">
              <FolderKanban className="w-6 h-6 mx-auto mb-1.5 opacity-30 text-slate-400" />
              <p>Test planı bulunamadı</p>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const isSelected = selectedProject?.id === p.id;
              const isProjectTreeOpen = isSelected && !collapsedProjectsMap[p.id];
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'bg-rose-500/[0.06] dark:bg-rose-500/10 border-rose-500/40 shadow-sm'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  {/* Test Plan Card Header: e.g. [1] 123, [A] abc, [P] Plan */}
                  <div
                    onClick={() => {
                      if (selectedProject?.id === p.id) {
                        toggleProjectExpand(p.id);
                      } else {
                        setCollapsedProjectsMap((prev) => ({ ...prev, [p.id]: false }));
                        onSelectProject(p);
                      }
                    }}
                    className="p-2 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {/* Badge: [1], [A], [P], [AUTH] */}
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0 group-hover:scale-105 transition-transform">
                        [{p.key}]
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="text-xs font-bold truncate text-slate-800 dark:text-slate-200 group-hover:text-rose-500 transition-colors"
                          title={p.name}
                        >
                          {p.name}
                        </h3>
                        {p.description && (
                          <p
                            className="text-[10px] text-slate-400 dark:text-slate-500 truncate"
                            title={p.description}
                          >
                            {p.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-0.5 shrink-0 ml-1">
                      {onEditProject && can('EDIT_PROJECT') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProject(p);
                          }}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Planı Düzenle"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteProject && can('DELETE_PROJECT') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `'${p.name}' adlı Test Planını ve altındaki tüm suite ve test case'leri silmek istediğinize emin misiniz?`
                              )
                            ) {
                              onDeleteProject(p.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Test Planını Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          isProjectTreeOpen ? 'rotate-90 text-rose-500' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Hierarchical Tree (Test Suite → Case) when selected & open */}
                  {isProjectTreeOpen && (
                    <div className="p-1.5 pt-0 border-t border-rose-500/20 bg-white/50 dark:bg-slate-900/50 space-y-1.5">
                      {/* Tree Controls Toolbar */}
                      <div className="flex items-center justify-between pt-1.5 pb-1 border-b border-slate-200/50 dark:border-slate-800/60 text-[11px]">
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
                        </div>

                        <div className="flex items-center space-x-1">
                          {onOpenNewSuite && can('CREATE_SUITE') && (
                            <button
                              type="button"
                              onClick={onOpenNewSuite}
                              className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 text-[10px] font-medium"
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
                              className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 text-[10px] font-medium"
                              title="Yeni Test Case Ekle"
                            >
                              <FilePlus className="w-2.5 h-2.5" />
                              <span>Case</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Status Filter Chips */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[9px] font-mono">
                        {(['ALL', 'PASSED', 'FAILED', 'BLOCKED', 'UNTESTED'] as StatusFilter[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatusFilter(st)}
                            className={`px-1.5 py-0.5 rounded border transition-colors ${
                              statusFilter === st
                                ? 'bg-rose-500 text-white border-rose-600 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {st === 'ALL' ? 'TÜMÜ' : st}
                          </button>
                        ))}
                      </div>

                      {/* Root Drop Zone for Drag & Drop */}
                      <div
                        onDragOver={handleDragOverRoot}
                        onDrop={handleDropRoot}
                        className={`py-0.5 px-2 rounded-lg text-center text-[10px] transition-colors ${
                          isRootDragOver
                            ? 'bg-rose-500/20 border-2 border-dashed border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {isRootDragOver && '📂 Ana Dizine (Kök Seviyeye) Bırak'}
                      </div>

                      {/* Tree Content (Suites + Root Cases) */}
                      {isLoadingTree ? (
                        <div className="text-center py-4 text-xs text-slate-400">Yükleniyor...</div>
                      ) : tree.length === 0 && filteredRootCases.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400">
                          <Layers className="w-6 h-6 mx-auto mb-1 opacity-40 text-slate-400" />
                          <p>Henüz suite veya case eklenmedi.</p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {/* Root Cases (En Üstte) */}
                          {filteredRootCases.length > 0 && (
                            <div className="space-y-0.5 mb-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-800/80">
                              <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 py-0.5">
                                <FileText className="w-3 h-3 text-rose-500" />
                                <span>Kök Case'ler ({filteredRootCases.length})</span>
                              </div>
                              {filteredRootCases.map((tc) => {
                                const isSelected = selectedCaseId === tc.id;
                                return (
                                  <div
                                    key={tc.id}
                                    onClick={() => onSelectCase(tc)}
                                    style={{ paddingLeft: '4px' }}
                                    className={`group flex items-center justify-between py-1 pr-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
                                      isSelected
                                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold border-l-2 border-rose-500 shadow-sm'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                      <FileText
                                        className={`w-3.5 h-3.5 shrink-0 ${
                                          isSelected ? 'text-rose-500' : 'text-slate-400'
                                        }`}
                                      />
                                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
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

                          {/* Suite Nodes */}
                          {tree.map((node) => renderSuiteNode(node, 0))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
