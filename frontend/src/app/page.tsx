'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Project,
  SuiteTreeNode,
  TestCase,
  TestPlan,
  TestRun,
  CreateTestPlanDto,
  ProjectsService,
  SuitesService,
  TestCasesService,
  TestPlansService,
  TestRunsService,
} from '@/services/api';
import { Header } from '@/components/Header';
import { AppSidebar, SidebarTab } from '@/components/AppSidebar';
import { TestCaseEditor } from '@/components/TestCaseEditor';
import { TestScenariosView } from '@/components/TestScenariosView';
import { TestPlansView } from '@/components/TestPlansView';
import { TestPlanDetailView } from '@/components/TestPlanDetailView';
import { TestRunsView } from '@/components/TestRunsView';
import { DashboardView } from '@/components/DashboardView';
import { ManualRunModal } from '@/components/ManualRunModal';
import { NewProjectModal } from '@/components/NewProjectModal';
import { EditProjectModal } from '@/components/EditProjectModal';
import { NewSuiteModal } from '@/components/NewSuiteModal';
import { EditSuiteModal } from '@/components/EditSuiteModal';
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
  const [testRunsCount, setTestRunsCount] = useState<number>(0);
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<SuiteTreeNode | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<TestPlan | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('DASHBOARD');
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  const projectsRef = useRef<Project[]>([]);
  projectsRef.current = projects;

  const selectedProjectRef = useRef<Project | null>(null);
  selectedProjectRef.current = selectedProject;

  const treeRef = useRef<SuiteTreeNode[]>([]);
  treeRef.current = tree;

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
  }

  const saveSessionState = (state: Partial<SavedSessionState>) => {
    try {
      const existingRaw = localStorage.getItem('tcms_session_state');
      const existing: SavedSessionState = existingRaw
        ? JSON.parse(existingRaw)
        : { projectId: null, tab: 'DASHBOARD', suiteId: null, caseId: null };

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
  const [isNewSuiteOpen, setIsNewSuiteOpen] = useState(false);
  const [isEditSuiteOpen, setIsEditSuiteOpen] = useState(false);
  const [activeEditSuite, setActiveEditSuite] = useState<SuiteTreeNode | null>(null);
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

  // Load Tree & Plans & Runs count when selected project changes
  const loadProjectData = useCallback(async (projectId: string) => {
    setIsLoadingTree(true);
    try {
      const [treeRes, plansRes, runsRes] = await Promise.all([
        ProjectsService.getTree(projectId).catch(() => ({ tree: [], rootTestCases: [] })),
        TestPlansService.getAllByProject(projectId).catch(() => []),
        TestRunsService.getRuns(projectId).catch(() => []),
      ]);

      const newTree = (treeRes && 'tree' in treeRes && treeRes.tree) || [];
      const newRootCases = (treeRes && 'rootTestCases' in treeRes && treeRes.rootTestCases) || [];
      setTree(newTree);
      setRootCases(newRootCases);
      setTestPlans(plansRes || []);
      setTestRuns(runsRes || []);
      setTestRunsCount(runsRes?.length || 0);

      return { tree: newTree, rootCases: newRootCases, plans: plansRes || [], runs: runsRes || [] };
    } catch (err) {
      console.error('Failed to load project data:', err);
      setTree([]);
      setRootCases([]);
      setTestPlans([]);
      setTestRuns([]);
      setTestRunsCount(0);
      return { tree: [], rootCases: [], plans: [], runs: [] };
    } finally {
      setIsLoadingTree(false);
    }
  }, []);

  // Handle Tab Change with Navigation Push
  const handleTabChange = useCallback(
    (tab: SidebarTab, shouldPushState = true) => {
      setActiveTab(tab);
      saveSessionState({
        tab,
        projectId: selectedProject?.id || null,
        suiteId: tab === 'EXPLORER' ? selectedSuite?.id || null : null,
        caseId: tab === 'EXPLORER' ? selectedCase?.id || null : null,
      });

      if (shouldPushState) {
        let label = 'Ana Sayfa';
        if (tab === 'PLANS') label = 'Test Planları';
        else if (tab === 'RUNS') label = 'Test Koşumları';
        else if (tab === 'REPORTS') label = 'Test Raporları';
        else if (tab === 'EXPLORER') {
          if (selectedCase) label = `Senaryo: ${selectedCase.code}`;
          else if (selectedSuite) label = `Suite: ${selectedSuite.name}`;
          else label = 'Test Senaryoları';
        }

        pushState({
          tab,
          projectId: selectedProject?.id || null,
          suiteId: selectedSuite?.id || null,
          caseId: selectedCase?.id || null,
          label,
        });
      }
    },
    [pushState, selectedProject, selectedSuite, selectedCase]
  );

  // Handle Project Selection with Navigation Push
  const handleSelectProject = useCallback(
    async (p: Project, shouldPushState = true) => {
      setSelectedCase(null);
      setSelectedSuite(null);
      setSelectedProject(p);
      setTree([]);
      setRootCases([]);
      setTestPlans([]);
      saveSessionState({
        projectId: p.id,
        tab: activeTab,
        suiteId: null,
        caseId: null,
      });

      const loaded = await loadProjectData(p.id);

      if (shouldPushState) {
        pushState({
          tab: activeTab,
          projectId: p.id,
          suiteId: null,
          caseId: null,
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
      setSelectedSuite(suite);
      setActiveTab('EXPLORER');
      saveSessionState({
        projectId: selectedProject?.id || null,
        tab: 'EXPLORER',
        suiteId: suite.id,
        caseId: null,
      });

      if (shouldPushState) {
        pushState({
          tab: 'EXPLORER',
          projectId: selectedProject?.id || null,
          suiteId: suite.id,
          caseId: null,
          label: `Suite: ${suite.name}`,
        });
      }
    },
    [pushState, selectedProject]
  );

  // Handle Test Case Selection with Navigation Push
  const handleSelectCase = useCallback(
    (tc: TestCase, shouldPushState = true) => {
      setSelectedSuite(null);
      setSelectedCase(tc);
      setActiveTab('EXPLORER');
      saveSessionState({
        projectId: selectedProject?.id || null,
        tab: 'EXPLORER',
        suiteId: null,
        caseId: tc.id,
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
          label: `Case: ${tc.code} (${tc.title.length > 25 ? tc.title.slice(0, 25) + '...' : tc.title})`,
        });
      }
    },
    [pushState, selectedProject]
  );

  // Handle closing case editor
  const handleCloseCase = useCallback(() => {
    setSelectedCase(null);
    saveSessionState({ caseId: null });
    pushState({
      tab: activeTab,
      projectId: selectedProject?.id || null,
      suiteId: null,
      caseId: null,
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

      // Handle Suite or Case restore
      if (targetState.caseId) {
        setSelectedSuite(null);
        try {
          const tc = await TestCasesService.getOne(targetState.caseId);
          setSelectedCase(tc);
        } catch {
          setSelectedCase(null);
        }
      } else if (targetState.suiteId) {
        setSelectedCase(null);
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
      }
    });

    return () => unregister();
  }, [registerNavigationHandler, loadProjectData]);

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

        const loaded = await loadProjectData(targetProj.id);
        const currentTree = loaded.tree;

        let targetCase: TestCase | null = null;
        let targetSuite: SuiteTreeNode | null = null;

        if (targetTab === 'EXPLORER') {
          if (savedState?.caseId) {
            try {
              const tc = await TestCasesService.getOne(savedState.caseId);
              if (tc) {
                targetCase = tc;
                setSelectedCase(tc);
              }
            } catch {
              targetCase = null;
            }
          } else if (savedState?.suiteId) {
            const suite = findSuiteInTree(currentTree, savedState.suiteId);
            if (suite) {
              targetSuite = suite;
              setSelectedSuite(suite);
            }
          }
        }

        saveSessionState({
          projectId: targetProj.id,
          tab: targetTab,
          suiteId: targetSuite?.id || null,
          caseId: targetCase?.id || null,
        });

        let label = 'Ana Sayfa';
        if (targetTab === 'PLANS') label = 'Test Planları';
        else if (targetTab === 'RUNS') label = 'Test Koşumları';
        else if (targetTab === 'REPORTS') label = 'Test Raporları';
        else if (targetTab === 'EXPLORER') {
          if (targetCase) label = `Senaryo: ${targetCase.code}`;
          else if (targetSuite) label = `Suite: ${targetSuite.name}`;
          else label = 'Test Senaryoları';
        }

        pushState({
          tab: targetTab,
          projectId: targetProj.id,
          suiteId: targetSuite?.id || null,
          caseId: targetCase?.id || null,
          label,
        });
      } else {
        setSelectedProject(null);
        setSelectedCase(null);
        setSelectedSuite(null);
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

  // Handlers for Suite actions
  const handleCreateSuite = async (data: { name: string; projectId: string; parentId?: string }) => {
    await SuitesService.create(data);
    if (selectedProject) await loadProjectData(selectedProject.id);
  };

  const handleUpdateSuite = async (suiteId: string, data: { name?: string; parentId?: string | null }) => {
    await SuitesService.update(suiteId, {
      name: data.name,
      parentId: data.parentId !== undefined ? (data.parentId || undefined) : undefined,
    });
    if (selectedProject) await loadProjectData(selectedProject.id);
  };

  const handleDeleteSuite = async (suiteId: string) => {
    await SuitesService.delete(suiteId);
    if (selectedSuite?.id === suiteId) {
      setSelectedSuite(null);
      saveSessionState({ suiteId: null });
    }
    if (selectedProject) await loadProjectData(selectedProject.id);
  };

  const handleReorderSuite = async (suiteId: string, targetParentId: string | null, newOrder: number) => {
    await SuitesService.reorder(suiteId, { parentId: targetParentId, orderIndex: newOrder });
    if (selectedProject) await loadProjectData(selectedProject.id);
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
  };

  const handleDeleteCase = async (caseId: string) => {
    await TestCasesService.delete(caseId);
    if (selectedCase?.id === caseId) {
      setSelectedCase(null);
      saveSessionState({ caseId: null });
    }
    setTree((prevTree) => removeCaseFromTreeNodes(prevTree, caseId));
    setRootCases((prevRoots) => prevRoots.filter((tc) => tc.id !== caseId));
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

  const handleCreateTestPlan = async (data: CreateTestPlanDto) => {
    await TestPlansService.create(data);
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
      {/* Top Header: Clean Brand, Project Selector, Doc Link, Theme Toggle, User Initial Avatar */}
      <Header
        projects={projects}
        selectedProject={selectedProject}
        testCases={allCases}
        testPlans={testPlans}
        onSelectProject={(p) => handleSelectProject(p)}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onEditProject={(p) => {
          setActiveEditProject(p);
          setIsEditProjectOpen(true);
        }}
        onDeleteProject={handleDeleteProject}
        onNavigateHome={() => handleTabChange('DASHBOARD')}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onSelectCase={(tc) => handleSelectCase(tc)}
        onSelectPlan={(plan) => {
          setSelectedPlan(plan);
          setActiveRunTestPlan(plan);
          handleTabChange('PLANS');
        }}
      />

      {/* Main Workspace Layout with Persistent AppSidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Persistent & Collapsible Sidebar */}
        <AppSidebar
          projects={projects}
          selectedProject={selectedProject}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tree={tree}
          rootTestCases={rootCases}
          testCasesCount={allCases.length}
          testPlansCount={testPlans.length}
          testRunsCount={testRunsCount}
          selectedCaseId={selectedCase?.id || null}
          selectedSuiteId={selectedSuite?.id || null}
          onSelectProject={(p) => handleSelectProject(p)}
          onOpenNewProject={() => setIsNewProjectOpen(true)}
          onEditProject={(p) => {
            setActiveEditProject(p);
            setIsEditProjectOpen(true);
          }}
          onDeleteProject={handleDeleteProject}
          onSelectCase={(tc) => handleSelectCase(tc)}
          onSelectSuite={(suite) => handleSelectSuite(suite)}
          onAddSubSuite={(parentSuiteId) => {
            setActiveParentSuiteId(parentSuiteId);
            setIsNewSuiteOpen(true);
          }}
          onEditSuite={(suiteNode) => {
            setActiveEditSuite(suiteNode);
            setIsEditSuiteOpen(true);
          }}
          onDeleteSuite={handleDeleteSuite}
          onAddCaseInSuite={(suiteId) => {
            setActiveParentSuiteId(suiteId);
            setIsNewCaseOpen(true);
          }}
          onOpenNewSuite={() => {
            setActiveParentSuiteId(null);
            setIsNewSuiteOpen(true);
          }}
          onOpenNewCase={() => {
            setActiveParentSuiteId(selectedSuite?.id || null);
            setIsNewCaseOpen(true);
          }}
          onRunCase={handleRunCase}
          onRunSuite={handleRunSuite}
          onReorderSuite={handleReorderSuite}
          isLoadingTree={isLoadingTree}
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
              onOpenNewSuite={() => {
                setActiveParentSuiteId(null);
                setIsNewSuiteOpen(true);
              }}
              onOpenNewCase={() => {
                setActiveParentSuiteId(selectedSuite?.id || null);
                setIsNewCaseOpen(true);
              }}
              onSelectCase={(tc) => handleSelectCase(tc)}
              onSelectSuite={(suite) => handleSelectSuite(suite)}
              onSelectPlan={(plan) => {
                setSelectedPlan(plan);
                setActiveRunTestPlan(plan);
                handleTabChange('PLANS');
              }}
              onSelectRun={() => {
                handleTabChange('RUNS');
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
                onBack={() => setSelectedPlan(null)}
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
                onStartRunWithPlan={handleStartRunWithPlan}
                onSelectPlanToView={(p) => setSelectedPlan(p)}
                onNavigateToRuns={() => handleTabChange('RUNS')}
                onOpenNewPlan={() => setIsNewTestPlanOpen(true)}
              />
            )
          )}

          {activeTab === 'EXPLORER' && (
            selectedCase ? (
              <TestCaseEditor
                testCase={selectedCase}
                onSave={handleSaveCase}
                onDelete={handleDeleteCase}
                onRun={handleRunCase}
                onClose={handleCloseCase}
                onBack={() => setSelectedCase(null)}
              />
            ) : (
              <TestScenariosView
                project={selectedProject}
                projects={projects}
                testCases={allCases}
                testPlans={testPlans}
                onSelectCase={(tc) => handleSelectCase(tc)}
                onOpenNewCase={() => setIsNewCaseOpen(true)}
                onRunSingleCase={(tc) => handleRunCase(tc)}
                onRunMultipleCases={(cases) => {
                  setActiveSuiteRunCases(cases);
                  setIsManualRunOpen(true);
                }}
                onDeleteCase={handleDeleteCase}
              />
            )
          )}

          {activeTab === 'RUNS' && (
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
              onSelectPlan={(plan) => {
                setSelectedPlan(plan);
                handleTabChange('PLANS');
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

      <NewSuiteModal
        isOpen={isNewSuiteOpen}
        onClose={() => setIsNewSuiteOpen(false)}
        projectId={selectedProject?.id || ''}
        projectName={selectedProject?.name}
        projectKey={selectedProject?.key}
        parentSuiteId={activeParentSuiteId}
        suites={tree}
        onSubmit={handleCreateSuite}
      />

      <EditSuiteModal
        isOpen={isEditSuiteOpen}
        onClose={() => {
          setIsEditSuiteOpen(false);
          setActiveEditSuite(null);
        }}
        suite={activeEditSuite}
        suites={tree}
        onUpdate={handleUpdateSuite}
        onDelete={handleDeleteSuite}
      />

      <NewCaseModal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        projectId={selectedProject?.id}
        projectName={selectedProject?.name}
        defaultSuiteId={activeParentSuiteId}
        suites={tree}
        onSubmit={handleCreateCase}
      />

      <NewTestPlanModal
        isOpen={isNewTestPlanOpen}
        onClose={() => setIsNewTestPlanOpen(false)}
        projectId={selectedProject?.id}
        projectName={selectedProject?.name}
        projectKey={selectedProject?.key}
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
