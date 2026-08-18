'use client';

import React, { useState } from 'react';
import { SuiteTreeNode, TestCase, Priority, TestType } from '@/services/api';
import {
  FolderOpen,
  Folder,
  FolderPlus,
  Plus,
  Play,
  Search,
  CheckCircle2,
  XCircle,
  SkipForward,
  Slash,
  FileCode2,
  ListOrdered,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  X,
  Layers,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

interface SuiteCasesViewProps {
  suite: SuiteTreeNode | null;
  allSuites?: SuiteTreeNode[];
  onSelectCase: (testCase: TestCase) => void;
  onSelectSuite?: (suite: SuiteTreeNode) => void;
  onAddSubSuite?: (parentSuiteId: string) => void;
  onAddCaseInSuite: (suiteId: string) => void;
  onRunCase?: (testCase: TestCase) => void;
  onRunSuite?: (suite: SuiteTreeNode) => void;
  onClose?: () => void;
  onBack?: () => void;
}

type StatusFilter = 'ALL' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'UNTESTED';

export const SuiteCasesView: React.FC<SuiteCasesViewProps> = ({
  suite,
  allSuites = [],
  onSelectCase,
  onSelectSuite,
  onAddSubSuite,
  onAddCaseInSuite,
  onRunCase,
  onRunSuite,
  onClose,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  if (!suite) return null;

  const testCases = suite.testCases || [];
  const childSuites = suite.children || [];

  // Calculate suite stats
  const stats = {
    total: testCases.length,
    passed: testCases.filter((c) => c.results && c.results.length > 0 && c.results[0].status === 'PASSED').length,
    failed: testCases.filter((c) => c.results && c.results.length > 0 && c.results[0].status === 'FAILED').length,
    blocked: testCases.filter((c) => c.results && c.results.length > 0 && c.results[0].status === 'BLOCKED').length,
    untested: testCases.filter((c) => !c.results || c.results.length === 0).length,
  };

  const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  // Filter test cases
  const filteredCases = testCases.filter((tc) => {
    const matchesSearch = searchQuery
      ? tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tc.description && tc.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const latestStatus = tc.results && tc.results.length > 0 ? tc.results[0].status : 'UNTESTED';
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'UNTESTED'
        ? !tc.results || tc.results.length === 0
        : latestStatus === statusFilter;

    const matchesPriority = priorityFilter === 'ALL' ? true : tc.priority === priorityFilter;
    const matchesType = typeFilter === 'ALL' ? true : tc.type === typeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const getPriorityBadge = (priority: Priority) => {
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

  const getTypeBadge = (type: TestType) => {
    switch (type) {
      case 'WEB':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'MOBILE':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'API':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const renderStatusPill = (tc: TestCase) => {
    const latestResult = tc.results && tc.results.length > 0 ? tc.results[0] : null;
    if (!latestResult) {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700/50 font-mono font-medium">
          UNTESTED
        </span>
      );
    }

    switch (latestResult.status) {
      case 'PASSED':
        return (
          <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>PASSED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span
            className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 font-mono font-bold"
            title={latestResult.errorMessage || 'Test Başarısız Oldu'}
          >
            <XCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30 font-mono font-bold">
            <SkipForward className="w-3 h-3" />
            <span>SKIPPED</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-mono font-bold">
            <Slash className="w-3 h-3" />
            <span>BLOCKED</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-6 space-y-6 transition-colors duration-200">
      {/* Suite Header Section */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Önceki ekrana dön"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
                <span>Geri</span>
              </button>
            )}
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{suite.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono font-bold">
                  {stats.total} Test Case
                </span>
                {childSuites.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono font-bold">
                    {childSuites.length} Alt Klasör
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Klasör detayları, alt klasörler ve test case kartları
              </p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                // Client-side quick suite CSV export
                const BOM = '\uFEFF';
                const headers = ['Test Kodu', 'Başlık', 'Öncelik', 'Tip', 'Yürütme Türü', 'Son Durum', 'Jira Story', 'Jira Bug'];
                const rows = (suite.testCases || []).map((tc) => [
                  `"${tc.code}"`,
                  `"${(tc.title || '').replace(/"/g, '""')}"`,
                  `"${tc.priority}"`,
                  `"${tc.type}"`,
                  `"${tc.executionType || 'MANUAL'}"`,
                  `"${tc.results && tc.results.length > 0 ? tc.results[0].status : 'UNTESTED'}"`,
                  `"${tc.jiraStoryKey || ''}"`,
                  `"${tc.results && tc.results.length > 0 ? tc.results[0].jiraBugKey || '' : ''}"`,
                ]);
                const csvContent = BOM + [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Suite_${suite.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Suite Test Senaryolarını CSV Formatında İndir"
            >
              <FileCode2 className="w-4 h-4 text-emerald-500" />
              <span>Suite Raporu (CSV)</span>
            </button>

            {onRunSuite && testCases.length > 0 && (
              <button
                type="button"
                onClick={() => onRunSuite(suite)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Suite'i Koştur ({testCases.length})</span>
              </button>
            )}

            {onAddSubSuite && (
              <button
                type="button"
                onClick={() => onAddSubSuite(suite.id)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span>+ Alt Klasör Ekle</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onAddCaseInSuite(suite.id)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Case</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Başarı Oranı</span>
            <div className="text-base font-bold text-emerald-500">{passRate}%</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Passed</span>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{stats.passed}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Failed</span>
            <div className="text-base font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Blocked</span>
            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{stats.blocked}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Koşulmadı</span>
            <div className="text-base font-bold text-slate-500">{stats.untested}</div>
          </div>
        </div>
      </div>

      {/* Sub-Suites / Alt Klasörler Section */}
      {childSuites.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <Folder className="w-4 h-4 text-amber-500" />
              <span>Alt Klasörler (Sub-Suites) ({childSuites.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {childSuites.map((child) => {
              const childCasesCount = child.testCases ? child.testCases.length : 0;
              const childSubSuitesCount = child.children ? child.children.length : 0;
              return (
                <div
                  key={child.id}
                  onClick={() => onSelectSuite && onSelectSuite(child)}
                  className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                        {child.name}
                      </h4>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{childCasesCount} Case</span>
                        {childSubSuitesCount > 0 && <span>&bull; {childSubSuitesCount} Alt Klasör</span>}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toolbar & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Test Case başlığı, kod veya açıklama ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 pl-9 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center space-x-2 overflow-x-auto text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
            <option value="BLOCKED">Blocked</option>
            <option value="UNTESTED">Untested</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Tüm Öncelikler</option>
            <option value="BLOCKER">🔴 BLOCKER</option>
            <option value="CRITICAL">🟠 CRITICAL</option>
            <option value="NORMAL">🔵 NORMAL</option>
            <option value="LOW">⚪ LOW</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Tüm Tipler</option>
            <option value="WEB">🌐 WEB</option>
            <option value="MOBILE">📱 MOBILE</option>
            <option value="API">⚡ API</option>
            <option value="MANUAL">📋 MANUAL</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCases.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40 text-slate-400 dark:text-slate-500">
          <Layers className="w-10 h-10 mb-3 opacity-30 text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {childSuites.length > 0 ? 'Bu Düzeyde Test Case Bulunmuyor' : 'Test Case Bulunamadı'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {childSuites.length > 0
              ? 'Bu klasör içerisinde doğrudan tanımlı Test Case yok. Yukarıdaki alt klasörlere girebilir veya yeni case ekleyebilirsiniz.'
              : 'Bu suite içerisinde arama kriterlerinize uygun Test Case bulunmuyor veya henüz Test Case eklenmemiş.'}
          </p>
          <div className="flex items-center space-x-2 mt-4">
            {onAddSubSuite && (
              <button
                type="button"
                onClick={() => onAddSubSuite(suite.id)}
                className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                + Alt Klasör Ekle
              </button>
            )}
            <button
              type="button"
              onClick={() => onAddCaseInSuite(suite.id)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              + Yeni Test Case Oluştur
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map((tc) => (
            <div
              key={tc.id}
              onClick={() => onSelectCase(tc)}
              className="group bg-white dark:bg-slate-900/80 hover:bg-slate-50/90 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden"
            >
              {/* Card Header: Code & Badges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center space-x-1 shrink-0">
                    <FileCode2 className="w-3 h-3" />
                    <span>{tc.code}</span>
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {/* Status Pill */}
                    {renderStatusPill(tc)}

                    {/* Priority Badge */}
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold ${getPriorityBadge(
                        tc.priority
                      )}`}
                    >
                      {tc.priority}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                  {tc.title}
                </h3>

                {/* Description snippet */}
                {tc.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-normal">
                    {tc.description}
                  </p>
                )}
              </div>

              {/* Card Footer: Metadata & Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500 text-[11px]">
                  {/* Type Badge */}
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-semibold ${getTypeBadge(
                      tc.type
                    )}`}
                  >
                    {tc.type}
                  </span>

                  {/* Step Count */}
                  <span className="flex items-center space-x-0.5" title={`${tc.steps?.length || 0} Test Adımı`}>
                    <ListOrdered className="w-3 h-3" />
                    <span>{tc.steps?.length || 0}</span>
                  </span>

                  {/* Screenshot Indicator */}
                  {tc.screenshotUrl && (
                    <span className="flex items-center space-x-0.5 text-emerald-500" title="Görsel Ekli">
                      <ImageIcon className="w-3 h-3" />
                    </span>
                  )}

                  {/* Jira Story Indicator */}
                  {tc.jiraStoryKey && (
                    <span className="flex items-center space-x-0.5 text-blue-500 font-mono text-[9px]" title={`Jira: ${tc.jiraStoryKey}`}>
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{tc.jiraStoryKey}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {onRunCase && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunCase(tc);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center space-x-1 transition-all"
                      title="Test Case'i Koştur"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Run</span>
                    </button>
                  )}

                  <span className="p-1 text-slate-400 group-hover:text-blue-500 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};
