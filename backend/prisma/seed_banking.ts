import '../src/prisma/db-env';
import { PrismaClient, TestType, Priority, RunStatus, ResultStatus, PlanStatus } from '@prisma/client';
import {
  createMobileFASTTransferScreenshot,
  createCreditCardVirtualManagementScreenshot,
  create3DSecureVerificationScreenshot,
  createLoanApprovalFindeksScreenshot,
  createFXTradingMarketScreenshot,
  createATMQRCodeWithdrawalScreenshot,
  createFraudAMLAlertScreenshot,
} from './banking_mockups';

export async function seedBankingProject(prisma: PrismaClient) {
  console.log('🏦 [BANK] Seeding Enterprise Banking & Financial Services Project...');

  // 1. Proje Oluştur
  const projBank = await prisma.project.create({
    data: {
      name: 'NeoBank Dijital Bankacılık & Mobil Şube Platformu',
      key: 'BANK',
      description:
        'Bireysel ve Kurumsal Mobil Şube, TCMB FAST 7/24 Anlık Transferler, Kredi Kartı & Dinamik CVV Sanal Kart Yönetimi, Findeks Anında Kredi Tahsis, Canlı FX/Altın Alım-Satım, QR ile ATM Kartsız Para Çekme ve Siber Güvenlik / AML Sahtekarlık Önleme Motoru.',
      jiraProjectKey: 'BANK',
    },
  });

  // 2. Test Planları
  const planFastTransfer = await prisma.testPlan.create({
    data: {
      title: 'Mobil Şube v4.5 & FAST 7/24 Para Transferleri Kabul Planı',
      description:
        'TCMB FAST altyapısı üzerinden 7/24 kesintisiz para transferi, Kolay Adres (KOLAS - GSM/TCKN/E-posta) sorgulama, e-Dekont üretimi ve limit kontrol mekanizmalarının uçtan uca kabul testleri.',
      version: 'v4.5.0',
      environment: 'PRODUCTION',
      status: PlanStatus.COMPLETED,
      scope: 'TCMB FAST Gateway, KOLAS Resolver, Core Banking Ledger, PDF Dekont Motoru',
      requirements: 'BANK-101, BANK-102, BANK-108, BDDK-2024/7',
      projectId: projBank.id,
    },
  });

  const planCardSecurity = await prisma.testPlan.create({
    data: {
      title: 'Kredi Kartları, Taksitlendirme & Dinamik CVV Güvenlik Planı',
      description:
        'PCI-DSS v4.0 uyumlu dinamik CVV üretimi (60 saniye geçerli), sanal kart limit tahsisi, dönem içi harcama taksitlendirme ve 3D Secure 2.2 BKM protokol testleri.',
      version: 'v4.5.0',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'Card Management System (CMS), Dynamic CVV Generator, 3DS 2.2 Server, POS Gateway',
      requirements: 'BANK-201, BANK-205, PCI-DSS-4.0, BKM-3DS-REQ',
      projectId: projBank.id,
    },
  });

  const planLoanCredit = await prisma.testPlan.create({
    data: {
      title: 'Bireysel İhtiyaç Kredisi & Anında Findeks Skorlama Planı',
      description:
        'KKB/Findeks entegrasyonu ile anlık kredi notu sorgulama, otomatik karar ağacı (A+ skor), anında kredi tahsis ve vadesiz hesaba otomatik para transferi regresyon planı.',
      version: 'v4.6.0-RC',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'Credit Scoring Engine, KKB SOAP Client, SGK Auto-Validator, Instant Disbursement API',
      requirements: 'BANK-301, BANK-304, KKB-SCORE-API',
      projectId: projBank.id,
    },
  });

  const planFXTrading = await prisma.testPlan.create({
    data: {
      title: 'Canlı FX Döviz, Altın & TEFAS Fon İşlemleri Planı',
      description:
        'Bankalararası anlık kur beslemeleri (USD/TRY, EUR/TRY, XAU/TRY), marj hesaplama, döviz alım/satım emir iletimi ve TEFAS fon alım/satım akışları.',
      version: 'v4.5.2',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'FX Live Feeds, Treasury Gateway, Gold Trading Engine, TEFAS API',
      requirements: 'BANK-401, BANK-403, BANK-407',
      projectId: projBank.id,
    },
  });

  const planATMQR = await prisma.testPlan.create({
    data: {
      title: 'QR Kod ile Kartsız ATM İşlemleri Doğrulama Planı',
      description:
        'Mobil kamera ile ATM ekranındaki dinamik QR kodun taranması, coğrafi yakınlık doğrulaması, günlük QR limit kontrolü ve ATM para çıkışı protokolü.',
      version: 'v4.4.8',
      environment: 'PRODUCTION',
      status: PlanStatus.COMPLETED,
      scope: 'ATM Switch, QR Generator, Geolocation Validator, Core Cash Dispenser',
      requirements: 'BANK-501, BANK-504',
      projectId: projBank.id,
    },
  });

  const planFraudSecurity = await prisma.testPlan.create({
    data: {
      title: 'SOC 2 / Fraud & AML Coğrafi Anomali Güvenlik Planı',
      description:
        'Şüpheli işlem izleme, imkansız hız (Impossible Travel - ardışık farklı ülke girişleri) tespiti, otomatik hesap blokesi ve SIM kart değişikliği 2FA kontrolleri.',
      version: 'v4.5.0',
      environment: 'PRODUCTION',
      status: PlanStatus.ACTIVE,
      scope: 'Fraud Detection Engine (AI/ML), Geo-IP Resolver, SIM Swap Validator, 2FA HSM',
      requirements: 'BANK-601, BANK-608, MASAK-AML-2024',
      projectId: projBank.id,
    },
  });

  // 3. Suites ve Sub-Suites (Hierarchical)
  const sAccount = await prisma.suite.create({
    data: { name: '🏦 1. Hesap İşlemleri & Varlık Yönetimi', projectId: projBank.id, orderIndex: 0 },
  });
  const sAccountChecking = await prisma.suite.create({
    data: { name: 'Vadesiz & Vadeli TL/Döviz Hesapları', projectId: projBank.id, parentId: sAccount.id, orderIndex: 0 },
  });
  const sAccountHistory = await prisma.suite.create({
    data: { name: 'Hesap Hareketleri & e-Dekont Dışa Aktarma', projectId: projBank.id, parentId: sAccount.id, orderIndex: 1 },
  });

  const sTransfer = await prisma.suite.create({
    data: { name: '💸 2. Para Transferleri (FAST / EFT / Havale)', projectId: projBank.id, orderIndex: 1 },
  });
  const sTransferFAST = await prisma.suite.create({
    data: { name: 'FAST 7/24 Anlık Transfer & Kolay Adres (KOLAS)', projectId: projBank.id, parentId: sTransfer.id, orderIndex: 0 },
  });
  const sTransferLimits = await prisma.suite.create({
    data: { name: 'Transfer Limit & Ücretlendirme Motoru', projectId: projBank.id, parentId: sTransfer.id, orderIndex: 1 },
  });

  const sCards = await prisma.suite.create({
    data: { name: '💳 3. Kredi Kartı & Kartlı Ödemeler', projectId: projBank.id, orderIndex: 2 },
  });
  const sCardsVirtual = await prisma.suite.create({
    data: { name: 'Dinamik CVV Sanal Kart & Limit Yönetimi', projectId: projBank.id, parentId: sCards.id, orderIndex: 0 },
  });
  const sCards3DS = await prisma.suite.create({
    data: { name: '3D Secure 2.2 & Biyometrik Mobil Onay', projectId: projBank.id, parentId: sCards.id, orderIndex: 1 },
  });
  const sCardsInstallments = await prisma.suite.create({
    data: { name: 'Ekstre Taksitlendirme & Nakit Avans', projectId: projBank.id, parentId: sCards.id, orderIndex: 2 },
  });

  const sLoans = await prisma.suite.create({
    data: { name: '💰 4. Krediler & Finansman Başvurusu', projectId: projBank.id, orderIndex: 3 },
  });
  const sLoansInstant = await prisma.suite.create({
    data: { name: 'Anında İhtiyaç Kredisi & Tahsis Akışı', projectId: projBank.id, parentId: sLoans.id, orderIndex: 0 },
  });
  const sLoansFindeks = await prisma.suite.create({
    data: { name: 'Findeks Kredi Notu Entegrasyonu & Karar Motoru', projectId: projBank.id, parentId: sLoans.id, orderIndex: 1 },
  });

  const sFX = await prisma.suite.create({
    data: { name: '📈 5. Yatırım & Döviz / Altın Piyasaları', projectId: projBank.id, orderIndex: 4 },
  });
  const sFXLive = await prisma.suite.create({
    data: { name: 'Canlı FX Döviz & Altın Alım-Satım', projectId: projBank.id, parentId: sFX.id, orderIndex: 0 },
  });
  const sFXFunds = await prisma.suite.create({
    data: { name: 'TEFAS Fon Portföyü & Emir İletimi', projectId: projBank.id, parentId: sFX.id, orderIndex: 1 },
  });

  const sMobileATM = await prisma.suite.create({
    data: { name: '📱 6. Mobil Şube & ATM / QR İşlemleri', projectId: projBank.id, orderIndex: 5 },
  });
  const sMobileATMQR = await prisma.suite.create({
    data: { name: 'QR Kod ile Kartsız Para Çekme & Yatırma', projectId: projBank.id, parentId: sMobileATM.id, orderIndex: 0 },
  });
  const sMobileBiometric = await prisma.suite.create({
    data: { name: 'Biyometrik Giriş (FaceID/TouchID) & 2FA', projectId: projBank.id, parentId: sMobileATM.id, orderIndex: 1 },
  });

  const sSecurity = await prisma.suite.create({
    data: { name: '🚨 7. Siber Güvenlik, Fraud & AML Kontrolleri', projectId: projBank.id, orderIndex: 6 },
  });
  const sSecurityFraud = await prisma.suite.create({
    data: { name: 'Impossible Travel & Şüpheli Cihaz Tespiti', projectId: projBank.id, parentId: sSecurity.id, orderIndex: 0 },
  });
  const sSecuritySIM = await prisma.suite.create({
    data: { name: 'SIM Kart Değişikliği & Bloke Kaldırma', projectId: projBank.id, parentId: sSecurity.id, orderIndex: 1 },
  });

  // 4. Test Cases & Test Steps with SVG Mockups
  console.log('📝 Creating Banking Test Cases with step details & evidence attachments...');

  // TC-01: FAST Instant Transfer
  const fastScreenshotSuccess = createMobileFASTTransferScreenshot({
    status: 'SUCCESS',
    senderName: 'Ümit Sinanoğlu (Bireysel TL Hesabı)',
    senderIban: 'TR33 0006 2000 0001 2345 6789 01',
    receiverName: 'Ahmet Yılmaz (Kolay Adres: GSM)',
    receiverIban: 'TR64 0001 5000 0000 9876 5432 10',
    amount: '12.500,00',
    fastRefId: 'FST-20260826-98412-TR',
    timestamp: '26.08.2026 14:32:08',
    latencyMs: 142,
  });

  const tcBank01 = await prisma.testCase.create({
    data: {
      code: 'BANK-TC-01',
      title: 'FAST ile Kolay Adrese (GSM) 7/24 Anlık Para Transferi ve e-Dekont Oluşturma',
      description:
        'Müşterinin telefon rehberinden veya manuel girdiği GSM numarasına TCMB FAST üzerinden 12.500 TL transfer yapılması, FAST takas onayının 2 saniyeden kısa sürmesi ve e-Dekontun anında üretilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.BLOCKER,
      precondition: 'Gönderen hesapta en az 12.500 TL bakiye ve alıcının Kolay Adres (KOLAS) eşleşmesi aktif olmalıdır.',
      projectId: projBank.id,
      suiteId: sTransferFAST.id,
      jiraStoryKey: 'BANK-101',
      jiraIssueUrl: 'https://jira.bank.intra/browse/BANK-101',
      screenshotUrl: fastScreenshotSuccess,
      steps: {
        create: [
          {
            stepNumber: 1,
            action: 'Mobil Şube > Para Transferleri > FAST / Kolay Adres seçilir.',
            expectedResult: 'Kolay adres seçim ekranı (Telefon / TCKN / E-posta) açılır.',
            attachments: JSON.stringify([
              { id: 'att-1', url: fastScreenshotSuccess, comment: 'FAST Transfer Ekran Arayüzü' },
            ]),
          },
          {
            stepNumber: 2,
            action: 'Alıcı GSM numarası "+90 532 555 12 34" girilip 12.500 TL tutar belirtilir.',
            expectedResult: 'KOLAS servisi alıcı adı-soyadını maskeli (Ah*** YI****) doğrular.',
          },
          {
            stepNumber: 3,
            action: '"Transferi Onayla" butonuna basılarak Biyometrik FaceID doğrulaması yapılır.',
            expectedResult: 'TCMB FAST Takas Merkezi 142ms içinde 200 OK ve Referans ID döner, bakiye anında güncellenir.',
          },
        ],
      },
    },
  });

  // TC-02: FAST Limit Exceeded
  const fastScreenshotLimitFailed = createMobileFASTTransferScreenshot({
    status: 'FAILED',
    senderName: 'Ümit Sinanoğlu',
    senderIban: 'TR33 0006 2000 0001 2345 6789 01',
    receiverName: 'Mehmet Kaya',
    receiverIban: 'TR12 0006 4000 0000 1122 3344 55',
    amount: '120.000,00',
    fastRefId: 'FST-REJECT-LIMIT-EXCEEDED',
    timestamp: '26.08.2026 14:35:10',
    failureReason: 'TCMB FAST tek seferlik transfer limiti (100.000 TL) aşıldı. Lütfen EFT kanalını kullanınız.',
  });

  const tcBank02 = await prisma.testCase.create({
    data: {
      code: 'BANK-TC-02',
      title: 'FAST Tek Seferlik Transfer Limiti (₺100.000) Aşıldığında Güvenli Reddedilme',
      description:
        'TCMB tarafından belirlenen FAST tek seferlik işlem üst limiti (100.000 TL) üzerindeki transfer taleplerinin FAST yerine standart EFT akışına yönlendirilmesi veya kullanıcıya açık hata bildirimi verilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.CRITICAL,
      precondition: 'Hesap bakiyesi yeterli olmalıdır (örn: 150.000 TL).',
      projectId: projBank.id,
      suiteId: sTransferLimits.id,
      jiraStoryKey: 'BANK-102',
      jiraIssueUrl: 'https://jira.bank.intra/browse/BANK-102',
      screenshotUrl: fastScreenshotLimitFailed,
      steps: {
        create: [
          {
            stepNumber: 1,
            action: 'POST /api/v2/transfers/fast ile 120.000 TL tutarında istek atılır.',
            expectedResult: 'HTTP 422 Unprocessable Entity döner.',
          },
          {
            stepNumber: 2,
            action: 'Response payload incelenir.',
            expectedResult: 'errorCode: "FAST_MAX_LIMIT_EXCEEDED", redirectChannel: "EFT" döner.',
          },
        ],
      },
    },
  });

  // TC-03: Virtual Card with Dynamic CVV
  const cardScreenshot = createCreditCardVirtualManagementScreenshot({
    cardHolder: 'ÜMİT SİNANOĞLU',
    cardNumberMasked: '5406 82•• •••• 9104',
    expiry: '08/30',
    dynamicCvv: '824',
    cvvTimeRemainingSec: 48,
    availableLimit: '84.500,00',
    totalLimit: '120.000,00',
    isOnlineActive: true,
    isAbroadActive: false,
  });

  const tcBank03 = await prisma.testCase.create({
    data: {
      code: 'BANK-TC-03',
      title: 'Dinamik CVV (60sn Süreli) ile Güvenli Dijital Sanal Kart Üretimi ve Limit Tahsisi',
      description:
        'Müşterinin mobil şubeden ana karta bağlı dinamik CVV koduna sahip sanal kart oluşturması, her 60 saniyede bir CVV kodunun yenilenmesi ve e-ticaret sitelerinde test edilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Aktif bir Platinum Kredi Kartı mevcut olmalıdır.',
      projectId: projBank.id,
      suiteId: sCardsVirtual.id,
      jiraStoryKey: 'BANK-201',
      jiraIssueUrl: 'https://jira.bank.intra/browse/BANK-201',
      screenshotUrl: cardScreenshot,
      steps: {
        create: [
          {
            stepNumber: 1,
            action: 'Kart Yönetimi > Sanal Kart Oluştur butonuna tıklanır.',
            expectedResult: 'Sanal kart anında üretilir ve dinamik CVV sayacı başlar.',
          },
          {
            stepNumber: 2,
            action: 'Sanal karta 10.000 TL harcama limiti atanır.',
            expectedResult: 'Kullanılabilir limit 10.000 TL olarak güncellenir.',
          },
          {
            stepNumber: 3,
            action: '60 saniye beklenir.',
            expectedResult: 'CVV kodu otomatik olarak yeni rastgele 3 haneli koda döner (örn: 824 -> 419).',
          },
        ],
      },
    },
  });

  // TC-04: 3D Secure 2.2 Verification
  const threeDsScreenshot = create3DSecureVerificationScreenshot({
    merchantName: 'AMAZON TURKEY PERAKENDE HIZMETLERI',
    amount: '4.899,00',
    cardMasked: '5406 82•• •••• 9104',
    phoneMasked: '+90 532 *** ** 84',
    otpCode: '841920',
    expirySeconds: 165,
    status: 'VERIFIED',
  });

  const tcBank04 = await prisma.testCase.create({
    data: {
      code: 'BANK-TC-04',
      title: '3D Secure 2.2 BKM Doğrulama ve SMS OTP Şifresi ile Güvenli Alışveriş Onayı',
      description:
        'E-ticaret ödeme adımında EMV 3DS 2.2 iframe modalının tetiklenmesi, 6 haneli SMS OTP şifresinin girilerek işlemin provizyon alması.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.BLOCKER,
      precondition: 'Kredi kartı internet alışverişine açık olmalı ve 3D Secure kayıtlı olmalıdır.',
      projectId: projBank.id,
      suiteId: sCards3DS.id,
      jiraStoryKey: 'BANK-202',
      jiraIssueUrl: 'https://jira.bank.intra/browse/BANK-202',
      screenshotUrl: threeDsScreenshot,
      steps: {
        create: [
          {
            stepNumber: 1,
            action: 'Amazon ödeme sayfasında kart bilgileri girilip "Siparişi Tamamla" seçilir.',
            expectedResult: 'BKM 3DS 2.2 onay penceresi açılır.',
          },
          {
            stepNumber: 2,
            action: 'SMS ile gelen 841920 şifresi girilip "Onayla" butonuna basılır.',
            expectedResult: '3DS ACS doğrulama başarılı (PARes = Y) döner ve provizyon kodu üretilir.',
          },
        ],
      },
    },
  });

  // TC-05: Instant Consumer Loan Approval
  const loanScreenshot = createLoanApprovalFindeksScreenshot({
    customerName: 'Ümit Sinanoğlu',
    findeksScore: 1840,
    requestedAmount: '150.000,00',
    approvedAmount: '150.000,00',
    monthlyInstallment: '8.420,50',
    maturityMonths: 24,
    interestRate: '3.19',
    status: 'APPROVED',
  });

  const tcBank05 = await prisma.testCase.create({
    data: {
      code: 'BANK-TC-05',
      title: 'Findeks Kredi Notu (1840/1900) ile ₺150.000 Anında İhtiyaç Kredisi Tahsisi',
      description:
        'Müşterinin Findeks notunun KKB API üzerinden çekilerek karar motoru tarafından A+ sınıfında onaylanması, sözleşmenin dijital onaylanıp tutarın anında vadesiz hesaba aktarılması.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.BLOCKER,
      precondition: 'Findeks skoru > 1750 ve belgelenebilir SGK gelir kaydı olmalıdır.',
      projectId: projBank.id,
      suiteId: sLoansFindeks.id,
      jiraStoryKey: 'BANK-301',
      jiraIssueUrl: 'https://jira.bank.intra/browse/BANK-301',
      screenshotUrl: loanScreenshot,
      steps: {
        create: [
          {
            stepNumber: 1,
            action: 'POST /api/v1/loans/apply { amount: 150000, maturity: 24 } çağrılır.',
            expectedResult: 'Findeks SOAP servisi 1840 puan döner.',
          },
          {
            stepNumber: 2,
            action: 'Karar motoru limit ve taksit tablosunu hesaplar.',
            expectedResult: 'Aylık ₺8.420,50 taksit ile anında onay kararı üretilir.',
          },
          {
            stepNumber: 3,
            action: 'Dijital kredi sözleşmesi SMS OTP ile onaylanır.',
            expectedResult: '150.000 TL vadesiz hesaba anında geçer ve e-Dekont üretilir.',
          },
        ],
      },
    },
  });

  // TC-06: Live FX Currency Trading
  const fxScreenshot = createFXTradingMarketScreenshot({
    pair: 'USD / TRY',
    rate: '38.4520',
    changePercent: '+0.42%',
    buyRate: '38.4210',
    sellRate: '38.4830',
    tradedAmount: '192.260,00 TL',
    totalReceived: '5.000,00 USD',
    status: 'EXECUTED',
  });

  const tcBank06 = await prisma.testCase.create({
    data: {
      code: 'BANK-TC-06',
      title: 'Canlı Piyasa Kuru ile 5.000 USD Döviz Alım Emrinin Anında Gerçekleşmesi',
      description:
        'Canlı döviz kotasyonundan 38.4520 kuru üzerinden 5.000 USD alım emri verilmesi, TL vadesiz hesaptan 192.260 TL düşülerek USD vadesiz hesaba anında 5.000 USD bakiye eklenmesi.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'TL vadesiz hesapta yeterli bakiye ve tanımlı bir USD vadesiz hesap bulunmalıdır.',
      projectId: projBank.id,
      suiteId: sFXLive.id,
      jiraStoryKey: 'BANK-401',
      jiraIssueUrl: 'https://jira.bank.intra/browse/BANK-401',
      screenshotUrl: fxScreenshot,
      steps: {
        create: [
          {
            stepNumber: 1,
            action: 'Döviz & Altın Piyasası > USD/TRY Alış seçilir.',
            expectedResult: 'Canlı fiyat 3 saniye süreyle sabitlenir.',
          },
          {
            stepNumber: 2,
            action: '5.000 USD tutar girilip "Alışı Onayla" seçilir.',
            expectedResult: 'Hazine motoru kotasyonu eşleştirir ve 200 OK döner.',
          },
          {
            stepNumber: 3,
            action: 'Hesap bakiyeleri doğrulanır.',
            expectedResult: 'TL hesaptan 192.260 TL düşer, USD hesaba 5.000 USD eklenir.',
          },
        ],
      },
    },
  });

  // TC-07: ATM QR Code Cash Withdrawal
  const atmScreenshot = createATMQRCodeWithdrawalScreenshot({
    atmName: 'Şişli Büyükdere Cad. ATM #042',
    amount: '2.000,00',
    accountIbanMasked: 'TR33 0006 2000 •••• •••• ••01',
    dailyRemainingLimit: '18.000,00',
    status: 'COMPLETED',
  });

  const tcBank07 = await prisma.testCase.create({
    data: {
      code: 'BANK-TC-07',
      title: 'Mobil Kamera ile ATM Dinamik QR Kod Okutularak ₺2.000 Kartsız Para Çekilmesi',
      description:
        'Müşterinin ATM ekranındaki dinamik QR kodu mobil şube kamerasıyla taraması, GPS lokasyon doğrulaması ve ATM para verme yuvasından banknotların teslim edilmesi.',
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'Cihaz konum izni açık olmalı ve ATM mesafesi < 50 metre olmalıdır.',
      projectId: projBank.id,
      suiteId: sMobileATMQR.id,
      jiraStoryKey: 'BANK-501',
      jiraIssueUrl: 'https://jira.bank.intra/browse/BANK-501',
      screenshotUrl: atmScreenshot,
      steps: {
        create: [
          {
            stepNumber: 1,
            action: 'ATM ekranında "QR ile Para Çekme" butonuna basılır ve QR üretilir.',
            expectedResult: 'ATM ekranında 45 saniyelik dinamik QR kod belirir.',
          },
          {
            stepNumber: 2,
            action: 'Mobil Şube > QR İşlemleri > QR Kod Okut açılır ve kamera ATM ekranına tutulur.',
            expectedResult: 'Kamera anında okur ve coğrafi mesafe doğrulanır (3.4 metre).',
          },
          {
            stepNumber: 3,
            action: '₺2.000 tutar seçilip FaceID ile onaylanır.',
            expectedResult: 'ATM para çıkış yuvası açılır, 10 adet ₺200 banknot teslim edilir.',
          },
        ],
      },
    },
  });

  // TC-08: Fraud & AML Impossible Travel Detection
  const fraudScreenshot = createFraudAMLAlertScreenshot({
    alertId: 'SEC-AML-2026-98102',
    riskScore: 96,
    threatType: 'Coğrafi İmkansız Hız (Impossible Travel)',
    customerName: 'Ümit Sinanoğlu (ID: CUST-88412)',
    sourceLocation: 'İstanbul, Türkiye (IP: 176.240.12.8)',
    suspiciousLocation: 'Frankfurt, Almanya (IP: 194.26.29.11 - Tor Düğümü)',
    actionTaken: 'Hesap derhal geçici korumaya alındı, para çıkışları donduruldu, SMS teyit istendi.',
  });

  const tcBank08 = await prisma.testCase.create({
    data: {
      code: 'BANK-TC-08',
      title: 'Siber Güvenlik / AML: 4 Dakikada İstanbul-Frankfurt Girişinde (Impossible Travel) Otomatik Bloke',
      description:
        'Aynı müşteri hesabına 4 dakika arayla önce İstanbul ardından Frankfurt üzerinden şüpheli para transfer isteği geldiğinde Fraud motorunun işlemi engellemesi ve hesaba güvenlik blokesi koyması.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.BLOCKER,
      precondition: 'Fraud AI/ML tespit kuralları aktif olmalıdır.',
      projectId: projBank.id,
      suiteId: sSecurityFraud.id,
      jiraStoryKey: 'BANK-601',
      jiraIssueUrl: 'https://jira.bank.intra/browse/BANK-601',
      screenshotUrl: fraudScreenshot,
      steps: {
        create: [
          {
            stepNumber: 1,
            action: 'Saat 14:12 de İstanbul IP adresinden başarılı oturum açılır.',
            expectedResult: 'Oturum Token (JWT) üretilir.',
          },
          {
            stepNumber: 2,
            action: 'Saat 14:16 da Almanya Tor IP üzerinden 80.000 TL para çekme isteği gönderilir.',
            expectedResult: 'Fraud motoru hız anomalisi (1.800 km / 4 dk) tespit eder (Risk: 96/100).',
          },
          {
            stepNumber: 3,
            action: 'İşlem yanıtı ve güvenlik logları kontrol edilir.',
            expectedResult: 'HTTP 403 Forbidden, hesap güvenlik korumasına alınır ve SMS alarmı iletilir.',
          },
        ],
      },
    },
  });

  // 5. Test Runs and Rich Execution Results with Multi-Screenshots
  console.log('🚀 Creating Banking Test Runs & Detailed Test Results...');

  // Test Run 1: Mobil Şube v4.5 FAST & Transfer Kabul Koşumu
  const runBank1 = await prisma.testRun.create({
    data: {
      title: 'Mobil Şube v4.5 Sürüm Öncesi FAST & Ödemeler Kabul Koşumu',
      version: 'v4.5.0',
      environment: 'PRODUCTION',
      status: RunStatus.COMPLETED,
      executedBy: 'Ümit Sinanoğlu (Lead QA)',
      testerEmail: 'umit.sinanoglu@neobank.com',
      projectId: projBank.id,
      testPlanId: planFastTransfer.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: runBank1.id,
        testCaseId: tcBank01.id,
        status: ResultStatus.PASSED,
        executionMs: 142,
        executedBy: 'Ümit Sinanoğlu',
        testerEmail: 'umit.sinanoglu@neobank.com',
        errorMessage: 'TCMB FAST Takas Onayı 142ms içinde alındı. Kolay adres doğrulaması ve PDF dekont üretimi kusursuz tamamlandı.',
        screenshotUrl: fastScreenshotSuccess,
      },
      {
        testRunId: runBank1.id,
        testCaseId: tcBank02.id,
        status: ResultStatus.PASSED,
        executionMs: 98,
        executedBy: 'Ümit Sinanoğlu',
        testerEmail: 'umit.sinanoglu@neobank.com',
        errorMessage: '120.000 TL transfer denemesinde FAST limit kuralı devreye girdi, kullanıcı EFT kanalına yönlendirildi.',
        screenshotUrl: fastScreenshotLimitFailed,
      },
    ],
  });

  // Test Run 2: Kredi Kartları, Dinamik CVV & 3DS Koşumu
  const runBank2 = await prisma.testRun.create({
    data: {
      title: 'Kredi Kartları, Dinamik CVV & 3DS 2.2 Güvenlik Doğrulama Koşumu',
      version: 'v4.5.0',
      environment: 'STAGING',
      status: RunStatus.COMPLETED,
      executedBy: 'Zeynep Kaya (Senior QA)',
      testerEmail: 'zeynep.kaya@neobank.com',
      projectId: projBank.id,
      testPlanId: planCardSecurity.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: runBank2.id,
        testCaseId: tcBank03.id,
        status: ResultStatus.PASSED,
        executionMs: 210,
        executedBy: 'Zeynep Kaya',
        testerEmail: 'zeynep.kaya@neobank.com',
        errorMessage: 'Dinamik CVV kodu 60 saniyede bir başarıyla yenilendi. PCI-DSS v4.0 token maskeleme kuralları doğrulandı.',
        screenshotUrl: cardScreenshot,
      },
      {
        testRunId: runBank2.id,
        testCaseId: tcBank04.id,
        status: ResultStatus.PASSED,
        executionMs: 385,
        executedBy: 'Zeynep Kaya',
        testerEmail: 'zeynep.kaya@neobank.com',
        errorMessage: 'BKM EMV 3DS 2.2 SMS OTP doğrulama akışı Amazon üzerinde başarıyla tamamlandı.',
        screenshotUrl: threeDsScreenshot,
      },
    ],
  });

  // Test Run 3: Kredi Tahsis & FX Yatırım Koşumu
  const runBank3 = await prisma.testRun.create({
    data: {
      title: 'Findeks Kredi Tahsis, Canlı FX & Kartsız QR Para Çekme Koşumu',
      version: 'v4.6.0-RC',
      environment: 'STAGING',
      status: RunStatus.COMPLETED,
      executedBy: 'Burak Demir (Fintech QA)',
      testerEmail: 'burak.demir@neobank.com',
      projectId: projBank.id,
      testPlanId: planLoanCredit.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: runBank3.id,
        testCaseId: tcBank05.id,
        status: ResultStatus.PASSED,
        executionMs: 620,
        executedBy: 'Burak Demir',
        testerEmail: 'burak.demir@neobank.com',
        errorMessage: 'Findeks skoru (1840) anında çekildi. 150.000 TL kredi sözleşmesi dijital imzalanıp vadesiz hesaba aktarıldı.',
        screenshotUrl: loanScreenshot,
      },
      {
        testRunId: runBank3.id,
        testCaseId: tcBank06.id,
        status: ResultStatus.PASSED,
        executionMs: 195,
        executedBy: 'Burak Demir',
        testerEmail: 'burak.demir@neobank.com',
        errorMessage: 'USD/TRY 38.4520 kotasyonundan 5.000 USD anında alınıp vadesiz döviz hesabına işlendi.',
        screenshotUrl: fxScreenshot,
      },
      {
        testRunId: runBank3.id,
        testCaseId: tcBank07.id,
        status: ResultStatus.PASSED,
        executionMs: 310,
        executedBy: 'Burak Demir',
        testerEmail: 'burak.demir@neobank.com',
        errorMessage: 'ATM #042 QR kodu 3.4 metre mesafeden başarıyla okundu ve ₺2.000 nakit teslim edildi.',
        screenshotUrl: atmScreenshot,
      },
    ],
  });

  // Test Run 4: Siber Güvenlik & AML Fraud Koşumu
  const runBank4 = await prisma.testRun.create({
    data: {
      title: 'Siber Güvenlik, AML & Coğrafi Fraud Risk Simülasyonu',
      version: 'v4.5.0',
      environment: 'PRODUCTION',
      status: RunStatus.COMPLETED,
      executedBy: 'Mert Aksoy (SecOps QA)',
      testerEmail: 'mert.aksoy@neobank.com',
      projectId: projBank.id,
      testPlanId: planFraudSecurity.id,
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: runBank4.id,
        testCaseId: tcBank08.id,
        status: ResultStatus.PASSED,
        executionMs: 85,
        executedBy: 'Mert Aksoy',
        testerEmail: 'mert.aksoy@neobank.com',
        errorMessage: 'Impossible Travel anomalisinde hesap 85ms içinde donduruldu, yetkisiz para çıkışı başarıyla engellendi.',
        screenshotUrl: fraudScreenshot,
      },
    ],
  });

  console.log('✅ Banking & Financial Platform Seed Completed Successfully!');
}
