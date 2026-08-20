import '../src/prisma/db-env';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedUsers() {
  console.log('Seeding initial RBAC users...');

  const defaultUsers = [
    {
      name: 'Ümit Sinanoğlu',
      email: 'admin@ttb.com.tr',
      role: Role.ADMIN,
      department: 'Yazılım & Test Mimarisi',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Selin Kaya',
      email: 'selin.kaya@ttb.com.tr',
      role: Role.TEST_LEAD,
      department: 'QA & Test Yönetimi',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Burak Demir',
      email: 'burak.demir@ttb.com.tr',
      role: Role.TESTER,
      department: 'Otomasyon & Manuel Test',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Gözlemci Kullanıcı',
      email: 'viewer@ttb.com.tr',
      role: Role.VIEWER,
      department: 'İş Analizi & Yönetim',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
      isActive: true,
    },
  ];

  for (const user of defaultUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });
    if (!existing) {
      await prisma.user.create({ data: user });
      console.log(`+ Created user: ${user.name} (${user.role})`);
    } else {
      console.log(`- User already exists: ${user.name} (${user.role})`);
    }
  }

  console.log('RBAC users seeded.');
}

if (require.main === module) {
  seedUsers()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
