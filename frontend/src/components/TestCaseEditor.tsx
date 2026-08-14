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
  Image as ImageIcon,
  Upload,
  Maximize2,
  Edit3,
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
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
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
      setScreenshotUrl(testCase.screenshotUrl || '');
      setSteps(testCase.steps ? [...testCase.steps] : []);
      setSavedSuccess(false);
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
          Sol paneldeki Explorer ağacından incelemek veya düzenlemek istediğiniz senaryoya tıklayın.
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
        screenshotUrl,
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
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 p-6 space-y-6 transition-colors duration-200">
      {/* Editor Header */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-2 max-w-2xl w-full">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center space-x-1.5">
                <FileCode2 className="w-3.5 h-3.5" />
                <span>{testCase.code}</span>
              </span>

              {renderStatusBadge()}

              {/* Type Badge Dropdown */}
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TestType)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-md px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
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
              placeholder="Test senaryosunun detaylı açıklaması ve kapsamı..."
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

        {/* Screenshot Attachment Section */}
        <div className="space-y-3 p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Ekran Görüntüsü (Screenshot)
              </h3>
              {screenshotUrl && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold border border-emerald-500/20">
                  Görsel Ekli
                </span>
              )}
            </div>

            {screenshotUrl && (
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer transition-colors">
                  <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Düzenle</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setScreenshotUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Tam Ekran</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScreenshotUrl('')}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kaldır</span>
                </button>
              </div>
            )}
          </div>

          {screenshotUrl ? (
            <div className="relative group max-w-xl overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-900/40 p-2">
              <img
                src={screenshotUrl}
                alt="Test Case Screenshot"
                className="w-full max-h-64 object-contain rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setIsLightboxOpen(true)}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 backdrop-blur-[2px] rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-500 transition-transform hover:scale-105"
                  title="Tam Ekran İncele"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <label className="p-2 bg-slate-800 text-white rounded-lg shadow-lg hover:bg-slate-700 cursor-pointer transition-transform hover:scale-105" title="Görseli Değiştir">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setScreenshotUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setScreenshotUrl('')}
                  className="p-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-500 transition-transform hover:scale-105"
                  title="Görseli Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ekran görüntüsü eklemek için dosya seçin veya panodan (Ctrl+V) yapıştırın
                </p>
                <p className="text-[10px] text-slate-400">PNG, JPG, WebP desteklenmektedir.</p>
              </div>

              <label className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-95">
                <Upload className="w-3.5 h-3.5" />
                <span>Ekran Görüntüsü Ekle</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setScreenshotUrl(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>

        {/* Lightbox Modal for Fullscreen Image View */}
        {isLightboxOpen && screenshotUrl && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn">
            <div className="absolute top-4 right-4 flex items-center space-x-3">
              <a
                href={screenshotUrl}
                download="test-case-screenshot.png"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              >
                İndir
              </a>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-w-5xl max-h-[85vh] p-2 overflow-auto">
              <img
                src={screenshotUrl}
                alt="Full Screenshot"
                className="max-w-full max-h-[80vh] object-contain rounded-xl border border-slate-800 shadow-2xl"
              />
            </div>
          </div>
        )}

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
                "Adım Ekle" butonunu kullanarak test senaryosu adımlarını tanımlayabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/40 shadow-sm">
              <div className="grid grid-cols-12 gap-2 bg-slate-100 dark:bg-slate-900/80 px-4 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-6">Eylem (Action)</div>
                <div className="col-span-4">Beklenen Sonuç (Expected Result)</div>
                <div className="col-span-1 text-right">İşlem</div>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {steps.map((step, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 p-3 items-start text-xs hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="col-span-1 text-center pt-2 font-mono font-bold text-slate-400 dark:text-slate-500">
                      {step.stepNumber}
                    </div>

                    <div className="col-span-6">
                      <textarea
                        rows={2}
                        value={step.action}
                        onChange={(e) => handleStepChange(idx, 'action', e.target.value)}
                        placeholder="Örn: 'Giriş Yap' butonuna tıklanır..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none shadow-sm"
                      />
                    </div>

                    <div className="col-span-4">
                      <textarea
                        rows={2}
                        value={step.expectedResult || ''}
                        onChange={(e) => handleStepChange(idx, 'expectedResult', e.target.value)}
                        placeholder="Örn: Ana sayfaya yönlendirilir..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none shadow-sm"
                      />
                    </div>

                    <div className="col-span-1 text-right pt-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
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

