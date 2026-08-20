import React, { useState } from 'react';
import { TestCase, Project, SuiteTreeNode } from '@/services/api';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Slash,
  Layers,
  FileCheck,
  TrendingUp,
  Activity,
  Play,
  Zap,
  ShieldCheck,
  Globe,
  Smartphone,
  Code,
  FolderKanban,
  ChevronRight,
  ExternalLink,
  FolderPlus,
  FilePlus,
} from 'lucide-react';

interface DashboardViewProps {
  project: Project | null;
  testCases: TestCase[];
  suites?: SuiteTreeNode[];
  onOpenManualRun: () => void;
  onOpenNewCase: () => void;
  onOpenNewSuite?: () => void;
  onSelectCase?: (testCase: TestCase) => void;
  onSelectSuite?: (suite: SuiteTreeNode) => void;
  onNavigateToReports?: () => void;
}

interface FlattenedSuite {
  id: string;
  name: string;
  fullPath: string;
  testCases: TestCase[];
  allCases: TestCase[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  testCases,
  suites = [],
  onOpenManualRun,
  onOpenNewCase,
  onOpenNewSuite,
  onSelectCase,
  onSelectSuite,
  onNavigateToReports,
}) => {
  const [dashboardTab, setDashboardTab] = useState<'SUITES' | 'METRICS'>('SUITES');
  const [suiteSearch, setSuiteSearch] = useState('');

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500">
        <Layers className="w-16 h-16 mb-4 opacity-30 animate-pulse" />
        <p className="text-lg font-medium">Lütfen bir test planı seçin</p>
        <p className="text-sm text-slate-500 mt-1">Dashboard metriklerini ve Suite kartlarını görüntülemek için soldaki navigasyondan test planı seçebilirsiniz.</p>
      </div>
    );
  }

  // Flatten suites helper
  const flattenSuitesRecursive = (nodes: SuiteTreeNode[], parentPath: string = ''): FlattenedSuite[] => {
    let result: FlattenedSuite[] = [];
    nodes.forEach((node) => {
      const currentPath = parentPath ? `${parentPath} / ${node.name}` : node.name;
      
      // Get all child cases recursively
      const getChildCases = (n: SuiteTreeNode): TestCase[] => {
        let cases = n.testCases ? [...n.testCases] : [];
        if (n.children) {
          n.children.forEach((c) => {
            cases = cases.concat(getChildCases(c));
          });
        }
        return cases;
      };

      const allCasesInSuite = getChildCases(node);

      result.push({
        id: node.id,
        name: node.name,
        fullPath: currentPath,
        testCases: node.testCases || [],
        allCases: allCasesInSuite,
      });

      if (node.children && node.children.length > 0) {
        result = result.concat(flattenSuitesRecursive(node.children, currentPath));
      }
    });
    return result;
  };

  const flattenedSuites = flattenSuitesRecursive(suites);

  // Root level cases without a suite
  const rootCases = testCases.filter((tc) => !tc.suiteId);
  const displaySuites: FlattenedSuite[] = [...flattenedSuites];

  if (rootCases.length > 0) {
    displaySuites.unshift({
      id: '__root_cases__',
      name: 'Plan Test Case\'leri (Suite\'siz)',
      fullPath: `[${project.key}] / Plan Kökü`,
      testCases: rootCases,
      allCases: rootCases,
    });
  }

  const filteredSuites = displaySuites.filter((s) =>
    s.fullPath.toLowerCase().includes(suiteSearch.toLowerCase()) ||
    s.name.toLowerCase().includes(suiteSearch.toLowerCase())
  );

  // Helper to find SuiteTreeNode by id
  const findSuiteNode = (nodes: SuiteTreeNode[], id: string): SuiteTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children && node.children.length > 0) {
        const found = findSuiteNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleOpenSuiteCard = (suiteId: string) => {
    if (suiteId === '__root_cases__') {
      if (onSelectCase && rootCases.length > 0) {
        onSelectCase(rootCases[0]);
      }
      return;
    }
    const found = findSuiteNode(suites, suiteId);
    if (found && onSelectSuite) {
      onSelectSuite(found);
    } else if (onSelectCase) {
      const s = displaySuites.find((d) => d.id === suiteId);
      if (s && s.allCases.length > 0) {
        onSelectCase(s.allCases[0]);
      }
    }
  };

  // High-level statistics
  const totalCases = testCases.length;
  let passedCount = 0;
  let failedCount = 0;
  let blockedCount = 0;
  let skippedCount = 0;
  let untestedCount = 0;

  testCases.forEach((tc) => {
    const lastResult = tc.results && tc.results.length > 0 ? tc.results[0] : null;
    if (!lastResult) {
      untestedCount++;
    } else {
      switch (lastResult.status) {
        case 'PASSED':
          passedCount++;
          break;
        case 'FAILED':
          failedCount++;
          break;
        case 'BLOCKED':
          blockedCount++;
          break;
        case 'SKIPPED':
          skippedCount++;
          break;
        default:
          untestedCount++;
      }
    }
  });

  const executedCount = passedCount + failedCount + blockedCount + skippedCount;
  const passRate = executedCount > 0 ? Math.round((passedCount / executedCount) * 100) : 0;
  const automatedCount = testCases.filter((tc) => tc.type !== 'MANUAL').length;
  const automatedRatio = totalCases > 0 ? Math.round((automatedCount / totalCases) * 100) : 0;

  // Jira traceability ratio
  const jiraLinkedCount = testCases.filter((tc) => !!tc.jiraStoryKey).length;
  const traceabilityRatio = totalCases > 0 ? Math.round((jiraLinkedCount / totalCases) * 100) : 0;

  // Priority breakdown
  const blockerCount = testCases.filter((tc) => tc.priority === 'BLOCKER').length;
  const criticalCount = testCases.filter((tc) => tc.priority === 'CRITICAL').length;
  const normalCount = testCases.filter((tc) => tc.priority === 'NORMAL').length;
  const lowCount = testCases.filter((tc) => tc.priority === 'LOW').length;

  // Type breakdown
  const webCount = testCases.filter((tc) => tc.type === 'WEB').length;
  const mobileCount = testCases.filter((tc) => tc.type === 'MOBILE').length;
  const apiCount = testCases.filter((tc) => tc.type === 'API').length;

  // Recent executions list
  const recentExecutions: { testCase: TestCase; result: any }[] = [];
  testCases.forEach((tc) => {
    if (tc.results && tc.results.length > 0) {
      tc.results.forEach((res) => {
        recentExecutions.push({ testCase: tc, result: res });
      });
    }
  });
  recentExecutions.sort((a, b) => new Date(b.result.executedAt).getTime() - new Date(a.result.executedAt).getTime());
  const latestActivity = recentExecutions.slice(0, 7);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#b83a4b]/10 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              [{project.key}] {project.name} &bull; {flattenedSuites.length} Test Suite &bull; {totalCases} Test Case
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Sub Tab Switcher */}
          <div className="flex items-center bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setDashboardTab('SUITES')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                dashboardTab === 'SUITES'
                  ? 'bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white shadow-md shadow-[#821c2b]/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Test Suites ({flattenedSuites.length})</span>
            </button>
            <button
              onClick={() => setDashboardTab('METRICS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                dashboardTab === 'METRICS'
                  ? 'bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white shadow-md shadow-[#821c2b]/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Genel Analiz & Aktivite</span>
            </button>
          </div>

          {onOpenNewSuite && (
            <button
              onClick={onOpenNewSuite}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
              <span>+ Suite Ekle</span>
            </button>
          )}
          <button
            onClick={onOpenNewCase}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5 text-blue-500" />
            <span>+ Case Ekle</span>
          </button>
          <button
            onClick={onOpenManualRun}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test Run</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Cases */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Toplam Test Case</span>
            <FileCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono tracking-tight">{totalCases}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
              {automatedRatio}% Otomatik
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${automatedRatio}%` }} />
          </div>
        </div>

        {/* Card 2: Pass Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Genel Başarı Oranı</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
              {passRate}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {passedCount}/{executedCount || 1} Koşuldu
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${passRate}%` }} />
          </div>
        </div>

        {/* Card 3: Failed & Blocked */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Hata & Engel (Fail/Block)</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tracking-tight">
                {failedCount}
              </span>
              <span className="text-xs text-slate-400">Fail</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-medium">
              {blockedCount} Blocked
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
            <div className="bg-rose-500 h-full" style={{ width: `${executedCount ? (failedCount / executedCount) * 100 : 0}%` }} />
            <div className="bg-purple-500 h-full" style={{ width: `${executedCount ? (blockedCount / executedCount) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Card 4: Total Suites */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Test Suite Sayısı</span>
            <FolderKanban className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono tracking-tight">{flattenedSuites.length}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {traceabilityRatio}% Jira Bağlı
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${traceabilityRatio}%` }} />
          </div>
        </div>
      </div>

      {/* Main Content Tab 1: SUITES LIST VIEW */}
      {dashboardTab === 'SUITES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <FolderKanban className="w-4 h-4 text-[#b83a4b]" />
                <span>Tüm Test Suite'leri (Liste Görünümü)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Projede tanımlı tüm suite'lerin test sayıları, durum dağılımları ve hızlı aksiyonları.
              </p>
            </div>

            <input
              type="text"
              placeholder="Suite adı veya yolu ile filtrele..."
              value={suiteSearch}
              onChange={(e) => setSuiteSearch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#b83a4b] w-full sm:w-64 shadow-xs"
            />
          </div>

          {filteredSuites.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40 text-slate-400 text-xs">
              <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
              <p>Kriterlere uygun test suite bulunamadı.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/75 dark:bg-slate-900/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 min-w-[220px]">Test Suite & Hiyerarşik Yol</th>
                      <th className="py-3 px-3 text-center min-w-[90px]">Toplam Case</th>
                      <th className="py-3 px-4 min-w-[200px]">Son Koşu Durumu</th>
                      <th className="py-3 px-3 text-center min-w-[110px]">Başarı Oranı</th>
                      <th className="py-3 px-3 text-center min-w-[110px]">Risk / Öncelik</th>
                      <th className="py-3 px-4 text-right min-w-[140px]">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {filteredSuites.map((s) => {
                      // Calculate suite level stats
                      let sPassed = 0;
                      let sFailed = 0;
                      let sBlocked = 0;
                      let sSkipped = 0;
                      let sUntested = 0;

                      s.allCases.forEach((tc) => {
                        const lastRes = tc.results && tc.results.length > 0 ? tc.results[0] : null;
                        if (!lastRes) sUntested++;
                        else if (lastRes.status === 'PASSED') sPassed++;
                        else if (lastRes.status === 'FAILED') sFailed++;
                        else if (lastRes.status === 'BLOCKED') sBlocked++;
                        else if (lastRes.status === 'SKIPPED') sSkipped++;
                        else sUntested++;
                      });

                      const sTotal = s.allCases.length;
                      const sExecuted = sPassed + sFailed + sBlocked + sSkipped;
                      const sPassRate = sExecuted > 0 ? Math.round((sPassed / sExecuted) * 100) : 0;
                      const sBlockerCritical = s.allCases.filter((tc) => tc.priority === 'BLOCKER' || tc.priority === 'CRITICAL').length;

                      return (
                        <tr
                          key={s.id}
                          onClick={() => handleOpenSuiteCard(s.id)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                        >
                          {/* Suite Name & Path */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-start space-x-2.5 min-w-0">
                              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0 group-hover:scale-105 transition-transform">
                                <FolderKanban className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#b83a4b] transition-colors truncate">
                                  {s.name}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate mt-0.5" title={s.fullPath}>
                                  {s.fullPath}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Case Count */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {sTotal}
                            </span>
                          </td>

                          {/* Status Progress & Chips */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1.5 max-w-xs">
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex shadow-inner">
                                <div className="bg-emerald-500 h-full" style={{ width: `${sTotal ? (sPassed / sTotal) * 100 : 0}%` }} title={`Passed: ${sPassed}`} />
                                <div className="bg-[#b83a4b] h-full" style={{ width: `${sTotal ? (sFailed / sTotal) * 100 : 0}%` }} title={`Failed: ${sFailed}`} />
                                <div className="bg-amber-500 h-full" style={{ width: `${sTotal ? (sBlocked / sTotal) * 100 : 0}%` }} title={`Blocked: ${sBlocked}`} />
                                <div className="bg-slate-400 h-full" style={{ width: `${sTotal ? (sSkipped / sTotal) * 100 : 0}%` }} title={`Skipped: ${sSkipped}`} />
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] font-mono">
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{sPassed} Pass</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-[#b83a4b] dark:text-[#d66b7a] font-semibold">{sFailed} Fail</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">{sBlocked} Block</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-slate-400">{sUntested} Beklemede</span>
                              </div>
                            </div>
                          </td>

                          {/* Pass Rate */}
                          <td className="py-3.5 px-3 text-center">
                            {sExecuted === 0 ? (
                              <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                Koşulmadı
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center font-mono font-bold text-xs px-2 py-0.5 rounded-lg border ${
                                  sPassRate >= 80
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                    : sPassRate >= 50
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                    : 'bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] border-[#b83a4b]/30'
                                }`}
                              >
                                %{sPassRate}
                              </span>
                            )}
                          </td>

                          {/* Priority & Risk */}
                          <td className="py-3.5 px-3 text-center">
                            {sBlockerCritical > 0 ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/30 font-mono">
                                <span>{sBlockerCritical} Kritik</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400">Normal</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenSuiteCard(s.id);
                                }}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                                title="Suite Detayına Git"
                              >
                                <span>Aç</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenManualRun();
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-1 cursor-pointer active:scale-95"
                                title="Hızlı Koş"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Koş</span>
                              </button>
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
        </div>
      )}

      {/* Main Content Tab 2: METRICS & RECENT ACTIVITY */}
      {dashboardTab === 'METRICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Distribution */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span>Test Durumu Genel Dağılımı</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{totalCases} Test Case</span>
              </div>

              {/* Big Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-xl overflow-hidden flex shadow-inner">
                  <div className="bg-emerald-500 h-full" style={{ width: `${totalCases ? (passedCount / totalCases) * 100 : 0}%` }} title={`Passed: ${passedCount}`} />
                  <div className="bg-rose-500 h-full" style={{ width: `${totalCases ? (failedCount / totalCases) * 100 : 0}%` }} title={`Failed: ${failedCount}`} />
                  <div className="bg-purple-500 h-full" style={{ width: `${totalCases ? (blockedCount / totalCases) * 100 : 0}%` }} title={`Blocked: ${blockedCount}`} />
                  <div className="bg-slate-400 h-full" style={{ width: `${totalCases ? (skippedCount / totalCases) * 100 : 0}%` }} title={`Skipped: ${skippedCount}`} />
                </div>

                {/* Badges Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="flex items-center justify-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PASSED</span>
                    </div>
                    <span className="text-lg font-mono font-extrabold text-emerald-700 dark:text-emerald-300">{passedCount}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <div className="flex items-center justify-center space-x-1 text-rose-600 dark:text-rose-400 font-bold text-xs">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>FAILED</span>
                    </div>
                    <span className="text-lg font-mono font-extrabold text-rose-700 dark:text-rose-300">{failedCount}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <div className="flex items-center justify-center space-x-1 text-purple-600 dark:text-purple-400 font-bold text-xs">
                      <Slash className="w-3.5 h-3.5" />
                      <span>BLOCKED</span>
                    </div>
                    <span className="text-lg font-mono font-extrabold text-purple-700 dark:text-purple-300">{blockedCount}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
                    <div className="flex items-center justify-center space-x-1 text-slate-600 dark:text-slate-400 font-bold text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>UNTESTED</span>
                    </div>
                    <span className="text-lg font-mono font-extrabold text-slate-700 dark:text-slate-300">{untestedCount}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <div className="flex items-center justify-center space-x-1 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      <Zap className="w-3.5 h-3.5" />
                      <span>KOŞULDU</span>
                    </div>
                    <span className="text-lg font-mono font-extrabold text-blue-700 dark:text-blue-300">{executedCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority & Platform Type breakdown */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                Öncelik & Platform Dağılımı
              </h3>

              <div className="space-y-3 text-xs">
                {/* Priority Bars */}
                <div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span>Blocker & Critical</span>
                    <span className="font-mono font-bold text-rose-500">{blockerCount + criticalCount} case</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${totalCases ? ((blockerCount + criticalCount) / totalCases) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span>Normal & Low</span>
                    <span className="font-mono font-bold text-blue-500">{normalCount + lowCount} case</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${totalCases ? ((normalCount + lowCount) / totalCases) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Platform types */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                    <Globe className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Web</span>
                    <p className="font-mono font-bold">{webCount}</p>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                    <Smartphone className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Mobile</span>
                    <p className="font-mono font-bold">{mobileCount}</p>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                    <Code className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">API</span>
                    <p className="font-mono font-bold">{apiCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Recent Execution Feed */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Son Test Koşuları Aktivitesi</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Son {latestActivity.length} aktivite</span>
            </div>

            {latestActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                Henüz test koşusu yapılmadı. "Test Run" butonu ile ilk test koşunuzu başlatabilirsiniz.
              </div>
            ) : (
              <div className="space-y-2">
                {latestActivity.map(({ testCase, result }, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectCase && onSelectCase(testCase)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/50 transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {result.status === 'PASSED' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] shrink-0">
                          PASS
                        </span>
                      )}
                      {result.status === 'FAILED' && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 font-mono font-bold text-[10px] shrink-0">
                          FAIL
                        </span>
                      )}
                      {result.status === 'BLOCKED' && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-mono font-bold text-[10px] shrink-0">
                          BLOCK
                        </span>
                      )}
                      {result.status === 'SKIPPED' && (
                        <span className="px-2 py-0.5 rounded bg-slate-500/20 text-slate-600 dark:text-slate-400 font-mono font-bold text-[10px] shrink-0">
                          SKIP
                        </span>
                      )}

                      <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0">{testCase.code}</span>
                      <span className="font-medium truncate text-slate-700 dark:text-slate-200">{testCase.title}</span>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 text-[11px] text-slate-400 font-mono">
                      <span>{new Date(result.executedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      {result.executedBy && <span className="hidden sm:inline text-slate-500">by {result.executedBy}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
