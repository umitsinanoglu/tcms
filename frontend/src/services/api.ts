import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const activeUserId = localStorage.getItem('tcms_active_user_id');
    const activeUserRole = localStorage.getItem('tcms_active_user_role');
    const activeUserEmail = localStorage.getItem('tcms_active_user_email');
    const activeUserName = localStorage.getItem('tcms_active_user_name');

    if (activeUserId) config.headers['x-user-id'] = activeUserId;
    if (activeUserRole) config.headers['x-user-role'] = activeUserRole;
    if (activeUserEmail) config.headers['x-user-email'] = activeUserEmail;
    if (activeUserName) config.headers['x-user-name'] = encodeURIComponent(activeUserName);
  }
  return config;
});


export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  jiraProjectKey?: string;
  createdAt: string;
  _count?: {
    testPlans?: number;
    suites: number;
    testRuns: number;
  };
}

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface TestPlan {
  id: string;
  title: string;
  description?: string;
  version: string;
  environment: string;
  status: PlanStatus;
  scope?: string;
  requirements?: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    key: string;
  };
  testRuns?: TestRun[];
  cases?: Array<{ id: string; testCaseId: string; testCase?: TestCase }>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    testRuns: number;
    cases?: number;
  };
}

export interface CreateTestPlanDto {
  title: string;
  description?: string;
  version?: string;
  environment?: string;
  status?: PlanStatus;
  scope?: string;
  requirements?: string;
  projectId: string;
  caseIds?: string[];
}

export interface UpdateTestPlanDto {
  title?: string;
  description?: string;
  version?: string;
  environment?: string;
  status?: PlanStatus;
  scope?: string;
  requirements?: string;
  caseIds?: string[];
}

export interface StepAttachment {
  id?: string;
  url: string;
  comment?: string;
}

export interface TestStep {
  id?: string;
  stepNumber: number;
  action: string;
  expectedResult: string;
  attachments?: StepAttachment[];
}

export type ExecutionType = 'MANUAL' | 'AUTOMATION' | 'AUTOMATED';
export type TestType = 'DESKTOP' | 'WEB' | 'IOS' | 'ANDROID' | 'API' | 'PERFORMANCE' | 'OTHER' | 'MANUAL' | 'MOBILE';
export type Priority = 'BLOCKER' | 'CRITICAL' | 'NORMAL' | 'LOW';
export type RunStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED' | 'ARCHIVED';
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
  suite?: {
    id: string;
    name: string;
    parentId?: string | null;
  };
  projectId?: string;
  jiraStoryKey?: string;
  jiraIssueUrl?: string;
  screenshotUrl?: string;
  steps: TestStep[];
  results?: TestResult[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TestCaseStats {
  testCaseId: string;
  totalRuns: number;
  passRate: number | null;
  failRate: number | null;
  skipRate: number | null;
  blockedRate: number | null;
  flakyScore: number | null;
  avgDurationMs: number | null;
  lastExecutedAt: string | null;
}

export interface TestCaseHistoryItem {
  id: string;
  status: ResultStatus;
  executionMs: number | null;
  errorMessage: string | null;
  flakyStatus: string | null;
  retries: number | null;
  environment: string | null;
  platform: string | null;
  appVersion: string | null;
  device: string | null;
  userProfile: string | null;
  customerType: string | null;
  screenshotUrl: string | null;
  jiraBugKey: string | null;
  jiraBugUrl: string | null;
  executedBy: string | null;
  executedAt: string;
  testRun: {
    id: string;
    title: string;
    version: string;
    environment: string;
    status: RunStatus;
    executedBy: string;
    createdAt: string;
  };
}

export interface TestCaseHistory {
  testCaseId: string;
  total: number;
  history: TestCaseHistoryItem[];
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
  testRun?: Partial<TestRun>;
  testCaseId: string;
  testCase?: Partial<TestCase>;
  status: ResultStatus;
  executionMs?: number;
  errorMessage?: string;
  executedBy?: string;
  testerEmail?: string;
  environment?: string;
  platform?: string;
  appVersion?: string;
  device?: string;
  userProfile?: string;
  customerType?: string;
  flakyStatus?: string;
  retries?: number;
  jiraBugKey?: string;
  jiraBugUrl?: string;
  screenshotUrl?: string;
  defects?: {
    id: string;
    key: string;
    title: string;
    status: DefectStatus;
    severity: DefectSeverity;
  }[];
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
  testPlanId?: string | null;
  testPlan?: {
    id: string;
    title: string;
    version: string;
    environment: string;
    scope?: string;
    requirements?: string;
  } | null;
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
  testPlanId?: string;
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
    environment?: string;
    platform?: string;
    appVersion?: string;
    device?: string;
    userProfile?: string;
    customerType?: string;
    flakyStatus?: string;
    retries?: number;
  }[];
}

