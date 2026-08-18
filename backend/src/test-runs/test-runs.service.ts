import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutomationRunDto } from './dto/automation-run-result.dto';
import { CreateTestRunDto } from './dto/create-test-run.dto';
import { SaveExecutionResultsDto } from './dto/save-execution-results.dto';
import { QuickRunDto } from './dto/quick-run.dto';
import { RunStatus } from '@prisma/client';

@Injectable()
export class TestRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRun(projectId: string, dto: CreateTestRunDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    return this.prisma.testRun.create({
      data: {
        projectId,
        title: dto.title,
        version: dto.version || 'v1.0.0',
        environment: dto.environment || 'STAGING',
        executedBy: dto.executedBy || 'QA Tester',
        testerEmail: dto.testerEmail || 'tester@company.com',
        status: RunStatus.IN_PROGRESS,
      },
    });
  }

  async saveResults(projectId: string, runId: string, dto: SaveExecutionResultsDto) {
    const run = await this.findOne(runId);

    // Upsert or replace results for each testCase in the run
    for (const item of dto.results) {
      const bugUrl = item.jiraBugUrl || (item.jiraBugKey ? `https://company.atlassian.net/browse/${item.jiraBugKey}` : null);

      // Check if result already exists for this testCase in this run
      const existing = await this.prisma.testResult.findFirst({
        where: {
          testRunId: runId,
          testCaseId: item.testCaseId,
        },
      });

      if (existing) {
        await this.prisma.testResult.update({
          where: { id: existing.id },
          data: {
            status: item.status,
            executionMs: item.executionMs ?? null,
            errorMessage: item.errorMessage ?? null,
            jiraBugKey: item.jiraBugKey ?? null,
            jiraBugUrl: bugUrl,
            screenshotUrl: item.screenshotUrl ?? existing.screenshotUrl ?? null,
            executedBy: run.executedBy,
            testerEmail: run.testerEmail,
            executedAt: new Date(),
          },
        });
      } else {
        await this.prisma.testResult.create({
          data: {
            testRunId: runId,
            testCaseId: item.testCaseId,
            status: item.status,
            executionMs: item.executionMs ?? null,
            errorMessage: item.errorMessage ?? null,
            jiraBugKey: item.jiraBugKey ?? null,
            jiraBugUrl: bugUrl,
            screenshotUrl: item.screenshotUrl ?? null,
            executedBy: run.executedBy,
            testerEmail: run.testerEmail,
          },
        });
      }

      // Sync screenshotUrl to TestCase if provided
      if (item.screenshotUrl !== undefined) {
        await this.prisma.testCase.update({
          where: { id: item.testCaseId },
          data: { screenshotUrl: item.screenshotUrl || null },
        });
      }
    }

    return this.findOne(runId);
  }

  async completeRun(runId: string, status: RunStatus = RunStatus.COMPLETED) {
    await this.findOne(runId);
    return this.prisma.testRun.update({
      where: { id: runId },
      data: { status },
    });
  }

  async createAutomationRun(projectId: string, dto: CreateAutomationRunDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const title = dto.title || `Test Run - ${new Date().toISOString().substring(0, 19).replace('T', ' ')}`;

    // Resolve case codes to testCaseId
    const caseCodes = dto.results.map((r) => r.caseCode);
    const existingCases = await this.prisma.testCase.findMany({
      where: {
        code: { in: caseCodes },
        suite: { projectId },
      },
    });

    const caseMap = new Map(existingCases.map((c) => [c.code, c.id]));

    // Create TestRun record
    const testRun = await this.prisma.testRun.create({
      data: {
        projectId,
        title,
        version: dto.version || 'v1.0.0',
        environment: dto.environment || 'STAGING',
        executedBy: dto.executedBy || 'QA Tester',
        testerEmail: dto.testerEmail || 'tester@company.com',
        status: RunStatus.COMPLETED,
      },
    });

    // Create TestResult records with Jira Bug details
    const resultsData = dto.results
      .filter((r) => caseMap.has(r.caseCode))
      .map((r) => {
        const bugUrl = r.jiraBugUrl || (r.jiraBugKey ? `https://company.atlassian.net/browse/${r.jiraBugKey}` : null);
        return {
          testRunId: testRun.id,
          testCaseId: caseMap.get(r.caseCode)!,
          status: r.status,
          executionMs: r.durationMs ?? null,
          errorMessage: r.errorMessage ?? null,
          executedBy: dto.executedBy || null,
          testerEmail: dto.testerEmail || null,
          jiraBugKey: r.jiraBugKey || null,
          jiraBugUrl: bugUrl,
          screenshotUrl: r.screenshotUrl || null,
        };
      });

    if (resultsData.length > 0) {
      await this.prisma.testResult.createMany({
        data: resultsData,
      });
    }

    return this.findOne(testRun.id);
  }

  async findAllByProject(projectId: string) {
    return this.prisma.testRun.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { results: true },
        },
        results: {
          include: {
            testCase: {
              select: {
                id: true,
                code: true,
                title: true,
                type: true,
                priority: true,
                suiteId: true,
                suite: {
                  select: {
                    id: true,
                    name: true,
                    parentId: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async quickRun(projectId: string, dto: QuickRunDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const testCase = await this.prisma.testCase.findUnique({
      where: { id: dto.testCaseId },
    });
    if (!testCase) {
      throw new NotFoundException(`TestCase with ID ${dto.testCaseId} not found`);
    }

    const bugUrl = dto.jiraBugUrl || (dto.jiraBugKey ? `https://company.atlassian.net/browse/${dto.jiraBugKey}` : null);

    const testRun = await this.prisma.testRun.create({
      data: {
        projectId,
        title: `Quick Run - ${testCase.code}`,
        version: 'v1.0.0',
        environment: 'STAGING',
        executedBy: dto.executedBy || 'QA Tester',
        testerEmail: 'tester@company.com',
        status: RunStatus.COMPLETED,
      },
    });

    const result = await this.prisma.testResult.create({
      data: {
        testRunId: testRun.id,
        testCaseId: dto.testCaseId,
        status: dto.status,
        executionMs: Math.floor(Math.random() * 500) + 100,
        errorMessage: dto.errorMessage || null,
        executedBy: dto.executedBy || 'QA Tester',
        testerEmail: 'tester@company.com',
        jiraBugKey: dto.jiraBugKey || null,
        jiraBugUrl: bugUrl,
        screenshotUrl: dto.screenshotUrl || null,
      },
    });

    if (dto.screenshotUrl !== undefined) {
      await this.prisma.testCase.update({
        where: { id: dto.testCaseId },
        data: { screenshotUrl: dto.screenshotUrl || null },
      });
    }

    return result;
  }

  async findOne(id: string) {
    const testRun = await this.prisma.testRun.findUnique({
      where: { id },
      include: {
        results: {
          include: {
            testCase: {
              select: {
                id: true,
                code: true,
                title: true,
                type: true,
                priority: true,
                jiraStoryKey: true,
                jiraIssueUrl: true,
                suiteId: true,
                suite: {
                  select: {
                    id: true,
                    name: true,
                    parentId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!testRun) {
      throw new NotFoundException(`TestRun with ID ${id} not found`);
    }

    return testRun;
  }
}

