import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { DefectSeverity, DefectStatus } from '@prisma/client';

export class UpdateDefectDto {
  @ApiPropertyOptional({ description: 'Hata Başlığı' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Hata Açıklaması / Detayları' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DefectSeverity })
  @IsOptional()
  @IsEnum(DefectSeverity)
  severity?: DefectSeverity;

  @ApiPropertyOptional({ enum: DefectStatus })
  @IsOptional()
  @IsEnum(DefectStatus)
  status?: DefectStatus;

  @ApiPropertyOptional({ description: 'İlişkili Test Senaryosu ID (UUID)' })
  @IsOptional()
  @IsUUID()
  testCaseId?: string;

  @ApiPropertyOptional({ description: 'İlişkili Test Koşumu ID (UUID)' })
  @IsOptional()
  @IsUUID()
  testRunId?: string;

  @ApiPropertyOptional({ description: 'İlişkili Test Sonucu ID (UUID)' })
  @IsOptional()
  @IsUUID()
  testResultId?: string;

  @ApiPropertyOptional({ description: 'Atanan Kişi (İsim / E-posta)' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Raporlayan Kişi' })
  @IsOptional()
  @IsString()
  reportedBy?: string;

  @ApiPropertyOptional({ description: 'Test Ortamı (DEV, TEST, STAGING, PROD vb.)' })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional({ description: 'Kanal / Platform (WEB, MOBILE, API, vb.)' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({ description: 'Jira Hata Anahtarı' })
  @IsOptional()
  @IsString()
  jiraBugKey?: string;

  @ApiPropertyOptional({ description: 'Jira Hata Bağlantısı' })
  @IsOptional()
  @IsString()
  jiraBugUrl?: string;

  @ApiPropertyOptional({ description: 'Çözüm Notları' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Çözülme Tarihi' })
  @IsOptional()
  @IsDateString()
  resolvedAt?: string;
}
