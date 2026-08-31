'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TestCase,
  TestRunsService,
  TestPlansService,
  ResultStatus,
  TestRun,
  TestPlan,
  DefectsService,
  CreateDefectDto,
  DefectSeverity,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { parseScreenshots, formatScreenshots } from './QuickRunModal';
import { NewDefectModal } from './NewDefectModal';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Timer,
  CheckCircle2,
  XCircle,
  SkipForward,
  Slash,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Bug,
  Upload,
  Trash2,
  Maximize2,
  AlertCircle,
  MessageSquare,
  ClipboardList,
  Check,
  Search,
  SlidersHorizontal,
  Image as ImageIcon,
  Info,
} from 'lucide-react';

interface ManualRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  testCases: TestCase[];
  initialTestPlan?: TestPlan | null;
  onSuccess?: (run?: TestRun) => void;
}

type WizardStep = 'PLAN_SELECT' | 'CASE_SELECT' | 'EXECUTION' | 'SUMMARY';
type StepStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'NONE';

interface CaseRunState {
  status: ResultStatus | '';
  environment: string;
  platform: string;
  appVersion: string;
  device: string;
  userProfile: string;
  customerType: string;
  flakyStatus: string;
  executionMs: number;
  errorMessage: string;
  jiraBugKey: string;
  jiraBugUrl: string;
  screenshots: string[];
  stepStatuses: Record<number, StepStatus>;
  createdDefect?: { id: string; key: string; title: string };
}

