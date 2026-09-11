import React, { useState, useMemo } from 'react';
import {
  Project,
  TestCase,
  TestPlan,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  ListOrdered,
  Folder,
  FileSpreadsheet,
  Download,
  Upload,
} from 'lucide-react';
import { downloadTestCaseTemplate, exportTestCasesToExcel } from '@/utils/excelUtils';
import { useCustomization } from '@/context/CustomizationContext';
import { ColumnCustomizerMenu } from './ColumnCustomizerMenu';
import { useNavigation } from '@/context/NavigationContext';
import { ScenarioImportSyncModal, SyncTab } from './ScenarioImportSyncModal';
import { TEST_TYPE_CONFIG } from '@/theme/status.tokens';

export function formatShortModuleName(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return 'Genel Havuz';
  let name = fullName.trim();

  // Strip leading emojis or bullet numbers like "📱 1. " or "💸 3. "
  name = name.replace(/^[\p{Emoji}\p{Symbol}\s\d\.\-_]+/u, '').trim() || name;

  // Pattern: "12_Para_Transferi - Para Transferi Senaryoları" -> extract clean label
  if (name.includes(' - ')) {
    const parts = name.split(' - ');
    let candidate = parts[1].trim();
    candidate = candidate.replace(/\s*(Senaryoları|Testleri|Modülü|İşlemleri|Akışı)$/i, '').trim();
    if (candidate.length >= 3) {
      return candidate;
    }
    return parts[0].replace(/^\d+[\_\-\.]\s*/, '').trim();
  }

  // Remove trailing "Senaryoları", "Modülü", "Testleri"
  name = name.replace(/\s*(Senaryoları|Testleri|Modülü)$/i, '').trim();

  // If starts with "XX_Word"
  name = name.replace(/^\d+[\_\-\.]\s*/, '').trim();

  return name || fullName;
}

interface TestScenariosViewProps {
  project: Project | null;
  projects?: Project[];
  testCases: TestCase[];
  testPlans?: TestPlan[];
  onSelectCase: (testCase: TestCase) => void;
  onOpenNewCase: () => void;
  onOpenQuickRun?: (testCase: TestCase) => void;
  onRunSingleCase?: (testCase: TestCase) => void;
  onRunMultipleCases?: (testCases: TestCase[]) => void;
  onDeleteCase: (caseId: string) => void;
  onCasesChange?: () => Promise<void> | void;
  onOpenAutomationModal?: () => void;
}

