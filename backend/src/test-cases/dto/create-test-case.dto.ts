import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { TestType, Priority } from '@prisma/client';
import { CreateTestStepDto } from './test-step.dto';

export class CreateTestCaseDto {
  @ApiProperty({ example: 'Geçerli kullanıcı adı ve şifre ile giriş yapma', description: 'Test Case başlığı' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Başarılı giriş senaryosu doğrulaması', description: 'Açıklama', required: false })
  @IsString()
  @IsOptional()
  description?: string;

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

  @ApiProperty({ example: 'uuid-suite-id', description: 'Ait olduğu Suite UUID' })
  @IsUUID()
  @IsNotEmpty()
  suiteId: string;

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

  @ApiProperty({ type: [CreateTestStepDto], description: 'Test adımları listesi', required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTestStepDto)
  @IsOptional()
  steps?: CreateTestStepDto[];
}

