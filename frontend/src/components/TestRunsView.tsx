'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  TestRun,
  TestRunsService,
  RunStatus,
  ResultStatus,
  TestCase,
  TestPlan,
  ReportsService,
  WebhooksService,
  TriggerTargetScope,
} from '@/services/api';
import { parseScreenshots } from './QuickRunModal';
import { exportTestRunsToExcel } from '@/utils/excelUtils';
import { AutomationTriggerModal } from './AutomationTriggerModal';
import { LiveRunTerminalModal } from './LiveRunTerminalModal';
import {
  Play,
  Send,
  Radio,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Slash,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
  Code,
  Terminal,
  ChevronRight,
  Eye,
  X,
  Bug,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  FileSpreadsheet,
  Printer,
  Download,
  Globe,
  Smartphone,
  Zap,
  Folder,
  ClipboardList,
  MoreVertical,
  Trash2,
  RotateCcw,
  Sparkles,
  Calendar,
  User,
  SlidersHorizontal,
  Layers,
  FileText,
} from 'lucide-react';

interface TestRunsViewProps {
  projectId: string;
  testPlans?: TestPlan[];
  allCases?: TestCase[];
  onOpenManualRun: (initialPlan?: TestPlan | null) => void;
  onOpenQuickRun?: (testCase?: TestCase | null) => void;
  onSelectCase?: (testCase: TestCase) => void;
  onSelectPlan?: (testPlan: TestPlan) => void;
  onSelectRun?: (run: TestRun) => void;
}

