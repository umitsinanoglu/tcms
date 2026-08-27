'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Project,
  TestRun,
  TestCase,
  TestPlan,
  TestResult,
  RunStatus,
  ResultStatus,
  Priority,
  TestType,
  TestRunsService,
  ReportsService,
  SuiteTreeNode,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { parseScreenshots } from './QuickRunModal';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  Layers,
  FileText,
  Activity,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Eye,
  Sparkles,
  Bug,
  Image as ImageIcon,
  Upload,
  MessageSquare,
  FileSpreadsheet,
  Zap,
  Slash,
  User,
  SlidersHorizontal,
  ClipboardList,
  CheckSquare,
  Square,
  Info,
  Smartphone,
  Globe,
  Tag,
  AlertTriangle,
  LayoutGrid,
  List,
  Timer,
} from 'lucide-react';

interface TestRunDetailViewProps {
  run: TestRun;
  project: Project | null;
  projects?: Project[];
  allCases?: TestCase[];
  tree?: SuiteTreeNode[];
  testPlans?: TestPlan[];
  onBack: () => void;
  onSelectCase?: (testCase: TestCase) => void;
  onSelectPlan?: (testPlan: TestPlan) => void;
  onUpdateRunSuccess?: (updated: TestRun) => void;
  onDeleteRunSuccess?: (deletedId: string) => void;
}

type DetailTab = 'SCENARIOS' | 'DEFECTS' | 'OVERVIEW';
type ViewMode = 'CARDS' | 'TABLE';

