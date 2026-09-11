'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SettingsService, SystemStatus, Project } from '@/services/api';
import {
  GitBranch,
  GitCommit,
  Activity,
  Database,
  Server,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Check,
  Cpu,
  Clock,
  Bug,
  PlayCircle,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface StatusBarProps {
  selectedProject?: Project | null;
  casesCount?: number;
  runsCount?: number;
  defectsCount?: number;
  onNavigateToTab?: (tab: any) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  selectedProject,
  casesCount,
  runsCount,
  defectsCount,
  onNavigateToTab,
}) => {
  // Status bar visibility and collapse state persisted in localStorage
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [statusData, setStatusData] = useState<SystemStatus | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGitPopoverOpen, setIsGitPopoverOpen] = useState<boolean>(false);
  const [copiedBranch, setCopiedBranch] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const gitPopoverRef = useRef<HTMLDivElement>(null);

  // Read initial visibility preference
  useEffect(() => {
    try {
      const savedVisible = localStorage.getItem('tcms_statusbar_visible');
      if (savedVisible !== null) {
        setIsVisible(savedVisible === 'true');
      }
      const savedCollapsed = localStorage.getItem('tcms_statusbar_collapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(savedCollapsed === 'true');
      }
    } catch (e) {
      // ignore
    }

    // Listen to custom toggle events from Header or Settings
    const handleToggleEvent = (e: any) => {
      if (typeof e.detail?.visible === 'boolean') {
        setIsVisible(e.detail.visible);
        try {
          localStorage.setItem('tcms_statusbar_visible', String(e.detail.visible));
        } catch (err) {
          // ignore
        }
      }
      if (typeof e.detail?.collapsed === 'boolean') {
        setIsCollapsed(e.detail.collapsed);
        try {
          localStorage.setItem('tcms_statusbar_collapsed', String(e.detail.collapsed));
        } catch (err) {
          // ignore
        }
      }
    };

    window.addEventListener('tcms:statusbar-toggle', handleToggleEvent);
    return () => {
      window.removeEventListener('tcms:statusbar-toggle', handleToggleEvent);
    };
  }, []);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gitPopoverRef.current && !gitPopoverRef.current.contains(event.target as Node)) {
        setIsGitPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch status metrics
  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const data = await SettingsService.getSystemStatus();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setStatusData(data);
      setLastChecked(new Date());
    } catch (err) {
      console.warn('System status fetch failed:', err);
      setLatency(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling every 45 seconds or on mount
  useEffect(() => {
    if (!isVisible) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, 45000);
    return () => clearInterval(interval);
  }, [fetchStatus, isVisible]);

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('tcms_statusbar_collapsed', String(next));
    } catch (err) {
      // ignore
    }
    window.dispatchEvent(
      new CustomEvent('tcms:statusbar-state-changed', {
        detail: { visible: isVisible, collapsed: next },
      })
    );
  };

  const handleClose = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('tcms_statusbar_visible', 'false');
    } catch (err) {
      // ignore
    }
    window.dispatchEvent(
      new CustomEvent('tcms:statusbar-state-changed', {
        detail: { visible: false, collapsed: isCollapsed },
      })
    );
  };

  const handleCopyBranch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (statusData?.git?.branch) {
      navigator.clipboard.writeText(statusData.git.branch);
      setCopiedBranch(true);
      setTimeout(() => setCopiedBranch(false), 2000);
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds && seconds !== 0) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}g ${h}s`;
    if (h > 0) return `${h}s ${m}d`;
    if (m > 0) return `${m}d ${s}sn`;
    return `${s}sn`;
  };

  if (!isVisible) {
    return null;
  }

  // Floating Minimized Pill in bottom-right corner
  if (isCollapsed) {
    return (
      <div
        className="fixed bottom-2 right-4 z-40 flex items-center gap-2 px-3 py-1 rounded-full border shadow-lg text-[11px] font-mono cursor-pointer transition-all duration-200 select-none bg-[#141821]/95 text-slate-300 border-[#2e3748] hover:border-[#b83a4b]/60 hover:text-white backdrop-blur-md"
        onClick={handleToggleCollapse}
        title="Durum Çubuğunu Genişlet"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <GitBranch className="w-3 h-3 text-[#b83a4b]" />
        <span className="max-w-[130px] truncate font-medium">
          {statusData?.git?.branch || 'git'}
        </span>
        {latency !== null && (
          <span className="text-slate-400 text-[10px]">⚡{latency}ms</span>
        )}
        <ChevronUp className="w-3 h-3 text-slate-400 hover:text-white" />
      </div>
    );
  }

  const isOnline = statusData?.status === 'healthy';
  const branchName = statusData?.git?.branch || 'yükleniyor...';
  const commitHash = statusData?.git?.commit || '---';

  return (
    <footer
      role="contentinfo"
      aria-label="Sistem ve Geliştirici Durum Çubuğu"
      className="h-7 shrink-0 flex items-center justify-between px-3 text-[11px] font-mono select-none border-t transition-colors duration-200 bg-[#141821] text-slate-400 border-[#232936] dark:bg-[#0d1117] dark:border-[#21262d] dark:text-slate-400 shadow-enterprise-xs z-30"
    >
      {/* Sol Bölüm: Sistem Durumu, DB, Aktif Proje ve Sayaçlar */}
      <div className="flex items-center gap-3 overflow-hidden min-w-0">
        {/* Canlı Bağlantı Durumu */}
        <div
          className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors shrink-0"
          onClick={fetchStatus}
          title={`Son kontrol: ${lastChecked.toLocaleTimeString('tr-TR')} (Yenilemek için tıkla)`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                : 'bg-rose-400 animate-pulse'
            }`}
          />
          <span className="font-semibold text-[10.5px] uppercase tracking-wider text-slate-300">
            {isOnline ? 'ÇEVRİMİÇİ' : 'BAĞLANTI YOK'}
          </span>
        </div>

        {/* DB Latency */}
        <div
          className="hidden sm:flex items-center gap-1 text-slate-400 shrink-0 border-l border-[#2e3748] pl-2.5"
          title="Veritabanı Sağlığı & Sorgu Gecikmesi"
        >
          <Database className="w-3 h-3 text-cyan-400" />
          <span>DB:</span>
          <span
            className={`font-semibold ${
              (statusData?.database?.latencyMs ?? 0) < 50
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {statusData?.database?.latencyMs !== undefined && statusData.database.latencyMs >= 0
              ? `${statusData.database.latencyMs}ms`
              : '---'}
          </span>
        </div>

        {/* Aktif Proje Rozeti */}
        {selectedProject && (
          <div
            className="hidden md:flex items-center gap-1.5 shrink-0 border-l border-[#2e3748] pl-2.5 text-slate-300"
            title={`Aktif Proje: ${selectedProject.name}`}
          >
            <FolderKanban className="w-3 h-3 text-[#b83a4b]" />
            <span className="px-1.5 py-0.2 rounded bg-[#b83a4b]/15 text-[#e57373] text-[10px] font-semibold border border-[#b83a4b]/30">
              {selectedProject.key}
            </span>
            <span className="max-w-[140px] truncate text-slate-300 text-[10.5px]">
              {selectedProject.name}
            </span>
          </div>
        )}

        {/* Test Metrik Sayaçları */}
        <div className="hidden lg:flex items-center gap-2.5 border-l border-[#2e3748] pl-2.5 text-[10px] text-slate-400">
          <span
            className="flex items-center gap-1 hover:text-slate-200 cursor-pointer"
            onClick={() => onNavigateToTab?.('EXPLORER')}
            title="Toplam Senaryo Sayısı"
          >
            <CheckCircle2 className="w-2.8 h-2.8 text-emerald-400" />
            <span>TC:</span>
            <strong className="text-slate-200">
              {casesCount ?? statusData?.counts?.testCases ?? 0}
            </strong>
          </span>

          <span
            className="flex items-center gap-1 hover:text-slate-200 cursor-pointer"
            onClick={() => onNavigateToTab?.('RUNS')}
            title="Aktif ve Toplam Test Koşumları"
          >
            <PlayCircle className="w-2.8 h-2.8 text-sky-400" />
            <span>Koşum:</span>
            <strong className="text-slate-200">
              {statusData?.counts?.activeRuns ? `${statusData.counts.activeRuns} aktif / ` : ''}
              {runsCount ?? statusData?.counts?.testRuns ?? 0}
            </strong>
          </span>

          <span
            className="flex items-center gap-1 hover:text-slate-200 cursor-pointer"
            onClick={() => onNavigateToTab?.('DEFECTS')}
            title="Açık Kusur / Hata Sayısı"
          >
            <Bug className="w-2.8 h-2.8 text-rose-400" />
            <span>Kusur:</span>
            <strong
              className={
                (defectsCount ?? statusData?.counts?.openDefects ?? 0) > 0
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }
            >
              {defectsCount ?? statusData?.counts?.openDefects ?? 0}
            </strong>
          </span>
        </div>
      </div>

      {/* Orta Bölüm: Donanım & Performans Metrikleri */}
      <div className="hidden xl:flex items-center gap-3 text-slate-400 text-[10px]">
        {/* RAM */}
        {statusData?.server?.memory && (
          <span className="flex items-center gap-1" title="Backend Heap Bellek Kullanımı">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>RAM:</span>
            <span className="text-slate-200 font-semibold">
              {statusData.server.memory.heapUsedMB} MB
            </span>
          </span>
        )}

        {/* Uptime */}
        {statusData?.server?.uptimeSeconds !== undefined && (
          <span className="flex items-center gap-1" title="Sunucu Çalışma Süresi (Uptime)">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Uptime:</span>
            <span className="text-slate-200">{formatUptime(statusData.server.uptimeSeconds)}</span>
          </span>
        )}

        {/* Ping / Latency */}
        {latency !== null && (
          <span
            className="flex items-center gap-1 cursor-pointer hover:text-slate-200 transition-colors"
            onClick={fetchStatus}
            title="API Gecikme Süresi (Yenilemek için tıkla)"
          >
            <Zap className="w-3 h-3 text-amber-300" />
            <span>Ping:</span>
            <span
              className={`font-semibold ${
                latency < 30
                  ? 'text-emerald-400'
                  : latency < 80
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {latency}ms
            </span>
          </span>
        )}

        {/* Refresh Icon */}
        <button
          onClick={fetchStatus}
          disabled={isLoading}
          className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          title="Metrikleri Hemen Güncelle"
        >
          <RefreshCw className={`w-2.8 h-2.8 ${isLoading ? 'animate-spin text-[#b83a4b]' : ''}`} />
        </button>
      </div>

      {/* Sağ Bölüm: [DEV] Rozeti, Git Branch & Commit, Detay Popover'ı, Minimize/Kapat */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Environment Badge */}
        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          {statusData?.server?.environment === 'production' ? 'PROD' : 'DEV'}
        </span>

        {/* Git Branch & Commit Container (Tıklanabilir Popover) */}
        <div className="relative" ref={gitPopoverRef}>
          <button
            onClick={() => setIsGitPopoverOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all duration-150 border ${
              isGitPopoverOpen
                ? 'bg-[#b83a4b]/20 border-[#b83a4b]/50 text-white'
                : 'bg-[#1d232f] hover:bg-[#262e3d] border-[#2e3748] text-slate-300 hover:text-white'
            }`}
            title="Git Bilgileri ve Commit Detayları"
          >
            <GitBranch className="w-3 h-3 text-[#b83a4b]" />
            <span className="font-semibold text-slate-200 max-w-[130px] sm:max-w-[200px] md:max-w-[240px] truncate">
              {branchName}
            </span>
            <GitCommit className="w-2.8 h-2.8 text-slate-400 ml-0.5" />
            <span className="text-slate-400 font-mono">{commitHash}</span>
            {statusData?.git?.isDirty && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5"
                title="Çalışma ağacında kaydedilmemiş değişiklikler var"
              />
            )}
          </button>

          {/* Git Detay Açılır Popover Kartı */}
          {isGitPopoverOpen && (
            <div className="absolute bottom-8 right-0 w-80 rounded-xl bg-[#1d232f] border border-[#2e3748] shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-3 text-xs z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#2e3748]">
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <GitBranch className="w-3.5 h-3.5 text-[#b83a4b]" />
                  <span>Git Repository Durumu</span>
                </div>
                <button
                  onClick={() => setIsGitPopoverOpen(false)}
                  className="text-slate-400 hover:text-white p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-2.5 space-y-2">
                {/* Branch */}
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold flex items-center justify-between">
                    <span>Aktif Branch</span>
                    <button
                      onClick={handleCopyBranch}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#b83a4b] transition-colors"
                      title="Branch adını kopyala"
                    >
                      {copiedBranch ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-emerald-400">Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-0.5 px-2 py-1 rounded bg-[#141821] border border-[#2e3748] text-white font-mono text-[11px] truncate">
                    {statusData?.git?.branch || '---'}
                  </div>
                </div>

                {/* Commit */}
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">
                    Son Commit
                  </div>
                  <div className="mt-0.5 px-2 py-1.5 rounded bg-[#141821] border border-[#2e3748]">
                    <div className="flex items-center gap-1.5 text-slate-200 font-mono text-[11px]">
                      <GitCommit className="w-3 h-3 text-[#b83a4b]" />
                      <strong>{statusData?.git?.commit || '---'}</strong>
                      {statusData?.git?.commitDate && (
                        <span className="text-[10px] text-slate-400 ml-auto">
                          ({statusData.git.commitDate})
                        </span>
                      )}
                    </div>
                    {statusData?.git?.commitMessage && (
                      <p className="mt-1 text-[10.5px] text-slate-300 line-clamp-2 leading-relaxed font-sans">
                        {statusData.git.commitMessage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Working Tree Durumu */}
                <div className="flex items-center justify-between pt-1 border-t border-[#2e3748] text-[11px]">
                  <span className="text-slate-400">Çalışma Ağacı:</span>
                  {statusData?.git?.isDirty ? (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Değişiklikler Mevcut (Dirty)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Temiz (Clean)
                    </span>
                  )}
                </div>

                {/* Node & Versiyon */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>Node: {statusData?.server?.nodeVersion || '---'}</span>
                  <span>Sürüm: {statusData?.version || 'v2.4.0'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Minimize / Expand Toggle Button */}
        <button
          onClick={handleToggleCollapse}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#262e3d] transition-colors"
          title="Durum Çubuğunu Küçült (Sağ alt köşeye gizle)"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* Tam Kapatma (Ayarlardan tekrar açılabilir) */}
        <button
          onClick={handleClose}
          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Durum Çubuğunu Kapat (Ayarlar ekranından tekrar açabilirsiniz)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
