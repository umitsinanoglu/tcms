import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiHeader } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Users & RBAC')
@Controller('api/v1/users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mevcut aktif kullanıcının profil bilgilerini getir' })
  @ApiHeader({ name: 'x-user-id', description: 'Aktif kullanıcı ID', required: false })
  @ApiHeader({ name: 'x-user-role', description: 'Aktif kullanıcı rolü (ADMIN, TEST_LEAD, TESTER, VIEWER)', required: false })
  getCurrentUserProfile(@CurrentUser() user: RequestUser) {
    return user;
  }

  @Get()
  @ApiOperation({ summary: 'Sistemdeki tüm kullanıcıları listele' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Kullanıcı detayını getir' })
  @ApiParam({ name: 'id', description: 'Kullanıcı UUID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Yeni kullanıcı oluştur (Yalnızca Admin)' })
  @ApiResponse({ status: 201, description: 'Kullanıcı başarıyla oluşturuldu' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Kullanıcı bilgilerini veya rolünü güncelle (Yalnızca Admin)' })
  @ApiParam({ name: 'id', description: 'Kullanıcı UUID' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Kullanıcıyı sil (Yalnızca Admin)' })
  @ApiParam({ name: 'id', description: 'Kullanıcı UUID' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
