import React, { useState, useMemo } from 'react';
import {
  Project,
  TestCase,
  TestPlan,
  Priority,
  TestType,
  ExecutionType,
  ResultStatus,
  TestCasesService,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Plus,
  Search,
  Play,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Filter,
  Check,
  X,
  ExternalLink,
  ClipboardList,
  Sparkles,
  SlidersHorizontal,
  Bot,
  User,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface TestScenariosViewProps {
  project: Project | null;
  projects?: Project[];
  testCases: TestCase[];
  testPlans?: TestPlan[];
  onSelectCase: (testCase: TestCase) => void;
  onOpenNewCase: () => void;
  onRunSingleCase: (testCase: TestCase) => void;
  onRunMultipleCases: (testCases: TestCase[]) => void;
  onDeleteCase: (caseId: string) => void;
}

export const TestScenariosView: React.FC<TestScenariosViewProps> = ({
  project,
  projects = [],
  testCases = [],
  testPlans = [],
  onSelectCase,
  onOpenNewCase,
  onRunSingleCase,
  onRunMultipleCases,
  onDeleteCase,
}) => {
  const { can } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [executionTypeFilter, setExecutionTypeFilter] = useState<string>('ALL');
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Add to Plan Modal state
  const [isAddToPlanModalOpen, setIsAddToPlanModalOpen] = useState(false);
  const [selectedTargetPlanId, setSelectedTargetPlanId] = useState<string>('');

  // Overall Metrics Calculation
  const metrics = useMemo(() => {
    const total = testCases.length;
    let manualCount = 0;
    let autoCount = 0;
    let blockerCount = 0;
    let criticalCount = 0;
    let passedCount = 0;
    let failedCount = 0;

    testCases.forEach((tc) => {
      if (tc.executionType === 'AUTOMATION') autoCount++;
      else manualCount++;

      if (tc.priority === 'BLOCKER') blockerCount++;
      else if (tc.priority === 'CRITICAL') criticalCount++;

      // Check latest result if available
      if (tc.results && tc.results.length > 0) {
        const latest = tc.results[0].status;
        if (latest === 'PASSED') passedCount++;
        else if (latest === 'FAILED') failedCount++;
      }
    });

    const autoPercentage = total > 0 ? Math.round((autoCount / total) * 100) : 0;

    return {
      total,
      manualCount,
      autoCount,
      autoPercentage,
      blockerCount,
      criticalCount,
      passedCount,
      failedCount,
    };
  }, [testCases]);

  // Filtered Scenarios
  const filteredCases = useMemo(() => {
    return testCases.filter((tc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = q
        ? tc.title.toLowerCase().includes(q) ||
          tc.code.toLowerCase().includes(q) ||
          (tc.description && tc.description.toLowerCase().includes(q)) ||
          (tc.precondition && tc.precondition.toLowerCase().includes(q)) ||
          (tc.jiraStoryKey && tc.jiraStoryKey.toLowerCase().includes(q))
        : true;

      const matchesPriority = priorityFilter === 'ALL' || tc.priority === priorityFilter;
      const matchesType = typeFilter === 'ALL' || tc.type === typeFilter;
      const matchesExecutionType =
        executionTypeFilter === 'ALL' || tc.executionType === executionTypeFilter;

      return matchesSearch && matchesPriority && matchesType && matchesExecutionType;
    });
  }, [testCases, searchQuery, priorityFilter, typeFilter, executionTypeFilter]);

  // Pagination Slice
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredCases.slice(start, start + rowsPerPage);
  }, [filteredCases, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredCases.length / rowsPerPage) || 1;

  // Toggle Selection
  const handleToggleSelectAll = () => {
    if (selectedCaseIds.length === paginatedCases.length) {
      setSelectedCaseIds([]);
    } else {
      setSelectedCaseIds(paginatedCases.map((c) => c.id));
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCaseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Run Selected Cases
  const handleRunSelected = () => {
    const selected = testCases.filter((c) => selectedCaseIds.includes(c.id));
    if (selected.length > 0) {
      onRunMultipleCases(selected);
    }
  };

  // Add selected cases to a test plan
  const handleConfirmAddToPlan = () => {
    if (!selectedTargetPlanId) return;
    try {
      const savedKey = `tcms_plan_cases_${selectedTargetPlanId}`;
      const existingRaw = localStorage.getItem(savedKey);
      const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = Array.from(new Set([...existing, ...selectedCaseIds]));
      localStorage.setItem(savedKey, JSON.stringify(updated));
      alert(`${selectedCaseIds.length} test senaryosu seçilen test planına başarıyla eklendi.`);
      setIsAddToPlanModalOpen(false);
      setSelectedCaseIds([]);
    } catch {
      // Ignore
    }
  };

  // Priority Badge Helper
  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'BLOCKER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3 h-3" />
            BLOCKER
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            NORMAL
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800">
            LOW
          </span>
        );
      default:
        return null;
    }
  };

  // Execution Type Badge Helper
  const getExecutionBadge = (t?: ExecutionType) => {
    if (t === 'AUTOMATION') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <Bot className="w-3 h-3" />
          Otomasyon
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <User className="w-3 h-3" />
        Manuel
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc] dark:bg-[#0b111e] select-none font-sans">
      {/* 1. Page Header */}
      <div className="px-6 pt-5 pb-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Test Senaryoları
            </h1>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {testCases.length} Senaryo
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Proje kapsamında bir kez tanımlanan ve tüm test planı ile koşumlarda tekrar tekrar kullanılabilen test senaryoları.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          {selectedCaseIds.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (testPlans.length > 0) {
                    setSelectedTargetPlanId(testPlans[0].id);
                    setIsAddToPlanModalOpen(true);
                  } else {
                    alert('Önce bir Test Planı oluşturmalısınız.');
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                <span>Test Planına Ekle ({selectedCaseIds.length})</span>
              </button>

              <button
                type="button"
                onClick={handleRunSelected}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Seçilenleri Koştur ({selectedCaseIds.length})</span>
              </button>
            </>
          )}

          {/* New Test Scenario Button */}
          <button
            type="button"
            onClick={onOpenNewCase}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] transition-all shadow-md shadow-[#821c2b]/25 active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Test Senaryosu</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Metrics Row (4 Cards) */}
      <div className="px-6 pb-4 shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Senaryo */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Toplam Test Senaryosu
            </span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              {metrics.total}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Proje Havuzunda Tanımlı
            </span>
          </div>
        </div>

        {/* Card 2: Otomasyon Oranı */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Otomasyon Kapsamı
            </span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              %{metrics.autoPercentage}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
              {metrics.autoCount} Otomasyon &bull; {metrics.manualCount} Manuel
            </span>
          </div>
        </div>

        {/* Card 3: Kritik & Blocker Senaryolar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Yüksek Öncelikli
            </span>
            <div className="flex items-center space-x-2 text-base font-extrabold leading-tight">
              <span className="text-rose-600 dark:text-rose-400">{metrics.blockerCount} Blocker</span>
              <span className="text-slate-300 dark:text-slate-600">&bull;</span>
              <span className="text-amber-600 dark:text-amber-400">{metrics.criticalCount} Critical</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Öncelikli Regresyon</span>
          </div>
        </div>

        {/* Card 4: Test Planı Entegrasyonu */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Aktif Test Planları
            </span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              {testPlans.length} Plan
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              1-to-N Yeniden Kullanım
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Data Grid Container */}
      <div className="flex-1 flex flex-col min-w-0 px-6 pb-6 overflow-hidden">
        <div className="flex-1 flex flex-col bg-white dark:bg-[#161f30] rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs overflow-hidden">
          {/* Filters & Search Row */}
          <div className="p-3.5 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-[#121926]/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Senaryo başlığı, kod, açıklama veya Jira key ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none font-medium shadow-xs"
              >
                <option value="ALL">Tüm Öncelikler</option>
                <option value="BLOCKER">Blocker</option>
                <option value="CRITICAL">Critical</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none font-medium shadow-xs"
              >
                <option value="ALL">Tüm Türler</option>
                <option value="WEB">Web</option>
                <option value="MOBILE">Mobile</option>
                <option value="API">API</option>
                <option value="PERFORMANCE">Performance</option>
              </select>

              <select
                value={executionTypeFilter}
                onChange={(e) => {
                  setExecutionTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none font-medium shadow-xs"
              >
                <option value="ALL">Tüm İcra Tipleri</option>
                <option value="MANUAL">Manuel</option>
                <option value="AUTOMATION">Otomasyon</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#121926]/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        paginatedCases.length > 0 &&
                        selectedCaseIds.length === paginatedCases.length
                      }
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 w-28">KOD</th>
                  <th className="py-3 px-3">TEST SENARYOSU</th>
                  <th className="py-3 px-3">TÜR</th>
                  <th className="py-3 px-3">ÖNCELİK</th>
                  <th className="py-3 px-3">İCRA TİPİ</th>
                  <th className="py-3 px-3">JIRA BAĞLANTISI</th>
                  <th className="py-3 px-3">ADIM SAYISI</th>
                  <th className="py-3 px-4 text-right">İŞLEMLER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedCases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        Test senaryosu bulunamadı.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 mb-4">
                        {searchQuery || priorityFilter !== 'ALL'
                          ? 'Arama kriterlerinize uygun senaryo bulunamadı.'
                          : 'Projeniz için ilk test senaryosunu oluşturarak başlayın.'}
                      </p>
                      <button
                        type="button"
                        onClick={onOpenNewCase}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>İlk Senaryoyu Oluştur</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedCases.map((tc) => {
                    const isChecked = selectedCaseIds.includes(tc.id);
                    return (
                      <tr
                        key={tc.id}
                        onClick={() => onSelectCase(tc)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggleSelectOne(tc.id, e as any)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Code Badge */}
                        <td className="py-3.5 px-3">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {tc.code}
                          </span>
                        </td>

                        {/* Title & Description */}
                        <td className="py-3.5 px-3">
                          <div className="min-w-0 max-w-lg">
                            <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {tc.title}
                            </p>
                            {tc.description && (
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {tc.description}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-3">
                          <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                            {tc.type}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-3">{getPriorityBadge(tc.priority)}</td>

                        {/* Execution Type */}
                        <td className="py-3.5 px-3">{getExecutionBadge(tc.executionType)}</td>

                        {/* Jira Link */}
                        <td className="py-3.5 px-3">
                          {tc.jiraStoryKey ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono text-[10px] font-bold">
                              {tc.jiraStoryKey}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-[11px] font-mono">
                              -
                            </span>
                          )}
                        </td>

                        {/* Steps Count */}
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 font-mono">
                          {tc.steps?.length || 0} Adım
                        </td>

                        {/* Actions (Play, Edit, Delete) */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1">
                            {/* Run Single Scenario */}
                            <button
                              type="button"
                              onClick={() => onRunSingleCase(tc)}
                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                              title="Bu Senaryoyu Koştur"
                              aria-label="Senaryoyu Koştur"
                            >
                              <Play className="w-3.5 h-3.5 fill-current text-emerald-600 dark:text-emerald-400" />
                            </button>

                            {/* Edit Scenario */}
                            <button
                              type="button"
                              onClick={() => onSelectCase(tc)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Senaryoyu Düzenle"
                              aria-label="Senaryoyu Düzenle"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Scenario */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`'${tc.code} - ${tc.title}' senaryosunu silmek istediğinize emin misiniz?`)) {
                                  onDeleteCase(tc.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                              title="Senaryoyu Sil"
                              aria-label="Senaryoyu Sil"
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

          {/* Footer & Pagination */}
          <div className="p-3.5 px-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-[#121926]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Toplam {filteredCases.length} senaryo</span>
              {selectedCaseIds.length > 0 && (
                <span className="font-bold text-blue-600">
                  &bull; {selectedCaseIds.length} seçildi
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
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
      </div>

      {/* Modal: Add Selected Cases to Test Plan */}
      {isAddToPlanModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#161f30] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <span>Test Planına Ekle</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddToPlanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Seçilen <span className="font-bold text-blue-600">{selectedCaseIds.length}</span> test senaryosunu eklemek istediğiniz test planını seçin:
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Hedef Test Planı
              </label>
              <select
                value={selectedTargetPlanId}
                onChange={(e) => setSelectedTargetPlanId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {testPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.version}] {p.title} ({p.environment})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddToPlanModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirmAddToPlan}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] transition-all shadow-xs cursor-pointer"
              >
                Plana Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
