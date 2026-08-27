import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportExportFormat {
  JSON = 'json',
  CSV = 'csv',
  HTML = 'html',
  MARKDOWN = 'md',
}

export class ReportExportQueryDto {
  @ApiPropertyOptional({
    enum: ReportExportFormat,
    default: ReportExportFormat.JSON,
    description: 'Export format: json, csv, html, md',
  })
  @IsOptional()
  @IsEnum(ReportExportFormat)
  format?: ReportExportFormat = ReportExportFormat.JSON;

  @ApiPropertyOptional({
    description: 'Optional filter by test run ID',
  })
  @IsOptional()
  @IsString()
  runId?: string;
}
