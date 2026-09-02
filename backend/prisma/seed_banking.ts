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
  createMakerCheckerApprovalScreenshot,
  createOpenBankingAPIScreenshot,
  createKYCOnboardingScreenshot,
} from './banking_mockups';

export async function seedBankingProject(prisma: PrismaClient) {
  console.log('🏦 [SDLC] Seeding 100% Digital Banking SDLC Enterprise Ecosystem...');

  // =========================================================================
  // 1. PROJE 1: BANK-MOB — NeoBank Bireysel & Kurumsal Mobil Şube (iOS & Android)
  // =========================================================================
  console.log('📱 [1/4] Seeding Project: BANK-MOB (NeoBank Mobil Şube)...');
  const projMob = await prisma.project.create({
    data: {
      name: 'NeoBank Bireysel & Kurumsal Mobil Şube',
      key: 'BANK-MOB',
      description:
        'Bireysel ve Kurumsal Mobil Şube, OCR/NFC Uzaktan Müşteri Edinimi (KYC), Biyometrik Giriş (FaceID/TouchID), TCMB FAST 7/24 Para Transferleri, Dinamik CVV Sanal Kartlar, Findeks Anında Kredi Tahsisi, Canlı FX & Altın Piyasaları ve QR Kod ATM İşlemleri.',
      jiraProjectKey: 'MOB',
    },
  });

  // 5 ADET TEST PLANI (BANK-MOB)
  const planMobKyc = await prisma.testPlan.create({
    data: {
      title: 'Mobil v4.8 Sprint 24 Regresyon & Biyometrik Onboarding (KYC) Planı',
      description:
        'BDDK 2021/4 Uzaktan Kimlik Tespiti tebliğine uygun olarak T.C. Kimlik Kartı OCR okuma, NFC çip doğrulama, 3D Liveness canlılık tespiti ve görüntülü görüşme ile müşteri kabul akışı regresyon testi.',
      version: 'v4.8.0',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'Mobil Onboarding Akışı, OCR Motoru, NFC Okuyucu, Liveness AI Modülü, Görüntülü KYC Gateway',
      requirements: 'MOB-101, MOB-104, BDDK-2021/4, KVKK-UYUM',
      projectId: projMob.id,
    },
  });

  const planMobFast = await prisma.testPlan.create({
    data: {
      title: 'TCMB FAST 7/24 Anlık Fon Transferi & KOLAS Kolay Adres v2.0 Planı',
      description:
        'TCMB FAST altyapısı üzerinden 7/24 kesintisiz fon transferi, Kolay Adres (GSM/TCKN/E-posta) sorgulama, e-Dekont üretimi ve 100.000 TL işlem limiti kontrollerinin uçtan uca kabul testleri.',
      version: 'v4.8.0',
      environment: 'PRODUCTION',
      status: PlanStatus.COMPLETED,
      scope: 'TCMB FAST Gateway, KOLAS Resolver, Core Banking Ledger, PDF Dekont Motoru',
      requirements: 'MOB-201, MOB-205, TCMB-FAST-2024',
      projectId: projMob.id,
    },
  });

  const planMobCard = await prisma.testPlan.create({
    data: {
      title: 'Kredi Kartı, Dinamik CVV & Dijital Cüzdan Lansman Planı',
      description:
        'PCI-DSS v4.0 uyumlu 60 saniyede bir değişen dinamik CVV üretimi, sanal kart harcama limitleri tahsisi, dönem içi harcama taksitlendirme ve 3D Secure 2.2 BKM mobil onay testleri.',
      version: 'v4.8.0',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'Card Management System (CMS), Dynamic CVV Generator, 3DS 2.2 ACS Server, POS Gateway',
      requirements: 'MOB-301, MOB-304, PCI-DSS-4.0, BKM-3DS-REQ',
      projectId: projMob.id,
    },
  });

  const planMobLoan = await prisma.testPlan.create({
    data: {
      title: 'Findeks Anında İhtiyaç Kredisi & Otomatik Tahsis Planı',
      description:
        'KKB/Findeks SOAP entegrasyonu ile anlık kredi notu sorgulama, otomatik karar motoru (A+ skor), anında kredi tahsis ve vadesiz hesaba otomatik para aktarımı regresyon planı.',
      version: 'v4.8.2-RC',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'Credit Scoring Engine, KKB SOAP Client, SGK Auto-Validator, Instant Disbursement API',
      requirements: 'MOB-401, MOB-405, KKB-SCORE-API',
      projectId: projMob.id,
    },
  });

  const planMobAtm = await prisma.testPlan.create({
    data: {
      title: 'QR Kod ile Kartsız ATM Para Çekme & Yatırma Doğrulama Planı',
      description:
        'Mobil kamera ile ATM ekranındaki dinamik QR kodun taranması, coğrafi yakınlık doğrulaması, günlük QR kartsız işlem limiti kontrolü ve ATM para çıkış yuvası protokolü.',
      version: 'v4.7.5',
      environment: 'PRODUCTION',
      status: PlanStatus.COMPLETED,
      scope: 'ATM Switch, QR Generator, Geolocation Validator, Core Cash Dispenser',
      requirements: 'MOB-501, MOB-503',
      projectId: projMob.id,
    },
  });

  // Suites & Sub-Suites (BANK-MOB)
  const sMobKyc = await prisma.suite.create({
    data: { name: '📱 1. Onboarding & Uzaktan Müşteri Edinimi (KYC)', projectId: projMob.id, orderIndex: 0 },
  });
  const sMobKycOcr = await prisma.suite.create({
    data: { name: 'T.C. Kimlik OCR & NFC Çip Okuma', projectId: projMob.id, parentId: sMobKyc.id, orderIndex: 0 },
  });
  const sMobKycLiveness = await prisma.suite.create({
    data: { name: '3D Canlılık Tespiti & Görüntülü Görüşme', projectId: projMob.id, parentId: sMobKyc.id, orderIndex: 1 },
  });

  const sMobAuth = await prisma.suite.create({
    data: { name: '🔐 2. Kimlik Doğrulama & Biyometri', projectId: projMob.id, orderIndex: 1 },
  });
  const sMobAuthBio = await prisma.suite.create({
    data: { name: 'FaceID / TouchID Biyometrik Giriş', projectId: projMob.id, parentId: sMobAuth.id, orderIndex: 0 },
  });
  const sMobAuthOtp = await prisma.suite.create({
    data: { name: 'Dinamik SMS OTP & Cihaz Eşleme', projectId: projMob.id, parentId: sMobAuth.id, orderIndex: 1 },
  });

  const sMobTransfer = await prisma.suite.create({
    data: { name: '💸 3. Para Transferleri (FAST / KOLAS / EFT)', projectId: projMob.id, orderIndex: 2 },
  });
  const sMobTransferFast = await prisma.suite.create({
    data: { name: 'FAST 7/24 Anlık Transfer & Kolay Adres (KOLAS)', projectId: projMob.id, parentId: sMobTransfer.id, orderIndex: 0 },
  });
  const sMobTransferLimits = await prisma.suite.create({
    data: { name: 'Transfer Limit & Ücretlendirme Motoru', projectId: projMob.id, parentId: sMobTransfer.id, orderIndex: 1 },
  });

  const sMobCards = await prisma.suite.create({
    data: { name: '💳 4. Kredi Kartı & Kartlı Ödemeler', projectId: projMob.id, orderIndex: 3 },
  });
  const sMobCardsVirtual = await prisma.suite.create({
    data: { name: 'Dinamik CVV Sanal Kart & Limit Yönetimi', projectId: projMob.id, parentId: sMobCards.id, orderIndex: 0 },
  });
  const sMobCards3DS = await prisma.suite.create({
    data: { name: '3D Secure 2.2 & Mobil Biyometrik Onay', projectId: projMob.id, parentId: sMobCards.id, orderIndex: 1 },
  });
  const sMobCardsInstallments = await prisma.suite.create({
    data: { name: 'Ekstre Taksitlendirme & Nakit Avans', projectId: projMob.id, parentId: sMobCards.id, orderIndex: 2 },
  });

  const sMobLoans = await prisma.suite.create({
    data: { name: '💰 5. Krediler & Finansman Başvurusu', projectId: projMob.id, orderIndex: 4 },
  });
  const sMobLoansInstant = await prisma.suite.create({
    data: { name: 'Anında İhtiyaç Kredisi Tahsisi', projectId: projMob.id, parentId: sMobLoans.id, orderIndex: 0 },
  });
  const sMobLoansFindeks = await prisma.suite.create({
    data: { name: 'Findeks Kredi Notu Karar Ağacı', projectId: projMob.id, parentId: sMobLoans.id, orderIndex: 1 },
  });

  const sMobAtm = await prisma.suite.create({
    data: { name: '🏧 6. Mobil Şube & ATM / QR İşlemleri', projectId: projMob.id, orderIndex: 5 },
  });
  const sMobAtmQr = await prisma.suite.create({
    data: { name: 'QR Kod ile Kartsız Para Çekme & Yatırma', projectId: projMob.id, parentId: sMobAtm.id, orderIndex: 0 },
  });
  const sMobAtmMap = await prisma.suite.create({
    data: { name: 'En Yakın ATM / Şube Lokasyon Bulucu', projectId: projMob.id, parentId: sMobAtm.id, orderIndex: 1 },
  });

  // Mockups
  const kycScreenshot = createKYCOnboardingScreenshot({
    customerName: 'Ümit Sinanoğlu',
    tcknMasked: '249*****810',
    ocrStatus: 'Başarılı (MRZ & Holo Onaylı)',
    nfcChipStatus: 'Başarılı (Biyometrik Veri Okundu)',
    livenessConfidence: 99.4,
  });

  const fastScreenshotSuccess = createMobileFASTTransferScreenshot({
    status: 'SUCCESS',
    senderName: 'Ümit Sinanoğlu (Bireysel TL Hesabı)',
    senderIban: 'TR33 0006 2000 0001 2345 6789 01',
    receiverName: 'Ahmet Yılmaz (Kolay Adres: GSM)',
    receiverIban: 'TR64 0001 5000 0000 9876 5432 10',
    amount: '12.500,00',
    fastRefId: 'FST-20260827-98412-TR',
    timestamp: '27.08.2026 14:32:08',
    latencyMs: 142,
  });

  const fastScreenshotLimitFailed = createMobileFASTTransferScreenshot({
    status: 'FAILED',
    senderName: 'Ümit Sinanoğlu',
    senderIban: 'TR33 0006 2000 0001 2345 6789 01',
    receiverName: 'Mehmet Kaya',
    receiverIban: 'TR12 0006 4000 0000 1122 3344 55',
    amount: '120.000,00',
    fastRefId: 'FST-REJECT-LIMIT-EXCEEDED',
    timestamp: '27.08.2026 14:35:10',
    failureReason: 'TCMB FAST tek seferlik transfer limiti (100.000 TL) aşıldı. Lütfen EFT kanalını kullanınız.',
  });

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

  const threeDsScreenshot = create3DSecureVerificationScreenshot({
    merchantName: 'AMAZON TURKEY PERAKENDE HIZMETLERI',
    amount: '4.899,00',
    cardMasked: '5406 82•• •••• 9104',
    phoneMasked: '+90 532 *** ** 84',
    otpCode: '841920',
    expirySeconds: 165,
    status: 'VERIFIED',
  });

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

  const atmScreenshot = createATMQRCodeWithdrawalScreenshot({
    atmName: 'Şişli Büyükdere Cad. ATM #042',
    amount: '2.000,00',
    accountIbanMasked: 'TR33 0006 2000 •••• •••• ••01',
    dailyRemainingLimit: '18.000,00',
    status: 'COMPLETED',
  });

  // =========================================================================
  // 5 TEST PLANI İÇİN 8'ER ADET TEST SENARYOSU (TOPLAM 40 TEST SENARYOSU)
  // =========================================================================
  console.log('📝 Creating 40 detailed Banking Test Cases (8 per plan)...');
  const mobCases: any[] = [];

  // --- PLAN 1: Onboarding & Biyometrik KYC Planı (8 Test Cases: MOB-TC-01..08) ---
  const plan1Definitions = [
    {
      code: 'MOB-TC-01',
      title: 'T.C. Kimlik Kartı Ön/Arka Yüz OCR Okuma ve MRZ Satırı Bütünlük Doğrulaması',
      description: 'Kullanıcının kimlik kartını kamerayla taraması, MRZ verisinin çözülmesi ve TCKN/ad/soyad alanlarının doğrulanması.',
      suiteId: sMobKycOcr.id,
      priority: Priority.BLOCKER,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-101',
      screenshotUrl: kycScreenshot,
      steps: [
        { stepNumber: 1, action: 'Mobil Şube açılıp "Müşterimiz Olun" seçilir.', expectedResult: 'Kamera izin ekranı ve kimlik yerleştirme kılavuzu açılır.' },
        { stepNumber: 2, action: 'Kimliğin ön ve arka yüzü taranır.', expectedResult: 'MRZ satırı okunur ve optik karakter tanıma %99 doğrulukla tamamlanır.' },
      ],
    },
    {
      code: 'MOB-TC-02',
      title: 'NFC Çip Temassız Kimlik Okuma ile Biyometrik Fotoğraf ve Güvenlik Sertifikası Alımı',
      description: 'Telefonun arka yüzü kimliğe dokundurularak NFC çipindeki dijital sertifika ve yüksek çözünürlüklü fotoğrafın alınması.',
      suiteId: sMobKycOcr.id,
      priority: Priority.BLOCKER,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-102',
      screenshotUrl: kycScreenshot,
      steps: [
        { stepNumber: 1, action: 'NFC okuma ekranında kimlik telefonun üst arka kısmına yaklaştırılır.', expectedResult: 'NFC titreşimi alınır ve veri aktarımı başlar.' },
        { stepNumber: 2, action: 'ICAO 9303 standartlarında çip okunur.', expectedResult: 'İçişleri Bakanlığı dijital imzası doğrulanır.' },
      ],
    },
    {
      code: 'MOB-TC-03',
      title: '3D Canlılık (Liveness) Yüz Tarama ve Sahte Maske / Derinlik Tespiti',
      description: 'Kullanıcının kamera karşısında başını sağa/sola çevirmesi, derinlik sensörleri ile canlılık teyidi yapılması.',
      suiteId: sMobKycLiveness.id,
      priority: Priority.CRITICAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-103',
      screenshotUrl: kycScreenshot,
      steps: [
        { stepNumber: 1, action: 'Liveness modülü başlatılır ve yüz kılavuz daireye yerleştirilir.', expectedResult: 'Işık ve mesafe kalibrasyonu tamamlanır.' },
        { stepNumber: 2, action: 'Göz kırpma ve hafif baş çevirme talimatı verilir.', expectedResult: '3D yüz haritası %99.4 canlılık skoruyla onaylanır.' },
      ],
    },
    {
      code: 'MOB-TC-04',
      title: 'Görüntülü Müşteri Temsilcisi Oturumu ve Uçtan Uca Şifreli WebRTC Bağlantısı',
      description: 'Canlı müşteri temsilcisiyle video görüşme başlatılması, güvenlik soruları ve anlık kimlik teyidi yapılması.',
      suiteId: sMobKycLiveness.id,
      priority: Priority.BLOCKER,
      executionType: 'MANUAL',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-104',
      screenshotUrl: kycScreenshot,
      steps: [
        { stepNumber: 1, action: 'Görüntülü görüşme kuyruğuna girilir.', expectedResult: 'Temsilci çağrıyı karşılar ve şifreli WebRTC kanalı kurulur.' },
        { stepNumber: 2, action: 'Temsilci anlık güvenlik sorularını sorup fotoğraf çeker.', expectedResult: 'Müşteri onay kodu üretilir ve oturum sonlanır.' },
      ],
    },
    {
      code: 'MOB-TC-05',
      title: 'Yabancı Kimlik & Pasaport OCR Okuma ile Uluslararası Müşteri Kabulü',
      description: 'Yabancı uyruklu müşteriler için pasaport ve 99 ile başlayan yabancı kimlik numarasının doğrulanması.',
      suiteId: sMobKycOcr.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-105',
      steps: [
        { stepNumber: 1, action: 'Kimlik tipi olarak "Pasaport" seçilir.', expectedResult: 'Pasaport ICAO MRZ tarama şablonu açılır.' },
        { stepNumber: 2, action: 'Pasaport taranır.', expectedResult: 'Göç İdaresi Başkanlığı YKN doğrulama servisi 200 OK döner.' },
      ],
    },
    {
      code: 'MOB-TC-06',
      title: 'Yetersiz Işık veya Parlamada Otomatik Yeniden Çekim Uyarısı Verilmesi',
      description: 'Kimlik kartında aşırı parlama veya gölge olduğunda OCR motorunun kullanıcıya net yönlendirme vermesi.',
      suiteId: sMobKycOcr.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-106',
      steps: [
        { stepNumber: 1, action: 'Işık parlaması olan ortamda kimlik çekimi denenir.', expectedResult: 'OCR güven skoru < %70 olduğunda "Parlama Algılandı" uyarısı çıkar.' },
        { stepNumber: 2, action: 'Kullanıcıya çekim açısı kılavuzu gösterilir.', expectedResult: 'Kullanıcı kartı doğru açıyla yeniden çeker.' },
      ],
    },
    {
      code: 'MOB-TC-07',
      title: 'KVKK, Açık Rıza ve Dijital Bankacılık Temel Sözleşmesi SMS OTP Onayı',
      description: 'Mevzuat sözleşmelerinin dijital olarak onaylanması ve SMS OTP ile hukuki geçerliliğin sağlanması.',
      suiteId: sMobAuthOtp.id,
      priority: Priority.CRITICAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-107',
      steps: [
        { stepNumber: 1, action: 'Temel Bankacılık ve KVKK sözleşmesi metni açılır.', expectedResult: 'Sözleşme PDF formatında görüntülenir.' },
        { stepNumber: 2, action: 'SMS ile gelen 6 haneli OTP kodu girilir.', expectedResult: 'Sözleşme zaman damgasıyla imzalanıp arşive kaydedilir.' },
      ],
    },
    {
      code: 'MOB-TC-08',
      title: '18 Yaşından Küçük Adaylar İçin Veli/Vasi Onayı Yönlendirmesi',
      description: 'Doğum tarihi 18 yaşından küçük olan adaylarda otomatik olarak veli/vasi onay akışının devreye girmesi.',
      suiteId: sMobKycLiveness.id,
      priority: Priority.LOW,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-108',
      steps: [
        { stepNumber: 1, action: '17 yaşında bir doğum tarihi içeren TCKN ile başvuru yapılır.', expectedResult: 'Sistem yaşı hesaplar ve "Genç Bankacılık" akışını başlatır.' },
        { stepNumber: 2, action: 'Veli TCKN ve onay talebi istenir.', expectedResult: 'Veliye SMS onay bildirimi gönderilir.' },
      ],
    },
  ];

  // --- PLAN 2: TCMB FAST & KOLAS Para Transferleri Planı (8 Test Cases: MOB-TC-09..16) ---
  const plan2Definitions = [
    {
      code: 'MOB-TC-09',
      title: 'FAST ile Kolay Adrese (GSM Numarası) 7/24 Anlık Para Transferi ve e-Dekont',
      description: 'Rehberden seçilen GSM numarasına TCMB FAST ile 12.500 TL gönderilmesi ve 142ms içinde takas onayı alınması.',
      suiteId: sMobTransferFast.id,
      priority: Priority.BLOCKER,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-201',
      screenshotUrl: fastScreenshotSuccess,
      steps: [
        { stepNumber: 1, action: 'Transferler > FAST / Kolay Adres seçilir.', expectedResult: 'Kolay adres sorgu ekranı açılır.' },
        { stepNumber: 2, action: '+90 532 555 12 34 girilip 12.500 TL yazılır.', expectedResult: 'KOLAS maskeli isim döner.' },
        { stepNumber: 3, action: 'FaceID ile onaylanır.', expectedResult: 'FAST takası 142ms içinde tamamlanır ve e-Dekont üretilir.' },
      ],
    },
    {
      code: 'MOB-TC-10',
      title: 'Kolay Adres (TCKN) ile ₺20.000 FAST Transferi ve Anlık Bakiye Senkronizasyonu',
      description: 'Alıcı TCKN girilerek FAST ile para gönderilmesi ve vadesiz hesap bakiyesinin anında güncellenmesi.',
      suiteId: sMobTransferFast.id,
      priority: Priority.CRITICAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-202',
      screenshotUrl: fastScreenshotSuccess,
      steps: [
        { stepNumber: 1, action: 'Alıcı TCKN ve 20.000 TL tutar girilir.', expectedResult: 'BKM KOLAS sistemi hesabı eşler.' },
        { stepNumber: 2, action: 'Transfer onaylanır.', expectedResult: 'Para alıcı hesaba anında geçer.' },
      ],
    },
    {
      code: 'MOB-TC-11',
      title: 'FAST Tek Seferlik İşlem Üst Limiti (₺100.000) Aşıldığında EFT Kanalına Yönlendirme',
      description: '100.000 TL üzerindeki transferlerin FAST yerine standart EFT akışına yönlendirilmesi.',
      suiteId: sMobTransferLimits.id,
      priority: Priority.CRITICAL,
      executionType: 'AUTOMATED',
      type: TestType.API,
      jiraStoryKey: 'MOB-203',
      screenshotUrl: fastScreenshotLimitFailed,
      steps: [
        { stepNumber: 1, action: '120.000 TL transfer talebi girilir.', expectedResult: 'FAST limit aşımı uyarısı çıkar.' },
        { stepNumber: 2, action: '"EFT ile Devam Et" seçeneği sunulur.', expectedResult: 'İşlem EFT saatleri kuralıyla sıraya alınır.' },
      ],
    },
    {
      code: 'MOB-TC-12',
      title: 'Mağaza Ödemelerinde FAST Dinamik Karekod (TR-Karekod) ile 7/24 Anlık Ödeme',
      description: 'POS veya e-ticaret ekranındaki TR-Karekodun mobil şube kamerasıyla taranarak ödenmesi.',
      suiteId: sMobTransferFast.id,
      priority: Priority.CRITICAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-204',
      steps: [
        { stepNumber: 1, action: 'TR-Karekod taranır.', expectedResult: 'İşyeri adı, tutar ve referans otomatik doldurulur.' },
        { stepNumber: 2, action: 'Onay butonuna basılır.', expectedResult: 'Ödeme anında POS ekranına yansır.' },
      ],
    },
    {
      code: 'MOB-TC-13',
      title: 'Sistemde Tanımlı Olmayan Kolay Adres Girildiğinde Hata Bildirimi',
      description: 'KOLAS eşleşmesi olmayan bir GSM/TCKN sorgulandığında kullanıcıya açık bilgi verilmesi.',
      suiteId: sMobTransferFast.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-205',
      steps: [
        { stepNumber: 1, action: 'Kayıtsız GSM numarası girilir.', expectedResult: 'KOLAS servisi "RECORD_NOT_FOUND" döner.' },
        { stepNumber: 2, action: 'Arayüz kontrol edilir.', expectedResult: '"Kolay adres bulunamadı, IBAN ile devam edin" uyarısı çıkar.' },
      ],
    },
    {
      code: 'MOB-TC-14',
      title: 'Hesap Bakiyesi Yetersizken FAST Transfer Talebinin Güvenli İptali',
      description: 'Bakiye yetersizliğinde transfer isteğinin core banking ledger tarafından reddedilmesi.',
      suiteId: sMobTransferLimits.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-206',
      steps: [
        { stepNumber: 1, action: 'Bakiyeden 1.000 TL fazla tutar girilir.', expectedResult: '"Yetersiz Bakiye" uyarısı gösterilir.' },
        { stepNumber: 2, action: 'Ek hesap (KMH) limiti sorgulanır.', expectedResult: 'KMH limiti varsa KMH kullanım onayı sorulur.' },
      ],
    },
    {
      code: 'MOB-TC-15',
      title: 'Periyodik / Düzenli FAST Transfer Talimatı Oluşturma ve Takvime Bağlama',
      description: 'Her ayın 15inde otomatik FAST kira ödemesi talimatı tanımlanması.',
      suiteId: sMobTransferFast.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-207',
      steps: [
        { stepNumber: 1, action: 'Düzenli Transfer seçeneği işaretlenir ve gün seçilir.', expectedResult: 'Talimat motoru periyot kurallarını doğrular.' },
        { stepNumber: 2, action: 'Talimat kaydedilir.', expectedResult: 'Bekleyen talimatlar listesine eklenir.' },
      ],
    },
    {
      code: 'MOB-TC-16',
      title: 'TCMB Takas Yanıtı Zaman Aşımında (Timeout > 2sn) Otomatik Rollback',
      description: 'Merkez Bankası ağ gecikmesinde müşterinin bakiyesinin bloke kalmaması için ters işlem (reversal) yapılması.',
      suiteId: sMobTransferLimits.id,
      priority: Priority.BLOCKER,
      executionType: 'AUTOMATED',
      type: TestType.API,
      jiraStoryKey: 'MOB-208',
      steps: [
        { stepNumber: 1, action: 'Takas servisine 2500ms yapay gecikme enjekte edilir.', expectedResult: 'İstemci timeout alır.' },
        { stepNumber: 2, action: 'Core banking reversal kuyruğu incelenir.', expectedResult: 'Bloke tutar derhal hesaba iade edilir.' },
      ],
    },
  ];

  // --- PLAN 3: Kredi Kartı, Dinamik CVV & Sanal Kart Planı (8 Test Cases: MOB-TC-17..24) ---
  const plan3Definitions = [
    {
      code: 'MOB-TC-17',
      title: 'Dinamik CVV (60sn Süreli) ile Güvenli Dijital Sanal Kart Üretimi',
      description: 'Mobil şubeden her 60 saniyede bir CVV kodu değişen sanal kart oluşturulması.',
      suiteId: sMobCardsVirtual.id,
      priority: Priority.CRITICAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-301',
      screenshotUrl: cardScreenshot,
      steps: [
        { stepNumber: 1, action: 'Sanal Kart Oluştur seçilir.', expectedResult: 'Sanal kart üretilir ve dinamik sayaç başlar.' },
        { stepNumber: 2, action: '60sn beklenir.', expectedResult: 'CVV kodu otomatik olarak yeni rastgele 3 haneli koda döner.' },
      ],
    },
    {
      code: 'MOB-TC-18',
      title: 'Sanal Kart Harcama Limitinin Mobil Şubeden Anında Güncellenmesi',
      description: 'Sanal karta 10.000 TL limit atanması ve e-ticaret provizyon limitinin anında güncellenmesi.',
      suiteId: sMobCardsVirtual.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-302',
      screenshotUrl: cardScreenshot,
      steps: [
        { stepNumber: 1, action: 'Limit değiştir sliderından 10.000 TL seçilir.', expectedResult: 'CMS servisi güncellenir.' },
        { stepNumber: 2, action: 'Yeni limit kart ekranında görüntülenir.', expectedResult: 'Kullanılabilir limit 10.000 TL olur.' },
      ],
    },
    {
      code: 'MOB-TC-19',
      title: '3D Secure 2.2 BKM Doğrulama ve SMS OTP ile E-Ticaret Alışveriş Onayı',
      description: 'E-ticaret ödemesinde EMV 3DS iframe penceresinde SMS OTP ile provizyon alınması.',
      suiteId: sMobCards3DS.id,
      priority: Priority.BLOCKER,
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      jiraStoryKey: 'MOB-303',
      screenshotUrl: threeDsScreenshot,
      steps: [
        { stepNumber: 1, action: 'Amazon üzerinde kart bilgileri girilir.', expectedResult: 'BKM 3DS 2.2 onay modalı açılır.' },
        { stepNumber: 2, action: 'SMS ile gelen 841920 girilir.', expectedResult: '3DS ACS onay verir ve sipariş tamamlanır.' },
      ],
    },
    {
      code: 'MOB-TC-20',
      title: 'Dönem İçi Kredi Kartı Tek Çekim Harcamasını Sonradan Taksitlendirme',
      description: 'Peşin yapılan 6.000 TL harcamanın 3 veya 6 taksite bölünmesi.',
      suiteId: sMobCardsInstallments.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-304',
      steps: [
        { stepNumber: 1, action: 'Dönem içi harcama seçilip "Taksitlendir" tıklanır.', expectedResult: 'Taksit ve faiz tablosu gelir.' },
        { stepNumber: 2, action: '3 taksit seçilip onaylanır.', expectedResult: 'Gelecek ekstrelere taksitler işlenir.' },
      ],
    },
    {
      code: 'MOB-TC-21',
      title: 'Kredi Kartı Borcu Asgari / Toplam Tutar Ödeme ve Limit Yenileme',
      description: 'Vadesiz hesaptan kredi kartı borcunun ödenmesi ve anında kart limitinin açılması.',
      suiteId: sMobCardsInstallments.id,
      priority: Priority.CRITICAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-305',
      steps: [
        { stepNumber: 1, action: 'Kredi Kartı > Borç Öde > Toplam Borç seçilir.', expectedResult: 'Borç tutarı ve hesap seçilir.' },
        { stepNumber: 2, action: 'Ödeme onaylanır.', expectedResult: 'Kredi kartı kullanılabilir limiti anında artar.' },
      ],
    },
    {
      code: 'MOB-TC-22',
      title: 'Apple Pay / Google Wallet Dijital Cüzdan Kart Tokenizasyonu (MDES/VTS)',
      description: 'Kredi kartının tek tıkla Apple Wallet veya Google Wallet cüzdanına eklenmesi.',
      suiteId: sMobCardsVirtual.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.IOS,
      jiraStoryKey: 'MOB-306',
      steps: [
        { stepNumber: 1, action: '"Apple Wallet a Ekle" butonuna basılır.', expectedResult: 'PassKit API tokenizasyon isteği gönderir.' },
        { stepNumber: 2, action: 'Mastercard MDES şifreli token döner.', expectedResult: 'Kart Apple Wallet a eklenir.' },
      ],
    },
    {
      code: 'MOB-TC-23',
      title: 'Kredi Kartı Yurt Dışı ve İnternet Alışveriş Yetkilerini Açma / Kapama',
      description: 'Kart güvenlik ayarlarından e-ticaret ve yurt dışı POS izinlerinin tek tıkla yönetimi.',
      suiteId: sMobCardsVirtual.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-307',
      steps: [
        { stepNumber: 1, action: 'Yurt dışı kullanım switch i kapatılır.', expectedResult: 'Switch ayarı CMS de false yapılır.' },
        { stepNumber: 2, action: 'Yurt dışı POS tan deneme yapılır.', expectedResult: 'Yetki yok hatasıyla reddedilir.' },
      ],
    },
    {
      code: 'MOB-TC-24',
      title: 'Kayıp / Çalıntı Şüphesinde Kredi Kartını Geçici Olarak Dondurma',
      description: 'Müşterinin kartını anında geçici korumaya alması ve istediğinde tekrar açabilmesi.',
      suiteId: sMobCardsVirtual.id,
      priority: Priority.BLOCKER,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-308',
      steps: [
        { stepNumber: 1, action: '"Kartı Geçici Kilitle" seçilir.', expectedResult: 'Kart durumu SUSPENDED yapılır.' },
        { stepNumber: 2, action: 'Tüm harcama denemeleri engellenir.', expectedResult: 'Müşteriye SMS bilgilendirmesi iletilir.' },
      ],
    },
  ];

  // --- PLAN 4: Findeks Anında İhtiyaç Kredisi & Tahsis Planı (8 Test Cases: MOB-TC-25..32) ---
  const plan4Definitions = [
    {
      code: 'MOB-TC-25',
      title: 'Findeks Kredi Notu (1840 A+) ile ₺150.000 Anında İhtiyaç Kredisi Tahsisi',
      description: 'Findeks skoru üzerinden otomatik karar motorunun 150.000 TL krediyi anında onaylayıp hesaba aktarması.',
      suiteId: sMobLoansFindeks.id,
      priority: Priority.BLOCKER,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-401',
      screenshotUrl: loanScreenshot,
      steps: [
        { stepNumber: 1, action: '150.000 TL 24 ay kredi başvurusu yapılır.', expectedResult: 'Findeks SOAP servisi 1840 puan döner.' },
        { stepNumber: 2, action: 'Karar motoru A+ onay kararı üretir.', expectedResult: 'Aylık ₺8.420 taksit onaylanır.' },
        { stepNumber: 3, action: 'Sözleşme SMS ile onaylanır.', expectedResult: 'Tutar vadesiz hesaba aktarılır.' },
      ],
    },
    {
      code: 'MOB-TC-26',
      title: 'Orta Risk Grubu (Findeks 1200-1450) Müşteriler İçin Ek Gelir Belgesi Talep Akışı',
      description: 'Otomatik onay limitinin altındaki başvurularda SGK hizmet dökümü veya bordro yükleme akışının açılması.',
      suiteId: sMobLoansFindeks.id,
      priority: Priority.CRITICAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-402',
      steps: [
        { stepNumber: 1, action: 'Findeks skoru 1320 olan müşteri başvurur.', expectedResult: 'Karar motoru "MANUAL_REVIEW" kararı verir.' },
        { stepNumber: 2, action: 'Evrak yükleme ekranı açılır.', expectedResult: 'e-Devlet SGK barkodlu belge yüklenir.' },
      ],
    },
    {
      code: 'MOB-TC-27',
      title: 'Kredi Ödeme Planı (12/24/36 Ay) Simülasyonu, KKDF & BSMV Masraf Hesaplaması',
      description: 'Farklı vade ve faiz oranlarına göre yasal vergilerin ve taksit tutarlarının dinamik hesaplanması.',
      suiteId: sMobLoansInstant.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-403',
      steps: [
        { stepNumber: 1, action: 'Vade sliderı 12, 24 ve 36 ay olarak değiştirilir.', expectedResult: 'Taksit ve toplam faiz tablosu anında güncellenir.' },
        { stepNumber: 2, action: 'Maliyet detayları açılır.', expectedResult: 'KKDF (%15) ve BSMV (%5) dökümü listelenir.' },
      ],
    },
    {
      code: 'MOB-TC-28',
      title: 'Dijital Kredi Sözleşmesi ve Hayat Sigortası Poliçesi SMS OTP İmzası',
      description: 'Kredi sözleşmesi ve isteğe bağlı hayat sigortasının dijital onaylanması.',
      suiteId: sMobLoansInstant.id,
      priority: Priority.CRITICAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-404',
      steps: [
        { stepNumber: 1, action: 'Kredi sözleşmesi ve sigorta poliçesi incelenir.', expectedResult: 'PDF sözleşmeler onay kutuları açılır.' },
        { stepNumber: 2, action: 'SMS OTP şifresi girilir.', expectedResult: 'Zaman damgalı dijital imza atılır.' },
      ],
    },
    {
      code: 'MOB-TC-29',
      title: 'Onaylanan Kredi Tutarının Vadesiz TL Hesabına Anında Aktarımı ve Dekont Üretimi',
      description: 'Kredi tahsis tutarının 2 saniye içinde hesaba geçmesi ve muhasebeleştirilmesi.',
      suiteId: sMobLoansInstant.id,
      priority: Priority.BLOCKER,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-405',
      steps: [
        { stepNumber: 1, action: 'Kredi kullandırım butonuna basılır.', expectedResult: 'Core banking krediyi serbest bırakır.' },
        { stepNumber: 2, action: 'Vadesiz hesap bakiyesi kontrol edilir.', expectedResult: '150.000 TL bakiye eklenir ve e-Dekont üretilir.' },
      ],
    },
    {
      code: 'MOB-TC-30',
      title: 'Mevcut Kredi Kartı Limit Artış Talebinin Findeks Skoruyla Değerlendirilmesi',
      description: 'Kart limitini 50.000 TL den 120.000 TL ye yükseltme talebinin KKB limit kontrolünden geçmesi.',
      suiteId: sMobLoansFindeks.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-406',
      steps: [
        { stepNumber: 1, action: 'Kart Yönetimi > Limit Artır seçilir.', expectedResult: 'Mevcut toplam bankacılık kart limiti sorgulanır.' },
        { stepNumber: 2, action: 'Limit artışı onaylanır.', expectedResult: 'Kart limiti anında 120.000 TL olur.' },
      ],
    },
    {
      code: 'MOB-TC-31',
      title: 'Erken Kredi Kapama & Ara Ödemede İndirimli Faiz Hesaplaması',
      description: 'Kalan anaparanın erken ödenmesi durumunda faiz indiriminin yapılması.',
      suiteId: sMobLoansInstant.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-407',
      steps: [
        { stepNumber: 1, action: 'Kredi Detay > Erken Kapat seçilir.', expectedResult: 'Kalan gün faizi düşülerek net kapama tutarı hesaplanır.' },
        { stepNumber: 2, action: 'Kapama onaylanır.', expectedResult: 'Kredi hesabı kapanır ve borçsuzluk belgesi üretilir.' },
      ],
    },
    {
      code: 'MOB-TC-32',
      title: 'KKB / Findeks SOAP Servis Kesintisinde Güvenli Beklemeye Alma ve Fallback',
      description: 'Findeks servisi yanıt vermediğinde başvurunun kaybolmadan kuyruğa alınması ve müşteriye bilgi verilmesi.',
      suiteId: sMobLoansFindeks.id,
      priority: Priority.CRITICAL,
      executionType: 'AUTOMATED',
      type: TestType.API,
      jiraStoryKey: 'MOB-408',
      steps: [
        { stepNumber: 1, action: 'Findeks servisi HTTP 503 döndürür.', expectedResult: 'Başvuru QUEUED_RETRY durumuna alınır.' },
        { stepNumber: 2, action: 'Arayüzde bildirim gösterilir.', expectedResult: '"Talebiniz inceleniyor, sonuç SMS ile iletilecektir" mesajı çıkar.' },
      ],
    },
  ];

  // --- PLAN 5: QR Kod ile Kartsız ATM Para Çekme & Yatırma Planı (8 Test Cases: MOB-TC-33..40) ---
  const plan5Definitions = [
    {
      code: 'MOB-TC-33',
      title: 'Mobil Kamera ile ATM Dinamik QR Kod Okutularak ₺2.000 Kartsız Para Çekilmesi',
      description: 'ATM ekranındaki dinamik QR kodun taranması, FaceID doğrulaması ve ATM yuvasından paranın teslim alınması.',
      suiteId: sMobAtmQr.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-501',
      screenshotUrl: atmScreenshot,
      steps: [
        { stepNumber: 1, action: 'ATM de "QR ile Para Çek" seçilir.', expectedResult: '45sn lik dinamik QR kod üretilir.' },
        { stepNumber: 2, action: 'Mobil şube kamerasıyla taranıp 2.000 TL seçilir.', expectedResult: 'GPS mesafe doğrulaması (3.4m) başarılı olur.' },
        { stepNumber: 3, action: 'FaceID ile onaylanır.', expectedResult: 'ATM para çıkış yuvası açılır ve banknotlar verilir.' },
      ],
    },
    {
      code: 'MOB-TC-34',
      title: 'ATM QR Kod ile Hesaba Kartsız ₺10.000 Nakit Para Yatırma ve Anlık Bakiye Artışı',
      description: 'ATM para yatırma yuvasına konulan paranın sayılması ve vadesiz hesaba anında yatırılması.',
      suiteId: sMobAtmQr.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-502',
      steps: [
        { stepNumber: 1, action: 'ATM de "QR ile Para Yatır" seçilip QR okutulur.', expectedResult: 'ATM para yatırma yuvası açılır.' },
        { stepNumber: 2, action: '10.000 TL yatırılır ve ATM banknotları sayar.', expectedResult: 'Hesap bakiyesi anında 10.000 TL artar.' },
      ],
    },
    {
      code: 'MOB-TC-35',
      title: 'GPS Konum Doğrulaması: ATM Mesafesi > 50 Metre Olduğunda İşlemin Reddedilmesi',
      description: 'Güvenlik sahtekarlığını önlemek için kullanıcının ATM yakınında olmadığı durumlarda QR işleminin engellenmesi.',
      suiteId: sMobAtmQr.id,
      priority: Priority.CRITICAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-503',
      steps: [
        { stepNumber: 1, action: 'ATM den 400 metre mesafeden QR okutulur.', expectedResult: 'Geolocation motoru mesafe sapması tespit eder.' },
        { stepNumber: 2, action: 'İşlem engellenir.', expectedResult: '"ATM ye yeterince yakın değilsiniz" uyarısı verilir.' },
      ],
    },
    {
      code: 'MOB-TC-36',
      title: 'ATM Dinamik QR Kod Süresi (45sn) Dolduğunda Otomatik Güvenli İptal',
      description: '45 saniye boyunca taranmayan QR kodun zaman aşımına uğraması ve yenilenmesi.',
      suiteId: sMobAtmQr.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-504',
      steps: [
        { stepNumber: 1, action: 'ATM de QR üretilir ve 50 saniye beklenir.', expectedResult: 'QR kod süresi biter.' },
        { stepNumber: 2, action: 'Taranması denenir.', expectedResult: '"Karekod süresi doldu, lütfen yenileyin" hatası verir.' },
      ],
    },
    {
      code: 'MOB-TC-37',
      title: 'Günlük Kartsız ATM Para Çekme Limiti (₺20.000) Aşımı Kontrolü',
      description: 'Günlük belirlenen 20.000 TL kartsız çekim limitinin aşılması durumunda işlemin reddedilmesi.',
      suiteId: sMobAtmQr.id,
      priority: Priority.CRITICAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-505',
      steps: [
        { stepNumber: 1, action: 'Aynı gün içinde 22.000 TL kartsız çekim talep edilir.', expectedResult: 'Limit kontrol motoru devreye girer.' },
        { stepNumber: 2, action: 'İşlem iptal edilir.', expectedResult: 'Kalan günlük limit gösterilir.' },
      ],
    },
    {
      code: 'MOB-TC-38',
      title: 'ATM Banknot Sıkışması (Cash Jam) Durumunda Otomatik İade ve Alarm Kaydı',
      description: 'ATM donanımında para sıkışması olduğunda hesabın düşmemesi ve SIEM güvenlik kaydının düşmesi.',
      suiteId: sMobAtmQr.id,
      priority: Priority.BLOCKER,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-506',
      steps: [
        { stepNumber: 1, action: 'Para verme esnasında donanım arızası simüle edilir.', expectedResult: 'ATM sensörü sıkışma bayrağı döner.' },
        { stepNumber: 2, action: 'Hesap incelenir.', expectedResult: 'Bakiye anında iade edilir ve destek kaydı açılır.' },
      ],
    },
    {
      code: 'MOB-TC-39',
      title: 'En Yakın ATM / Şube Harita ve Rota Navigasyonunun Doğrulanması',
      description: 'Kullanıcının GPS konumuna göre en yakın NeoBank ve anlaşmalı ATM noktalarının listelenmesi.',
      suiteId: sMobAtmMap.id,
      priority: Priority.LOW,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-507',
      steps: [
        { stepNumber: 1, action: 'Mobil Şube > ATM / Şube Bulucu açılır.', expectedResult: 'Haritada yakındaki ATM ler pinlenir.' },
        { stepNumber: 2, action: 'ATM seçilip rota istenir.', expectedResult: 'Apple Maps / Google Maps rota yönlendirmesi açılır.' },
      ],
    },
    {
      code: 'MOB-TC-40',
      title: 'QR ile Döviz (USD / EUR) Vadesiz Hesabından Nakit Para Çekme',
      description: 'Döviz veren ATM lerden USD vadesiz hesaptan nakit USD banknot çekilmesi.',
      suiteId: sMobAtmQr.id,
      priority: Priority.NORMAL,
      executionType: 'AUTOMATED',
      type: TestType.MOBILE,
      jiraStoryKey: 'MOB-508',
      steps: [
        { stepNumber: 1, action: 'Döviz ATM sinde QR okutulur ve USD hesap seçilir.', expectedResult: 'Döviz banknot seçenekleri (100 USD) sunulur.' },
        { stepNumber: 2, action: '500 USD seçilip onaylanır.', expectedResult: '5 adet 100 USD teslim edilir.' },
      ],
    },
  ];

  // Tüm 40 senaryoyu oluştur
  const allMobDefinitions = [
    ...plan1Definitions,
    ...plan2Definitions,
    ...plan3Definitions,
    ...plan4Definitions,
    ...plan5Definitions,
  ];

  for (const def of allMobDefinitions) {
    const createdCase = await prisma.testCase.create({
      data: {
        code: def.code,
        title: def.title,
        description: def.description,
        executionType: def.executionType,
        type: def.type,
        priority: def.priority,
        projectId: projMob.id,
        suiteId: def.suiteId,
        jiraStoryKey: def.jiraStoryKey,
        jiraIssueUrl: `https://jira.bank.intra/browse/${def.jiraStoryKey}`,
        screenshotUrl: def.screenshotUrl || null,
        steps: {
          create: def.steps.map((s) => ({
            stepNumber: s.stepNumber,
            action: s.action,
            expectedResult: s.expectedResult,
            attachments: def.screenshotUrl
              ? JSON.stringify([{ id: `att-${def.code}`, url: def.screenshotUrl, comment: 'Test Adım Ekranı' }])
              : JSON.stringify([]),
          })),
        },
      },
    });
    mobCases.push(createdCase);
  }

  // =========================================================================
  // 10 ADET DUMMY TEST KOŞUMU (BANK-MOB İÇİN RASTGELE & GERÇEKÇİ DOĞRULUKLA)
  // =========================================================================
  console.log('🚀 Creating 10 Realistic Test Runs with varied accuracy across 5 plans...');

  const runConfigs = [
    {
      title: 'Mobil v4.8 Sprint 24 Onboarding & KYC Kabul Koşumu',
      version: 'v4.8.0',
      environment: 'STAGING',
      testPlanId: planMobKyc.id,
      executedBy: 'Ümit Sinanoğlu (Lead QA)',
      testerEmail: 'umit.sinanoglu@neobank.com',
      cases: mobCases.slice(0, 8), // MOB-TC-01..08
    },
    {
      title: 'iOS 18 Biyometrik Liveness & Görüntülü KYC Saha Doğrulama',
      version: 'v4.8.0',
      environment: 'PRODUCTION',
      testPlanId: planMobKyc.id,
      executedBy: 'Selin Kaya (Senior QA)',
      testerEmail: 'selin.kaya@neobank.com',
      cases: mobCases.slice(0, 8),
    },
    {
      title: 'TCMB FAST 7/24 Anlık Para Transferi Yük & Regresyon Koşumu',
      version: 'v4.8.0',
      environment: 'PRODUCTION',
      testPlanId: planMobFast.id,
      executedBy: 'Burak Demir (Fintech QA)',
      testerEmail: 'burak.demir@neobank.com',
      cases: mobCases.slice(8, 16), // MOB-TC-09..16
    },
    {
      title: 'KOLAS Kolay Adres & TR-Karekod Edge-Case Güvenlik Koşumu',
      version: 'v4.8.1-RC',
      environment: 'STAGING',
      testPlanId: planMobFast.id,
      executedBy: 'Burak Demir (Fintech QA)',
      testerEmail: 'burak.demir@neobank.com',
      cases: mobCases.slice(8, 16),
    },
    {
      title: 'Dinamik CVV, 3DS 2.2 & Sanal Kart Güvenlik Doğrulama Koşumu',
      version: 'v4.8.0',
      environment: 'STAGING',
      testPlanId: planMobCard.id,
      executedBy: 'Zeynep Kaya (Card QA)',
      testerEmail: 'zeynep.kaya@neobank.com',
      cases: mobCases.slice(16, 24), // MOB-TC-17..24
    },
    {
      title: 'Dijital Cüzdan (Apple Pay / Google Wallet) Lansman Koşumu',
      version: 'v4.8.1',
      environment: 'UAT',
      testPlanId: planMobCard.id,
      executedBy: 'Zeynep Kaya (Card QA)',
      testerEmail: 'zeynep.kaya@neobank.com',
      cases: mobCases.slice(16, 24),
    },
    {
      title: 'Findeks Otomatik Karar Motoru & Kredi Tahsis Koşumu',
      version: 'v4.8.2-RC',
      environment: 'STAGING',
      testPlanId: planMobLoan.id,
      executedBy: 'Mert Aksoy (Credit QA Lead)',
      testerEmail: 'mert.aksoy@neobank.com',
      cases: mobCases.slice(24, 32), // MOB-TC-25..32
    },
    {
      title: 'Kredi Erken Kapama, Faiz & BSMV Yasal Masraf Simülasyonu',
      version: 'v4.8.0',
      environment: 'PRODUCTION',
      testPlanId: planMobLoan.id,
      executedBy: 'Mert Aksoy (Credit QA Lead)',
      testerEmail: 'mert.aksoy@neobank.com',
      cases: mobCases.slice(24, 32),
    },
    {
      title: 'ATM Dinamik QR Kod ile Kartsız Para Çekme Saha Koşumu',
      version: 'v4.7.5',
      environment: 'PRODUCTION',
      testPlanId: planMobAtm.id,
      executedBy: 'Ümit Sinanoğlu (Lead QA)',
      testerEmail: 'umit.sinanoglu@neobank.com',
      cases: mobCases.slice(32, 40), // MOB-TC-33..40
    },
    {
      title: 'ATM Geolocation Mesafe, Banknot Sıkışması & Limit Stres Koşumu',
      version: 'v4.8.0',
      environment: 'STAGING',
      testPlanId: planMobAtm.id,
      executedBy: 'Selin Kaya (Senior QA)',
      testerEmail: 'selin.kaya@neobank.com',
      cases: mobCases.slice(32, 40),
    },
  ];

  const devices = [
    'iPhone 16 Pro Max (iOS 18.2)',
    'Samsung Galaxy S24 Ultra (Android 14)',
    'Google Pixel 8 Pro (Android 14)',
    'iPhone 15 Pro (iOS 17.5)',
    'Xiaomi 14 Ultra (HyperOS)',
  ];

  for (let runIdx = 0; runIdx < runConfigs.length; runIdx++) {
    const cfg = runConfigs[runIdx];
    const testRun = await prisma.testRun.create({
      data: {
        title: cfg.title,
        version: cfg.version,
        environment: cfg.environment,
        status: RunStatus.COMPLETED,
        executedBy: cfg.executedBy,
        testerEmail: cfg.testerEmail,
        projectId: projMob.id,
        testPlanId: cfg.testPlanId,
      },
    });

    const runResults: any[] = [];

    for (let cIdx = 0; cIdx < cfg.cases.length; cIdx++) {
      const tc = cfg.cases[cIdx];
      const device = devices[(runIdx + cIdx) % devices.length];
      const latency = Math.floor(Math.random() * 300) + 80;

      // Realistic accuracy: ~75% PASSED, ~15% FAILED, ~10% BLOCKED
      let status: ResultStatus = ResultStatus.PASSED;
      let errorMsg: string | null = null;
      let flakyStatus = 'STABLE';

      // Inject selective failures for realism
      if ((runIdx === 0 && cIdx === 5) || (runIdx === 3 && cIdx === 7) || (runIdx === 9 && cIdx === 2)) {
        status = ResultStatus.FAILED;
        flakyStatus = 'FLAKY';
        errorMsg =
          cIdx === 5
            ? 'OCR kamerası düşük ışıkta MRZ satırını okuyamadı (Doğruluk skoru: %58 < %70 eşik).'
            : cIdx === 7
            ? 'TCMB Takas Gateway 2500ms timeout süresini aştı, rollback mekanizması devreye girdi.'
            : 'ATM GPS mesafe sapması 62 metre olarak ölçüldü, güvenlik politikası gereği işlem reddedildi.';
      } else if (runIdx === 6 && cIdx === 7) {
        status = ResultStatus.BLOCKED;
        flakyStatus = 'STABLE';
        errorMsg = 'KKB Findeks test ortamı bakımda olduğu için mock fallback kuyruğunda bekletildi.';
      } else {
        errorMsg = 'Test adımları başarıyla tamamlandı, beklenen ve gerçekleşen sonuçlar tam eşleşti.';
      }

      runResults.push({
        testRunId: testRun.id,
        testCaseId: tc.id,
        status,
        executionMs: latency,
        executedBy: cfg.executedBy.split(' (')[0],
        testerEmail: cfg.testerEmail,
        environment: cfg.environment,
        platform: tc.type === 'WEB' ? 'WEB' : tc.type === 'API' ? 'API' : 'MOBILE',
        appVersion: cfg.version,
        device,
        userProfile: 'Bireysel Bankacılık Müşterisi',
        customerType: 'Bireysel',
        flakyStatus,
        retries: status === ResultStatus.FAILED ? 1 : 0,
        errorMessage: errorMsg,
        screenshotUrl: tc.screenshotUrl || null,
      });
    }

    await prisma.testResult.createMany({
      data: runResults,
    });
  }

  // =========================================================================
  // 2. PROJE 2: BANK-CORP — NeoBank Kurumsal İnternet Bankacılığı & Hazine (Web)
  // =========================================================================
  console.log('💻 [2/4] Seeding Project: BANK-CORP (Kurumsal İnternet Bankacılığı)...');
  const projCorp = await prisma.project.create({
    data: {
      name: 'NeoBank Kurumsal İnternet Bankacılığı & Hazine Portalı',
      key: 'BANK-CORP',
      description:
        'Kurumsal İnternet Bankacılığı, Çoklu Onay Mekanizmaları (Maker-Checker Çift Onay Matrisi), Toplu Maaş & Tedarikçi Transferleri (ISO 20022/Excel), GİB Vergi & SGK Kamu Ödemeleri, Kurumsal Hazine ve Dış Ticaret Akreditif Yönetimi.',
      jiraProjectKey: 'CORP',
    },
  });

  const planCorpApproval = await prisma.testPlan.create({
    data: {
      title: 'Kurumsal Portal v3.2 Çoklu Onay (Maker-Checker) & Yetkilendirme Kabul Planı',
      description: 'Hiyerarşik onay matrisi, 1. hazırlayıcı (Maker) ve 2. onaylayıcı (Checker) elektronik imza testleri.',
      version: 'v3.2.0',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'Maker-Checker Onay Motoru, Yetki Matrisi, E-İmza Modülü',
      requirements: 'CORP-101, CORP-104, BDDK-KURUMSAL-UYUM',
      projectId: projCorp.id,
    },
  });

  const planCorpPayroll = await prisma.testPlan.create({
    data: {
      title: 'Toplu Maaş & Tedarikçi Transferleri (ISO 20022 / Excel) Doğrulama Planı',
      description: 'Excel/XML/ISO 20022 formatında toplu ödeme dosyalarının yüklenmesi ve takası.',
      version: 'v3.2.0',
      environment: 'PRODUCTION',
      status: PlanStatus.COMPLETED,
      scope: 'Batch Payment Engine, Excel Parser, ISO 20022 pain.001 Gateway',
      requirements: 'CORP-201, CORP-206',
      projectId: projCorp.id,
    },
  });

  const sCorpApproval = await prisma.suite.create({
    data: { name: '👥 1. Yetkilendirme & Maker-Checker Onay Akışı', projectId: projCorp.id, orderIndex: 0 },
  });
  const sCorpPayroll = await prisma.suite.create({
    data: { name: '📁 2. Toplu Ödemeler & Maaş Bordro İşlemleri', projectId: projCorp.id, orderIndex: 1 },
  });

  const makerCheckerScreenshot = createMakerCheckerApprovalScreenshot({
    batchId: 'BATCH-2026-AUG-88194',
    companyName: 'Aksoy Holding A.Ş. (Vergi No: 0284910248)',
    creatorName: 'Ali Yılmaz (Kıdemli Muhasebe Uzmanı)',
    approverName: 'Mert Aksoy (CFO / 1. Derece İmza Yetkilisi)',
    totalAmount: '1.485.200,00',
    recipientCount: 42,
    status: 'APPROVED',
  });

  const tcCorp01 = await prisma.testCase.create({
    data: {
      code: 'CORP-TC-01',
      title: 'Kurumsal Toplu Maaş Transferinde Çift Onay (Maker-Checker) ve Mobil E-İmza Akışı',
      description: '42 kişilik 1.485.200 TL tutarındaki maaş dosyasının yüklenmesi ve CFO onayından geçmesi.',
      executionType: 'AUTOMATED',
      type: TestType.WEB,
      priority: Priority.BLOCKER,
      projectId: projCorp.id,
      suiteId: sCorpApproval.id,
      jiraStoryKey: 'CORP-101',
      jiraIssueUrl: 'https://jira.bank.intra/browse/CORP-101',
      screenshotUrl: makerCheckerScreenshot,
      steps: {
        create: [
          { stepNumber: 1, action: 'Bordro Excel yüklenir.', expectedResult: 'Pending Checker durumuna geçer.' },
          { stepNumber: 2, action: 'CFO mobil imza ile onaylar.', expectedResult: '42 işlem 1.2sn de takasa iletilir.' },
        ],
      },
    },
  });

  const runCorp1 = await prisma.testRun.create({
    data: {
      title: 'Kurumsal Portal v3.2 Maker-Checker & Toplu Ödeme Kabul Koşumu',
      version: 'v3.2.0',
      environment: 'PRODUCTION',
      status: RunStatus.COMPLETED,
      executedBy: 'Burak Demir (Corporate QA)',
      testerEmail: 'burak.demir@neobank.com',
      projectId: projCorp.id,
      testPlanId: planCorpApproval.id,
    },
  });

  await prisma.testResult.create({
    data: {
      testRunId: runCorp1.id,
      testCaseId: tcCorp01.id,
      status: ResultStatus.PASSED,
      executionMs: 1180,
      executedBy: 'Burak Demir',
      testerEmail: 'burak.demir@neobank.com',
      environment: 'PRODUCTION',
      platform: 'WEB',
      appVersion: 'v3.2.0',
      device: 'Chrome 128 (Windows 11 Enterprise)',
      userProfile: 'Kurumsal İmza Yetkilisi (CFO)',
      customerType: 'Kurumsal',
      flakyStatus: 'STABLE',
      errorMessage: '42 kişilik bordro çift onay ve mobil imza ile başarıyla ödendi.',
      screenshotUrl: makerCheckerScreenshot,
    },
  });

  // =========================================================================
  // 3. PROJE 3: BANK-API — Açık Bankacılık & Çekirdek Bankacılık Gateway (API)
  // =========================================================================
  console.log('🌐 [3/4] Seeding Project: BANK-API (Açık Bankacılık & API Gateway)...');
  const projApi = await prisma.project.create({
    data: {
      name: 'Açık Bankacılık & Çekirdek Bankacılık API Gateway',
      key: 'BANK-API',
      description:
        'BKM GEÇİT Açık Bankacılık (PSD2 AISP/PISP), TCMB FAST & BKM Switch ISO 20022 Mesajlaşma Gateway, KKB/Findeks & MERNIS/KPS Entegrasyonları, Core Banking Muhasebe & Masraf/Faiz Motoru.',
      jiraProjectKey: 'API',
    },
  });

  const planApiOpenBank = await prisma.testPlan.create({
    data: {
      title: 'Açık Bankacılık (BKM GEÇİT) Hesap & Ödeme Başlatma API v2.1 Planı',
      description: 'BKM GEÇİT üzerinden AISP ve PISP taleplerinin OAuth 2.0 mTLS ile testi.',
      version: 'v2.1.0',
      environment: 'STAGING',
      status: PlanStatus.ACTIVE,
      scope: 'BKM GEÇİT Gateway, AISP Engine, PISP Payment Initiation',
      requirements: 'API-101, API-105, BKM-GECIT-2024',
      projectId: projApi.id,
    },
  });

  const sApiOpenBank = await prisma.suite.create({
    data: { name: '🌐 1. BKM GEÇİT Açık Bankacılık API (AISP / PISP)', projectId: projApi.id, orderIndex: 0 },
  });

  const openBankScreenshot = createOpenBankingAPIScreenshot({
    endpoint: '/open-banking/v2.1/accounts/TR330006200000012345678901/balances',
    tppName: 'FintechPay Açık Bankacılık A.Ş. (Yetki: BKM-TPP-084)',
    consentId: 'CONSENT-2026-TR-88194',
    statusCode: 200,
    latencyMs: 78,
  });

  const tcApi01 = await prisma.testCase.create({
    data: {
      code: 'API-TC-01',
      title: 'BKM GEÇİT AISP: Yetkili TPP Tarafından mTLS ve Aktif Rıza ile Bakiye Sorgulama',
      description: 'AISP endpointine mTLS sertifikasıyla istek atılması ve bakiye alınması.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.BLOCKER,
      projectId: projApi.id,
      suiteId: sApiOpenBank.id,
      jiraStoryKey: 'API-101',
      jiraIssueUrl: 'https://jira.bank.intra/browse/API-101',
      screenshotUrl: openBankScreenshot,
      steps: {
        create: [
          { stepNumber: 1, action: 'GET /open-banking/v2.1/accounts çağrılır.', expectedResult: 'HTTP 200 OK döner.' },
        ],
      },
    },
  });

  const runApi1 = await prisma.testRun.create({
    data: {
      title: 'BKM GEÇİT Açık Bankacılık API Regresyon Koşumu',
      version: 'v2.1.0',
      environment: 'PRODUCTION',
      status: RunStatus.COMPLETED,
      executedBy: 'Selin Kaya (Lead QA)',
      testerEmail: 'selin.kaya@neobank.com',
      projectId: projApi.id,
      testPlanId: planApiOpenBank.id,
    },
  });

  await prisma.testResult.create({
    data: {
      testRunId: runApi1.id,
      testCaseId: tcApi01.id,
      status: ResultStatus.PASSED,
      executionMs: 78,
      executedBy: 'Selin Kaya',
      testerEmail: 'selin.kaya@neobank.com',
      environment: 'PRODUCTION',
      platform: 'API',
      appVersion: 'v2.1.0',
      device: 'BKM GEÇİT Gateway Proxy',
      userProfile: 'FintechPay AISP TPP Client',
      customerType: 'Kurumsal',
      flakyStatus: 'STABLE',
      errorMessage: 'BKM GEÇİT üzerinden bakiye sorgulama 78ms içinde başarıyla tamamlandı.',
      screenshotUrl: openBankScreenshot,
    },
  });

  // =========================================================================
  // 4. PROJE 4: BANK-SEC — Bankacılık Siber Güvenlik, AML & Sahtekarlık Önleme
  // =========================================================================
  console.log('🚨 [4/4] Seeding Project: BANK-SEC (Siber Güvenlik & AML/Fraud)...');
  const projSec = await prisma.project.create({
    data: {
      name: 'Bankacılık Siber Güvenlik, Fraud & AML Sahtekarlık Önleme Motoru',
      key: 'BANK-SEC',
      description:
        'Gerçek Zamanlı AI/ML Sahtekarlık (Fraud) Skorlama, MASAK & AML Kara Para Aklama Taraması, Coğrafi İmkansız Hız (Impossible Travel) Tespiti, PCI-DSS v4.0 HSM Şifreleme ve 3D Secure 2.2 ACS Doğrulama.',
      jiraProjectKey: 'SEC',
    },
  });

  const planSecFraud = await prisma.testPlan.create({
    data: {
      title: 'Gerçek Zamanlı AI/ML Sahtekarlık (Fraud) & İmkansız Hız (Impossible Travel) Planı',
      description: 'Şüpheli işlem izleme, imkansız hız (Impossible Travel) tespiti ve otomatik hesap blokesi.',
      version: 'v4.5.0',
      environment: 'PRODUCTION',
      status: PlanStatus.ACTIVE,
      scope: 'Fraud Detection Engine, Geo-IP Resolver, SIM Swap Validator',
      requirements: 'SEC-101, SEC-108, MASAK-AML-2024',
      projectId: projSec.id,
    },
  });

  const sSecFraud = await prisma.suite.create({
    data: { name: '🚨 1. Gerçek Zamanlı Fraud Skorlama Motoru', projectId: projSec.id, orderIndex: 0 },
  });

  const fraudScreenshot = createFraudAMLAlertScreenshot({
    alertId: 'SEC-AML-2026-98102',
    riskScore: 96,
    threatType: 'Coğrafi İmkansız Hız (Impossible Travel)',
    customerName: 'Ümit Sinanoğlu (ID: CUST-88412)',
    sourceLocation: 'İstanbul, Türkiye (IP: 176.240.12.8)',
    suspiciousLocation: 'Frankfurt, Almanya (IP: 194.26.29.11 - Tor Düğümü)',
    actionTaken: 'Hesap derhal geçici korumaya alındı, para çıkışları donduruldu, SMS teyit istendi.',
  });

  const tcSec01 = await prisma.testCase.create({
    data: {
      code: 'SEC-TC-01',
      title: 'Siber Güvenlik / AML: 4 Dakikada İstanbul-Frankfurt Girişinde (Impossible Travel) Otomatik Bloke',
      description: 'Ardışık farklı ülke girişlerinde Fraud motorunun işlemi engellemesi.',
      executionType: 'AUTOMATED',
      type: TestType.API,
      priority: Priority.BLOCKER,
      projectId: projSec.id,
      suiteId: sSecFraud.id,
      jiraStoryKey: 'SEC-101',
      jiraIssueUrl: 'https://jira.bank.intra/browse/SEC-101',
      screenshotUrl: fraudScreenshot,
      steps: {
        create: [
          { stepNumber: 1, action: 'İstanbul dan oturum açılır.', expectedResult: 'Token üretilir.' },
          { stepNumber: 2, action: '4 dk sonra Almanya Tor dan transfer denenir.', expectedResult: 'HTTP 403 ile hesap bloke edilir.' },
        ],
      },
    },
  });

  const runSec1 = await prisma.testRun.create({
    data: {
      title: 'Siber Güvenlik, AML & Coğrafi Fraud Risk Simülasyon Koşumu',
      version: 'v4.5.0',
      environment: 'PRODUCTION',
      status: RunStatus.COMPLETED,
      executedBy: 'Mert Aksoy (SecOps QA Lead)',
      testerEmail: 'mert.aksoy@neobank.com',
      projectId: projSec.id,
      testPlanId: planSecFraud.id,
    },
  });

  await prisma.testResult.create({
    data: {
      testRunId: runSec1.id,
      testCaseId: tcSec01.id,
      status: ResultStatus.PASSED,
      executionMs: 85,
      executedBy: 'Mert Aksoy',
      testerEmail: 'mert.aksoy@neobank.com',
      environment: 'PRODUCTION',
      platform: 'API',
      appVersion: 'v4.5.0',
      device: 'Kubernetes SecOps Pod (Linux)',
      userProfile: 'Fraud & AML Risk Denetçisi',
      customerType: 'Kurumsal',
      flakyStatus: 'STABLE',
      errorMessage: 'Impossible Travel anomalisinde hesap 85ms içinde donduruldu.',
      screenshotUrl: fraudScreenshot,
    },
  });

  console.log('✅ All 4 Digital Banking SDLC Projects Seeded with 40 Mobile Cases & 10 Runs Successfully!');
}