export interface BulkTestCaseItemInput {
  code?: string;
  title: string;
  description?: string;
  suiteName?: string;
  suiteId?: string;
  executionType?: ExecutionType;
  type?: TestType;
  priority?: Priority;
  precondition?: string;
  jiraStoryKey?: string;
  steps?: {
    stepNumber?: number;
    action: string;
    expectedResult?: string;
  }[];
}

export interface BulkTestPlanItemInput {
  title: string;
  description?: string;
  version?: string;
  environment?: string;
  status?: PlanStatus;
  scope?: string;
  requirements?: string;
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

export const TestPlansService = {
  getAllByProject: (projectId: string) =>
    api.get<TestPlan[]>(`/projects/${projectId}/test-plans`).then((res) => res.data),
  getOne: (id: string) => api.get<TestPlan>(`/test-plans/${id}`).then((res) => res.data),
  create: (data: CreateTestPlanDto) =>
    api.post<TestPlan>('/test-plans', data).then((res) => res.data),
  createBulk: (projectId: string, items: BulkTestPlanItemInput[]) =>
    api.post<{ success: boolean; count: number; data: TestPlan[] }>('/test-plans/bulk', { projectId, items }).then((res) => res.data),
  update: (id: string, data: UpdateTestPlanDto) =>
    api.patch<TestPlan>(`/test-plans/${id}`, data).then((res) => res.data),
  syncCases: (id: string, caseIds: string[]) =>
    api.post<TestPlan>(`/test-plans/${id}/cases/sync`, { caseIds }).then((res) => res.data),
  addCases: (id: string, caseIds: string[]) =>
    api.post<TestPlan>(`/test-plans/${id}/cases`, { caseIds }).then((res) => res.data),
  removeCase: (id: string, caseId: string) =>
    api.delete<{ success: boolean }>(`/test-plans/${id}/cases/${caseId}`).then((res) => res.data),
  delete: (id: string) => api.delete(`/test-plans/${id}`).then((res) => res.data),
};

export const SuitesService = {
  getAllByProject: (projectId: string) =>
    api.get<SuiteTreeNode[]>('/suites', { params: { projectId } }).then((res) => res.data),
  getOne: (id: string) =>
    api.get<SuiteTreeNode>(`/suites/${id}`).then((res) => res.data),
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
  getStats: (id: string) => api.get<TestCaseStats>(`/test-cases/${id}/stats`).then((res) => res.data),
  getHistory: (id: string, limit = 20) =>
    api.get<TestCaseHistory>(`/test-cases/${id}/history?limit=${limit}`).then((res) => res.data),
  create: (data: Partial<TestCase>) => api.post<TestCase>('/test-cases', data).then((res) => res.data),
  createBulk: (projectId: string, items: BulkTestCaseItemInput[], updateIfExists?: boolean) =>
    api.post<{ success: boolean; count: number; createdCount?: number; updatedCount?: number; data: TestCase[] }>('/test-cases/bulk', { projectId, items, updateIfExists }).then((res) => res.data),
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
  quickRun: (projectId: string, data: { testCaseId: string; status: ResultStatus; version?: string; environment?: string; platform?: string; appVersion?: string; device?: string; userProfile?: string; customerType?: string; flakyStatus?: string; errorMessage?: string; jiraBugKey?: string; jiraBugUrl?: string; screenshotUrl?: string; executedBy?: string }) =>
    api.post<TestResult>(`/projects/${projectId}/quick-run`, data).then((res) => res.data),
  getRuns: (projectId: string) =>
    api.get<TestRun[]>(`/projects/${projectId}/runs`).then((res) => res.data),
  getRunDetails: (runId: string) =>
    api.get<TestRun>(`/runs/${runId}`).then((res) => res.data),
  deleteRun: (runId: string) =>
    api.delete(`/runs/${runId}`).then((res) => res.data),
};

export interface ProjectReportSummary {
  project: Project;
  metrics: {
    totalCases: number;
    totalSuites: number;
    totalRuns: number;
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
    untested: number;
    executedTotal: number;
    passRate: number;
    executedPassRate: number;
  };
  readiness?: {
    status: 'GO' | 'CAUTION' | 'NO_GO';
    score: number;
    reason: string;
    blockerCount: number;
    criticalCount: number;
  };
  channels?: {
    key: string;
    name: string;
    icon: string;
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    untested: number;
    passRate: number;
  }[];
  automation?: {
    manual: number;
    automation: number;
    percentage: number;
  };
  topRiskySuites?: {
    id: string;
    name: string;
    totalCases: number;
    passed: number;
    failed: number;
    blocked: number;
    untested: number;
    passRate: number;
  }[];
  distributions: {
    priority: Record<string, number>;
    type: Record<string, number>;
    executionType: Record<string, number>;
  };
  suites: {
    id: string;
    name: string;
    parentId?: string | null;
    totalCases: number;
    passed: number;
    failed: number;
    blocked: number;
    untested: number;
    passRate: number;
  }[];
  recentRuns: {
    id: string;
    title: string;
    version: string;
    environment: string;
    status: RunStatus;
    executedBy: string;
    createdAt: string;
    totalResults: number;
    passed: number;
    failed: number;
    blocked: number;
    passRate: number;
  }[];
  failedCases: {
    code: string;
    title: string;
    suiteName: string;
    priority: Priority;
    errorMessage?: string;
    jiraBugKey?: string;
    jiraBugUrl?: string;
    executedBy?: string;
    executedAt?: string;
  }[];
  defects: {
    jiraBugKey: string;
    jiraBugUrl?: string;
    testCaseCode: string;
    testCaseTitle: string;
    errorMessage?: string;
    executedAt: string;
  }[];
  testCases: (TestCase & {
    suiteName: string;
    stepsCount: number;
    latestStatus: ResultStatus | 'UNTESTED';
    latestErrorMessage?: string;
    latestJiraBugKey?: string;
    latestJiraBugUrl?: string;
    latestExecutionMs?: number;
    latestExecutedAt?: string;
  })[];
  generatedAt: string;
}

export interface RunReportSummary {
  run: TestRun & { projectName: string; projectKey: string };
  metrics: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
    passRate: number;
    totalExecutionMs: number;
    avgExecutionMs: number;
  };
  defects: {
    jiraBugKey: string;
    jiraBugUrl?: string;
    testCaseCode: string;
    testCaseTitle: string;
    errorMessage?: string;
    screenshotUrl?: string;
  }[];
  results: {
    id: string;
    testCaseId: string;
    testCaseCode: string;
    testCaseTitle: string;
    suiteName: string;
    priority: Priority;
    type: TestType;
    executionType: ExecutionType;
    status: ResultStatus;
    executionMs?: number;
    errorMessage?: string;
    jiraBugKey?: string;
    jiraBugUrl?: string;
    screenshotUrl?: string;
    executedBy?: string;
    executedAt?: string;
  }[];
  generatedAt: string;
}

