import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  jiraProjectKey?: string;
  createdAt: string;
  _count?: {
    suites: number;
    testRuns: number;
  };
}

export interface TestStep {
  id?: string;
  stepNumber: number;
  action: string;
  expectedResult: string;
}

export type ExecutionType = 'MANUAL' | 'AUTOMATION';
export type TestType = 'WEB' | 'IOS' | 'ANDROID' | 'API' | 'PERFORMANCE' | 'OTHER' | 'MANUAL' | 'MOBILE';
export type Priority = 'BLOCKER' | 'CRITICAL' | 'NORMAL' | 'LOW';
export type RunStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED';
export type ResultStatus = 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED';

export interface TestCase {
  id: string;
  code: string;
  title: string;
  description?: string;
  executionType?: ExecutionType;
  type: TestType;
  priority: Priority;
  precondition?: string;
  preconditions?: string;
  orderIndex?: number;
  suiteId?: string | null;
  projectId?: string;
  jiraStoryKey?: string;
  jiraIssueUrl?: string;
  screenshotUrl?: string;
  steps: TestStep[];
  results?: TestResult[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SuiteTreeNode {
  id: string;
  type?: 'suite';
  name: string;
  orderIndex: number;
  parentId: string | null;
  children: SuiteTreeNode[];
  testCases: TestCase[];
}

export interface TreeResponse {
  project?: {
    id: string;
    name: string;
    key: string;
    jiraProjectKey?: string;
  };
  projectId?: string;
  tree: SuiteTreeNode[];
  children?: SuiteTreeNode[];
  rootTestCases?: TestCase[];
}

export interface TestResult {
  id?: string;
  testRunId?: string;
  testCaseId: string;
  testCase?: Partial<TestCase>;
  status: ResultStatus;
  executionMs?: number;
  errorMessage?: string;
  executedBy?: string;
  testerEmail?: string;
  jiraBugKey?: string;
  jiraBugUrl?: string;
  screenshotUrl?: string;
  executedAt?: string;
}

export interface TestRun {
  id: string;
  title: string;
  version: string;
  environment: string;
  status: RunStatus;
  executedBy: string;
  testerEmail: string;
  projectId: string;
  results: TestResult[];
  createdAt: string;
  _count?: {
    results: number;
  };
}

export interface CreateRunDto {
  title: string;
  version?: string;
  environment?: string;
  executedBy?: string;
  testerEmail?: string;
}

export interface SaveResultsDto {
  results: {
    testCaseId: string;
    status: ResultStatus;
    executionMs?: number;
    errorMessage?: string;
    jiraBugKey?: string;
    jiraBugUrl?: string;
    screenshotUrl?: string;
  }[];
}

// API Services
export const ProjectsService = {
  getAll: () => api.get<Project[]>('/projects').then((res) => res.data),
  getOne: (id: string) => api.get<Project>(`/projects/${id}`).then((res) => res.data),
  create: (data: { name: string; key: string; description?: string; jiraProjectKey?: string }) =>
    api.post<Project>('/projects', data).then((res) => res.data),
  update: (id: string, data: { name?: string; key?: string; description?: string; jiraProjectKey?: string }) =>
    api.patch<Project>(`/projects/${id}`, data).then((res) => res.data),
  getTree: (projectId: string) =>
    api.get<TreeResponse>(`/projects/${projectId}/tree`).then((res) => res.data),
  delete: (id: string) => api.delete(`/projects/${id}`).then((res) => res.data),
};

export const SuitesService = {
  create: (data: { name: string; projectId: string; parentId?: string; orderIndex?: number }) =>
    api.post('/suites', data).then((res) => res.data),
  update: (id: string, data: { name?: string; parentId?: string }) =>
    api.patch(`/suites/${id}`, data).then((res) => res.data),
  reorder: (id: string, data: { parentId?: string | null; orderIndex: number }) =>
    api.patch(`/suites/${id}/reorder`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/suites/${id}`).then((res) => res.data),
};

export const TestCasesService = {
  getOne: (id: string) => api.get<TestCase>(`/test-cases/${id}`).then((res) => res.data),
  create: (data: Partial<TestCase>) => api.post<TestCase>('/test-cases', data).then((res) => res.data),
  update: (id: string, data: Partial<TestCase>) =>
    api.patch<TestCase>(`/test-cases/${id}`, data).then((res) => res.data),
  linkJiraStory: (id: string, jiraStoryKey?: string, jiraIssueUrl?: string) =>
    api.patch<TestCase>(`/test-cases/${id}/jira-link`, { jiraStoryKey, jiraIssueUrl }).then((res) => res.data),
  delete: (id: string) => api.delete(`/test-cases/${id}`).then((res) => res.data),
};

export const TestRunsService = {
  createRun: (projectId: string, data: CreateRunDto) =>
    api.post<TestRun>(`/projects/${projectId}/runs`, data).then((res) => res.data),
  saveResults: (projectId: string, runId: string, data: SaveResultsDto) =>
    api.post<TestRun>(`/projects/${projectId}/runs/${runId}/results`, data).then((res) => res.data),
  completeRun: (runId: string, status: RunStatus = 'COMPLETED') =>
    api.patch<TestRun>(`/runs/${runId}/complete`, { status }).then((res) => res.data),
  quickRun: (projectId: string, data: { testCaseId: string; status: ResultStatus; errorMessage?: string; jiraBugKey?: string; jiraBugUrl?: string; screenshotUrl?: string; executedBy?: string }) =>
    api.post<TestResult>(`/projects/${projectId}/quick-run`, data).then((res) => res.data),
  getRuns: (projectId: string) =>
    api.get<TestRun[]>(`/projects/${projectId}/runs`).then((res) => res.data),
  getRunDetails: (runId: string) =>
    api.get<TestRun>(`/runs/${runId}`).then((res) => res.data),
};

