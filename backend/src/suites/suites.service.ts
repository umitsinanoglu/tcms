import { Injectable, NotFoundException } from '@nestjs/common';
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
          parentId: createSuiteDto.parentId ?? null,
        },
        _max: { orderIndex: true },
      });
      createSuiteDto.orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;
    }

    return this.prisma.suite.create({
      data: createSuiteDto,
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
    return this.prisma.suite.update({
      where: { id },
      data: {
        parentId: reorderSuiteDto.parentId !== undefined ? reorderSuiteDto.parentId : undefined,
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
