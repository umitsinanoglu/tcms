import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sourceUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tcms_db?schema=public';
const targetUrl = process.env.SUPABASE_DIRECT_URL || process.env.SUPABASE_DATABASE_URL || '';

if (!targetUrl) {
  console.error('❌ Error: SUPABASE_DIRECT_URL or SUPABASE_DATABASE_URL is not set in backend/.env');
  process.exit(1);
}

console.log('====================================================');
console.log('🚀 TCMS: LOCAL DB -> SUPABASE FULL SYNC');
console.log('====================================================');
console.log('Source (Local DB):   ', sourceUrl.replace(/:[^:@]+@/, ':****@'));
console.log('Target (Supabase):   ', targetUrl.replace(/:[^:@]+@/, ':****@'));
console.log('====================================================\n');

const sourcePrisma = new PrismaClient({
  datasources: {
    db: { url: sourceUrl },
  },
});

async function createTargetClient() {
  const directUrl = process.env.SUPABASE_DIRECT_URL;
  const poolerUrl = process.env.SUPABASE_DATABASE_URL;

  const candidates = [directUrl, poolerUrl].filter(Boolean) as string[];
  
  for (const url of candidates) {
    const client = new PrismaClient({ datasources: { db: { url } } });
    try {
      console.log(`  Target bağlantısı deneniyor (${url.includes(':6543') ? 'Port 6543' : 'Port 5432'})...`);
      await client.$connect();
      return { client, url };
    } catch (e: any) {
      await client.$disconnect();
    }
  }
  return null;
}

