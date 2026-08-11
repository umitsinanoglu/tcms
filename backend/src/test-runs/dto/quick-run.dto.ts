import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResultStatus } from '@prisma/client';

export class QuickRunDto {
  @ApiProperty({ description: 'TestCase UUID' })
  testCaseId: string;

  @ApiProperty({ enum: ResultStatus, description: 'Test sonucu (PASSED, FAILED, SKIPPED, BLOCKED)' })
  status: ResultStatus;

  @ApiPropertyOptional({ description: 'Hata açıklaması (FAILED durumu için)' })
  errorMessage?: string;

  @ApiPropertyOptional({ description: 'Jira Bug Key (Örn: MOB-101)' })
  jiraBugKey?: string;

  @ApiPropertyOptional({ description: 'Jira Bug URL' })
  jiraBugUrl?: string;

  @ApiPropertyOptional({ description: 'Testi koşan kullanıcı adı' })
  executedBy?: string;
}
