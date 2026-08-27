# TCMS Coding Standards & Agent Guidelines

## Backend Guidelines (NestJS + Prisma)
- Controllers handle HTTP requests and pass DTO validation.
- Services implement business logic and interact with Prisma Client (`PrismaService`).
- DTOs should use `class-validator` and `class-transformer` decorators where applicable.
- Database relations must maintain referential integrity (e.g. `onDelete: Cascade` for child Suites & Test Cases when a Project is removed).

## Frontend Guidelines (Next.js 14 + React)
- Frontend uses `'use client'` directive for interactive components.
- Styling uses Tailwind CSS classes styled dynamically based on `useTheme()` context.
- API service calls are centralized in `frontend/src/services/api.ts`.
- Component state should be localized; global state uses React Context (`ThemeContext`).

## Process Lifecycle
- Do not kill ports manually with `fuser -k` or `kill -9` without trying `./stop.sh` first.
- If Next.js webpack cache becomes corrupted or throws missing chunk errors, run `./restart.sh` which automatically purges `frontend/.next/cache`.
