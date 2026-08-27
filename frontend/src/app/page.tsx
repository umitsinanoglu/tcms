'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Project,
  SuiteTreeNode,
  TestCase,
  TestPlan,
  TestRun,
  Defect,
  CreateTestPlanDto,
  ProjectsService,
  SuitesService,
  TestCasesService,
  TestPlansService,
  TestRunsService,
  DefectsService,
} from '@/services/api';
import { Header } from '@/components/Header';
import { AppSidebar, SidebarTab } from '@/components/AppSidebar';
import { TestCaseEditor } from '@/components/TestCaseEditor';
import { TestScenariosView } from '@/components/TestScenariosView';
import { TestPlansView } from '@/components/TestPlansView';
import { TestPlanDetailView } from '@/components/TestPlanDetailView';
import { TestRunsView } from '@/components/TestRunsView';
import { TestRunDetailView } from '@/components/TestRunDetailView';
import { DashboardView } from '@/components/DashboardView';
import { DefectsView } from '@/components/DefectsView';
import { ManualRunModal } from '@/components/ManualRunModal';
import { NewProjectModal } from '@/components/NewProjectModal';
import { EditProjectModal } from '@/components/EditProjectModal';
import { NewCaseModal } from '@/components/NewCaseModal';
import { NewTestPlanModal } from '@/components/NewTestPlanModal';
import { QuickRunModal } from '@/components/QuickRunModal';
import { UserManagementModal } from '@/components/UserManagementModal';
import { useNavigation, NavigationState } from '@/context/NavigationContext';
import { useAuth } from '@/context/AuthContext';
import { LoginView } from '@/components/LoginView';
import { ReportsView } from '@/components/ReportsView';

