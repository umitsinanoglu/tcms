'use client';

import React, { useState } from 'react';
import { SuiteTreeNode, TestCase } from '@/services/api';
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
} from 'lucide-react';

interface ExplorerTreeProps {
  tree: SuiteTreeNode[];
  selectedCaseId: string | null;
  onSelectCase: (testCase: TestCase) => void;
  onAddSubSuite: (parentSuiteId: string) => void;
  onEditSuite?: (suite: SuiteTreeNode) => void;
  onDeleteSuite?: (suiteId: string) => void;
  onAddCaseInSuite: (suiteId: string) => void;
  onRunCase?: (testCase: TestCase) => void;
  onReorderSuite?: (suiteId: string, targetParentId: string | null, newOrder: number) => void;
}

export const ExplorerTree: React.FC<ExplorerTreeProps> = ({
  tree,
  selectedCaseId,
  onSelectCase,
  onAddSubSuite,
  onEditSuite,
  onDeleteSuite,
  onAddCaseInSuite,
  onRunCase,
  onReorderSuite,
}) => {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedSuiteId, setDraggedSuiteId] = useState<string | null>(null);
  const [dragOverSuiteId, setDragOverSuiteId] = useState<string | null>(null);

  const toggleExpand = (suiteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedMap((prev) => ({ ...prev, [suiteId]: !prev[suiteId] }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'BLOCKER':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'CRITICAL':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'NORMAL':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'LOW':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'WEB':
        return 'text-emerald-400';
      case 'MOBILE':
        return 'text-purple-400';
      case 'API':
        return 'text-cyan-400';
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
            className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold"
            title={`Sonuç: PASSED (${latestResult?.executedAt ? new Date(latestResult.executedAt).toLocaleTimeString() : ''})`}
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>PASS</span>
          </span>
        );
      case 'FAILED':
        return (
          <span
            className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-mono font-bold"
            title={`Sonuç: FAILED ${latestResult?.errorMessage ? `- ${latestResult.errorMessage}` : ''}`}
          >
            <XCircle className="w-2.5 h-2.5" />
            <span>FAIL</span>
          </span>
        );
      case 'SKIPPED':
        return (
          <span
            className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30 font-mono font-bold"
            title="Sonuç: SKIPPED"
          >
            <SkipForward className="w-2.5 h-2.5" />
            <span>SKIP</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span
            className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono font-bold"
            title="Sonuç: BLOCKED"
          >
            <Slash className="w-2.5 h-2.5" />
            <span>BLOCK</span>
          </span>
        );
      default:
        return (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700/50 font-mono"
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

  const handleDragOver = (e: React.DragEvent, suiteId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedSuiteId !== suiteId) {
      setDragOverSuiteId(suiteId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetSuiteId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSuiteId(null);
    if (draggedSuiteId && draggedSuiteId !== targetSuiteId && onReorderSuite) {
      onReorderSuite(draggedSuiteId, targetSuiteId, 0);
      setDraggedSuiteId(null);
    }
  };

  const renderSuiteNode = (node: SuiteTreeNode, depth: number = 0) => {
    const isExpanded = expandedMap[node.id] ?? true;
    const isDragOver = dragOverSuiteId === node.id;

    // Filter testcases if search query exists
    const filteredCases = searchQuery
      ? node.testCases.filter(
          (c) =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : node.testCases;

    return (
      <div key={node.id} className="select-none">
        {/* Suite Header Item */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDrop={(e) => handleDrop(e, node.id)}
          onDragLeave={() => setDragOverSuiteId(null)}
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg transition-colors cursor-pointer text-xs font-medium ${
            isDragOver
              ? 'bg-blue-600/30 border border-blue-500'
              : 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
          }`}
          onClick={(e) => toggleExpand(node.id, e)}
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="opacity-0 group-hover:opacity-40 cursor-grab hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3" />
            </span>

            <button
              onClick={(e) => toggleExpand(node.id, e)}
              className="p-0.5 text-slate-400 hover:text-white rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-400/80 shrink-0" />
            )}

            <span className="truncate font-semibold text-slate-200">{node.name}</span>
            <span className="text-[10px] text-slate-500 font-mono ml-1">
              ({node.testCases.length})
            </span>
          </div>

          {/* Quick Actions for Suite */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddSubSuite(node.id);
              }}
              title="Alt Suite Ekle"
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-400"
            >
              <Folder className="w-3 h-3" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddCaseInSuite(node.id);
              }}
              title="Test Case Ekle"
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400"
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
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-300"
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
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400"
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
                      ? 'bg-blue-600/20 text-blue-300 font-semibold border-l-2 border-blue-500 shadow-inner'
                      : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${getTypeBadge(tc.type)}`} />
                    <span className="font-mono text-[10px] text-slate-500 shrink-0 font-bold">
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
                        title="Senaryoyu Koştur (Run)"
                        className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 transition-all opacity-0 group-hover:opacity-100 font-semibold text-[10px]"
                      >
                        <Play className="w-3 h-3 fill-current text-emerald-400" />
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
    <aside className="w-80 border-r border-surface-border bg-surface/50 flex flex-col h-[calc(100vh-4rem)] select-none">
      {/* Explorer Header */}
      <div className="p-3.5 border-b border-surface-border space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Explorer</h2>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {tree.reduce((acc, curr) => acc + curr.testCases.length + curr.children.length, 0)} items
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Case or Code search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tree View Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {tree.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-500 text-xs">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p>Henüz klasör (Suite) bulunmuyor.</p>
            <p className="text-[10px] mt-1 text-slate-600">Üst bardan "Yeni Suite" ekleyebilirsiniz.</p>
          </div>
        ) : (
          tree.map((node) => renderSuiteNode(node, 0))
        )}
      </div>
    </aside>
  );
};
