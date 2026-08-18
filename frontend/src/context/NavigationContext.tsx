'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface NavigationState {
  tab: 'DASHBOARD' | 'EXPLORER' | 'RUNS' | 'REPORTS';
  projectId: string | null;
  suiteId: string | null;
  caseId: string | null;
  label: string;
  timestamp?: number;
}

interface NavigationContextType {
  history: NavigationState[];
  currentIndex: number;
  currentState: NavigationState | null;
  canGoBack: boolean;
  canGoForward: boolean;
  previousState: NavigationState | null;
  nextState: NavigationState | null;
  pushState: (state: Omit<NavigationState, 'timestamp'>) => void;
  goBack: () => void;
  goForward: () => void;
  registerNavigationHandler: (handler: (state: NavigationState) => void) => () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const MAX_HISTORY_LENGTH = 50;

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<NavigationState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // Synchronous refs to prevent any stale closure issues
  const historyRef = useRef<NavigationState[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const isNavigatingRef = useRef(false);
  const navigationHandlerRef = useRef<((state: NavigationState) => void) | null>(null);

  const currentState = currentIndex >= 0 && currentIndex < history.length ? history[currentIndex] : null;
  
  // canGoBack is true if there is a previous history item OR if we are currently deep in Explorer/Suite/Case/Runs and can navigate back to Dashboard
  const canGoBack =
    currentIndex > 0 ||
    Boolean(currentState && (currentState.tab !== 'DASHBOARD' || currentState.suiteId || currentState.caseId));

  const canGoForward = currentIndex >= 0 && currentIndex < history.length - 1;
  const previousState = currentIndex > 0 ? history[currentIndex - 1] : null;
  const nextState = canGoForward ? history[currentIndex + 1] : null;

  // Load history from localStorage on initial mount
  useEffect(() => {
    try {
      const savedHist = localStorage.getItem('tcms_nav_history');
      const savedIdx = localStorage.getItem('tcms_nav_index');
      if (savedHist && savedIdx !== null) {
        const parsed = JSON.parse(savedHist);
        const idx = parseInt(savedIdx, 10);
        if (Array.isArray(parsed) && parsed.length > 0 && idx >= 0 && idx < parsed.length) {
          historyRef.current = parsed;
          currentIndexRef.current = idx;
          setHistory(parsed);
          setCurrentIndex(idx);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const persistNavHistory = (hist: NavigationState[], idx: number) => {
    try {
      localStorage.setItem('tcms_nav_history', JSON.stringify(hist));
      localStorage.setItem('tcms_nav_index', String(idx));
    } catch {
      // Ignore
    }
  };

  // Register state applicator from page.tsx
  const registerNavigationHandler = useCallback((handler: (state: NavigationState) => void) => {
    navigationHandlerRef.current = handler;
    return () => {
      navigationHandlerRef.current = null;
    };
  }, []);

  // Push new navigation state - completely synchronous via refs
  const pushState = useCallback((newState: Omit<NavigationState, 'timestamp'>) => {
    if (isNavigatingRef.current) return;

    const prevHistory = historyRef.current;
    const currentIdx = currentIndexRef.current;
    const currentItem = currentIdx >= 0 && currentIdx < prevHistory.length ? prevHistory[currentIdx] : null;

    // Avoid consecutive duplicate states
    if (
      currentItem &&
      currentItem.tab === newState.tab &&
      currentItem.projectId === newState.projectId &&
      currentItem.suiteId === newState.suiteId &&
      currentItem.caseId === newState.caseId
    ) {
      // If only the label updated (e.g. project name loaded), update current in place
      if (currentItem.label !== newState.label) {
        const updated = [...prevHistory];
        updated[currentIdx] = { ...currentItem, label: newState.label };
        historyRef.current = updated;
        setHistory(updated);
        persistNavHistory(updated, currentIdx);
      }
      return;
    }

    // Truncate any forward history if we were in the middle of the stack
    const validHistory = currentIdx >= 0 ? prevHistory.slice(0, currentIdx + 1) : [];
    const itemWithTime: NavigationState = {
      ...newState,
      timestamp: Date.now(),
    };

    const newHistory = [...validHistory, itemWithTime];
    if (newHistory.length > MAX_HISTORY_LENGTH) {
      newHistory.shift();
    }

    const newIndex = newHistory.length - 1;

    historyRef.current = newHistory;
    currentIndexRef.current = newIndex;

    setHistory(newHistory);
    setCurrentIndex(newIndex);
    persistNavHistory(newHistory, newIndex);
  }, []);

  // Go Back with Smart Fallback
  const goBack = useCallback(() => {
    const prevHistory = historyRef.current;
    const currentIdx = currentIndexRef.current;

    // 1. Standard History Back
    if (currentIdx > 0 && prevHistory.length > 1) {
      const targetIndex = currentIdx - 1;
      const targetState = prevHistory[targetIndex];

      if (targetState) {
        isNavigatingRef.current = true;
        currentIndexRef.current = targetIndex;
        setCurrentIndex(targetIndex);
        persistNavHistory(prevHistory, targetIndex);

        if (navigationHandlerRef.current) {
          navigationHandlerRef.current(targetState);
        }

        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 150);
        return;
      }
    }

    // 2. Smart Contextual Fallback (e.g. after refresh when in Suite, Case, or non-Dashboard tab)
    const current = currentIdx >= 0 && currentIdx < prevHistory.length ? prevHistory[currentIdx] : null;
    if (navigationHandlerRef.current) {
      const fallbackState: NavigationState = {
        tab: 'DASHBOARD',
        projectId: current?.projectId || null,
        suiteId: null,
        caseId: null,
        label: 'Dashboard',
        timestamp: Date.now(),
      };

      isNavigatingRef.current = true;
      navigationHandlerRef.current(fallbackState);

      const updatedHistory = [fallbackState];
      historyRef.current = updatedHistory;
      currentIndexRef.current = 0;
      setHistory(updatedHistory);
      setCurrentIndex(0);
      persistNavHistory(updatedHistory, 0);

      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 150);
    }
  }, []);

  // Go Forward
  const goForward = useCallback(() => {
    const prevHistory = historyRef.current;
    const currentIdx = currentIndexRef.current;

    if (currentIdx >= 0 && currentIdx < prevHistory.length - 1) {
      const targetIndex = currentIdx + 1;
      const targetState = prevHistory[targetIndex];

      if (targetState) {
        isNavigatingRef.current = true;
        currentIndexRef.current = targetIndex;
        setCurrentIndex(targetIndex);
        persistNavHistory(prevHistory, targetIndex);

        if (navigationHandlerRef.current) {
          navigationHandlerRef.current(targetState);
        }

        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 150);
      }
    }
  }, []);

  // Keyboard shortcut listener (Alt + Left Arrow for Back, Alt + Right Arrow for Forward)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goForward();
      } else if (e.key === 'Backspace' && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        goBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack, goForward]);

  return (
    <NavigationContext.Provider
      value={{
        history,
        currentIndex,
        currentState,
        canGoBack,
        canGoForward,
        previousState,
        nextState,
        pushState,
        goBack,
        goForward,
        registerNavigationHandler,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
