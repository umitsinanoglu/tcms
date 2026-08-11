import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('Projects')
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni proje oluştur' })
  @ApiResponse({ status: 201, description: 'Proje başarıyla oluşturuldu' })
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm projeleri listele' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tek bir projenin detayını getir' })
  @ApiParam({ name: 'id', description: 'Proje UUID' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':projectId/tree')
  @ApiOperation({ summary: 'Projenin tüm Suite ve TestCase klasör ağacını getir (Tree API)' })
  @ApiParam({ name: 'projectId', description: 'Proje UUID' })
  getTree(@Param('projectId') projectId: string) {
    return this.projectsService.getTree(projectId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Proje bilgilerini güncelle' })
  @ApiParam({ name: 'id', description: 'Proje UUID' })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Projeyi sil' })
  @ApiParam({ name: 'id', description: 'Proje UUID' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
