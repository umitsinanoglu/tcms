'use client';

import React, { useState } from 'react';
import { TestCase, TestResult } from '@/services/api';
import { ExternalLink, Link2, Filter, Layers, CheckCircle, XCircle, AlertTriangle, MinusCircle } from 'lucide-react';

interface TraceabilityViewProps {
  testCases: TestCase[];
  latestResultsMap?: Record<string, TestResult>;
  onSelectTestCase?: (testCase: TestCase) => void;
}

export const TraceabilityView: React.FC<TraceabilityViewProps> = ({
  testCases,
  latestResultsMap = {},
  onSelectTestCase,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'LINKED' | 'UNLINKED'>('ALL');
  const [search, setSearch] = useState('');

  const filteredCases = testCases.filter((tc) => {
    // Filter by Jira link status
    if (filter === 'LINKED' && !tc.jiraStoryKey) return false;
    if (filter === 'UNLINKED' && tc.jiraStoryKey) return false;

    // Search text
    if (search.trim()) {
      const q = search.toLowerCase();
      const codeMatch = tc.code.toLowerCase().includes(q);
      const titleMatch = tc.title.toLowerCase().includes(q);
      const jiraMatch = tc.jiraStoryKey ? tc.jiraStoryKey.toLowerCase().includes(q) : false;
      return codeMatch || titleMatch || jiraMatch;
    }

    return true;
  });

  const renderStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
          <MinusCircle className="w-3 h-3 text-slate-500" />
          <span>NOT EXECUTED</span>
        </span>
      );
    }
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>PASSED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>FAILED</span>
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <MinusCircle className="w-3 h-3 text-amber-400" />
            <span>SKIPPED</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            <AlertTriangle className="w-3 h-3 text-purple-400" />
            <span>BLOCKED</span>
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background p-6 space-y-6 overflow-y-auto">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Link2 className="w-5 h-5 text-blue-400" />
            <span>Jira Traceability (İzlenebilirlik Matriksi)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Test senaryolarının Jira Story gereksinimleri ile eşleşme durumunu ve son koşu sonuçlarını izleyin.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Senaryo veya Jira Key ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 space-x-1 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                filter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({testCases.length})
            </button>
            <button
              onClick={() => setFilter('LINKED')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                filter === 'LINKED'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Jira Linked ({testCases.filter((tc) => tc.jiraStoryKey).length})
            </button>
            <button
              onClick={() => setFilter('UNLINKED')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                filter === 'UNLINKED'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Jira Not Linked ({testCases.filter((tc) => !tc.jiraStoryKey).length})
            </button>
          </div>
        </div>
      </div>

      {/* Traceability Table */}
      <div className="border border-surface-border rounded-xl overflow-hidden bg-surface/40">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-surface-border">
              <th className="py-3 px-4 w-36">Test Case</th>
              <th className="py-3 px-4">Title (Senaryo Başlığı)</th>
              <th className="py-3 px-4 w-44">Jira Story</th>
              <th className="py-3 px-4 w-36">Last Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-500">
                  <Filter className="w-6 h-6 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p>Kriterlere uygun test senaryosu bulunamadı.</p>
                </td>
              </tr>
            ) : (
              filteredCases.map((tc) => {
                const lastResult = latestResultsMap[tc.id]?.status || (tc.results && tc.results.length > 0 ? tc.results[0].status : undefined);
                return (
                  <tr
                    key={tc.id}
                    onClick={() => onSelectTestCase && onSelectTestCase(tc)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      {tc.code}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-medium">
                      {tc.title}
                    </td>
                    <td className="py-3 px-4">
                      {tc.jiraStoryKey ? (
                        <a
                          href={tc.jiraIssueUrl || `https://company.atlassian.net/browse/${tc.jiraStoryKey}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center space-x-1.5 font-mono font-bold text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded border border-blue-500/20 transition-colors"
                        >
                          <span>{tc.jiraStoryKey}</span>
                          <ExternalLink className="w-3 h-3 text-blue-400" />
                        </a>
                      ) : (
                        <span className="text-slate-600 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{renderStatusBadge(lastResult)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
