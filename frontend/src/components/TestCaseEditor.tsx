import React, { useState, useEffect, useRef } from 'react';
import { TestCase, TestStep, StepAttachment, Priority, TestType } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
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
  ArrowLeft,
  FileText,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Download,
  MessageSquare,
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
  const { can, isViewer } = useAuth();
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
        attachments: [],
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

  const handleAddAttachmentFile = (stepIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) {
        setSteps((prev) => {
          const next = [...prev];
          const currentStep = next[stepIndex];
          const currentAtts = currentStep.attachments || [];
          next[stepIndex] = {
            ...currentStep,
            attachments: [
              ...currentAtts,
              {
                id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                url,
                comment: file.name,
              },
            ],
          };
          return next;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAttachmentCommentChange = (stepIndex: number, attachmentIndex: number, comment: string) => {
    setSteps((prev) => {
      const next = [...prev];
      const currentStep = next[stepIndex];
      const currentAtts = [...(currentStep.attachments || [])];
      if (currentAtts[attachmentIndex]) {
        currentAtts[attachmentIndex] = {
          ...currentAtts[attachmentIndex],
          comment,
        };
        next[stepIndex] = {
          ...currentStep,
          attachments: currentAtts,
        };
      }
      return next;
    });
  };

  const handleRemoveAttachment = (stepIndex: number, attachmentIndex: number) => {
    setSteps((prev) => {
      const next = [...prev];
      const currentStep = next[stepIndex];
      const currentAtts = (currentStep.attachments || []).filter((_, i) => i !== attachmentIndex);
      next[stepIndex] = {
        ...currentStep,
        attachments: currentAtts,
      };
      return next;
    });
  };

  const handlePasteOnStep = (stepIndex: number, e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          hasImage = true;
          handleAddAttachmentFile(stepIndex, file);
        }
      }
    }

    if (hasImage) {
      e.preventDefault();
    }
  };

  const handleDropOnStep = (stepIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          handleAddAttachmentFile(stepIndex, files[i]);
        }
      }
    }
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
      {/* Viewer Read-Only Banner */}
      {isViewer && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center space-x-2 text-xs font-medium">
          <Eye className="w-4 h-4 shrink-0" />
          <span>
            <strong>Gözlemci Modu (Salt Okunur):</strong> Bu test senaryosunda düzenleme veya silme yetkiniz bulunmamaktadır.
          </span>
        </div>
      )}

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
                disabled={isViewer}
                onChange={(e) => {
                  const newExec = e.target.value as 'MANUAL' | 'AUTOMATION';
                  setExecutionType(newExec);
                  if (newExec === 'MANUAL' && !['WEB', 'IOS', 'ANDROID', 'API', 'OTHER'].includes(type)) {
                    setType('WEB');
                  }
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-md px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="MANUAL">📋 MANUEL</option>
                <option value="AUTOMATION">🤖 OTOMASYON</option>
              </select>

              {/* Test Type Dropdown */}
              <select
                value={type}
                disabled={isViewer}
                onChange={(e) => setType(e.target.value as TestType)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-md px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
                disabled={isViewer}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-md px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
              disabled={isViewer}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Test Case Başlığı..."
              className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-800 focus:border-blue-500 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-colors py-1 disabled:cursor-not-allowed"
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-2">
            {onRun && can('EXECUTE_RUN') && (
              <button
                type="button"
                onClick={() => onRun(testCase)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                title="Bu Test Case'i Koştur"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test Case Koştur</span>
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

            {can('DELETE_CASE') && (
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
            )}

            {can('EDIT_CASE') && (
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-[#821c2b]/20 transition-all active:scale-95 cursor-pointer"
              >
                {isSaving ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
              </button>
            )}
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
            <div className="p-8 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-center text-slate-400 dark:text-slate-500 text-xs space-y-3">
              <AlertCircle className="w-6 h-6 mx-auto opacity-30 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Henüz tanımlanmış bir test adımı bulunmuyor.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  "Adım Ekle" butonunu kullanarak Test Case adımlarını tanımlayabilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddStep}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adım Ekle</span>
              </button>
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
                    onPaste={(e) => handlePasteOnStep(idx, e)}
                    onDrop={(e) => handleDropOnStep(idx, e)}
                    onDragOver={(e) => e.preventDefault()}
                    className="p-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors space-y-2.5 focus-within:ring-1 focus-within:ring-blue-500/30 rounded-lg"
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
                          onPaste={(e) => handlePasteOnStep(idx, e)}
                          placeholder="Örn: 'Giriş Yap' butonuna tıklanır..."
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none shadow-sm"
                        />
                      </div>

                      <div className="col-span-4">
                        <textarea
                          rows={2}
                          value={step.expectedResult || ''}
                          onChange={(e) => handleStepChange(idx, 'expectedResult', e.target.value)}
                          onPaste={(e) => handlePasteOnStep(idx, e)}
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

                    {/* Step Attachments Area */}
                    <div className="pl-0 md:pl-8 pt-1.5 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1 mr-1">
                        <ImageIcon className="w-3 h-3 text-blue-500" />
                        <span>Adım Görselleri ({step.attachments?.length || 0}):</span>
                      </span>

                      {/* Attachments List */}
                      {step.attachments && step.attachments.map((att, aIdx) => (
                        <div
                          key={att.id || aIdx}
                          className="relative group flex items-center space-x-1.5 p-1 bg-slate-100/90 dark:bg-slate-950/70 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                        >
                          <img
                            src={att.url}
                            alt={att.comment || `Adım ${step.stepNumber} Görsel ${aIdx + 1}`}
                            className="w-10 h-7 object-cover rounded cursor-pointer hover:opacity-85 transition-opacity"
                            onClick={() => setActiveLightbox({
                              url: att.url,
                              caption: `Adım ${step.stepNumber} Görsel #${aIdx + 1}${att.comment ? ` - ${att.comment}` : ''}`,
                            })}
                            title="Büyütmek için tıklayın"
                          />
                          <input
                            type="text"
                            placeholder="Açıklama..."
                            value={att.comment || ''}
                            onChange={(e) => handleAttachmentCommentChange(idx, aIdx, e.target.value)}
                            className="text-[10px] bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none w-24 md:w-32 text-slate-700 dark:text-slate-300 placeholder-slate-400 py-0.5"
                            title="Görsel açıklaması"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx, aIdx)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Görseli Kaldır"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* Upload Image Button & Paste Hint */}
                      <label className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer transition-colors shadow-xs">
                        <Plus className="w-3 h-3 text-blue-500" />
                        <span>Görsel Ekle</span>
                        <kbd className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">Ctrl+V</kbd>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleAddAttachmentFile(idx, file);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
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
                download="test-step-attachment.png"
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 shadow-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>İndir</span>
              </a>
              <button
                type="button"
                onClick={() => setActiveLightbox(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 shadow-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-w-5xl max-h-[85vh] p-2 flex flex-col items-center space-y-3 overflow-auto">
              <img
                src={activeLightbox.url}
                alt={activeLightbox.caption || 'Adım Görseli'}
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
      </form>
    </main>
  );
};
