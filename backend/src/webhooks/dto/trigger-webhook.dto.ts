import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export enum TriggerTargetScope {
  ALL = 'ALL',
  SMOKE = 'SMOKE',
  REGRESSION = 'REGRESSION',
  SELECTED_CASES = 'SELECTED_CASES',
  SUITE = 'SUITE',
}

export class TriggerAutomationWebhookDto {
  @ApiProperty({
    example: 'http://localhost:8000/api/webhook/trigger',
    description: 'Test Otomasyon Merkezi webhook alıcı URL adresi',
  })
  @IsUrl({ require_tld: false }, { message: 'Geçerli bir webhook URL adresi giriniz' })
  @IsNotEmpty()
  webhookUrl: string;

  @ApiProperty({
    example: 'Sprint 24 Otomasyon Tetikleme',
    description: 'Başlatılacak koşu için başlık',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'STAGING',
    description: 'Hedef test ortamı (DEV, STAGING, PROD, UAT)',
    required: false,
  })
  @IsString()
  @IsOptional()
  environment?: string = 'STAGING';

  @ApiProperty({
    example: 'v2.4.0',
    description: 'Uygulama versiyonu',
    required: false,
  })
  @IsString()
  @IsOptional()
  version?: string = 'v1.0.0';

  @ApiProperty({
    enum: TriggerTargetScope,
    example: TriggerTargetScope.ALL,
    description: 'Çalıştırılacak test kapsamı',
    required: false,
  })
  @IsEnum(TriggerTargetScope)
  @IsOptional()
  scope?: TriggerTargetScope = TriggerTargetScope.ALL;

  @ApiProperty({
    example: 'suite-uuid-1234',
    description: 'Eğer scope=SUITE ise Suite UUID',
    required: false,
  })
  @IsString()
  @IsOptional()
  suiteId?: string;

  @ApiProperty({
    example: ['MOB-TC-1', 'MOB-TC-2', 'WEB-TC-15'],
    description: 'Eğer scope=SELECTED_CASES ise çalıştırılacak test case kodları dizisi',
    required: false,
  })
  @IsArray()
  @IsOptional()
  caseCodes?: string[];

  @ApiProperty({
    example: 'iOS',
    description: 'Test Platformu (iOS / Android)',
    required: false,
  })
  @IsString()
  @IsOptional()
  platform?: 'iOS' | 'Android' = 'iOS';

  @ApiProperty({
    example: 'iphone15',
    description: 'Hedef cihaz takma adı (iphone15, s24, emulator-5554 vb.)',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceAlias?: string;

  @ApiProperty({
    example: ['src/specs/pre_login/pre_login.spec.ts'],
    description: 'Doğrudan çalıştırılacak spec yolları',
    required: false,
  })
  @IsArray()
  @IsOptional()
  specs?: string[];

  @ApiProperty({
    example: 'secret-token-xyz',
    description: 'Test Otomasyon Merkezi doğrulama için Bearer token veya Secret (Opsiyonel)',
    required: false,
  })
  @IsString()
  @IsOptional()
  secretToken?: string;

  @ApiProperty({
    example: 'Ahmet Yılmaz',
    description: 'Tetikleyen kullanıcı adı',
    required: false,
  })
  @IsString()
  @IsOptional()
  triggeredBy?: string = 'TCMS Automation Trigger';
}
