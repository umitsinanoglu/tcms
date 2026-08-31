import { ResultStatus, Priority, DefectStatus, DefectSeverity, TestType } from '@/services/api';

export interface StatusBadgeConfig {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
}

export const RESULT_STATUS_CONFIG: Record<ResultStatus | 'UNTESTED', StatusBadgeConfig> = {
  PASSED: {
    label: 'Geçti (Passed)',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    textColor: '#34d399',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    dotColor: '#10b981',
  },
  FAILED: {
    label: 'Kaldı (Failed)',
    bgColor: 'rgba(244, 63, 94, 0.15)',
    textColor: '#f87171',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    dotColor: '#f43f5e',
  },
  BLOCKED: {
    label: 'Bloke (Blocked)',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    textColor: '#fbbf24',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    dotColor: '#f59e0b',
  },
  SKIPPED: {
    label: 'Atlandı (Skipped)',
    bgColor: 'rgba(100, 116, 139, 0.15)',
    textColor: '#94a3b8',
    borderColor: 'rgba(100, 116, 139, 0.3)',
    dotColor: '#64748b',
  },
  UNTESTED: {
    label: 'Koşulmadı (Untested)',
    bgColor: 'rgba(148, 163, 184, 0.1)',
    textColor: '#94a3b8',
    borderColor: 'rgba(148, 163, 184, 0.2)',
    dotColor: '#94a3b8',
  },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  BLOCKER: {
    label: 'Blocker',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
  },
  CRITICAL: {
    label: 'Kritik',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
  },
  NORMAL: {
    label: 'Normal',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
  },
  LOW: {
    label: 'Düşük',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
  },
};

export const DEFECT_STATUS_CONFIG: Record<DefectStatus, { label: string; color: string; bg: string }> = {
  OPEN: {
    label: 'Açık',
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.15)',
  },
  IN_PROGRESS: {
    label: 'İnceleniyor',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.15)',
  },
  RESOLVED: {
    label: 'Çözüldü',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.15)',
  },
  CLOSED: {
    label: 'Kapatıldı',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
  },
  REOPENED: {
    label: 'Yeniden Açıldı',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.2)',
  },
  WONT_FIX: {
    label: 'Düzeltilmeyecek',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.15)',
  },
};

export const DEFECT_SEVERITY_CONFIG: Record<DefectSeverity, { label: string; color: string; bg: string }> = {
  BLOCKER: {
    label: 'Blocker',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.2)',
  },
  CRITICAL: {
    label: 'Kritik',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.2)',
  },
  MAJOR: {
    label: 'Major',
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.15)',
  },
  MINOR: {
    label: 'Minor',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
  },
  TRIVIAL: {
    label: 'Trivial',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
  },
};
