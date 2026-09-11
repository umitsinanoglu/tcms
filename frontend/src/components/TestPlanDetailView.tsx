import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Project,
  TestPlan,
  TestCase,
  SuiteTreeNode,
  TestRun,
  PlanStatus,
  Priority,
  TestType,
  ResultStatus,
  TestPlansService,
  TestCasesService,
  UpdateTestPlanDto,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { TEST_TYPE_CONFIG } from '@/theme/status.tokens';
import { EditTestPlanModal } from './EditTestPlanModal';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Pencil,
  Trash2,
  Plus,
  Search,
  Filter,
  Layers,
  Server,
  Tag,
  FileText,
  Activity,
  FolderKanban,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Folder,
  SlidersHorizontal,
  ChevronDown,
  PlayCircle,
  Eye,
  Sparkles,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';

interface TestPlanDetailViewProps {
  plan: TestPlan;
  project: Project | null;
  projects?: Project[];
  allCases?: TestCase[];
  tree?: SuiteTreeNode[];
  onBack: () => void;
  onStartRunWithPlan: (plan: TestPlan, cases?: TestCase[]) => void;
  onSelectCase?: (testCase: TestCase) => void;
  onUpdatePlanSuccess?: (updated: TestPlan) => void;
  onDeletePlanSuccess?: (deletedId: string) => void;
}

type DetailTab = 'SCENARIOS' | 'RUNS';