export default function Home() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { pushState, registerNavigationHandler, goBack } = useNavigation();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tree, setTree] = useState<SuiteTreeNode[]>([]);
  const [rootCases, setRootCases] = useState<TestCase[]>([]);
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [selectedDefectForModal, setSelectedDefectForModal] = useState<Defect | null>(null);
  const [testRunsCount, setTestRunsCount] = useState<number>(0);
  const [defectsCount, setDefectsCount] = useState<number>(0);
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<SuiteTreeNode | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<TestPlan | null>(null);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('DASHBOARD');
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  const projectsRef = useRef<Project[]>([]);
  projectsRef.current = projects;

  const selectedProjectRef = useRef<Project | null>(null);
  selectedProjectRef.current = selectedProject;

  const treeRef = useRef<SuiteTreeNode[]>([]);
  treeRef.current = tree;

  const testPlansRef = useRef<TestPlan[]>([]);
  testPlansRef.current = testPlans;

  // Flatten all cases helper
  const getAllCasesInTree = (nodes: SuiteTreeNode[]): TestCase[] => {
    let cases: TestCase[] = [];
    nodes.forEach((node) => {
      if (node.testCases) cases = cases.concat(node.testCases);
      if (node.children) cases = cases.concat(getAllCasesInTree(node.children));
    });
    return cases;
  };

  const allCases = [...rootCases, ...getAllCasesInTree(tree)];

  // Helper to find a suite node inside the tree recursively
  const findSuiteInTree = (nodes: SuiteTreeNode[], suiteId: string): SuiteTreeNode | null => {
    for (const node of nodes) {
      if (node.id === suiteId) return node;
      if (node.children && node.children.length > 0) {
        const found = findSuiteInTree(node.children, suiteId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to update a test case in tree nodes recursively
  const updateCaseInTreeNodes = (nodes: SuiteTreeNode[], updated: TestCase): SuiteTreeNode[] => {
    return nodes.map((node) => {
      const hasCase = node.testCases?.some((tc) => tc.id === updated.id);
      const newCases = hasCase
        ? node.testCases.map((tc) => (tc.id === updated.id ? { ...tc, ...updated } : tc))
        : node.testCases || [];
      const newChildren = node.children && node.children.length > 0
        ? updateCaseInTreeNodes(node.children, updated)
        : node.children;
      return {
        ...node,
        testCases: newCases,
        children: newChildren,
      };
    });
  };

  // Helper to add a test case into tree nodes recursively
  const addCaseToTreeNodes = (nodes: SuiteTreeNode[], newCase: TestCase): SuiteTreeNode[] => {
    return nodes.map((node) => {
      if (node.id === newCase.suiteId) {
        return {
          ...node,
          testCases: [...(node.testCases || []), newCase],
        };
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: addCaseToTreeNodes(node.children, newCase),
        };
      }
      return node;
    });
  };

  // Helper to remove a test case from tree nodes recursively
  const removeCaseFromTreeNodes = (nodes: SuiteTreeNode[], caseId: string): SuiteTreeNode[] => {
    return nodes.map((node) => {
      const newCases = (node.testCases || []).filter((tc) => tc.id !== caseId);
      const newChildren = node.children && node.children.length > 0
        ? removeCaseFromTreeNodes(node.children, caseId)
        : node.children;
      return {
        ...node,
        testCases: newCases,
        children: newChildren,
      };
    });
  };

  // Helper for Session State Persistence
  interface SavedSessionState {
    projectId: string | null;
    tab: SidebarTab;
    suiteId: string | null;
    caseId: string | null;
    runId?: string | null;
    planId?: string | null;
  }

  const saveSessionState = (state: Partial<SavedSessionState>) => {
    try {
      const existingRaw = localStorage.getItem('tcms_session_state');
      const existing: SavedSessionState = existingRaw
        ? JSON.parse(existingRaw)
        : { projectId: null, tab: 'DASHBOARD', suiteId: null, caseId: null, runId: null, planId: null };

      const merged: SavedSessionState = {
        ...existing,
        ...state,
      };
      localStorage.setItem('tcms_session_state', JSON.stringify(merged));
      if (merged.tab) {
        localStorage.setItem('tcms_active_tab', merged.tab);
      }
    } catch {
      // Ignore
    }
  };

  const getSavedSessionState = (): SavedSessionState | null => {
    try {
      const raw = localStorage.getItem('tcms_session_state');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  // Modals state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [activeEditProject, setActiveEditProject] = useState<Project | null>(null);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isNewTestPlanOpen, setIsNewTestPlanOpen] = useState(false);
  const [isManualRunOpen, setIsManualRunOpen] = useState(false);
  const [activeRunTestPlan, setActiveRunTestPlan] = useState<TestPlan | null>(null);
  const [isQuickRunOpen, setIsQuickRunOpen] = useState(false);
  const [activeQuickRunCase, setActiveQuickRunCase] = useState<TestCase | null>(null);
  const [activeQuickRunVersion, setActiveQuickRunVersion] = useState<string>('v1.0.0');
  const [activeQuickRunEnvironment, setActiveQuickRunEnvironment] = useState<string>('STAGING');
  const [activeSuiteRunCases, setActiveSuiteRunCases] = useState<TestCase[] | null>(null);
  const [activeParentSuiteId, setActiveParentSuiteId] = useState<string | null>(null);

  // Load Tree & Plans & Runs count & Defects when selected project changes
  const loadProjectData = useCallback(async (projectId: string) => {
    setIsLoadingTree(true);
    try {
      const [treeRes, plansRes, runsRes, defectsRes, defectsStats] = await Promise.all([
        ProjectsService.getTree(projectId).catch(() => ({ tree: [], rootTestCases: [] })),
        TestPlansService.getAllByProject(projectId).catch(() => []),
        TestRunsService.getRuns(projectId).catch(() => []),
        DefectsService.getAllByProject(projectId).catch(() => []),
        DefectsService.getStatsByProject(projectId).catch(() => null),
      ]);

      const newTree = (treeRes && 'tree' in treeRes && treeRes.tree) || [];
      const newRootCases = (treeRes && 'rootTestCases' in treeRes && treeRes.rootTestCases) || [];
      setTree(newTree);
      setRootCases(newRootCases);
      setTestPlans(plansRes || []);
      setTestRuns(runsRes || []);
      setDefects(defectsRes || []);
      setTestRunsCount(runsRes?.length || 0);
      setDefectsCount(defectsStats?.metrics?.active || 0);

      return { tree: newTree, rootCases: newRootCases, plans: plansRes || [], runs: runsRes || [], defects: defectsRes || [] };
    } catch (err) {
      console.error('Failed to load project data:', err);
      setTree([]);
      setRootCases([]);
      setTestPlans([]);
      setTestRuns([]);
      setDefects([]);
      setTestRunsCount(0);
      setDefectsCount(0);
      return { tree: [], rootCases: [], plans: [], runs: [], defects: [] };
    } finally {
      setIsLoadingTree(false);
    }
  }, []);

  // Handle Tab Change with Navigation Push - Always navigates to root of the tab
  const handleTabChange = useCallback(
    (tab: SidebarTab, shouldPushState = true) => {
      setSelectedCase(null);
      setSelectedSuite(null);
      setSelectedPlan(null);
      setSelectedRun(null);
      setSelectedDefectForModal(null);

      setActiveTab(tab);
      saveSessionState({
        tab,
        projectId: selectedProject?.id || null,
        suiteId: null,
        caseId: null,
        runId: null,
        planId: null,
      });

      if (shouldPushState) {
        let label = 'Ana Sayfa';
        if (tab === 'PLANS') label = 'Test Planları';
        else if (tab === 'RUNS') label = 'Test Koşumları';
        else if (tab === 'DEFECTS') label = 'Defectler & Hatalar';
        else if (tab === 'REPORTS') label = 'Test Raporları';
        else if (tab === 'EXPLORER') label = 'Test Senaryoları';

        pushState({
          tab,
          projectId: selectedProject?.id || null,
          suiteId: null,
          caseId: null,
          runId: null,
          planId: null,
          label,
        });
      }
    },
    [pushState, selectedProject]
  );

  // Handle Project Selection with Navigation Push
  const handleSelectProject = useCallback(
    async (p: Project, shouldPushState = true) => {
      setSelectedCase(null);
      setSelectedSuite(null);
      setSelectedPlan(null);
      setSelectedRun(null);
      setSelectedDefectForModal(null);
      setSelectedProject(p);
      setTree([]);
      setRootCases([]);
      setTestPlans([]);
      setTestRuns([]);
      setDefects([]);
      saveSessionState({
        projectId: p.id,
        tab: activeTab,
        suiteId: null,
        caseId: null,
        runId: null,
        planId: null,
      });

      const loaded = await loadProjectData(p.id);

      if (shouldPushState) {
        pushState({
          tab: activeTab,
          projectId: p.id,
          suiteId: null,
          caseId: null,
          runId: null,
          planId: null,
          label: `Proje: [${p.key}] ${p.name}`,
        });
      }
      return loaded;
    },
    [activeTab, loadProjectData, pushState]
  );

  // Handle Suite Selection with Navigation Push
  const handleSelectSuite = useCallback(
    (suite: SuiteTreeNode, shouldPushState = true) => {
      setSelectedCase(null);
      setSelectedPlan(null);
      setSelectedRun(null);
      setSelectedDefectForModal(null);
      setSelectedSuite(suite);
      setActiveTab('EXPLORER');
      saveSessionState({
        projectId: selectedProject?.id || null,
        tab: 'EXPLORER',
        suiteId: suite.id,
        caseId: null,
        planId: null,
        runId: null,
      });

      if (shouldPushState) {
        pushState({
          tab: 'EXPLORER',
          projectId: selectedProject?.id || null,
          suiteId: suite.id,
          caseId: null,
          planId: null,
          runId: null,
          label: `Suite: ${suite.name}`,
        });
      }
    },
    [pushState, selectedProject]
  );

  // Handle Test Plan Selection with Navigation Push
  const handleSelectPlan = useCallback(
    (plan: TestPlan, shouldPushState = true) => {
      setSelectedCase(null);
      setSelectedSuite(null);
      setSelectedRun(null);
      setSelectedDefectForModal(null);
      setSelectedPlan(plan);
      setActiveRunTestPlan(plan);
      setActiveTab('PLANS');
      saveSessionState({
        projectId: selectedProject?.id || null,
        tab: 'PLANS',
        suiteId: null,
        caseId: null,
        runId: null,
        planId: plan.id,
      });

      if (shouldPushState) {
        pushState({
          tab: 'PLANS',
          projectId: selectedProject?.id || null,
          suiteId: null,
          caseId: null,
          runId: null,
          planId: plan.id,
          label: `Plan: ${plan.title}`,
        });
      }
    },
    [pushState, selectedProject]
  );

  // Handle Test Case Selection with Navigation Push
  const handleSelectCase = useCallback(
    (tc: TestCase, shouldPushState = true) => {
      setSelectedSuite(null);
      setSelectedPlan(null);
      setSelectedRun(null);
      setSelectedDefectForModal(null);
      setSelectedCase(tc);
      setActiveTab('EXPLORER');
      saveSessionState({
        projectId: selectedProject?.id || null,
        tab: 'EXPLORER',
        suiteId: null,
        caseId: tc.id,
        planId: null,
        runId: null,
      });

      TestCasesService.getOne(tc.id)
        .then((fresh) => {
          if (fresh) setSelectedCase(fresh);
        })
        .catch(() => {});

      if (shouldPushState) {
        pushState({
          tab: 'EXPLORER',
          projectId: selectedProject?.id || null,
          suiteId: null,
          caseId: tc.id,
          planId: null,
          runId: null,
          label: `Case: ${tc.code} (${tc.title.length > 25 ? tc.title.slice(0, 25) + '...' : tc.title})`,
        });
      }
    },
    [pushState, selectedProject]
  );

  // Handle Test Run Selection with Navigation Push
  const handleSelectRun = useCallback(
    async (run: TestRun, shouldPushState = true) => {
      setSelectedCase(null);
      setSelectedSuite(null);
      setSelectedPlan(null);
      setSelectedDefectForModal(null);
      setActiveTab('RUNS');
      saveSessionState({
        projectId: selectedProject?.id || null,
        tab: 'RUNS',
        suiteId: null,
        caseId: null,
        runId: run.id,
        planId: null,
      });

      try {
        const runDetails = await TestRunsService.getRunDetails(run.id);
        setSelectedRun(runDetails || run);
      } catch {
        setSelectedRun(run);
      }

      if (shouldPushState) {
        pushState({
          tab: 'RUNS',
          projectId: selectedProject?.id || null,
          suiteId: null,
          caseId: null,
          runId: run.id,
          planId: null,
          label: `Koşum: ${run.title}`,
        });
      }
    },
    [pushState, selectedProject]
  );

  // Handle Defect Selection with Navigation Push
  const handleSelectDefect = useCallback(
    (defect: Defect, shouldPushState = true) => {
      setSelectedCase(null);
      setSelectedSuite(null);
      setSelectedPlan(null);
      setSelectedRun(null);
      setActiveTab('DEFECTS');
      setSelectedDefectForModal(defect);
      saveSessionState({
        projectId: selectedProject?.id || null,
        tab: 'DEFECTS',
        suiteId: null,
        caseId: null,
        runId: null,
        planId: null,
      });

      if (shouldPushState) {
        pushState({
          tab: 'DEFECTS',
          projectId: selectedProject?.id || null,
          suiteId: null,
          caseId: null,
          runId: null,
          planId: null,
          label: `Defect: [${defect.key}] ${defect.title}`,
        });
      }
    },
    [pushState, selectedProject]
  );

  const handleClearInitialDefect = useCallback(() => {
    setSelectedDefectForModal(null);
  }, []);

  const handleDefectsLoaded = useCallback((loaded: Defect[]) => {
    setDefects(loaded);
  }, []);

  const handleDefectsCountChange = useCallback((count: number) => {
    setDefectsCount(count);
  }, []);

  // Handle closing case editor
  const handleCloseCase = useCallback(() => {
    setSelectedCase(null);
    saveSessionState({ caseId: null });
    pushState({
      tab: activeTab,
      projectId: selectedProject?.id || null,
      suiteId: null,
      caseId: null,
      planId: null,
      runId: null,
      label: activeTab === 'DASHBOARD' ? 'Ana Sayfa' : 'Test Senaryoları',
    });
  }, [activeTab, pushState, selectedProject]);

  // Handle closing suite view
  const handleCloseSuite = useCallback(() => {
    setSelectedSuite(null);
    saveSessionState({ suiteId: null });
    pushState({
      tab: activeTab,
      projectId: selectedProject?.id || null,
      suiteId: null,
      caseId: null,
      planId: null,
      runId: null,
      label: activeTab === 'DASHBOARD' ? 'Ana Sayfa' : 'Test Senaryoları',
    });
  }, [activeTab, pushState, selectedProject]);

  // Register Navigation History Handler for Back / Forward operations
  useEffect(() => {
    const unregister = registerNavigationHandler(async (targetState: NavigationState) => {
      setActiveTab(targetState.tab as SidebarTab);
      saveSessionState({
        tab: targetState.tab as SidebarTab,
        projectId: targetState.projectId,
        suiteId: targetState.suiteId,
        caseId: targetState.caseId,
        runId: targetState.runId,
        planId: targetState.planId,
      });

      let targetTree = treeRef.current;

      // Handle Project switch if needed
      const curProj = selectedProjectRef.current;
      if (targetState.projectId && (!curProj || curProj.id !== targetState.projectId)) {
        const foundProj = projectsRef.current.find((p) => p.id === targetState.projectId);
        if (foundProj) {
          setSelectedProject(foundProj);
          const loaded = await loadProjectData(foundProj.id);
          targetTree = loaded.tree;
        }
      }

      // Handle Suite, Case, Plan, or Run restore
      if (targetState.runId) {
        setSelectedCase(null);
        setSelectedSuite(null);
        setSelectedPlan(null);
        try {
          const runDetails = await TestRunsService.getRunDetails(targetState.runId);
          setSelectedRun(runDetails);
        } catch {
          setSelectedRun(null);
        }
      } else if (targetState.planId) {
        setSelectedCase(null);
        setSelectedSuite(null);
        setSelectedRun(null);
        try {
          const plan = await TestPlansService.getOne(targetState.planId);
          setSelectedPlan(plan);
          setActiveRunTestPlan(plan);
        } catch {
          const found = testPlansRef.current.find((p) => p.id === targetState.planId);
          setSelectedPlan(found || null);
        }
      } else if (targetState.caseId) {
        setSelectedSuite(null);
        setSelectedRun(null);
        setSelectedPlan(null);
        try {
          const tc = await TestCasesService.getOne(targetState.caseId);
          setSelectedCase(tc);
        } catch {
          setSelectedCase(null);
        }
      } else if (targetState.suiteId) {
        setSelectedCase(null);
        setSelectedRun(null);
        setSelectedPlan(null);
        if (targetState.suiteId === '__root_cases__') {
          setSelectedSuite({
            id: '__root_cases__',
            name: "Kök Test Senaryoları (Suite'siz)",
            orderIndex: 0,
            parentId: null,
            children: [],
            testCases: rootCases,
          });
        } else {
          const suite = findSuiteInTree(targetTree, targetState.suiteId);
          if (suite) {
            setSelectedSuite(suite);
          } else {
            setSelectedSuite(null);
          }
        }
      } else {
        setSelectedCase(null);
        setSelectedSuite(null);
        if (targetState.tab !== 'PLANS') {
          setSelectedPlan(null);
        }
        if (targetState.tab !== 'RUNS') {
          setSelectedRun(null);
        }
      }
    });

    return () => unregister();
  }, [registerNavigationHandler, loadProjectData, rootCases]);

  // Load projects on mount
  const loadProjects = useCallback(async () => {
    try {
      const data = await ProjectsService.getAll();
      const sorted = [...data].sort((a, b) =>
        a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
      );
      setProjects(sorted);

      if (sorted.length > 0) {
        const savedState = getSavedSessionState();

        let targetProj = sorted[0];
        if (savedState?.projectId) {
          const found = sorted.find((p) => p.id === savedState.projectId);
          if (found) targetProj = found;
        }

        const validTabs: SidebarTab[] = ['DASHBOARD', 'PLANS', 'EXPLORER', 'RUNS', 'REPORTS'];
        const targetTab: SidebarTab =
          savedState?.tab && validTabs.includes(savedState.tab)
            ? savedState.tab
            : 'DASHBOARD';

        setSelectedProject(targetProj);
        setActiveTab(targetTab);
        setSelectedCase(null);
        setSelectedSuite(null);
        setSelectedPlan(null);
        setSelectedRun(null);

        await loadProjectData(targetProj.id);

        saveSessionState({
          projectId: targetProj.id,
          tab: targetTab,
          suiteId: null,
          caseId: null,
          runId: null,
        });

        let label = 'Ana Sayfa';
        if (targetTab === 'PLANS') label = 'Test Planları';
        else if (targetTab === 'RUNS') label = 'Test Koşumları';
        else if (targetTab === 'REPORTS') label = 'Test Raporları';
        else if (targetTab === 'EXPLORER') label = 'Test Senaryoları';

        pushState({
          tab: targetTab,
          projectId: targetProj.id,
          suiteId: null,
          caseId: null,
          runId: null,
          label,
        });
      } else {
        setSelectedProject(null);
        setSelectedCase(null);
        setSelectedSuite(null);
        setSelectedRun(null);
        localStorage.removeItem('tcms_session_state');
        setIsNewProjectOpen(true);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, [loadProjectData, pushState]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated, loadProjects]);

  // Handlers for Project actions
  const handleCreateProject = async (data: { name: string; key: string; description?: string; jiraProjectKey?: string }) => {
    const newProj = await ProjectsService.create(data);
    const dataProjects = await ProjectsService.getAll();
    const sorted = [...dataProjects].sort((a, b) =>
      a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
    );
    const targetProj = sorted.find((p) => p.id === newProj.id) || newProj;

    setProjects(sorted);
    setSelectedCase(null);
    setSelectedSuite(null);
    setTree([]);
    setRootCases([]);
    await handleSelectProject(targetProj);
  };

  const handleUpdateProject = async (id: string, data: { name?: string; key?: string; description?: string; jiraProjectKey?: string }) => {
    const updated = await ProjectsService.update(id, data);
    const dataProjects = await ProjectsService.getAll();
    const sorted = [...dataProjects].sort((a, b) =>
      a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
    );
    setProjects(sorted);
    setSelectedProject((prev) => (prev?.id === id ? { ...prev, ...updated } : prev));
    if (selectedProject?.id === id) {
      await loadProjectData(id);
    }
  };

  const handleDeleteProject = async (id: string) => {
    await ProjectsService.delete(id);
    setSelectedCase(null);
    setSelectedSuite(null);
    const updatedList = projects.filter((p) => p.id !== id);
    setProjects(updatedList);
    if (selectedProject?.id === id) {
      const next = updatedList.length > 0 ? updatedList[0] : null;
      if (next) {
        await handleSelectProject(next);
      } else {
        setSelectedProject(null);
        setTree([]);
        setRootCases([]);
        localStorage.removeItem('tcms_session_state');
        setIsNewProjectOpen(true);
      }
    }
  };



  // Handlers for TestCase actions
  const handleCreateCase = async (data: Partial<TestCase>) => {
    const created = await TestCasesService.create(data);
    if (created.suiteId) {
      setTree((prevTree) => addCaseToTreeNodes(prevTree, created));
    } else {
      setRootCases((prevRoots) => [created, ...prevRoots]);
    }
    setSelectedSuite((prevSuite) => {
      if (prevSuite) {
        if (prevSuite.id === created.suiteId || (prevSuite.id === '__root_cases__' && !created.suiteId)) {
          return {
            ...prevSuite,
            testCases: [created, ...(prevSuite.testCases || [])],
          };
        }
      }
      return prevSuite;
    });

    if (selectedProject) {
      await loadProjectData(selectedProject.id);
    }
    handleSelectCase(created);
  };

  const handleSaveCase = async (updatedCase: Partial<TestCase>) => {
    if (!updatedCase.id) return;
    const res = await TestCasesService.update(updatedCase.id, updatedCase);
    const mergedResults =
      res.results && res.results.length > 0
        ? res.results
        : selectedCase?.id === res.id
        ? selectedCase.results
        : [];

    const fullUpdatedCase: TestCase = {
      ...res,
      results: mergedResults,
    };

    setSelectedCase(fullUpdatedCase);

    if (fullUpdatedCase.suiteId) {
      setRootCases((prevRoots) => prevRoots.filter((tc) => tc.id !== fullUpdatedCase.id));
      setTree((prevTree) => {
        const removedTree = removeCaseFromTreeNodes(prevTree, fullUpdatedCase.id);
        return addCaseToTreeNodes(removedTree, fullUpdatedCase);
      });
    } else {
      setTree((prevTree) => removeCaseFromTreeNodes(prevTree, fullUpdatedCase.id));
      setRootCases((prevRoots) => {
        const exists = prevRoots.some((tc) => tc.id === fullUpdatedCase.id);
        return exists
          ? prevRoots.map((tc) => (tc.id === fullUpdatedCase.id ? fullUpdatedCase : tc))
          : [fullUpdatedCase, ...prevRoots];
      });
    }

    if (selectedProject) {
      await loadProjectData(selectedProject.id);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    await TestCasesService.delete(caseId);
    if (selectedCase?.id === caseId) {
      setSelectedCase(null);
      saveSessionState({ caseId: null });
    }
    setTree((prevTree) => removeCaseFromTreeNodes(prevTree, caseId));
    setRootCases((prevRoots) => prevRoots.filter((tc) => tc.id !== caseId));

    if (selectedProject) {
      await loadProjectData(selectedProject.id);
    }
  };

  const handleRunCase = (tc: TestCase, version?: string, environment?: string) => {
    setActiveQuickRunCase(tc);
    if (version) setActiveQuickRunVersion(version);
    if (environment) setActiveQuickRunEnvironment(environment);
    setIsQuickRunOpen(true);
  };

  const handleRunSuite = (suiteNode: SuiteTreeNode) => {
    const getCases = (node: SuiteTreeNode): TestCase[] => {
      let cases = node.testCases ? [...node.testCases] : [];
      if (node.children) {
        node.children.forEach((c) => {
          cases = cases.concat(getCases(c));
        });
      }
      return cases;
    };
    const suiteCases = getCases(suiteNode);
    if (suiteCases.length > 0) {
      setActiveSuiteRunCases(suiteCases);
      setActiveRunTestPlan(null);
      setIsManualRunOpen(true);
    }
  };

  const handleStartRunWithPlan = (plan: TestPlan) => {
    setActiveRunTestPlan(plan);
    setActiveSuiteRunCases(null);
    setIsManualRunOpen(true);
  };

  const handleCreateTestPlan = async (data: CreateTestPlanDto & { caseIds?: string[] }) => {
    const created = await TestPlansService.create(data);
    if (created?.id) {
      try {
        localStorage.setItem(`tcms_plan_cases_${created.id}`, JSON.stringify(data.caseIds || []));
      } catch {
        // Ignore
      }
    }
    if (selectedProject?.id) {
      const plans = await TestPlansService.getAllByProject(selectedProject.id);
      setTestPlans(plans || []);
    }
    setIsNewTestPlanOpen(false);
  };

  const handleQuickRunSuccess = async () => {
    if (selectedProject) {
      await loadProjectData(selectedProject.id);
    }
    const targetCaseId = activeQuickRunCase?.id || selectedCase?.id;
    if (targetCaseId) {
      try {
        const updatedCase = await TestCasesService.getOne(targetCaseId);
        if (selectedCase && selectedCase.id === targetCaseId) {
          setSelectedCase(updatedCase);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Auth Loading Splash
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#b83a4b]/20 border-t-[#b83a4b] rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // If not logged in, render Login screen
  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header: Clean Brand, Breadcrumbs Hierarchy, Compact Search, Project Selector, Theme Toggle, Single Letter Avatar */}
      <Header
        projects={projects}
        selectedProject={selectedProject}
        testCases={allCases}
        testPlans={testPlans}
        testRuns={testRuns}
        defects={defects}
        activeTab={activeTab}
        selectedSuite={selectedSuite}
        selectedCase={selectedCase}
        selectedPlan={selectedPlan}
        selectedRun={selectedRun}
        onSelectProject={(p) => handleSelectProject(p)}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onEditProject={(p) => {
          setActiveEditProject(p);
          setIsEditProjectOpen(true);
        }}
        onDeleteProject={handleDeleteProject}
        onNavigateHome={() => handleTabChange('DASHBOARD')}
        onSelectCase={(tc) => handleSelectCase(tc)}
        onSelectPlan={(plan) => handleSelectPlan(plan)}
        onSelectRun={(run) => handleSelectRun(run)}
        onSelectDefect={(defect) => handleSelectDefect(defect)}
        onTabChange={handleTabChange}
      />

      {/* Main Workspace Layout with Persistent AppSidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Persistent & Collapsible Sidebar with Admin Settings */}
        <AppSidebar
          projects={projects}
          selectedProject={selectedProject}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          testCasesCount={allCases.length}
          testPlansCount={testPlans.length}
          testRunsCount={testRunsCount}
          defectsCount={defectsCount}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
        />

        {/* Right Main Content Display Area */}
        <div className="flex-1 flex overflow-hidden min-w-0">
          {activeTab === 'DASHBOARD' && (
            <DashboardView
              project={selectedProject}
              projects={projects}
              testCases={allCases}
              suites={tree}
              testPlans={testPlans}
              testRuns={testRuns}
              testPlansCount={testPlans.length}
              onOpenManualRun={() => {
                setActiveRunTestPlan(null);
                setActiveSuiteRunCases(null);
                setIsManualRunOpen(true);
              }}
              onOpenNewPlan={() => {
                setIsNewTestPlanOpen(true);
              }}
              onOpenNewCase={() => {
                setActiveParentSuiteId(selectedSuite?.id || null);
                setIsNewCaseOpen(true);
              }}
              onSelectCase={(tc) => handleSelectCase(tc)}
              onSelectPlan={(plan) => handleSelectPlan(plan)}
              onSelectRun={(run) => {
                if (run) {
                  handleSelectRun(run);
                } else {
                  handleTabChange('RUNS');
                }
              }}
              onNavigateToPlans={() => handleTabChange('PLANS')}
              onNavigateToExplorer={() => handleTabChange('EXPLORER')}
              onNavigateToRuns={() => handleTabChange('RUNS')}
              onNavigateToReports={() => handleTabChange('REPORTS')}
            />
          )}

          {activeTab === 'PLANS' && (
            selectedPlan ? (
              <TestPlanDetailView
                plan={selectedPlan}
                project={selectedProject}
                projects={projects}
                allCases={allCases}
                tree={tree}
                onBack={() => {
                  setSelectedPlan(null);
                  saveSessionState({ planId: null });
                  pushState({
                    tab: 'PLANS',
                    projectId: selectedProject?.id || null,
                    suiteId: null,
                    caseId: null,
                    runId: null,
                    planId: null,
                    label: 'Test Planları',
                  });
                }}
                onStartRunWithPlan={(p, cases) => {
                  setActiveRunTestPlan(p);
                  if (cases && cases.length > 0) {
                    setActiveSuiteRunCases(cases);
                  }
                  setIsManualRunOpen(true);
                }}
                onSelectCase={(tc) => handleSelectCase(tc)}
                onUpdatePlanSuccess={(updated) => {
                  setSelectedPlan(updated);
                  setTestPlans((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                }}
                onDeletePlanSuccess={(deletedId) => {
                  setSelectedPlan(null);
                  setTestPlans((prev) => prev.filter((item) => item.id !== deletedId));
                }}
              />
            ) : (
              <TestPlansView
                project={selectedProject}
                projects={projects}
                allCases={allCases}
                testPlans={testPlans}
                onStartRunWithPlan={(plan: TestPlan) => {
                  setActiveRunTestPlan(plan);
                  setIsManualRunOpen(true);
                }}
                onSelectPlanToView={(p: TestPlan) => handleSelectPlan(p)}
                onNavigateToRuns={() => handleTabChange('RUNS')}
                onOpenNewPlan={() => setIsNewTestPlanOpen(true)}
                onPlansChange={async () => {
                  if (selectedProject) {
                    await loadProjectData(selectedProject.id);
                  }
                }}
              />
            )
          )}

          {activeTab === 'EXPLORER' && (
            selectedCase ? (
              <TestCaseEditor
                testCase={selectedCase}
                onSave={handleSaveCase}
                onDelete={handleDeleteCase}
                onQuickRun={(tc) => {
                  setActiveQuickRunCase(tc);
                  setIsQuickRunOpen(true);
                }}
                onClose={handleCloseCase}
                onBack={goBack}
              />
            ) : (
              <TestScenariosView
                project={selectedProject}
                projects={projects}
                testCases={allCases}
                testPlans={testPlans}
                onSelectCase={(tc: TestCase) => handleSelectCase(tc)}
                onOpenNewCase={() => {
                  setActiveParentSuiteId(selectedSuite?.id || null);
                  setIsNewCaseOpen(true);
                }}
                onOpenQuickRun={(tc: TestCase) => {
                  setActiveQuickRunCase(tc);
                  setIsQuickRunOpen(true);
                }}
                onRunSingleCase={(tc: TestCase) => handleRunCase(tc)}
                onRunMultipleCases={(cases: TestCase[]) => {
                  setActiveSuiteRunCases(cases);
                  setIsManualRunOpen(true);
                }}
                onDeleteCase={handleDeleteCase}
                onCasesChange={async () => {
                  if (selectedProject) {
                    await loadProjectData(selectedProject.id);
                  }
                }}
              />
            )
          )}

          {activeTab === 'RUNS' && (
            selectedRun ? (
              <TestRunDetailView
                run={selectedRun}
                project={selectedProject}
                projects={projects}
                allCases={allCases}
                tree={tree}
                testPlans={testPlans}
                onBack={() => {
                  setSelectedRun(null);
                  saveSessionState({ runId: null });
                  pushState({
                    tab: 'RUNS',
                    projectId: selectedProject?.id || null,
                    suiteId: null,
                    caseId: null,
                    runId: null,
                    planId: null,
                    label: 'Test Koşumları',
                  });
                }}
                onSelectCase={(tc) => handleSelectCase(tc)}
                onSelectPlan={(plan) => handleSelectPlan(plan)}
                onUpdateRunSuccess={(updated) => {
                  setSelectedRun(updated);
                  setTestRuns((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                }}
                onDeleteRunSuccess={(deletedId) => {
                  setSelectedRun(null);
                  setTestRuns((prev) => prev.filter((item) => item.id !== deletedId));
                  saveSessionState({ runId: null });
                }}
              />
            ) : (
              <TestRunsView
                projectId={selectedProject?.id || ''}
                testPlans={testPlans}
                allCases={allCases}
                onOpenManualRun={(plan) => {
                  setActiveRunTestPlan(plan || null);
                  setActiveSuiteRunCases(null);
                  setIsManualRunOpen(true);
                }}
                onOpenQuickRun={(tc) => {
                  if (tc) {
                    setActiveQuickRunCase(tc);
                    setIsQuickRunOpen(true);
                  }
                }}
                onSelectCase={(tc) => handleSelectCase(tc)}
                onSelectPlan={(plan) => handleSelectPlan(plan)}
                onSelectRun={(run) => {
                  handleSelectRun(run);
                }}
              />
            )
          )}

          {activeTab === 'DEFECTS' && (
            <DefectsView
              selectedProject={selectedProject}
              allCases={allCases}
              initialSelectedDefect={selectedDefectForModal}
              onClearInitialDefect={handleClearInitialDefect}
              onDefectsLoaded={handleDefectsLoaded}
              onDefectsCountChange={handleDefectsCountChange}
              onNavigateToCase={(caseId) => {
                const target = allCases.find((c) => c.id === caseId);
                if (target) {
                  handleSelectCase(target);
                }
              }}
              onNavigateToRun={(runId) => {
                const targetRun = testRuns.find((r) => r.id === runId);
                if (targetRun) {
                  handleSelectRun(targetRun);
                }
              }}
            />
          )}

          {activeTab === 'REPORTS' && (
            <ReportsView
              project={selectedProject}
              onOpenManualRun={() => {
                setActiveRunTestPlan(null);
                setActiveSuiteRunCases(null);
                setIsManualRunOpen(true);
              }}
              onSelectCase={(tcId) => {
                const target = allCases.find((c) => c.id === tcId);
                if (target) {
                  handleSelectCase(target);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSubmit={handleCreateProject}
      />

      <EditProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => {
          setIsEditProjectOpen(false);
          setActiveEditProject(null);
        }}
        project={activeEditProject}
        onUpdate={handleUpdateProject}
        onDelete={handleDeleteProject}
      />

      <NewCaseModal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        projectId={selectedProject?.id}
        projectName={selectedProject?.name}
        defaultSuiteId={activeParentSuiteId}
        suites={tree}
        onSubmit={handleCreateCase}
        onRefreshSuites={() => {
          if (selectedProject) {
            loadProjectData(selectedProject.id);
          }
        }}
      />

      <NewTestPlanModal
        isOpen={isNewTestPlanOpen}
        onClose={() => setIsNewTestPlanOpen(false)}
        projectId={selectedProject?.id}
        projectName={selectedProject?.name}
        projectKey={selectedProject?.key}
        allCases={allCases}
        onSubmit={handleCreateTestPlan}
      />

      <QuickRunModal
        isOpen={isQuickRunOpen}
        onClose={() => {
          setIsQuickRunOpen(false);
          setActiveQuickRunCase(null);
        }}
        projectId={selectedProject?.id || ''}
        testCase={activeQuickRunCase}
        initialVersion={activeQuickRunVersion}
        initialEnvironment={activeQuickRunEnvironment}
        onSuccess={handleQuickRunSuccess}
      />

      <ManualRunModal
        isOpen={isManualRunOpen}
        onClose={async () => {
          setIsManualRunOpen(false);
          setActiveSuiteRunCases(null);
          setActiveRunTestPlan(null);
          if (selectedProject) await loadProjectData(selectedProject.id);
          if (selectedCase) {
            try {
              const updatedCase = await TestCasesService.getOne(selectedCase.id);
              setSelectedCase(updatedCase);
            } catch (err) {
              console.error(err);
            }
          }
        }}
        projectId={selectedProject?.id || ''}
        testCases={activeSuiteRunCases || allCases}
        initialTestPlan={activeRunTestPlan}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
      />
    </div>
  );
}
