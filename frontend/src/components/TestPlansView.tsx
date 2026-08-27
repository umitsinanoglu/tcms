import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Project,
  TestPlan,
  TestPlansService,
  UpdateTestPlanDto,
  CreateTestPlanDto,
  TestCase,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { NewTestPlanModal } from './NewTestPlanModal';
import { EditTestPlanModal } from './EditTestPlanModal';
import {
  ClipboardList,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  Play,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  FolderKanban,
  Check,
  ArrowRight,
  AlertTriangle,
  PlayCircle,
  SlidersHorizontal,
} from 'lucide-react';

interface TestPlansViewProps {
  project: Project | null;
  projects?: Project[];
  allCases?: TestCase[];
  testPlans?: TestPlan[];
  onStartRunWithPlan: (plan: TestPlan) => void;
  onSelectPlanToView?: (plan: TestPlan) => void;
  onNavigateToRuns?: () => void;
  onOpenNewPlan?: () => void;
  onPlansChange?: () => Promise<void>;
}

type TabType = 'ALL' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'PASSIVE';

export const TestPlansView: React.FC<TestPlansViewProps> = ({
  project,
  projects = [],
  allCases = [],
  testPlans,
  onStartRunWithPlan,
  onSelectPlanToView,
  onNavigateToRuns,
  onOpenNewPlan,
  onPlansChange,
}) => {
  const { can } = useAuth();
  const [plans, setPlans] = useState<TestPlan[]>(testPlans || []);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [statusDropdownFilter, setStatusDropdownFilter] = useState<string>('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isInspectorActionsOpen, setIsInspectorActionsOpen] = useState(false);

  // Pagination State
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<TestPlan | null>(null);

  // Synchronize when testPlans prop changes
  useEffect(() => {
    if (testPlans !== undefined) {
      setPlans(testPlans);
      if (testPlans.length > 0) {
        setSelectedPlanId((prev) => (prev && testPlans.some((p) => p.id === prev) ? prev : testPlans[0].id));
      } else {
        setSelectedPlanId(null);
      }
    }
  }, [testPlans]);

  // Load Plans
  const loadPlans = useCallback(async () => {
    if (!project?.id) return;
    if (onPlansChange) {
      await onPlansChange();
      return;
    }
    setIsLoading(true);
    try {
      const data = await TestPlansService.getAllByProject(project.id);
      setPlans(data || []);
      if (data && data.length > 0) {
        setSelectedPlanId((prev) => (prev && data.some((p) => p.id === prev) ? prev : data[0].id));
      } else {
        setSelectedPlanId(null);
      }
    } catch (err) {
      console.error('Failed to load test plans:', err);
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, [project?.id, onPlansChange]);

  useEffect(() => {
    if (testPlans === undefined) {
      loadPlans();
    }
  }, [loadPlans, testPlans]);

  // Handle plan create
  const handleCreatePlan = async (data: CreateTestPlanDto & { caseIds?: string[] }) => {
    const created = await TestPlansService.create(data);
    if (created?.id) {
      try {
        localStorage.setItem(`tcms_plan_cases_${created.id}`, JSON.stringify(data.caseIds || []));
      } catch {
        // Ignore
      }
      setSelectedPlanId(created.id);
    }
    await loadPlans();
  };

  // Handle plan update
  const handleUpdatePlan = async (id: string, data: UpdateTestPlanDto & { caseIds?: string[] }) => {
    await TestPlansService.update(id, data);
    await loadPlans();
  };

  // Handle plan delete
  const handleDeletePlan = async (id: string) => {
    if (!confirm('Bu test planını silmek istediğinize emin misiniz?')) return;
    await TestPlansService.delete(id);
    if (selectedPlanId === id) setSelectedPlanId(null);
    await loadPlans();
  };

  // Helper to infer or calculate statistics for each plan
  const planStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        type: string;
        typeColor: { bg: string; text: string; border: string };
        scope: string;
        totalScenarios: number;
        executedScenarios: number;
        passed: number;
        failed: number;
        blocked: number;
        skipped: number;
        passRate: number;
        lastRunDate: string;
        statusKey: 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'PASSIVE';
        dateRange: string;
      }
    >();

    plans.forEach((plan, idx) => {
      // 1. Infer Type
      let inferredType = 'Regression';
      const titleLower = (plan.title || '').toLowerCase();
      const descLower = (plan.description || '').toLowerCase();
      if (titleLower.includes('smoke') || descLower.includes('smoke')) {
        inferredType = 'Smoke';
      } else if (titleLower.includes('functional') || titleLower.includes('fonksiyonel') || descLower.includes('fonksiyonel')) {
        inferredType = 'Functional';
      } else if (titleLower.includes('api') || descLower.includes('api')) {
        inferredType = 'API';
      } else if (titleLower.includes('güvenlik') || titleLower.includes('security') || descLower.includes('güvenlik')) {
        inferredType = 'Security';
      } else if (titleLower.includes('performans') || titleLower.includes('performance') || descLower.includes('performans')) {
        inferredType = 'Performance';
      } else if (titleLower.includes('release') || titleLower.includes('sürüm')) {
        inferredType = 'Regression';
      }

      // Clean neutral slate type badge
      const typeColor = { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' };

      // 2. Scope
      let scopeText = plan.scope || 'Web, Mobil';
      if (!plan.scope) {
        if (inferredType === 'API') scopeText = 'API';
        else if (inferredType === 'Smoke') scopeText = 'Mobil';
        else if (inferredType === 'Security') scopeText = 'Web, Mobil, API';
        else if (inferredType === 'Performance') scopeText = 'Web, API';
        else scopeText = 'Web, Mobil';
      }

      // 3. Runs & Results metrics calculation from actual plan cases
      let planCaseIds: string[] = [];
      try {
        const saved = localStorage.getItem(`tcms_plan_cases_${plan.id}`);
        if (saved !== null) {
          planCaseIds = JSON.parse(saved);
        }
      } catch {
        planCaseIds = [];
      }

      let totalScenarios = planCaseIds.length;
      let executedScenarios = 0;
      let passed = 0;
      let failed = 0;
      let blocked = 0;
      let skipped = 0;
      let lastRunDate = '—';

      if (plan.testRuns && plan.testRuns.length > 0) {
        const latestRun = plan.testRuns[0];
        if (latestRun.createdAt) {
          lastRunDate = new Date(latestRun.createdAt).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }

        plan.testRuns.forEach((r) => {
          if (r.results) {
            r.results.forEach((res: any) => {
              if (totalScenarios === 0 || planCaseIds.includes(res.testCaseId)) {
                executedScenarios++;
                if (res.status === 'PASSED') passed++;
                else if (res.status === 'FAILED') failed++;
                else if (res.status === 'BLOCKED') blocked++;
                else if (res.status === 'SKIPPED') skipped++;
              }
            });
          }
        });
      }

      const passRate = executedScenarios > 0 ? Math.round((passed / executedScenarios) * 100) : 0;

      // Status mapping
      let statusKey: 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'PASSIVE' = 'ACTIVE';
      if (plan.status === 'COMPLETED') {
        statusKey = 'COMPLETED';
      } else if (plan.status === 'ARCHIVED' || plan.status === 'DRAFT') {
        statusKey = 'PASSIVE';
      } else {
        if (plan.title.toLowerCase().includes('ödeme') || plan.title.toLowerCase().includes('devam')) {
          statusKey = 'IN_PROGRESS';
        } else {
          statusKey = 'ACTIVE';
        }
      }

      // Date range formatting
      const createdDate = new Date(plan.createdAt || Date.now());
      const endDate = new Date(createdDate.getTime() + 18 * 24 * 60 * 60 * 1000);
      const dateRange = `${createdDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${endDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

      map.set(plan.id, {
        type: inferredType,
        typeColor,
        scope: scopeText,
        totalScenarios,
        executedScenarios,
        passed,
        failed,
        blocked,
        skipped,
        passRate,
        lastRunDate,
        statusKey,
        dateRange,
      });
    });

    return map;
  }, [plans, allCases]);

  // Overall KPI Card calculations
  const kpiData = useMemo(() => {
    const totalPlans = plans.length;
    let activeCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let passiveCount = 0;
    let totalRates = 0;
    let plansWithRuns = 0;

    plans.forEach((p) => {
      const stats = planStatsMap.get(p.id);
      if (stats) {
        if (stats.statusKey === 'ACTIVE') activeCount++;
        else if (stats.statusKey === 'IN_PROGRESS') inProgressCount++;
        else if (stats.statusKey === 'COMPLETED') completedCount++;
        else if (stats.statusKey === 'PASSIVE') passiveCount++;

        if (stats.executedScenarios > 0) {
          totalRates += stats.passRate;
          plansWithRuns++;
        }
      }
    });

    const avgPassRate = plansWithRuns > 0 ? Math.round(totalRates / plansWithRuns) : null;

    return {
      totalPlans,
      activeCount,
      passiveCount,
      inProgressCount,
      completedCount,
      avgPassRate,
    };
  }, [plans, planStatsMap]);

  // Filtered Plans based on active tab and status dropdown filter
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const stats = planStatsMap.get(p.id);
      if (!stats) return true;

      // 1. Tab Filter
      if (activeTab === 'ACTIVE' && stats.statusKey !== 'ACTIVE') return false;
      if (activeTab === 'IN_PROGRESS' && stats.statusKey !== 'IN_PROGRESS') return false;
      if (activeTab === 'COMPLETED' && stats.statusKey !== 'COMPLETED') return false;
      if (activeTab === 'PASSIVE' && stats.statusKey !== 'PASSIVE') return false;

      // 2. Dropdown Filter
      if (statusDropdownFilter !== 'ALL' && stats.statusKey !== statusDropdownFilter) return false;

      return true;
    });
  }, [plans, planStatsMap, activeTab, statusDropdownFilter]);

  // Pagination slice
  const paginatedPlans = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredPlans.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredPlans, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredPlans.length / rowsPerPage) || 1;

  // Selected plan object for inspector
  const activeSelectedPlan = useMemo(() => {
    if (!selectedPlanId) return filteredPlans[0] || plans[0] || null;
    return plans.find((p) => p.id === selectedPlanId) || filteredPlans[0] || null;
  }, [selectedPlanId, plans, filteredPlans]);

  const activeSelectedStats = activeSelectedPlan ? planStatsMap.get(activeSelectedPlan.id) : null;

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-400">
        <div className="text-center space-y-3">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium">Lütfen sol menüden çalışılacak bir Test Projesi seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#f8fafc] dark:bg-[#0b111e] select-none font-sans">
      {/* 1. Page Header: Title + Subtitle + Action Buttons */}
      <div className="px-6 pt-5 pb-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Test Planları
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Proje kapsamındaki test planlarını görüntüleyin ve yönetin.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
            >
              <span>
                Durum:{' '}
                {statusDropdownFilter === 'ALL'
                  ? 'Tümü'
                  : statusDropdownFilter === 'ACTIVE'
                  ? 'Aktif'
                  : statusDropdownFilter === 'IN_PROGRESS'
                  ? 'Devam Eden'
                  : statusDropdownFilter === 'COMPLETED'
                  ? 'Tamamlandı'
                  : 'Pasif'}
              </span>
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 shadow-xl z-50 py-1 text-xs overflow-hidden">
                {[
                  { key: 'ALL', label: 'Tümü' },
                  { key: 'ACTIVE', label: 'Aktif' },
                  { key: 'IN_PROGRESS', label: 'Devam Eden' },
                  { key: 'COMPLETED', label: 'Tamamlandı' },
                  { key: 'PASSIVE', label: 'Pasif' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setStatusDropdownFilter(item.key);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      statusDropdownFilter === item.key
                        ? 'font-bold text-[#b83a4b] dark:text-[#d66b7a]'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{item.label}</span>
                    {statusDropdownFilter === item.key && <Check className="w-3.5 h-3.5 text-[#b83a4b]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Test Plan Button */}
          <button
            type="button"
            onClick={() => (onOpenNewPlan ? onOpenNewPlan() : setIsNewPlanOpen(true))}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] transition-all shadow-md shadow-[#821c2b]/25 active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Test Planı</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Grid Row of 4 Compact Cards) */}
      <div className="px-6 py-3 shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Toplam Test Planı */}
        <div className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Toplam Test Planı
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                {kpiData.totalPlans}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Plan</span>
            </div>
          </div>
        </div>

        {/* Card 2: Aktif / Devam Eden */}
        <div className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Aktif & Devam Eden
            </span>
            <div className="flex items-center space-x-1.5 text-sm font-black leading-none">
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">{kpiData.activeCount} Aktif</span>
              <span className="text-slate-300 dark:text-slate-600 font-normal">&bull;</span>
              <span className="text-amber-700 dark:text-amber-300 font-bold">{kpiData.inProgressCount} Koşumda</span>
            </div>
          </div>
        </div>

        {/* Card 3: Tamamlanan Planlar */}
        <div className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Tamamlanan Planlar
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                {kpiData.completedCount}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Başarılı</span>
            </div>
          </div>
        </div>

        {/* Card 4: Ortalama Başarı Oranı */}
        <div className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ort. Başarı Oranı
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                {kpiData.avgPassRate !== null ? `%${kpiData.avgPassRate}` : '—'}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  (kpiData.avgPassRate || 0) >= 75
                    ? 'bg-emerald-500'
                    : (kpiData.avgPassRate || 0) >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${kpiData.avgPassRate || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Left Data Grid Table + Right Detail Drawer */}
      <div className="min-w-0 px-6 pb-6 flex flex-col lg:flex-row gap-4">
        {/* Left Side: Table & Tabs */}
        <div className="flex-1 min-w-0 bg-white dark:bg-[#161f30] rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs overflow-hidden flex flex-col">
          {/* Tab Navigation */}
          <div className="flex items-center space-x-6 px-5 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
            {[
              { key: 'ALL', label: 'Tümü' },
              { key: 'ACTIVE', label: 'Aktif' },
              { key: 'IN_PROGRESS', label: 'Devam Eden' },
              { key: 'COMPLETED', label: 'Tamamlandı' },
              { key: 'PASSIVE', label: 'Pasif' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key as TabType);
                    setCurrentPage(1);
                  }}
                  className={`py-3 border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#2563eb] text-[#2563eb] dark:text-[#3b82f6] font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-[#1a2333] border-b border-slate-200 dark:border-slate-700/80 shadow-xs">
                <tr className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  <th className="py-2.5 px-4">TEST PLANI</th>
                  <th className="py-2.5 px-3">TÜR</th>
                  <th className="py-2.5 px-3">KAPSAM</th>
                  <th className="py-2.5 px-3 text-center">SENARYO</th>
                  <th className="py-2.5 px-3">BAŞARI ORANI</th>
                  <th className="py-2.5 px-3">DURUM</th>
                  <th className="py-2.5 px-3">SON ÇALIŞTIRMA</th>
                  <th className="py-2.5 px-4 text-right">İŞLEMLER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                      <span>Yükleniyor...</span>
                    </td>
                  </tr>
                ) : paginatedPlans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p>Kayıtlı test planı bulunamadı.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedPlans.map((p) => {
                    const stats = planStatsMap.get(p.id);
                    const isSelected = activeSelectedPlan?.id === p.id;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                          isSelected
                            ? 'bg-blue-50/60 dark:bg-blue-900/10'
                            : ''
                        }`}
                      >
                        {/* Test Plan Name + Subtitle */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 max-w-[260px]">
                              <p className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {p.title}
                              </p>
                              {p.description && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5" title={p.description}>
                                  {p.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs ${
                              stats?.typeColor.bg || 'bg-blue-500/10'
                            } ${stats?.typeColor.text || 'text-blue-600'} ${
                              stats?.typeColor.border || 'border-blue-500/20'
                            }`}
                          >
                            {stats?.type || 'Regression'}
                          </span>
                        </td>

                        {/* Scope */}
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                          {stats?.scope || 'Web, Mobil'}
                        </td>

                        {/* Scenario Count */}
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {stats ? stats.totalScenarios : 0}
                        </td>

                        {/* Success Rate & Progress Bar */}
                        <td className="py-2.5 px-3">
                          {stats && stats.executedScenarios > 0 ? (
                            <div className="flex items-center space-x-2 w-28">
                              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-[11px]">
                                %{stats.passRate}
                              </span>
                              <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    stats.passRate >= 75
                                      ? 'bg-emerald-500'
                                      : stats.passRate >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${stats.passRate}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>

                        {/* Status - High Contrast Badges */}
                        <td className="py-2.5 px-3">
                          {stats?.statusKey === 'ACTIVE' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-xs">
                              Aktif
                            </span>
                          ) : stats?.statusKey === 'IN_PROGRESS' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs">
                              Devam Eden
                            </span>
                          ) : stats?.statusKey === 'COMPLETED' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60 shadow-xs">
                              Tamamlandı
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-xs">
                              Pasif
                            </span>
                          )}
                        </td>

                        {/* Last Run Date */}
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] font-mono whitespace-nowrap">
                          {stats?.lastRunDate || '—'}
                        </td>

                        {/* Action Icons: Koşum Başlat, Düzenle, Sil */}
                        <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1">
                            {/* Koşum Başlat */}
                            <button
                              type="button"
                              onClick={() => onStartRunWithPlan(p)}
                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                              title="Koşum Başlat"
                              aria-label="Koşum Başlat"
                            >
                              <Play className="w-3.5 h-3.5 fill-current text-emerald-600 dark:text-emerald-400" />
                            </button>

                            {/* Düzenle */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectPlanToView) {
                                  onSelectPlanToView(p);
                                } else {
                                  setSelectedPlanForEdit(p);
                                  setIsEditPlanOpen(true);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Planı Düzenle"
                              aria-label="Planı Düzenle"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Sil */}
                            <button
                              type="button"
                              onClick={() => handleDeletePlan(p.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                              title="Planı Sil"
                              aria-label="Planı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Total Count + Rows Per Page + Pagination Controls */}
          <div className="p-3.5 px-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-[#121926]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <span className="font-medium">
              Toplam {filteredPlans.length} kayıt
            </span>

            <div className="flex items-center space-x-4">
              {/* Rows Per Page */}
              <div className="flex items-center space-x-1.5">
                <span>Satır sayısı:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Page Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161f30] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    type="button"
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-6 h-6 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      currentPage === i + 1
                        ? 'bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white'
                        : 'bg-white dark:bg-[#161f30] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161f30] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161f30] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Inspector / Detail Drawer ("Test Planı Detayları") */}
        {activeSelectedPlan && (
          <div className="w-80 lg:w-92 shrink-0 bg-white dark:bg-[#161f30] rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Inspector Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Test Planı Detayları
              </span>
              <button
                type="button"
                onClick={() => setSelectedPlanId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inspector Scrollable Body */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
              {/* Title & Status */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeSelectedPlan.title}
                </h3>
                {activeSelectedStats?.statusKey === 'ACTIVE' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-xs shrink-0">
                    Aktif
                  </span>
                ) : activeSelectedStats?.statusKey === 'IN_PROGRESS' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs shrink-0">
                    Devam Eden
                  </span>
                ) : activeSelectedStats?.statusKey === 'COMPLETED' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60 shadow-xs shrink-0">
                    Tamamlandı
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-xs shrink-0">
                    Pasif
                  </span>
                )}
              </div>

              {/* Metadata Key-Values */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Proje</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeSelectedPlan.project?.name || project.name}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Tür</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {activeSelectedStats?.type || 'Regression'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Kapsam</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {activeSelectedStats?.scope || 'Web, Mobil'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Tarih Aralığı</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    {activeSelectedStats?.dateRange || '13.05.2024 - 31.05.2024'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Açıklama</span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed mt-0.5">
                    {activeSelectedPlan.description ||
                      'Bu test planı kapsamındaki tüm fonksiyonel alanların test senaryolarını ve regresyon adımlarını içerir.'}
                  </p>
                </div>
              </div>

              {/* Özet (Summary Metrics) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block">
                  Özet
                </span>

                <div className="space-y-1.5 text-xs font-medium">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Toplam Senaryo</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {activeSelectedStats ? activeSelectedStats.totalScenarios : 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Çalıştırılan Senaryo</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {activeSelectedStats ? activeSelectedStats.executedScenarios : 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Başarılı</span>
                    <span className="font-bold">{activeSelectedStats ? activeSelectedStats.passed : 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                    <span>Başarısız</span>
                    <span className="font-bold">{activeSelectedStats ? activeSelectedStats.failed : 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Bloke</span>
                    <span className="font-bold">{activeSelectedStats ? activeSelectedStats.blocked : 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Atlandı</span>
                    <span className="font-bold">{activeSelectedStats ? activeSelectedStats.skipped : 0}</span>
                  </div>

                  <div className="pt-1.5 flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span>Başarı Oranı</span>
                    {activeSelectedStats && activeSelectedStats.executedScenarios > 0 ? (
                      <span className="font-mono">%{activeSelectedStats.passRate}</span>
                    ) : (
                      <span className="font-mono text-slate-400">—</span>
                    )}
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full ${
                        (activeSelectedStats?.passRate || 0) >= 75
                          ? 'bg-emerald-500'
                          : (activeSelectedStats?.passRate || 0) >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${
                          activeSelectedStats && activeSelectedStats.executedScenarios > 0
                            ? activeSelectedStats.passRate
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Inspector Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#121926]/50 space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (onSelectPlanToView && activeSelectedPlan) {
                    onSelectPlanToView(activeSelectedPlan);
                  } else if (activeSelectedPlan) {
                    onStartRunWithPlan(activeSelectedPlan);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Planı Görüntüle</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsInspectorActionsOpen((prev) => !prev)}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer"
                >
                  <span>İşlemler</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isInspectorActionsOpen && (
                  <div className="absolute bottom-full mb-1.5 left-0 right-0 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 shadow-xl z-50 py-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsInspectorActionsOpen(false);
                        onStartRunWithPlan(activeSelectedPlan);
                      }}
                      className="w-full text-left px-3 py-2 flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-emerald-600 dark:text-emerald-400" />
                      <span>Yeni Koşum Başlat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInspectorActionsOpen(false);
                        if (onSelectPlanToView && activeSelectedPlan) {
                          onSelectPlanToView(activeSelectedPlan);
                        } else if (activeSelectedPlan) {
                          setSelectedPlanForEdit(activeSelectedPlan);
                          setIsEditPlanOpen(true);
                        }
                      }}
                      className="w-full text-left px-3 py-2 flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Planı Düzenle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInspectorActionsOpen(false);
                        handleDeletePlan(activeSelectedPlan.id);
                      }}
                      className="w-full text-left px-3 py-2 flex items-center space-x-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Planı Sil</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewTestPlanModal
        isOpen={isNewPlanOpen}
        onClose={() => setIsNewPlanOpen(false)}
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        allCases={allCases}
        onSubmit={handleCreatePlan}
      />

      <EditTestPlanModal
        isOpen={isEditPlanOpen}
        onClose={() => {
          setIsEditPlanOpen(false);
          setSelectedPlanForEdit(null);
        }}
        plan={selectedPlanForEdit}
        allCases={allCases}
        onUpdate={handleUpdatePlan}
        onDelete={handleDeletePlan}
      />
    </div>
  );
};