export const ManualRunModal: React.FC<ManualRunModalProps> = ({
  isOpen,
  onClose,
  projectId,
  testCases,
  initialTestPlan = null,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [wizardStep, setWizardStep] = useState<WizardStep>('PLAN_SELECT');
  const wasOpenRef = useRef(false);

  // Test Plans State
  const [plans, setPlans] = useState<TestPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isCreatingNewPlan, setIsCreatingNewPlan] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanScope, setNewPlanScope] = useState('');
  const [newPlanRequirements, setNewPlanRequirements] = useState('');

  // Run Setup State
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('v1.2.0 (106)');
  const [environment, setEnvironment] = useState('UAT');
  const [executedBy, setExecutedBy] = useState('Ümit Sinanoğlu');
  const [testerEmail, setTesterEmail] = useState('tester@company.com');

  // Case Selection State
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [caseFilterSearch, setCaseFilterSearch] = useState('');

  // Execution Runner State
  const [runCases, setRunCases] = useState<TestCase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeRun, setActiveRun] = useState<TestRun | null>(null);

  // Per-case detailed execution state dictionary
  const [caseStates, setCaseStates] = useState<Record<string, CaseRunState>>({});

  // Active case inputs
  const [activeNewImageUrl, setActiveNewImageUrl] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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

  // Defect Modal State
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectInitialData, setDefectInitialData] = useState<Partial<CreateDefectDto> | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Stopwatch state for current scenario
  const [currentScenarioTimerMs, setCurrentScenarioTimerMs] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Stopwatch interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && wizardStep === 'EXECUTION') {
      interval = setInterval(() => {
        setCurrentScenarioTimerMs((prev) => {
          const nextVal = prev + 1000;
          // Sync with active case state
          const cCase = runCases[currentIndex];
          if (cCase) {
            setCaseStates((cPrev) => {
              const prevItem = cPrev[cCase.id];
              if (!prevItem) return cPrev;
              return {
                ...cPrev,
                [cCase.id]: {
                  ...prevItem,
                  executionMs: nextVal,
                },
              };
            });
          }
          return nextVal;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, wizardStep, currentIndex, runCases]);

  // Load project test plans on open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current && projectId) {
      wasOpenRef.current = true;
      TestPlansService.getAllByProject(projectId)
        .then((data) => {
          setPlans(data || []);
          if (initialTestPlan) {
            setSelectedPlanId(initialTestPlan.id);
            setTitle(`${initialTestPlan.title} - Koşum`);
            setVersion(initialTestPlan.version || 'v1.2.0 (106)');
            setEnvironment(initialTestPlan.environment || 'UAT');
          } else if (data && data.length > 0) {
            const firstActive = data.find((p) => p.status === 'ACTIVE') || data[0];
            setSelectedPlanId(firstActive.id);
            setTitle(`${firstActive.title} - Koşum`);
            setVersion(firstActive.version || 'v1.2.0 (106)');
            setEnvironment(firstActive.environment || 'UAT');
          } else {
            setIsCreatingNewPlan(true);
            setTitle('Sprint 1 - Kapsamlı Test Koşumu');
          }
        })
        .catch(() => {});

      // Prefill user details from auth
      if (currentUser?.name) setExecutedBy(currentUser.name);
      if (currentUser?.email) setTesterEmail(currentUser.email);

      // Select all provided cases by default
      setSelectedCaseIds(testCases.map((c) => c.id));
      setWizardStep('PLAN_SELECT');
      setCaseStates({});
      setSummaryData(null);
      setActiveRun(null);
      setErrorMsg(null);
      setCurrentScenarioTimerMs(0);
      setIsTimerRunning(false);
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen, projectId, initialTestPlan, currentUser, testCases]);

  // When selected plan changes, sync version and environment
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setIsCreatingNewPlan(false);
    const found = plans.find((p) => p.id === planId);
    if (found) {
      setTitle(`${found.title} - Koşum`);
      setVersion(found.version || 'v1.2.0 (106)');
      setEnvironment(found.environment || 'UAT');
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
          version: version.trim() || 'v1.2.0 (106)',
          environment: environment.trim() || 'UAT',
          scope: newPlanScope.trim() || undefined,
          requirements: newPlanRequirements.trim() || undefined,
          projectId,
        });
        targetPlanId = createdPlan.id;
      }

      // Create TestRun in Backend
      const run = await TestRunsService.createRun(projectId, {
        title: title.trim() || `Test Koşumu - ${version}`,
        version: version.trim() || 'v1.2.0 (106)',
        environment,
        executedBy: executedBy.trim() || 'Ümit Sinanoğlu',
        testerEmail: testerEmail.trim() || 'tester@company.com',
        testPlanId: targetPlanId || undefined,
      });

      setActiveRun(run);

      // Filter and prepare selected cases
      const chosenCases = testCases.filter((c) => selectedCaseIds.includes(c.id));
      setRunCases(chosenCases);

      // Initialize state for each chosen case
      const initialMap: Record<string, CaseRunState> = {};
      chosenCases.forEach((tc) => {
        const stepInit: Record<number, StepStatus> = {};
        if (tc.steps && tc.steps.length > 0) {
          tc.steps.forEach((_, sIdx) => {
            stepInit[sIdx] = 'NONE';
          });
        }

        const rawScreens = tc.screenshotUrl ? parseScreenshots(tc.screenshotUrl) : [];

        initialMap[tc.id] = {
          status: '',
          environment: environment || 'UAT',
          platform: tc.type === 'IOS' ? 'iOS' : tc.type === 'ANDROID' ? 'Android' : 'Web',
          appVersion: version || 'v1.2.0 (106)',
          device: tc.type === 'IOS' ? 'iphone 15' : tc.type === 'ANDROID' ? 's24' : 'Chrome 128 (macOS)',
          userProfile: executedBy ? `${executedBy.toUpperCase()} (ADMIN)` : 'ÜMİT SİNANOĞLU (ADMIN)',
          customerType: 'BIREYSEL',
          flakyStatus: 'NONE',
          executionMs: 0,
          errorMessage: '',
          jiraBugKey: '',
          jiraBugUrl: '',
          screenshots: rawScreens,
          stepStatuses: stepInit,
        };
      });

      setCaseStates(initialMap);
      setCurrentIndex(0);
      setCurrentScenarioTimerMs(0);
      setIsTimerRunning(true);
      setWizardStep('EXECUTION');
    } catch (err: any) {
      console.error('Error starting run:', err);
      setErrorMsg(err?.response?.data?.message || err?.message || 'Koşum başlatılırken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCase = runCases[currentIndex] || null;
  const currentCaseState: CaseRunState | undefined = currentCase ? caseStates[currentCase.id] : undefined;

  // When switching index, reset timer for scenario
  const handleChangeIndex = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= runCases.length) return;
    setCurrentIndex(nextIndex);
    const targetCase = runCases[nextIndex];
    if (targetCase && caseStates[targetCase.id]) {
      setCurrentScenarioTimerMs(caseStates[targetCase.id].executionMs || 0);
    } else {
      setCurrentScenarioTimerMs(0);
    }
    setActiveNewImageUrl('');
    setLightboxIndex(null);
  };

  // Set status helper: When PASSED is selected, mark all steps as PASSED
  const handleSetStatus = (newStatus: ResultStatus) => {
    if (!currentCase) return;
    if (newStatus === 'PASSED') {
      const allPassed: Record<number, StepStatus> = {};
      if (currentCase.steps && currentCase.steps.length > 0) {
        currentCase.steps.forEach((_, idx) => {
          allPassed[idx] = 'PASSED';
        });
      }
      handleUpdateCurrentState({
        status: 'PASSED',
        stepStatuses: allPassed,
      });
    } else {
      handleUpdateCurrentState({ status: newStatus });
    }
  };

  // Keyboard Shortcuts (P, F, B, S, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!isOpen || wizardStep !== 'EXECUTION' || !currentCase) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      const key = e.key.toUpperCase();
      if (key === 'P') {
        e.preventDefault();
        handleSetStatus('PASSED');
      } else if (key === 'F') {
        e.preventDefault();
        handleSetStatus('FAILED');
      } else if (key === 'B') {
        e.preventDefault();
        handleSetStatus('BLOCKED');
      } else if (key === 'S') {
        e.preventDefault();
        handleSetStatus('SKIPPED');
      } else if (key === 'ARROWLEFT' && currentIndex > 0) {
        e.preventDefault();
        handleChangeIndex(currentIndex - 1);
      } else if (key === 'ARROWRIGHT' && currentIndex < runCases.length - 1) {
        e.preventDefault();
        handleChangeIndex(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, wizardStep, currentCase, currentIndex, runCases.length]);

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
              if (typeof reader.result === 'string') {
                const newImg = reader.result;
                setCaseStates((prev) => {
                  const curr = prev[currentCase.id];
                  if (!curr) return prev;
                  return {
                    ...prev,
                    [currentCase.id]: {
                      ...curr,
                      screenshots: [...curr.screenshots, newImg],
                    },
                  };
                });
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, wizardStep, currentCase]);

  // Update current case state helper
  const handleUpdateCurrentState = (partial: Partial<CaseRunState>) => {
    if (!currentCase) return;
    setCaseStates((prev) => {
      const existing = prev[currentCase.id];
      if (!existing) return prev;
      return {
        ...prev,
        [currentCase.id]: {
          ...existing,
          ...partial,
        },
      };
    });
  };

  const handleToggleStepCheckbox = (stepIdx: number) => {
    if (!currentCase || !currentCaseState) return;
    const currentSteps = currentCaseState.stepStatuses || {};
    const currentStatus = currentSteps[stepIdx] || 'NONE';
    const nextStatus: StepStatus = currentStatus === 'PASSED' ? 'NONE' : 'PASSED';
    const nextSteps = { ...currentSteps, [stepIdx]: nextStatus };

    let recommendedStatus: ResultStatus | '' = currentCaseState.status;
    const values = Object.values(nextSteps);
    if (values.some((v) => v === 'FAILED')) recommendedStatus = 'FAILED';
    else if (values.some((v) => v === 'BLOCKED')) recommendedStatus = 'BLOCKED';
    else if (values.length > 0 && values.every((v) => v === 'PASSED')) recommendedStatus = 'PASSED';

    handleUpdateCurrentState({
      stepStatuses: nextSteps,
      status: recommendedStatus,
    });
  };

  const handleSetStepFlag = (stepIdx: number, flag: StepStatus) => {
    if (!currentCase || !currentCaseState) return;
    const currentSteps = currentCaseState.stepStatuses || {};
    const currentStatus = currentSteps[stepIdx] || 'NONE';
    const nextStatus: StepStatus = currentStatus === flag ? 'NONE' : flag;
    const nextSteps = { ...currentSteps, [stepIdx]: nextStatus };

    let recommendedStatus: ResultStatus | '' = currentCaseState.status;
    const values = Object.values(nextSteps);
    if (values.some((v) => v === 'FAILED')) recommendedStatus = 'FAILED';
    else if (values.some((v) => v === 'BLOCKED')) recommendedStatus = 'BLOCKED';
    else if (values.length > 0 && values.every((v) => v === 'PASSED')) recommendedStatus = 'PASSED';

    handleUpdateCurrentState({
      stepStatuses: nextSteps,
      status: recommendedStatus,
    });
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0 || !currentCase) return;
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const res = reader.result;
          setCaseStates((prev) => {
            const curr = prev[currentCase.id];
            if (!curr) return prev;
            return {
              ...prev,
              [currentCase.id]: {
                ...curr,
                screenshots: [...curr.screenshots, res],
              },
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!currentCase || !activeNewImageUrl.trim()) return;
    const trimmed = activeNewImageUrl.trim();
    setCaseStates((prev) => {
      const curr = prev[currentCase.id];
      if (!curr) return prev;
      return {
        ...prev,
        [currentCase.id]: {
          ...curr,
          screenshots: [...curr.screenshots, trimmed],
        },
      };
    });
    setActiveNewImageUrl('');
  };

  const handleRemoveScreenshot = (sIdx: number) => {
    if (!currentCase) return;
    setCaseStates((prev) => {
      const curr = prev[currentCase.id];
      if (!curr) return prev;
      return {
        ...prev,
        [currentCase.id]: {
          ...curr,
          screenshots: curr.screenshots.filter((_, idx) => idx !== sIdx),
        },
      };
    });
  };

  const handleOpenDefectModal = () => {
    if (!currentCase) return;
    const curState = caseStates[currentCase.id] || {
      status: 'FAILED',
      environment: environment || 'UAT',
      platform: 'Web',
      appVersion: version || 'v1.2.0 (106)',
      device: 'iphone 15',
      userProfile: 'ÜMİT SİNANOĞLU (ADMIN)',
      customerType: 'BIREYSEL',
      flakyStatus: 'NONE',
      executionMs: currentScenarioTimerMs,
      errorMessage: '',
      jiraBugKey: '',
      jiraBugUrl: '',
      screenshots: [],
      stepStatuses: {},
    };

    // Format steps checklist summary
    let stepsText = '';
    if (currentCase.steps && currentCase.steps.length > 0) {
      stepsText = '\n\nTest Adımları Kontrol Listesi:\n' + currentCase.steps.map((st, idx) => {
        const stepSt = curState.stepStatuses?.[idx] || 'NONE';
        const statusLabel = stepSt === 'PASSED' ? '[PASSED]' : stepSt === 'FAILED' ? '[FAILED]' : stepSt === 'BLOCKED' ? '[BLOCKED]' : '[NOT RUN]';
        const action = (st as any).action || (st as any).step || `Adım ${idx + 1}`;
        const expected = (st as any).expectedResult || (st as any).expected || '';
        return `${idx + 1}. ${statusLabel} ${action}${expected ? ` (Beklenen: ${expected})` : ''}`;
      }).join('\n');
    }

    const descParts: string[] = [];
    if (curState.errorMessage?.trim()) {
      descParts.push(`Hata / Açıklama:\n${curState.errorMessage.trim()}`);
    } else {
      descParts.push(`Test senaryosu (${currentCase.code} - ${currentCase.title}) "${title || 'Manuel Koşum'}" koşumunda başarısız oldu.`);
    }

    descParts.push(`\nKoşum Parametreleri:\n- Ortam: ${curState.environment || environment}\n- Platform: ${curState.platform}\n- Uygulama Versiyonu: ${curState.appVersion || version}\n- Cihaz: ${curState.device}\n- Kullanıcı Profili: ${curState.userProfile}\n- Müşteri Tipi: ${curState.customerType}\n- Flaky / Retry: ${curState.flakyStatus}${curState.executionMs > 0 ? `\n- Süre: ${Math.round(curState.executionMs / 1000)} sn (${curState.executionMs} ms)` : ''}`);

    if (stepsText) {
      descParts.push(stepsText);
    }

    if (currentCase.preconditions || currentCase.precondition) {
      descParts.push(`\nÖn Koşul:\n${currentCase.preconditions || currentCase.precondition}`);
    }

    if ((currentCase as any).expectedResult) {
      descParts.push(`\nBeklenen Genel Sonuç:\n${(currentCase as any).expectedResult}`);
    }

    let mappedSeverity: DefectSeverity = 'MAJOR';
    if (currentCase.priority === 'BLOCKER') mappedSeverity = 'BLOCKER';
    else if (currentCase.priority === 'CRITICAL') mappedSeverity = 'CRITICAL';
    else if (currentCase.priority === 'LOW') mappedSeverity = 'MINOR';

    setDefectInitialData({
      projectId,
      title: `[FAILED] ${currentCase.code} - ${currentCase.title}`,
      description: descParts.join('\n'),
      severity: mappedSeverity,
      status: 'OPEN',
      environment: curState.environment || environment || 'STAGING',
      channel: curState.platform ? curState.platform.toUpperCase() : 'WEB',
      testCaseId: currentCase.id,
      testRunId: activeRun?.id || undefined,
      reportedBy: executedBy || (currentUser?.name ?? (typeof window !== 'undefined' ? localStorage.getItem('tcms_active_user_name') || '' : '')),
      jiraBugKey: curState.jiraBugKey?.trim() || undefined,
      jiraBugUrl: curState.jiraBugUrl?.trim() || (curState.jiraBugKey?.trim() ? `https://company.atlassian.net/browse/${curState.jiraBugKey.trim()}` : undefined),
    });

    setIsDefectModalOpen(true);
  };

  const handleCreateDefectSubmit = async (data: CreateDefectDto) => {
    try {
      const created = await DefectsService.create(data);
      if (currentCase) {
        handleUpdateCurrentState({
          createdDefect: { id: created.id, key: created.key, title: created.title },
          jiraBugKey: created.jiraBugKey || currentCaseState?.jiraBugKey || '',
          jiraBugUrl: created.jiraBugUrl || (created.jiraBugKey ? `https://company.atlassian.net/browse/${created.jiraBugKey}` : '') || currentCaseState?.jiraBugUrl || '',
        });
      }
      showToast(`Defect başarıyla oluşturuldu (${created.key || 'DEF'}).`, 'success');
      setIsDefectModalOpen(false);
      setDefectInitialData(null);
    } catch (err: any) {
      console.error('Defect creation error:', err);
      showToast('Defect oluşturulurken hata meydana geldi: ' + (err?.response?.data?.message || err?.message || 'Hata'), 'error');
      throw err;
    }
  };

  // Submit and Complete Run Results
  const handleSubmitRun = async () => {
    if (!activeRun) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const resultsPayload = runCases.map((tc) => {
        const cState = caseStates[tc.id];
        const formattedScreens = cState?.screenshots ? formatScreenshots(cState.screenshots) : tc.screenshotUrl;

        // Step summary formatting
        let finalErrorMsg = cState?.errorMessage?.trim() || undefined;
        if (tc.steps && tc.steps.length > 0 && cState?.stepStatuses) {
          const totalSt = tc.steps.length;
          const verifiedSt = Object.values(cState.stepStatuses).filter((s) => s !== 'NONE').length;
          if (verifiedSt > 0 && !finalErrorMsg) {
            const stText = tc.steps
              .map((st, idx) => `Adım ${st.stepNumber} [${cState.stepStatuses[idx] || 'NONE'}]: ${st.action}`)
              .join(' | ');
            finalErrorMsg = `[Adım Doğrulaması: ${verifiedSt}/${totalSt}] ${stText}`;
          }
        }

        let effectiveStatus: ResultStatus = 'SKIPPED';
        if (cState?.status) {
          effectiveStatus = cState.status as ResultStatus;
        } else if (cState?.stepStatuses) {
          const vals = Object.values(cState.stepStatuses);
          if (vals.length > 0 && vals.every((v) => v === 'PASSED')) {
            effectiveStatus = 'PASSED';
          } else if (vals.some((v) => v === 'FAILED')) {
            effectiveStatus = 'FAILED';
          } else if (vals.some((v) => v === 'BLOCKED')) {
            effectiveStatus = 'BLOCKED';
          }
        }

        return {
          testCaseId: tc.id,
          status: effectiveStatus,
          executionMs: cState?.executionMs || Math.floor(Math.random() * 800) + 200,
          errorMessage: finalErrorMsg,
          jiraBugKey: cState?.jiraBugKey || undefined,
          jiraBugUrl: cState?.jiraBugUrl || undefined,
          screenshotUrl: formattedScreens || undefined,
        };
      });

      await TestRunsService.saveResults(projectId, activeRun.id, { results: resultsPayload });
      const completedRun = await TestRunsService.completeRun(activeRun.id, 'COMPLETED');
      if (onSuccess) {
        onSuccess(completedRun || activeRun);
      }

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

  const totalSteps = currentCase?.steps?.length || 0;
  const verifiedStepsCount = currentCaseState?.stepStatuses
    ? Object.values(currentCaseState.stepStatuses).filter((s) => s !== 'NONE').length
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl xl:max-w-5xl shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#151b28] shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Accent Clipboard Badge */}
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 flex items-center justify-center shrink-0 shadow-xs">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                {wizardStep === 'EXECUTION' && currentCase && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                    {currentCase.code}
                  </span>
                )}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {wizardStep === 'EXECUTION' && currentCase
                    ? currentCase.title
                    : wizardStep === 'SUMMARY'
                    ? 'Test Koşumu Tamamlandı'
                    : 'Test Planı ile Koşum Başlat'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {wizardStep === 'EXECUTION'
                  ? 'Detaylı test koşum kaydı, canlı süre sayacı ve etiket bilgileri'
                  : wizardStep === 'PLAN_SELECT'
                  ? 'Test Planı, hedef ortam ve koşum kapsamını belirleyin'
                  : wizardStep === 'CASE_SELECT'
                  ? 'Koşuma dahil edilecek test senaryolarını seçin ve sıralayın'
                  : 'Koşum sonuçları ve yürütme özeti'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 ml-3">
            {/* Live Stopwatch Widget during Execution */}
            {wizardStep === 'EXECUTION' && (
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <Timer className={`w-4 h-4 ${isTimerRunning ? 'text-[var(--accent-primary)] animate-pulse' : 'text-slate-400'}`} />
                <span className="font-mono font-extrabold text-sm text-slate-800 dark:text-slate-200 min-w-[50px]">
                  {Math.floor(currentScenarioTimerMs / 1000)} sn
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 transition-colors"
                  title={isTimerRunning ? 'Sayacı Duraklat' : 'Sayacı Başlat'}
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setCurrentScenarioTimerMs(0);
                    handleUpdateCurrentState({ executionMs: 0 });
                  }}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  title="Sayacı Sıfırla"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-3 mx-6 mt-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Toast Alert Banner */}
        {toastMessage && (
          <div
            className={`mx-6 mt-3 p-3 rounded-xl text-xs font-semibold shrink-0 flex items-center justify-between border animate-in fade-in duration-200 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : toastMessage.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
              {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
              {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-500 shrink-0" />}
              <span>{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-current"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* STEP 1: TEST PLAN & SCOPE SELECTION */}
        {wizardStep === 'PLAN_SELECT' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
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
                      ? 'bg-white dark:bg-[#151b28] text-[var(--accent-primary)] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Mevcut Test Planını Seç ({plans.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCreatingNewPlan(true)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isCreatingNewPlan
                      ? 'bg-white dark:bg-[#151b28] text-[var(--accent-primary)] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>+ Yeni Test Planı Tanımla</span>
                </button>
              </div>

              {!isCreatingNewPlan ? (
                plans.length > 0 ? (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Aktif Test Planı Listesi
                    </label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => handleSelectPlan(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.version || 'v1.0.0'} • {p.environment || 'STAGING'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                    Henüz kayıtlı bir test planı bulunamadı. Yeni bir plan oluşturularak devam edilecektir.
                  </div>
                )
              ) : (
                <div className="space-y-3 p-4 rounded-xl border border-dashed border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Yeni Test Planı Başlığı <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPlanTitle}
                      onChange={(e) => setNewPlanTitle(e.target.value)}
                      placeholder="Örn: Sprint 24 Regression Planı"
                      className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Açıklama & Notlar
                    </label>
                    <textarea
                      rows={2}
                      value={newPlanScope}
                      onChange={(e) => setNewPlanScope(e.target.value)}
                      placeholder="Test planı kapsamı, hedefler..."
                      className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Target Execution Environment & Parameters */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Hedef Koşum Parametreleri
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    🌐 Hedef Ortam
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  >
                    <option value="UAT">UAT</option>
                    <option value="DEV">DEV</option>
                    <option value="TEST">TEST</option>
                    <option value="STAGING">STAGING</option>
                    <option value="PROD">PROD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    📦 Koşum Versiyonu
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="v1.0.0"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    👤 Yürüten Tester
                  </label>
                  <input
                    type="text"
                    value={executedBy}
                    onChange={(e) => setExecutedBy(e.target.value)}
                    placeholder="QA Lead"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Step 1 Footer Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 shadow-md shadow-[var(--accent-dark)]/25 cursor-pointer"
              >
                <span>Senaryo Seçimine İlerle ({selectedCaseIds.length} Senaryo)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TEST CASES SELECTION */}
        {wizardStep === 'CASE_SELECT' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 flex flex-col min-h-0">
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
                <span className="font-mono text-xs font-bold text-[var(--accent-primary)] px-2">
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
                          ? 'bg-white dark:bg-[#1d232f] border border-[var(--accent-primary)]/30 shadow-xs'
                          : 'opacity-60 hover:opacity-90 hover:bg-white dark:hover:bg-[#1d232f]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] cursor-pointer"
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
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isSubmitting ? 'Başlatılıyor...' : `Koşumu Başlat (${selectedCaseIds.length} Case)`}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MODERN TEST EXECUTION RUNNER (Exact Match with QuickRunModal & Navigation) */}
        {wizardStep === 'EXECUTION' && currentCase && currentCaseState && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            
            {/* Case Navigation Bar */}
            <div className="px-5 sm:px-6 py-2 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => handleChangeIndex(currentIndex - 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Önceki Senaryo (Sol Ok)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Önceki</span>
                </button>

                <div className="flex items-center space-x-1.5 px-3 py-1 bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
                  <span>Senaryo {currentIndex + 1} / {runCases.length}</span>
                </div>

                <button
                  type="button"
                  disabled={currentIndex === runCases.length - 1}
                  onClick={() => handleChangeIndex(currentIndex + 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Sonraki Senaryo (Sağ Ok)"
                >
                  <span>Sonraki</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Fast Scenario Case Selector Chips */}
              <div className="flex items-center space-x-1 overflow-x-auto max-w-[50%] py-0.5">
                {runCases.map((tc, idx) => {
                  const cSt = caseStates[tc.id]?.status;
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={tc.id}
                      type="button"
                      onClick={() => handleChangeIndex(idx)}
                      className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                          : cSt === 'PASSED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : cSt === 'FAILED'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          : cSt === 'BLOCKED'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : cSt === 'SKIPPED'
                          ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                      title={`${tc.code}: ${tc.title}${cSt ? ` [${cSt}]` : ''}`}
                    >
                      {tc.code}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* 1. Test Koşum Sonucu (4 Large Segment Buttons) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Test Koşum Sonucu <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* PASSED */}
                  <button
                    type="button"
                    onClick={() => handleSetStatus('PASSED')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                      currentCaseState.status === 'PASSED'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PASSED</span>
                  </button>

                  {/* FAILED */}
                  <button
                    type="button"
                    onClick={() => handleSetStatus('FAILED')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                      currentCaseState.status === 'FAILED'
                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>FAILED</span>
                  </button>

                  {/* BLOCKED */}
                  <button
                    type="button"
                    onClick={() => handleSetStatus('BLOCKED')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                      currentCaseState.status === 'BLOCKED'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    <Slash className="w-4 h-4" />
                    <span>BLOCKED</span>
                  </button>

                  {/* SKIPPED */}
                  <button
                    type="button"
                    onClick={() => handleSetStatus('SKIPPED')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                      currentCaseState.status === 'SKIPPED'
                        ? 'bg-slate-700 text-white border-slate-600 shadow-md shadow-slate-700/20'
                        : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/20'
                    }`}
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>SKIPPED</span>
                  </button>
                </div>
              </div>

              {/* 2. Koşum Etiketleri & Cihaz / Kullanıcı Parametreleri Card */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <SlidersHorizontal className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Koşum Etiketleri & Cihaz / Kullanıcı Parametreleri
                  </h4>
                </div>

                {/* Grid 4 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 1. Ortam */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <span>🌐 Ortam</span>
                    </label>
                    <select
                      value={currentCaseState.environment}
                      onChange={(e) => handleUpdateCurrentState({ environment: e.target.value })}
                      className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                    >
                      <option value="UAT">UAT</option>
                      <option value="DEV">DEV</option>
                      <option value="TEST">TEST</option>
                      <option value="STAGING">STAGING</option>
                      <option value="PROD">PROD</option>
                    </select>
                  </div>

                  {/* 2. Platform */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <span>🍎 / 🐳 Platform</span>
                    </label>
                    <select
                      value={currentCaseState.platform}
                      onChange={(e) => handleUpdateCurrentState({ platform: e.target.value })}
                      className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                    >
                      <option value="Web">🌐 Web</option>
                      <option value="iOS">🍎 iOS</option>
                      <option value="Android">🤖 Android</option>
                      <option value="API">⚡ API</option>
                    </select>
                  </div>

                  {/* 3. Uygulama Versiyonu */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <span>📦 Uygulama Versiyonu</span>
                    </label>
                    <input
                      type="text"
                      value={currentCaseState.appVersion}
                      onChange={(e) => handleUpdateCurrentState({ appVersion: e.target.value })}
                      placeholder="v2.4.1"
                      className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                    />
                  </div>

                  {/* 4. Cihaz Aliası */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <span>📱 Cihaz Aliası</span>
                    </label>
                    <input
                      type="text"
                      value={currentCaseState.device}
                      onChange={(e) => handleUpdateCurrentState({ device: e.target.value })}
                      placeholder="Chrome 128 (macOS)"
                      className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                    />
                  </div>

                  {/* 5. USER Profili */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <span>👤 USER Profili</span>
                    </label>
                    <input
                      type="text"
                      value={currentCaseState.userProfile}
                      onChange={(e) => handleUpdateCurrentState({ userProfile: e.target.value })}
                      placeholder="BLACK FRIDAY İNDİRİM KULLANICISI"
                      className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                    />
                  </div>

                  {/* 6. Müşteri Tipi */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <span>👥 Müşteri Tipi</span>
                    </label>
                    <select
                      value={currentCaseState.customerType}
                      onChange={(e) => handleUpdateCurrentState({ customerType: e.target.value })}
                      className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                    >
                      <option value="BIREYSEL">👥 BİREYSEL</option>
                      <option value="KURUMSAL">🏢 KURUMSAL</option>
                      <option value="VIP">💎 VIP</option>
                    </select>
                  </div>

                  {/* 7. Flaky / Retry Durumu */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <span>⚠️ Flaky / Retry Durumu</span>
                    </label>
                    <select
                      value={currentCaseState.flakyStatus}
                      onChange={(e) => handleUpdateCurrentState({ flakyStatus: e.target.value })}
                      className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                    >
                      <option value="NONE">Stabil (Retry Yok)</option>
                      <option value="+1 retry">+1 retry</option>
                      <option value="+2 retry">+2 retry</option>
                      <option value="FLAKY">FLAKY</option>
                    </select>
                  </div>

                  {/* 8. Süre (ms) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <span>⏱️ Süre (ms)</span>
                    </label>
                    <input
                      type="number"
                      value={currentCaseState.executionMs}
                      onChange={(e) => handleUpdateCurrentState({ executionMs: Number(e.target.value) })}
                      placeholder="240"
                      className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Test Adımları Kontrol Listesi Card */}
              {currentCase.steps && currentCase.steps.length > 0 && (
                <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                      <ClipboardList className="w-4 h-4 text-[var(--accent-primary)]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        Test Adımları Kontrol Listesi
                      </h4>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      {verifiedStepsCount} / {totalSteps} adım doğrulandı
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {currentCase.steps.map((step, idx) => {
                      const stStatus = currentCaseState.stepStatuses[idx] || 'NONE';
                      const isVerified = stStatus !== 'NONE';

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                            stStatus === 'PASSED'
                              ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                              : stStatus === 'FAILED'
                              ? 'bg-red-500/5 dark:bg-red-500/10 border-red-500/30'
                              : stStatus === 'BLOCKED'
                              ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
                              : 'bg-white dark:bg-[#151b28] border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {/* Checkbox on Left */}
                          <button
                            type="button"
                            onClick={() => handleToggleStepCheckbox(idx)}
                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                              isVerified
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                            }`}
                          >
                            {isVerified && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          {/* Step Description & Expected */}
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              Adım {step.stepNumber}: {step.action}
                            </p>
                            {step.expectedResult && (
                              <p className="mt-1 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                <span className="font-semibold text-slate-600 dark:text-slate-300">Beklenen:</span>{' '}
                                {step.expectedResult}
                              </p>
                            )}
                          </div>

                          {/* Right Side: Pass / Fail / Blocked Action Flags */}
                          <div className="flex items-center space-x-1.5 shrink-0">
                            {/* Pass Flag */}
                            <button
                              type="button"
                              onClick={() => handleSetStepFlag(idx, 'PASSED')}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                stStatus === 'PASSED'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-slate-200 dark:border-slate-700'
                              }`}
                              title="Adımı Başarılı (Passed) olarak işaretle"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>

                            {/* Fail Flag */}
                            <button
                              type="button"
                              onClick={() => handleSetStepFlag(idx, 'FAILED')}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                stStatus === 'FAILED'
                                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border-slate-200 dark:border-slate-700'
                              }`}
                              title="Adımı Başarısız (Failed) olarak işaretle"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>

                            {/* Blocked Flag */}
                            <button
                              type="button"
                              onClick={() => handleSetStepFlag(idx, 'BLOCKED')}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                stStatus === 'BLOCKED'
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-slate-200 dark:border-slate-700'
                              }`}
                              title="Adımı Engellenmiş (Blocked) olarak işaretle"
                            >
                              <Slash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Yorum / Not & Doğrulama Açıklaması Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <MessageSquare className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>Yorum / Not & Doğrulama Açıklaması</span>
                  </label>
                  <span className="text-[11px] text-slate-400">(Her durum için eklenebilir)</span>
                </div>
                <textarea
                  rows={3}
                  value={currentCaseState.errorMessage}
                  onChange={(e) => handleUpdateCurrentState({ errorMessage: e.target.value })}
                  placeholder="Kampanya kupon motoru üretim ortamında 240ms içinde yanıt verdi."
                  className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none shadow-xs"
                />
              </div>

              {/* 5. Jira Bug Key & Defect Creation Section */}
              {currentCaseState.status === 'FAILED' || Object.values(currentCaseState.stepStatuses || {}).some((s) => s === 'FAILED') ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <Bug className="w-4 h-4 text-rose-500" />
                      <span>Jira Bug Key (Opsiyonel)</span>
                    </label>
                    <input
                      type="text"
                      value={currentCaseState.jiraBugKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateCurrentState({
                          jiraBugKey: val,
                          jiraBugUrl: val.trim() ? `https://company.atlassian.net/browse/${val.trim()}` : '',
                        });
                      }}
                      placeholder="Örn: MOB-542 veya QA-102"
                      className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] shadow-xs"
                    />
                  </div>

                  {currentCaseState.createdDefect ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Defect Oluşturuldu
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {currentCaseState.createdDefect.key}
                        </span>
                      </div>
                      <div className="w-full h-[38px] inline-flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 shadow-2xs">
                        <div className="inline-flex items-center space-x-1.5 min-w-0 flex-1 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{currentCaseState.createdDefect.key}: Hata Kaydı Açıldı</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenDefectModal}
                          className="ml-2 text-[10px] text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 cursor-pointer font-bold"
                          title="Yeni bir defect daha oluştur veya düzenle"
                        >
                          Düzenle / Yeni
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Defect Yönetimi
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">(Opsiyonel)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenDefectModal}
                        className="w-full h-[38px] inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.99] border border-rose-500/40 shadow-sm shadow-rose-900/20 transition-all cursor-pointer"
                      >
                        <Bug className="w-4 h-4" />
                        <span>Defect Oluştur</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <Bug className="w-4 h-4 text-rose-500" />
                    <span>Jira Bug Key (Opsiyonel)</span>
                  </label>
                  <input
                    type="text"
                    value={currentCaseState.jiraBugKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateCurrentState({
                        jiraBugKey: val,
                        jiraBugUrl: val.trim() ? `https://company.atlassian.net/browse/${val.trim()}` : '',
                      });
                    }}
                    placeholder="Örn: MOB-542 veya QA-102"
                    className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] shadow-xs"
                  />
                </div>
              )}

              {/* 6. Ekran Görüntüleri & Kanıtlar Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>Ekran Görüntüleri & Kanıtlar ({currentCaseState.screenshots.length})</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    (Ctrl+V ile panodan yapıştırabilir veya dosya seçebilirsiniz)
                  </span>
                </div>

                {/* Upload and URL input row */}
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>Dosya Seç</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFilesSelected(e.target.files)}
                    />
                  </label>

                  <div className="flex-1 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={activeNewImageUrl}
                      onChange={(e) => setActiveNewImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      placeholder="veya Görsel URL'si yapıştırın..."
                      className="flex-1 bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!activeNewImageUrl.trim()}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
                    >
                      Ekle
                    </button>
                  </div>
                </div>

                {/* Thumbnails Gallery */}
                {currentCaseState.screenshots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {currentCaseState.screenshots.map((url, sIdx) => (
                      <div
                        key={sIdx}
                        className="group relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-900 aspect-video shadow-xs"
                      >
                        <img
                          src={url}
                          alt={`Kanıt ${sIdx + 1}`}
                          className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                          onClick={() => setLightboxIndex(sIdx)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveScreenshot(sIdx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md"
                          title="Görseli Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(sIdx)}
                          className="absolute bottom-1.5 right-1.5 p-1 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                          title="Büyüt"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Execution Footer Actions */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#151b28] shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>

                {currentIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => handleChangeIndex(currentIndex - 1)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Önceki Senaryo</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2.5">
                {currentIndex < runCases.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => handleChangeIndex(currentIndex + 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Sonraki Senaryoya Geç</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitRun}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-[var(--accent-dark)]/20 active:scale-98 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Kaydediliyor...'
                      : currentIndex === runCases.length - 1
                      ? 'Koşumu Tamamla ve Sonuçları Kaydet'
                      : 'Tüm Koşumu Şimdi Tamamla ve Kaydet'}
                  </span>
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
                Test Planı Koşumu Başarıyla Tamamlandı!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tüm senaryoların sonuçları, yürütme süreleri ve kanıtları veritabanına işlendi.
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
                className="px-8 py-2.5 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 shadow-md shadow-[var(--accent-dark)]/25 cursor-pointer"
              >
                Kapat ve Koşum Geçmişine Dön
              </button>
            </div>
          </div>
        )}

      </div>

      {/* New Defect Creation Modal */}
      {isDefectModalOpen && defectInitialData && (
        <NewDefectModal
          isOpen={isDefectModalOpen}
          onClose={() => {
            setIsDefectModalOpen(false);
            setDefectInitialData(null);
          }}
          projectId={projectId}
          projectName={(runCases[currentIndex] as any)?.project?.name}
          projectKey={(runCases[currentIndex] as any)?.project?.key}
          allCases={runCases[currentIndex] ? [runCases[currentIndex]] : []}
          initialData={defectInitialData}
          onSubmit={handleCreateDefectSubmit}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && currentCaseState && currentCaseState.screenshots[lightboxIndex] && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={currentCaseState.screenshots[lightboxIndex]}
            alt="Büyük Kanıt Görseli"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
