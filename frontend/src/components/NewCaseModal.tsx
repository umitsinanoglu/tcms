'use client';

import React, { useState, useEffect } from 'react';
import { SuiteTreeNode, TestCase, Priority, TestType } from '@/services/api';
import { X, FilePlus } from 'lucide-react';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSuiteId?: string | null;
  suites: SuiteTreeNode[];
  onSubmit: (data: Partial<TestCase>) => Promise<void>;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  isOpen,
  onClose,
  defaultSuiteId,
  suites,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [suiteId, setSuiteId] = useState('');
  const [type, setType] = useState<TestType>('MANUAL');
  const [priority, setPriority] = useState<Priority>('NORMAL');

  const [description, setDescription] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultSuiteId) {
      setSuiteId(defaultSuiteId);
    } else if (suites.length > 0) {
      setSuiteId(suites[0].id);
    }
  }, [defaultSuiteId, suites, isOpen]);

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
    if (!title || !suiteId) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        suiteId,
        type,
        priority,
        description,
        preconditions,
        steps: [],
      });
      setTitle('');
      setDescription('');
      setPreconditions('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <FilePlus className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100">Yeni Test Case Ekle</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Hedef Suite (Klasör)</label>
            <select
              required
              value={suiteId}
              onChange={(e) => setSuiteId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {flatSuiteList.length === 0 ? (
                <option value="">Önce bir Suite oluşturun</option>
              ) : (
                flatSuiteList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {'—'.repeat(s.depth)} 📂 {s.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Test Case Başlığı</label>
            <input
              type="text"
              required
              placeholder="Örn: Sepete Ürün Ekleme ve Stok Kontrolü"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Test Tipi</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TestType)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >

                <option value="WEB">🌐 WEB</option>
                <option value="MOBILE">📱 MOBILE</option>
                <option value="API">⚡ API</option>
                <option value="MANUAL">📋 MANUAL</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Öncelik</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="BLOCKER">🔴 BLOCKER</option>
                <option value="CRITICAL">🟠 CRITICAL</option>
                <option value="NORMAL">🔵 NORMAL</option>
                <option value="LOW">⚪ LOW</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Açıklama</label>
            <textarea
              rows={2}
              placeholder="Senaryo amacı ve kısa bilgi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !suiteId}
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <FilePlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Oluşturuluyor...' : 'Case Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
