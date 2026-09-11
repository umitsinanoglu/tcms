import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf, ValidateNested } from 'class-validator';
import { TestType, Priority } from '@prisma/client';
import { CreateTestStepDto } from './test-step.dto';

export class CreateTestCaseDto {
  @ApiProperty({ example: 'TCMS-TC-101', description: 'Özel test case kodu (opsiyonel)', required: false })
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


  @ApiProperty({ example: 'MANUAL', description: 'Test yöntemi (MANUAL veya AUTOMATION)', required: false })
  @IsString()
  @IsOptional()
  executionType?: string = 'MANUAL';

  @ApiProperty({ enum: TestType, example: TestType.WEB, description: 'Test tipi' })
  @IsEnum(TestType)
  @IsOptional()
  type?: TestType = TestType.WEB;

  @ApiProperty({ enum: Priority, example: Priority.CRITICAL, description: 'Öncelik seviyesi' })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority = Priority.NORMAL;

  @ApiProperty({ example: 'Sistemde kayıtlı kullanıcı olmalıdır', description: 'Ön koşul', required: false })
  @IsString()
  @IsOptional()
  precondition?: string;

  @ApiProperty({ example: 'Sistemde kayıtlı kullanıcı olmalıdır', description: 'Ön koşul alternatifi', required: false })
  @IsString()
  @IsOptional()
  preconditions?: string;

  @ApiProperty({ example: 'uuid-project-id', description: 'Ait olduğu Test Planı / Proje UUID', required: false })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ example: 'uuid-suite-id', description: 'Ait olduğu Suite UUID', required: false, nullable: true })
  @ValidateIf((o) => o.suiteId !== null && o.suiteId !== undefined && o.suiteId !== '')
  @IsUUID()
  @IsOptional()
  suiteId?: string | null;

  @ApiProperty({ example: 0, description: 'Sıralama indeksi', required: false })
  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @ApiProperty({ example: 'MOB-402', description: 'İlişkili Jira Story Key (Örn: MOB-402)', required: false })
  @IsString()
  @IsOptional()
  jiraStoryKey?: string;

  @ApiProperty({ example: 'https://company.atlassian.net/browse/MOB-402', description: 'Jira Issue URL', required: false })
  @IsString()
  @IsOptional()
  jiraIssueUrl?: string;

  @ApiProperty({ example: 'data:image/png;base64,...', description: 'Ekran görüntüsü (URL veya Base64)', required: false })
  @IsString()
  @IsOptional()
  screenshotUrl?: string;

  @ApiProperty({ type: [CreateTestStepDto], description: 'Test adımları listesi', required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTestStepDto)
  @IsOptional()
  steps?: CreateTestStepDto[];
}

