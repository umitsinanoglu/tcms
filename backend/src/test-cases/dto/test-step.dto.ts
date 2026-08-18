import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class StepAttachmentDto {
  @ApiPropertyOptional({ example: 'att-1', description: 'Ekran görüntüsü ID' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'data:image/png;base64,...', description: 'Ekran görüntüsü (URL veya Base64)' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ example: 'Hata ekranı veya beklenen görsel', description: 'Görsel açıklaması / yorum satırı' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class CreateTestStepDto {
  @ApiProperty({ example: 1, description: 'Adım numarası' })
  @IsInt()
  stepNumber: number;

  @ApiProperty({ example: 'Kullanıcı giriş sayfasına gider', description: 'Yapılacak eylem' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ example: 'Giriş formu görüntülenir', description: 'Beklenen sonuç' })
  @IsString()
  @IsOptional()
  expectedResult?: string;

  @ApiPropertyOptional({ type: [StepAttachmentDto], description: 'Adıma ait ekran görüntüleri ve yorumları' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepAttachmentDto)
  @IsOptional()
  attachments?: StepAttachmentDto[];
}