export const ReportsService = {
  getProjectSummary: (projectId: string) =>
    api.get<ProjectReportSummary>(`/reports/projects/${projectId}/summary`).then((res) => res.data),
  getRunSummary: (runId: string) =>
    api.get<RunReportSummary>(`/reports/runs/${runId}/summary`).then((res) => res.data),
  getSuiteSummary: (suiteId: string) =>
    api.get<any>(`/reports/suites/${suiteId}/summary`).then((res) => res.data),
  getTestCaseSummary: (caseId: string) =>
    api.get<any>(`/reports/test-cases/${caseId}/summary`).then((res) => res.data),

  // Export URLs for browser direct download or new window
  getProjectExportUrl: (projectId: string, format: 'json' | 'csv' | 'html') =>
    `${API_BASE_URL}/reports/projects/${projectId}/export?format=${format}`,
  getRunExportUrl: (runId: string, format: 'json' | 'csv' | 'html') =>
    `${API_BASE_URL}/reports/runs/${runId}/export?format=${format}`,

  // Trigger browser download via blob / direct link
  downloadProjectReport: async (projectId: string, format: 'json' | 'csv' | 'html', projectKey?: string) => {
    const url = `${API_BASE_URL}/reports/projects/${projectId}/export?format=${format}`;
    if (format === 'html') {
      window.open(url, '_blank');
      return;
    }
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data], {
      type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `${projectKey || 'TCMS'}_Test_Report_${date}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  downloadRunReport: async (runId: string, format: 'json' | 'csv' | 'html', runTitle?: string) => {
    const url = `${API_BASE_URL}/reports/runs/${runId}/export?format=${format}`;
    if (format === 'html') {
      window.open(url, '_blank');
      return;
    }
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data], {
      type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    const date = new Date().toISOString().split('T')[0];
    const safeTitle = (runTitle || 'Run').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `${safeTitle}_Report_${date}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export type UserRole = 'ADMIN' | 'TEST_LEAD' | 'TESTER' | 'AUTOMATION_ENGINEER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  role?: UserRole;
  department?: string;
  avatarUrl?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: UserRole;
  department?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export const UsersService = {
  getUsers: () => api.get<User[]>('/users').then((res) => res.data),
  getUser: (id: string) => api.get<User>(`/users/${id}`).then((res) => res.data),
  getCurrentUser: () => api.get<any>('/users/me').then((res) => res.data),
  createUser: (data: CreateUserInput) => api.post<User>('/users', data).then((res) => res.data),
  updateUser: (id: string, data: UpdateUserInput) => api.patch<User>(`/users/${id}`, data).then((res) => res.data),
  deleteUser: (id: string) => api.delete<{ message: string }>(`/users/${id}`).then((res) => res.data),
};

export type DefectSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'TRIVIAL';
export type DefectStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED' | 'WONT_FIX';

export interface Defect {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  severity: DefectSeverity;
  status: DefectStatus;
  projectId: string;
  project?: {
    id: string;
    name: string;
    key: string;
  };
  testCaseId?: string | null;
  testCase?: {
    id: string;
    code: string;
    title: string;
    priority: Priority;
    type: TestType;
    suite?: { id: string; name: string };
    steps?: TestStep[];
  } | null;
  testRunId?: string | null;
  testRun?: {
    id: string;
    title: string;
    version: string;
    environment: string;
  } | null;
  testResultId?: string | null;
  testResult?: {
    id: string;
    status: ResultStatus;
    errorMessage?: string | null;
    screenshotUrl?: string | null;
  } | null;
  assignedTo?: string | null;
  reportedBy?: string | null;
  environment?: string;
  channel?: string;
  jiraBugKey?: string | null;
  jiraBugUrl?: string | null;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDefectDto {
  projectId: string;
  title: string;
  description?: string;
  severity?: DefectSeverity;
  status?: DefectStatus;
  testCaseId?: string;
  testRunId?: string;
  testResultId?: string;
  assignedTo?: string;
  reportedBy?: string;
  environment?: string;
  channel?: string;
  jiraBugKey?: string;
  jiraBugUrl?: string;
  resolutionNotes?: string;
}

export interface UpdateDefectDto {
  title?: string;
  description?: string;
  severity?: DefectSeverity;
  status?: DefectStatus;
  testCaseId?: string | null;
  testRunId?: string | null;
  testResultId?: string | null;
  assignedTo?: string;
  reportedBy?: string;
  environment?: string;
  channel?: string;
  jiraBugKey?: string;
  jiraBugUrl?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
}

export interface DefectStats {
  projectId: string;
  projectName: string;
  projectKey: string;
  metrics: {
    total: number;
    active: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    reopened: number;
    wontFix: number;
    activeBlockerCritical: number;
    resolutionRate: number;
  };
  distributions: {
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    byEnvironment: Record<string, number>;
    byChannel: Record<string, number>;
    byAssignee: Record<string, number>;
  };
  recentDefects: Defect[];
}

export const DefectsService = {
  getAllByProject: (
    projectId: string,
    filters?: {
      status?: DefectStatus;
      severity?: DefectSeverity;
      environment?: string;
      assignedTo?: string;
      search?: string;
    },
  ) =>
    api.get<Defect[]>(`/defects/project/${projectId}`, { params: filters }).then((res) => res.data),
  getStatsByProject: (projectId: string) =>
    api.get<DefectStats>(`/defects/stats/project/${projectId}`).then((res) => res.data),
  getOne: (id: string) =>
    api.get<Defect>(`/defects/${id}`).then((res) => res.data),
  create: (data: CreateDefectDto) =>
    api.post<Defect>('/defects', data).then((res) => res.data),
  update: (id: string, data: UpdateDefectDto) =>
    api.put<Defect>(`/defects/${id}`, data).then((res) => res.data),
  updateStatus: (id: string, status: DefectStatus, resolutionNotes?: string) =>
    api.patch<Defect>(`/defects/${id}/status`, { status, resolutionNotes }).then((res) => res.data),
  syncFromFailed: (projectId: string) =>
    api.post<{ syncedCount: number; createdDefects: Defect[] }>(`/defects/sync-failed/project/${projectId}`).then((res) => res.data),
  delete: (id: string) =>
    api.delete(`/defects/${id}`).then((res) => res.data),
};

export type TriggerTargetScope = 'ALL' | 'SMOKE' | 'REGRESSION' | 'SELECTED_CASES' | 'SUITE';

export interface TriggerAutomationWebhookDto {
  webhookUrl: string;
  title?: string;
  environment?: string;
  version?: string;
  scope?: TriggerTargetScope;
  suiteId?: string;
  caseCodes?: string[];
  platform?: 'iOS' | 'Android';
  deviceAlias?: string;
  specs?: string[];
  secretToken?: string;
  triggeredBy?: string;
}

export interface WebhookTriggerResponse {
  success: boolean;
  message: string;
  testRun: TestRun;
  targetCaseCount: number;
  outboundPayload: any;
  remoteResponse: {
    status: number | null;
    body: any;
    error: string | null;
  };
}

export const WebhooksService = {
  triggerAutomation: (projectId: string, dto: TriggerAutomationWebhookDto) =>
    api.post<WebhookTriggerResponse>(`/projects/${projectId}/webhooks/trigger`, dto).then((res) => res.data),
  testWebhook: (projectId: string, webhookUrl: string, secretToken?: string) =>
    api.post<{ success: boolean; status?: number; response?: string; error?: string }>(
      `/projects/${projectId}/webhooks/ping`,
      { webhookUrl, secretToken },
    ).then((res) => res.data),
};

// TAC (Test Automation Center) Interfaces & Service
export interface TACDevice {
  udid: string;
  name: string;
  platform: 'iOS' | 'Android';
  state: string;
  isConfigured: boolean;
  alias: string;
  appiumPort?: number;
  wdaPort?: number;
  mjpegPort?: number;
}

export interface TACSpecCase {
  title: string;
  code: string;
  line: number;
}

export interface TACSpecItem {
  name: string;
  relativePath: string;
  category: string;
  suites: string[];
  cases: TACSpecCase[];
}

export interface TACRunDetails {
  id: string;
  title: string;
  platform: 'iOS' | 'Android';
  deviceAlias: string;
  environment: string;
  status: 'RUNNING' | 'PASSED' | 'FAILED' | 'STOPPED';
  startTime: string;
  endTime?: string;
  durationMs?: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  results: {
    caseCode: string;
    status: 'PASSED' | 'FAILED' | 'SKIPPED';
    durationMs?: number;
    errorMessage?: string;
  }[];
  tcmsSynced?: boolean;
  tcmsRunId?: string;
}

export const TACService = {
  checkHealth: () =>
    api.get<{ online: boolean; data?: any; error?: string }>('/tac/health').then((res) => res.data),
  getDevices: () =>
    api.get<{ success: boolean; data: TACDevice[]; error?: string }>('/tac/devices').then((res) => res.data),
  scanDevices: () =>
    api.get<{ success: boolean; scannedCount: number; data: TACDevice[]; error?: string }>('/tac/devices/scan').then((res) => res.data),
  getSpecs: () =>
    api.get<{ success: boolean; count: number; data: TACSpecItem[]; error?: string }>('/tac/specs').then((res) => res.data),
  getPlans: () =>
    api.get<{ success: boolean; data: any[]; error?: string }>('/tac/specs/plans').then((res) => res.data),
  getRuns: () =>
    api.get<{ success: boolean; data: any[]; error?: string }>('/tac/runs').then((res) => res.data),
  getRunDetails: (runId: string) =>
    api.get<{ success: boolean; data: TACRunDetails; error?: string }>(`/tac/runs/${runId}`).then((res) => res.data),
  stopRun: (runId: string) =>
    api.post<{ success: boolean; message: string; error?: string }>(`/tac/runs/${runId}/stop`, {}).then((res) => res.data),
  checkAppiumHealth: (port?: number, url?: string) =>
    api.post<{ success: boolean; error?: string }>('/tac/devices/health', { port, url }).then((res) => res.data),
};

export function subscribeToTACLogs(
  wsUrl: string = 'ws://localhost:8000/ws/logs',
  onLog: (logText: string, isError?: boolean, runId?: string) => void,
  onStatusChange?: (data: any) => void,
  onConnected?: () => void,
  onDisconnected?: () => void,
): { close: () => void } {
  let ws: WebSocket | null = null;
  let isClosedManually = false;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (onConnected) onConnected();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'LOG' && msg.text) {
          onLog(msg.text, msg.isError, msg.runId);
        } else if (msg.type === 'RUN_STARTED' || msg.type === 'RUN_FINISHED' || msg.type === 'RUN_UPDATED') {
          if (onStatusChange) onStatusChange(msg);
        } else if (msg.type === 'CONNECTED') {
          onLog(`⚡ [TAC] ${msg.message || 'Connected to Live Test Logs Stream'}\n`);
        }
      } catch {
        onLog(event.data);
      }
    };

    ws.onerror = (err) => {
      onLog(`⚠️ [TAC WS ERROR] Canlı log sunucusuna ulaşılamadı (${wsUrl})\n`, true);
      if (onDisconnected) onDisconnected();
    };

    ws.onclose = () => {
      if (!isClosedManually && onDisconnected) {
        onDisconnected();
      }
    };
  } catch (err: any) {
    onLog(`⚠️ [TAC WS INIT ERROR] ${err.message}\n`, true);
  }

  return {
    close: () => {
      isClosedManually = true;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    },
  };
}

