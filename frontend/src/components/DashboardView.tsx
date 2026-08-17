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
  const filteredSuites = flattenedSuites.filter((s) =>
    s.fullPath.toLowerCase().includes(suiteSearch.toLowerCase())
  );

  // Calculate Metrics
  const totalCases = testCases.length;
  const automatedCases = testCases.filter((tc) => tc.type !== 'MANUAL').length;
  const automatedRatio = totalCases > 0 ? Math.round((automatedCases / totalCases) * 100) : 0;
  const jiraLinkedCases = testCases.filter((tc) => Boolean(tc.jiraStoryKey)).length;
  const traceabilityRatio = totalCases > 0 ? Math.round((jiraLinkedCases / totalCases) * 100) : 0;

  // Status metrics from latest result
  let passedCount = 0;
  let failedCount = 0;
  let blockedCount = 0;
  let skippedCount = 0;
  let untestedCount = 0;

  testCases.forEach((tc) => {
    const latest = tc.results && tc.results.length > 0 ? tc.results[0] : null;
    if (!latest) {
      untestedCount++;
    } else {
      switch (latest.status) {
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
          break;
      }
    }
  });

  const executedCount = passedCount + failedCount + blockedCount + skippedCount;
  const passRate = executedCount > 0 ? Math.round((passedCount / executedCount) * 100) : 0;

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
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Top Dashboard (Yüksek Seviye Görünüm)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              [{project.key}] {project.name} &bull; {flattenedSuites.length} Test Suite &bull; {totalCases} Test Case
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Sub Tab Switcher */}
          <div className="flex items-center bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setDashboardTab('SUITES')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                dashboardTab === 'SUITES'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
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
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
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
              <span>+ Yeni Suite Ekle</span>
            </button>
          )}
          <button
            onClick={onOpenNewCase}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5 text-blue-500" />
            <span>+ Yeni Case Ekle</span>
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

      {/* Main Content Tab 1: SUITE CARDS GRID VIEW */}
      {dashboardTab === 'SUITES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <FolderKanban className="w-4 h-4 text-rose-500" />
                <span>Tüm Test Suite'leri (Kart Görünümü)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Projede tanımlı tüm suite'lerin test sayıları, durumları ve hızlı aksiyonları.
              </p>
            </div>

            <input
              type="text"
              placeholder="Suite adı veya yolu ile filtrele..."
              value={suiteSearch}
              onChange={(e) => setSuiteSearch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 w-full sm:w-64"
            />
          </div>

          {filteredSuites.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40 text-slate-400 text-xs">
              Kriterlere uygun test suite bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  <div
                    key={s.id}
                    className="group bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
                  >
                    {/* Suite Header */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-rose-500 dark:text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 truncate max-w-[200px]">
                          {s.fullPath}
                        </span>
                        <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full shrink-0">
                          {sTotal} Case
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-500 transition-colors flex items-center justify-between">
                        <span>{s.name}</span>
                      </h3>
                    </div>

                    {/* Progress Bar & Status Badges */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Koşu Başarı Oranı</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">%{sPassRate}</span>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                        <div className="bg-emerald-500 h-full" style={{ width: `${sTotal ? (sPassed / sTotal) * 100 : 0}%` }} title={`Passed: ${sPassed}`} />
                        <div className="bg-rose-500 h-full" style={{ width: `${sTotal ? (sFailed / sTotal) * 100 : 0}%` }} title={`Failed: ${sFailed}`} />
                        <div className="bg-purple-500 h-full" style={{ width: `${sTotal ? (sBlocked / sTotal) * 100 : 0}%` }} title={`Blocked: ${sBlocked}`} />
                        <div className="bg-slate-400 h-full" style={{ width: `${sTotal ? (sSkipped / sTotal) * 100 : 0}%` }} title={`Skipped: ${sSkipped}`} />
                      </div>

                      {/* Suite Mini Legend */}
                      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono pt-1">
                        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-1 rounded border border-emerald-500/20">
                          <span className="font-bold">{sPassed}</span> Pass
                        </div>
                        <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 p-1 rounded border border-rose-500/20">
                          <span className="font-bold">{sFailed}</span> Fail
                        </div>
                        <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 p-1 rounded border border-purple-500/20">
                          <span className="font-bold">{sBlocked}</span> Block
                        </div>
                        <div className="bg-slate-500/10 text-slate-500 p-1 rounded border border-slate-500/20">
                          <span className="font-bold">{sUntested}</span> Untested
                        </div>
                      </div>
                    </div>

                    {/* Suite Footer & Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {sBlockerCritical > 0 ? (
                          <span className="text-rose-500 font-semibold">{sBlockerCritical} Kritik Case</span>
                        ) : (
                          'Normal Öncelik'
                        )}
                      </span>

                      <div className="flex items-center space-x-2">
                        {s.allCases.length > 0 && onSelectCase && (
                          <button
                            onClick={() => onSelectCase(s.allCases[0])}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                          >
                            <span>İncele</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={onOpenManualRun}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Koştur</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
