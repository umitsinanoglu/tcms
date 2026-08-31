'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Terminal,
  Play,
  Square,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Smartphone,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { TACService, subscribeToTACLogs } from '@/services/api';

interface LiveRunTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  runId?: string;
  runTitle?: string;
  platform?: string;
  deviceAlias?: string;
  wsUrl?: string;
  onRunFinished?: (statusData?: any) => void;
}

export const LiveRunTerminalModal: React.FC<LiveRunTerminalModalProps> = ({
  isOpen,
  onClose,
  runId,
  runTitle,
  platform = 'iOS',
  deviceAlias = 'iphone15',
  wsUrl = 'ws://localhost:8000/ws/logs',
  onRunFinished,
}) => {
  const [logs, setLogs] = useState<{ id: string; text: string; isError?: boolean; timestamp: string }[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAborting, setIsAborting] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [runStatus, setRunStatus] = useState<'RUNNING' | 'PASSED' | 'FAILED' | 'STOPPED'>('RUNNING');
  const [summary, setSummary] = useState<{ total: number; passed: number; failed: number; skipped: number }>({
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer counter
  useEffect(() => {
    if (isOpen && runStatus === 'RUNNING') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, runStatus]);

  // WebSocket Subscription
  useEffect(() => {
    if (!isOpen) return;

    setLogs([
      {
        id: 'init-0',
        text: `[SYSTEM] Test Automation Center (TAC) Canlı Log Akışına Bağlanılıyor...\n`,
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        id: 'init-1',
        text: `[TARGET] Platform: ${platform} | Cihaz: ${deviceAlias} | RunID: ${runId || 'N/A'}\n`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    const subscription = subscribeToTACLogs(
      wsUrl,
      (text, isError) => {
        const line = {
          id: Math.random().toString(36).substring(2, 9),
          text,
          isError,
          timestamp: new Date().toLocaleTimeString(),
        };
        setLogs((prev) => [...prev, line]);
      },
      (statusMsg) => {
        if (statusMsg?.type === 'RUN_FINISHED' || statusMsg?.status) {
          const finalStatus = statusMsg?.data?.status || statusMsg?.status;
          if (finalStatus === 'PASSED' || finalStatus === 'FAILED' || finalStatus === 'STOPPED') {
            setRunStatus(finalStatus);
          }
          if (statusMsg?.data?.summary) {
            setSummary(statusMsg.data.summary);
          }
          if (onRunFinished) {
            onRunFinished(statusMsg);
          }
        }
      },
      () => setIsConnected(true),
      () => setIsConnected(false),
    );

    return () => {
      subscription.close();
      setIsConnected(false);
    };
  }, [isOpen, wsUrl, runId, platform, deviceAlias]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  if (!isOpen) return null;

  const handleAbort = async () => {
    if (!runId) return;
    if (!window.confirm('Çalışan mobil test koşusunu durdurmak istediğinize emin misiniz?')) return;

    setIsAborting(true);
    try {
      await TACService.stopRun(runId);
      setRunStatus('STOPPED');
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          text: `\n🛑 [ABORT] Test koşusu kullanıcı tarafından durduruldu.\n`,
          isError: true,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      alert(`Koşu durdurulurken hata oluştu: ${err.message}`);
    } finally {
      setIsAborting(false);
    }
  };

  const handleCopyLogs = () => {
    const fullText = logs.map((l) => l.text).join('');
    navigator.clipboard.writeText(fullText);
    alert('Loglar panoya kopyalandı.');
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const parseLogColor = (text: string, isError?: boolean) => {
    if (isError || text.includes('ERR') || text.includes('Error') || text.includes('fail') || text.includes('FAIL')) {
      return 'text-rose-400';
    }
    if (text.includes('PASS') || text.includes('passed') || text.includes('✓') || text.includes('SUCCESS')) {
      return 'text-emerald-400 font-semibold';
    }
    if (text.includes('[Appium]') || text.includes('[XCUITest]') || text.includes('[UiAutomator2]')) {
      return 'text-sky-300';
    }
    if (text.includes('WARN') || text.includes('Warning')) {
      return 'text-amber-300';
    }
    if (text.startsWith('[SYSTEM]') || text.startsWith('⚡')) {
      return 'text-purple-300 font-medium';
    }
    return 'text-slate-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="flex flex-col w-full max-w-5xl h-[88vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  {runTitle || 'Test Automation Canlı Terminal'}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    runStatus === 'RUNNING'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                      : runStatus === 'PASSED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : runStatus === 'FAILED'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                  }`}
                >
                  {runStatus === 'RUNNING' && <RefreshCw className="w-3 h-3 animate-spin" />}
                  {runStatus === 'PASSED' && <CheckCircle2 className="w-3 h-3" />}
                  {runStatus === 'FAILED' && <AlertCircle className="w-3 h-3" />}
                  {runStatus === 'STOPPED' && <Square className="w-3 h-3" />}
                  {runStatus}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  {platform} • <strong className="text-slate-300">{deviceAlias}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Geçen Süre: <span className="font-mono font-medium text-slate-200">{formatElapsed(elapsedSeconds)}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {isConnected ? (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">WebSocket Canlı</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-rose-400">Bağlantı Kesildi</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Abort Button */}
            {runStatus === 'RUNNING' && (
              <button
                type="button"
                onClick={handleAbort}
                disabled={isAborting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all disabled:opacity-50"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                {isAborting ? 'Durduruluyor...' : 'Koşuyu Durdur (Abort)'}
              </button>
            )}

            {/* Copy Logs */}
            <button
              type="button"
              onClick={handleCopyLogs}
              title="Logları Kopyala"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Clear Logs */}
            <button
              type="button"
              onClick={handleClearLogs}
              title="Ekranı Temizle"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Terminal Content Body */}
        <div className="flex-1 p-4 bg-slate-950 font-mono text-xs overflow-y-auto select-text scrollbar-thin scrollbar-thumb-slate-800">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
              <Terminal className="w-8 h-8 opacity-40" />
              <p>Henüz bir log akışı bulunmuyor...</p>
            </div>
          ) : (
            <div className="space-y-0.5 leading-relaxed">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/60 px-1.5 py-0.5 rounded">
                  <span className="text-slate-600 select-none shrink-0">{log.timestamp}</span>
                  <span className={`whitespace-pre-wrap break-all ${parseLogColor(log.text, log.isError)}`}>
                    {log.text}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Terminal Footer Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 text-purple-600 focus:ring-0 bg-slate-800"
              />
              <span>Otomatik Kaydır (Auto-scroll)</span>
            </label>
            <span>•</span>
            <span>{logs.length} satır log</span>
          </div>

          <div className="flex items-center gap-3">
            {summary.total > 0 && (
              <div className="flex items-center gap-2 font-medium">
                <span className="text-emerald-400">✓ {summary.passed} Passed</span>
                <span className="text-rose-400">✕ {summary.failed} Failed</span>
                {summary.skipped > 0 && <span className="text-amber-400">⊘ {summary.skipped} Skipped</span>}
              </div>
            )}
            <a
              href="http://localhost:8000"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>TAC Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