export interface SystemSettings {
  systemTitle: string;
  defaultEnvironment: string;
  defaultTestType: string;
  runTimeoutMinutes: number;
  logRetentionDays: number;
  sessionTimeoutHours: number;
  allowMultipleSessions: boolean;
  version: string;
  updatedAt: string;
}

export interface LdapConfig {
  serverUrl: string;
  baseDn: string;
  bindDn: string;
  bindPassword?: string;
  hasPassword?: boolean;
  userFilter?: string;
  useSsl?: boolean;
  isEnabled?: boolean;
  syncIntervalHours?: number;
  groupMappings?: { ldapGroup: string; tcmsRole: string }[];
  lastSyncedAt?: string;
  lastSyncStatus?: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPreview: string;
  fullKey?: string;
  scope: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
}

export interface ActiveSessionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  ipAddress: string;
  userAgent: string;
  device: string;
  location: string;
  loginTime: string;
  lastActiveTime: string;
  isCurrent?: boolean;
}

export interface LdapTestResult {
  success: boolean;
  message: string;
  latencyMs: number;
  details?: any;
}

export interface LdapSyncResult {
  success: boolean;
  message: string;
  syncedAt: string;
  stats: {
    totalScanned: number;
    usersAdded: number;
    usersUpdated: number;
    usersUnchanged: number;
    rolesMapped: Record<string, number>;
  };
}

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'error';
  git: {
    branch: string;
    commit: string;
    commitMessage: string;
    commitDate: string;
    isDirty: boolean;
  };
  server: {
    nodeVersion: string;
    uptimeSeconds: number;
    environment: string;
    memory: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
    };
    serverTime: string;
  };
  database: {
    status: string;
    latencyMs: number;
  };
  counts?: {
    projects: number;
    testCases: number;
    testSuites: number;
    testRuns: number;
    activeRuns: number;
    openDefects: number;
  };
  version: string;
}

