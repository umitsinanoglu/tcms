'use client';

import React, { useState } from 'react';
import { X, Plus, FolderKanban } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; key: string; description?: string; jiraProjectKey?: string }) => Promise<void>;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [jiraProjectKey, setJiraProjectKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
        jiraProjectKey: jiraProjectKey.trim().toUpperCase() || undefined,
      });
      setName('');
      setKey('');
      setDescription('');
      setJiraProjectKey('');
      setErrorMsg('');
      onClose();
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || err?.message || 'Test Planı oluşturulurken bir hata oluştu.';
      setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <FolderKanban className="w-5 h-5 text-[#b83a4b]" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Yeni Test Planı Oluştur</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-[#b83a4b]/10 border border-[#b83a4b]/30 rounded-xl text-xs text-rose-300 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Test Planı Adı</label>
            <input
              type="text"
              required
              placeholder="Örn: E-Commerce Web & Mobile Test Planı"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!key) {
                  const suggested = e.target.value
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .substring(0, 4)
                    .toUpperCase();
                  setKey(suggested);
                }
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#b83a4b] shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Plan Kodu / Key (Ön Ek)
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="Örn: PLAN"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#b83a4b] dark:text-[#d66b7a] focus:outline-none focus:ring-1 focus:ring-[#b83a4b] uppercase shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Jira Proje Kodu (Opsiyonel)
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="Örn: MOB veya PRJ"
                value={jiraProjectKey}
                onChange={(e) => setJiraProjectKey(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase shadow-sm"
              />
            </div>
          </div>

          <span className="block text-[10px] text-slate-500">
            Test Case'leriniz {key || 'KEY'}-TC-1, {key || 'KEY'}-TC-2 biçiminde otomatik kodlanacaktır.
          </span>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Açıklama</label>
            <textarea
              rows={3}
              placeholder="Test Planı hedefi, kapsamı ve detayları..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#b83a4b] resize-none shadow-sm"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !key.trim()}
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#821c2b]/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Oluşturuluyor...' : 'Test Planı Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

