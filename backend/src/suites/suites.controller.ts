import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SuitesService } from './suites.service';
import { CreateSuiteDto } from './dto/create-suite.dto';
import { UpdateSuiteDto } from './dto/update-suite.dto';
import { ReorderSuiteDto } from './dto/reorder-suite.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Suites')
@Controller('api/v1/suites')
@UseGuards(RolesGuard)
export class SuitesController {
  constructor(private readonly suitesService: SuitesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'Yeni Suite (Klasör) oluştur (Admin, Lead, Tester)' })
  @ApiResponse({ status: 201, description: 'Suite başarıyla oluşturuldu' })
  create(@Body() createSuiteDto: CreateSuiteDto) {
    return this.suitesService.create(createSuiteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Projeye ait tüm Suite dizinini listele' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Proje UUID' })
  findAllByProject(@Query('projectId') projectId: string) {
    return this.suitesService.findAllByProject(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tekil Suite detayını getir' })
  @ApiParam({ name: 'id', description: 'Suite UUID' })
  findOne(@Param('id') id: string) {
    return this.suitesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'Suite adını veya parent klasörünü güncelle (Admin, Lead, Tester)' })
  @ApiParam({ name: 'id', description: 'Suite UUID' })
  update(@Param('id') id: string, @Body() updateSuiteDto: UpdateSuiteDto) {
    return this.suitesService.update(id, updateSuiteDto);
  }

  @Patch(':id/reorder')
  @Roles(Role.ADMIN, Role.TEST_LEAD, Role.TESTER, Role.AUTOMATION_ENGINEER)
  @ApiOperation({ summary: 'Suite sıralamasını veya hiyerarşide yerini (parentId) değiştir (Admin, Lead, Tester)' })
  @ApiParam({ name: 'id', description: 'Suite UUID' })
  reorder(@Param('id') id: string, @Body() reorderSuiteDto: ReorderSuiteDto) {
    return this.suitesService.reorder(id, reorderSuiteDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEST_LEAD)
  @ApiOperation({ summary: 'Suite klasörünü sil (Admin & Lead)' })
  @ApiParam({ name: 'id', description: 'Suite UUID' })
  remove(@Param('id') id: string) {
    return this.suitesService.remove(id);
  }
}

