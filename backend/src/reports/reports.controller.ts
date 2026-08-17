import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportExportFormat, ReportExportQueryDto } from './dto/report-query.dto';

@ApiTags('Reports & Analytics')
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('projects/:projectId/summary')
  @ApiOperation({ summary: 'Proje / Test Planı genel rapor ve analitik özeti' })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  getProjectSummary(@Param('projectId') projectId: string) {
    return this.reportsService.getProjectReportSummary(projectId);
  }

  @Get('projects/:projectId/export')
  @ApiOperation({ summary: 'Proje test planı raporunu dışa aktar (CSV, HTML, JSON)' })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  @ApiQuery({ name: 'format', enum: ReportExportFormat, required: false })
  async exportProjectReport(
    @Param('projectId') projectId: string,
    @Query() query: ReportExportQueryDto,
    @Res() res: Response,
  ) {
    const summary = await this.reportsService.getProjectReportSummary(projectId);
    const format = query.format || ReportExportFormat.JSON;
    const safeKey = summary.project.key || 'TCMS';
    const dateTag = new Date().toISOString().split('T')[0];

    if (format === ReportExportFormat.CSV) {
      const csv = this.reportsService.generateProjectCsv(summary);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeKey}_test_plan_report_${dateTag}.csv"`,
      );
      return res.send(csv);
    }

    if (format === ReportExportFormat.HTML) {
      const html = this.reportsService.generateProjectHtml(summary);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    // Default JSON
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.json(summary);
  }

  @Get('runs/:runId/summary')
  @ApiOperation({ summary: 'Test koşusu (Test Run) detaylı rapor özeti' })
  @ApiParam({ name: 'runId', description: 'TestRun UUID' })
  getRunSummary(@Param('runId') runId: string) {
    return this.reportsService.getTestRunReportSummary(runId);
  }

  @Get('runs/:runId/export')
  @ApiOperation({ summary: 'Test koşusu raporunu dışa aktar (CSV, HTML, JSON)' })
  @ApiParam({ name: 'runId', description: 'TestRun UUID' })
  @ApiQuery({ name: 'format', enum: ReportExportFormat, required: false })
  async exportRunReport(
    @Param('runId') runId: string,
    @Query() query: ReportExportQueryDto,
    @Res() res: Response,
  ) {
    const summary = await this.reportsService.getTestRunReportSummary(runId);
    const format = query.format || ReportExportFormat.JSON;
    const safeTitle = summary.run.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateTag = new Date().toISOString().split('T')[0];

    if (format === ReportExportFormat.CSV) {
      const csv = this.reportsService.generateRunCsv(summary);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Run_${safeTitle}_${dateTag}.csv"`,
      );
      return res.send(csv);
    }

    if (format === ReportExportFormat.HTML) {
      const html = this.reportsService.generateRunHtml(summary);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    // Default JSON
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.json(summary);
  }

  @Get('suites/:suiteId/summary')
  @ApiOperation({ summary: 'Suite / Modül rapor özeti' })
  @ApiParam({ name: 'suiteId', description: 'Suite UUID' })
  getSuiteSummary(@Param('suiteId') suiteId: string) {
    return this.reportsService.getSuiteReportSummary(suiteId);
  }

  @Get('test-cases/:caseId/summary')
  @ApiOperation({ summary: 'Test Case şartname ve koşum geçmişi rapor özeti' })
  @ApiParam({ name: 'caseId', description: 'TestCase UUID' })
  getTestCaseSummary(@Param('caseId') caseId: string) {
    return this.reportsService.getTestCaseReportSummary(caseId);
  }
}
