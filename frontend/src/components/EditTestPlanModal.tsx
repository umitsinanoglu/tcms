import React, { useState, useEffect } from 'react';
import { TestPlan, PlanStatus, UpdateTestPlanDto, TestCase } from '@/services/api';
import {
  X,
  Save,
  Trash2,
  ClipboardList,
  Server,
  Tag,
  FileText,
  Layers,
  Search,
  Check,
} from 'lucide-react';

interface EditTestPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TestPlan | null;
  allCases?: TestCase[];
  onUpdate: (id: string, data: UpdateTestPlanDto & { caseIds?: string[] }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const EditTestPlanModal: React.FC<EditTestPlanModalProps> = ({
  isOpen,
  onClose,
  plan,
  allCases = [],
  onUpdate,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('v1.0.0');
  const [environment, setEnvironment] = useState('STAGING');
  const [status, setStatus] = useState<PlanStatus>('ACTIVE');
  const [scope, setScope] = useState('');
  const [requirements, setRequirements] = useState('');
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title || '');
      setDescription(plan.description || '');
      setVersion(plan.version || 'v1.0.0');
      setEnvironment(plan.environment || 'STAGING');
      setStatus(plan.status || 'ACTIVE');
      setScope(plan.scope || '');
      setRequirements(plan.requirements || '');

      try {
        const saved = localStorage.getItem(`tcms_plan_cases_${plan.id}`);
        if (saved !== null) {
          setSelectedCaseIds(JSON.parse(saved));
        } else {
          setSelectedCaseIds([]);
        }
      } catch {
        setSelectedCaseIds([]);
      }
    }
  }, [plan]);

  if (!isOpen || !plan) return null;

  const filteredCases = allCases.filter((c) => {
    if (!caseSearchQuery) return true;
    const q = caseSearchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.suite?.name && c.suite.name.toLowerCase().includes(q))
    );
  });

  const toggleCaseSelection = (id: string) => {
    setSelectedCaseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCases = () => {
    setSelectedCaseIds(filteredCases.map((c) => c.id));
  };

  const handleClearSelectedCases = () => {
    setSelectedCaseIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Test planı başlığı zorunludur');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Save case IDs to localStorage
      try {
        localStorage.setItem(`tcms_plan_cases_${plan.id}`, JSON.stringify(selectedCaseIds));
      } catch {
        // Ignore
      }

      await onUpdate(plan.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        version: version.trim() || 'v1.0.0',
        environment: environment.trim() || 'STAGING',
        status,
        scope: scope.trim() || undefined,
        requirements: requirements.trim() || undefined,
        caseIds: selectedCaseIds,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Test planı güncellenirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (confirm(`'${plan.title}' adlı Test Planını silmek istediğinize emin misiniz?`)) {
      try {
        setIsSubmitting(true);
        await onDelete(plan.id);
        onClose();
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || 'Test planı silinirken bir hata oluştu');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#141821]/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#821c2b] to-[#b83a4b] text-white flex items-center justify-center shadow-md shadow-[#821c2b]/20">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Test Planını Düzenle
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ID: {plan.id.slice(0, 8)}...
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

          {/* Plan Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Plan Başlığı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30 focus:border-[#b83a4b]"
            />
          </div>

          {/* Version & Environment & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Hedef Sürüm
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Hedef Ortam
              </label>
              <div className="relative">
                <Server className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30"
                >
                  <option value="STAGING">STAGING</option>
                  <option value="UAT">UAT</option>
                  <option value="PROD">PROD (Canlı)</option>
                  <option value="DEV">DEV</option>
                  <option value="TEST">TEST</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Plan Durumu
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PlanStatus)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30"
              >
                <option value="ACTIVE">AKTİF</option>
                <option value="DRAFT">TASLAK</option>
                <option value="COMPLETED">TAMAMLANDI</option>
                <option value="ARCHIVED">ARŞİV</option>
              </select>
            </div>
          </div>

          {/* Scope / Components */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Kapsam & Bileşenler (Yapı Taşları)
            </label>
            <div className="relative">
              <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30"
              />
            </div>
          </div>

          {/* Requirements / Jira Stories */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Gereksinimler & Jira Hikayeleri
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30 font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Plan Açıklaması & Test Stratejisi
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30"
            />
          </div>

          {/* Scenario Selection Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Plana Dahil Test Senaryoları
                </label>
                <span className="text-[11px] text-slate-400">
                  {selectedCaseIds.length} senaryo seçili
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAllCases}
                  disabled={filteredCases.length === 0}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline disabled:opacity-40 cursor-pointer"
                >
                  Tümünü Seç
                </button>
                <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                <button
                  type="button"
                  onClick={handleClearSelectedCases}
                  disabled={selectedCaseIds.length === 0}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline disabled:opacity-40 cursor-pointer"
                >
                  Seçimi Temizle
                </button>
              </div>
            </div>

            {/* Case Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Senaryo başlığı veya koduyla ara..."
                value={caseSearchQuery}
                onChange={(e) => setCaseSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30"
              />
            </div>

            {/* Scenario Checklist Box */}
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700/80 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/40 dark:bg-slate-900/40 p-1">
              {filteredCases.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  {allCases.length === 0
                    ? 'Projede henüz test senaryosu bulunmuyor.'
                    : 'Aramaya uygun test senaryosu bulunamadı.'}
                </div>
              ) : (
                filteredCases.map((tc) => {
                  const isChecked = selectedCaseIds.includes(tc.id);
                  return (
                    <div
                      key={tc.id}
                      onClick={() => toggleCaseSelection(tc.id)}
                      className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-50/80 dark:bg-blue-900/25 border border-blue-500/30'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                          {tc.code}
                        </span>
                        <div className="min-w-0 flex-1 truncate">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {tc.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {tc.suite?.name || 'Kök Dizin'} &bull; {tc.priority} &bull; {tc.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Planı Sil</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2.5">
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
                className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white transition-all duration-200 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] shadow-md shadow-[#821c2b]/25 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
