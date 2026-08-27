'use client';

import React, { useState, useEffect } from 'react';
import { TestCase, ResultStatus, TestRunsService } from '@/services/api';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Timer,
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
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  SlidersHorizontal,
} from 'lucide-react';

export const parseScreenshots = (raw?: string | null): string[] => {
  if (!raw) return [];
  if (typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
      }
    } catch {
      // not json, return single string
    }
  }
  return [trimmed];
};

export const formatScreenshots = (list: string[]): string | undefined => {
  const filtered = list.filter((s) => s && s.trim().length > 0);
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];
  return JSON.stringify(filtered);
};

interface QuickRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  testCase: TestCase | null;
  initialVersion?: string;
  initialEnvironment?: string;
  onSuccess: () => void;
}

export const QuickRunModal: React.FC<QuickRunModalProps> = ({
  isOpen,
  onClose,
  projectId,
  testCase,
  initialVersion = 'v1.0.0',
  initialEnvironment = 'STAGING',
  onSuccess,
}) => {
  const [version, setVersion] = useState(initialVersion);
  const [environment, setEnvironment] = useState(initialEnvironment);
  const [platform, setPlatform] = useState<string>('iOS');
  const [appVersion, setAppVersion] = useState<string>('v1.2.0 (106)');
  const [device, setDevice] = useState<string>('iphone14');
  const [userProfile, setUserProfile] = useState<string>('UMIT');
  const [customerType, setCustomerType] = useState<string>('BIREYSEL');
  const [flakyStatus, setFlakyStatus] = useState<string>('NONE');

  const [executedBy, setExecutedBy] = useState('QA Tester');
  const [status, setStatus] = useState<ResultStatus>('PASSED');
  const [errorMessage, setErrorMessage] = useState('');
  const [jiraBugKey, setJiraBugKey] = useState('');
  const [jiraBugUrl, setJiraBugUrl] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stopwatch state
  const [executionMs, setExecutionMs] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Stopwatch interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setExecutionMs((prev) => prev + 1000);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  useEffect(() => {
    if (isOpen && testCase) {
      const lastResult = testCase.results && testCase.results.length > 0 ? testCase.results[0] : null;
      setStatus(lastResult?.status || 'PASSED');
      setErrorMessage(lastResult?.errorMessage || '');
      setJiraBugKey(lastResult?.jiraBugKey || '');
      setJiraBugUrl(lastResult?.jiraBugUrl || '');
      
      const rawScreenshots = lastResult?.screenshotUrl || testCase.screenshotUrl || '';
      setScreenshots(parseScreenshots(rawScreenshots));
      
      setVersion(initialVersion || 'v1.0.0');
      setEnvironment(initialEnvironment || 'STAGING');
      setPlatform(testCase.type === 'IOS' ? 'iOS' : testCase.type === 'ANDROID' ? 'Android' : 'Web');
      setAppVersion(initialVersion ? `${initialVersion} (106)` : 'v1.2.0 (106)');
      setDevice(testCase.type === 'IOS' ? 'iphone14' : testCase.type === 'ANDROID' ? 's24' : 'iphone 15');
      setUserProfile('UMIT');
      setCustomerType('BIREYSEL');
      setFlakyStatus('NONE');
      setExecutionMs(0);
      setIsTimerRunning(true); // Auto-start stopwatch on modal open

      setLightboxIndex(null);
      setErrorMsg('');
    } else {
      setIsTimerRunning(false);
    }
  }, [isOpen, testCase, initialVersion, initialEnvironment]);

  // Support pasting screenshot from clipboard (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                const newImg = reader.result;
                setScreenshots((prev) => [...prev, newImg]);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Lightbox keyboard navigation (Arrow keys + Esc)
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : (screenshots.length - 1)));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < screenshots.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, screenshots.length]);

  if (!isOpen || !testCase) return null;

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const res = reader.result;
          setScreenshots((prev) => [...prev, res]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveScreenshot = (indexToRemove: number) => {
    setScreenshots((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (lightboxIndex !== null) {
      if (screenshots.length <= 1) {
        setLightboxIndex(null);
      } else if (lightboxIndex >= indexToRemove && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      }
    }
  };

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
    setErrorMsg('');
    try {
      const formattedScreenshot = formatScreenshots(screenshots);

      await TestRunsService.quickRun(projectId, {
        testCaseId: testCase.id,
        status,
        version: version.trim() || 'v1.0.0',
        environment: environment.trim() || 'STAGING',
        platform,
        appVersion: appVersion.trim() || version,
        device: device.trim() || 'iphone14',
        userProfile: userProfile.trim() || 'UMIT',
        customerType,
        flakyStatus: flakyStatus !== 'NONE' ? flakyStatus : undefined,
        errorMessage: errorMessage.trim() ? errorMessage.trim() : undefined,
        jiraBugKey: status === 'FAILED' ? jiraBugKey : undefined,
        jiraBugUrl: status === 'FAILED' ? jiraBugUrl : undefined,
        screenshotUrl: formattedScreenshot,
        executedBy: executedBy || 'QA Tester',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting quick run:', err);
      if (
        err?.response?.status === 413 ||
        err?.message?.includes('413') ||
        err?.message?.toLowerCase().includes('payload too large') ||
        err?.message?.toLowerCase().includes('too large')
      ) {
        setErrorMsg('Boyut limiti hatası (413 Payload Too Large): Ekran görüntüsü veya veri boyutu sınırı aştı. Lütfen daha küçük görsel yükleyin.');
      } else {
        const message = err?.response?.data?.message || err?.message || 'Hızlı koşu kaydedilirken bir hata oluştu.';
        setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable multi-screenshot gallery section
  const renderScreenshotUploader = (theme: 'emerald' | 'red' | 'slate' | 'purple' | 'amber', label: string) => {
    const colors = {
      emerald: {
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        uploadBtn: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: 'text-emerald-500',
        focus: 'focus:ring-emerald-500',
        activeBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      },
      red: {
        border: 'border-red-500/30',
        badge: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
        uploadBtn: 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
        icon: 'text-red-500',
        focus: 'focus:ring-red-500',
        activeBtn: 'bg-red-600 hover:bg-red-500 text-white',
      },
      slate: {
        border: 'border-slate-500/30',
        badge: 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30',
        uploadBtn: 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30',
        icon: 'text-slate-400',
        focus: 'focus:ring-slate-500',
        activeBtn: 'bg-slate-700 hover:bg-slate-600 text-white',
      },
      amber: {
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
        uploadBtn: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
        icon: 'text-amber-500',
        focus: 'focus:ring-amber-500',
        activeBtn: 'bg-amber-600 hover:bg-amber-500 text-white',
      },
      purple: {
        border: 'border-purple-500/30',
        badge: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
        uploadBtn: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
        icon: 'text-purple-500',
        focus: 'focus:ring-purple-500',
        activeBtn: 'bg-purple-600 hover:bg-purple-500 text-white',
      },
    }[theme];

    return (
      <div className={`space-y-2 pt-2 border-t ${colors.border}`}>
        <div className="flex items-center justify-between">
          <label className={`text-[11px] font-bold flex items-center space-x-1.5 uppercase tracking-wider ${colors.icon}`}>
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </label>
          <div className="flex items-center space-x-2">
            {screenshots.length > 0 && (
              <>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${colors.badge}`}>
                  {screenshots.length} Görsel Ekli
                </span>
                <button
                  type="button"
                  onClick={() => setScreenshots([])}
                  className="text-[10px] text-red-500 hover:text-red-600 hover:underline font-medium"
                >
                  Temizle
                </button>
              </>
            )}
          </div>
        </div>

        {screenshots.length > 0 ? (
          <div className="space-y-2">
            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {screenshots.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className={`relative group rounded-xl overflow-hidden border ${colors.border} bg-white dark:bg-slate-900 p-1 shadow-sm aspect-video flex items-center justify-center`}
                >
                  <img
                    src={imgUrl}
                    alt={`Screenshot ${idx + 1}`}
                    className="w-full h-full object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightboxIndex(idx)}
                  />

                  {/* Top-left number badge */}
                  <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur-xs font-bold pointer-events-none">
                    #{idx + 1}
                  </span>

                  {/* Hover Overlay Controls */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5 backdrop-blur-[2px] rounded-lg">
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-transform hover:scale-110 shadow"
                      title="Büyüt / İncele"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshot(idx)}
                      className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-transform hover:scale-110 shadow"
                      title="Görseli Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add More Slot */}
              <label
                className={`flex flex-col items-center justify-center border-2 border-dashed ${colors.border} rounded-xl aspect-video cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors p-2 text-center group`}
                title="Yeni Görsel Ekle"
              >
                <Plus className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">Görsel Ekle</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
              </label>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-right">
              İpucu: Ekran görüntüsü yapıştırmak için Ctrl+V tuşlarına basabilirsiniz
            </p>
          </div>
        ) : (
          /* Empty State Dropzone */
          <div className={`p-3.5 border-2 border-dashed ${colors.border} rounded-xl bg-white/60 dark:bg-slate-900/60 text-center space-y-2 shadow-sm`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Birden fazla ekran görüntüsü veya koşu kanıtı ekleyebilirsiniz
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <label className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 border ${colors.uploadBtn}`}>
                <Upload className="w-3.5 h-3.5" />
                <span>Ekran Görüntüsü Yükle (Çoklu)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
              </label>
              <span className="text-[11px] text-slate-400 font-mono">veya Ctrl+V ile yapıştırın</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl xl:max-w-6xl shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <span>Test Case Koştur</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Sonucu kaydedin ve test durumunu güncelleyin</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Live Stopwatch Widget in QuickRun */}
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              <Timer className={`w-3.5 h-3.5 ${isTimerRunning ? 'text-[#b83a4b] animate-spin' : 'text-slate-400'}`} />
              <span className="font-mono font-extrabold text-xs text-slate-800 dark:text-slate-200 min-w-[55px]">
                {Math.floor(executionMs / 1000)} sn
              </span>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-1 rounded text-[10px] font-bold ${
                  isTimerRunning
                    ? 'bg-amber-500/20 text-amber-600 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30'
                }`}
                title={isTimerRunning ? 'Sayacı Duraklat' : 'Sayacı Başlat'}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setExecutionMs(0);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
                title="Sayacı Sıfırla"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center space-x-1.5">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>{testCase.code}</span>
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
              {testCase.type}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium shrink-0">
            {errorMsg}
          </div>
        )}

        {/* Modal Form & 2-Column Horizontal Layout */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
            
            {/* Left Column: Test Case Details, Parameters & Steps */}
            <div className="lg:col-span-5 space-y-4 flex flex-col">
              {/* Test Case Title & Description */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Test Case Bilgisi
                </span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  {testCase.title}
                </h4>
                {testCase.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {testCase.description}
                  </p>
                )}
              </div>

              {/* Test Run Parameters: Extended Metadata Inputs */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#b83a4b]" />
                  <span>Koşu Parametreleri & Görsel Etiketler</span>
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      🌐 Test Ortamı:
                    </label>
                    <select
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="UAT">🌐 UAT</option>
                      <option value="TEST">🌐 TEST</option>
                      <option value="PROD">🌐 PROD</option>
                      <option value="STAGING">🌐 STAGING</option>
                      <option value="DEV">🌐 DEV</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      🍎/🤖 Platform:
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="iOS">🍎 iOS</option>
                      <option value="Android">🤖 Android</option>
                      <option value="Web">🌐 Web</option>
                      <option value="API">⚡ API</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      📦 Versiyon:
                    </label>
                    <input
                      type="text"
                      value={appVersion}
                      onChange={(e) => setAppVersion(e.target.value)}
                      placeholder="v1.2.0 (106)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      📱 Cihaz Aliası:
                    </label>
                    <input
                      type="text"
                      value={device}
                      onChange={(e) => setDevice(e.target.value)}
                      placeholder="iphone14 / s24"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      👤 USER Profili:
                    </label>
                    <input
                      type="text"
                      value={userProfile}
                      onChange={(e) => setUserProfile(e.target.value)}
                      placeholder="UMIT / ZEYNEP"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      👥 Müşteri Tipi:
                    </label>
                    <select
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="BIREYSEL">👥 BIREYSEL</option>
                      <option value="KURUMSAL">👥 KURUMSAL</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      ⚠️ Flaky / Retry:
                    </label>
                    <select
                      value={flakyStatus}
                      onChange={(e) => setFlakyStatus(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="NONE">Stabil</option>
                      <option value="+1 retry">+1 retry</option>
                      <option value="+2 retry">+2 retry</option>
                      <option value="FLAKY">FLAKY</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Koşturan / Tester:
                    </label>
                    <input
                      type="text"
                      value={executedBy}
                      onChange={(e) => setExecutedBy(e.target.value)}
                      placeholder="Tester Adı"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Test Steps Preview */}
              {testCase.steps && testCase.steps.length > 0 && (
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Adımlar ({testCase.steps.length})
                    </label>
                    <span className="text-[10px] text-slate-400">Beklenen sonuçlar</span>
                  </div>
                  <div className="max-h-52 lg:max-h-60 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
                    {testCase.steps.map((step, idx) => (
                      <div key={idx} className="space-y-1 pb-1.5 border-b border-slate-200/50 dark:border-slate-800/50 last:border-none last:pb-0">
                        <div className="flex items-start space-x-2 text-slate-700 dark:text-slate-300">
                          <span className="font-mono text-slate-400 dark:text-slate-500 font-bold text-[10px] shrink-0 mt-0.5">
                            {step.stepNumber}.
                          </span>
                          <span className="font-medium flex-1">{step.action}</span>
                        </div>
                        {step.expectedResult && (
                          <div className="pl-4 text-emerald-600 dark:text-emerald-400/80 font-mono text-[10px]">
                            → {step.expectedResult}
                          </div>
                        )}
                        {step.attachments && step.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pl-4 pt-0.5">
                            {step.attachments.map((att, aIdx) => (
                              <div
                                key={att.id || aIdx}
                                className="flex items-center space-x-1.5 p-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[10px]"
                              >
                                <img
                                  src={att.url}
                                  alt={att.comment || 'Görsel'}
                                  className="w-10 h-7 object-contain rounded cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(att.url, '_blank')}
                                />
                                {att.comment && (
                                  <span className="text-slate-500 max-w-[120px] truncate" title={att.comment}>
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
            </div>

            {/* Right Column: Status Selection, Feedback & Evidence */}
            <div className="lg:col-span-7 space-y-4 flex flex-col">
              {/* Status Selector Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Test Koşu Sonucu:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                        ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Slash className="w-5 h-5 mb-1 text-amber-500 dark:text-amber-400" />
                    <span>BLOCKED</span>
                  </button>
                </div>
              </div>

              {/* PASSED Status: Comment & Multi-Screenshot */}
              {status === 'PASSED' && (
                <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl space-y-3 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-300 flex items-center space-x-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Başarı Yorumu / Koşu Notu (İsteğe bağlı):</span>
                    </label>
                    <textarea
                      rows={2}
                      value={errorMessage}
                      onChange={(e) => setErrorMessage(e.target.value)}
                      placeholder="Test başarıyla tamamlandı, adımlar doğrulandı..."
                      className="w-full bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                    />
                  </div>

                  {renderScreenshotUploader('emerald', 'Ekran Görüntüleri (Başarı / Koşu Kanıtı)')}
                </div>
              )}

              {/* FAILED Status: Comment / Details, Jira Bug Mock & Multi-Screenshot */}
              {status === 'FAILED' && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-red-600 dark:text-red-300 flex items-center space-x-1">
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      <span>Hata Mesajı / Detay:</span>
                    </label>
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

                  {renderScreenshotUploader('red', 'Ekran Görüntüleri (Fail / Hata Kanıtı)')}
                </div>
              )}

              {/* SKIPPED Status: Comment & Multi-Screenshot */}
              {status === 'SKIPPED' && (
                <div className="p-3.5 bg-slate-500/5 dark:bg-slate-500/10 border border-slate-500/20 dark:border-slate-500/30 rounded-xl space-y-3 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <SkipForward className="w-3.5 h-3.5 text-slate-400" />
                      <span>Atlanma Nedeni / Yorum (İsteğe bağlı):</span>
                    </label>
                    <textarea
                      rows={2}
                      value={errorMessage}
                      onChange={(e) => setErrorMessage(e.target.value)}
                      placeholder="Test senaryosunun neden atlandığını veya pas geçildiğini yazın..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-500/30 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-500 shadow-sm"
                    />
                  </div>

                  {renderScreenshotUploader('slate', 'Ekran Görüntüleri / Kanıt (İsteğe Bağlı)')}
                </div>
              )}

              {/* BLOCKED Status: Reason / Comment & Multi-Screenshot */}
              {status === 'BLOCKED' && (
                <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 rounded-xl space-y-3 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-amber-600 dark:text-amber-300 flex items-center space-x-1">
                      <Slash className="w-3.5 h-3.5 text-amber-500" />
                      <span>Engellenme Nedeni / Blocker Detayı (İsteğe bağlı):</span>
                    </label>
                    <textarea
                      rows={2}
                      value={errorMessage}
                      onChange={(e) => setErrorMessage(e.target.value)}
                      placeholder="Testin engellenme nedenini ve blocker detaylarını yazın (örn: Bağımlı servis çalışmıyor)..."
                      className="w-full bg-white dark:bg-slate-900 border border-amber-500/30 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
                    />
                  </div>

                  {renderScreenshotUploader('amber', 'Ekran Görüntüleri / Blocker Kanıtı (İsteğe Bağlı)')}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">İpucu:</span>
              <span className="font-mono text-[11px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold">
                Ctrl+V
              </span>
              <span className="hidden md:inline">ile panodan ekran görüntüsü yapıştırabilirsiniz</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              >
                İptal
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isSubmitting ? 'Kaydediliyor...' : 'Koşuyu Kaydet'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Lightbox Modal with Multi-Image Carousel / Zoom View */}
      {lightboxIndex !== null && screenshots[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn">
          {/* Top Bar Controls */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-200 border border-slate-700">
                {testCase.code} - {status}
              </span>
              {screenshots.length > 1 && (
                <span className="text-xs font-mono bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-lg">
                  {lightboxIndex + 1} / {screenshots.length}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={screenshots[lightboxIndex]}
                download={`${testCase.code}-${status.toLowerCase()}-screenshot-${lightboxIndex + 1}.png`}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                title="Görseli İndir"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">İndir</span>
              </a>
              <button
                type="button"
                onClick={() => handleRemoveScreenshot(lightboxIndex)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg border border-red-500/50 transition-colors"
                title="Görseli Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sil</span>
              </button>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors"
                title="Kapat (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Carousel Left Arrow */}
          {screenshots.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : screenshots.length - 1))
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 backdrop-blur-sm transition-transform hover:scale-110 z-10"
              title="Önceki Görsel (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image Container */}
          <div className="max-w-5xl max-h-[85vh] p-2 flex items-center justify-center overflow-auto">
            <img
              src={screenshots[lightboxIndex]}
              alt={`Full Screenshot ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl border border-slate-800 shadow-2xl"
            />
          </div>

          {/* Carousel Right Arrow */}
          {screenshots.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) => (prev !== null && prev < screenshots.length - 1 ? prev + 1 : 0))
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 backdrop-blur-sm transition-transform hover:scale-110 z-10"
              title="Sonraki Görsel (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Bottom Thumbnails Navigation */}
          {screenshots.length > 1 && (
            <div className="absolute bottom-4 flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-md max-w-[90vw] overflow-x-auto">
              {screenshots.map((thumb, tIdx) => (
                <button
                  key={tIdx}
                  type="button"
                  onClick={() => setLightboxIndex(tIdx)}
                  className={`w-12 h-9 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    tIdx === lightboxIndex ? 'border-blue-500 scale-105 shadow-md' : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={thumb} alt={`Thumb ${tIdx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
