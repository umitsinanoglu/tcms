import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'ahmet.yilmaz@ttb.com.tr', description: 'Kullanıcı e-posta adresi' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Ahmet Yılmaz', description: 'Kullanıcı adı ve soyadı' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: Role, default: Role.TESTER, description: 'Kullanıcı rolü' })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ example: 'Kalite Güvence / QA', description: 'Departman veya Birim' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Profil resmi URL' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
