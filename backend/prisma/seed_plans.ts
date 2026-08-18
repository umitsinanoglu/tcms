import { PrismaClient, TestType, Priority, RunStatus, ResultStatus } from '@prisma/client';

const prisma = new PrismaClient();

function createEvidenceScreenshot(
  type: 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED',
  title: string,
  subtitle: string,
  details: string[]
): string {
  const badgeBg = type === 'PASSED' ? '#10b981' : type === 'FAILED' ? '#f43f5e' : type === 'BLOCKED' ? '#a855f7' : '#64748b';
  const headerBg = type === 'PASSED' ? '#064e3b' : type === 'FAILED' ? '#881337' : type === 'BLOCKED' ? '#581c87' : '#1e293b';

  const detailLines = details
    .map(
      (d, i) =>
        `<text x="30" y="${180 + i * 24}" fill="#cbd5e1" font-family="monospace" font-size="12">${d
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</text>`
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="380" viewBox="0 0 700 380">
    <rect width="100%" height="100%" fill="#0f172a" rx="12"/>
    <rect x="0" y="0" width="700" height="42" fill="#1e293b" rx="12"/>
    <circle cx="25" cy="21" r="6" fill="#ef4444"/>
    <circle cx="45" cy="21" r="6" fill="#f59e0b"/>
    <circle cx="65" cy="21" r="6" fill="#10b981"/>
    <text x="90" y="26" fill="#94a3b8" font-family="sans-serif" font-size="12" font-weight="bold">TCMS Test Automation Execution Evidence</text>
    
    <rect x="20" y="60" width="660" height="60" fill="${headerBg}" rx="8" stroke="${badgeBg}" stroke-width="1.5"/>
    <rect x="35" y="74" width="84" height="32" fill="${badgeBg}" rx="6"/>
    <text x="77" y="95" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${type}</text>
    <text x="135" y="88" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
    <text x="135" y="108" fill="#e2e8f0" font-family="sans-serif" font-size="12">${subtitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
    
    <rect x="20" y="135" width="660" height="225" fill="#020617" rx="8" stroke="#334155" stroke-width="1"/>
    <text x="30" y="158" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold">&gt; EXECUTION LOGS &amp; STEP ASSERTIONS:</text>
    ${detailLines}
    <text x="670" y="348" fill="#64748b" font-family="monospace" font-size="10" text-anchor="end">TIMESTAMP: 2026-08-18 14:30 | TCMS AUTOMATION ENGINE</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function seedPlans() {
  console.log('🌱 Starting comprehensive data seed for Test Plan 1, 2, 3 with screenshots and notes...');

  // Delete existing conflicting projects to ensure clean idempotency
  const existingProjects = await prisma.project.findMany({
    where: {
      OR: [
        { name: { in: ['Test Plan 1', 'Test Plan 2', 'Test Plan 3', 'Test Plan 1 - Web E-Ticaret Platformu', 'Test Plan 2 - Mobil Bankacılık & Finansal İşlemler', 'Test Plan 3 - B2B API Gateway & Entegrasyon Servisleri'] } },
        { key: { in: ['1', 'A', 'P', 'TP1', 'TP2', 'TP3', 'ATOM', 'IOS'] } },
      ],
    },
  });

  for (const p of existingProjects) {
    console.log(`🧹 Removing existing project: ${p.name} (${p.key})...`);
    await prisma.project.delete({ where: { id: p.id } });
  }

  // ==========================================
  // 1. TEST PLAN 1: Web E-Ticaret Platformu
  // ==========================================
  console.log('📦 Creating Test Plan 1...');
  const plan1 = await prisma.project.create({
    data: {
      name: 'Test Plan 1 - Web E-Ticaret Platformu',
      key: 'TP1',
      description: 'E-Ticaret web portalı, kullanıcı oturum açma, ürün kataloğu & filtreleme, sepet indirimleri, 3D Secure ödeme ve sipariş takibi kapsamlı test planı.',
      jiraProjectKey: 'COMM',
    },
  });

  // Suites for Plan 1
  const s1_auth = await prisma.suite.create({
    data: {
      name: 'Giriş & Üyelik İşlemleri',
      projectId: plan1.id,
      orderIndex: 0,
    },
  });

  const s1_auth_reset = await prisma.suite.create({
    data: {
      name: 'Şifre Sıfırlama & 2FA',
      projectId: plan1.id,
      parentId: s1_auth.id,
      orderIndex: 0,
    },
  });

  const s1_catalog = await prisma.suite.create({
    data: {
      name: 'Ürün Kataloğu & Arama',
      projectId: plan1.id,
      orderIndex: 1,
    },
  });

  const s1_catalog_filter = await prisma.suite.create({
    data: {
      name: 'Filtreleme & Sıralama',
      projectId: plan1.id,
      parentId: s1_catalog.id,
      orderIndex: 0,
    },
  });

  const s1_cart = await prisma.suite.create({
    data: {
      name: 'Sepet & Kupon Yönetimi',
      projectId: plan1.id,
      orderIndex: 2,
    },
  });

  const s1_checkout = await prisma.suite.create({
    data: {
      name: 'Ödeme & Checkout Akışı',
      projectId: plan1.id,
      orderIndex: 3,
    },
  });

  const s1_checkout_card = await prisma.suite.create({
    data: {
      name: '3D Secure Kredi Kartı',
      projectId: plan1.id,
      parentId: s1_checkout.id,
      orderIndex: 0,
    },
  });

  const s1_orders = await prisma.suite.create({
    data: {
      name: 'Sipariş & İptal/İade Takibi',
      projectId: plan1.id,
      orderIndex: 4,
    },
  });

  // Test Cases for Plan 1
  const tc1_1 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-1',
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
      code: 'TP1-TC-2',
      title: 'Hatalı Şifre İle Giriş Denemesinde Güvenlik Uyarısı Kontrolü',
      description: 'Hatalı parola girildiğinde sistem genel bir hata mesajı vermeli ve brute-force koruması için sayaç artırmalıdır.',
      executionType: 'MANUAL',
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
      code: 'TP1-TC-3',
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
      code: 'TP1-TC-4',
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

  const tc1_5 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-5',
      title: 'Ürün Detay Sayfasından Sepete Ekleme ve Stok Kontrolü',
      description: 'Kullanıcı varyant (renk/beden) seçip sepete eklediğinde mini sepet sayacı anlık güncellenmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Stok adedi > 0 olan bir ürün seçilmelidir.',
      projectId: plan1.id,
      suiteId: s1_catalog.id,
      jiraStoryKey: 'COMM-215',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-215',
      steps: {
        create: [
          { stepNumber: 1, action: 'Ürün detay sayfasına gidilir ve adet "2" olarak seçilir.', expectedResult: 'Adet seçimi güncellenir.' },
          { stepNumber: 2, action: '"Sepete Ekle" butonuna basılır.', expectedResult: '"Ürün sepete eklendi" modalı açılır ve sepet ikonu üzerindeki sayı 2 artar.' },
        ],
      },
    },
  });

  const tc1_6 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-6',
      title: 'İndirim Kuponu (SUMMER2026) Uygulanması ve Sepet İndirimi Doğrulama',
      description: 'Aktif %20 indirim kuponu girildiğinde sepet ara toplamından tutar düşülmeli ve kargo bedava kuralı kontrol edilmelidir.',
      executionType: 'MANUAL',
      type: TestType.WEB,
      priority: Priority.NORMAL,
      precondition: 'Sepette toplam tutarı en az 500 TL olan ürünler bulunmalıdır.',
      projectId: plan1.id,
      suiteId: s1_cart.id,
      jiraStoryKey: 'COMM-301',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-301',
      steps: {
        create: [
          { stepNumber: 1, action: 'Sepetim sayfasına gidilir.', expectedResult: 'Eklenen ürünler ve sepet özeti listelenir.' },
          { stepNumber: 2, action: 'Kupon alanına "SUMMER2026" yazılır ve "Uygula" butonuna basılır.', expectedResult: '%20 indirim kalemi toplam tutardan düşülür ve yeşil onay mesajı gösterilir.' },
        ],
      },
    },
  });

  const tc1_7 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-7',
      title: 'Kredi Kartı ile 3D Secure Doğrulamalı Güvenli Ödeme Akışı',
      description: 'Mastercard / Visa kartlar ile 3D Secure OTP onay akışı ve başarılı sipariş tamamlama adımları test edilir.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.BLOCKER,
      precondition: 'Kullanıcı sepetinde ürün ile ödeme adımına geçmiş olmalıdır.',
      projectId: plan1.id,
      suiteId: s1_checkout_card.id,
      jiraStoryKey: 'COMM-401',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-401',
      steps: {
        create: [
          { stepNumber: 1, action: 'Kart numarası, son kullanma tarihi ve CVV girilir.', expectedResult: 'Kart tipi Mastercard olarak otomatik algılanır.' },
          { stepNumber: 2, action: '"Siparişi Onayla ve Öde" butonuna tıklanır.', expectedResult: 'Banka 3D Secure OTP iframe/pop-up ekranı açılır.' },
          { stepNumber: 3, action: 'SMS şifresi "123456" girilip onaylanır.', expectedResult: 'Ödeme onaylanır ve "Siparişiniz Alındı" ekranına yönlendirilir.' },
        ],
      },
    },
  });

  const tc1_8 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-8',
      title: 'Yetersiz Bakiye Durumunda Banka Hata Kodunun Düzgün Gösterilmesi',
      description: 'Banka POS API 51 (Yetersiz Bakiye) döndüğünde kullanıcıya açıklayıcı mesaj gösterilmelidir.',
      executionType: 'MANUAL',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Test ortamında bakiyesiz test kartı kullanılmalıdır.',
      projectId: plan1.id,
      suiteId: s1_checkout.id,
      jiraStoryKey: 'COMM-405',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-405',
      steps: {
        create: [
          { stepNumber: 1, action: 'Yetersiz bakiye simülasyon kart bilgileri girilir.', expectedResult: 'Form doldurulur.' },
          { stepNumber: 2, action: 'Ödeme butonuna basılır.', expectedResult: '"İşlem gerçekleştirilemedi: Yetersiz Bakiye (Hata Kodu: 51)" uyarısı verilir.' },
        ],
      },
    },
  });

  const tc1_9 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-9',
      title: 'Başarılı Sipariş Sonrası Sipariş Detay ve E-Fatura PDF Görüntüleme',
      description: 'Sipariş detayında kargo takip no, teslimat adresi ve e-fatura PDF indirme butonu yer almalıdır.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.NORMAL,
      precondition: 'Tamamlanmış en az 1 adet sipariş kaydı bulunmalıdır.',
      projectId: plan1.id,
      suiteId: s1_orders.id,
      jiraStoryKey: 'COMM-501',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-501',
      steps: {
        create: [
          { stepNumber: 1, action: '"Hesabım > Siparişlerim" sayfasına gidilir.', expectedResult: 'Geçmiş siparişler kronolojik olarak listelenir.' },
          { stepNumber: 2, action: 'Son siparişin "Detayları Görüntüle" butonuna tıklanır.', expectedResult: 'Kargo durumu, ürünler ve "E-Fatura İndir" butonu görünür.' },
          { stepNumber: 3, action: '"E-Fatura İndir" butonuna basılır.', expectedResult: 'Fatura PDF dosyası başarıyla indirilir.' },
        ],
      },
    },
  });

  const tc1_10 = await prisma.testCase.create({
    data: {
      code: 'TP1-TC-10',
      title: 'Kargoya Verilmemiş Siparişin İptal Talebi ve Stok İadesi',
      description: 'Henüz kargolanmamış sipariş iptal edildiğinde stok miktarları iade edilmeli ve ödeme iade süreci başlatılmalıdır.',
      executionType: 'MANUAL',
      type: TestType.WEB,
      priority: Priority.LOW,
      precondition: 'Durumu "Hazırlanıyor" olan sipariş olmalıdır.',
      projectId: plan1.id,
      suiteId: s1_orders.id,
      jiraStoryKey: 'COMM-510',
      jiraIssueUrl: 'https://jira.company.com/browse/COMM-510',
      steps: {
        create: [
          { stepNumber: 1, action: 'Sipariş detay sayfasında "Siparişi İptal Et" butonuna tıklanır.', expectedResult: 'İptal gerekçesi seçim modalı açılır.' },
          { stepNumber: 2, action: '"Vazgeçtim" seçilip onaylanır.', expectedResult: 'Sipariş durumu "İptal Edildi" olarak güncellenir ve onay e-postası gider.' },
        ],
      },
    },
  });

  // Test Runs for Plan 1
  const run1_1 = await prisma.testRun.create({
    data: {
      title: 'v2.4.0 Sürüm Öncesi Web Regresyon Koşumu',
      version: 'v2.4.0-rc3',
      environment: 'Staging',
      status: RunStatus.COMPLETED,
      executedBy: 'Ahmet Yılmaz',
      testerEmail: 'ahmet.yilmaz@tcms.dev',
      projectId: plan1.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run1_1.id,
        testCaseId: tc1_1.id,
        status: ResultStatus.PASSED,
        executionMs: 820,
        errorMessage: 'Giriş işlemi başarıyla tamamlandı. JWT token local storage üzerinde saklandı ve dashboard yüklendi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Giriş Başarılı (TP1-TC-1)', 'Oturum Token Doğrulandı & Dashboard Açıldı', [
          '✔ POST /api/v1/auth/login => 200 OK',
          '✔ Response body: { token: "eyJhbG...", user: "testuser" }',
          '✔ Redirection to /dashboard completed in 820ms',
          '✔ User profile avatar rendered successfully',
        ]),
        executedBy: 'Ahmet Yılmaz',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_2.id,
        status: ResultStatus.PASSED,
        executionMs: 540,
        errorMessage: 'Hatalı şifre girişi sonrasında kırmızı uyarı bannerı ve kilitlenme sayacı başarıyla doğrulandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Hata Uyarısı Kontrolü (TP1-TC-2)', 'Kullanıcı Bildirim Bannerı Doğrulandı', [
          '✔ POST /api/v1/auth/login => 401 Unauthorized',
          '✔ Alert message: "E-posta veya şifre hatalı"',
          '✔ Failed attempt counter incremented: attempt 1/5',
        ]),
        executedBy: 'Ahmet Yılmaz',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_3.id,
        status: ResultStatus.PASSED,
        executionMs: 1200,
        errorMessage: 'Mail sunucusuna SMTP isteği başarıyla iletildi ve tek kullanımlık sıfırlama linki oluşturuldu.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Şifre Sıfırlama Maili (TP1-TC-3)', 'SMTP 250 OK & Reset Token Üretildi', [
          '✔ POST /api/v1/auth/forgot-password => 200 OK',
          '✔ Mail queued in Redis (Job ID: mail_job_881)',
          '✔ Reset URL: https://shop.company.com/reset?token=a8f9c...',
        ]),
        executedBy: 'Ahmet Yılmaz',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_4.id,
        status: ResultStatus.PASSED,
        executionMs: 950,
        errorMessage: 'Filtreleme kriterleri uygulandı, sayfalama ve fiyat aralığı doğru çalıştı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Katalog Filtreleme (TP1-TC-4)', 'Apple & 30k-70k TL Ürünleri Listelendi', [
          '✔ GET /api/v1/products?brand=Apple&min=30000&max=70000 => 200 OK',
          '✔ Returned items count: 14',
          '✔ Price range validation: MIN=32.999 TL, MAX=68.999 TL',
        ]),
        executedBy: 'Ahmet Yılmaz',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_5.id,
        status: ResultStatus.PASSED,
        executionMs: 640,
        errorMessage: 'Sepete ekleme animasyonu ve stok rezervasyonu senkron olarak tamamlandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Sepete Ekleme (TP1-TC-5)', 'Stok Rezervasyonu & Mini Sepet Güncellendi', [
          '✔ POST /api/v1/cart/items => 200 OK',
          '✔ Cart badge counter: 2',
          '✔ Reserved stock lock duration: 15 minutes',
        ]),
        executedBy: 'Ahmet Yılmaz',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_6.id,
        status: ResultStatus.PASSED,
        executionMs: 780,
        errorMessage: 'SUMMER2026 kuponu ile %20 sepet indirimi başarıyla hesaplandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Kupon İndirimi (TP1-TC-6)', '%20 İndirim Uygulandı', [
          '✔ POST /api/v1/coupons/apply => 200 OK',
          '✔ Subtotal: 10.000 TL, Discount: -2.000 TL, Total: 8.000 TL',
          '✔ Free shipping rule activated',
        ]),
        executedBy: 'Ahmet Yılmaz',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_7.id,
        status: ResultStatus.PASSED,
        executionMs: 2100,
        errorMessage: '3D Secure SMS OTP doğrulama ekranı sorunsuz tamamlandı ve sipariş kaydı oluştu.',
        screenshotUrl: createEvidenceScreenshot('PASSED', '3D Secure Ödeme (TP1-TC-7)', 'Banka OTP Onayı Alındı & Sipariş #89123', [
          '✔ Bank 3D Secure Webhook Callback => 200 OK',
          '✔ Transaction ID: TXN_99214710',
          '✔ Order created: COMM-ORD-89123',
        ]),
        executedBy: 'Ahmet Yılmaz',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_8.id,
        status: ResultStatus.FAILED,
        executionMs: 450,
        errorMessage: 'Kritik Hata: Banka POS API 51 (Yetersiz Bakiye) döndüğünde beklenen kullanıcı dostu uyarı yerine HTTP 500 Unhandled Exception sayfası gösterildi.',
        screenshotUrl: createEvidenceScreenshot('FAILED', 'Yetersiz Bakiye Hatası (TP1-TC-8)', 'HTTP 500 Unhandled Exception & POS 51', [
          '✖ POST /api/v1/checkout/pay => HTTP 500 Internal Server Error',
          '✖ Error: POS Gateway returned code 51 (Insufficient Funds)',
          '✖ Expected: Banner "Kartınızda yeterli bakiye bulunmamaktadır"',
          '✖ Actual: Uncaught GatewayException at CheckoutController.ts:89',
        ]),
        jiraBugKey: 'COMM-BUG-142',
        jiraBugUrl: 'https://jira.company.com/browse/COMM-BUG-142',
        executedBy: 'Ahmet Yılmaz',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_9.id,
        status: ResultStatus.PASSED,
        executionMs: 1100,
        errorMessage: 'Fatura PDF render motoru UBL-TR formatında faturayı oluşturdu ve indirme linki sağlandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'E-Fatura PDF İndirme (TP1-TC-9)', 'PDF 1.4 UBL-TR Belgesi Doğrulandı', [
          '✔ GET /api/v1/invoices/COMM-ORD-89123/pdf => 200 OK',
          '✔ Content-Type: application/pdf (142 KB)',
          '✔ Invoice QR code & digital signature present',
        ]),
        executedBy: 'Ahmet Yılmaz',
      },
      {
        testRunId: run1_1.id,
        testCaseId: tc1_10.id,
        status: ResultStatus.SKIPPED,
        executionMs: 0,
        errorMessage: 'Kargo entegrasyonu bakım çalışmasında olduğu için bu vaka sonraki koşuya ertelendi.',
        screenshotUrl: createEvidenceScreenshot('SKIPPED', 'Sipariş İptal (TP1-TC-10)', 'Kargo Entegrasyon Bakımı Nedeniyle Atlandı', [
          '⚠ Cargo API Mock Gateway is under maintenance',
          '⚠ Test case skipped for v2.4.0-rc3 run',
        ]),
        executedBy: 'Ahmet Yılmaz',
      },
    ],
  });

  const run1_2 = await prisma.testRun.create({
    data: {
      title: 'Sprint 34 Canlıya Çıkış Smoke Test',
      version: 'v2.4.0',
      environment: 'Production',
      status: RunStatus.COMPLETED,
      executedBy: 'Zeynep Kaya',
      testerEmail: 'zeynep.kaya@tcms.dev',
      projectId: plan1.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run1_2.id,
        testCaseId: tc1_1.id,
        status: ResultStatus.PASSED,
        executionMs: 430,
        errorMessage: 'Production smoke testi başarılı. Login latency 430ms.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Canlı Giriş Doğrulama (TP1-TC-1)', 'Production Smoke Test PASSED', [
          '✔ Live environment ping: 12ms',
          '✔ JWT Authentication OK',
          '✔ CDN assets loaded from Cloudflare',
        ]),
        executedBy: 'Zeynep Kaya',
      },
      {
        testRunId: run1_2.id,
        testCaseId: tc1_5.id,
        status: ResultStatus.PASSED,
        executionMs: 510,
        errorMessage: 'Canlı ortamda sepete ekleme ve sepet tutarı doğrulaması tamamlandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Canlı Sepet Kontrolü (TP1-TC-5)', 'Sepete Ekleme & Fiyat Eşleşmesi OK', [
          '✔ Product SKU-1092 added to cart',
          '✔ VAT calculation: 20% verified',
        ]),
        executedBy: 'Zeynep Kaya',
      },
      {
        testRunId: run1_2.id,
        testCaseId: tc1_7.id,
        status: ResultStatus.PASSED,
        executionMs: 1850,
        errorMessage: 'Canlı BKM / Banka sanal pos testi 1 TL test siparişi ile başarıyla sonuçlandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Canlı Ödeme Akışı (TP1-TC-7)', 'Banka 3D Secure Doğrulandı', [
          '✔ 3D Secure SMS verified in Live Bank POS',
          '✔ Test Order #PROD-10901 created',
        ]),
        executedBy: 'Zeynep Kaya',
      },
      {
        testRunId: run1_2.id,
        testCaseId: tc1_9.id,
        status: ResultStatus.PASSED,
        executionMs: 890,
        errorMessage: 'Canlı sipariş faturası oluşturuldu ve görüntülendi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Canlı Fatura Görüntüleme (TP1-TC-9)', 'GİB Onaylı E-Fatura Doğrulandı', [
          '✔ E-Fatura UUID generated: 7b89...1102',
          '✔ Invoice PDF download OK',
        ]),
        executedBy: 'Zeynep Kaya',
      },
    ],
  });

  const run1_3 = await prisma.testRun.create({
    data: {
      title: 'Ödeme Entegrasyonları Doğrulama Koşumu',
      version: 'v2.4.1-patch',
      environment: 'QA-Test-01',
      status: RunStatus.IN_PROGRESS,
      executedBy: 'Caner Erkin',
      testerEmail: 'caner.erkin@tcms.dev',
      projectId: plan1.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run1_3.id,
        testCaseId: tc1_7.id,
        status: ResultStatus.PASSED,
        executionMs: 1950,
        errorMessage: 'Yeni POS entegrasyonu 3D Secure akışı başarıyla test edildi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Yeni POS 3D Secure (TP1-TC-7)', 'QA-Test-01 Ödeme Geçidi PASSED', [
          '✔ Mock POS v2.4.1 connected',
          '✔ 3D Secure response status: SUCCESS',
        ]),
        executedBy: 'Caner Erkin',
      },
      {
        testRunId: run1_3.id,
        testCaseId: tc1_8.id,
        status: ResultStatus.PASSED,
        executionMs: 620,
        errorMessage: 'COMM-BUG-142 için uygulanan hotfix doğrulandı: POS 51 hatasında artık kullanıcıya açıklayıcı uyarı gösteriliyor.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Yetersiz Bakiye Hotfix Doğrulama (TP1-TC-8)', 'COMM-BUG-142 Hotfix Başarıyla Doğrulandı', [
          '✔ POS 51 Insufficient Funds error intercepted cleanly',
          '✔ User friendly alert displayed: "Yetersiz Bakiye"',
          '✔ No 500 error logged',
        ]),
        executedBy: 'Caner Erkin',
      },
    ],
  });

  // ==========================================
  // 2. TEST PLAN 2: Mobil Bankacılık & Finans
  // ==========================================
  console.log('📱 Creating Test Plan 2...');
  const plan2 = await prisma.project.create({
    data: {
      name: 'Test Plan 2 - Mobil Bankacılık & Finansal İşlemler',
      key: 'TP2',
      description: 'iOS ve Android mobil bankacılık uygulaması, FaceID biyometrik oturum, FAST/EFT para transferleri, döviz alış/satış ve kredi kartı güvenlik ayarları test planı.',
      jiraProjectKey: 'BANK',
    },
  });

  // Suites for Plan 2
  const s2_bio = await prisma.suite.create({
    data: {
      name: 'Biyometrik Kimlik Doğrulama & Giriş',
      projectId: plan2.id,
      orderIndex: 0,
    },
  });

  const s2_accounts = await prisma.suite.create({
    data: {
      name: 'Hesaplar & Varlık Özeti',
      projectId: plan2.id,
      orderIndex: 1,
    },
  });

  const s2_accounts_pdf = await prisma.suite.create({
    data: {
      name: 'Hesap Hareketleri & Dekont',
      projectId: plan2.id,
      parentId: s2_accounts.id,
      orderIndex: 0,
    },
  });

  const s2_transfer = await prisma.suite.create({
    data: {
      name: 'FAST & Para Transferleri',
      projectId: plan2.id,
      orderIndex: 2,
    },
  });

  const s2_transfer_qr = await prisma.suite.create({
    data: {
      name: 'Karekod (QR) ile Hızlı Transfer',
      projectId: plan2.id,
      parentId: s2_transfer.id,
      orderIndex: 0,
    },
  });

  const s2_fx = await prisma.suite.create({
    data: {
      name: 'Döviz & Kıymetli Maden İşlemleri',
      projectId: plan2.id,
      orderIndex: 3,
    },
  });

  const s2_fx_calc = await prisma.suite.create({
    data: {
      name: 'Döviz Çevirici & Canlı Kurlar',
      projectId: plan2.id,
      parentId: s2_fx.id,
      orderIndex: 0,
    },
  });

  const s2_cards = await prisma.suite.create({
    data: {
      name: 'Kart Yönetimi & Güvenlik Ayarları',
      projectId: plan2.id,
      orderIndex: 4,
    },
  });

  // Test Cases for Plan 2
  const tc2_1 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-1',
      title: 'FaceID / TouchID Biyometrik Kimlik Doğrulama ile Hızlı Giriş',
      description: 'iOS cihazda kayıtlı FaceID ile şifre girmeden 1 saniyenin altında ana ekrana geçiş test edilir.\nTags: @mobile @ios @biometric @p1',
      executionType: 'AUTOMATED',
      type: TestType.IOS,
      priority: Priority.CRITICAL,
      precondition: 'Cihazda FaceID aktif ve uygulamaya izin verilmiş olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_bio.id,
      jiraStoryKey: 'BANK-101',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-101',
      steps: {
        create: [
          { stepNumber: 1, action: 'Uygulama açılır.', expectedResult: 'Biyometrik okuyucu ekranı gelir.' },
          { stepNumber: 2, action: 'FaceID doğrulaması başarılı simüle edilir.', expectedResult: 'Kullanıcı ana varlık dashboard ekranına aktarılır.' },
        ],
      },
    },
  });

  const tc2_2 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-2',
      title: 'Vadesiz TL Hesabından Başka Banka IBAN\'ına 7/24 FAST Transferi',
      description: '20.000 TL altındaki transferlerin FAST protokolü ile anında karşı hesaba iletildiği ve dekont üretildiği test edilir.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.BLOCKER,
      precondition: 'Gönderici hesabında en az transfer tutarı kadar bakiye bulunmalıdır.',
      projectId: plan2.id,
      suiteId: s2_transfer.id,
      jiraStoryKey: 'BANK-201',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-201',
      steps: {
        create: [
          { stepNumber: 1, action: '"Para Transferleri > FAST / IBAN\'a Transfer" menüsüne girilir.', expectedResult: 'Alıcı IBAN ve tutar giriş ekranı açılır.' },
          { stepNumber: 2, action: 'Alıcı IBAN: TR980006200000000123456789 ve Tutar: "2500 TL" girilir.', expectedResult: 'Alıcı ad-soyad maskeli olarak otomatik getirilir.' },
          { stepNumber: 3, action: '"Onayla" butonuna basılır.', expectedResult: 'FAST referans numarası ile "Transferiniz başarıyla gerçekleşti" ekranı gösterilir.' },
        ],
      },
    },
  });

  const tc2_3 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-3',
      title: 'Rehberden Telefon Numarası Seçilerek Kolay Adres Para Transferi',
      description: 'Kullanıcı rehberinden seçilen cep telefonuna tanımlı Kolay Adres (KOLAS) sorgulanıp para gönderilmelidir.',
      executionType: 'MANUAL',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Alıcının telefon numarası TCMB Kolay Adres sistemine kayıtlı olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_transfer.id,
      jiraStoryKey: 'BANK-205',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-205',
      steps: {
        create: [
          { stepNumber: 1, action: '"Kolay Adres ile Gönder" seçilir ve rehberden kişi seçilir.', expectedResult: 'KOLAS sorgulanır ve alıcı banka/IBAN doğrulanır.' },
          { stepNumber: 2, action: 'Tutar girilip transfer onaylanır.', expectedResult: 'Transfer başarıyla tamamlanır.' },
        ],
      },
    },
  });

  const tc2_4 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-4',
      title: 'ATM Ekranındaki Karekod (QR) Okutularak Kartsız Para Çekme',
      description: 'Kamera izni ile ATM QR kodu taranıp fiziksel kartsız nakit çekim talebi oluşturulmalıdır.',
      executionType: 'MANUAL',
      type: TestType.ANDROID,
      priority: Priority.CRITICAL,
      precondition: 'Uygulamanın kamera erişim izni açık olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_transfer_qr.id,
      jiraStoryKey: 'BANK-220',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-220',
      steps: {
        create: [
          { stepNumber: 1, action: '"QR ile Para Çek" butonuna basılır ve kamera açılır.', expectedResult: 'Kamera tarayıcı çerçevesi görüntülenir.' },
          { stepNumber: 2, action: 'ATM ekranındaki dinamik QR kod okutulur.', expectedResult: 'ATM ile eşleşme sağlanır ve para çekme onay ekranı gelir.' },
          { stepNumber: 3, action: 'Hesap seçilip 1.000 TL çekim onaylanır.', expectedResult: 'ATM parayı verir ve bildirim düşer.' },
        ],
      },
    },
  });

  const tc2_5 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-5',
      title: 'Döviz İşlemleri: Canlı Kur ile EUR Alış ve EUR Vadesiz Hesaba Yatırma',
      description: 'Banka canlı döviz kuru üzerinden 1.000 EUR alış işlemi ve bakiye güncellemeleri test edilir.',
      executionType: 'AUTOMATED',
      type: TestType.IOS,
      priority: Priority.CRITICAL,
      precondition: 'Kullanıcının tanımlı Vadesiz TL ve Vadesiz EUR hesabı bulunmalıdır.',
      projectId: plan2.id,
      suiteId: s2_fx.id,
      jiraStoryKey: 'BANK-301',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-301',
      steps: {
        create: [
          { stepNumber: 1, action: '"Yatırımlar > Döviz İşlemleri > Döviz Alış" menüsüne girilir.', expectedResult: 'EUR/TL canlı satış kuru ve hesap seçimi gelir.' },
          { stepNumber: 2, action: 'Satılacak Tutar alanına "1000 EUR" yazılır.', expectedResult: 'Çekilecek TL tutarı kur ile anlık çarpılarak gösterilir.' },
          { stepNumber: 3, action: '"Onayla" butonuna basılır.', expectedResult: '"Döviz alış işleminiz başarıyla gerçekleşmiştir" mesajı verilir.' },
        ],
      },
    },
  });

  const tc2_6 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-6',
      title: 'Döviz İşlemleri: USD Satış ve TL Hesabına Aktarım',
      description: 'Vadesiz USD hesabından döviz bozdurma ve kur hesaplamasının doğruluğu kontrol edilir.',
      executionType: 'AUTOMATED',
      type: TestType.IOS,
      priority: Priority.CRITICAL,
      precondition: 'USD hesabında en az 100 USD bulunmalıdır.',
      projectId: plan2.id,
      suiteId: s2_fx.id,
      jiraStoryKey: 'BANK-302',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-302',
      steps: {
        create: [
          { stepNumber: 1, action: '"Döviz Satış" ekranı açılır ve USD seçilir.', expectedResult: 'Banka alış kuru ekranda görüntülenir.' },
          { stepNumber: 2, action: 'Bozdurulacak tutara "100" yazılır.', expectedResult: 'Hesaba geçecek net TL tutarı hesaplanır.' },
          { stepNumber: 3, action: 'İşlem onaylanır.', expectedResult: 'USD bakiyesi 100 azalır, TL bakiyesi artar.' },
        ],
      },
    },
  });

  const tc2_7 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-7',
      title: 'Döviz Çevirici Aracında Dinamik Tutar ve Komisyon Hesaplama Kontrolü',
      description: 'Kullanıcı tutar girdiğinde çift yönlü döviz çeviricinin anlık kuru alıp doğru hesapladığı doğrulanır.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Uygulama internete bağlı olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_fx_calc.id,
      jiraStoryKey: 'BANK-305',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-305',
      steps: {
        create: [
          { stepNumber: 1, action: 'Döviz Çevirici ekranı açılır.', expectedResult: 'Çevirici formu görüntülenir.' },
          { stepNumber: 2, action: 'Tutar alanına "50000" yazılır ve Switch butonuna basılır.', expectedResult: 'TL/USD ve USD/TL değerleri anında tersine dönüp doğru hesaplanır.' },
        ],
      },
    },
  });

  const tc2_8 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-8',
      title: 'Kredi Kartı İnternet / Yurt Dışı Alışveriş Yetkisinin Anlık Güncellenmesi',
      description: 'Kredi kartı ayarlarında internet alışverişi toggle butonu kapatıldığında anında banka ana sistemine yansımalıdır.',
      executionType: 'MANUAL',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Kullanıcının aktif kredi kartı olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_cards.id,
      jiraStoryKey: 'BANK-401',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-401',
      steps: {
        create: [
          { stepNumber: 1, action: '"Kartlarım > Güvenlik Ayarları" menüsüne gidilir.', expectedResult: 'İnternet ve Yurt Dışı yetki switchleri listelenir.' },
          { stepNumber: 2, action: '"İnternet Alışveriş Yetkisi" kapatılır.', expectedResult: '"Kartınız internet alışverişlerine kapatılmıştır" pop-up uyarısı verilir.' },
        ],
      },
    },
  });

  const tc2_9 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-9',
      title: 'Geçmiş Dönem Hesap Özeti PDF Dekont İndirme ve Paylaşım Menüsü',
      description: 'Hesap hareketlerinden seçilen işlemin imzalı e-dekont PDF oluşturma ve iOS share sheet paylaşımı.',
      executionType: 'MANUAL',
      type: TestType.IOS,
      priority: Priority.LOW,
      precondition: 'Hesapta en az bir adet geçmiş işlem olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_accounts_pdf.id,
      jiraStoryKey: 'BANK-501',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-501',
      steps: {
        create: [
          { stepNumber: 1, action: 'Hesap hareketleri listesinde son transfere tıklanır.', expectedResult: 'İşlem detay kartı açılır.' },
          { stepNumber: 2, action: '"Dekont Paylaş" butonuna basılır.', expectedResult: 'Banka mühürlü PDF oluşturulur ve iOS sistem paylaşım penceresi açılır.' },
        ],
      },
    },
  });

  const tc2_10 = await prisma.testCase.create({
    data: {
      code: 'TP2-TC-10',
      title: 'Günlük EFT / FAST Limit Aşımında Uyarı ve Geçici Limit Artırımı',
      description: 'Günlük 50.000 TL üzeri transfer denemesinde limit aşım uyarısı verilmeli ve ek güvenlik adımı önerilmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Kullanıcının günlük FAST limiti 50.000 TL olarak tanımlanmış olmalıdır.',
      projectId: plan2.id,
      suiteId: s2_transfer.id,
      jiraStoryKey: 'BANK-212',
      jiraIssueUrl: 'https://jira.company.com/browse/BANK-212',
      steps: {
        create: [
          { stepNumber: 1, action: 'Transfer tutarı "75000 TL" girilir.', expectedResult: 'Form doldurulur.' },
          { stepNumber: 2, action: '"Devam" butonuna basılır.', expectedResult: '"Günlük FAST işlem limitiniz (50.000 TL) aşılmıştır. Devam etmek için limitinizi güncelleyin." uyarısı gösterilir.' },
        ],
      },
    },
  });

  // Test Runs for Plan 2
  const run2_1 = await prisma.testRun.create({
    data: {
      title: 'iOS v5.2.0 Release Adayı Kapsamlı Koşum',
      version: 'v5.2.0 (Build 302)',
      environment: 'iOS TestFlight / iPhone 15 Pro',
      status: RunStatus.COMPLETED,
      executedBy: 'Büşra Aydın',
      testerEmail: 'busra.aydin@tcms.dev',
      projectId: plan2.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run2_1.id,
        testCaseId: tc2_1.id,
        status: ResultStatus.PASSED,
        executionMs: 310,
        errorMessage: 'LocalAuthentication FaceID mock doğrulaması 310ms içinde başarıyla sonuçlandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'FaceID ile Giriş (TP2-TC-1)', 'iOS LocalAuthentication PASSED', [
          '✔ LAContext evaluatePolicy:deviceOwnerAuthenticationWithBiometrics => TRUE',
          '✔ Keychain token retrieved in 45ms',
          '✔ Dashboard rendered with balance summary',
        ]),
        executedBy: 'Büşra Aydın',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_2.id,
        status: ResultStatus.PASSED,
        executionMs: 1420,
        errorMessage: 'TCMB FAST entegrasyonu 2500 TL transferini 1.4 saniyede onayladı ve FAST referans no alındı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'FAST Para Transferi (TP2-TC-2)', 'TCMB FAST 200 OK & Dekont Üretildi', [
          '✔ POST /api/v1/transfers/fast => 200 OK',
          '✔ FAST Ref No: FAST-20260818-881921',
          '✔ Balance updated: -2.500,00 TL',
        ]),
        executedBy: 'Büşra Aydın',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_3.id,
        status: ResultStatus.PASSED,
        executionMs: 980,
        errorMessage: 'KOLAS servisi telefon numarasını başarıyla eşleştirdi ve alıcı banka teyit edildi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Kolay Adres Transferi (TP2-TC-3)', 'KOLAS Telefon Sorgusu Başarılı', [
          '✔ KOLAS Query for 0532******* => TR440001...',
          '✔ Receiver mask: A*** Y****** verified',
          '✔ Transfer executed successfully',
        ]),
        executedBy: 'Büşra Aydın',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_4.id,
        status: ResultStatus.BLOCKED,
        executionMs: 100,
        errorMessage: 'Engellenme: Test ortamındaki Mock ATM QR gateway sunucusu 504 Gateway Timeout verdi. Fiziksel donanım simülatörü yanıt vermiyor.',
        screenshotUrl: createEvidenceScreenshot('BLOCKED', 'ATM QR Kod Para Çekme (TP2-TC-4)', 'Mock ATM Gateway Timeout (504)', [
          '✖ POST /api/v1/atm/qr-session => HTTP 504 Gateway Timeout',
          '✖ Reason: Mock ATM Terminal Hub unreachable on 10.200.4.15:8080',
          '✖ Issue logged in Jira: BANK-BUG-89',
        ]),
        jiraBugKey: 'BANK-BUG-89',
        jiraBugUrl: 'https://jira.company.com/browse/BANK-BUG-89',
        executedBy: 'Büşra Aydın',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_5.id,
        status: ResultStatus.PASSED,
        executionMs: 1250,
        errorMessage: '1.000 EUR döviz alış işlemi canlı kur üzerinden başarıyla gerçekleştirildi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Döviz Alış EUR (TP2-TC-5)', '1.000 EUR Alış & Bakiye Güncellendi', [
          '✔ Live FX Rate: 1 EUR = 38.45 TL',
          '✔ Sold: 38.450,00 TL, Bought: 1.000,00 EUR',
          '✔ Portfolio balance refreshed',
        ]),
        executedBy: 'Büşra Aydın',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_6.id,
        status: ResultStatus.PASSED,
        executionMs: 1100,
        errorMessage: '100 USD satış ve TL vadesiz hesaba aktarım adımı doğrulandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Döviz Satış USD (TP2-TC-6)', '100 USD Satış Onaylandı', [
          '✔ Live FX Rate: 1 USD = 35.10 TL',
          '✔ Sold: 100,00 USD, Credited: 3.510,00 TL',
          '✔ Transaction status: COMPLETED',
        ]),
        executedBy: 'Büşra Aydın',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_7.id,
        status: ResultStatus.PASSED,
        executionMs: 450,
        errorMessage: 'Döviz çevirici çift yönlü kur değişimini ve komisyonsuz tutarı doğru hesapladı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Döviz Çevirici (TP2-TC-7)', '50.000 TL Kur Dönüşümü Doğrulandı', [
          '✔ 50.000 TL = 1.300,39 EUR (@38.45)',
          '✔ Switch calculation verified',
        ]),
        executedBy: 'Büşra Aydın',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_8.id,
        status: ResultStatus.PASSED,
        executionMs: 820,
        errorMessage: 'İnternet alışveriş yetkisi kapatıldı, anında banka kart otorizasyon servisine iletildi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Kart Güvenlik Ayarları (TP2-TC-8)', 'E-Ticaret Yetkisi Kapatıldı', [
          '✔ PATCH /api/v1/cards/4543.../permissions => 200 OK',
          '✔ eCommerceEnabled: FALSE',
          '✔ Confirmation push notification sent',
        ]),
        executedBy: 'Büşra Aydın',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_9.id,
        status: ResultStatus.PASSED,
        executionMs: 600,
        errorMessage: 'Dekont PDF oluşturuldu ve iOS UIActivityViewController paylaşıma açıldı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Dekont PDF İndirme (TP2-TC-9)', 'İmzalı Banka Dekontu Üretildi', [
          '✔ PDF Generated: DEKONT_2026_08_18.pdf',
          '✔ Digital signature verified',
        ]),
        executedBy: 'Büşra Aydın',
      },
      {
        testRunId: run2_1.id,
        testCaseId: tc2_10.id,
        status: ResultStatus.PASSED,
        executionMs: 490,
        errorMessage: '75.000 TL transfer talebinde 50.000 TL limit aşım modalı ve geçici limit artırma linki başarıyla gösterildi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Limit Aşım Uyarısı (TP2-TC-10)', 'FAST 50.000 TL Limit Uyarısı Verildi', [
          '✔ Limit Check: Requested=75.000, Max=50.000',
          '✔ Alert popup displayed correctly',
        ]),
        executedBy: 'Büşra Aydın',
      },
    ],
  });

  const run2_2 = await prisma.testRun.create({
    data: {
      title: 'Android 14 Uyumluluk & Biyometrik Koşumu',
      version: 'v5.2.0 (Build 302)',
      environment: 'Android Pixel 8 / Android 14',
      status: RunStatus.COMPLETED,
      executedBy: 'Selim Çelik',
      testerEmail: 'selim.celik@tcms.dev',
      projectId: plan2.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run2_2.id,
        testCaseId: tc2_2.id,
        status: ResultStatus.PASSED,
        executionMs: 1350,
        errorMessage: 'Android 14 üzerinde FAST transferi sorunsuz tamamlandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Android FAST Transfer (TP2-TC-2)', 'Pixel 8 / Android 14 PASSED', [
          '✔ Android BiometricPrompt OK',
          '✔ FAST payment confirmed',
        ]),
        executedBy: 'Selim Çelik',
      },
      {
        testRunId: run2_2.id,
        testCaseId: tc2_4.id,
        status: ResultStatus.PASSED,
        executionMs: 2100,
        errorMessage: 'CameraX kütüphanesi ile QR okuma ve mock ATM para çekme tamamlandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'CameraX QR Okuma (TP2-TC-4)', 'Android QR Scanner OK', [
          '✔ QR Barcode scanned in 120ms',
          '✔ Cash withdraw confirmed: 1.000 TL',
        ]),
        executedBy: 'Selim Çelik',
      },
      {
        testRunId: run2_2.id,
        testCaseId: tc2_7.id,
        status: ResultStatus.PASSED,
        executionMs: 410,
        errorMessage: 'Döviz çevirici Android widget ve sayfa görünümü doğrulandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Android Döviz Çevirici (TP2-TC-7)', 'Android UI Responsive Test PASSED', [
          '✔ Material 3 form fields verified',
        ]),
        executedBy: 'Selim Çelik',
      },
      {
        testRunId: run2_2.id,
        testCaseId: tc2_10.id,
        status: ResultStatus.PASSED,
        executionMs: 530,
        errorMessage: 'Limit aşım uyarısı Android dialog bileşeni ile gösterildi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Android Limit Dialog (TP2-TC-10)', 'Material AlertDialog Rendered', [
          '✔ Daily limit exceeded dialog verified',
        ]),
        executedBy: 'Selim Çelik',
      },
    ],
  });

  const run2_3 = await prisma.testRun.create({
    data: {
      title: 'FAST 7/24 20.000 TL Limit Doğrulama Koşumu',
      version: 'v5.2.1-rc1',
      environment: 'Staging-Bank-Core',
      status: RunStatus.IN_PROGRESS,
      executedBy: 'Gizem Arslan',
      testerEmail: 'gizem.arslan@tcms.dev',
      projectId: plan2.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run2_3.id,
        testCaseId: tc2_2.id,
        status: ResultStatus.PASSED,
        executionMs: 1200,
        errorMessage: 'FAST 20.000 TL üst limit transfer testi başarıyla onaylandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'FAST 20k Limit Testi (TP2-TC-2)', '20.000 TL FAST Başarılı', [
          '✔ Amount: 20.000,00 TL processed without splitting',
        ]),
        executedBy: 'Gizem Arslan',
      },
      {
        testRunId: run2_3.id,
        testCaseId: tc2_10.id,
        status: ResultStatus.PASSED,
        executionMs: 510,
        errorMessage: '20.001 TL ve üzeri taleplerin EFT saat kontrolüne yönlendirildiği doğrulandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'FAST Limit Sınırı Kontrolü (TP2-TC-10)', '20.001 TL EFT Yönlendirmesi OK', [
          '✔ Routing rule: >20k TL => Standard EFT Protocol',
        ]),
        executedBy: 'Gizem Arslan',
      },
    ],
  });

  // ==========================================
  // 3. TEST PLAN 3: B2B API Gateway & Servisler
  // ==========================================
  console.log('⚡ Creating Test Plan 3...');
  const plan3 = await prisma.project.create({
    data: {
      name: 'Test Plan 3 - B2B API Gateway & Entegrasyon Servisleri',
      key: 'TP3',
      description: 'Mikroservis mimarisi, OAuth2.0 Token yönetimi, Rate Limiting, B2B sipariş/stok entegrasyonu, Webhook event dispatching ve yük/performans test planı.',
      jiraProjectKey: 'GATEWAY',
    },
  });

  // Suites for Plan 3
  const s3_oauth = await prisma.suite.create({
    data: {
      name: 'OAuth2.0 Kimlik Doğrulama & Rate Limiting',
      projectId: plan3.id,
      orderIndex: 0,
    },
  });

  const s3_oauth_jwt = await prisma.suite.create({
    data: {
      name: 'Token Refresh & JWT İmza Doğrulama',
      projectId: plan3.id,
      parentId: s3_oauth.id,
      orderIndex: 0,
    },
  });

  const s3_bulk = await prisma.suite.create({
    data: {
      name: 'B2B Sipariş & Toplu İşlem API\'leri',
      projectId: plan3.id,
      orderIndex: 1,
    },
  });

  const s3_bulk_batch = await prisma.suite.create({
    data: {
      name: 'Bulk Order Import (/api/v2/orders/bulk)',
      projectId: plan3.id,
      parentId: s3_bulk.id,
      orderIndex: 0,
    },
  });

  const s3_stock = await prisma.suite.create({
    data: {
      name: 'Stok & Fiyat Senkronizasyon Servisi',
      projectId: plan3.id,
      orderIndex: 2,
    },
  });

  const s3_stock_hook = await prisma.suite.create({
    data: {
      name: 'Webhook Event Dispatching & Retry Mekanizması',
      projectId: plan3.id,
      parentId: s3_stock.id,
      orderIndex: 0,
    },
  });

  const s3_invoice = await prisma.suite.create({
    data: {
      name: 'E-Fatura & GİB Entegrasyon API\'leri',
      projectId: plan3.id,
      orderIndex: 3,
    },
  });

  const s3_perf = await prisma.suite.create({
    data: {
      name: 'Yük & Performans (k6 / Stress Benchmark)',
      projectId: plan3.id,
      orderIndex: 4,
    },
  });

  // Test Cases for Plan 3
  const tc3_1 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-1',
      title: 'Client Credentials ile OAuth2 Access Token Alma (POST /oauth/token)',
      description: 'Geçerli client_id ve client_secret ile 3600 saniyelik JWT Access Token üretildiği doğrulanır.\nTags: @api @oauth2 @security @p1',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.BLOCKER,
      precondition: 'Client credentials veritabanında aktif olmalıdır.',
      projectId: plan3.id,
      suiteId: s3_oauth.id,
      jiraStoryKey: 'GATEWAY-101',
      jiraIssueUrl: 'https://jira.company.com/browse/GATEWAY-101',
      steps: {
        create: [
          { stepNumber: 1, action: 'POST https://api.gateway.company/oauth/token isteği atılır. Body: grant_type=client_credentials, client_id, client_secret.', expectedResult: 'HTTP 200 OK yanıtı döner.' },
          { stepNumber: 2, action: 'Yanıt gövdesindeki access_token, token_type ve expires_in alanları kontrol edilir.', expectedResult: 'Token_type="Bearer" ve expires_in=3600 olarak doğrulanır.' },
        ],
      },
    },
  });

  const tc3_2 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-2',
      title: 'Süresi Dolan Access Token ile İstek Yapıldığında HTTP 401 Unauthorized Dönmesi',
      description: 'Süresi dolmuş veya geçersiz imzalı JWT gönderildiğinde isteğin reddedildiği ve "Token Expired" mesajı döndüğü doğrulanır.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.CRITICAL,
      precondition: 'Expired timestamp içeren test token oluşturulmalıdır.',
      projectId: plan3.id,
      suiteId: s3_oauth_jwt.id,
      jiraStoryKey: 'GATEWAY-102',
      jiraIssueUrl: 'https://jira.company.com/browse/GATEWAY-102',
      steps: {
        create: [
          { stepNumber: 1, action: 'GET /api/v2/protected-resource endpoint\'ine Authorization: Bearer <expired_token> başlığıyla istek atılır.', expectedResult: 'HTTP 401 Unauthorized yanıtı döner.' },
          { stepNumber: 2, action: 'JSON hata gövdesi incelenir.', expectedResult: '{"statusCode": 401, "error": "Unauthorized", "message": "jwt expired"} gövdesi doğrulanır.' },
        ],
      },
    },
  });

  const tc3_3 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-3',
      title: 'API Rate Limiting Aşımında HTTP 429 ve Retry-After Header Kontrolü',
      description: 'IP/Client başına dakikada 100 istek sınırı aşıldığında HTTP 429 Too Many Requests döndüğü test edilir.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.NORMAL,
      precondition: 'Rate limiter Redis cluster aktif olmalıdır.',
      projectId: plan3.id,
      suiteId: s3_oauth.id,
      jiraStoryKey: 'GATEWAY-105',
      jiraIssueUrl: 'https://jira.company.com/browse/GATEWAY-105',
      steps: {
        create: [
          { stepNumber: 1, action: '1 dakika içerisinde 105 adet paralel GET isteği gönderilir.', expectedResult: 'İlk 100 istek 200 OK döner.' },
          { stepNumber: 2, action: '101. ve sonraki isteklerin yanıtı incelenir.', expectedResult: 'HTTP 429 döner ve Response Header\'ında "Retry-After: 60" bilgisi yer alır.' },
        ],
      },
    },
  });

  const tc3_4 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-4',
      title: 'Toplu Sipariş Aktarımı (1000 kayıt) Batch API İsteği ve Asenkron Job Takibi',
      description: 'POST /api/v2/orders/bulk endpoint\'ine 1000 siparişlik JSON gönderildiğinde BullMQ kuyruğuna alınıp jobId dönülmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.CRITICAL,
      precondition: 'B2B ERP Entegrasyon kullanıcısı yetkilendirilmiş olmalıdır.',
      projectId: plan3.id,
      suiteId: s3_bulk_batch.id,
      jiraStoryKey: 'GATEWAY-201',
      jiraIssueUrl: 'https://jira.company.com/browse/GATEWAY-201',
      steps: {
        create: [
          { stepNumber: 1, action: 'POST /api/v2/orders/bulk payload: 1000 adet sipariş array içeren istek atılır.', expectedResult: 'HTTP 202 Accepted yanıtı ve "jobId: b2b_job_9981" döner.' },
          { stepNumber: 2, action: 'GET /api/v2/orders/bulk/status/b2b_job_9981 ile durum sorgulanır.', expectedResult: '"status: COMPLETED, processed: 1000, failed: 0" yanıtı alınır.' },
        ],
      },
    },
  });

  const tc3_5 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-5',
      title: 'Geçersiz JSON Şeması ve Eksik Parametrelerde HTTP 400 Bad Request Validasyonu',
      description: 'Zorunlu alanları (orderDate, customerTaxId) eksik olan payload gönderildiğinde class-validator detaylı hata vermelidir.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.NORMAL,
      precondition: 'Endpoint aktif olmalıdır.',
      projectId: plan3.id,
      suiteId: s3_bulk.id,
      jiraStoryKey: 'GATEWAY-205',
      jiraIssueUrl: 'https://jira.company.com/browse/GATEWAY-205',
      steps: {
        create: [
          { stepNumber: 1, action: 'Eksik parametreli POST /api/v2/orders isteği gönderilir.', expectedResult: 'HTTP 400 Bad Request döner.' },
          { stepNumber: 2, action: 'Hata dizisi incelenir.', expectedResult: '["customerTaxId must be a valid 10-digit number", "orderDate must be ISO8601"] listelenir.' },
        ],
      },
    },
  });

  const tc3_6 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-6',
      title: 'Anlık Stok Değişiminde Webhook Event Gönderimi ve HMAC SHA-256 İmzası',
      description: 'Stok azaldığında kayıtlı üçüncü parti webhook URL\'ine "X-Hub-Signature-256" başlığıyla anlık event fırlatılmalıdır.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.CRITICAL,
      precondition: 'Webhook URL kayıtlı ve secret key tanımlı olmalıdır.',
      projectId: plan3.id,
      suiteId: s3_stock_hook.id,
      jiraStoryKey: 'GATEWAY-301',
      jiraIssueUrl: 'https://jira.company.com/browse/GATEWAY-301',
      steps: {
        create: [
          { stepNumber: 1, action: 'Stok adedi 50\'den 40\'a düşürülür.', expectedResult: 'Webhook event tetiklenir.' },
          { stepNumber: 2, action: 'Alıcı webhook dinleyicisindeki header incelenir.', expectedResult: '"X-Hub-Signature-256" header\'ı ve "event: stock.updated" yükü başarıyla doğrulanır.' },
        ],
      },
    },
  });

  const tc3_7 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-7',
      title: 'Ulaşılamayan Webhook Endpoint\'ine Exponential Backoff ile 3 Kez Retry Yapılması',
      description: 'Hedef sunucu 503 veya timeout döndüğünde 1dk, 5dk, 15dk aralıklarla 3 defa yeniden denenmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.NORMAL,
      precondition: 'Simülatör endpoint 503 Service Unavailable dönecek şekilde ayarlanmalıdır.',
      projectId: plan3.id,
      suiteId: s3_stock_hook.id,
      jiraStoryKey: 'GATEWAY-305',
      jiraIssueUrl: 'https://jira.company.com/browse/GATEWAY-305',
      steps: {
        create: [
          { stepNumber: 1, action: 'Event tetiklenir ve ilk istek başarısız olur.', expectedResult: 'Retry kuyruğuna alınır.' },
          { stepNumber: 2, action: '3. retry sonrası başarısızlık durumu kontrol edilir.', expectedResult: 'Dead Letter Queue (DLQ) tablosuna kaydedilir.' },
        ],
      },
    },
  });

  const tc3_8 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-8',
      title: 'E-Fatura UBL-TR XML Şemasına Uygun Fatura Oluşturma ve GİB İletimi',
      description: 'Gelir İdaresi Başkanlığı UBL-TR 1.2.1 şemasına uygun fatura XML oluşturulup Schematron doğrulaması yapılmalıdır.',
      executionType: 'MANUAL',
      type: TestType.API,
      priority: Priority.BLOCKER,
      precondition: 'GİB Test Portalı erişimi açık olmalıdır.',
      projectId: plan3.id,
      suiteId: s3_invoice.id,
      jiraStoryKey: 'GATEWAY-401',
      jiraIssueUrl: 'https://jira.company.com/browse/GATEWAY-401',
      steps: {
        create: [
          { stepNumber: 1, action: 'POST /api/v1/invoices/generate isteği atılır.', expectedResult: 'UBL-TR uyumlu XML oluşturulur.' },
          { stepNumber: 2, action: 'Schematron doğrulama motoru çalıştırılır.', expectedResult: '0 hata ile XML onaylanır ve GİB onay no üretilir.' },
        ],
      },
    },
  });

  const tc3_9 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-9',
      title: '1.000 Eşzamanlı Kullanıcı Altında 95. Yüzdelik Yanıt Süresinin < 200ms Olması (k6 Benchmark)',
      description: 'Gateway üzerinden geçen REST endpoint\'lerinin 1000 VU yük altında p95 < 200ms ve hata oranının %0.01 altında olması doğrulanır.',
      executionType: 'AUTOMATED',
      type: TestType.PERFORMANCE,
      priority: Priority.CRITICAL,
      precondition: 'k6 test kümesi ve izleme metrikleri (Prometheus) hazır olmalıdır.',
      projectId: plan3.id,
      suiteId: s3_perf.id,
      jiraStoryKey: 'GATEWAY-501',
      jiraIssueUrl: 'https://jira.company.com/browse/GATEWAY-501',
      steps: {
        create: [
          { stepNumber: 1, action: 'k6 run --vus 1000 --duration 5m script.js komutu yürütülür.', expectedResult: 'Yük testi 5 dakika boyunca stabil koşar.' },
          { stepNumber: 2, action: 'Test raporu çıktı metrikleri incelenir.', expectedResult: 'p(95)=142ms, http_req_failed=0.00% olarak tamamlanır.' },
        ],
      },
    },
  });

  const tc3_10 = await prisma.testCase.create({
    data: {
      code: 'TP3-TC-10',
      title: 'Servis Kesintisi Durumunda Circuit Breaker\'ın Açılması ve Fallback Yanıtı',
      description: 'Alt servis arka arkaya 5 kez timeout verdiğinde Circuit Breaker OPEN durumuna geçmeli ve cache yanıtı dönmelidir.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.NORMAL,
      precondition: 'Circuit breaker eşik değeri 5 hata / 10 sn olmalıdır.',
      projectId: plan3.id,
      suiteId: s3_perf.id,
      jiraStoryKey: 'GATEWAY-510',
      jiraIssueUrl: 'https://jira.company.com/browse/GATEWAY-510',
      steps: {
        create: [
          { stepNumber: 1, action: 'Alt mikroservis durdurulur ve 5 istek peş peşe atılır.', expectedResult: 'Circuit Breaker OPEN durumuna geçer.' },
          { stepNumber: 2, action: '6. istek gönderilir.', expectedResult: 'Hızlıca HTTP 200 (Stale Cache) veya 503 Fallback döner, alt servise istek gitmez.' },
        ],
      },
    },
  });

  // Test Runs for Plan 3
  const run3_1 = await prisma.testRun.create({
    data: {
      title: 'API Gateway v3.2.0 Performans & Yük Benchmark Koşumu',
      version: 'v3.2.0',
      environment: 'Load-Test-Cluster',
      status: RunStatus.COMPLETED,
      executedBy: 'DevOps k6 Runner',
      testerEmail: 'devops-bot@tcms.dev',
      projectId: plan3.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run3_1.id,
        testCaseId: tc3_1.id,
        status: ResultStatus.PASSED,
        executionMs: 85,
        errorMessage: 'OAuth2 Token alma süresi 85ms (hedef: <150ms). RSA-256 JWT imzası doğrulandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'OAuth2 Token Benchmark (TP3-TC-1)', 'Response Time: 85ms | Token Valid', [
          '✔ POST /oauth/token => 200 OK (85ms)',
          '✔ JWT Claims: { iss: "auth.gateway", sub: "b2b_client" }',
          '✔ RSA-256 Signature verified',
        ]),
        executedBy: 'DevOps k6 Runner',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_2.id,
        status: ResultStatus.PASSED,
        executionMs: 42,
        errorMessage: 'Süresi dolmuş token reddedildi ve 401 Unauthorized yanıtı 42ms içinde döndü.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Token Expiration Test (TP3-TC-2)', 'HTTP 401 Unauthorized Doğrulandı', [
          '✔ GET /api/v2/protected => 401 Unauthorized',
          '✔ Error payload: { error: "jwt expired" }',
        ]),
        executedBy: 'DevOps k6 Runner',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_3.id,
        status: ResultStatus.PASSED,
        executionMs: 65,
        errorMessage: '100 req/min limiti aşıldığında 429 Too Many Requests ve Retry-After: 60 headerı döndü.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Rate Limiting Kontrolü (TP3-TC-3)', 'HTTP 429 & Retry-After Header OK', [
          '✔ 101st Request => HTTP 429 Too Many Requests',
          '✔ Response Header: Retry-After: 60',
        ]),
        executedBy: 'DevOps k6 Runner',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_4.id,
        status: ResultStatus.PASSED,
        executionMs: 340,
        errorMessage: '1000 siparişlik bulk import jobı 340ms içinde kuyruğa alındı ve jobId üretildi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Bulk Order Import (TP3-TC-4)', '1000 Kayıt BullMQ Kuyruğuna Alındı', [
          '✔ POST /api/v2/orders/bulk => 202 Accepted',
          '✔ Job ID: b2b_job_9981 (1000 items)',
        ]),
        executedBy: 'DevOps k6 Runner',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_5.id,
        status: ResultStatus.PASSED,
        executionMs: 38,
        errorMessage: 'DTO class-validator validasyon hataları dizi formatında 400 Bad Request ile döndü.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'JSON Validasyon Hataları (TP3-TC-5)', 'HTTP 400 Bad Request Doğrulandı', [
          '✔ POST /api/v2/orders => 400 Bad Request',
          '✔ Validation errors: [taxId invalid, orderDate missing]',
        ]),
        executedBy: 'DevOps k6 Runner',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_6.id,
        status: ResultStatus.PASSED,
        executionMs: 120,
        errorMessage: 'Stok güncellemesinde X-Hub-Signature-256 başlıklı Webhook event başarıyla fırlatıldı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Webhook HMAC İmzası (TP3-TC-6)', 'HMAC SHA-256 Signature Verified', [
          '✔ Event: stock.updated dispatched',
          '✔ Header: X-Hub-Signature-256: sha256=9f8a...',
        ]),
        executedBy: 'DevOps k6 Runner',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_7.id,
        status: ResultStatus.PASSED,
        executionMs: 190,
        errorMessage: 'Hedef sunucu 503 döndüğünde backoff ile 3 retry kuyruğa yazıldı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Webhook Retry Mekanizması (TP3-TC-7)', 'Exponential Backoff 3x Retry OK', [
          '✔ Retry queue scheduled: 1m, 5m, 15m',
        ]),
        executedBy: 'DevOps k6 Runner',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_8.id,
        status: ResultStatus.PASSED,
        executionMs: 410,
        errorMessage: 'GİB UBL-TR 1.2.1 XML Schematron doğrulaması 0 hata ile onaylandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'E-Fatura Schematron Testi (TP3-TC-8)', 'UBL-TR 1.2.1 XML Valid', [
          '✔ Schematron Engine: 0 errors, 0 warnings',
          '✔ GİB Test Portal Approval Code: GIB-2026-9901',
        ]),
        executedBy: 'DevOps k6 Runner',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_9.id,
        status: ResultStatus.PASSED,
        executionMs: 142,
        errorMessage: 'k6 1000 VU yük testi 5 dakika sürdü. p(95)=142ms (<200ms hedefi), Hata oranı: %0.00.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'k6 1000 VU Benchmark (TP3-TC-9)', 'p(95)=142ms | Error Rate: 0.00%', [
          '✔ Virtual Users: 1000 VU for 5 minutes',
          '✔ Total requests: 142.890 reqs (476 req/s)',
          '✔ http_req_duration p(95)=142.4ms, p(99)=189.1ms',
          '✔ http_req_failed: 0.00%',
        ]),
        executedBy: 'DevOps k6 Runner',
      },
      {
        testRunId: run3_1.id,
        testCaseId: tc3_10.id,
        status: ResultStatus.PASSED,
        executionMs: 25,
        errorMessage: 'Circuit breaker 5 ardışık timeout sonrası OPEN durumuna geçti ve 25ms içinde cache yanıtı döndü.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Circuit Breaker Fallback (TP3-TC-10)', 'Circuit Breaker OPEN & Fast Fallback', [
          '✔ 5 consecutive timeouts triggered Circuit Breaker OPEN',
          '✔ Fallback cache response returned in 25ms',
        ]),
        executedBy: 'DevOps k6 Runner',
      },
    ],
  });

  const run3_2 = await prisma.testRun.create({
    data: {
      title: 'B2B ERP Webhook Entegrasyon Doğrulama Koşumu',
      version: 'v3.2.0-rc2',
      environment: 'UAT-Gateway',
      status: RunStatus.COMPLETED,
      executedBy: 'Emre Yıldız',
      testerEmail: 'emre.yildiz@tcms.dev',
      projectId: plan3.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run3_2.id,
        testCaseId: tc3_1.id,
        status: ResultStatus.PASSED,
        executionMs: 95,
        errorMessage: 'UAT ortamında B2B ERP client credentials token alımı doğrulandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'UAT Token Alımı (TP3-TC-1)', 'UAT Gateway 200 OK', [
          '✔ ERP Client ID: erp_uat_client_99',
          '✔ Token expires in 3600s',
        ]),
        executedBy: 'Emre Yıldız',
      },
      {
        testRunId: run3_2.id,
        testCaseId: tc3_4.id,
        status: ResultStatus.PASSED,
        executionMs: 380,
        errorMessage: 'UAT ERP sipariş aktarımı başarıyla kuyruğa alındı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'UAT Sipariş Aktarımı (TP3-TC-4)', 'B2B Siparişler Kuyruğa Alındı', [
          '✔ Batch size: 500 items processed',
        ]),
        executedBy: 'Emre Yıldız',
      },
      {
        testRunId: run3_2.id,
        testCaseId: tc3_6.id,
        status: ResultStatus.PASSED,
        executionMs: 130,
        errorMessage: 'ERP Webhook alıcısına stok güncelleme bildirimi iletildi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'ERP Webhook Teslimi (TP3-TC-6)', 'Webhook Receiver 200 OK', [
          '✔ Webhook URL: https://erp-uat.company.com/webhook',
          '✔ Response 200 OK (130ms)',
        ]),
        executedBy: 'Emre Yıldız',
      },
      {
        testRunId: run3_2.id,
        testCaseId: tc3_7.id,
        status: ResultStatus.FAILED,
        executionMs: 2200,
        errorMessage: 'Hata: Dead Letter Queue (DLQ) Kafka topic bağlantı hatası nedeniyle 3. deneme sonrası mesaj kaydedilemedi (Broker Not Available).',
        screenshotUrl: createEvidenceScreenshot('FAILED', 'DLQ Kafka Hatası (TP3-TC-7)', 'Kafka Broker Not Available Exception', [
          '✖ Webhook 3x retry failed (503 Service Unavailable)',
          '✖ Failed to write to topic "dlq-webhook-events"',
          '✖ KafkaException: Broker: Leader not available for partition 0',
          '✖ Issue logged in Jira: GATEWAY-BUG-304',
        ]),
        jiraBugKey: 'GATEWAY-BUG-304',
        jiraBugUrl: 'https://jira.company.com/browse/GATEWAY-BUG-304',
        executedBy: 'Emre Yıldız',
      },
    ],
  });

  const run3_3 = await prisma.testRun.create({
    data: {
      title: 'OAuth2 Token Expiration & Stress Test Koşumu',
      version: 'v3.2.1',
      environment: 'Staging',
      status: RunStatus.IN_PROGRESS,
      executedBy: 'Merve Demir',
      testerEmail: 'merve.demir@tcms.dev',
      projectId: plan3.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: run3_3.id,
        testCaseId: tc3_1.id,
        status: ResultStatus.PASSED,
        executionMs: 80,
        errorMessage: 'Staging ortamında stress altında token alma süresi 80ms.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Staging Token Stress (TP3-TC-1)', 'Response Time: 80ms', [
          '✔ Token generation latency stable under 100 concurrent threads',
        ]),
        executedBy: 'Merve Demir',
      },
      {
        testRunId: run3_3.id,
        testCaseId: tc3_2.id,
        status: ResultStatus.PASSED,
        executionMs: 45,
        errorMessage: 'Süresi dolan token istekleri beklenen 401 Unauthorized ile hızla reddedildi.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Expired Token Handling (TP3-TC-2)', '401 Unauthorized Fast Rejection', [
          '✔ JWT verification middleware latency: 4ms',
        ]),
        executedBy: 'Merve Demir',
      },
      {
        testRunId: run3_3.id,
        testCaseId: tc3_3.id,
        status: ResultStatus.PASSED,
        executionMs: 60,
        errorMessage: 'Rate limiter Redis Cluster testleri başarıyla sonuçlandı.',
        screenshotUrl: createEvidenceScreenshot('PASSED', 'Redis Rate Limiter (TP3-TC-3)', 'Redis Sliding Window Throttle OK', [
          '✔ Sliding window log algorithm functioning properly',
        ]),
        executedBy: 'Merve Demir',
      },
    ],
  });

  console.log('✅ Successfully seeded rich test data for Test Plan 1, 2, and 3 with screenshots and notes!');
}

if (require.main === module) {
  seedPlans()
    .catch((e) => {
      console.error('❌ Error during seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
