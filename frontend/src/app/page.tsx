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
import { TestCaseEditor } from '@/components/TestCaseEditor';
import { TraceabilityView } from '@/components/TraceabilityView';
import { DashboardView } from '@/components/DashboardView';
import { ManualRunModal } from '@/components/ManualRunModal';
import { NewProjectModal } from '@/components/NewProjectModal';
import { NewSuiteModal } from '@/components/NewSuiteModal';
import { EditSuiteModal } from '@/components/EditSuiteModal';
import { NewCaseModal } from '@/components/NewCaseModal';
import { QuickRunModal } from '@/components/QuickRunModal';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tree, setTree] = useState<SuiteTreeNode[]>([]);
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);
  const [activeTab, setActiveTab] = useState<'EXPLORER' | 'DASHBOARD' | 'TRACEABILITY'>('EXPLORER');
  const [isLoadingTree, setIsLoadingTree] = useState(false);

  // Modals state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewSuiteOpen, setIsNewSuiteOpen] = useState(false);
  const [isEditSuiteOpen, setIsEditSuiteOpen] = useState(false);
  const [activeEditSuite, setActiveEditSuite] = useState<SuiteTreeNode | null>(null);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isManualRunOpen, setIsManualRunOpen] = useState(false);
  const [isQuickRunOpen, setIsQuickRunOpen] = useState(false);
  const [activeQuickRunCase, setActiveQuickRunCase] = useState<TestCase | null>(null);
  const [activeParentSuiteId, setActiveParentSuiteId] = useState<string | null>(null);

  // Load projects list on mount
  const loadProjects = useCallback(async () => {
    try {
      const data = await ProjectsService.getAll();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, [selectedProject]);

  useEffect(() => {
    loadProjects();
  }, []);

  // Load Tree when selected project changes
  const loadTree = useCallback(async (projectId: string) => {
    setIsLoadingTree(true);
    try {
      const res = await ProjectsService.getTree(projectId);
      setTree(res.tree || res.children || []);
    } catch (err) {
      console.error('Failed to load project tree:', err);
      setTree([]);
    } finally {
      setIsLoadingTree(false);
    }
  }, []);

  useEffect(() => {
    setSelectedCase(null);
    if (selectedProject) {
      loadTree(selectedProject.id);
    }
  }, [selectedProject, loadTree]);

  // Flatten all cases in the current tree
  const getAllCasesInTree = (nodes: SuiteTreeNode[]): TestCase[] => {
    let cases: TestCase[] = [];
    nodes.forEach((node) => {
      if (node.testCases) cases = cases.concat(node.testCases);
      if (node.children) cases = cases.concat(getAllCasesInTree(node.children));
    });
    return cases;
  };

  const allCases = getAllCasesInTree(tree);

  // Handlers for Project actions
  const handleCreateProject = async (data: { name: string; key: string; description?: string; jiraProjectKey?: string }) => {
    const newProj = await ProjectsService.create(data);
    await loadProjects();
    setSelectedCase(null);
    setSelectedProject(newProj);
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
        onTabChange={(tab) => setActiveTab(tab)}
        onSelectProject={(p) => {
          setSelectedCase(null);
          setSelectedProject(p);
        }}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onOpenNewSuite={() => {
          setActiveParentSuiteId(null);
          setIsNewSuiteOpen(true);
        }}
        onOpenNewCase={() => {
          setActiveParentSuiteId(null);
          setIsNewCaseOpen(true);
        }}
        onOpenManualRun={() => setIsManualRunOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'EXPLORER' && (
          <>
            {/* Left Panel: Explorer Tree */}
            <ExplorerTree
              tree={tree}
              selectedCaseId={selectedCase?.id || null}
              onSelectCase={(tc) => setSelectedCase(tc)}
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
              onRunCase={handleRunCase}
              onReorderSuite={handleReorderSuite}
            />

            {/* Middle Panel: TestCase Editor */}
            <TestCaseEditor
              testCase={selectedCase}
              onSave={handleSaveCase}
              onDelete={handleDeleteCase}
              onRun={handleRunCase}
              onClose={() => setSelectedCase(null)}
            />
          </>
        )}

        {activeTab === 'DASHBOARD' && (
          <DashboardView
            project={selectedProject}
            testCases={allCases}
            onOpenManualRun={() => setIsManualRunOpen(true)}
            onOpenNewCase={() => {
              setActiveParentSuiteId(null);
              setIsNewCaseOpen(true);
            }}
            onSelectCase={(tc) => {
              setSelectedCase(tc);
              setActiveTab('EXPLORER');
            }}
          />
        )}

        {activeTab === 'TRACEABILITY' && (
          <TraceabilityView
            testCases={allCases}
            onSelectTestCase={(tc) => {
              setSelectedCase(tc);
              setActiveTab('EXPLORER');
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
          if (selectedProject) loadTree(selectedProject.id);
        }}
        projectId={selectedProject?.id || ''}
        testCases={allCases}
      />
    </div>
  );
}


