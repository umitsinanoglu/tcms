import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TriggerAutomationWebhookDto, TriggerTargetScope } from './dto/trigger-webhook.dto';
import { RunStatus } from '@prisma/client';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async triggerAutomation(projectId: string, dto: TriggerAutomationWebhookDto, user?: any) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        suites: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    let targetCaseCodes: string[] = dto.caseCodes || [];

    // If scope is SUITE, fetch test cases under that suite
    if (dto.scope === TriggerTargetScope.SUITE && dto.suiteId) {
      const suiteCases = await this.prisma.testCase.findMany({
        where: { suiteId: dto.suiteId },
        select: { code: true },
      });
      targetCaseCodes = suiteCases.map((tc) => tc.code);
    } else if (dto.scope === TriggerTargetScope.ALL && (!targetCaseCodes || targetCaseCodes.length === 0)) {
      const allCases = await this.prisma.testCase.findMany({
        where: {
          OR: [{ projectId }, { suite: { projectId } }],
        },
        select: { code: true },
      });
      targetCaseCodes = allCases.map((tc) => tc.code);
    }

    const runTitle =
      dto.title ||
      `Otomasyon Koşusu (${dto.scope || 'ALL'}) - ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`;

    // 1. Create an initial TestRun in IN_PROGRESS state
    const testRun = await this.prisma.testRun.create({
      data: {
        title: runTitle,
        version: dto.version || 'v1.0.0',
        environment: dto.environment || 'STAGING',
        executedBy: dto.triggeredBy || user?.name || 'TCMS Webhook Bot',
        testerEmail: user?.email || 'automation@ttb.com.tr',
        status: RunStatus.IN_PROGRESS,
        projectId: project.id,
      },
    });

    // 2. Prepare Webhook Payload
    const serverPort = process.env.PORT || 3001;
    const baseUrl = process.env.BASE_URL || `http://localhost:${serverPort}`;
    const callbackUrl = `${baseUrl}/api/v1/projects/${project.id}/runs/automation`;

    const outboundPayload: Record<string, any> = {
      event: 'AUTOMATION_TRIGGER',
      project: {
        id: project.id,
        key: project.key,
        name: project.name,
      },
      testRun: {
        id: testRun.id,
        title: testRun.title,
        environment: testRun.environment,
        version: testRun.version,
        status: testRun.status,
      },
      scope: dto.scope || (dto.specs?.length ? 'SPECIFIC' : targetCaseCodes.length ? 'SPECIFIC' : 'ALL'),
      caseCodes: targetCaseCodes,
      platform: dto.platform || 'iOS',
      triggeredBy: dto.triggeredBy || user?.name || 'TCMS Trigger',
      callbackUrl,
      timestamp: new Date().toISOString(),
    };

    if (dto.deviceAlias) {
      outboundPayload.deviceAlias = dto.deviceAlias;
    }

    if (dto.specs && dto.specs.length > 0) {
      outboundPayload.specs = dto.specs;
    }

    // 3. Dispatch Webhook to External Automation Project
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'TCMS-Webhook-Dispatcher/1.0',
    };

    if (dto.secretToken) {
      headers['Authorization'] = `Bearer ${dto.secretToken}`;
      headers['x-webhook-secret'] = dto.secretToken;
    }

    let remoteResponseStatus: number | null = null;
    let remoteResponseBody: any = null;
    let dispatchSuccess = false;
    let errorMessage: string | null = null;

    try {
      this.logger.log(`Dispatching automation trigger webhook to: ${dto.webhookUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(dto.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(outboundPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      remoteResponseStatus = response.status;

      const text = await response.text();
      try {
        remoteResponseBody = JSON.parse(text);
      } catch {
        remoteResponseBody = text;
      }

      dispatchSuccess = response.ok;
      this.logger.log(`Webhook responded with status ${response.status}`);
    } catch (err: any) {
      dispatchSuccess = false;
      errorMessage = err?.message || 'Failed to dispatch webhook';
      this.logger.error(`Webhook dispatch error: ${errorMessage}`);
    }

    return {
      success: dispatchSuccess,
      message: dispatchSuccess
        ? 'Otomasyon merkezi webhook tetiklendi ve TestRun başlatıldı.'
        : `Webhook tetiklendi fakat uzak sunucudan hata alındı: ${errorMessage || `HTTP ${remoteResponseStatus}`}`,
      testRun,
      targetCaseCount: targetCaseCodes.length,
      outboundPayload,
      remoteResponse: {
        status: remoteResponseStatus,
        body: remoteResponseBody,
        error: errorMessage,
      },
    };
  }

  async testWebhook(webhookUrl: string, secretToken?: string) {
    if (!webhookUrl) {
      throw new BadRequestException('webhookUrl gereklidir');
    }

    const pingPayload = {
      event: 'PING',
      message: 'TCMS Webhook Bağlantı Kontrolü',
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'TCMS-Webhook-Tester/1.0',
    };

    if (secretToken) {
      headers['Authorization'] = `Bearer ${secretToken}`;
      headers['x-webhook-secret'] = secretToken;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(pingPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const text = await response.text();

      return {
        success: response.ok,
        status: response.status,
        response: text,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  }
}
