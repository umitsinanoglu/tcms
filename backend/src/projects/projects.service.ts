import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';


export interface TreeNode {
  id: string;
  name: string;
  orderIndex: number;
  parentId: string | null;
  children: TreeNode[];
  testCases: any[];
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { key: createProjectDto.key.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Project key '${createProjectDto.key}' already exists`);
    }

    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        key: createProjectDto.key.toUpperCase(),
      },
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { suites: true, testRuns: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: { suites: true, testRuns: true },
        },
      },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id);
    if (updateProjectDto.key) {
      updateProjectDto.key = updateProjectDto.key.toUpperCase();
    }
    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({
      where: { id },
    });
  }

  async getTree(projectId: string) {
    const project = await this.findOne(projectId);

    // Fetch all suites in the project ordered by orderIndex
    const suites = await this.prisma.suite.findMany({
      where: { projectId },
      orderBy: { orderIndex: 'asc' },
    });

    // Fetch all test cases in the project including steps and latest result
    const testCases = await this.prisma.testCase.findMany({
      where: {
        suite: { projectId },
      },
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

    // Group test cases by suiteId
    const testCasesBySuiteMap = new Map<string, any[]>();
    for (const tc of testCases) {
      if (!testCasesBySuiteMap.has(tc.suiteId)) {
        testCasesBySuiteMap.set(tc.suiteId, []);
      }
      testCasesBySuiteMap.get(tc.suiteId)!.push(tc);
    }

    // Build hierarchical suite tree structure
    const suiteNodesMap = new Map<string, any>();
    suites.forEach((suite) => {
      suiteNodesMap.set(suite.id, {
        id: suite.id,
        type: 'suite',
        name: suite.name,
        orderIndex: suite.orderIndex,
        parentId: suite.parentId,
        children: [],
        testCases: testCasesBySuiteMap.get(suite.id) || [],
      });
    });

    const rootSuites: any[] = [];

    suiteNodesMap.forEach((node) => {
      if (node.parentId && suiteNodesMap.has(node.parentId)) {
        suiteNodesMap.get(node.parentId)!.children.push(node);
      } else {
        rootSuites.push(node);
      }
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        key: project.key,
        jiraProjectKey: project.jiraProjectKey,
      },
      tree: rootSuites,
      children: rootSuites,
    };
  }
}

