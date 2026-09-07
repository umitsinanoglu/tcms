'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Save,
  Check,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table,
  Columns,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  FolderKanban,
  FileCheck2,
  PlaySquare,
  Bug,
} from 'lucide-react';
import { useCustomization } from '@/context/CustomizationContext';
import { TableDensity, GridColumnConfig } from '@/services/api';

export type CustomModuleType = 'test-cases' | 'test-plans' | 'test-runs' | 'defects';

interface AdvancedFieldCustomizationModalProps {
  isOpen: boolean;
  initialModuleId?: CustomModuleType | string;
  onClose: () => void;
  onSaved?: () => void;
}

const MODULE_DEFINITIONS: { id: CustomModuleType; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
  { id: 'test-cases', label: 'Test Senaryoları', icon: FileCheck2, desc: 'Senaryo listesi & alanları' },
  { id: 'test-plans', label: 'Test Planları', icon: FolderKanban, desc: 'Plan & kapsam tablosu' },
  { id: 'test-runs', label: 'Test Koşumları', icon: PlaySquare, desc: 'Koşum geçmişi & metrikler' },
  { id: 'defects', label: 'Defektler & Hatalar', icon: Bug, desc: 'Hata kayıt listesi' },
];

const PREVIEW_DATA_MAP: Record<CustomModuleType, any[]> = {
  'test-cases': [
    { id: '1', code: 'TC-101', title: 'Bireysel Kullanıcı SMS OTP ile Giriş', module: 'Giriş & Kimlik Doğrulama', type: 'MOBILE', executionType: 'AUTOMATED', priority: 'CRITICAL', jiraStoryKey: 'TTB-1420', stepsCount: 6, lastResult: 'PASSED', updatedAt: 'Bugün 11:20' },
    { id: '2', code: 'TC-102', title: '7/24 FAST Anlık IBAN Para Transferi', module: 'Para Transferleri', type: 'WEB', executionType: 'MANUAL', priority: 'BLOCKER', jiraStoryKey: 'TTB-1890', stepsCount: 8, lastResult: 'PASSED', updatedAt: 'Dün 16:45' },
    { id: '3', code: 'TC-103', title: 'Kredi Kartı Borç Ödeme ve Ekstre İndirme', module: 'Kart İşlemleri', type: 'WEB', executionType: 'AUTOMATED', priority: 'NORMAL', jiraStoryKey: 'TTB-1945', stepsCount: 5, lastResult: 'FAILED', updatedAt: '26.08.2026' },
  ],
  'test-plans': [
    { id: '1', title: 'Mobil Bankacılık v2.4.0 Regresyon Planı', type: 'MOBILE', scope: 'Kredi Kartı & Para Transferleri', scenariosCount: 34, passRate: 94, status: 'ACTIVE', lastRun: 'Bugün 14:30' },
    { id: '2', title: 'Core Banking FAST & EFT Entegrasyonu', type: 'WEB', scope: 'FAST / Havale / Swift', scenariosCount: 18, passRate: 88, status: 'ACTIVE', lastRun: 'Dün 17:15' },
    { id: '3', title: 'Güvenlik & Penetrasyon Regresyon Paketi', type: 'API', scope: 'OAuth2 & Token Validation', scenariosCount: 12, passRate: 100, status: 'COMPLETED', lastRun: '28.08.2026' },
  ],
  'test-runs': [
    { id: '1', title: 'Sprint-24 iOS Nightly Regression Run', status: 'COMPLETED', environment: 'STAGING', version: 'v2.4.0', executedBy: 'Jenkins CI Bot', metrics: '24/24 Geçti (%100)', duration: '4dk 12s', createdAt: 'Bugün 03:00' },
    { id: '2', title: 'API Gateway Performans & Yük Testi', status: 'IN_PROGRESS', environment: 'DEV', version: 'v2.4.1-rc', executedBy: 'Ahmet Yılmaz', metrics: '15 Geçti, 1 Hata', duration: '12dk 40s', createdAt: 'Bugün 13:10' },
    { id: '3', title: 'Core Banking Swift Entegrasyon Koşumu', status: 'COMPLETED', environment: 'UAT', version: 'v2.3.9', executedBy: 'Zeynep Kaya', metrics: '18/18 Geçti (%100)', duration: '6dk 05s', createdAt: 'Dün 18:20' },
  ],
  'defects': [
    { id: '1', key: 'DEF-204', title: 'Kredi kartı limit artırımında HTTP 500 hatası', severity: 'CRITICAL', status: 'OPEN', assignedTo: 'Mehmet Kaya', reportedBy: 'Zeynep Arslan', environment: 'STAGING', channel: 'MOBILE', jiraBugKey: 'BUG-882', createdAt: 'Bugün 10:15' },
    { id: '2', key: 'DEF-205', title: 'Geçersiz IBAN formatında uyarı metni eksik', severity: 'MINOR', status: 'IN_PROGRESS', assignedTo: 'Ali Can', reportedBy: 'Caner Yılmaz', environment: 'UAT', channel: 'WEB', jiraBugKey: 'BUG-885', createdAt: 'Dün 15:40' },
    { id: '3', key: 'DEF-206', title: 'OTP SMS kodu 3 dakika sonra düşüyor', severity: 'BLOCKER', status: 'RESOLVED', assignedTo: 'Sistem Ekibi', reportedBy: 'Ahmet Yılmaz', environment: 'PROD', channel: 'MOBILE', jiraBugKey: 'BUG-890', createdAt: '25.08.2026' },
  ],
};

