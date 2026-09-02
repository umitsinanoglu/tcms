import '../src/prisma/db-env';
import { PrismaClient, Role } from '@prisma/client';
import { resolveDatabaseEnv } from '../src/prisma/db-env';

const dbConfig = resolveDatabaseEnv();
console.log(`🧹 Target Database Environment: [${dbConfig.environment}]`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbConfig.directUrl || dbConfig.databaseUrl,
    },
  },
});

export async function cleanDummyData() {
  console.log('====================================================');
  console.log('   LOCAL DATABASE DUMMY DATA CLEANUP STARTING       ');
  console.log('====================================================');

  // 1. Initial State Report
  const beforeStats = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    suites: await prisma.suite.count(),
    testCases: await prisma.testCase.count(),
    testSteps: await prisma.testStep.count(),
    testPlans: await prisma.testPlan.count(),
    testRuns: await prisma.testRun.count(),
    testResults: await prisma.testResult.count(),
    defects: await prisma.defect.count(),
    projectSequences: await prisma.projectSequence.count(),
  };

  console.log('📊 Current Record Counts in Database:');
  console.table(beforeStats);

  // 2. Clear dummy operational & transactional data in strict foreign key order
  console.log('\n🗑️  Deleting dummy operational data...');

  const deletedDefects = await prisma.defect.deleteMany({});
  console.log(`✓ Deleted ${deletedDefects.count} defects`);

  const deletedResults = await prisma.testResult.deleteMany({});
  console.log(`✓ Deleted ${deletedResults.count} test results`);

  const deletedSteps = await prisma.testStep.deleteMany({});
  console.log(`✓ Deleted ${deletedSteps.count} test steps`);

  const deletedCases = await prisma.testCase.deleteMany({});
  console.log(`✓ Deleted ${deletedCases.count} test cases`);

  const deletedSuites = await prisma.suite.deleteMany({});
  console.log(`✓ Deleted ${deletedSuites.count} test suites`);

  const deletedRuns = await prisma.testRun.deleteMany({});
  console.log(`✓ Deleted ${deletedRuns.count} test runs`);

  const deletedPlans = await prisma.testPlan.deleteMany({});
  console.log(`✓ Deleted ${deletedPlans.count} test plans`);

  const deletedSequences = await prisma.projectSequence.deleteMany({});
  console.log(`✓ Deleted ${deletedSequences.count} project sequences`);

  const deletedProjects = await prisma.project.deleteMany({});
  console.log(`✓ Deleted ${deletedProjects.count} projects`);

  // 3. Verify and protect User accounts
  console.log('\n👥 Verifying User accounts and essential roles...');
  const defaultUsers = [
    {
      name: 'Ümit Sinanoğlu (Admin)',
      email: 'admin@ttb.com.tr',
      role: Role.ADMIN,
      department: 'Yazılım & Test Mimarisi',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Selin Kaya (Test Lead)',
      email: 'selin.kaya@ttb.com.tr',
      role: Role.TEST_LEAD,
      department: 'QA & Test Yönetimi',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Burak Demir (Test Uzmanı)',
      email: 'burak.demir@ttb.com.tr',
      role: Role.TESTER,
      department: 'Otomasyon & Manuel Test',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Caner Tekin',
      email: 'otomasyon@ttb.com.tr',
      role: Role.AUTOMATION_ENGINEER,
      department: 'Test Otomasyon & TAC',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Gözlemci Kullanıcı (Viewer)',
      email: 'viewer@ttb.com.tr',
      role: Role.VIEWER,
      department: 'İş Analizi & Yönetim',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Zeynep Türkel',
      email: 'zeynep.turkel@turkbank.com.tr',
      role: Role.TEST_LEAD,
      department: 'Kalite Güvence / QA',
      avatarUrl: null,
      isActive: true,
    },
  ];

  for (const user of defaultUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });
    if (!existing) {
      await prisma.user.create({ data: user });
      console.log(`+ Added user: ${user.name} (${user.role})`);
    } else {
      console.log(`✓ Preserved existing user: ${existing.name} (${existing.role}) - ${existing.email}`);
    }
  }

  // 4. Final State Report
  const afterStats = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    suites: await prisma.suite.count(),
    testCases: await prisma.testCase.count(),
    testSteps: await prisma.testStep.count(),
    testPlans: await prisma.testPlan.count(),
    testRuns: await prisma.testRun.count(),
    testResults: await prisma.testResult.count(),
    defects: await prisma.defect.count(),
    projectSequences: await prisma.projectSequence.count(),
  };

  console.log('\n📊 Final Record Counts in Database:');
  console.table(afterStats);
  console.log('====================================================');
  console.log('✨ Cleanup Complete! Database is clean and ready.   ');
  console.log('====================================================');
}

if (require.main === module) {
  cleanDummyData()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('❌ Error during cleanup:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
