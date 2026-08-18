'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Project,
  SuiteTreeNode,
  TestCase,
  ProjectsService,
  SuitesService,
  TestCasesService,
} from '@/services/api';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { TestCaseEditor } from '@/components/TestCaseEditor';
import { SuiteCasesView } from '@/components/SuiteCasesView';
import { TestRunsView } from '@/components/TestRunsView';
import { DashboardView } from '@/components/DashboardView';
import { ManualRunModal } from '@/components/ManualRunModal';
import { NewProjectModal } from '@/components/NewProjectModal';
import { EditProjectModal } from '@/components/EditProjectModal';
import { NewSuiteModal } from '@/components/NewSuiteModal';
import { EditSuiteModal } from '@/components/EditSuiteModal';
import { NewCaseModal } from '@/components/NewCaseModal';
import { QuickRunModal } from '@/components/QuickRunModal';
import { useNavigation, NavigationState } from '@/context/NavigationContext';

export default function Home() {
  const { pushState, registerNavigationHandler, goBack } = useNavigation();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tree, setTree] = useState<SuiteTreeNode[]>([]);
  const [rootCases, setRootCases] = useState<TestCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<SuiteTreeNode | null>(null);
  const [activeTab, setActiveTab] = useState<'EXPLORER' | 'DASHBOARD' | 'RUNS'>('DASHBOARD');
  const [isLoadingTree, setIsLoadingTree] = useState(false);

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

  // Modals state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [activeEditProject, setActiveEditProject] = useState<Project | null>(null);
  const [isNewSuiteOpen, setIsNewSuiteOpen] = useState(false);
  const [isEditSuiteOpen, setIsEditSuiteOpen] = useState(false);
  const [activeEditSuite, setActiveEditSuite] = useState<SuiteTreeNode | null>(null);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isManualRunOpen, setIsManualRunOpen] = useState(false);
  const [isQuickRunOpen, setIsQuickRunOpen] = useState(false);
  const [activeQuickRunCase, setActiveQuickRunCase] = useState<TestCase | null>(null);
  const [activeSuiteRunCases, setActiveSuiteRunCases] = useState<TestCase[] | null>(null);
  const [activeParentSuiteId, setActiveParentSuiteId] = useState<string | null>(null);

  // Load Tree when selected project changes
  const loadTree = useCallback(async (projectId: string) => {
    setIsLoadingTree(true);
    try {
      const res = await ProjectsService.getTree(projectId);
      const newTree = res.tree || res.children || [];
      const newRootCases = res.rootTestCases || [];
      setTree(newTree);
      setRootCases(newRootCases);
      return { tree: newTree, rootCases: newRootCases };
    } catch (err) {
      console.error('Failed to load project tree:', err);
      setTree([]);
      setRootCases([]);
      return { tree: [], rootCases: [] };
    } finally {
      setIsLoadingTree(false);
    }
  }, []);

  // Handle Tab Change with Navigation Push
  const handleTabChange = useCallback(
    (tab: 'EXPLORER' | 'DASHBOARD' | 'RUNS', shouldPushState = true) => {
      setActiveTab(tab);
      localStorage.setItem('tcms_active_tab', tab);

      if (shouldPushState) {
        let label = 'Dashboard';
        if (tab === 'RUNS') label = 'Test Koşuları';
        else if (tab === 'EXPLORER') {
          if (selectedCase) label = `Case: ${selectedCase.code}`;
          else if (selectedSuite) label = `Suite: ${selectedSuite.name}`;
          else label = 'Test Explorer';
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
    (p: Project, shouldPushState = true) => {
      setSelectedCase(null);
      setSelectedSuite(null);
      setSelectedProject(p);
      loadTree(p.id);

      if (shouldPushState) {
        pushState({
          tab: activeTab,
          projectId: p.id,
          suiteId: null,
          caseId: null,
          label: `Plan: [${p.key}] ${p.name}`,
        });
      }
    },
    [activeTab, loadTree, pushState]
  );

  // Handle Suite Selection with Navigation Push
  const handleSelectSuite = useCallback(
    (suite: SuiteTreeNode, shouldPushState = true) => {
      setSelectedCase(null);
      setSelectedSuite(suite);
      setActiveTab('EXPLORER');
      localStorage.setItem('tcms_active_tab', 'EXPLORER');

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
      localStorage.setItem('tcms_active_tab', 'EXPLORER');

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
    pushState({
      tab: activeTab,
      projectId: selectedProject?.id || null,
      suiteId: null,
      caseId: null,
      label: activeTab === 'DASHBOARD' ? 'Dashboard' : 'Test Explorer',
    });
  }, [activeTab, pushState, selectedProject]);

  // Handle closing suite view
  const handleCloseSuite = useCallback(() => {
    setSelectedSuite(null);
    pushState({
      tab: activeTab,
      projectId: selectedProject?.id || null,
      suiteId: null,
      caseId: null,
      label: activeTab === 'DASHBOARD' ? 'Dashboard' : 'Test Explorer',
    });
  }, [activeTab, pushState, selectedProject]);

  // Register Navigation History Handler for Back / Forward operations
  useEffect(() => {
    const unregister = registerNavigationHandler(async (targetState: NavigationState) => {
      setActiveTab(targetState.tab);
      localStorage.setItem('tcms_active_tab', targetState.tab);

      let targetTree = treeRef.current;

      // Handle Project switch if needed
      const curProj = selectedProjectRef.current;
      if (targetState.projectId && (!curProj || curProj.id !== targetState.projectId)) {
        const foundProj = projectsRef.current.find((p) => p.id === targetState.projectId);
        if (foundProj) {
          setSelectedProject(foundProj);
          const loaded = await loadTree(foundProj.id);
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
        const suite = findSuiteInTree(targetTree, targetState.suiteId);
        if (suite) {
          setSelectedSuite(suite);
        } else {
          setSelectedSuite(null);
        }
      } else {
        setSelectedCase(null);
        setSelectedSuite(null);
      }
    });

    return () => unregister();
  }, [registerNavigationHandler, loadTree]);

  // Load projects on mount
  const loadProjects = useCallback(async () => {
    try {
      const data = await ProjectsService.getAll();
      const sorted = [...data].sort((a, b) =>
        a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
      );
      setProjects(sorted);

      if (sorted.length > 0) {
        const initialProj = sorted[0];
        setSelectedProject(initialProj);
        loadTree(initialProj.id);

        const savedTab = (localStorage.getItem('tcms_active_tab') as 'EXPLORER' | 'DASHBOARD' | 'RUNS' | null) || 'DASHBOARD';
        setActiveTab(savedTab);

        pushState({
          tab: savedTab,
          projectId: initialProj.id,
          suiteId: null,
          caseId: null,
          label: savedTab === 'DASHBOARD' ? 'Dashboard' : savedTab === 'RUNS' ? 'Test Koşuları' : 'Test Explorer',
        });
      } else {
        setSelectedProject(null);
        setIsNewProjectOpen(true);
      }
    } catch (err) {
      console.error('Failed to load test plans:', err);
    }
  }, [loadTree, pushState]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Handlers for Project actions
  const handleCreateProject = async (data: { name: string; key: string; description?: string; jiraProjectKey?: string }) => {
    const newProj = await ProjectsService.create(data);
    await loadProjects();
    setSelectedCase(null);
    setSelectedSuite(null);
    setSelectedProject(newProj);
  };

  const handleUpdateProject = async (id: string, data: { name?: string; key?: string; description?: string; jiraProjectKey?: string }) => {
    const updated = await ProjectsService.update(id, data);
    await loadProjects();
    setSelectedProject((prev) => (prev?.id === id ? { ...prev, ...updated } : prev));
    if (selectedProject?.id === id) {
      await loadTree(id);
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
      setSelectedProject(next);
      if (next) {
        await loadTree(next.id);
      } else {
        setTree([]);
        setRootCases([]);
        setIsNewProjectOpen(true);
      }
    }
  };

  // Handlers for Suite actions
  const handleCreateSuite = async (data: { name: string; projectId: string; parentId?: string }) => {
    await SuitesService.create(data);
    if (selectedProject) await loadTree(selectedProject.id);
  };

  const handleUpdateSuite = async (suiteId: string, data: { name?: string; parentId?: string | null }) => {
    await SuitesService.update(suiteId, {
      name: data.name,
      parentId: data.parentId !== undefined ? (data.parentId || undefined) : undefined,
    });
    if (selectedProject) await loadTree(selectedProject.id);
  };

  const handleDeleteSuite = async (suiteId: string) => {
    await SuitesService.delete(suiteId);
    if (selectedProject) await loadTree(selectedProject.id);
  };

  const handleReorderSuite = async (suiteId: string, targetParentId: string | null, newOrder: number) => {
    await SuitesService.reorder(suiteId, { parentId: targetParentId, orderIndex: newOrder });
    if (selectedProject) await loadTree(selectedProject.id);
  };

  // Handlers for TestCase actions
  const handleCreateCase = async (data: Partial<TestCase>) => {
    const created = await TestCasesService.create(data);
    if (selectedProject) await loadTree(selectedProject.id);
    handleSelectCase(created);
  };

  const handleSaveCase = async (updatedCase: Partial<TestCase>) => {
    if (!updatedCase.id) return;
    const res = await TestCasesService.update(updatedCase.id, updatedCase);
    setSelectedCase(res);
    if (selectedProject) await loadTree(selectedProject.id);
  };

  const handleDeleteCase = async (caseId: string) => {
    await TestCasesService.delete(caseId);
    setSelectedCase(null);
    if (selectedProject) await loadTree(selectedProject.id);
  };

  const handleRunCase = (tc: TestCase) => {
    setActiveQuickRunCase(tc);
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
      setIsManualRunOpen(true);
    }
  };

  const handleQuickRunSuccess = async () => {
    if (selectedProject) {
      await loadTree(selectedProject.id);
    }
    if (selectedCase && activeQuickRunCase && selectedCase.id === activeQuickRunCase.id) {
      try {
        const updatedCase = await TestCasesService.getOne(selectedCase.id);
        setSelectedCase(updatedCase);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <Header
        projects={projects}
        selectedProject={selectedProject}
        activeView={activeTab}
        onTabChange={(tab) => handleTabChange(tab)}
        onSelectProject={(p) => handleSelectProject(p)}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onOpenNewSuite={() => {
          setActiveParentSuiteId(null);
          setIsNewSuiteOpen(true);
        }}
        onOpenNewCase={() => {
          setActiveParentSuiteId(selectedSuite?.id || null);
          setIsNewCaseOpen(true);
        }}
        onOpenManualRun={() => {
          setActiveSuiteRunCases(null);
          setIsManualRunOpen(true);
        }}
      />

      {/* Main Workspace Layout with Persistent AppSidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Persistent & Collapsible Sidebar */}
        <AppSidebar
          projects={projects}
          selectedProject={selectedProject}
          tree={tree}
          rootTestCases={rootCases}
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
          {activeTab === 'EXPLORER' && (
            selectedCase ? (
              <TestCaseEditor
                testCase={selectedCase}
                onSave={handleSaveCase}
                onDelete={handleDeleteCase}
                onRun={handleRunCase}
                onClose={handleCloseCase}
                onBack={goBack}
              />
            ) : selectedSuite ? (
              <SuiteCasesView
                suite={selectedSuite}
                allSuites={tree}
                onSelectCase={(tc) => handleSelectCase(tc)}
                onSelectSuite={(s) => handleSelectSuite(s)}
                onAddSubSuite={(parentSuiteId) => {
                  setActiveParentSuiteId(parentSuiteId);
                  setIsNewSuiteOpen(true);
                }}
                onAddCaseInSuite={(suiteId) => {
                  setActiveParentSuiteId(suiteId);
                  setIsNewCaseOpen(true);
                }}
                onRunCase={handleRunCase}
                onRunSuite={handleRunSuite}
                onClose={handleCloseSuite}
                onBack={goBack}
              />
            ) : (
              <TestCaseEditor
                testCase={null}
                onSave={handleSaveCase}
                onDelete={handleDeleteCase}
                onRun={handleRunCase}
              />
            )
          )}

          {activeTab === 'DASHBOARD' && (
            <DashboardView
              project={selectedProject}
              testCases={allCases}
              suites={tree}
              onOpenManualRun={() => {
                setActiveSuiteRunCases(null);
                setIsManualRunOpen(true);
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
            />
          )}

          {activeTab === 'RUNS' && (
            <TestRunsView
              projectId={selectedProject?.id || ''}
              onOpenManualRun={() => {
                setActiveSuiteRunCases(null);
                setIsManualRunOpen(true);
              }}
              onSelectCase={(tc) => handleSelectCase(tc)}
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

      <QuickRunModal
        isOpen={isQuickRunOpen}
        onClose={() => {
          setIsQuickRunOpen(false);
          setActiveQuickRunCase(null);
        }}
        projectId={selectedProject?.id || ''}
        testCase={activeQuickRunCase}
        onSuccess={handleQuickRunSuccess}
      />

      <ManualRunModal
        isOpen={isManualRunOpen}
        onClose={() => {
          setIsManualRunOpen(false);
          setActiveSuiteRunCases(null);
          if (selectedProject) loadTree(selectedProject.id);
        }}
        projectId={selectedProject?.id || ''}
        testCases={activeSuiteRunCases || allCases}
      />
    </div>
  );
}
