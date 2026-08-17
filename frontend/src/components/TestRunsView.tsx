'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TestRun, TestRunsService, RunStatus, ResultStatus, TestCase, ReportsService } from '@/services/api';
import {
  Play,
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
} from 'lucide-react';

interface TestRunsViewProps {
  projectId: string;
  onOpenManualRun: () => void;
  onSelectCase?: (testCase: TestCase) => void;
}

export const TestRunsView: React.FC<TestRunsViewProps> = ({
  projectId,
  onOpenManualRun,
  onSelectCase,
}) => {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | RunStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRunDetails, setSelectedRunDetails] = useState<TestRun | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Fetch test runs list
  const loadRuns = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await TestRunsService.getRuns(projectId);
      setRuns(data);
    } catch (err) {
      console.error('Failed to load test runs:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Open detailed run view
  const handleOpenDetail = async (runId: string) => {
    try {
      const details = await TestRunsService.getRunDetails(runId);
      setSelectedRunDetails(details);
      setIsDetailOpen(true);
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
    } catch (err) {
      console.error('Failed to update run status:', err);
    }
  };

  // Filter runs logic
  const filteredRuns = runs.filter((run) => {
    if (statusFilter !== 'ALL' && run.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = run.title.toLowerCase().includes(q);
      const versionMatch = run.version.toLowerCase().includes(q);
      const envMatch = run.environment.toLowerCase().includes(q);
      const testerMatch = run.executedBy ? run.executedBy.toLowerCase().includes(q) : false;
      return titleMatch || versionMatch || envMatch || testerMatch;
    }
    return true;
  });

  // Global Run KPI Stats
  const totalRuns = runs.length;
  const inProgressRuns = runs.filter((r) => r.status === 'IN_PROGRESS').length;
  const completedRuns = runs.filter((r) => r.status === 'COMPLETED').length;
  const abortedRuns = runs.filter((r) => r.status === 'ABORTED').length;

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 space-y-6 overflow-y-auto transition-colors duration-200">
      {/* Top Banner / Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Test Koşumları (Test Executions)</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Manuel ve otomasyon (Appium/Selenium/Playwright) koşularını yönetin ve izleyin.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setIsAutomationModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all"
          >
            <Code className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Otomasyon API Entegrasyonu</span>
            <span className="sm:hidden">Otomasyon API</span>
          </button>

          <button
            onClick={onOpenManualRun}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Manuel Koşu</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Runs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Toplam Koşu</span>
            <Play className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono tracking-tight">{totalRuns}</span>
            <button onClick={loadRuns} className="text-slate-400 hover:text-slate-200 transition-colors" title="Yenile">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* In Progress Runs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Devam Eden Koşular</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400 tracking-tight">
              {inProgressRuns}
            </span>
            <span className="text-xs text-slate-400 font-mono">Aktif Koşu</span>
          </div>
        </div>

        {/* Completed Runs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Tamamlanan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
              {completedRuns}
            </span>
            <span className="text-xs text-slate-400 font-mono">Başarılı Kayıt</span>
          </div>
        </div>

        {/* Aborted Runs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">İptal Edilen / Durdurulan</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tracking-tight">
              {abortedRuns}
            </span>
            <span className="text-xs text-slate-400 font-mono">Aborted</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Koşu başlığı, versiyon veya ortam ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl space-x-1 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tümü ({runs.length})
          </button>
          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Devam Eden ({inProgressRuns})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tamamlanan ({completedRuns})
          </button>
          <button
            onClick={() => setStatusFilter('ABORTED')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              statusFilter === 'ABORTED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            İptal ({abortedRuns})
          </button>
        </div>
      </div>

      {/* Test Runs Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Test Koşusu Başlığı</th>
                <th className="py-3 px-4 w-28">Versiyon</th>
                <th className="py-3 px-4 w-28">Ortam</th>
                <th className="py-3 px-4 w-36">Çalıştıran</th>
                <th className="py-3 px-4 w-32">Durum</th>
                <th className="py-3 px-4 w-36 text-center">Case Sayısı</th>
                <th className="py-3 px-4 w-36">Tarih</th>
                <th className="py-3 px-4 w-28 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Filter className="w-6 h-6 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p>Kriterlere uygun test koşusu kaydı bulunamadı.</p>
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => handleOpenDetail(run.id)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center space-x-2">
                        <Play className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate max-w-xs">{run.title}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {run.version}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700">
                        {run.environment}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[140px]">
                      {run.executedBy || 'QA Tester'}
                    </td>

                    <td className="py-3 px-4">
                      {run.status === 'IN_PROGRESS' && (
                        <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                          <span>DEVAM EDİYOR</span>
                        </span>
                      )}
                      {run.status === 'COMPLETED' && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>TAMAMLANDI</span>
                        </span>
                      )}
                      {run.status === 'ABORTED' && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                          <XCircle className="w-3 h-3 text-rose-500" />
                          <span>İPTAL EDİLDİ</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-center text-slate-700 dark:text-slate-300">
                      {run._count?.results ?? run.results?.length ?? 0} Test
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(run.createdAt).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            ReportsService.downloadRunReport(run.id, 'csv', run.title);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="Koşum Raporunu CSV Olarak İndir"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            ReportsService.downloadRunReport(run.id, 'html', run.title);
                          }}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-colors"
                          title="HTML Koşum Raporunu Aç"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(run.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Detayları İncele"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Run Detail Drawer / Modal */}
      {isDetailOpen && selectedRunDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <span>{selectedRunDetails.title}</span>
                    <span className="text-xs font-mono bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                      {selectedRunDetails.version}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Ortam: {selectedRunDetails.environment} &bull; Tester: {selectedRunDetails.executedBy} &bull;{' '}
                    {new Date(selectedRunDetails.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => ReportsService.downloadRunReport(selectedRunDetails.id, 'csv', selectedRunDetails.title)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  title="CSV Formatında İndir"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV İndir</span>
                </button>

                <button
                  onClick={() => ReportsService.downloadRunReport(selectedRunDetails.id, 'html', selectedRunDetails.title)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all"
                  title="HTML Raporu Yeni Sekmede Aç / Yazdır"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>HTML Rapor</span>
                </button>

                {selectedRunDetails.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleUpdateRunStatus(selectedRunDetails.id, 'COMPLETED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    Koşuyu Tamamla
                  </button>
                )}

                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Koşu Sonuçları ({selectedRunDetails.results?.length || 0} Test Case)
                </h4>
              </div>

              {!selectedRunDetails.results || selectedRunDetails.results.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Bu koşuya ait henüz kaydedilmiş test sonucu bulunmamaktadır.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedRunDetails.results.map((res) => (
                    <div
                      key={res.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {res.status === 'PASSED' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] shrink-0">
                              PASS
                            </span>
                          )}
                          {res.status === 'FAILED' && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 font-mono font-bold text-[10px] shrink-0">
                              FAIL
                            </span>
                          )}
                          {res.status === 'BLOCKED' && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-mono font-bold text-[10px] shrink-0">
                              BLOCK
                            </span>
                          )}
                          {res.status === 'SKIPPED' && (
                            <span className="px-2 py-0.5 rounded bg-slate-500/20 text-slate-600 dark:text-slate-400 font-mono font-bold text-[10px] shrink-0">
                              SKIP
                            </span>
                          )}

                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                            {res.testCase?.code || 'TC'}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {res.testCase?.title || 'Test Case'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0 font-mono text-[11px] text-slate-400">
                          {res.executionMs && <span>{res.executionMs} ms</span>}
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
                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-[11px] font-mono">
                          <strong>Hata:</strong> {res.errorMessage}
                        </div>
                      )}

                      {res.screenshotUrl && (
                        <div className="pt-1">
                          <img
                            src={res.screenshotUrl}
                            alt="Execution Screenshot"
                            className="max-h-36 rounded-lg border border-slate-700 object-contain cursor-pointer hover:opacity-90"
                            onClick={() => window.open(res.screenshotUrl, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Automation Ingestion API Modal */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center space-x-2.5">
                <Terminal className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold">Otomasyon Test Entegrasyon Rehberi</h3>
              </div>
              <button
                onClick={() => setIsAutomationModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <p className="text-slate-600 dark:text-slate-300">
                Mobil (Appium/Java) veya Web (Selenium/Playwright) otomasyon projelerinizden test sonuçlarını otomatik olarak TCMS veritabanına aktarabilirsiniz.
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">HTTP POST Endpoint:</span>
                  <button
                    onClick={() => copyToClipboard(automationCurlExample)}
                    className="flex items-center space-x-1 text-[11px] text-blue-500 hover:underline font-mono"
                  >
                    {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCurl ? 'Kopyalandı!' : 'cURL Kopyala'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre">
                  {automationCurlExample}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-slate-700 dark:text-slate-300 space-y-1">
                <h4 className="font-bold text-blue-500 flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Entegrasyon Notları</span>
                </h4>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <li><code className="text-blue-400">caseCode</code> (örn: TC-101) ile eşleşen Test Case'ler otomatik ilişkilendirilir.</li>
                  <li>FAILED olan Test Case'lere <code className="text-blue-400">jiraBugKey</code> eklenirse Jira kartı otomatik oluşturulur.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
