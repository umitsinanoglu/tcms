'use client';

import React, { useState, useEffect } from 'react';
import { TestCase, ResultStatus, TestRunsService } from '@/services/api';
import confetti from 'canvas-confetti';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  SkipForward,
  Slash,
  Bug,
  ExternalLink,
  FileCode2,
  Image as ImageIcon,
  Upload,
  Trash2,
  Maximize2,
  Edit3,
} from 'lucide-react';

interface QuickRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  testCase: TestCase | null;
  onSuccess: () => void;
}

export const QuickRunModal: React.FC<QuickRunModalProps> = ({
  isOpen,
  onClose,
  projectId,
  testCase,
  onSuccess,
}) => {
  const [status, setStatus] = useState<ResultStatus>('PASSED');
  const [errorMessage, setErrorMessage] = useState('');
  const [jiraBugKey, setJiraBugKey] = useState('');
  const [jiraBugUrl, setJiraBugUrl] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && testCase) {
      const lastResult = testCase.results && testCase.results.length > 0 ? testCase.results[0] : null;
      setStatus(lastResult?.status || 'PASSED');
      setErrorMessage(lastResult?.errorMessage || '');
      setJiraBugKey(lastResult?.jiraBugKey || '');
      setJiraBugUrl(lastResult?.jiraBugUrl || '');
      setScreenshotUrl(lastResult?.screenshotUrl || testCase.screenshotUrl || '');
      setLightboxImage(null);
    }
  }, [isOpen, testCase]);

  if (!isOpen || !testCase) return null;

  const handleCreateJiraBugMock = () => {
    const bugNum = Math.floor(Math.random() * 800) + 100;
    const bugKey = `BUG-${bugNum}`;
    const url = `https://company.atlassian.net/browse/${bugKey}`;
    setJiraBugKey(bugKey);
    setJiraBugUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await TestRunsService.quickRun(projectId, {
        testCaseId: testCase.id,
        status,
        errorMessage: status === 'FAILED' ? errorMessage : undefined,
        jiraBugKey: status === 'FAILED' ? jiraBugKey : undefined,
        jiraBugUrl: status === 'FAILED' ? jiraBugUrl : undefined,
        screenshotUrl: status === 'FAILED' ? screenshotUrl : undefined,
        executedBy: 'QA Tester',
      });

      if (status === 'PASSED') {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting quick run:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Test Senaryosu Koştur</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Sonucu kaydedin ve test durumunu güncelleyin</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Test Case Overview */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center space-x-1">
                <FileCode2 className="w-3 h-3" />
                <span>{testCase.code}</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {testCase.type}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{testCase.title}</h4>
            {testCase.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{testCase.description}</p>
            )}
          </div>

          {/* Test Steps Preview */}
          {testCase.steps && testCase.steps.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Adımlar ({testCase.steps.length})
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
                {testCase.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-slate-700 dark:text-slate-300">
                    <span className="font-mono text-slate-400 dark:text-slate-500 font-bold text-[10px]">{step.stepNumber}.</span>
                    <span>{step.action}</span>
                    {step.expectedResult && (
                      <span className="text-emerald-600 dark:text-emerald-400/80 font-mono text-[10px] ml-auto">
                        → {step.expectedResult}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Selector Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Test Koşu Sonucu:</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setStatus('PASSED')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border font-bold text-xs transition-all ${
                  status === 'PASSED'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 mb-1 text-emerald-500 dark:text-emerald-400" />
                <span>PASSED</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('FAILED')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border font-bold text-xs transition-all ${
                  status === 'FAILED'
                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20'
                    : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                <XCircle className="w-5 h-5 mb-1 text-red-500 dark:text-red-400" />
                <span>FAILED</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('SKIPPED')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border font-bold text-xs transition-all ${
                  status === 'SKIPPED'
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                <SkipForward className="w-5 h-5 mb-1 text-slate-400" />
                <span>SKIPPED</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('BLOCKED')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border font-bold text-xs transition-all ${
                  status === 'BLOCKED'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                <Slash className="w-5 h-5 mb-1 text-purple-500 dark:text-purple-400" />
                <span>BLOCKED</span>
              </button>
            </div>
          </div>

          {/* FAILED Status Fields */}
          {status === 'FAILED' && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3 animate-fadeIn">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-red-600 dark:text-red-300">Hata Mesajı / Detay:</label>
                <textarea
                  rows={2}
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  placeholder="Hata detayını ve beklenen durum uyuşmazlığını yazın..."
                  className="w-full bg-white dark:bg-slate-900 border border-red-500/30 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 shadow-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jira Bug Kaydı:</span>
                <button
                  type="button"
                  onClick={handleCreateJiraBugMock}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Bug className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                  <span>Mock Bug Oluştur</span>
                </button>
              </div>

              {jiraBugKey && (
                <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-red-500/20 rounded-lg text-xs shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Bug className="w-4 h-4 text-red-500 dark:text-red-400" />
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">{jiraBugKey}</span>
                  </div>
                  <a
                    href={jiraBugUrl || `https://company.atlassian.net/browse/${jiraBugKey}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 font-semibold"
                  >
                    <span>Jira Linki</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Manual Screenshot Upload for FAIL status */}
              <div className="space-y-2 pt-2 border-t border-red-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-red-600 dark:text-red-300 font-bold flex items-center space-x-1.5 uppercase tracking-wider">
                    <ImageIcon className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                    <span>Manuel Ekran Görüntüsü (Fail Kanıtı)</span>
                  </label>
                  {screenshotUrl && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold border border-emerald-500/20">
                      Görsel Ekli
                    </span>
                  )}
                </div>

                {screenshotUrl ? (
                  <div className="relative group max-w-md overflow-hidden rounded-xl border border-red-500/30 bg-white dark:bg-slate-900 p-2 shadow-sm">
                    <img
                      src={screenshotUrl}
                      alt="Fail Screenshot"
                      className="w-full max-h-40 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setLightboxImage(screenshotUrl)}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 backdrop-blur-[2px] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setLightboxImage(screenshotUrl)}
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
                              reader.onloadend = () => setScreenshotUrl(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setScreenshotUrl('')}
                        className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-transform hover:scale-105"
                        title="Görseli Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border-2 border-dashed border-red-500/30 rounded-xl bg-white dark:bg-slate-900 text-center space-y-1.5 shadow-sm">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      FAIL durumu için ekran görüntüsü kanıtı yükleyin
                    </p>
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95">
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
                            reader.onloadend = () => setScreenshotUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Koşuyu Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox Modal for Fullscreen Image View */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="absolute top-4 right-4 flex items-center space-x-3">
            <a
              href={lightboxImage}
              download="fail-screenshot.png"
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
              alt="Full Fail Screenshot"
              className="max-w-full max-h-[80vh] object-contain rounded-xl border border-slate-800 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