export const TestRunDetailView: React.FC<TestRunDetailViewProps> = ({
  run: initialRun,
  project,
  projects = [],
  allCases = [],
  tree = [],
  testPlans = [],
  onBack,
  onSelectCase,
  onSelectPlan,
  onUpdateRunSuccess,
  onDeleteRunSuccess,
}) => {
  const { currentUser } = useAuth();
  const [run, setRun] = useState<TestRun>(initialRun);
  const [activeTab, setActiveTab] = useState<DetailTab>('SCENARIOS');
  const [viewMode, setViewMode] = useState<ViewMode>('CARDS');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ResultStatus | 'PENDING'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [envFilter, setEnvFilter] = useState<string>('ALL');

  // Expanded Row for Steps
  const [expandedCaseIds, setExpandedCaseIds] = useState<Set<string>>(new Set());

  // Result Drawer / Modal for Editing Single Case Result
  const [activeResultModalCase, setActiveResultModalCase] = useState<{
    testCase: TestCase;
    currentResult?: TestResult;
  } | null>(null);

  // Drawer Form State
  const [drawerStatus, setDrawerStatus] = useState<ResultStatus>('PASSED');
  const [drawerComment, setDrawerComment] = useState('');
  const [drawerExecutionMs, setDrawerExecutionMs] = useState<number>(0);
  const [drawerJiraBugKey, setDrawerJiraBugKey] = useState('');
  const [drawerJiraBugUrl, setDrawerJiraBugUrl] = useState('');
  const [drawerScreenshots, setDrawerScreenshots] = useState<string[]>([]);
  const [drawerNewImageUrl, setDrawerNewImageUrl] = useState('');
  const [isSavingDrawer, setIsSavingDrawer] = useState(false);
  const [completedStepNumbers, setCompletedStepNumbers] = useState<Set<number>>(new Set());

  // Extended Metadata State for the Active Case Drawer
  const [drawerEnvironment, setDrawerEnvironment] = useState<string>('UAT');
  const [drawerPlatform, setDrawerPlatform] = useState<string>('iOS');
  const [drawerAppVersion, setDrawerAppVersion] = useState<string>('v1.2.0 (106)');
  const [drawerDevice, setDrawerDevice] = useState<string>('iphone14');
  const [drawerUserProfile, setDrawerUserProfile] = useState<string>('UMIT');
  const [drawerCustomerType, setDrawerCustomerType] = useState<string>('BIREYSEL');
  const [drawerFlakyStatus, setDrawerFlakyStatus] = useState<string>('NONE');
  const [drawerRetries, setDrawerRetries] = useState<number>(0);

  // Live Timer / Stopwatch in Drawer
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Lightbox Preview
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Bulk Selection
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

  // Show toast notification helper
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync when initialRun changes
  useEffect(() => {
    setRun(initialRun);
  }, [initialRun]);

  // Stopwatch Interval Timer
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setDrawerExecutionMs((prev) => prev + 1000);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Reload Run from backend
  const reloadRun = useCallback(async () => {
    if (!run?.id) return;
    setIsLoading(true);
    try {
      const fresh = await TestRunsService.getRunDetails(run.id);
      if (fresh) {
        setRun(fresh);
        if (onUpdateRunSuccess) onUpdateRunSuccess(fresh);
      }
    } catch (err) {
      console.error('Failed to reload test run:', err);
      showToast('Koşum verileri yenilenirken hata oluştu.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [run?.id, onUpdateRunSuccess]);

  // Compute Cases List: cases from results + cases from testPlan (if any pending)
  const runResultsMap = useMemo(() => {
    const map = new Map<string, TestResult>();
    (run.results || []).forEach((res) => {
      if (res.testCaseId) {
        map.set(res.testCaseId, res);
      }
    });
    return map;
  }, [run.results]);

  // Get full list of test cases in this run
  const runTestCases = useMemo(() => {
    const list: { testCase: TestCase; result?: TestResult }[] = [];
    const seenCaseIds = new Set<string>();

    // 1. Cases from existing results
    (run.results || []).forEach((res) => {
      if (res.testCase && !seenCaseIds.has(res.testCaseId)) {
        seenCaseIds.add(res.testCaseId);
        const fullCase = allCases.find((c) => c.id === res.testCaseId) || (res.testCase as TestCase);
        list.push({ testCase: fullCase, result: res });
      }
    });

    // 2. Cases from assigned Test Plan if any are missing from results
    if (run.testPlanId) {
      try {
        const savedPlanCaseIdsRaw = localStorage.getItem(`tcms_plan_cases_${run.testPlanId}`);
        if (savedPlanCaseIdsRaw) {
          const planCaseIds: string[] = JSON.parse(savedPlanCaseIdsRaw);
          planCaseIds.forEach((cId) => {
            if (!seenCaseIds.has(cId)) {
              const matched = allCases.find((c) => c.id === cId);
              if (matched) {
                seenCaseIds.add(cId);
                list.push({ testCase: matched, result: undefined });
              }
            }
          });
        }
      } catch {
        // Ignore
      }
    }

    return list;
  }, [run.results, run.testPlanId, allCases]);

  // Run Statistics
  const stats = useMemo(() => {
    const total = runTestCases.length;
    let passed = 0;
    let failed = 0;
    let blocked = 0;
    let skipped = 0;
    let pending = 0;
    let totalMs = 0;

    runTestCases.forEach((item) => {
      if (!item.result) {
        pending++;
      } else {
        if (item.result.status === 'PASSED') passed++;
        else if (item.result.status === 'FAILED') failed++;
        else if (item.result.status === 'BLOCKED') blocked++;
        else if (item.result.status === 'SKIPPED') skipped++;
        totalMs += item.result.executionMs || 0;
      }
    });

    const executed = passed + failed + blocked + skipped;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const executedPassRate = executed > 0 ? Math.round((passed / executed) * 100) : 0;

    return {
      total,
      passed,
      failed,
      blocked,
      skipped,
      pending,
      executed,
      passRate,
      executedPassRate,
      totalMs,
      durationFormatted: formatDuration(totalMs),
    };
  }, [runTestCases]);

  // Filtered Test Cases for Display
  const filteredCases = useMemo(() => {
    return runTestCases.filter(({ testCase, result }) => {
      // Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING') {
          if (result) return false;
        } else if (result?.status !== statusFilter) {
          return false;
        }
      }

      // Priority Filter
      if (priorityFilter !== 'ALL' && testCase.priority !== priorityFilter) {
        return false;
      }

      // Type Filter
      if (typeFilter !== 'ALL' && testCase.type !== typeFilter) {
        return false;
      }

      // Platform Filter
      if (platformFilter !== 'ALL') {
        const plat = result?.platform || (testCase.type === 'IOS' ? 'iOS' : testCase.type === 'ANDROID' ? 'Android' : 'Web');
        if (plat !== platformFilter) return false;
      }

      // Environment Filter
      if (envFilter !== 'ALL') {
        const env = result?.environment || run.environment || 'UAT';
        if (env !== envFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = testCase.code?.toLowerCase().includes(q);
        const titleMatch = testCase.title?.toLowerCase().includes(q);
        const errMatch = result?.errorMessage?.toLowerCase().includes(q);
        const bugMatch = result?.jiraBugKey?.toLowerCase().includes(q);
        const userMatch = result?.userProfile?.toLowerCase().includes(q);
        const devMatch = result?.device?.toLowerCase().includes(q);
        const suiteMatch = testCase.suite?.name?.toLowerCase().includes(q);
        if (!codeMatch && !titleMatch && !errMatch && !bugMatch && !userMatch && !devMatch && !suiteMatch) {
          return false;
        }
      }

      return true;
    });
  }, [runTestCases, statusFilter, priorityFilter, typeFilter, platformFilter, envFilter, searchQuery, run.environment]);

  // Defects List (FAILED + BLOCKED cases)
  const defectCases = useMemo(() => {
    return runTestCases.filter(
      ({ result }) => result && (result.status === 'FAILED' || result.status === 'BLOCKED')
    );
  }, [runTestCases]);

  // Open Drawer / Modal for Editing Result Details & Live Stopwatch
  const handleOpenResultDrawer = (testCase: TestCase, currentResult?: TestResult) => {
    setActiveResultModalCase({ testCase, currentResult });
    setDrawerStatus(currentResult?.status || 'PASSED');
    setDrawerComment(currentResult?.errorMessage || '');
    setDrawerExecutionMs(currentResult?.executionMs || 0);
    setDrawerJiraBugKey(currentResult?.jiraBugKey || '');
    setDrawerJiraBugUrl(currentResult?.jiraBugUrl || '');
    setDrawerScreenshots(parseScreenshots(currentResult?.screenshotUrl || testCase.screenshotUrl));
    setDrawerNewImageUrl('');
    setCompletedStepNumbers(new Set());

    // Populate Extended Metadata
    setDrawerEnvironment(currentResult?.environment || run.environment || 'UAT');
    setDrawerPlatform(
      currentResult?.platform || (testCase.type === 'IOS' ? 'iOS' : testCase.type === 'ANDROID' ? 'Android' : 'Web')
    );
    setDrawerAppVersion(currentResult?.appVersion || run.version || 'v1.2.0 (106)');
    setDrawerDevice(
      currentResult?.device || (testCase.type === 'IOS' ? 'iphone14' : testCase.type === 'ANDROID' ? 's24' : 'iphone 15')
    );
    setDrawerUserProfile(currentResult?.userProfile || (currentUser?.name ? currentUser.name.toUpperCase() : 'UMIT'));
    setDrawerCustomerType(currentResult?.customerType || 'BIREYSEL');
    setDrawerFlakyStatus(currentResult?.flakyStatus || 'NONE');
    setDrawerRetries(currentResult?.retries || 0);

    // Auto start stopwatch if test has not been executed yet
    if (!currentResult) {
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  };

  // INSTANT STATUS CHANGE (1-Click Real-time Update)
  const handleInstantStatusChange = async (testCaseId: string, newStatus: ResultStatus) => {
    if (!project?.id) return;
    const existingResult = runResultsMap.get(testCaseId);
    const matchedCase = allCases.find((c) => c.id === testCaseId);

    const platformVal =
      existingResult?.platform || (matchedCase?.type === 'IOS' ? 'iOS' : matchedCase?.type === 'ANDROID' ? 'Android' : 'Web');
    const deviceVal =
      existingResult?.device || (matchedCase?.type === 'IOS' ? 'iphone14' : matchedCase?.type === 'ANDROID' ? 's24' : 'iphone14');

    // Optimistic UI Update
    const updatedResults = [...(run.results || [])];
    const existingIdx = updatedResults.findIndex((r) => r.testCaseId === testCaseId);
    const mockResult: TestResult = {
      id: existingResult?.id || `temp-${Date.now()}`,
      testRunId: run.id,
      testCaseId,
      status: newStatus,
      executionMs: existingResult?.executionMs || Math.floor(Math.random() * 300) + 50,
      errorMessage: existingResult?.errorMessage,
      jiraBugKey: existingResult?.jiraBugKey,
      jiraBugUrl: existingResult?.jiraBugUrl,
      screenshotUrl: existingResult?.screenshotUrl,
      environment: existingResult?.environment || run.environment || 'UAT',
      platform: platformVal,
      appVersion: existingResult?.appVersion || run.version || 'v1.2.0 (106)',
      device: deviceVal,
      userProfile: existingResult?.userProfile || (currentUser?.name ? currentUser.name.toUpperCase() : 'UMIT'),
      customerType: existingResult?.customerType || 'BIREYSEL',
      flakyStatus: existingResult?.flakyStatus,
      retries: existingResult?.retries || 0,
      executedBy: currentUser?.name || run.executedBy || 'QA Tester',
      testerEmail: currentUser?.email || run.testerEmail,
      executedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      updatedResults[existingIdx] = { ...updatedResults[existingIdx], ...mockResult };
    } else {
      updatedResults.push(mockResult);
    }

    setRun((prev) => ({ ...prev, results: updatedResults }));

    try {
      await TestRunsService.saveResults(project.id, run.id, {
        results: [
          {
            testCaseId,
            status: newStatus,
            executionMs: mockResult.executionMs,
            errorMessage: existingResult?.errorMessage,
            jiraBugKey: existingResult?.jiraBugKey,
            jiraBugUrl: existingResult?.jiraBugUrl,
            screenshotUrl: existingResult?.screenshotUrl,
            environment: mockResult.environment,
            platform: mockResult.platform,
            appVersion: mockResult.appVersion,
            device: mockResult.device,
            userProfile: mockResult.userProfile,
            customerType: mockResult.customerType,
            flakyStatus: mockResult.flakyStatus,
            retries: mockResult.retries,
          },
        ],
      });

      const statusLabels: Record<ResultStatus, string> = {
        PASSED: 'PASSED (Geçti)',
        FAILED: 'FAILED (Kaldı)',
        BLOCKED: 'BLOCKED (Engellendi)',
        SKIPPED: 'SKIPPED (Atlandı)',
      };
      showToast(`Durum "${statusLabels[newStatus]}" olarak kaydedildi.`, 'success');
      reloadRun();
    } catch (err) {
      console.error('Failed to save status:', err);
      showToast('Durum güncellenirken hata oluştu!', 'error');
      reloadRun();
    }
  };

  // Save Drawer Result
  const handleSaveDrawerResult = async () => {
    if (!project?.id || !activeResultModalCase) return;
    setIsSavingDrawer(true);
    setIsTimerRunning(false);
    try {
      const testCaseId = activeResultModalCase.testCase.id;
      const combinedScreenshots = drawerScreenshots.join(';;');

      const bugUrl =
        drawerJiraBugUrl.trim() ||
        (drawerJiraBugKey.trim() ? `https://company.atlassian.net/browse/${drawerJiraBugKey.trim()}` : undefined);

      await TestRunsService.saveResults(project.id, run.id, {
        results: [
          {
            testCaseId,
            status: drawerStatus,
            executionMs: drawerExecutionMs > 0 ? drawerExecutionMs : 1200,
            errorMessage: drawerComment.trim() || undefined,
            jiraBugKey: drawerJiraBugKey.trim() || undefined,
            jiraBugUrl: bugUrl,
            screenshotUrl: combinedScreenshots || undefined,
            environment: drawerEnvironment,
            platform: drawerPlatform,
            appVersion: drawerAppVersion,
            device: drawerDevice,
            userProfile: drawerUserProfile,
            customerType: drawerCustomerType,
            flakyStatus: drawerFlakyStatus !== 'NONE' ? drawerFlakyStatus : undefined,
            retries: drawerRetries,
          },
        ],
      });

      showToast(`[${activeResultModalCase.testCase.code}] test sonucu ve bulguları kaydedildi.`, 'success');
      setActiveResultModalCase(null);
      await reloadRun();
    } catch (err) {
      console.error('Failed to save drawer result:', err);
      showToast('Sonuç kaydedilirken hata oluştu.', 'error');
    } finally {
      setIsSavingDrawer(false);
    }
  };

  // Bulk Status Update
  const handleBulkStatusChange = async (targetStatus: ResultStatus) => {
    if (!project?.id || selectedCaseIds.length === 0) return;
    setIsSavingStatus(true);
    try {
      const payloadResults = selectedCaseIds.map((cId) => {
        const existing = runResultsMap.get(cId);
        const matchedCase = allCases.find((c) => c.id === cId);
        return {
          testCaseId: cId,
          status: targetStatus,
          executionMs: existing?.executionMs || Math.floor(Math.random() * 200) + 50,
          errorMessage: existing?.errorMessage,
          jiraBugKey: existing?.jiraBugKey,
          jiraBugUrl: existing?.jiraBugUrl,
          screenshotUrl: existing?.screenshotUrl,
          environment: existing?.environment || run.environment || 'UAT',
          platform:
            existing?.platform || (matchedCase?.type === 'IOS' ? 'iOS' : matchedCase?.type === 'ANDROID' ? 'Android' : 'Web'),
          appVersion: existing?.appVersion || run.version || 'v1.2.0 (106)',
          device: existing?.device || 'iphone14',
          userProfile: existing?.userProfile || 'UMIT',
          customerType: existing?.customerType || 'BIREYSEL',
          flakyStatus: existing?.flakyStatus,
          retries: existing?.retries || 0,
        };
      });

      await TestRunsService.saveResults(project.id, run.id, { results: payloadResults });
      showToast(`${selectedCaseIds.length} test senaryosu "${targetStatus}" yapıldı.`, 'success');
      setSelectedCaseIds([]);
      await reloadRun();
    } catch (err) {
      console.error('Bulk update failed:', err);
      showToast('Toplu durum güncelleme başarısız oldu.', 'error');
    } finally {
      setIsSavingStatus(false);
    }
  };

  // Mark all cases as PASSED
  const handleMarkAllPassed = async () => {
    if (!project?.id || runTestCases.length === 0) return;
    if (!window.confirm(`Tüm (${runTestCases.length}) test senaryolarını PASSED olarak işaretlemek istediğinize emin misiniz?`)) {
      return;
    }
    setIsSavingStatus(true);
    try {
      const payloadResults = runTestCases.map(({ testCase, result }) => ({
        testCaseId: testCase.id,
        status: 'PASSED' as ResultStatus,
        executionMs: result?.executionMs || Math.floor(Math.random() * 200) + 50,
        errorMessage: undefined,
        jiraBugKey: undefined,
        jiraBugUrl: undefined,
        screenshotUrl: result?.screenshotUrl,
        environment: result?.environment || run.environment || 'UAT',
        platform: result?.platform || (testCase.type === 'IOS' ? 'iOS' : testCase.type === 'ANDROID' ? 'Android' : 'Web'),
        appVersion: result?.appVersion || run.version || 'v1.2.0 (106)',
        device: result?.device || 'iphone14',
        userProfile: result?.userProfile || 'UMIT',
        customerType: result?.customerType || 'BIREYSEL',
        flakyStatus: result?.flakyStatus,
        retries: result?.retries || 0,
      }));

      await TestRunsService.saveResults(project.id, run.id, { results: payloadResults });
      showToast('Tüm test senaryoları PASSED olarak güncellendi.', 'success');
      await reloadRun();
    } catch (err) {
      console.error('Mark all passed failed:', err);
      showToast('İşlem başarısız oldu.', 'error');
    } finally {
      setIsSavingStatus(false);
    }
  };

  // Update Run Status
  const handleUpdateRunStatus = async (newRunStatus: RunStatus) => {
    try {
      await TestRunsService.completeRun(run.id, newRunStatus);
      const labels: Record<RunStatus, string> = {
        COMPLETED: 'TAMAMLANDI',
        IN_PROGRESS: 'ÇALIŞIYOR',
        ABORTED: 'İPTAL EDİLDİ',
      };
      showToast(`Koşum durumu "${labels[newRunStatus]}" olarak güncellendi.`, 'success');
      await reloadRun();
    } catch (err) {
      console.error('Failed to update run status:', err);
      showToast('Koşum durumu güncellenemedi.', 'error');
    }
  };

  // Delete Run
  const handleDeleteRun = async () => {
    if (window.confirm(`"${run.title}" test koşumunu ve tüm verilerini kalıcı olarak silmek istediğinize emin misiniz?`)) {
      try {
        await TestRunsService.deleteRun(run.id);
        if (onDeleteRunSuccess) onDeleteRunSuccess(run.id);
        onBack();
      } catch (err) {
        console.error('Failed to delete run:', err);
        showToast('Test koşumu silinemedi.', 'error');
      }
    }
  };

  // Screenshot Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setDrawerScreenshots((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handlePasteImage = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              setDrawerScreenshots((prev) => [...prev, result]);
              showToast('Ekran görüntüsü panodan eklendi!', 'info');
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleAddImageUrl = () => {
    if (drawerNewImageUrl.trim()) {
      setDrawerScreenshots((prev) => [...prev, drawerNewImageUrl.trim()]);
      setDrawerNewImageUrl('');
    }
  };

  const handleRemoveScreenshot = (index: number) => {
    setDrawerScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRowExpansion = (caseId: string) => {
    setExpandedCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  };

  return (
    <div
      onPaste={handlePasteImage}
      className="flex-1 flex flex-col bg-[#f2f5f8] dark:bg-[#141821] text-[#0f172a] dark:text-[#f1f5f9] p-4 sm:p-6 space-y-4 overflow-y-auto min-h-0 transition-colors duration-200"
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-[10px] text-xs font-semibold shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-800 text-white border border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {toastMessage.type === 'error' && <XCircle className="w-4 h-4" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Top Breadcrumb & Return Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <div className="flex items-center space-x-2 text-xs text-[#64748b] dark:text-[#8e9bb0]">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] text-slate-700 dark:text-slate-200 hover:text-[#b83a4b] hover:border-[#b83a4b]/40 font-semibold transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Test Koşumlarına Dön</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 opacity-40" />

          {project && (
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              [{project.key}] {project.name}
            </span>
          )}

          {run.testPlan && (
            <>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              <button
                type="button"
                onClick={() => onSelectPlan && onSelectPlan(run.testPlan as TestPlan)}
                className="hover:text-[#b83a4b] hover:underline truncate max-w-[200px]"
                title={`Test Planı: ${run.testPlan.title}`}
              >
                {run.testPlan.title}
              </button>
            </>
          )}

          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="font-bold text-[#b83a4b] truncate max-w-[240px]">{run.title}</span>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={reloadRun}
            className="p-2 rounded-[8px] bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] text-[#64748b] dark:text-[#8e9bb0] hover:text-[#0f172a] dark:hover:text-[#f1f5f9] transition-all cursor-pointer shadow-xs"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => ReportsService.downloadRunReport(run.id, 'csv', run.title)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-[#1d232f] hover:bg-slate-50 dark:hover:bg-[#262e3d] text-emerald-600 dark:text-emerald-400 border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] text-xs font-semibold transition-all shadow-xs"
            title="CSV Raporu İndir"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV İndir</span>
          </button>

          <button
            type="button"
            onClick={() => ReportsService.downloadRunReport(run.id, 'html', run.title)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-[#1d232f] hover:bg-slate-50 dark:hover:bg-[#262e3d] text-slate-700 dark:text-slate-200 border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] text-xs font-semibold transition-all shadow-xs"
            title="HTML Raporu Aç"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">HTML Rapor</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteRun}
            className="p-2 rounded-[8px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
            title="Koşumu Sil"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Run Header Card */}
      <div className="p-5 rounded-[14px] bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#821c2b] to-[#b83a4b] text-white flex items-center justify-center shadow-md shadow-[#821c2b]/25 shrink-0 mt-0.5">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  {run.title}
                </h1>

                {/* Sürüm & Ortam */}
                <span className="px-2 py-0.5 rounded-[6px] text-xs font-mono font-bold bg-slate-100 dark:bg-[#141821] text-slate-800 dark:text-slate-200 border border-[#d0d8e4] dark:border-[#2e3748]">
                  {run.version || 'v1.0.0'}
                </span>
                <span className="px-2 py-0.5 rounded-[6px] text-xs font-mono font-bold bg-slate-100 dark:bg-[#141821] text-slate-800 dark:text-slate-200 border border-[#d0d8e4] dark:border-[#2e3748]">
                  {run.environment || 'STAGING'}
                </span>

                {/* Durum Rozeti */}
                {run.status === 'IN_PROGRESS' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                    ÇALIŞIYOR
                  </span>
                )}
                {run.status === 'COMPLETED' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    TAMAMLANDI
                  </span>
                )}
                {run.status === 'ABORTED' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    <XCircle className="w-3.5 h-3.5" />
                    İPTAL EDİLDİ
                  </span>
                )}
              </div>

              {/* Alt Bilgiler */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[#64748b] dark:text-[#8e9bb0]">
                <span className="flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-[#b83a4b]" />
                  <span>Tester: <strong className="text-slate-800 dark:text-slate-200">{run.executedBy || 'QA Tester'}</strong> ({run.testerEmail || 'tester@company.com'})</span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center space-x-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(run.createdAt).toLocaleString('tr-TR')}</span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center space-x-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Toplam Süre: <strong className="text-slate-800 dark:text-slate-200">{stats.durationFormatted}</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Sağ Hızlı Koşum Kontrol Aksiyonları */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            {run.status === 'IN_PROGRESS' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateRunStatus('COMPLETED')}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-[10px] text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Koşuyu Tamamla</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateRunStatus('ABORTED')}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-[10px] text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                >
                  <Slash className="w-3.5 h-3.5" />
                  <span>İptal Et</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleUpdateRunStatus('IN_PROGRESS')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-[10px] text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Koşuyu Yeniden Başlat (Çalışıyor Yap)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleMarkAllPassed}
              disabled={isSavingStatus || stats.total === 0}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-[10px] text-xs font-bold text-white bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] shadow-sm hover:shadow-[0_4px_12px_rgba(130,28,43,0.35)] transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tümünü PASSED Yap</span>
            </button>
          </div>
        </div>

        {/* Çok Renkli İlerleme Çubuğu */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-[#2e3748]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              İlerleme: <strong>{stats.executed} / {stats.total}</strong> Test Tamamlandı ({stats.pending} bekliyor)
            </span>
            <span className="font-bold text-[#b83a4b] text-sm">
              Başarı: %{stats.passRate} (Çalıştırılanlarda %{stats.executedPassRate})
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-[#141821] overflow-hidden flex shadow-inner">
            {stats.total > 0 && stats.passed > 0 && (
              <div
                style={{ width: `${(stats.passed / stats.total) * 100}%` }}
                className="bg-emerald-600 h-full transition-all duration-300"
                title={`Passed: ${stats.passed} (%${Math.round((stats.passed / stats.total) * 100)})`}
              />
            )}
            {stats.total > 0 && stats.failed > 0 && (
              <div
                style={{ width: `${(stats.failed / stats.total) * 100}%` }}
                className="bg-rose-600 h-full transition-all duration-300"
                title={`Failed: ${stats.failed} (%${Math.round((stats.failed / stats.total) * 100)})`}
              />
            )}
            {stats.total > 0 && stats.blocked > 0 && (
              <div
                style={{ width: `${(stats.blocked / stats.total) * 100}%` }}
                className="bg-amber-500 h-full transition-all duration-300"
                title={`Blocked: ${stats.blocked}`}
              />
            )}
            {stats.total > 0 && stats.skipped > 0 && (
              <div
                style={{ width: `${(stats.skipped / stats.total) * 100}%` }}
                className="bg-slate-400 h-full transition-all duration-300"
                title={`Skipped: ${stats.skipped}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. KPI Metrics Cards (Interactive Filter Triggers) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Toplam */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-3 rounded-[12px] bg-white dark:bg-[#1d232f] border transition-all shadow-xs cursor-pointer ${
            statusFilter === 'ALL'
              ? 'border-[#b83a4b] ring-1 ring-[#b83a4b]/30'
              : 'border-slate-200 dark:border-[#2e3748] hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Toplam Test
            </span>
            <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <ClipboardList className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">{stats.total}</span>
            <span className="text-[10px] text-slate-500">senaryo</span>
          </div>
        </div>

        {/* Geçen (Passed) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'PASSED' ? 'ALL' : 'PASSED')}
          className={`p-3 rounded-[12px] bg-white dark:bg-[#1d232f] border transition-all shadow-xs cursor-pointer ${
            statusFilter === 'PASSED'
              ? 'border-emerald-600 ring-1 ring-emerald-600/30'
              : 'border-slate-200 dark:border-[#2e3748] hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              PASSED
            </span>
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {stats.passed}
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">başarılı</span>
          </div>
        </div>

        {/* Hatalı (Failed) */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'FAILED' ? 'ALL' : 'FAILED');
            if (activeTab !== 'SCENARIOS') setActiveTab('SCENARIOS');
          }}
          className={`p-3 rounded-[12px] bg-white dark:bg-[#1d232f] border transition-all shadow-xs cursor-pointer ${
            statusFilter === 'FAILED'
              ? 'border-rose-600 ring-1 ring-rose-600/30'
              : 'border-slate-200 dark:border-[#2e3748] hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              FAILED
            </span>
            <div className="p-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">{stats.failed}</span>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80">kusur</span>
          </div>
        </div>

        {/* Engellenen (Blocked) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'BLOCKED' ? 'ALL' : 'BLOCKED')}
          className={`p-3 rounded-[12px] bg-white dark:bg-[#1d232f] border transition-all shadow-xs cursor-pointer ${
            statusFilter === 'BLOCKED'
              ? 'border-amber-600 ring-1 ring-amber-600/30'
              : 'border-slate-200 dark:border-[#2e3748] hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              BLOCKED
            </span>
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Slash className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {stats.blocked}
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">engel</span>
          </div>
        </div>

        {/* Atlanan (Skipped) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'SKIPPED' ? 'ALL' : 'SKIPPED')}
          className={`p-3 rounded-[12px] bg-white dark:bg-[#1d232f] border transition-all shadow-xs cursor-pointer ${
            statusFilter === 'SKIPPED'
              ? 'border-slate-600 ring-1 ring-slate-600/30'
              : 'border-slate-200 dark:border-[#2e3748] hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              SKIPPED
            </span>
            <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Tag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {stats.skipped}
            </span>
            <span className="text-[10px] text-slate-500">atlandı</span>
          </div>
        </div>

        {/* Bekleyen (Pending) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`p-3 rounded-[12px] bg-white dark:bg-[#1d232f] border transition-all shadow-xs cursor-pointer ${
            statusFilter === 'PENDING'
              ? 'border-slate-700 ring-1 ring-slate-700/30'
              : 'border-slate-200 dark:border-[#2e3748] hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              BEKLİYOR
            </span>
            <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">{stats.pending}</span>
            <span className="text-[10px] text-slate-500">koşulmamış</span>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-[#2e3748] pb-1 gap-2">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('SCENARIOS')}
            className={`px-4 py-2 text-xs font-bold rounded-t-[10px] transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
              activeTab === 'SCENARIOS'
                ? 'border-[#b83a4b] text-[#b83a4b] bg-white dark:bg-[#1d232f]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Test Senaryoları & Koşum Sonuçları ({runTestCases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DEFECTS')}
            className={`px-4 py-2 text-xs font-bold rounded-t-[10px] transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
              activeTab === 'DEFECTS'
                ? 'border-[#b83a4b] text-[#b83a4b] bg-white dark:bg-[#1d232f]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Bug className="w-3.5 h-3.5 text-[#b83a4b]" />
            <span>Hata Bulguları & Kusurlar ({defectCases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 text-xs font-bold rounded-t-[10px] transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
              activeTab === 'OVERVIEW'
                ? 'border-[#b83a4b] text-[#b83a4b] bg-white dark:bg-[#1d232f]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Koşum Özeti & İstatistikler</span>
          </button>
        </div>

        {/* View Mode Toggle & Bulk Actions */}
        <div className="flex items-center space-x-2">
          {selectedCaseIds.length > 0 && activeTab === 'SCENARIOS' && (
            <div className="flex items-center space-x-2 animate-in fade-in duration-150 text-xs mr-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {selectedCaseIds.length} seçildi:
              </span>
              <button
                type="button"
                onClick={() => handleBulkStatusChange('PASSED')}
                disabled={isSavingStatus}
                className="px-2.5 py-1 rounded-[6px] text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs"
              >
                Pass
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusChange('FAILED')}
                disabled={isSavingStatus}
                className="px-2.5 py-1 rounded-[6px] text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 shadow-xs"
              >
                Fail
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusChange('BLOCKED')}
                disabled={isSavingStatus}
                className="px-2.5 py-1 rounded-[6px] text-xs font-bold bg-amber-600 text-white hover:bg-amber-500 shadow-xs"
              >
                Block
              </button>
              <button
                type="button"
                onClick={() => setSelectedCaseIds([])}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'SCENARIOS' && (
            <div className="flex items-center rounded-[8px] bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-[6px] transition-colors ${
                  viewMode === 'CARDS'
                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Görsel Kart Görünümü"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-[6px] transition-colors ${
                  viewMode === 'TABLE'
                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Tablo / Liste Görünümü"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Tab Content: SCENARIOS */}
      {activeTab === 'SCENARIOS' && (
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          {/* Filtering Bar */}
          <div className="p-3 bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] rounded-[12px] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center flex-wrap gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Senaryo kodu, başlık, cihaz, user ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#141821] border border-slate-200 dark:border-[#2e3748] rounded-[8px] pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#b83a4b] focus:ring-1 focus:ring-[#b83a4b]/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-[#141821] border border-slate-200 dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#b83a4b] cursor-pointer"
              >
                <option value="ALL">Durum: Tümü</option>
                <option value="PASSED">Durum: PASSED (Geçti)</option>
                <option value="FAILED">Durum: FAILED (Hatalı)</option>
                <option value="BLOCKED">Durum: BLOCKED (Engellendi)</option>
                <option value="SKIPPED">Durum: SKIPPED (Atlandı)</option>
                <option value="PENDING">Durum: Bekleyenler</option>
              </select>

              {/* Platform Filter */}
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-slate-50 dark:bg-[#141821] border border-slate-200 dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#b83a4b] cursor-pointer"
              >
                <option value="ALL">Platform: Tümü</option>
                <option value="iOS">🍎 iOS</option>
                <option value="Android">🤖 Android</option>
                <option value="Web">🌐 Web</option>
                <option value="API">⚡ API</option>
              </select>

              {/* Ortam Filter */}
              <select
                value={envFilter}
                onChange={(e) => setEnvFilter(e.target.value)}
                className="bg-slate-50 dark:bg-[#141821] border border-slate-200 dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#b83a4b] cursor-pointer"
              >
                <option value="ALL">Ortam: Tümü</option>
                <option value="UAT">🌐 UAT</option>
                <option value="TEST">🌐 TEST</option>
                <option value="PROD">🌐 PROD</option>
                <option value="STAGING">🌐 STAGING</option>
              </select>

              {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || platformFilter !== 'ALL' || envFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setPriorityFilter('ALL');
                    setPlatformFilter('ALL');
                    setEnvFilter('ALL');
                  }}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-[6px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Sıfırla</span>
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-mono shrink-0">
              Gösterilen: <strong className="text-slate-900 dark:text-slate-100">{filteredCases.length}</strong> / {runTestCases.length}
            </div>
          </div>

          {/* VIEW MODE 1: VISUAL CARDS */}
          {viewMode === 'CARDS' && (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {filteredCases.length === 0 ? (
                <div className="py-16 text-center rounded-[12px] bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] p-6 text-slate-400">
                  <Filter className="w-8 h-8 mx-auto opacity-30 mb-2" />
                  <p className="font-semibold">Kriterlere uygun test senaryosu bulunamadı.</p>
                </div>
              ) : (
                filteredCases.map(({ testCase, result }) => {
                  const currentStatus = result?.status;
                  const isPassed = currentStatus === 'PASSED';
                  const isFailed = currentStatus === 'FAILED';
                  const isBlocked = currentStatus === 'BLOCKED';
                  const isSkipped = currentStatus === 'SKIPPED';
                  const isPending = !result;

                  const envTag = result?.environment || run.environment || 'UAT';
                  const platformTag =
                    result?.platform || (testCase.type === 'IOS' ? 'iOS' : testCase.type === 'ANDROID' ? 'Android' : 'Web');
                  const isIos = platformTag.toLowerCase().includes('ios');
                  const isAndroid = platformTag.toLowerCase().includes('android');
                  const appVersionTag = result?.appVersion || run.version || 'v1.2.0 (106)';
                  const deviceTag =
                    result?.device || (testCase.type === 'IOS' ? 'iphone14' : testCase.type === 'ANDROID' ? 's24' : 'iphone14');
                  const userProfileTag = result?.userProfile || 'UMIT';
                  const customerTypeTag = result?.customerType || 'BIREYSEL';
                  const durationTag = result?.executionMs
                    ? formatDuration(result.executionMs)
                    : isPending
                    ? 'Bekliyor'
                    : '51 sn';

                  const executedDateTag = result?.executedAt
                    ? new Date(result.executedAt).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : new Date(run.createdAt).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                  const flakyTag = result?.flakyStatus;

                  return (
                    <div
                      key={testCase.id}
                      onClick={() => handleOpenResultDrawer(testCase, result)}
                      className={`p-4 rounded-[14px] bg-white dark:bg-[#1d232f] border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                        isFailed
                          ? 'border-rose-500/40 hover:border-rose-500/70'
                          : isPassed
                          ? 'border-emerald-500/40 hover:border-emerald-500/70'
                          : isBlocked
                          ? 'border-amber-500/40 hover:border-amber-500/70'
                          : 'border-slate-200 dark:border-[#2e3748] hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* Left: Title & All Visual Badges */}
                      <div className="space-y-2 min-w-0 flex-1">
                        {/* Title */}
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#141821] px-2 py-0.5 rounded border border-slate-200 dark:border-[#2e3748] shrink-0">
                            {testCase.code}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#b83a4b] transition-colors truncate">
                            {testCase.title}
                          </h3>
                        </div>

                        {/* Visual Badge Ribbon (Clean 80% Neutral Slate/Gray Badges) */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                          {/* 1. 🌐 Ortam: UAT / TEST / PROD */}
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <span>🌐</span>
                            <span className="font-bold">{envTag}</span>
                          </span>

                          {/* 2. 🍎 / 🤖 Platform: iOS / Android */}
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <span>{isIos ? '🍎' : isAndroid ? '🤖' : '🌐'}</span>
                            <span className="font-bold">{platformTag}</span>
                          </span>

                          {/* 3. 📦 Uygulama Versiyonu: v1.2.0 (106) */}
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <span>📦</span>
                            <span className="font-mono">{appVersionTag}</span>
                          </span>

                          {/* 4. 📱 Cihaz Aliası: iphone14 */}
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <span>📱</span>
                            <span className="font-mono font-bold">{deviceTag}</span>
                          </span>

                          {/* 5. 👤 USER Profili: 👤 UMIT */}
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <span>👤</span>
                            <span className="font-bold uppercase">{userProfileTag}</span>
                          </span>

                          {/* 6. 👥 Müşteri Tipi: 👥 BIREYSEL */}
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <span>👥</span>
                            <span className="font-bold">{customerTypeTag}</span>
                          </span>

                          {/* 7. 📅 Koşum Zamanı */}
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span>📅</span>
                            <span className="font-mono">{executedDateTag}</span>
                          </span>

                          {/* 8. ⏱️ Koşum Süresi */}
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <span>⏱️</span>
                            <span className="font-mono font-bold">{durationTag}</span>
                          </span>

                          {/* 9. ⚠️ Flaky Durumu */}
                          {flakyTag && flakyTag !== 'NONE' && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold">
                              <span>⚠️</span>
                              <span className="font-bold">{flakyTag}</span>
                            </span>
                          )}

                          {/* Jira Bug Key Badge if any */}
                          {result?.jiraBugKey && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  result.jiraBugUrl || `https://company.atlassian.net/browse/${result.jiraBugKey}`,
                                  '_blank'
                                );
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:underline cursor-pointer"
                            >
                              <Bug className="w-3 h-3" />
                              <span className="font-bold">{result.jiraBugKey}</span>
                            </span>
                          )}
                        </div>

                        {/* Error message or note preview if present */}
                        {result?.errorMessage && (
                          <div
                            className={`p-2 rounded-[8px] text-[11px] font-mono mt-1 ${
                              isFailed
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                                : 'bg-slate-100 dark:bg-[#141821] text-slate-700 dark:text-slate-300 border border-[#d0d8e4] dark:border-[#2e3748]'
                            }`}
                          >
                            <strong>{isFailed ? 'Hata Bulgusu:' : 'Not / Açıklama:'}</strong> {result.errorMessage}
                          </div>
                        )}
                      </div>

                      {/* Right: Circular Result Icon & Quick Action Buttons */}
                      <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                        {/* 1-Click Status Marking Buttons */}
                        <div
                          className="flex items-center space-x-1 opacity-90 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleInstantStatusChange(testCase.id, 'PASSED')}
                            className={`p-1.5 rounded-lg transition-all ${
                              isPassed
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            }`}
                            title="Pass Yap"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInstantStatusChange(testCase.id, 'FAILED')}
                            className={`p-1.5 rounded-lg transition-all ${
                              isFailed
                                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
                                : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                            }`}
                            title="Fail Yap"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Large Circular Result Badge (Exactly as in screenshot) */}
                        {isPassed && (
                          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                            <Check className="w-6 h-6 stroke-[3]" />
                          </div>
                        )}
                        {isFailed && (
                          <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
                            <X className="w-6 h-6 stroke-[3]" />
                          </div>
                        )}
                        {isBlocked && (
                          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                            <Slash className="w-5 h-5 stroke-[2.5]" />
                          </div>
                        )}
                        {isSkipped && (
                          <div className="w-10 h-10 rounded-full bg-slate-500 text-white flex items-center justify-center shadow-md">
                            <span className="text-[10px] font-bold font-mono">SKIP</span>
                          </div>
                        )}
                        {isPending && (
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#262e3d] text-slate-400 flex items-center justify-center border border-dashed border-slate-400">
                            <Clock className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW MODE 2: DATA DENSE TABLE */}
          {viewMode === 'TABLE' && (
            <div className="border border-[#d0d8e4] dark:border-[#2e3748] rounded-[12px] overflow-hidden bg-white dark:bg-[#1d232f] shadow-xs flex-1 flex flex-col min-h-0">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-[#161f30] border-b border-[#d0d8e4] dark:border-[#2e3748] text-[#64748b] dark:text-[#8e9bb0]">
                    <tr className="font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCaseIds.length > 0 && selectedCaseIds.length === filteredCases.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCaseIds(filteredCases.map((item) => item.testCase.id));
                            } else {
                              setSelectedCaseIds([]);
                            }
                          }}
                          className="rounded border-[#d0d8e4] dark:border-[#2e3748] text-[#b83a4b] focus:ring-[#b83a4b]"
                        />
                      </th>
                      <th className="py-3 px-3 w-12 text-center">Adım</th>
                      <th className="py-3 px-3 w-28">Senaryo Kodu</th>
                      <th className="py-3 px-4 min-w-[220px]">Test Senaryosu</th>
                      <th className="py-3 px-3 w-28">Ortam & Cihaz</th>
                      <th className="py-3 px-3 w-24">USER / Müşteri</th>
                      <th className="py-3 px-4 min-w-[180px]">Anlık Durum Kaydı</th>
                      <th className="py-3 px-4 min-w-[160px]">Süre & Bulgular</th>
                      <th className="py-3 px-3 w-24 text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2e3748]/60">
                    {filteredCases.map(({ testCase, result }) => {
                      const isExpanded = expandedCaseIds.has(testCase.id);
                      const isSelected = selectedCaseIds.includes(testCase.id);
                      const currentStatus = result?.status;

                      return (
                        <React.Fragment key={testCase.id}>
                          <tr
                            className={`hover:bg-slate-50/80 dark:hover:bg-[#262e3d]/50 transition-colors group ${
                              currentStatus === 'FAILED'
                                ? 'bg-rose-500/5'
                                : currentStatus === 'PASSED'
                                ? 'bg-emerald-500/5'
                                : currentStatus === 'BLOCKED'
                                ? 'bg-amber-500/5'
                                : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedCaseIds((prev) =>
                                    prev.includes(testCase.id)
                                      ? prev.filter((id) => id !== testCase.id)
                                      : [...prev, testCase.id]
                                  );
                                }}
                                className="rounded border-[#d0d8e4] dark:border-[#2e3748] text-[#b83a4b] focus:ring-[#b83a4b]"
                              />
                            </td>

                            <td className="py-3 px-3 text-center">
                              {testCase.steps && testCase.steps.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpansion(testCase.id)}
                                  className="p-1 rounded text-[#64748b] hover:text-slate-900 dark:hover:text-slate-100"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-[#b83a4b]" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                              )}
                            </td>

                            <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {testCase.code}
                            </td>

                            <td className="py-3 px-4">
                              <div
                                onClick={() => handleOpenResultDrawer(testCase, result)}
                                className="font-semibold text-slate-800 dark:text-slate-200 hover:text-[#b83a4b] cursor-pointer line-clamp-2"
                              >
                                {testCase.title}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="space-y-0.5 text-[11px] font-mono">
                                <div>🌐 {result?.environment || run.environment || 'UAT'}</div>
                                <div className="text-[#64748b] dark:text-[#8e9bb0]">
                                  📱 {result?.device || 'iphone14'}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="space-y-0.5 text-[11px]">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                  👤 {result?.userProfile || 'UMIT'}
                                </div>
                                <div className="text-slate-600 dark:text-slate-400">
                                  👥 {result?.customerType || 'BIREYSEL'}
                                </div>
                              </div>
                            </td>

                            {/* Status Buttons */}
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleInstantStatusChange(testCase.id, 'PASSED')}
                                  className={`px-2 py-1 rounded-[6px] text-[11px] font-mono font-bold ${
                                    currentStatus === 'PASSED'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-emerald-500/10 text-emerald-600'
                                  }`}
                                >
                                  PASS
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInstantStatusChange(testCase.id, 'FAILED')}
                                  className={`px-2 py-1 rounded-[6px] text-[11px] font-mono font-bold ${
                                    currentStatus === 'FAILED' ? 'bg-rose-600 text-white' : 'bg-rose-500/10 text-rose-600'
                                  }`}
                                >
                                  FAIL
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInstantStatusChange(testCase.id, 'BLOCKED')}
                                  className={`px-2 py-1 rounded-[6px] text-[11px] font-mono font-bold ${
                                    currentStatus === 'BLOCKED'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-amber-500/10 text-amber-600'
                                  }`}
                                >
                                  BLOCK
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-4 font-mono text-[11px]">
                              <div>⏱️ {result?.executionMs ? formatDuration(result.executionMs) : '—'}</div>
                              {result?.jiraBugKey && (
                                <span className="text-rose-500 font-bold">🐞 {result.jiraBugKey}</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenResultDrawer(testCase, result)}
                                className="p-1.5 rounded-[6px] bg-slate-100 dark:bg-[#262e3d] text-slate-700 dark:text-slate-300 hover:text-[#b83a4b]"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Steps */}
                          {isExpanded && testCase.steps && testCase.steps.length > 0 && (
                            <tr className="bg-slate-50/50 dark:bg-[#141821]/40">
                              <td colSpan={9} className="p-4 pl-12">
                                <div className="p-3 rounded-[10px] bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] space-y-1.5">
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Adımlar ({testCase.steps.length})
                                  </span>
                                  {testCase.steps.map((st, idx) => (
                                    <div key={idx} className="text-xs flex items-start space-x-2">
                                      <span className="font-mono font-bold">{st.stepNumber || idx + 1}.</span>
                                      <span>
                                        {st.action} &rarr; <em className="text-[#64748b]">{st.expectedResult}</em>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Tab Content: DEFECTS */}
      {activeTab === 'DEFECTS' && (
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Bug className="w-4 h-4 text-rose-500" />
                <span>Tespit Edilen Hata Bulguları ve Kusur Kayıtları</span>
              </h2>
              <p className="text-xs text-[#64748b] dark:text-[#8e9bb0]">
                Bu koşumda FAILED veya BLOCKED olarak işaretlenmiş tüm senaryolar, loglar ve ekran görüntüleri
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              {defectCases.length} Hata Kaydı
            </span>
          </div>

          {defectCases.length === 0 ? (
            <div className="py-16 text-center rounded-[12px] bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] p-6 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Harika! Bu Koşumda Hata Bulunmuyor</h3>
              <p className="text-xs text-[#64748b] dark:text-[#8e9bb0]">
                Tüm senaryolar başarıyla geçti veya henüz hata kaydı girilmedi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 overflow-y-auto flex-1">
              {defectCases.map(({ testCase, result }) => {
                const screenList = parseScreenshots(result?.screenshotUrl || testCase.screenshotUrl);

                return (
                  <div
                    key={testCase.id}
                    className="p-4 rounded-[12px] bg-white dark:bg-[#1d232f] border border-rose-500/30 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748]">
                            {testCase.code}
                          </span>
                          {result?.status === 'FAILED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              FAILED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <Slash className="w-3 h-3" />
                              BLOCKED
                            </span>
                          )}
                        </div>

                        {result?.jiraBugKey && (
                          <a
                            href={result.jiraBugUrl || `https://company.atlassian.net/browse/${result.jiraBugKey}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 hover:underline"
                          >
                            <Bug className="w-3 h-3" />
                            <span>{result.jiraBugKey}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {testCase.title}
                      </h3>

                      {result?.errorMessage && (
                        <div className="p-3 rounded-[8px] bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 font-mono text-xs whitespace-pre-wrap">
                          <strong>Hata / Log Açıklaması:</strong>
                          <p className="mt-1">{result.errorMessage}</p>
                        </div>
                      )}

                      {/* Ekran Görüntüleri Galerisi */}
                      {screenList.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                            <ImageIcon className="w-3 h-3 text-indigo-400" />
                            <span>Ekran Görüntüleri ({screenList.length})</span>
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {screenList.map((imgUrl, imgIdx) => (
                              <img
                                key={imgIdx}
                                src={imgUrl}
                                alt={`Defect Screenshot ${imgIdx + 1}`}
                                onClick={() => setLightboxImage(imgUrl)}
                                className="h-20 w-28 object-cover rounded-[6px] border border-slate-600 cursor-pointer hover:opacity-90 transition-opacity bg-black/20"
                                title="Büyük boyutta incele"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#d0d8e4] dark:border-[#2e3748] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#64748b] dark:text-[#8e9bb0]">
                        Süre: <strong className="font-mono">{result?.executionMs || 0} ms</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenResultDrawer(testCase, result)}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-[#b83a4b] hover:underline"
                      >
                        <span>Hata Bulgusunu Düzenle</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. Tab Content: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-[14px] bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Info className="w-4 h-4 text-[#b83a4b]" />
                <span>Koşum Künyesi ve Bilgileri</span>
              </h3>

              <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-[#2e3748]/50 font-mono">
                <div className="pt-2 flex justify-between">
                  <span className="text-[#64748b] dark:text-[#8e9bb0]">Koşum ID:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{run.id}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#64748b] dark:text-[#8e9bb0]">Proje:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    [{project?.key}] {project?.name}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#64748b] dark:text-[#8e9bb0]">Test Planı:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {run.testPlan?.title || 'Bağımsız / Hızlı Koşum'}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#64748b] dark:text-[#8e9bb0]">Sürüm (Version):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{run.version}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#64748b] dark:text-[#8e9bb0]">Test Ortamı:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{run.environment}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#64748b] dark:text-[#8e9bb0]">Çalıştıran Tester:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {run.executedBy} ({run.testerEmail})
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-[14px] bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Kalite Metrikleri & Kapsam</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-xs font-semibold text-[#64748b] dark:text-[#8e9bb0]">Genel Başarı Oranı:</span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-3xl font-extrabold font-mono text-[#b83a4b]">%{stats.passRate}</span>
                    <span className="text-xs text-slate-500">
                      ({stats.passed} / {stats.total} senaryo geçti)
                    </span>
                  </div>
                </div>

                {run.testPlan?.scope && (
                  <div className="p-3 rounded-[8px] bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748]">
                    <strong className="text-slate-800 dark:text-slate-200">Test Planı Kapsamı:</strong>
                    <p className="mt-1 text-[#64748b] dark:text-[#8e9bb0] whitespace-pre-wrap">
                      {run.testPlan.scope}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. RESULT EXECUTION DRAWER WITH LIVE RUNNING STOPWATCH & FULL METADATA */}
      {activeResultModalCase && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[16px] w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            {/* Drawer Header with Live Stopwatch */}
            <div className="px-6 py-4 border-b border-[#d0d8e4] dark:border-[#2e3748] flex items-center justify-between bg-slate-50/80 dark:bg-[#141821]/80 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-[#b83a4b]/15 text-[#b83a4b] flex items-center justify-center border border-[#b83a4b]/30">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                      {activeResultModalCase.testCase.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-md">
                      {activeResultModalCase.testCase.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#64748b] dark:text-[#8e9bb0] mt-0.5">
                    Detaylı test koşum kaydı, canlı süre sayacı ve etiket bilgileri
                  </p>
                </div>
              </div>

              {/* Live Stopwatch Widget */}
              <div className="flex items-center space-x-2 bg-white dark:bg-[#141821] px-3.5 py-1.5 rounded-[10px] border border-[#d0d8e4] dark:border-[#2e3748] shadow-xs">
                <Timer className={`w-4 h-4 ${isTimerRunning ? 'text-[#b83a4b] animate-spin' : 'text-slate-400'}`} />
                <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-slate-100 min-w-[65px]">
                  {formatDuration(drawerExecutionMs)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-1 rounded-[6px] text-xs font-bold ${
                    isTimerRunning
                      ? 'bg-amber-500/20 text-amber-600 hover:bg-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30'
                  }`}
                  title={isTimerRunning ? 'Sayacı Duraklat' : 'Sayacı Başlat'}
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setDrawerExecutionMs(0);
                  }}
                  className="p-1 rounded-[6px] text-slate-400 hover:text-slate-600"
                  title="Sayacı Sıfırla"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setActiveResultModalCase(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* Status Selector Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Test Koşum Sonucu *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerStatus('PASSED');
                      setIsTimerRunning(false);
                    }}
                    className={`py-2.5 px-3 rounded-[10px] font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      drawerStatus === 'PASSED'
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-sm'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PASSED</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDrawerStatus('FAILED');
                      setIsTimerRunning(false);
                    }}
                    className={`py-2.5 px-3 rounded-[10px] font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      drawerStatus === 'FAILED'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 shadow-sm'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>FAILED</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDrawerStatus('BLOCKED');
                      setIsTimerRunning(false);
                    }}
                    className={`py-2.5 px-3 rounded-[10px] font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      drawerStatus === 'BLOCKED'
                        ? 'bg-amber-600 text-white ring-2 ring-amber-400 shadow-sm'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    <Slash className="w-4 h-4" />
                    <span>BLOCKED</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDrawerStatus('SKIPPED');
                      setIsTimerRunning(false);
                    }}
                    className={`py-2.5 px-3 rounded-[10px] font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      drawerStatus === 'SKIPPED'
                        ? 'bg-slate-600 text-white ring-2 ring-slate-400 shadow-sm'
                        : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30 hover:bg-slate-500/20'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    <span>SKIPPED</span>
                  </button>
                </div>
              </div>

              {/* 8 Execution Metadata Inputs (All Visual Card Badges) */}
              <div className="p-4 rounded-[12px] bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#b83a4b]" />
                  <span>Koşum Etiketleri & Cihaz / Kullanıcı Parametreleri</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* 1. 🌐 Ortam */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      🌐 Ortam
                    </label>
                    <select
                      value={drawerEnvironment}
                      onChange={(e) => setDrawerEnvironment(e.target.value)}
                      className="w-full bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="UAT">UAT</option>
                      <option value="TEST">TEST</option>
                      <option value="PROD">PROD</option>
                      <option value="STAGING">STAGING</option>
                      <option value="DEV">DEV</option>
                    </select>
                  </div>

                  {/* 2. 🍎 / 🤖 Platform */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      🍎 / 🤖 Platform
                    </label>
                    <select
                      value={drawerPlatform}
                      onChange={(e) => setDrawerPlatform(e.target.value)}
                      className="w-full bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="iOS">🍎 iOS</option>
                      <option value="Android">🤖 Android</option>
                      <option value="Web">🌐 Web</option>
                      <option value="API">⚡ API</option>
                    </select>
                  </div>

                  {/* 3. 📦 Uygulama Versiyonu */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      📦 Uygulama Versiyonu
                    </label>
                    <input
                      type="text"
                      value={drawerAppVersion}
                      onChange={(e) => setDrawerAppVersion(e.target.value)}
                      placeholder="v1.2.0 (106)"
                      className="w-full bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>

                  {/* 4. 📱 Cihaz Aliası */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      📱 Cihaz Aliası
                    </label>
                    <input
                      type="text"
                      value={drawerDevice}
                      onChange={(e) => setDrawerDevice(e.target.value)}
                      placeholder="iphone14 / iphone 15 / s24"
                      className="w-full bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>

                  {/* 5. 👤 USER Profili */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      👤 USER Profili
                    </label>
                    <input
                      type="text"
                      value={drawerUserProfile}
                      onChange={(e) => setDrawerUserProfile(e.target.value)}
                      placeholder="UMIT / ZEYNEP"
                      className="w-full bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs uppercase"
                    />
                  </div>

                  {/* 6. 👥 Müşteri Tipi */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      👥 Müşteri Tipi
                    </label>
                    <select
                      value={drawerCustomerType}
                      onChange={(e) => setDrawerCustomerType(e.target.value)}
                      className="w-full bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="BIREYSEL">👥 BIREYSEL</option>
                      <option value="KURUMSAL">👥 KURUMSAL</option>
                    </select>
                  </div>

                  {/* 7. ⚠️ Flaky Durumu */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      ⚠️ Flaky / Retry Durumu
                    </label>
                    <select
                      value={drawerFlakyStatus}
                      onChange={(e) => setDrawerFlakyStatus(e.target.value)}
                      className="w-full bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="NONE">Stabil (Retry Yok)</option>
                      <option value="+1 retry">+1 retry</option>
                      <option value="+2 retry">+2 retry</option>
                      <option value="FLAKY">FLAKY</option>
                    </select>
                  </div>

                  {/* 8. ⏱️ Koşum Süresi (Manuel Giriş/Sayaç) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      ⏱️ Süre (ms)
                    </label>
                    <input
                      type="number"
                      value={drawerExecutionMs}
                      onChange={(e) => setDrawerExecutionMs(parseInt(e.target.value, 10) || 0)}
                      placeholder="Örn: 48000"
                      className="w-full bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Test Steps Preview / Checklist */}
              {activeResultModalCase.testCase.steps && activeResultModalCase.testCase.steps.length > 0 && (
                <div className="space-y-2 p-3.5 rounded-[12px] bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-[#b83a4b]" />
                      <span>Test Adımları Kontrol Listesi</span>
                    </span>
                    <span className="text-[11px] text-[#64748b] dark:text-[#8e9bb0]">
                      {completedStepNumbers.size} / {activeResultModalCase.testCase.steps.length} adım doğrulandı
                    </span>
                  </div>

                  <div className="space-y-2 divide-y divide-slate-200 dark:divide-[#2e3748]/60">
                    {activeResultModalCase.testCase.steps.map((st, idx) => {
                      const stepNo = st.stepNumber || idx + 1;
                      const isStepDone = completedStepNumbers.has(stepNo);

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setCompletedStepNumbers((prev) => {
                              const next = new Set(prev);
                              if (next.has(stepNo)) next.delete(stepNo);
                              else next.add(stepNo);
                              return next;
                            });
                          }}
                          className="pt-2 flex items-start space-x-2.5 cursor-pointer group"
                        >
                          <div className="pt-0.5">
                            {isStepDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                            )}
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <p
                              className={`font-semibold ${
                                isStepDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <strong>Adım {stepNo}:</strong> {st.action}
                            </p>
                            <p className="text-[#64748b] dark:text-[#8e9bb0] font-mono text-[11px]">
                              <strong>Beklenen:</strong> {st.expectedResult}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Yorum / Not / Hata Bulgusu */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#b83a4b]" />
                    <span>
                      {drawerStatus === 'FAILED'
                        ? 'Hata Bulgusu & Log Detayı (FAILED)'
                        : 'Yorum / Not & Doğrulama Açıklaması'}
                    </span>
                  </label>
                  <span className="text-[10px] text-[#64748b] dark:text-[#8e9bb0]">
                    (Her durum için eklenebilir)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={drawerComment}
                  onChange={(e) => setDrawerComment(e.target.value)}
                  placeholder={
                    drawerStatus === 'FAILED'
                      ? 'Örn: USD Alış adımında bakiye yetersiz hatası yerine 500 alındı.'
                      : 'Örn: Test başarıyla tamamlandı. Döviz alış kuru UAT ortamında doğrulandı.'
                  }
                  className="w-full bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[10px] p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-[#64748b] dark:placeholder-[#8e9bb0] focus:outline-none focus:border-[#b83a4b] focus:ring-1 focus:ring-[#b83a4b]/30"
                />
              </div>

              {/* Jira Bug Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Bug className="w-3.5 h-3.5 text-rose-500" />
                  <span>Jira Bug Key (Opsiyonel)</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: MOB-542 veya QA-102"
                  value={drawerJiraBugKey}
                  onChange={(e) => setDrawerJiraBugKey(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Ekran Görüntüsü Yöneticisi */}
              <div className="space-y-2 p-3.5 rounded-[12px] bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ekran Görüntüleri & Kanıtlar ({drawerScreenshots.length})</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    (Ctrl+V ile panodan yapıştırabilir veya dosya seçebilirsiniz)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#b83a4b] cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Dosya Seç</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    placeholder="veya Görsel URL'si yapıştırın..."
                    value={drawerNewImageUrl}
                    onChange={(e) => setDrawerNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    className="flex-1 bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />

                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!drawerNewImageUrl.trim()}
                    className="px-3 py-1.5 bg-[#b83a4b] text-white font-bold rounded-[8px] text-xs hover:bg-[#c54859] disabled:opacity-40"
                  >
                    Ekle
                  </button>
                </div>

                {drawerScreenshots.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {drawerScreenshots.map((imgUrl, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="relative group rounded-[8px] overflow-hidden border border-slate-600 bg-black/20"
                      >
                        <img
                          src={imgUrl}
                          alt={`Screenshot ${imgIdx + 1}`}
                          className="h-20 w-28 object-cover cursor-pointer hover:opacity-90"
                          onClick={() => setLightboxImage(imgUrl)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveScreenshot(imgIdx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Görseli Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-[#d0d8e4] dark:border-[#2e3748] flex items-center justify-between bg-slate-50/80 dark:bg-[#141821]/80 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setActiveResultModalCase(null);
                }}
                className="px-4 py-2 rounded-[10px] text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-[#262e3d] hover:bg-slate-300 dark:hover:bg-[#2e3748] transition-colors"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleSaveDrawerResult}
                disabled={isSavingDrawer}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-[10px] text-xs font-bold text-white bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] shadow-md hover:shadow-[0_4px_12px_rgba(130,28,43,0.35)] transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingDrawer ? 'Kaydediliyor...' : 'Koşum Sonucunu ve Etiketleri Kaydet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Fullscreen Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Lightbox Screenshot"
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl border border-slate-700"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-[#b83a4b] text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format milliseconds duration
function formatDuration(totalMs: number): string {
  if (!totalMs || totalMs <= 0) return '0 sn';
  const totalSec = Math.floor(totalMs / 1000);
  if (totalSec < 60) return `${totalSec} sn`;
  const minutes = Math.floor(totalSec / 60);
  const remainingSec = totalSec % 60;
  return `${minutes} dk ${remainingSec} sn`;
}
