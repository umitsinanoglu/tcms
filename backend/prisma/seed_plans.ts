import { PrismaClient, TestType, Priority, RunStatus, ResultStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPlans() {
  console.log('🌱 Starting comprehensive data seed for Test Plan 1, 2, 3...');

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
      { testRunId: run1_1.id, testCaseId: tc1_1.id, status: ResultStatus.PASSED, executionMs: 820, executedBy: 'Ahmet Yılmaz' },
      { testRunId: run1_1.id, testCaseId: tc1_2.id, status: ResultStatus.PASSED, executionMs: 540, executedBy: 'Ahmet Yılmaz' },
      { testRunId: run1_1.id, testCaseId: tc1_3.id, status: ResultStatus.PASSED, executionMs: 1200, executedBy: 'Ahmet Yılmaz' },
      { testRunId: run1_1.id, testCaseId: tc1_4.id, status: ResultStatus.PASSED, executionMs: 950, executedBy: 'Ahmet Yılmaz' },
      { testRunId: run1_1.id, testCaseId: tc1_5.id, status: ResultStatus.PASSED, executionMs: 640, executedBy: 'Ahmet Yılmaz' },
      { testRunId: run1_1.id, testCaseId: tc1_6.id, status: ResultStatus.PASSED, executionMs: 780, executedBy: 'Ahmet Yılmaz' },
      { testRunId: run1_1.id, testCaseId: tc1_7.id, status: ResultStatus.PASSED, executionMs: 2100, executedBy: 'Ahmet Yılmaz' },
      { testRunId: run1_1.id, testCaseId: tc1_8.id, status: ResultStatus.FAILED, executionMs: 450, errorMessage: 'Beklenen hata bannerı yerine genel HTTP 500 sayfası döndü.', jiraBugKey: 'COMM-BUG-142', jiraBugUrl: 'https://jira.company.com/browse/COMM-BUG-142', executedBy: 'Ahmet Yılmaz' },
      { testRunId: run1_1.id, testCaseId: tc1_9.id, status: ResultStatus.PASSED, executionMs: 1100, executedBy: 'Ahmet Yılmaz' },
      { testRunId: run1_1.id, testCaseId: tc1_10.id, status: ResultStatus.SKIPPED, executionMs: 0, executedBy: 'Ahmet Yılmaz' },
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
      { testRunId: run1_2.id, testCaseId: tc1_1.id, status: ResultStatus.PASSED, executionMs: 430, executedBy: 'Zeynep Kaya' },
      { testRunId: run1_2.id, testCaseId: tc1_5.id, status: ResultStatus.PASSED, executionMs: 510, executedBy: 'Zeynep Kaya' },
      { testRunId: run1_2.id, testCaseId: tc1_7.id, status: ResultStatus.PASSED, executionMs: 1850, executedBy: 'Zeynep Kaya' },
      { testRunId: run1_2.id, testCaseId: tc1_9.id, status: ResultStatus.PASSED, executionMs: 890, executedBy: 'Zeynep Kaya' },
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
      { testRunId: run1_3.id, testCaseId: tc1_7.id, status: ResultStatus.PASSED, executionMs: 1950, executedBy: 'Caner Erkin' },
      { testRunId: run1_3.id, testCaseId: tc1_8.id, status: ResultStatus.PASSED, executionMs: 620, executedBy: 'Caner Erkin' },
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
      { testRunId: run2_1.id, testCaseId: tc2_1.id, status: ResultStatus.PASSED, executionMs: 310, executedBy: 'Büşra Aydın' },
      { testRunId: run2_1.id, testCaseId: tc2_2.id, status: ResultStatus.PASSED, executionMs: 1420, executedBy: 'Büşra Aydın' },
      { testRunId: run2_1.id, testCaseId: tc2_3.id, status: ResultStatus.PASSED, executionMs: 980, executedBy: 'Büşra Aydın' },
      { testRunId: run2_1.id, testCaseId: tc2_4.id, status: ResultStatus.BLOCKED, executionMs: 100, errorMessage: 'Test ortamındaki mock ATM servisi yanıt vermiyor (Timeout 504).', jiraBugKey: 'BANK-BUG-89', jiraBugUrl: 'https://jira.company.com/browse/BANK-BUG-89', executedBy: 'Büşra Aydın' },
      { testRunId: run2_1.id, testCaseId: tc2_5.id, status: ResultStatus.PASSED, executionMs: 1250, executedBy: 'Büşra Aydın' },
      { testRunId: run2_1.id, testCaseId: tc2_6.id, status: ResultStatus.PASSED, executionMs: 1100, executedBy: 'Büşra Aydın' },
      { testRunId: run2_1.id, testCaseId: tc2_7.id, status: ResultStatus.PASSED, executionMs: 450, executedBy: 'Büşra Aydın' },
      { testRunId: run2_1.id, testCaseId: tc2_8.id, status: ResultStatus.PASSED, executionMs: 820, executedBy: 'Büşra Aydın' },
      { testRunId: run2_1.id, testCaseId: tc2_9.id, status: ResultStatus.PASSED, executionMs: 600, executedBy: 'Büşra Aydın' },
      { testRunId: run2_1.id, testCaseId: tc2_10.id, status: ResultStatus.PASSED, executionMs: 490, executedBy: 'Büşra Aydın' },
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
      { testRunId: run2_2.id, testCaseId: tc2_2.id, status: ResultStatus.PASSED, executionMs: 1350, executedBy: 'Selim Çelik' },
      { testRunId: run2_2.id, testCaseId: tc2_4.id, status: ResultStatus.PASSED, executionMs: 2100, executedBy: 'Selim Çelik' },
      { testRunId: run2_2.id, testCaseId: tc2_7.id, status: ResultStatus.PASSED, executionMs: 410, executedBy: 'Selim Çelik' },
      { testRunId: run2_2.id, testCaseId: tc2_10.id, status: ResultStatus.PASSED, executionMs: 530, executedBy: 'Selim Çelik' },
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
      { testRunId: run2_3.id, testCaseId: tc2_2.id, status: ResultStatus.PASSED, executionMs: 1200, executedBy: 'Gizem Arslan' },
      { testRunId: run2_3.id, testCaseId: tc2_10.id, status: ResultStatus.PASSED, executionMs: 510, executedBy: 'Gizem Arslan' },
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
      { testRunId: run3_1.id, testCaseId: tc3_1.id, status: ResultStatus.PASSED, executionMs: 85, executedBy: 'DevOps k6 Runner' },
      { testRunId: run3_1.id, testCaseId: tc3_2.id, status: ResultStatus.PASSED, executionMs: 42, executedBy: 'DevOps k6 Runner' },
      { testRunId: run3_1.id, testCaseId: tc3_3.id, status: ResultStatus.PASSED, executionMs: 65, executedBy: 'DevOps k6 Runner' },
      { testRunId: run3_1.id, testCaseId: tc3_4.id, status: ResultStatus.PASSED, executionMs: 340, executedBy: 'DevOps k6 Runner' },
      { testRunId: run3_1.id, testCaseId: tc3_5.id, status: ResultStatus.PASSED, executionMs: 38, executedBy: 'DevOps k6 Runner' },
      { testRunId: run3_1.id, testCaseId: tc3_6.id, status: ResultStatus.PASSED, executionMs: 120, executedBy: 'DevOps k6 Runner' },
      { testRunId: run3_1.id, testCaseId: tc3_7.id, status: ResultStatus.PASSED, executionMs: 190, executedBy: 'DevOps k6 Runner' },
      { testRunId: run3_1.id, testCaseId: tc3_8.id, status: ResultStatus.PASSED, executionMs: 410, executedBy: 'DevOps k6 Runner' },
      { testRunId: run3_1.id, testCaseId: tc3_9.id, status: ResultStatus.PASSED, executionMs: 142, executedBy: 'DevOps k6 Runner' },
      { testRunId: run3_1.id, testCaseId: tc3_10.id, status: ResultStatus.PASSED, executionMs: 25, executedBy: 'DevOps k6 Runner' },
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
      { testRunId: run3_2.id, testCaseId: tc3_1.id, status: ResultStatus.PASSED, executionMs: 95, executedBy: 'Emre Yıldız' },
      { testRunId: run3_2.id, testCaseId: tc3_4.id, status: ResultStatus.PASSED, executionMs: 380, executedBy: 'Emre Yıldız' },
      { testRunId: run3_2.id, testCaseId: tc3_6.id, status: ResultStatus.PASSED, executionMs: 130, executedBy: 'Emre Yıldız' },
      { testRunId: run3_2.id, testCaseId: tc3_7.id, status: ResultStatus.FAILED, executionMs: 2200, errorMessage: 'DLQ kuyruğuna yazılırken Kafka topic erişim hatası oluştu (Broker Not Available).', jiraBugKey: 'GATEWAY-BUG-304', jiraBugUrl: 'https://jira.company.com/browse/GATEWAY-BUG-304', executedBy: 'Emre Yıldız' },
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
      { testRunId: run3_3.id, testCaseId: tc3_1.id, status: ResultStatus.PASSED, executionMs: 80, executedBy: 'Merve Demir' },
      { testRunId: run3_3.id, testCaseId: tc3_2.id, status: ResultStatus.PASSED, executionMs: 45, executedBy: 'Merve Demir' },
      { testRunId: run3_3.id, testCaseId: tc3_3.id, status: ResultStatus.PASSED, executionMs: 60, executedBy: 'Merve Demir' },
    ],
  });

  console.log('✅ Successfully seeded rich test data for Test Plan 1, 2, and 3!');
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
