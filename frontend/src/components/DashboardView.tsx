import React, { useState, useMemo } from 'react';
import { TestCase, Project, SuiteTreeNode, TestPlan, TestRun, TestResult } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
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
  Globe,
  Smartphone,
  Code,
  FolderKanban,
  ChevronRight,
  ExternalLink,
  FolderPlus,
  FilePlus,
  Calendar,
  Plus,
  Search,
  ArrowUpRight,
  Bug,
  Filter,
  PieChart,
  ShieldCheck,
  Cpu,
  Terminal,
  HelpCircle,
  Bell,
  MoreVertical,
  Check,
  AlertTriangle,
  FileText,
  Settings,
  Database,
} from 'lucide-react';

interface DashboardViewProps {
  project: Project | null;
  projects?: Project[];
  testCases: TestCase[];
  suites?: SuiteTreeNode[];
  testPlans?: TestPlan[];
  testRuns?: TestRun[];
  testPlansCount?: number;
  onOpenManualRun: () => void;
  onOpenNewCase: () => void;
  onOpenNewPlan?: () => void;
  onSelectCase?: (testCase: TestCase) => void;
  onSelectPlan?: (plan: TestPlan) => void;
  onSelectRun?: (run: TestRun) => void;
  onNavigateToPlans?: () => void;
  onNavigateToExplorer?: () => void;
  onNavigateToRuns?: () => void;
  onNavigateToReports?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  projects = [],
  testCases,
  suites = [],
  testPlans = [],
  testRuns = [],
  testPlansCount = 0,
  onOpenManualRun,
  onOpenNewCase,
  onOpenNewPlan,
  onSelectCase,
  onSelectPlan,
  onSelectRun,
  onNavigateToPlans,
  onNavigateToExplorer,
  onNavigateToRuns,
  onNavigateToReports,
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [distributionRange, setDistributionRange] = useState<'1D' | '7D' | '30D' | 'ALL'>('7D');

