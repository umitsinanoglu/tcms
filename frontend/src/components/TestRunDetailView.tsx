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
  TestRunsService,
  ReportsService,
  DefectsService,
  CreateDefectDto,
  SuiteTreeNode,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { parseScreenshots } from './QuickRunModal';
import { LiveRunTerminalModal } from './LiveRunTerminalModal';
import { NewDefectModal } from './NewDefectModal';
import {
  Terminal,
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
  Activity,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Sparkles,
  Bug,
  Image as ImageIcon,
  Upload,
  MessageSquare,
  FileSpreadsheet,
  User,
  SlidersHorizontal,
  ClipboardList,
  CheckSquare,
  Square,
  Info,
  Smartphone,
  Globe,
  Tag,
  LayoutGrid,
  List,
  Timer,
  Ban,
  FastForward,
  Monitor,
  ChevronLeft,
  ChevronsRight,
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
  allCases = [],
  onBack,
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

  const [isLiveTerminalOpen, setIsLiveTerminalOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ResultStatus | 'PENDING'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [envFilter, setEnvFilter] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

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
  const [drawerEnvironment, setDrawerEnvironment] = useState<string>('PRODUCTION');
  const [drawerPlatform, setDrawerPlatform] = useState<string>('WEB');
  const [drawerAppVersion, setDrawerAppVersion] = useState<string>('v2.4.1');
  const [drawerDevice, setDrawerDevice] = useState<string>('Chrome 128 (Windows 11)');
  const [drawerUserProfile, setDrawerUserProfile] = useState<string>('ADMİN KULLANICI');
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

  // New Defect Modal State
  const [isNewDefectModalOpen, setIsNewDefectModalOpen] = useState<boolean>(false);
  const [defectModalInitialData, setDefectModalInitialData] = useState<Partial<CreateDefectDto> | null>(null);

  // Show toast notification helper
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open Create Defect with Pre-populated system info
  const handleOpenCreateDefect = (testCase: TestCase, result?: TestResult) => {
    if (!project?.id) return;

    const defaultSeverity =
      testCase.priority === 'BLOCKER'
        ? 'BLOCKER'
        : testCase.priority === 'CRITICAL'
        ? 'CRITICAL'
        : 'MAJOR';

    const defaultPlatform =
      result?.platform || (testCase.type === 'IOS' ? 'iOS' : testCase.type === 'ANDROID' ? 'Android' : 'WEB');

    const defaultEnv = result?.environment || run.environment || 'STAGING';
    const defaultVersion = result?.appVersion || run.version || 'v1.0.0';

    const errorDetails = result?.errorMessage
      ? `Hata Logu / Açıklama:\n${result.errorMessage}\n\nİlişkili Koşum: ${run.title} (${defaultVersion} / ${defaultEnv})`
      : `Test senaryosu (${testCase.code}) "${run.title}" koşumunda başarısız oldu.`;

    setDefectModalInitialData({
      projectId: project.id,
      title: `[Test Hatası] ${testCase.code} - ${testCase.title}`,
      description: errorDetails,
      severity: defaultSeverity as any,
      status: 'OPEN' as any,
      environment: defaultEnv,
      channel: defaultPlatform,
      testCaseId: testCase.id,
      testRunId: run.id,
      testResultId: result?.id,
      reportedBy:
        currentUser?.name || (typeof window !== 'undefined' ? localStorage.getItem('tcms_active_user_name') || '' : ''),
      jiraBugKey: result?.jiraBugKey || '',
      jiraBugUrl: result?.jiraBugUrl || '',
    });

    setIsNewDefectModalOpen(true);
  };

  // Submit Handler for Defect creation from Test Run
  const handleCreateDefectSubmit = async (data: CreateDefectDto) => {
    try {
      await DefectsService.create(data);
      showToast('Defect başarıyla oluşturuldu ve test senaryosuna bağlandı.', 'success');
      await reloadRun();
    } catch (err: any) {
      console.error('Failed to create defect:', err);
      showToast('Defect oluşturulurken hata oluştu: ' + (err?.response?.data?.message || err?.message || 'Hata'), 'error');
    }
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
        if (plat.toLowerCase() !== platformFilter.toLowerCase()) return false;
      }

      // Environment Filter
      if (envFilter !== 'ALL') {
        const env = result?.environment || run.environment || 'PRODUCTION';
        if (env.toLowerCase() !== envFilter.toLowerCase()) return false;
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

  // Paginated Cases
  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCases.slice(start, start + pageSize);
  }, [filteredCases, currentPage, pageSize]);

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

    // Populate Extended Metadata with smart defaults
    setDrawerEnvironment(currentResult?.environment || run.environment || 'PRODUCTION');
    setDrawerPlatform(
      currentResult?.platform || (testCase.type === 'IOS' ? 'iOS' : testCase.type === 'ANDROID' ? 'Android' : 'WEB')
    );
    setDrawerAppVersion(currentResult?.appVersion || run.version || 'v2.4.1');
    setDrawerDevice(
      currentResult?.device ||
        (testCase.type === 'IOS'
          ? 'Safari 17.5 (iOS 17.5)'
          : testCase.type === 'ANDROID'
          ? 'Chrome Mobile (Android 14)'
          : 'Chrome 128 (Windows 11)')
    );
    setDrawerUserProfile(
      currentResult?.userProfile || (currentUser?.name ? `${currentUser.name.toUpperCase()} KULLANICI` : 'ADMİN KULLANICI')
    );
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
      existingResult?.platform || (matchedCase?.type === 'IOS' ? 'iOS' : matchedCase?.type === 'ANDROID' ? 'Android' : 'WEB');
    const deviceVal =
      existingResult?.device ||
      (matchedCase?.type === 'IOS'
        ? 'Safari 17.5 (iOS 17.5)'
        : matchedCase?.type === 'ANDROID'
        ? 'Chrome Mobile (Android 14)'
        : 'Chrome 128 (Windows 11)');

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
      environment: existingResult?.environment || run.environment || 'PRODUCTION',
      platform: platformVal,
      appVersion: existingResult?.appVersion || run.version || 'v2.4.1',
      device: deviceVal,
      userProfile: existingResult?.userProfile || (currentUser?.name ? `${currentUser.name.toUpperCase()} KULLANICI` : 'ADMİN KULLANICI'),
      customerType: existingResult?.customerType || 'BIREYSEL',
      flakyStatus: existingResult?.flakyStatus,
      retries: existingResult?.retries || 0,
      executedBy: currentUser?.name || run.executedBy || 'Ümit Sinanoğlu (Admin)',
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
          environment: existing?.environment || run.environment || 'PRODUCTION',
          platform:
            existing?.platform || (matchedCase?.type === 'IOS' ? 'iOS' : matchedCase?.type === 'ANDROID' ? 'Android' : 'WEB'),
          appVersion: existing?.appVersion || run.version || 'v2.4.1',
          device: existing?.device || 'Chrome 128 (Windows 11)',
          userProfile: existing?.userProfile || 'ADMİN KULLANICI',
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
        environment: result?.environment || run.environment || 'PRODUCTION',
        platform: result?.platform || (testCase.type === 'IOS' ? 'iOS' : testCase.type === 'ANDROID' ? 'Android' : 'WEB'),
        appVersion: result?.appVersion || run.version || 'v2.4.1',
        device: result?.device || 'Chrome 128 (Windows 11)',
        userProfile: result?.userProfile || 'ADMİN KULLANICI',
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

  // Helper format date
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '27.08.2026 11:20';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '27.08.2026 11:20';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '27.08.2026 11:20';
    }
  };

  return (
    <div
      onPaste={handlePasteImage}
      className="flex-1 flex flex-col bg-[#f4f7fa] dark:bg-[#0f131a] text-slate-900 dark:text-slate-100 p-4 sm:p-6 space-y-4 overflow-y-auto min-h-0 transition-colors duration-200"
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
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

      {/* 1. Top Breadcrumb & Action Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1d232f] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#991b1b] dark:hover:text-rose-400 font-semibold transition-all cursor-pointer shadow-2xs"
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
                className="hover:text-[#991b1b] hover:underline truncate max-w-[200px]"
                title={`Test Planı: ${run.testPlan.title}`}
              >
                {run.testPlan.title}
              </button>
            </>
          )}

          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="font-bold text-[#991b1b] dark:text-rose-400 truncate max-w-[260px]">{run.title}</span>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
          {run.status === 'IN_PROGRESS' ? (
            <button
              type="button"
              onClick={() => handleUpdateRunStatus('COMPLETED')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Koşuyu Tamamla</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleUpdateRunStatus('IN_PROGRESS')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1d232f] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yeniden Başlat</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleMarkAllPassed}
            disabled={isSavingStatus || stats.total === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#991b1b] hover:bg-[#881337] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tümünü PASSED Yap</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLiveTerminalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-300 dark:border-purple-800 transition-all cursor-pointer shadow-2xs"
            title="TAC Canlı Terminalini Aç"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Canlı Terminal</span>
          </button>

          <button
            type="button"
            onClick={reloadRun}
            className="p-1.5 rounded-lg bg-white dark:bg-[#1d232f] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => ReportsService.downloadRunReport(run.id, 'csv', run.title)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-[#1d232f] hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs font-semibold transition-all shadow-2xs"
            title="CSV Raporu İndir"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">CSV</span>
          </button>

          <button
            type="button"
            onClick={() => ReportsService.downloadRunReport(run.id, 'html', run.title)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-[#1d232f] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs font-semibold transition-all shadow-2xs"
            title="HTML Raporu Aç"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">HTML</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteRun}
            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer"
            title="Koşumu Sil"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Run Header Card (Modernized to exactly match screenshot) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Side: Play Icon + Title & Badges + Subtitle */}
          <div className="flex items-start sm:items-center space-x-4 min-w-0 flex-1">
            {/* Circular Crimson Play Button */}
            <div className="w-14 h-14 rounded-full bg-[#991b1b] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#991b1b]/25">
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              {/* Title & Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {run.title}
                </h1>

                {/* Sürüm Rozeti (Pill) */}
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
                  {run.version || 'v2.4.1'}
                </span>

                {/* Ortam Rozeti (Pill) */}
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {run.environment || 'PRODUCTION'}
                </span>

                {/* Durum Rozeti (Pill) */}
                {run.status === 'COMPLETED' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    TAMAMLANDI
                  </span>
                ) : run.status === 'IN_PROGRESS' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                    ÇALIŞIYOR
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    <XCircle className="w-3.5 h-3.5" />
                    İPTAL EDİLDİ
                  </span>
                )}
              </div>

              {/* Subtitle / Metadata Row */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Tester: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{run.executedBy || 'Ümit Sinanoğlu (Admin)'}</strong>
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDateTime(run.createdAt)}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Toplam Süre: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{stats.durationFormatted}</strong>
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Segmented Progress Bar & Success Rate */}
          <div className="flex items-center space-x-6 shrink-0 self-end lg:self-center">
            {/* Progress Section */}
            <div className="space-y-1.5 min-w-[200px] sm:min-w-[240px]">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                İlerleme: <strong className="text-slate-800 dark:text-slate-100 font-bold">{stats.executed} / {stats.total} Tamamlandı</strong>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                {stats.total > 0 && stats.passed > 0 && (
                  <div
                    style={{ width: `${(stats.passed / stats.total) * 100}%` }}
                    className="bg-emerald-500 h-full transition-all duration-300"
                    title={`Passed: ${stats.passed}`}
                  />
                )}
                {stats.total > 0 && stats.failed > 0 && (
                  <div
                    style={{ width: `${(stats.failed / stats.total) * 100}%` }}
                    className="bg-rose-500 h-full transition-all duration-300"
                    title={`Failed: ${stats.failed}`}
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

            {/* Success Rate */}
            <div className="text-right pl-5 border-l border-slate-100 dark:border-slate-800 min-w-[85px]">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Başarı Oranı
              </span>
              <span className="text-3xl font-extrabold text-[#991b1b] dark:text-rose-500 font-mono leading-none mt-1 block">
                %{stats.passRate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 6 KPI Metric Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. TOPLAM TEST */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-xl bg-white dark:bg-[#1d232f] border transition-all shadow-xs cursor-pointer flex items-center space-x-3.5 ${
            statusFilter === 'ALL'
              ? 'border-blue-500/50 ring-2 ring-blue-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              TOPLAM TEST
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {stats.total}
              </span>
              <span className="text-xs text-slate-400 font-normal">senaryo</span>
            </div>
          </div>
        </div>

        {/* 2. PASSED */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'PASSED' ? 'ALL' : 'PASSED')}
          className={`p-4 rounded-xl bg-white dark:bg-[#1d232f] border transition-all shadow-xs cursor-pointer flex items-center space-x-3.5 ${
            statusFilter === 'PASSED'
              ? 'border-emerald-500/50 ring-2 ring-emerald-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              PASSED
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {stats.passed}
              </span>
              <span className="text-xs text-slate-400 font-normal">başarılı</span>
            </div>
          </div>
        </div>

        {/* 3. FAILED */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'FAILED' ? 'ALL' : 'FAILED')}
          className={`p-4 rounded-xl bg-white dark:bg-[#1d232f] border transition-all shadow-xs cursor-pointer flex items-center space-x-3.5 ${
            statusFilter === 'FAILED'
              ? 'border-rose-500/50 ring-2 ring-rose-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              FAILED
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {stats.failed}
              </span>
              <span className="text-xs text-slate-400 font-normal">başarısız</span>
            </div>
          </div>
        </div>

        {/* 4. BLOCKED */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'BLOCKED' ? 'ALL' : 'BLOCKED')}
          className={`p-4 rounded-xl bg-white dark:bg-[#1d232f] border transition-all shadow-xs cursor-pointer flex items-center space-x-3.5 ${
            statusFilter === 'BLOCKED'
              ? 'border-amber-500/50 ring-2 ring-amber-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              BLOCKED
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {stats.blocked}
              </span>
              <span className="text-xs text-slate-400 font-normal">engelli</span>
            </div>
          </div>
        </div>

        {/* 5. SKIPPED */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'SKIPPED' ? 'ALL' : 'SKIPPED')}
          className={`p-4 rounded-xl bg-white dark:bg-[#1d232f] border transition-all shadow-xs cursor-pointer flex items-center space-x-3.5 ${
            statusFilter === 'SKIPPED'
              ? 'border-slate-500/50 ring-2 ring-slate-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
            <FastForward className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              SKIPPED
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {stats.skipped}
              </span>
              <span className="text-xs text-slate-400 font-normal">atlandı</span>
            </div>
          </div>
        </div>

        {/* 6. BEKLİYOR */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`p-4 rounded-xl bg-white dark:bg-[#1d232f] border transition-all shadow-xs cursor-pointer flex items-center space-x-3.5 ${
            statusFilter === 'PENDING'
              ? 'border-sky-500/50 ring-2 ring-sky-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              BEKLİYOR
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {stats.pending}
              </span>
              <span className="text-xs text-slate-400 font-normal">koşulmamış</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pt-2">
        <div className="flex items-center space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('SCENARIOS')}
            className={`pb-3 text-sm font-bold transition-all cursor-pointer relative ${
              activeTab === 'SCENARIOS'
                ? 'text-[#991b1b] dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Test Senaryoları & Sonuçları ({runTestCases.length})</span>
            {activeTab === 'SCENARIOS' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#991b1b] dark:bg-rose-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DEFECTS')}
            className={`pb-3 text-sm font-bold transition-all cursor-pointer relative ${
              activeTab === 'DEFECTS'
                ? 'text-[#991b1b] dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Hata Bulguları & Kusurlar ({defectCases.length})</span>
            {activeTab === 'DEFECTS' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#991b1b] dark:bg-rose-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`pb-3 text-sm font-bold transition-all cursor-pointer relative ${
              activeTab === 'OVERVIEW'
                ? 'text-[#991b1b] dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Koşum Özeti & İstatistikler</span>
            {activeTab === 'OVERVIEW' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#991b1b] dark:bg-rose-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* 5. Tab Content: SCENARIOS */}
      {activeTab === 'SCENARIOS' && (
        <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
          {/* Filtering Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-1 items-center flex-wrap gap-2.5">
              {/* Search Box with rounded-xl */}
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Senaryo ara (kod, başlık, cihaz...)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white dark:bg-[#1d232f] border border-slate-200/90 dark:border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#991b1b] focus:ring-1 focus:ring-[#991b1b]/30 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white dark:bg-[#1d232f] border border-slate-200/90 dark:border-slate-800 rounded-xl pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#991b1b] cursor-pointer shadow-2xs"
                >
                  <option value="ALL">Durum: Tümü</option>
                  <option value="PASSED">Durum: PASSED</option>
                  <option value="FAILED">Durum: FAILED</option>
                  <option value="BLOCKED">Durum: BLOCKED</option>
                  <option value="SKIPPED">Durum: SKIPPED</option>
                  <option value="PENDING">Durum: BEKLİYOR</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Platform Filter */}
              <div className="relative">
                <select
                  value={platformFilter}
                  onChange={(e) => {
                    setPlatformFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white dark:bg-[#1d232f] border border-slate-200/90 dark:border-slate-800 rounded-xl pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#991b1b] cursor-pointer shadow-2xs"
                >
                  <option value="ALL">Platform: Tümü</option>
                  <option value="WEB">Platform: WEB</option>
                  <option value="iOS">Platform: iOS</option>
                  <option value="Android">Platform: Android</option>
                  <option value="API">Platform: API</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Ortam Filter */}
              <div className="relative">
                <select
                  value={envFilter}
                  onChange={(e) => {
                    setEnvFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white dark:bg-[#1d232f] border border-slate-200/90 dark:border-slate-800 rounded-xl pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#991b1b] cursor-pointer shadow-2xs"
                >
                  <option value="ALL">Ortam: Tümü</option>
                  <option value="PRODUCTION">Ortam: PRODUCTION</option>
                  <option value="UAT">Ortam: UAT</option>
                  <option value="STAGING">Ortam: STAGING</option>
                  <option value="TEST">Ortam: TEST</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || platformFilter !== 'ALL' || envFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setPriorityFilter('ALL');
                    setPlatformFilter('ALL');
                    setEnvFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Sıfırla</span>
                </button>
              )}
            </div>

            {/* Right: Gösterilen Count & View Switcher */}
            <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
              <div className="text-xs text-slate-500 font-medium">
                Gösterilen: <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredCases.length}</strong> / {runTestCases.length}
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-[#1d232f] border border-slate-200/90 dark:border-slate-800 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('CARDS')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'CARDS'
                      ? 'border border-[#991b1b]/30 bg-rose-50/50 dark:bg-rose-950/30 text-[#991b1b] dark:text-rose-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Geniş Kart Görünümü"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('TABLE')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'TABLE'
                      ? 'border border-[#991b1b]/30 bg-rose-50/50 dark:bg-rose-950/30 text-[#991b1b] dark:text-rose-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Kompakt Tablo Görünümü"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Action Ribbon if selected */}
          {selectedCaseIds.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white shadow-lg animate-in fade-in duration-150">
              <span className="text-xs font-semibold">
                {selectedCaseIds.length} test senaryosu seçildi
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('PASSED')}
                  disabled={isSavingStatus}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500"
                >
                  PASSED Yap
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('FAILED')}
                  disabled={isSavingStatus}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500"
                >
                  FAILED Yap
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('BLOCKED')}
                  disabled={isSavingStatus}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500"
                >
                  BLOCKED Yap
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCaseIds([])}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: VISUAL CARDS (Matching Screenshot Exactly) */}
          {viewMode === 'CARDS' && (
            <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
              {paginatedCases.length === 0 ? (
                <div className="py-16 text-center rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200/80 dark:border-slate-800 p-6 text-slate-400">
                  <Filter className="w-8 h-8 mx-auto opacity-30 mb-2" />
                  <p className="font-semibold text-sm">Kriterlere uygun test senaryosu bulunamadı.</p>
                </div>
              ) : (
                paginatedCases.map(({ testCase, result }) => {
                  const currentStatus = result?.status;
                  const isPassed = currentStatus === 'PASSED';
                  const isFailed = currentStatus === 'FAILED';
                  const isBlocked = currentStatus === 'BLOCKED';
                  const isSkipped = currentStatus === 'SKIPPED';
                  const isPending = !result;
                  const isExpanded = expandedCaseIds.has(testCase.id);

                  const envTag = result?.environment || run.environment || 'PRODUCTION';
                  const platformTag =
                    result?.platform || (testCase.type === 'IOS' ? 'iOS' : testCase.type === 'ANDROID' ? 'Android' : 'WEB');
                  const isIos = platformTag.toLowerCase().includes('ios');
                  const isAndroid = platformTag.toLowerCase().includes('android');
                  const appVersionTag = result?.appVersion || run.version || 'v2.4.1';
                  const deviceTag =
                    result?.device ||
                    (testCase.type === 'IOS'
                      ? 'Safari 17.5 (iOS 17.5)'
                      : testCase.type === 'ANDROID'
                      ? 'Chrome Mobile (Android 14)'
                      : 'Chrome 128 (Windows 11)');

                  const rawUser = result?.userProfile || 'ADMİN KULLANICI';
                  const userProfileTag = rawUser.toUpperCase().includes('KULLANICI')
                    ? rawUser.toUpperCase()
                    : `${rawUser.toUpperCase()} KULLANICISI`;

                  const durationTag = result?.executionMs
                    ? formatDuration(result.executionMs)
                    : isPending
                    ? '0 sn'
                    : '7 sn';

                  const executedDateTag = formatDateTime(result?.executedAt || run.createdAt);

                  return (
                    <div
                      key={testCase.id}
                      className={`rounded-xl bg-white dark:bg-[#1d232f] border transition-all duration-200 shadow-2xs hover:shadow-sm overflow-hidden ${
                        isFailed
                          ? 'border-slate-200/80 dark:border-slate-800 border-l-4 border-l-rose-500'
                          : isPassed
                          ? 'border-slate-200/80 dark:border-slate-800 border-l-4 border-l-emerald-500'
                          : isBlocked
                          ? 'border-slate-200/80 dark:border-slate-800 border-l-4 border-l-amber-500'
                          : isSkipped
                          ? 'border-slate-200/80 dark:border-slate-800 border-l-4 border-l-slate-400'
                          : 'border-slate-200/80 dark:border-slate-800 border-l-4 border-l-slate-300'
                      }`}
                    >
                      {/* Main Scenario Header Row */}
                      <div className="p-4 sm:px-5 sm:py-3.5 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Left: Code & Title */}
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700 shrink-0">
                              {testCase.code}
                            </span>
                            <h3
                              onClick={() => handleOpenResultDrawer(testCase, result)}
                              className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-[#991b1b] dark:hover:text-rose-400 cursor-pointer transition-colors truncate"
                              title={testCase.title}
                            >
                              {testCase.title}
                            </h3>
                          </div>

                          {/* Right: Status Pill & Action Buttons */}
                          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                            {/* Status Pill Badge / Button */}
                            {isPassed ? (
                              <button
                                type="button"
                                onClick={() => handleOpenResultDrawer(testCase, result)}
                                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold text-xs shadow-2xs hover:bg-emerald-100 transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>PASSED</span>
                              </button>
                            ) : isFailed ? (
                              <button
                                type="button"
                                onClick={() => handleOpenResultDrawer(testCase, result)}
                                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold text-xs shadow-2xs hover:bg-rose-100 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>FAILED</span>
                              </button>
                            ) : isBlocked ? (
                              <button
                                type="button"
                                onClick={() => handleOpenResultDrawer(testCase, result)}
                                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-bold text-xs shadow-2xs hover:bg-amber-100 transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                                <span>BLOCKED</span>
                              </button>
                            ) : isSkipped ? (
                              <button
                                type="button"
                                onClick={() => handleOpenResultDrawer(testCase, result)}
                                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-2xs hover:bg-slate-100 transition-colors"
                              >
                                <FastForward className="w-4 h-4" />
                                <span>SKIPPED</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenResultDrawer(testCase, result)}
                                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 font-bold text-xs shadow-2xs hover:bg-sky-100 transition-colors"
                              >
                                <Clock className="w-4 h-4" />
                                <span>BEKLİYOR</span>
                              </button>
                            )}

                            {/* Defect Badge or Button for FAILED tests */}
                            {isFailed && (
                              result?.defects && result.defects.length > 0 ? (
                                <span
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-mono font-bold"
                                  title={`Bağlı Defect: ${result.defects[0].title}`}
                                >
                                  <Bug className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                  <span>{result.defects[0].key}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCreateDefect(testCase, result)}
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                                  title="Bu FAILED sonuç için Defect oluştur"
                                >
                                  <Bug className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                  <span className="hidden sm:inline">Defect Oluştur</span>
                                </button>
                              )
                            )}

                            {/* Eye Action Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenResultDrawer(testCase, result)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Sonuç Detaylarını Düzenle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Chevron Toggle Button */}
                            <button
                              type="button"
                              onClick={() => toggleRowExpansion(testCase.id)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              title={isExpanded ? 'Detayları Gizle' : 'Detayları Genişlet'}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Bottom Metadata Ribbon (Matching Screenshot) */}
                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {/* 1. 🌐 Ortam */}
                          <span className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-mono font-semibold text-[11px]">
                            <Globe className="w-3.5 h-3.5" />
                            <span>{envTag}</span>
                          </span>

                          {/* 2. Platform */}
                          <span className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-mono font-semibold text-[11px]">
                            {isIos || isAndroid ? <Smartphone className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                            <span>{platformTag}</span>
                          </span>

                          {/* 3. Sürüm */}
                          <span className="inline-flex items-center space-x-1 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            <span>{appVersionTag}</span>
                          </span>

                          {/* 4. Tarayıcı / Cihaz */}
                          <span className="inline-flex items-center space-x-1 text-slate-600 dark:text-slate-300 text-[11px]">
                            <Monitor className="w-3.5 h-3.5 text-slate-400" />
                            <span>{deviceTag}</span>
                          </span>

                          {/* 5. Kullanıcı Profili */}
                          <span className="inline-flex items-center space-x-1 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{userProfileTag}</span>
                          </span>

                          {/* 6. Koşum Zamanı */}
                          <span className="inline-flex items-center space-x-1 text-slate-500 font-mono text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{executedDateTag}</span>
                          </span>

                          {/* 7. Süre */}
                          <span className="inline-flex items-center space-x-1 text-slate-600 dark:text-slate-300 font-mono font-semibold text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{durationTag}</span>
                          </span>
                        </div>
                      </div>

                      {/* Expandable Details (Steps + Bug + Screenshots) */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 sm:p-5 space-y-4">
                          {/* Test Steps */}
                          {testCase.steps && testCase.steps.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Test Adımları ({testCase.steps.length})
                              </h4>
                              <div className="space-y-1.5">
                                {testCase.steps.map((step, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-2.5 rounded-lg bg-white dark:bg-[#1d232f] border border-slate-200/80 dark:border-slate-800 text-xs flex items-start space-x-2"
                                  >
                                    <span className="font-mono font-bold text-slate-400">{step.stepNumber || sIdx + 1}.</span>
                                    <div className="flex-1 space-y-0.5">
                                      <p className="font-medium text-slate-800 dark:text-slate-200">{step.action}</p>
                                      <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                        Beklenen: {step.expectedResult}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Error / Notes */}
                          {result?.errorMessage && (
                            <div
                              className={`p-3 rounded-lg text-xs font-mono whitespace-pre-wrap ${
                                isFailed
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              }`}
                            >
                              <strong>{isFailed ? 'Hata Bulgusu & Log:' : 'Not / Açıklama:'}</strong>
                              <p className="mt-1">{result.errorMessage}</p>
                            </div>
                          )}

                          {/* Jira Bug */}
                          {result?.jiraBugKey && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">İlişkili Kusur:</span>
                              <a
                                href={result.jiraBugUrl || `https://company.atlassian.net/browse/${result.jiraBugKey}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900 hover:underline"
                              >
                                <Bug className="w-3.5 h-3.5" />
                                <span>{result.jiraBugKey}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW MODE 2: TABLE VIEW */}
          {viewMode === 'TABLE' && (
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#1d232f] shadow-xs flex-1 flex flex-col min-h-0">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCaseIds.length > 0 && selectedCaseIds.length === paginatedCases.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCaseIds(paginatedCases.map((item) => item.testCase.id));
                            } else {
                              setSelectedCaseIds([]);
                            }
                          }}
                          className="rounded border-slate-300 text-[#991b1b] focus:ring-[#991b1b]"
                        />
                      </th>
                      <th className="py-3 px-3 w-28">Kod</th>
                      <th className="py-3 px-4 min-w-[240px]">Test Senaryosu</th>
                      <th className="py-3 px-3 w-32">Ortam & Cihaz</th>
                      <th className="py-3 px-3 w-36">Kullanıcı</th>
                      <th className="py-3 px-4 min-w-[140px]">Sonuç</th>
                      <th className="py-3 px-3 w-24">Süre</th>
                      <th className="py-3 px-3 w-20 text-right">Detay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedCases.map(({ testCase, result }) => {
                      const isSelected = selectedCaseIds.includes(testCase.id);
                      const currentStatus = result?.status;

                      return (
                        <tr
                          key={testCase.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
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
                              className="rounded border-slate-300 text-[#991b1b] focus:ring-[#991b1b]"
                            />
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {testCase.code}
                          </td>
                          <td className="py-3 px-4">
                            <div
                              onClick={() => handleOpenResultDrawer(testCase, result)}
                              className="font-semibold text-slate-800 dark:text-slate-200 hover:text-[#991b1b] cursor-pointer"
                            >
                              {testCase.title}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-0.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                              <div>{result?.environment || run.environment || 'PRODUCTION'}</div>
                              <div>{result?.device || 'Chrome 128 (Windows 11)'}</div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[11px]">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {result?.userProfile || 'ADMİN KULLANICI'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleInstantStatusChange(testCase.id, 'PASSED')}
                                className={`px-2 py-1 rounded text-[11px] font-mono font-bold ${
                                  currentStatus === 'PASSED'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                                }`}
                              >
                                PASS
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInstantStatusChange(testCase.id, 'FAILED')}
                                className={`px-2 py-1 rounded text-[11px] font-mono font-bold ${
                                  currentStatus === 'FAILED'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                                }`}
                              >
                                FAIL
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInstantStatusChange(testCase.id, 'BLOCKED')}
                                className={`px-2 py-1 rounded text-[11px] font-mono font-bold ${
                                  currentStatus === 'BLOCKED'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                                }`}
                              >
                                BLOCK
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {result?.executionMs ? formatDuration(result.executionMs) : '0 sn'}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              {currentStatus === 'FAILED' && (
                                result?.defects && result.defects.length > 0 ? (
                                  <span
                                    className="font-mono font-bold text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-1 rounded-md"
                                    title={`Bağlı Defect: ${result.defects[0].title}`}
                                  >
                                    {result.defects[0].key}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCreateDefect(testCase, result)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                                    title="Bu FAILED sonuç için Defect oluştur"
                                  >
                                    <Bug className="w-3.5 h-3.5" />
                                  </button>
                                )
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenResultDrawer(testCase, result)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#991b1b] transition-colors cursor-pointer"
                                title="Sonuç Detaylarını Düzenle"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Pagination / Footer Controls (Matching Screenshot Exactly) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
            {/* Left: Total Count */}
            <div>
              Toplam <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredCases.length}</strong> kayıt
            </div>

            {/* Right: Satır Sayısı & Pagination Buttons */}
            <div className="flex items-center space-x-4 shrink-0 self-end sm:self-center">
              <div className="flex items-center space-x-2">
                <span>Satır sayısı:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-[#1d232f] border border-slate-200/90 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1d232f] text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer shadow-2xs hover:bg-slate-50"
                  title="Önceki Sayfa"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#991b1b] text-white shadow-sm'
                        : 'bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1d232f] text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer shadow-2xs hover:bg-slate-50"
                  title="Sonraki Sayfa"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1d232f] text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer shadow-2xs hover:bg-slate-50"
                  title="Son Sayfa"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bu koşumda FAILED veya BLOCKED olarak işaretlenmiş tüm senaryolar, loglar ve ekran görüntüleri
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              {defectCases.length} Hata Kaydı
            </span>
          </div>

          {defectCases.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200/80 dark:border-slate-800 p-6 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Harika! Bu Koşumda Hata Bulunmuyor</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tüm senaryolar başarıyla geçti veya henüz hata kaydı girilmedi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1">
              {defectCases.map(({ testCase, result }) => {
                const screenList = parseScreenshots(result?.screenshotUrl || testCase.screenshotUrl);

                return (
                  <div
                    key={testCase.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {testCase.code}
                          </span>
                          {result?.status === 'FAILED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                              <XCircle className="w-3 h-3" />
                              FAILED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <Ban className="w-3 h-3" />
                              BLOCKED
                            </span>
                          )}
                        </div>

                        {result?.jiraBugKey && (
                          <a
                            href={result.jiraBugUrl || `https://company.atlassian.net/browse/${result.jiraBugKey}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 hover:underline"
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
                        <div className="p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 font-mono text-xs whitespace-pre-wrap">
                          <strong>Hata / Log Açıklaması:</strong>
                          <p className="mt-1">{result.errorMessage}</p>
                        </div>
                      )}

                      {/* Ekran Görüntüleri Galerisi */}
                      {screenList.length > 0 && (
                        <div className="space-y-1.5 pt-1">
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
                                className="h-20 w-28 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity bg-black/20"
                                title="Büyük boyutta incele"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-500">
                        Süre: <strong className="font-mono">{result?.executionMs || 0} ms</strong>
                      </span>

                      <div className="flex items-center space-x-2">
                        {result?.defects && result.defects.length > 0 ? (
                          <span
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-mono font-bold"
                            title={`Bağlı Defect: ${result.defects[0].title}`}
                          >
                            <Bug className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>{result.defects[0].key}</span>
                          </span>
                        ) : result?.status === 'FAILED' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenCreateDefect(testCase, result)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                            title="Bu FAILED sonuç için Defect oluştur"
                          >
                            <Bug className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>Defect Oluştur</span>
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleOpenResultDrawer(testCase, result)}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-[#991b1b] dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          <span>Hata Bulgusunu Düzenle</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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

      {/* 7. Tab Content: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Info className="w-4 h-4 text-[#991b1b]" />
                <span>Koşum Künyesi ve Bilgileri</span>
              </h3>

              <div className="space-y-2.5 text-xs divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Koşum ID:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{run.id}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Proje:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    [{project?.key}] {project?.name}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Test Planı:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {run.testPlan?.title || 'Bağımsız / Hızlı Koşum'}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Sürüm (Version):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{run.version}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Test Ortamı:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{run.environment}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Çalıştıran Tester:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {run.executedBy} ({run.testerEmail})
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Kalite Metrikleri & Kapsam</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Genel Başarı Oranı:</span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-3xl font-extrabold font-mono text-[#991b1b] dark:text-rose-500">%{stats.passRate}</span>
                    <span className="text-xs text-slate-500">
                      ({stats.passed} / {stats.total} senaryo geçti)
                    </span>
                  </div>
                </div>

                {run.testPlan?.scope && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141821] border border-slate-200/80 dark:border-slate-800">
                    <strong className="text-slate-800 dark:text-slate-200">Test Planı Kapsamı:</strong>
                    <p className="mt-1 text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
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
          <div className="bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            {/* Drawer Header with Live Stopwatch */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#141821]/80 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#991b1b]/10 text-[#991b1b] dark:text-rose-400 flex items-center justify-center border border-[#991b1b]/20">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {activeResultModalCase.testCase.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-md">
                      {activeResultModalCase.testCase.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Detaylı test koşum kaydı, canlı süre sayacı ve etiket bilgileri
                  </p>
                </div>
              </div>

              {/* Live Stopwatch Widget */}
              <div className="flex items-center space-x-2 bg-white dark:bg-[#141821] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <Timer className={`w-4 h-4 ${isTimerRunning ? 'text-[#991b1b] animate-spin' : 'text-slate-400'}`} />
                <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-slate-100 min-w-[65px]">
                  {formatDuration(drawerExecutionMs)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-1 rounded-md text-xs font-bold ${
                    isTimerRunning
                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
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
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
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
                    className={`py-2.5 px-3 rounded-xl font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      drawerStatus === 'PASSED'
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-sm'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
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
                    className={`py-2.5 px-3 rounded-xl font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      drawerStatus === 'FAILED'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 shadow-sm'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
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
                    className={`py-2.5 px-3 rounded-xl font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      drawerStatus === 'BLOCKED'
                        ? 'bg-amber-600 text-white ring-2 ring-amber-400 shadow-sm'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    <span>BLOCKED</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDrawerStatus('SKIPPED');
                      setIsTimerRunning(false);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      drawerStatus === 'SKIPPED'
                        ? 'bg-slate-600 text-white ring-2 ring-slate-400 shadow-sm'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <FastForward className="w-4 h-4" />
                    <span>SKIPPED</span>
                  </button>
                </div>
              </div>

              {/* Extended Metadata */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141821] border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#991b1b]" />
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
                      className="w-full bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="PRODUCTION">PRODUCTION</option>
                      <option value="UAT">UAT</option>
                      <option value="TEST">TEST</option>
                      <option value="STAGING">STAGING</option>
                    </select>
                  </div>

                  {/* 2. Platform */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Platform
                    </label>
                    <select
                      value={drawerPlatform}
                      onChange={(e) => setDrawerPlatform(e.target.value)}
                      className="w-full bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="WEB">🌐 WEB</option>
                      <option value="iOS">🍎 iOS</option>
                      <option value="Android">🤖 Android</option>
                      <option value="API">⚡ API</option>
                    </select>
                  </div>

                  {/* 3. Uygulama Versiyonu */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Sürüm
                    </label>
                    <input
                      type="text"
                      value={drawerAppVersion}
                      onChange={(e) => setDrawerAppVersion(e.target.value)}
                      placeholder="v2.4.1"
                      className="w-full bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>

                  {/* 4. Cihaz / Tarayıcı */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Tarayıcı & Cihaz
                    </label>
                    <input
                      type="text"
                      value={drawerDevice}
                      onChange={(e) => setDrawerDevice(e.target.value)}
                      placeholder="Chrome 128 (Windows 11)"
                      className="w-full bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  {/* 5. USER Profili */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Kullanıcı Profili
                    </label>
                    <input
                      type="text"
                      value={drawerUserProfile}
                      onChange={(e) => setDrawerUserProfile(e.target.value)}
                      placeholder="ADMİN KULLANICI / MOBİL WEB KULLANICISI"
                      className="w-full bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs uppercase"
                    />
                  </div>

                  {/* 6. Müşteri Tipi */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Müşteri Tipi
                    </label>
                    <select
                      value={drawerCustomerType}
                      onChange={(e) => setDrawerCustomerType(e.target.value)}
                      className="w-full bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="BIREYSEL">BIREYSEL</option>
                      <option value="KURUMSAL">KURUMSAL</option>
                    </select>
                  </div>

                  {/* 7. Flaky Durumu */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Flaky / Retry
                    </label>
                    <select
                      value={drawerFlakyStatus}
                      onChange={(e) => setDrawerFlakyStatus(e.target.value)}
                      className="w-full bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="NONE">Stabil (Retry Yok)</option>
                      <option value="+1 retry">+1 retry</option>
                      <option value="+2 retry">+2 retry</option>
                      <option value="FLAKY">FLAKY</option>
                    </select>
                  </div>

                  {/* 8. Süre (ms) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Süre (ms)
                    </label>
                    <input
                      type="number"
                      value={drawerExecutionMs}
                      onChange={(e) => setDrawerExecutionMs(parseInt(e.target.value, 10) || 0)}
                      placeholder="7000"
                      className="w-full bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Test Steps Checklist */}
              {activeResultModalCase.testCase.steps && activeResultModalCase.testCase.steps.length > 0 && (
                <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-[#141821] border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-[#991b1b]" />
                      <span>Test Adımları Kontrol Listesi</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {completedStepNumbers.size} / {activeResultModalCase.testCase.steps.length} adım doğrulandı
                    </span>
                  </div>

                  <div className="space-y-2 divide-y divide-slate-200 dark:divide-slate-800">
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
                            <p className="text-slate-500 font-mono text-[11px]">
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
                    <MessageSquare className="w-3.5 h-3.5 text-[#991b1b]" />
                    <span>
                      {drawerStatus === 'FAILED'
                        ? 'Hata Bulgusu & Log Detayı (FAILED)'
                        : 'Yorum / Not & Doğrulama Açıklaması'}
                    </span>
                  </label>
                </div>
                <textarea
                  rows={3}
                  value={drawerComment}
                  onChange={(e) => setDrawerComment(e.target.value)}
                  placeholder={
                    drawerStatus === 'FAILED'
                      ? 'Örn: 3D Secure onayında SMS kodu girildikten sonra timeout alındı.'
                      : 'Örn: Test başarıyla tamamlandı. Ödeme onaylandı.'
                  }
                  className="w-full bg-slate-50 dark:bg-[#141821] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#991b1b] focus:ring-1 focus:ring-[#991b1b]/30"
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
                  placeholder="Örn: ECOMM-124"
                  value={drawerJiraBugKey}
                  onChange={(e) => setDrawerJiraBugKey(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#141821] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Ekran Görüntüsü Yöneticisi */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-[#141821] border border-slate-200 dark:border-slate-800">
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
                  <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#991b1b] cursor-pointer shadow-2xs">
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
                    className="flex-1 bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />

                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!drawerNewImageUrl.trim()}
                    className="px-3 py-1.5 bg-[#991b1b] text-white font-bold rounded-lg text-xs hover:bg-[#881337] disabled:opacity-40"
                  >
                    Ekle
                  </button>
                </div>

                {drawerScreenshots.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {drawerScreenshots.map((imgUrl, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/20"
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
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#141821]/80 shrink-0 gap-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setActiveResultModalCase(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>

                {drawerStatus === 'FAILED' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenCreateDefect(activeResultModalCase.testCase, activeResultModalCase.currentResult);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer shadow-xs"
                    title="Bu başarısız sonuç için Defect formu aç"
                  >
                    <Bug className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Defect Oluştur</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveDrawerResult}
                disabled={isSavingDrawer}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#991b1b] hover:bg-[#881337] shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingDrawer ? 'Kaydediliyor...' : 'Koşum Sonucunu Kaydet'}</span>
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
              className="absolute -top-3 -right-3 p-2 bg-[#991b1b] text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAC Canlı Log Terminal Modalı */}
      <LiveRunTerminalModal
        isOpen={isLiveTerminalOpen}
        onClose={() => setIsLiveTerminalOpen(false)}
        runId={run.id}
        runTitle={run.title}
        platform={run.results?.[0]?.platform || 'iOS'}
        deviceAlias={run.results?.[0]?.device || 'iphone15'}
        onRunFinished={() => {
          reloadRun();
        }}
      />

      {/* Yeni Defect / Hata Oluşturma Modalı */}
      {project && (
        <NewDefectModal
          isOpen={isNewDefectModalOpen}
          onClose={() => {
            setIsNewDefectModalOpen(false);
            setDefectModalInitialData(null);
          }}
          projectId={project.id}
          projectName={project.name}
          projectKey={project.key}
          allCases={allCases}
          initialData={defectModalInitialData || undefined}
          onSubmit={handleCreateDefectSubmit}
        />
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
