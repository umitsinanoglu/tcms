'use client';

import React, { useState, useEffect } from 'react';
import { TestCase, ResultStatus, TestRunsService, DefectsService, CreateDefectDto, DefectSeverity } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { NewDefectModal } from './NewDefectModal';
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
  Upload,
  Trash2,
  Maximize2,
  MessageSquare,
  ClipboardList,
  Check,
  SlidersHorizontal,
  Image as ImageIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
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

type StepStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'NONE';

export const QuickRunModal: React.FC<QuickRunModalProps> = ({
  isOpen,
  onClose,
  projectId,
  testCase,
  initialVersion = 'v1.2.0 (106)',
  initialEnvironment = 'UAT',
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [version, setVersion] = useState(initialVersion);
  const [environment, setEnvironment] = useState(initialEnvironment);
  const [platform, setPlatform] = useState<string>('Web');
  const [appVersion, setAppVersion] = useState<string>('v1.2.0 (106)');
  const [device, setDevice] = useState<string>('iphone 15');
  const [userProfile, setUserProfile] = useState<string>('ÜMİT SİNANOĞLU (ADMIN)');
  const [customerType, setCustomerType] = useState<string>('BIREYSEL');
  const [flakyStatus, setFlakyStatus] = useState<string>('NONE');

  const [executedBy, setExecutedBy] = useState('Ümit Sinanoğlu');
  const [status, setStatus] = useState<ResultStatus | ''>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [jiraBugKey, setJiraBugKey] = useState('');
  const [jiraBugUrl, setJiraBugUrl] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Defect Modal State
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectInitialData, setDefectInitialData] = useState<Partial<CreateDefectDto> | null>(null);
  const [createdDefect, setCreatedDefect] = useState<{ id: string; key: string; title: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Step-level statuses and checklist state
  const [stepStatuses, setStepStatuses] = useState<Record<number, StepStatus>>({});

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
      setStatus(lastResult?.status || '');
      setErrorMessage(lastResult?.errorMessage || '');
      setJiraBugKey(lastResult?.jiraBugKey || '');
      setJiraBugUrl(lastResult?.jiraBugUrl || '');

      const rawScreenshots = lastResult?.screenshotUrl || testCase.screenshotUrl || '';
      setScreenshots(parseScreenshots(rawScreenshots));

      setVersion(initialVersion || 'v1.2.0 (106)');
      setEnvironment(initialEnvironment || 'UAT');
      setPlatform(testCase.type === 'IOS' ? 'iOS' : testCase.type === 'ANDROID' ? 'Android' : 'Web');
      setAppVersion(initialVersion ? `${initialVersion}` : 'v1.2.0 (106)');
      setDevice(testCase.type === 'IOS' ? 'iphone 15' : testCase.type === 'ANDROID' ? 's24' : 'iphone 15');
      setUserProfile('ÜMİT SİNANOĞLU (ADMIN)');
      setCustomerType('BIREYSEL');
      setFlakyStatus('NONE');
      setExecutionMs(0);
      setIsTimerRunning(true); // Auto-start stopwatch on modal open

      // Initialize step statuses
      const initialSteps: Record<number, StepStatus> = {};
      if (testCase.steps && testCase.steps.length > 0) {
        testCase.steps.forEach((_, idx) => {
          initialSteps[idx] = 'NONE';
        });
      }
      setStepStatuses(initialSteps);

      setLightboxIndex(null);
      setNewImageUrl('');
      setErrorMsg('');
    } else {
      setIsTimerRunning(false);
    }
  }, [isOpen, testCase, initialVersion, initialEnvironment]);

  // Support pasting screenshot from clipboard (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Ignore if pasting text inside input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

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
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : screenshots.length - 1));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < screenshots.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, screenshots.length]);

  if (!isOpen || !testCase) return null;

  const totalSteps = testCase.steps?.length || 0;
  const verifiedStepsCount = Object.values(stepStatuses).filter((s) => s !== 'NONE').length;

  const handleToggleStepCheckbox = (index: number) => {
    setStepStatuses((prev) => {
      const current = prev[index];
      const nextStatus: StepStatus = current === 'PASSED' ? 'NONE' : 'PASSED';
      const updated: Record<number, StepStatus> = { ...prev, [index]: nextStatus };
      evaluateOverallStatus(updated);
      return updated;
    });
  };

  const handleSetStepFlag = (index: number, flag: StepStatus) => {
    setStepStatuses((prev) => {
      const current = prev[index];
      const nextStatus: StepStatus = current === flag ? 'NONE' : flag;
      const updated: Record<number, StepStatus> = { ...prev, [index]: nextStatus };
      evaluateOverallStatus(updated);
      return updated;
    });
  };

  // Set status helper: When PASSED is selected, mark all steps as PASSED
  const handleSetStatus = (newStatus: ResultStatus) => {
    setStatus(newStatus);
    if (newStatus === 'PASSED' && testCase?.steps && testCase.steps.length > 0) {
      const allPassed: Record<number, StepStatus> = {};
      testCase.steps.forEach((_, idx) => {
        allPassed[idx] = 'PASSED';
      });
      setStepStatuses(allPassed);
    }
  };

  // Smart overall status recommendation based on step flags
  const evaluateOverallStatus = (statuses: Record<number, StepStatus>) => {
    const values = Object.values(statuses);
    if (values.some((v) => v === 'FAILED')) {
      setStatus('FAILED');
    } else if (values.some((v) => v === 'BLOCKED')) {
      setStatus('BLOCKED');
    } else if (values.length > 0 && values.every((v) => v === 'PASSED')) {
      setStatus('PASSED');
    }
  };

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

  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (trimmed) {
      setScreenshots((prev) => [...prev, trimmed]);
      setNewImageUrl('');
    }
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

  const handleOpenDefectModal = () => {
    if (!testCase) return;

    // Format steps checklist summary
    let stepsText = '';
    if (testCase.steps && testCase.steps.length > 0) {
      stepsText = '\n\nTest Adımları Kontrol Listesi:\n' + testCase.steps.map((st, idx) => {
        const stepSt = stepStatuses[idx] || 'NONE';
        const statusLabel = stepSt === 'PASSED' ? '[PASSED]' : stepSt === 'FAILED' ? '[FAILED]' : stepSt === 'BLOCKED' ? '[BLOCKED]' : '[NOT RUN]';
        const action = (st as any).action || (st as any).step || `Adım ${idx + 1}`;
        const expected = (st as any).expectedResult || (st as any).expected || '';
        return `${idx + 1}. ${statusLabel} ${action}${expected ? ` (Beklenen: ${expected})` : ''}`;
      }).join('\n');
    }

    const descParts: string[] = [];
    if (errorMessage.trim()) {
      descParts.push(`Hata / Açıklama:\n${errorMessage.trim()}`);
    } else {
      descParts.push(`Test senaryosu (${testCase.code} - ${testCase.title}) koşum sırasında başarısız oldu.`);
    }

    descParts.push(`\nKoşum Parametreleri:\n- Ortam: ${environment}\n- Platform: ${platform}\n- Uygulama Versiyonu: ${appVersion || version}\n- Cihaz: ${device}\n- Kullanıcı Profili: ${userProfile}\n- Müşteri Tipi: ${customerType}\n- Flaky / Retry: ${flakyStatus}${executionMs > 0 ? `\n- Süre: ${Math.round(executionMs / 1000)} sn (${executionMs} ms)` : ''}`);

    if (stepsText) {
      descParts.push(stepsText);
    }

    if (testCase.preconditions || testCase.precondition) {
      descParts.push(`\nÖn Koşul:\n${testCase.preconditions || testCase.precondition}`);
    }

    if ((testCase as any).expectedResult) {
      descParts.push(`\nBeklenen Genel Sonuç:\n${(testCase as any).expectedResult}`);
    }

    let mappedSeverity: DefectSeverity = 'MAJOR';
    if (testCase.priority === 'BLOCKER') mappedSeverity = 'BLOCKER';
    else if (testCase.priority === 'CRITICAL') mappedSeverity = 'CRITICAL';
    else if (testCase.priority === 'LOW') mappedSeverity = 'MINOR';

    setDefectInitialData({
      projectId,
      title: `[FAILED] ${testCase.code} - ${testCase.title}`,
      description: descParts.join('\n'),
      severity: mappedSeverity,
      status: 'OPEN',
      environment: environment || 'STAGING',
      channel: platform ? platform.toUpperCase() : 'WEB',
      testCaseId: testCase.id,
      reportedBy: executedBy || (currentUser?.name ?? (typeof window !== 'undefined' ? localStorage.getItem('tcms_active_user_name') || '' : '')),
      jiraBugKey: jiraBugKey.trim() || undefined,
      jiraBugUrl: jiraBugUrl.trim() || (jiraBugKey.trim() ? `https://company.atlassian.net/browse/${jiraBugKey.trim()}` : undefined),
    });

    setIsDefectModalOpen(true);
  };

  const handleCreateDefectSubmit = async (data: CreateDefectDto) => {
    try {
      const created = await DefectsService.create(data);
      setCreatedDefect({ id: created.id, key: created.key, title: created.title });
      if (created.jiraBugKey && !jiraBugKey) {
        setJiraBugKey(created.jiraBugKey);
        setJiraBugUrl(created.jiraBugUrl || `https://company.atlassian.net/browse/${created.jiraBugKey}`);
      }
      showToast(`Defect başarıyla oluşturuldu (${created.key || 'DEF'}).`, 'success');
      setIsDefectModalOpen(false);
      setDefectInitialData(null);
    } catch (err: any) {
      console.error('Defect creation error:', err);
      showToast('Defect oluşturulurken hata meydana geldi: ' + (err?.response?.data?.message || err?.message || 'Hata'), 'error');
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!status) {
      setErrorMsg('Lütfen bir test koşum sonucu seçiniz (PASSED, FAILED, BLOCKED, SKIPPED).');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedScreenshot = formatScreenshots(screenshots);

      // Build step notes summary if steps were flagged
      let finalErrorMessage = errorMessage.trim();
      if (totalSteps > 0 && Object.values(stepStatuses).some((s) => s !== 'NONE')) {
        const stepSummary = testCase.steps
          ?.map((st, idx) => {
            const stStatus = stepStatuses[idx] || 'NONE';
            return `Adım ${st.stepNumber} [${stStatus}]: ${st.action}`;
          })
          .join(' | ');

        if (!finalErrorMessage) {
          finalErrorMessage = `[Adım Doğrulaması: ${verifiedStepsCount}/${totalSteps}] ${stepSummary}`;
        }
      }

      await TestRunsService.quickRun(projectId, {
        testCaseId: testCase.id,
        status: status as ResultStatus,
        version: appVersion.trim() || version.trim() || 'v1.2.0 (106)',
        environment: environment.trim() || 'UAT',
        platform,
        appVersion: appVersion.trim() || 'v1.2.0 (106)',
        device: device.trim() || 'iphone 15',
        userProfile: userProfile.trim() || 'ÜMİT SİNANOĞLU (ADMIN)',
        customerType,
        flakyStatus: flakyStatus !== 'NONE' ? flakyStatus : undefined,
        errorMessage: finalErrorMessage ? finalErrorMessage : undefined,
        jiraBugKey: jiraBugKey.trim() || undefined,
        jiraBugUrl: jiraBugUrl.trim() || undefined,
        screenshotUrl: formattedScreenshot,
        executedBy: executedBy || 'Ümit Sinanoğlu',
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl xl:max-w-5xl shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100">
        
        {/* 1. Modal Top Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#151b28] shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Accent Clipboard Badge */}
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 flex items-center justify-center shrink-0 shadow-xs">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  {testCase.code}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {testCase.title}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Detaylı test koşum kaydı, canlı süre sayacı ve etiket bilgileri
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 ml-3">
            {/* Live Stopwatch Widget */}
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <Timer className={`w-4 h-4 ${isTimerRunning ? 'text-[var(--accent-primary)] animate-pulse' : 'text-slate-400'}`} />
              <span className="font-mono font-extrabold text-sm text-slate-800 dark:text-slate-200 min-w-[50px]">
                {Math.floor(executionMs / 1000)} sn
              </span>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 transition-colors"
                title={isTimerRunning ? 'Sayacı Duraklat' : 'Sayacı Başlat'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setExecutionMs(0);
                }}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Sayacı Sıfırla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium shrink-0 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {toastMessage && (
          <div
            className={`mx-6 mt-3 p-3 rounded-xl text-xs font-semibold shrink-0 flex items-center justify-between border animate-in fade-in duration-200 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : toastMessage.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
              {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
              {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-500 shrink-0" />}
              <span>{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-current"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
            
            {/* 2. Test Koşum Sonucu Section (4 Large Segment Buttons) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Test Koşum Sonucu <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* PASSED */}
                <button
                  type="button"
                  onClick={() => handleSetStatus('PASSED')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                    status === 'PASSED'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PASSED</span>
                </button>

                {/* FAILED */}
                <button
                  type="button"
                  onClick={() => handleSetStatus('FAILED')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                    status === 'FAILED'
                      ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>FAILED</span>
                </button>

                {/* BLOCKED */}
                <button
                  type="button"
                  onClick={() => handleSetStatus('BLOCKED')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                    status === 'BLOCKED'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                >
                  <Slash className="w-4 h-4" />
                  <span>BLOCKED</span>
                </button>

                {/* SKIPPED */}
                <button
                  type="button"
                  onClick={() => handleSetStatus('SKIPPED')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                    status === 'SKIPPED'
                      ? 'bg-slate-700 text-white border-slate-600 shadow-md shadow-slate-700/20'
                      : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/20'
                  }`}
                >
                  <SkipForward className="w-4 h-4" />
                  <span>SKIPPED</span>
                </button>
              </div>
            </div>

            {/* 3. Koşum Etiketleri & Cihaz / Kullanıcı Parametreleri Card */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                <SlidersHorizontal className="w-4 h-4 text-[var(--accent-primary)]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Koşum Etiketleri & Cihaz / Kullanıcı Parametreleri
                </h4>
              </div>

              {/* Grid 4 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Ortam */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>🌐 Ortam</span>
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  >
                    <option value="UAT">UAT</option>
                    <option value="DEV">DEV</option>
                    <option value="TEST">TEST</option>
                    <option value="STAGING">STAGING</option>
                    <option value="PROD">PROD</option>
                  </select>
                </div>

                {/* 2. Platform */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>🍎 / 🐳 Platform</span>
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  >
                    <option value="Web">🌐 Web</option>
                    <option value="iOS">🍎 iOS</option>
                    <option value="Android">🤖 Android</option>
                    <option value="API">⚡ API</option>
                  </select>
                </div>

                {/* 3. Uygulama Versiyonu */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>📦 Uygulama Versiyonu</span>
                  </label>
                  <input
                    type="text"
                    value={appVersion}
                    onChange={(e) => setAppVersion(e.target.value)}
                    placeholder="v1.2.0 (106)"
                    className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                {/* 4. Cihaz Aliası */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>📱 Cihaz Aliası</span>
                  </label>
                  <input
                    type="text"
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    placeholder="iphone 15"
                    className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                {/* 5. USER Profili */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>👤 USER Profili</span>
                  </label>
                  <input
                    type="text"
                    value={userProfile}
                    onChange={(e) => setUserProfile(e.target.value)}
                    placeholder="ÜMİT SİNANOĞLU (ADMIN)"
                    className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                {/* 6. Müşteri Tipi */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>👥 Müşteri Tipi</span>
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                    className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  >
                    <option value="BIREYSEL">👥 BİREYSEL</option>
                    <option value="KURUMSAL">🏢 KURUMSAL</option>
                    <option value="VIP">💎 VIP</option>
                  </select>
                </div>

                {/* 7. Flaky / Retry Durumu */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>⚠️ Flaky / Retry Durumu</span>
                  </label>
                  <select
                    value={flakyStatus}
                    onChange={(e) => setFlakyStatus(e.target.value)}
                    className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  >
                    <option value="NONE">Stabil (Retry Yok)</option>
                    <option value="+1 retry">+1 retry</option>
                    <option value="+2 retry">+2 retry</option>
                    <option value="FLAKY">FLAKY</option>
                  </select>
                </div>

                {/* 8. Süre (ms) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>⏱️ Süre (ms)</span>
                  </label>
                  <input
                    type="number"
                    value={executionMs}
                    onChange={(e) => setExecutionMs(Number(e.target.value))}
                    placeholder="37000"
                    className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  />
                </div>
              </div>
            </div>

            {/* 4. Test Adımları Kontrol Listesi Card */}
            {testCase.steps && testCase.steps.length > 0 && (
              <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                    <ClipboardList className="w-4 h-4 text-[var(--accent-primary)]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Test Adımları Kontrol Listesi
                    </h4>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                    {verifiedStepsCount} / {totalSteps} adım doğrulandı
                  </span>
                </div>

                <div className="space-y-2.5">
                  {testCase.steps.map((step, idx) => {
                    const stStatus = stepStatuses[idx] || 'NONE';
                    const isVerified = stStatus !== 'NONE';

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                          stStatus === 'PASSED'
                            ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                            : stStatus === 'FAILED'
                            ? 'bg-red-500/5 dark:bg-red-500/10 border-red-500/30'
                            : stStatus === 'BLOCKED'
                            ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
                            : 'bg-white dark:bg-[#151b28] border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Checkbox on Left */}
                        <button
                          type="button"
                          onClick={() => handleToggleStepCheckbox(idx)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                            isVerified
                              ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                          }`}
                        >
                          {isVerified && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        {/* Step Description & Expected */}
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            Adım {step.stepNumber}: {step.action}
                          </p>
                          {step.expectedResult && (
                            <p className="mt-1 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Beklenen:</span>{' '}
                              {step.expectedResult}
                            </p>
                          )}
                        </div>

                        {/* Right Side: Pass / Fail / Blocked Action Flags */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {/* Pass Flag */}
                          <button
                            type="button"
                            onClick={() => handleSetStepFlag(idx, 'PASSED')}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              stStatus === 'PASSED'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-slate-200 dark:border-slate-700'
                            }`}
                            title="Adımı Başarılı (Passed) olarak işaretle"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* Fail Flag */}
                          <button
                            type="button"
                            onClick={() => handleSetStepFlag(idx, 'FAILED')}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              stStatus === 'FAILED'
                                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border-slate-200 dark:border-slate-700'
                            }`}
                            title="Adımı Başarısız (Failed) olarak işaretle"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>

                          {/* Blocked Flag */}
                          <button
                            type="button"
                            onClick={() => handleSetStepFlag(idx, 'BLOCKED')}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              stStatus === 'BLOCKED'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-slate-200 dark:border-slate-700'
                            }`}
                            title="Adımı Engellenmiş (Blocked) olarak işaretle"
                          >
                            <Slash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. Yorum / Not & Doğrulama Açıklaması Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>Yorum / Not & Doğrulama Açıklaması</span>
                </label>
                <span className="text-[11px] text-slate-400">(Her durum için eklenebilir)</span>
              </div>
              <textarea
                rows={3}
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                placeholder="Örn: Test başarıyla tamamlandı. Döviz alış kuru UAT ortamında doğrulandı."
                className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none shadow-xs"
              />
            </div>

            {/* 6. Jira Bug Key & Defect Creation Section */}
            {status === 'FAILED' || Object.values(stepStatuses || {}).some((s) => s === 'FAILED') ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <Bug className="w-4 h-4 text-rose-500" />
                    <span>Jira Bug Key (Opsiyonel)</span>
                  </label>
                  <input
                    type="text"
                    value={jiraBugKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setJiraBugKey(val);
                      if (val.trim()) {
                        setJiraBugUrl(`https://company.atlassian.net/browse/${val.trim()}`);
                      }
                    }}
                    placeholder="Örn: MOB-542 veya QA-102"
                    className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] shadow-xs"
                  />
                </div>

                {createdDefect ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Defect Oluşturuldu
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {createdDefect.key}
                        </span>
                      </div>
                      <div className="w-full h-[38px] inline-flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 shadow-2xs">
                        <div className="inline-flex items-center space-x-1.5 min-w-0 flex-1 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{createdDefect.key}: Hata Kaydı Açıldı</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenDefectModal}
                          className="ml-2 text-[10px] text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 cursor-pointer font-bold"
                          title="Yeni bir defect daha oluştur veya düzenle"
                        >
                          Düzenle / Yeni
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Defect Yönetimi
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">(Opsiyonel)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenDefectModal}
                        className="w-full h-[38px] inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.99] border border-rose-500/40 shadow-sm shadow-rose-900/20 transition-all cursor-pointer"
                      >
                        <Bug className="w-4 h-4" />
                        <span>Defect Oluştur</span>
                      </button>
                    </div>
                  )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <Bug className="w-4 h-4 text-rose-500" />
                  <span>Jira Bug Key (Opsiyonel)</span>
                </label>
                <input
                  type="text"
                  value={jiraBugKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    setJiraBugKey(val);
                    if (val.trim()) {
                      setJiraBugUrl(`https://company.atlassian.net/browse/${val.trim()}`);
                    }
                  }}
                  placeholder="Örn: MOB-542 veya QA-102"
                  className="w-full bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] shadow-xs"
                />
              </div>
            )}

            {/* 7. Ekran Görüntüleri & Kanıtlar Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>Ekran Görüntüleri & Kanıtlar ({screenshots.length})</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  (Ctrl+V ile panodan yapıştırabilir veya dosya seçebilirsiniz)
                </span>
              </div>

              {/* Upload and URL input row */}
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>Dosya Seç</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                </label>

                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    placeholder="veya Görsel URL'si yapıştırın..."
                    className="flex-1 bg-white dark:bg-[#151b28] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!newImageUrl.trim()}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-40 transition-colors shadow-xs"
                  >
                    Ekle
                  </button>
                </div>
              </div>

              {/* Thumbnails Gallery */}
              {screenshots.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  {screenshots.map((url, sIdx) => (
                    <div
                      key={sIdx}
                      className="group relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-900 aspect-video shadow-xs"
                    >
                      <img
                        src={url}
                        alt={`Kanıt ${sIdx + 1}`}
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                        onClick={() => setLightboxIndex(sIdx)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveScreenshot(sIdx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md"
                        title="Görseli Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(sIdx)}
                        className="absolute bottom-1.5 right-1.5 p-1 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                        title="Büyüt"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* 8. Modal Footer Actions */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#151b28] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent-gradient hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-[var(--accent-dark)]/20 active:scale-98 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Koşum Sonucunu ve Etiketleri Kaydet'}</span>
            </button>
          </div>
        </form>

      </div>

      {/* New Defect Creation Modal */}
      {isDefectModalOpen && defectInitialData && (
        <NewDefectModal
          isOpen={isDefectModalOpen}
          onClose={() => {
            setIsDefectModalOpen(false);
            setDefectInitialData(null);
          }}
          projectId={projectId}
          projectName={(testCase as any)?.project?.name}
          projectKey={(testCase as any)?.project?.key}
          allCases={testCase ? [testCase] : []}
          initialData={defectInitialData}
          onSubmit={handleCreateDefectSubmit}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && screenshots[lightboxIndex] && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={screenshots[lightboxIndex]}
            alt="Büyük Kanıt Görseli"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
