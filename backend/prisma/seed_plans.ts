import '../src/prisma/db-env';
import { PrismaClient } from '@prisma/client';
import { resolveDatabaseEnv } from '../src/prisma/db-env';
import { seedUsers } from './seed_users';
import { seedBankingProject } from './seed_banking';

const dbConfig = resolveDatabaseEnv();
console.log(`🌱 Seeding database target: [${dbConfig.environment}]`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbConfig.directUrl || dbConfig.databaseUrl,
    },
  },
});

export async function seedPlans() {
  console.log('🚀 Starting Pure Digital Banking SDLC Database Refresh...');
  console.log('📊 Hierarchy: Banking Projects -> Test Plans, Test Cases (Suites), Test Runs & Results');

  // 1. Clean up all existing tables in proper foreign key order
  console.log('🧹 Clearing all previous data...');
  await prisma.testResult.deleteMany({});
  await prisma.testStep.deleteMany({});
  await prisma.testCase.deleteMany({});
  await prisma.testRun.deleteMany({});
  await prisma.suite.deleteMany({});
  await prisma.testPlan.deleteMany({});
  await prisma.project.deleteMany({});

  // 2. Ensure Users exist
  await seedUsers();

  // 3. Seed 4 Digital Banking SDLC Projects (Mobil, Kurumsal, API Gateway, Siber Güvenlik)
  await seedBankingProject(prisma);

  console.log('✨ All Digital Banking SDLC Data Seeded Successfully!');
}

if (require.main === module) {
  seedPlans()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
