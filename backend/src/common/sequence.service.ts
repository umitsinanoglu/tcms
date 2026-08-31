import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates the next sequential code atomically for a project entity (TC, DEF, RUN).
   * Safe against concurrent requests (50+ users creating entities simultaneously).
   */
  async getNextCode(
    projectId: string,
    projectKey: string,
    entityType: 'TC' | 'DEF' | 'RUN',
  ): Promise<string> {
    const existingSeq = await this.prisma.projectSequence.findUnique({
      where: {
        projectId_entityType: { projectId, entityType },
      },
    });

    let currentVal = existingSeq?.lastValue;

    // If sequence does not exist yet in DB, bootstrap it from current max in DB
    if (currentVal === undefined) {
      if (entityType === 'TC') {
        const cases = await this.prisma.testCase.findMany({
          where: { projectId },
          select: { code: true },
        });
        let maxNum = 0;
        const prefix = `${projectKey}-TC-`;
        for (const tc of cases) {
          if (tc.code?.startsWith(prefix)) {
            const num = parseInt(tc.code.substring(prefix.length), 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
        currentVal = maxNum;
      } else if (entityType === 'DEF') {
        currentVal = await this.prisma.defect.count({ where: { projectId } });
      } else {
        currentVal = await this.prisma.testRun.count({ where: { projectId } });
      }
    }

    const updated = await this.prisma.projectSequence.upsert({
      where: {
        projectId_entityType: { projectId, entityType },
      },
      update: {
        lastValue: { increment: 1 },
      },
      create: {
        projectId,
        entityType,
        lastValue: currentVal + 1,
      },
      select: { lastValue: true },
    });

    return `${projectKey}-${entityType}-${updated.lastValue}`;
  }

  /**
   * Atomically reserves a block of sequential codes for bulk imports.
   */
  async getNextCodesBatch(
    projectId: string,
    projectKey: string,
    entityType: 'TC' | 'DEF' | 'RUN',
    count: number,
  ): Promise<string[]> {
    if (count <= 0) return [];

    const existingSeq = await this.prisma.projectSequence.findUnique({
      where: {
        projectId_entityType: { projectId, entityType },
      },
    });

    let currentVal = existingSeq?.lastValue;

    if (currentVal === undefined) {
      if (entityType === 'TC') {
        const cases = await this.prisma.testCase.findMany({
          where: { projectId },
          select: { code: true },
        });
        let maxNum = 0;
        const prefix = `${projectKey}-TC-`;
        for (const tc of cases) {
          if (tc.code?.startsWith(prefix)) {
            const num = parseInt(tc.code.substring(prefix.length), 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
        currentVal = maxNum;
      } else if (entityType === 'DEF') {
        currentVal = await this.prisma.defect.count({ where: { projectId } });
      } else {
        currentVal = await this.prisma.testRun.count({ where: { projectId } });
      }
    }

    const updated = await this.prisma.projectSequence.upsert({
      where: {
        projectId_entityType: { projectId, entityType },
      },
      update: {
        lastValue: { increment: count },
      },
      create: {
        projectId,
        entityType,
        lastValue: currentVal + count,
      },
      select: { lastValue: true },
    });

    const startVal = updated.lastValue - count + 1;
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(`${projectKey}-${entityType}-${startVal + i}`);
    }

    return codes;
  }
}