export const TestScenariosView: React.FC<TestScenariosViewProps> = ({
  project,
  projects = [],
  testCases = [],
  testPlans = [],
  onSelectCase,
  onOpenNewCase,
  onOpenQuickRun,
  onRunSingleCase,
  onDeleteCase,
  onCasesChange,
  onOpenAutomationModal,
}) => {
  const { can } = useAuth();
  const { pushState } = useNavigation();
  const { getVisibleColumns, getModuleConfig, getDensityClasses } = useCustomization();
  const visibleCols = getVisibleColumns('test-cases');
  const moduleConfig = getModuleConfig('test-cases');
  const densityCls = getDensityClasses(moduleConfig.density);

  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [syncModalTab, setSyncModalTab] = useState<SyncTab>('CUCUMBER');

  const openSyncModal = (tab: SyncTab) => {
    setSyncModalTab(tab);
    setIsImportModalOpen(true);
  };

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Overall Metrics Calculation
  const metrics = useMemo(() => {
    const total = testCases.length;
    let jiraLinkedCount = 0;
    let totalStepsCount = 0;

    testCases.forEach((tc) => {
      if (tc.jiraStoryKey) jiraLinkedCount++;
      if (tc.steps) totalStepsCount += tc.steps.length;
    });

    const jiraPercentage = total > 0 ? Math.round((jiraLinkedCount / total) * 100) : 0;

    return {
      total,
      jiraLinkedCount,
      jiraPercentage,
      totalStepsCount,
    };
  }, [testCases]);

  // Filtered Scenarios
  const filteredCases = useMemo(() => {
    return testCases.filter((tc) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        tc.title.toLowerCase().includes(q) ||
        tc.code.toLowerCase().includes(q) ||
        (tc.description && tc.description.toLowerCase().includes(q)) ||
        (tc.precondition && tc.precondition.toLowerCase().includes(q)) ||
        (tc.jiraStoryKey && tc.jiraStoryKey.toLowerCase().includes(q))
      );
    });
  }, [testCases, searchQuery]);

  // Pagination Slice
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredCases.slice(start, start + rowsPerPage);
  }, [filteredCases, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredCases.length / rowsPerPage) || 1;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f8fafc] dark:bg-[#0b111e] select-none font-sans min-h-0">
      {/* 1. Page Header */}
      <div className="px-6 pt-4 pb-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#161f30] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Test Senaryoları
            </h1>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {testCases.length} Senaryo
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Proje kapsamında bir kez tanımlanan ve tüm test planı ile koşumlarda tekrar tekrar kullanılabilen test senaryoları.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Excel & Customizer Group */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            {/* Download Template */}
            <button
              type="button"
              onClick={downloadTestCaseTemplate}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Excel İçe Aktarma Şablonunu İndir"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Şablon</span>
            </button>

            {/* Export Cases */}
            <button
              type="button"
              onClick={() => exportTestCasesToExcel(testCases, project?.name || 'Proje')}
              disabled={testCases.length === 0}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer"
              title="Mevcut Test Senaryolarını Excel'e Aktar"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            
            {/* Column Customizer Dropdown */}
            <ColumnCustomizerMenu moduleId="test-cases" />
          </div>

          {/* Multi-Channel Sync & Import Group */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            {/* Cucumber .feature Quick Trigger */}
            <button
              type="button"
              onClick={() => openSyncModal('CUCUMBER')}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Cucumber (.feature) dosyasından senaryo içe aktar veya güncelle"
            >
              <span className="text-xs">🥒</span>
              <span className="hidden md:inline">Cucumber</span>
            </button>

            {/* Playwright .spec.ts Quick Trigger */}
            <button
              type="button"
              onClick={() => openSyncModal('PLAYWRIGHT')}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Playwright (.spec.ts) dosyasından senaryo içe aktar veya güncelle"
            >
              <span className="text-xs">🎭</span>
              <span className="hidden md:inline">Playwright</span>
            </button>

            {/* TAC Service Live Sync Quick Trigger */}
            <button
              type="button"
              onClick={() => openSyncModal('TAC')}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="TAC (Port 8000) servisi ile senkronize et ve koşum başlat"
            >
              <span className="text-xs">⚡</span>
              <span className="hidden md:inline">TAC Sync</span>
            </button>

            {/* General Import / Hub Modal */}
            <button
              type="button"
              onClick={() => openSyncModal('CUCUMBER')}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 shadow-2xs transition-all cursor-pointer"
              title="Tüm içe aktarma ve güncelleme kanalları merkezi"
            >
              <Upload className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>İçe Aktar & Güncelle</span>
            </button>
          </div>

          {/* New Test Scenario Button (Manual Creation) */}
          <button
            type="button"
            onClick={onOpenNewCase}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 transition-all shadow-sm shadow-[var(--accent-dark)]/20 active:scale-98 cursor-pointer"
            title="Manuel olarak yeni bir Test Senaryosu oluştur"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Test Senaryosu</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Metrics Row (4 Compact Cards) */}
      <div className="px-6 py-3 shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Toplam Senaryo */}
        <div className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Toplam Senaryo
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                {metrics.total}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Senaryo</span>
            </div>
          </div>
        </div>

        {/* Card 2: Jira Kapsamı */}
        <div className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Jira Kapsamı
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                %{metrics.jiraPercentage}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">({metrics.jiraLinkedCount})</span>
            </div>
          </div>
        </div>

        {/* Card 3: Toplam Adım */}
        <div className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ListOrdered className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Tanımlı Test Adımları
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                {metrics.totalStepsCount}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Adım</span>
            </div>
          </div>
        </div>

        {/* Card 4: Test Planı Entegrasyonu */}
        <div className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Aktif Test Planları
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                {testPlans.length} Plan
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Bağlı</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Data Grid Container */}
      <div className="min-w-0 px-6 pb-6">
        <div className="bg-white dark:bg-[#161f30] rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs overflow-hidden">
          {/* Search Row */}
          <div className="p-2.5 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-[#121926]/40 flex items-center justify-between gap-2.5 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Senaryo başlığı, kod veya Jira key ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
              />
            </div>
          </div>

          {/* Table with Clean Columns */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-full">
              <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-[#1a2333] border-b border-slate-200 dark:border-slate-700/80 shadow-xs">
                <tr className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  {visibleCols.map((col) => (
                    <th
                      key={col.id}
                      style={{ width: col.width || 'auto' }}
                      className={`${densityCls.pyTh} px-4 whitespace-nowrap text-${col.align || 'left'}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedCases.length === 0 ? (
                  <tr>
                    <td colSpan={visibleCols.length || 6} className="py-16 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        Test senaryosu bulunamadı.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 mb-4">
                        {searchQuery
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
                    return (
                      <tr
                        key={tc.id}
                        onClick={() => onSelectCase(tc)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        {visibleCols.map((col) => {
                          const alignClass = `text-${col.align || 'left'}`;

                          if (col.id === 'code') {
                            return (
                              <td key={col.id} className={`${densityCls.pyTd} px-4 whitespace-nowrap ${alignClass}`}>
                                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  {tc.code}
                                </span>
                              </td>
                            );
                          }

                          if (col.id === 'title') {
                            return (
                              <td key={col.id} className={`${densityCls.pyTd} px-3 min-w-0 max-w-xl whitespace-nowrap ${alignClass}`}>
                                <div className="min-w-0">
                                  <p
                                    className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate text-xs"
                                    title={tc.description ? `${tc.title}\n\nAçıklama: ${tc.description}` : tc.title}
                                  >
                                    {tc.title}
                                  </p>
                                  {tc.description && (
                                    <p
                                      className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5"
                                      title={tc.description}
                                    >
                                      {tc.description}
                                    </p>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          if (col.id === 'module') {
                            const parentName = (tc.suite as any)?.parent?.name;
                            const suiteTitle = tc.suite?.name;
                            const shortName = formatShortModuleName(suiteTitle);
                            const fullHierarchy = parentName && suiteTitle ? `${parentName} → ${suiteTitle}` : (suiteTitle || 'Genel Havuz');

                            return (
                              <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium ${alignClass}`}>
                                <div
                                  className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 max-w-[190px] truncate"
                                  title={`Modül: ${fullHierarchy}`}
                                >
                                  <Folder className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className="truncate font-semibold text-[11px]">
                                    {shortName}
                                  </span>
                                </div>
                              </td>
                            );
                          }

                          if (col.id === 'type') {
                            const typeCfg = TEST_TYPE_CONFIG[tc.type];
                            return (
                              <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap ${alignClass}`}>
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded-full border font-mono font-semibold inline-flex items-center gap-1 ${
                                    typeCfg?.badgeClass ||
                                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <span>{typeCfg?.icon || '⚙️'}</span>
                                  <span>{tc.type || 'WEB'}</span>
                                </span>
                              </td>
                            );
                          }

                          if (col.id === 'executionType') {
                            const isAuto = tc.executionType === 'AUTOMATION' || (tc.executionType as string) === 'AUTOMATED';
                            const desc = (tc.description || '').toLowerCase();
                            const code = (tc.code || '').toLowerCase();
                            const isCucumber = desc.includes('cucumber') || desc.includes('gherkin') || code.includes('mob-tc');
                            const isPlaywright = desc.includes('playwright') || desc.includes('.spec');
                            const isTac = desc.includes('tac');

                            let badgeLabel: string = tc.executionType || 'MANUAL';
                            let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                            if (isCucumber) {
                              badgeLabel = '🥒 CUCUMBER';
                              badgeStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                            } else if (isPlaywright) {
                              badgeLabel = '🎭 PLAYWRIGHT';
                              badgeStyle = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
                            } else if (isTac) {
                              badgeLabel = '⚡ TAC SYNC';
                              badgeStyle = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                            } else if (isAuto) {
                              badgeLabel = '🤖 AUTOMATED';
                              badgeStyle = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
                            }

                            return (
                              <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap ${alignClass}`}>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeStyle}`}>
                                  {badgeLabel}
                                </span>
                              </td>
                            );
                          }

                          if (col.id === 'priority') {
                            return (
                              <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap ${alignClass}`}>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    tc.priority === 'BLOCKER' || tc.priority === 'CRITICAL'
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                      : tc.priority === 'NORMAL'
                                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {tc.priority || 'NORMAL'}
                                </span>
                              </td>
                            );
                          }

                          if (col.id === 'jiraStoryKey') {
                            return (
                              <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap ${alignClass}`}>
                                {tc.jiraStoryKey ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono text-[10px] font-bold">
                                    {tc.jiraStoryKey}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 text-[11px] font-mono">
                                    -
                                  </span>
                                )}
                              </td>
                            );
                          }

                          if (col.id === 'stepsCount') {
                            return (
                              <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px] ${alignClass}`}>
                                {tc.steps?.length || 0} Adım
                              </td>
                            );
                          }

                          if (col.id === 'lastResult') {
                            const lastRes = tc.results && tc.results.length > 0 ? tc.results[0] : null;
                            return (
                              <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap ${alignClass}`}>
                                {lastRes ? (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      lastRes.status === 'PASSED'
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                        : lastRes.status === 'FAILED'
                                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                    }`}
                                  >
                                    {lastRes.status}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">Koşulmadı</span>
                                )}
                              </td>
                            );
                          }

                          if (col.id === 'updatedAt') {
                            const dateValue = tc.updatedAt || tc.createdAt;
                            let formatted = '—';
                            let fullTitle = '';
                            if (dateValue) {
                              try {
                                const d = new Date(dateValue);
                                if (!isNaN(d.getTime())) {
                                  formatted = d.toLocaleString('tr-TR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  });
                                  fullTitle = `Güncellenme: ${d.toLocaleString('tr-TR')}`;
                                }
                              } catch {
                                formatted = '—';
                              }
                            }

                            return (
                              <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px] font-mono ${alignClass}`}>
                                <span title={fullTitle || undefined}>
                                  {formatted}
                                </span>
                              </td>
                            );
                          }

                          if (col.id === 'actions') {
                            return (
                              <td key={col.id} className={`${densityCls.pyTd} px-4 text-right whitespace-nowrap`} onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end space-x-1">
                                  {/* Quick Run Scenario */}
                                  {(onOpenQuickRun || onRunSingleCase) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onOpenQuickRun) onOpenQuickRun(tc);
                                        else if (onRunSingleCase) onRunSingleCase(tc);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer shadow-2xs"
                                      title="Bu Senaryoyu Hızlı Koş"
                                      aria-label="Hızlı Koş"
                                    >
                                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                      <span>Hızlı Koş</span>
                                    </button>
                                  )}

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

                                  {/* Delete Scenario (Admin & Test Lead only) */}
                                  {can('DELETE_CASE') && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`'${tc.code} - ${tc.title}' senaryosunu silmek / arşivlemek istediğinize emin misiniz?\n\n(Not: Senaryonun geçmiş koşum kayıtları varsa denetim izini korumak için güvenle arşivlenecektir.)`)) {
                                          onDeleteCase(tc.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                                      title="Senaryoyu Sil / Arşivle"
                                      aria-label="Senaryoyu Sil / Arşivle"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap ${alignClass}`}>
                              —
                            </td>
                          );
                        })}
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
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161f30] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Channel Scenario Import & Sync Modal (Cucumber, Playwright, TAC, Excel) */}
      {project && (
        <ScenarioImportSyncModal
          isOpen={isImportModalOpen}
          initialTab={syncModalTab}
          projectId={project.id}
          projectName={project.name}
          existingCases={testCases}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={async () => {
            if (onCasesChange) {
              await onCasesChange();
            }
          }}
          onOpenAutomationModal={onOpenAutomationModal}
        />
      )}
    </div>
  );
};
