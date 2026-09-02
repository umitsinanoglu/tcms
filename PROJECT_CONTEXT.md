# TCMS Master Project Context

This document serves as the high-density architectural blueprint for AI agents and developers.

---

## 1. System Overview

- **Project Name**: Test Case Management System (TCMS)
- **Architecture**: Monorepo with separated `backend/` (NestJS) and `frontend/` (Next.js 14 App Router)
- **Primary Ports**:
  - Frontend: `3000` (`http://localhost:3000`)
  - Backend API: `3001` (`http://localhost:3001`)

---

## 2. Database Models & Schema (Prisma / PostgreSQL / SQLite)

### Core Entities:
1. **`Project`**:
   - `id`: UUID (Primary Key)
   - `name`: String
   - `key`: Unique short code (e.g. `TCMS`, `PAY`)
   - `description`: String?
   - `jiraProjectKey`: String?
   - Relations: `suites` (Suite[]), `testRuns` (TestRun[])

2. **`Suite`**:
   - `id`: UUID
   - `name`: String
   - `projectId`: Foreign Key -> `Project` (Cascade Delete)
   - `parentId`: Self-referencing Foreign Key -> `Suite` (Cascade Delete)
   - Relations: `children` (Suite[]), `cases` (TestCase[])

3. **`TestCase`**:
   - `id`: UUID
   - `code`: Unique code (e.g., `PAY-101`)
   - `title`: String
   - `description`: String?
   - `type`: Enum (`WEB`, `MOBILE`, `API`, `MANUAL`)
   - `priority`: Enum (`BLOCKER`, `CRITICAL`, `NORMAL`, `LOW`)
   - `precondition`: String?
   - `suiteId`: Foreign Key -> `Suite` (Cascade Delete)
   - Relations: `steps` (TestStep[]), `results` (TestResult[])
   - Jira integration fields: `jiraStoryKey`, `jiraIssueUrl`, `screenshotUrl`

4. **`TestStep`**:
   - `id`: UUID
   - `stepNumber`: Int
   - `action`: String
   - `expectedResult`: String
   - `testCaseId`: Foreign Key -> `TestCase` (Cascade Delete)

5. **`TestRun`**:
   - `id`: UUID
   - `title`: String
   - `version`: String (e.g. `v1.2.0`)
   - `environment`: String (e.g. `STAGING`, `PROD`)
   - `status`: Enum (`IN_PROGRESS`, `COMPLETED`, `ABORTED`)
   - `executedBy`: String
   - `testerEmail`: String
   - `projectId`: Foreign Key -> `Project` (Cascade Delete)
   - Relations: `results` (TestResult[])

6. **`TestResult`**:
   - `id`: UUID
   - `testRunId`: Foreign Key -> `TestRun`
   - `testCaseId`: Foreign Key -> `TestCase`
   - `status`: Enum (`PASSED`, `FAILED`, `SKIPPED`, `BLOCKED`)
   - `executionMs`: Int?
   - `errorMessage`: String?
   - `executedBy`: String?, `testerEmail`: String?
   - Jira bug fields: `jiraBugKey`, `jiraBugUrl`, `screenshotUrl`

