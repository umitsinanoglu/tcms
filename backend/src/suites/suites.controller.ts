import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SuitesService } from './suites.service';
import { CreateSuiteDto } from './dto/create-suite.dto';
import { UpdateSuiteDto } from './dto/update-suite.dto';
import { ReorderSuiteDto } from './dto/reorder-suite.dto';

@ApiTags('Suites')
@Controller('api/v1/suites')
export class SuitesController {
  constructor(private readonly suitesService: SuitesService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni Suite (Klasör) oluştur' })
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
  @ApiOperation({ summary: 'Suite adını veya parent klasörünü güncelle' })
  @ApiParam({ name: 'id', description: 'Suite UUID' })
  update(@Param('id') id: string, @Body() updateSuiteDto: UpdateSuiteDto) {
    return this.suitesService.update(id, updateSuiteDto);
  }

  @Patch(':id/reorder')
  @ApiOperation({ summary: 'Suite sıralamasını veya hiyerarşide yerini (parentId) değiştir' })
  @ApiParam({ name: 'id', description: 'Suite UUID' })
  reorder(@Param('id') id: string, @Body() reorderSuiteDto: ReorderSuiteDto) {
    return this.suitesService.reorder(id, reorderSuiteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Suite klasörünü sil (İçindekiler cascade silinir)' })
  @ApiParam({ name: 'id', description: 'Suite UUID' })
  remove(@Param('id') id: string) {
    return this.suitesService.remove(id);
  }
}
