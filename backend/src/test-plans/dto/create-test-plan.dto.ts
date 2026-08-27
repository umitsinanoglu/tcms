import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanStatus } from '@prisma/client';

export class CreateTestPlanDto {
  @ApiProperty({ description: 'Test Planı Başlığı', example: 'Sprint 24 Regresyon Test Planı' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Test Planı Açıklaması', example: 'Ödeme ve havale modülleri kapsamlı uçtan uca test planı' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Hedef Sürüm', default: 'v1.0.0', example: 'v2.4.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: 'Hedef Test Ortamı', default: 'STAGING', example: 'STAGING' })
  @IsString()
  @IsOptional()
  environment?: string;

  @ApiPropertyOptional({ enum: PlanStatus, default: PlanStatus.ACTIVE, description: 'Test Plan Durumu' })
  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;

  @ApiPropertyOptional({ description: 'Kapsam ve Yapı Taşları (Bileşenler/Modüller)', example: 'Ödeme Ağ Geçidi, Kimlik Doğrulama, Hesap Özeti' })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiPropertyOptional({ description: 'Gereksinimler ve Jira Kayıtları', example: 'PROJ-102, PROJ-105, REQ-88' })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiProperty({ description: 'Bağlı Olduğu Test Projesi ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty()
  projectId: string;
}
