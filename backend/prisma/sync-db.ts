import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sourceUrl = process.env.TTB_LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@192.168.1.189:5432/tcms_db?schema=public';
const targetUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tcms_db?schema=public';

console.log('--- DATABASE SYNC START ---');
console.log('Source (TTB_LOCAL):', sourceUrl.replace(/:[^:@]+@/, ':****@'));
console.log('Target (LOCAL):    ', targetUrl.replace(/:[^:@]+@/, ':****@'));

const sourcePrisma = new PrismaClient({
  datasources: {
    db: { url: sourceUrl },
  },
});

const targetPrisma = new PrismaClient({
  datasources: {
    db: { url: targetUrl },
  },
});

async function runSync() {
  try {
    console.log('\n[1/4] Testing connections...');
    await sourcePrisma.$connect();
    console.log('✓ Connected to Source DB (ttb_local)');
    
    await targetPrisma.$connect();
    console.log('✓ Connected to Target DB (local)');

    console.log('\n[2/4] Fetching all data from Source DB...');
    const users = await sourcePrisma.user.findMany();
    const projects = await sourcePrisma.project.findMany();
    const suites = await sourcePrisma.suite.findMany();
    const testCases = await sourcePrisma.testCase.findMany();
    const testSteps = await sourcePrisma.testStep.findMany();
    const testRuns = await sourcePrisma.testRun.findMany();
    const testResults = await sourcePrisma.testResult.findMany();

    console.log(`Found in Source:
  - Users:       ${users.length}
  - Projects:    ${projects.length}
  - Suites:      ${suites.length}
  - Test Cases:  ${testCases.length}
  - Test Steps:  ${testSteps.length}
  - Test Runs:   ${testRuns.length}
  - Test Results: ${testResults.length}`);

    console.log('\n[3/4] Cleaning Target DB...');
    // Delete in reverse dependency order
    await targetPrisma.testResult.deleteMany({});
    await targetPrisma.testStep.deleteMany({});
    await targetPrisma.testRun.deleteMany({});
    await targetPrisma.testCase.deleteMany({});
    await targetPrisma.suite.deleteMany({});
    await targetPrisma.project.deleteMany({});
    await targetPrisma.user.deleteMany({});
    console.log('✓ Cleaned existing records in Target DB');

    console.log('\n[4/4] Inserting data into Target DB...');

    // 1. Users
    if (users.length > 0) {
      await targetPrisma.user.createMany({
        data: users,
        skipDuplicates: true,
      });
      console.log(`✓ Inserted ${users.length} Users`);
    }

    // 2. Projects
    if (projects.length > 0) {
      await targetPrisma.project.createMany({
        data: projects,
        skipDuplicates: true,
      });
      console.log(`✓ Inserted ${projects.length} Projects`);
    }

    // 3. Suites (insert without parentId first to avoid FK constraint order issues)
    if (suites.length > 0) {
      const suitesWithoutParent = suites.map((s) => ({
        id: s.id,
        name: s.name,
        projectId: s.projectId,
        parentId: null,
        orderIndex: s.orderIndex,
      }));

      await targetPrisma.suite.createMany({
        data: suitesWithoutParent,
        skipDuplicates: true,
      });

      // Update parentId for child suites
      const childSuites = suites.filter((s) => s.parentId !== null);
      for (const suite of childSuites) {
        await targetPrisma.suite.update({
          where: { id: suite.id },
          data: { parentId: suite.parentId },
        });
      }
      console.log(`✓ Inserted ${suites.length} Suites (${childSuites.length} nested)`);
    }

    // 4. Test Cases
    if (testCases.length > 0) {
      // Chunk insertions if large
      const chunkSize = 100;
      for (let i = 0; i < testCases.length; i += chunkSize) {
        const chunk = testCases.slice(i, i + chunkSize);
        await targetPrisma.testCase.createMany({
          data: chunk,
          skipDuplicates: true,
        });
      }
      console.log(`✓ Inserted ${testCases.length} Test Cases`);
    }

    // 5. Test Steps
    if (testSteps.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < testSteps.length; i += chunkSize) {
        const chunk = testSteps.slice(i, i + chunkSize);
        await targetPrisma.testStep.createMany({
          data: chunk as any,
          skipDuplicates: true,
        });
      }
      console.log(`✓ Inserted ${testSteps.length} Test Steps`);
    }

    // 6. Test Runs
    if (testRuns.length > 0) {
      await targetPrisma.testRun.createMany({
        data: testRuns,
        skipDuplicates: true,
      });
      console.log(`✓ Inserted ${testRuns.length} Test Runs`);
    }

    // 7. Test Results
    if (testResults.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < testResults.length; i += chunkSize) {
        const chunk = testResults.slice(i, i + chunkSize);
        await targetPrisma.testResult.createMany({
          data: chunk,
          skipDuplicates: true,
        });
      }
      console.log(`✓ Inserted ${testResults.length} Test Results`);
    }

    console.log('\n--- VERIFYING TARGET DB COUNTS ---');
    const targetUsersCount = await targetPrisma.user.count();
    const targetProjectsCount = await targetPrisma.project.count();
    const targetSuitesCount = await targetPrisma.suite.count();
    const targetTestCasesCount = await targetPrisma.testCase.count();
    const targetTestStepsCount = await targetPrisma.testStep.count();
    const targetTestRunsCount = await targetPrisma.testRun.count();
    const targetTestResultsCount = await targetPrisma.testResult.count();

    console.log(`Target DB Counts:
  - Users:       ${targetUsersCount} / ${users.length}
  - Projects:    ${targetProjectsCount} / ${projects.length}
  - Suites:      ${targetSuitesCount} / ${suites.length}
  - Test Cases:  ${targetTestCasesCount} / ${testCases.length}
  - Test Steps:  ${targetTestStepsCount} / ${testSteps.length}
  - Test Runs:   ${targetTestRunsCount} / ${testRuns.length}
  - Test Results: ${targetTestResultsCount} / ${testResults.length}`);

    console.log('\n🎉 DATA SYNC COMPLETED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Sync failed with error:', error);
    process.exit(1);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

runSync();
