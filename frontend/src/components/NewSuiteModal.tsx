'use client';

import React, { useState, useEffect } from 'react';
import { SuiteTreeNode } from '@/services/api';
import { X, FolderPlus } from 'lucide-react';

interface NewSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  projectKey?: string;
  parentSuiteId?: string | null;
  suites: SuiteTreeNode[];
  onSubmit: (data: { name: string; projectId: string; parentId?: string }) => Promise<void>;
}

export const NewSuiteModal: React.FC<NewSuiteModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectKey,
  parentSuiteId,
  suites,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedParentId(parentSuiteId || '');
  }, [parentSuiteId, isOpen]);

  if (!isOpen) return null;

  const flattenSuites = (nodes: SuiteTreeNode[], depth = 0): Array<{ id: string; name: string; depth: number }> => {
    let result: Array<{ id: string; name: string; depth: number }> = [];
    nodes.forEach((node) => {
      result.push({ id: node.id, name: node.name, depth });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenSuites(node.children, depth + 1));
      }
    });
    return result;
  };

  const flatSuiteList = flattenSuites(suites);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        projectId,
        parentId: selectedParentId || undefined,
      });
      setName('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <FolderPlus className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Yeni Suite (Klasör) Ekle</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Klasör / Suite Adı</label>
            <input
              type="text"
              required
              placeholder="Örn: Ödeme Adımları & 3D Secure"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Üst Klasör / Proje (Parent)
            </label>
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-sm"
            >
              <option value="">
                🚀 Proje: {projectKey ? `[${projectKey}] ` : ''}{projectName || 'Aktif Proje Ana Dizini'}
              </option>
              {flatSuiteList.map((s) => (
                <option key={s.id} value={s.id}>
                  {'—'.repeat(s.depth + 1)} 📂 {s.name}
                </option>
              ))}
            </select>
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
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-600/20 disabled:opacity-50"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Oluşturuluyor...' : 'Suite Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

