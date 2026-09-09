import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
        testPlanId: dto.testPlanId || null,
        status: RunStatus.IN_PROGRESS,
      },
    });
  }

  async saveResults(projectId: string, runId: string, dto: SaveExecutionResultsDto) {
    const run = await this.findOne(runId);

    if (!dto.results || dto.results.length === 0) {
      return run;
    }

    const testCaseIds = dto.results.map((r) => r.testCaseId);

    // 1 single batch query to get all existing results for these cases in this run
    const existingResults = await this.prisma.testResult.findMany({
      where: {
        testRunId: runId,
        testCaseId: { in: testCaseIds },
      },
    });

    const existingMap = new Map<string, (typeof existingResults)[0]>();
    existingResults.forEach((res) => {
      existingMap.set(res.testCaseId, res);
    });

    // 🔒 Read-only guard:
    // Tamamlanmış veya iptal edilmiş koşumlarda test senaryosu durumu (status), süre veya ortam bilgileri değiştirilemez, yeni test eklenemez.
    // Ancak inceleme ve kanıt amacıyla mevcut sonuçlara yalnızca yorum (errorMessage), ekran resmi (screenshotUrl) veya Jira bug linki eklenebilir.
    if (run.status !== RunStatus.IN_PROGRESS) {
      for (const item of dto.results) {
        const existing = existingMap.get(item.testCaseId);
        if (!existing) {
          throw new ForbiddenException(
            `TestRun '${run.title}' is ${run.status}. New test results cannot be added to a closed run.`,
          );
        }
        if (item.status && item.status !== existing.status) {
          throw new ForbiddenException(
            `TestRun '${run.title}' is ${run.status}. Test execution status (${existing.status}) cannot be changed.`,
          );
        }
      }

      // Sadece inceleme notu / ekran resmi / Jira bilgilerini güncelle
      await this.prisma.$transaction(async (tx) => {
        for (const item of dto.results) {
          const existing = existingMap.get(item.testCaseId);
          if (existing) {
            const bugUrl =
              item.jiraBugUrl || (item.jiraBugKey ? `https://company.atlassian.net/browse/${item.jiraBugKey}` : existing.jiraBugUrl);
            await tx.testResult.update({
              where: { id: existing.id },
              data: {
                errorMessage: item.errorMessage !== undefined ? item.errorMessage : existing.errorMessage,
                screenshotUrl: item.screenshotUrl !== undefined ? item.screenshotUrl : existing.screenshotUrl,
                jiraBugKey: item.jiraBugKey !== undefined ? item.jiraBugKey : existing.jiraBugKey,
                jiraBugUrl: bugUrl,
              },
            });
          }
        }
      });

      return this.findOne(runId);
    }

    // Execute batch writes in single transaction
    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.results) {
        const bugUrl = item.jiraBugUrl || (item.jiraBugKey ? `https://company.atlassian.net/browse/${item.jiraBugKey}` : null);
        const existing = existingMap.get(item.testCaseId);

        if (existing) {
          await tx.testResult.update({
            where: { id: existing.id },
            data: {
              status: item.status,
              executionMs: item.executionMs ?? null,
              errorMessage: item.errorMessage ?? null,
              jiraBugKey: item.jiraBugKey ?? null,
              jiraBugUrl: bugUrl,
              screenshotUrl: item.screenshotUrl ?? existing.screenshotUrl ?? null,
              environment: item.environment ?? run.environment ?? existing.environment ?? null,
              platform: item.platform ?? existing.platform ?? null,
              appVersion: item.appVersion ?? run.version ?? existing.appVersion ?? null,
              device: item.device ?? existing.device ?? null,
              userProfile: item.userProfile ?? existing.userProfile ?? null,
              customerType: item.customerType ?? existing.customerType ?? null,
              flakyStatus: item.flakyStatus ?? existing.flakyStatus ?? null,
              retries: item.retries ?? existing.retries ?? 0,
              executedBy: run.executedBy,
              testerEmail: run.testerEmail,
              executedAt: new Date(),
            },
          });
        } else {
          await tx.testResult.create({
            data: {
              testRunId: runId,
              testCaseId: item.testCaseId,
              status: item.status,
              executionMs: item.executionMs ?? null,
              errorMessage: item.errorMessage ?? null,
              jiraBugKey: item.jiraBugKey ?? null,
              jiraBugUrl: bugUrl,
              screenshotUrl: item.screenshotUrl ?? null,
              environment: item.environment ?? run.environment ?? null,
              platform: item.platform ?? null,
              appVersion: item.appVersion ?? run.version ?? null,
              device: item.device ?? null,
              userProfile: item.userProfile ?? null,
              customerType: item.customerType ?? null,
              flakyStatus: item.flakyStatus ?? null,
              retries: item.retries ?? 0,
              executedBy: run.executedBy,
              testerEmail: run.testerEmail,
            },
          });
        }

        // Note: screenshotUrl is intentionally NOT synced back to TestCase.
        // TestCase is a static template; screenshots should be set via the TestCase editor.
      }
    });

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
      select: { id: true, name: true, key: true },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const title = dto.title || `Test Run - ${new Date().toISOString().substring(0, 19).replace('T', ' ')}`;

    // Resolve case codes to testCaseId in single batch query
    const caseCodes = (dto.results || []).map((r) => r.caseCode);
    const existingCases = await this.prisma.testCase.findMany({
      where: {
        code: { in: caseCodes },
        OR: [{ projectId }, { suite: { projectId } }],
      },
      select: { id: true, code: true },
    });

    const caseMap = new Map(existingCases.map((c) => [c.code, c.id]));

    let targetRunId = dto.testRunId;

    if (targetRunId) {
      // 🔒 Read-only guard: only append to an IN_PROGRESS run;
      // if the referenced run is already COMPLETED/ABORTED, ignore it and create a new one.
      const existingRun = await this.prisma.testRun.findUnique({ where: { id: targetRunId } });
      if (existingRun && existingRun.status === RunStatus.IN_PROGRESS) {
        // Keep targetRunId — results will be appended
      } else {
        // Either not found or already closed → create a fresh run
        targetRunId = undefined;
      }
    }

    if (!targetRunId) {
      // Create TestRun record
      const testRun = await this.prisma.testRun.create({
        data: {
          projectId,
          title,
          version: dto.version || 'v1.0.0',
          environment: dto.environment || 'STAGING',
          executedBy: dto.executedBy || 'TAC Automation Engine',
          testerEmail: dto.testerEmail || 'automation@ttb.com.tr',
          status: RunStatus.COMPLETED,
        },
      });
      targetRunId = testRun.id;
    }

    // Pre-fetch all existing results for targetRunId and matched cases
    const targetCaseIds = Array.from(caseMap.values());
    const existingResults = await this.prisma.testResult.findMany({
      where: {
        testRunId: targetRunId,
        testCaseId: { in: targetCaseIds },
      },
    });
    const existingResMap = new Map(existingResults.map((r) => [r.testCaseId, r]));

    // Batch process in transaction
    await this.prisma.$transaction(async (tx) => {
      for (const r of (dto.results || [])) {
        const caseId = caseMap.get(r.caseCode);
        if (!caseId) continue;

        const bugUrl = r.jiraBugUrl || (r.jiraBugKey ? `https://company.atlassian.net/browse/${r.jiraBugKey}` : null);
        const platform = r.platform || dto.platform || 'iOS';
        const device = r.device || dto.deviceAlias || 'iphone15';

        const existingRes = existingResMap.get(caseId);

        if (existingRes) {
          await tx.testResult.update({
            where: { id: existingRes.id },
            data: {
              status: r.status,
              executionMs: r.durationMs ?? existingRes.executionMs,
              errorMessage: r.errorMessage ?? existingRes.errorMessage,
              platform,
              device,
              environment: r.environment || dto.environment || existingRes.environment,
              appVersion: r.appVersion || dto.version || existingRes.appVersion,
              userProfile: r.userProfile ?? existingRes.userProfile,
              customerType: r.customerType ?? existingRes.customerType,
              flakyStatus: r.flakyStatus ?? existingRes.flakyStatus,
              jiraBugKey: r.jiraBugKey ?? existingRes.jiraBugKey,
              jiraBugUrl: bugUrl ?? existingRes.jiraBugUrl,
              screenshotUrl: r.screenshotUrl ?? existingRes.screenshotUrl,
              executedAt: new Date(),
            },
          });
        } else {
          await tx.testResult.create({
            data: {
              testRunId: targetRunId,
              testCaseId: caseId,
              status: r.status,
              executionMs: r.durationMs ?? null,
              errorMessage: r.errorMessage ?? null,
              platform,
              device,
              environment: r.environment || dto.environment || 'STAGING',
              appVersion: r.appVersion || dto.version || 'v1.0.0',
              userProfile: r.userProfile || null,
              customerType: r.customerType || null,
              flakyStatus: r.flakyStatus || null,
              executedBy: dto.executedBy || 'TAC Automation Engine',
              testerEmail: dto.testerEmail || 'automation@ttb.com.tr',
              jiraBugKey: r.jiraBugKey || null,
              jiraBugUrl: bugUrl,
              screenshotUrl: r.screenshotUrl || null,
            },
          });
        }

        // Note: screenshotUrl is intentionally NOT synced back to TestCase.
      }
    });

    return this.findOne(targetRunId);
  }


  async findAllByProject(projectId: string) {
    return this.prisma.testRun.findMany({
      where: { projectId },
      include: {
        testPlan: {
          select: {
            id: true,
            title: true,
            version: true,
            environment: true,
          },
        },
        _count: {
          select: { results: true },
        },
        results: {
          include: {
            defects: {
              select: {
                id: true,
                key: true,
                title: true,
                status: true,
                severity: true,
              },
            },
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

    const version = dto.version?.trim() || 'v1.0.0';
    const environment = dto.environment?.trim() || 'STAGING';

    const testRun = await this.prisma.testRun.create({
      data: {
        projectId,
        title: `Run - ${testCase.code} (${version} / ${environment})`,
        version,
        environment,
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
        environment,
        platform: dto.platform || (testCase.type === 'IOS' ? 'iOS' : testCase.type === 'ANDROID' ? 'Android' : 'Web'),
        appVersion: dto.appVersion || version,
        device: dto.device || (testCase.type === 'IOS' ? 'iphone14' : testCase.type === 'ANDROID' ? 's24' : 'Desktop Chrome'),
        userProfile: dto.userProfile || 'UMIT',
        customerType: dto.customerType || 'BIREYSEL',
        flakyStatus: dto.flakyStatus || null,
      },
    });

    // Note: screenshotUrl is intentionally NOT synced back to TestCase.

    return result;
  }

  async deleteRun(runId: string) {
    await this.findOne(runId);

    // Explicitly clean up all defects generated from or linked to this run
    await this.prisma.defect.deleteMany({
      where: {
        OR: [
          { testRunId: runId },
          { testResult: { testRunId: runId } },
        ],
      },
    });

    return this.prisma.testRun.delete({
      where: { id: runId },
    });
  }

  async findOne(id: string) {
    const testRun = await this.prisma.testRun.findUnique({
      where: { id },
      include: {
        testPlan: {
          select: {
            id: true,
            title: true,
            version: true,
            environment: true,
            scope: true,
            requirements: true,
          },
        },
        results: {
          include: {
            defects: {
              select: {
                id: true,
                key: true,
                title: true,
                status: true,
                severity: true,
              },
            },
            testCase: {
              select: {
                id: true,
                code: true,
                title: true,
                description: true,
                precondition: true,
                executionType: true,
                type: true,
                priority: true,
                jiraStoryKey: true,
                jiraIssueUrl: true,
                screenshotUrl: true,
                suiteId: true,
                suite: {
                  select: {
                    id: true,
                    name: true,
                    parentId: true,
                  },
                },
                steps: {
                  orderBy: { stepNumber: 'asc' },
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

