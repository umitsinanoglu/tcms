'use client';

import React, { useState, useEffect } from 'react';
import { Project } from '@/services/api';
import { X, Save, Trash2, FolderKanban, AlertTriangle } from 'lucide-react';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onUpdate: (id: string, data: { name?: string; key?: string; description?: string; jiraProjectKey?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdate,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [jiraProjectKey, setJiraProjectKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setKey(project.key || '');
      setDescription(project.description || '');
      setJiraProjectKey(project.jiraProjectKey || '');
      setShowDeleteConfirm(false);
      setErrorMsg('');
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onUpdate(project.id, {
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
        jiraProjectKey: jiraProjectKey.trim().toUpperCase() || undefined,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || err?.message || 'Test Planı güncellenirken bir hata oluştu.';
      setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg('');
    try {
      await onDelete(project.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || err?.message || 'Test Planı silinirken bir hata oluştu.';
      setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <FolderKanban className="w-5 h-5 text-[#b83a4b]" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Test Planını Düzenle</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">[{project.key}] {project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-[#b83a4b]/10 border border-[#b83a4b]/30 rounded-xl text-xs text-rose-300 font-medium">
            {errorMsg}
          </div>
        )}

        {showDeleteConfirm ? (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Test Planı Silme Onayı</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>"{project.name}"</strong> test planını ve altındaki tüm Suite, Test Case ve Test Koşusu kayıtlarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Siliniyor...' : 'Evet, Planı Tamamen Sil'}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Test Planı Adı</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#b83a4b] shadow-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Plan Kodu / Key
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#b83a4b] dark:text-[#d66b7a] focus:outline-none focus:ring-1 focus:ring-[#b83a4b] uppercase shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Jira Proje Kodu
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Açıklama</label>
              <textarea
                rows={3}
                placeholder="Test Planı hedefi ve detayları..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#b83a4b] resize-none shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Planı Sil</span>
              </button>

              <div className="flex items-center space-x-2">
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
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
