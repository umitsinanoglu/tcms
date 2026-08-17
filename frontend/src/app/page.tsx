'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Project,
  SuiteTreeNode,
  TestCase,
  ProjectsService,
  SuitesService,
  TestCasesService,
} from '@/services/api';
import { Header } from '@/components/Header';
import { ExplorerTree } from '@/components/ExplorerTree';
import { ProjectsSidebar } from '@/components/ProjectsSidebar';
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
import { ReportsView } from '@/components/ReportsView';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tree, setTree] = useState<SuiteTreeNode[]>([]);
  const [rootCases, setRootCases] = useState<TestCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<SuiteTreeNode | null>(null);
  const [activeTab, setActiveTab] = useState<'EXPLORER' | 'DASHBOARD' | 'RUNS' | 'REPORTS'>('DASHBOARD');
  const [isLoadingTree, setIsLoadingTree] = useState(false);

  // Tab persistence handling: default to DASHBOARD, restore from localStorage on refresh
  useEffect(() => {
    const savedTab = localStorage.getItem('tcms_active_tab') as 'EXPLORER' | 'DASHBOARD' | 'RUNS' | 'REPORTS' | null;
    if (savedTab && ['EXPLORER', 'DASHBOARD', 'RUNS', 'REPORTS'].includes(savedTab)) {
      setActiveTab(savedTab);
    } else {
      setActiveTab('DASHBOARD');
    }
  }, []);

  const handleTabChange = useCallback((tab: 'EXPLORER' | 'DASHBOARD' | 'RUNS' | 'REPORTS') => {
    setActiveTab(tab);
    localStorage.setItem('tcms_active_tab', tab);
  }, []);

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

  // Load projects (Test Plans) list on mount
  const loadProjects = useCallback(async () => {
    try {
      const data = await ProjectsService.getAll();
      // Sort test plans alphabetically by name
      const sorted = [...data].sort((a, b) =>
        a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
      );
      setProjects(sorted);

      if (sorted.length > 0) {
        setSelectedProject((prev) => {
          if (!prev) return sorted[0];
          const exists = sorted.find((p) => p.id === prev.id);
          return exists || sorted[0];
        });
      } else {
        setSelectedProject(null);
        setIsNewProjectOpen(true);
      }
    } catch (err) {
      console.error('Failed to load test plans:', err);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  // Load Tree when selected project changes
  const loadTree = useCallback(async (projectId: string) => {
    setIsLoadingTree(true);
    try {
      const res = await ProjectsService.getTree(projectId);
      setTree(res.tree || res.children || []);
      setRootCases(res.rootTestCases || []);
    } catch (err) {
      console.error('Failed to load project tree:', err);
      setTree([]);
      setRootCases([]);
    } finally {
      setIsLoadingTree(false);
    }
  }, []);

  useEffect(() => {
    setSelectedCase(null);
    setSelectedSuite(null);
    if (selectedProject) {
      loadTree(selectedProject.id);
    }
  }, [selectedProject, loadTree]);

  // Flatten all cases in the current tree plus root test cases
  const getAllCasesInTree = (nodes: SuiteTreeNode[]): TestCase[] => {
    let cases: TestCase[] = [];
    nodes.forEach((node) => {
      if (node.testCases) cases = cases.concat(node.testCases);
      if (node.children) cases = cases.concat(getAllCasesInTree(node.children));
    });
    return cases;
  };

  const allCases = [...rootCases, ...getAllCasesInTree(tree)];

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
    setSelectedCase(created);
    handleTabChange('EXPLORER');
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
        onSelectProject={(p) => {
          setSelectedCase(null);
          setSelectedSuite(null);
          setSelectedProject(p);
        }}
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

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'EXPLORER' && (
          <>
            {/* Left Panel: Explorer Tree */}
            <ExplorerTree
              tree={tree}
              rootTestCases={rootCases}
              selectedProject={selectedProject}
              selectedCaseId={selectedCase?.id || null}
              selectedSuiteId={selectedSuite?.id || null}
              onSelectCase={(tc) => {
                setSelectedSuite(null);
                setSelectedCase(tc);
              }}
              onSelectSuite={(suite) => {
                setSelectedCase(null);
                setSelectedSuite(suite);
              }}
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
              onEditProject={(p) => {
                setActiveEditProject(p);
                setIsEditProjectOpen(true);
              }}
              onRunCase={handleRunCase}
              onRunSuite={handleRunSuite}
              onReorderSuite={handleReorderSuite}
            />

            {/* Middle Panel: TestCase Editor OR Suite Cases Card View */}
            {selectedCase ? (
              <TestCaseEditor
                testCase={selectedCase}
                onSave={handleSaveCase}
                onDelete={handleDeleteCase}
                onRun={handleRunCase}
                onClose={() => setSelectedCase(null)}
              />
            ) : selectedSuite ? (
              <SuiteCasesView
                suite={selectedSuite}
                onSelectCase={(tc) => {
                  setSelectedSuite(null);
                  setSelectedCase(tc);
                }}
                onAddCaseInSuite={(suiteId) => {
                  setActiveParentSuiteId(suiteId);
                  setIsNewCaseOpen(true);
                }}
                onRunCase={handleRunCase}
                onRunSuite={handleRunSuite}
                onClose={() => setSelectedSuite(null)}
              />
            ) : (
              <TestCaseEditor
                testCase={null}
                onSave={handleSaveCase}
                onDelete={handleDeleteCase}
                onRun={handleRunCase}
              />
            )}
          </>
        )}

        {activeTab === 'DASHBOARD' && (
          <>
            {/* Left Panel: Projects Navigation Sidebar */}
            <ProjectsSidebar
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={(p) => {
                setSelectedCase(null);
                setSelectedSuite(null);
                setSelectedProject(p);
              }}
              onOpenNewProject={() => setIsNewProjectOpen(true)}
              onEditProject={(p) => {
                setActiveEditProject(p);
                setIsEditProjectOpen(true);
              }}
            />

            {/* Main Panel: Top Dashboard View */}
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
              onSelectCase={(tc) => {
                setSelectedCase(tc);
                setSelectedSuite(null);
                handleTabChange('EXPLORER');
              }}
              onNavigateToReports={() => handleTabChange('REPORTS')}
            />
          </>
        )}

        {activeTab === 'RUNS' && (
          <TestRunsView
            projectId={selectedProject?.id || ''}
            onOpenManualRun={() => {
              setActiveSuiteRunCases(null);
              setIsManualRunOpen(true);
            }}
            onSelectCase={(tc) => {
              setSelectedCase(tc);
              setSelectedSuite(null);
              handleTabChange('EXPLORER');
            }}
          />
        )}

        {activeTab === 'REPORTS' && (
          <ReportsView
            project={selectedProject}
            onOpenManualRun={() => {
              setActiveSuiteRunCases(null);
              setIsManualRunOpen(true);
            }}
            onSelectCase={(tcId) => {
              const target = allCases.find((c) => c.id === tcId);
              if (target) {
                setSelectedCase(target);
                setSelectedSuite(null);
                handleTabChange('EXPLORER');
              }
            }}
          />
        )}
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


