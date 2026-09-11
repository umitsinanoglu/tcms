import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../common/sequence.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { BulkCreateTestCasesDto } from './dto/bulk-create-test-case.dto';

@Injectable()
export class TestCasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: SequenceService,
  ) {}

  async createBulk(bulkDto: BulkCreateTestCasesDto) {
    const { projectId, items, updateIfExists } = bulkDto;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { suites: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

function findSmartSuiteId(targetName: string, existingSuites: { id: string; name: string }[]): string | null {
  const normTarget = targetName.trim().toLowerCase();
  if (!normTarget) return null;

  // 1. Exact match
  const exact = existingSuites.find((s) => s.name.trim().toLowerCase() === normTarget);
  if (exact) return exact.id;

  // 2. Numeric / code prefix match (e.g. "12_" or "03_")
  const numMatch = normTarget.match(/^(\d+)[\_\-\.\s]/);
  if (numMatch) {
    const numPrefix = numMatch[1];
    const prefixMatch = existingSuites.find((s) => {
      const sNum = s.name.match(/^(\d+)[\_\-\.\s]/);
      return sNum && sNum[1] === numPrefix;
    });
    if (prefixMatch) return prefixMatch.id;
  }

  // 3. Substring inclusion match (e.g. "Para Transferi" vs "12_Para_Transferi - Para Transferi Senaryoları")
  const cleanTarget = normTarget.replace(/^[\d\_\-\.\s]+/, '').replace(/\s*(senaryoları|testleri|modülü|işlemleri)$/i, '').trim();
  if (cleanTarget.length >= 3) {
    const subMatch = existingSuites.find((s) => {
      const sNorm = s.name.toLowerCase();
      return sNorm.includes(cleanTarget) || cleanTarget.includes(sNorm);
    });
    if (subMatch) return subMatch.id;
  }

  // 4. Token overlap match (e.g. keywords like "account", "hesap", "transfer", "kredi")
  const targetTokens = normTarget.split(/[\s_\-\/]+/).filter((t) => t.length >= 4);
  if (targetTokens.length > 0) {
    const tokenMatch = existingSuites.find((s) => {
      const sTokens = s.name.toLowerCase().split(/[\s_\-\/]+/);
      return targetTokens.some((tt) => sTokens.some((st) => st.includes(tt) || tt.includes(st)));
    });
    if (tokenMatch) return tokenMatch.id;
  }

  return null;
}

    // Suite map by name lowercase -> suite ID
    const suiteMap = new Map<string, string>();
    project.suites.forEach((s) => {
      suiteMap.set(s.name.trim().toLowerCase(), s.id);
    });

    // Smartly match or auto-create any missing suites mentioned in import
    for (const item of items) {
      if (item.suiteName && item.suiteName.trim() && !item.suiteId) {
        const key = item.suiteName.trim().toLowerCase();
        let matchedId = suiteMap.get(key);

        if (!matchedId) {
          matchedId = findSmartSuiteId(item.suiteName, project.suites) || undefined;
          if (matchedId) {
            suiteMap.set(key, matchedId);
          }
        }

        if (!matchedId) {
          const newSuite = await this.prisma.suite.create({
            data: {
              name: item.suiteName.trim(),
              projectId: project.id,
            },
          });
          matchedId = newSuite.id;
          suiteMap.set(key, newSuite.id);
          project.suites.push(newSuite as any);
        }
      }
    }

    // Allocate atomic sequential codes in one atomic operation
    const itemsNeedingCodeCount = items.filter((it) => !it.code || !it.code.trim()).length;
    const reservedCodes = itemsNeedingCodeCount > 0
      ? await this.sequenceService.getNextCodesBatch(project.id, project.key, 'TC', itemsNeedingCodeCount)
      : [];

    let codeIndex = 0;
    const processedResults = [];
    let createdCount = 0;
    let updatedCount = 0;

    // Process cases in a transaction
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        let finalSuiteId = item.suiteId;
        if (!finalSuiteId && item.suiteName && item.suiteName.trim()) {
          finalSuiteId = suiteMap.get(item.suiteName.trim().toLowerCase());
        }

        let existingCase = null;
        if (updateIfExists) {
          if (item.code && item.code.trim()) {
            existingCase = await tx.testCase.findUnique({
              where: { code: item.code.trim() },
            });
          }
          if (!existingCase && item.title && item.title.trim()) {
            existingCase = await tx.testCase.findFirst({
              where: {
                projectId: project.id,
                title: item.title.trim(),
              },
            });
          }
        }

        if (existingCase) {
          // Update existing test case
          if (item.steps && item.steps.length > 0) {
            await tx.testStep.deleteMany({
              where: { testCaseId: existingCase.id },
            });
          }

          const updated = await tx.testCase.update({
            where: { id: existingCase.id },
            data: {
              title: item.title || existingCase.title,
              description: item.description !== undefined ? item.description : existingCase.description,
              executionType: item.executionType || existingCase.executionType,
              type: item.type || existingCase.type,
              priority: item.priority || existingCase.priority,
              precondition: item.precondition !== undefined ? item.precondition : existingCase.precondition,
              jiraStoryKey: item.jiraStoryKey !== undefined ? item.jiraStoryKey : existingCase.jiraStoryKey,
              suiteId: finalSuiteId !== undefined ? finalSuiteId : existingCase.suiteId,
              updatedAt: new Date(),
              steps: item.steps && item.steps.length > 0 ? {
                create: item.steps.map((step, idx) => ({
                  stepNumber: step.stepNumber || idx + 1,
                  action: step.action,
                  expectedResult: step.expectedResult || '',
                  attachments: [],
                })),
              } : undefined,
            },
            include: {
              steps: {
                orderBy: { stepNumber: 'asc' },
              },
              suite: true,
            },
          });

          updatedCount++;
          processedResults.push(updated);
        } else {
          // Create new test case
          let code = item.code?.trim();
          if (!code) {
            code = reservedCodes[codeIndex++];
          }

          const createdCase = await tx.testCase.create({
            data: {
              title: item.title,
              description: item.description,
              code,
              executionType: item.executionType || 'MANUAL',
              type: item.type || 'WEB',
              priority: item.priority || 'NORMAL',
              precondition: item.precondition,
              jiraStoryKey: item.jiraStoryKey,
              projectId: project.id,
              suiteId: finalSuiteId || undefined,
              steps: item.steps && item.steps.length > 0 ? {
                create: item.steps.map((step, idx) => ({
                  stepNumber: step.stepNumber || idx + 1,
                  action: step.action,
                  expectedResult: step.expectedResult || '',
                  attachments: [],
                })),
              } : undefined,
            },
            include: {
              steps: {
                orderBy: { stepNumber: 'asc' },
              },
              suite: true,
            },
          });

          createdCount++;
          processedResults.push(createdCase);
        }
      }
    });

    return {
      success: true,
      count: processedResults.length,
      createdCount,
      updatedCount,
      data: processedResults,
    };
  }

  async create(createTestCaseDto: CreateTestCaseDto) {
    let projectKey: string;
    let projectId: string;
    let suiteId: string | null = createTestCaseDto.suiteId || null;

    if (suiteId) {
      const suite = await this.prisma.suite.findUnique({
        where: { id: suiteId },
        include: { project: true },
      });

      if (!suite) {
        throw new NotFoundException(`Suite with ID ${suiteId} not found`);
      }

      projectKey = suite.project.key;
      projectId = suite.projectId;
    } else if (createTestCaseDto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: createTestCaseDto.projectId },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${createTestCaseDto.projectId} not found`);
      }

      projectKey = project.key;
      projectId = project.id;
    } else {
      throw new NotFoundException('Either suiteId or projectId must be provided to create a Test Case');
    }

    // Atomic, race-condition-safe code generation
    const code = createTestCaseDto.code?.trim() || await this.sequenceService.getNextCode(projectId, projectKey, 'TC');

    const { steps, ...caseData } = createTestCaseDto;


    return this.prisma.testCase.create({
      data: {
        ...caseData,
        projectId,
        suiteId: suiteId || undefined,
        code,
        steps: steps && steps.length > 0 ? {
          create: steps.map((step, idx) => ({
            stepNumber: step.stepNumber || idx + 1,
            action: step.action,
            expectedResult: step.expectedResult || '',
            attachments: step.attachments ? JSON.parse(JSON.stringify(step.attachments)) : [],
          })),
        } : undefined,
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });
  }

  async findAllBySuite(suiteId: string) {
    return this.prisma.testCase.findMany({
      where: { suiteId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        results: {
          orderBy: { executedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id },
      include: {
        suite: {
          include: {
            project: true,
          },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        results: {
          orderBy: { executedAt: 'desc' },
          include: {
            testRun: {
              select: {
                id: true,
                title: true,
                version: true,
                environment: true,
                status: true,
                executedBy: true,
              },
            },
          },
        },
      },
    });

    if (!testCase) {
      throw new NotFoundException(`TestCase with ID ${id} not found`);
    }

    return testCase;
  }

  async findByCode(code: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { code },
      include: {
        suite: {
          include: {
            project: true,
          },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        results: {
          orderBy: { executedAt: 'desc' },
          include: {
            testRun: {
              select: {
                id: true,
                title: true,
                version: true,
                environment: true,
                status: true,
                executedBy: true,
              },
            },
          },
        },
      },
    });

    if (!testCase) {
      throw new NotFoundException(`TestCase with code ${code} not found`);
    }

    return testCase;
  }

  async update(id: string, updateTestCaseDto: UpdateTestCaseDto) {
    const { steps, ...caseData } = updateTestCaseDto;

    const cleanCaseData: any = { ...caseData };
    if ('suiteId' in cleanCaseData) {
      cleanCaseData.suiteId =
        cleanCaseData.suiteId && typeof cleanCaseData.suiteId === 'string' && cleanCaseData.suiteId.trim() !== ''
          ? cleanCaseData.suiteId.trim()
          : null;
    }
    if (cleanCaseData.preconditions && !cleanCaseData.precondition) {
      cleanCaseData.precondition = cleanCaseData.preconditions;
    }
    delete cleanCaseData.preconditions;
    delete cleanCaseData.id;

    return this.prisma.$transaction(async (tx) => {
      // If steps are provided, replace existing steps
      if (steps) {
        await tx.testStep.deleteMany({
          where: { testCaseId: id },
        });
      }

      return tx.testCase.update({
        where: { id },
        data: {
          ...cleanCaseData,
          updatedAt: new Date(),
          steps: steps ? {
            create: steps.map((step, idx) => ({
              stepNumber: step.stepNumber || idx + 1,
              action: step.action,
              expectedResult: step.expectedResult || '',
              attachments: step.attachments ? JSON.parse(JSON.stringify(step.attachments)) : [],
            })),
          } : undefined,
        },
        include: {
          suite: {
            include: {
              project: true,
            },
          },
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
          results: {
            orderBy: { executedAt: 'desc' },
            include: {
              testRun: {
                select: {
                  id: true,
                  title: true,
                  version: true,
                  environment: true,
                  status: true,
                  executedBy: true,
                },
              },
            },
          },
        },
      });
    });
  }


  async linkJiraStory(id: string, jiraStoryKey?: string, jiraIssueUrl?: string) {
    await this.findOne(id);
    const generatedUrl = jiraIssueUrl || (jiraStoryKey ? `https://company.atlassian.net/browse/${jiraStoryKey}` : null);

    return this.prisma.testCase.update({
      where: { id },
      data: {
        jiraStoryKey: jiraStoryKey || null,
        jiraIssueUrl: generatedUrl,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Kalite İstatistikleri: Bir test senaryosunun tüm koşum geçmişinden
   * pass rate, flakiness skoru, ortalama süre ve son koşum bilgilerini türetir.
   * TestCase modeli mutate edilmez — tüm veriler TestResult join'inden hesaplanır.
   */
  async getStats(id: string) {
    await this.findOne(id); // existence check

    const results = await this.prisma.testResult.findMany({
      where: { testCaseId: id },
      select: {
        status: true,
        executionMs: true,
        flakyStatus: true,
        executedAt: true,
        testRun: {
          select: { environment: true, version: true },
        },
      },
    });

    const total = results.length;

    if (total === 0) {
      return {
        testCaseId: id,
        totalRuns: 0,
        passRate: null,
        failRate: null,
        skipRate: null,
        blockedRate: null,
        flakyScore: null,
        avgDurationMs: null,
        lastExecutedAt: null,
      };
    }

    const passed  = results.filter((r) => r.status === 'PASSED').length;
    const failed  = results.filter((r) => r.status === 'FAILED').length;
    const skipped = results.filter((r) => r.status === 'SKIPPED').length;
    const blocked = results.filter((r) => r.status === 'BLOCKED').length;
    const flaky   = results.filter((r) => r.flakyStatus === 'FLAKY').length;

    const durations = results
      .map((r) => r.executionMs)
      .filter((ms): ms is number => ms !== null && ms !== undefined);

    const avgDurationMs =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;

    const sortedDates = results
      .map((r) => r.executedAt)
      .sort((a, b) => b.getTime() - a.getTime());

    return {
      testCaseId: id,
      totalRuns: total,
      passRate:    parseFloat(((passed  / total) * 100).toFixed(1)),
      failRate:    parseFloat(((failed  / total) * 100).toFixed(1)),
      skipRate:    parseFloat(((skipped / total) * 100).toFixed(1)),
      blockedRate: parseFloat(((blocked / total) * 100).toFixed(1)),
      flakyScore:  parseFloat(((flaky   / total) * 100).toFixed(1)),
      avgDurationMs,
      lastExecutedAt: sortedDates[0] ?? null,
    };
  }

  /**
   * Koşum Geçmişi: Bir test senaryosuna ait son N koşumun özetini döner.
   * Her kayıt hangi TestRun kapsamında çalıştığını ve sonucunu içerir.
   */
  async getHistory(id: string, limit = 20) {
    await this.findOne(id); // existence check

    const results = await this.prisma.testResult.findMany({
      where: { testCaseId: id },
      orderBy: { executedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        executionMs: true,
        errorMessage: true,
        flakyStatus: true,
        retries: true,
        environment: true,
        platform: true,
        appVersion: true,
        device: true,
        userProfile: true,
        customerType: true,
        screenshotUrl: true,
        jiraBugKey: true,
        jiraBugUrl: true,
        executedBy: true,
        executedAt: true,
        testRun: {
          select: {
            id: true,
            title: true,
            version: true,
            environment: true,
            status: true,
            executedBy: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      testCaseId: id,
      total: results.length,
      history: results,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.testCase.delete({
      where: { id },
    });
  }
}
