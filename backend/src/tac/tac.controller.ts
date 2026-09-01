import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TACService } from './tac.service';
import { AppiumHealthDto } from './dto/tac-trigger.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Test Automation Center (TAC)')
@Controller('api/v1/tac')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.AUTOMATION_ENGINEER)
export class TACController {
  constructor(private readonly tacService: TACService) {}

  @Get('health')
  @ApiOperation({ summary: 'TAC Sunucu Sağlık ve Bağlantı Kontrolü' })
  checkHealth() {
    return this.tacService.checkHealth();
  }

  @Get('devices')
  @ApiOperation({ summary: 'TAC Kayıtlı Cihaz Kataloğunu Getir' })
  getDevices() {
    return this.tacService.getDevices();
  }

  @Get('devices/scan')
  @ApiOperation({ summary: 'Canlı USB ve Emülatör Cihaz Taraması Yap (adb / xcrun simctl)' })
  scanDevices() {
    return this.tacService.scanDevices();
  }

  @Post('devices/health')
  @Roles(Role.ADMIN, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'Appium Sunucu Sağlık Kontrolü' })
  checkAppiumHealth(@Body() dto: AppiumHealthDto) {
    return this.tacService.checkAppiumHealth(dto);
  }

  @Get('specs')
  @ApiOperation({ summary: 'TAC İçerisindeki Spec Dosyaları ve Test Case Kodlarını Listele' })
  getSpecs() {
    return this.tacService.getSpecs();
  }

  @Get('specs/plans')
  @ApiOperation({ summary: 'TAC Test Planlarını Getir' })
  getPlans() {
    return this.tacService.getPlans();
  }

  @Get('runs')
  @ApiOperation({ summary: 'TAC Koşularını Listele' })
  getRuns() {
    return this.tacService.getRuns();
  }

  @Get('runs/:runId')
  @ApiOperation({ summary: 'TAC Tekil Koşu Detayını Getir' })
  getRunDetails(@Param('runId') runId: string) {
    return this.tacService.getRunDetails(runId);
  }

  @Post('runs/:runId/stop')
  @Roles(Role.ADMIN, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'TAC Üzerinde Çalışan Koşuyu Durdur (Abort)' })
  stopRun(@Param('runId') runId: string) {
    return this.tacService.stopRun(runId);
  }

  @Get('defects')
  @ApiOperation({ summary: 'TAC Defect Kayıtlarını Listele' })
  getDefects() {
    return this.tacService.getDefects();
  }
}
