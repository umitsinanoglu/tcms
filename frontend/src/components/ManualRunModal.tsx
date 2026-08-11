'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TestCase, TestRunsService, ResultStatus, TestRun } from '@/services/api';
import confetti from 'canvas-confetti';
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
    Record<string, { status: ResultStatus; errorMessage?: string; jiraBugKey?: string; jiraBugUrl?: string }>
  >({});
  const [title, setTitle] = useState('Sprint 24 Regression');
  const [version, setVersion] = useState('v2.4.0-rc1');
  const [environment, setEnvironment] = useState('STAGING');
  const [executedBy, setExecutedBy] = useState('Ahmet Yılmaz');
  const [testerEmail, setTesterEmail] = useState('ahmet.yilmaz@sirket.com');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        status: prev[caseId]?.status || 'FAILED',
        errorMessage: msg,
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
    try {
      // 1. Create or get TestRun
      let run = activeRun;
      if (!run) {
        run = await TestRunsService.createRun(projectId, {
          title: title || `Test Run - ${version}`,
          version,
          environment,
          executedBy,
          testerEmail,
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
          errorMessage: res?.errorMessage,
          jiraBugKey: res?.jiraBugKey,
          jiraBugUrl: res?.jiraBugUrl,
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

      if (passRate >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Error submitting run:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentResult = currentCase ? results[currentCase.id] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <span>Manual Execution Dashboard</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                  {testCases.length} Senaryo
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                TestCase seviyesinde test sonuçlarını veritabanına ve Jira Bug takibine işleyin.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Run Başlığı"
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v2.4.0-rc1"
              className="w-24 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="STAGING">STAGING</option>
              <option value="PREPROD">PREPROD</option>
              <option value="PROD">PROD</option>
              <option value="DEV">DEV</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {isSubmitted && summaryData ? (
          /* Summary View */
          <div className="p-8 flex-1 flex flex-col items-center justify-center space-y-6 text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-100">Test Koşusu Tamamlandı!</h3>
              <p className="text-xs text-slate-400">
                {title} — {version} ({environment}) sonuçları başarıyla kaydedildi.
              </p>
            </div>

            {/* Score Ring */}
            <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-900/50">
              <span className="text-3xl font-extrabold text-white font-mono">
                %{summaryData.passRate}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Başarı Oranı
              </span>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-4 gap-4 w-full max-w-lg">
              <div className="bg-slate-900/80 border border-emerald-500/20 p-3 rounded-xl">
                <span className="block text-lg font-bold text-emerald-400 font-mono">
                  {summaryData.passed}
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Passed</span>
              </div>
              <div className="bg-slate-900/80 border border-red-500/20 p-3 rounded-xl">
                <span className="block text-lg font-bold text-red-400 font-mono">
                  {summaryData.failed}
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Failed</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-700/50 p-3 rounded-xl">
                <span className="block text-lg font-bold text-slate-400 font-mono">
                  {summaryData.skipped}
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Skipped</span>
              </div>
              <div className="bg-slate-900/80 border border-purple-500/20 p-3 rounded-xl">
                <span className="block text-lg font-bold text-purple-400 font-mono">
                  {summaryData.blocked}
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Blocked</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-2">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setSummaryData(null);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
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
          <div className="p-12 text-center text-slate-500 text-xs flex-1">
            Koşulacak test senaryosu bulunamadı.
          </div>
        ) : (
          /* Active Test Execution View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation & Status Header */}
            <div className="px-6 py-2 bg-slate-900/50 border-b border-surface-border flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-4">
                <span>
                  Senaryo <strong className="text-white">{currentIndex + 1}</strong> / {testCases.length}
                </span>

                <div className="flex items-center space-x-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
                  <Keyboard className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    Kısayollar: <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-emerald-400">P</kbd> Pass |{' '}
                    <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-red-400">F</kbd> Fail |{' '}
                    <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-slate-400">S</kbd> Skip |{' '}
                    <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-purple-400">B</kbd> Block
                  </span>
                </div>
              </div>

              {currentResult?.status ? (
                <span
                  className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                    currentResult.status === 'PASSED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : currentResult.status === 'FAILED'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : currentResult.status === 'BLOCKED'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                  }`}
                >
                  {currentResult.status}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">Değerlendirilmedi</span>
              )}
            </div>

            {/* Active TestCase Detail */}
            {currentCase && (
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                      {currentCase.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {currentCase.type}
                    </span>
                    {currentCase.jiraStoryKey && (
                      <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {currentCase.jiraStoryKey}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{currentCase.title}</h3>
                  {currentCase.description && (
                    <p className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                      {currentCase.description}
                    </p>
                  )}
                </div>

                {/* Steps Description (Read only context for manual evaluation) */}
                {currentCase.steps && currentCase.steps.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Test Adımları ({currentCase.steps.length})
                    </h4>
                    <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      {currentCase.steps.map((step, idx) => (
                        <div key={idx} className="text-xs flex items-start space-x-2">
                          <span className="font-mono text-slate-500 font-bold">{step.stepNumber}.</span>
                          <span className="text-slate-300">{step.action}</span>
                          {step.expectedResult && (
                            <span className="text-emerald-400/80 font-mono text-[11px]">
                              → {step.expectedResult}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAILED Extra Fields: Error Message & Create Jira Bug Mock */}
                {currentResult?.status === 'FAILED' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <XCircle className="w-4 h-4" />
                        <span>Failed TestCase Detayları</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCreateJiraBugMock(currentCase.id, currentCase.code)}
                        className="flex items-center space-x-1.5 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Bug className="w-3.5 h-3.5 text-red-400" />
                        <span>Create Jira Bug (Mock)</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-300 font-semibold">Error Message (Hata Açıklaması):</label>
                      <textarea
                        rows={2}
                        value={currentResult.errorMessage || ''}
                        onChange={(e) => handleErrorMessageChange(currentCase.id, e.target.value)}
                        placeholder="Örn: Login butonu tıklanamadı veya Yanıt 500 hatası döndü..."
                        className="w-full bg-slate-900 border border-red-500/30 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>

                    {currentResult.jiraBugKey && (
                      <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-red-500/20 rounded-lg text-xs">
                        <div className="flex items-center space-x-2">
                          <Bug className="w-4 h-4 text-red-400" />
                          <span className="font-mono font-bold text-red-400">{currentResult.jiraBugKey}</span>
                          <span className="text-slate-400 text-[11px]">Jira Bug Kaydı Oluşturuldu</span>
                        </div>
                        <a
                          href={currentResult.jiraBugUrl || `https://company.atlassian.net/browse/${currentResult.jiraBugKey}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 hover:underline flex items-center space-x-1 font-semibold"
                        >
                          <span>Jira'da İncele</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Evaluation Action Buttons Bar */}
            <div className="px-6 py-4 bg-slate-900 border-t border-surface-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  disabled={currentIndex === testCases.length - 1}
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
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
                      : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PASS</span>
                </button>

                <button
                  onClick={() => handleMarkStatus('FAILED')}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 border ${
                    currentResult?.status === 'FAILED'
                      ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20'
                      : 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/30'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>FAIL</span>
                </button>

                <button
                  onClick={() => handleMarkStatus('SKIPPED')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all active:scale-95 border ${
                    currentResult?.status === 'SKIPPED'
                      ? 'bg-slate-700 text-white border-slate-600'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                  }`}
                >
                  <SkipForward className="w-4 h-4" />
                  <span>SKIP</span>
                </button>

                <button
                  onClick={() => handleMarkStatus('BLOCKED')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all active:scale-95 border ${
                    currentResult?.status === 'BLOCKED'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border-purple-500/30'
                  }`}
                >
                  <Slash className="w-4 h-4" />
                  <span>BLOCKED</span>
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
    </div>
  );
};