  // Recent test cases with last result (Hooks must be called unconditionally at top level)
  const recentCases = useMemo(() => {
    return [...testCases]
      .filter((tc) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          tc.code.toLowerCase().includes(q) ||
          tc.title.toLowerCase().includes(q) ||
          (tc.suite?.name && tc.suite.name.toLowerCase().includes(q))
        );
      })
      .slice(0, 6);
  }, [testCases, searchQuery]);

  // Recent test plans with linked execution rate
  const recentPlans = useMemo(() => {
    return [...testPlans]
      .filter((p) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || (p.version && p.version.toLowerCase().includes(q));
      })
      .slice(0, 5);
  }, [testPlans, searchQuery]);

  // Recent test runs (executions)
  const recentRuns = useMemo(() => {
    return [...testRuns].slice(0, 5);
  }, [testRuns]);

  // Distribution calculation filtered by time range (1D, 7D, 30D, ALL)
  const distributionStats = useMemo(() => {
    const now = Date.now();
    let passed = 0;
    let failed = 0;
    let blocked = 0;
    let skipped = 0;
    let total = 0;

    testCases.forEach((tc) => {
      const lastResult = tc.results && tc.results.length > 0 ? tc.results[0] : null;
      if (!lastResult) return;

      const dateStr = lastResult.executedAt || tc.updatedAt || new Date().toISOString();
      const dateMs = new Date(dateStr).getTime();
      const diffDays = (now - dateMs) / (1000 * 3600 * 24);

      let inRange = true;
      if (distributionRange === '1D') inRange = diffDays <= 1;
      else if (distributionRange === '7D') inRange = diffDays <= 7;
      else if (distributionRange === '30D') inRange = diffDays <= 30;

      if (inRange) {
        total++;
        switch (lastResult.status) {
          case 'PASSED':
            passed++;
            break;
          case 'FAILED':
            failed++;
            break;
          case 'BLOCKED':
            blocked++;
            break;
          case 'SKIPPED':
            skipped++;
            break;
        }
      }
    });

    // Fallback if no filtered runs in selected window
    if (total === 0 && testCases.length > 0) {
      testCases.forEach((tc) => {
        const lastResult = tc.results && tc.results.length > 0 ? tc.results[0] : null;
        if (!lastResult) return;
        total++;
        if (lastResult.status === 'PASSED') passed++;
        else if (lastResult.status === 'FAILED') failed++;
        else if (lastResult.status === 'BLOCKED') blocked++;
        else if (lastResult.status === 'SKIPPED') skipped++;
      });
    }

    const denom = total > 0 ? total : 1;
    return {
      total,
      passed,
      failed,
      blocked,
      skipped,
      passPercent: Math.round((passed / denom) * 100),
      failPercent: Math.round((failed / denom) * 100),
      blockedPercent: Math.round((blocked / denom) * 100),
      skippedPercent: Math.round((skipped / denom) * 100),
    };
  }, [testCases, distributionRange]);

  // Project fallback - Placed after all hook definitions
  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500">
        <Layers className="w-16 h-16 mb-4 opacity-30 animate-pulse" />
        <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">Lütfen bir Test Projesi seçin</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Dashboard metriklerini ve test süreçlerini görüntülemek için üst menüden bir proje seçebilirsiniz.
        </p>
      </div>
    );
  }

  // --- Statistics Calculation ---
  const totalCases = testCases.length;
  let passedCount = 0;
  let failedCount = 0;
  let blockedCount = 0;
  let skippedCount = 0;
  let untestedCount = 0;

  // Track fail counts per test case
  const failureCountMap = new Map<string, { tc: TestCase; failCount: number }>();

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

    if (tc.results && tc.results.length > 0) {
      const fails = tc.results.filter((r) => r.status === 'FAILED').length;
      if (fails > 0) {
        failureCountMap.set(tc.id, { tc, failCount: fails });
      }
    }
  });

  const executedCount = passedCount + failedCount + blockedCount + skippedCount;
  const passRate = executedCount > 0 ? Math.round((passedCount / executedCount) * 100) : 0;
  const automatedCount = testCases.filter((tc) => tc.executionType === 'AUTOMATION' || tc.type !== 'MANUAL').length;
  const automatedRatio = totalCases > 0 ? Math.round((automatedCount / totalCases) * 100) : 0;

  const totalProjectsCount = projects.length > 0 ? projects.length : 1;
  const activeProjectsCount = totalProjectsCount;
  const archivedProjectsCount = 0;

  const totalPlansCount = testPlans.length || testPlansCount || 0;
  const activePlansCount = testPlans.filter((p) => p.status === 'ACTIVE').length || (totalPlansCount > 0 ? totalPlansCount : 0);
  const completedPlansCount = testPlans.filter((p) => p.status === 'COMPLETED').length;

  const totalRunsCount = testRuns.length;

  // Top failing test cases (top 4)
  const topFailingCases = Array.from(failureCountMap.values())
    .sort((a, b) => b.failCount - a.failCount)
    .slice(0, 4);

  const displayedFailingCases =
    topFailingCases.length > 0
      ? topFailingCases
      : testCases
          .filter((tc) => tc.results?.[0]?.status === 'FAILED')
          .slice(0, 3)
          .map((tc) => ({ tc, failCount: 1 }));

  const maxFailCount = displayedFailingCases.length > 0 ? Math.max(...displayedFailingCases.map((f) => f.failCount), 1) : 1;

  // Helper for framework badges & icons
  const getAutomationBadge = (tc: TestCase) => {
    const title = tc.title.toLowerCase();
    const code = tc.code.toLowerCase();

    if (tc.executionType === 'MANUAL' || tc.type === 'MANUAL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="text-xs">👤</span>
          <span>Manuel</span>
        </span>
      );
    }
    if (title.includes('playwright') || code.includes('pw') || tc.type === 'WEB') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 dark:bg-slate-400 shrink-0"></span>
          <span>Playwright</span>
        </span>
      );
    }
    if (title.includes('appium') || title.includes('webdriver') || tc.type === 'MOBILE' || tc.type === 'IOS' || tc.type === 'ANDROID') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 dark:bg-slate-400 shrink-0"></span>
          <span>WebdriverIO</span>
        </span>
      );
    }
    if (tc.type === 'API') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 dark:bg-slate-400 shrink-0"></span>
          <span>Postman / REST</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 dark:bg-slate-400 shrink-0"></span>
        <span>Otomasyon</span>
      </span>
    );
  };

  // Helper for Result Status Badge
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>PASS</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>FAIL</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>BLOCKED</span>
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30">
            <Slash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>SKIPPED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>UNTESTED</span>
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '25.05.2024 14:30';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('tr-TR')} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  // SVG Donut Calculations (radius = 38, circumference = 238.76)
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const donutDenom = distributionStats.total > 0 ? distributionStats.total : 1;
  const passStroke = (distributionStats.passed / donutDenom) * circ;
  const failStroke = (distributionStats.failed / donutDenom) * circ;
  const skippedStroke = (distributionStats.skipped / donutDenom) * circ;
  const blockedStroke = (distributionStats.blocked / donutDenom) * circ;

  const failOffset = -passStroke;
  const skippedOffset = -(passStroke + failStroke);
  const blockedOffset = -(passStroke + failStroke + skippedStroke);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#141821] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-7 space-y-5 transition-colors duration-200">
      {/* 1. Header & Search Bar (Clean Top Area without "Hızlı Koşum Başlat") */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Merhaba, {currentUser?.name?.split(' ')[0] || 'Ahmet'}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">
            Bugün neler test etmek istersin? &bull; <span className="font-semibold text-slate-800 dark:text-slate-200">[{project.key}] {project.name}</span>
          </p>
        </div>

        {/* Global Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Test planı, senaryo veya ID ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-[#1d232f] border border-slate-300 dark:border-[#2e3748] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 shadow-xs"
          />
        </div>
      </div>

      {/* 2. Top 4 Compact Metric Cards (Large Icons on the Far Left) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Projeler */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all flex items-center space-x-3.5">
          {/* Large Left Icon */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Layers className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8e9bb0]">
              Projeler
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-50 tracking-tight mt-0.5">
              {totalProjectsCount}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-[#8e9bb0] mt-0.5 flex items-center gap-1.5 truncate">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Aktif {activeProjectsCount}</span>
              <span>•</span>
              <span>Arşiv {archivedProjectsCount}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Test Planları */}
        <div
          onClick={onNavigateToPlans}
          className="p-4 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all flex items-center space-x-3.5 cursor-pointer group"
        >
          {/* Large Left Icon */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8e9bb0] group-hover:text-[var(--accent-primary)] transition-colors">
              Test Planları
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-50 tracking-tight mt-0.5">
              {totalPlansCount}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-[#8e9bb0] mt-0.5 flex items-center gap-1.5 truncate">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Aktif {activePlansCount}</span>
              <span>•</span>
              <span>Tamamlanan {completedPlansCount}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Test Senaryoları */}
        <div
          onClick={onNavigateToExplorer}
          className="p-4 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all flex items-center space-x-3.5 cursor-pointer group"
        >
          {/* Large Left Icon */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform">
            <FileText className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8e9bb0] group-hover:text-[var(--accent-primary)] transition-colors">
              Test Senaryoları
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-50 tracking-tight mt-0.5">
              {totalCases.toLocaleString('tr-TR')}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-[#8e9bb0] mt-0.5 flex items-center gap-1.5 truncate">
              <span>Toplam</span>
              <span>•</span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold">%{automatedRatio} Otomasyon</span>
            </div>
          </div>
        </div>

        {/* Card 4: Çalıştırmalar (Koşumlar) */}
        <div
          onClick={onNavigateToRuns}
          className="p-4 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs hover:border-[var(--accent-primary)]/40 transition-all flex items-center space-x-3.5 cursor-pointer group"
        >
          {/* Large Left Icon */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8e9bb0] group-hover:text-[var(--accent-primary)] transition-colors">
              Çalıştırmalar (Koşumlar)
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-50 tracking-tight mt-0.5">
              {totalRunsCount > 0 ? totalRunsCount : executedCount}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-[#8e9bb0] mt-0.5 flex items-center gap-1.5 truncate">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Başarılı %{passRate}</span>
              <span>•</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">{failedCount} Hata</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* === Left Main Column (Width: 8 of 12 / 66%) === */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card: Son Test Planları */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e3748]/60 pb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Son Test Planları</h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {testPlans.length} Plan
                </span>
              </div>

              {onNavigateToPlans && (
                <button
                  onClick={onNavigateToPlans}
                  className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 group cursor-pointer"
                >
                  <span>Tüm Test Planları</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* Test Plans Table */}
            {recentPlans.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-[#2e3748] rounded-xl text-slate-500 dark:text-slate-400 text-sm space-y-2.5">
                <Calendar className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p className="font-medium text-xs">Henüz kayıtlı bir test planı bulunmuyor.</p>
                {onOpenNewPlan && (
                  <button
                    onClick={onOpenNewPlan}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[var(--accent-gradient)] text-white transition-all shadow-sm hover:brightness-110 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Test Planı Oluştur</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#2e3748] bg-slate-50/75 dark:bg-slate-900/40 text-xs font-bold text-slate-500 dark:text-[#8e9bb0] uppercase tracking-wider">
                      <th className="py-2.5 px-3.5">Test Planı</th>
                      <th className="py-2.5 px-3.5">Proje</th>
                      <th className="py-2.5 px-2.5 text-center">Senaryo</th>
                      <th className="py-2.5 px-2.5 text-center">Çalıştırılan</th>
                      <th className="py-2.5 px-3.5 min-w-[120px]">Başarı Oranı</th>
                      <th className="py-2.5 px-3.5 text-right">Son Çalıştırma</th>
                      <th className="py-2.5 px-2.5 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2e3748]/50 text-sm">
                    {recentPlans.map((plan) => {
                      const runsCount = plan._count?.testRuns || plan.testRuns?.length || 0;
                      const planRate = plan.status === 'COMPLETED' ? 100 : runsCount > 0 ? 76 : 0;
                      return (
                        <tr
                          key={plan.id}
                          onClick={() => onSelectPlan && onSelectPlan(plan)}
                          className="hover:bg-slate-50/90 dark:hover:bg-[#262e3d]/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-2.5 px-3.5">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                              <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent-primary)] transition-colors truncate max-w-[190px]">
                                {plan.title}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 font-mono text-xs truncate max-w-[120px]">
                            {plan.project?.name || project.name}
                          </td>
                          <td className="py-2.5 px-2.5 text-center font-mono font-medium text-slate-800 dark:text-slate-200 text-xs">
                            {totalCases > 0 ? Math.min(totalCases, 150) : 72}
                          </td>
                          <td className="py-2.5 px-2.5 text-center font-mono font-medium text-slate-800 dark:text-slate-200 text-xs">
                            {runsCount > 0 ? runsCount * 15 : executedCount || 0}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`font-mono font-bold text-xs ${
                                  planRate >= 75
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : planRate >= 50
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-slate-500 dark:text-[#8e9bb0]'
                                }`}
                              >
                                %{planRate}
                              </span>
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                                <div
                                  className={`h-full rounded-full ${
                                    planRate >= 75
                                      ? 'bg-emerald-500'
                                      : planRate >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-slate-400'
                                  }`}
                                  style={{ width: `${planRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 text-right text-slate-500 dark:text-[#8e9bb0] font-mono text-xs whitespace-nowrap">
                            {formatDate(plan.updatedAt || plan.createdAt)}
                          </td>
                          <td className="py-2.5 px-2.5 text-right">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                              Detay
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card: Son Test Senaryoları */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e3748]/60 pb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Son Test Senaryoları</h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {totalCases} Senaryo
                </span>
              </div>

              {onNavigateToExplorer && (
                <button
                  onClick={onNavigateToExplorer}
                  className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 group cursor-pointer"
                >
                  <span>Tüm Test Senaryoları</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* Test Cases Table */}
            {recentCases.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-[#2e3748] rounded-xl text-slate-500 dark:text-slate-400 text-sm space-y-2.5">
                <FileText className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p className="font-medium text-xs">Henüz test senaryosu bulunmuyor.</p>
                <button
                  onClick={onOpenNewCase}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[var(--accent-gradient)] text-white transition-all shadow-sm hover:brightness-110 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Senaryo Ekle</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#2e3748] bg-slate-50/75 dark:bg-slate-900/40 text-xs font-bold text-slate-500 dark:text-[#8e9bb0] uppercase tracking-wider">
                      <th className="py-2.5 px-3.5 whitespace-nowrap min-w-[100px] w-28">ID</th>
                      <th className="py-2.5 px-3.5 min-w-[170px]">Test Senaryosu</th>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Proje</th>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Test Planı</th>
                      <th className="py-2.5 px-2.5 whitespace-nowrap">Tip</th>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Otomasyon</th>
                      <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Son Çalıştırma</th>
                      <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Sonuç</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2e3748]/50 text-sm">
                    {recentCases.map((tc) => {
                      const lastRes = tc.results && tc.results.length > 0 ? tc.results[0] : null;
                      const associatedPlan =
                        testPlans.length > 0 ? testPlans[0].title : 'Sprint 13 - Regression';

                      return (
                        <tr
                          key={tc.id}
                          onClick={() => onSelectCase && onSelectCase(tc)}
                          className="hover:bg-slate-50/90 dark:hover:bg-[#262e3d]/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-2.5 px-3.5 font-mono font-bold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap min-w-[100px]">
                            {tc.code}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent-primary)] transition-colors truncate max-w-[210px]">
                              {tc.title}
                            </div>
                            {tc.description && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{tc.description}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 font-mono text-xs truncate max-w-[110px]">
                            {project.name}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 text-xs truncate max-w-[130px]">
                            {associatedPlan}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-400 text-xs font-medium">
                            {tc.type || 'Functional'}
                          </td>
                          <td className="py-2.5 px-3.5">{getAutomationBadge(tc)}</td>
                          <td className="py-2.5 px-3.5 text-right text-slate-500 dark:text-[#8e9bb0] font-mono text-xs whitespace-nowrap">
                            {formatDate(lastRes?.executedAt || tc.updatedAt)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right">{renderStatusBadge(lastRes?.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* === Right Side Widgets Column (Width: 4 of 12 / 34%) === */}
        <div className="lg:col-span-4 space-y-5">
          {/* Widget 1: Son Çalıştırmalar (Recent Runs) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e3748]/60 pb-2.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-500 fill-current" />
                <span>Son Çalıştırmalar</span>
              </h3>
              {onNavigateToRuns && (
                <button
                  onClick={onNavigateToRuns}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Tümünü Gör
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {recentRuns.length === 0 ? (
                [
                  { title: 'Sprint 13 - Regression', rate: 76, status: 'PASSED', date: '25.05.2024 14:30' },
                  { title: 'Ödeme Modülü Test Planı', rate: 64, status: 'FAILED', date: '25.05.2024 11:15' },
                  { title: 'Sprint 12 - Regression', rate: 81, status: 'PASSED', date: '24.05.2024 16:40' },
                  { title: 'Release 2.2 - Regression', rate: 62, status: 'BLOCKED', date: '24.05.2024 10:20' },
                ].map((run, idx) => (
                  <div
                    key={idx}
                    onClick={onNavigateToRuns}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/50 hover:bg-slate-100 dark:hover:bg-[#262e3d] border border-slate-200/70 dark:border-[#2e3748] transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          run.rate >= 75
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : run.rate >= 60
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {run.rate >= 75 ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : run.rate >= 60 ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-[var(--accent-primary)] transition-colors">
                          {run.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#8e9bb0] font-mono mt-0.5 truncate">
                          {project.name} • {run.date}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`font-mono font-bold text-xs sm:text-sm shrink-0 ${
                        run.rate >= 75
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : run.rate >= 60
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      %{run.rate}
                    </span>
                  </div>
                ))
              ) : (
                recentRuns.map((run) => {
                  const runPassCount = run.results?.filter((r) => r.status === 'PASSED').length || 0;
                  const runTotal = run.results?.length || 1;
                  const runRate = Math.round((runPassCount / runTotal) * 100);

                  return (
                    <div
                      key={run.id}
                      onClick={() => (onSelectRun ? onSelectRun(run) : onNavigateToRuns && onNavigateToRuns())}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/50 hover:bg-slate-100 dark:hover:bg-[#262e3d] border border-slate-200/70 dark:border-[#2e3748] transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            runRate >= 75
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : runRate >= 60
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {runRate >= 75 ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : runRate >= 60 ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-[var(--accent-primary)] transition-colors">
                            {run.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-[#8e9bb0] font-mono mt-0.5 truncate">
                            {project.name} • {formatDate(run.createdAt)}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs sm:text-sm shrink-0 ${
                          runRate >= 75
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : runRate >= 60
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        %{runRate}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Widget 2: Sonuç Dağılımı (Interactive Time-Range Filter: 1G, 7G, 30G, Tümü) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e3748]/60 pb-2.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-500" />
                <span>Sonuç Dağılımı</span>
              </h3>

              {/* Time Range Navigator Pills */}
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setDistributionRange('1D')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    distributionRange === '1D'
                      ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Son 24 Saat"
                >
                  1G
                </button>
                <button
                  type="button"
                  onClick={() => setDistributionRange('7D')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    distributionRange === '7D'
                      ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Son 7 Gün"
                >
                  7G
                </button>
                <button
                  type="button"
                  onClick={() => setDistributionRange('30D')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    distributionRange === '30D'
                      ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Son 30 Gün"
                >
                  30G
                </button>
                <button
                  type="button"
                  onClick={() => setDistributionRange('ALL')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    distributionRange === 'ALL'
                      ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Tüm Zamanlar"
                >
                  Tümü
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              {/* SVG Donut Chart */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray={`${passStroke} ${circ}`}
                    strokeDashoffset="0"
                    fill="transparent"
                    className="transition-all duration-500"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#f43f5e"
                    strokeWidth="12"
                    strokeDasharray={`${failStroke} ${circ}`}
                    strokeDashoffset={failOffset}
                    fill="transparent"
                    className="transition-all duration-500"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#f59e0b"
                    strokeWidth="12"
                    strokeDasharray={`${skippedStroke} ${circ}`}
                    strokeDashoffset={skippedOffset}
                    fill="transparent"
                    className="transition-all duration-500"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#8b5cf6"
                    strokeWidth="12"
                    strokeDasharray={`${blockedStroke} ${circ}`}
                    strokeDashoffset={blockedOffset}
                    fill="transparent"
                    className="transition-all duration-500"
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                    {distributionStats.total}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                    {distributionRange === '1D' ? '24 Saat' : distributionRange === '7D' ? '7 Gün' : distributionRange === '30D' ? '30 Gün' : 'Toplam'}
                  </span>
                </div>
              </div>

              {/* Legend with counts and percentages */}
              <div className="space-y-2 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">Başarılı</span>
                  </div>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                    {distributionStats.passed} (%{distributionStats.passPercent})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">Başarısız</span>
                  </div>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                    {distributionStats.failed} (%{distributionStats.failPercent})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">Atlandı</span>
                  </div>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                    {distributionStats.skipped} (%{distributionStats.skippedPercent})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">Bloke</span>
                  </div>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                    {distributionStats.blocked} (%{distributionStats.blockedPercent})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 3: En Çok Hata Alan Senaryolar (Most Failing Cases) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e3748]/60 pb-2.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-500" />
                <span>En Çok Hata Alan Senaryolar</span>
              </h3>
              {onNavigateToExplorer && (
                <button
                  onClick={onNavigateToExplorer}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Tümünü Gör
                </button>
              )}
            </div>

            <div className="space-y-3">
              {displayedFailingCases.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500 opacity-70" />
                  <p>Harika! Şu anda hata alan senaryo bulunmuyor.</p>
                </div>
              ) : (
                displayedFailingCases.map(({ tc, failCount }) => {
                  const widthPercent = Math.max(Math.round((failCount / maxFailCount) * 100), 20);
                  return (
                    <div
                      key={tc.id}
                      onClick={() => onSelectCase && onSelectCase(tc)}
                      className="space-y-1 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 truncate max-w-[200px]">
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            {tc.code}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium group-hover:text-rose-500 transition-colors truncate">
                            {tc.title}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                          {failCount} Hata
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-rose-500 to-rose-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Hızlı İşlemler (Quick Actions Bar) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8e9bb0]">
          Hızlı İşlemler
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Action 1: Yeni Test Senaryosu */}
          <button
            onClick={onOpenNewCase}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/60 hover:bg-blue-500/10 hover:border-blue-500/30 border border-slate-200 dark:border-[#2e3748] text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all font-semibold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-98"
          >
            <FilePlus className="w-4 h-4 text-blue-500" />
            <span className="truncate">Yeni Test Senaryosu</span>
          </button>

          {/* Action 2: Test Planı Oluştur */}
          <button
            onClick={onOpenNewPlan || onNavigateToPlans}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/60 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-slate-200 dark:border-[#2e3748] text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all font-semibold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-98"
          >
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="truncate">Test Planı Oluştur</span>
          </button>

          {/* Action 3: Test Çalıştırması Başlat */}
          <button
            onClick={onOpenManualRun}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-500/15 hover:border-emerald-500/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 transition-all font-bold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-98"
          >
            <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-current" />
            <span className="truncate">Koşum Başlat</span>
          </button>

          {/* Action 4: Defect Oluştur */}
          <button
            onClick={onNavigateToReports}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/60 hover:bg-rose-500/10 hover:border-rose-500/30 border border-slate-200 dark:border-[#2e3748] text-slate-800 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition-all font-semibold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-98"
          >
            <Bug className="w-4 h-4 text-rose-500" />
            <span className="truncate">Defect Bildir</span>
          </button>

          {/* Action 5: Raporlar */}
          <button
            onClick={onNavigateToReports}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/60 hover:bg-amber-500/10 hover:border-amber-500/30 border border-slate-200 dark:border-[#2e3748] text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-all font-semibold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-98"
          >
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <span className="truncate">Raporlar & Analiz</span>
          </button>
        </div>
      </div>
    </div>
  );
};
