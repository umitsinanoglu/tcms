'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TestCase, SuiteTreeNode, SuitesService } from '@/services/api';
import {
  X,
  Plus,
  FileText,
  Folder,
  SlidersHorizontal,
  Trash2,
  Check,
  Pencil,
  Sparkles,
} from 'lucide-react';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectName?: string;
  defaultSuiteId?: string | null;
  suites?: SuiteTreeNode[];
  onSubmit: (data: Partial<TestCase>) => Promise<void>;
  onRefreshSuites?: () => void;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  defaultSuiteId,
  suites = [],
  onSubmit,
  onRefreshSuites,
}) => {
  const [title, setTitle] = useState('');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Module Management State
  const [localSuites, setLocalSuites] = useState<SuiteTreeNode[]>(suites);
  const [isAddingNewModule, setIsAddingNewModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [isManagingModules, setIsManagingModules] = useState(false);

  // Module Edit State
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleName, setEditingModuleName] = useState('');
  const [isUpdatingModule, setIsUpdatingModule] = useState(false);

  // Sync suites from prop
  useEffect(() => {
    setLocalSuites(suites);
  }, [suites]);

  // Flatten suites for dropdown display
  const flattenedSuites = useMemo(() => {
    const flatten = (nodes: SuiteTreeNode[], depth = 0): { id: string; name: string; depth: number }[] => {
      let list: { id: string; name: string; depth: number }[] = [];
      nodes.forEach((n) => {
        list.push({ id: n.id, name: n.name, depth });
        if (n.children && n.children.length > 0) {
          list = list.concat(flatten(n.children, depth + 1));
        }
      });
      return list;
    };
    return flatten(localSuites);
  }, [localSuites]);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSelectedSuiteId(defaultSuiteId || '');
      setDescription('');
      setPreconditions('');
      setErrorMsg('');
      setIsAddingNewModule(false);
      setIsManagingModules(false);
      setNewModuleName('');
    }
  }, [isOpen, defaultSuiteId]);

  if (!isOpen) return null;

  // Handle create new module inline
  const handleCreateModule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newModuleName.trim() || !projectId) return;

    setIsCreatingModule(true);
    setErrorMsg('');
    try {
      const created = await SuitesService.create({
        name: newModuleName.trim(),
        projectId,
      });

      // Update local suites list
      const updatedList = [...localSuites, { ...created, children: [] }];
      setLocalSuites(updatedList);
      setSelectedSuiteId(created.id);
      setNewModuleName('');
      setIsAddingNewModule(false);

      if (onRefreshSuites) {
        onRefreshSuites();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Yeni modül oluşturulurken bir hata meydana geldi.');
    } finally {
      setIsCreatingModule(false);
    }
  };

  // Handle delete module
  const handleDeleteModule = async (moduleId: string, moduleName: string) => {
    if (!confirm(`'${moduleName}' modülünü silmek istediğinize emin misiniz?`)) return;

    try {
      await SuitesService.delete(moduleId);
      setLocalSuites((prev) => prev.filter((s) => s.id !== moduleId));
      if (selectedSuiteId === moduleId) {
        setSelectedSuiteId('');
      }
      if (onRefreshSuites) {
        onRefreshSuites();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Modül silinirken bir hata meydana geldi.');
    }
  };

  // Handle start editing module
  const handleStartEditModule = (mod: { id: string; name: string }) => {
    setEditingModuleId(mod.id);
    setEditingModuleName(mod.name);
  };

  // Handle save module rename
  const handleSaveEditModule = async (moduleId: string) => {
    if (!editingModuleName.trim()) return;

    setIsUpdatingModule(true);
    try {
      await SuitesService.update(moduleId, { name: editingModuleName.trim() });
      setLocalSuites((prev) =>
        prev.map((s) => (s.id === moduleId ? { ...s, name: editingModuleName.trim() } : s))
      );
      setEditingModuleId(null);
      if (onRefreshSuites) {
        onRefreshSuites();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Modül adı güncellenirken bir hata oluştu.');
    } finally {
      setIsUpdatingModule(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit({
        title: title.trim(),
        projectId,
        suiteId: selectedSuiteId ? selectedSuiteId : undefined,
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
      <div className="bg-white dark:bg-[#161f30] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
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
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium shrink-0">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
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

          {/* Module Management & Selection */}
          <div className="space-y-2 p-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-500" />
                <span>Modül</span>
              </label>

              <div className="flex items-center space-x-2">
                {!isAddingNewModule && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewModule(true);
                      setIsManagingModules(false);
                    }}
                    className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Yeni Modül Ekle</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsManagingModules(!isManagingModules);
                    setIsAddingNewModule(false);
                  }}
                  className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>{isManagingModules ? 'Kapat' : 'Yönet'}</span>
                </button>
              </div>
            </div>

            {/* Inline Add New Module Form */}
            {isAddingNewModule && (
              <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-xl space-y-2 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block">
                  Yeni Modül Tanımla
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Örn: Ödeme & Kart İşlemleri, Kullanıcı Ayarları..."
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateModule();
                      }
                    }}
                    className="flex-1 bg-white dark:bg-[#161f30] border border-blue-300 dark:border-blue-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={isCreatingModule || !newModuleName.trim()}
                    onClick={() => handleCreateModule()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer inline-flex items-center space-x-1"
                  >
                    {isCreatingModule ? (
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Ekle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewModule(false);
                      setNewModuleName('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                    title="İptal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Manage Modules List Panel */}
            {isManagingModules && (
              <div className="p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <span>Mevcut Modüller ({flattenedSuites.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Düzenle / Sil</span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {flattenedSuites.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-2 text-center">
                      Henüz tanımlı modül bulunmuyor.
                    </p>
                  ) : (
                    flattenedSuites.map((mod) => (
                      <div
                        key={mod.id}
                        className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        {editingModuleId === mod.id ? (
                          <div className="flex items-center gap-1.5 flex-1 pr-1">
                            <input
                              type="text"
                              value={editingModuleName}
                              onChange={(e) => setEditingModuleName(e.target.value)}
                              className="flex-1 bg-white dark:bg-[#161f30] border border-blue-400 rounded px-2 py-0.5 text-xs text-slate-900 dark:text-slate-100"
                              autoFocus
                            />
                            <button
                              type="button"
                              disabled={isUpdatingModule}
                              onClick={() => handleSaveEditModule(mod.id)}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              title="Kaydet"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingModuleId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                              title="Vazgeç"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                              📁 {mod.name}
                            </span>
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditModule(mod)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                title="Yeniden Adlandır"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteModule(mod.id, mod.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Modülü Sil"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Module Selector Dropdown */}
            <select
              value={selectedSuiteId}
              onChange={(e) => setSelectedSuiteId(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium cursor-pointer shadow-xs"
            >
              <option value="">📁 Ana Modül (Modülsüz / Proje Geneli)</option>
              {flattenedSuites.map((s) => (
                <option key={s.id} value={s.id}>
                  {'\u00A0'.repeat(s.depth * 3)}↳ 📁 {s.name}
                </option>
              ))}
            </select>
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
