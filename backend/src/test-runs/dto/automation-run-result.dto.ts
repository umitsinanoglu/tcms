import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ResultStatus } from '@prisma/client';

export class TestCaseResultItemDto {
  @ApiProperty({ example: 'MOB-TC-1', description: 'Test Case Kodu' })
  @IsString()
  @IsNotEmpty()
  caseCode: string;

  @ApiProperty({ enum: ResultStatus, example: ResultStatus.PASSED, description: 'Koşu durumu (PASSED, FAILED, SKIPPED, BLOCKED)' })
  @IsEnum(ResultStatus)
  status: ResultStatus;


  @ApiProperty({ example: 450, description: 'Milisaniye cinsinden çalışma süresi', required: false })
  @IsInt()
  @IsOptional()
  durationMs?: number;

  @ApiProperty({ example: 'AssertionError: Expected true but got false', description: 'Hata mesajı', required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({ example: 'MOB-991', description: 'Test kalırsa açılan Jira Bug ID (Opsiyonel)', required: false })
  @IsString()
  @IsOptional()
  jiraBugKey?: string;

  @ApiProperty({ example: 'https://company.atlassian.net/browse/MOB-991', description: 'Jira Bug URL', required: false })
  @IsString()
  @IsOptional()
  jiraBugUrl?: string;
}

export class CreateAutomationRunDto {
  @ApiProperty({ example: 'Sprint 24 Regresyon Koşusu', description: 'Test Koşusu Başlığı', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'v2.4.0-rc1', description: 'ISTQB: Versiyon / Build No', required: false })
  @IsString()
  @IsOptional()
  version?: string = 'v1.0.0';

  @ApiProperty({ example: 'STAGING', description: 'Test Ortamı (STAGING, PROD, DEV)', required: false })
  @IsString()
  @IsOptional()
  environment?: string = 'STAGING';

  @ApiProperty({ example: 'Ahmet Yılmaz (QA)', description: 'ISTQB: Test Yürüten Kişi / Bot', required: false })
  @IsString()
  @IsOptional()
  executedBy?: string = 'QA Tester';

  @ApiProperty({ example: 'ahmet.yilmaz@company.com', description: 'ISTQB: Tester E-posta Adresi', required: false })
  @IsString()
  @IsOptional()
  testerEmail?: string = 'tester@company.com';

  @ApiProperty({ type: [TestCaseResultItemDto], description: 'Toplu test sonuçları dizisi' })
  results: TestCaseResultItemDto[];
}
