import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { TestRunsService } from './test-runs.service';
import { CreateAutomationRunDto } from './dto/automation-run-result.dto';
import { CreateTestRunDto } from './dto/create-test-run.dto';
import { SaveExecutionResultsDto } from './dto/save-execution-results.dto';
import { CompleteRunDto } from './dto/complete-run.dto';
import { QuickRunDto } from './dto/quick-run.dto';

@ApiTags('Test Runs & Execution')
@Controller('api/v1')
export class TestRunsController {
  constructor(private readonly testRunsService: TestRunsService) {}

  @Post('projects/:projectId/runs')
  @ApiOperation({ summary: 'Manuel Test Run Koşusu Başlat' })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  @ApiResponse({ status: 201, description: 'IN_PROGRESS durumunda TestRun oluşturuldu' })
  createRun(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTestRunDto,
  ) {
    return this.testRunsService.createRun(projectId, dto);
  }

  @Post('projects/:projectId/runs/:runId/results')
  @ApiOperation({ summary: 'Test Koşusu Senaryo Sonuçlarını Kaydet (TestCase Level)' })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  @ApiParam({ name: 'runId', description: 'TestRun UUID' })
  saveResults(
    @Param('projectId') projectId: string,
    @Param('runId') runId: string,
    @Body() dto: SaveExecutionResultsDto,
  ) {
    return this.testRunsService.saveResults(projectId, runId, dto);
  }

  @Patch('runs/:runId/complete')
  @ApiOperation({ summary: 'Test Koşusunu Tamamla (COMPLETED veya ABORTED yap)' })
  @ApiParam({ name: 'runId', description: 'TestRun UUID' })
  completeRun(
    @Param('runId') runId: string,
    @Body() dto: CompleteRunDto,
  ) {
    return this.testRunsService.completeRun(runId, dto.status);
  }

  @Patch('projects/:projectId/runs/:runId/complete')
  @ApiOperation({ summary: 'Test Koşusunu Tamamla (Proje parametreli route)' })
  completeRunScoped(
    @Param('runId') runId: string,
    @Body() dto: CompleteRunDto,
  ) {
    return this.testRunsService.completeRun(runId, dto.status);
  }

  @Post('projects/:projectId/quick-run')
  @ApiOperation({ summary: 'Tekil Test Case için Hızlı Koşu ve Sonuç Kaydı' })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  quickRun(
    @Param('projectId') projectId: string,
    @Body() dto: QuickRunDto,
  ) {
    return this.testRunsService.quickRun(projectId, dto);
  }

  @Post('projects/:projectId/runs/automation')
  @ApiOperation({ summary: 'Otomasyon Koşu Sonuçlarını Kaydet (CLI / Automation Ingestion)' })
  createAutomationRun(
    @Param('projectId') projectId: string,
    @Body() dto: CreateAutomationRunDto,
  ) {
    return this.testRunsService.createAutomationRun(projectId, dto);
  }

  @Get('projects/:projectId/runs')
  @ApiOperation({ summary: 'Projenin tüm test koşularını listele' })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  findAllByProject(@Param('projectId') projectId: string) {
    return this.testRunsService.findAllByProject(projectId);
  }

  @Get('runs/:runId')
  @ApiOperation({ summary: 'Tek bir test koşusu detayını ve sonuçlarını getir' })
  @ApiParam({ name: 'runId', description: 'TestRun UUID' })
  findOne(@Param('runId') runId: string) {
    return this.testRunsService.findOne(runId);
  }
}

