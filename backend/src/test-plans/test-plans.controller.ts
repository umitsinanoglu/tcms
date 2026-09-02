import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TestPlansService } from './test-plans.service';
import { CreateTestPlanDto } from './dto/create-test-plan.dto';
import { UpdateTestPlanDto } from './dto/update-test-plan.dto';
import { BulkCreateTestPlansDto } from './dto/bulk-create-test-plan.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Test Plans')
@Controller('api/v1')
@UseGuards(RolesGuard)
export class TestPlansController {
  constructor(private readonly testPlansService: TestPlansService) {}

  @Post('test-plans/bulk')
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'Excel / CSV ile toplu test planlarını içeri aktar' })
  @ApiResponse({ status: 201, description: 'Test planları toplu olarak oluşturuldu' })
  createBulk(@Body() bulkDto: BulkCreateTestPlansDto) {
    return this.testPlansService.createBulk(bulkDto);
  }

  @Post('test-plans')
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'Yeni test planı oluştur' })
  @ApiResponse({ status: 201, description: 'Test planı başarıyla oluşturuldu' })
  create(@Body() createTestPlanDto: CreateTestPlanDto) {
    return this.testPlansService.create(createTestPlanDto);
  }

  @Get('projects/:projectId/test-plans')
  @ApiOperation({ summary: 'Bir projeye ait tüm test planlarını listele' })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  findAllByProject(@Param('projectId') projectId: string) {
    return this.testPlansService.findAllByProject(projectId);
  }

  @Get('test-plans/:id')
  @ApiOperation({ summary: 'Tek bir test planının detayını ve bağlı koşumlarını getir' })
  @ApiParam({ name: 'id', description: 'Test Planı UUID' })
  findOne(@Param('id') id: string) {
    return this.testPlansService.findOne(id);
  }

  @Patch('test-plans/:id')
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'Test planı bilgilerini güncelle' })
  @ApiParam({ name: 'id', description: 'Test Planı UUID' })
  update(@Param('id') id: string, @Body() updateTestPlanDto: UpdateTestPlanDto) {
    return this.testPlansService.update(id, updateTestPlanDto);
  }

  @Post('test-plans/:id/cases/sync')
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'Test planına bağlı senaryoları topluca senkronize et (güncelle)' })
  @ApiParam({ name: 'id', description: 'Test Planı UUID' })
  syncCases(@Param('id') id: string, @Body('caseIds') caseIds: string[]) {
    return this.testPlansService.syncCases(id, caseIds || []);
  }

  @Post('test-plans/:id/cases')
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'Test planına yeni senaryolar ekle' })
  @ApiParam({ name: 'id', description: 'Test Planı UUID' })
  addCases(@Param('id') id: string, @Body('caseIds') caseIds: string[]) {
    return this.testPlansService.addCases(id, caseIds || []);
  }

  @Delete('test-plans/:id/cases/:caseId')
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'Test planından bir senaryoyu çıkart' })
  @ApiParam({ name: 'id', description: 'Test Planı UUID' })
  @ApiParam({ name: 'caseId', description: 'TestCase UUID' })
  removeCase(@Param('id') id: string, @Param('caseId') caseId: string) {
    return this.testPlansService.removeCase(id, caseId);
  }

  @Delete('test-plans/:id')
  @Roles(Role.ADMIN, Role.TEST_LEAD)
  @ApiOperation({ summary: 'Test planını sil (Admin & Test Lead)' })
  @ApiParam({ name: 'id', description: 'Test Planı UUID' })
  remove(@Param('id') id: string) {
    return this.testPlansService.remove(id);
  }
}
