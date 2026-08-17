'use client';

import React, { useState, useEffect } from 'react';
import { SuiteTreeNode } from '@/services/api';
import { X, FolderEdit, Trash2, Save } from 'lucide-react';

interface EditSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  suite: SuiteTreeNode | null;
  suites: SuiteTreeNode[];
  onUpdate: (suiteId: string, data: { name?: string; parentId?: string | null }) => Promise<void>;
  onDelete: (suiteId: string) => Promise<void>;
}

export const EditSuiteModal: React.FC<EditSuiteModalProps> = ({
  isOpen,
  onClose,
  suite,
  suites,
  onUpdate,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (suite) {
      setName(suite.name || '');
      setSelectedParentId(suite.parentId || '');
    }
  }, [suite, isOpen]);

  if (!isOpen || !suite) return null;

  const flattenSuites = (nodes: SuiteTreeNode[], depth = 0): Array<{ id: string; name: string; depth: number }> => {
    let result: Array<{ id: string; name: string; depth: number }> = [];
    nodes.forEach((node) => {
      if (node.id !== suite.id) {
        result.push({ id: node.id, name: node.name, depth });
        if (node.children && node.children.length > 0) {
          result = result.concat(flattenSuites(node.children, depth + 1));
        }
      }
    });
    return result;
  };

  const flatSuiteList = flattenSuites(suites);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onUpdate(suite.id, {
        name: name.trim(),
        parentId: null,
      });
      onClose();
    } catch (err) {
      console.error('Error updating suite:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`"${suite.name}" isimli suite klasörünü ve içindekileri silmek istediğinizden emin misiniz?`)) {
      setIsDeleting(true);
      try {
        await onDelete(suite.id);
        onClose();
      } catch (err) {
        console.error('Error deleting suite:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <FolderEdit className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Suite (Klasör) Düzenle</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Suite Adı</label>
            <input
              type="text"
              required
              placeholder="Suite adını girin..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center space-x-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Siliniyor...' : 'Suite\'i Sil'}</span>
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
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

