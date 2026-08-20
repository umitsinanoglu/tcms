'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TestCase, TestRunsService, ResultStatus, TestRun } from '@/services/api';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  SkipForward,
  Slash,
  ChevronRight,
  ChevronLeft,
  Keyboard,
  Trophy,
  RotateCcw,
  Zap,
  Bug,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  Trash2,
  Maximize2,
  Edit3,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

interface ManualRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  testCases: TestCase[];
}

export const ManualRunModal: React.FC<ManualRunModalProps> = ({
  isOpen,
  onClose,
  projectId,
  testCases,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeRun, setActiveRun] = useState<TestRun | null>(null);
  const [results, setResults] = useState<
    Record<string, { status: ResultStatus; errorMessage?: string; jiraBugKey?: string; jiraBugUrl?: string; screenshotUrl?: string }>
  >({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [title, setTitle] = useState('Sprint 24 Regresyon');
  const [version, setVersion] = useState('v2.4.0-rc1');
  const [environment, setEnvironment] = useState('STAGING');
  const [executedBy, setExecutedBy] = useState('Ahmet Yılmaz');
  const [testerEmail, setTesterEmail] = useState('ahmet.yilmaz@sirket.com');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    blocked: number;
    passRate: number;
  } | null>(null);

  const currentCase = testCases[currentIndex] || null;

  // Initialize or Reset Run state
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setResults({});
      setIsSubmitted(false);
      setSummaryData(null);
      setActiveRun(null);
      setLightboxImage(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const handleMarkStatus = useCallback(
    (status: ResultStatus) => {
      if (!currentCase) return;

      setResults((prev) => ({
        ...prev,
        [currentCase.id]: {
          ...prev[currentCase.id],
          status,
          // Pre-fill screenshot from currentCase if available and not yet set
          screenshotUrl: prev[currentCase.id]?.screenshotUrl ?? currentCase.screenshotUrl ?? undefined,
        },
      }));
    },
    [currentCase]
  );

  const handleErrorMessageChange = (caseId: string, msg: string) => {
    setResults((prev) => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        status: prev[caseId]?.status || 'PASSED',
        errorMessage: msg,
      },
    }));
  };

  const handleScreenshotChange = (caseId: string, screenshotUrl: string) => {
    setResults((prev) => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        status: prev[caseId]?.status || 'PASSED',
        screenshotUrl,
      },
    }));
  };

  const handleCreateJiraBugMock = (caseId: string, caseCode: string) => {
    const bugNum = Math.floor(Math.random() * 800) + 100;
    const bugKey = `MOB-${bugNum}`;
    const bugUrl = `https://company.atlassian.net/browse/${bugKey}`;

    setResults((prev) => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        status: prev[caseId]?.status || 'FAILED',
        jiraBugKey: bugKey,
        jiraBugUrl: bugUrl,
      },
    }));
  };

  // Support pasting screenshot from clipboard (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen || isSubmitted || !currentCase) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              handleScreenshotChange(currentCase.id, reader.result as string);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, isSubmitted, currentCase]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    if (!isOpen || isSubmitted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const key = e.key.toUpperCase();
      if (key === 'P') {
        e.preventDefault();
        handleMarkStatus('PASSED');
      } else if (key === 'F') {
        e.preventDefault();
        handleMarkStatus('FAILED');
      } else if (key === 'S') {
        e.preventDefault();
        handleMarkStatus('SKIPPED');
      } else if (key === 'B') {
        e.preventDefault();
        handleMarkStatus('BLOCKED');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < testCases.length - 1) setCurrentIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitted, handleMarkStatus, currentIndex, testCases.length]);

  if (!isOpen) return null;

  const handleSubmitRun = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (!projectId) {
        throw new Error('Proje kimliği bulunamadı. Lütfen bir proje seçtiğinizden emin olun.');
      }

      // 1. Create or get TestRun
      let run = activeRun;
      if (!run) {
        run = await TestRunsService.createRun(projectId, {
          title: title.trim() || `Test Koşusu - ${version}`,
          version: version.trim() || 'v1.0.0',
          environment,
          executedBy: executedBy.trim() || 'QA Tester',
          testerEmail: testerEmail.trim() || 'tester@company.com',
        });
        setActiveRun(run);
      }

      // 2. Save results
      const resultsPayload = testCases.map((tc) => {
        const res = results[tc.id];
        return {
          testCaseId: tc.id,
          status: res ? res.status : ('SKIPPED' as ResultStatus),
          executionMs: Math.floor(Math.random() * 800) + 200,
          errorMessage: res?.errorMessage || undefined,
          jiraBugKey: res?.jiraBugKey,
          jiraBugUrl: res?.jiraBugUrl,
          screenshotUrl: res?.screenshotUrl ?? tc.screenshotUrl,
        };
      });

      await TestRunsService.saveResults(projectId, run.id, { results: resultsPayload });

      // 3. Complete run
      await TestRunsService.completeRun(run.id, 'COMPLETED');

      // Calculate summary stats
      const total = resultsPayload.length;
      const passed = resultsPayload.filter((r) => r.status === 'PASSED').length;
      const failed = resultsPayload.filter((r) => r.status === 'FAILED').length;
      const skipped = resultsPayload.filter((r) => r.status === 'SKIPPED').length;
      const blocked = resultsPayload.filter((r) => r.status === 'BLOCKED').length;
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

      setSummaryData({ total, passed, failed, skipped, blocked, passRate });
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting run:', err);
      if (err?.response?.status === 413 || err?.message?.includes('413') || err?.message?.toLowerCase().includes('payload too large') || err?.message?.toLowerCase().includes('too large')) {
        setErrorMsg('Boyut limiti hatası (413 Payload Too Large): Ekran görüntüleri veya veri boyutu sınırı aştı. Lütfen daha küçük görsel yükleyin veya görseli optimize edin.');
      } else {
        const serverMessage = err?.response?.data?.message;
        const formattedMsg = Array.isArray(serverMessage) ? serverMessage.join(', ') : serverMessage;
        setErrorMsg(formattedMsg || err?.message || 'Test koşusu kaydedilirken beklenmeyen bir hata oluştu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentResult = currentCase ? results[currentCase.id] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <span>Manuel Test Koşum Paneli</span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {testCases.length} Test Case
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Test Case'ler seviyesinde sonuçları veritabanına ve Jira Hata takibine işleyin.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Koşu Başlığı"
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
            />

            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v2.4.0-rc1"
              className="w-24 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
            />

            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="STAGING">STAGING</option>
              <option value="PREPROD">PREPROD</option>
              <option value="PROD">PROD</option>
              <option value="DEV">DEV</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 rounded-xl flex items-start justify-between text-xs text-red-700 dark:text-red-300 animate-fadeIn shrink-0 shadow-sm">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Kayıt Başarısız:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="p-1 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors ml-2"
              title="Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        {isSubmitted && summaryData ? (
          /* Summary View */
          <div className="p-8 flex-1 flex flex-col items-center justify-center space-y-6 text-center overflow-y-auto bg-white dark:bg-slate-900">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Test Koşusu Tamamlandı!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {title} — {version} ({environment}) sonuçları başarıyla kaydedildi.
              </p>
            </div>

            {/* Score Ring */}
            <div className="w-32 h-32 rounded-full border-4 border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                %{summaryData.passRate}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                Başarı Oranı
              </span>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-4 gap-4 w-full max-w-lg">
              <div className="bg-slate-50 dark:bg-slate-900/80 border border-emerald-500/20 p-3 rounded-xl">
                <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {summaryData.passed}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Başarılı</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/80 border border-red-500/20 p-3 rounded-xl">
                <span className="block text-lg font-bold text-red-600 dark:text-red-400 font-mono">
                  {summaryData.failed}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Başarısız</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 p-3 rounded-xl">
                <span className="block text-lg font-bold text-slate-600 dark:text-slate-400 font-mono">
                  {summaryData.skipped}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Atlandı</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/80 border border-purple-500/20 p-3 rounded-xl">
                <span className="block text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">
                  {summaryData.blocked}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Engellendi</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-2">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setSummaryData(null);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yeniden Düzenle</span>
              </button>

              <button
                onClick={onClose}
                className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all"
              >
                <span>Kapat</span>
              </button>
            </div>
          </div>
        ) : testCases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex-1">
            Koşulacak Test Case bulunamadı.
          </div>
        ) : (
          /* Active Test Execution View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation & Status Header */}
            <div className="px-6 py-2 bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-4">
                <span>
                  Test Case <strong className="text-slate-900 dark:text-white">{currentIndex + 1}</strong> / {testCases.length}
                </span>

                <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                  <Keyboard className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  <span>
                    Kısayollar: <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-emerald-600 dark:text-emerald-400">P</kbd> Başarılı |{' '}
                    <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-red-600 dark:text-red-400">F</kbd> Başarısız |{' '}
                    <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-600 dark:text-slate-400">S</kbd> Atla |{' '}
                    <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-purple-600 dark:text-purple-400">B</kbd> Engelle
                  </span>
                </div>
              </div>

              {currentResult?.status ? (
                <span
                  className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                    currentResult.status === 'PASSED'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : currentResult.status === 'FAILED'
                      ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                      : currentResult.status === 'BLOCKED'
                      ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                      : 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                  }`}
                >
                  {currentResult.status === 'PASSED'
                    ? 'BAŞARILI'
                    : currentResult.status === 'FAILED'
                    ? 'BAŞARISIZ'
                    : currentResult.status === 'BLOCKED'
                    ? 'ENGELLENDİ'
                    : 'ATLANDI'}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Değerlendirilmedi</span>
              )}
            </div>

            {/* Active TestCase Detail */}
            {currentCase && (
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                      {currentCase.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {currentCase.type === 'MANUAL' ? 'MANUEL' : currentCase.type}
                    </span>
                    {currentCase.jiraStoryKey && (
                      <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {currentCase.jiraStoryKey}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{currentCase.title}</h3>
                  {currentCase.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      {currentCase.description}
                    </p>
                  )}
                </div>

                {/* Steps Description (Read only context for manual evaluation) */}
                {currentCase.steps && currentCase.steps.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Test Adımları ({currentCase.steps.length})
                    </h4>
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      {currentCase.steps.map((step, idx) => (
                        <div key={idx} className="space-y-1.5 text-xs pb-1.5 border-b border-slate-200/50 dark:border-slate-800/50 last:border-none last:pb-0">
                          <div className="flex items-start space-x-2">
                            <span className="font-mono text-slate-400 dark:text-slate-500 font-bold">{step.stepNumber}.</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{step.action}</span>
                            {step.expectedResult && (
                              <span className="text-emerald-600 dark:text-emerald-400/80 font-mono text-[11px]">
                                → {step.expectedResult}
                              </span>
                            )}
                          </div>

                          {/* Step Reference Screenshots & Comments */}
                          {step.attachments && step.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1 pl-4">
                              {step.attachments.map((att, aIdx) => (
                                <div
                                  key={att.id || aIdx}
                                  className="flex items-center space-x-2 p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                                >
                                  <img
                                    src={att.url}
                                    alt={att.comment || `Adım ${step.stepNumber} Görsel ${aIdx + 1}`}
                                    className="w-14 h-10 object-contain rounded bg-slate-100 dark:bg-slate-900 cursor-pointer hover:opacity-90 transition-opacity border border-slate-200 dark:border-slate-700"
                                    onClick={() => window.open(att.url, '_blank')}
                                    title="Görseli sekmede aç"
                                  />
                                  {att.comment && (
                                    <span className="text-[11px] text-slate-600 dark:text-slate-300 max-w-[180px] truncate" title={att.comment}>
                                      {att.comment}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PASSED Extra Fields: Success Screenshot & Comment/Note */}
                {currentResult?.status === 'PASSED' && (
                  <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl space-y-3.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Başarılı Test Detayları & Kanıt</span>
                      </span>

                      {(currentResult.screenshotUrl || currentCase.screenshotUrl) && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold border border-emerald-500/30">
                          Görsel Ekli
                        </span>
                      )}
                    </div>

                    {/* Comment / Note for PASSED */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Başarı Yorumu / Koşu Notu (İsteğe bağlı):</span>
                      </label>
                      <textarea
                        rows={2}
                        value={currentResult.errorMessage || ''}
                        onChange={(e) => handleErrorMessageChange(currentCase.id, e.target.value)}
                        placeholder="Örn: Senaryo adımları başarıyla doğrulandı, beklenen sonuçlar elde edildi..."
                        className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/30 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                      />
                    </div>

                    {/* Screenshot Upload / Paste */}
                    <div className="space-y-1.5 pt-1 border-t border-emerald-500/20">
                      <label className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1.5 uppercase tracking-wider">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Ekran Görüntüsü / Kanıt (İsteğe bağlı)</span>
                      </label>

                      {currentResult.screenshotUrl || currentCase.screenshotUrl ? (
                        <div className="relative group max-w-md overflow-hidden rounded-xl border border-emerald-500/30 bg-white dark:bg-slate-900/60 p-2">
                          <img
                            src={currentResult.screenshotUrl || currentCase.screenshotUrl}
                            alt="Başarı Ekran Görüntüsü"
                            className="w-full max-h-48 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxImage(currentResult.screenshotUrl || currentCase.screenshotUrl || null)}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 backdrop-blur-[2px] rounded-xl">
                            <button
                              type="button"
                              onClick={() => setLightboxImage(currentResult.screenshotUrl || currentCase.screenshotUrl || null)}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-transform hover:scale-105"
                              title="Büyüt / Tam Ekran"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <label className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 cursor-pointer transition-transform hover:scale-105" title="Görseli Değiştir">
                              <Edit3 className="w-4 h-4 text-emerald-400" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => handleScreenshotChange(currentCase.id, reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleScreenshotChange(currentCase.id, '')}
                              className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-transform hover:scale-105"
                              title="Görseli Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border-2 border-dashed border-emerald-300 dark:border-emerald-500/30 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-center space-y-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Başarılı test koşusuna ait ekran görüntüsü ekleyin (İsteğe bağlı)
                          </p>
                          <div className="flex items-center justify-center space-x-2">
                            <label className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95">
                              <Upload className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Ekran Görüntüsü Yükle</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => handleScreenshotChange(currentCase.id, reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <span className="text-[11px] text-slate-400 font-mono">veya Ctrl+V ile yapıştırın</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* BLOCKED Extra Fields: Screenshot & Reason/Comment */}
                {currentResult?.status === 'BLOCKED' && (
                  <div className="p-4 bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 dark:border-purple-500/30 rounded-xl space-y-3.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Slash className="w-4 h-4 text-purple-500" />
                        <span>Engellenme (Blocked) Kanıtı & Yorum</span>
                      </span>

                      {(currentResult.screenshotUrl || currentCase.screenshotUrl) && (
                        <span className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-mono font-semibold border border-purple-500/30">
                          Görsel Ekli
                        </span>
                      )}
                    </div>

                    {/* Comment / Reason for BLOCKED */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                        <span>Engellenme Nedeni / Yorum:</span>
                      </label>
                      <textarea
                        rows={2}
                        value={currentResult.errorMessage || ''}
                        onChange={(e) => handleErrorMessageChange(currentCase.id, e.target.value)}
                        placeholder="Örn: Bağımlı servis çalışmadığı veya test ortamı kapalı olduğu için test edilemedi..."
                        className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-500/30 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-sm"
                      />
                    </div>

                    {/* Screenshot Upload / Paste */}
                    <div className="space-y-1.5 pt-1 border-t border-purple-500/20">
                      <label className="text-[11px] text-purple-600 dark:text-purple-400 font-bold flex items-center space-x-1.5 uppercase tracking-wider">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                        <span>Ekran Görüntüsü / Kanıt (İsteğe bağlı)</span>
                      </label>

                      {currentResult.screenshotUrl || currentCase.screenshotUrl ? (
                        <div className="relative group max-w-md overflow-hidden rounded-xl border border-purple-500/30 bg-white dark:bg-slate-900/60 p-2">
                          <img
                            src={currentResult.screenshotUrl || currentCase.screenshotUrl}
                            alt="Blocked Ekran Görüntüsü"
                            className="w-full max-h-48 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxImage(currentResult.screenshotUrl || currentCase.screenshotUrl || null)}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 backdrop-blur-[2px] rounded-xl">
                            <button
                              type="button"
                              onClick={() => setLightboxImage(currentResult.screenshotUrl || currentCase.screenshotUrl || null)}
                              className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-transform hover:scale-105"
                              title="Büyüt / Tam Ekran"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <label className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 cursor-pointer transition-transform hover:scale-105" title="Görseli Değiştir">
                              <Edit3 className="w-4 h-4 text-purple-400" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => handleScreenshotChange(currentCase.id, reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleScreenshotChange(currentCase.id, '')}
                              className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-transform hover:scale-105"
                              title="Görseli Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border-2 border-dashed border-purple-300 dark:border-purple-500/30 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-center space-y-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Engellenme durumuna dair ekran görüntüsü ekleyin (İsteğe bağlı)
                          </p>
                          <div className="flex items-center justify-center space-x-2">
                            <label className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-purple-500/10 dark:bg-purple-500/20 hover:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-600 dark:text-purple-300 border border-purple-500/30 dark:border-purple-500/40 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95">
                              <Upload className="w-3.5 h-3.5 text-purple-500" />
                              <span>Ekran Görüntüsü Yükle</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => handleScreenshotChange(currentCase.id, reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <span className="text-[11px] text-slate-400 font-mono">veya Ctrl+V ile yapıştırın</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SKIPPED Extra Fields: Reason/Comment & Screenshot */}
                {currentResult?.status === 'SKIPPED' && (
                  <div className="p-4 bg-slate-500/5 dark:bg-slate-500/10 border border-slate-500/20 dark:border-slate-500/30 rounded-xl space-y-3.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <SkipForward className="w-4 h-4 text-slate-400" />
                        <span>Atlanma (Skipped) Nedeni & Yorum</span>
                      </span>

                      {(currentResult.screenshotUrl || currentCase.screenshotUrl) && (
                        <span className="text-[10px] bg-slate-500/20 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono font-semibold border border-slate-500/30">
                          Görsel Ekli
                        </span>
                      )}
                    </div>

                    {/* Comment / Reason for SKIPPED */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>Atlanma Nedeni / Yorum (İsteğe bağlı):</span>
                      </label>
                      <textarea
                        rows={2}
                        value={currentResult.errorMessage || ''}
                        onChange={(e) => handleErrorMessageChange(currentCase.id, e.target.value)}
                        placeholder="Örn: Test senaryosu bu sürümde kapsam dışı bırakıldı veya özellik aktif değil..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-500/30 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-500 shadow-sm"
                      />
                    </div>

                    {/* Screenshot Upload / Paste */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-500/20">
                      <label className="text-[11px] text-slate-600 dark:text-slate-300 font-bold flex items-center space-x-1.5 uppercase tracking-wider">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ekran Görüntüsü / Kanıt (İsteğe bağlı)</span>
                      </label>

                      {currentResult.screenshotUrl || currentCase.screenshotUrl ? (
                        <div className="relative group max-w-md overflow-hidden rounded-xl border border-slate-500/30 bg-white dark:bg-slate-900/60 p-2">
                          <img
                            src={currentResult.screenshotUrl || currentCase.screenshotUrl}
                            alt="Skipped Ekran Görüntüsü"
                            className="w-full max-h-48 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxImage(currentResult.screenshotUrl || currentCase.screenshotUrl || null)}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 backdrop-blur-[2px] rounded-xl">
                            <button
                              type="button"
                              onClick={() => setLightboxImage(currentResult.screenshotUrl || currentCase.screenshotUrl || null)}
                              className="p-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-transform hover:scale-105"
                              title="Büyüt / Tam Ekran"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <label className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 cursor-pointer transition-transform hover:scale-105" title="Görseli Değiştir">
                              <Edit3 className="w-4 h-4 text-slate-300" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => handleScreenshotChange(currentCase.id, reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleScreenshotChange(currentCase.id, '')}
                              className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-transform hover:scale-105"
                              title="Görseli Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-center space-y-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Atlanma durumuna dair ekran görüntüsü ekleyebilirsiniz (İsteğe bağlı)
                          </p>
                          <div className="flex items-center justify-center space-x-2">
                            <label className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-500/10 dark:bg-slate-500/20 hover:bg-slate-500/20 dark:hover:bg-slate-500/30 text-slate-600 dark:text-slate-300 border border-slate-500/30 dark:border-slate-500/40 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95">
                              <Upload className="w-3.5 h-3.5 text-slate-400" />
                              <span>Ekran Görüntüsü Yükle</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => handleScreenshotChange(currentCase.id, reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <span className="text-[11px] text-slate-400 font-mono">veya Ctrl+V ile yapıştırın</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* FAILED Extra Fields: Error Message & Create Jira Bug Mock */}
                {currentResult?.status === 'FAILED' && (
                  <div className="p-4 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/30 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <XCircle className="w-4 h-4" />
                        <span>Başarısız Test Case Detayları</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCreateJiraBugMock(currentCase.id, currentCase.code)}
                        className="flex items-center space-x-1.5 px-3 py-1 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-300 border border-red-500/30 dark:border-red-500/40 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Bug className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                        <span>Jira Hata Kaydı Oluştur (Mock)</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">Hata Mesajı / Açıklaması:</label>
                      <textarea
                        rows={2}
                        value={currentResult.errorMessage || ''}
                        onChange={(e) => handleErrorMessageChange(currentCase.id, e.target.value)}
                        placeholder="Örn: Login butonuna tıklanamadı veya HTTP 500 hatası alındı..."
                        className="w-full bg-white dark:bg-slate-900 border border-red-300 dark:border-red-500/30 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>

                    {currentResult.jiraBugKey && (
                      <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/20 rounded-lg text-xs">
                        <div className="flex items-center space-x-2">
                          <Bug className="w-4 h-4 text-red-500 dark:text-red-400" />
                          <span className="font-mono font-bold text-red-600 dark:text-red-400">{currentResult.jiraBugKey}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">Jira Hata Kaydı Oluşturuldu</span>
                        </div>
                        <a
                          href={currentResult.jiraBugUrl || `https://company.atlassian.net/browse/${currentResult.jiraBugKey}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 font-semibold"
                        >
                          <span>Jira'da İncele</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {/* Manual Screenshot Upload for FAIL status */}
                    <div className="space-y-2 pt-2 border-t border-red-500/20">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-bold flex items-center space-x-1.5 uppercase tracking-wider">
                          <ImageIcon className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                          <span>Manuel Ekran Görüntüsü (Hata Kanıtı)</span>
                        </label>
                        {(currentResult.screenshotUrl || currentCase.screenshotUrl) && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold border border-emerald-500/20">
                            Görsel Ekli
                          </span>
                        )}
                      </div>

                      {currentResult.screenshotUrl || currentCase.screenshotUrl ? (
                        <div className="relative group max-w-md overflow-hidden rounded-xl border border-red-500/30 bg-white dark:bg-slate-900/60 p-2">
                          <img
                            src={currentResult.screenshotUrl || currentCase.screenshotUrl}
                            alt="Hata Ekran Görüntüsü"
                            className="w-full max-h-48 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxImage(currentResult.screenshotUrl || currentCase.screenshotUrl || null)}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 backdrop-blur-[2px] rounded-xl">
                            <button
                              type="button"
                              onClick={() => setLightboxImage(currentResult.screenshotUrl || currentCase.screenshotUrl || null)}
                              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-transform hover:scale-105"
                              title="Büyüt / Tam Ekran"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <label className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 cursor-pointer transition-transform hover:scale-105" title="Görseli Değiştir">
                              <Edit3 className="w-4 h-4 text-blue-400" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => handleScreenshotChange(currentCase.id, reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleScreenshotChange(currentCase.id, '')}
                              className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-transform hover:scale-105"
                              title="Görseli Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border-2 border-dashed border-red-300 dark:border-red-500/30 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-center space-y-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            BAŞARISIZ (FAIL) durumu için ekran görüntüsü kanıtı ekleyin
                          </p>
                          <div className="flex items-center justify-center space-x-2">
                            <label className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-300 border border-red-500/30 dark:border-red-500/40 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95">
                              <Upload className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                              <span>Ekran Görüntüsü Yükle</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => handleScreenshotChange(currentCase.id, reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <span className="text-[11px] text-slate-400 font-mono">veya Ctrl+V ile yapıştırın</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Evaluation Action Buttons Bar */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  disabled={currentIndex === testCases.length - 1}
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Result Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleMarkStatus('PASSED')}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 border ${
                    currentResult?.status === 'PASSED'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                      : 'bg-emerald-500/10 dark:bg-emerald-600/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>BAŞARILI</span>
                </button>

                <button
                  onClick={() => handleMarkStatus('FAILED')}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 border ${
                    currentResult?.status === 'FAILED'
                      ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20'
                      : 'bg-red-500/10 dark:bg-red-600/20 hover:bg-red-500/20 dark:hover:bg-red-600/30 text-red-600 dark:text-red-400 border-red-500/30'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>BAŞARISIZ</span>
                </button>

                <button
                  onClick={() => handleMarkStatus('SKIPPED')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all active:scale-95 border ${
                    currentResult?.status === 'SKIPPED'
                      ? 'bg-slate-700 text-white border-slate-600'
                      : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <SkipForward className="w-4 h-4" />
                  <span>ATLA</span>
                </button>

                <button
                  onClick={() => handleMarkStatus('BLOCKED')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all active:scale-95 border ${
                    currentResult?.status === 'BLOCKED'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'bg-purple-500/10 dark:bg-purple-600/20 hover:bg-purple-500/20 dark:hover:bg-purple-600/30 text-purple-600 dark:text-purple-400 border-purple-500/30'
                  }`}
                >
                  <Slash className="w-4 h-4" />
                  <span>ENGELLE</span>
                </button>
              </div>

              {/* Complete Run Button */}
              <button
                onClick={handleSubmitRun}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isSubmitting ? 'Kaydediliyor...' : 'Koşuyu Tamamla'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Fullscreen Image View */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="absolute top-4 right-4 flex items-center space-x-3">
            <a
              href={lightboxImage}
              download={`${currentCase?.code || 'test-case'}-ekran-goruntusu.png`}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              İndir
            </a>
            <button
              onClick={() => setLightboxImage(null)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-5xl max-h-[85vh] p-2 overflow-auto">
            <img
              src={lightboxImage}
              alt="Tam Ekran Ekran Görüntüsü"
              className="max-w-full max-h-[80vh] object-contain rounded-xl border border-slate-800 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

