'use client';

import React from 'react';
import { TestCase, Project } from '@/services/api';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Slash,
  Layers,
  FileCheck,
  TrendingUp,
  Activity,
  Play,
  Zap,
  ShieldCheck,
  Globe,
  Smartphone,
  Code,
} from 'lucide-react';

interface DashboardViewProps {
  project: Project | null;
  testCases: TestCase[];
  onOpenManualRun: () => void;
  onOpenNewCase: () => void;
  onSelectCase?: (testCase: TestCase) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  testCases,
  onOpenManualRun,
  onOpenNewCase,
  onSelectCase,
}) => {
  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500">
        <Layers className="w-16 h-16 mb-4 opacity-30 animate-pulse" />
        <p className="text-lg font-medium">Lütfen bir proje seçin</p>
        <p className="text-sm text-slate-500 mt-1">Dashboard metriklerini görüntülemek için üst menüden proje seçebilirsiniz.</p>
      </div>
    );
  }

  // Calculate Metrics
  const totalCases = testCases.length;
  const automatedCases = testCases.filter((tc) => tc.type !== 'MANUAL').length;
  const automatedRatio = totalCases > 0 ? Math.round((automatedCases / totalCases) * 100) : 0;
  const jiraLinkedCases = testCases.filter((tc) => Boolean(tc.jiraStoryKey)).length;
  const traceabilityRatio = totalCases > 0 ? Math.round((jiraLinkedCases / totalCases) * 100) : 0;

  // Status metrics from latest result
  let passedCount = 0;
  let failedCount = 0;
  let blockedCount = 0;
  let skippedCount = 0;
  let untestedCount = 0;

  testCases.forEach((tc) => {
    const latest = tc.results && tc.results.length > 0 ? tc.results[0] : null;
    if (!latest) {
      untestedCount++;
    } else {
      switch (latest.status) {
        case 'PASSED':
          passedCount++;
          break;
        case 'FAILED':
          failedCount++;
          break;
        case 'BLOCKED':
          blockedCount++;
          break;
        case 'SKIPPED':
          skippedCount++;
          break;
        default:
          untestedCount++;
          break;
      }
    }
  });

  const executedCount = passedCount + failedCount + blockedCount + skippedCount;
  const passRate = executedCount > 0 ? Math.round((passedCount / executedCount) * 100) : 0;

  // Priority breakdown
  const blockerCount = testCases.filter((tc) => tc.priority === 'BLOCKER').length;
  const criticalCount = testCases.filter((tc) => tc.priority === 'CRITICAL').length;
  const normalCount = testCases.filter((tc) => tc.priority === 'NORMAL').length;
  const lowCount = testCases.filter((tc) => tc.priority === 'LOW').length;

  // Type breakdown
  const webCount = testCases.filter((tc) => tc.type === 'WEB').length;
  const mobileCount = testCases.filter((tc) => tc.type === 'MOBILE').length;
  const apiCount = testCases.filter((tc) => tc.type === 'API').length;

  // Recent executions list
  const recentExecutions: { testCase: TestCase; result: any }[] = [];
  testCases.forEach((tc) => {
    if (tc.results && tc.results.length > 0) {
      tc.results.forEach((res) => {
        recentExecutions.push({ testCase: tc, result: res });
      });
    }
  });
  recentExecutions.sort((a, b) => new Date(b.result.executedAt).getTime() - new Date(a.result.executedAt).getTime());
  const latestActivity = recentExecutions.slice(0, 7);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Proje Analiz Dashboard'u</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                [{project.key}] {project.name} &bull; Gerçek Zamanlı Kalite Metrikleri
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenNewCase}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
          >
            + Yeni Case Ekle
          </button>
          <button
            onClick={onOpenManualRun}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test Run Başlat</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Cases */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Toplam Test Case</span>
            <FileCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono tracking-tight">{totalCases}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
              {automatedRatio}% Otomatik
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${automatedRatio}%` }} />
          </div>
        </div>

        {/* Card 2: Pass Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Başarı Oranı (Pass Rate)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
              {passRate}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {passedCount}/{executedCount || 1} Koşu
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${passRate}%` }} />
          </div>
        </div>

        {/* Card 3: Failed & Blocked */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Hata & Engel (Fail/Block)</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-extrabold font-mono text-red-600 dark:text-red-400 tracking-tight">
                {failedCount}
              </span>
              <span className="text-xs text-slate-400">Fail</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-medium">
              {blockedCount} Blocked
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
            <div className="bg-red-500 h-full" style={{ width: `${executedCount ? (failedCount / executedCount) * 100 : 0}%` }} />
            <div className="bg-purple-500 h-full" style={{ width: `${executedCount ? (blockedCount / executedCount) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Card 4: Jira Traceability */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Jira İzlenebilirlik</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono tracking-tight">{traceabilityRatio}%</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {jiraLinkedCases}/{totalCases} Case
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${traceabilityRatio}%` }} />
          </div>
        </div>
      </div>

      {/* Middle Section: Execution Progress & Priority Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>Test Durumu Dağılımı (Status Overview)</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{totalCases} Test Senaryosu</span>
          </div>

          {/* Big Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-xl overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${totalCases ? (passedCount / totalCases) * 100 : 0}%` }}
                title={`Passed: ${passedCount}`}
              />
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${totalCases ? (failedCount / totalCases) * 100 : 0}%` }}
                title={`Failed: ${failedCount}`}
              />
              <div
                className="bg-purple-500 h-full transition-all duration-500"
                style={{ width: `${totalCases ? (blockedCount / totalCases) * 100 : 0}%` }}
                title={`Blocked: ${blockedCount}`}
              />
              <div
                className="bg-slate-400 dark:bg-slate-600 h-full transition-all duration-500"
                style={{ width: `${totalCases ? (skippedCount / totalCases) * 100 : 0}%` }}
                title={`Skipped: ${skippedCount}`}
              />
            </div>

            {/* Badges Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="flex items-center justify-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PASSED</span>
                </div>
                <span className="text-lg font-mono font-extrabold text-emerald-700 dark:text-emerald-300">{passedCount}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <div className="flex items-center justify-center space-x-1 text-red-600 dark:text-red-400 font-bold text-xs">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>FAILED</span>
                </div>
                <span className="text-lg font-mono font-extrabold text-red-700 dark:text-red-300">{failedCount}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                <div className="flex items-center justify-center space-x-1 text-purple-600 dark:text-purple-400 font-bold text-xs">
                  <Slash className="w-3.5 h-3.5" />
                  <span>BLOCKED</span>
                </div>
                <span className="text-lg font-mono font-extrabold text-purple-700 dark:text-purple-300">{blockedCount}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
                <div className="flex items-center justify-center space-x-1 text-slate-600 dark:text-slate-400 font-bold text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>UNTESTED</span>
                </div>
                <span className="text-lg font-mono font-extrabold text-slate-700 dark:text-slate-300">{untestedCount}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <div className="flex items-center justify-center space-x-1 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  <Zap className="w-3.5 h-3.5" />
                  <span>KOŞULDU</span>
                </div>
                <span className="text-lg font-mono font-extrabold text-blue-700 dark:text-blue-300">{executedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Priority & Platform Type breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
            Öncelik & Platform Dağılımı
          </h3>

          <div className="space-y-3 text-xs">
            {/* Priority Bars */}
            <div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span>Blocker & Critical</span>
                <span className="font-mono font-bold text-red-500">{blockerCount + criticalCount} case</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full"
                  style={{ width: `${totalCases ? ((blockerCount + criticalCount) / totalCases) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span>Normal & Low</span>
                <span className="font-mono font-bold text-blue-500">{normalCount + lowCount} case</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${totalCases ? ((normalCount + lowCount) / totalCases) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Platform types */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                <Globe className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Web</span>
                <p className="font-mono font-bold">{webCount}</p>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                <Smartphone className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Mobile</span>
                <p className="font-mono font-bold">{mobileCount}</p>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                <Code className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 uppercase font-semibold">API</span>
                <p className="font-mono font-bold">{apiCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Execution Feed */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>Son Test Koşuları Aktivitesi</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Son {latestActivity.length} aktivite</span>
        </div>

        {latestActivity.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
            Henüz test koşusu yapılmadı. "Test Run Başlat" butonu ile ilk manuel test koşunuzu başlatabilirsiniz.
          </div>
        ) : (
          <div className="space-y-2">
            {latestActivity.map(({ testCase, result }, idx) => (
              <div
                key={idx}
                onClick={() => onSelectCase && onSelectCase(testCase)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/50 transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {result.status === 'PASSED' && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] shrink-0">
                      PASS
                    </span>
                  )}
                  {result.status === 'FAILED' && (
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 font-mono font-bold text-[10px] shrink-0">
                      FAIL
                    </span>
                  )}
                  {result.status === 'BLOCKED' && (
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-mono font-bold text-[10px] shrink-0">
                      BLOCK
                    </span>
                  )}
                  {result.status === 'SKIPPED' && (
                    <span className="px-2 py-0.5 rounded bg-slate-500/20 text-slate-600 dark:text-slate-400 font-mono font-bold text-[10px] shrink-0">
                      SKIP
                    </span>
                  )}

                  <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0">{testCase.code}</span>
                  <span className="font-medium truncate text-slate-700 dark:text-slate-200">{testCase.title}</span>
                </div>

                <div className="flex items-center space-x-3 shrink-0 text-[11px] text-slate-400 font-mono">
                  <span>{new Date(result.executedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                  {result.executedBy && <span className="hidden sm:inline text-slate-500">by {result.executedBy}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
