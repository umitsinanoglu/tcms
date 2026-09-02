import { useCallback } from 'react';
import { SidebarTab } from '@/components/AppSidebar';

export interface SavedSessionState {
  projectId: string | null;
  tab: SidebarTab;
  suiteId: string | null;
  caseId: string | null;
  runId?: string | null;
  planId?: string | null;
}

const STORAGE_KEY = 'tcms_session_state';
const ACTIVE_TAB_KEY = 'tcms_active_tab';

export function useSessionPersistence() {
  const saveSessionState = useCallback((state: Partial<SavedSessionState>) => {
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      const existing: SavedSessionState = existingRaw
        ? JSON.parse(existingRaw)
        : { projectId: null, tab: 'DASHBOARD', suiteId: null, caseId: null, runId: null, planId: null };

      const merged: SavedSessionState = {
        ...existing,
        ...state,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      if (merged.tab) {
        localStorage.setItem(ACTIVE_TAB_KEY, merged.tab);
      }
    } catch {
      // Ignore in non-browser environment
    }
  }, []);

  const getSavedSessionState = useCallback((): SavedSessionState | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  return {
    saveSessionState,
    getSavedSessionState,
  };
}
