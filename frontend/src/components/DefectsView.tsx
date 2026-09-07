import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Project,
  TestCase,
  Defect,
  DefectStats,
  DefectStatus,
  DefectSeverity,
  CreateDefectDto,
  UpdateDefectDto,
  DefectsService,
} from '@/services/api';
import {
  Bug,
  Plus,
  Search,
  RefreshCw,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Kanban,
  List,
  BarChart3,
  User,
  Server,
  Monitor,
  Trash2,
  Eye,
  FileSpreadsheet,
  ArrowUpDown,
  Flame,
  Check,
  RotateCw,
} from 'lucide-react';
import { NewDefectModal } from './NewDefectModal';
import { DefectDetailModal } from './DefectDetailModal';
import { useCustomization } from '@/context/CustomizationContext';
import { ColumnCustomizerMenu } from './ColumnCustomizerMenu';
import { useNavigation } from '@/context/NavigationContext';

interface DefectsViewProps {
  selectedProject: Project | null;
  allCases?: TestCase[];
  onNavigateToCase?: (caseId: string) => void;
  onNavigateToRun?: (runId: string) => void;
  onDefectsCountChange?: (count: number) => void;
  initialSelectedDefect?: Defect | null;
  onClearInitialDefect?: () => void;
  onDefectsLoaded?: (defects: Defect[]) => void;
}

type ViewMode = 'LIST' | 'BOARD' | 'ANALYTICS';

