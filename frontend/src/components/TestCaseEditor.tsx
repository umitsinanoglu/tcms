'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TestCase, TestStep, StepAttachment, Priority, TestType } from '@/services/api';
import {
  Save,
  Plus,
  Trash2,
  FileCode2,
  Sparkles,
  Layers,
  AlertCircle,
  CheckCircle2,
  XCircle,
  SkipForward,
  Slash,
  ListOrdered,
  X,
  Play,
  Image as ImageIcon,
  Maximize2,
  Clock,
  ArrowLeft,
  Download,
  MessageSquare,
  FileText,
  ExternalLink,
  Bug,
  RotateCcw,
} from 'lucide-react';

interface TestCaseEditorProps {
  testCase: TestCase | null;
  onSave: (updatedCase: Partial<TestCase>) => Promise<void>;
  onDelete: (caseId: string) => Promise<void>;
  onRun?: (testCase: TestCase) => void;
  onClose?: () => void;
  onBack?: () => void;
}

export const TestCaseEditor: React.FC<TestCaseEditorProps> = ({
  testCase,
  onSave,
  onDelete,
  onRun,
  onClose,
  onBack,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [executionType, setExecutionType] = useState<'MANUAL' | 'AUTOMATION'>('MANUAL');
  const [type, setType] = useState<TestType>('WEB');

  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [jiraStoryKey, setJiraStoryKey] = useState('');
  const [jiraIssueUrl, setJiraIssueUrl] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<{ url: string; caption?: string } | null>(null);

  const prevCaseIdRef = useRef<string | null>(null);

  const parseAttachments = (raw: any): StepAttachment[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  useEffect(() => {
    if (testCase) {
      // Only reload form state if the selected testCase ID changed
      if (prevCaseIdRef.current !== testCase.id) {
        prevCaseIdRef.current = testCase.id;
        setTitle(testCase.title || '');
        setDescription(testCase.description || '');
        setExecutionType(testCase.executionType || 'MANUAL');
        setType(testCase.type || 'WEB');
        setPriority(testCase.priority || 'NORMAL');
        setJiraStoryKey(testCase.jiraStoryKey || '');
        setJiraIssueUrl(testCase.jiraIssueUrl || '');
        setPreconditions(testCase.preconditions || '');
        setSteps(
          testCase.steps
            ? testCase.steps.map((s) => ({
                ...s,
                attachments: parseAttachments(s.attachments),
              }))
            : []
        );
        setSavedSuccess(false);
      }
    } else {
      prevCaseIdRef.current = null;
    }
  }, [testCase]);

  if (!testCase) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#090d16] transition-colors duration-200">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4 shadow-sm">
          <Layers className="w-8 h-8 text-slate-400 dark:text-slate-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bir Test Case Seçin</h3>
        <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
          Sol paneldeki Explorer ağacından incelemek veya düzenlemek istediğiniz Test Case'e tıklayın.
        </p>
      </div>
    );
  }

  const latestResult = testCase.results && testCase.results.length > 0 ? testCase.results[0] : null;

  const renderStatusBadge = () => {
    if (!latestResult) {
      return (
        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">
          UNTESTED
        </span>
      );
    }
    switch (latestResult.status) {
      case 'PASSED':
        return (
          <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PASSED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 font-mono font-bold">
            <XCircle className="w-3.5 h-3.5" />
            <span>FAILED</span>
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30 font-mono font-bold">
            <SkipForward className="w-3.5 h-3.5" />
            <span>SKIPPED</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-mono font-bold">
            <Slash className="w-3.5 h-3.5" />
            <span>BLOCKED</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleAddStep = () => {
    const nextNum = steps.length + 1;
    setSteps([
      ...steps,
      {
        stepNumber: nextNum,
        action: '',
        expectedResult: '',
      },
    ]);
  };

  const handleStepChange = (index: number, field: 'action' | 'expectedResult', value: string) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((step, idx) => ({
        ...step,
        stepNumber: idx + 1,
      }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await onSave({
        id: testCase.id,
        title,
        description,
        executionType,
        type,
        priority,
        jiraStoryKey,
        preconditions,
        steps,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-4 sm:p-6 space-y-6 transition-colors duration-200 min-w-0">
      {/* Editor Header */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-2 max-w-2xl w-full">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="Önceki ekrana dön"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
                  <span>Geri</span>
                </button>
              )}

              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center space-x-1.5">
                <FileCode2 className="w-3.5 h-3.5" />
                <span>{testCase.code}</span>
              </span>

              {renderStatusBadge()}

              {/* Execution Type Dropdown */}
              <select
                value={executionType}
                onChange={(e) => {
                  const newExec = e.target.value as 'MANUAL' | 'AUTOMATION';
                  setExecutionType(newExec);
                  if (newExec === 'MANUAL' && !['WEB', 'IOS', 'ANDROID', 'API', 'OTHER'].includes(type)) {
                    setType('WEB');
                  }
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-md px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              >
                <option value="MANUAL">📋 MANUEL</option>
                <option value="AUTOMATION">🤖 OTOMASYON</option>
              </select>

              {/* Test Type Dropdown */}
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TestType)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-md px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
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
                    <option value="WEB">🌐 WEB (Selenium/Cypress)</option>
                    <option value="IOS">📱 IOS (Appium)</option>
                    <option value="ANDROID">🤖 ANDROID (Appium)</option>
                    <option value="API">⚡ API (RestAssured)</option>
                    <option value="PERFORMANCE">🚀 PERFORMANS</option>
                    <option value="OTHER">⚙️ DİĞER OTOMASYON</option>
                  </>
                )}
              </select>

              {/* Priority Badge Dropdown */}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-md px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              >
                <option value="BLOCKER">🔴 BLOCKER</option>
                <option value="CRITICAL">🟠 CRITICAL</option>
                <option value="NORMAL">🔵 NORMAL</option>
                <option value="LOW">⚪ LOW</option>
              </select>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Test Case Başlığı..."
              className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-800 focus:border-blue-500 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-colors py-1"
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-2">
            {onRun && (
              <button
                type="button"
                onClick={() => onRun(testCase)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                title="Bu Test Case'i Koştur"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Case</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors"
                title="Kapat / Editörü Temizle"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm('Bu Test Case\'i silmek istediğinize emin misiniz?')) {
                  onDelete(testCase.id);
                }
              }}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors"
              title="Test Case'i Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              {isSaving ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Değişiklikler başarıyla kaydedildi!</span>
          </div>
        )}

        {/* Form Fields Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Açıklama / Amaç
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Test Case'in detaylı açıklaması ve kapsamı..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ön Koşullar (Preconditions)
            </label>
            <textarea
              rows={3}
              value={preconditions}
              onChange={(e) => setPreconditions(e.target.value)}
              placeholder="Örn: Kullanıcı admin yetkisiyle oturum açmış olmalıdır..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center justify-between">
              <span>Linked Jira Story</span>
              {jiraStoryKey && (
                <a
                  href={jiraIssueUrl || `https://company.atlassian.net/browse/${jiraStoryKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 lowercase font-normal"
                >
                  <span>Jira'da Aç</span>
                  <Sparkles className="w-3 h-3" />
                </a>
              )}
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={jiraStoryKey}
                onChange={(e) => setJiraStoryKey(e.target.value.toUpperCase())}
                placeholder="Örn: MOB-402 veya SCRUM-12"
                className="w-full bg-white dark:bg-slate-900 border border-blue-500/30 rounded-xl p-2.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase shadow-sm"
              />
              <p className="text-[10px] text-slate-500">
                Jira Story/Requirement karesini bağlayarak izlenebilirlik matriksi oluşturun.
              </p>
            </div>
          </div>
        </div>

        {/* Steps Table Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ListOrdered className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Test Adımları ({steps.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={handleAddStep}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-blue-500" />
              <span>Adım Ekle</span>
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-center text-slate-400 dark:text-slate-500 text-xs">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-30 text-slate-400" />
              <p>Henüz tanımlanmış bir test adımı bulunmuyor.</p>
              <p className="text-[10px] mt-1 text-slate-500">
                "Adım Ekle" butonunu kullanarak Test Case adımlarını tanımlayabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/40 shadow-sm">
              <div className="grid grid-cols-12 gap-2 bg-slate-100 dark:bg-slate-900/80 px-4 py-2.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-6">Eylem (Action)</div>
                <div className="col-span-4">Beklenen Sonuç (Expected Result)</div>
                <div className="col-span-1 text-right">İşlem</div>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-2 items-start text-xs">
                      <div className="col-span-1 text-center pt-2 font-mono font-bold text-slate-500 dark:text-slate-400">
                        {step.stepNumber}
                      </div>

                      <div className="col-span-6">
                        <textarea
                          rows={2}
                          value={step.action}
                          onChange={(e) => handleStepChange(idx, 'action', e.target.value)}
                          placeholder="Örn: 'Giriş Yap' butonuna tıklanır..."
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none shadow-sm"
                        />
                      </div>

                      <div className="col-span-4">
                        <textarea
                          rows={2}
                          value={step.expectedResult || ''}
                          onChange={(e) => handleStepChange(idx, 'expectedResult', e.target.value)}
                          placeholder="Örn: Ana sayfaya yönlendirilir ve kullanıcı paneli açılır..."
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none shadow-sm"
                        />
                      </div>

                      <div className="col-span-1 text-right pt-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                          title="Adımı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lightbox Modal for Fullscreen Image View */}
        {activeLightbox && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn">
            <div className="absolute top-4 right-4 flex items-center space-x-3 z-10">
              <a
                href={activeLightbox.url}
                download="test-step-screenshot.png"
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 shadow-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>İndir</span>
              </a>
              <button
                type="button"
                onClick={() => setActiveLightbox(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 shadow-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-w-5xl max-h-[85vh] p-2 flex flex-col items-center space-y-3 overflow-auto">
              <img
                src={activeLightbox.url}
                alt={activeLightbox.caption || 'Ekran Görüntüsü'}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-slate-800 shadow-2xl"
              />

              {activeLightbox.caption && (
                <div className="max-w-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-4 py-2.5 rounded-xl text-center text-xs font-medium text-slate-200 shadow-xl flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{activeLightbox.caption}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Execution History Section */}
        <div className="space-y-4 p-5 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Koşum Geçmişi & Tüm Tekrar Koşuları ({testCase.results?.length || 0})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Bu test case'e ait tüm bağımsız koşum kayıtları, test notları ve ekran görüntüleri
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {onRun && (
                <button
                  type="button"
                  onClick={() => onRun(testCase)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Bu Test Case için Yeni Bir Koşu Başlat"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Tekrar Koş</span>
                </button>
              )}
            </div>
          </div>

          {!testCase.results || testCase.results.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 space-y-2">
              <Clock className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Bu test case için henüz koşum kaydı bulunmuyor.
              </p>
              {onRun && (
                <button
                  type="button"
                  onClick={() => onRun(testCase)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>İlk Koşuyu Başlat</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {testCase.results.map((res, idx) => {
                const runNumber = testCase.results!.length - idx;
                const runTitle = res.testRun?.title || `Koşu #${runNumber}`;
                const runVersion = res.testRun?.version || 'v1.0.0';
                const runEnv = res.testRun?.environment || 'STAGING';

                return (
                  <div
                    key={res.id || idx}
                    className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/90 space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700/80"
                  >
                    {/* Header Row: Status + Run Title + Tester + Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-2.5">
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                        {/* Status Badge */}
                        {res.status === 'PASSED' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>PASSED</span>
                          </span>
                        )}
                        {res.status === 'FAILED' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono font-bold text-[10px] border border-rose-500/30">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            <span>FAILED</span>
                          </span>
                        )}
                        {res.status === 'BLOCKED' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-mono font-bold text-[10px] border border-purple-500/30">
                            <Slash className="w-3 h-3 text-purple-500" />
                            <span>BLOCKED</span>
                          </span>
                        )}
                        {res.status === 'SKIPPED' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400 font-mono font-bold text-[10px] border border-slate-500/30">
                            <SkipForward className="w-3 h-3 text-slate-500" />
                            <span>SKIPPED</span>
                          </span>
                        )}

                        {/* Run Title */}
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {runTitle}
                        </span>

                        {/* Version & Environment */}
                        <span className="font-mono text-[10px] bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-700/60">
                          {runVersion} &bull; {runEnv}
                        </span>
                      </div>

                      {/* Right Meta Info: Tester + Duration + Date */}
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {res.executedBy || res.testRun?.executedBy || 'QA Tester'}
                        </span>
                        {res.executionMs && (
                          <span className="text-slate-400">({res.executionMs}ms)</span>
                        )}
                        <span className="text-slate-400">&bull;</span>
                        <span>{res.executedAt ? new Date(res.executedAt).toLocaleString('tr-TR') : '-'}</span>

                        {res.jiraBugKey && (
                          <a
                            href={res.jiraBugUrl || `https://company.atlassian.net/browse/${res.jiraBugKey}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 hover:underline ml-1"
                          >
                            <Bug className="w-3 h-3" />
                            <span>{res.jiraBugKey}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Independent Comment / Error Note */}
                    {res.errorMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs font-mono border ${
                          res.status === 'PASSED'
                            ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                            : res.status === 'BLOCKED'
                            ? 'bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/20 text-purple-800 dark:text-purple-300'
                            : res.status === 'FAILED'
                            ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
                            : 'bg-slate-500/5 dark:bg-slate-500/10 border-slate-500/20 text-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-80" />
                          <div className="space-y-0.5">
                            <span className="font-bold block text-[10px] uppercase tracking-wider opacity-90">
                              {res.status === 'PASSED'
                                ? 'Koşu / Başarı Notu:'
                                : res.status === 'BLOCKED'
                                ? 'Engellenme Sebebi / Not:'
                                : res.status === 'FAILED'
                                ? 'Hata Detayı & Açıklama:'
                                : 'Koşu Notu:'}
                            </span>
                            <p className="whitespace-pre-wrap">{res.errorMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Independent Screenshot */}
                    {res.screenshotUrl && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Koşum Ekran Görüntüsü / Kanıt</span>
                        </span>
                        <div className="relative group max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1.5 shadow-sm">
                          <img
                            src={res.screenshotUrl}
                            alt="Koşum Ekran Görüntüsü"
                            className="w-full max-h-44 object-contain rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() =>
                              setActiveLightbox({
                                url: res.screenshotUrl!,
                                caption: `${runTitle} - ${res.status} (${res.executedAt ? new Date(res.executedAt).toLocaleString('tr-TR') : ''}) ${res.errorMessage ? `\n${res.errorMessage}` : ''}`,
                              })
                            }
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 backdrop-blur-[1px] rounded-lg">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveLightbox({
                                  url: res.screenshotUrl!,
                                  caption: `${runTitle} - ${res.status} ${res.errorMessage ? `- ${res.errorMessage}` : ''}`,
                                })
                              }
                              className="p-1.5 bg-slate-900/90 text-white rounded-lg hover:bg-slate-800 transition-transform hover:scale-105"
                              title="Büyüt / İncele"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <a
                              href={res.screenshotUrl}
                              download={`${testCase.code}-run-${runNumber}.png`}
                              className="p-1.5 bg-slate-900/90 text-white rounded-lg hover:bg-slate-800 transition-transform hover:scale-105"
                              title="İndir"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </main>
  );
};
