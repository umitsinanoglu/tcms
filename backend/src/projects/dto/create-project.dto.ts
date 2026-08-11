import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'E-Commerce Platform', description: 'Proje adı' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'PRJ', description: 'Proje anahtarı (Kısa kod)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @Matches(/^[A-Z0-9_-]+$/, { message: 'Key sadece büyük harf, rakam, tire ve alt çizgi içerebilir' })
  key: string;

  @ApiProperty({ example: 'E-Ticaret web ve mobil otomasyon test projesi', description: 'Proje açıklaması', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'MOB', description: 'Jira Proje Key', required: false })
  @IsString()
  @IsOptional()
  jiraProjectKey?: string;
}

