'use client';

import React, { useState, useEffect } from 'react';
import { SuiteTreeNode, TestCase, Priority, TestType } from '@/services/api';
import { X, FilePlus } from 'lucide-react';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectName?: string;
  defaultSuiteId?: string | null;
  suites: SuiteTreeNode[];
  onSubmit: (data: Partial<TestCase>) => Promise<void>;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  defaultSuiteId,
  suites,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [suiteId, setSuiteId] = useState('');
  const [executionType, setExecutionType] = useState<'MANUAL' | 'AUTOMATION'>('MANUAL');
  const [type, setType] = useState<TestType>('WEB');
  const [priority, setPriority] = useState<Priority>('NORMAL');

  const [description, setDescription] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultSuiteId !== undefined && defaultSuiteId !== null) {
      setSuiteId(defaultSuiteId);
    } else {
      setSuiteId('');
    }
  }, [defaultSuiteId, isOpen]);

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
    if (!title) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        suiteId: suiteId || undefined,
        projectId,
        executionType,
        type,
        priority,
        description,
        precondition: preconditions,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <FilePlus className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Yeni Test Case Ekle</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hedef Suite / Konum</label>
            <select
              value={suiteId}
              onChange={(e) => setSuiteId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold">
                📋 (Suite Yok - Doğrudan Test Planı Altında)
              </option>
              {flatSuiteList.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {'—'.repeat(s.depth)} 📂 {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Test Case Başlığı</label>
            <input
              type="text"
              required
              placeholder="Örn: Sepete Ürün Ekleme ve Stok Kontrolü"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {/* Test Yöntemi Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Test Yöntemi (Kategori)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setExecutionType('MANUAL');
                  if (!['WEB', 'IOS', 'ANDROID', 'API', 'OTHER'].includes(type)) setType('WEB');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  executionType === 'MANUAL'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>📋 MANUEL</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setExecutionType('AUTOMATION');
                  if (!['WEB', 'IOS', 'ANDROID', 'API', 'PERFORMANCE', 'OTHER'].includes(type)) setType('WEB');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  executionType === 'AUTOMATION'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>🤖 OTOMASYON</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Test Tipi</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TestType)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              >
                {executionType === 'MANUAL' ? (
                  <>
                    <option value="WEB">🌐 WEB</option>
                    <option value="IOS">📱 IOS</option>
                    <option value="ANDROID">🤖 ANDROID</option>
                    <option value="API">⚡ API</option>
                    <option value="OTHER">📦 DİĞER / GENEL</option>
                  </>
                ) : (
                  <>
                    <option value="WEB">🌐 WEB (Selenium/Cypress/Playwright)</option>
                    <option value="IOS">📱 IOS (Appium)</option>
                    <option value="ANDROID">🤖 ANDROID (Appium)</option>
                    <option value="API">⚡ API (RestAssured/Postman)</option>
                    <option value="PERFORMANCE">🚀 PERFORMANS / YÜK</option>
                    <option value="OTHER">⚙️ DİĞER OTOMASYON</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Öncelik</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              >
                <option value="BLOCKER">🔴 BLOCKER</option>
                <option value="CRITICAL">🟠 CRITICAL</option>
                <option value="NORMAL">🔵 NORMAL</option>
                <option value="LOW">⚪ LOW</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Açıklama</label>
            <textarea
              rows={2}
              placeholder="Test Case amacı ve kısa bilgi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ön Koşullar (Opsiyonel)</label>
            <input
              type="text"
              placeholder="Örn: Kullanıcı giriş yapmış olmalı"
              value={preconditions}
              onChange={(e) => setPreconditions(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !title}
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
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
