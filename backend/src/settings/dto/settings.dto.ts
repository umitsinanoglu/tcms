import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSystemSettingsDto {
  @ApiPropertyOptional({ description: 'Sistem Başlığı', example: 'TCMS Test Case Management System' })
  @IsOptional()
  @IsString()
  systemTitle?: string;

  @ApiPropertyOptional({ description: 'Varsayılan Test Ortamı', example: 'STAGING' })
  @IsOptional()
  @IsString()
  defaultEnvironment?: string;

  @ApiPropertyOptional({ description: 'Varsayılan Test Tipi', example: 'WEB' })
  @IsOptional()
  @IsString()
  defaultTestType?: string;

  @ApiPropertyOptional({ description: 'Otomatik Koşum Zaman Aşımı (dakika)', example: 60 })
  @IsOptional()
  @IsNumber()
  runTimeoutMinutes?: number;

  @ApiPropertyOptional({ description: 'Log Saklama Süresi (gün)', example: 90 })
  @IsOptional()
  @IsNumber()
  logRetentionDays?: number;

  @ApiPropertyOptional({ description: 'Oturum Zaman Aşımı (saat)', example: 24 })
  @IsOptional()
  @IsNumber()
  sessionTimeoutHours?: number;

  @ApiPropertyOptional({ description: 'Çoklu Oturum İzni', example: true })
  @IsOptional()
  @IsBoolean()
  allowMultipleSessions?: boolean;
}

export class LdapConfigDto {
  @ApiProperty({ description: 'LDAP Sunucu URL', example: 'ldap://ldap.company.local:389' })
  @IsString()
  serverUrl: string;

  @ApiProperty({ description: 'Base DN', example: 'dc=company,dc=local' })
  @IsString()
  baseDn: string;

  @ApiProperty({ description: 'Bind DN', example: 'cn=admin,dc=company,dc=local' })
  @IsString()
  bindDn: string;

  @ApiPropertyOptional({ description: 'Bind Şifresi', example: 'AdminPass123!' })
  @IsOptional()
  @IsString()
  bindPassword?: string;

  @ApiPropertyOptional({ description: 'Kullanıcı Arama Filtresi', example: '(sAMAccountName={username})' })
  @IsOptional()
  @IsString()
  userFilter?: string;

  @ApiPropertyOptional({ description: 'SSL / TLS Kullanımı', example: false })
  @IsOptional()
  @IsBoolean()
  useSsl?: boolean;

  @ApiPropertyOptional({ description: 'LDAP Entegrasyonu Aktif mi?', example: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Otomatik Senkronizasyon Aralığı (saat)', example: 12 })
  @IsOptional()
  @IsNumber()
  syncIntervalHours?: number;

  @ApiPropertyOptional({ description: 'Grup ve Rol Eşleştirmeleri', example: [{ ldapGroup: 'QA_Admins', tcmsRole: 'ADMIN' }] })
  @IsOptional()
  @IsArray()
  groupMappings?: { ldapGroup: string; tcmsRole: string }[];
}

export class TestLdapConnectionDto {
  @ApiProperty({ description: 'LDAP Sunucu URL', example: 'ldap://ldap.company.local:389' })
  @IsString()
  serverUrl: string;

  @ApiProperty({ description: 'Base DN', example: 'dc=company,dc=local' })
  @IsString()
  baseDn: string;

  @ApiProperty({ description: 'Bind DN', example: 'cn=admin,dc=company,dc=local' })
  @IsString()
  bindDn: string;

  @ApiPropertyOptional({ description: 'Bind Şifresi' })
  @IsOptional()
  @IsString()
  bindPassword?: string;

  @ApiPropertyOptional({ description: 'SSL Kullan' })
  @IsOptional()
  @IsBoolean()
  useSsl?: boolean;
}

export class CreateApiKeyDto {
  @ApiProperty({ description: 'API Anahtarı Adı', example: 'Jenkins CI/CD Pipeline Token' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Yetki Kapsamı', example: 'write:runs', enum: ['read:all', 'write:runs', 'write:results', 'admin:all'] })
  @IsString()
  scope: string;

  @ApiPropertyOptional({ description: 'Geçerlilik Süresi (gün cinsinden, 0 = süresiz)', example: 90 })
  @IsOptional()
  @IsNumber()
  expiresInDays?: number;
}

export class GridColumnConfigDto {
  @ApiProperty({ description: 'Kolon ID', example: 'title' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Görünen Başlık', example: 'Test Planı Başlığı' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ description: 'Varsayılan Başlık', example: 'Test Planı' })
  @IsOptional()
  @IsString()
  defaultLabel?: string;

  @ApiProperty({ description: 'Görünürlük', example: true })
  @IsBoolean()
  visible: boolean;

  @ApiProperty({ description: 'Sıralama İndeksi', example: 0 })
  @IsNumber()
  order: number;

  @ApiPropertyOptional({ description: 'Kolon Genişliği', example: '220px' })
  @IsOptional()
  @IsString()
  width?: string;

  @ApiPropertyOptional({ description: 'Metin Hizalama', example: 'left', enum: ['left', 'center', 'right'] })
  @IsOptional()
  @IsString()
  align?: 'left' | 'center' | 'right';

  @ApiPropertyOptional({ description: 'Sıralanabilir mi?', example: true })
  @IsOptional()
  @IsBoolean()
  sortable?: boolean;

  @ApiPropertyOptional({ description: 'Sabit Kolon mu?', example: 'none', enum: ['left', 'right', 'none'] })
  @IsOptional()
  @IsString()
  isSticky?: 'left' | 'right' | 'none';

  @ApiPropertyOptional({ description: 'Sistem Kolonu mu?', example: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({ description: 'Alan Açıklaması' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ModuleGridConfigDto {
  @ApiProperty({ description: 'Modül ID', example: 'test-plans' })
  @IsString()
  moduleId: string;

  @ApiProperty({ description: 'Modül Adı', example: 'Test Planları' })
  @IsString()
  moduleName: string;

  @ApiProperty({ description: 'Tablo Yoğunluğu', example: 'normal', enum: ['comfortable', 'normal', 'compact'] })
  @IsString()
  density: 'comfortable' | 'normal' | 'compact';

  @ApiPropertyOptional({ description: 'Varsayılan Sıralama Kolonu', example: 'createdAt' })
  @IsOptional()
  @IsString()
  defaultSortBy?: string;

  @ApiPropertyOptional({ description: 'Varsayılan Sıralama Yönü', example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  defaultSortOrder?: 'asc' | 'desc';

  @ApiProperty({ description: 'Kolon Yapılandırmaları', type: [GridColumnConfigDto] })
  @IsArray()
  columns: GridColumnConfigDto[];
}

export class UpdateFieldCustomizationDto {
  @ApiProperty({ description: 'Modül bazlı grid ayarları' })
  @IsOptional()
  modules?: Record<string, ModuleGridConfigDto>;

  @ApiPropertyOptional({ description: 'Özel Tanımlı Etiketler', example: ['Regresyon', 'Smoke', 'Kritik'] })
  @IsOptional()
  @IsArray()
  customTags?: string[];
}

