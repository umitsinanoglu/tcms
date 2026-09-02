import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { TriggerAutomationWebhookDto } from './dto/trigger-webhook.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Webhooks & Automation Trigger')
@Controller('api/v1')
@UseGuards(RolesGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('projects/:projectId/webhooks/trigger')
  @Roles(Role.ADMIN, Role.AUTOMATION_ENGINEER)
  @ApiOperation({
    summary: 'Dış Otomasyon Merkezine Webhook Fırlat (Test Koşusunu Otomatik Başlat)',
    description:
      'TCMS üzerinden Test Otomasyon Merkezi veya harici test frameworklerine (Selenium/Playwright botları) webhook sinyali gönderir ve IN_PROGRESS statüsünde bir Test Run kaydı açar.',
  })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  @ApiResponse({ status: 201, description: 'Webhook başarıyla fırlatıldı ve TestRun oluşturuldu' })
  triggerAutomation(
    @Param('projectId') projectId: string,
    @Body() dto: TriggerAutomationWebhookDto,
    @Req() req: any,
  ) {
    return this.webhooksService.triggerAutomation(projectId, dto, req.user);
  }

  @Post('projects/:projectId/webhooks/ping')
  @Roles(Role.ADMIN, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'Webhook Uç Noktası Bağlantı Testi (Ping)' })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string', example: 'http://localhost:8000/api/webhook/trigger' },
        secretToken: { type: 'string', example: 'secret-123' },
      },
      required: ['webhookUrl'],
    },
  })
  testWebhook(@Body('webhookUrl') webhookUrl: string, @Body('secretToken') secretToken?: string) {
    return this.webhooksService.testWebhook(webhookUrl, secretToken);
  }
}