export const AdvancedFieldCustomizationModal: React.FC<AdvancedFieldCustomizationModalProps> = ({
  isOpen,
  initialModuleId = 'test-cases',
  onClose,
  onSaved,
}) => {
  const {
    getModuleConfig,
    toggleColumnVisibility,
    setColumnVisibility,
    updateColumn,
    moveColumnUp,
    moveColumnDown,
    setModuleDensity,
    setModuleSort,
    resetModuleToDefault,
    saveCustomizations,
    getDensityClasses,
  } = useCustomization();

  const [selectedModule, setSelectedModule] = useState<CustomModuleType>(() => {
    if (initialModuleId && ['test-cases', 'test-plans', 'test-runs', 'defects'].includes(initialModuleId)) {
      return initialModuleId as CustomModuleType;
    }
    return 'test-cases';
  });

  const [activeView, setActiveView] = useState<'COLUMNS' | 'PREVIEW'>('COLUMNS');
  const [searchFilter, setSearchFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  // Sync initial module when modal opens
  useEffect(() => {
    if (isOpen && initialModuleId && ['test-cases', 'test-plans', 'test-runs', 'defects'].includes(initialModuleId)) {
      setSelectedModule(initialModuleId as CustomModuleType);
    }
  }, [isOpen, initialModuleId]);

  // ESC key listener to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentModuleConfig = getModuleConfig(selectedModule);
  const sortedColumns = [...currentModuleConfig.columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const visibleCount = sortedColumns.filter((c) => c.visible).length;
  const densityCls = getDensityClasses(currentModuleConfig.density);

  const filteredColumns = sortedColumns.filter(
    (c) =>
      c.label.toLowerCase().includes(searchFilter.toLowerCase().trim()) ||
      (c.defaultLabel && c.defaultLabel.toLowerCase().includes(searchFilter.toLowerCase().trim())) ||
      c.id.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const showNotification = (type: 'SUCCESS' | 'ERROR', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveCustomizations();
      showNotification('SUCCESS', 'Alan yapılandırması başarıyla kaydedildi ve uygulandı.');
      if (onSaved) onSaved();
    } catch (err) {
      showNotification('ERROR', 'Yapılandırma kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        `'${currentModuleConfig.moduleName}' tablosunu varsayılan fabrika kolon ve görünüm düzenine döndürmek istediğinize emin misiniz?`
      )
    ) {
      return;
    }
    try {
      await resetModuleToDefault(selectedModule);
      showNotification('SUCCESS', `${currentModuleConfig.moduleName} kolonları varsayılana sıfırlandı.`);
    } catch {
      showNotification('ERROR', 'Sıfırlama işlemi başarısız oldu.');
    }
  };

  const previewRows = PREVIEW_DATA_MAP[selectedModule] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150 font-sans">
      <div className="bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-800/90 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* 1. MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#121926]/70">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center border border-[var(--accent-primary)]/20 shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Gelişmiş Alan & Tablo Yapılandırması
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                  {currentModuleConfig.moduleName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grid kolonlarını, başlıklarını, genişliklerini, sıralamasını ve yoğunluğunu anında özelleştirin.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Kapat (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. MODULE NAVIGATION PILLS */}
        <div className="px-6 pt-3 pb-3 border-b border-slate-200/70 dark:border-slate-800 bg-slate-100/50 dark:bg-[#141c2b]/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MODULE_DEFINITIONS.map((m) => {
              const isSelected = selectedModule === m.id;
              const IconComp = m.icon;
              const cfg = getModuleConfig(m.id);
              const visible = cfg.columns.filter((c) => c.visible).length;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModule(m.id)}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-slate-900 dark:text-white shadow-xs ring-1 ring-[var(--accent-primary)]/40'
                      : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <IconComp
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[var(--accent-primary)]' : 'text-slate-400'
                      }`}
                    />
                    <div className="truncate">
                      <div className="font-bold text-xs truncate">{m.label}</div>
                      <div className="text-[10px] opacity-70 truncate">{m.desc}</div>
                    </div>
                  </div>
                  <span
                    className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {visible}/{cfg.columns.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. SUB-HEADER BAR: PREFERENCES & VIEW TABS */}
        <div className="px-6 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#161f30] flex flex-wrap items-center justify-between gap-3">
          {/* View Mode Switcher: Kolon Yapılandırması vs Canlı Önizleme */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveView('COLUMNS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeView === 'COLUMNS'
                  ? 'bg-white dark:bg-slate-800 text-[var(--accent-primary)] shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kolon & Alan Ayarları ({visibleCount}/{sortedColumns.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('PREVIEW')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeView === 'PREVIEW'
                  ? 'bg-white dark:bg-slate-800 text-[var(--accent-primary)] shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Canlı Tablo Önizlemesi</span>
            </button>
          </div>

          {/* Table Density & Sorting Preferences */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Satır Yoğunluğu */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Yoğunluk:</span>
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg">
                {(
                  [
                    { id: 'compact' as const, label: 'Kompakt' },
                    { id: 'normal' as const, label: 'Standart' },
                    { id: 'comfortable' as const, label: 'Rahat' },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setModuleDensity(selectedModule, d.id)}
                    className={`py-1 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      currentModuleConfig.density === d.id
                        ? 'bg-white dark:bg-slate-800 text-[var(--accent-primary)] shadow-xs font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Varsayılan Sıralama */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Sırala:</span>
              <select
                value={currentModuleConfig.defaultSortBy || ''}
                onChange={(e) =>
                  setModuleSort(selectedModule, e.target.value, currentModuleConfig.defaultSortOrder || 'desc')
                }
                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              >
                {sortedColumns
                  .filter((c) => c.sortable)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
              </select>
              <select
                value={currentModuleConfig.defaultSortOrder || 'desc'}
                onChange={(e) =>
                  setModuleSort(
                    selectedModule,
                    currentModuleConfig.defaultSortBy || 'createdAt',
                    e.target.value as 'asc' | 'desc'
                  )
                }
                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              >
                <option value="desc">Azalan (↓)</option>
                <option value="asc">Artan (↑)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. MODAL BODY (SCROLLABLE) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeView === 'COLUMNS' ? (
            <div className="space-y-3">
              {/* Search & Bulk Visibility Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Kolon başlığı veya alan adı ara..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      sortedColumns.forEach((c) => !c.isSystem && setColumnVisibility(selectedModule, c.id, true))
                    }
                    className="inline-flex items-center space-x-1 text-[var(--accent-primary)] hover:underline font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Tümünü Aç</span>
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                  <button
                    type="button"
                    onClick={() =>
                      sortedColumns.forEach((c) => !c.isSystem && setColumnVisibility(selectedModule, c.id, false))
                    }
                    className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Tümünü Kapat</span>
                  </button>
                </div>
              </div>

              {/* Columns Configuration Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-[#18202e] border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">Sıra</th>
                      <th className="py-2.5 px-3 w-16 text-center">Görünüm</th>
                      <th className="py-2.5 px-4 min-w-[200px]">Görünen Başlık (Custom Label)</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Orijinal Alan ID</th>
                      <th className="py-2.5 px-3 w-28 text-center">Genişlik</th>
                      <th className="py-2.5 px-3 w-28 text-center">Hizalama</th>
                      <th className="py-2.5 px-3 w-24 text-center">Sıra Değiştir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-medium">
                    {filteredColumns.map((col, idx) => {
                      const originalIdx = sortedColumns.findIndex((c) => c.id === col.id);
                      const isFirst = originalIdx === 0;
                      const isLast = originalIdx === sortedColumns.length - 1;

                      return (
                        <tr
                          key={col.id}
                          className={`transition-colors ${
                            col.visible
                              ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                              : 'bg-slate-50/40 dark:bg-slate-900/30 text-slate-400 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {/* 1. Sıra No */}
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                            #{originalIdx + 1}
                          </td>

                          {/* 2. Görünürlük Checkbox / Switch */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={col.visible}
                              disabled={col.isSystem}
                              onChange={() => toggleColumnVisibility(selectedModule, col.id)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/30 cursor-pointer disabled:opacity-40"
                              title={col.isSystem ? 'Sistem zorunlu kolonu gizlenemez' : 'Görünürlüğü aç/kapat'}
                            />
                          </td>

                          {/* 3. Görünen Başlık (Editable Input) */}
                          <td className="py-2.5 px-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={col.label}
                                onChange={(e) =>
                                  updateColumn(selectedModule, col.id, { label: e.target.value })
                                }
                                placeholder={col.defaultLabel || col.id}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                              />
                              {col.isSystem && (
                                <span title="Sistem zorunlu kolonu">
                                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 4. Orijinal Alan ve Açıklama */}
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                            <div className="flex flex-col">
                              <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                {col.id}
                              </span>
                              <span
                                className="text-[10px] text-slate-400 truncate max-w-xs"
                                title={col.description || col.defaultLabel}
                              >
                                {col.description || col.defaultLabel}
                              </span>
                            </div>
                          </td>

                          {/* 5. Genişlik Seçici */}
                          <td className="py-2.5 px-3 text-center">
                            <select
                              value={col.width || 'auto'}
                              onChange={(e) =>
                                updateColumn(selectedModule, col.id, { width: e.target.value })
                              }
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                            >
                              <option value="auto">Esnek / Otomatik</option>
                              <option value="80px">Dar (80px)</option>
                              <option value="110px">Orta (110px)</option>
                              <option value="150px">Geniş (150px)</option>
                              <option value="220px">Çok Geniş (220px)</option>
                              <option value="280px">Geniş Metin (280px)</option>
                              <option value="28%">Oransal (%28)</option>
                            </select>
                          </td>

                          {/* 6. Hizalama */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => updateColumn(selectedModule, col.id, { align: 'left' })}
                                className={`p-1 rounded cursor-pointer ${
                                  (col.align || 'left') === 'left'
                                    ? 'bg-white dark:bg-slate-800 text-[var(--accent-primary)] shadow-xs font-bold'
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                                title="Sola Hizala"
                              >
                                <AlignLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateColumn(selectedModule, col.id, { align: 'center' })}
                                className={`p-1 rounded cursor-pointer ${
                                  col.align === 'center'
                                    ? 'bg-white dark:bg-slate-800 text-[var(--accent-primary)] shadow-xs font-bold'
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                                title="Ortala"
                              >
                                <AlignCenter className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateColumn(selectedModule, col.id, { align: 'right' })}
                                className={`p-1 rounded cursor-pointer ${
                                  col.align === 'right'
                                    ? 'bg-white dark:bg-slate-800 text-[var(--accent-primary)] shadow-xs font-bold'
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                                title="Sağa Hizala"
                              >
                                <AlignRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* 7. Sıralama Yukarı / Aşağı */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center space-x-1">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => moveColumnUp(selectedModule, col.id)}
                                className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 disabled:opacity-20 transition-colors cursor-pointer"
                                title="Yukarı Taşı"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => moveColumnDown(selectedModule, col.id)}
                                className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 disabled:opacity-20 transition-colors cursor-pointer"
                                title="Aşağı Taşı"
                              >
                                <ArrowDown className="w-3 h-3" />
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
          ) : (
            /* LIVE INTERACTIVE PREVIEW */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Canlı Tablo Önizlemesi ({currentModuleConfig.moduleName})
                  </h3>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    {visibleCount} Kolon Görünür
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                    Yoğunluk: {currentModuleConfig.density.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-50/50 dark:bg-[#151c28] rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-200/70 dark:bg-[#192233] border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold tracking-wider uppercase text-[10px]">
                    <tr>
                      {sortedColumns
                        .filter((c) => c.visible)
                        .map((col) => (
                          <th
                            key={col.id}
                            style={{ width: col.width || 'auto' }}
                            className={`${densityCls.pyTh} px-3 whitespace-nowrap text-${col.align || 'left'}`}
                          >
                            {col.label}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/80 font-medium">
                    {previewRows.map((row: any, rIdx: number) => (
                      <tr
                        key={row.id || rIdx}
                        className="hover:bg-white dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {sortedColumns
                          .filter((c) => c.visible)
                          .map((col) => {
                            const val = row[col.id];
                            const alignClass = `text-${col.align || 'left'}`;

                            return (
                              <td
                                key={col.id}
                                className={`${densityCls.pyTd} px-3 whitespace-nowrap ${alignClass} ${densityCls.textClass}`}
                              >
                                {col.id === 'title' ? (
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {val || '—'}
                                  </span>
                                ) : col.id === 'code' || col.id === 'key' ? (
                                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {val}
                                  </span>
                                ) : col.id === 'status' || col.id === 'lastResult' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    {val || 'AKTİF'}
                                  </span>
                                ) : col.id === 'priority' || col.id === 'severity' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    {val || 'NORMAL'}
                                  </span>
                                ) : col.id === 'actions' ? (
                                  <span className="text-[11px] text-slate-400 italic">İşlem Butonları</span>
                                ) : (
                                  <span className="text-slate-700 dark:text-slate-300">
                                    {val !== undefined ? String(val) : '—'}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 5. MODAL FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-[#121926]/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer shadow-xs"
              title="Geçerli modülü fabrika varsayılanlarına döndür"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Varsayılana Sıfırla</span>
            </button>

            {toastMessage && (
              <div
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold animate-in fade-in duration-200 ${
                  toastMessage.type === 'SUCCESS'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {toastMessage.type === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{toastMessage.text}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
            >
              Kapat
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-accent-gradient text-white text-xs font-semibold shadow-md shadow-[var(--accent-dark)]/25 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet & Uygula'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
