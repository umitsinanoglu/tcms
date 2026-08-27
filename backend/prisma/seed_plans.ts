import '../src/prisma/db-env';
import { PrismaClient, TestType, Priority, RunStatus, ResultStatus, PlanStatus, Role } from '@prisma/client';
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

function createEvidenceScreenshot(
  type: 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED',
  title: string,
  subtitle: string,
  details: string[]
): string {
  const badgeBg =
    type === 'PASSED'
      ? '#10b981'
      : type === 'FAILED'
      ? '#f43f5e'
      : type === 'BLOCKED'
      ? '#a855f7'
      : '#64748b';
  const headerBg =
    type === 'PASSED'
      ? '#064e3b'
      : type === 'FAILED'
      ? '#881337'
      : type === 'BLOCKED'
      ? '#581c87'
      : '#1e293b';

  const detailLines = details
    .map(
      (d, i) =>
        `<text x="30" y="${180 + i * 24}" fill="#cbd5e1" font-family="monospace" font-size="12">${d
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</text>`
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="420" viewBox="0 0 700 420">
    <rect width="100%" height="100%" fill="#0f172a" rx="12"/>
    <rect x="0" y="0" width="700" height="42" fill="#1e293b" rx="12"/>
    <circle cx="25" cy="21" r="6" fill="#ef4444"/>
    <circle cx="45" cy="21" r="6" fill="#f59e0b"/>
    <circle cx="65" cy="21" r="6" fill="#10b981"/>
    <text x="90" y="26" fill="#94a3b8" font-family="sans-serif" font-size="12" font-weight="bold">TCMS Test Execution Evidence &amp; Log Capture</text>
    
    <rect x="20" y="60" width="660" height="60" fill="${headerBg}" rx="8" stroke="${badgeBg}" stroke-width="1.5"/>
    <rect x="35" y="74" width="84" height="32" fill="${badgeBg}" rx="6"/>
    <text x="77" y="95" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${type}</text>
    <text x="135" y="88" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">${title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</text>
    <text x="135" y="108" fill="#e2e8f0" font-family="sans-serif" font-size="12">${subtitle
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</text>
    
    <rect x="20" y="135" width="660" height="260" fill="#020617" rx="8" stroke="#334155" stroke-width="1"/>
    <text x="30" y="158" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold">&gt; EXECUTION LOGS &amp; STEP ASSERTIONS:</text>
    ${detailLines}
    <text x="670" y="380" fill="#64748b" font-family="monospace" font-size="10" text-anchor="end">TIMESTAMP: 2026-08-25 | TCMS ENGINE v2.0</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function seedPlans() {
  console.log('🚀 Starting Enterprise Database Refresh according to New Hierarchy...');
  console.log('📊 Hierarchy: Test Projects -> Test Plans, Test Cases (Suites), Test Runs & Results');

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

  // =========================================================================
  // 0. PROJE 0: BANK - NeoBank Dijital Bankacılık Platformu
  // =========================================================================
  await seedBankingProject(prisma);

  // =========================================================================
  // 1. PROJE 1: ECOMM - E-Ticaret Web & Mobil Platformu
  // =========================================================================
  console.log('📦 [1/5] Creating Project: ECOMM - E-Ticaret Web & Mobil Platformu...');
  const projEcomm = await prisma.project.create({
    data: {
      name: 'E-Ticaret Web & Mobil Platformu',
      key: 'ECOMM',
      description:
        'Kullanıcı kimlik doğrulama, ürün kataloğu, akıllı filtreleme, sepet indirim motoru, 3D Secure 2.0 ödeme geçidi ve sipariş takibi kapsamlı e-ticaret platformu.',
      jiraProjectKey: 'COMM',
    },
  });

  // Test Planları (ECOMM)
  const planEcomm1 = await prisma.testPlan.create({
    data: {
      title: 'Sprint 48 Regresyon Test Planı',
      description: 'Sprint 48 kapsamındaki ödeme, sepet ve kupon modüllerinin tam uçtan uca regresyon doğrulaması.',
      version: 'v2.4.0',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'Kullanıcı Girişi, Sepet İndirimleri, 3D Secure Ödeme ve Sipariş Oluşturma',
      requirements: 'COMM-101, COMM-102, COMM-105, COMM-110',
      projectId: projEcomm.id,
    },
  });

  const planEcomm2 = await prisma.testPlan.create({
    data: {
      title: 'Black Friday Yüksek Yük & Ödeme Kabul Planı',
      description: 'Yüksek eşzamanlı sipariş ve kupon kodu kullanımı durumunda sistem kararlılığı ve ödeme entegrasyonu kabul testleri.',
      version: 'v2.4.1',
      environment: 'PRODUCTION',
      status: PlanStatus.COMPLETED,
      scope: 'Ödeme Ağ Geçidi, Dinamik Fiyatlandırma, Sepet Senkronizasyonu',
      requirements: 'COMM-201, COMM-204, COMM-208',
      projectId: projEcomm.id,
    },
  });

  const planEcomm3 = await prisma.testPlan.create({
    data: {
      title: 'Mobil V3.0 Lansman Kabul Planı',
      description: 'iOS ve Android yeni UI bileşenleri, biyometrik giriş ve anlık push bildirim doğrulama planı.',
      version: 'v3.0.0',
      environment: 'UAT',
      status: PlanStatus.DRAFT,
      scope: 'iOS & Android Uygulama Kabulü, Biyometrik Kimlik Doğrulama',
      requirements: 'COMM-301, COMM-305',
      projectId: projEcomm.id,
    },
  });

  // Suites (ECOMM)
  const sEcommAuth = await prisma.suite.create({
    data: { name: 'Kimlik Doğrulama & Oturum Yönetimi', projectId: projEcomm.id, orderIndex: 0 },
  });
  const sEcommAuth2FA = await prisma.suite.create({
    data: { name: '2FA SMS & Biyometrik Giriş', projectId: projEcomm.id, parentId: sEcommAuth.id, orderIndex: 0 },
  });
  const sEcommAuthReset = await prisma.suite.create({
    data: { name: 'Şifre Sıfırlama & Token Doğrulama', projectId: projEcomm.id, parentId: sEcommAuth.id, orderIndex: 1 },
  });

  const sEcommCatalog = await prisma.suite.create({
    data: { name: 'Ürün Kataloğu & Arama Motoru', projectId: projEcomm.id, orderIndex: 1 },
  });
  const sEcommCatalogFilter = await prisma.suite.create({
    data: { name: 'Elasticsearch Filtreleme & Sıralama', projectId: projEcomm.id, parentId: sEcommCatalog.id, orderIndex: 0 },
  });
  const sEcommCatalogDetail = await prisma.suite.create({
    data: { name: 'Ürün Detay & Varyant Seçimi', projectId: projEcomm.id, parentId: sEcommCatalog.id, orderIndex: 1 },
  });

  const sEcommCart = await prisma.suite.create({
    data: { name: 'Alışveriş Sepeti & İndirim Motoru', projectId: projEcomm.id, orderIndex: 2 },
  });
  const sEcommCartCoupon = await prisma.suite.create({
    data: { name: 'Kupon & Promosyon Uygulama', projectId: projEcomm.id, parentId: sEcommCart.id, orderIndex: 0 },
  });

  const sEcommCheckout = await prisma.suite.create({
    data: { name: 'Ödeme & Checkout Akışı', projectId: projEcomm.id, orderIndex: 3 },
  });
  const sEcommCheckout3DS = await prisma.suite.create({
    data: { name: '3D Secure Kredi Kartı Ödeme', projectId: projEcomm.id, parentId: sEcommCheckout.id, orderIndex: 0 },
  });
  const sEcommCheckoutWallet = await prisma.suite.create({
    data: { name: 'Dijital Cüzdan & Bakiye', projectId: projEcomm.id, parentId: sEcommCheckout.id, orderIndex: 1 },
  });

  const sEcommOrders = await prisma.suite.create({
    data: { name: 'Sipariş & İade Takibi', projectId: projEcomm.id, orderIndex: 4 },
  });

  // Test Cases (ECOMM)
  const tcEcomm1 = await prisma.testCase.create({
    data: {
      code: 'ECOMM-TC-01',
      title: 'Geçerli Kullanıcı Bilgileri ile Başarılı Giriş Yapma',
      description: 'Kullanıcının doğru e-posta ve şifre girdiğinde JWT token alıp ana sayfaya yönlendirildiği doğrulanır.\nTags: @web @auth @smoke @regression @p1',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Kullanıcının veritabanında aktif ve onaylanmış e-posta hesabı bulunmalıdır.',
      projectId: projEcomm.id,
      suiteId: sEcommAuth.id,
      jiraStoryKey: 'COMM-101',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-101',
      steps: {
        create: [
          { stepNumber: 1, action: 'https://shop.company.com/login sayfasına gidilir.', expectedResult: 'Giriş formu, e-posta ve şifre input alanları eksiksiz yüklenir.' },
          { stepNumber: 2, action: 'E-posta alanına "testuser@tcms.dev" ve şifre alanına "P@ssw0rd2026!" yazılır.', expectedResult: 'Karakterler maskeli ve doğru formatta kabul edilir.' },
          { stepNumber: 3, action: '"Giriş Yap" butonuna tıklanır.', expectedResult: '200 OK yanıtı alınır, profil avatarı ve "Hoş geldiniz" bannerı görüntülenir.' },
        ],
      },
    },
  });

  const tcEcomm2 = await prisma.testCase.create({
    data: {
      code: 'ECOMM-TC-02',
      title: 'Hatalı Şifre İle Giriş Denemesinde Güvenlik Uyarısı Kontrolü',
      description: 'Hatalı parola girildiğinde sistem genel bir hata mesajı vermeli ve brute-force koruması için sayaç artırmalıdır.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.NORMAL,
      precondition: 'Giriş ekranında bulunulmalıdır.',
      projectId: projEcomm.id,
      suiteId: sEcommAuth.id,
      jiraStoryKey: 'COMM-102',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-102',
      steps: {
        create: [
          { stepNumber: 1, action: 'Geçerli e-posta ve yanlış parola girilir.', expectedResult: 'Metin alanları doldurulur.' },
          { stepNumber: 2, action: '"Giriş Yap" butonuna tıklanır.', expectedResult: '"E-posta veya şifre hatalı" uyarısı kırmızı renkle gösterilir.' },
        ],
      },
    },
  });

  const tcEcomm3 = await prisma.testCase.create({
    data: {
      code: 'ECOMM-TC-03',
      title: '2FA SMS Doğrulama Kodunun Başarılı Doğrulanması',
      description: '2FA aktif kullanıcılar için SMS ile gönderilen 6 haneli OTP kodunun 3 dakika içinde girilmesi senaryosu.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.BLOCKER,
      precondition: 'Kullanıcı 2FA aktif bir hesaba sahip olmalıdır.',
      projectId: projEcomm.id,
      suiteId: sEcommAuth2FA.id,
      jiraStoryKey: 'COMM-103',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-103',
      steps: {
        create: [
          { stepNumber: 1, action: 'Kullanıcı adı ve şifre girilip 2FA ekranına geçilir.', expectedResult: '6 kutulu OTP giriş ekranı açılır.' },
          { stepNumber: 2, action: 'Telefona gelen 6 haneli SMS kodu girilir.', expectedResult: 'Karakterler otomatik sonraki kutuya geçer.' },
          { stepNumber: 3, action: '"Doğrula" butonuna basılır.', expectedResult: 'Oturum açılır ve ana sayfaya yönlendirilir.' },
        ],
      },
    },
  });

  const tcEcomm4 = await prisma.testCase.create({
    data: {
      code: 'ECOMM-TC-04',
      title: 'Fiyat ve Kategori Bazlı Filtrelemenin Doğruluğu',
      description: 'Ürün listesinde min-max fiyat ve alt kategori seçildiğinde sonuçların anlık güncellenmesi.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Katalogda en az 50 aktif ürün bulunmalıdır.',
      projectId: projEcomm.id,
      suiteId: sEcommCatalogFilter.id,
      jiraStoryKey: 'COMM-104',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-104',
      steps: {
        create: [
          { stepNumber: 1, action: 'Elektronik kategorisi açılır.', expectedResult: 'Filtre paneli ve ürün kartları listelenir.' },
          { stepNumber: 2, action: 'Fiyat aralığı 1000 - 5000 TL seçilir.', expectedResult: 'Listelenen tüm ürünlerin fiyatı bu aralıkta kalır.' },
        ],
      },
    },
  });

  const tcEcomm5 = await prisma.testCase.create({
    data: {
      code: 'ECOMM-TC-05',
      title: 'Geçerli İndirim Kuponu Kodu ile Sepet Toplamının Düşürülmesi',
      description: '%20 indirim sağlayan "INDIRIM20" kodunun sepete uygulanması ve KDV dahil tutarın düşmesi.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Sepette minimum 200 TL değerinde ürün olmalıdır.',
      projectId: projEcomm.id,
      suiteId: sEcommCartCoupon.id,
      jiraStoryKey: 'COMM-105',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-105',
      steps: {
        create: [
          { stepNumber: 1, action: 'Sepet sayfasına gidilir.', expectedResult: 'Sepet toplamı 500 TL olarak görünür.' },
          { stepNumber: 2, action: '"Kupon Kodu" alanına "INDIRIM20" yazılır ve "Uygula"ya basılır.', expectedResult: '"%20 Kupon uygulandı" mesajı çıkar.' },
          { stepNumber: 3, action: 'Ödenecek tutar kontrol edilir.', expectedResult: 'Tutar 400 TL olarak güncellenir.' },
        ],
      },
    },
  });

  const tcEcomm6 = await prisma.testCase.create({
    data: {
      code: 'ECOMM-TC-06',
      title: '3D Secure Kredi Kartı ile Başarılı Ödeme ve Sipariş Onayı',
      description: 'Mastercard / Visa 3D Secure yönlendirmesi ve başarılı SMS şifresi sonrası sipariş numarası üretilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.BLOCKER,
      precondition: 'Sepette ürün olmalı ve teslimat adresi seçilmiş olmalıdır.',
      projectId: projEcomm.id,
      suiteId: sEcommCheckout3DS.id,
      jiraStoryKey: 'COMM-106',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-106',
      steps: {
        create: [
          { stepNumber: 1, action: 'Kart numarası, SKT ve CVC2 bilgileri girilir.', expectedResult: 'Banka logosu tespit edilir ve form doğrulanır.' },
          { stepNumber: 2, action: '"Siparişi Tamamla" butonuna basılır.', expectedResult: 'Banka 3DS simülasyon sayfasına yönlendirilir.' },
          { stepNumber: 3, action: 'Doğrulama kodu girilir ve onaylanır.', expectedResult: '"Siparişiniz Alındı - #ORD-2026-8812" ekranı açılır.' },
        ],
      },
    },
  });

  const tcEcomm7 = await prisma.testCase.create({
    data: {
      code: 'ECOMM-TC-07',
      title: 'Yetersiz Bakiye ile Kart Ödeme Denemesinde Uygun Hata Mesajı',
      description: 'Banka yetersiz bakiye (Error 51) döndüğünde kullanıcıya anlaşılır hata mesajı gösterilmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Test kartı limiti sıfır olarak ayarlanmış olmalıdır.',
      projectId: projEcomm.id,
      suiteId: sEcommCheckout3DS.id,
      jiraStoryKey: 'COMM-107',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-107',
      steps: {
        create: [
          { stepNumber: 1, action: 'Limiti yetersiz test kartı girilir.', expectedResult: 'Kart bilgileri kabul edilir.' },
          { stepNumber: 2, action: '"Ödeme Yap" butonuna basılır.', expectedResult: '"Kartınızda yetersiz bakiye bulunmaktadır" hatası gösterilir.' },
        ],
      },
    },
  });

  const tcEcomm8 = await prisma.testCase.create({
    data: {
      code: 'ECOMM-TC-08',
      title: 'Müşteri Sipariş İptali ve Otomatik Para İadesi Akışı',
      description: 'Henüz kargoya verilmemiş "Hazırlanıyor" durumundaki siparişin iptal edilmesi ve iade kaydı oluşturulması.',
      executionType: 'MANUAL',
      type: TestType.WEB,
      priority: Priority.NORMAL,
      precondition: 'Kullanıcının "Hazırlanıyor" statüsünde bir siparişi bulunmalıdır.',
      projectId: projEcomm.id,
      suiteId: sEcommOrders.id,
      jiraStoryKey: 'COMM-108',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-108',
      steps: {
        create: [
          { stepNumber: 1, action: 'Siparişlerim sayfasına gidilir.', expectedResult: 'Aktif sipariş kartı görüntülenir.' },
          { stepNumber: 2, action: '"Siparişi İptal Et" butonuna tıklanır ve neden seçilir.', expectedResult: 'Onay modalı açılır.' },
          { stepNumber: 3, action: 'İptal onaylanır.', expectedResult: 'Sipariş statüsü "İptal Edildi" olur ve iade süreci başlar.' },
        ],
      },
    },
  });

  // Test Runs (ECOMM)
  const runEcomm1 = await prisma.testRun.create({
    data: {
      title: 'Sprint 48 Otomasyon Koşumu #12',
      version: 'v2.4.0',
      environment: 'STAGING',
      status: RunStatus.COMPLETED,
      executedBy: 'Selin Kaya (Test Lead)',
      testerEmail: 'selin.kaya@ttb.com.tr',
      projectId: projEcomm.id,
      testPlanId: planEcomm1.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: runEcomm1.id,
        testCaseId: tcEcomm1.id,
        status: ResultStatus.PASSED,
        executionMs: 342,
        executedBy: 'Selin Kaya',
        testerEmail: 'selin.kaya@ttb.com.tr',
        environment: 'STAGING',
        platform: 'WEB',
        appVersion: 'v2.4.0',
        device: 'Chrome 128 (macOS Sonoma)',
        userProfile: 'Standart E-Ticaret Üyesi',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Kullanıcı JWT token başarıyla alındı ve ana sayfaya yönlendirildi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Giriş Başarılı (JWT OK)', '200 OK - Redirect /home', [
          '[INFO] POST /api/v1/auth/login -> HTTP 200',
          '[ASSERT] response.body.token exists -> TRUE',
          '[ASSERT] response.body.user.email == "testuser@tcms.dev" -> TRUE',
          '[TIME] Total Duration: 342ms',
        ]),
      },
      {
        testRunId: runEcomm1.id,
        testCaseId: tcEcomm2.id,
        status: ResultStatus.PASSED,
        executionMs: 215,
        executedBy: 'Selin Kaya',
        testerEmail: 'selin.kaya@ttb.com.tr',
        environment: 'STAGING',
        platform: 'WEB',
        appVersion: 'v2.4.0',
        device: 'Chrome 128 (macOS Sonoma)',
        userProfile: 'Misafir Kullanıcı (Anonim)',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Hatalı şifre denemesinde 401 Unauthorized ve brute-force uyarısı doğrulandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Hatalı Şifre Kontrolü', '401 Unauthorized - Error Banner', [
          '[INFO] POST /api/v1/auth/login with invalid password',
          '[ASSERT] response.status == 401 -> TRUE',
          '[ASSERT] error.message == "E-posta veya şifre hatalı" -> TRUE',
          '[TIME] Total Duration: 215ms',
        ]),
      },
      {
        testRunId: runEcomm1.id,
        testCaseId: tcEcomm3.id,
        status: ResultStatus.PASSED,
        executionMs: 620,
        executedBy: 'Selin Kaya',
        testerEmail: 'selin.kaya@ttb.com.tr',
        environment: 'STAGING',
        platform: 'WEB',
        appVersion: 'v2.4.0',
        device: 'Firefox 129 (Ubuntu 24.04)',
        userProfile: '2FA Korumalı VIP Müşteri',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: '6 haneli SMS OTP kodu 620ms içinde doğrulandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', '2FA SMS OTP Doğrulama', '200 OK - MFA Session Validated', [
          '[INFO] POST /api/v1/auth/verify-2fa -> 200 OK',
          '[ASSERT] mfaToken valid -> TRUE',
          '[TIME] Total Duration: 620ms',
        ]),
      },
      {
        testRunId: runEcomm1.id,
        testCaseId: tcEcomm4.id,
        status: ResultStatus.PASSED,
        executionMs: 480,
        executedBy: 'Selin Kaya',
        testerEmail: 'selin.kaya@ttb.com.tr',
        environment: 'STAGING',
        platform: 'WEB',
        appVersion: 'v2.4.0',
        device: 'Chrome 128 (Windows 11)',
        userProfile: 'Standart Alıcı',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Elasticsearch "kablosuz kulaklık" sorgusu 480ms içinde 42 ürün döndürdü.',
      },
      {
        testRunId: runEcomm1.id,
        testCaseId: tcEcomm5.id,
        status: ResultStatus.PASSED,
        executionMs: 290,
        executedBy: 'Selin Kaya',
        testerEmail: 'selin.kaya@ttb.com.tr',
        environment: 'STAGING',
        platform: 'WEB',
        appVersion: 'v2.4.0',
        device: 'Safari 17.5 (macOS)',
        userProfile: 'Kupon Kullanan Üye',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'YAZ2026 %20 indirim kuponu sepete uygulandı.',
      },
      {
        testRunId: runEcomm1.id,
        testCaseId: tcEcomm6.id,
        status: ResultStatus.PASSED,
        executionMs: 1420,
        executedBy: 'Selin Kaya',
        testerEmail: 'selin.kaya@ttb.com.tr',
        environment: 'STAGING',
        platform: 'WEB',
        appVersion: 'v2.4.0',
        device: 'Chrome 128 (macOS Sonoma)',
        userProfile: 'Premium Kart Sahibi',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: '3D Secure 2.0 onayından sonra #ORD-2026-8812 nolu sipariş oluşturuldu.',
        screenshotUrl: createEvidenceScreenshot('PASSED', '3DS Ödeme & Sipariş Oluşturma', 'Sipariş No: #ORD-2026-8812', [
          '[INFO] POST /api/v1/checkout/3ds-complete',
          '[ASSERT] bankPaymentStatus == APPROVED -> TRUE',
          '[ASSERT] order.id is not null -> TRUE',
          '[TIME] Total Duration: 1420ms',
        ]),
      },
      {
        testRunId: runEcomm1.id,
        testCaseId: tcEcomm7.id,
        status: ResultStatus.FAILED,
        executionMs: 512,
        errorMessage: 'Banka yetersiz bakiye dönüş kodu (51) yerine genel sistem hatası (99) verdi.',
        jiraBugKey: 'COMM-BUG-402',
        jiraBugUrl: 'https://jira.company.com/browse/COMM-BUG-402',
        executedBy: 'Selin Kaya',
        testerEmail: 'selin.kaya@ttb.com.tr',
        environment: 'STAGING',
        platform: 'WEB',
        appVersion: 'v2.4.0',
        device: 'Chrome 128 (macOS Sonoma)',
        userProfile: 'Bakiye Yetersiz Müşteri',
        customerType: 'Bireysel',
        flakyStatus: 'FLAKY',
        retries: 2,
        screenshotUrl: createEvidenceScreenshot('FAILED', 'Yetersiz Bakiye Hata Yanıtı', 'Assertion Failed: Error Code Mismatch', [
          '[ERROR] Expected error code 51 (INSUFFICIENT_FUNDS)',
          '[ERROR] Actual error code 99 (GENERIC_PAYMENT_ERROR)',
          '[JIRA BUG] COMM-BUG-402 opened for Payment Gateway team',
        ]),
      },
    ],
  });

  const runEcomm2 = await prisma.testRun.create({
    data: {
      title: 'Black Friday Yük Öncesi Sanity Koşumu',
      version: 'v2.4.1',
      environment: 'PRODUCTION',
      status: RunStatus.COMPLETED,
      executedBy: 'Ümit Sinanoğlu (Admin)',
      testerEmail: 'admin@ttb.com.tr',
      projectId: projEcomm.id,
      testPlanId: planEcomm2.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: runEcomm2.id,
        testCaseId: tcEcomm1.id,
        status: ResultStatus.PASSED,
        executionMs: 198,
        executedBy: 'Ümit Sinanoğlu',
        testerEmail: 'admin@ttb.com.tr',
        environment: 'PRODUCTION',
        platform: 'WEB',
        appVersion: 'v2.4.1',
        device: 'Chrome 128 (Windows 11)',
        userProfile: 'Admin Kullanıcı',
        customerType: 'Kurumsal',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Production SSO login doğrulaması 198ms içinde başarılı.',
      },
      {
        testRunId: runEcomm2.id,
        testCaseId: tcEcomm5.id,
        status: ResultStatus.PASSED,
        executionMs: 240,
        executedBy: 'Ümit Sinanoğlu',
        testerEmail: 'admin@ttb.com.tr',
        environment: 'PRODUCTION',
        platform: 'WEB',
        appVersion: 'v2.4.1',
        device: 'Chrome 128 (macOS)',
        userProfile: 'Black Friday İndirim Kullanıcısı',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Kampanya kupon motoru üretim ortamında 240ms içinde yanıt verdi.',
      },
      {
        testRunId: runEcomm2.id,
        testCaseId: tcEcomm6.id,
        status: ResultStatus.PASSED,
        executionMs: 980,
        executedBy: 'Ümit Sinanoğlu',
        testerEmail: 'admin@ttb.com.tr',
        environment: 'PRODUCTION',
        platform: 'WEB',
        appVersion: 'v2.4.1',
        device: 'Safari 17.5 (iOS 17.5)',
        userProfile: 'Mobil Web Kullanıcısı',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Canlı ödeme geçidi testi başarılı.',
      },
    ],
  });

  // =========================================================================
  // 2. PROJE 2: FINPAY - Finansal Teknoloji & Açık Bankacılık
  // =========================================================================
  console.log('📦 [2/5] Creating Project: FINPAY - Finansal Teknoloji & Açık Bankacılık...');
  const projFinpay = await prisma.project.create({
    data: {
      name: 'Finansal Teknoloji & Ödeme Ağ Geçidi',
      key: 'FINPAY',
      description:
        'Sanal POS entegrasyonları, FAST / EFT para transferleri, FAST-Karekod, Açık Bankacılık (PSD2 / AISP) hesap hareketleri ve AML sahtekarlık kontrol motoru.',
      jiraProjectKey: 'FIN',
    },
  });

  // Test Planları (FINPAY)
  const planFinpay1 = await prisma.testPlan.create({
    data: {
      title: 'FAST / EFT 7/24 Anlık Transfer Kabul Planı',
      description: 'Merkez Bankası FAST entegrasyonu, 7/24 para transferi, IBAN ve Kolay Adres (Telefon/TCKN) doğrulama test planı.',
      version: 'v1.8.0',
      environment: 'PRODUCTION',
      status: PlanStatus.COMPLETED,
      scope: 'FAST Transfer Engine, IBAN Validation, TCMB Clearing Protocol',
      requirements: 'FIN-101, FIN-104, FIN-109',
      projectId: projFinpay.id,
    },
  });

  const planFinpay2 = await prisma.testPlan.create({
    data: {
      title: 'Açık Bankacılık PSD2 & AIS Entegrasyon Planı',
      description: 'Diğer bankalardaki hesapların bakiye ve hareketlerinin API üzerinden çekilmesi ve konsolidasyonu kabul planı.',
      version: 'v2.1.0',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'Open Banking AISP APIs, OAuth2 Consent Flow, Transaction Categorization',
      requirements: 'FIN-201, FIN-205',
      projectId: projFinpay.id,
    },
  });

  const planFinpay3 = await prisma.testPlan.create({
    data: {
      title: 'Sanal POS & PCI-DSS Güvenlik Denetim Planı',
      description: 'Kart verilerinin tokenize saklanması, 3DS v2.2 akışları ve şüpheli fraud işlem kontrolleri.',
      version: 'v1.9.0',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'Card Tokenization, PCI-DSS Compliance, Fraud Scoring Engine',
      requirements: 'FIN-301, FIN-308',
      projectId: projFinpay.id,
    },
  });

  // Suites (FINPAY)
  const sFinTransfer = await prisma.suite.create({
    data: { name: 'Para Transferleri (FAST / EFT / Havale)', projectId: projFinpay.id, orderIndex: 0 },
  });
  const sFinTransferFAST = await prisma.suite.create({
    data: { name: 'FAST & Kolay Adres Doğrulama', projectId: projFinpay.id, parentId: sFinTransfer.id, orderIndex: 0 },
  });
  const sFinTransferLimits = await prisma.suite.create({
    data: { name: 'Transfer Limit & Komisyon Motoru', projectId: projFinpay.id, parentId: sFinTransfer.id, orderIndex: 1 },
  });

  const sFinPos = await prisma.suite.create({
    data: { name: 'Sanal POS & Kart Saklama (PCI-DSS)', projectId: projFinpay.id, orderIndex: 1 },
  });
  const sFinPos3DS = await prisma.suite.create({
    data: { name: '3D Secure 2.2 ve OTP Doğrulama', projectId: projFinpay.id, parentId: sFinPos.id, orderIndex: 0 },
  });

  const sFinOpenBank = await prisma.suite.create({
    data: { name: 'Açık Bankacılık (PSD2 / AISP)', projectId: projFinpay.id, orderIndex: 2 },
  });

  const sFinFraud = await prisma.suite.create({
    data: { name: 'Sahtekarlık (Fraud & AML) Kontrolü', projectId: projFinpay.id, orderIndex: 3 },
  });

  // Test Cases (FINPAY)
  const tcFin1 = await prisma.testCase.create({
    data: {
      code: 'FINPAY-TC-01',
      title: 'FAST ile Telefon Numarasına 7/24 Anlık Para Transferi',
      description: 'Kolay adres olarak tanımlı GSM numarasına FAST üzerinden para gönderimi ve anlık bakiye düşüşü.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.BLOCKER,
      precondition: 'Gönderen hesap bakiyesi transfer tutarından fazla olmalıdır.',
      projectId: projFinpay.id,
      suiteId: sFinTransferFAST.id,
      jiraStoryKey: 'FIN-101',
      jiraIssueUrl: 'https://jira.company.com/browse/FIN-101',
      steps: {
        create: [
          { stepNumber: 1, action: 'POST /api/v1/transfers/fast payload gönderilir.', expectedResult: '200 OK yanıtı ve FAST referans ID döner.' },
          { stepNumber: 2, action: 'Gönderen hesap bakiyesi sorgulanır.', expectedResult: 'Tutar anında düşer.' },
          { stepNumber: 3, action: 'Alıcı banka webhook bildirimi kontrol edilir.', expectedResult: '"TRANSFER_COMPLETED" webhook tetiklenir.' },
        ],
      },
    },
  });

  const tcFin2 = await prisma.testCase.create({
    data: {
      code: 'FINPAY-TC-02',
      title: 'Günlük Transfer Limiti Aşıldığında İşlemin Engellenmesi',
      description: 'Kullanıcının tanımlı günlük FAST limiti 100.000 TL aşıldığında sistem işlemi reddetmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.CRITICAL,
      precondition: 'Kullanıcı bugün 90.000 TL transfer yapmış olmalıdır.',
      projectId: projFinpay.id,
      suiteId: sFinTransferLimits.id,
      jiraStoryKey: 'FIN-102',
      jiraIssueUrl: 'https://jira.company.com/browse/FIN-102',
      steps: {
        create: [
          { stepNumber: 1, action: '20.000 TL transfer isteği gönderilir.', expectedResult: '400 Bad Request döner.' },
          { stepNumber: 2, action: 'Hata mesajı kontrol edilir.', expectedResult: '"Günlük transfer limitiniz aşıldı" uyarısı döner.' },
        ],
      },
    },
  });

  const tcFin3 = await prisma.testCase.create({
    data: {
      code: 'FINPAY-TC-03',
      title: 'Kredi Kartı Tokenize Kaydetme ve Maskeli Listeleme',
      description: 'PCI-DSS standartlarına uygun olarak kartın tokenlaştırılması ve arayüzde sadece ilk 6 son 4 hanenin gösterilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Kullanıcı oturumu açık olmalıdır.',
      projectId: projFinpay.id,
      suiteId: sFinPos.id,
      jiraStoryKey: 'FIN-103',
      jiraIssueUrl: 'https://jira.company.com/browse/FIN-103',
      steps: {
        create: [
          { stepNumber: 1, action: 'Kart bilgileri girilip "Kartı Sakla" seçilir.', expectedResult: 'Kart token ID üretilir.' },
          { stepNumber: 2, action: 'Kayıtlı kartlar listelenir.', expectedResult: '4543 60** **** 1234 formatında listelenir.' },
        ],
      },
    },
  });

  const tcFin4 = await prisma.testCase.create({
    data: {
      code: 'FINPAY-TC-04',
      title: 'Açık Bankacılık Rıza (Consent) Onayı ve Bakiye Çekme',
      description: 'Kullanıcının diğer banka hesabını bağlamak için OAuth2 onay vermesi ve hesap bakiyesinin çekilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.CRITICAL,
      precondition: 'Açık bankacılık sandbox ortamı aktif olmalıdır.',
      projectId: projFinpay.id,
      suiteId: sFinOpenBank.id,
      jiraStoryKey: 'FIN-104',
      jiraIssueUrl: 'https://jira.company.com/browse/FIN-104',
      steps: {
        create: [
          { stepNumber: 1, action: 'GET /api/v1/openbanking/accounts çağrılır.', expectedResult: 'Rıza token geçerli ise hesap listesi döner.' },
          { stepNumber: 2, action: 'Hesap hareketleri kontrol edilir.', expectedResult: 'Son 30 günlük dekont listesi 200 OK ile döner.' },
        ],
      },
    },
  });

  const tcFin5 = await prisma.testCase.create({
    data: {
      code: 'FINPAY-TC-05',
      title: 'AML / Fraud Şüpheli Konum Değişikliği ve Otomatik Bloke',
      description: 'Aynı hesabın 5 dakika içinde iki farklı ülkeden para çekme denemesi yapması halinde hesabın korumaya alınması.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.BLOCKER,
      precondition: 'Fraud kural motoru aktif olmalıdır.',
      projectId: projFinpay.id,
      suiteId: sFinFraud.id,
      jiraStoryKey: 'FIN-105',
      jiraIssueUrl: 'https://jira.company.com/browse/FIN-105',
      steps: {
        create: [
          { stepNumber: 1, action: 'Türkiye IP üzerinden giriş yapılır.', expectedResult: 'Başarılı.' },
          { stepNumber: 2, action: '2 dakika sonra Brezilya IP üzerinden transfer denenir.', expectedResult: 'Fraud Score > 85 hesaplanır.' },
          { stepNumber: 3, action: 'İşlem yanıtı incelenir.', expectedResult: '403 Forbidden ve "Şüpheli işlem - SMS teyidi gerekli" döner.' },
        ],
      },
    },
  });

  // Test Runs (FINPAY)
  const runFin1 = await prisma.testRun.create({
    data: {
      title: 'FAST Transfer & Ödeme Regresyonu #4',
      version: 'v1.8.0',
      environment: 'PRODUCTION',
      status: RunStatus.COMPLETED,
      executedBy: 'Burak Demir (Tester)',
      testerEmail: 'burak.demir@ttb.com.tr',
      projectId: projFinpay.id,
      testPlanId: planFinpay1.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: runFin1.id,
        testCaseId: tcFin1.id,
        status: ResultStatus.PASSED,
        executionMs: 180,
        executedBy: 'Burak Demir',
        testerEmail: 'burak.demir@ttb.com.tr',
        environment: 'PRODUCTION',
        platform: 'API',
        appVersion: 'v1.8.0',
        device: 'API Gateway / Postman Runner',
        userProfile: 'Fintech API Servis Kullanıcısı',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'TCMB FAST Core Engine 180ms içinde takas onayını üretti.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'FAST Anlık Transfer OK', 'TCMB FAST Core Engine - 200 OK', [
          '[INFO] POST /api/v1/transfers/fast -> 200 OK',
          '[ASSERT] fastRefId matches UUID -> TRUE',
          '[ASSERT] clearingDurationMs < 1000ms -> TRUE (180ms)',
        ]),
      },
      {
        testRunId: runFin1.id,
        testCaseId: tcFin2.id,
        status: ResultStatus.PASSED,
        executionMs: 120,
        executedBy: 'Burak Demir',
        testerEmail: 'burak.demir@ttb.com.tr',
        environment: 'PRODUCTION',
        platform: 'API',
        appVersion: 'v1.8.0',
        device: 'Core Banking API Pod',
        userProfile: 'Limit Kontrol Motoru',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Günlük limit aşımında 400 Bad Request kuralları doğrulandı.',
      },
      {
        testRunId: runFin1.id,
        testCaseId: tcFin3.id,
        status: ResultStatus.PASSED,
        executionMs: 340,
        executedBy: 'Burak Demir',
        testerEmail: 'burak.demir@ttb.com.tr',
        environment: 'PRODUCTION',
        platform: 'WEB',
        appVersion: 'v1.8.0',
        device: 'Chrome 128 (macOS)',
        userProfile: 'Kayıtlı Kart Sahibi',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'PCI-DSS tokenizasyonu ve kart maskeleme (4543 60** **** 1234) doğrulandı.',
      },
      {
        testRunId: runFin1.id,
        testCaseId: tcFin4.id,
        status: ResultStatus.PASSED,
        executionMs: 510,
        executedBy: 'Burak Demir',
        testerEmail: 'burak.demir@ttb.com.tr',
        environment: 'PRODUCTION',
        platform: 'API',
        appVersion: 'v1.8.0',
        device: 'Open Banking AISP Server',
        userProfile: 'Açık Bankacılık Rıza Sahibi',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'PSD2 OAuth2 rıza akışı ile 30 günlük hesap hareketleri alındı.',
      },
      {
        testRunId: runFin1.id,
        testCaseId: tcFin5.id,
        status: ResultStatus.PASSED,
        executionMs: 275,
        executedBy: 'Burak Demir',
        testerEmail: 'burak.demir@ttb.com.tr',
        environment: 'PRODUCTION',
        platform: 'API',
        appVersion: 'v1.8.0',
        device: 'Fraud AML Decision Engine',
        userProfile: 'Riskli İşlem Simülasyonu',
        customerType: 'Kurumsal',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Impossible Travel anomalisinde hesap donduruldu ve 403 Forbidden üretildi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'AML Fraud Engine Triggered', 'Risk Score: 92/100 - Auto Blocked', [
          '[SECURITY] Impossible Travel Alert: TR -> BR in 2 mins',
          '[ASSERT] fraudRiskScore >= 85 -> TRUE (92)',
          '[ASSERT] action == "REQUIRE_STEP_UP_AUTH" -> TRUE',
        ]),
      },
    ],
  });

  // =========================================================================
  // 3. PROJE 3: LOGIX - Akıllı Lojistik & Kargo Yönetimi
  // =========================================================================
  console.log('📦 [3/5] Creating Project: LOGIX - Akıllı Lojistik & Kargo Yönetimi...');
  const projLogix = await prisma.project.create({
    data: {
      name: 'Akıllı Lojistik & Kargo Yönetimi',
      key: 'LOGIX',
      description:
        'Depo kabul & barkodlama, dinamik kurye rotalama algoritması, akıllı teslimat dolabı (PUDO) entegrasyonu ve anlık GPS kargo takip altyapısı.',
      jiraProjectKey: 'LOG',
    },
  });

  // Test Planları (LOGIX)
  const planLogix1 = await prisma.testPlan.create({
    data: {
      title: 'Kurye Mobil & Rotalama Optimizasyon Planı',
      description: 'Kurye mobil uygulaması, rota optimizasyon algoritması ve adreste teslimat anında fotoğraf çekip kanıt yükleme testleri.',
      version: 'v3.2.0',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'Kurye Mobil Uygulaması (Android/iOS), GPS Rota Optimizasyonu, Teslimat Kanıtı (PoD)',
      requirements: 'LOG-101, LOG-104',
      projectId: projLogix.id,
    },
  });

  const planLogix2 = await prisma.testPlan.create({
    data: {
      title: 'Akıllı Teslimat Dolabı (PUDO) & QR Kabul Planı',
      description: 'Müşterinin akıllı dolap üzerinden QR kod okutarak 7/24 kargosunu teslim alma akışlarının uçtan uca doğrulanması.',
      version: 'v1.5.0',
      environment: 'UAT',
      status: PlanStatus.ACTIVE,
      scope: 'PUDO IoT Entegrasyonu, QR Kod Üretimi, Dolap Kapak Açma Sinyali',
      requirements: 'LOG-201, LOG-203',
      projectId: projLogix.id,
    },
  });

  // Suites (LOGIX)
  const sLogixDepot = await prisma.suite.create({
    data: { name: 'Depo Giriş & Barkodlama', projectId: projLogix.id, orderIndex: 0 },
  });
  const sLogixCourier = await prisma.suite.create({
    data: { name: 'Kurye Mobil & Canlı GPS Rotalama', projectId: projLogix.id, orderIndex: 1 },
  });
  const sLogixPudo = await prisma.suite.create({
    data: { name: 'PUDO Akıllı Teslimat Dolapları', projectId: projLogix.id, orderIndex: 2 },
  });

  // Test Cases (LOGIX)
  const tcLogix1 = await prisma.testCase.create({
    data: {
      code: 'LOGIX-TC-01',
      title: 'Depo Girişinde Barkod Okutma ile Paket Statüsünün Güncellenmesi',
      description: 'Gelen kargo paketinin el terminali ile taranarak "Depoda Ayrıştırıldı" statüsüne geçirilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.CRITICAL,
      precondition: 'Kargo kaydı sistemde oluşturulmuş olmalıdır.',
      projectId: projLogix.id,
      suiteId: sLogixDepot.id,
      jiraStoryKey: 'LOG-101',
      jiraIssueUrl: 'https://jira.company.com/browse/LOG-101',
      steps: {
        create: [
          { stepNumber: 1, action: 'Barkod ID "TR-LOG-99201" taranır.', expectedResult: 'Paket bilgileri terminal ekranına gelir.' },
          { stepNumber: 2, action: 'Ayrıştırma bandı seçilir.', expectedResult: 'Kargo statüsü "IN_HUB" olarak güncellenir.' },
        ],
      },
    },
  });

  const tcLogix2 = await prisma.testCase.create({
    data: {
      code: 'LOGIX-TC-02',
      title: 'Kurye Adreste Teslimatında Fotoğraf ve İsim İle Teslimat Kanıtı (PoD)',
      description: 'Kurye teslimatı yaparken alıcı adı ve kapı teslimat fotoğrafını yükleyerek teslimatı tamamlar.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.BLOCKER,
      precondition: 'Paket kurye zimmetinde ("OUT_FOR_DELIVERY") olmalıdır.',
      projectId: projLogix.id,
      suiteId: sLogixCourier.id,
      jiraStoryKey: 'LOG-102',
      jiraIssueUrl: 'https://jira.company.com/browse/LOG-102',
      steps: {
        create: [
          { stepNumber: 1, action: 'Kurye teslimat butonuna basar.', expectedResult: 'Alıcı adı ve imza/fotoğraf ekranı açılır.' },
          { stepNumber: 2, action: 'Teslimat fotoğrafı yüklenir ve SMS onay kodu girilir.', expectedResult: 'Sistem 200 OK döner, kargo "DELIVERED" olur.' },
        ],
      },
    },
  });

  const tcLogix3 = await prisma.testCase.create({
    data: {
      code: 'LOGIX-TC-03',
      title: 'PUDO Akıllı Dolapta QR Kod Okutularak Kapak Açılması',
      description: 'Müşteri mobil uygulamadan aldığı QR kodu dolap kamerasına okuttuğunda ilgili bölmenin otomatik açılması.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.CRITICAL,
      precondition: 'Kargo PUDO dolabında ("READY_AT_PUDO") bekliyor olmalıdır.',
      projectId: projLogix.id,
      suiteId: sLogixPudo.id,
      jiraStoryKey: 'LOG-103',
      jiraIssueUrl: 'https://jira.company.com/browse/LOG-103',
      steps: {
        create: [
          { stepNumber: 1, action: 'POST /api/v1/pudo/unlock-qr çağrılır.', expectedResult: 'QR geçerli ise IoT dolap sinyali tetiklenir.' },
          { stepNumber: 2, action: 'Dolap kapağı durum sensörü kontrol edilir.', expectedResult: 'Kapak "OPEN" olarak raporlanır.' },
        ],
      },
    },
  });

  // Test Runs (LOGIX)
  const runLogix1 = await prisma.testRun.create({
    data: {
      title: 'Lojistik Rotalama & Kurye Sanity Koşumu',
      version: 'v3.2.0',
      environment: 'STAGING',
      status: RunStatus.COMPLETED,
      executedBy: 'Burak Demir (Tester)',
      testerEmail: 'burak.demir@ttb.com.tr',
      projectId: projLogix.id,
      testPlanId: planLogix1.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: runLogix1.id,
        testCaseId: tcLogix1.id,
        status: ResultStatus.PASSED,
        executionMs: 145,
        executedBy: 'Burak Demir',
        testerEmail: 'burak.demir@ttb.com.tr',
        environment: 'STAGING',
        platform: 'API',
        appVersion: 'v3.2.0',
        device: 'Honeywell Barkod Terminali',
        userProfile: 'Depo Ayrıştırma Görevlisi',
        customerType: 'Ticari / KOBİ',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Depo kabul ve barkod taranması 145ms içinde tamamlandı.',
      },
      {
        testRunId: runLogix1.id,
        testCaseId: tcLogix2.id,
        status: ResultStatus.PASSED,
        executionMs: 410,
        executedBy: 'Burak Demir',
        testerEmail: 'burak.demir@ttb.com.tr',
        environment: 'STAGING',
        platform: 'MOBILE',
        appVersion: 'v3.2.0',
        device: 'Zebra TC57 Android El Terminali',
        userProfile: 'Saha Saha Kuryesi',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Adreste teslimat fotoğrafı S3 e yüklendi ve kargo statüsü DELIVERED yapıldı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Proof of Delivery Validated', 'Kargo Statüsü: DELIVERED', [
          '[INFO] Mobile PoD Upload -> AWS S3 /deliveries/pod-99201.jpg',
          '[ASSERT] deliveryTimestamp recorded -> TRUE',
          '[ASSERT] smsVerificationStatus == VERIFIED -> TRUE',
        ]),
      },
      {
        testRunId: runLogix1.id,
        testCaseId: tcLogix3.id,
        status: ResultStatus.PASSED,
        executionMs: 230,
        executedBy: 'Burak Demir',
        testerEmail: 'burak.demir@ttb.com.tr',
        environment: 'STAGING',
        platform: 'API',
        appVersion: 'v3.2.0',
        device: 'IoT Akıllı Dolap Hub Kontrolcü',
        userProfile: 'Son Tüketici (PUDO)',
        customerType: 'Bireysel',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Dolap IoT mikrodenetleyicisi QR sinyalini aldı ve kapağı 230ms içinde açtı.',
      },
    ],
  });

  // =========================================================================
  // 4. PROJE 4: CUSTPORT - Kurumsal Müşteri Portalı & B2B
  // =========================================================================
  console.log('📦 [4/5] Creating Project: CUSTPORT - Kurumsal Müşteri Portalı & B2B...');
  const projCust = await prisma.project.create({
    data: {
      name: 'Kurumsal Müşteri Portalı & B2B Hizmetleri',
      key: 'CUSTPORT',
      description:
        'Kurumsal şirket hesapları, çoklu yetkilendirme rolleri (RBAC), toplu e-Fatura/e-Arşiv indirme, kurumsal API anahtar yönetimi ve SLA izleme paneli.',
      jiraProjectKey: 'B2B',
    },
  });

  // Test Planları (CUSTPORT)
  const planCust1 = await prisma.testPlan.create({
    data: {
      title: 'B2B Toplu Fatura & Muhasebe Entegrasyon Planı',
      description: 'Kurumsal müşterilerin aylık binlerce e-faturayı XML/PDF olarak toplu indirmesi ve ERP sistemlerine otomatik aktarım kabul planı.',
      version: 'v2.0.0',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'Toplu e-Fatura, UBL-TR XML Çıktısı, ERP Webhook Entegrasyonu',
      requirements: 'B2B-101, B2B-105',
      projectId: projCust.id,
    },
  });

  const planCust2 = await prisma.testPlan.create({
    data: {
      title: 'Çoklu Şirket & Rol Bazlı Yetkilendirme (RBAC) Planı',
      description: 'Ana şirket ve alt bağlı şirketlerin kullanıcı rolleri (Finans, Operasyon, İzleyici) arası yetki izolasyonu testi.',
      version: 'v1.3.0',
      environment: 'PRODUCTION',
      status: PlanStatus.COMPLETED,
      scope: 'RBAC Yetki İzolasyonu, Audit Logları, Şirketler Arası Veri Gizliliği',
      requirements: 'B2B-201, B2B-204',
      projectId: projCust.id,
    },
  });

  // Suites (CUSTPORT)
  const sCustBilling = await prisma.suite.create({
    data: { name: 'Toplu e-Fatura & Muhasebe', projectId: projCust.id, orderIndex: 0 },
  });
  const sCustRbac = await prisma.suite.create({
    data: { name: 'Rol & İzin Matrisi Yönetimi (RBAC)', projectId: projCust.id, orderIndex: 1 },
  });

  // Test Cases (CUSTPORT)
  const tcCust1 = await prisma.testCase.create({
    data: {
      code: 'CUSTPORT-TC-01',
      title: 'Seçili Tarih Aralığındaki e-Faturaların ZIP Olarak Toplu İndirilmesi',
      description: 'Kullanıcının 500 adet faturayı seçip asenkron ZIP indirme talebi oluşturması ve indirme bağlantısı alması.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Şirket hesabında en az 100 onaylı fatura bulunmalıdır.',
      projectId: projCust.id,
      suiteId: sCustBilling.id,
      jiraStoryKey: 'B2B-101',
      jiraIssueUrl: 'https://jira.company.com/browse/B2B-101',
      steps: {
        create: [
          { stepNumber: 1, action: 'Faturalar sayfasına gidilip tarih aralığı seçilir.', expectedResult: 'Fatura listesi yüklenir.' },
          { stepNumber: 2, action: '"Toplu İndir (ZIP)" butonuna tıklanır.', expectedResult: 'Arka plan kuyruk görevi başlar.' },
          { stepNumber: 3, action: 'İndirme bildirimi kontrol edilir.', expectedResult: 'ZIP arşivi hazır bağlantısı verilir.' },
        ],
      },
    },
  });

  const tcCust2 = await prisma.testCase.create({
    data: {
      code: 'CUSTPORT-TC-02',
      title: 'İzleyici (Viewer) Rolündeki Kullanıcının Fatura İptal Yetkisi Engeli',
      description: 'Sadece görüntüleme yetkisi olan kullanıcının fatura iptal veya ödeme butonlarını görememesi ve API isteğinde 403 alması.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.BLOCKER,
      precondition: 'Viewer rolünde kullanıcı hesabı ile token alınmış olmalıdır.',
      projectId: projCust.id,
      suiteId: sCustRbac.id,
      jiraStoryKey: 'B2B-102',
      jiraIssueUrl: 'https://jira.company.com/browse/B2B-102',
      steps: {
        create: [
          { stepNumber: 1, action: 'POST /api/v1/invoices/cancel-request gönderilir.', expectedResult: '403 Forbidden yanıtı döner.' },
          { stepNumber: 2, action: 'Audit log kontrol edilir.', expectedResult: '"UNAUTHORIZED_ACTION_ATTEMPT" loglanır.' },
        ],
      },
    },
  });

  // Test Runs (CUSTPORT)
  const runCust1 = await prisma.testRun.create({
    data: {
      title: 'B2B Portal Güvenlik & İzin Regresyonu',
      version: 'v1.3.0',
      environment: 'PRODUCTION',
      status: RunStatus.COMPLETED,
      executedBy: 'Selin Kaya (Test Lead)',
      testerEmail: 'selin.kaya@ttb.com.tr',
      projectId: projCust.id,
      testPlanId: planCust2.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: runCust1.id,
        testCaseId: tcCust1.id,
        status: ResultStatus.PASSED,
        executionMs: 680,
        executedBy: 'Selin Kaya',
        testerEmail: 'selin.kaya@ttb.com.tr',
        environment: 'PRODUCTION',
        platform: 'WEB',
        appVersion: 'v1.3.0',
        device: 'Chrome 128 (macOS)',
        userProfile: 'Kurumsal Muhasebe Yöneticisi',
        customerType: 'Kurumsal',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: '500 adet e-fatura ZIP arşivi 680ms içinde hazırlandı ve indirme linki üretildi.',
      },
      {
        testRunId: runCust1.id,
        testCaseId: tcCust2.id,
        status: ResultStatus.PASSED,
        executionMs: 190,
        executedBy: 'Selin Kaya',
        testerEmail: 'selin.kaya@ttb.com.tr',
        environment: 'PRODUCTION',
        platform: 'API',
        appVersion: 'v1.3.0',
        device: 'API Gateway / Postman',
        userProfile: 'İzleyici (Viewer) Rolü',
        customerType: 'Kurumsal',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Viewer rolündeki istek 403 Forbidden ile engellendi ve audit log kaydı düşüldü.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'RBAC 403 Forbidden Verified', 'Viewer Role Authorization Strict Isolation', [
          '[SECURITY] Role: VIEWER attempted POST /invoices/cancel',
          '[ASSERT] HTTP Response == 403 FORBIDDEN -> TRUE',
          '[ASSERT] Audit Trail Created -> TRUE',
        ]),
      },
    ],
  });

  // =========================================================================
  // 5. PROJE 5: SRE - Bulut Altyapı & Mikroservis Güvenliği
  // =========================================================================
  console.log('📦 [5/5] Creating Project: SRE - Bulut Altyapı, SRE & Mikroservis Güvenliği...');
  const projSre = await prisma.project.create({
    data: {
      name: 'Bulut Altyapı, SRE & Mikroservis Güvenliği',
      key: 'SRE',
      description:
        'Kubernetes ingress gateway, rate-limiting saldırı koruması, OAuth2/OIDC SSO kimlik sunucusu, Redis cache failover ve sistem dayanıklılık (Chaos) testleri.',
      jiraProjectKey: 'SRE',
    },
  });

  // Test Planları (SRE)
  const planSre1 = await prisma.testPlan.create({
    data: {
      title: 'Kubernetes & Mikroservis Dayanıklılık / Chaos Planı',
      description: 'Pod çökmesi veya node kesintisi durumunda servislerin sıfır kesinti ile otomatik iyileşme (self-healing) testleri.',
      version: 'v4.0.0',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'K8s Deployment Health, Redis Sentinel Failover, Database Read Replica Lag',
      requirements: 'SRE-101, SRE-104',
      projectId: projSre.id,
    },
  });

  const planSre2 = await prisma.testPlan.create({
    data: {
      title: 'API Gateway Güvenlik & Rate Limiting Test Planı',
      description: 'DDoS ve aşırı yük denemelerinde IP ve kullanıcı bazlı rate limiting (429 Too Many Requests) doğrulama planı.',
      version: 'v2.2.0',
      environment: 'PRODUCTION',
      status: PlanStatus.COMPLETED,
      scope: 'API Rate Limiting, Cloudflare WAF Rules, Token Bucket Algorithm',
      requirements: 'SRE-201',
      projectId: projSre.id,
    },
  });

  // Suites (SRE)
  const sSreGateway = await prisma.suite.create({
    data: { name: 'API Gateway & Rate Limiting', projectId: projSre.id, orderIndex: 0 },
  });
  const sSreFailover = await prisma.suite.create({
    data: { name: 'Veritabanı Yük & Failover', projectId: projSre.id, orderIndex: 1 },
  });

  // Test Cases (SRE)
  const tcSre1 = await prisma.testCase.create({
    data: {
      code: 'SRE-TC-01',
      title: 'Saniyede 100 İstek Gönderildiğinde Rate Limiting (429) Tetiklenmesi',
      description: 'Tek bir IP adresinden saniyede 100 istek gönderildiğinde Gateway in 429 Too Many Requests dönmesi.',
      executionType: 'AUTOMATED',
      type: TestType.PERFORMANCE,
      priority: Priority.CRITICAL,
      precondition: 'Rate limiter eşiği 60 req/sec olarak ayarlanmış olmalıdır.',
      projectId: projSre.id,
      suiteId: sSreGateway.id,
      jiraStoryKey: 'SRE-101',
      jiraIssueUrl: 'https://jira.company.com/browse/SRE-101',
      steps: {
        create: [
          { stepNumber: 1, action: '100 eşzamanlı HTTP GET isteği gönderilir.', expectedResult: 'İlk 60 istek 200 OK döner.' },
          { stepNumber: 2, action: 'Sonraki istekler incelenir.', expectedResult: 'Kalan 40 istek 429 Too Many Requests ile reddedilir.' },
        ],
      },
    },
  });

  const tcSre2 = await prisma.testCase.create({
    data: {
      code: 'SRE-TC-02',
      title: 'Redis Master Çökmesinde Sentinel Otomatik Failover Doğrulaması',
      description: 'Redis master instance kapatıldığında Sentinel in 3 saniye içinde slave i master a terfi ettirmesi.',
      executionType: 'AUTOMATED',
      type: TestType.PERFORMANCE,
      priority: Priority.BLOCKER,
      precondition: 'En az 3 düğümlü Redis Sentinel kümesi çalışıyor olmalıdır.',
      projectId: projSre.id,
      suiteId: sSreFailover.id,
      jiraStoryKey: 'SRE-102',
      jiraIssueUrl: 'https://jira.company.com/browse/SRE-102',
      steps: {
        create: [
          { stepNumber: 1, action: 'Redis master düğümüne `DEBUG SEGFAULT` verilir.', expectedResult: 'Master düğüm durur.' },
          { stepNumber: 2, action: 'Uygulama oturum okuma isteği gönderir.', expectedResult: '<3 sn içinde yeni master üzerinden kesintisiz veri döner.' },
        ],
      },
    },
  });

  // Test Runs (SRE)
  const runSre1 = await prisma.testRun.create({
    data: {
      title: 'SRE Gateway & Altyapı Dayanıklılık Koşumu',
      version: 'v4.0.0',
      environment: 'STAGING',
      status: RunStatus.COMPLETED,
      executedBy: 'Ümit Sinanoğlu (Admin)',
      testerEmail: 'admin@ttb.com.tr',
      projectId: projSre.id,
      testPlanId: planSre1.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: runSre1.id,
        testCaseId: tcSre1.id,
        status: ResultStatus.PASSED,
        executionMs: 820,
        executedBy: 'Ümit Sinanoğlu',
        testerEmail: 'admin@ttb.com.tr',
        environment: 'STAGING',
        platform: 'API',
        appVersion: 'v4.0.0',
        device: 'k6 / Grafana Load Engine Pod',
        userProfile: 'SRE / Load Test Engine',
        customerType: 'Kurumsal',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Rate limiter 60 istek sonrası 40 isteği 429 Too Many Requests ile korumaya aldı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Rate Limiting 429 Triggered', '60 OK / 40 Throttled (429)', [
          '[LOAD TEST] Injected 100 requests / sec',
          '[ASSERT] 60 requests -> HTTP 200 OK',
          '[ASSERT] 40 requests -> HTTP 429 TOO_MANY_REQUESTS',
          '[STATUS] Rate Limiter WAF Active and Protected',
        ]),
      },
      {
        testRunId: runSre1.id,
        testCaseId: tcSre2.id,
        status: ResultStatus.PASSED,
        executionMs: 2450,
        executedBy: 'Ümit Sinanoğlu',
        testerEmail: 'admin@ttb.com.tr',
        environment: 'STAGING',
        platform: 'API',
        appVersion: 'v4.0.0',
        device: 'Redis Sentinel Cluster (3 Nodes)',
        userProfile: 'Chaos Monkey Bot',
        customerType: 'Kurumsal',
        flakyStatus: 'STABLE',
        retries: 0,
        errorMessage: 'Redis master arızasında Sentinel 2.45 saniye içinde slave i master a yükseltti.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Redis Sentinel Failover OK', 'Failover completed in 2.45s', [
          '[CHAOS] Master Redis stopped deliberately',
          '[SENTINEL] +vote-for-leader, +promoted-slave',
          '[ASSERT] Application cache read successful -> TRUE',
        ]),
      },
    ],
  });

  console.log('✅ Enterprise Test Data Seed Completed Successfully!');
  console.log('✨ 5 Test Projects, 12 Test Plans, 15 Suites, 20+ Detailed Test Cases, 6 Test Runs and 18 Test Results created!');
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
