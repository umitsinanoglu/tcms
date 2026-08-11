import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID } from 'class-validator';

export class ReorderSuiteDto {
  @ApiProperty({ example: 'uuid-parent-suite-id', description: 'Yeni üst klasör ID (Root klasöre taşınacaksa null)', required: false })
  @IsUUID()
  @IsOptional()
  parentId?: string | null;

  @ApiProperty({ example: 1, description: 'Yeni sıralama indeksi' })
  @IsInt()
  orderIndex: number;
}
