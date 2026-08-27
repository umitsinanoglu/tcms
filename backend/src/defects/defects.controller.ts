import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DefectsService } from './defects.service';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';
import { UpdateDefectStatusDto } from './dto/update-defect-status.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, DefectStatus, DefectSeverity } from '@prisma/client';

@ApiTags('Defects')
@Controller('api/v1/defects')
@UseGuards(RolesGuard)
export class DefectsController {
  constructor(private readonly defectsService: DefectsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Yeni defect / hata kaydı oluştur' })
  @ApiResponse({ status: 201, description: 'Defect başarıyla oluşturuldu' })
  create(@Body() createDefectDto: CreateDefectDto) {
    return this.defectsService.create(createDefectDto);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Bir projeye ait tüm defectleri filtreli listele' })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  @ApiQuery({ name: 'status', enum: DefectStatus, required: false })
  @ApiQuery({ name: 'severity', enum: DefectSeverity, required: false })
  @ApiQuery({ name: 'environment', type: String, required: false })
  @ApiQuery({ name: 'assignedTo', type: String, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  findAllByProject(
    @Param('projectId') projectId: string,
    @Query('status') status?: DefectStatus,
    @Query('severity') severity?: DefectSeverity,
    @Query('environment') environment?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
  ) {
    return this.defectsService.findAllByProject(projectId, {
      status,
      severity,
      environment,
      assignedTo,
      search,
    });
  }

  @Get('stats/project/:projectId')
  @ApiOperation({ summary: 'Proje bazlı defect istatistikleri ve dağılımlarını getir' })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  getStatsByProject(@Param('projectId') projectId: string) {
    return this.defectsService.getStatsByProject(projectId);
  }

  @Post('sync-failed/project/:projectId')
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Başarısız test sonuçlarından otomatik defect oluştur / senkronize et' })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  syncFromFailedResults(@Param('projectId') projectId: string) {
    return this.defectsService.syncFromFailedResults(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tek bir defectin detayını getir' })
  @ApiParam({ name: 'id', description: 'Defect UUID' })
  findOne(@Param('id') id: string) {
    return this.defectsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Defect bilgilerini güncelle' })
  @ApiParam({ name: 'id', description: 'Defect UUID' })
  update(@Param('id') id: string, @Body() updateDefectDto: UpdateDefectDto) {
    return this.defectsService.update(id, updateDefectDto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Defect durumunu hızlıca güncelle (Açık, İnceleniyor, Çözüldü, Kapatıldı vb.)' })
  @ApiParam({ name: 'id', description: 'Defect UUID' })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateDefectStatusDto) {
    return this.defectsService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEST_LEAD)
  @ApiOperation({ summary: 'Defect kaydını sil (Admin & Test Lead)' })
  @ApiParam({ name: 'id', description: 'Defect UUID' })
  remove(@Param('id') id: string) {
    return this.defectsService.remove(id);
  }
}
