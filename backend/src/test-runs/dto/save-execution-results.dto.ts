import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ResultStatus } from '@prisma/client';

export class TestCaseResultItemDto {
  @ApiProperty({ example: 'case-uuid', description: 'TestCase UUID' })
  @IsString()
  @IsNotEmpty()
  testCaseId: string;

  @ApiProperty({ enum: ResultStatus, example: ResultStatus.PASSED, description: 'Test sonucu' })
  @IsEnum(ResultStatus)
  @IsNotEmpty()
  status: ResultStatus;

  @ApiProperty({ example: 1200, description: 'Süre (ms)', required: false })
  @IsInt()
  @IsOptional()
  executionMs?: number;

  @ApiProperty({ example: 'Login button does not respond', description: 'Hata mesajı (FAILED durumunda)', required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({ example: 'MOB-550', description: 'Oluşturulan Jira Bug Key', required: false })
  @IsString()
  @IsOptional()
  jiraBugKey?: string;

  @ApiProperty({ example: 'https://company.atlassian.net/browse/MOB-550', description: 'Jira Bug URL', required: false })
  @IsString()
  @IsOptional()
  jiraBugUrl?: string;

  @ApiProperty({ example: 'data:image/png;base64,...', description: 'Ekran görüntüsü (URL veya Base64)', required: false })
  @IsString()
  @IsOptional()
  screenshotUrl?: string;

  @ApiProperty({ example: 'UAT', description: 'Ortam (UAT / TEST / PROD)', required: false })
  @IsString()
  @IsOptional()
  environment?: string;

  @ApiProperty({ example: 'iOS', description: 'Platform (iOS / Android / Web / API)', required: false })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiProperty({ example: 'v1.2.0 (106)', description: 'Uygulama Versiyonu', required: false })
  @IsString()
  @IsOptional()
  appVersion?: string;

  @ApiProperty({ example: 'iphone14', description: 'Cihaz Aliası (iphone 15 / s24)', required: false })
  @IsString()
  @IsOptional()
  device?: string;

  @ApiProperty({ example: 'UMIT', description: 'USER Profili (UMIT / ZEYNEP)', required: false })
  @IsString()
  @IsOptional()
  userProfile?: string;

  @ApiProperty({ example: 'BIREYSEL', description: 'Müşteri Tipi (BIREYSEL / KURUMSAL)', required: false })
  @IsString()
  @IsOptional()
  customerType?: string;

  @ApiProperty({ example: '+1 retry', description: 'Flaky Durumu (+1 retry)', required: false })
  @IsString()
  @IsOptional()
  flakyStatus?: string;

  @ApiProperty({ example: 1, description: 'Retry sayısı', required: false })
  @IsInt()
  @IsOptional()
  retries?: number;
}

export class SaveExecutionResultsDto {
  @ApiProperty({ type: [TestCaseResultItemDto], description: 'Test sonuçları dizisi' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseResultItemDto)
  results: TestCaseResultItemDto[];
}
