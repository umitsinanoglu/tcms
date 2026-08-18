import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResultStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class QuickRunDto {
  @ApiProperty({ description: 'TestCase UUID' })
  @IsString()
  @IsNotEmpty()
  testCaseId: string;

  @ApiProperty({ enum: ResultStatus, description: 'Test sonucu (PASSED, FAILED, SKIPPED, BLOCKED)' })
  @IsEnum(ResultStatus)
  status: ResultStatus;

  @ApiPropertyOptional({ description: 'Hata açıklaması (FAILED durumu için)' })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiPropertyOptional({ description: 'Jira Bug Key (Örn: MOB-101)' })
  @IsString()
  @IsOptional()
  jiraBugKey?: string;

  @ApiPropertyOptional({ description: 'Jira Bug URL' })
  @IsString()
  @IsOptional()
  jiraBugUrl?: string;

  @ApiPropertyOptional({ description: 'Testi koşan kullanıcı adı' })
  @IsString()
  @IsOptional()
  executedBy?: string;

  @ApiPropertyOptional({ description: 'Test versiyonu (Örn: v1.0.0)' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: 'Test ortamı (Örn: STAGING, PROD, DEV, QA)' })
  @IsString()
  @IsOptional()
  environment?: string;

  @ApiPropertyOptional({ description: 'Ekran görüntüsü (URL veya Base64)' })
  @IsString()
  @IsOptional()
  screenshotUrl?: string;
}
