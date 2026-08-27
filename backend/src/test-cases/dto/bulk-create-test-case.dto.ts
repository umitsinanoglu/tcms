import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { TestType, Priority } from '@prisma/client';
import { CreateTestStepDto } from './test-step.dto';

export class BulkTestCaseItemDto {
  @ApiProperty({ example: 'TC-101', description: 'Senaryo Kodu (Opsiyonel)', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Geçerli kullanıcı adı ve şifre ile giriş yapma', description: 'Test Case başlığı' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Başarılı giriş senaryosu doğrulaması', description: 'Açıklama', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Kimlik Doğrulama', description: 'Modül / Klasör Adı (Suite)', required: false })
  @IsString()
  @IsOptional()
  suiteName?: string;

  @ApiProperty({ example: 'uuid-suite-id', description: 'Mevcut Suite ID', required: false })
  @IsUUID()
  @IsOptional()
  suiteId?: string;

  @ApiProperty({ example: 'MANUAL', description: 'Test yöntemi', required: false })
  @IsString()
  @IsOptional()
  executionType?: string;

  @ApiProperty({ enum: TestType, example: TestType.WEB, description: 'Test tipi', required: false })
  @IsEnum(TestType)
  @IsOptional()
  type?: TestType;

  @ApiProperty({ enum: Priority, example: Priority.NORMAL, description: 'Öncelik seviyesi', required: false })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiProperty({ example: 'Sistemde kayıtlı kullanıcı olmalıdır', description: 'Ön koşul', required: false })
  @IsString()
  @IsOptional()
  precondition?: string;

  @ApiProperty({ example: 'PROJ-101', description: 'Jira Story Key', required: false })
  @IsString()
  @IsOptional()
  jiraStoryKey?: string;

  @ApiProperty({ type: [CreateTestStepDto], description: 'Test adımları', required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTestStepDto)
  @IsOptional()
  steps?: CreateTestStepDto[];
}

export class BulkCreateTestCasesDto {
  @ApiProperty({ example: 'uuid-project-id', description: 'Proje ID' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ type: [BulkTestCaseItemDto], description: 'Eklenecek Test Senaryoları Listesi' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkTestCaseItemDto)
  items: BulkTestCaseItemDto[];
}
