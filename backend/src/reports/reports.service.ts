import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Escape CSV string and format for Excel with quotes
   */
  private escapeCsv(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

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

  /**
   * CSV EXPORT BUILDERS (with UTF-8 BOM for Turkish char support in Excel)
   */
  generateProjectCsv(data: any): string {
    const BOM = '\uFEFF';
    const headers = [
      'Test Kodu',
      'Test Başlığı',
      'Suite / Modül',
      'Öncelik',
      'Platform / Tip',
      'Yürütme Türü',
      'Son Koşum Durumu',
      'Jira Story',
      'Jira Bug',
      'Hata Detayı',
      'Süre (ms)',
      'Ön Koşullar',
      'Adım Sayısı',
      'Son Koşum Tarihi',
    ];

    const rows = data.testCases.map((tc: any) => [
      this.escapeCsv(tc.code),
      this.escapeCsv(tc.title),
      this.escapeCsv(tc.suiteName),
      this.escapeCsv(tc.priority),
      this.escapeCsv(tc.type),
      this.escapeCsv(tc.executionType),
      this.escapeCsv(tc.latestStatus),
      this.escapeCsv(tc.jiraStoryKey || ''),
      this.escapeCsv(tc.latestJiraBugKey || ''),
      this.escapeCsv(tc.latestErrorMessage || ''),
      this.escapeCsv(tc.latestExecutionMs || ''),
      this.escapeCsv(tc.precondition || ''),
      this.escapeCsv(tc.stepsCount),
      this.escapeCsv(tc.latestExecutedAt ? new Date(tc.latestExecutedAt).toLocaleString('tr-TR') : ''),
    ]);

    return BOM + [headers.map((h) => this.escapeCsv(h)).join(','), ...rows.map((r: string[]) => r.join(','))].join('\r\n');
  }

  generateRunCsv(data: any): string {
    const BOM = '\uFEFF';
    const headers = [
      'Test Kodu',
      'Test Başlığı',
      'Suite / Modül',
      'Öncelik',
      'Test Tipi',
      'Yürütme Türü',
      'Sonuç Durumu',
      'Koşum Süresi (ms)',
      'Jira Bug',
      'Hata Mesajı',
      'Test Eden',
      'Koşum Tarihi',
    ];

    const rows = data.results.map((r: any) => [
      this.escapeCsv(r.testCaseCode),
      this.escapeCsv(r.testCaseTitle),
      this.escapeCsv(r.suiteName),
      this.escapeCsv(r.priority),
      this.escapeCsv(r.type),
      this.escapeCsv(r.executionType),
      this.escapeCsv(r.status),
      this.escapeCsv(r.executionMs || ''),
      this.escapeCsv(r.jiraBugKey || ''),
      this.escapeCsv(r.errorMessage || ''),
      this.escapeCsv(r.executedBy || ''),
      this.escapeCsv(r.executedAt ? new Date(r.executedAt).toLocaleString('tr-TR') : ''),
    ]);

    return BOM + [headers.map((h) => this.escapeCsv(h)).join(','), ...rows.map((r: string[]) => r.join(','))].join('\r\n');
  }

  /**
   * HTML / PRINT REPORT BUILDERS (Standalone responsive HTML with rich styles)
   */
  generateProjectHtml(data: any): string {
    const p = data.project;
    const m = data.metrics;
    const dateStr = new Date(data.generatedAt).toLocaleString('tr-TR');
    const rStatus = data.readiness?.status || 'GO';
    const rScore = data.readiness?.score || 100;
    const rReason = data.readiness?.reason || 'Kalite hedefleri sağlandı.';
    const rColor = rStatus === 'GO' ? '#10b981' : rStatus === 'CAUTION' ? '#f59e0b' : '#f43f5e';
    const rTitle = rStatus === 'GO' ? 'CANLIYA YAYINA UYGUN (GO)' : rStatus === 'CAUTION' ? 'ŞARTLI & RİSKLİ YAYIN (CAUTION)' : 'YAYINA UYGUN DEĞİL (NO-GO)';

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>TCMS Yönetici Test Raporu - ${p.name}</title>
  <style>
    :root {
      --primary: #b83a4b;
      --bg: #0b0f17;
      --card-bg: #141821;
      --border: #232b3b;
      --text: #f1f5f9;
      --text-muted: #8e9bb0;
      --passed: #10b981;
      --failed: #f43f5e;
      --blocked: #f59e0b;
      --untested: #64748b;
    }
    @media print {
      body { background: #fff !important; color: #000 !important; }
      .card { border: 1px solid #ccc !important; background: #fff !important; color: #000 !important; page-break-inside: avoid; }
      .no-print { display: none !important; }
      .text-muted { color: #555 !important; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd !important; color: #000 !important; }
      .readiness-box { border: 2px solid #000 !important; color: #000 !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 32px 24px; line-height: 1.5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 20px; margin-bottom: 24px; }
    .title-group h1 { font-size: 24px; font-weight: 800; color: #fff; }
    .title-group p { color: var(--text-muted); font-size: 13px; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-key { background: rgba(184, 58, 75, 0.2); color: #f87171; border: 1px solid rgba(184, 58, 75, 0.4); }
    .btn-print { background: var(--primary); color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    
    .readiness-box { background: var(--card-bg); border-left: 6px solid ${rColor}; border: 1px solid var(--border); border-left-width: 6px; border-radius: 12px; padding: 18px 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
    .readiness-verdict { font-size: 18px; font-weight: 800; color: ${rColor}; }
    .readiness-desc { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
    .readiness-score { font-size: 28px; font-weight: 900; color: #fff; text-align: right; }
    
    .grid-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .metric-val { font-size: 30px; font-weight: 800; margin-top: 6px; }
    .metric-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600; }
    .progress-bar-bg { height: 8px; background: #232b3b; border-radius: 4px; overflow: hidden; margin-top: 12px; display: flex; }
    .progress-fill { height: 100%; }
    
    .section-title { font-size: 16px; font-weight: 700; margin: 32px 0 14px 0; display: flex; align-items: center; gap: 8px; }
    
    .grid-channels { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .channel-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
    .channel-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
    
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
    th { background: rgba(0,0,0,0.25); text-align: left; padding: 10px 12px; font-weight: 700; color: var(--text-muted); border-bottom: 1px solid var(--border); }
    td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .status-PASSED { color: var(--passed); font-weight: 700; }
    .status-FAILED { color: var(--failed); font-weight: 700; }
    .status-BLOCKED { color: var(--blocked); font-weight: 700; }
    .status-UNTESTED { color: var(--untested); }
    .tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.08); }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); text-align: center; font-size: 12px; color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-group">
        <div style="display: flex; align-items: center; gap: 10px;">
          <h1>${p.name}</h1>
          <span class="badge badge-key">${p.key}</span>
        </div>
        <p>Banka Test Planı Yönetici Kalite ve Yürütme Raporu • Oluşturulma: ${dateStr}</p>
      </div>
      <button class="btn-print no-print" onclick="window.print()">Raporu Yazdır / PDF</button>
    </div>

    <!-- Go/No-Go Decision Banner -->
    <div class="readiness-box">
      <div>
        <div class="readiness-verdict">${rTitle}</div>
        <div class="readiness-desc">${rReason}</div>
      </div>
      <div class="readiness-score">
        %${m.passRate}
        <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Başarı Oranı</div>
      </div>
    </div>

    <!-- Executive Metrics Grid -->
    <div class="grid-metrics">
      <div class="card">
        <div class="metric-label">Toplam Test & Kapsam</div>
        <div class="metric-val" style="color: #fff;">${m.totalCases}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Koşulan: ${m.executedTotal} (%${m.totalCases > 0 ? Math.round((m.executedTotal / m.totalCases) * 100) : 0})</div>
      </div>
      <div class="card">
        <div class="metric-label">Genel Kalite & Başarı</div>
        <div class="metric-val" style="color: ${m.passRate >= 85 ? 'var(--passed)' : m.passRate >= 70 ? 'var(--blocked)' : 'var(--failed)'};">
          %${m.passRate}
        </div>
        <div class="progress-bar-bg">
          <div class="progress-fill" style="width: ${m.passRate}%; background: var(--passed);"></div>
          <div class="progress-fill" style="width: ${(m.failed / (m.totalCases || 1)) * 100}%; background: var(--failed);"></div>
          <div class="progress-fill" style="width: ${(m.blocked / (m.totalCases || 1)) * 100}%; background: var(--blocked);"></div>
        </div>
      </div>
      <div class="card">
        <div class="metric-label">Aksiyon Gereken (Hatalı/Bloke)</div>
        <div class="metric-val" style="color: ${m.failed > 0 ? 'var(--failed)' : 'var(--passed)'};">${m.failed} Hata</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${m.blocked} Bloke Senaryo</div>
      </div>
      <div class="card">
        <div class="metric-label">Otomasyon Oranı</div>
        <div class="metric-val" style="color: #38bdf8;">%${data.automation?.percentage || 0}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${data.automation?.automation || 0} Otomasyon / ${data.automation?.manual || 0} Manuel</div>
      </div>
    </div>

    <!-- Banking Channel Health -->
    <div class="section-title">🏦 Banka Sistem & Kanal Sağlık Matrisi</div>
    <div class="grid-channels">
      ${(data.channels || [])
        .map(
          (ch: any) => `
        <div class="channel-card">
          <div class="channel-title">${ch.name}</div>
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 22px; font-weight: 800; color: ${ch.passRate >= 80 ? 'var(--passed)' : ch.passRate >= 60 ? 'var(--blocked)' : 'var(--failed)'};">%${ch.passRate}</span>
            <span style="font-size: 12px; color: var(--text-muted);">${ch.passed}/${ch.total} Geçti</span>
          </div>
          <div class="progress-bar-bg" style="margin-top: 8px;">
            <div class="progress-fill" style="width: ${ch.passRate}%; background: var(--passed);"></div>
            <div class="progress-fill" style="width: ${(ch.failed / (ch.total || 1)) * 100}%; background: var(--failed);"></div>
          </div>
        </div>
      `,
        )
        .join('')}
    </div>

    <!-- Suite Level Breakdown -->
    <div class="section-title">📁 Modül & Suite Bazlı Sağlık Durumu</div>
    <div class="card" style="padding: 0; overflow: hidden;">
      <table>
        <thead>
          <tr>
            <th>Suite / Modül Adı</th>
            <th>Toplam Senaryo</th>
            <th>Başarılı</th>
            <th>Başarısız</th>
            <th>Bloke</th>
            <th>Koşulmamış</th>
            <th>Başarı Oranı</th>
          </tr>
        </thead>
        <tbody>
          ${(data.suites || [])
            .map(
              (s: any) => `
            <tr>
              <td style="font-weight: 600;">${s.name}</td>
              <td>${s.totalCases}</td>
              <td class="status-PASSED">${s.passed}</td>
              <td class="status-FAILED">${s.failed}</td>
              <td class="status-BLOCKED">${s.blocked}</td>
              <td class="status-UNTESTED">${s.untested}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 700; width: 35px;">%${s.passRate}</span>
                  <div style="flex: 1; height: 6px; background: #232b3b; border-radius: 3px; overflow: hidden;">
                    <div style="width: ${s.passRate}%; height: 100%; background: var(--passed);"></div>
                  </div>
                </div>
              </td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      TCMS - Test Case Management System • Bankacılık Yönetici Raporlama Çerçevesi
    </div>
  </div>
</body>
</html>`;
  }

  generateRunHtml(data: any): string {
    const r = data.run;
    const m = data.metrics;
    const dateStr = new Date(r.createdAt).toLocaleString('tr-TR');

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>TCMS Koşum Raporu - ${r.title}</title>
  <style>
    :root {
      --primary: #e11d48;
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --passed: #10b981;
      --failed: #f43f5e;
      --blocked: #f59e0b;
      --skipped: #64748b;
    }
    @media print {
      body { background: #fff !important; color: #000 !important; }
      .card { border: 1px solid #ccc !important; background: #fff !important; color: #000 !important; }
      .no-print { display: none !important; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd !important; color: #000 !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 32px 24px; line-height: 1.5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 20px; margin-bottom: 24px; }
    .title-group h1 { font-size: 24px; font-weight: 800; }
    .title-group p { color: var(--text-muted); font-size: 13px; margin-top: 4px; }
    .btn-print { background: var(--primary); color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .grid-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .metric-val { font-size: 30px; font-weight: 800; margin-top: 6px; }
    .metric-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: rgba(0,0,0,0.2); text-align: left; padding: 10px 12px; font-weight: 700; color: var(--text-muted); border-bottom: 1px solid var(--border); }
    td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
    .status-PASSED { color: var(--passed); font-weight: 700; }
    .status-FAILED { color: var(--failed); font-weight: 700; }
    .status-BLOCKED { color: var(--blocked); font-weight: 700; }
    .status-SKIPPED { color: var(--skipped); }
    .tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.08); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-group">
        <h1>${r.title}</h1>
        <p>Proje: ${r.projectName} (${r.projectKey}) • Ortam: ${r.environment} • Versiyon: ${r.version} • Tarih: ${dateStr}</p>
      </div>
      <button class="btn-print no-print" onclick="window.print()">Raporu Yazdır / PDF</button>
    </div>

    <div class="grid-metrics">
      <div class="card">
        <div class="metric-label">Toplam Koşulan Test</div>
        <div class="metric-val">${m.total}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Test Eden: ${r.executedBy}</div>
      </div>
      <div class="card">
        <div class="metric-label">Başarı Oranı</div>
        <div class="metric-val" style="color: ${m.passRate >= 75 ? 'var(--passed)' : 'var(--failed)'};">%${m.passRate}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Toplam Süre: ${Math.round(m.totalExecutionMs / 1000)}s</div>
      </div>
      <div class="card">
        <div class="metric-label">Koşum Durumu</div>
        <div style="margin-top: 8px; font-size: 14px; font-weight: 700; color: #38bdf8;">${r.status}</div>
      </div>
      <div class="card">
        <div class="metric-label">Sonuç Özeti</div>
        <div style="display: flex; gap: 10px; margin-top: 8px; font-size: 13px;">
          <span class="status-PASSED">✓ ${m.passed}</span>
          <span class="status-FAILED">✕ ${m.failed}</span>
          <span class="status-BLOCKED">⊘ ${m.blocked}</span>
          <span class="status-SKIPPED">○ ${m.skipped}</span>
        </div>
      </div>
    </div>

    <h2 style="font-size: 18px; margin: 24px 0 12px 0;">Koşulan Test Senaryoları ve Hata Kayıtları</h2>
    <div class="card" style="padding: 0; overflow: hidden;">
      <table>
        <thead>
          <tr>
            <th>Kod</th>
            <th>Başlık</th>
            <th>Modül</th>
            <th>Sonuç</th>
            <th>Süre</th>
            <th>Hata / Jira Bug</th>
          </tr>
        </thead>
        <tbody>
          ${data.results
            .map(
              (res: any) => `
            <tr>
              <td style="font-family: monospace; font-weight: 700;">${res.testCaseCode}</td>
              <td>${res.testCaseTitle}</td>
              <td style="color: var(--text-muted);">${res.suiteName}</td>
              <td class="status-${res.status}">${res.status}</td>
              <td>${res.executionMs ? `${res.executionMs} ms` : '-'}</td>
              <td>
                ${res.errorMessage ? `<div style="color: #f87171; font-size: 11px;">${res.errorMessage}</div>` : ''}
                ${res.jiraBugKey ? `<span class="tag" style="background: rgba(239,68,68,0.2); color: #f87171; margin-top: 2px;">${res.jiraBugKey}</span>` : '-'}
              </td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
  }
}