export const TestPlanDetailView: React.FC<TestPlanDetailViewProps> = ({
  plan: initialPlan,
  project,
  projects = [],
  allCases = [],
  tree = [],
  onBack,
  onStartRunWithPlan,
  onSelectCase,
  onUpdatePlanSuccess,
  onDeletePlanSuccess,
}) => {
  const { can } = useAuth();
  const [plan, setPlan] = useState<TestPlan>(initialPlan);
  const [activeTab, setActiveTab] = useState<DetailTab>('SCENARIOS');
  const [isLoading, setIsLoading] = useState(false);

  // Quick Inline Edit Mode State
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editTitle, setEditTitle] = useState(plan.title);
  const [editDescription, setEditDescription] = useState(plan.description || '');
  const [editEnvironment, setEditEnvironment] = useState(plan.environment || 'STAGING');
  const [editVersion, setEditVersion] = useState(plan.version || 'v1.0.0');
  const [editStatus, setEditStatus] = useState<PlanStatus>(plan.status || 'ACTIVE');
  const [editScope, setEditScope] = useState(plan.scope || '');
  const [editRequirements, setEditRequirements] = useState(plan.requirements || '');
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

  // Scenarios In Plan State
  // We keep track of scenario IDs assigned to this plan (persisted in DB and synced locally)
  const [planCaseIds, setPlanCaseIds] = useState<string[]>(() => {
    if (initialPlan.cases && initialPlan.cases.length > 0) {
      return initialPlan.cases.map((c) => c.testCaseId);
    }
    try {
      const saved = localStorage.getItem(`tcms_plan_cases_${initialPlan.id}`);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  // Selected scenarios in table (for bulk operations)
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal: Add Existing Cases to Plan State & Filters
  const [isAddCasesModalOpen, setIsAddCasesModalOpen] = useState(false);
  const [candidateCaseIdsToAdd, setCandidateCaseIdsToAdd] = useState<string[]>([]);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [candidateSuiteFilter, setCandidateSuiteFilter] = useState<string>('ALL');
  const [candidatePriorityFilter, setCandidatePriorityFilter] = useState<string>('ALL');
  const [candidateTypeFilter, setCandidateTypeFilter] = useState<string>('ALL');

  // Synchronize when initialPlan changes
  useEffect(() => {
    setPlan(initialPlan);
    setEditTitle(initialPlan.title);
    setEditDescription(initialPlan.description || '');
    setEditEnvironment(initialPlan.environment || 'STAGING');
    setEditVersion(initialPlan.version || 'v1.0.0');
    setEditStatus(initialPlan.status || 'ACTIVE');
    setEditScope(initialPlan.scope || '');
    setEditRequirements(initialPlan.requirements || '');

    if (initialPlan.cases && initialPlan.cases.length > 0) {
      setPlanCaseIds(initialPlan.cases.map((c) => c.testCaseId));
    } else {
      try {
        const saved = localStorage.getItem(`tcms_plan_cases_${initialPlan.id}`);
        if (saved !== null) {
          setPlanCaseIds(JSON.parse(saved));
        } else {
          setPlanCaseIds([]);
        }
      } catch {
        setPlanCaseIds([]);
      }
    }
  }, [initialPlan]);

  // Reload Plan from backend
  const reloadPlan = useCallback(async () => {
    setIsLoading(true);
    try {
      const fresh = await TestPlansService.getOne(plan.id);
      if (fresh) {
        setPlan(fresh);
        setEditTitle(fresh.title);
        setEditDescription(fresh.description || '');
        setEditEnvironment(fresh.environment || 'STAGING');
        setEditVersion(fresh.version || 'v1.0.0');
        setEditStatus(fresh.status || 'ACTIVE');
        setEditScope(fresh.scope || '');
        setEditRequirements(fresh.requirements || '');
        if (fresh.cases && fresh.cases.length > 0) {
          const ids = fresh.cases.map((c) => c.testCaseId);
          setPlanCaseIds(ids);
          try {
            localStorage.setItem(`tcms_plan_cases_${fresh.id}`, JSON.stringify(ids));
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to reload test plan:', err);
    } finally {
      setIsLoading(false);
    }
  }, [plan.id]);

  // Save Plan Case IDs to server and localStorage
  const updatePlanCaseIds = (newIds: string[]) => {
    setPlanCaseIds(newIds);
    try {
      localStorage.setItem(`tcms_plan_cases_${plan.id}`, JSON.stringify(newIds));
    } catch {
      // Ignore
    }
    TestPlansService.syncCases(plan.id, newIds).catch((err) => {
      console.warn('Failed to sync plan cases to server:', err);
    });
  };

  // Scenarios mapped to this plan
  const planCases: TestCase[] = useMemo(() => {
    if (allCases.length === 0 || planCaseIds.length === 0) return [];
    return allCases.filter((c) => planCaseIds.includes(c.id));
  }, [allCases, planCaseIds]);

  // Filtered Scenarios in current plan table
  const filteredPlanCases = useMemo(() => {
    return planCases.filter((c) => {
      const matchesSearch = searchQuery
        ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      const matchesPriority = priorityFilter === 'ALL' || c.priority === priorityFilter;
      const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
      return matchesSearch && matchesPriority && matchesType;
    });
  }, [planCases, searchQuery, priorityFilter, typeFilter]);

  // Available suites for candidate filtering
  const availableSuites = useMemo(() => {
    const suitesMap = new Map<string, string>();
    allCases.forEach((c) => {
      if (c.suiteId && c.suite?.name) {
        suitesMap.set(c.suiteId, c.suite.name);
      }
    });
    return Array.from(suitesMap.entries()).map(([id, name]) => ({ id, name }));
  }, [allCases]);

  // Candidates for adding to plan (unassigned cases matching modal filters)
  const candidateCases = useMemo(() => {
    return allCases.filter((c) => {
      // Must not already be in this plan
      if (planCaseIds.includes(c.id)) return false;

      // Search filter
      if (candidateSearchQuery) {
        const q = candidateSearchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchCode = c.code.toLowerCase().includes(q);
        const matchDesc = c.description ? c.description.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchCode && !matchDesc) return false;
      }

      // Suite filter
      if (candidateSuiteFilter !== 'ALL' && c.suiteId !== candidateSuiteFilter) {
        return false;
      }

      // Priority filter
      if (candidatePriorityFilter !== 'ALL' && c.priority === candidatePriorityFilter) {
        return false;
      }

      // Type filter
      if (candidateTypeFilter !== 'ALL' && c.type !== candidateTypeFilter) {
        return false;
      }

      return true;
    });
  }, [allCases, planCaseIds, candidateSearchQuery, candidateSuiteFilter, candidatePriorityFilter, candidateTypeFilter]);

  // Candidate selection helpers
  const isAllCandidatesSelected = useMemo(() => {
    if (candidateCases.length === 0) return false;
    return candidateCases.every((c) => candidateCaseIdsToAdd.includes(c.id));
  }, [candidateCases, candidateCaseIdsToAdd]);

  const handleSelectAllCandidates = () => {
    const idsToAdd = candidateCases.map((c) => c.id);
    setCandidateCaseIdsToAdd((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleDeselectAllCandidates = () => {
    const filteredIds = new Set(candidateCases.map((c) => c.id));
    setCandidateCaseIdsToAdd((prev) => prev.filter((id) => !filteredIds.has(id)));
  };

  // Table selection helpers in Scenarios Tab
  const isAllFilteredSelected = useMemo(() => {
    if (filteredPlanCases.length === 0) return false;
    return filteredPlanCases.every((c) => selectedCaseIds.includes(c.id));
  }, [filteredPlanCases, selectedCaseIds]);

  const handleToggleSelectAllPlanCases = () => {
    if (isAllFilteredSelected) {
      const filteredSet = new Set(filteredPlanCases.map((c) => c.id));
      setSelectedCaseIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const visibleIds = filteredPlanCases.map((c) => c.id);
      setSelectedCaseIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleCaseSelection = (caseId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCaseIds((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId]
    );
  };

  // Statistics calculation for this plan
  const stats = useMemo(() => {
    const total = planCases.length;
    let passed = 0;
    let failed = 0;
    let blocked = 0;
    let skipped = 0;
    let executed = 0;

    if (plan.testRuns && plan.testRuns.length > 0) {
      plan.testRuns.forEach((r) => {
        if (r.results) {
          r.results.forEach((res) => {
            if (total === 0 || planCaseIds.includes(res.testCaseId)) {
              executed++;
              if (res.status === 'PASSED') passed++;
              else if (res.status === 'FAILED') failed++;
              else if (res.status === 'BLOCKED') blocked++;
              else if (res.status === 'SKIPPED') skipped++;
            }
          });
        }
      });
    }

    const passRate = executed > 0 ? Math.round((passed / executed) * 100) : 0;

    return {
      total,
      executed,
      passed,
      failed,
      blocked,
      skipped,
      passRate,
    };
  }, [planCases, plan.testRuns, planCaseIds]);

  // Save Inline Metadata
  const handleSaveMetadata = async () => {
    setIsSavingMetadata(true);
    try {
      const updateData: UpdateTestPlanDto = {
        title: editTitle.trim() || plan.title,
        description: editDescription.trim(),
        environment: editEnvironment,
        version: editVersion.trim() || 'v1.0.0',
        status: editStatus,
        scope: editScope.trim(),
        requirements: editRequirements.trim(),
      };

      const updated = await TestPlansService.update(plan.id, updateData);
      setPlan(updated);
      setIsEditingMetadata(false);
      if (onUpdatePlanSuccess) onUpdatePlanSuccess(updated);
    } catch (err) {
      console.error('Failed to update plan metadata:', err);
      alert('Test planı güncellenirken bir hata oluştu.');
    } finally {
      setIsSavingMetadata(false);
    }
  };

  // Add selected cases to plan
  const handleConfirmAddCases = () => {
    const combined = Array.from(new Set([...planCaseIds, ...candidateCaseIdsToAdd]));
    updatePlanCaseIds(combined);
    setIsAddCasesModalOpen(false);
    setCandidateCaseIdsToAdd([]);
  };

  // Remove a single case from plan
  const handleRemoveCaseFromPlan = (caseId: string) => {
    const updated = planCaseIds.filter((id) => id !== caseId);
    updatePlanCaseIds(updated);
    setSelectedCaseIds((prev) => prev.filter((id) => id !== caseId));
  };

  // Remove selected cases from plan
  const handleRemoveSelectedCases = () => {
    if (selectedCaseIds.length === 0) return;
    if (!confirm(`${selectedCaseIds.length} senaryoyu test planından çıkarmak istediğinize emin misiniz?`)) return;
    const updated = planCaseIds.filter((id) => !selectedCaseIds.includes(id));
    updatePlanCaseIds(updated);
    setSelectedCaseIds([]);
  };

  // Handle plan delete
  const handleDeletePlan = async () => {
    if (!confirm(`'${plan.title}' adlı test planını silmek istediğinize emin misiniz?\n\n(Not: Eğer bu plana bağlı geçmiş test koşumları varsa, denetim izini korumak amacıyla plan silinemez; durumu 'ARCHIVED' yapılmalıdır.)`)) return;
    try {
      await TestPlansService.delete(plan.id);
      if (onDeletePlanSuccess) onDeletePlanSuccess(plan.id);
      onBack();
    } catch (err: any) {
      console.error('Failed to delete test plan:', err);
      const msg = err?.response?.data?.message || err?.message || 'Test planı silinemedi.';
      alert(msg);
    }
  };

  // Collapsible metadata state (default collapsed for high information density)
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);

  // Helper badge for status
  const getStatusBadge = (status: PlanStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
            AKTİF
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-xs">
            <Clock className="w-3 h-3 text-slate-500" />
            TASLAK
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60 shadow-xs">
            <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            TAMAMLANDI
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs">
            ARŞİV
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f8fafc] dark:bg-[#0b111e] font-sans select-none min-h-0">
      {/* 1. Top Breadcrumb & Action Bar */}
      <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#161f30] shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Left: Back Button & Title Info */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1d232f] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-500/40 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all shadow-xs shrink-0 cursor-pointer"
            title="Test Planlarına Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
              <span className="truncate max-w-[140px]">{project?.name || 'Test Projesi'}</span>
              <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300 font-semibold">Test Planları</span>
              <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
              <span className="font-mono text-[#2563eb] dark:text-[#3b82f6] font-bold">
                [{plan.version || 'v1.0.0'}]
              </span>
            </div>

            <div className="flex items-center space-x-2.5 mt-0.5 flex-wrap">
              <h1 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {plan.title}
              </h1>
              {getStatusBadge(plan.status)}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={reloadPlan}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1d232f] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isMetadataExpanded && !isEditingMetadata) {
                setIsMetadataExpanded(true);
              }
              setIsEditingMetadata((prev) => !prev);
            }}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
              isEditingMetadata
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40'
                : 'bg-white dark:bg-[#1d232f] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Pencil className="w-3.5 h-3.5 text-slate-500" />
            <span>{isEditingMetadata ? 'Düzenlemeyi Kapat' : 'Planı Düzenle'}</span>
          </button>

          {can('DELETE_PLAN') && (
            <button
              type="button"
              onClick={handleDeletePlan}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1d232f] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-500/30 transition-all shadow-xs cursor-pointer"
              title="Test Planını Sil (Admin & Test Lead)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onStartRunWithPlan(plan, planCases)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Bu Planla Koşum Başlat</span>
          </button>
        </div>
      </div>

      {/* 2. Collapsible Plan Details Summary Bar & Panel */}
      <div className="px-6 py-2.5 shrink-0">
        <div className="rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs transition-all overflow-hidden">
          {/* Header Strip with Toggle Button */}
          <div className="px-4 py-2 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80">
            {/* Quick Summary Chips when collapsed */}
            <div className="flex items-center space-x-4 text-xs overflow-x-auto py-0.5">
              <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                <Server className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[11px] text-slate-400 font-medium">Ortam:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{plan.environment || 'STAGING'}</span>
              </div>

              <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                <Tag className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[11px] text-slate-400 font-medium">Sürüm:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{plan.version || 'v1.0.0'}</span>
              </div>

              {plan.scope && (
                <div className="hidden sm:flex items-center space-x-1 text-slate-600 dark:text-slate-300 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] text-slate-400 font-medium">Kapsam:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{plan.scope}</span>
                </div>
              )}

              {plan.requirements && (
                <div className="hidden md:flex items-center space-x-1 text-slate-600 dark:text-slate-300 shrink-0">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] text-slate-400 font-medium">Jira:</span>
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[130px]">{plan.requirements}</span>
                </div>
              )}
            </div>

            {/* Toggle Expand / Collapse Button */}
            <button
              type="button"
              onClick={() => setIsMetadataExpanded((prev) => !prev)}
              className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors shrink-0 cursor-pointer"
            >
              <span>{isMetadataExpanded ? 'Plan Detaylarını Gizle' : 'Plan Detaylarını Göster'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMetadataExpanded ? 'rotate-180 text-blue-600' : ''}`} />
            </button>
          </div>

          {/* Expandable Content Area */}
          {(isMetadataExpanded || isEditingMetadata) && (
            <div className="p-4 bg-white dark:bg-[#161f30] border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
              {isEditingMetadata ? (
                /* Editing Form Mode */
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5 text-blue-600" />
                      <span>Test Planı Bilgilerini Düzenle</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Değişiklikleri kaydetmeyi unutmayın</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Title */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Plan Başlığı *
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-semibold"
                        placeholder="Plan Başlığı"
                      />
                    </div>

                    {/* Hedef Ortam */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Hedef Ortam
                      </label>
                      <select
                        value={editEnvironment}
                        onChange={(e) => setEditEnvironment(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                      >
                        <option value="DEV">DEV (Geliştirme)</option>
                        <option value="TEST">TEST</option>
                        <option value="STAGING">STAGING</option>
                        <option value="UAT">UAT</option>
                        <option value="PROD">PROD (Canlı)</option>
                      </select>
                    </div>

                    {/* Hedef Sürüm */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Hedef Sürüm
                      </label>
                      <input
                        type="text"
                        value={editVersion}
                        onChange={(e) => setEditVersion(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono font-bold"
                        placeholder="v1.0.0"
                      />
                    </div>

                    {/* Durum */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Plan Durumu
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as PlanStatus)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                      >
                        <option value="ACTIVE">Aktif (ACTIVE)</option>
                        <option value="DRAFT">Taslak (DRAFT)</option>
                        <option value="COMPLETED">Tamamlandı (COMPLETED)</option>
                        <option value="ARCHIVED">Arşiv (ARCHIVED)</option>
                      </select>
                    </div>

                    {/* Kapsam */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Kapsam ve Modüller
                      </label>
                      <input
                        type="text"
                        value={editScope}
                        onChange={(e) => setEditScope(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        placeholder="Web, Mobil, API, Ödeme Ağ Geçidi..."
                      />
                    </div>

                    {/* Jira / Gereksinimler */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Jira Kayıtları / Gereksinim Kodları
                      </label>
                      <input
                        type="text"
                        value={editRequirements}
                        onChange={(e) => setEditRequirements(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                        placeholder="PROJ-101, PROJ-102, REQ-88..."
                      />
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Açıklama ve Kapsam Detayı
                      </label>
                      <textarea
                        rows={2}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        placeholder="Bu test planının kapsamı, hedefleri ve test stratejisi..."
                      />
                    </div>
                  </div>

                  {/* Actions Save / Cancel */}
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingMetadata(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      disabled={isSavingMetadata}
                      onClick={handleSaveMetadata}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                    >
                      {isSavingMetadata ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>{isSavingMetadata ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Full Display View Mode */
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hedef Ortam
                    </span>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <Server className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {plan.environment || 'STAGING'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hedef Sürüm
                    </span>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <Tag className="w-3.5 h-3.5 text-purple-500" />
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {plan.version || 'v1.0.0'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Kapsam
                    </span>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {plan.scope || 'Web, Mobil'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Gereksinimler / Jira
                    </span>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                        {plan.requirements || 'Belirtilmedi'}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Açıklama
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 leading-relaxed">
                      {plan.description || 'Bu test planı için özel bir açıklama girilmemiş.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. KPI Metrics Row (4 Compact Cards) */}
      <div className="px-6 py-2 shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Scenarios */}
        <div className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Toplam Senaryo
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                {stats.total}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Kapsamda</span>
            </div>
          </div>
        </div>

        {/* Executed Scenarios */}
        <div className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <PlayCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Çalıştırılan Senaryo
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                {stats.executed}
              </span>
              <span className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                %{Math.round((stats.executed / (stats.total || 1)) * 100)}
              </span>
            </div>
          </div>
        </div>

        {/* Pass / Fail Breakdown */}
        <div className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Başarılı / Başarısız
            </span>
            <div className="flex items-center space-x-1.5 text-sm font-black leading-none">
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">{stats.passed} Pass</span>
              <span className="text-slate-300 dark:text-slate-600 font-normal">&bull;</span>
              <span className="text-rose-700 dark:text-rose-300 font-bold">{stats.failed} Fail</span>
            </div>
          </div>
        </div>

        {/* Pass Rate Progress Bar */}
        <div className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Başarı Oranı
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                {stats.executed > 0 ? `%${stats.passRate}` : '—'}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  stats.passRate >= 75
                    ? 'bg-emerald-500'
                    : stats.passRate >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${stats.executed > 0 ? stats.passRate : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
{/* 4. Tab Navigation & Content */}
      <div className="min-w-0 px-6 pb-6">
        <div className="bg-white dark:bg-[#161f30] rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs overflow-hidden">
          {/* Tabs Header */}
          <div className="flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold shrink-0">
            <div className="flex items-center space-x-6">
              <button
                type="button"
                onClick={() => setActiveTab('SCENARIOS')}
                className={`py-3 border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
                  activeTab === 'SCENARIOS'
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>Test Senaryoları</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold">
                  {planCases.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('RUNS')}
                className={`py-3 border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
                  activeTab === 'RUNS'
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>Test Koşumları Geçmişi</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  {plan.testRuns?.length || plan._count?.testRuns || 0}
                </span>
              </button>
            </div>

            {/* Action buttons inside Scenarios Tab */}
            {activeTab === 'SCENARIOS' && selectedCaseIds.length > 0 && (
              <div className="flex items-center space-x-2 py-2">
                <button
                  type="button"
                  onClick={handleRemoveSelectedCases}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 dark:hover:border-rose-800 transition-colors cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Seçilenleri Plandan Çıkar ({selectedCaseIds.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: Test Scenarios Management */}
          {activeTab === 'SCENARIOS' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search & Filters & Add Scenario Button */}
              <div className="p-2.5 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-[#121926]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Senaryo başlığı veya kod ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
                  >
                    <option value="ALL">Tüm Öncelikler</option>
                    <option value="BLOCKER">Blocker</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LOW">Low</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
                  >
                    <option value="ALL">Tüm Türler</option>
                    <option value="WEB">Web</option>
                    <option value="MOBILE">Mobile / Mobil</option>
                    <option value="API">API</option>
                    <option value="PERFORMANCE">Performance</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setCandidateCaseIdsToAdd([]);
                      setIsAddCasesModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Test Senaryosu Ekle</span>
                  </button>
                </div>
              </div>

              {/* Scenarios Table with Multi-Select Checkboxes */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-[#1a2333] border-b border-slate-200 dark:border-slate-700/80 shadow-xs">
                    <tr className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      <th className="py-2.5 pl-4 pr-1 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllFilteredSelected && filteredPlanCases.length > 0}
                          onChange={handleToggleSelectAllPlanCases}
                          aria-label="Tümünü seç"
                          className="rounded border-slate-300 text-[var(--accent-primary)] focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3 w-28">KOD</th>
                      <th className="py-2.5 px-3">SENARYO BAŞLIĞI</th>
                      <th className="py-2.5 px-3">MODÜL</th>
                      <th className="py-2.5 px-3">ÖNCELİK</th>
                      <th className="py-2.5 px-3">TÜR</th>
                      <th className="py-2.5 px-3">ADIM SAYISI</th>
                      <th className="py-2.5 px-4 text-right">İŞLEMLER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredPlanCases.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-14 text-center text-slate-400">
                          <Folder className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                            Bu test planına henüz senaryo eklenmemiş.
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 mb-4">
                            Bu test planı kapsamında kayıtlı test senaryosu bulunmamaktadır.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setCandidateCaseIdsToAdd([]);
                              setIsAddCasesModalOpen(true);
                            }}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 shadow-xs cursor-pointer transition-all active:scale-98"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Test Senaryosu Ekle</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredPlanCases.map((tc) => {
                        const isSelected = selectedCaseIds.includes(tc.id);
                        return (
                          <tr
                            key={tc.id}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer ${
                              isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                            }`}
                            onClick={() => onSelectCase && onSelectCase(tc)}
                          >
                            {/* Checkbox */}
                            <td className="py-2.5 pl-4 pr-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleToggleCaseSelection(tc.id, e as any)}
                                className="rounded border-slate-300 text-[var(--accent-primary)] focus:ring-0 cursor-pointer"
                              />
                            </td>

                            {/* Code */}
                            <td className="py-2.5 px-3">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                {tc.code}
                              </span>
                            </td>

                            {/* Title & Tooltip Description */}
                            <td className="py-2.5 px-3">
                              <div className="min-w-0 max-w-lg">
                                <p
                                  className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate"
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

                            {/* Module */}
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              <div className="flex items-center space-x-1.5">
                                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="truncate max-w-[130px] font-medium">{tc.suite?.name || 'Ana Modül'}</span>
                              </div>
                            </td>

                            {/* Priority - High Contrast Badges */}
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs ${
                                  tc.priority === 'BLOCKER'
                                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/60'
                                    : tc.priority === 'CRITICAL'
                                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                                    : tc.priority === 'NORMAL'
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                {tc.priority}
                              </span>
                            </td>

                            {/* Type */}
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full border font-mono font-semibold inline-flex items-center gap-1 ${
                                  TEST_TYPE_CONFIG[tc.type]?.badgeClass ||
                                  'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <span>{TEST_TYPE_CONFIG[tc.type]?.icon || '⚙️'}</span>
                                <span>{tc.type}</span>
                              </span>
                            </td>

                            {/* Step Count */}
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                              {tc.steps?.length || 0} Adım
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  type="button"
                                  onClick={() => onSelectCase && onSelectCase(tc)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Senaryoyu İncele / Düzenle"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCaseFromPlan(tc.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors cursor-pointer"
                                  title="Bu Senaryoyu Plandan Çıkar"
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

              {/* Table Footer */}
              <div className="p-3 px-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-[#121926]/40 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-3">
                  <span>Toplam <strong>{filteredPlanCases.length}</strong> Senaryo</span>
                  {selectedCaseIds.length > 0 && (
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      ({selectedCaseIds.length} seçili)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Linked Test Runs */}
          {activeTab === 'RUNS' && (
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {plan.testRuns && plan.testRuns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plan.testRuns.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#121926]/80 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                            {r.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            {r.createdAt ? new Date(r.createdAt).toLocaleString('tr-TR') : ''}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {r.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800 text-xs">
                        <span className="font-mono text-slate-500">
                          {r.results?.length || 0} Test Sonucu
                        </span>
                        <button
                          type="button"
                          onClick={() => onStartRunWithPlan(plan)}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                        >
                          Detayları Gör &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400">
                  <PlayCircle className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Bu test planı ile henüz bir test koşumu yürütülmedi.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-4">
                    İlk test koşumunu başlatarak senaryoları test edin ve sonuçları kaydedin.
                  </p>
                  <button
                    type="button"
                    onClick={() => onStartRunWithPlan(plan, planCases)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Test Koşumu Başlat</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Existing Cases to Plan (Multi-Select Supported) */}
      {isAddCasesModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-[#161f30] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-[#121926]/40">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>Test Planına Senaryoları Ekle</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Proje havuzundaki mevcut test senaryolarını seçerek bu test planına dahil edin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCasesModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="p-3 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[#121926]/60 flex flex-col sm:flex-row gap-2.5">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Senaryo adı, kod veya açıklama ara..."
                  value={candidateSearchQuery}
                  onChange={(e) => setCandidateSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Module Filter */}
              {availableSuites.length > 0 && (
                <select
                  value={candidateSuiteFilter}
                  onChange={(e) => setCandidateSuiteFilter(e.target.value)}
                  className="bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
                >
                  <option value="ALL">Tüm Modüller</option>
                  {availableSuites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Priority Filter */}
              <select
                value={candidatePriorityFilter}
                onChange={(e) => setCandidatePriorityFilter(e.target.value)}
                className="bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
              >
                <option value="ALL">Tüm Öncelikler</option>
                <option value="BLOCKER">Blocker</option>
                <option value="CRITICAL">Critical</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>

              {/* Type Filter */}
              <select
                value={candidateTypeFilter}
                onChange={(e) => setCandidateTypeFilter(e.target.value)}
                className="bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
              >
                <option value="ALL">Tüm Türler</option>
                <option value="WEB">Web</option>
                <option value="MOBILE">Mobile</option>
                <option value="API">API</option>
                <option value="PERFORMANCE">Performance</option>
              </select>
            </div>

            {/* Quick Multi-Select Action Bar */}
            <div className="px-5 py-2 bg-slate-100/60 dark:bg-[#182234] border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={isAllCandidatesSelected ? handleDeselectAllCandidates : handleSelectAllCandidates}
                  disabled={candidateCases.length === 0}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
                >
                  {isAllCandidatesSelected ? (
                    <>
                      <MinusSquare className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>Filtrelenenlerin Seçimini Kaldır</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Filtrelenenleri Tümünü Seç ({candidateCases.length})</span>
                    </>
                  )}
                </button>

                {candidateCaseIdsToAdd.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCandidateCaseIdsToAdd([])}
                    className="text-xs text-slate-500 hover:text-[var(--accent-primary)] transition-colors cursor-pointer underline ml-2"
                  >
                    Tüm Seçimleri Temizle
                  </button>
                )}
              </div>

              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <strong className="text-blue-600 dark:text-blue-400 font-bold">{candidateCaseIdsToAdd.length}</strong> seçili /{' '}
                <span>{candidateCases.length} aday</span>
              </div>
            </div>

            {/* Candidates List */}
            <div className="p-3 px-5 overflow-y-auto flex-1 max-h-96 space-y-2">
              {candidateCases.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Folder className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Eklenebilecek test senaryosu bulunamadı.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tüm mevcut senaryolar zaten plana dahil edilmiş veya arama filtrenizle eşleşen kayıt yok.
                  </p>
                </div>
              ) : (
                candidateCases.map((c) => {
                  const isChecked = candidateCaseIdsToAdd.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() =>
                        setCandidateCaseIdsToAdd((prev) =>
                          prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                        )
                      }
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500/50 shadow-xs'
                          : 'bg-white dark:bg-[#1d232f] border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1 pr-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-[var(--accent-primary)] focus:ring-0 cursor-pointer h-4 w-4 shrink-0"
                        />
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0">
                          {c.code}
                        </span>
                        <div className="min-w-0 flex-1 truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {c.title}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5 truncate">
                            <span className="font-medium text-slate-600 dark:text-slate-300">
                              {c.suite?.name || 'Ana Modül'}
                            </span>
                            <span>&bull;</span>
                            <span
                              className={`font-bold px-1.5 py-0.2 rounded ${
                                c.priority === 'BLOCKER'
                                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60'
                                  : c.priority === 'CRITICAL'
                                  ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60'
                                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                              }`}
                            >
                              {c.priority}
                            </span>
                            <span>&bull;</span>
                            <span className="font-mono text-slate-500">{c.type}</span>
                            {c.steps && c.steps.length > 0 && (
                              <>
                                <span>&bull;</span>
                                <span>{c.steps.length} adım</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 px-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[#121926]/60 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Toplam <strong>{candidateCaseIdsToAdd.length}</strong> senaryo seçildi
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCasesModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={candidateCaseIdsToAdd.length === 0}
                  onClick={handleConfirmAddCases}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl font-bold text-white bg-accent-gradient hover:brightness-110 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Seçilenleri Plana Ekle ({candidateCaseIdsToAdd.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
