import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { DefectSeverity, DefectStatus } from '@prisma/client';

export class CreateDefectDto {
  @ApiProperty({ description: 'Proje ID (UUID)' })
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Hata Başlığı' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Hata Açıklaması / Detayları' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DefectSeverity, default: DefectSeverity.MAJOR })
  @IsOptional()
  @IsEnum(DefectSeverity)
  severity?: DefectSeverity;

  @ApiPropertyOptional({ enum: DefectStatus, default: DefectStatus.OPEN })
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

  @ApiPropertyOptional({ description: 'Test Ortamı (DEV, TEST, STAGING, PROD vb.)', default: 'STAGING' })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional({ description: 'Kanal / Platform (WEB, MOBILE, API, vb.)', default: 'WEB' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({ description: 'Jira Hata Anahtarı (Örn: PROJ-102)' })
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
}