export const TestRunsView: React.FC<TestRunsViewProps> = ({
  projectId,
  testPlans = [],
  allCases = [],
  onOpenManualRun,
  onOpenQuickRun,
  onSelectCase,
  onSelectPlan,
  onSelectRun,
}) => {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | RunStatus | 'FAILED' | 'PENDING'>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [testerFilter, setTesterFilter] = useState<string>('ALL');

  // Detail Modal & Automation Modal State
  const [selectedRunDetails, setSelectedRunDetails] = useState<TestRun | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailFilterStatus, setDetailFilterStatus] = useState<'ALL' | ResultStatus>('ALL');
  const [detailSearch, setDetailSearch] = useState('');
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Webhook Trigger Modal State
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isTACModalOpen, setIsTACModalOpen] = useState(false);
  const [isLiveTerminalOpen, setIsLiveTerminalOpen] = useState(false);
  const [activeTerminalRunId, setActiveTerminalRunId] = useState<string | undefined>();
  const [activeTerminalRunTitle, setActiveTerminalRunTitle] = useState<string | undefined>();
  const [activeTerminalPlatform, setActiveTerminalPlatform] = useState<string>('iOS');
  const [activeTerminalDevice, setActiveTerminalDevice] = useState<string>('iphone15');
  const [webhookUrl, setWebhookUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tcms_automation_webhook_url') || 'http://localhost:8000/api/webhook/trigger';
    }
    return 'http://localhost:8000/api/webhook/trigger';
  });
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookTitle, setWebhookTitle] = useState('Otomasyon Regresyon Koşusu');
  const [webhookEnvironment, setWebhookEnvironment] = useState('STAGING');
  const [webhookScope, setWebhookScope] = useState<TriggerTargetScope>('ALL');
  const [webhookSuiteId, setWebhookSuiteId] = useState<string>('');
  const [webhookTriggerLoading, setWebhookTriggerLoading] = useState(false);
  const [webhookPingLoading, setWebhookPingLoading] = useState(false);
  const [webhookPingResult, setWebhookPingResult] = useState<{ success: boolean; message: string } | null>(null);
  const [webhookResponse, setWebhookResponse] = useState<any | null>(null);

  // Quick Run Case Picker Modal (for Secondary Action)
  const [isQuickPickerOpen, setIsQuickPickerOpen] = useState(false);
  const [quickPickerSearch, setQuickPickerSearch] = useState('');

  // Dropdown Menu State
  const [activeMenuRunId, setActiveMenuRunId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuRunId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch test runs list
  const loadRuns = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await TestRunsService.getRuns(projectId);
      setRuns(data || []);
    } catch (err) {
      console.error('Failed to load test runs:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Open detailed run view (navigate to dedicated view if available, or fallback to modal)
  const handleOpenDetail = async (runId: string) => {
    try {
      const details = await TestRunsService.getRunDetails(runId);
      if (onSelectRun && details) {
        onSelectRun(details);
      } else {
        setSelectedRunDetails(details);
        setDetailFilterStatus('ALL');
        setDetailSearch('');
        setIsDetailOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch run details:', err);
    }
  };

  // Complete / Abort run action
  const handleUpdateRunStatus = async (runId: string, status: RunStatus) => {
    try {
      await TestRunsService.completeRun(runId, status);
      await loadRuns();
      if (selectedRunDetails && selectedRunDetails.id === runId) {
        const updated = await TestRunsService.getRunDetails(runId);
        setSelectedRunDetails(updated);
      }
      setActiveMenuRunId(null);
    } catch (err) {
      console.error('Failed to update run status:', err);
    }
  };

  // Delete run action
  const handleDeleteRun = async (runId: string, runTitle: string) => {
    if (window.confirm(`"${runTitle}" test koşumunu ve tüm sonuçlarını silmek istediğinize emin misiniz?`)) {
      try {
        await TestRunsService.deleteRun(runId);
        await loadRuns();
        if (selectedRunDetails?.id === runId) {
          setIsDetailOpen(false);
          setSelectedRunDetails(null);
        }
        setActiveMenuRunId(null);
      } catch (err) {
        console.error('Failed to delete test run:', err);
      }
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setWebhookPingLoading(true);
    setWebhookPingResult(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tcms_automation_webhook_url', webhookUrl);
      }
      const res = await WebhooksService.testWebhook(projectId, webhookUrl, webhookSecret);
      if (res.success) {
        setWebhookPingResult({ success: true, message: `Bağlantı Başarılı! (HTTP ${res.status || 200})` });
      } else {
        setWebhookPingResult({ success: false, message: `Bağlantı Hatası: ${res.error || 'Cevap alınamadı'}` });
      }
    } catch (err: any) {
      setWebhookPingResult({ success: false, message: `Hata: ${err?.message || 'Uzak sunucuya ulaşılamadı'}` });
    } finally {
      setWebhookPingLoading(false);
    }
  };

  const handleTriggerWebhook = async () => {
    if (!webhookUrl) return;
    setWebhookTriggerLoading(true);
    setWebhookResponse(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tcms_automation_webhook_url', webhookUrl);
      }
      const res = await WebhooksService.triggerAutomation(projectId, {
        webhookUrl,
        secretToken: webhookSecret || undefined,
        title: webhookTitle || undefined,
        environment: webhookEnvironment,
        scope: webhookScope,
        suiteId: webhookScope === 'SUITE' ? webhookSuiteId : undefined,
      });

      setWebhookResponse(res);
      await loadRuns();
    } catch (err: any) {
      setWebhookResponse({
        success: false,
        message: err?.response?.data?.message || err?.message || 'Webhook tetiklenemedi',
      });
    } finally {
      setWebhookTriggerLoading(false);
    }
  };

  // Extract unique testers for filter
  const uniqueTesters = useMemo(() => {
    const set = new Set<string>();
    runs.forEach((r) => {
      if (r.executedBy) set.add(r.executedBy.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [runs]);

  // Helper to compute stats for a single run
  const getRunStats = (run: TestRun) => {
    const results = run.results || [];
    const total = run._count?.results ?? results.length;
    const passed = results.filter((r) => r.status === 'PASSED').length;
    const failed = results.filter((r) => r.status === 'FAILED').length;
    const blocked = results.filter((r) => r.status === 'BLOCKED').length;
    const skipped = results.filter((r) => r.status === 'SKIPPED').length;
    const executed = passed + failed + blocked + skipped;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const isFailed = failed > 0 || run.status === 'ABORTED';
    const isPending = run.status === 'IN_PROGRESS' && executed === 0;

    // Estimate duration
    const totalMs = results.reduce((acc, curr) => acc + (curr.executionMs || 0), 0);
    const durationFormatted = formatDuration(totalMs);

    return { total, passed, failed, blocked, skipped, executed, passRate, isFailed, isPending, durationFormatted };
  };

  // KPI Calculations across all runs
  const totalRuns = runs.length;
  const inProgressRuns = runs.filter((r) => r.status === 'IN_PROGRESS').length;
  const completedRuns = runs.filter((r) => r.status === 'COMPLETED').length;
  const failedRuns = runs.filter((r) => {
    const hasFailedResult = r.results?.some((res) => res.status === 'FAILED');
    return r.status === 'ABORTED' || hasFailedResult;
  }).length;
  const pendingRuns = runs.filter((r) => {
    const stats = getRunStats(r);
    return r.status === 'IN_PROGRESS' && stats.executed === 0;
  }).length;

  // Filter logic
  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const stats = getRunStats(run);

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'FAILED') {
          if (!stats.isFailed) return false;
        } else if (statusFilter === 'PENDING') {
          if (!stats.isPending && run.status !== 'IN_PROGRESS') return false;
        } else if (run.status !== statusFilter) {
          return false;
        }
      }

      // Test Plan filter
      if (planFilter !== 'ALL') {
        if (planFilter === '__NO_PLAN__') {
          if (run.testPlanId) return false;
        } else if (run.testPlanId !== planFilter) {
          return false;
        }
      }

      // Tester filter
      if (testerFilter !== 'ALL' && run.executedBy !== testerFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'ALL') {
        const runDate = new Date(run.createdAt);
        const now = new Date();
        if (dateFilter === 'TODAY') {
          const isToday = runDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (dateFilter === 'WEEK') {
          const diffDays = (now.getTime() - runDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (dateFilter === 'MONTH') {
          const diffDays = (now.getTime() - runDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = run.title?.toLowerCase().includes(q);
        const versionMatch = run.version?.toLowerCase().includes(q);
        const envMatch = run.environment?.toLowerCase().includes(q);
        const testerMatch = run.executedBy?.toLowerCase().includes(q);
        const planMatch = run.testPlan?.title?.toLowerCase().includes(q);
        if (!titleMatch && !versionMatch && !envMatch && !testerMatch && !planMatch) {
          return false;
        }
      }

      return true;
    });
  }, [runs, statusFilter, planFilter, testerFilter, dateFilter, searchQuery]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL' || planFilter !== 'ALL' || dateFilter !== 'ALL' || testerFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPlanFilter('ALL');
    setDateFilter('ALL');
    setTesterFilter('ALL');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const automationCurlExample = `curl -X POST "http://localhost:3001/api/v1/projects/${projectId}/runs/automation" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Mobile Appium Automation Suite",
    "version": "v2.5.0-ci",
    "environment": "STAGING",
    "executedBy": "Jenkins CI Bot",
    "testerEmail": "qa-automation@company.com",
    "results": [
      {
        "caseCode": "TC-101",
        "status": "PASSED",
        "durationMs": 420
      },
      {
        "caseCode": "TC-102",
        "status": "FAILED",
        "durationMs": 1250,
        "errorMessage": "Element #submit-btn not found within 10s timeout",
        "jiraBugKey": "MOB-452"
      }
    ]
  }'`;

  // Filtered detail results
  const filteredDetailResults = useMemo(() => {
    if (!selectedRunDetails?.results) return [];
    return selectedRunDetails.results.filter((res) => {
      if (detailFilterStatus !== 'ALL' && res.status !== detailFilterStatus) return false;
      if (detailSearch.trim()) {
        const q = detailSearch.toLowerCase();
        const codeMatch = res.testCase?.code?.toLowerCase().includes(q);
        const titleMatch = res.testCase?.title?.toLowerCase().includes(q);
        const errMsgMatch = res.errorMessage?.toLowerCase().includes(q);
        const bugMatch = res.jiraBugKey?.toLowerCase().includes(q);
        if (!codeMatch && !titleMatch && !errMsgMatch && !bugMatch) return false;
      }
      return true;
    });
  }, [selectedRunDetails, detailFilterStatus, detailSearch]);

  return (
    <div className="flex-1 flex flex-col bg-[#f2f5f8] dark:bg-[#141821] text-[#0f172a] dark:text-[#f1f5f9] p-4 sm:p-6 space-y-5 overflow-y-auto transition-colors duration-200 min-h-0">
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#d0d8e4] dark:border-[#2e3748]">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#821c2b] to-[#b83a4b] text-white flex items-center justify-center shadow-md shadow-[#821c2b]/25">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Test Koşumları
              </h1>
              <p className="text-xs text-[#64748b] dark:text-[#8e9bb0]">
                Test planlarını çalıştırın, ilerlemeyi takip edin ve sonuçları yönetin.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={loadRuns}
            className="p-2 rounded-[10px] bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] text-[#64748b] dark:text-[#8e9bb0] hover:text-[#0f172a] dark:hover:text-[#f1f5f9] hover:border-[#b83a4b]/40 transition-all cursor-pointer shadow-xs"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => exportTestRunsToExcel(runs, 'TCMS')}
            disabled={runs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold bg-white dark:bg-[#1d232f] hover:bg-slate-50 dark:hover:bg-[#262e3d] text-[#64748b] dark:text-[#8e9bb0] hover:text-[#0f172a] dark:hover:text-[#f1f5f9] border border-[#d0d8e4] dark:border-[#2e3748] disabled:opacity-40 transition-all cursor-pointer shadow-xs"
            title="Tüm Test Koşumlarını ve Detaylı Sonuçlarını Excel'e Aktar"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Excel'e Aktar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAutomationModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold bg-white dark:bg-[#1d232f] hover:bg-slate-50 dark:hover:bg-[#262e3d] text-[#64748b] dark:text-[#8e9bb0] hover:text-[#0f172a] dark:hover:text-[#f1f5f9] border border-[#d0d8e4] dark:border-[#2e3748] transition-all cursor-pointer shadow-xs"
          >
            <Code className="w-3.5 h-3.5 text-[#b83a4b]" />
            <span>Otomasyon API (CI/CD)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTACModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-800 transition-all cursor-pointer shadow-xs"
            title="Test Automation Center (TAC) üzerinden mobil testleri çalıştırın"
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-500" />
            <span>⚡ Mobil Otomasyonu Koş (TAC)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTerminalRunId(undefined);
              setActiveTerminalRunTitle('Test Automation Canlı Terminal');
              setIsLiveTerminalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold bg-white dark:bg-[#1d232f] hover:bg-slate-50 dark:hover:bg-[#262e3d] text-slate-700 dark:text-slate-300 border border-[#d0d8e4] dark:border-[#2e3748] transition-all cursor-pointer shadow-xs"
            title="TAC WebSocket canlı log akışını izleyin"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>Canlı Log Terminali</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWebhookResponse(null);
              setWebhookPingResult(null);
              setIsWebhookModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold bg-white dark:bg-[#1d232f] hover:bg-slate-50 dark:hover:bg-[#262e3d] text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-400 transition-all cursor-pointer shadow-xs"
            title="Dış Test Otomasyon Merkezini Webhook ile anında tetikleyin"
          >
            <Send className="w-3.5 h-3.5 text-indigo-500" />
            <span>Webhook Tetikle</span>
          </button>

          {/* Yöntem 1: Hızlı Test Koşumu (Tekil Senaryo) */}
          <button
            type="button"
            onClick={() => setIsQuickPickerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-xs font-semibold bg-white dark:bg-[#1d232f] hover:bg-slate-50 dark:hover:bg-[#262e3d] text-slate-800 dark:text-slate-200 border border-[#d0d8e4] dark:border-[#2e3748] hover:border-amber-500/50 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            title="Tek bir test senaryosunu hızlıca koşun (N defa tekrarlanabilir)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>⚡ Hızlı Test Koşumu</span>
          </button>

          {/* Yöntem 2: Test Planı ile Koşum Başlat (Çoklu Senaryo) */}
          <button
            type="button"
            onClick={() => onOpenManualRun(null)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white transition-all duration-200 rounded-[10px] bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] shadow-sm hover:shadow-[0_4px_12px_rgba(130,28,43,0.35)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            title="Bir test planı veya çoklu senaryo seçerek kapsamlı koşum başlatın"
          >
            <ClipboardList className="w-4 h-4" />
            <span>📋 Test Planı ile Koşum Başlat</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Area (5 Compact Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Toplam Koşum */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-[12px] bg-white dark:bg-[#1d232f] border transition-all duration-200 shadow-xs cursor-pointer ${
            statusFilter === 'ALL'
              ? 'border-[#b83a4b] ring-1 ring-[#b83a4b]/30'
              : 'border-[#d0d8e4] dark:border-[#2e3748] hover:border-[#b83a4b]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#64748b] dark:text-[#8e9bb0] uppercase tracking-wider">
              Toplam Koşum
            </span>
            <div className="p-1.5 rounded-lg bg-[#b83a4b]/10 text-[#b83a4b]">
              <ClipboardList className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {totalRuns}
            </span>
            <span className="text-[10px] text-[#64748b] dark:text-[#8e9bb0]">koşu</span>
          </div>
        </div>

        {/* Çalışıyor (IN_PROGRESS) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`p-3.5 rounded-[12px] bg-white dark:bg-[#1d232f] border transition-all duration-200 shadow-xs cursor-pointer ${
            statusFilter === 'IN_PROGRESS'
              ? 'border-slate-800 dark:border-slate-400 ring-1 ring-slate-800/30'
              : 'border-slate-200 dark:border-[#2e3748] hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Çalışıyor
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {inProgressRuns}
            </span>
            <span className="text-[10px] text-slate-500">aktif</span>
          </div>
        </div>

        {/* Tamamlandı */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`p-3.5 rounded-[12px] bg-white dark:bg-[#1d232f] border transition-all duration-200 shadow-xs cursor-pointer ${
            statusFilter === 'COMPLETED'
              ? 'border-emerald-600 ring-1 ring-emerald-600/30'
              : 'border-slate-200 dark:border-[#2e3748] hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Tamamlandı
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {completedRuns}
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">başarılı</span>
          </div>
        </div>

        {/* Başarısız (Failed or Aborted) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'FAILED' ? 'ALL' : 'FAILED')}
          className={`p-3.5 rounded-[12px] bg-white dark:bg-[#1d232f] border transition-all duration-200 shadow-xs cursor-pointer ${
            statusFilter === 'FAILED'
              ? 'border-rose-600 ring-1 ring-rose-600/30'
              : 'border-slate-200 dark:border-[#2e3748] hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Başarısız
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {failedRuns}
            </span>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80">hata / iptal</span>
          </div>
        </div>

        {/* Bekliyor */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`p-3.5 rounded-[12px] bg-white dark:bg-[#1d232f] border transition-all duration-200 shadow-xs cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'PENDING'
              ? 'border-slate-700 ring-1 ring-slate-700/30'
              : 'border-slate-200 dark:border-[#2e3748] hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Bekliyor
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {pendingRuns}
            </span>
            <span className="text-[10px] text-slate-500">başlamadı</span>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Compact Filtering Bar */}
      <div className="p-3 bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[12px] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center flex-wrap gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#64748b] dark:text-[#8e9bb0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Koşum adı, plan, versiyon veya tester ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] pl-9 pr-3 py-1.5 text-xs text-[#0f172a] dark:text-[#f1f5f9] placeholder-[#64748b] dark:placeholder-[#8e9bb0] focus:outline-none focus:border-[#b83a4b] focus:ring-1 focus:ring-[#b83a4b]/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#b83a4b] cursor-pointer"
          >
            <option value="ALL">Durum: Tümü</option>
            <option value="IN_PROGRESS">Durum: Çalışıyor</option>
            <option value="COMPLETED">Durum: Tamamlandı</option>
            <option value="FAILED">Durum: Başarısız</option>
            <option value="PENDING">Durum: Bekliyor</option>
            <option value="ABORTED">Durum: İptal Edildi</option>
          </select>

          {/* Test Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#b83a4b] cursor-pointer max-w-[180px] truncate"
          >
            <option value="ALL">Plan: Tüm Test Planları</option>
            <option value="__NO_PLAN__">Plan: Bağımsız / Hızlı Koşumlar</option>
            {testPlans.map((p) => (
              <option key={p.id} value={p.id}>
                Plan: {p.title}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#b83a4b] cursor-pointer"
          >
            <option value="ALL">Tarih: Tüm Zamanlar</option>
            <option value="TODAY">Tarih: Bugün</option>
            <option value="WEEK">Tarih: Son 7 Gün</option>
            <option value="MONTH">Tarih: Son 30 Gün</option>
          </select>

          {/* Tester Filter */}
          {uniqueTesters.length > 0 && (
            <select
              value={testerFilter}
              onChange={(e) => setTesterFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#b83a4b] cursor-pointer max-w-[150px] truncate"
            >
              <option value="ALL">Çalıştıran: Tümü</option>
              {uniqueTesters.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/15 rounded-[8px] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Filtreleri Temizle</span>
            </button>
          )}
        </div>

        <div className="text-xs text-[#64748b] dark:text-[#8e9bb0] font-mono shrink-0">
          Gösterilen: <strong className="text-slate-900 dark:text-slate-100">{filteredRuns.length}</strong> / {runs.length}
        </div>
      </div>

      {/* 4. Test Koşumları Tablosu */}
      <div className="border border-[#d0d8e4] dark:border-[#2e3748] rounded-[12px] overflow-hidden bg-white dark:bg-[#1d232f] shadow-xs flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-[#161f30] border-b border-[#d0d8e4] dark:border-[#2e3748] text-[#64748b] dark:text-[#8e9bb0]">
              <tr className="font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 min-w-[200px]">Koşum Adı</th>
                <th className="py-3 px-4 min-w-[160px]">Test Plan</th>
                <th className="py-3 px-4 w-32">Durum</th>
                <th className="py-3 px-4 min-w-[180px]">İlerleme & Sonuçlar</th>
                <th className="py-3 px-4 w-36">Başlangıç</th>
                <th className="py-3 px-4 w-24">Süre</th>
                <th className="py-3 px-4 w-36">Çalıştıran</th>
                <th className="py-3 px-4 w-28 text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2e3748]/60">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    {runs.length === 0 ? (
                      /* 5. Clean Empty State: No runs at all */
                      <div className="max-w-md mx-auto space-y-3 px-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#b83a4b]/10 text-[#b83a4b] flex items-center justify-center mx-auto">
                          <Play className="w-6 h-6 fill-current" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Henüz Test Koşumu Bulunmuyor
                        </h3>
                        <p className="text-xs text-[#64748b] dark:text-[#8e9bb0] leading-relaxed">
                          Test planlarını çalıştırarak kalite metriklerini takip edebilir ve test senaryolarının durumunu doğrulayabilirsiniz.
                        </p>
                        <div className="pt-2 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => onOpenManualRun(null)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-[10px] bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] shadow-md shadow-[#821c2b]/25 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Test Planından Koşum Başlat</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsQuickPickerOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-[10px] bg-slate-100 dark:bg-[#262e3d] text-slate-800 dark:text-slate-200 border border-[#d0d8e4] dark:border-[#2e3748] hover:bg-slate-200 dark:hover:bg-[#2e3748] transition-all cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span>Hızlı Test Koşumu</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Filter Result Empty State */
                      <div className="space-y-2">
                        <Filter className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Arama kriterlerine uygun test koşusu kaydı bulunamadı.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="text-xs font-semibold text-[#b83a4b] hover:underline"
                        >
                          Filtreleri Sıfırla
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => {
                  const stats = getRunStats(run);
                  const isMenuOpen = activeMenuRunId === run.id;

                  return (
                    <tr
                      key={run.id}
                      onClick={() => handleOpenDetail(run.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#262e3d]/50 cursor-pointer transition-colors group"
                    >
                      {/* Koşum Adı & Sürüm & Ortam */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-start space-x-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="truncate max-w-xs group-hover:text-[#b83a4b] transition-colors">
                                {run.title}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-[10px] font-mono font-normal">
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#141821] text-slate-700 dark:text-slate-300 border border-[#d0d8e4] dark:border-[#2e3748]">
                                {run.version || 'v1.0.0'}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#141821] text-slate-700 dark:text-slate-300 border border-[#d0d8e4] dark:border-[#2e3748]">
                                {run.environment || 'STAGING'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Test Plan Kolonu */}
                      <td className="py-3 px-4">
                        {run.testPlan ? (
                          <div
                            onClick={(e) => {
                              if (onSelectPlan) {
                                e.stopPropagation();
                                onSelectPlan(run.testPlan as TestPlan);
                              }
                            }}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[8px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:border-amber-500/40 text-xs font-semibold transition-colors truncate max-w-[170px]"
                            title={`Test Planı: ${run.testPlan.title}`}
                          >
                            <ClipboardList className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate">{run.testPlan.title}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[6px] bg-slate-100 dark:bg-[#262e3d] text-[#64748b] dark:text-[#8e9bb0] text-[11px] font-medium border border-[#d0d8e4] dark:border-[#2e3748]">
                            <Zap className="w-2.5 h-2.5 text-amber-500" />
                            <span>Hızlı / Bağımsız</span>
                          </span>
                        )}
                      </td>

                      {/* Durum Rozeti (WCAG AA) */}
                      <td className="py-3 px-4">
                        {run.status === 'IN_PROGRESS' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                            <span>ÇALIŞIYOR</span>
                          </span>
                        )}
                        {run.status === 'COMPLETED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>TAMAMLANDI</span>
                          </span>
                        )}
                        {run.status === 'ABORTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>İPTAL EDİLDİ</span>
                          </span>
                        )}
                      </td>

                      {/* İlerleme & Çok Renkli Progress Bar */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5 min-w-[160px]">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {stats.executed} / {stats.total} test
                            </span>
                            <span className="font-semibold text-[#64748b] dark:text-[#8e9bb0]">
                              %{stats.passRate}
                            </span>
                          </div>

                          {/* Multi-segment Colored Bar */}
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#141821] overflow-hidden flex">
                            {stats.total > 0 && stats.passed > 0 && (
                              <div
                                style={{ width: `${(stats.passed / stats.total) * 100}%` }}
                                className="bg-emerald-500 h-full"
                                title={`Passed: ${stats.passed}`}
                              />
                            )}
                            {stats.total > 0 && stats.failed > 0 && (
                              <div
                                style={{ width: `${(stats.failed / stats.total) * 100}%` }}
                                className="bg-rose-500 h-full"
                                title={`Failed: ${stats.failed}`}
                              />
                            )}
                            {stats.total > 0 && stats.blocked > 0 && (
                              <div
                                style={{ width: `${(stats.blocked / stats.total) * 100}%` }}
                                className="bg-amber-500 h-full"
                                title={`Blocked: ${stats.blocked}`}
                              />
                            )}
                            {stats.total > 0 && stats.skipped > 0 && (
                              <div
                                style={{ width: `${(stats.skipped / stats.total) * 100}%` }}
                                className="bg-slate-400 h-full"
                                title={`Skipped: ${stats.skipped}`}
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Başlangıç Tarihi */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        <div className="space-y-0.5">
                          <div>
                            {new Date(run.createdAt).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-[#64748b] dark:text-[#8e9bb0]">
                            {new Date(run.createdAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Süre */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {stats.durationFormatted}
                      </td>

                      {/* Çalıştıran */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-[#262e3d] text-[#b83a4b] font-bold text-[10px] flex items-center justify-center border border-[#d0d8e4] dark:border-[#2e3748] shrink-0 uppercase">
                            {run.executedBy ? run.executedBy.charAt(0) : 'T'}
                          </div>
                          <span className="truncate max-w-[120px] text-slate-800 dark:text-slate-200 font-medium text-xs">
                            {run.executedBy || 'QA Tester'}
                          </span>
                        </div>
                      </td>

                      {/* Aksiyonlar & Üç Nokta Menüsü */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(run.id)}
                            className="p-1.5 rounded-[8px] bg-slate-100 dark:bg-[#262e3d] hover:bg-slate-200 dark:hover:bg-[#2e3748] text-slate-600 dark:text-slate-300 transition-colors"
                            title="Detayları İncele"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => ReportsService.downloadRunReport(run.id, 'csv', run.title)}
                            className="p-1.5 rounded-[8px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                            title="CSV Raporu İndir"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>

                          {/* Kebab Menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuRunId(isMenuOpen ? null : run.id)}
                              className="p-1.5 rounded-[8px] hover:bg-slate-200 dark:hover:bg-[#262e3d] text-[#64748b] dark:text-[#8e9bb0] transition-colors"
                              title="Diğer İşlemler"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {isMenuOpen && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[10px] shadow-xl z-30 py-1 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuRunId(null);
                                    handleOpenDetail(run.id);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#262e3d] flex items-center space-x-2 text-slate-700 dark:text-slate-300"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#b83a4b]" />
                                  <span>Detayları İncele</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuRunId(null);
                                    ReportsService.downloadRunReport(run.id, 'html', run.title);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#262e3d] flex items-center space-x-2 text-slate-700 dark:text-slate-300"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>HTML Raporunu Aç</span>
                                </button>

                                {run.status === 'IN_PROGRESS' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRunStatus(run.id, 'COMPLETED')}
                                      className="w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#262e3d] flex items-center space-x-2 text-emerald-600 dark:text-emerald-400"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Koşuyu Tamamla</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRunStatus(run.id, 'ABORTED')}
                                      className="w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#262e3d] flex items-center space-x-2 text-amber-600 dark:text-amber-400"
                                    >
                                      <Slash className="w-3.5 h-3.5" />
                                      <span>Koşuyu İptal Et</span>
                                    </button>
                                  </>
                                )}

                                <div className="border-t border-[#d0d8e4] dark:border-[#2e3748] my-1" />

                                <button
                                  type="button"
                                  onClick={() => handleDeleteRun(run.id, run.title)}
                                  className="w-full px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center space-x-2 text-rose-600 dark:text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Koşumu Sil</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Detail Inspection Modal / Drawer */}
      {isDetailOpen && selectedRunDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[16px] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#d0d8e4] dark:border-[#2e3748] flex items-center justify-between bg-slate-50/80 dark:bg-[#141821]/80 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#821c2b] to-[#b83a4b] text-white flex items-center justify-center shadow-md">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center space-x-2 text-slate-900 dark:text-slate-100">
                    <span>{selectedRunDetails.title}</span>
                    <span className="text-xs font-mono bg-slate-200 dark:bg-[#262e3d] px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                      {selectedRunDetails.version}
                    </span>
                  </h3>
                  <p className="text-xs text-[#64748b] dark:text-[#8e9bb0] font-mono mt-0.5">
                    Ortam: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRunDetails.environment}</span> &bull; Tester: {selectedRunDetails.executedBy} &bull;{' '}
                    {new Date(selectedRunDetails.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => ReportsService.downloadRunReport(selectedRunDetails.id, 'csv', selectedRunDetails.title)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[8px] text-xs font-semibold shadow-xs transition-all"
                  title="CSV İndir"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV İndir</span>
                </button>

                <button
                  type="button"
                  onClick={() => ReportsService.downloadRunReport(selectedRunDetails.id, 'html', selectedRunDetails.title)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-[8px] text-xs font-semibold shadow-xs transition-all"
                  title="HTML Rapor Aç"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">HTML Rapor</span>
                </button>

                {selectedRunDetails.status === 'IN_PROGRESS' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateRunStatus(selectedRunDetails.id, 'COMPLETED')}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white rounded-[8px] text-xs font-bold shadow-xs transition-all"
                  >
                    Koşuyu Tamamla
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#262e3d] text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Filter / Search within results */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#d0d8e4] dark:border-[#2e3748]">
                <div className="flex items-center space-x-2">
                  {(['ALL', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDetailFilterStatus(st)}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-bold transition-all ${
                        detailFilterStatus === st
                          ? 'bg-[#b83a4b] text-white'
                          : 'bg-slate-100 dark:bg-[#262e3d] text-[#64748b] dark:text-[#8e9bb0] hover:text-[#0f172a] dark:hover:text-[#f1f5f9]'
                      }`}
                    >
                      {st === 'ALL' ? 'Tümü' : st}
                    </button>
                  ))}
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Sonuçlarda ara (Kod, başlık, hata)..."
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] pl-8 pr-3 py-1 text-xs"
                  />
                </div>
              </div>

              {filteredDetailResults.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Kriterlere uygun sonuç bulunamadı.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredDetailResults.map((res) => (
                    <div
                      key={res.id}
                      className="p-3.5 rounded-[12px] bg-slate-50 dark:bg-[#141821]/60 border border-[#d0d8e4] dark:border-[#2e3748] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {res.status === 'PASSED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              PASSED
                            </span>
                          )}
                          {res.status === 'FAILED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              FAILED
                            </span>
                          )}
                          {res.status === 'BLOCKED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <Slash className="w-3 h-3" />
                              BLOCKED
                            </span>
                          )}
                          {res.status === 'SKIPPED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
                              SKIPPED
                            </span>
                          )}

                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                            {res.testCase?.code || 'TC'}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-md">
                            {res.testCase?.title || 'Test Senaryosu'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0 font-mono text-[11px] text-[#64748b] dark:text-[#8e9bb0]">
                          {res.executionMs ? <span>{res.executionMs} ms</span> : null}
                          {res.jiraBugKey && (
                            <a
                              href={res.jiraBugUrl || `https://company.atlassian.net/browse/${res.jiraBugKey}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 hover:underline"
                            >
                              <Bug className="w-3 h-3" />
                              <span>{res.jiraBugKey}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {res.errorMessage && (
                        <div
                          className={`p-2.5 rounded-[8px] text-[11px] font-mono ${
                            res.status === 'PASSED'
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : res.status === 'BLOCKED'
                              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300'
                              : res.status === 'FAILED'
                              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300'
                              : 'bg-slate-500/10 border border-slate-500/20 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <strong>{res.status === 'FAILED' ? 'Hata Detayı:' : 'Yorum / Not:'}</strong> {res.errorMessage}
                        </div>
                      )}

                      {(() => {
                        const screenList = parseScreenshots(res.screenshotUrl);
                        if (screenList.length === 0) return null;
                        return (
                          <div className="pt-1.5 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                              <ImageIcon className="w-3 h-3 text-indigo-400" />
                              <span>Ekran Görüntüleri ({screenList.length})</span>
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {screenList.map((imgUrl, imgIdx) => (
                                <img
                                  key={imgIdx}
                                  src={imgUrl}
                                  alt={`Screenshot ${imgIdx + 1}`}
                                  className="max-h-24 rounded-[8px] border border-slate-700 object-contain cursor-pointer hover:opacity-90 transition-opacity bg-black/20"
                                  onClick={() => window.open(imgUrl, '_blank')}
                                  title="Büyük boyutta aç"
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Quick Run Case Selector Modal (Secondary Action Launcher) */}
      {isQuickPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[16px] w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <div className="px-5 py-3.5 border-b border-[#d0d8e4] dark:border-[#2e3748] flex items-center justify-between bg-slate-50/80 dark:bg-[#141821]/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Hızlı Test Koşumu</h3>
                  <p className="text-[11px] text-[#64748b] dark:text-[#8e9bb0]">Koşturmak istediğiniz test senaryosunu seçin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Senaryo kodu veya başlığı ara..."
                  value={quickPickerSearch}
                  onChange={(e) => setQuickPickerSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[8px] pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  autoFocus
                />
              </div>

              <div className="flex-1 overflow-y-auto border border-[#d0d8e4] dark:border-[#2e3748] rounded-[10px] divide-y divide-slate-100 dark:divide-[#2e3748]/60 max-h-72">
                {allCases
                  .filter((tc) =>
                    quickPickerSearch
                      ? tc.title.toLowerCase().includes(quickPickerSearch.toLowerCase()) ||
                        tc.code.toLowerCase().includes(quickPickerSearch.toLowerCase())
                      : true
                  )
                  .map((tc) => (
                    <div
                      key={tc.id}
                      onClick={() => {
                        setIsQuickPickerOpen(false);
                        if (onOpenQuickRun) onOpenQuickRun(tc);
                      }}
                      className="p-2.5 hover:bg-slate-50 dark:hover:bg-[#262e3d] cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#141821] text-blue-600 dark:text-blue-400 border border-[#d0d8e4] dark:border-[#2e3748] shrink-0">
                          {tc.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#b83a4b]">
                          {tc.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">{tc.type}</span>
                        <Play className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Automation API Modal */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[16px] w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <div className="px-6 py-4 border-b border-[#d0d8e4] dark:border-[#2e3748] flex items-center justify-between bg-slate-50/80 dark:bg-[#141821]/80">
              <div className="flex items-center space-x-2.5">
                <Terminal className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold">Otomasyon Test Entegrasyon Rehberi (CI/CD)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAutomationModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <p className="text-[#64748b] dark:text-[#8e9bb0] leading-relaxed">
                Appium, Selenium, Cypress veya Playwright gibi test otomasyon araçlarınızdan çıkan sonuçları aşağıdaki REST API endpoint'ine POST ederek TCMS sistemine aktarabilirsiniz.
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">HTTP POST Endpoint:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(automationCurlExample)}
                    className="flex items-center space-x-1 text-[11px] text-blue-500 hover:underline font-mono cursor-pointer"
                  >
                    {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCurl ? 'Kopyalandı!' : 'cURL Kopyala'}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-[10px] border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre">
                  {automationCurlExample}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Outbound Webhook Trigger Modal */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-[#1d232f] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[16px] w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#d0d8e4] dark:border-[#2e3748] flex items-center justify-between bg-slate-50/80 dark:bg-[#141821]/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Test Otomasyonu Tetikleme (Webhook)
                  </h3>
                  <p className="text-[11px] text-[#64748b] dark:text-[#8e9bb0]">
                    Dış projedeki (Test Otomasyon Merkezi) test botunu tetikleyin ve canlı sonuçları TCMS'e alın.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWebhookModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Webhook Hedef URL (Test Otomasyon Merkezi) *</span>
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={webhookPingLoading || !webhookUrl}
                    className="text-[11px] font-semibold text-indigo-500 hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <Radio className={`w-3 h-3 ${webhookPingLoading ? 'animate-pulse' : ''}`} />
                    <span>{webhookPingLoading ? 'Test Ediliyor...' : 'Bağlantıyı Test Et (Ping)'}</span>
                  </button>
                </label>
                <input
                  type="url"
                  placeholder="http://localhost:8000/api/webhook/trigger"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[10px] px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Ping Result Alert */}
              {webhookPingResult && (
                <div
                  className={`p-3 rounded-[10px] text-xs flex items-center gap-2 border ${
                    webhookPingResult.success
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}
                >
                  {webhookPingResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{webhookPingResult.message}</span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Koşu Başlığı */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Koşu Başlığı</label>
                  <input
                    type="text"
                    value={webhookTitle}
                    onChange={(e) => setWebhookTitle(e.target.value)}
                    placeholder="Örn: Nightly Regression Suite"
                    className="w-full bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[10px] px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Ortam */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Hedef Test Ortamı</label>
                  <select
                    value={webhookEnvironment}
                    onChange={(e) => setWebhookEnvironment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[10px] px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="DEV">DEV Ortamı</option>
                    <option value="STAGING">STAGING Ortamı</option>
                    <option value="UAT">UAT / Pre-Prod</option>
                    <option value="PROD">PROD (Smoke Yalnızca)</option>
                  </select>
                </div>

                {/* Kapsam */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Test Kapsamı (Scope)</label>
                  <select
                    value={webhookScope}
                    onChange={(e) => setWebhookScope(e.target.value as TriggerTargetScope)}
                    className="w-full bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[10px] px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Tüm Test Senaryoları (Tam Kapsam)</option>
                    <option value="SMOKE">Smoke Testleri</option>
                    <option value="REGRESSION">Regresyon Paketi</option>
                    <option value="SUITE">Belirli Test Suite (Klasör)</option>
                  </select>
                </div>

                {/* Secret Token */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Secret / Bearer Token <span className="text-slate-400 font-normal">(Opsiyonel)</span>
                  </label>
                  <input
                    type="password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="webhook-secret-token"
                    className="w-full bg-slate-50 dark:bg-[#141821] border border-[#d0d8e4] dark:border-[#2e3748] rounded-[10px] px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Webhook Response Box */}
              {webhookResponse && (
                <div className="space-y-2 pt-2 border-t border-[#d0d8e4] dark:border-[#2e3748]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Tetikleme Sonucu:</span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        webhookResponse.success
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {webhookResponse.success ? 'BAŞARILI' : 'HATA'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-[10px] border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto whitespace-pre max-h-40">
                    {JSON.stringify(webhookResponse, null, 2)}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#d0d8e4] dark:border-[#2e3748] flex items-center justify-between bg-slate-50/80 dark:bg-[#141821]/80">
              <a
                href="http://localhost:3001/api/docs"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-500 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Swagger API Dokümanı</span>
              </a>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsWebhookModalOpen(false)}
                  className="px-4 py-2 rounded-[10px] text-xs font-semibold text-[#64748b] dark:text-[#8e9bb0] hover:bg-slate-100 dark:hover:bg-[#262e3d] transition-colors cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={handleTriggerWebhook}
                  disabled={webhookTriggerLoading || !webhookUrl}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white transition-all duration-200 rounded-[10px] bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 shadow-md hover:shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${webhookTriggerLoading ? 'animate-spin' : ''}`} />
                  <span>{webhookTriggerLoading ? 'Tetikleniyor...' : '⚡ Koşuyu Başlat (Tetikle)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAC Mobil Otomasyon Başlatma Modalı */}
      <AutomationTriggerModal
        isOpen={isTACModalOpen}
        onClose={() => setIsTACModalOpen(false)}
        projectId={projectId}
        suites={testPlans.map((p) => ({ id: p.id, name: p.title }))}
        caseCodes={allCases.map((c) => c.code)}
        onTriggerSuccess={(testRun, plat, dev) => {
          loadRuns();
          setActiveTerminalRunId(testRun?.id);
          setActiveTerminalRunTitle(testRun?.title || 'Mobil Otomasyon Koşusu');
          setActiveTerminalPlatform(plat);
          setActiveTerminalDevice(dev);
          setIsLiveTerminalOpen(true);
        }}
      />

      {/* TAC Canlı Log Terminal Modalı */}
      <LiveRunTerminalModal
        isOpen={isLiveTerminalOpen}
        onClose={() => setIsLiveTerminalOpen(false)}
        runId={activeTerminalRunId}
        runTitle={activeTerminalRunTitle}
        platform={activeTerminalPlatform}
        deviceAlias={activeTerminalDevice}
        onRunFinished={() => {
          loadRuns();
        }}
      />
    </div>
  );
};

// Helper to format ms duration into human readable string
function formatDuration(totalMs: number): string {
  if (!totalMs || totalMs <= 0) return '—';
  if (totalMs < 1000) return `${totalMs}ms`;
  const seconds = Math.floor(totalMs / 1000);
  if (seconds < 60) return `${seconds}sn`;
  const minutes = Math.floor(seconds / 60);
  const remainingSec = seconds % 60;
  return `${minutes}dk ${remainingSec}sn`;
}
