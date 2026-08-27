import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';
import { UpdateDefectStatusDto } from './dto/update-defect-status.dto';
import { DefectStatus, DefectSeverity, Prisma } from '@prisma/client';

@Injectable()
export class DefectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Create a new defect with auto-incremented project key (e.g. TCMS-DEF-1)
   */
  async create(dto: CreateDefectDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${dto.projectId} not found`);
    }

    // Generate unique defect key
    const count = await this.prisma.defect.count({
      where: { projectId: dto.projectId },
    });
    const prefix = project.key || 'DEF';
    const key = `${prefix}-DEF-${count + 1}`;

    const defect = await this.prisma.defect.create({
      data: {
        key,
        title: dto.title,
        description: dto.description,
        severity: dto.severity || DefectSeverity.MAJOR,
        status: dto.status || DefectStatus.OPEN,
        projectId: dto.projectId,
        testCaseId: dto.testCaseId || null,
        testRunId: dto.testRunId || null,
        testResultId: dto.testResultId || null,
        assignedTo: dto.assignedTo || null,
        reportedBy: dto.reportedBy || null,
        environment: dto.environment || 'STAGING',
        channel: dto.channel || 'WEB',
        jiraBugKey: dto.jiraBugKey || null,
        jiraBugUrl: dto.jiraBugUrl || null,
        resolutionNotes: dto.resolutionNotes || null,
        resolvedAt: (dto.status === DefectStatus.RESOLVED || dto.status === DefectStatus.CLOSED) ? new Date() : null,
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
        testCase: { select: { id: true, code: true, title: true, priority: true, type: true } },
        testRun: { select: { id: true, title: true, version: true, environment: true } },
        testResult: { select: { id: true, status: true, errorMessage: true, screenshotUrl: true } },
      },
    });

    return defect;
  }

  /**
   * 2. Find all defects for a project with optional filters and search
   */
  async findAllByProject(
    projectId: string,
    filters?: {
      status?: DefectStatus;
      severity?: DefectSeverity;
      environment?: string;
      assignedTo?: string;
      search?: string;
    },
  ) {
    const where: Prisma.DefectWhereInput = {
      projectId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.severity) {
      where.severity = filters.severity;
    }

    if (filters?.environment && filters.environment !== 'ALL') {
      where.environment = filters.environment;
    }

    if (filters?.assignedTo && filters.assignedTo !== 'ALL') {
      where.assignedTo = filters.assignedTo;
    }

    if (filters?.search && filters.search.trim() !== '') {
      const search = filters.search.trim();
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { jiraBugKey: { contains: search, mode: 'insensitive' } },
        { testCase: { code: { contains: search, mode: 'insensitive' } } },
        { testCase: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.defect.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true, key: true } },
        testCase: { select: { id: true, code: true, title: true, priority: true, type: true } },
        testRun: { select: { id: true, title: true, version: true, environment: true } },
        testResult: { select: { id: true, status: true, errorMessage: true, screenshotUrl: true } },
      },
    });
  }

  /**
   * 3. Find one defect by ID with full details
   */
  async findOne(id: string) {
    const defect = await this.prisma.defect.findUnique({
      where: { id },
      include: {
        project: true,
        testCase: {
          include: {
            suite: true,
            steps: { orderBy: { stepNumber: 'asc' } },
          },
        },
        testRun: true,
        testResult: true,
      },
    });

    if (!defect) {
      throw new NotFoundException(`Defect with ID ${id} not found`);
    }

    return defect;
  }

  /**
   * 4. Update defect details
   */
  async update(id: string, dto: UpdateDefectDto) {
    const existing = await this.prisma.defect.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Defect with ID ${id} not found`);
    }

    const data: Prisma.DefectUpdateInput = {
      title: dto.title !== undefined ? dto.title : undefined,
      description: dto.description !== undefined ? dto.description : undefined,
      severity: dto.severity !== undefined ? dto.severity : undefined,
      status: dto.status !== undefined ? dto.status : undefined,
      assignedTo: dto.assignedTo !== undefined ? dto.assignedTo : undefined,
      reportedBy: dto.reportedBy !== undefined ? dto.reportedBy : undefined,
      environment: dto.environment !== undefined ? dto.environment : undefined,
      channel: dto.channel !== undefined ? dto.channel : undefined,
      jiraBugKey: dto.jiraBugKey !== undefined ? dto.jiraBugKey : undefined,
      jiraBugUrl: dto.jiraBugUrl !== undefined ? dto.jiraBugUrl : undefined,
      resolutionNotes: dto.resolutionNotes !== undefined ? dto.resolutionNotes : undefined,
    };

    if (dto.testCaseId !== undefined) {
      data.testCase = dto.testCaseId ? { connect: { id: dto.testCaseId } } : { disconnect: true };
    }

    if (dto.testRunId !== undefined) {
      data.testRun = dto.testRunId ? { connect: { id: dto.testRunId } } : { disconnect: true };
    }

    if (dto.testResultId !== undefined) {
      data.testResult = dto.testResultId ? { connect: { id: dto.testResultId } } : { disconnect: true };
    }

    // Set resolvedAt date if status is changing to resolved or closed
    if (dto.status && (dto.status === DefectStatus.RESOLVED || dto.status === DefectStatus.CLOSED)) {
      if (!existing.resolvedAt) {
        data.resolvedAt = new Date();
      }
    } else if (dto.status && (dto.status === DefectStatus.OPEN || dto.status === DefectStatus.IN_PROGRESS || dto.status === DefectStatus.REOPENED)) {
      data.resolvedAt = null;
    }

    return this.prisma.defect.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true, key: true } },
        testCase: { select: { id: true, code: true, title: true, priority: true, type: true } },
        testRun: { select: { id: true, title: true, version: true, environment: true } },
        testResult: { select: { id: true, status: true, errorMessage: true, screenshotUrl: true } },
      },
    });
  }

  /**
   * 5. Quick status update
   */
  async updateStatus(id: string, dto: UpdateDefectStatusDto) {
    const existing = await this.prisma.defect.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Defect with ID ${id} not found`);
    }

    const isResolvedOrClosed = dto.status === DefectStatus.RESOLVED || dto.status === DefectStatus.CLOSED;

    return this.prisma.defect.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNotes: dto.resolutionNotes !== undefined ? dto.resolutionNotes : existing.resolutionNotes,
        resolvedAt: isResolvedOrClosed ? (existing.resolvedAt || new Date()) : null,
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
        testCase: { select: { id: true, code: true, title: true, priority: true, type: true } },
        testRun: { select: { id: true, title: true, version: true, environment: true } },
        testResult: { select: { id: true, status: true, errorMessage: true, screenshotUrl: true } },
      },
    });
  }

  /**
   * 6. Delete a defect
   */
  async remove(id: string) {
    const defect = await this.prisma.defect.findUnique({
      where: { id },
    });

    if (!defect) {
      throw new NotFoundException(`Defect with ID ${id} not found`);
    }

    return this.prisma.defect.delete({
      where: { id },
    });
  }

  /**
   * 7. Comprehensive Defect Statistics for Dashboard & Analytics
   */
  async getStatsByProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const defects = await this.prisma.defect.findMany({
      where: { projectId },
      include: {
        testCase: { select: { id: true, code: true, title: true, priority: true } },
      },
    });

    const total = defects.length;
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    let closed = 0;
    let reopened = 0;
    let wontFix = 0;

    const bySeverity: Record<string, number> = {
      BLOCKER: 0,
      CRITICAL: 0,
      MAJOR: 0,
      MINOR: 0,
      TRIVIAL: 0,
    };

    const byStatus: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REOPENED: 0,
      WONT_FIX: 0,
    };

    const byEnvironment: Record<string, number> = {};
    const byChannel: Record<string, number> = {};
    const byAssignee: Record<string, number> = {};

    let activeBlockerCritical = 0;

    defects.forEach((d) => {
      // Status breakdown
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
      switch (d.status) {
        case DefectStatus.OPEN:
          open++;
          break;
        case DefectStatus.IN_PROGRESS:
          inProgress++;
          break;
        case DefectStatus.RESOLVED:
          resolved++;
          break;
        case DefectStatus.CLOSED:
          closed++;
          break;
        case DefectStatus.REOPENED:
          reopened++;
          break;
        case DefectStatus.WONT_FIX:
          wontFix++;
          break;
      }

      // Severity breakdown
      bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;

      // Active critical/blocker count
      const isClosed = d.status === DefectStatus.RESOLVED || d.status === DefectStatus.CLOSED || d.status === DefectStatus.WONT_FIX;
      if (!isClosed && (d.severity === DefectSeverity.BLOCKER || d.severity === DefectSeverity.CRITICAL)) {
        activeBlockerCritical++;
      }

      // Environment breakdown
      const env = d.environment || 'STAGING';
      byEnvironment[env] = (byEnvironment[env] || 0) + 1;

      // Channel breakdown
      const ch = d.channel || 'WEB';
      byChannel[ch] = (byChannel[ch] || 0) + 1;

      // Assignee breakdown
      const assignee = d.assignedTo || 'Atanmamış';
      byAssignee[assignee] = (byAssignee[assignee] || 0) + 1;
    });

    const resolvedOrClosed = resolved + closed;
    const resolutionRate = total > 0 ? Math.round((resolvedOrClosed / total) * 100) : 0;
    const activeDefects = open + inProgress + reopened;

    return {
      projectId,
      projectName: project.name,
      projectKey: project.key,
      metrics: {
        total,
        active: activeDefects,
        open,
        inProgress,
        resolved,
        closed,
        reopened,
        wontFix,
        activeBlockerCritical,
        resolutionRate,
      },
      distributions: {
        bySeverity,
        byStatus,
        byEnvironment,
        byChannel,
        byAssignee,
      },
      recentDefects: defects.slice(0, 5),
    };
  }

  /**
   * 8. Auto-sync failed test results into defects for the project
   */
  async syncFromFailedResults(projectId: string) {
    // Find all failed test results in this project that are not yet linked to any defect
    const failedResults = await this.prisma.testResult.findMany({
      where: {
        testRun: { projectId },
        status: 'FAILED',
        defects: { none: {} },
      },
      include: {
        testCase: true,
        testRun: true,
      },
    });

    const createdDefects: any[] = [];

    for (const res of failedResults) {
      const count = await this.prisma.defect.count({ where: { projectId } });
      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      const prefix = project?.key || 'DEF';
      const key = `${prefix}-DEF-${count + 1}`;

      const severity = res.testCase.priority === 'BLOCKER' 
        ? DefectSeverity.BLOCKER 
        : res.testCase.priority === 'CRITICAL' 
        ? DefectSeverity.CRITICAL 
        : DefectSeverity.MAJOR;

      const defect = await this.prisma.defect.create({
        data: {
          key,
          title: `[Test Hatası] ${res.testCase.title}`,
          description: res.errorMessage || `Test senaryosu (${res.testCase.code}) "${res.testRun.title}" koşumunda başarısız oldu.`,
          severity,
          status: DefectStatus.OPEN,
          projectId,
          testCaseId: res.testCaseId,
          testRunId: res.testRunId,
          testResultId: res.id,
          environment: res.environment || res.testRun.environment || 'STAGING',
          channel: res.testCase.type || 'WEB',
          reportedBy: res.executedBy || res.testRun.executedBy || 'Sistem',
          jiraBugKey: res.jiraBugKey || null,
          jiraBugUrl: res.jiraBugUrl || null,
        },
      });

      createdDefects.push(defect);
    }

    return {
      syncedCount: createdDefects.length,
      createdDefects,
    };
  }
}
