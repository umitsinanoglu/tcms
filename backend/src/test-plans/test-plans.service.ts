import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestPlanDto } from './dto/create-test-plan.dto';
import { UpdateTestPlanDto } from './dto/update-test-plan.dto';
import { BulkCreateTestPlansDto } from './dto/bulk-create-test-plan.dto';

@Injectable()
export class TestPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async createBulk(bulkDto: BulkCreateTestPlansDto) {
    const { projectId, items } = bulkDto;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const createdPlans = [];
    for (const item of items) {
      const plan = await this.prisma.testPlan.create({
        data: {
          title: item.title,
          description: item.description,
          version: item.version || 'v1.0.0',
          environment: item.environment || 'STAGING',
          status: item.status || 'ACTIVE',
          scope: item.scope,
          requirements: item.requirements,
          projectId: project.id,
          cases: item.caseIds && item.caseIds.length > 0 ? {
            create: item.caseIds.map((cId) => ({
              testCaseId: cId,
            })),
          } : undefined,
        },
        include: {
          cases: { select: { testCaseId: true } },
        },
      });
      createdPlans.push(plan);
    }

    return {
      success: true,
      count: createdPlans.length,
      data: createdPlans,
    };
  }

  async create(createTestPlanDto: CreateTestPlanDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: createTestPlanDto.projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${createTestPlanDto.projectId} not found`);
    }

    const { caseIds, ...planData } = createTestPlanDto;

    return this.prisma.testPlan.create({
      data: {
        title: planData.title,
        description: planData.description,
        version: planData.version || 'v1.0.0',
        environment: planData.environment || 'STAGING',
        status: planData.status || 'ACTIVE',
        scope: planData.scope,
        requirements: planData.requirements,
        projectId: planData.projectId,
        cases: caseIds && caseIds.length > 0 ? {
          create: caseIds.map((cId) => ({
            testCaseId: cId,
          })),
        } : undefined,
      },
      include: {
        cases: {
          select: { testCaseId: true },
        },
        _count: {
          select: { testRuns: true, cases: true },
        },
      },
    });
  }

  async findAllByProject(projectId: string) {
    return this.prisma.testPlan.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { testRuns: true, cases: true },
        },
        cases: {
          select: { testCaseId: true },
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        testRuns: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            _count: { select: { results: true } },
            results: {
              select: {
                id: true,
                status: true,
                executionMs: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.testPlan.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        cases: {
          include: {
            testCase: {
              include: {
                suite: true,
                steps: {
                  orderBy: { stepNumber: 'asc' },
                },
                results: {
                  orderBy: { executedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        testRuns: {
          include: {
            _count: { select: { results: true } },
            results: {
              select: {
                id: true,
                status: true,
                executionMs: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { testRuns: true, cases: true },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`TestPlan with ID ${id} not found`);
    }

    return plan;
  }

  async update(id: string, updateTestPlanDto: UpdateTestPlanDto) {
    await this.findOne(id);
    const { caseIds, ...planData } = updateTestPlanDto;

    return this.prisma.$transaction(async (tx) => {
      if (caseIds !== undefined) {
        // Replace existing cases with new ones
        await tx.testPlanCase.deleteMany({
          where: { testPlanId: id },
        });

        if (caseIds.length > 0) {
          await tx.testPlanCase.createMany({
            data: caseIds.map((cId) => ({
              testPlanId: id,
              testCaseId: cId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.testPlan.update({
        where: { id },
        data: {
          title: planData.title,
          description: planData.description,
          version: planData.version,
          environment: planData.environment,
          status: planData.status,
          scope: planData.scope,
          requirements: planData.requirements,
        },
        include: {
          cases: {
            select: { testCaseId: true },
          },
          _count: {
            select: { testRuns: true, cases: true },
          },
        },
      });
    });
  }

  async syncCases(id: string, caseIds: string[]) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.testPlanCase.deleteMany({
        where: { testPlanId: id },
      });

      if (caseIds.length > 0) {
        await tx.testPlanCase.createMany({
          data: caseIds.map((cId) => ({
            testPlanId: id,
            testCaseId: cId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.testPlan.findUnique({
        where: { id },
        include: {
          cases: { select: { testCaseId: true } },
          _count: { select: { cases: true, testRuns: true } },
        },
      });
    });
  }

  async addCases(id: string, caseIds: string[]) {
    await this.findOne(id);

    if (caseIds.length > 0) {
      await this.prisma.testPlanCase.createMany({
        data: caseIds.map((cId) => ({
          testPlanId: id,
          testCaseId: cId,
        })),
        skipDuplicates: true,
      });
    }

    return this.findOne(id);
  }

  async removeCase(id: string, caseId: string) {
    await this.findOne(id);

    await this.prisma.testPlanCase.deleteMany({
      where: {
        testPlanId: id,
        testCaseId: caseId,
      },
    });

    return { success: true };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.testPlan.delete({
      where: { id },
    });
  }
}
