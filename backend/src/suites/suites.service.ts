import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSuiteDto } from './dto/create-suite.dto';
import { UpdateSuiteDto } from './dto/update-suite.dto';
import { ReorderSuiteDto } from './dto/reorder-suite.dto';

@Injectable()
export class SuitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSuiteDto: CreateSuiteDto) {
    if (createSuiteDto.orderIndex === undefined) {
      const maxOrder = await this.prisma.suite.aggregate({
        where: {
          projectId: createSuiteDto.projectId,
          parentId: createSuiteDto.parentId || null,
        },
        _max: { orderIndex: true },
      });
      createSuiteDto.orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;
    }

    return this.prisma.suite.create({
      data: {
        ...createSuiteDto,
        parentId: createSuiteDto.parentId || null,
      },
    });
  }

  async findAllByProject(projectId: string) {
    return this.prisma.suite.findMany({
      where: { projectId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findOne(id: string) {
    const suite = await this.prisma.suite.findUnique({
      where: { id },
      include: {
        children: true,
        cases: true,
      },

    });
    if (!suite) {
      throw new NotFoundException(`Suite with ID ${id} not found`);
    }
    return suite;
  }

  async update(id: string, updateSuiteDto: UpdateSuiteDto) {
    await this.findOne(id);
    return this.prisma.suite.update({
      where: { id },
      data: updateSuiteDto,
    });
  }

  async reorder(id: string, reorderSuiteDto: ReorderSuiteDto) {
    await this.findOne(id);
    const newParentId = reorderSuiteDto.parentId !== undefined ? reorderSuiteDto.parentId : undefined;

    if (newParentId) {
      if (newParentId === id) {
        throw new BadRequestException('A suite cannot be its own parent.');
      }

      // Check if newParentId is a child/descendant of id
      let currentParentId: string | null = newParentId;
      while (currentParentId) {
        if (currentParentId === id) {
          throw new BadRequestException('Cannot move a parent suite into its own descendant.');
        }
        const parentSuite: { parentId: string | null } | null = await this.prisma.suite.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });
        currentParentId = parentSuite?.parentId || null;
      }
    }

    return this.prisma.suite.update({
      where: { id },
      data: {
        parentId: newParentId,
        orderIndex: reorderSuiteDto.orderIndex,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.suite.delete({
      where: { id },
    });
  }
}

