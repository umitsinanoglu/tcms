'use client';

import React, { useState, useEffect } from 'react';
import { TestCase, TestStep, Priority, TestType } from '@/services/api';
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
} from 'lucide-react';

interface TestCaseEditorProps {
  testCase: TestCase | null;
  onSave: (updatedCase: Partial<TestCase>) => Promise<void>;
  onDelete: (caseId: string) => Promise<void>;
  onRun?: (testCase: TestCase) => void;
  onClose?: () => void;
}

export const TestCaseEditor: React.FC<TestCaseEditorProps> = ({
  testCase,
  onSave,
  onDelete,
  onRun,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TestType>('MANUAL');

  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [jiraStoryKey, setJiraStoryKey] = useState('');
  const [jiraIssueUrl, setJiraIssueUrl] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (testCase) {
      setTitle(testCase.title || '');
      setDescription(testCase.description || '');
      setType(testCase.type || 'MANUAL');
      setPriority(testCase.priority || 'NORMAL');
      setJiraStoryKey(testCase.jiraStoryKey || '');
      setJiraIssueUrl(testCase.jiraIssueUrl || '');
      setPreconditions(testCase.preconditions || '');
      setSteps(testCase.steps ? [...testCase.steps] : []);
      setSavedSuccess(false);
    }
  }, [testCase]);

  if (!testCase) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 bg-background/50">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">Bir Test Case Seçin</h3>
        <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
          Sol paneldeki Explorer ağacından incelemek veya düzenlemek istediğiniz senaryoya tıklayın.
        </p>
      </div>
    );
  }

  const latestResult = testCase.results && testCase.results.length > 0 ? testCase.results[0] : null;

  const renderStatusBadge = () => {
    if (!latestResult) {
      return (
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
          UNTESTED
        </span>
      );
    }
    switch (latestResult.status) {
      case 'PASSED':
        return (
          <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PASSED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-mono font-bold">
            <XCircle className="w-3.5 h-3.5" />
            <span>FAILED</span>
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30 font-mono font-bold">
            <SkipForward className="w-3.5 h-3.5" />
            <span>SKIPPED</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono font-bold">
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
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    const renumbered = updated.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1,
    }));
    setSteps(renumbered);
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
    <main className="flex-1 overflow-y-auto bg-background p-6 space-y-6">
      {/* Editor Header */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-start justify-between border-b border-surface-border pb-5">
          <div className="space-y-2 max-w-2xl w-full">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center space-x-1.5">
                <FileCode2 className="w-3.5 h-3.5" />
                <span>{testCase.code}</span>
              </span>

              {renderStatusBadge()}

              {/* Type Badge Dropdown */}
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TestType)}
                className="bg-slate-900 border border-slate-800 text-xs font-semibold rounded-md px-2.5 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="WEB">🌐 WEB</option>
                <option value="MOBILE">📱 MOBILE</option>
                <option value="API">⚡ API</option>
                <option value="MANUAL">📋 MANUAL</option>
              </select>

              {/* Priority Badge Dropdown */}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="bg-slate-900 border border-slate-800 text-xs font-semibold rounded-md px-2.5 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
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
              placeholder="Test Case Title..."
              className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-800 focus:border-blue-500 focus:outline-none text-slate-100 placeholder-slate-600 transition-colors py-1"
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-3">
            {onRun && (
              <button
                type="button"
                onClick={() => onRun(testCase)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                title="Bu Senaryoyu Koştur"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Case</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
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
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
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
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center space-x-2 text-emerald-400 text-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Değişiklikler başarıyla kaydedildi!</span>
          </div>
        )}

        {/* Form Fields Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Açıklama / Amaç
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Test senaryosunun detaylı açıklaması ve kapsamı..."
              className="w-full bg-surface border border-surface-border rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ön Koşullar (Preconditions)
            </label>
            <textarea
              rows={3}
              value={preconditions}
              onChange={(e) => setPreconditions(e.target.value)}
              placeholder="Örn: Kullanıcı admin yetkisiyle oturum açmış olmalıdır..."
              className="w-full bg-surface border border-surface-border rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center justify-between">
              <span>Linked Jira Story</span>
              {jiraStoryKey && (
                <a
                  href={jiraIssueUrl || `https://company.atlassian.net/browse/${jiraStoryKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-400 hover:underline flex items-center space-x-1 lowercase font-normal"
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
                className="w-full bg-slate-900 border border-blue-500/30 rounded-xl p-2.5 text-xs font-mono font-bold text-blue-400 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
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
              <ListOrdered className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Test Adımları ({steps.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={handleAddStep}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Adım Ekle</span>
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-xs">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-30 text-slate-400" />
              <p>Henüz tanımlanmış bir test adımı bulunmuyor.</p>
              <p className="text-[10px] mt-1 text-slate-600">
                "Adım Ekle" butonunu kullanarak test senaryosu adımlarını tanımlayabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="border border-surface-border rounded-xl overflow-hidden bg-surface/30">
              <div className="grid grid-cols-12 gap-2 bg-slate-900/80 px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-surface-border">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-6">Eylem (Action)</div>
                <div className="col-span-4">Beklenen Sonuç (Expected Result)</div>
                <div className="col-span-1 text-right">İşlem</div>
              </div>

              <div className="divide-y divide-surface-border">
                {steps.map((step, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 p-3 items-start text-xs hover:bg-slate-800/30 transition-colors">
                    <div className="col-span-1 text-center pt-2 font-mono font-bold text-slate-500">
                      {step.stepNumber}
                    </div>

                    <div className="col-span-6">
                      <textarea
                        rows={2}
                        value={step.action}
                        onChange={(e) => handleStepChange(idx, 'action', e.target.value)}
                        placeholder="Örn: 'Giriş Yap' butonuna tıklanır..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div className="col-span-4">
                      <textarea
                        rows={2}
                        value={step.expectedResult || ''}
                        onChange={(e) => handleStepChange(idx, 'expectedResult', e.target.value)}
                        placeholder="Örn: Ana sayfaya yönlendirilir..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div className="col-span-1 text-right pt-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                        title="Adımı Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>
    </main>
  );
};
