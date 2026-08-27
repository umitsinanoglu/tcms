import React, { useState } from 'react';
import { SuiteTreeNode, TestCase, Priority, TestType } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
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
  Eye,
  Settings2,
  Check,
  Filter,
  FileText,
} from 'lucide-react';

interface SuiteCasesViewProps {
  suite: SuiteTreeNode | null;
  allSuites?: SuiteTreeNode[];
  onSelectCase: (testCase: TestCase) => void;
  onSelectSuite?: (suite: SuiteTreeNode) => void;
  onAddSubSuite?: (parentSuiteId: string) => void;
  onAddCaseInSuite: (suiteId: string) => void;
  onRunCase?: (testCase: TestCase, version?: string, environment?: string) => void;
  onClose?: () => void;
  onBack?: () => void;
}

type StatusFilter = 'ALL' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'UNTESTED';

const PRESET_VERSIONS = ['v1.0.0', 'v1.1.0', 'v1.2.0', 'v2.0.0', 'v2.4.0-rc1'];
const PRESET_ENVIRONMENTS = ['STAGING', 'DEV', 'TEST', 'UAT', 'PROD'];

export const SuiteCasesView: React.FC<SuiteCasesViewProps> = ({
  suite,
  allSuites = [],
  onSelectCase,
  onSelectSuite,
  onAddSubSuite,
  onAddCaseInSuite,
  onRunCase,
  onClose,
  onBack,
}) => {
  const { can, isViewer } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Suite default version and environment
  const [defaultVersion, setDefaultVersion] = useState('v1.0.0');
  const [defaultEnvironment, setDefaultEnvironment] = useState('STAGING');

  // Per-testcase custom version and environment overrides
  const [caseVersions, setCaseVersions] = useState<Record<string, string>>({});
  const [caseEnvironments, setCaseEnvironments] = useState<Record<string, string>>({});

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
        return 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/60 shadow-xs';
      case 'CRITICAL':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 shadow-xs';
      case 'NORMAL':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 shadow-xs';
      case 'LOW':
        return 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 shadow-xs';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 shadow-xs';
    }
  };

  const getTypeBadge = (type: TestType) => {
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
  };

  const renderStatusPill = (tc: TestCase) => {
    const latestResult = tc.results && tc.results.length > 0 ? tc.results[0] : null;
    if (!latestResult) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono font-medium">
          UNTESTED
        </span>
      );
    }

    switch (latestResult.status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>PASSED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-mono font-bold"
            title={latestResult.errorMessage || 'Test Başarısız Oldu'}
          >
            <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
            <span>FAILED</span>
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30 font-mono font-bold">
            <SkipForward className="w-3 h-3 text-slate-400 shrink-0" />
            <span>SKIPPED</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono font-bold">
            <Slash className="w-3 h-3 text-amber-500 shrink-0" />
            <span>BLOCKED</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleApplyDefaultSettingsToAll = () => {
    const newVersions: Record<string, string> = {};
    const newEnvironments: Record<string, string> = {};
    testCases.forEach((tc) => {
      newVersions[tc.id] = defaultVersion;
      newEnvironments[tc.id] = defaultEnvironment;
    });
    setCaseVersions(newVersions);
    setCaseEnvironments(newEnvironments);
  };

  const getCaseVersion = (caseId: string) => {
    return caseVersions[caseId] || defaultVersion;
  };

  const getCaseEnvironment = (caseId: string) => {
    return caseEnvironments[caseId] || defaultEnvironment;
  };

  const handleRunTestCaseRow = (tc: TestCase) => {
    const version = getCaseVersion(tc.id);
    const environment = getCaseEnvironment(tc.id);
    if (onRunCase) {
      onRunCase(tc, version, environment);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 space-y-6 transition-colors duration-200 min-w-0">
      {/* Suite Header Section */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                title="Önceki ekrana dön"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
                <span>Geri</span>
              </button>
            )}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
              suite.id === '__root_cases__'
                ? 'bg-[#b83a4b]/10 text-[#b83a4b] dark:text-[#d66b7a] border-[#b83a4b]/20'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
              {suite.id === '__root_cases__' ? <FileText className="w-6 h-6" /> : <FolderOpen className="w-6 h-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{suite.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono font-bold shrink-0">
                  {stats.total} Test Case
                </span>
                {childSuites.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono font-bold shrink-0">
                    {childSuites.length} Alt Klasör
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {suite.id === '__root_cases__'
                  ? "Herhangi bir test suite'e bağlı olmayan kök test case listesi ve koşu yönetimi"
                  : "Suite içindeki test case listesi, versiyon/ortam seçimi ve koşu yönetimi"}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 shrink-0">
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
                a.download = `${suite.id === '__root_cases__' ? 'Kok_Test_Caseleri' : `Suite_${suite.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`}_Report.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Test Senaryolarını CSV Formatında İndir"
            >
              <FileCode2 className="w-4 h-4 text-emerald-500" />
              <span>Rapor (CSV)</span>
            </button>

            {suite.id !== '__root_cases__' && onAddSubSuite && can('CREATE_SUITE') && (
              <button
                type="button"
                onClick={() => onAddSubSuite(suite.id)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span>+ Alt Klasör Ekle</span>
              </button>
            )}

            {can('CREATE_CASE') && (
              <button
                type="button"
                onClick={() => onAddCaseInSuite(suite.id === '__root_cases__' ? '' : suite.id)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#b83a4b] hover:bg-[#a32e3e] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#b83a4b]/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Case</span>
              </button>
            )}

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
            <div className="text-base font-bold text-rose-600 dark:text-rose-400">{stats.failed}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Blocked</span>
            <div className="text-base font-bold text-amber-600 dark:text-amber-400">{stats.blocked}</div>
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
                  className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all shadow-sm hover:shadow cursor-pointer flex items-center justify-between"
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

      {/* Toolbar & Filter & Batch Config Bar */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Test Case başlığı, kod veya açıklama ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
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
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
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
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              <option value="ALL">Tüm Tipler</option>
              <option value="WEB">🌐 WEB</option>
              <option value="MOBILE">📱 MOBILE</option>
              <option value="API">⚡ API</option>
              <option value="MANUAL">📋 MANUAL</option>
            </select>
          </div>
        </div>

        {/* Global/Default Suite Run Settings Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs">
          <div className="flex items-center space-x-2">
            <Settings2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Varsayılan Koşu Parametreleri:</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
              (Liste satırları için genel versiyon ve ortam şablonu)
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-medium">Versiyon:</span>
              <input
                type="text"
                value={defaultVersion}
                onChange={(e) => setDefaultVersion(e.target.value)}
                placeholder="v1.0.0"
                className="w-20 bg-transparent text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-medium">Ortam:</span>
              <select
                value={defaultEnvironment}
                onChange={(e) => setDefaultEnvironment(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {PRESET_ENVIRONMENTS.map((env) => (
                  <option key={env} value={env}>
                    {env}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleApplyDefaultSettingsToAll}
              className="flex items-center space-x-1 px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Bu versiyon ve ortamı aşağıdaki tüm test case satırlarına uygula"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Tümüne Uygula</span>
            </button>
          </div>
        </div>
      </div>

      {/* Test Cases List / Table View */}
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
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              + Yeni Test Case Oluştur
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[920px]">
              <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-[#1a2333] border-b border-slate-200 dark:border-slate-700/80 shadow-xs">
                <tr className="text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 text-center w-10">#</th>
                  <th className="py-2.5 px-3 w-28">Test Kodu</th>
                  <th className="py-2.5 px-4 min-w-[240px]">Test Case Başlığı ve Detay</th>
                  <th className="py-2.5 px-3 w-24 text-center">Öncelik</th>
                  <th className="py-2.5 px-3 w-24 text-center">Tip</th>
                  <th className="py-2.5 px-3 w-28 text-center">Son Durum</th>
                  <th className="py-2.5 px-3 w-64 text-center">Koşu Parametreleri</th>
                  <th className="py-2.5 px-4 w-44 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                {filteredCases.map((tc, index) => {
                  const currentVersion = getCaseVersion(tc.id);
                  const currentEnv = getCaseEnvironment(tc.id);

                  return (
                    <tr
                      key={tc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Index */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">
                        {index + 1}
                      </td>

                      {/* Test Code */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 inline-flex items-center space-x-1 shrink-0">
                          <FileCode2 className="w-3 h-3" />
                          <span>{tc.code}</span>
                        </span>
                      </td>

                      {/* Title & Details */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div
                            onClick={() => onSelectCase(tc)}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors text-xs leading-snug line-clamp-2"
                            title="Detayları İncelemek İçin Tıklayın"
                          >
                            {tc.title}
                          </div>

                          {tc.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {tc.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-2 pt-0.5 text-[10px] text-slate-400">
                            {/* Step Count */}
                            <span className="flex items-center space-x-1" title={`${tc.steps?.length || 0} Test Adımı`}>
                              <ListOrdered className="w-3 h-3" />
                              <span>{tc.steps?.length || 0} Adım</span>
                            </span>

                            {/* Screenshot Indicator */}
                            {tc.screenshotUrl && (
                              <span className="flex items-center space-x-0.5 text-emerald-500 font-semibold" title="Görsel Ekli">
                                <ImageIcon className="w-3 h-3" />
                                <span>Görsel</span>
                              </span>
                            )}

                            {/* Jira Story Indicator */}
                            {tc.jiraStoryKey && (
                              <span className="flex items-center space-x-0.5 text-blue-500 font-mono font-semibold" title={`Jira: ${tc.jiraStoryKey}`}>
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>{tc.jiraStoryKey}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full border font-mono font-bold inline-block ${getPriorityBadge(
                            tc.priority
                          )}`}
                        >
                          {tc.priority}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full border font-mono font-semibold inline-block ${getTypeBadge(
                            tc.type
                          )}`}
                        >
                          {tc.type}
                        </span>
                      </td>

                      {/* Latest Status */}
                      <td className="py-3 px-3 text-center">
                        {renderStatusPill(tc)}
                      </td>

                      {/* Run Parameters (Version & Environment) */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Version Input/Select */}
                          <div className="relative">
                            <input
                              type="text"
                              value={currentVersion}
                              onChange={(e) =>
                                setCaseVersions((prev) => ({
                                  ...prev,
                                  [tc.id]: e.target.value,
                                }))
                              }
                              placeholder="v1.0.0"
                              title="Versiyon Numarası"
                              className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2 py-1 text-[11px] font-mono font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 text-center"
                            />
                          </div>

                          {/* Environment Select */}
                          <div className="relative">
                            <select
                              value={currentEnv}
                              onChange={(e) =>
                                setCaseEnvironments((prev) => ({
                                  ...prev,
                                  [tc.id]: e.target.value,
                                }))
                              }
                              title="Test Ortamı"
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                            >
                              {PRESET_ENVIRONMENTS.map((env) => (
                                <option key={env} value={env}>
                                  {env}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* Action Buttons ("İncele" & "Koştur") */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* "İncele" Butonu */}
                          <button
                            type="button"
                            onClick={() => onSelectCase(tc)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer"
                            title="Test Case Detaylarını İncele ve Düzenle"
                          >
                            <Eye className="w-3.5 h-3.5 text-rose-500" />
                            <span>İncele</span>
                          </button>

                          {/* "Koştur" Butonu */}
                          {onRunCase && can('EXECUTE_RUN') && (
                            <button
                              type="button"
                              onClick={() => handleRunTestCaseRow(tc)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                              title={`${currentVersion} versiyonu ve ${currentEnv} ortamında test koşusunu başlat`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Koştur</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
};
