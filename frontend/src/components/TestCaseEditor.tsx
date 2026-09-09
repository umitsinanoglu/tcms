'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestCase, TestStep, Priority, TestType, ExecutionType, TestCaseStats, TestCaseHistory } from '@/services/api';
import { TestCasesService } from '@/services/api';
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
  ListOrdered,
  X,
  Eye,
  ArrowLeft,
  Zap,
  Folder,
  Copy,
  ArrowUp,
  ArrowDown,
  Code,
  Check,
  Tag,
  BarChart2,
  Clock,
  History,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { exportTestCaseToGherkin, exportTestCaseToPlaywright } from '@/utils/scenarioParsers';

interface TestCaseEditorProps {
  testCase: TestCase | null;
  onSave: (updatedCase: Partial<TestCase>) => Promise<void>;
  onDelete: (caseId: string) => Promise<void>;
  onQuickRun?: (testCase: TestCase) => void;
  onClose?: () => void;
  onBack?: () => void;
}

export const TestCaseEditor: React.FC<TestCaseEditorProps> = ({
  testCase,
  onSave,
  onDelete,
  onQuickRun,
  onClose,
  onBack,
}) => {
  const { can, isViewer } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jiraStoryKey, setJiraStoryKey] = useState('');
  const [jiraIssueUrl, setJiraIssueUrl] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [type, setType] = useState<TestType>('WEB');
  const [executionType, setExecutionType] = useState<ExecutionType>('MANUAL');
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Code Export Preview state
  const [codePreviewType, setCodePreviewType] = useState<'NONE' | 'CUCUMBER' | 'PLAYWRIGHT'>('NONE');
  const [copiedCode, setCopiedCode] = useState(false);

  // Quality Metrics state
  const [caseStats, setCaseStats] = useState<TestCaseStats | null>(null);
  const [caseHistory, setCaseHistory] = useState<TestCaseHistory | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const prevCaseIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (testCase) {
      if (prevCaseIdRef.current !== testCase.id) {
        prevCaseIdRef.current = testCase.id;
        setTitle(testCase.title || '');
        setDescription(testCase.description || '');
        setJiraStoryKey(testCase.jiraStoryKey || '');
        setJiraIssueUrl(testCase.jiraIssueUrl || '');
        setPreconditions(testCase.preconditions || testCase.precondition || '');
        setPriority(testCase.priority || 'NORMAL');
        setType(testCase.type || 'WEB');
        setExecutionType(testCase.executionType || 'MANUAL');
        setSteps(
          testCase.steps
            ? testCase.steps.map((s) => ({
                stepNumber: s.stepNumber,
                action: s.action,
                expectedResult: s.expectedResult,
              }))
            : []
        );
        setSavedSuccess(false);
        setCodePreviewType('NONE');
        // Fetch quality metrics for the newly selected test case
        setStatsLoading(true);
        setCaseStats(null);
        setCaseHistory(null);
        Promise.all([
          TestCasesService.getStats(testCase.id),
          TestCasesService.getHistory(testCase.id, 15),
        ])
          .then(([stats, history]) => {
            setCaseStats(stats);
            setCaseHistory(history);
          })
          .catch(() => { /* silently fail — non-critical */ })
          .finally(() => setStatsLoading(false));
      }
    } else {
      prevCaseIdRef.current = null;
      setCaseStats(null);
      setCaseHistory(null);
    }
  }, [testCase]);

  // Keyboard shortcut Ctrl+S / Cmd+S for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (can('EDIT_CASE') && !isViewer && testCase) {
          handleSaveDirect();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [testCase, title, description, jiraStoryKey, preconditions, priority, type, executionType, steps, isViewer]);

  const handleSaveDirect = useCallback(async () => {
    if (!testCase) return;
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await onSave({
        id: testCase.id,
        title,
        description,
        jiraStoryKey,
        preconditions,
        priority,
        type,
        executionType,
        steps,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [testCase, title, description, jiraStoryKey, preconditions, priority, type, executionType, steps, onSave]);

  if (!testCase) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#090d16] transition-colors duration-200">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4 shadow-sm">
          <Layers className="w-8 h-8 text-slate-400 dark:text-slate-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bir Test Case Seçin</h3>
        <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
          Sol paneldeki Explorer ağacından veya listeden incelemek ve düzenlemek istediğiniz Test Case'e tıklayın.
        </p>
      </div>
    );
  }

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

  const handleDuplicateStep = (index: number) => {
    const target = steps[index];
    if (!target) return;
    const newSteps = [...steps];
    newSteps.splice(index + 1, 0, {
      ...target,
      stepNumber: index + 2,
    });
    setSteps(newSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
  };

  const handleMoveStep = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    setSteps(newSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveDirect();
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Generate code export representations on the fly
  const currentTestCaseSnapshot: TestCase = {
    ...testCase,
    title,
    description,
    jiraStoryKey,
    preconditions,
    priority,
    type,
    executionType,
    steps,
  };

  const gherkinCode = exportTestCaseToGherkin(currentTestCaseSnapshot);
  const playwrightCode = exportTestCaseToPlaywright(currentTestCaseSnapshot);

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
          <div className="space-y-3 w-full">
            {/* Header Navigation & Code Tag */}
            <div className="flex items-center flex-wrap gap-2">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-95 cursor-pointer h-8"
                  title="Önceki ekrana dön"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>Geri</span>
                </button>
              )}

              <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 inline-flex items-center space-x-1.5 h-8">
                <FileCode2 className="w-3.5 h-3.5" />
                <span>{testCase.code}</span>
              </span>

              {testCase.suite?.name && (
                <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-flex items-center space-x-1.5 h-8">
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>Modül: {testCase.suite.name}</span>
                </span>
              )}

              {testCase.updatedAt && (
                <span className="text-xs font-mono font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 inline-flex items-center space-x-1.5 h-8" title={`Son Güncelleme: ${new Date(testCase.updatedAt).toLocaleString('tr-TR')}`}>
                  <span>Son Güncelleme: {new Date(testCase.updatedAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              )}

              {/* Code Preview Buttons */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 h-8">
                <button
                  type="button"
                  onClick={() => setCodePreviewType(codePreviewType === 'CUCUMBER' ? 'NONE' : 'CUCUMBER')}
                  className={`px-2 py-1 text-[11px] font-bold rounded flex items-center space-x-1 transition-all cursor-pointer ${
                    codePreviewType === 'CUCUMBER'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                  title="Bu senaryonun Cucumber Gherkin formatını gör"
                >
                  <span>🥒 Gherkin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCodePreviewType(codePreviewType === 'PLAYWRIGHT' ? 'NONE' : 'PLAYWRIGHT')}
                  className={`px-2 py-1 text-[11px] font-bold rounded flex items-center space-x-1 transition-all cursor-pointer ${
                    codePreviewType === 'PLAYWRIGHT'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                  title="Bu senaryonun Playwright TypeScript test formatını gör"
                >
                  <span>🎭 Playwright</span>
                </button>
              </div>
            </div>

            <input
              type="text"
              value={title}
              disabled={isViewer}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Test Senaryosu Başlığı..."
              className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-800 focus:border-[var(--accent-primary)] focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-colors py-1 disabled:cursor-not-allowed"
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-2 shrink-0">
            {onQuickRun && (
              <button
                type="button"
                onClick={() => onQuickRun(testCase)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Bu Test Senaryosunu Hızlı Koştur (N defa tekrarlanabilir)"
              >
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>⚡ Hızlı Test Koşumu</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Kapat / Editörü Temizle"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {can('DELETE_CASE') && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Bu Test Senaryosunu silmek istediğinize emin misiniz?')) {
                    onDelete(testCase.id);
                  }
                }}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                title="Test Senaryosunu Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {can('EDIT_CASE') && (
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-accent-gradient hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-[var(--accent-dark)]/25 transition-all active:scale-95 cursor-pointer"
                title="Değişiklikleri Kaydet (Kısayol: Cmd+S / Ctrl+S)"
              >
                {isSaving ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                <span className="text-[10px] opacity-70 font-mono hidden sm:inline">(Cmd+S)</span>
              </button>
            )}
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Değişiklikler başarıyla güncellendi ve kaydedildi!</span>
          </div>
        )}

        {/* Code Preview Drawer / Accordion */}
        {codePreviewType !== 'NONE' && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="font-bold">
                  {codePreviewType === 'CUCUMBER' ? '🥒 Cucumber BDD (Gherkin) Formatı' : '🎭 Playwright Test Spec Formatı'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCopyCode(codePreviewType === 'CUCUMBER' ? gherkinCode : playwrightCode)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCodePreviewType('NONE')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <pre className="p-3 rounded-lg bg-black/50 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300 max-h-60">
              {codePreviewType === 'CUCUMBER' ? gherkinCode : playwrightCode}
            </pre>
          </div>
        )}

        {/* Meta Configuration Fields (Execution Type, Type, Priority) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Execution Type */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Yürütme Türü
            </label>
            <select
              value={executionType}
              disabled={isViewer}
              onChange={(e) => setExecutionType(e.target.value as ExecutionType)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            >
              <option value="MANUAL">MANUAL (Manuel Koşum)</option>
              <option value="AUTOMATED">AUTOMATED (Otomasyon / TAC / Playwright)</option>
            </select>
          </div>

          {/* Test Type */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Platform / Test Tipi
            </label>
            <select
              value={type}
              disabled={isViewer}
              onChange={(e) => setType(e.target.value as TestType)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            >
              <option value="DESKTOP">🖥️ DESKTOP (Core Bankacılık Desktop İstemcisi)</option>
              <option value="WEB">🌐 WEB (İnternet Şubesi / Web Uygulaması)</option>
              <option value="IOS">🍏 IOS (Mobil Şube - Apple iOS)</option>
              <option value="ANDROID">🤖 ANDROID (Mobil Şube - Android)</option>
              <option value="API">⚡ API (Core Servisler & Gateway)</option>
              <option value="PERFORMANCE">⏱️ PERFORMANCE (Performans)</option>
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Öncelik Seviyesi
            </label>
            <select
              value={priority}
              disabled={isViewer}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            >
              <option value="LOW">LOW (Düşük)</option>
              <option value="NORMAL">NORMAL (Normal)</option>
              <option value="CRITICAL">CRITICAL (Kritik / Smoke)</option>
              <option value="BLOCKER">BLOCKER (Bloker / Acil)</option>
            </select>
          </div>
        </div>

        {/* Detailed Form Fields Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Açıklama / Kapsam
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Test senaryosunun genel kapsamı ve amacı..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none shadow-xs"
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
              placeholder="Örn: Test öncesi hazır olması gereken kullanıcı, veri veya sistem durumu..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none shadow-xs"
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
                className="w-full bg-white dark:bg-slate-900 border border-blue-500/30 rounded-xl p-2.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase shadow-xs"
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
              <ListOrdered className="w-4 h-4 text-[var(--accent-primary)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Test Adımları ({steps.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={handleAddStep}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
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
                  "Adım Ekle" butonunu kullanarak Test Senaryosu adımlarını tanımlayabilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddStep}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adım Ekle</span>
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/40 shadow-xs">
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
                    className="p-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors focus-within:ring-1 focus-within:ring-[var(--accent-primary)]/30 rounded-lg"
                  >
                    <div className="grid grid-cols-12 gap-2 items-start text-xs">
                      <div className="col-span-1 flex flex-col items-center space-y-1 pt-1">
                        <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                          {step.stepNumber}
                        </span>
                        <div className="flex flex-col space-y-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, 'UP')}
                            disabled={idx === 0}
                            className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                            title="Yukarı Taşı"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, 'DOWN')}
                            disabled={idx === steps.length - 1}
                            className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                            title="Aşağı Taşı"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="col-span-6">
                        <textarea
                          rows={2}
                          value={step.action}
                          onChange={(e) => handleStepChange(idx, 'action', e.target.value)}
                          placeholder="Örn: 'Giriş Yap' butonuna tıklanır..."
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none shadow-xs"
                        />
                      </div>

                      <div className="col-span-4">
                        <textarea
                          rows={2}
                          value={step.expectedResult || ''}
                          onChange={(e) => handleStepChange(idx, 'expectedResult', e.target.value)}
                          placeholder="Örn: Ana sayfaya yönlendirilir ve kullanıcı paneli açılır..."
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none shadow-xs"
                        />
                      </div>

                      <div className="col-span-1 flex flex-col items-end space-y-1 pt-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateStep(idx)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="Bu Adımı Çoğalt"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Adımı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* ─── Quality Metrics Panel ─── */}
      {testCase && (
        <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Koşum Kalite Metrikleri
            </h3>
            {statsLoading && (
              <span className="text-[10px] text-slate-400 animate-pulse">Yükleniyor...</span>
            )}
          </div>

          {/* Stats Row */}
          {caseStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Pass Rate */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pass Rate</span>
                </div>
                {caseStats.totalRuns === 0 ? (
                  <p className="text-xs text-slate-400">Henüz koşum yok</p>
                ) : (
                  <>
                    <p className={`text-xl font-black ${
                      (caseStats.passRate ?? 0) >= 80 ? 'text-emerald-500' :
                      (caseStats.passRate ?? 0) >= 50 ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {caseStats.passRate ?? 0}%
                    </p>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          (caseStats.passRate ?? 0) >= 80 ? 'bg-emerald-500' :
                          (caseStats.passRate ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${caseStats.passRate ?? 0}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Flakiness */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Flakiness</span>
                </div>
                {caseStats.totalRuns === 0 ? (
                  <p className="text-xs text-slate-400">—</p>
                ) : (
                  <p className={`text-xl font-black ${
                    (caseStats.flakyScore ?? 0) === 0 ? 'text-emerald-500' :
                    (caseStats.flakyScore ?? 0) < 20 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {caseStats.flakyScore ?? 0}%
                  </p>
                )}
              </div>

              {/* Avg Duration */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ort. Süre</span>
                </div>
                <p className="text-xl font-black text-blue-500">
                  {caseStats.avgDurationMs != null
                    ? caseStats.avgDurationMs < 1000
                      ? `${caseStats.avgDurationMs}ms`
                      : `${(caseStats.avgDurationMs / 1000).toFixed(1)}s`
                    : '—'}
                </p>
              </div>

              {/* Total Runs */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Toplam Koşum</span>
                </div>
                <p className="text-xl font-black text-purple-500">{caseStats.totalRuns}</p>
                {caseStats.lastExecutedAt && (
                  <p className="text-[10px] text-slate-400">
                    Son: {new Date(caseStats.lastExecutedAt).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Run History Table */}
          {caseHistory && caseHistory.history.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Son {caseHistory.history.length} Koşum
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/40">
                <div className="grid grid-cols-12 gap-2 bg-slate-100 dark:bg-slate-900/80 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <div className="col-span-2">Sonuç</div>
                  <div className="col-span-3">Koşum</div>
                  <div className="col-span-2">Ortam</div>
                  <div className="col-span-2">Süre</div>
                  <div className="col-span-3">Tarih</div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                  {caseHistory.history.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'PASSED'  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                          item.status === 'FAILED'  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          item.status === 'BLOCKED' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                                      'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {item.status === 'PASSED' ? '✓' : item.status === 'FAILED' ? '✗' : item.status === 'BLOCKED' ? '⊘' : '↷'} {item.status}
                        </span>
                      </div>
                      <div className="col-span-3 truncate text-slate-700 dark:text-slate-300 font-medium" title={item.testRun?.title}>
                        {item.testRun?.title ?? '—'}
                      </div>
                      <div className="col-span-2 text-slate-500 truncate">{item.environment ?? item.testRun?.environment ?? '—'}</div>
                      <div className="col-span-2 text-slate-500 font-mono">
                        {item.executionMs != null
                          ? item.executionMs < 1000
                            ? `${item.executionMs}ms`
                            : `${(item.executionMs / 1000).toFixed(1)}s`
                          : '—'}
                      </div>
                      <div className="col-span-3 text-slate-400 font-mono text-[10px]">
                        {new Date(item.executedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        {' '}
                        {new Date(item.executedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!statsLoading && caseStats?.totalRuns === 0 && (
            <div className="p-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600 dark:text-slate-400">Henüz koşum geçmişi yok.</p>
              <p>Bu senaryoyu koşturduğunuzda kalite metrikleri burada görünecektir.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
};
