import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiHeader } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import {
  UpdateSystemSettingsDto,
  LdapConfigDto,
  TestLdapConnectionDto,
  CreateApiKeyDto,
} from './dto/settings.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';

@ApiTags('Settings & Administration Hub')
@Controller('api/v1/settings')
@UseGuards(RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // 1. System Settings
  @Get('system')
  @ApiOperation({ summary: 'Genel sistem ayarlarını getir' })
  getSystemSettings() {
    return this.settingsService.getSystemSettings();
  }

  @Patch('system')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Genel sistem ayarlarını güncelle (Yalnızca Admin)' })
  updateSystemSettings(@Body() dto: UpdateSystemSettingsDto) {
    return this.settingsService.updateSystemSettings(dto);
  }

  // 2. LDAP Settings & Operations
  @Get('ldap')
  @Roles(Role.ADMIN, Role.TEST_LEAD)
  @ApiOperation({ summary: 'LDAP / Active Directory yapılandırmasını getir' })
  getLdapConfig() {
    return this.settingsService.getLdapConfig();
  }

  @Patch('ldap')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'LDAP yapılandırmasını kaydet (Yalnızca Admin)' })
  updateLdapConfig(@Body() dto: LdapConfigDto) {
    return this.settingsService.updateLdapConfig(dto);
  }

  @Post('ldap/test')
  @Roles(Role.ADMIN, Role.TEST_LEAD)
  @ApiOperation({ summary: 'LDAP sunucu bağlantısını test et (Ping)' })
  testLdapConnection(@Body() dto: TestLdapConnectionDto) {
    return this.settingsService.testLdapConnection(dto);
  }

  @Post('ldap/sync')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'LDAP kullanıcı ve gruplarını şimdi senkronize et (Yalnızca Admin)' })
  syncLdapUsers() {
    return this.settingsService.syncLdapUsers();
  }

  // 3. API Keys
  @Get('api-keys')
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'Sistemdeki API anahtarlarını listele' })
  getApiKeys() {
    return this.settingsService.getApiKeys();
  }

  @Post('api-keys')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Yeni API anahtarı oluştur (Yalnızca Admin)' })
  createApiKey(@Body() dto: CreateApiKeyDto, @CurrentUser() user: RequestUser) {
    return this.settingsService.createApiKey(dto, user?.name || 'Sistem Yöneticisi');
  }

  @Delete('api-keys/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'API anahtarını iptal et / sil (Yalnızca Admin)' })
  @ApiParam({ name: 'id', description: 'API Anahtarı ID' })
  revokeApiKey(@Param('id') id: string) {
    return this.settingsService.revokeApiKey(id);
  }

  // 4. Active Sessions
  @Get('sessions')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Aktif kullanıcı oturumlarını listele (Yalnızca Admin)' })
  getActiveSessions(@CurrentUser() user: RequestUser) {
    return this.settingsService.getActiveSessions(user?.id);
  }

  @Delete('sessions/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Belirli bir kullanıcı oturumunu sonlandır (Yalnızca Admin)' })
  @ApiParam({ name: 'id', description: 'Oturum ID' })
  terminateSession(@Param('id') id: string) {
    return this.settingsService.terminateSession(id);
  }

  @Post('sessions/terminate-all-others')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mevcut oturum haricindeki tüm aktif oturumları sonlandır (Yalnızca Admin)' })
  terminateAllOtherSessions(@CurrentUser() user: RequestUser) {
    return this.settingsService.terminateAllOtherSessions(user?.id);
  }

  // 5. Field & Grid Customizations
  @Get('field-customizations')
  @ApiOperation({ summary: 'Tüm modüllerin alan ve kolon özelleştirme yapılandırmasını getir' })
  getFieldCustomizations() {
    return this.settingsService.getFieldCustomizations();
  }

  @Patch('field-customizations')
  @Roles(Role.ADMIN, Role.TEST_LEAD)
  @ApiOperation({ summary: 'Alan ve kolon özelleştirme yapılandırmasını güncelle' })
  updateFieldCustomizations(@Body() dto: any) {
    return this.settingsService.updateFieldCustomizations(dto);
  }

  @Post('field-customizations/reset')
  @Roles(Role.ADMIN, Role.TEST_LEAD)
  @ApiOperation({ summary: 'Alan özelleştirmelerini fabrika varsayılanlarına sıfırla' })
  resetFieldCustomizations(@Body('moduleId') moduleId?: string) {
    return this.settingsService.resetFieldCustomizations(moduleId);
  }
}

