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
}

export class SaveExecutionResultsDto {
  @ApiProperty({ type: [TestCaseResultItemDto], description: 'Test sonuçları dizisi' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseResultItemDto)
  results: TestCaseResultItemDto[];
}
