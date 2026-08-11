import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LinkJiraStoryDto {
  @ApiProperty({ example: 'MOB-402', description: 'Jira Story / Issue Key (Örn: MOB-402)', required: false })
  @IsString()
  @IsOptional()
  jiraStoryKey?: string;

  @ApiProperty({ example: 'https://company.atlassian.net/browse/MOB-402', description: 'Jira Issue URL (Opsiyonel, verilmezse otomatik oluşturulur)', required: false })
  @IsString()
  @IsOptional()
  jiraIssueUrl?: string;
}
