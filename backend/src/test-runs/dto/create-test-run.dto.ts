import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTestRunDto {
  @ApiProperty({ example: 'Sprint 24 Regression', description: 'Test koşusu başlığı' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'v2.4.0-rc1', description: 'Test edilen versiyon / build', required: false })
  @IsString()
  @IsOptional()
  version?: string = 'v1.0.0';

  @ApiProperty({ example: 'STAGING', description: 'Test ortamı (STAGING, PROD vb.)', required: false })
  @IsString()
  @IsOptional()
  environment?: string = 'STAGING';

  @ApiProperty({ example: 'Ahmet Yılmaz', description: 'Koşumu yapan kişi', required: false })
  @IsString()
  @IsOptional()
  executedBy?: string = 'QA Tester';

  @ApiProperty({ example: 'ahmet.yilmaz@sirket.com', description: 'Tester e-posta', required: false })
  @IsString()
  @IsOptional()
  testerEmail?: string = 'tester@company.com';
}
