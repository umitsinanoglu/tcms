'use client';

import React, { useState } from 'react';
import { SuiteTreeNode, TestCase, Project } from '@/services/api';
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
  Filter,
  FolderPlus,
  FilePlus,
  FolderKanban,
} from 'lucide-react';

interface ExplorerTreeProps {
  tree: SuiteTreeNode[];
  rootTestCases?: TestCase[];
  selectedProject?: Project | null;
  selectedCaseId: string | null;
  selectedSuiteId?: string | null;
  onSelectCase: (testCase: TestCase) => void;
  onSelectSuite?: (suite: SuiteTreeNode) => void;
  onAddSubSuite: (parentSuiteId: string) => void;
  onEditSuite?: (suite: SuiteTreeNode) => void;
  onDeleteSuite?: (suiteId: string) => void;
  onAddCaseInSuite: (suiteId: string) => void;
  onOpenNewSuite?: () => void;
  onOpenNewCase?: () => void;
  onEditProject?: (project: Project) => void;
  onRunCase?: (testCase: TestCase) => void;
  onRunSuite?: (suite: SuiteTreeNode) => void;
  onReorderSuite?: (suiteId: string, targetParentId: string | null, newOrder: number) => void;
}

type StatusFilter = 'ALL' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'UNTESTED';

