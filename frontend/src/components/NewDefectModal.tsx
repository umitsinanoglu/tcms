import React, { useState, useEffect } from 'react';
import {
  DefectSeverity,
  DefectStatus,
  CreateDefectDto,
  TestCase,
} from '@/services/api';
import {
  X,
  Plus,
  Bug,
  AlertTriangle,
  Server,
  Monitor,
  ExternalLink,
  User,
  Search,
  Check,
} from 'lucide-react';

interface NewDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectName?: string;
  projectKey?: string;
  allCases?: TestCase[];
  initialData?: Partial<CreateDefectDto>;
  onSubmit: (data: CreateDefectDto) => Promise<void>;
}

export const NewDefectModal: React.FC<NewDefectModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectKey,
  allCases = [],
  initialData,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<DefectSeverity>('MAJOR');
  const [status, setStatus] = useState<DefectStatus>('OPEN');
  const [environment, setEnvironment] = useState('STAGING');
  const [channel, setChannel] = useState('WEB');
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [jiraBugKey, setJiraBugKey] = useState('');
  const [jiraBugUrl, setJiraBugUrl] = useState('');
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setSeverity(initialData.severity || 'MAJOR');
        setStatus(initialData.status || 'OPEN');
        setEnvironment(initialData.environment || 'STAGING');
        setChannel(initialData.channel || 'WEB');
        setSelectedTestCaseId(initialData.testCaseId || '');
        setAssignedTo(initialData.assignedTo || '');
        setReportedBy(initialData.reportedBy || (typeof window !== 'undefined' ? localStorage.getItem('tcms_active_user_name') || '' : ''));
        setJiraBugKey(initialData.jiraBugKey || '');
        setJiraBugUrl(initialData.jiraBugUrl || '');
      } else {
        setTitle('');
        setDescription('');
        setSeverity('MAJOR');
        setStatus('OPEN');
        setEnvironment('STAGING');
        setChannel('WEB');
        setSelectedTestCaseId('');
        setAssignedTo('');
        setReportedBy(typeof window !== 'undefined' ? localStorage.getItem('tcms_active_user_name') || '' : '');
        setJiraBugKey('');
        setJiraBugUrl('');
      }
      setError(null);
      setShowCasePicker(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen || !projectId) return null;

  const filteredCases = allCases.filter((c) => {
    if (!caseSearchQuery) return true;
    const q = caseSearchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.suite?.name && c.suite.name.toLowerCase().includes(q))
    );
  });

  const selectedCase = allCases.find((c) => c.id === selectedTestCaseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Hata başlığı zorunludur');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
        status,
        environment: environment.trim() || 'STAGING',
        channel: channel.trim() || 'WEB',
        testCaseId: selectedTestCaseId || undefined,
        testRunId: initialData?.testRunId || undefined,
        testResultId: initialData?.testResultId || undefined,
        assignedTo: assignedTo.trim() || undefined,
        reportedBy: reportedBy.trim() || undefined,
        jiraBugKey: jiraBugKey.trim() || undefined,
        jiraBugUrl: jiraBugUrl.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Hata kaydı oluşturulurken bir problem oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#141821]/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-700 to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-900/20">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Yeni Defect / Bulgu Kaydı Aç
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hedef Proje:{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  [{projectKey}] {projectName}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Defect Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Hata / Bulgu Başlığı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Örn: FAST Transfer tutar doğrulamasında 500 API hatası"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
            />
          </div>

          {/* Severity & Status & Environment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Önem Derecesi (Severity)
              </label>
              <div className="relative">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as DefectSeverity)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                >
                  <option value="BLOCKER">BLOCKER (Engelleyici)</option>
                  <option value="CRITICAL">CRITICAL (Kritik)</option>
                  <option value="MAJOR">MAJOR (Yüksek)</option>
                  <option value="MINOR">MINOR (Orta)</option>
                  <option value="TRIVIAL">TRIVIAL (Düşük/Kozmetik)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Başlangıç Durumu
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DefectStatus)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              >
                <option value="OPEN">AÇIK (OPEN)</option>
                <option value="IN_PROGRESS">İNCELENİYOR (IN PROGRESS)</option>
                <option value="RESOLVED">ÇÖZÜLDÜ (RESOLVED)</option>
                <option value="CLOSED">KAPATILDI (CLOSED)</option>
                <option value="REOPENED">YENİDEN AÇILDI (REOPENED)</option>
                <option value="WONT_FIX">DÜZELTİLMEYECEK (WONT FIX)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Bulunduğu Ortam
              </label>
              <div className="relative">
                <Server className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                >
                  <option value="STAGING">STAGING</option>
                  <option value="TEST">TEST</option>
                  <option value="UAT">UAT</option>
                  <option value="PROD">PROD (Canlı)</option>
                  <option value="DEV">DEV</option>
                </select>
              </div>
            </div>
          </div>

          {/* Channel & Assignee & Reporter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Kanal / Platform
              </label>
              <div className="relative">
                <Monitor className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                >
                  <option value="WEB">WEB (İnternet Şubesi)</option>
                  <option value="MOBILE">MOBILE (iOS / Android)</option>
                  <option value="API">API / Entegrasyon</option>
                  <option value="DESKTOP">DESKTOP / Gişe</option>
                  <option value="OTHER">Diğer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Atanan Kişi (Assignee)
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Yazılımcı / Takım Adı"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Raporlayan (Reporter)
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Test Eden Kişi"
                  value={reportedBy}
                  onChange={(e) => setReportedBy(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            </div>
          </div>

          {/* Linked Test Case Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                İlişkili Test Senaryosu (Opsiyonel)
              </label>
              {selectedTestCaseId && (
                <button
                  type="button"
                  onClick={() => setSelectedTestCaseId('')}
                  className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                >
                  Bağlantıyı Kaldır
                </button>
              )}
            </div>

            {selectedCase ? (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 shrink-0">
                    {selectedCase.code}
                  </span>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {selectedCase.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCasePicker(true)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 ml-2 shrink-0 cursor-pointer"
                >
                  Değiştir
                </button>
              </div>
            ) : (
              <div>
                {!showCasePicker ? (
                  <button
                    type="button"
                    onClick={() => setShowCasePicker(true)}
                    className="w-full text-left px-3.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-400 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>Test Senaryosu Seç (İsteğe bağlı)...</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Senaryo başlığı veya kodu ara..."
                        value={caseSearchQuery}
                        onChange={(e) => setCaseSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredCases.map((tc) => (
                        <div
                          key={tc.id}
                          onClick={() => {
                            setSelectedTestCaseId(tc.id);
                            setShowCasePicker(false);
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center justify-between cursor-pointer text-xs"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              {tc.code}
                            </span>
                            <span className="truncate text-slate-800 dark:text-slate-200">{tc.title}</span>
                          </div>
                          {selectedTestCaseId === tc.id && <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Jira Integration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Jira Issue / Bug Key
              </label>
              <input
                type="text"
                placeholder="Örn: PROJ-942"
                value={jiraBugKey}
                onChange={(e) => setJiraBugKey(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Jira Doğrudan URL
              </label>
              <div className="relative">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://jira.banka.com/browse/PROJ-942"
                  value={jiraBugUrl}
                  onChange={(e) => setJiraBugUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            </div>
          </div>

          {/* Description / Reproduction Steps */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Hata Açıklaması, Yeniden Üretim Adımları ve Beklenen Sonuç
            </label>
            <textarea
              rows={4}
              placeholder="1. Kullanıcı transfer sayfasına gider&#10;2. Tutar olarak 5000 TL girilir&#10;3. 'Gönder' tıklandığında ekran kilitlenir ve 500 döner.&#10;&#10;Beklenen: Başarılı işlem onay ekranının açılması."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-sans leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white transition-all duration-200 rounded-xl bg-gradient-to-r from-rose-700 to-rose-500 hover:from-rose-800 hover:to-rose-600 shadow-md shadow-rose-900/25 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Defect Kaydını Aç'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