export const DefectsView: React.FC<DefectsViewProps> = ({
  selectedProject,
  allCases = [],
  onNavigateToCase,
  onNavigateToRun,
  onDefectsCountChange,
  initialSelectedDefect = null,
  onClearInitialDefect,
  onDefectsLoaded,
}) => {
  const { pushState } = useNavigation();
  const { getVisibleColumns, getModuleConfig, getDensityClasses } = useCustomization();
  const visibleCols = getVisibleColumns('defects');
  const moduleConfig = getModuleConfig('defects');
  const densityCls = getDensityClasses(moduleConfig.density);

  const [defects, setDefects] = useState<Defect[]>([]);
  const [stats, setStats] = useState<DefectStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Keep callback refs stable to prevent re-render loops
  const onDefectsCountChangeRef = useRef(onDefectsCountChange);
  onDefectsCountChangeRef.current = onDefectsCountChange;

  const onDefectsLoadedRef = useRef(onDefectsLoaded);
  onDefectsLoadedRef.current = onDefectsLoaded;

  // Auto-open initialSelectedDefect when passed
  useEffect(() => {
    if (initialSelectedDefect) {
      setSelectedDefect(initialSelectedDefect);
      setIsDetailModalOpen(true);
    }
  }, [initialSelectedDefect?.id]);

  // Load defects and stats
  const fetchDefects = useCallback(async () => {
    if (!selectedProject?.id) return;
    try {
      setIsLoading(true);
      const [defectsData, statsData] = await Promise.all([
        DefectsService.getAllByProject(selectedProject.id),
        DefectsService.getStatsByProject(selectedProject.id),
      ]);
      setDefects(defectsData);
      setStats(statsData);
      onDefectsLoadedRef.current?.(defectsData);

      // Notify parent about active defect count (Open + In Progress + Reopened)
      if (onDefectsCountChangeRef.current) {
        const activeCount = defectsData.filter(
          (d) => d.status === 'OPEN' || d.status === 'IN_PROGRESS' || d.status === 'REOPENED'
        ).length;
        onDefectsCountChangeRef.current(activeCount);
      }
    } catch (err) {
      console.error('Failed to fetch defects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject?.id]);

  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);

  // Handle Sync from Failed Test Results
  const handleSyncFailed = async () => {
    if (!selectedProject) return;
    try {
      setIsSyncing(true);
      setSyncMessage(null);
      const result = await DefectsService.syncFromFailed(selectedProject.id);
      if (result.syncedCount > 0) {
        setSyncMessage({
          text: `Başarılı: Koşumlardan ${result.syncedCount} adet yeni hata kaydı merkezi listeye aktarıldı.`,
          type: 'success',
        });
      } else {
        setSyncMessage({
          text: 'Aktarılacak yeni başarısız test sonucu bulunamadı (Tüm başarısız sonuçlar zaten aktarılmış veya başarısız test yok).',
          type: 'info',
        });
      }
      await fetchDefects();
    } catch (err: any) {
      console.error('Failed to sync failed results:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Senkronizasyon sırasında bir hata oluştu.';
      setSyncMessage({
        text: `Senkronizasyon hatası: ${errorMsg}`,
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  // Handle Create Defect
  const handleCreateDefect = async (dto: CreateDefectDto) => {
    await DefectsService.create(dto);
    await fetchDefects();
  };

  // Handle Update Status
  const handleUpdateStatus = async (id: string, status: DefectStatus, resolutionNotes?: string) => {
    const updated = await DefectsService.updateStatus(id, status, resolutionNotes);
    setDefects((prev) => prev.map((d) => (d.id === id ? updated : d)));
    if (selectedDefect?.id === id) {
      setSelectedDefect(updated);
    }
    fetchDefects();
  };

  // Handle Update Details
  const handleUpdateDetails = async (id: string, data: UpdateDefectDto) => {
    const updated = await DefectsService.update(id, data);
    setDefects((prev) => prev.map((d) => (d.id === id ? updated : d)));
    if (selectedDefect?.id === id) {
      setSelectedDefect(updated);
    }
    fetchDefects();
  };

  // Handle Delete Defect
  const handleDeleteDefect = async (id: string) => {
    await DefectsService.delete(id);
    setDefects((prev) => prev.filter((d) => d.id !== id));
    fetchDefects();
  };

  // Filtered defects list
  const filteredDefects = useMemo(() => {
    return defects.filter((d) => {
      // Status filter
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      // Severity filter
      if (severityFilter !== 'ALL' && d.severity !== severityFilter) return false;
      // Environment filter
      if (environmentFilter !== 'ALL' && d.environment !== environmentFilter) return false;
      // Assignee filter
      if (assigneeFilter !== 'ALL') {
        if (assigneeFilter === 'UNASSIGNED' && d.assignedTo) return false;
        if (assigneeFilter !== 'UNASSIGNED' && d.assignedTo !== assigneeFilter) return false;
      }
      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesKey = d.key.toLowerCase().includes(q);
        const matchesTitle = d.title.toLowerCase().includes(q);
        const matchesDesc = (d.description || '').toLowerCase().includes(q);
        const matchesJira = (d.jiraBugKey || '').toLowerCase().includes(q);
        const matchesCase = d.testCase?.code?.toLowerCase().includes(q) || d.testCase?.title?.toLowerCase().includes(q);
        return matchesKey || matchesTitle || matchesDesc || matchesJira || Boolean(matchesCase);
      }
      return true;
    });
  }, [defects, statusFilter, severityFilter, environmentFilter, assigneeFilter, searchQuery]);

  // Unique assignees for filter
  const uniqueAssignees = useMemo(() => {
    const set = new Set<string>();
    defects.forEach((d) => {
      if (d.assignedTo) set.add(d.assignedTo);
    });
    return Array.from(set);
  }, [defects]);

  // Helper Severity styling
  const getSeverityBadge = (sev: DefectSeverity) => {
    switch (sev) {
      case 'BLOCKER':
        return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'MAJOR':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'MINOR':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'TRIVIAL':
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (st: DefectStatus) => {
    switch (st) {
      case 'OPEN':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
      case 'IN_PROGRESS':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'CLOSED':
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30';
      case 'REOPENED':
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30';
      case 'WONT_FIX':
        return 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30';
    }
  };

  const getStatusLabel = (st: DefectStatus) => {
    switch (st) {
      case 'OPEN':
        return 'AÇIK';
      case 'IN_PROGRESS':
        return 'İNCELENİYOR';
      case 'RESOLVED':
        return 'ÇÖZÜLDÜ';
      case 'CLOSED':
        return 'KAPATILDI';
      case 'REOPENED':
        return 'YENİDEN AÇILDI';
      case 'WONT_FIX':
        return 'DÜZELTİLMEYECEK';
    }
  };

  // Export to CSV Functionality
  const exportToCsv = () => {
    if (filteredDefects.length === 0) return;
    const BOM = '\uFEFF';
    const headers = [
      'Defect Kodu',
      'Başlık',
      'Önem Derecesi',
      'Durum',
      'Ortam',
      'Kanal',
      'İlişkili Test Senaryosu',
      'Jira Bug',
      'Atanan Kişi',
      'Raporlayan',
      'Oluşturulma Tarihi',
      'Çözülme Tarihi',
      'Çözüm Notları',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredDefects.map((d) => [
      escapeCsv(d.key),
      escapeCsv(d.title),
      escapeCsv(d.severity),
      escapeCsv(d.status),
      escapeCsv(d.environment || ''),
      escapeCsv(d.channel || ''),
      escapeCsv(d.testCase ? `${d.testCase.code} - ${d.testCase.title}` : ''),
      escapeCsv(d.jiraBugKey || ''),
      escapeCsv(d.assignedTo || ''),
      escapeCsv(d.reportedBy || ''),
      escapeCsv(d.createdAt ? new Date(d.createdAt).toLocaleString('tr-TR') : ''),
      escapeCsv(d.resolvedAt ? new Date(d.resolvedAt).toLocaleString('tr-TR') : ''),
      escapeCsv(d.resolutionNotes || ''),
    ]);

    const csvContent =
      BOM +
      [headers.map((h) => escapeCsv(h)).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `${selectedProject?.key || 'TCMS'}_Defects_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (!selectedProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-[#0c121e]">
        <div className="text-center max-w-md p-8 rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-slate-800 shadow-sm">
          <Bug className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Proje Seçiniz</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Defect ve hata kayıtlarını görüntülemek için üst menüden bir proje seçiniz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0c121e] overflow-hidden">
      {/* Top Header / Action Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0f141f]/80 backdrop-blur-md shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-700 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-900/20">
              <Bug className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Defect & Bulgu Takip Merkezi
                </h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {selectedProject.key}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Test koşumlarında tespit edilen bulguları, hata durumlarını ve çözüm süreçlerini merkezi olarak yönetin.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 flex-wrap">
            <ColumnCustomizerMenu moduleId="defects" />

            <button
              type="button"
              onClick={exportToCsv}
              disabled={filteredDefects.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-40"
              title="CSV / Excel Dışa Aktar"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel / CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-700 to-rose-500 hover:from-rose-800 hover:to-rose-600 shadow-md shadow-rose-900/25 active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Defect Aç</span>
            </button>
          </div>
        </div>

        {/* Sync Notification Banner */}
        {syncMessage && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 ${
              syncMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : syncMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              {syncMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : syncMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              )}
              <span>{syncMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Executive Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {/* 1. Total Defects */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Toplam Bulgu / Hata
              </span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {stats?.metrics.total ?? defects.length}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <Bug className="w-4.5 h-4.5" />
            </div>
          </div>

          {/* 2. Active Defects (Open + In Progress) */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Aktif (Açık & İncelenen)
              </span>
              <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                {stats?.metrics.active ?? 0}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>

          {/* 3. Blocker & Critical */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Kritik & Blocker Hatalar
              </span>
              <div className="text-xl font-extrabold text-red-600 dark:text-red-400 mt-0.5">
                {stats?.metrics.activeBlockerCritical ?? 0}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
              <Flame className="w-4.5 h-4.5" />
            </div>
          </div>

          {/* 4. Resolution Rate (%) */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Çözüm Oranı (%)
              </span>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                %{stats?.metrics.resolutionRate ?? 0}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        {/* View Switcher & Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* View Mode Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-white dark:bg-[#181f2c] text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Liste Görünümü</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('BOARD')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'BOARD'
                  ? 'bg-white dark:bg-[#181f2c] text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban Panosu</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('ANALYTICS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'ANALYTICS'
                  ? 'bg-white dark:bg-[#181f2c] text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>İstatistikler</span>
            </button>
          </div>

          {/* Search & Filter Dropdowns */}
          <div className="flex items-center space-x-2 flex-wrap flex-1 justify-end">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Hata ara (Kod, başlık, Jira)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="OPEN">Açık (Open)</option>
              <option value="IN_PROGRESS">İnceleniyor</option>
              <option value="RESOLVED">Çözüldü</option>
              <option value="CLOSED">Kapatıldı</option>
              <option value="REOPENED">Yeniden Açıldı</option>
              <option value="WONT_FIX">Düzeltilmeyecek</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">Tüm Önem Seviyeleri</option>
              <option value="BLOCKER">BLOCKER</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="MAJOR">MAJOR</option>
              <option value="MINOR">MINOR</option>
              <option value="TRIVIAL">TRIVIAL</option>
            </select>

            {/* Environment Filter */}
            <select
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none hidden xl:block"
            >
              <option value="ALL">Tüm Ortamlar</option>
              <option value="STAGING">STAGING</option>
              <option value="PROD">PROD</option>
              <option value="TEST">TEST</option>
              <option value="UAT">UAT</option>
              <option value="DEV">DEV</option>
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchDefects}
              disabled={isLoading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area Based on View Mode */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mb-3" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Defectler yükleniyor...
            </span>
          </div>
        ) : filteredDefects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
              <Bug className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {defects.length === 0 ? 'Henüz Defect Kaydı Yok' : 'Filtrelere Uygun Hata Bulunamadı'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
              {defects.length === 0
                ? 'Bu projede henüz bir hata kaydı açılmamış. Yeni bir kayıt açabilirsiniz.'
                : 'Arama veya filtre kriterlerinizi değiştirerek tekrar deneyiniz.'}
            </p>
            {defects.length === 0 && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-900/20 cursor-pointer"
                >
                  Yeni Defect Aç
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'LIST' ? (
          /* =======================================================
             1. LIST VIEW (Table with rich row cards)
             ======================================================= */
          <div className="bg-white dark:bg-[#141821] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-[#181f2c]/75 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    {visibleCols.map((col) => (
                      <th
                        key={col.id}
                        style={{ width: col.width || 'auto' }}
                        className={`${densityCls.pyTh} px-4 whitespace-nowrap text-${col.align || 'left'}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredDefects.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => {
                        setSelectedDefect(d);
                        setIsDetailModalOpen(true);
                      }}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      {visibleCols.map((col) => {
                        const alignClass = `text-${col.align || 'left'}`;

                        if (col.id === 'key') {
                          return (
                            <td key={col.id} className={`${densityCls.pyTd} px-4 font-mono font-black text-slate-900 dark:text-slate-100 whitespace-nowrap ${alignClass}`}>
                              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px]">
                                {d.key}
                              </span>
                            </td>
                          );
                        }

                        if (col.id === 'title') {
                          return (
                            <td key={col.id} className={`${densityCls.pyTd} px-4 max-w-xs ${alignClass}`}>
                              <p className="font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                {d.title}
                              </p>
                              {d.description && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {d.description}
                                </p>
                              )}
                            </td>
                          );
                        }

                        if (col.id === 'severity') {
                          return (
                            <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap ${alignClass}`}>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(d.severity)}`}>
                                {d.severity}
                              </span>
                            </td>
                          );
                        }

                        if (col.id === 'status') {
                          return (
                            <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap ${alignClass}`}>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(d.status)}`}>
                                {getStatusLabel(d.status)}
                              </span>
                            </td>
                          );
                        }

                        if (col.id === 'environment') {
                          return (
                            <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap ${alignClass}`}>
                              <span className="text-slate-600 dark:text-slate-400 font-medium">
                                {d.environment || 'STAGING'} &bull; {d.channel || 'WEB'}
                              </span>
                            </td>
                          );
                        }

                        if (col.id === 'testCase') {
                          return (
                            <td key={col.id} className={`${densityCls.pyTd} px-3 max-w-[150px] truncate ${alignClass}`}>
                              {d.testCase ? (
                                <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                  {d.testCase.code}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          );
                        }

                        if (col.id === 'assignedTo') {
                          return (
                            <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 ${alignClass}`}>
                              {d.assignedTo || <span className="text-slate-400 italic">Atanmamış</span>}
                            </td>
                          );
                        }

                        if (col.id === 'jiraBugKey') {
                          return (
                            <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap ${alignClass}`}>
                              {d.jiraBugKey ? (
                                <a
                                  href={d.jiraBugUrl || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center space-x-1 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <span>{d.jiraBugKey}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          );
                        }

                        if (col.id === 'reportedBy') {
                          return (
                            <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 ${alignClass}`}>
                              {d.reportedBy || 'QA Tester'}
                            </td>
                          );
                        }

                        if (col.id === 'createdAt') {
                          return (
                            <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px] ${alignClass}`}>
                              {new Date(d.createdAt).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                          );
                        }

                        if (col.id === 'actions') {
                          return (
                            <td key={col.id} className={`${densityCls.pyTd} px-4 text-right whitespace-nowrap ${alignClass}`}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDefect(d);
                                  setIsDetailModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Detayları İncele"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          );
                        }

                        return (
                          <td key={col.id} className={`${densityCls.pyTd} px-3 whitespace-nowrap ${alignClass}`}>
                            —
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : viewMode === 'BOARD' ? (
          /* =======================================================
             2. KANBAN BOARD VIEW
             ======================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as DefectStatus[]).map((colStatus) => {
              const colDefects = filteredDefects.filter((d) => {
                if (colStatus === 'OPEN') return d.status === 'OPEN' || d.status === 'REOPENED';
                if (colStatus === 'CLOSED') return d.status === 'CLOSED' || d.status === 'WONT_FIX';
                return d.status === colStatus;
              });

              return (
                <div
                  key={colStatus}
                  className="rounded-2xl bg-slate-100/70 dark:bg-[#141821] border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[calc(100vh-21rem)]"
                >
                  {/* Column Header */}
                  <div className="p-3 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-[#181f2c]/50 rounded-t-2xl">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        colStatus === 'OPEN' ? 'bg-rose-500' :
                        colStatus === 'IN_PROGRESS' ? 'bg-amber-500' :
                        colStatus === 'RESOLVED' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} />
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {getStatusLabel(colStatus)}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {colDefects.length}
                    </span>
                  </div>

                  {/* Column Cards List */}
                  <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                    {colDefects.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 italic">
                        Bu sütunda hata bulunmuyor
                      </div>
                    ) : (
                      colDefects.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            setSelectedDefect(d);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-3.5 rounded-xl bg-white dark:bg-[#1c2331] border border-slate-200/90 dark:border-slate-700/80 hover:border-rose-400 dark:hover:border-rose-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5"
                        >
                          {/* Card Top: Key & Severity */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                              {d.key}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(d.severity)}`}>
                              {d.severity}
                            </span>
                          </div>

                          {/* Card Title */}
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                            {d.title}
                          </h5>

                          {/* Card Bottom: Assignee, Env, Jira */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1 truncate max-w-[120px]">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{d.assignedTo || 'Atanmamış'}</span>
                            </div>

                            {d.jiraBugKey && (
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                {d.jiraBugKey}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* =======================================================
             3. ANALYTICS & CHARTS VIEW
             ======================================================= */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Severity Breakdown Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  Önem Derecesi (Severity) Dağılımı
                </h3>
                <div className="space-y-3">
                  {(['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL'] as DefectSeverity[]).map((sev) => {
                    const count = stats?.distributions.bySeverity[sev] ?? 0;
                    const total = stats?.metrics.total || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={sev} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">{sev}</span>
                          <span className="font-mono text-slate-900 dark:text-slate-100">
                            {count} (%{pct})
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sev === 'BLOCKER' ? 'bg-red-500' :
                              sev === 'CRITICAL' ? 'bg-rose-500' :
                              sev === 'MAJOR' ? 'bg-amber-500' :
                              sev === 'MINOR' ? 'bg-blue-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Breakdown Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Hata Durumu (Status) Dağılımı
                </h3>
                <div className="space-y-3">
                  {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'WONT_FIX'] as DefectStatus[]).map((st) => {
                    const count = stats?.distributions.byStatus[st] ?? 0;
                    const total = stats?.metrics.total || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={st} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">{getStatusLabel(st)}</span>
                          <span className="font-mono text-slate-900 dark:text-slate-100">
                            {count} (%{pct})
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              st === 'OPEN' ? 'bg-rose-500' :
                              st === 'IN_PROGRESS' ? 'bg-amber-500' :
                              st === 'RESOLVED' ? 'bg-emerald-500' :
                              st === 'CLOSED' ? 'bg-slate-500' :
                              st === 'REOPENED' ? 'bg-purple-500' : 'bg-zinc-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Channel & Environment Health Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Ortam Dağılımı
                </span>
                <div className="space-y-1 text-xs">
                  {Object.entries(stats?.distributions.byEnvironment || {}).map(([env, count]) => (
                    <div key={env} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{env}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Kanal / Platform Dağılımı
                </span>
                <div className="space-y-1 text-xs">
                  {Object.entries(stats?.distributions.byChannel || {}).map(([ch, count]) => (
                    <div key={ch} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{ch}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#141821] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Atanan Kişiler Dağılımı
                </span>
                <div className="space-y-1 text-xs">
                  {Object.entries(stats?.distributions.byAssignee || {}).map(([ass, count]) => (
                    <div key={ass} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{ass}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Defect Modal */}
      <NewDefectModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        projectId={selectedProject.id}
        projectName={selectedProject.name}
        projectKey={selectedProject.key}
        allCases={allCases}
        onSubmit={handleCreateDefect}
      />

      {/* Defect Detail Modal */}
      <DefectDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDefect(null);
          onClearInitialDefect?.();
        }}
        defect={selectedDefect}
        onUpdateStatus={handleUpdateStatus}
        onUpdateDetails={handleUpdateDetails}
        onDelete={handleDeleteDefect}
        onNavigateToCase={onNavigateToCase}
        onNavigateToRun={onNavigateToRun}
      />
    </div>
  );
};
