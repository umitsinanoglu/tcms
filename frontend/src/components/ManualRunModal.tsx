'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TestCase,
  TestRunsService,
  TestPlansService,
  ResultStatus,
  TestRun,
  TestPlan,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  SkipForward,
  Slash,
  ChevronRight,
  ChevronLeft,
  Keyboard,
  Trophy,
  RotateCcw,
  Zap,
  Bug,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  Trash2,
  Maximize2,
  Edit3,
  AlertCircle,
  MessageSquare,
  ClipboardList,
  Server,
  Tag,
  Layers,
  FileText,
  Plus,
  Check,
  Search,
} from 'lucide-react';

interface ManualRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  testCases: TestCase[];
  initialTestPlan?: TestPlan | null;
}

type WizardStep = 'PLAN_SELECT' | 'CASE_SELECT' | 'EXECUTION' | 'SUMMARY';

export const ManualRunModal: React.FC<ManualRunModalProps> = ({
  isOpen,
  onClose,
  projectId,
  testCases,
  initialTestPlan = null,
}) => {
  const { currentUser } = useAuth();
  const [wizardStep, setWizardStep] = useState<WizardStep>('PLAN_SELECT');

  // Test Plans State
  const [plans, setPlans] = useState<TestPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isCreatingNewPlan, setIsCreatingNewPlan] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanScope, setNewPlanScope] = useState('');
  const [newPlanRequirements, setNewPlanRequirements] = useState('');

  // Run Setup State
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('v1.0.0');
  const [environment, setEnvironment] = useState('STAGING');
  const [executedBy, setExecutedBy] = useState('QA Tester');
  const [testerEmail, setTesterEmail] = useState('tester@company.com');

  // Case Selection State
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [caseFilterSearch, setCaseFilterSearch] = useState('');

  // Execution Runner State
  const [runCases, setRunCases] = useState<TestCase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeRun, setActiveRun] = useState<TestRun | null>(null);
  const [results, setResults] = useState<
    Record<string, { status: ResultStatus; errorMessage?: string; jiraBugKey?: string; jiraBugUrl?: string; screenshotUrl?: string }>
  >({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    blocked: number;
    passRate: number;
  } | null>(null);

  // Load project test plans on open
  useEffect(() => {
    if (isOpen && projectId) {
      TestPlansService.getAllByProject(projectId)
        .then((data) => {
          setPlans(data || []);
          if (initialTestPlan) {
            setSelectedPlanId(initialTestPlan.id);
            setTitle(`${initialTestPlan.title} - Koşum`);
            setVersion(initialTestPlan.version || 'v1.0.0');
            setEnvironment(initialTestPlan.environment || 'STAGING');
          } else if (data && data.length > 0) {
            const firstActive = data.find((p) => p.status === 'ACTIVE') || data[0];
            setSelectedPlanId(firstActive.id);
            setTitle(`${firstActive.title} - Koşum`);
            setVersion(firstActive.version || 'v1.0.0');
            setEnvironment(firstActive.environment || 'STAGING');
          } else {
            setIsCreatingNewPlan(true);
            setTitle('Sprint 1 - İlk Test Koşumu');
          }
        })
        .catch(() => {});

      // Prefill user details from auth
      if (currentUser?.name) setExecutedBy(currentUser.name);
      if (currentUser?.email) setTesterEmail(currentUser.email);

      // Select all provided cases by default
      setSelectedCaseIds(testCases.map((c) => c.id));
      setWizardStep('PLAN_SELECT');
      setResults({});
      setSummaryData(null);
      setActiveRun(null);
      setErrorMsg(null);
    }
  }, [isOpen, projectId, initialTestPlan, currentUser, testCases]);

  // When selected plan changes, sync version and environment
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setIsCreatingNewPlan(false);
    const found = plans.find((p) => p.id === planId);
    if (found) {
      setTitle(`${found.title} - Koşum`);
      setVersion(found.version || 'v1.0.0');
      setEnvironment(found.environment || 'STAGING');
    }
  };

  const handleToggleCaseSelect = (caseId: string) => {
    setSelectedCaseIds((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId]
    );
  };

  const handleSelectAllCases = () => {
    setSelectedCaseIds(testCases.map((c) => c.id));
  };

  const handleDeselectAllCases = () => {
    setSelectedCaseIds([]);
  };

  // Start Execution flow
  const handleStartExecution = async () => {
    if (selectedCaseIds.length === 0) {
      setErrorMsg('Lütfen koşuma dahil edilecek en az bir test senaryosu seçin.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      let targetPlanId = selectedPlanId;

      // If user chose to create a new plan inline:
      if (isCreatingNewPlan) {
        if (!newPlanTitle.trim()) {
          setErrorMsg('Lütfen yeni test planı için bir başlık girin.');
          setIsSubmitting(false);
          return;
        }
        const createdPlan = await TestPlansService.create({
          title: newPlanTitle.trim(),
          version: version.trim() || 'v1.0.0',
          environment: environment.trim() || 'STAGING',
          scope: newPlanScope.trim() || undefined,
          requirements: newPlanRequirements.trim() || undefined,
          projectId,
        });
        targetPlanId = createdPlan.id;
      }

      // Create TestRun in Backend
      const run = await TestRunsService.createRun(projectId, {
        title: title.trim() || `Test Koşumu - ${version}`,
        version: version.trim() || 'v1.0.0',
        environment,
        executedBy: executedBy.trim() || 'QA Tester',
        testerEmail: testerEmail.trim() || 'tester@company.com',
        testPlanId: targetPlanId || undefined,
      });

      setActiveRun(run);

      // Filter and prepare selected cases
      const chosenCases = testCases.filter((c) => selectedCaseIds.includes(c.id));
      setRunCases(chosenCases);
      setCurrentIndex(0);
      setWizardStep('EXECUTION');
    } catch (err: any) {
      console.error('Error starting run:', err);
      setErrorMsg(err?.response?.data?.message || err?.message || 'Koşum başlatılırken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCase = runCases[currentIndex] || null;

  const handleMarkStatus = useCallback(
    (status: ResultStatus) => {
      if (!currentCase) return;

      setResults((prev) => ({
        ...prev,
        [currentCase.id]: {
          ...prev[currentCase.id],
          status,
          screenshotUrl: prev[currentCase.id]?.screenshotUrl ?? currentCase.screenshotUrl ?? undefined,
        },
      }));
    },
    [currentCase]
  );

  const handleErrorMessageChange = (caseId: string, msg: string) => {
    setResults((prev) => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        status: prev[caseId]?.status || 'PASSED',
        errorMessage: msg,
      },
    }));
  };

  const handleScreenshotChange = (caseId: string, screenshotUrl: string) => {
    setResults((prev) => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        status: prev[caseId]?.status || 'PASSED',
        screenshotUrl,
      },
    }));
  };

  const handleCreateJiraBugMock = (caseId: string, caseCode: string) => {
    const bugNum = Math.floor(Math.random() * 800) + 100;
    const bugKey = `BUG-${bugNum}`;
    const bugUrl = `https://company.atlassian.net/browse/${bugKey}`;

    setResults((prev) => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        status: prev[caseId]?.status || 'FAILED',
        jiraBugKey: bugKey,
        jiraBugUrl: bugUrl,
      },
    }));
  };

  // Keyboard Shortcuts Listener for Execution Step
  useEffect(() => {
    if (!isOpen || wizardStep !== 'EXECUTION') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      const key = e.key.toUpperCase();
      if (key === 'P') {
        e.preventDefault();
        handleMarkStatus('PASSED');
      } else if (key === 'F') {
        e.preventDefault();
        handleMarkStatus('FAILED');
      } else if (key === 'S') {
        e.preventDefault();
        handleMarkStatus('SKIPPED');
      } else if (key === 'B') {
        e.preventDefault();
        handleMarkStatus('BLOCKED');
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < runCases.length - 1) setCurrentIndex((prev) => prev + 1);
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, wizardStep, handleMarkStatus, currentIndex, runCases.length]);

  // Support pasting screenshot from clipboard
  useEffect(() => {
    if (!isOpen || wizardStep !== 'EXECUTION' || !currentCase) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              handleScreenshotChange(currentCase.id, reader.result as string);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, wizardStep, currentCase]);

  // Submit and Complete Run Results
  const handleSubmitRun = async () => {
    if (!activeRun) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const resultsPayload = runCases.map((tc) => {
        const res = results[tc.id];
        return {
          testCaseId: tc.id,
          status: res ? res.status : ('SKIPPED' as ResultStatus),
          executionMs: Math.floor(Math.random() * 800) + 200,
          errorMessage: res?.errorMessage || undefined,
          jiraBugKey: res?.jiraBugKey,
          jiraBugUrl: res?.jiraBugUrl,
          screenshotUrl: res?.screenshotUrl ?? tc.screenshotUrl,
        };
      });

      await TestRunsService.saveResults(projectId, activeRun.id, { results: resultsPayload });
      await TestRunsService.completeRun(activeRun.id, 'COMPLETED');

      const total = resultsPayload.length;
      const passed = resultsPayload.filter((r) => r.status === 'PASSED').length;
      const failed = resultsPayload.filter((r) => r.status === 'FAILED').length;
      const skipped = resultsPayload.filter((r) => r.status === 'SKIPPED').length;
      const blocked = resultsPayload.filter((r) => r.status === 'BLOCKED').length;
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

      setSummaryData({ total, passed, failed, skipped, blocked, passRate });
      setWizardStep('SUMMARY');
    } catch (err: any) {
      console.error('Error submitting run:', err);
      setErrorMsg(err?.response?.data?.message || err?.message || 'Koşum sonuçları kaydedilirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentResult = currentCase ? results[currentCase.id] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150 text-slate-800 dark:text-slate-100">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#141821]/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#821c2b] to-[#b83a4b] text-white flex items-center justify-center shadow-md shadow-[#821c2b]/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>Test Koşum Merkezi</span>
                {wizardStep === 'EXECUTION' && (
                  <span className="text-[10px] bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] px-2 py-0.5 rounded-full font-mono font-bold">
                    {currentIndex + 1} / {runCases.length}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {wizardStep === 'PLAN_SELECT'
                  ? 'Adım 1: Test Planı, Hedef Ortam ve Kapsam Belirleme'
                  : wizardStep === 'CASE_SELECT'
                  ? 'Adım 2: Koşulacak Test Senaryolarını Seçme'
                  : wizardStep === 'EXECUTION'
                  ? 'Adım 3: İnteraktif Manuel Test Koşumu Yürütme'
                  : 'Koşum Tamamlandı — Özet Raporu'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-3 mx-5 mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: TEST PLAN & SCOPE SELECTION (Requirement 8) */}
        {wizardStep === 'PLAN_SELECT' && (
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Test Planı Belirleyin <span className="text-rose-500">*</span>
              </label>

              {/* Toggle Plan Source: Existing vs New */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewPlan(false)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    !isCreatingNewPlan
                      ? 'bg-white dark:bg-[#1d232f] text-[#b83a4b] dark:text-[#d66b7a] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Mevcut Test Planını Seç ({plans.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNewPlan(true);
                    setSelectedPlanId('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isCreatingNewPlan
                      ? 'bg-white dark:bg-[#1d232f] text-[#b83a4b] dark:text-[#d66b7a] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Test Planı Tanımla</span>
                </button>
              </div>

              {!isCreatingNewPlan ? (
                /* Existing Plans Dropdown/Cards */
                <div className="space-y-2">
                  {plans.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                      Bu projede henüz kayıtlı bir test planı yok. Lütfen "Yeni Test Planı Tanımla" seçeneğini kullanın.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                      {plans.map((p) => {
                        const isSelected = selectedPlanId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleSelectPlan(p.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#b83a4b]/10 dark:bg-[#b83a4b]/15 border-[#b83a4b]/50 ring-2 ring-[#b83a4b]/20 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {p.title}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#b83a4b] shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              <span>{p.version}</span>
                              <span>•</span>
                              <span>{p.environment}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Inline New Plan Inputs */
                <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Yeni Plan Başlığı <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Sprint 24 Uçtan Uca Test Planı"
                      value={newPlanTitle}
                      onChange={(e) => setNewPlanTitle(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Kapsam / Yapı Taşları
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Ödemeler, Güvenlik, API"
                        value={newPlanScope}
                        onChange={(e) => setNewPlanScope(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Gereksinimler / Jira Key
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: MOB-201, PROJ-44"
                        value={newPlanRequirements}
                        onChange={(e) => setNewPlanRequirements(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Run Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Koşum Başlığı
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Koşum Başlığı"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Hedef Ortam
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="STAGING">STAGING</option>
                    <option value="UAT">UAT</option>
                    <option value="PROD">PROD</option>
                    <option value="DEV">DEV</option>
                    <option value="TEST">TEST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Sürüm
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Step 1 Footer Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => setWizardStep('CASE_SELECT')}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] shadow-md shadow-[#821c2b]/25 cursor-pointer"
              >
                <span>Senaryo Seçimine İlerle ({selectedCaseIds.length} Senaryo)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TEST CASES SELECTION */}
        {wizardStep === 'CASE_SELECT' && (
          <div className="p-5 overflow-y-auto space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Senaryo ara..."
                  value={caseFilterSearch}
                  onChange={(e) => setCaseFilterSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllCases}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Tümünü Seç
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllCases}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Temizle
                </button>
                <span className="font-mono text-xs font-bold text-[#b83a4b] px-2">
                  {selectedCaseIds.length} / {testCases.length} Seçili
                </span>
              </div>
            </div>

            {/* Test Cases Checkbox List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1 bg-slate-50/50 dark:bg-slate-900/30">
              {testCases
                .filter((tc) =>
                  caseFilterSearch
                    ? tc.title.toLowerCase().includes(caseFilterSearch.toLowerCase()) ||
                      tc.code.toLowerCase().includes(caseFilterSearch.toLowerCase())
                    : true
                )
                .map((tc) => {
                  const isChecked = selectedCaseIds.includes(tc.id);
                  return (
                    <div
                      key={tc.id}
                      onClick={() => handleToggleCaseSelect(tc.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-white dark:bg-[#1d232f] border border-[#b83a4b]/30 shadow-xs'
                          : 'opacity-60 hover:opacity-90 hover:bg-white dark:hover:bg-[#1d232f]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-[#b83a4b] focus:ring-[#b83a4b] cursor-pointer"
                        />
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                          {tc.code}
                        </span>
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {tc.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 shrink-0 ml-2">
                        {tc.type} • {tc.priority}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Step 2 Footer Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setWizardStep('PLAN_SELECT')}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Geri: Plan Seçimi</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting || selectedCaseIds.length === 0}
                onClick={handleStartExecution}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isSubmitting ? 'Başlatılıyor...' : `Koşumu Başlat (${selectedCaseIds.length} Case)`}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: STEP-BY-STEP EXECUTION RUNNER */}
        {wizardStep === 'EXECUTION' && currentCase && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Runner Navigation Bar */}
            <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                  title="Önceki Test (Sol Ok)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentIndex === runCases.length - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(runCases.length - 1, prev + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                  title="Sonraki Test (Sağ Ok)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  {currentIndex + 1} / {runCases.length}
                </span>
              </div>

              {/* Fast Status Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleMarkStatus('PASSED')}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                    currentResult?.status === 'PASSED'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                  }`}
                  title="Kısayol: P"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PASS [P]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMarkStatus('FAILED')}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                    currentResult?.status === 'FAILED'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-500'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border border-rose-500/30'
                  }`}
                  title="Kısayol: F"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>FAIL [F]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMarkStatus('BLOCKED')}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                    currentResult?.status === 'BLOCKED'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-500'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30'
                  }`}
                  title="Kısayol: B"
                >
                  <Slash className="w-3.5 h-3.5" />
                  <span>BLOCK [B]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMarkStatus('SKIPPED')}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                    currentResult?.status === 'SKIPPED'
                      ? 'bg-slate-600 text-white ring-2 ring-slate-400'
                      : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 hover:bg-slate-500/25 border border-slate-500/30'
                  }`}
                  title="Kısayol: S"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>SKIP [S]</span>
                </button>
              </div>
            </div>

            {/* Test Case Detail Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Header Title & Tags */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/30">
                    {currentCase.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {currentCase.type} • {currentCase.priority}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{currentCase.title}</h3>
                {currentCase.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">{currentCase.description}</p>
                )}
                {currentCase.precondition && (
                  <div className="text-xs bg-slate-100 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Ön Koşul: </span>
                    {currentCase.precondition}
                  </div>
                )}
              </div>

              {/* Steps Table */}
              {currentCase.steps && currentCase.steps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Test Adımları
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                          <th className="p-2.5 w-12 text-center font-mono">#</th>
                          <th className="p-2.5 font-semibold">İşlem / Eylem</th>
                          <th className="p-2.5 font-semibold">Beklenen Sonuç</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {currentCase.steps.map((step) => (
                          <tr key={step.id || step.stepNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 text-center font-mono font-bold text-slate-400">{step.stepNumber}</td>
                            <td className="p-2.5 text-slate-800 dark:text-slate-200 font-medium">{step.action}</td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400">{step.expectedResult}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Error Message & Jira Bug Section (When FAILED or for notes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Hata / Yürütme Notu
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Hata mesajı veya açıklama notları..."
                    value={currentResult?.errorMessage || ''}
                    onChange={(e) => handleErrorMessageChange(currentCase.id, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Jira Bug Kaydı
                  </label>
                  {currentResult?.jiraBugKey ? (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bug className="w-4 h-4 text-rose-500" />
                        <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                          {currentResult.jiraBugKey}
                        </span>
                      </div>
                      <a
                        href={currentResult.jiraBugUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-500 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Jira'da Aç</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCreateJiraBugMock(currentCase.id, currentCase.code)}
                      className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Bug className="w-3.5 h-3.5" />
                      <span>Jira Bug Oluştur / Bağla</span>
                    </button>
                  )}

                  {/* Screenshot indicator */}
                  {currentResult?.screenshotUrl && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-[#b83a4b]" />
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                          Ekran Görüntüsü Eklendi
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLightboxImage(currentResult.screenshotUrl || null)}
                        className="text-indigo-500 text-xs font-semibold hover:underline"
                      >
                        Önizle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Execution Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#141821]/80 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">İlerleme:</span>
                <div className="w-32 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#b83a4b] h-full transition-all duration-300"
                    style={{
                      width: `${Math.round(((currentIndex + 1) / runCases.length) * 100)}%`,
                    }}
                  />
                </div>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  %{Math.round(((currentIndex + 1) / runCases.length) * 100)}
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                {currentIndex < runCases.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300"
                  >
                    Sonraki Senaryo →
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitRun}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] shadow-md shadow-[#821c2b]/30 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Kaydediliyor...' : 'Koşumu Tamamla ve Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUMMARY & COMPLETION */}
        {wizardStep === 'SUMMARY' && summaryData && (
          <div className="p-8 text-center space-y-6 flex-1 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto border-2 border-emerald-500/30">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Test Koşumu Başarıyla Tamamlandı!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tüm senaryo sonuçları ve yürütme metrikleri veritabanına işlendi.
              </p>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl mx-auto">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-slate-500">Toplam</span>
                <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">{summaryData.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Başarılı</span>
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{summaryData.passed}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Hatalı</span>
                <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{summaryData.failed}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Engelli</span>
                <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{summaryData.blocked}</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Başarı Oranı</span>
                <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">%{summaryData.passRate}</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-2.5 rounded-xl text-xs font-bold text-white bg-[#b83a4b] hover:bg-[#a32f3f] shadow-md shadow-[#821c2b]/25 cursor-pointer"
              >
                Kapat ve Koşum Geçmişine Dön
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Image Preview Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={lightboxImage}
            alt="Ekran Görüntüsü"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        </div>
      )}
    </div>
  );
};
