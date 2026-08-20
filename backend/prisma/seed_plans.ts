import '../src/prisma/db-env';
import { PrismaClient, TestType, Priority, RunStatus, ResultStatus } from '@prisma/client';
import { resolveDatabaseEnv } from '../src/prisma/db-env';

const dbConfig = resolveDatabaseEnv();
console.log(`🌱 Seeding database target: [${dbConfig.environment}]`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbConfig.databaseUrl,
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
    <text x="90" y="26" fill="#94a3b8" font-family="sans-serif" font-size="12" font-weight="bold">TCMS Test Automation Execution Evidence</text>
    
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
    <text x="670" y="380" fill="#64748b" font-family="monospace" font-size="10" text-anchor="end">TIMESTAMP: 2026-08-20 | TCMS AUTOMATION ENGINE</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function seedPlans() {
  console.log('🌱 Starting Enterprise Test Data Seed (6 Projects, 40+ Suites, 120+ Test Cases, 20+ Test Runs)...');

  // Clean up all existing data cleanly
  console.log('🧹 Cleaning up database...');
  await prisma.testResult.deleteMany({});
  await prisma.testStep.deleteMany({});
  await prisma.testCase.deleteMany({});
  await prisma.testRun.deleteMany({});
  await prisma.suite.deleteMany({});
  await prisma.project.deleteMany({});

  // =========================================================================
  // 1. PROJECT 1: Web E-Ticaret & Alışveriş Platformu (TP1)
  // =========================================================================
  console.log('📦 Creating Plan 1: Web E-Ticaret Platformu (TP1)...');
  const plan1 = await prisma.project.create({
    data: {
      name: 'Test Plan 1 - Web E-Ticaret Platformu',
      key: 'TP1',
      description:
        'E-Ticaret web portalı, kullanıcı oturum açma, ürün kataloğu & filtreleme, sepet indirimleri, 3D Secure ödeme ve sipariş takibi kapsamlı test planı.',
      jiraProjectKey: 'COMM',
    },
  });

  // Suites
  const s1_auth = await prisma.suite.create({
    data: { name: 'Giriş & Üyelik İşlemleri', projectId: plan1.id, orderIndex: 0 },
  });
  const s1_auth_reset = await prisma.suite.create({
    data: { name: 'Şifre Sıfırlama & 2FA', projectId: plan1.id, parentId: s1_auth.id, orderIndex: 0 },
  });
  const s1_auth_sso = await prisma.suite.create({
    data: { name: 'Sosyal Medya & SSO Girişleri', projectId: plan1.id, parentId: s1_auth.id, orderIndex: 1 },
  });

  const s1_catalog = await prisma.suite.create({
    data: { name: 'Ürün Kataloğu & Arama', projectId: plan1.id, orderIndex: 1 },
  });
  const s1_catalog_filter = await prisma.suite.create({
    data: { name: 'Filtreleme & Sıralama', projectId: plan1.id, parentId: s1_catalog.id, orderIndex: 0 },
  });
  const s1_catalog_search = await prisma.suite.create({
    data: { name: 'Arama & Elasticsearch Öneri (Auto-complete)', projectId: plan1.id, parentId: s1_catalog.id, orderIndex: 1 },
  });

  const s1_cart = await prisma.suite.create({
    data: { name: 'Sepet & Kupon Yönetimi', projectId: plan1.id, orderIndex: 2 },
  });
  const s1_cart_coupon = await prisma.suite.create({
    data: { name: 'Kupon / Promosyon Kodu Uygulama', projectId: plan1.id, parentId: s1_cart.id, orderIndex: 0 },
  });

  const s1_checkout = await prisma.suite.create({
    data: { name: 'Ödeme & Checkout Akışı', projectId: plan1.id, orderIndex: 3 },
  });
  const s1_checkout_card = await prisma.suite.create({
    data: { name: '3D Secure Kredi Kartı', projectId: plan1.id, parentId: s1_checkout.id, orderIndex: 0 },
  });
  const s1_checkout_address = await prisma.suite.create({
    data: { name: 'Adres & Fatura Bilgileri Seçimi', projectId: plan1.id, parentId: s1_checkout.id, orderIndex: 1 },
  });

  const s1_orders = await prisma.suite.create({
    data: { name: 'Sipariş & İptal/İade Takibi', projectId: plan1.id, orderIndex: 4 },
  });
  const s1_orders_refund = await prisma.suite.create({
    data: { name: 'Kolay İade Talebi & Kargo Kodu Üretme', projectId: plan1.id, parentId: s1_orders.id, orderIndex: 0 },
  });

  // Test Cases for Plan 1
  const tc1_1 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-01',
      title: 'Geçerli Kullanıcı Bilgileri ile Başarılı Giriş Yapma',
      description: 'Kullanıcının doğru e-posta ve şifre girdiğinde JWT token alıp ana sayfaya yönlendirildiği doğrulanır.\nTags: @web @auth @smoke @regression @p1',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Kullanıcının veritabanında aktif ve onaylanmış e-posta hesabı bulunmalıdır.',
      projectId: plan1.id,
      suiteId: s1_auth.id,
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

  const tc1_2 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-02',
      title: 'Hatalı Şifre İle Giriş Denemesinde Güvenlik Uyarısı Kontrolü',
      description: 'Hatalı parola girildiğinde sistem genel bir hata mesajı vermeli ve brute-force koruması için sayaç artırmalıdır.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.NORMAL,
      precondition: 'Giriş ekranında bulunulmalıdır.',
      projectId: plan1.id,
      suiteId: s1_auth.id,
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

  const tc1_3 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-03',
      title: 'Şifre Sıfırlama Bağlantısının E-Posta ile Gönderilmesi ve Token Doğrulaması',
      description: 'Şifremi unuttum akışında tek kullanımlık 15 dakikalık geçerli token oluşturulup mail iletilmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.NORMAL,
      precondition: 'Kullanıcının kayıtlı e-postasına erişimi olmalıdır.',
      projectId: plan1.id,
      suiteId: s1_auth_reset.id,
      jiraStoryKey: 'COMM-105',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-105',
      steps: {
        create: [
          { stepNumber: 1, action: '"Şifremi Unuttum" linkine tıklanır.', expectedResult: 'Şifre sıfırlama formu açılır.' },
          { stepNumber: 2, action: 'Kayıtlı e-posta adresi yazılıp "Bağlantı Gönder" butonuna basılır.', expectedResult: '"Sıfırlama linki e-postanıza iletildi" mesajı görünür.' },
          { stepNumber: 3, action: 'Gelen kutusundaki bağlantıya tıklanır.', expectedResult: 'Yeni şifre belirleme ekranı başarıyla açılır.' },
        ],
      },
    },
  });

  const tc1_4 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-04',
      title: 'Google & Apple SSO ile Tek Tıkla Hızlı Giriş',
      description: 'OAuth2 kimlik sağlayıcıları üzerinden kullanıcının parola girmeden güvenli giriş yapabilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.NORMAL,
      precondition: 'Kullanıcının aktif Google/Apple hesabı olmalıdır.',
      projectId: plan1.id,
      suiteId: s1_auth_sso.id,
      jiraStoryKey: 'COMM-108',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-108',
      steps: {
        create: [
          { stepNumber: 1, action: '"Google ile Devam Et" butonuna tıklanır.', expectedResult: 'Google OAuth onay penceresi açılır.' },
          { stepNumber: 2, action: 'Hesap seçilerek izin verilir.', expectedResult: 'Callback URL işlenir ve oturum açılarak profil sayfasına yönlendirilir.' },
        ],
      },
    },
  });

  const tc1_5 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-05',
      title: 'Kategori, Marka ve Fiyat Aralığına Göre Dinamik Ürün Filtreleme',
      description: 'Elektronik kategorisinde filtreleme yapıldığında URL parametreleri güncellenmeli ve ürün listesi AJAX ile yenilenmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.NORMAL,
      precondition: 'Katalogda en az 50 adet ürün bulunmalıdır.',
      projectId: plan1.id,
      suiteId: s1_catalog_filter.id,
      jiraStoryKey: 'COMM-210',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-210',
      steps: {
        create: [
          { stepNumber: 1, action: 'Ana menüden "Elektronik > Bilgisayar" kategorisi seçilir.', expectedResult: 'Kategori ürünleri listelenir.' },
          { stepNumber: 2, action: 'Sol filtre panelinden Marka: "Apple" ve Fiyat: "30.000 TL - 70.000 TL" seçilir.', expectedResult: 'Filtreler seçili hale gelir.' },
          { stepNumber: 3, action: 'Listelenen ürünlerin fiyat ve marka bilgileri incelenir.', expectedResult: 'Yalnızca kriterlere uyan ürünlerin listelendiği doğrulanır.' },
        ],
      },
    },
  });

  const tc1_6 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-06',
      title: 'Arama Çubuğunda Canlı Otomatik Tamamlama & Kategori Önerisi',
      description: 'Kullanıcı en az 3 karakter yazdığında Elasticsearch motorundan anlık popüler ürün ve kategori önerileri gelmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.NORMAL,
      precondition: 'Elasticsearch indeksleri güncel olmalıdır.',
      projectId: plan1.id,
      suiteId: s1_catalog_search.id,
      jiraStoryKey: 'COMM-212',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-212',
      steps: {
        create: [
          { stepNumber: 1, action: 'Arama input alanına "kulak" yazılır.', expectedResult: '300ms debounce sonrası dropdown öneri paneli açılır.' },
          { stepNumber: 2, action: 'Öneriler arasında "Kablosuz Kulaklık" başlığı seçilir.', expectedResult: 'Arama sonuç sayfasına yönlendirilir.' },
        ],
      },
    },
  });

  const tc1_7 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-07',
      title: 'Sepete Ürün Ekleme, Adet Güncelleme ve Dinamik Kargo Bedava Kontrolü',
      description: 'Sepet tutarı 500 TL üzerine çıktığında kargo ücretinin 0.00 TL olarak güncellendiği doğrulanır.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Sepet boş olmalıdır.',
      projectId: plan1.id,
      suiteId: s1_cart.id,
      jiraStoryKey: 'COMM-301',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-301',
      steps: {
        create: [
          { stepNumber: 1, action: '350 TL tutarında bir ürün sepete eklenir.', expectedResult: 'Kargo bedeli 39.90 TL olarak sepete eklenir.' },
          { stepNumber: 2, action: 'Ürün adedi 2 yapılır (Toplam 700 TL).', expectedResult: '"Kargo Ücretsiz!" rozeti yeşil renkte görüntülenir ve kargo 0 TL olur.' },
        ],
      },
    },
  });

  const tc1_8 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-08',
      title: 'Geçersiz veya Süresi Dolmuş İndirim Kuponu Uygulama Kontrolü',
      description: 'Süresi dolmuş "SUMMER2025" kuponu girildiğinde sepet tutarı değişmemeli ve hata bildirimi verilmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.NORMAL,
      precondition: 'Sepette en az 1 ürün bulunmalıdır.',
      projectId: plan1.id,
      suiteId: s1_cart_coupon.id,
      jiraStoryKey: 'COMM-305',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-305',
      steps: {
        create: [
          { stepNumber: 1, action: 'Kupon kodu alanına "SUMMER2025" yazılıp "Uygula" butonuna basılır.', expectedResult: '"Bu kuponun kullanım süresi dolmuştur" uyarısı belirir.' },
          { stepNumber: 2, action: 'Sepet toplam tutarı kontrol edilir.', expectedResult: 'İndirim uygulanmadığı ve toplam tutarın değişmediği doğrulanır.' },
        ],
      },
    },
  });

  const tc1_9 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-09',
      title: '3D Secure Kredi Kartı ile Başarılı Ödeme ve Sipariş Onay Ekranı',
      description: 'Banka SMS OTP doğrulaması tamamlandıktan sonra siparişin veritabanına "PAID" olarak kaydedilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.BLOCKER,
      precondition: 'Kullanıcı sepetinde ürünlerle ödeme adımına gelmiş olmalıdır.',
      projectId: plan1.id,
      suiteId: s1_checkout_card.id,
      jiraStoryKey: 'COMM-401',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-401',
      steps: {
        create: [
          { stepNumber: 1, action: 'Test kredi kartı bilgileri ve CVV girilir.', expectedResult: 'Kart tipi (Mastercard/Visa) otomatik algılanır.' },
          { stepNumber: 2, action: '"Siparişi Tamamla" butonuna basılır.', expectedResult: 'Banka 3D Secure iframe/modal penceresi açılır.' },
          { stepNumber: 3, action: 'Test OTP kodu "123456" girilir ve onaylanır.', expectedResult: 'Sipariş başarı sayfası açılır, sipariş numarası (örn: ORD-84729) gösterilir.' },
        ],
      },
    },
  });

  const tc1_10 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-10',
      title: 'Teslim Edilen Sipariş İçin Kolay İade Talebi ve Kargo Barkodu Oluşturma',
      description: 'Sipariş detayından ürün seçilerek iade nedeni girildiğinde kargo iade takip numarasının oluşturulması.',
      executionType: 'MANUAL',
      type: TestType.WEB,
      priority: Priority.NORMAL,
      precondition: 'Kullanıcının "Teslim Edildi" statüsünde 14 günü geçmemiş siparişi olmalıdır.',
      projectId: plan1.id,
      suiteId: s1_orders_refund.id,
      jiraStoryKey: 'COMM-502',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-502',
      steps: {
        create: [
          { stepNumber: 1, action: 'Siparişlerim sayfasına gidilir ve son teslim edilen sipariş seçilir.', expectedResult: 'Sipariş ürünleri ve "Kolay İade" butonu görüntülenir.' },
          { stepNumber: 2, action: 'İade nedeni olarak "Beden Uymadı" seçilir ve onaylanır.', expectedResult: 'Yurtiçi Kargo anlaşma iade kodu (örn: 948271) ekranda belirir.' },
        ],
      },
    },
  });

  // Test Runs for Plan 1
  const run1_1 = await prisma.testRun.create({
    data: {
      title: 'Sprint 24 - Full Web Regression Run',
      version: 'v2.4.0',
      environment: 'STAGING',
      status: RunStatus.COMPLETED,
      executedBy: 'Selin Yılmaz (Lead QA)',
      testerEmail: 'selin.yilmaz@company.com',
      projectId: plan1.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run1_1.id,
        testCaseId: tc1_1.id,
        status: ResultStatus.PASSED,
        executionMs: 1420,
        executedBy: 'Selin Yılmaz',
        testerEmail: 'selin.yilmaz@company.com',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Giriş Başarılı', 'JWT token alındı, dashboard yüklendi', [
          'POST /api/v1/auth/login -> 200 OK',
          'Token: Bearer eyJhbGciOiJIUzI1NiIs...',
          'Page title check: Dashboard - Store (OK)',
        ]),
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_2.id,
        status: ResultStatus.PASSED,
        executionMs: 890,
        executedBy: 'Selin Yılmaz',
        testerEmail: 'selin.yilmaz@company.com',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_3.id,
        status: ResultStatus.PASSED,
        executionMs: 2100,
        executedBy: 'Selin Yılmaz',
        testerEmail: 'selin.yilmaz@company.com',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_5.id,
        status: ResultStatus.PASSED,
        executionMs: 1650,
        executedBy: 'Selin Yılmaz',
        testerEmail: 'selin.yilmaz@company.com',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_7.id,
        status: ResultStatus.PASSED,
        executionMs: 1980,
        executedBy: 'Selin Yılmaz',
        testerEmail: 'selin.yilmaz@company.com',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_8.id,
        status: ResultStatus.PASSED,
        executionMs: 1120,
        executedBy: 'Selin Yılmaz',
        testerEmail: 'selin.yilmaz@company.com',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_9.id,
        status: ResultStatus.FAILED,
        executionMs: 5400,
        errorMessage: 'Payment Gateway Timeout: 3D Secure callback did not complete within 5000ms. Response code: 504 Gateway Timeout',
        executedBy: 'Selin Yılmaz',
        testerEmail: 'selin.yilmaz@company.com',
        jiraBugKey: 'COMM-BUG-142',
        jiraBugUrl: 'https://jira.company.com/browse/COMM-BUG-142',
        screenshotUrl: createEvidenceScreenshot('FAILED', '3D Secure Timeout', 'İş Bankası Gateway Yanıt Vermedi (504)', [
          'POST /api/v1/checkout/3d-secure -> 504 Gateway Timeout',
          'Expected: 200 OK with orderConfirmationUrl',
          'Received: null response payload',
          'AssertionError: Expected order status to be PAID, got PENDING',
        ]),
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_10.id,
        status: ResultStatus.PASSED,
        executionMs: 3400,
        executedBy: 'Selin Yılmaz',
        testerEmail: 'selin.yilmaz@company.com',
      },
    ],
  });

  const run1_2 = await prisma.testRun.create({
    data: {
      title: 'Nightly E-Commerce Smoke Test Suite',
      version: 'v2.4.1-rc3',
      environment: 'PROD-SMOKE',
      status: RunStatus.COMPLETED,
      executedBy: 'Jenkins CI/CD Automation',
      testerEmail: 'ci-bot@company.com',
      projectId: plan1.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run1_2.id,
        testCaseId: tc1_1.id,
        status: ResultStatus.PASSED,
        executionMs: 620,
        executedBy: 'Jenkins CI/CD',
        testerEmail: 'ci-bot@company.com',
      },
      {
        testRunId: run1_2.id,
        testCaseId: tc1_5.id,
        status: ResultStatus.PASSED,
        executionMs: 840,
        executedBy: 'Jenkins CI/CD',
        testerEmail: 'ci-bot@company.com',
      },
      {
        testRunId: run1_2.id,
        testCaseId: tc1_7.id,
        status: ResultStatus.PASSED,
        executionMs: 1050,
        executedBy: 'Jenkins CI/CD',
        testerEmail: 'ci-bot@company.com',
      },
      {
        testRunId: run1_2.id,
        testCaseId: tc1_9.id,
        status: ResultStatus.PASSED,
        executionMs: 2310,
        executedBy: 'Jenkins CI/CD',
        testerEmail: 'ci-bot@company.com',
      },
    ],
  });

  // =========================================================================
  // 2. PROJECT 2: Mobil Bankacılık & Finansal İşlemler (TP2)
  // =========================================================================
  console.log('📱 Creating Plan 2: Mobil Bankacılık & Finansal İşlemler (TP2)...');
  const plan2 = await prisma.project.create({
    data: {
      name: 'Test Plan 2 - Mobil Bankacılık & Finansal İşlemler',
      key: 'TP2',
      description:
        'iOS ve Android native mobil bankacılık uygulaması: FAST para transferi, QR kod ile ödeme, hesap hareketleri, vadeli mevduat hesaplama ve kart limit yönetimi test senaryoları.',
      jiraProjectKey: 'BANK',
    },
  });

  // Suites
  const s2_auth = await prisma.suite.create({
    data: { name: 'Biyometrik & Hızlı Giriş', projectId: plan2.id, orderIndex: 0 },
  });
  const s2_auth_bio = await prisma.suite.create({
    data: { name: 'FaceID / TouchID Doğrulama', projectId: plan2.id, parentId: s2_auth.id, orderIndex: 0 },
  });
  const s2_auth_nfc = await prisma.suite.create({
    data: { name: 'Şifremi Unuttum & Kimlik Kartı NFC Okuma', projectId: plan2.id, parentId: s2_auth.id, orderIndex: 1 },
  });

  const s2_transfer = await prisma.suite.create({
    data: { name: 'Para Transferleri', projectId: plan2.id, orderIndex: 1 },
  });
  const s2_transfer_fast = await prisma.suite.create({
    data: { name: 'FAST (7/24 Anlık Fon Transferi)', projectId: plan2.id, parentId: s2_transfer.id, orderIndex: 0 },
  });
  const s2_transfer_saved = await prisma.suite.create({
    data: { name: 'Tanımlı / Kayıtlı Alıcılar Yönetimi', projectId: plan2.id, parentId: s2_transfer.id, orderIndex: 1 },
  });
  const s2_transfer_qr = await prisma.suite.create({
    data: { name: 'QR Kod ile Temassız Para Transferi', projectId: plan2.id, parentId: s2_transfer.id, orderIndex: 2 },
  });

  const s2_accounts = await prisma.suite.create({
    data: { name: 'Hesaplar & Varlık Özeti', projectId: plan2.id, orderIndex: 2 },
  });
  const s2_accounts_deposit = await prisma.suite.create({
    data: { name: 'Mevduat Getiri Hesaplama & Vadeli Hesap', projectId: plan2.id, parentId: s2_accounts.id, orderIndex: 0 },
  });
  const s2_accounts_statement = await prisma.suite.create({
    data: { name: 'Hesap Hareketleri & PDF Dekont İndirme', projectId: plan2.id, parentId: s2_accounts.id, orderIndex: 1 },
  });

  const s2_cards = await prisma.suite.create({
    data: { name: 'Kartlarım & Limit Yönetimi', projectId: plan2.id, orderIndex: 3 },
  });
  const s2_cards_virtual = await prisma.suite.create({
    data: { name: 'Sanal Kart Oluşturma & Anlık Limit Belirleme', projectId: plan2.id, parentId: s2_cards.id, orderIndex: 0 },
  });
  const s2_cards_security = await prisma.suite.create({
    data: { name: 'Kart Güvenlik Ayarları (Yurtdışı / E-Ticaret)', projectId: plan2.id, parentId: s2_cards.id, orderIndex: 1 },
  });

  // Test Cases for Plan 2
  const tc2_1 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-01',
      title: 'FaceID ile 1 Saniyenin Altında Biyometrik Giriş Yapma',
      description: 'Kullanıcının biyometrik izinleri onaylandığında FaceID sensörü tetiklenmeli ve ana sayfaya geçilmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.IOS,
      priority: Priority.CRITICAL,
      precondition: 'iOS cihazında FaceID aktif ve uygulamaya izin verilmiş olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_auth_bio.id,
      jiraStoryKey: 'BANK-101',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-101',
      steps: {
        create: [
          { stepNumber: 1, action: 'Mobil uygulama açılır.', expectedResult: 'FaceID tarama ikonu ekranda belirir.' },
          { stepNumber: 2, action: 'Geçerli biyometrik veri sağlanır.', expectedResult: 'Biyometrik doğrulama 800ms altında geçer ve ana bakiye kartı yüklenir.' },
        ],
      },
    },
  });

  const tc2_2 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-02',
      title: 'FAST ile Kolay Adres (Telefon Numarası) Üzerinden 7/24 Anlık Para Gönderme',
      description: 'KOLAS servisine sorgu atılarak IBAN olmadan cep telefonu ile FAST transferi gerçekleştirilir.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.BLOCKER,
      precondition: 'Gönderen hesabında en az 250 TL bakiye bulunmalıdır.',
      projectId: plan2.id,
      suiteId: s2_transfer_fast.id,
      jiraStoryKey: 'BANK-204',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-204',
      steps: {
        create: [
          { stepNumber: 1, action: 'Para Transferi > FAST menüsü seçilir.', expectedResult: 'Kolay Adres seçim seçenekleri listelenir.' },
          { stepNumber: 2, action: 'Telefon Numarası seçilip "05321112233" ve Tutar: "250 TL" girilir.', expectedResult: 'Alıcı adı maskeli (A*** K***) olarak anında ekrana gelir.' },
          { stepNumber: 3, action: '"Gönder" butonuna basılır ve SMS/Push onaylanır.', expectedResult: 'FAST referans numarası üretilir, bakiye anında 250 TL düşer.' },
        ],
      },
    },
  });

  const tc2_3 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-03',
      title: 'Tanımlı Alıcı Ekleme, Düzenleme ve Hızlı Gönderim Testi',
      description: 'Kullanıcının sık para gönderdiği kişileri rehbere ekleyip tek tıkla transfer başlatabilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Kullanıcı oturumu açık olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_transfer_saved.id,
      jiraStoryKey: 'BANK-208',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-208',
      steps: {
        create: [
          { stepNumber: 1, action: 'Tanımlı Alıcılar > Yeni Alıcı Ekle seçilir.', expectedResult: 'IBAN ve Alıcı Adı formu açılır.' },
          { stepNumber: 2, action: 'TR330006100511223344556677 IBAN ve "Mehmet Demir" kaydedilir.', expectedResult: 'Alıcı listeye eklenir ve favorilere alınır.' },
          { stepNumber: 3, action: 'Listeden Mehmet Demir seçilerek hızlı transfer açılır.', expectedResult: 'IBAN alanı otomatik dolu gelir.' },
        ],
      },
    },
  });

  const tc2_4 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-04',
      title: 'Mevduat Hesaplama Aracı ile Vade ve Faiz Getirisi Simülasyonu',
      description: '32, 45 ve 92 günlük vadeler için net getiri, stopaj kesintisi ve vade sonu toplam bakiyenin doğru hesaplanması.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Güncel faiz oranları API servisi çalışır durumda olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_accounts_deposit.id,
      jiraStoryKey: 'BANK-310',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-310',
      steps: {
        create: [
          { stepNumber: 1, action: 'Mevduat Getiri Hesaplama ekranı açılır.', expectedResult: 'Tutar slider ve vade günü seçenekleri gelir.' },
          { stepNumber: 2, action: 'Tutar: 100.000 TL, Vade: 32 Gün, Faiz Oranı: %45.00 seçilir.', expectedResult: 'Brüt getiri: 3.945,21 TL, Stopaj (%7.5): 295,89 TL, Net Getiri: 3.649,32 TL hesaplanır.' },
          { stepNumber: 3, action: '"Hemen Hesap Aç" butonuna basılır.', expectedResult: 'Vadeli hesap sözleşme onay ekranına yönlendirilir.' },
        ],
      },
    },
  });

  const tc2_5 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-05',
      title: 'Hesap Hareketlerinden Geçmiş Tarihli PDF Dekont Paylaşımı',
      description: 'Son 30 günlük transfer işlemine ait e-imzalı resmi banka dekontunun PDF olarak oluşturulup iOS Paylaş menüsüne iletilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Hesapta en az 1 adet tamamlanmış para transferi kaydı olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_accounts_statement.id,
      jiraStoryKey: 'BANK-315',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-315',
      steps: {
        create: [
          { stepNumber: 1, action: 'Hesap Hareketleri ekranında ilgili transfer kaydına tıklanır.', expectedResult: 'İşlem detay çekmecesi açılır.' },
          { stepNumber: 2, action: '"Dekont Görüntüle" butonuna basılır.', expectedResult: 'PDF önizleme yüklenir, barkod ve dijital imza görünür.' },
          { stepNumber: 3, action: '"Paylaş" butonuna basılır.', expectedResult: 'Sistem paylaşım menüsü (WhatsApp, AirDrop, Mail) tetiklenir.' },
        ],
      },
    },
  });

  const tc2_6 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-06',
      title: 'Anlık Dinamik Limitli Sanal Kredi Kartı Oluşturma ve Silme',
      description: 'E-ticaret harcaması için tek kullanımlık 1.500 TL limitli sanal kart üretilmesi ve harcama sonrası limitin sıfırlanması.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.CRITICAL,
      precondition: 'Kullanıcının aktif ana kredi kartı olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_cards_virtual.id,
      jiraStoryKey: 'BANK-402',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-402',
      steps: {
        create: [
          { stepNumber: 1, action: 'Kartlarım > Sanal Kart Oluştur menüsüne girilir.', expectedResult: 'Limit ve son kullanma tarihi belirleme formu açılır.' },
          { stepNumber: 2, action: 'Limit 1.500 TL olarak yazılır ve onaylanır.', expectedResult: '16 haneli sanal kart numarası, CVV2 ve SKT anında üretilir.' },
        ],
      },
    },
  });

  const tc2_7 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-07',
      title: 'Kart Güvenlik Ayarlarında Yurt Dışı Kullanımını Kapatma Testi',
      description: 'Kart yurt dışı e-ticaret ve POS işlemlerine kapatıldığında uluslararası gateway taleplerinin reddedilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Kart listesinde ana kart seçilmiş olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_cards_security.id,
      jiraStoryKey: 'BANK-408',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-408',
      steps: {
        create: [
          { stepNumber: 1, action: 'Kart Güvenlik Ayarları menüsü açılır.', expectedResult: 'Yurtdışı Harcama, İnternet Harcaması ve Temassız İşlem switchleri görünür.' },
          { stepNumber: 2, action: '"Yurtdışı Harcama" switchi pasif yapılır.', expectedResult: 'Switch gri renge döner ve başarı toast mesajı çıkar.' },
        ],
      },
    },
  });

  // Test Runs for Plan 2
  const run2_1 = await prisma.testRun.create({
    data: {
      title: 'iOS & Android Release v3.8.0 - Full Regression Run',
      version: 'v3.8.0',
      environment: 'UAT',
      status: RunStatus.COMPLETED,
      executedBy: 'Burak Korkmaz (Mobile QA Lead)',
      testerEmail: 'burak.korkmaz@company.com',
      projectId: plan2.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run2_1.id,
        testCaseId: tc2_1.id,
        status: ResultStatus.PASSED,
        executionMs: 780,
        executedBy: 'Burak Korkmaz',
        testerEmail: 'burak.korkmaz@company.com',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_2.id,
        status: ResultStatus.PASSED,
        executionMs: 1850,
        executedBy: 'Burak Korkmaz',
        testerEmail: 'burak.korkmaz@company.com',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'FAST Transfer Tamamlandı', 'Referans No: FAST-2026-991823', [
          'POST /api/v2/transfers/fast -> 200 OK',
          'KOLAS Check: Phone 05321112233 -> TR880006... Valid',
          'Amount: 250.00 TRY | Commission: 0.00 TRY',
          'TCMB FAST Core Engine Response Code: 00 (Success)',
        ]),
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_3.id,
        status: ResultStatus.PASSED,
        executionMs: 1200,
        executedBy: 'Burak Korkmaz',
        testerEmail: 'burak.korkmaz@company.com',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_4.id,
        status: ResultStatus.PASSED,
        executionMs: 940,
        executedBy: 'Burak Korkmaz',
        testerEmail: 'burak.korkmaz@company.com',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_5.id,
        status: ResultStatus.PASSED,
        executionMs: 2400,
        executedBy: 'Burak Korkmaz',
        testerEmail: 'burak.korkmaz@company.com',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_6.id,
        status: ResultStatus.PASSED,
        executionMs: 1670,
        executedBy: 'Burak Korkmaz',
        testerEmail: 'burak.korkmaz@company.com',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_7.id,
        status: ResultStatus.PASSED,
        executionMs: 820,
        executedBy: 'Burak Korkmaz',
        testerEmail: 'burak.korkmaz@company.com',
      },
    ],
  });

  // =========================================================================
  // 3. PROJECT 3: B2B API Gateway & Entegrasyon Servisleri (TP3)
  // =========================================================================
  console.log('⚡ Creating Plan 3: B2B API Gateway & Entegrasyon Servisleri (TP3)...');
  const plan3 = await prisma.project.create({
    data: {
      name: 'Test Plan 3 - B2B API Gateway & Entegrasyon Servisleri',
      key: 'TP3',
      description:
        'REST & GraphQL microservices API Gateway: OAuth2 client_credentials token alışverişi, Webhook HMAC imzalama, rate limiting, ERP sipariş senkronizasyonu ve SLA gecikme testleri.',
      jiraProjectKey: 'GATE',
    },
  });

  // Suites
  const s3_oauth = await prisma.suite.create({
    data: { name: 'OAuth2 & Token Exchange Gateway', projectId: plan3.id, orderIndex: 0 },
  });
  const s3_oauth_token = await prisma.suite.create({
    data: { name: 'Client Credentials Grant & Scopes', projectId: plan3.id, parentId: s3_oauth.id, orderIndex: 0 },
  });
  const s3_oauth_revoke = await prisma.suite.create({
    data: { name: 'Token Introspection & Revocation (RFC 7662)', projectId: plan3.id, parentId: s3_oauth.id, orderIndex: 1 },
  });

  const s3_webhook = await prisma.suite.create({
    data: { name: 'Webhook & Event Dispatcher Servisleri', projectId: plan3.id, orderIndex: 1 },
  });
  const s3_webhook_hmac = await prisma.suite.create({
    data: { name: 'Event Payload Dağıtımı & HMAC-SHA256 İmzalama', projectId: plan3.id, parentId: s3_webhook.id, orderIndex: 0 },
  });
  const s3_webhook_retry = await prisma.suite.create({
    data: { name: 'Retry Policy & Dead Letter Queue (DLQ)', projectId: plan3.id, parentId: s3_webhook.id, orderIndex: 1 },
  });

  const s3_erp = await prisma.suite.create({
    data: { name: 'B2B Sipariş & Fatura Senkronizasyonu', projectId: plan3.id, orderIndex: 2 },
  });
  const s3_erp_bulk = await prisma.suite.create({
    data: { name: 'Toplu (Bulk) Sipariş Kabul & Validasyon API', projectId: plan3.id, parentId: s3_erp.id, orderIndex: 0 },
  });

  const s3_rate = await prisma.suite.create({
    data: { name: 'Rate Limiting & Güvenlik Politikaları', projectId: plan3.id, orderIndex: 3 },
  });
  const s3_rate_throttle = await prisma.suite.create({
    data: { name: 'IP / API Key Bazlı Throttling & DDoS Koruması', projectId: plan3.id, parentId: s3_rate.id, orderIndex: 0 },
  });

  // Test Cases for Plan 3
  const tc3_1 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-01',
      title: 'OAuth2 Client Credentials ile 3600s Geçerli JWT Access Token Alma',
      description: 'Geçerli client_id ve client_secret ile POST /oauth/v2/token çağrısı yapıldığında 200 OK ve JWT dönmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.BLOCKER,
      precondition: 'B2B partner hesabı Gateway üzerinde aktif ve yetkili scope tanımlı olmalıdır.',
      projectId: plan3.id,
      suiteId: s3_oauth_token.id,
      jiraStoryKey: 'GATE-101',
      jiraIssueUrl: 'https://jira.company.com/browse/GATE-101',
      steps: {
        create: [
          { stepNumber: 1, action: 'POST /oauth/v2/token { grant_type: "client_credentials", client_id: "...", client_secret: "..." }', expectedResult: '200 OK, token_type: Bearer, expires_in: 3600' },
          { stepNumber: 2, action: 'Dönen JWT payload incelenir.', expectedResult: 'Partner ID, issuer, audience ve yetkili scope bilgileri doğrulanır.' },
        ],
      },
    },
  });

  const tc3_2 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-02',
      title: 'Yetkisiz Scope Talebinde 403 Forbidden ve Hata Detayı Doğrulaması',
      description: 'Partnerin yetkisi olmayan "admin:write" scope talep edildiğinde sistem isteği reddetmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.NORMAL,
      precondition: 'Standart yetkili B2B Partner API anahtarı kullanılmalıdır.',
      projectId: plan3.id,
      suiteId: s3_oauth_token.id,
      jiraStoryKey: 'GATE-104',
      jiraIssueUrl: 'https://jira.company.com/browse/GATE-104',
      steps: {
        create: [
          { stepNumber: 1, action: 'POST /oauth/v2/token scope="admin:write" parametresi ile gönderilir.', expectedResult: 'HTTP 403 Forbidden döner.' },
          { stepNumber: 2, action: 'Hata JSON gövdesi doğrulanır.', expectedResult: '{"error": "insufficient_scope", "message": "Partner not authorized for requested scope"}' },
        ],
      },
    },
  });

  const tc3_3 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-03',
      title: 'Webhook Event Dağıtımında X-Signature-SHA256 HMAC Başlık Kontrolü',
      description: 'Sipariş oluşturulduğunda B2B partner endpointine gönderilen Webhook isteğindeki imzanın geçerli olması.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.CRITICAL,
      precondition: 'Partner webhook callback URL ve HMAC secret kayıtlı olmalıdır.',
      projectId: plan3.id,
      suiteId: s3_webhook_hmac.id,
      jiraStoryKey: 'GATE-202',
      jiraIssueUrl: 'https://jira.company.com/browse/GATE-202',
      steps: {
        create: [
          { stepNumber: 1, action: 'Sistemde yeni sipariş eventi tetiklenir.', expectedResult: 'Webhook dispatcher kuyruğa event ekler.' },
          { stepNumber: 2, action: 'Callback isteği yakalanır ve X-Signature-SHA256 başlığı incelenir.', expectedResult: 'Payload ile partner secret kullanılarak üretilen hash eşleşir.' },
        ],
      },
    },
  });

  const tc3_4 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-04',
      title: 'Başarısız Webhook İsteklerinde Exponential Backoff Retry ve DLQ Transferi',
      description: 'Hedef sunucu 500/503 hatası verdiğinde sistem sırasıyla 1m, 5m, 15m aralıklarla 3 kez denemeli ve DLQ kuyruğuna atmalıdır.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.NORMAL,
      precondition: 'Mock sunucu 503 Service Unavailable dönecek şekilde ayarlanmalıdır.',
      projectId: plan3.id,
      suiteId: s3_webhook_retry.id,
      jiraStoryKey: 'GATE-205',
      jiraIssueUrl: 'https://jira.company.com/browse/GATE-205',
      steps: {
        create: [
          { stepNumber: 1, action: 'Webhook isteği 503 dönen mock sunucuya fırlatılır.', expectedResult: 'İstek retry kuyruğuna alınır.' },
          { stepNumber: 2, action: '3 başarısız deneme sonrası kuyruk kontrol edilir.', expectedResult: 'Event "dead_letter_queue_webhooks" topicine başarıyla aktarılır.' },
        ],
      },
    },
  });

  const tc3_5 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-05',
      title: 'Toplu 1000 Adet B2B Sipariş Kabul API Yük ve Şema Validasyonu',
      description: 'POST /api/v1/orders/bulk endpointi 1000 adetlik JSON array payloadını 1.5 saniye altında kabul edip 202 Accepted dönmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.CRITICAL,
      precondition: 'Partner API yetkilendirmesi tamamlanmış olmalıdır.',
      projectId: plan3.id,
      suiteId: s3_erp_bulk.id,
      jiraStoryKey: 'GATE-301',
      jiraIssueUrl: 'https://jira.company.com/browse/GATE-301',
      steps: {
        create: [
          { stepNumber: 1, action: '1000 adet sipariş içeren 2.4 MB JSON payloadı POST edilir.', expectedResult: 'Şema doğrulaması geçer ve HTTP 202 Accepted yanıtı döner.' },
          { stepNumber: 2, action: 'Response içerisinde verilen batchId (örn: BATCH-8839) sorgulanır.', expectedResult: 'Tüm siparişlerin asenkron işlendiği görülür.' },
        ],
      },
    },
  });

  const tc3_6 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-06',
      title: 'API Rate Limiting Aşımında 429 Too Many Requests ve Retry-After Başlığı',
      description: 'Dakikada 100 istek limitini aşan istemciye 429 Too Many Requests yanıtı ve kalan bekleme süresi iletilmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.NORMAL,
      precondition: 'Rate limit politikası 100 req/min olarak tanımlı olmalıdır.',
      projectId: plan3.id,
      suiteId: s3_rate_throttle.id,
      jiraStoryKey: 'GATE-401',
      jiraIssueUrl: 'https://jira.company.com/browse/GATE-401',
      steps: {
        create: [
          { stepNumber: 1, action: '1 saniye içinde 105 adet GET isteği gönderilir.', expectedResult: 'İlk 100 istek 200 OK döner.' },
          { stepNumber: 2, action: '101. istek incelenir.', expectedResult: 'HTTP 429 Too Many Requests ve "Retry-After: 45" başlığı doğrulanır.' },
        ],
      },
    },
  });

  // Test Runs for Plan 3
  const run3_1 = await prisma.testRun.create({
    data: {
      title: 'API Gateway Nightly Regression & SLA Validation',
      version: 'v1.12.4',
      environment: 'STAGING',
      status: RunStatus.COMPLETED,
      executedBy: 'Caner Aydın (Backend & API QA)',
      testerEmail: 'caner.aydin@company.com',
      projectId: plan3.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run3_1.id,
        testCaseId: tc3_1.id,
        status: ResultStatus.PASSED,
        executionMs: 320,
        executedBy: 'Caner Aydın',
        testerEmail: 'caner.aydin@company.com',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_2.id,
        status: ResultStatus.PASSED,
        executionMs: 240,
        executedBy: 'Caner Aydın',
        testerEmail: 'caner.aydin@company.com',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_3.id,
        status: ResultStatus.PASSED,
        executionMs: 450,
        executedBy: 'Caner Aydın',
        testerEmail: 'caner.aydin@company.com',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_4.id,
        status: ResultStatus.PASSED,
        executionMs: 1200,
        executedBy: 'Caner Aydın',
        testerEmail: 'caner.aydin@company.com',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_5.id,
        status: ResultStatus.PASSED,
        executionMs: 1450,
        executedBy: 'Caner Aydın',
        testerEmail: 'caner.aydin@company.com',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_6.id,
        status: ResultStatus.PASSED,
        executionMs: 910,
        executedBy: 'Caner Aydın',
        testerEmail: 'caner.aydin@company.com',
      },
    ],
  });

  // =========================================================================
  // 4. PROJECT 4: Yeni Nesil Mobil Uygulama (iOS & Android) (MOB)
  // =========================================================================
  console.log('📱 Creating Plan 4: Yeni Nesil Mobil Uygulama (MOB)...');
  const plan4 = await prisma.project.create({
    data: {
      name: 'Test Plan 4 - Yeni Nesil Mobil Uygulama (iOS & Android)',
      key: 'MOB',
      description:
        'Mobil test otomasyon projesine tam uyumlu: Ana Sayfa widgetları, Canlı Destek & İletişim Merkezi, Profil & Güvenlik Ayarları, Döviz/Altın Alım-Satım ve Otomatik Login test kurgusu.',
      jiraProjectKey: 'MOB',
    },
  });

  // Suites for MOB
  const s4_auth = await prisma.suite.create({
    data: { name: 'Oturum & Güvenlik Doğrulamaları', projectId: plan4.id, orderIndex: 0 },
  });
  const s4_auth_binding = await prisma.suite.create({
    data: { name: 'Beni Hatırla & Cihaz Eşleştirme (Device Binding)', projectId: plan4.id, parentId: s4_auth.id, orderIndex: 0 },
  });
  const s4_auth_otp = await prisma.suite.create({
    data: { name: 'SMS OTP & Push Onaylama Akışı', projectId: plan4.id, parentId: s4_auth.id, orderIndex: 1 },
  });
  const s4_auth_session = await prisma.suite.create({
    data: { name: 'Session Timeout & Arka Plandan Öne Alma (App Resume)', projectId: plan4.id, parentId: s4_auth.id, orderIndex: 2 },
  });

  const s4_home = await prisma.suite.create({
    data: { name: 'Ana Sayfa (Dashboard) & Navigasyon', projectId: plan4.id, orderIndex: 1 },
  });
  const s4_home_widgets = await prisma.suite.create({
    data: { name: 'Finansal Varlık Durumu & Bakiye Gizle/Göster', projectId: plan4.id, parentId: s4_home.id, orderIndex: 0 },
  });
  const s4_home_actions = await prisma.suite.create({
    data: { name: 'Hızlı İşlemler Menüsü & Sürükle-Bırak Sıralama', projectId: plan4.id, parentId: s4_home.id, orderIndex: 1 },
  });
  const s4_home_tabs = await prisma.suite.create({
    data: { name: 'Alt Navigasyon Menüsü Geçişleri (Bottom Tab Bar)', projectId: plan4.id, parentId: s4_home.id, orderIndex: 2 },
  });

  const s4_profile = await prisma.suite.create({
    data: { name: 'Profil & Ayarlar', projectId: plan4.id, orderIndex: 2 },
  });
  const s4_profile_info = await prisma.suite.create({
    data: { name: 'Kişisel Bilgiler & İletişim İzinleri Güncelleme', projectId: plan4.id, parentId: s4_profile.id, orderIndex: 0 },
  });
  const s4_profile_theme = await prisma.suite.create({
    data: { name: 'Tema Tercihi (Koyu Mod / Açık Mod / Sistem)', projectId: plan4.id, parentId: s4_profile.id, orderIndex: 1 },
  });
  const s4_profile_security = await prisma.suite.create({
    data: { name: 'Güvenlik Ayarları & Şifre Değiştirme', projectId: plan4.id, parentId: s4_profile.id, orderIndex: 2 },
  });

  const s4_support = await prisma.suite.create({
    data: { name: 'İletişim Merkezi & Canlı Destek', projectId: plan4.id, orderIndex: 3 },
  });
  const s4_support_chat = await prisma.suite.create({
    data: { name: 'AI Destekli Chatbot ile Sohbet Başlatma', projectId: plan4.id, parentId: s4_support.id, orderIndex: 0 },
  });
  const s4_support_video = await prisma.suite.create({
    data: { name: 'Görüntülü Müşteri Danışmanına Bağlanma', projectId: plan4.id, parentId: s4_support.id, orderIndex: 1 },
  });
  const s4_support_branch = await prisma.suite.create({
    data: { name: 'En Yakın Şube / ATM Harita Navigasyonu', projectId: plan4.id, parentId: s4_support.id, orderIndex: 2 },
  });

  const s4_fx = await prisma.suite.create({
    data: { name: 'Döviz, Altın & Varlık Piyasaları', projectId: plan4.id, orderIndex: 4 },
  });
  const s4_fx_rates = await prisma.suite.create({
    data: { name: 'Canlı Piyasa Kurları & Fiyat Alarmı Kurma', projectId: plan4.id, parentId: s4_fx.id, orderIndex: 0 },
  });
  const s4_fx_trade = await prisma.suite.create({
    data: { name: 'Anlık Döviz / Altın Alış - Satış İşlemleri', projectId: plan4.id, parentId: s4_fx.id, orderIndex: 1 },
  });

  // Test Cases for MOB
  const tc4_1 = await prisma.testCase.create({
    data: {
      code: 'MOB-TC-01',
      title: 'Müşteri Numarası ve Şifre ile Başarılı Oturum Açma (Login)',
      description: 'Kullanıcının geçerli kimlik bilgileri ile giriş yapması, cihaz anahtarının kaydedilmesi ve Dashboard ekranına geçişi.\nTags: @mobile @auth @login @smoke @p1',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.BLOCKER,
      precondition: 'Mobil uygulama temiz kurulum yapılmış veya çıkış yapılmış olmalıdır.',
      projectId: plan4.id,
      suiteId: s4_auth.id,
      jiraStoryKey: 'MOB-101',
      jiraIssueUrl: 'https://jira.company.com/browse/MOB-101',
      steps: {
        create: [
          { stepNumber: 1, action: 'Uygulama açılır ve Giriş Yap butonuna dokunulur.', expectedResult: 'Giriş formu müşteri no / TC kimlik no alanı ile açılır.' },
          { stepNumber: 2, action: 'Müşteri No: "18492048" ve Şifre: "987654" girilir.', expectedResult: 'Giriş butonu aktifleşir.' },
          { stepNumber: 3, action: '"Giriş Yap" butonuna dokunulur.', expectedResult: 'SMS OTP ekranına veya direkt Dashboard ekranına yönlendirilir.' },
        ],
      },
    },
  });

  const tc4_2 = await prisma.testCase.create({
    data: {
      code: 'MOB-TC-02',
      title: 'SMS OTP Doğrulama Kodunun Otomatik Doldurulması (Auto-Fill)',
      description: 'iOS ve Android SMS Autofill API entegrasyonu ile gelen 6 haneli OTP kodunun forma otomatik yazılması.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.CRITICAL,
      precondition: 'Kullanıcı giriş yapmış ve SMS ekranında bekliyor olmalıdır.',
      projectId: plan4.id,
      suiteId: s4_auth_otp.id,
      jiraStoryKey: 'MOB-105',
      jiraIssueUrl: 'https://jira.company.com/browse/MOB-105',
      steps: {
        create: [
          { stepNumber: 1, action: 'Test SMS kodu "554433" cihaza iletilir.', expectedResult: 'Klavye üstünde öneri barında "554433" kodu görünür.' },
          { stepNumber: 2, action: 'Koda dokunulur.', expectedResult: '6 kutucuk anında dolar ve onay butonuna gerek kalmadan yönlendirme başlar.' },
        ],
      },
    },
  });

  const tc4_3 = await prisma.testCase.create({
    data: {
      code: 'MOB-TC-03',
      title: 'Arka Planda 3 Dakika Bekleyen Oturumun Güvenlik Kapanışı (Session Timeout)',
      description: 'Uygulama arka plana atılıp 180 saniye sonra öne alındığında PIN veya biyometrik kilit ekranı gösterilmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.CRITICAL,
      precondition: 'Uygulama açık ve kullanıcı oturumu aktif olmalıdır.',
      projectId: plan4.id,
      suiteId: s4_auth_session.id,
      jiraStoryKey: 'MOB-109',
      jiraIssueUrl: 'https://jira.company.com/browse/MOB-109',
      steps: {
        create: [
          { stepNumber: 1, action: 'Uygulama arka plana atılır ve 185 saniye beklenir.', expectedResult: 'Arka planda session timer süresi dolar.' },
          { stepNumber: 2, action: 'Uygulama tekrar öne getirilir.', expectedResult: '"Oturumunuz zaman aşımına uğradı" kilidi açılır, hassas veri gizlenir.' },
        ],
      },
    },
  });

  const tc4_4 = await prisma.testCase.create({
    data: {
      code: 'MOB-TC-04',
      title: 'Ana Sayfa Finansal Varlık Durumu ve Bakiye Gizle/Göster Butonu',
      description: 'Göz ikonuna tıklandığında tüm hesap bakiyelerinin "•••••• TL" olarak maskelenmesi ve tekrar tıklandığında açılması.\nTags: @dashboard @tg01_home @p2',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Kullanıcı Ana Sayfa Dashboard ekranında olmalıdır.',
      projectId: plan4.id,
      suiteId: s4_home_widgets.id,
      jiraStoryKey: 'MOB-201',
      jiraIssueUrl: 'https://jira.company.com/browse/MOB-201',
      steps: {
        create: [
          { stepNumber: 1, action: 'Ana sayfa bakiye kartındaki göz ikonuna dokunulur.', expectedResult: 'Varlık tutarı maskelenir: "•••••• TL".' },
          { stepNumber: 2, action: 'Uygulama kapatılıp tekrar açılır.', expectedResult: 'Gizlilik tercihi yerel storage üzerinde saklanır (Hala maskeli kalır).' },
          { stepNumber: 3, action: 'Göz ikonuna tekrar dokunulur.', expectedResult: 'Gerçek bakiye tutarı yeniden görüntülenir.' },
        ],
      },
    },
  });

  const tc4_5 = await prisma.testCase.create({
    data: {
      code: 'MOB-TC-05',
      title: 'Hızlı İşlemler Menüsünü Sürükle-Bırak ile Kişiselleştirme',
      description: 'Kullanıcının ana sayfadaki hızlı işlem butonlarını (FAST, Fatura, QR) sürükleyerek sırasını değiştirmesi.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Ana Sayfada hızlı işlemler düzenleme moduna girilmiş olmalıdır.',
      projectId: plan4.id,
      suiteId: s4_home_actions.id,
      jiraStoryKey: 'MOB-205',
      jiraIssueUrl: 'https://jira.company.com/browse/MOB-205',
      steps: {
        create: [
          { stepNumber: 1, action: '"Hızlı İşlemleri Düzenle" butonuna basılır.', expectedResult: 'İkonlar üzerinde sürükleme tutamaçları belirir.' },
          { stepNumber: 2, action: '"QR ile Para Çek" ikonu en başa sürüklenir ve Kaydet denir.', expectedResult: 'Ana sayfa ilk butonunun QR olduğu doğrulanır.' },
        ],
      },
    },
  });

  const tc4_6 = await prisma.testCase.create({
    data: {
      code: 'MOB-TC-06',
      title: 'Kişisel İletişim İzinleri (SMS, E-Posta, Arama) Güncelleme ve KVKK Onayı',
      description: 'Profil ayarlarından pazarlama ve bildirim izinlerinin açılıp kapatılması ve API ile senkronize edilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Profil & Ayarlar ekranına girilmiş olmalıdır.',
      projectId: plan4.id,
      suiteId: s4_profile_info.id,
      jiraStoryKey: 'MOB-301',
      jiraIssueUrl: 'https://jira.company.com/browse/MOB-301',
      steps: {
        create: [
          { stepNumber: 1, action: 'Profil > İletişim Tercihleri menüsü açılır.', expectedResult: 'Mevcut izin switchleri yüklenir.' },
          { stepNumber: 2, action: 'E-Posta izni kapatılır, SMS izni açık bırakılır ve Kaydet butonuna basılır.', expectedResult: '"İletişim tercihleriniz güncellendi" bildirimi gösterilir.' },
        ],
      },
    },
  });

  const tc4_7 = await prisma.testCase.create({
    data: {
      code: 'MOB-TC-07',
      title: 'Karanlık Mod (Dark Mode) / Aydınlık Mod Dinamik Tema Değişimi',
      description: 'Uygulama içinde tema değiştirildiğinde yeniden başlatmaya gerek kalmadan tüm renk tokenlarının anında güncellenmesi.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Uygulama açık olmalıdır.',
      projectId: plan4.id,
      suiteId: s4_profile_theme.id,
      jiraStoryKey: 'MOB-305',
      jiraIssueUrl: 'https://jira.company.com/browse/MOB-305',
      steps: {
        create: [
          { stepNumber: 1, action: 'Ayarlar > Görünüm menüsünden "Koyu Tema" seçilir.', expectedResult: 'Arka plan koyu slate rengine, metinler beyaza döner.' },
          { stepNumber: 2, action: 'Ana sayfaya dönülür.', expectedResult: 'Kartların ve grafiklerin koyu mod renk paletine uyarlandığı doğrulanır.' },
        ],
      },
    },
  });

  const tc4_8 = await prisma.testCase.create({
    data: {
      code: 'MOB-TC-08',
      title: 'AI Chatbot ile Canlı Destek Başlatma ve Otomatik Menü Yönlendirmesi',
      description: 'Kullanıcı "Kredi kartı limitimi nasıl artırırım?" yazdığında Chatbotun doğrudan limit artırım ekranı derin bağlantısını (Deep link) sunması.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.CRITICAL,
      precondition: 'İletişim Merkezi > Canlı Destek ekranına girilmelidir.',
      projectId: plan4.id,
      suiteId: s4_support_chat.id,
      jiraStoryKey: 'MOB-401',
      jiraIssueUrl: 'https://jira.company.com/browse/MOB-401',
      steps: {
        create: [
          { stepNumber: 1, action: 'Mesaj alanına "Kredi kartı limitimi artırmak istiyorum" yazılıp gönderilir.', expectedResult: 'Yapay zeka asistanı 1.2 sn içinde yanıt verir.' },
          { stepNumber: 2, action: 'Mesaj altındaki "Limit Güncelleme Ekranına Git" butonuna dokunulur.', expectedResult: 'Uygulama doğrudan Kart Limit Güncelleme sayfasına geçer.' },
        ],
      },
    },
  });

  const tc4_9 = await prisma.testCase.create({
    data: {
      code: 'MOB-TC-09',
      title: 'GPS Konumu ile En Yakın Şube ve ATM Haritası Arama',
      description: 'Harita üzerinde kullanıcının mevcut konumuna en yakın 5 ATM ve Şubenin mesafe, durum ve yol tarifi ile listelenmesi.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Cihaz konum izinleri verilmiş olmalıdır.',
      projectId: plan4.id,
      suiteId: s4_support_branch.id,
      jiraStoryKey: 'MOB-410',
      jiraIssueUrl: 'https://jira.company.com/browse/MOB-410',
      steps: {
        create: [
          { stepNumber: 1, action: 'İletişim Merkezi > Şube & ATM Bulucu açılır.', expectedResult: 'Harita açılır ve kullanıcının mavi konum pini gösterilir.' },
          { stepNumber: 2, action: 'En yakın ATM pinine dokunulur.', expectedResult: '"Levent Şube ATM - 350m (Para Yatırma Aktif)" bilgi kartı açılır.' },
        ],
      },
    },
  });

  const tc4_10 = await prisma.testCase.create({
    data: {
      code: 'MOB-TC-10',
      title: 'Anlık Piyasa Kuru ile 500 USD Döviz Alış İşlemi ve Bakiye Güncellemesi',
      description: 'Vadesiz TL hesabından Vadesiz USD hesabına anlık kur ile döviz transferi yapılması.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.CRITICAL,
      precondition: 'Kullanıcının hem TL hem de USD vadesiz hesabı olmalı, TL bakiyesi yeterli olmalıdır.',
      projectId: plan4.id,
      suiteId: s4_fx_trade.id,
      jiraStoryKey: 'MOB-501',
      jiraIssueUrl: 'https://jira.company.com/browse/MOB-501',
      steps: {
        create: [
          { stepNumber: 1, action: 'Döviz / Altın > Döviz Al menüsüne girilir.', expectedResult: 'USD/TRY güncel kur ve alış fiyatı (örn: 34.25 TL) görüntülenir.' },
          { stepNumber: 2, action: 'Alınacak Tutar: "500 USD" yazılır.', expectedResult: 'Hesaptan düşecek tutar: "17.125,00 TL" ve 30 saniyelik kur kilitleme sayacı başlar.' },
          { stepNumber: 3, action: '"Onayla" butonuna basılır.', expectedResult: 'İşlem tamamlanır, USD hesabı bakiyesi +500.00 USD artar.' },
        ],
      },
    },
  });

  // Test Runs for MOB
  const run4_1 = await prisma.testRun.create({
    data: {
      title: 'Appium / WebdriverIO Mobile Automation Run #482',
      version: 'v4.1.0-beta.2',
      environment: 'STAGING',
      status: RunStatus.COMPLETED,
      executedBy: 'Emre Demir (Mobile Automation Lead)',
      testerEmail: 'emre.demir@company.com',
      projectId: plan4.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run4_1.id,
        testCaseId: tc4_1.id,
        status: ResultStatus.PASSED,
        executionMs: 3120,
        executedBy: 'Emre Demir',
        testerEmail: 'emre.demir@company.com',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Mobile Login Başarılı', 'Customer: 18492048 -> Dashboard OK', [
          'Appium session initialized: iPhone 15 Pro (iOS 17.4)',
          'POST /session/:id/element {"using": "accessibility id", "value": "login_btn"}',
          'Dashboard loaded in 1.4s with all balance widgets',
        ]),
      },
      {
        testRunId: run4_1.id,
        testCaseId: tc4_2.id,
        status: ResultStatus.PASSED,
        executionMs: 2400,
        executedBy: 'Emre Demir',
        testerEmail: 'emre.demir@company.com',
      },
      {
        testRunId: run4_1.id,
        testCaseId: tc4_3.id,
        status: ResultStatus.PASSED,
        executionMs: 4100,
        executedBy: 'Emre Demir',
        testerEmail: 'emre.demir@company.com',
      },
      {
        testRunId: run4_1.id,
        testCaseId: tc4_4.id,
        status: ResultStatus.PASSED,
        executionMs: 1100,
        executedBy: 'Emre Demir',
        testerEmail: 'emre.demir@company.com',
      },
      {
        testRunId: run4_1.id,
        testCaseId: tc4_5.id,
        status: ResultStatus.PASSED,
        executionMs: 2900,
        executedBy: 'Emre Demir',
        testerEmail: 'emre.demir@company.com',
      },
      {
        testRunId: run4_1.id,
        testCaseId: tc4_6.id,
        status: ResultStatus.PASSED,
        executionMs: 1540,
        executedBy: 'Emre Demir',
        testerEmail: 'emre.demir@company.com',
      },
      {
        testRunId: run4_1.id,
        testCaseId: tc4_7.id,
        status: ResultStatus.PASSED,
        executionMs: 1250,
        executedBy: 'Emre Demir',
        testerEmail: 'emre.demir@company.com',
      },
      {
        testRunId: run4_1.id,
        testCaseId: tc4_8.id,
        status: ResultStatus.PASSED,
        executionMs: 3800,
        executedBy: 'Emre Demir',
        testerEmail: 'emre.demir@company.com',
      },
      {
        testRunId: run4_1.id,
        testCaseId: tc4_9.id,
        status: ResultStatus.PASSED,
        executionMs: 2100,
        executedBy: 'Emre Demir',
        testerEmail: 'emre.demir@company.com',
      },
      {
        testRunId: run4_1.id,
        testCaseId: tc4_10.id,
        status: ResultStatus.PASSED,
        executionMs: 4200,
        executedBy: 'Emre Demir',
        testerEmail: 'emre.demir@company.com',
        screenshotUrl: createEvidenceScreenshot('PASSED', '500 USD Alış İşlemi', 'Kur: 34.25 TRY/USD | Toplam: 17.125,00 TL', [
          'POST /api/v1/fx/exchange {"pair": "USDTRY", "amount": 500, "side": "BUY"}',
          'Response: 200 OK | Transaction Ref: FX-2026-884920',
          'Old USD Balance: 1,200.00 -> New USD Balance: 1,700.00',
        ]),
      },
    ],
  });

  const run4_2 = await prisma.testRun.create({
    data: {
      title: 'Android Pixel 8 Device Farm Regression Run',
      version: 'v4.1.0-beta.2',
      environment: 'DEV',
      status: RunStatus.IN_PROGRESS,
      executedBy: 'Emre Demir',
      testerEmail: 'emre.demir@company.com',
      projectId: plan4.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run4_2.id,
        testCaseId: tc4_1.id,
        status: ResultStatus.PASSED,
        executionMs: 3400,
        executedBy: 'Emre Demir',
        testerEmail: 'emre.demir@company.com',
      },
      {
        testRunId: run4_2.id,
        testCaseId: tc4_2.id,
        status: ResultStatus.FAILED,
        executionMs: 6200,
        errorMessage: 'Android SMS Retriever API permission rejected or SMS format mismatch.',
        executedBy: 'Emre Demir',
        testerEmail: 'emre.demir@company.com',
        jiraBugKey: 'MOB-BUG-88',
        jiraBugUrl: 'https://jira.company.com/browse/MOB-BUG-88',
        screenshotUrl: createEvidenceScreenshot('FAILED', 'SMS Autofill Hatası', 'Android 14 SMS Retriever Başarısız', [
          'Error: Timeout waiting for SmsRetrieverClient broadcast event',
          'Expected: 6 digits autofilled into #otp_input_0..5',
          'Actual: OTP form remained empty after 6000ms',
        ]),
      },
    ],
  });

  // =========================================================================
  // 5. PROJECT 5: Sigorta & Hasar Yönetim Platformu (INS)
  // =========================================================================
  console.log('🛡️ Creating Plan 5: Sigorta & Hasar Yönetim Platformu (INS)...');
  const plan5 = await prisma.project.create({
    data: {
      name: 'Test Plan 5 - Sigorta & Hasar Yönetim Platformu',
      key: 'INS',
      description:
        'Kasko, Trafik ve DASK sigortası dijital teklif alma, poliçeleştirme, hasar dosyası açma, kaza fotoğrafı yükleme ve eksper atama uçtan uca test süreçleri.',
      jiraProjectKey: 'INS',
    },
  });

  // Suites
  const s5_quote = await prisma.suite.create({
    data: { name: 'Teklif Alma & Fiyat Hesaplama Motoru', projectId: plan5.id, orderIndex: 0 },
  });
  const s5_quote_kasko = await prisma.suite.create({
    data: { name: 'Kasko & Trafik Sigortası Teklifleri', projectId: plan5.id, parentId: s5_quote.id, orderIndex: 0 },
  });
  const s5_quote_dask = await prisma.suite.create({
    data: { name: 'DASK & Konut Sigortası Prim Hesaplama', projectId: plan5.id, parentId: s5_quote.id, orderIndex: 1 },
  });

  const s5_policy = await prisma.suite.create({
    data: { name: 'Poliçeleştirme & Dijital Onay', projectId: plan5.id, orderIndex: 1 },
  });
  const s5_claim = await prisma.suite.create({
    data: { name: 'Hasar Dosyası & Bildirim Süreci', projectId: plan5.id, orderIndex: 2 },
  });
  const s5_claim_upload = await prisma.suite.create({
    data: { name: 'Kaza Fotoğrafları & Kaza Tespit Tutanağı Yükleme', projectId: plan5.id, parentId: s5_claim.id, orderIndex: 0 },
  });
  const s5_claim_adjuster = await prisma.suite.create({
    data: { name: 'Eksper Atama & Dosya Durum Takibi', projectId: plan5.id, parentId: s5_claim.id, orderIndex: 1 },
  });

  // Test Cases for Plan 5
  const tc5_1 = await prisma.testCase.create({
    data: {
      code: 'INS-TC-01',
      title: 'Plaka ve Ruhsat Seri No ile Anlık Kasko Teklifi Üretme',
      description: 'TRAMER servisi üzerinden hasarsızlık indirimi sorgulanıp 3 farklı sigorta şirketinden karşılaştırmalı teklif getirilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'TRAMER entegrasyon servisi aktif olmalıdır.',
      projectId: plan5.id,
      suiteId: s5_quote_kasko.id,
      jiraStoryKey: 'INS-101',
      jiraIssueUrl: 'https://jira.company.com/browse/INS-101',
      steps: {
        create: [
          { stepNumber: 1, action: 'Plaka: "34TCMS2026" ve TC Kimlik No girilir.', expectedResult: 'Araç marka, model ve kasko değeri otomatik gelir.' },
          { stepNumber: 2, action: '"Teklifleri Karşılaştır" butonuna basılır.', expectedResult: '30 saniye içinde en az 3 şirketin teklif ve teminat detayları listelenir.' },
        ],
      },
    },
  });

  const tc5_2 = await prisma.testCase.create({
    data: {
      code: 'INS-TC-02',
      title: 'UAVT Adres Kodu ile DASK Sigortası Prim Hesaplama',
      description: 'Ulusal Adres Veritabanı (UAVT) kodu girilerek bina katı, yapım yılı ve brüt metrekareye göre standart DASK priminin hesaplanması.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.NORMAL,
      precondition: 'Geçerli 10 haneli UAVT adres kodu olmalıdır.',
      projectId: plan5.id,
      suiteId: s5_quote_dask.id,
      jiraStoryKey: 'INS-105',
      jiraIssueUrl: 'https://jira.company.com/browse/INS-105',
      steps: {
        create: [
          { stepNumber: 1, action: 'UAVT kodu "1928374650" girilir.', expectedResult: 'Açık adres ve bina özellikleri otomatik doldurulur.' },
          { stepNumber: 2, action: 'Hesapla butonuna basılır.', expectedResult: 'DASK resmi tarifesi üzerinden yıllık prim tutarı görüntülenir.' },
        ],
      },
    },
  });

  const tc5_3 = await prisma.testCase.create({
    data: {
      code: 'INS-TC-03',
      title: 'Mobil Kameradan Kaza Fotoğrafları ve Tutanak OCR Okuması',
      description: 'Hasar bildiriminde çekilen kaza fotoğraflarının ve tutanak görüntüsünün AI OCR ile okunarak form alanlarına aktarılması.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.CRITICAL,
      precondition: 'Kullanıcının aktif kasko poliçesi bulunmalıdır.',
      projectId: plan5.id,
      suiteId: s5_claim_upload.id,
      jiraStoryKey: 'INS-201',
      jiraIssueUrl: 'https://jira.company.com/browse/INS-201',
      steps: {
        create: [
          { stepNumber: 1, action: 'Hasar Bildirimi > Fotoğraf Yükle seçilir.', expectedResult: 'Kamera önizlemesi açılır.' },
          { stepNumber: 2, action: 'Kaza tutanağı fotoğrafı çekilir.', expectedResult: 'OCR motoru karşı taraf plakasını ve sürücü bilgilerini form alanlarına doldurur.' },
        ],
      },
    },
  });

  const tc5_4 = await prisma.testCase.create({
    data: {
      code: 'INS-TC-04',
      title: 'Açılan Hasar Dosyasına Otomatik Bağımsız Eksper Atanması',
      description: 'Hasar kaydı oluştuktan sonra coğrafi konuma en yakın bağımsız sigorta eksperinin sisteme atanması ve SMS bildirimi gönderilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.NORMAL,
      precondition: 'Hasar dosyası "İncelemede" statüsünde olmalıdır.',
      projectId: plan5.id,
      suiteId: s5_claim_adjuster.id,
      jiraStoryKey: 'INS-208',
      jiraIssueUrl: 'https://jira.company.com/browse/INS-208',
      steps: {
        create: [
          { stepNumber: 1, action: 'Hasar dosyası onaylanır.', expectedResult: 'Eksper atama algoritması çalışır.' },
          { stepNumber: 2, action: 'Dosya detayında atanan eksperin adı, telefonu ve randevu tarihi doğrulanır.', expectedResult: 'Eksper detayları eksiksiz görüntülenir.' },
        ],
      },
    },
  });

  // Test Run for Plan 5
  const run5_1 = await prisma.testRun.create({
    data: {
      title: 'Sigorta Portal Sprint 18 UAT & E2E Validation',
      version: 'v1.5.0',
      environment: 'UAT',
      status: RunStatus.COMPLETED,
      executedBy: 'Zeynep Aksoy (Insurance QA)',
      testerEmail: 'zeynep.aksoy@company.com',
      projectId: plan5.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run5_1.id,
        testCaseId: tc5_1.id,
        status: ResultStatus.PASSED,
        executionMs: 2800,
        executedBy: 'Zeynep Aksoy',
        testerEmail: 'zeynep.aksoy@company.com',
      },
      {
        testRunId: run5_1.id,
        testCaseId: tc5_2.id,
        status: ResultStatus.PASSED,
        executionMs: 1400,
        executedBy: 'Zeynep Aksoy',
        testerEmail: 'zeynep.aksoy@company.com',
      },
      {
        testRunId: run5_1.id,
        testCaseId: tc5_3.id,
        status: ResultStatus.PASSED,
        executionMs: 3900,
        executedBy: 'Zeynep Aksoy',
        testerEmail: 'zeynep.aksoy@company.com',
      },
      {
        testRunId: run5_1.id,
        testCaseId: tc5_4.id,
        status: ResultStatus.PASSED,
        executionMs: 1150,
        executedBy: 'Zeynep Aksoy',
        testerEmail: 'zeynep.aksoy@company.com',
      },
    ],
  });

  // =========================================================================
  // 6. PROJECT 6: Core Banking & Mikroservis Performans Testleri (CORE)
  // =========================================================================
  console.log('⚡ Creating Plan 6: Core Banking & Mikroservis Performans Testleri (CORE)...');
  const plan6 = await prisma.project.create({
    data: {
      name: 'Test Plan 6 - Core Banking & Mikroservis Performans Testleri',
      key: 'CORE',
      description:
        'Kafka event streaming, 10.000 TPS yük testleri, günsonu (EOD) muhasebe batchleri, AML/MASAK yaptırım tarama motoru ve yüksek erişilebilirlik (HA) testleri.',
      jiraProjectKey: 'CORE',
    },
  });

  // Suites
  const s6_kafka = await prisma.suite.create({
    data: { name: 'Kafka Event Streaming & Kuyruk Yönetimi', projectId: plan6.id, orderIndex: 0 },
  });
  const s6_kafka_pub = await prisma.suite.create({
    data: { name: 'Transaction Event Publishing & Consumer Lag Takibi', projectId: plan6.id, parentId: s6_kafka.id, orderIndex: 0 },
  });

  const s6_eod = await prisma.suite.create({
    data: { name: 'Batch & Günsonu (EOD) Kapanış Motoru', projectId: plan6.id, orderIndex: 1 },
  });
  const s6_eod_interest = await prisma.suite.create({
    data: { name: 'Faiz Tahakkuk & Hesaplama Batch İşlemi', projectId: plan6.id, parentId: s6_eod.id, orderIndex: 0 },
  });

  const s6_aml = await prisma.suite.create({
    data: { name: 'AML & Kara Para Aklama Filtreleme', projectId: plan6.id, orderIndex: 2 },
  });
  const s6_aml_ofac = await prisma.suite.create({
    data: { name: 'Yaptırım Listesi (OFAC / PEP) Taraması', projectId: plan6.id, parentId: s6_aml.id, orderIndex: 0 },
  });

  const s6_perf = await prisma.suite.create({
    data: { name: 'Performans & Yük Testleri (Stress & Spike)', projectId: plan6.id, orderIndex: 3 },
  });
  const s6_perf_tps = await prisma.suite.create({
    data: { name: '10.000 TPS Anlık Transfer Yük Testi', projectId: plan6.id, parentId: s6_perf.id, orderIndex: 0 },
  });

  // Test Cases for Plan 6
  const tc6_1 = await prisma.testCase.create({
    data: {
      code: 'CORE-TC-01',
      title: 'Kafka Transaction Topic Consumer Lag Değerinin 50ms Altında Kalması',
      description: 'Yoğun para transferi anında Kafka cluster partition consumer gecikmesinin SLA sınırını aşmaması.',
      executionType: 'AUTOMATED',
      type: TestType.PERFORMANCE,
      priority: Priority.CRITICAL,
      precondition: 'Kafka cluster 3 broker ve 12 partition ile aktif olmalıdır.',
      projectId: plan6.id,
      suiteId: s6_kafka_pub.id,
      jiraStoryKey: 'CORE-101',
      jiraIssueUrl: 'https://jira.company.com/browse/CORE-101',
      steps: {
        create: [
          { stepNumber: 1, action: 'Saniyede 5.000 transaction eventi "tx-transfers-v1" topicine basılır.', expectedResult: 'Consumer lag metrikleri Prometheus ile izlenir.' },
          { stepNumber: 2, action: 'Maksimum lag süresi kontrol edilir.', expectedResult: 'Consumer lag < 42ms olarak ölçülür, mesaj kaybı 0 olur.' },
        ],
      },
    },
  });

  const tc6_2 = await prisma.testCase.create({
    data: {
      code: 'CORE-TC-02',
      title: 'Gece 00:00 Günsonu (EOD) Faiz Tahakkuk Batchinin 15 Dakikada Tamamlanması',
      description: '5 Milyon vadeli hesap için günlük net faiz tahakkuk hesaplamasının paralel workerlar ile hatasız bitirilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.BLOCKER,
      precondition: 'Gün sonu veritabanı kilitleri ve snapshot hazır olmalıdır.',
      projectId: plan6.id,
      suiteId: s6_eod_interest.id,
      jiraStoryKey: 'CORE-201',
      jiraIssueUrl: 'https://jira.company.com/browse/CORE-201',
      steps: {
        create: [
          { stepNumber: 1, action: 'EOD Spring Batch jobu tetiklenir.', expectedResult: 'Chunk size: 2000, 32 thread paralel işlem başlar.' },
          { stepNumber: 2, action: 'Job bitiş süresi ve muhasebe fişleri doğrulanır.', expectedResult: 'Batch 11 dakika 40 saniyede COMPLETED statüsü ile biter.' },
        ],
      },
    },
  });

  const tc6_3 = await prisma.testCase.create({
    data: {
      code: 'CORE-TC-03',
      title: 'OFAC & MASAK Yaptırım Listesindeki İsimlerde İşlemin Otomatik Bloke Edilmesi',
      description: 'Kara listedeki yasaklı kişi adına gelen gelen uluslararası SWIFT transferinin otomatik olarak "SUSPENDED" statüsüne alınması.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.BLOCKER,
      precondition: 'AML kural motoru ve güncel yaptırım listesi yüklenmiş olmalıdır.',
      projectId: plan6.id,
      suiteId: s6_aml_ofac.id,
      jiraStoryKey: 'CORE-301',
      jiraIssueUrl: 'https://jira.company.com/browse/CORE-301',
      steps: {
        create: [
          { stepNumber: 1, action: 'Yaptırım listesinde kayıtlı sahte bir isimle SWIFT mesajı gönderilir.', expectedResult: 'AML filtreleme motoru Fuzzy Matching ile %98 eşleşme bulur.' },
          { stepNumber: 2, action: 'Transfer statüsü ve loglar incelenir.', expectedResult: 'İşlem anında dondurulur ve Uyum Birimi ekranına bildirim düşer.' },
        ],
      },
    },
  });

  const tc6_4 = await prisma.testCase.create({
    data: {
      code: 'CORE-TC-04',
      title: '10.000 TPS Tepe Yük Altında P99 Gecikmesinin 200ms Altında Kalması (Spike Test)',
      description: 'K6 / Locust ile simüle edilen anlık 10.000 istekte hata oranının %0.01 altında ve P99 süresinin 180ms olması.',
      executionType: 'AUTOMATED',
      type: TestType.PERFORMANCE,
      priority: Priority.CRITICAL,
      precondition: 'Performans test ortamı izole ve izleme agentları aktif olmalıdır.',
      projectId: plan6.id,
      suiteId: s6_perf_tps.id,
      jiraStoryKey: 'CORE-401',
      jiraIssueUrl: 'https://jira.company.com/browse/CORE-401',
      steps: {
        create: [
          { stepNumber: 1, action: 'K6 yük testi 0 TPS den 10.000 TPS e 30 saniyede ramp-up edilir.', expectedResult: 'Kubernetes HPA pod sayısını 10 dan 50 ye otomatik scale eder.' },
          { stepNumber: 2, action: 'P95 ve P99 yanıt süreleri incelenir.', expectedResult: 'P95: 110ms, P99: 175ms, HTTP 5xx hata oranı: %0.00 olarak raporlanır.' },
        ],
      },
    },
  });

  // Test Run for Plan 6
  const run6_1 = await prisma.testRun.create({
    data: {
      title: 'Q3 Core Banking SLA & High-Availability Benchmark',
      version: 'v5.0.0-rc1',
      environment: 'PERF-ENV',
      status: RunStatus.COMPLETED,
      executedBy: 'Serdar Yılmaz (Performance Architect)',
      testerEmail: 'serdar.yilmaz@company.com',
      projectId: plan6.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run6_1.id,
        testCaseId: tc6_1.id,
        status: ResultStatus.PASSED,
        executionMs: 12000,
        executedBy: 'Serdar Yılmaz',
        testerEmail: 'serdar.yilmaz@company.com',
      },
      {
        testRunId: run6_1.id,
        testCaseId: tc6_2.id,
        status: ResultStatus.PASSED,
        executionMs: 15400,
        executedBy: 'Serdar Yılmaz',
        testerEmail: 'serdar.yilmaz@company.com',
      },
      {
        testRunId: run6_1.id,
        testCaseId: tc6_3.id,
        status: ResultStatus.PASSED,
        executionMs: 850,
        executedBy: 'Serdar Yılmaz',
        testerEmail: 'serdar.yilmaz@company.com',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'AML Bloke Doğrulandı', 'Yaptırım Listesi Uyuşması: %98.4', [
          'AML Engine Rule #4402: Target Name in OFAC SDN List',
          'Action: Transaction Suspended automatically',
          'Compliance Alert ID: AML-ALT-2026-9912 generated',
        ]),
      },
      {
        testRunId: run6_1.id,
        testCaseId: tc6_4.id,
        status: ResultStatus.PASSED,
        executionMs: 30000,
        executedBy: 'Serdar Yılmaz',
        testerEmail: 'serdar.yilmaz@company.com',
      },
    ],
  });

  console.log('✅ Successfully seeded comprehensive enterprise test data for all 6 projects!');
}
