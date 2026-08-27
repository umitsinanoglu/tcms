import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'ahmet.yilmaz@ttb.com.tr', description: 'Kullanıcı e-posta adresi' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Ahmet Yılmaz', description: 'Kullanıcı adı ve soyadı' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Kullanıcı rolü' })
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

  @ApiPropertyOptional({ example: true, description: 'Hesap aktiflik durumu' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
