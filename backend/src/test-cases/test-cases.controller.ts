import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TestCasesService } from './test-cases.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';

import { LinkJiraStoryDto } from './dto/jira-link.dto';

@ApiTags('Test Cases')
@Controller('api/v1/test-cases')
export class TestCasesController {
  constructor(private readonly testCasesService: TestCasesService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni Test Case ve adımlarını oluştur (Kod otomatik uretilir: PRJ-TC-1 vb.)' })
  @ApiResponse({ status: 201, description: 'Test Case başarıyla oluşturuldu' })
  create(@Body() createTestCaseDto: CreateTestCaseDto) {
    return this.testCasesService.create(createTestCaseDto);
  }


  @Get()
  @ApiOperation({ summary: 'Bir Suite içindeki tüm Test Case\'leri listele' })
  @ApiQuery({ name: 'suiteId', required: true, description: 'Suite UUID' })
  findAllBySuite(@Query('suiteId') suiteId: string) {
    return this.testCasesService.findAllBySuite(suiteId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID ile Test Case detaylarını adımlarıyla getir' })
  @ApiParam({ name: 'id', description: 'TestCase UUID' })
  findOne(@Param('id') id: string) {
    return this.testCasesService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Kod ile Test Case detaylarını getir (Örn: PRJ-TC-1)' })
  @ApiParam({ name: 'code', description: 'Test Case Kodu (PRJ-TC-1)' })
  findByCode(@Param('code') code: string) {
    return this.testCasesService.findByCode(code);
  }

  @Patch(':id/jira-link')
  @ApiOperation({ summary: 'Test Case ile Jira Story ID eşleştir (Jira Link API)' })
  @ApiParam({ name: 'id', description: 'TestCase UUID' })
  linkJiraStory(@Param('id') id: string, @Body() dto: LinkJiraStoryDto) {
    return this.testCasesService.linkJiraStory(id, dto.jiraStoryKey, dto.jiraIssueUrl);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Test Case ve adımlarını güncelle' })
  @ApiParam({ name: 'id', description: 'TestCase UUID' })
  update(@Param('id') id: string, @Body() updateTestCaseDto: UpdateTestCaseDto) {
    return this.testCasesService.update(id, updateTestCaseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Test Case\'i sil' })
  @ApiParam({ name: 'id', description: 'TestCase UUID' })
  remove(@Param('id') id: string) {
    return this.testCasesService.remove(id);
  }
}
