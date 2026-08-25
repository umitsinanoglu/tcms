import React, { useState } from 'react';
import { PlanStatus, CreateTestPlanDto } from '@/services/api';
import {
  X,
  Plus,
  ClipboardList,
  Server,
  Tag,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';

interface NewTestPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectName?: string;
  projectKey?: string;
  onSubmit: (data: CreateTestPlanDto) => Promise<void>;
}

export const NewTestPlanModal: React.FC<NewTestPlanModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectKey,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('v1.0.0');
  const [environment, setEnvironment] = useState('STAGING');
  const [status, setStatus] = useState<PlanStatus>('ACTIVE');
  const [scope, setScope] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !projectId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Test planı başlığı zorunludur');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        version: version.trim() || 'v1.0.0',
        environment: environment.trim() || 'STAGING',
        status,
        scope: scope.trim() || undefined,
        requirements: requirements.trim() || undefined,
        projectId,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setVersion('v1.0.0');
      setEnvironment('STAGING');
      setStatus('ACTIVE');
      setScope('');
      setRequirements('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Test planı oluşturulurken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#141821]/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#821c2b] to-[#b83a4b] text-white flex items-center justify-center shadow-md shadow-[#821c2b]/20">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Yeni Test Planı Oluştur
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
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
              placeholder="Örn: Sprint 24 Regresyon Test Planı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30 focus:border-[#b83a4b] transition-all"
            />
          </div>

          {/* Version & Environment & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Hedef Sürüm
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="v1.0.0"
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
                placeholder="Örn: Ödeme Ağ Geçidi, Kimlik Doğrulama, Hesap Özeti, Bildirimler"
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
                placeholder="Örn: PROJ-102, PROJ-105, REQ-77"
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
              rows={3}
              placeholder="Test planının amacı, ön koşulları ve uygulanacak test stratejisi notları..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/30"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white transition-all duration-200 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] shadow-md shadow-[#821c2b]/25 active:scale-98 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Test Planı Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
