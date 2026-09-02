import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PlanStatus } from '@prisma/client';

export class BulkTestPlanItemDto {
  @ApiProperty({ description: 'Test Planı Başlığı', example: 'Sprint 24 Regresyon Test Planı' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Test Planı Açıklaması' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Hedef Sürüm', default: 'v1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: 'Hedef Test Ortamı', default: 'STAGING' })
  @IsString()
  @IsOptional()
  environment?: string;

  @ApiPropertyOptional({ enum: PlanStatus, default: PlanStatus.ACTIVE })
  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;

  @ApiPropertyOptional({ description: 'Kapsam' })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiPropertyOptional({ description: 'Gereksinimler / Jira Keys' })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiPropertyOptional({ description: 'Plana dahil edilecek Test Senaryosu ID listesi', type: [String] })
  @IsOptional()
  caseIds?: string[];
}

export class BulkCreateTestPlansDto {
  @ApiProperty({ description: 'Proje ID', example: 'uuid-project-id' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ type: [BulkTestPlanItemDto], description: 'Eklenecek Test Planları Listesi' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkTestPlanItemDto)
  items: BulkTestPlanItemDto[];
}
