import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';

@Injectable()
export class TestCasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTestCaseDto: CreateTestCaseDto) {
    let projectKey: string;
    let projectId: string;
    let suiteId: string | null = createTestCaseDto.suiteId || null;

    if (suiteId) {
      const suite = await this.prisma.suite.findUnique({
        where: { id: suiteId },
        include: { project: true },
      });

      if (!suite) {
        throw new NotFoundException(`Suite with ID ${suiteId} not found`);
      }

      projectKey = suite.project.key;
      projectId = suite.projectId;
    } else if (createTestCaseDto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: createTestCaseDto.projectId },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${createTestCaseDto.projectId} not found`);
      }

      projectKey = project.key;
      projectId = project.id;
    } else {
      throw new NotFoundException('Either suiteId or projectId must be provided to create a Test Case');
    }

    // Count existing test cases for project to generate incrementing code e.g. PRJ-TC-1
    const totalCasesInProject = await this.prisma.testCase.count({
      where: {
        OR: [
          { projectId },
          { suite: { projectId } },
        ],
      },
    });

    const nextNumber = totalCasesInProject + 1;
    const code = `${projectKey}-TC-${nextNumber}`;

    const { steps, ...caseData } = createTestCaseDto;

    return this.prisma.testCase.create({
      data: {
        ...caseData,
        projectId,
        suiteId: suiteId || undefined,
        code,
        steps: steps && steps.length > 0 ? {
          create: steps.map((step, idx) => ({
            stepNumber: step.stepNumber || idx + 1,
            action: step.action,
            expectedResult: step.expectedResult || '',
          })),
        } : undefined,
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });
  }

  async findAllBySuite(suiteId: string) {
    return this.prisma.testCase.findMany({
      where: { suiteId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        results: {
          orderBy: { executedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id },
      include: {
        suite: {
          include: {
            project: true,
          },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        results: {
          orderBy: { executedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!testCase) {
      throw new NotFoundException(`TestCase with ID ${id} not found`);
    }

    return testCase;
  }

  async findByCode(code: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { code },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        results: {
          orderBy: { executedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!testCase) {
      throw new NotFoundException(`TestCase with code ${code} not found`);
    }

    return testCase;
  }

  async update(id: string, updateTestCaseDto: UpdateTestCaseDto) {
    await this.findOne(id);

    const { steps, ...caseData } = updateTestCaseDto;

    // If steps are provided, replace existing steps
    if (steps) {
      await this.prisma.testStep.deleteMany({
        where: { testCaseId: id },
      });
    }

    return this.prisma.testCase.update({
      where: { id },
      data: {
        ...caseData,
        steps: steps ? {
          create: steps.map((step, idx) => ({
            stepNumber: step.stepNumber || idx + 1,
            action: step.action,
            expectedResult: step.expectedResult || '',
          })),
        } : undefined,
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });
  }


  async linkJiraStory(id: string, jiraStoryKey?: string, jiraIssueUrl?: string) {
    await this.findOne(id);
    const generatedUrl = jiraIssueUrl || (jiraStoryKey ? `https://company.atlassian.net/browse/${jiraStoryKey}` : null);

    return this.prisma.testCase.update({
      where: { id },
      data: {
        jiraStoryKey: jiraStoryKey || null,
        jiraIssueUrl: generatedUrl,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.testCase.delete({
      where: { id },
    });
  }
}
