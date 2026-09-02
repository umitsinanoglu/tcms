import React, { useState, useEffect } from 'react';
import {
  Defect,
  DefectStatus,
  DefectSeverity,
  UpdateDefectDto,
} from '@/services/api';
import {
  X,
  Bug,
  AlertTriangle,
  Server,
  Monitor,
  ExternalLink,
  User,
  Clock,
  CheckCircle2,
  PlayCircle,
  XCircle,
  RotateCcw,
  Trash2,
  Edit3,
  Save,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';

interface DefectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defect: Defect | null;
  onUpdateStatus: (id: string, status: DefectStatus, resolutionNotes?: string) => Promise<void>;
  onUpdateDetails: (id: string, data: UpdateDefectDto) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNavigateToCase?: (caseId: string) => void;
  onNavigateToRun?: (runId: string) => void;
}

export const DefectDetailModal: React.FC<DefectDetailModalProps> = ({
  isOpen,
  onClose,
  defect,
  onUpdateStatus,
  onUpdateDetails,
  onDelete,
  onNavigateToCase,
  onNavigateToRun,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<DefectSeverity>('MAJOR');
  const [status, setStatus] = useState<DefectStatus>('OPEN');
  const [environment, setEnvironment] = useState('STAGING');
  const [channel, setChannel] = useState('WEB');
  const [assignedTo, setAssignedTo] = useState('');
  const [jiraBugKey, setJiraBugKey] = useState('');
  const [jiraBugUrl, setJiraBugUrl] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResolutionBox, setShowResolutionBox] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<DefectStatus | null>(null);

  useEffect(() => {
    if (defect) {
      setTitle(defect.title);
      setDescription(defect.description || '');
      setSeverity(defect.severity);
      setStatus(defect.status);
      setEnvironment(defect.environment || 'STAGING');
      setChannel(defect.channel || 'WEB');
      setAssignedTo(defect.assignedTo || '');
      setJiraBugKey(defect.jiraBugKey || '');
      setJiraBugUrl(defect.jiraBugUrl || '');
      setResolutionNotes(defect.resolutionNotes || '');
      setIsEditing(false);
      setShowResolutionBox(false);
      setPendingStatusChange(null);
    }
  }, [defect]);

  if (!isOpen || !defect) return null;

  const getSeverityBadge = (sev: DefectSeverity) => {
    switch (sev) {
      case 'BLOCKER':
        return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30';
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
      case 'MAJOR':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'MINOR':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case 'TRIVIAL':
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30';
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

  const handleQuickStatus = async (newStatus: DefectStatus) => {
    if (newStatus === 'RESOLVED' || newStatus === 'CLOSED' || newStatus === 'WONT_FIX') {
      setPendingStatusChange(newStatus);
      setShowResolutionBox(true);
      return;
    }

    try {
      setIsSaving(true);
      await onUpdateStatus(defect.id, newStatus);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmResolution = async () => {
    if (!pendingStatusChange) return;
    try {
      setIsSaving(true);
      await onUpdateStatus(defect.id, pendingStatusChange, resolutionNotes);
      setShowResolutionBox(false);
      setPendingStatusChange(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDetails = async () => {
    try {
      setIsSaving(true);
      await onUpdateDetails(defect.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
        environment,
        channel,
        assignedTo: assignedTo.trim() || undefined,
        jiraBugKey: jiraBugKey.trim() || undefined,
        jiraBugUrl: jiraBugUrl.trim() || undefined,
        resolutionNotes: resolutionNotes.trim() || undefined,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${defect.key}: ${defect.title}" kaydını silmek istediğinize emin misiniz?`)) {
      return;
    }
    try {
      setIsDeleting(true);
      await onDelete(defect.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#181f2c] border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#141821]/80">
          <div className="flex items-center space-x-3 min-w-0 flex-1 pr-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-700 to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-900/20 shrink-0">
              <Bug className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100">
                  {defect.key}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(defect.severity)}`}>
                  {defect.severity}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(defect.status)}`}>
                  {getStatusLabel(defect.status)}
                </span>
                {defect.jiraBugKey && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    Jira: {defect.jiraBugKey}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                Proje: <span className="font-semibold text-slate-700 dark:text-slate-200">{defect.project?.name}</span>
                {defect.reportedBy && ` • Raporlayan: ${defect.reportedBy}`}
                {defect.createdAt && ` • ${new Date(defect.createdAt).toLocaleString('tr-TR')}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isEditing ? 'Düzenlemeyi İptal Et' : 'Düzenle'}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Defect Kaydını Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Status Bar */}
        <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-[#11151f] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
            Durum Geçişleri:
          </span>
          <div className="flex items-center space-x-1.5 flex-wrap">
            {defect.status !== 'IN_PROGRESS' && defect.status !== 'RESOLVED' && defect.status !== 'CLOSED' && (
              <button
                type="button"
                onClick={() => handleQuickStatus('IN_PROGRESS')}
                disabled={isSaving}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>İncelemeye Al</span>
              </button>
            )}

            {defect.status !== 'RESOLVED' && defect.status !== 'CLOSED' && (
              <button
                type="button"
                onClick={() => handleQuickStatus('RESOLVED')}
                disabled={isSaving}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Çözüldü İşaretle</span>
              </button>
            )}

            {defect.status !== 'CLOSED' && (
              <button
                type="button"
                onClick={() => handleQuickStatus('CLOSED')}
                disabled={isSaving}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Kapat</span>
              </button>
            )}

            {(defect.status === 'RESOLVED' || defect.status === 'CLOSED' || defect.status === 'WONT_FIX') && (
              <button
                type="button"
                onClick={() => handleQuickStatus('REOPENED')}
                disabled={isSaving}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yeniden Aç</span>
              </button>
            )}
          </div>
        </div>

        {/* Resolution Prompt Box (Conditional) */}
        {showResolutionBox && (
          <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-500/30 space-y-2.5 animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Defect Durumu "{getStatusLabel(pendingStatusChange!)}" Yapılıyor
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowResolutionBox(false);
                  setPendingStatusChange(null);
                }}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                İptal
              </button>
            </div>
            <textarea
              rows={2}
              placeholder="Çözüm notu / düzeltme detayları giriniz (Örn: v1.2.1 sürümünde API payload doğrulama kuralı güncellendi)..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConfirmResolution}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm cursor-pointer"
              >
                {isSaving ? 'Kaydediliyor...' : 'Durumu Güncelle'}
              </button>
            </div>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {isEditing ? (
            /* Edit Mode Form */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Başlık
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Önem Derecesi
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as DefectSeverity)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  >
                    <option value="BLOCKER">BLOCKER</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="MAJOR">MAJOR</option>
                    <option value="MINOR">MINOR</option>
                    <option value="TRIVIAL">TRIVIAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Ortam
                  </label>
                  <input
                    type="text"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Atanan Kişi
                  </label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Jira Bug Key
                  </label>
                  <input
                    type="text"
                    value={jiraBugKey}
                    onChange={(e) => setJiraBugKey(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Jira URL
                  </label>
                  <input
                    type="url"
                    value={jiraBugUrl}
                    onChange={(e) => setJiraBugUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Açıklama & Adımlar
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 font-sans"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-900/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <>
              {/* Title Section */}
              <div>
                <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                  {defect.title}
                </h1>
              </div>

              {/* Defect Metadata Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Ortam & Platform
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    <span>{defect.environment || 'STAGING'}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span>{defect.channel || 'WEB'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Atanan Kişi
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{defect.assignedTo || 'Atanmamış'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Jira Entegrasyonu
                  </span>
                  {defect.jiraBugKey ? (
                    <a
                      href={defect.jiraBugUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-xs font-mono font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      <span>{defect.jiraBugKey}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Bağlantı Yok</span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Çözüm Durumu
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {defect.resolvedAt
                        ? new Date(defect.resolvedAt).toLocaleDateString('tr-TR')
                        : 'Devam Ediyor'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Test Case Card */}
              {defect.testCase && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">İlişkili Test Senaryosu:</span>
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                          {defect.testCase.code}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        {defect.testCase.title}
                      </p>
                    </div>
                  </div>
                  {onNavigateToCase && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToCase(defect.testCase!.id);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-500/30 transition-colors shrink-0 cursor-pointer"
                    >
                      Senaryoya Git
                    </button>
                  )}
                </div>
              )}

              {/* Linked Test Run Card */}
              {defect.testRun && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Tespit Edilen Test Koşumu:</span>
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                          {defect.testRun.version}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        {defect.testRun.title}
                      </p>
                    </div>
                  </div>
                  {onNavigateToRun && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToRun(defect.testRun!.id);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-emerald-500/30 transition-colors shrink-0 cursor-pointer"
                    >
                      Koşumu İncele
                    </button>
                  )}
                </div>
              )}

              {/* Linked Test Result Error Trace (if available) */}
              {defect.testResult?.errorMessage && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Test Yürütme Hata Günlüğü (Error Log)
                  </span>
                  <pre className="p-3.5 rounded-xl bg-slate-950 text-rose-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-rose-500/20">
                    {defect.testResult.errorMessage}
                  </pre>
                </div>
              )}

              {/* Description & Reproduction Steps */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Hata Detayları & Yeniden Üretim Adımları
                </span>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {defect.description || 'Herhangi bir detaylı açıklama girilmemiş.'}
                </div>
              </div>

              {/* Resolution Notes Box */}
              {defect.resolutionNotes && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Çözüm ve Kapatma Notları
                  </span>
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed">
                    {defect.resolutionNotes}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#141821]/50">
          <span className="text-[11px] text-slate-400">
            Son Güncelleme: {new Date(defect.updatedAt).toLocaleString('tr-TR')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