export const SettingsService = {
  getSystemStatus: () => api.get<SystemStatus>('/settings/system-status').then((res) => res.data),
  getSystemSettings: () => api.get<SystemSettings>('/settings/system').then((res) => res.data),
  updateSystemSettings: (data: Partial<SystemSettings>) =>
    api.patch<SystemSettings>('/settings/system', data).then((res) => res.data),

  getLdapConfig: () => api.get<LdapConfig>('/settings/ldap').then((res) => res.data),
  updateLdapConfig: (data: LdapConfig) => api.patch<LdapConfig>('/settings/ldap', data).then((res) => res.data),
  testLdap: (data: Partial<LdapConfig>) => api.post<LdapTestResult>('/settings/ldap/test', data).then((res) => res.data),
  syncLdap: () => api.post<LdapSyncResult>('/settings/ldap/sync').then((res) => res.data),

  getApiKeys: () => api.get<ApiKeyItem[]>('/settings/api-keys').then((res) => res.data),
  createApiKey: (data: { name: string; scope: string; expiresInDays?: number }) =>
    api.post<ApiKeyItem>('/settings/api-keys', data).then((res) => res.data),
  revokeApiKey: (id: string) => api.delete<{ success: boolean; message: string }>(`/settings/api-keys/${id}`).then((res) => res.data),

  getActiveSessions: () => api.get<ActiveSessionItem[]>('/settings/sessions').then((res) => res.data),
  terminateSession: (id: string) => api.delete<{ success: boolean; message: string }>(`/settings/sessions/${id}`).then((res) => res.data),
  terminateAllOtherSessions: () =>
    api.post<{ success: boolean; message: string }>('/settings/sessions/terminate-all-others').then((res) => res.data),

  getFieldCustomizations: () => api.get<FieldCustomizationState>('/settings/field-customizations').then((res) => res.data),
  updateFieldCustomizations: (data: Partial<FieldCustomizationState>) =>
    api.patch<FieldCustomizationState>('/settings/field-customizations', data).then((res) => res.data),
  resetFieldCustomizations: (moduleId?: string) =>
    api.post<FieldCustomizationState>('/settings/field-customizations/reset', { moduleId }).then((res) => res.data),
};

export type TableDensity = 'comfortable' | 'normal' | 'compact';

export interface GridColumnConfig {
  id: string;
  label: string;
  defaultLabel?: string;
  visible: boolean;
  order: number;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  isSticky?: 'left' | 'right' | 'none';
  isSystem?: boolean;
  description?: string;
}

export interface ModuleGridConfig {
  moduleId: string;
  moduleName: string;
  density: TableDensity;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  columns: GridColumnConfig[];
}

export interface FieldCustomizationState {
  modules: Record<string, ModuleGridConfig>;
  customTags: string[];
  updatedAt: string;
}







