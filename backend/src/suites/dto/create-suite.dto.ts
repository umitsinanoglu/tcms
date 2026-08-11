import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSuiteDto {
  @ApiProperty({ example: 'Giriş & Üyelik İşlemleri', description: 'Suite / Klasör adı' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'uuid-project-id', description: 'Proje UUID' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: 'uuid-parent-suite-id', description: 'Üst Klasör / Parent Suite UUID (Root suite ise null veya omit edin)', required: false })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ example: 0, description: 'Klasör sıralama indeksi', required: false })
  @IsInt()
  @IsOptional()
  orderIndex?: number;
}
