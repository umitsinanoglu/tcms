import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestPlanDto } from './dto/create-test-plan.dto';
import { UpdateTestPlanDto } from './dto/update-test-plan.dto';

@Injectable()
export class TestPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTestPlanDto: CreateTestPlanDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: createTestPlanDto.projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${createTestPlanDto.projectId} not found`);
    }

    return this.prisma.testPlan.create({
      data: {
        title: createTestPlanDto.title,
        description: createTestPlanDto.description,
        version: createTestPlanDto.version || 'v1.0.0',
        environment: createTestPlanDto.environment || 'STAGING',
        status: createTestPlanDto.status || 'ACTIVE',
        scope: createTestPlanDto.scope,
        requirements: createTestPlanDto.requirements,
        projectId: createTestPlanDto.projectId,
      },
      include: {
        _count: {
          select: { testRuns: true },
        },
      },
    });
  }

  async findAllByProject(projectId: string) {
    return this.prisma.testPlan.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { testRuns: true },
        },
        testRuns: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            _count: { select: { results: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
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
          select: { testRuns: true },
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

    return this.prisma.testPlan.update({
      where: { id },
      data: {
        title: updateTestPlanDto.title,
        description: updateTestPlanDto.description,
        version: updateTestPlanDto.version,
        environment: updateTestPlanDto.environment,
        status: updateTestPlanDto.status,
        scope: updateTestPlanDto.scope,
        requirements: updateTestPlanDto.requirements,
      },
      include: {
        _count: {
          select: { testRuns: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.testPlan.delete({
      where: { id },
    });
  }
}