async function runSync() {
  const startTime = Date.now();
  let targetPrisma: PrismaClient | null = null;

  try {
    // 1. Connection check
    console.log('[1/4] 🔌 Bağlantılar test ediliyor...');
    await sourcePrisma.$connect();
    console.log('  ✓ Local PostgreSQL veritabanına bağlanıldı.');

    const targetSetup = await createTargetClient();
    if (!targetSetup) {
      throw new Error(
        'Supabase veritabanına ulaşılamadı (Port 5432 ve 6543 zaman aşımı).\n' +
        '-> Mevcut ağınız (kurumsal ağ / güvenlik duvarı) dışarı giden PostgreSQL portlarını (5432/6543) engelliyor olabilir.\n' +
        '-> Mobil erişim noktası (Hotspot) veya VPN ile bağlandıktan sonra tekrar "npm run sync:supabase" komutunu çalıştırabilirsiniz.'
      );
    }
    targetPrisma = targetSetup.client;
    console.log('  ✓ Supabase veritabanına bağlanıldı!');

    // 2. Fetch all local data
    console.log('\n[2/4] 📦 Local veritabanından veriler okunuyor...');
    const users = await sourcePrisma.user.findMany();
    const projects = await sourcePrisma.project.findMany();
    const testPlans = await sourcePrisma.testPlan.findMany();
    const suites = await sourcePrisma.suite.findMany();
    const testCases = await sourcePrisma.testCase.findMany();
    const testSteps = await sourcePrisma.testStep.findMany();
    const testRuns = await sourcePrisma.testRun.findMany();
    const testResults = await sourcePrisma.testResult.findMany();

    console.log(`  Local Veri Özeti:
    • Kullanıcılar (Users):        ${users.length}
    • Projeler (Projects):         ${projects.length}
    • Test Planları (TestPlans):   ${testPlans.length}
    • Paketler/Modüller (Suites):  ${suites.length}
    • Test Senaryoları (TestCases):${testCases.length}
    • Test Adımları (TestSteps):   ${testSteps.length}
    • Test Koşumları (TestRuns):   ${testRuns.length}
    • Test Sonuçları (TestResults):${testResults.length}`);

    // 3. Clean Target DB (Supabase)
    console.log('\n[3/4] 🧹 Supabase üzerindeki mevcut veriler temizleniyor...');
    
    // Reverse dependency order deletion
    const delResults = await targetPrisma.testResult.deleteMany({});
    console.log(`  ✓ Test Results temizlendi (${delResults.count} kayıt)`);

    const delSteps = await targetPrisma.testStep.deleteMany({});
    console.log(`  ✓ Test Steps temizlendi (${delSteps.count} kayıt)`);

    const delRuns = await targetPrisma.testRun.deleteMany({});
    console.log(`  ✓ Test Runs temizlendi (${delRuns.count} kayıt)`);

    const delCases = await targetPrisma.testCase.deleteMany({});
    console.log(`  ✓ Test Cases temizlendi (${delCases.count} kayıt)`);

    // Remove self-referencing FK before deleting suites
    await targetPrisma.suite.updateMany({ data: { parentId: null } });
    const delSuites = await targetPrisma.suite.deleteMany({});
    console.log(`  ✓ Suites temizlendi (${delSuites.count} kayıt)`);

    const delPlans = await targetPrisma.testPlan.deleteMany({});
    console.log(`  ✓ Test Plans temizlendi (${delPlans.count} kayıt)`);

    const delProjects = await targetPrisma.project.deleteMany({});
    console.log(`  ✓ Projects temizlendi (${delProjects.count} kayıt)`);

    const delUsers = await targetPrisma.user.deleteMany({});
    console.log(`  ✓ Users temizlendi (${delUsers.count} kayıt)`);

    console.log('  ✨ Supabase tamamen temizlendi.');

    // 4. Insert data into Supabase in foreign-key dependency order
    console.log('\n[4/4] 📤 Local veriler Supabase\'e aktarılıyor...');

    // 1. Users
    if (users.length > 0) {
      await targetPrisma.user.createMany({
        data: users,
        skipDuplicates: true,
      });
      console.log(`  ✓ ${users.length} Kullanıcı (User) aktarıldı.`);
    }

    // 2. Projects
    if (projects.length > 0) {
      await targetPrisma.project.createMany({
        data: projects,
        skipDuplicates: true,
      });
      console.log(`  ✓ ${projects.length} Proje (Project) aktarıldı.`);
    }

    // 3. Test Plans
    if (testPlans.length > 0) {
      await targetPrisma.testPlan.createMany({
        data: testPlans,
        skipDuplicates: true,
      });
      console.log(`  ✓ ${testPlans.length} Test Planı (TestPlan) aktarıldı.`);
    }

    // 4. Suites (insert without parentId first to avoid FK constraint order issues)
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
      console.log(`  ✓ ${suites.length} Suite aktarıldı (${childSuites.length} iç içe hiyerarşi güncellendi).`);
    }

    // 5. Test Cases (batched)
    if (testCases.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < testCases.length; i += chunkSize) {
        const chunk = testCases.slice(i, i + chunkSize);
        await targetPrisma.testCase.createMany({
          data: chunk,
          skipDuplicates: true,
        });
      }
      console.log(`  ✓ ${testCases.length} Test Senaryosu (TestCase) aktarıldı.`);
    }

    // 6. Test Steps (batched)
    if (testSteps.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < testSteps.length; i += chunkSize) {
        const chunk = testSteps.slice(i, i + chunkSize);
        await targetPrisma.testStep.createMany({
          data: chunk as any,
          skipDuplicates: true,
        });
      }
      console.log(`  ✓ ${testSteps.length} Test Adımı (TestStep) aktarıldı.`);
    }

    // 7. Test Runs
    if (testRuns.length > 0) {
      await targetPrisma.testRun.createMany({
        data: testRuns,
        skipDuplicates: true,
      });
      console.log(`  ✓ ${testRuns.length} Test Koşumu (TestRun) aktarıldı.`);
    }

    // 8. Test Results (batched)
    if (testResults.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < testResults.length; i += chunkSize) {
        const chunk = testResults.slice(i, i + chunkSize);
        await targetPrisma.testResult.createMany({
          data: chunk,
          skipDuplicates: true,
        });
      }
      console.log(`  ✓ ${testResults.length} Test Sonucu (TestResult) aktarıldı.`);
    }

    // Verification
    console.log('\n====================================================');
    console.log('🔍 DOĞRULAMA & SAYIM RAPORU');
    console.log('====================================================');
    const tUsers = await targetPrisma.user.count();
    const tProjects = await targetPrisma.project.count();
    const tPlans = await targetPrisma.testPlan.count();
    const tSuites = await targetPrisma.suite.count();
    const tCases = await targetPrisma.testCase.count();
    const tSteps = await targetPrisma.testStep.count();
    const tRuns = await targetPrisma.testRun.count();
    const tResults = await targetPrisma.testResult.count();

    console.log(`
      Kategori         | Local DB | Supabase | Durum
      -----------------|----------|----------|--------
      Users            |    ${users.length.toString().padEnd(5)} |    ${tUsers.toString().padEnd(5)} | ${users.length === tUsers ? '✅ Başarılı' : '⚠️ Fark var'}
      Projects         |    ${projects.length.toString().padEnd(5)} |    ${tProjects.toString().padEnd(5)} | ${projects.length === tProjects ? '✅ Başarılı' : '⚠️ Fark var'}
      Test Plans       |    ${testPlans.length.toString().padEnd(5)} |    ${tPlans.toString().padEnd(5)} | ${testPlans.length === tPlans ? '✅ Başarılı' : '⚠️ Fark var'}
      Suites           |    ${suites.length.toString().padEnd(5)} |    ${tSuites.toString().padEnd(5)} | ${suites.length === tSuites ? '✅ Başarılı' : '⚠️ Fark var'}
      Test Cases       |    ${testCases.length.toString().padEnd(5)} |    ${tCases.toString().padEnd(5)} | ${testCases.length === tCases ? '✅ Başarılı' : '⚠️ Fark var'}
      Test Steps       |    ${testSteps.length.toString().padEnd(5)} |    ${tSteps.toString().padEnd(5)} | ${testSteps.length === tSteps ? '✅ Başarılı' : '⚠️ Fark var'}
      Test Runs        |    ${testRuns.length.toString().padEnd(5)} |    ${tRuns.toString().padEnd(5)} | ${testRuns.length === tRuns ? '✅ Başarılı' : '⚠️ Fark var'}
      Test Results     |    ${testResults.length.toString().padEnd(5)} |    ${tResults.toString().padEnd(5)} | ${testResults.length === tResults ? '✅ Başarılı' : '⚠️ Fark var'}
    `);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`🎉 EŞİTLEME TAMAMLANDI! (${elapsed} saniye)`);
    console.log('====================================================\n');
  } catch (error: any) {
    console.error('\n❌ Eşitleme sırasında hata oluştu:');
    console.error(error?.message || error);
    process.exit(1);
  } finally {
    await sourcePrisma.$disconnect();
    if (targetPrisma) {
      await targetPrisma.$disconnect();
    }
  }
}

runSync();
