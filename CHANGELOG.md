# Changelog

All notable changes to the **TCMS (Test Case Management System)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **AI Agent Context Infrastructure**:
  - `AGENTS.md`: Guidelines and rapid project overview for AI agents.
  - `PROJECT_CONTEXT.md`: High-density architectural and schema snapshot.
  - `scripts/generate_vector_context.py`: Tool to extract code chunks and metadata into `project_vector_context.json` for RAG/Vector stores.
- **Changelog Tracking System**:
  - `CHANGELOG.md`: Structured change history tracker.
  - `scripts/update_changelog.py`: Helper CLI script for adding categorized changelog entries.
- **Clean Restart Logic**: Updated `restart.sh` to clear stale Next.js build caches before launching services.

---

## [1.0.0] - 2026-08-14

### Added
- **Core Backend Service (NestJS & Prisma)**:
  - Database schema models: `Project`, `Suite`, `TestCase`, `TestRun`, `TestResult`, `Tag`.
  - Modules & Controllers for Projects, Suites, Test Cases, and Test Runs management.
  - SQLite database integration via Prisma ORM.
- **Modern Web Frontend (Next.js 14 & Tailwind CSS)**:
  - Interactive Suite & Test Case Explorer Tree view.
  - Test Suite & Test Case Creation & Modification Modals.
  - Test Run Execution Modals (Manual & Quick Run) with step status tracking (Passed, Failed, Blocked, Skipped).
  - Test Execution Dashboard with metrics and visual status breakdowns.
  - Theme Selector supporting Dark, Light, and Glassmorphism themes.
- **Process & Orchestration Scripts**:
  - `start.sh`, `stop.sh`, and `restart.sh` helper scripts for dual-service lifecycle management.
