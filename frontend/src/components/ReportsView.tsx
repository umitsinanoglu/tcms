'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Project,
  ReportsService,
  ProjectReportSummary,
  RunReportSummary,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  ExternalLink,
  Code2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Bug,
  Search,
  TrendingUp,
  Play,
  Smartphone,
  Globe,
  Zap,
  Monitor,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface ReportsViewProps {
  project: Project | null;
  onOpenManualRun?: () => void;
  onSelectCase?: (testCaseId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  project,
}) => {
  const { role } = useAuth();

  // Role-based initial view mode: Admins and Viewers default to EXECUTIVE, Testers can switch
  const [viewMode, setViewMode] = useState<'EXECUTIVE' | 'QA'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tcms_report_view_mode');
      if (saved === 'EXECUTIVE' || saved === 'QA') return saved;
    }
    return role === 'ADMIN' || role === 'VIEWER' ? 'EXECUTIVE' : 'EXECUTIVE';
  });

  const [qaSubTab, setQaSubTab] = useState<'RUNS' | 'DEFECTS' | 'CASES'>('RUNS');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ProjectReportSummary | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runSummary, setRunSummary] = useState<RunReportSummary | null>(null);
  const [loadingRun, setLoadingRun] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  const handleSetViewMode = (mode: 'EXECUTIVE' | 'QA') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tcms_report_view_mode', mode);
    }
  };

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

  const readiness = summary?.readiness || {
    status: 'GO',
    score: metrics.passRate,
    reason: 'Kalite eşikleri sağlandı.',
    blockerCount: 0,
    criticalCount: 0,
  };

  const channels = summary?.channels || [
    { key: 'MOBILE', name: 'Mobil Bankacılık (iOS / Android)', icon: 'Smartphone', total: 0, passed: 0, failed: 0, blocked: 0, untested: 0, passRate: 0 },
    { key: 'WEB', name: 'Web İnternet Şubesi', icon: 'Globe', total: 0, passed: 0, failed: 0, blocked: 0, untested: 0, passRate: 0 },
    { key: 'API', name: 'Ana Bankacılık Gtech API', icon: 'Zap', total: 0, passed: 0, failed: 0, blocked: 0, untested: 0, passRate: 0 },
    { key: 'DESKTOP', name: 'Ana Bankacılık Masaüstü / Gişe', icon: 'Monitor', total: 0, passed: 0, failed: 0, blocked: 0, untested: 0, passRate: 0 },
  ];

  const automation = summary?.automation || {
    manual: metrics.totalCases,
    automation: 0,
    percentage: 0,
  };

  const topRiskySuites = summary?.topRiskySuites || [];

  // Filtered test cases for QA view
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
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0f141f]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#b83a4b]/10 text-[#b83a4b] dark:text-[#f87171] border border-[#b83a4b]/30 rounded-md">
                {project.key}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {project.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Banka Kalite, Yürütme ve Risk Raporlama Merkezi
            </p>
          </div>

          {/* Center: Executive vs QA View Switcher */}
          <div className="flex items-center self-start lg:self-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-inner">
            <button
              onClick={() => handleSetViewMode('EXECUTIVE')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'EXECUTIVE'
                  ? 'bg-white dark:bg-[#1d232f] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#b83a4b]" />
              <span>👔 Yönetici Özeti</span>
            </button>

            <button
              onClick={() => handleSetViewMode('QA')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'QA'
                  ? 'bg-white dark:bg-[#1d232f] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span>🧪 QA & Koşum Detayları</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] text-white shadow-sm transition-all active:scale-95"
              title="Resmi Yönetici Raporunu Yazdır veya PDF Olarak Kaydet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yönetici PDF / Yazdır</span>
            </button>

            <button
              onClick={() => handleExport('csv')}
              disabled={exportingFormat === 'csv'}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="Excel Uyumlu CSV Raporu İndir"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{exportingFormat === 'csv' ? 'Hazırlanıyor...' : 'Excel / CSV'}</span>
            </button>

            <button
              onClick={() => handleExport('json')}
              disabled={exportingFormat === 'json'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
              title="Ham JSON İndir"
            >
              <Code2 className="w-4 h-4" />
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
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* 👔 1. EXECUTIVE VIEW (YÖNETİCİ GÖRÜNÜMÜ)                                 */}
        {/* ========================================================================= */}
        {viewMode === 'EXECUTIVE' && (
          <div className="space-y-6">
            {/* 1.1 Sürüm Çıkış Kararı (Go / No-Go Hero Banner) */}
            <div
              className={`p-5 rounded-2xl border transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                readiness.status === 'GO'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                  : readiness.status === 'CAUTION'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div
                  className={`p-3 rounded-xl ${
                    readiness.status === 'GO'
                      ? 'bg-emerald-500 text-white'
                      : readiness.status === 'CAUTION'
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {readiness.status === 'GO' ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : readiness.status === 'CAUTION' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <ShieldAlert className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-bold tracking-wider opacity-75">
                      Sürüm Yayına Hazırlık Kararı
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        readiness.status === 'GO'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                          : readiness.status === 'CAUTION'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                      }`}
                    >
                      {readiness.status === 'GO'
                        ? 'CANLIYA UYGUN (GO)'
                        : readiness.status === 'CAUTION'
                        ? 'ŞARTLI / RİSKLİ YAYIN (CAUTION)'
                        : 'YAYINA UYGUN DEĞİL (NO-GO)'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
                    {readiness.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6 self-end md:self-center">
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                    Kalite Skoru
                  </span>
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    %{readiness.score}
                  </span>
                </div>
              </div>
            </div>

            {/* 1.2 4 Temel Executive KPI Kartı */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Başarı Oranı */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-[#232b3b] shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Genel Başarı</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    %{metrics.passRate}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {metrics.passed} / {metrics.totalCases} Geçti
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
                  <div style={{ width: `${metrics.passRate}%` }} className="bg-emerald-500 h-full" />
                </div>
              </div>

              {/* Yürütme Kapsamı */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-[#232b3b] shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Kapsamı</span>
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                    %{metrics.totalCases > 0 ? Math.round((metrics.executedTotal / metrics.totalCases) * 100) : 0}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {metrics.executedTotal} / {metrics.totalCases} Koşuldu
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
                  <div
                    style={{
                      width: `${metrics.totalCases > 0 ? (metrics.executedTotal / metrics.totalCases) * 100 : 0}%`,
                    }}
                    className="bg-sky-500 h-full"
                  />
                </div>
              </div>

              {/* Aksiyon Gereken / Hatalar */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-[#232b3b] shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aksiyon Bekleyen</span>
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                    <Bug className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
                    {metrics.failed}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {metrics.blocked} Bloke Senaryo
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-3 text-[11px] font-bold">
                  <span className="text-rose-500">
                    {readiness.blockerCount > 0 ? `⚠️ ${readiness.blockerCount} Blocker Hata` : '0 Blocker'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-amber-500">
                    {readiness.criticalCount > 0 ? `${readiness.criticalCount} Kritik` : '0 Kritik'}
                  </span>
                </div>
              </div>

              {/* Otomasyon Oranı */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-[#232b3b] shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Otomasyon Oranı</span>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                    %{automation.percentage}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {automation.automation} Otomasyon / {automation.manual} Manuel
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
                  <div style={{ width: `${automation.percentage}%` }} className="bg-indigo-500 h-full" />
                </div>
              </div>
            </div>

            {/* 1.3 Banka Sistem & Kanal Sağlık Matrisi */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-[#232b3b] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🏦 Banka Sistem & Kanal Sağlık Matrisi</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dijital kanallar, Gtech API servisleri ve Ana Bankacılık gişe/masaüstü başarı oranları
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                {channels.map((ch) => {
                  const getIcon = () => {
                    if (ch.key === 'MOBILE') return <Smartphone className="w-5 h-5 text-indigo-400" />;
                    if (ch.key === 'WEB') return <Globe className="w-5 h-5 text-sky-400" />;
                    if (ch.key === 'API') return <Zap className="w-5 h-5 text-amber-400" />;
                    return <Monitor className="w-5 h-5 text-slate-400" />;
                  };

                  return (
                    <div
                      key={ch.key}
                      className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#1a202c]/70 border border-slate-200/80 dark:border-[#2e3748] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-xs">
                          {getIcon()}
                        </div>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            ch.passRate >= 85
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : ch.passRate >= 70
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          %{ch.passRate}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{ch.name}</h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                          <span>{ch.total} Senaryo</span>
                          <span>{ch.passed} Başarılı • {ch.failed} Hata</span>
                        </div>
                      </div>

                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                        <div style={{ width: `${ch.passRate}%` }} className="bg-emerald-500 h-full" />
                        <div
                          style={{ width: `${(ch.failed / (ch.total || 1)) * 100}%` }}
                          className="bg-rose-500 h-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1.4 İki Kolonlu Alt Yönetici Paneli: Riskli Modüller & Son Koşular */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sol: ⚠️ En Riskli Modüller */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-[#232b3b] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>En Riskli Modüller (Aksiyon Bekleyen)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Başarısızlık ve bloke sayısı en yüksek olan iş modülleri
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {topRiskySuites.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#1a202c]/70 border border-slate-200/80 dark:border-[#2e3748] flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.name}</h4>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{s.totalCases} Senaryo</span>
                          <span>•</span>
                          <span className="text-rose-500 font-semibold">{s.failed} Hatalı</span>
                          {s.blocked > 0 && <span className="text-amber-500 font-semibold">• {s.blocked} Bloke</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-mono font-bold block ${
                            s.passRate >= 75 ? 'text-amber-500' : 'text-rose-500'
                          }`}
                        >
                          %{s.passRate}
                        </span>
                        <span className="text-[10px] text-slate-400">Başarı Oranı</span>
                      </div>
                    </div>
                  ))}

                  {topRiskySuites.length === 0 && (
                    <div className="p-8 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Harika! Risk teşkil eden başarısız modül bulunmuyor.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sağ: ⏱️ Son Test Koşuları & Sürüm İlerleme Özeti */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-[#232b3b] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Play className="w-4 h-4 text-indigo-500" />
                      <span>Son Test Koşuları & Sürüm Geçmişi</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      En son yürütülen test çalıştırmalarının başarı özetleri
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleSetViewMode('QA');
                      setQaSubTab('RUNS');
                    }}
                    className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <span>Tümünü Gör</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(summary?.recentRuns || []).slice(0, 4).map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#1a202c]/70 border border-slate-200/80 dark:border-[#2e3748] flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-500/10 text-indigo-500">
                            {r.environment}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{r.title}</h4>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                          <span>Versiyon: {r.version}</span>
                          <span>•</span>
                          <span>{new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
                          <span>•</span>
                          <span className="truncate">{r.executedBy}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            r.passRate >= 85
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          %{r.passRate}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{r.totalResults} Test</span>
                      </div>
                    </div>
                  ))}

                  {(summary?.recentRuns || []).length === 0 && (
                    <div className="p-8 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                      Henüz kayıtlı bir test koşusu bulunmuyor.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🧪 2. QA & TECHNICAL VIEW (TEKNİK / TEST UZMANI GÖRÜNÜMÜ)                 */}
        {/* ========================================================================= */}
        {viewMode === 'QA' && (
          <div className="space-y-6">
            {/* QA Sub-Tab Navigation */}
            <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                onClick={() => setQaSubTab('RUNS')}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  qaSubTab === 'RUNS'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Test Koşumları & İnceleme ({summary?.recentRuns?.length || 0})</span>
              </button>

              <button
                onClick={() => setQaSubTab('DEFECTS')}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  qaSubTab === 'DEFECTS'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Hatalar & Jira İzlenebilirlik ({summary?.failedCases?.length || 0})</span>
              </button>

              <button
                onClick={() => setQaSubTab('CASES')}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  qaSubTab === 'CASES'
                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Tüm Test Senaryoları Tablosu ({filteredCases.length})</span>
              </button>
            </div>

            {/* QA 2.1: RUNS TAB */}
            {qaSubTab === 'RUNS' && (
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
                            ? 'bg-white dark:bg-[#1d232f] border-indigo-500/60 shadow-md shadow-indigo-500/5'
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
                          <span className="text-slate-400 truncate">{run.executedBy}</span>
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
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-[#232b3b] shadow-sm space-y-5">
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
                          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-xs">
                            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                              <th className="p-2.5 bg-slate-100 dark:bg-slate-800">Kod</th>
                              <th className="p-2.5 bg-slate-100 dark:bg-slate-800">Senaryo</th>
                              <th className="p-2.5 bg-slate-100 dark:bg-slate-800">Modül</th>
                              <th className="p-2.5 bg-slate-100 dark:bg-slate-800">Sonuç</th>
                              <th className="p-2.5 bg-slate-100 dark:bg-slate-800">Hata / Jira</th>
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
                                  {res.errorMessage && <span className="text-rose-500 text-[11px] block font-mono">{res.errorMessage}</span>}
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
                    <div className="p-12 text-center text-slate-400 bg-white dark:bg-[#141821] rounded-2xl border border-slate-200 dark:border-slate-800">
                      İncelemek için soldaki listeden bir test koşusu seçin.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* QA 2.2: DEFECTS TAB */}
            {qaSubTab === 'DEFECTS' && (
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
                      className="p-4 rounded-xl bg-white dark:bg-[#141821] border border-rose-500/20 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">{fc.code}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            fc.priority === 'BLOCKER'
                              ? 'bg-red-500/15 text-red-500'
                              : fc.priority === 'CRITICAL'
                              ? 'bg-amber-500/15 text-amber-500'
                              : 'bg-blue-500/15 text-blue-500'
                          }`}
                        >
                          {fc.priority}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{fc.title}</h4>
                      <p className="text-[11px] text-slate-500">Modül: {fc.suiteName}</p>

                      {fc.errorMessage && (
                        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 font-mono break-all">
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
                    <div className="col-span-2 p-12 text-center text-slate-400 bg-white dark:bg-[#141821] rounded-2xl border border-slate-200 dark:border-slate-800">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        Harika! Başarısız veya hata alan test senaryosu bulunmuyor.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* QA 2.3: CASES DETAILED TABLE */}
            {qaSubTab === 'CASES' && (
              <div className="rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-[#232b3b] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-500" />
                    <span>Test Senaryoları Listesi ({filteredCases.length})</span>
                  </h3>

                  <div className="flex items-center flex-wrap gap-2.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Senaryo veya kod ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
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
                    <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-xs">
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                        <th className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800">Kod</th>
                        <th className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800">Başlık</th>
                        <th className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800">Modül</th>
                        <th className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800">Öncelik</th>
                        <th className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800">Tip</th>
                        <th className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800">Yürütme</th>
                        <th className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800">Son Durum</th>
                        <th className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800">Jira Story / Bug</th>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};
