import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultUsersIfEmpty();
  }

  async seedDefaultUsersIfEmpty() {
    const count = await this.prisma.user.count();
    if (count === 0) {
      const defaultUsers = [
        {
          name: 'Ümit Sinanoğlu (Admin)',
          email: 'admin@ttb.com.tr',
          role: Role.ADMIN,
          department: 'Yazılım & Test Mimarisi',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        },
        {
          name: 'Selin Kaya (Test Lead)',
          email: 'selin.kaya@ttb.com.tr',
          role: Role.TEST_LEAD,
          department: 'QA & Test Yönetimi',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        },
        {
          name: 'Burak Demir (Test Uzmanı)',
          email: 'burak.demir@ttb.com.tr',
          role: Role.TESTER,
          department: 'Otomasyon & Manuel Test',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        },
        {
          name: 'Gözlemci Kullanıcı (Viewer)',
          email: 'viewer@ttb.com.tr',
          role: Role.VIEWER,
          department: 'İş Analizi & Yönetim',
          avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
        },
      ];

      for (const u of defaultUsers) {
        await this.prisma.user.create({ data: u });
      }
      console.log('✅ Default RBAC users seeded successfully.');
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`Kullanıcı (#${id}) bulunamadı.`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(createDto: CreateUserDto) {
    const existing = await this.findByEmail(createDto.email);
    if (existing) {
      throw new ConflictException(`Bu e-posta (${createDto.email}) adresi ile kayıtlı bir kullanıcı zaten var.`);
    }
    return this.prisma.user.create({
      data: createDto,
    });
  }

  async update(id: string, updateDto: UpdateUserDto) {
    await this.findOne(id);

    if (updateDto.email) {
      const existing = await this.findByEmail(updateDto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Bu e-posta (${updateDto.email}) başka bir kullanıcı tarafından kullanılıyor.`);
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
