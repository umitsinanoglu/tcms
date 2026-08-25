'use client';

import React, { useState, useEffect } from 'react';
import { TestCase, Priority, TestType, ExecutionType, SuiteTreeNode } from '@/services/api';
import { X, Plus, FileText, Sparkles } from 'lucide-react';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectName?: string;
  defaultSuiteId?: string | null;
  suites?: SuiteTreeNode[];
  onSubmit: (data: Partial<TestCase>) => Promise<void>;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [executionType, setExecutionType] = useState<ExecutionType>('MANUAL');
  const [type, setType] = useState<TestType>('WEB');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [description, setDescription] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPreconditions('');
      setExecutionType('MANUAL');
      setType('WEB');
      setPriority('NORMAL');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit({
        title: title.trim(),
        projectId,
        executionType,
        type,
        priority,
        description: description.trim() || undefined,
        precondition: preconditions.trim() || undefined,
        steps: [],
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      const message =
        err?.response?.data?.message || err?.message || 'Test Senaryosu oluşturulurken bir hata meydana geldi.';
      setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Yeni Test Senaryosu Oluştur
              </h3>
              {projectName && (
                <p className="text-[11px] text-slate-400 font-medium">Proje: {projectName}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Scenario Title */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Senaryo Başlığı *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Kullanıcı Girişi ve İki Faktörlü Doğrulama Akışı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs font-medium"
            />
          </div>

          {/* Test Type, Execution Type & Priority Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Test Türü</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TestType)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium cursor-pointer shadow-xs"
              >
                <option value="WEB">Web</option>
                <option value="MOBILE">Mobile</option>
                <option value="API">API</option>
                <option value="PERFORMANCE">Performance</option>
                <option value="OTHER">Diğer</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Öncelik</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium cursor-pointer shadow-xs"
              >
                <option value="BLOCKER">Blocker (Kritik Engel)</option>
                <option value="CRITICAL">Critical (Yüksek)</option>
                <option value="NORMAL">Normal (Standart)</option>
                <option value="LOW">Low (Düşük)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">İcra Tipi</label>
              <select
                value={executionType}
                onChange={(e) => setExecutionType(e.target.value as ExecutionType)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium cursor-pointer shadow-xs"
              >
                <option value="MANUAL">📋 Manuel</option>
                <option value="AUTOMATION">🤖 Otomasyon</option>
              </select>
            </div>
          </div>

          {/* Preconditions */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Önkoşullar (Opsiyonel)
            </label>
            <input
              type="text"
              placeholder="Örn: Kullanıcı oturum açmış olmalı, bakiye > 100 TL olmalı"
              value={preconditions}
              onChange={(e) => setPreconditions(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              rows={3}
              placeholder="Senaryonun amacı, test adımları ve beklenen genel davranış..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] disabled:opacity-50 transition-all shadow-md shadow-[#821c2b]/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Oluşturuluyor...' : 'Senaryoyu Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