7. **`Defect`**:
   - `id`: UUID
   - `key`: Unique auto-generated identifier (e.g. `BANK-MOB-DEF-1`)
   - `title`: String
   - `description`: String?
   - `severity`: Enum (`BLOCKER`, `CRITICAL`, `MAJOR`, `MINOR`, `TRIVIAL`)
   - `status`: Enum (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REOPENED`, `WONT_FIX`)
   - `projectId`: Foreign Key -> `Project` (Cascade Delete)
   - `testCaseId`: Foreign Key -> `TestCase`? (SetNull)
   - `testRunId`: Foreign Key -> `TestRun`? (SetNull)
   - `testResultId`: Foreign Key -> `TestResult`? (SetNull)
   - `assignedTo`: String?, `reportedBy`: String?
   - `environment`: String?, `channel`: String?
   - Jira fields: `jiraBugKey`, `jiraBugUrl`
   - `resolutionNotes`: String?, `resolvedAt`: DateTime?

---

## 3. Backend API Route Blueprint (`backend/src`)

| Module | Controller Endpoint | HTTP Method | Action |
|---|---|---|---|
| **Projects** | `/projects` | GET | List all projects |
| | `/projects` | POST | Create project |
| | `/projects/:id` | GET | Get project details |
| | `/projects/:id` | PUT | Update project |
| | `/projects/:id` | DELETE | Delete project |
| **Suites** | `/suites/project/:projectId/tree` | GET | Get hierarchical tree of test suites |
| | `/suites` | POST | Create suite |
| | `/suites/:id` | PUT | Update suite |
| | `/suites/:id` | DELETE | Delete suite |
| **Test Cases** | `/test-cases` | POST | Create test case |
| | `/test-cases/suite/:suiteId` | GET | List test cases in a suite |
| | `/test-cases/:id` | GET | Get test case details with steps |
| | `/test-cases/:id` | PUT | Update test case |
| | `/test-cases/:id` | DELETE | Delete test case |
| **Test Runs** | `/test-runs` | POST | Create test run |
| | `/test-runs/project/:projectId` | GET | Get all test runs for a project |
| | `/test-runs/:id` | GET | Get test run details & results |
| | `/test-runs/:id/results` | POST | Record execution result for test case |
| | `/test-runs/:id/status` | PATCH | Update test run overall status |
| **Defects** | `/defects/project/:projectId` | GET | List all defects with status/severity/search filters |
| | `/defects/stats/project/:projectId` | GET | Aggregated metrics, distributions & resolution rate |
| | `/defects` | POST | Create defect |
| | `/defects/:id` | GET | Get single defect detail |
| | `/defects/:id` | PUT | Update defect details |
| | `/defects/:id/status` | PATCH | Quick status transition |
| | `/defects/sync-failed/project/:projectId` | POST | Auto-sync failed execution results to defects |
| | `/defects/:id` | DELETE | Delete defect |

---

## 4. Frontend Component Hierarchy (`frontend/src`)

- **`App` (`src/app/page.tsx`)**: Main layout container, active tab controller (`DASHBOARD`, `PLANS`, `EXPLORER`, `RUNS`, `DEFECTS`, `REPORTS`), modal manager.
- **`Header` (`src/components/Header.tsx`)**: Navigation bar, project dropdown selector, active view toggles, theme switcher.
- **`AppSidebar` (`src/components/AppSidebar.tsx`)**: Collapsible navigation bar with badges for test plans, cases, runs, and active defects.
- **`DefectsView` (`src/components/DefectsView.tsx`)**: Centralized defect tracking hub with List View, Kanban Board, Analytics charts, and CSV export.
- **`ExplorerTree` (`src/components/ExplorerTree.tsx`)**: Recursive tree displaying Suites and Test Cases with action context menus.
- **`TestCaseEditor` (`src/components/TestCaseEditor.tsx`)**: Form for creating/editing test steps, preconditions, priority, type, and Jira linkage.
- **`DashboardView` (`src/components/DashboardView.tsx`)**: Visual metrics dashboard (total cases, pass rate, priority distribution, test run activity charts).
- **`TestRunsView` (`src/components/TestRunsView.tsx`)**: Table of test runs, environment breakdown, and execution logs.
- **Modals**:
  - `NewDefectModal.tsx`
  - `DefectDetailModal.tsx`
  - `NewProjectModal.tsx`
  - `NewSuiteModal.tsx`
  - `EditSuiteModal.tsx`
  - `NewCaseModal.tsx`
  - `NewTestPlanModal.tsx`
  - `ManualRunModal.tsx`
  - `QuickRunModal.tsx`

---

## 5. Theme System (`frontend/src/theme`)

Supports 3 customizable UI themes via `ThemeContext`:
1. `DARK`: Modern obsidian dark palette with glowing accents.
2. `LIGHT`: Clean corporate light design.
3. `GLASS`: Glassmorphic frosted glass design with backdrop filters.
