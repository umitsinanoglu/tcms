import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DefectStatus } from '@prisma/client';

export class UpdateDefectStatusDto {
  @ApiProperty({ enum: DefectStatus, description: 'Yeni Hata Durumu' })
  @IsNotEmpty()
  @IsEnum(DefectStatus)
  status: DefectStatus;

  @ApiPropertyOptional({ description: 'Çözüm Notu / Açıklama' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
