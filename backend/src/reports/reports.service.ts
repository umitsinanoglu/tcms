import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CsvExporter } from './exporters/csv.exporter';
import { HtmlExporter } from './exporters/html.exporter';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly csvExporter: CsvExporter,
    private readonly htmlExporter: HtmlExporter,
  ) {}


  /**
   * 1. PROJECT / TEST PLAN LEVEL SUMMARY
   */
  async getProjectReportSummary(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        suites: {
          orderBy: { orderIndex: 'asc' },
          include: {
            cases: {
              include: {
                steps: { orderBy: { stepNumber: 'asc' } },
                results: {
                  orderBy: { executedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        testCases: {
          include: {
            suite: true,
            steps: { orderBy: { stepNumber: 'asc' } },
            results: {
              orderBy: { executedAt: 'desc' },
              take: 1,
            },
          },
        },
        testRuns: {
          orderBy: { createdAt: 'desc' },
          include: {
            results: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const allCases = project.testCases;
    const totalCases = allCases.length;

    // Execution status distribution based on latest execution
    let passed = 0;
    let failed = 0;
    let blocked = 0;
    let skipped = 0;
    let untested = 0;

    // Distributions
    const priorityCounts: Record<string, number> = { BLOCKER: 0, CRITICAL: 0, NORMAL: 0, LOW: 0 };
    const typeCounts: Record<string, number> = {};
    const executionTypeCounts: Record<string, number> = { MANUAL: 0, AUTOMATION: 0 };

    const defects: any[] = [];
    const failedCases: any[] = [];

    allCases.forEach((tc) => {
      // Priority
      if (tc.priority) {
        priorityCounts[tc.priority] = (priorityCounts[tc.priority] || 0) + 1;
      }

      // Type
      if (tc.type) {
        typeCounts[tc.type] = (typeCounts[tc.type] || 0) + 1;
      }

      // Execution Type
      const execType = tc.executionType || 'MANUAL';
      executionTypeCounts[execType] = (executionTypeCounts[execType] || 0) + 1;

      // Status
      const latestResult = tc.results && tc.results.length > 0 ? tc.results[0] : null;
      if (!latestResult) {
        untested++;
      } else {
        switch (latestResult.status) {
          case 'PASSED':
            passed++;
            break;
          case 'FAILED':
            failed++;
            failedCases.push({
              code: tc.code,
              title: tc.title,
              suiteName: tc.suite?.name || 'Kök Dizin',
              priority: tc.priority,
              errorMessage: latestResult.errorMessage,
              jiraBugKey: latestResult.jiraBugKey,
              jiraBugUrl: latestResult.jiraBugUrl,
              executedBy: latestResult.executedBy,
              executedAt: latestResult.executedAt,
            });
            break;
          case 'BLOCKED':
            blocked++;
            break;
          case 'SKIPPED':
            skipped++;
            break;
          default:
            untested++;
        }

        if (latestResult.jiraBugKey) {
          defects.push({
            jiraBugKey: latestResult.jiraBugKey,
            jiraBugUrl: latestResult.jiraBugUrl,
            testCaseCode: tc.code,
            testCaseTitle: tc.title,
            errorMessage: latestResult.errorMessage,
            executedAt: latestResult.executedAt,
          });
        }
      }
    });

    const executedTotal = passed + failed + blocked + skipped;
    const passRate = totalCases > 0 ? Math.round((passed / totalCases) * 100) : 0;
    const executedPassRate = executedTotal > 0 ? Math.round((passed / executedTotal) * 100) : 0;

    // Banking Channel Breakdown
    const channelMapping: Record<string, { key: string; name: string; icon: string }> = {
      MOBILE: { key: 'MOBILE', name: 'Mobil Bankacılık (iOS / Android)', icon: 'Smartphone' },
      IOS: { key: 'MOBILE', name: 'Mobil Bankacılık (iOS / Android)', icon: 'Smartphone' },
      ANDROID: { key: 'MOBILE', name: 'Mobil Bankacılık (iOS / Android)', icon: 'Smartphone' },
      WEB: { key: 'WEB', name: 'Web İnternet Şubesi', icon: 'Globe' },
      API: { key: 'API', name: 'Ana Bankacılık Gtech API', icon: 'Zap' },
      MANUAL: { key: 'DESKTOP', name: 'Ana Bankacılık Masaüstü / Gişe', icon: 'Monitor' },
      OTHER: { key: 'DESKTOP', name: 'Ana Bankacılık Masaüstü / Gişe', icon: 'Monitor' },
      PERFORMANCE: { key: 'API', name: 'Ana Bankacılık Gtech API', icon: 'Zap' },
    };

    const channelStatsMap: Record<string, { key: string; name: string; icon: string; total: number; passed: number; failed: number; blocked: number; untested: number; passRate: number }> = {
      MOBILE: { key: 'MOBILE', name: 'Mobil Bankacılık (iOS / Android)', icon: 'Smartphone', total: 0, passed: 0, failed: 0, blocked: 0, untested: 0, passRate: 0 },
      WEB: { key: 'WEB', name: 'Web İnternet Şubesi', icon: 'Globe', total: 0, passed: 0, failed: 0, blocked: 0, untested: 0, passRate: 0 },
      API: { key: 'API', name: 'Ana Bankacılık Gtech API', icon: 'Zap', total: 0, passed: 0, failed: 0, blocked: 0, untested: 0, passRate: 0 },
      DESKTOP: { key: 'DESKTOP', name: 'Ana Bankacılık Masaüstü / Gişe', icon: 'Monitor', total: 0, passed: 0, failed: 0, blocked: 0, untested: 0, passRate: 0 },
    };

    allCases.forEach((tc) => {
      const chInfo = channelMapping[tc.type] || channelStatsMap.DESKTOP;
      const target = channelStatsMap[chInfo.key];
      target.total++;
      const res = tc.results?.[0];
      if (!res) target.untested++;
      else if (res.status === 'PASSED') target.passed++;
      else if (res.status === 'FAILED') target.failed++;
      else if (res.status === 'BLOCKED') target.blocked++;
      else target.untested++;
    });

    Object.values(channelStatsMap).forEach((ch) => {
      ch.passRate = ch.total > 0 ? Math.round((ch.passed / ch.total) * 100) : 0;
    });

    // Automation Stats
    const manualCount = executionTypeCounts['MANUAL'] || 0;
    const autoCount = executionTypeCounts['AUTOMATION'] || 0;
    const autoPercentage = totalCases > 0 ? Math.round((autoCount / totalCases) * 100) : 0;

    // Readiness & Go / No-Go Decision
    const blockerFailures = failedCases.filter((fc) => fc.priority === 'BLOCKER').length;
    const criticalFailures = failedCases.filter((fc) => fc.priority === 'CRITICAL').length;
    
    let readinessStatus: 'GO' | 'CAUTION' | 'NO_GO' = 'GO';
    let readinessScore = 100;
    let readinessReason = 'Tüm kalite kriterleri sağlandı, canlı sürüme hazır.';

    if (blockerFailures > 0 || passRate < 70) {
      readinessStatus = 'NO_GO';
      readinessScore = Math.min(passRate, 55);
      readinessReason = `${blockerFailures > 0 ? `${blockerFailures} adet Blocker seviye hata var.` : ''} Genel başarı oranı (%${passRate}) canlı çıkış eşiğinin altında.`;
    } else if (criticalFailures > 0 || passRate < 85) {
      readinessStatus = 'CAUTION';
      readinessScore = Math.min(passRate, 80);
      readinessReason = `${criticalFailures > 0 ? `${criticalFailures} adet Kritik hata çözülmeyi bekliyor.` : ''} Dikkatli ve kontrollü sürüm önerilir.`;
    }

    // Build suite tree breakdown
    const suiteStats = project.suites.map((s) => {
      const sCases = s.cases || [];
      const sTotal = sCases.length;
      let sPassed = 0;
      let sFailed = 0;
      let sBlocked = 0;
      let sUntested = 0;

      sCases.forEach((sc) => {
        const res = sc.results && sc.results.length > 0 ? sc.results[0] : null;
        if (!res) sUntested++;
        else if (res.status === 'PASSED') sPassed++;
        else if (res.status === 'FAILED') sFailed++;
        else if (res.status === 'BLOCKED') sBlocked++;
        else sUntested++;
      });

      return {
        id: s.id,
        name: s.name,
        parentId: s.parentId,
        totalCases: sTotal,
        passed: sPassed,
        failed: sFailed,
        blocked: sBlocked,
        untested: sUntested,
        passRate: sTotal > 0 ? Math.round((sPassed / sTotal) * 100) : 0,
      };
    });

    // Top Risky Suites
    const topRiskySuites = [...suiteStats]
      .filter((s) => s.totalCases > 0 && (s.failed > 0 || s.blocked > 0 || s.passRate < 100))
      .sort((a, b) => (b.failed + b.blocked) - (a.failed + a.blocked) || a.passRate - b.passRate)
      .slice(0, 4);

    // Recent test runs
    const recentRuns = project.testRuns.slice(0, 10).map((r) => {
      const results = r.results || [];
      const rPassed = results.filter((res) => res.status === 'PASSED').length;
      const rFailed = results.filter((res) => res.status === 'FAILED').length;
      const rBlocked = results.filter((res) => res.status === 'BLOCKED').length;
      const rTotal = results.length;
      return {
        id: r.id,
        title: r.title,
        version: r.version,
        environment: r.environment,
        status: r.status,
        executedBy: r.executedBy,
        testerEmail: r.testerEmail,
        createdAt: r.createdAt,
        totalResults: rTotal,
        passed: rPassed,
        failed: rFailed,
        blocked: rBlocked,
        passRate: rTotal > 0 ? Math.round((rPassed / rTotal) * 100) : 0,
      };
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        key: project.key,
        description: project.description,
        jiraProjectKey: project.jiraProjectKey,
        createdAt: project.createdAt,
      },
      metrics: {
        totalCases,
        totalSuites: project.suites.length,
        totalRuns: project.testRuns.length,
        passed,
        failed,
        blocked,
        skipped,
        untested,
        executedTotal,
        passRate,
        executedPassRate,
      },
      readiness: {
        status: readinessStatus,
        score: readinessScore,
        reason: readinessReason,
        blockerCount: blockerFailures,
        criticalCount: criticalFailures,
      },
      channels: Object.values(channelStatsMap),
      automation: {
        manual: manualCount,
        automation: autoCount,
        percentage: autoPercentage,
      },
      topRiskySuites,
      distributions: {
        priority: priorityCounts,
        type: typeCounts,
        executionType: executionTypeCounts,
      },
      suites: suiteStats,
      recentRuns,
      failedCases,
      defects,
      testCases: allCases.map((tc) => ({
        id: tc.id,
        code: tc.code,
        title: tc.title,
        description: tc.description,
        type: tc.type,
        priority: tc.priority,
        executionType: tc.executionType,
        suiteName: tc.suite?.name || 'Kök Dizin',
        precondition: tc.precondition,
        stepsCount: tc.steps?.length || 0,
        latestStatus: tc.results?.[0]?.status || 'UNTESTED',
        latestErrorMessage: tc.results?.[0]?.errorMessage || null,
        latestJiraBugKey: tc.results?.[0]?.jiraBugKey || null,
        latestJiraBugUrl: tc.results?.[0]?.jiraBugUrl || null,
        latestExecutionMs: tc.results?.[0]?.executionMs || null,
        latestExecutedAt: tc.results?.[0]?.executedAt || null,
        jiraStoryKey: tc.jiraStoryKey,
        jiraIssueUrl: tc.jiraIssueUrl,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 2. TEST RUN LEVEL SUMMARY
   */
  async getTestRunReportSummary(runId: string) {
    const run = await this.prisma.testRun.findUnique({
      where: { id: runId },
      include: {
        project: true,
        results: {
          include: {
            testCase: {
              include: {
                suite: true,
                steps: { orderBy: { stepNumber: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`Test Run with ID ${runId} not found`);
    }

    const results = run.results || [];
    const total = results.length;
    const passed = results.filter((r) => r.status === 'PASSED').length;
    const failed = results.filter((r) => r.status === 'FAILED').length;
    const blocked = results.filter((r) => r.status === 'BLOCKED').length;
    const skipped = results.filter((r) => r.status === 'SKIPPED').length;

    let totalExecutionMs = 0;
    results.forEach((r) => {
      if (r.executionMs) totalExecutionMs += r.executionMs;
    });
    const avgExecutionMs = total > 0 ? Math.round(totalExecutionMs / total) : 0;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    const defects = results
      .filter((r) => r.jiraBugKey)
      .map((r) => ({
        jiraBugKey: r.jiraBugKey,
        jiraBugUrl: r.jiraBugUrl,
        testCaseCode: r.testCase?.code,
        testCaseTitle: r.testCase?.title,
        errorMessage: r.errorMessage,
        screenshotUrl: r.screenshotUrl,
      }));

    return {
      run: {
        id: run.id,
        title: run.title,
        version: run.version,
        environment: run.environment,
        status: run.status,
        executedBy: run.executedBy,
        testerEmail: run.testerEmail,
        createdAt: run.createdAt,
        projectId: run.projectId,
        projectName: run.project.name,
        projectKey: run.project.key,
      },
      metrics: {
        total,
        passed,
        failed,
        blocked,
        skipped,
        passRate,
        totalExecutionMs,
        avgExecutionMs,
      },
      defects,
      results: results.map((r) => ({
        id: r.id,
        testCaseId: r.testCaseId,
        testCaseCode: r.testCase?.code || 'N/A',
        testCaseTitle: r.testCase?.title || 'Bilinmeyen Senaryo',
        suiteName: r.testCase?.suite?.name || 'Kök Dizin',
        priority: r.testCase?.priority || 'NORMAL',
        type: r.testCase?.type || 'WEB',
        executionType: r.testCase?.executionType || 'MANUAL',
        status: r.status,
        executionMs: r.executionMs,
        errorMessage: r.errorMessage,
        jiraBugKey: r.jiraBugKey,
        jiraBugUrl: r.jiraBugUrl,
        screenshotUrl: r.screenshotUrl,
        executedBy: r.executedBy || run.executedBy,
        testerEmail: r.testerEmail || run.testerEmail,
        executedAt: r.executedAt,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 3. SUITE LEVEL SUMMARY
   */
  async getSuiteReportSummary(suiteId: string) {
    const suite = await this.prisma.suite.findUnique({
      where: { id: suiteId },
      include: {
        project: true,
        cases: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
            results: {
              orderBy: { executedAt: 'desc' },
              take: 1,
            },
          },
        },
        children: {
          include: {
            cases: {
              include: {
                results: { orderBy: { executedAt: 'desc' }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!suite) {
      throw new NotFoundException(`Suite with ID ${suiteId} not found`);
    }

    const testCases = suite.cases || [];
    const total = testCases.length;
    const passed = testCases.filter((c) => c.results?.[0]?.status === 'PASSED').length;
    const failed = testCases.filter((c) => c.results?.[0]?.status === 'FAILED').length;
    const blocked = testCases.filter((c) => c.results?.[0]?.status === 'BLOCKED').length;
    const untested = testCases.filter((c) => !c.results || c.results.length === 0).length;

    return {
      suite: {
        id: suite.id,
        name: suite.name,
        projectId: suite.projectId,
        projectName: suite.project.name,
      },
      metrics: {
        total,
        passed,
        failed,
        blocked,
        untested,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      },
      testCases: testCases.map((tc) => ({
        id: tc.id,
        code: tc.code,
        title: tc.title,
        priority: tc.priority,
        type: tc.type,
        executionType: tc.executionType,
        latestStatus: tc.results?.[0]?.status || 'UNTESTED',
        latestErrorMessage: tc.results?.[0]?.errorMessage || null,
        jiraStoryKey: tc.jiraStoryKey,
        stepsCount: tc.steps?.length || 0,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 4. TEST CASE SPEC SHEET SUMMARY
   */
  async getTestCaseReportSummary(caseId: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id: caseId },
      include: {
        project: true,
        suite: true,
        steps: { orderBy: { stepNumber: 'asc' } },
        results: {
          orderBy: { executedAt: 'desc' },
          include: {
            testRun: true,
          },
        },
      },
    });

    if (!testCase) {
      throw new NotFoundException(`Test case with ID ${caseId} not found`);
    }

    return {
      testCase: {
        id: testCase.id,
        code: testCase.code,
        title: testCase.title,
        description: testCase.description,
        type: testCase.type,
        priority: testCase.priority,
        executionType: testCase.executionType,
        precondition: testCase.precondition,
        jiraStoryKey: testCase.jiraStoryKey,
        jiraIssueUrl: testCase.jiraIssueUrl,
        screenshotUrl: testCase.screenshotUrl,
        createdAt: testCase.createdAt,
        updatedAt: testCase.updatedAt,
        suiteName: testCase.suite?.name || 'Kök Dizin',
        projectName: testCase.project?.name || 'N/A',
      },
      steps: testCase.steps.map((s) => ({
        stepNumber: s.stepNumber,
        action: s.action,
        expectedResult: s.expectedResult,
      })),
      history: testCase.results.map((r) => ({
        id: r.id,
        runTitle: r.testRun?.title || 'Hızlı Koşu',
        environment: r.testRun?.environment || 'STAGING',
        status: r.status,
        executionMs: r.executionMs,
        errorMessage: r.errorMessage,
        jiraBugKey: r.jiraBugKey,
        jiraBugUrl: r.jiraBugUrl,
        executedBy: r.executedBy,
        executedAt: r.executedAt,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  generateProjectCsv(data: any): string {
    return this.csvExporter.generateProjectCsv(data);
  }

  generateRunCsv(data: any): string {
    return this.csvExporter.generateRunCsv(data);
  }

  generateProjectHtml(data: any): string {
    return this.htmlExporter.generateProjectHtml(data);
  }

  generateRunHtml(data: any): string {
    return this.htmlExporter.generateRunHtml(data);
  }
}

