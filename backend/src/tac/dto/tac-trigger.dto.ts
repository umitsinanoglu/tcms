import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum TACPlatform {
  IOS = 'iOS',
  ANDROID = 'Android',
}

export class TriggerTACWebhookDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'TCMS Proje UUID' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: 'Gece Regresyonu - iOS iPhone 15', description: 'Koşu Başlığı', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ enum: TACPlatform, example: TACPlatform.IOS, description: 'Test Platformu (iOS / Android)', required: false })
  @IsEnum(TACPlatform)
  @IsOptional()
  platform?: TACPlatform = TACPlatform.IOS;

  @ApiProperty({ example: 'iphone15', description: 'Hedef cihaz takma adı (iphone15, s24, emulator-5554 vb.)', required: false })
  @IsString()
  @IsOptional()
  deviceAlias?: string;

  @ApiProperty({ example: 'UAT', description: 'Test Ortamı', required: false })
  @IsString()
  @IsOptional()
  environment?: string = 'UAT';

  @ApiProperty({ example: 'v2.4.0', description: 'Uygulama Versiyonu', required: false })
  @IsString()
  @IsOptional()
  version?: string = 'v2.4.0';

  @ApiProperty({ example: 'SPECIFIC', description: 'Koşu Kapsamı (ALL, SPECIFIC, SUITE)', required: false })
  @IsString()
  @IsOptional()
  scope?: string = 'SPECIFIC';

  @ApiProperty({ example: ['MOB-TC-1', 'MOB-TC-2'], description: 'Koşulacak test case kodları', required: false })
  @IsArray()
  @IsOptional()
  caseCodes?: string[];

  @ApiProperty({ example: ['src/specs/pre_login/pre_login.spec.ts'], description: 'Doğrudan spec yolları', required: false })
  @IsArray()
  @IsOptional()
  specs?: string[];

  @ApiProperty({ example: 'Ahmet Yılmaz', description: 'Tetikleyen kullanıcı adı', required: false })
  @IsString()
  @IsOptional()
  triggeredBy?: string;
}

export class AppiumHealthDto {
  @ApiProperty({ example: 4731, description: 'Appium Port Numarası', required: false })
  @IsOptional()
  port?: number;

  @ApiProperty({ example: 'http://localhost:4731', description: 'Appium Sunucu URL', required: false })
  @IsString()
  @IsOptional()
  url?: string;
}
