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

  @ApiProperty({ example: 'data:image/png;base64,...', description: 'Ekran görüntüsü (URL veya Base64)', required: false })
  @IsString()
  @IsOptional()
  screenshotUrl?: string;

  @ApiProperty({ example: 'iOS', description: 'Test Platformu', required: false })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiProperty({ example: 'iphone15', description: 'Cihaz takma adı veya modeli', required: false })
  @IsString()
  @IsOptional()
  device?: string;

  @ApiProperty({ example: 'v2.4.0', description: 'Uygulama versiyonu', required: false })
  @IsString()
  @IsOptional()
  appVersion?: string;

  @ApiProperty({ example: 'UAT', description: 'Test ortamı', required: false })
  @IsString()
  @IsOptional()
  environment?: string;

  @ApiProperty({ example: 'UMIT', description: 'Kullanıcı Profili', required: false })
  @IsString()
  @IsOptional()
  userProfile?: string;

  @ApiProperty({ example: 'BIREYSEL', description: 'Müşteri Tipi', required: false })
  @IsString()
  @IsOptional()
  customerType?: string;

  @ApiProperty({ example: 'STABLE', description: 'Flaky durumu', required: false })
  @IsString()
  @IsOptional()
  flakyStatus?: string;
}

export class CreateAutomationRunDto {
  @ApiProperty({ example: 'tcms-run-uuid-1234', description: 'Mevcut TestRun ID (varsa güncellenir)', required: false })
  @IsString()
  @IsOptional()
  testRunId?: string;

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

  @ApiProperty({ example: 'iOS', description: 'Platform (iOS / Android)', required: false })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiProperty({ example: 'iphone15', description: 'Cihaz Takma Adı', required: false })
  @IsString()
  @IsOptional()
  deviceAlias?: string;

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