export const ExplorerTree: React.FC<ExplorerTreeProps> = ({
  tree,
  rootTestCases = [],
  selectedProject,
  selectedCaseId,
  selectedSuiteId,
  onSelectCase,
  onSelectSuite,
  onAddSubSuite,
  onEditSuite,
  onDeleteSuite,
  onAddCaseInSuite,
  onOpenNewSuite,
  onOpenNewCase,
  onEditProject,
  onRunCase,
  onRunSuite,
  onReorderSuite,
}) => {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [draggedSuiteId, setDraggedSuiteId] = useState<string | null>(null);
  const [dragOverSuiteId, setDragOverSuiteId] = useState<string | null>(null);
  const [isRootDragOver, setIsRootDragOver] = useState(false);

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
    setExpandedMap((prev) => ({ ...prev, [suiteId]: !prev[suiteId] }));
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
            className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono font-bold"
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

  const renderSuiteNode = (node: SuiteTreeNode, depth: number = 0) => {
    const isExpanded = expandedMap[node.id] ?? true;
    const isBeingDragged = draggedSuiteId === node.id;
    const isDragOver = dragOverSuiteId === node.id;
    const isSuiteSelected = selectedSuiteId === node.id;

    // Filter testcases if search query or status filter exists
    const filteredCases = node.testCases.filter((c) => {
      const matchesSearch = searchQuery
        ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesStatus = matchCaseStatus(c);
      return matchesSearch && matchesStatus;
    });

    return (
      <div key={node.id} className="select-none">
        {/* Suite Header Item */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOverSuite(e, node.id)}
          onDrop={(e) => handleDropSuite(e, node.id)}
          onDragLeave={() => setDragOverSuiteId(null)}
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg transition-all cursor-pointer text-xs font-medium ${
            isBeingDragged
              ? 'opacity-40 border border-dashed border-amber-500 bg-amber-500/5'
              : isDragOver
              ? 'bg-blue-600/20 border-2 border-blue-500 text-blue-900 dark:text-blue-200 font-bold shadow-md ring-2 ring-blue-500/30'
              : isSuiteSelected
              ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold border-l-2 border-amber-500 shadow-sm'
              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
          onClick={(e) => {
            toggleExpand(node.id, e);
            if (onSelectSuite) onSelectSuite(node);
          }}
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="opacity-0 group-hover:opacity-40 cursor-grab hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3" />
            </span>

            <button
              onClick={(e) => toggleExpand(node.id, e)}
              className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500/80 dark:text-amber-400/80 shrink-0" />
            )}

            <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{node.name}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono ml-1">
              ({node.testCases.length})
            </span>
            {isDragOver && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold ml-2 animate-pulse bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/30">
                ↳ Alt Suite yap
              </span>
            )}
          </div>

          {/* Quick Actions for Suite */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddCaseInSuite(node.id);
              }}
              title="Test Case Ekle"
              className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Plus className="w-3 h-3" />
            </button>

            {onEditSuite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSuite(node);
                }}
                title="Suite Düzenle"
                className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-500"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}

            {onDeleteSuite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`"${node.name}" isimli suite klasörünü silmek istediğinize emin misiniz?`)) {
                    onDeleteSuite(node.id);
                  }
                }}
                title="Suite Sil"
                className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Children & Test Cases */}
        {isExpanded && (
          <div className="space-y-0.5">
            {/* Child Suites */}
            {node.children.map((childNode) => renderSuiteNode(childNode, depth + 1))}

            {/* Test Cases inside this suite */}
            {filteredCases.map((tc) => {
              const isSelected = selectedCaseId === tc.id;
              return (
                <div
                  key={tc.id}
                  style={{ paddingLeft: `${(depth + 1) * 14 + 18}px` }}
                  onClick={() => onSelectCase(tc)}
                  className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg transition-all cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-blue-500/10 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 font-semibold border-l-2 border-blue-500 shadow-sm'
                      : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${getTypeBadge(tc.type)}`} />
                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-bold">
                      {tc.code}
                    </span>
                    <span className="truncate">{tc.title}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {/* Latest Status Badge */}
                    {getLatestStatusBadge(tc)}

                    {/* Run Command Button */}
                    {onRunCase && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRunCase(tc);
                        }}
                        title="Test Case'i Koştur (Run)"
                        className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 transition-all opacity-0 group-hover:opacity-100 font-semibold text-[10px]"
                      >
                        <Play className="w-3 h-3 fill-current text-emerald-500" />
                        <span>Run</span>
                      </button>
                    )}

                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold ${getPriorityColor(
                        tc.priority
                      )}`}
                    >
                      {tc.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col h-[calc(100vh-4rem)] select-none transition-colors duration-200">
      {/* Active Test Plan Info & Actions */}
      {selectedProject && (
        <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                [{selectedProject.key}]
              </span>
              <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={selectedProject.name}>
                {selectedProject.name}
              </h2>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="text-[10px] text-slate-400 font-mono">Test Planı</span>
              {onEditProject && (
                <button
                  onClick={() => onEditProject(selectedProject)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  title="Test Planını Düzenle / Sil"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Plan-level Buttons: Yeni Suite & Yeni Case */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => onOpenNewSuite ? onOpenNewSuite() : onAddSubSuite('')}
              className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Plan Altında Yeni Suite Oluştur"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>+ Yeni Suite</span>
            </button>

            <button
              onClick={() => onOpenNewCase ? onOpenNewCase() : onAddCaseInSuite('')}
              className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold bg-[#b83a4b]/10 hover:bg-[#b83a4b]/20 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/30 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Plan Altında Yeni Case Oluştur"
            >
              <FilePlus className="w-3.5 h-3.5 text-[#b83a4b] shrink-0" />
              <span>+ Yeni Case</span>
            </button>
          </div>
        </div>
      )}

      {/* Explorer Tree Toolbar & Search */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Explorer</h2>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleExpandAll}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Tümünü Genişlet (Expand All)"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              onClick={handleCollapseAll}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Tümünü Daralt (Collapse All)"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Case ya da Kod ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 text-[10px] font-medium">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2 py-0.5 rounded-full border transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white border-[#821c2b]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setStatusFilter('PASSED')}
            className={`px-2 py-0.5 rounded-full border transition-colors ${
              statusFilter === 'PASSED'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            }`}
          >
            Pass
          </button>
          <button
            onClick={() => setStatusFilter('FAILED')}
            className={`px-2 py-0.5 rounded-full border transition-colors ${
              statusFilter === 'FAILED'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
            }`}
          >
            Fail
          </button>
          <button
            onClick={() => setStatusFilter('BLOCKED')}
            className={`px-2 py-0.5 rounded-full border transition-colors ${
              statusFilter === 'BLOCKED'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
            }`}
          >
            Block
          </button>
          <button
            onClick={() => setStatusFilter('UNTESTED')}
            className={`px-2 py-0.5 rounded-full border transition-colors ${
              statusFilter === 'UNTESTED'
                ? 'bg-slate-600 text-white border-slate-600'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
            }`}
          >
            Koşulmadı
          </button>
        </div>
      </div>

      {/* Root Level Drop Zone Banner when Dragging */}
      {draggedSuiteId && (
        <div
          onDragOver={handleDragOverRoot}
          onDragLeave={() => setIsRootDragOver(false)}
          onDrop={handleDropRoot}
          className={`mx-3 my-2 p-2.5 border-2 border-dashed rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer text-xs font-bold ${
            isRootDragOver
              ? 'border-blue-500 bg-blue-500/25 text-blue-700 dark:text-blue-200 scale-[1.02] shadow-md ring-2 ring-blue-500/40'
              : 'border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:border-amber-500 hover:bg-amber-500/20'
          }`}
        >
          <FolderPlus className={`w-4 h-4 text-amber-500 ${isRootDragOver ? 'animate-bounce text-blue-500' : ''}`} />
          <span>📁 Ana Dizine (Kök Seviyeye) Taşı</span>
        </div>
      )}

      {/* Tree View Scrollable Content */}
      <div
        onDragOver={(e) => {
          if (draggedSuiteId) handleDragOverRoot(e);
        }}
        onDrop={(e) => {
          if (draggedSuiteId) handleDropRoot(e);
        }}
        className={`flex-1 overflow-y-auto p-2 space-y-1 transition-all ${
          isRootDragOver ? 'bg-blue-500/5 ring-2 ring-blue-500/20 rounded-lg' : ''
        }`}
      >
        {(() => {
          const filteredRootCases = (rootTestCases || []).filter((c) => {
            const matchesSearch = searchQuery
              ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.code.toLowerCase().includes(searchQuery.toLowerCase())
              : true;
            const matchesStatus = matchCaseStatus(c);
            return matchesSearch && matchesStatus;
          });

          return (
            <>
              {filteredRootCases.length > 0 && (
                <div className="mb-2 space-y-0.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div
                    onClick={() => {
                      if (onSelectSuite) {
                        onSelectSuite({
                          id: '__root_cases__',
                          name: "Kök Test Case'leri (Suite'siz)",
                          orderIndex: 0,
                          parentId: null,
                          children: [],
                          testCases: rootTestCases,
                        });
                      }
                    }}
                    className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    <div className="flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>Kök Test Case'leri ({filteredRootCases.length})</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 font-normal">Tümünü Gör →</span>
                  </div>
                  {filteredRootCases.map((tc) => {
                    const isSelected = selectedCaseId === tc.id;
                    return (
                      <div
                        key={tc.id}
                        onClick={() => onSelectCase(tc)}
                        className={`group flex items-center justify-between py-1.5 px-2 rounded-lg transition-all cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-blue-500/10 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 font-semibold border-l-2 border-blue-500 shadow-sm'
                            : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
                          <FileText className={`w-3.5 h-3.5 shrink-0 ${getTypeBadge(tc.type)}`} />
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-bold">
                            {tc.code}
                          </span>
                          <span className="truncate">{tc.title}</span>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          {getLatestStatusBadge(tc)}
                          {onRunCase && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRunCase(tc);
                              }}
                              title="Test Case'i Koştur (Run)"
                              className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 transition-all opacity-0 group-hover:opacity-100 font-semibold text-[10px]"
                            >
                              <Play className="w-3 h-3 fill-current text-emerald-500" />
                              <span>Run</span>
                            </button>
                          )}
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold ${getPriorityColor(
                              tc.priority
                            )}`}
                          >
                            {tc.priority}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tree.length === 0 && filteredRootCases.length === 0 ? (
                <div className="text-center py-10 px-4 text-slate-400 dark:text-slate-500 text-xs">
                  <Folder className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p>Henüz klasör (Suite) veya Test Case bulunmuyor.</p>
                  <p className="text-[10px] mt-1 text-slate-500">Yukarıdaki butonlardan yeni Suite veya Case ekleyebilirsiniz.</p>
                </div>
              ) : (
                tree.map((node) => renderSuiteNode(node, 0))
              )}
            </>
          );
        })()}
      </div>
    </aside>
  );
};

