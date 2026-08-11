import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}

