'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Project,
  ReportsService,
  ProjectReportSummary,
  RunReportSummary,
  Priority,
  TestType,
  ResultStatus,
} from '@/services/api';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  ExternalLink,
  Code2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Slash,
  Layers,
  Bug,
  Filter,
  Search,
  ChevronRight,
  TrendingUp,
  Activity,
  Zap,
  Play,
  Share2,
} from 'lucide-react';

interface ReportsViewProps {
  project: Project | null;
  onOpenManualRun?: () => void;
  onSelectCase?: (testCaseId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  project,
  onOpenManualRun,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'RUNS' | 'DEFECTS' | 'SUITES'>('OVERVIEW');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ProjectReportSummary | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runSummary, setRunSummary] = useState<RunReportSummary | null>(null);
  const [loadingRun, setLoadingRun] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  // Load project report data
  const loadProjectReport = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    try {
      const data = await ReportsService.getProjectSummary(project.id);
      setSummary(data);
      if (data.recentRuns && data.recentRuns.length > 0 && !selectedRunId) {
        setSelectedRunId(data.recentRuns[0].id);
      }
    } catch (err) {
      console.error('Failed to load project report:', err);
    } finally {
      setLoading(false);
    }
  }, [project, selectedRunId]);

  useEffect(() => {
    loadProjectReport();
  }, [project, loadProjectReport]);

  // Load selected test run summary
  const loadRunReport = useCallback(async (runId: string) => {
    setLoadingRun(true);
    try {
      const data = await ReportsService.getRunSummary(runId);
      setRunSummary(data);
    } catch (err) {
      console.error('Failed to load run report:', err);
    } finally {
      setLoadingRun(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      loadRunReport(selectedRunId);
    }
  }, [selectedRunId, loadRunReport]);

  // Quick export triggers
  const handleExport = async (format: 'json' | 'csv' | 'html') => {
    if (!project) return;
    setExportingFormat(format);
    try {
      await ReportsService.downloadProjectReport(project.id, format, project.key);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Rapor indirilirken bir hata oluştu.');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportRun = async (runId: string, format: 'json' | 'csv' | 'html', title: string) => {
    setExportingFormat(`run-${format}`);
    try {
      await ReportsService.downloadRunReport(runId, format, title);
    } catch (err) {
      console.error('Run export failed:', err);
      alert('Koşum raporu indirilirken bir hata oluştu.');
    } finally {
      setExportingFormat(null);
    }
  };

  const handlePrint = () => {
    if (!project) return;
    const url = ReportsService.getProjectExportUrl(project.id, 'html');
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  };

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500">
        <FileText className="w-16 h-16 mb-4 opacity-30 animate-pulse" />
        <p className="text-lg font-medium">Lütfen bir Test Planı seçin</p>
        <p className="text-sm text-slate-500 mt-1">Raporları ve analitik dökümleri görüntülemek için soldan bir test planı seçin.</p>
      </div>
    );
  }

  const metrics = summary?.metrics || {
    totalCases: 0,
    totalSuites: 0,
    totalRuns: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
    untested: 0,
    executedTotal: 0,
    passRate: 0,
    executedPassRate: 0,
  };

  // Filtered test cases in project
  const filteredCases = (summary?.testCases || []).filter((tc) => {
    const matchSearch = searchQuery
      ? tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tc.suiteName && tc.suiteName.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    const matchPriority = filterPriority === 'ALL' || tc.priority === filterPriority;
    const matchStatus = filterStatus === 'ALL' || tc.latestStatus === filterStatus;
    return matchSearch && matchPriority && matchStatus;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50/50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Banner / Executive Toolbar */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-md">
                {project.key}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {project.name} • Raporlama & Analitik Hub
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Test planı yürütme metrikleri, koşum dökümleri, hata analizi ve dışa aktarma araçları
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exportingFormat === 'csv'}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="UTF-8 Excel Uyumlu CSV Olarak İndir"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{exportingFormat === 'csv' ? 'Hazırlanıyor...' : 'Excel / CSV'}</span>
            </button>

            <button
              onClick={() => handleExport('html')}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-700 dark:border-slate-600 shadow-sm transition-all active:scale-95"
              title="Zengin Stilize HTML Raporu Aç"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>HTML Raporu</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all active:scale-95"
              title="Yazdır veya PDF Olarak Kaydet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yazdır / PDF</span>
            </button>

            <button
              onClick={() => handleExport('json')}
              disabled={exportingFormat === 'json'}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all active:scale-95 disabled:opacity-50"
              title="Ham JSON Formatında Dışa Aktar"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={loadProjectReport}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800/80 mt-4 -mb-4 pt-1">
          <button
            onClick={() => setActiveSubTab('OVERVIEW')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeSubTab === 'OVERVIEW'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Genel Yönetici Raporu</span>
          </button>

          <button
            onClick={() => setActiveSubTab('RUNS')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeSubTab === 'RUNS'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Koşum Raporları & Analiz ({summary?.recentRuns?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('DEFECTS')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeSubTab === 'DEFECTS'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Hata & Jira İzlenebilirlik ({summary?.failedCases?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('SUITES')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeSubTab === 'SUITES'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Modül / Suite Kapsamı ({summary?.suites?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6">
        {/* Executive Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Test</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{metrics.totalCases}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">{metrics.totalSuites} Modül</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Genel Başarı</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">%{metrics.passRate}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">{metrics.passed} Başarılı</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Kaldı / Hatalı</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{metrics.failed}</div>
            <span className="text-[11px] text-rose-500/80 mt-1 block">Aksiyon Gerekiyor</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bloke</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{metrics.blocked}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Engellenen</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Koşulmamış</span>
            <div className="text-2xl font-black text-slate-500 dark:text-slate-400 mt-1">{metrics.untested}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Bekleyen</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Koşum</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{metrics.totalRuns}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Test Çalıştırması</span>
          </div>
        </div>

        {/* 1. SUB-TAB: GENEL YÖNETİCİ RAPORU */}
        {activeSubTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Progress & Distribution Bar */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Test Planı Genel Yürütme Dağılımı</span>
                <span className="text-slate-500">
                  Koşulan: {metrics.executedTotal} / {metrics.totalCases} (%{metrics.totalCases > 0 ? Math.round((metrics.executedTotal / metrics.totalCases) * 100) : 0} Kapsam)
                </span>
              </div>
              <div className="h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                <div style={{ width: `${(metrics.passed / (metrics.totalCases || 1)) * 100}%` }} className="bg-emerald-500 h-full" title={`Geçti: ${metrics.passed}`} />
                <div style={{ width: `${(metrics.failed / (metrics.totalCases || 1)) * 100}%` }} className="bg-rose-500 h-full" title={`Kaldı: ${metrics.failed}`} />
                <div style={{ width: `${(metrics.blocked / (metrics.totalCases || 1)) * 100}%` }} className="bg-amber-500 h-full" title={`Bloke: ${metrics.blocked}`} />
                <div style={{ width: `${(metrics.skipped / (metrics.totalCases || 1)) * 100}%` }} className="bg-slate-400 h-full" title={`Atlandı: ${metrics.skipped}`} />
              </div>
              <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 pt-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Başarılı: {metrics.passed} (%{metrics.passRate})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Başarısız: {metrics.failed}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Bloke: {metrics.blocked}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>Koşulmamış: {metrics.untested}</span>
                </div>
              </div>
            </div>

            {/* Test Case Detailed Table with Filters */}
            <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Test Senaryoları Rapor Tablosu ({filteredCases.length})</span>
                </h3>

                <div className="flex items-center flex-wrap gap-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Senaryo veya kod ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200"
                  >
                    <option value="ALL">Tüm Öncelikler</option>
                    <option value="BLOCKER">Blocker</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LOW">Low</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200"
                  >
                    <option value="ALL">Tüm Durumlar</option>
                    <option value="PASSED">Geçti (PASSED)</option>
                    <option value="FAILED">Kaldı (FAILED)</option>
                    <option value="BLOCKED">Bloke (BLOCKED)</option>
                    <option value="UNTESTED">Koşulmamış</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-2.5 px-4">Kod</th>
                      <th className="py-2.5 px-4">Başlık</th>
                      <th className="py-2.5 px-4">Suite</th>
                      <th className="py-2.5 px-4">Öncelik</th>
                      <th className="py-2.5 px-4">Tip</th>
                      <th className="py-2.5 px-4">Yürütme</th>
                      <th className="py-2.5 px-4">Son Durum</th>
                      <th className="py-2.5 px-4">Jira Story / Bug</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredCases.map((tc) => (
                      <tr key={tc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{tc.code}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100">{tc.title}</td>
                        <td className="py-2.5 px-4 text-slate-500">{tc.suiteName}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tc.priority === 'BLOCKER'
                                ? 'bg-red-500/10 text-red-500'
                                : tc.priority === 'CRITICAL'
                                ? 'bg-amber-500/10 text-amber-500'
                                : tc.priority === 'NORMAL'
                                ? 'bg-blue-500/10 text-blue-500'
                                : 'bg-slate-500/10 text-slate-500'
                            }`}
                          >
                            {tc.priority}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{tc.type}</td>
                        <td className="py-2.5 px-4 text-slate-500">{tc.executionType || 'MANUAL'}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tc.latestStatus === 'PASSED'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : tc.latestStatus === 'FAILED'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                : tc.latestStatus === 'BLOCKED'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-slate-500/10 text-slate-400'
                            }`}
                          >
                            {tc.latestStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-1.5">
                            {tc.jiraStoryKey && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono text-[10px]">
                                {tc.jiraStoryKey}
                              </span>
                            )}
                            {tc.latestJiraBugKey && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-mono text-[10px]">
                                🐛 {tc.latestJiraBugKey}
                              </span>
                            )}
                            {!tc.jiraStoryKey && !tc.latestJiraBugKey && <span className="text-slate-400">-</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCases.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Arama kriterlerine uygun test senaryosu bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. SUB-TAB: TEST KOŞUM RAPORLARI */}
        {activeSubTab === 'RUNS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Test Runs List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Tüm Test Koşuları</h3>
              <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
                {(summary?.recentRuns || []).map((run) => (
                  <div
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedRunId === run.id
                        ? 'bg-white dark:bg-slate-800 border-rose-500/60 shadow-md shadow-rose-500/5'
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{run.title}</h4>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          run.passRate >= 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        %{run.passRate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span>{run.environment} • {run.version}</span>
                      <span>{new Date(run.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                      <span className="text-slate-400">{run.executedBy}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportRun(run.id, 'csv', run.title);
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-emerald-500"
                          title="CSV İndir"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportRun(run.id, 'html', run.title);
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-500"
                          title="HTML Raporu Aç"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {(summary?.recentRuns || []).length === 0 && (
                  <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    Henüz kaydedilmiş test koşusu bulunmuyor.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Selected Run Detail Matrix */}
            <div className="lg:col-span-2 space-y-4">
              {loadingRun ? (
                <div className="p-12 text-center text-slate-400">Koşum detayları yükleniyor...</div>
              ) : runSummary ? (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/10 text-indigo-500">
                          {runSummary.run.environment}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{runSummary.run.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Test Eden: {runSummary.run.executedBy} • Versiyon: {runSummary.run.version} • {new Date(runSummary.run.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleExportRun(runSummary.run.id, 'csv', runSummary.run.title)}
                        className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>CSV</span>
                      </button>
                      <button
                        onClick={() => handleExportRun(runSummary.run.id, 'html', runSummary.run.title)}
                        className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>HTML Rapor</span>
                      </button>
                    </div>
                  </div>

                  {/* Run Metrics */}
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Koşulan</span>
                      <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{runSummary.metrics.total}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] uppercase font-bold text-emerald-500">Başarılı</span>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{runSummary.metrics.passed}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] uppercase font-bold text-rose-500">Kaldı</span>
                      <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">{runSummary.metrics.failed}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Başarı Oranı</span>
                      <div className="text-lg font-black text-indigo-500 mt-0.5">%{runSummary.metrics.passRate}</div>
                    </div>
                  </div>

                  {/* Run Results Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/60 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <th className="p-2.5">Kod</th>
                          <th className="p-2.5">Senaryo</th>
                          <th className="p-2.5">Modül</th>
                          <th className="p-2.5">Sonuç</th>
                          <th className="p-2.5">Hata / Jira</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {runSummary.results.map((res) => (
                          <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">{res.testCaseCode}</td>
                            <td className="p-2.5 font-medium">{res.testCaseTitle}</td>
                            <td className="p-2.5 text-slate-500">{res.suiteName}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  res.status === 'PASSED'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : res.status === 'FAILED'
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                    : 'bg-amber-500/15 text-amber-600'
                                }`}
                              >
                                {res.status}
                              </span>
                            </td>
                            <td className="p-2.5">
                              {res.errorMessage && <span className="text-rose-500 text-[11px] block">{res.errorMessage}</span>}
                              {res.jiraBugKey && (
                                <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                                  🐛 {res.jiraBugKey}
                                </span>
                              )}
                              {!res.errorMessage && !res.jiraBugKey && <span className="text-slate-400">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  İncelemek için soldaki listeden bir test koşusu seçin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. SUB-TAB: HATA & JIRA İZLENEBİLİRLİK */}
        {activeSubTab === 'DEFECTS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-500" />
                <span>Tespit Edilen Hatalar ve Başarısız Testler ({summary?.failedCases?.length || 0})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(summary?.failedCases || []).map((fc, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-rose-500/20 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">{fc.code}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500">
                      {fc.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{fc.title}</h4>
                  <p className="text-[11px] text-slate-500">Modül: {fc.suiteName}</p>

                  {fc.errorMessage && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 font-mono">
                      {fc.errorMessage}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                    <span>{fc.executedBy || 'QA Tester'}</span>
                    {fc.jiraBugKey ? (
                      <a
                        href={fc.jiraBugUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-500 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Jira Bug: {fc.jiraBugKey}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Jira kaydı açılmadı</span>
                    )}
                  </div>
                </div>
              ))}

              {(summary?.failedCases || []).length === 0 && (
                <div className="col-span-2 p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">Harika! Başarısız veya hata alan test senaryosu bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. SUB-TAB: MODÜL / SUITE KAPSAMI */}
        {activeSubTab === 'SUITES' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-500" />
              <span>Modül & Suite Başarı Performans Matrisi</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(summary?.suites || []).map((suite) => (
                <div
                  key={suite.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{suite.name}</h4>
                    <span className="text-xs font-mono font-bold text-slate-500">{suite.totalCases} Test</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-500">Başarı Oranı</span>
                      <span className={suite.passRate >= 75 ? 'text-emerald-500' : 'text-rose-500'}>%{suite.passRate}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div style={{ width: `${suite.passRate}%` }} className="bg-emerald-500 h-full" />
                      <div style={{ width: `${(suite.failed / (suite.totalCases || 1)) * 100}%` }} className="bg-rose-500 h-full" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-emerald-600 dark:text-emerald-400">✓ {suite.passed} Geçti</span>
                    <span className="text-rose-600 dark:text-rose-400">✕ {suite.failed} Kaldı</span>
                    <span className="text-slate-400">○ {suite.untested} Bekliyor</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
