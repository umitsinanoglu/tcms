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
  onOpenNewSuite?: () => void;
  onSelectCase?: (testCase: TestCase) => void;
  onSelectSuite?: (suite: SuiteTreeNode) => void;
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
  onOpenNewSuite,
  onSelectCase,
  onSelectSuite,
  onSelectPlan,
  onSelectRun,
  onNavigateToPlans,
  onNavigateToExplorer,
  onNavigateToRuns,
  onNavigateToReports,
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Project fallback
  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500">
        <Layers className="w-16 h-16 mb-4 opacity-30 animate-pulse" />
        <p className="text-lg font-medium">Lütfen bir Test Projesi seçin</p>
        <p className="text-sm text-slate-500 mt-1">
          Dashboard metriklerini ve test süreçlerini görüntülemek için sol menüden bir proje seçebilirsiniz.
        </p>
      </div>
    );
  }

  // --- 1. Statistics Calculation ---
  const totalCases = testCases.length;
  let passedCount = 0;
  let failedCount = 0;
  let blockedCount = 0;
  let skippedCount = 0;
  let untestedCount = 0;

  // Track fail counts per test case to find most failing ones
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

    // Count all historical fails for top failing chart
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

  // Active projects & plans stats
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

  // If no failure counts yet, fallback to any failed test cases
  const displayedFailingCases =
    topFailingCases.length > 0
      ? topFailingCases
      : testCases
          .filter((tc) => tc.results?.[0]?.status === 'FAILED')
          .slice(0, 3)
          .map((tc) => ({ tc, failCount: 1 }));

  const maxFailCount = displayedFailingCases.length > 0 ? Math.max(...displayedFailingCases.map((f) => f.failCount), 1) : 1;

  // Recent test cases with last result
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

  // Helper for framework badges & icons
  const getAutomationBadge = (tc: TestCase) => {
    const title = tc.title.toLowerCase();
    const code = tc.code.toLowerCase();

    if (tc.executionType === 'MANUAL' || tc.type === 'MANUAL') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          <span>👤</span>
          <span>Manuel</span>
        </span>
      );
    }
    if (title.includes('playwright') || code.includes('pw') || tc.type === 'WEB') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Playwright</span>
        </span>
      );
    }
    if (title.includes('appium') || title.includes('webdriver') || tc.type === 'MOBILE' || tc.type === 'IOS' || tc.type === 'ANDROID') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          <span>WebdriverIO</span>
        </span>
      );
    }
    if (tc.type === 'API') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>Postman / REST</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
        <span>Otomasyon</span>
      </span>
    );
  };

  // Helper for Result Status Badge
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>PASS</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>FAIL</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>BLOCKED</span>
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            <Slash className="w-3 h-3 text-slate-400" />
            <span>SKIPPED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>UNTESTED</span>
          </span>
        );
    }
  };

  // Helper to format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '25.05.2024 14:30';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('tr-TR')} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  // Donut chart math
  const donutTotal = totalCases > 0 ? totalCases : 1;
  const passPercent = Math.round((passedCount / donutTotal) * 100);
  const failPercent = Math.round((failedCount / donutTotal) * 100);
  const skippedPercent = Math.round((skippedCount / donutTotal) * 100);
  const blockedPercent = Math.round((blockedCount / donutTotal) * 100);

  // SVG Donut Calculations (radius = 38, circumference = 238.76)
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const passStroke = (passedCount / donutTotal) * circ;
  const failStroke = (failedCount / donutTotal) * circ;
  const skippedStroke = (skippedCount / donutTotal) * circ;
  const blockedStroke = (blockedCount / donutTotal) * circ;

  const failOffset = -passStroke;
  const skippedOffset = -(passStroke + failStroke);
  const blockedOffset = -(passStroke + failStroke + skippedStroke);

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#141821] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-200">
      {/* 1. Header & Greeting Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Merhaba, {currentUser?.name?.split(' ')[0] || 'Ahmet'}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Bugün neler test etmek istersin? [{project.key}] {project.name} projesi üzerinde çalışıyorsunuz.
          </p>
        </div>

        {/* Search & Action Bar */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Test planı, senaryo veya ID ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30 shadow-xs"
            />
          </div>

          <button
            onClick={onOpenManualRun}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] shadow-sm hover:shadow-[0_4px_12px_rgba(130,28,43,0.35)] transition-all cursor-pointer shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Hızlı Koşum Başlat</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Projeler */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs hover:border-blue-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#8e9bb0]">Projeler</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
              {totalProjectsCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-[#8e9bb0] mt-1 flex items-center gap-1.5">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Aktif {activeProjectsCount}</span>
              <span>•</span>
              <span>Arşiv {archivedProjectsCount}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Test Planları */}
        <div
          onClick={onNavigateToPlans}
          className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#8e9bb0] group-hover:text-emerald-500 transition-colors">
              Test Planları
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
              {totalPlansCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-[#8e9bb0] mt-1 flex items-center gap-1.5">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Aktif {activePlansCount}</span>
              <span>•</span>
              <span>Tamamlanan {completedPlansCount}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Test Senaryoları */}
        <div
          onClick={onNavigateToExplorer}
          className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#8e9bb0] group-hover:text-amber-500 transition-colors">
              Test Senaryoları
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
              {totalCases.toLocaleString('tr-TR')}
            </div>
            <div className="text-xs text-slate-500 dark:text-[#8e9bb0] mt-1 flex items-center gap-1.5">
              <span>Toplam Senaryo</span>
              <span>•</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">%{automatedRatio} Otomasyon</span>
            </div>
          </div>
        </div>

        {/* Card 4: Çalıştırmalar (Son 7 Gün / Koşumlar) */}
        <div
          onClick={onNavigateToRuns}
          className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs hover:border-[#b83a4b]/40 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#8e9bb0] group-hover:text-[#b83a4b] transition-colors">
              Çalıştırmalar (Koşumlar)
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
              {totalRunsCount > 0 ? totalRunsCount : executedCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-[#8e9bb0] mt-1 flex items-center gap-1.5">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Başarılı %{passRate}</span>
              <span>•</span>
              <span className="text-rose-600 dark:text-rose-400">{failedCount} Hata</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* === Left Main Column (Width: 8 of 12 / 66%) === */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Son Test Planları */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Son Test Planları</h2>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {testPlans.length} Plan
                </span>
              </div>

              {onNavigateToPlans && (
                <button
                  onClick={onNavigateToPlans}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 group cursor-pointer"
                >
                  <span>Tüm Test Planları</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* Test Plans Table */}
            {recentPlans.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#2e3748] rounded-xl text-slate-400 text-xs space-y-2">
                <Calendar className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p>Henüz kayıtlı bir test planı bulunmuyor.</p>
                {onOpenNewPlan && (
                  <button
                    onClick={onOpenNewPlan}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
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
                    <tr className="border-b border-slate-100 dark:border-[#2e3748]/80 text-[10px] font-bold text-slate-500 dark:text-[#8e9bb0] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Test Planı</th>
                      <th className="py-2.5 px-3">Proje</th>
                      <th className="py-2.5 px-2 text-center">Senaryo</th>
                      <th className="py-2.5 px-2 text-center">Çalıştırılan</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Başarı Oranı</th>
                      <th className="py-2.5 px-3 text-right">Son Çalıştırma</th>
                      <th className="py-2.5 px-2 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2e3748]/50 text-xs">
                    {recentPlans.map((plan) => {
                      const runsCount = plan._count?.testRuns || plan.testRuns?.length || 0;
                      // Simulated success rate based on plan
                      const planRate = plan.status === 'COMPLETED' ? 100 : runsCount > 0 ? 76 : 0;
                      return (
                        <tr
                          key={plan.id}
                          onClick={() => onSelectPlan && onSelectPlan(plan)}
                          className="hover:bg-slate-50/80 dark:hover:bg-[#262e3d]/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#b83a4b] transition-colors truncate max-w-[180px]">
                                {plan.title}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] truncate max-w-[120px]">
                            {plan.project?.name || project.name}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-slate-700 dark:text-slate-300">
                            {totalCases > 0 ? Math.min(totalCases, 150) : 72}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-slate-700 dark:text-slate-300">
                            {runsCount > 0 ? runsCount * 15 : executedCount || 0}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`font-mono font-bold text-[11px] ${
                                  planRate >= 80 ? 'text-emerald-500' : planRate >= 50 ? 'text-amber-500' : 'text-slate-400'
                                }`}
                              >
                                %{planRate}
                              </span>
                              <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden min-w-[50px]">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    planRate >= 80 ? 'bg-emerald-500' : planRate >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                                  }`}
                                  style={{ width: `${planRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500 dark:text-[#8e9bb0] font-mono text-[10px] whitespace-nowrap">
                            {formatDate(plan.updatedAt || plan.createdAt)}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenManualRun();
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Bu Planı Koş"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {onNavigateToPlans && recentPlans.length > 0 && (
              <div className="pt-2 text-center border-t border-slate-100 dark:border-[#2e3748]">
                <button
                  onClick={onNavigateToPlans}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <span>Tümünü Görüntüle</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Card: Son Test Senaryoları */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Son Test Senaryoları</h2>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {totalCases} Senaryo
                </span>
              </div>

              {onNavigateToExplorer && (
                <button
                  onClick={onNavigateToExplorer}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 group cursor-pointer"
                >
                  <span>Tüm Test Senaryoları</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* Test Cases Table */}
            {recentCases.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#2e3748] rounded-xl text-slate-400 text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p>Henüz test senaryosu bulunmuyor.</p>
                <button
                  onClick={onOpenNewCase}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Senaryo Ekle</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#2e3748]/80 text-[10px] font-bold text-slate-500 dark:text-[#8e9bb0] uppercase tracking-wider">
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Test Senaryosu</th>
                      <th className="py-2.5 px-3">Proje</th>
                      <th className="py-2.5 px-3">Test Planı</th>
                      <th className="py-2.5 px-2">Tip</th>
                      <th className="py-2.5 px-3">Otomasyon</th>
                      <th className="py-2.5 px-3 text-right">Son Çalıştırma</th>
                      <th className="py-2.5 px-3 text-right">Sonuç</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2e3748]/50 text-xs">
                    {recentCases.map((tc) => {
                      const lastRes = tc.results && tc.results.length > 0 ? tc.results[0] : null;
                      const associatedPlan =
                        testPlans.length > 0 ? testPlans[0].title : 'Sprint 13 - Regression';

                      return (
                        <tr
                          key={tc.id}
                          onClick={() => onSelectCase && onSelectCase(tc)}
                          className="hover:bg-slate-50/80 dark:hover:bg-[#262e3d]/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-3 font-mono font-bold text-[11px] text-blue-600 dark:text-blue-400 shrink-0">
                            {tc.code}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#b83a4b] transition-colors truncate max-w-[200px]">
                              {tc.title}
                            </div>
                            {tc.suite && (
                              <div className="text-[10px] text-slate-400 font-mono truncate">{tc.suite.name}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] truncate max-w-[100px]">
                            {project.name}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-[120px]">
                            {associatedPlan}
                          </td>
                          <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-[11px]">
                            {tc.type || 'Functional'}
                          </td>
                          <td className="py-3 px-3">{getAutomationBadge(tc)}</td>
                          <td className="py-3 px-3 text-right text-slate-500 dark:text-[#8e9bb0] font-mono text-[10px] whitespace-nowrap">
                            {formatDate(lastRes?.executedAt || tc.updatedAt)}
                          </td>
                          <td className="py-3 px-3 text-right">{renderStatusBadge(lastRes?.status)}</td>
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
        <div className="lg:col-span-4 space-y-6">
          {/* Widget 1: Son Çalıştırmalar (Recent Runs) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Play className="w-4 h-4 text-[#b83a4b]" />
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
                // Clean mock items if no runs yet
                [
                  { title: 'Sprint 13 - Regression', rate: 76, status: 'PASSED', date: '25.05.2024 14:30' },
                  { title: 'Ödeme Modülü Test Planı', rate: 64, status: 'FAILED', date: '25.05.2024 11:15' },
                  { title: 'Sprint 12 - Regression', rate: 81, status: 'PASSED', date: '24.05.2024 16:40' },
                  { title: 'Release 2.2 - Regression', rate: 62, status: 'BLOCKED', date: '24.05.2024 10:20' },
                ].map((run, idx) => (
                  <div
                    key={idx}
                    onClick={onNavigateToRuns}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/50 hover:bg-slate-100 dark:hover:bg-[#262e3d] border border-slate-100 dark:border-[#2e3748] transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          run.rate >= 75
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : run.rate >= 60
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-rose-500/10 text-rose-500'
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
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-[#b83a4b] transition-colors">
                          {run.title}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-[#8e9bb0] font-mono mt-0.5 truncate">
                          {project.name} • {run.date}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`font-mono font-bold text-xs shrink-0 ${
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
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/50 hover:bg-slate-100 dark:hover:bg-[#262e3d] border border-slate-100 dark:border-[#2e3748] transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            runRate >= 75
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : runRate >= 60
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
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
                          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-[#b83a4b] transition-colors">
                            {run.title}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-[#8e9bb0] font-mono mt-0.5 truncate">
                            {project.name} • {formatDate(run.createdAt)}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs shrink-0 ${
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

          {/* Widget 2: Sonuç Dağılımı (Outcome Distribution Donut Chart) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-500" />
              <span>Sonuç Dağılımı (Son 7 Gün)</span>
            </h3>

            <div className="flex items-center justify-between gap-4">
              {/* SVG Donut Chart */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background ring */}
                  <circle cx="50" cy="50" r={radius} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="12" fill="transparent" />
                  {/* Passed segment */}
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
                  {/* Failed segment */}
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
                  {/* Skipped segment */}
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
                  {/* Blocked segment */}
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
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                    {totalRunsCount > 0 ? totalRunsCount : executedCount || totalCases}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Toplam</span>
                </div>
              </div>

              {/* Legend with counts and percentages */}
              <div className="space-y-2 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Başarılı</span>
                  </div>
                  <span className="font-mono text-slate-500 dark:text-[#8e9bb0] font-semibold">
                    {passedCount} (%{passPercent})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Başarısız</span>
                  </div>
                  <span className="font-mono text-slate-500 dark:text-[#8e9bb0] font-semibold">
                    {failedCount} (%{failPercent})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Atlandı</span>
                  </div>
                  <span className="font-mono text-slate-500 dark:text-[#8e9bb0] font-semibold">
                    {skippedCount} (%{skippedPercent})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Bloke</span>
                  </div>
                  <span className="font-mono text-slate-500 dark:text-[#8e9bb0] font-semibold">
                    {blockedCount} (%{blockedPercent})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 3: En Çok Hata Alan Senaryolar (Most Failing Cases) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
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
                <div className="p-4 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500 opacity-60" />
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
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-[11px]">
                            {tc.code}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 group-hover:text-rose-500 transition-colors truncate">
                            {tc.title}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">
                          {failCount}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
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
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8e9bb0]">
          Hızlı İşlemler
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Action 1: Yeni Test Senaryosu */}
          <button
            onClick={onOpenNewCase}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/60 hover:bg-blue-500/10 hover:border-blue-500/30 border border-slate-200 dark:border-[#2e3748] text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all font-medium text-xs cursor-pointer shadow-xs active:scale-98"
          >
            <FilePlus className="w-4 h-4 text-blue-500" />
            <span className="truncate">Yeni Test Senaryosu</span>
          </button>

          {/* Action 2: Test Planı Oluştur */}
          <button
            onClick={onOpenNewPlan || onNavigateToPlans}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/60 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-slate-200 dark:border-[#2e3748] text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all font-medium text-xs cursor-pointer shadow-xs active:scale-98"
          >
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="truncate">Test Planı Oluştur</span>
          </button>

          {/* Action 3: Test Çalıştırması Başlat */}
          <button
            onClick={onOpenManualRun}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/60 hover:bg-purple-500/10 hover:border-purple-500/30 border border-slate-200 dark:border-[#2e3748] text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 transition-all font-medium text-xs cursor-pointer shadow-xs active:scale-98"
          >
            <Play className="w-4 h-4 text-purple-500 fill-current" />
            <span className="truncate">Koşum Başlat</span>
          </button>

          {/* Action 4: Defect Oluştur */}
          <button
            onClick={onNavigateToReports}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/60 hover:bg-rose-500/10 hover:border-rose-500/30 border border-slate-200 dark:border-[#2e3748] text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition-all font-medium text-xs cursor-pointer shadow-xs active:scale-98"
          >
            <Bug className="w-4 h-4 text-rose-500" />
            <span className="truncate">Defect / Hata Bildir</span>
          </button>

          {/* Action 5: Raporlar */}
          <button
            onClick={onNavigateToReports}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/60 hover:bg-amber-500/10 hover:border-amber-500/30 border border-slate-200 dark:border-[#2e3748] text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-all font-medium text-xs cursor-pointer shadow-xs active:scale-98"
          >
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <span className="truncate">Raporlar & Analiz</span>
          </button>

          {/* Action 6: Test Suite Ekle */}
          <button
            onClick={onOpenNewSuite}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#262e3d]/60 hover:bg-teal-500/10 hover:border-teal-500/30 border border-slate-200 dark:border-[#2e3748] text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 transition-all font-medium text-xs cursor-pointer shadow-xs active:scale-98"
          >
            <FolderPlus className="w-4 h-4 text-teal-500" />
            <span className="truncate">Yeni Test Suite</span>
          </button>
        </div>
      </div>
    </div>
  );
};
