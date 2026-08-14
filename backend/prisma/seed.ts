import { PrismaClient, TestType, Priority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing project data if present to allow re-seeding
  await prisma.project.deleteMany({ where: { key: 'ATOM' } });

  // Create sample project
  const project = await prisma.project.create({
    data: {
      name: 'ATOM E-Ticaret Otomasyon',
      key: 'ATOM',
      description: 'Web ve Mobil otomasyon test kütüphanesi',
      jiraProjectKey: 'ATOM',
    },
  });

  // Create Suites
  const authSuite = await prisma.suite.create({
    data: {
      name: 'Giriş & Üyelik İşlemleri',
      projectId: project.id,
      orderIndex: 0,
    },
  });

  const checkoutSuite = await prisma.suite.create({
    data: {
      name: 'Sepet & Ödeme Adımları',
      projectId: project.id,
      orderIndex: 1,
    },
  });

  // Sub suite under authSuite
  const resetPasswordSuite = await prisma.suite.create({
    data: {
      name: 'Şifre Sıfırlama Senaryoları',
      projectId: project.id,
      parentId: authSuite.id,
      orderIndex: 0,
    },
  });

  // Test Case 1
  await prisma.testCase.create({
    data: {
      code: 'ATOM-TC-1',
      title: 'Geçerli Kullanıcı Bilgileri ile Başarılı Giriş Yapma',
      description: 'Kullanıcının doğru e-posta ve şifre girdiğinde ana sayfaya yönlendirildiği doğrulanır.',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Kullanıcının sistemde aktif kaydı bulunmalıdır.',
      suiteId: authSuite.id,
      steps: {
        create: [
          { stepNumber: 1, action: 'https://example.com/login adresine gidilir.', expectedResult: 'Giriş formu ve e-posta/şifre alanları yüklenir.' },
          { stepNumber: 2, action: 'E-posta alanına "user@test.com" ve şifreye "Secret123!" yazılır.', expectedResult: 'Metin kutuları doldurulur.' },
          { stepNumber: 3, action: '"Giriş Yap" butonuna tıklanır.', expectedResult: 'Başarılı giriş mesajı ve kullanıcı paneli görüntülenir.' },
        ],
      },
    },
  });

  // Test Case 2
  await prisma.testCase.create({
    data: {
      code: 'ATOM-TC-2',
      title: 'Hatalı Şifre İle Giriş Denemesi Hata Mesajı Kontrolü',
      description: 'Yanlış şifre girildiğinde "Kullanıcı adı veya şifre hatalı" uyarısı vermelidir.',
      type: TestType.WEB,
      priority: Priority.BLOCKER,
      precondition: 'Giriş sayfasında olunmalıdır.',
      suiteId: authSuite.id,
      steps: {
        create: [
          { stepNumber: 1, action: 'Giriş ekranında geçerli e-posta ve yanlış şifre girilir.', expectedResult: 'Form doldurulur.' },
          { stepNumber: 2, action: '"Giriş Yap" butonuna tıklanır.', expectedResult: 'Kırmızı banner içinde hata mesajı görünür.' },
        ],
      },
    },
  });

  // Test Case 3
  await prisma.testCase.create({
    data: {
      code: 'ATOM-TC-3',
      title: 'Kredi Kartı İle 3D Secure Ödeme Tamamlama',
      description: 'Sepetteki ürünün 3D Secure doğrulaması ile satın alınması.',
      type: TestType.WEB,
      priority: Priority.CRITICAL,
      precondition: 'Sepette en az 1 ürün bulunmalı ve ödeme adımına geçilmiş olmalıdır.',
      suiteId: checkoutSuite.id,
      steps: {
        create: [
          { stepNumber: 1, action: 'Kart numarası, skt ve cvv girilir.', expectedResult: 'Kart bilgileri kabul edilir.' },
          { stepNumber: 2, action: '"Ödemeyi Tamamla" butonuna basılır.', expectedResult: 'Banka 3D Secure SMS doğrulama ekranı pop-up açılır.' },
          { stepNumber: 3, action: 'SMS doğrulama kodu (123456) girilip onaylanır.', expectedResult: 'Sipariş başarıyla oluşturuldu mesajı ve sipariş numarası gösterilir.' },
        ],
      },
    },
  });

  // Clean existing IOS project data if present to allow re-seeding
  await prisma.project.deleteMany({ where: { key: 'IOS' } });

  // Create IOS MOBİL TESTLER project
  const iosProject = await prisma.project.create({
    data: {
      name: 'IOS MOBİL TESTLER',
      key: 'IOS',
      description: 'iOS Mobil Uygulama Otomasyon Test Senaryoları',
      jiraProjectKey: 'IOS',
    },
  });

  // Create Suite under IOS MOBİL TESTLER
  const dovizSuite = await prisma.suite.create({
    data: {
      name: 'DÖVİZ İŞLEMLERİ',
      projectId: iosProject.id,
      orderIndex: 0,
    },
  });

  // Test Case 1: TG12_01_DovizIslemleri_AlSat_Arama
  await prisma.testCase.create({
    data: {
      code: 'IOS-TC-1',
      title: 'Döviz İşlemleri: Alış / Satış ekranında arama başarılı olmalıdır',
      description: 'Feature: Döviz İşlemleri Test Senaryoları\nTags: @TTB_Mobile_App_Test_Automation @TESTGROUP12 @IOS @Bireysel @Dövizİslemleri @Regression @Pozitif @TG12_01_DovizIslemleri_AlSat_Arama',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'TTB Mobil Uygulaması Başlatılır ve Kullanıcı Başarıyla Giriş Yapar',
      suiteId: dovizSuite.id,
      steps: {
        create: [
          { stepNumber: 1, action: 'Ana_Sayfa_Islemler_Butonu tıklanır', expectedResult: 'İşlemler menüsü açılır.' },
          { stepNumber: 2, action: '\'Yatırımlar\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Yatırımlar başlığı tıklanır ve menü açılır.' },
          { stepNumber: 3, action: '\'Döviz İşlemleri\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Döviz İşlemleri ekranı görüntülenir.' },
          { stepNumber: 4, action: '\'Döviz Alış / Satış\' textine sahip \'Buton\' tıklanır', expectedResult: 'Döviz Alış / Satış ekranı açılır.' },
          { stepNumber: 5, action: 'Arama_Kutusu alanına \'Avrupa\' yazılır', expectedResult: 'Arama kutusuna \'Avrupa\' metni yazılır.' },
          { stepNumber: 6, action: '\'EUR/TL\' texti ekranda görünmelidir', expectedResult: '\'EUR/TL\' texti ekranda görüntülenir.' },
          { stepNumber: 7, action: '\'USD/TL\' texti ekranda görünmemelidir', expectedResult: '\'USD/TL\' texti ekranda görünmez.' },
          { stepNumber: 8, action: 'Arama_Kutusu alanına \'Amerikan\' yazılır', expectedResult: 'Arama kutusuna \'Amerikan\' metni yazılır.' },
          { stepNumber: 9, action: '\'USD/TL\' texti ekranda görünmelidir', expectedResult: '\'USD/TL\' texti ekranda görüntülenir.' },
          { stepNumber: 10, action: '\'EUR/TL\' texti ekranda görünmemelidir', expectedResult: '\'EUR/TL\' texti ekranda görünmez.' },
        ],
      },
    },
  });

  // Test Case 2: TG12_02_DovizIslemleri_Alis_Islemi (EUR)
  await prisma.testCase.create({
    data: {
      code: 'IOS-TC-2',
      title: 'Döviz İşlemleri: EUR Alış işlemi yapılabilmelidir',
      description: 'Feature: Döviz İşlemleri Test Senaryoları\nTags: @TTB_Mobile_App_Test_Automation @TESTGROUP12 @IOS @Bireysel @DövizIslemleri @Regression @Pozitif @TG12_02_DovizIslemleri_Alis_Islemi',
      type: TestType.MOBILE,
      priority: Priority.CRITICAL,
      precondition: 'TTB Mobil Uygulaması Başlatılır ve Kullanıcı Başarıyla Giriş Yapar',
      suiteId: dovizSuite.id,
      steps: {
        create: [
          { stepNumber: 1, action: 'Ana_Sayfa_Islemler_Butonu tıklanır', expectedResult: 'İşlemler menüsü açılır.' },
          { stepNumber: 2, action: '\'Yatırımlar\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Yatırımlar menüsü açılır.' },
          { stepNumber: 3, action: '\'Döviz İşlemleri\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Döviz İşlemleri ekranı açılır.' },
          { stepNumber: 4, action: '\'Döviz Alış\' textini içeren \'Buton\' tıklanır', expectedResult: 'Döviz Alış ekranına yönlendirilir.' },
          { stepNumber: 5, action: 'EUR_Döviz_Al_Butonu tıklanır', expectedResult: 'EUR Döviz Al mevcuttur.' },
          { stepNumber: 6, action: '\'Paranın Çekileceği TL Hesap\' textine sahip \'Buton\' tıklanır', expectedResult: 'TL Hesap seçim listesi açılır.' },
          { stepNumber: 7, action: 'Hesap_Listesi_Birinci_Vadesiz_TL_Hesabı tıklanır', expectedResult: 'Birinci Vadesiz TL Hesabı seçilir.' },
          { stepNumber: 8, action: '\'Paranın Yatırılacağı Döviz Hesap\' textine sahip \'Buton\' tıklanır', expectedResult: 'Döviz Hesap seçim listesi açılır.' },
          { stepNumber: 9, action: '\'Hesap_Listesi_Birinci_Vadesiz_EUR_Hesabı\' kartına tıklanır', expectedResult: 'Birinci Vadesiz EUR Hesabı seçilir.' },
          { stepNumber: 10, action: '\'Satılacak Tutar\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Satılacak Tutar alanı aktifleşir.' },
          { stepNumber: 11, action: 'Döviz_Çevirici_Tutarı alanına \'1000\' yazılır', expectedResult: 'Tutar alanına \'1000\' yazılır.' },
          { stepNumber: 12, action: 'Uygulamanın stabil olması beklenir', expectedResult: 'Uygulama stabil hale gelir.' },
          { stepNumber: 13, action: '\'Devam\' textine sahip \'Buton\' tıklanır', expectedResult: 'Devam butonuna tıklanır.' },
          { stepNumber: 14, action: 'Uygulamanın stabil olması beklenir', expectedResult: 'Uygulama stabil hale gelir.' },
          { stepNumber: 15, action: 'Sayfa \'asagi\' yönde scroll edilir', expectedResult: 'Sayfa aşağı kaydırılır.' },
          { stepNumber: 16, action: '\'Devam\' textine sahip \'Buton\' tıklanır', expectedResult: 'Devam butonuna tıklanır.' },
          { stepNumber: 17, action: '\'Onayla\' textine sahip \'Buton\' tıklanır', expectedResult: 'Onayla butonuna tıklanır.' },
          { stepNumber: 18, action: '\'Döviz alış işleminiz başarıyla gerçekleşmiştir.\' texti ekranda görünmelidir', expectedResult: 'Başarı mesajı ekranda görüntülenir.' },
        ],
      },
    },
  });

  // Test Case 3: TG12_02_DovizIslemleri_Alis_Islemi (USD)
  await prisma.testCase.create({
    data: {
      code: 'IOS-TC-3',
      title: 'Döviz İşlemleri: USD Alış işlemi yapılabilmelidir',
      description: 'Feature: Döviz İşlemleri Test Senaryoları\nTags: @TTB_Mobile_App_Test_Automation @TESTGROUP12 @IOS @Bireysel @DövizIslemleri @Regression @Pozitif @TG12_02_DovizIslemleri_Alis_Islemi',
      type: TestType.MOBILE,
      priority: Priority.CRITICAL,
      precondition: 'TTB Mobil Uygulaması Başlatılır ve Kullanıcı Başarıyla Giriş Yapar',
      suiteId: dovizSuite.id,
      steps: {
        create: [
          { stepNumber: 1, action: 'Ana_Sayfa_Islemler_Butonu tıklanır', expectedResult: 'İşlemler menüsü açılır.' },
          { stepNumber: 2, action: '\'Yatırımlar\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Yatırımlar menüsü açılır.' },
          { stepNumber: 3, action: '\'Döviz İşlemleri\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Döviz İşlemleri ekranı açılır.' },
          { stepNumber: 4, action: '\'Döviz Alış\' textini içeren \'Buton\' tıklanır', expectedResult: 'Döviz Alış ekranına yönlendirilir.' },
          { stepNumber: 5, action: 'USD_Döviz_Al_Butonu tıklanır', expectedResult: 'USD Döviz Al mevcuttur.' },
          { stepNumber: 6, action: '\'Paranın Çekileceği TL Hesap\' textine sahip \'Buton\' tıklanır', expectedResult: 'TL Hesap seçim listesi açılır.' },
          { stepNumber: 7, action: 'Hesap_Listesi_Birinci_Vadesiz_TL_Hesabı tıklanır', expectedResult: 'Birinci Vadesiz TL Hesabı seçilir.' },
          { stepNumber: 8, action: '\'Paranın Yatırılacağı Döviz Hesap\' textine sahip \'Buton\' tıklanır', expectedResult: 'Döviz Hesap seçim listesi açılır.' },
          { stepNumber: 9, action: '\'Hesap_Listesi_Birinci_Vadesiz_USD_Hesabı\' kartına tıklanır', expectedResult: 'Birinci Vadesiz USD Hesabı seçilir.' },
          { stepNumber: 10, action: '\'Satılacak Tutar\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Satılacak Tutar alanı aktifleşir.' },
          { stepNumber: 11, action: 'Döviz_Çevirici_Tutarı alanına \'1000\' yazılır', expectedResult: 'Tutar alanına \'1000\' yazılır.' },
          { stepNumber: 12, action: 'Uygulamanın stabil olması beklenir', expectedResult: 'Uygulama stabil hale gelir.' },
          { stepNumber: 13, action: '\'Devam\' textine sahip \'Buton\' tıklanır', expectedResult: 'Devam butonuna tıklanır.' },
          { stepNumber: 14, action: 'Uygulamanın stabil olması beklenir', expectedResult: 'Uygulama stabil hale gelir.' },
          { stepNumber: 15, action: 'Sayfa \'asagi\' yönde scroll edilir', expectedResult: 'Sayfa aşağı kaydırılır.' },
          { stepNumber: 16, action: '\'Devam\' textine sahip \'Buton\' tıklanır', expectedResult: 'Devam butonuna tıklanır.' },
          { stepNumber: 17, action: '\'Onayla\' textine sahip \'Buton\' tıklanır', expectedResult: 'Onayla butonuna tıklanır.' },
          { stepNumber: 18, action: '\'Döviz alış işleminiz başarıyla gerçekleşmiştir.\' texti ekranda görünmelidir', expectedResult: 'Başarı mesajı ekranda görüntülenir.' },
        ],
      },
    },
  });

  // Test Case 4: TG12_03_DovizIslemleri_Satis_Islemi (EUR)
  await prisma.testCase.create({
    data: {
      code: 'IOS-TC-4',
      title: 'Döviz İşlemleri: EUR Satış işlemi yapılabilmelidir',
      description: 'Feature: Döviz İşlemleri Test Senaryoları\nTags: @TTB_Mobile_App_Test_Automation @TESTGROUP12 @IOS @Bireysel @DövizIslemleri @Regression @Pozitif @TG12_03_DovizIslemleri_Satis_Islemi',
      type: TestType.MOBILE,
      priority: Priority.CRITICAL,
      precondition: 'TTB Mobil Uygulaması Başlatılır ve Kullanıcı Başarıyla Giriş Yapar',
      suiteId: dovizSuite.id,
      steps: {
        create: [
          { stepNumber: 1, action: 'Ana_Sayfa_Islemler_Butonu tıklanır', expectedResult: 'İşlemler menüsü açılır.' },
          { stepNumber: 2, action: '\'Yatırımlar\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Yatırımlar menüsü açılır.' },
          { stepNumber: 3, action: '\'Döviz İşlemleri\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Döviz İşlemleri ekranı açılır.' },
          { stepNumber: 4, action: '\'Döviz Alış\' textini içeren \'Buton\' tıklanır', expectedResult: 'Döviz Alış ekranı açılır.' },
          { stepNumber: 5, action: 'Arama_Kutusu tıklanır', expectedResult: 'Arama kutusu odaklanır.' },
          { stepNumber: 6, action: 'Aktif Metin Alanına \'EUR\' değeri yazılır', expectedResult: '\'EUR\' değeri yazılır.' },
          { stepNumber: 7, action: '\'SAT\' textine sahip \'Butona\' tıklanır', expectedResult: 'SAT butonuna tıklanır.' },
          { stepNumber: 8, action: '\'Paranın Çekileceği Döviz Hesabı\' textine sahip \'Buton\' tıklanır', expectedResult: 'Döviz hesabı seçim listesi açılır.' },
          { stepNumber: 9, action: '\'Hesap_Listesi_Birinci_Vadesiz_EUR_Hesabı\' kartına tıklanır', expectedResult: 'Birinci Vadesiz EUR Hesabı seçilir.' },
          { stepNumber: 10, action: '\'Paranın Yatırılacağı TL Hesabı\' textine sahip \'Buton\' tıklanır', expectedResult: 'TL hesap seçim listesi açılır.' },
          { stepNumber: 11, action: 'Hesap_Listesi_Birinci_Vadesiz_TL_Hesabı tıklanır', expectedResult: 'Birinci Vadesiz TL Hesabı seçilir.' },
          { stepNumber: 12, action: '10 saniye beklenir', expectedResult: '10 saniye bekleme gerçekleşir.' },
          { stepNumber: 13, action: 'Satılacak Tutar Alanına \'10\' yazılır', expectedResult: 'Tutar alanına \'10\' yazılır.' },
          { stepNumber: 14, action: 'Uygulamanın stabil olması beklenir', expectedResult: 'Uygulama stabil hale gelir.' },
          { stepNumber: 15, action: '\'Devam\' textine sahip \'Buton\' tıklanır', expectedResult: 'Devam butonuna tıklanır.' },
          { stepNumber: 16, action: 'Sayfa \'asagi\' yönde scroll edilir', expectedResult: 'Sayfa aşağı kaydırılır.' },
          { stepNumber: 17, action: '\'Devam\' textine sahip \'Buton\' tıklanır', expectedResult: 'Devam butonuna tıklanır.' },
          { stepNumber: 18, action: '\'Döviz Cinsi\' texti ekranda görünmelidir', expectedResult: '\'Döviz Cinsi\' texti görüntülenir.' },
          { stepNumber: 19, action: '\'Banka Alış Kuru\' texti ekranda görünmelidir', expectedResult: '\'Banka Alış Kuru\' texti görüntülenir.' },
          { stepNumber: 20, action: '\'Bozduracağınız Döviz Tutarı\' texti ekranda görünmelidir', expectedResult: '\'Bozduracağınız Döviz Tutarı\' texti görüntülenir.' },
          { stepNumber: 21, action: '\'Alınacak Tutar\' texti ekranda görünmelidir', expectedResult: '\'Alınacak Tutar\' texti görüntülenir.' },
          { stepNumber: 22, action: 'Döviz satış ekranındaki "Alınacak Tutar" değerinin kur ve bozdurulan tutar ile doğru hesaplandığı doğrulanır', expectedResult: 'Hesaplamanın doğru olduğu doğrulanır.' },
          { stepNumber: 23, action: '\'Onayla\' textine sahip \'Buton\' tıklanır', expectedResult: 'Onayla butonuna tıklanır.' },
          { stepNumber: 24, action: '\'Döviz satış işleminiz başarıyla gerçekleşmiştir.\' texti ekranda görünmelidir', expectedResult: 'Başarı mesajı ekranda görüntülenir.' },
        ],
      },
    },
  });

  // Test Case 5: TG12_03_DovizIslemleri_Satis_Islemi (USD)
  await prisma.testCase.create({
    data: {
      code: 'IOS-TC-5',
      title: 'Döviz İşlemleri: USD Satış işlemi yapılabilmelidir',
      description: 'Feature: Döviz İşlemleri Test Senaryoları\nTags: @TTB_Mobile_App_Test_Automation @TESTGROUP12 @IOS @Bireysel @DövizIslemleri @Regression @Pozitif @TG12_03_DovizIslemleri_Satis_Islemi',
      type: TestType.MOBILE,
      priority: Priority.CRITICAL,
      precondition: 'TTB Mobil Uygulaması Başlatılır ve Kullanıcı Başarıyla Giriş Yapar',
      suiteId: dovizSuite.id,
      steps: {
        create: [
          { stepNumber: 1, action: 'Ana_Sayfa_Islemler_Butonu tıklanır', expectedResult: 'İşlemler menüsü açılır.' },
          { stepNumber: 2, action: '\'Yatırımlar\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Yatırımlar menüsü açılır.' },
          { stepNumber: 3, action: '\'Döviz İşlemleri\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Döviz İşlemleri ekranı açılır.' },
          { stepNumber: 4, action: '\'Döviz Alış\' textini içeren \'Buton\' tıklanır', expectedResult: 'Döviz Alış ekranı açılır.' },
          { stepNumber: 5, action: 'Arama_Kutusu tıklanır', expectedResult: 'Arama kutusu odaklanır.' },
          { stepNumber: 6, action: 'Aktif Metin Alanına \'USD\' değeri yazılır', expectedResult: '\'USD\' değeri yazılır.' },
          { stepNumber: 7, action: '\'SAT\' textine sahip \'Butona\' tıklanır', expectedResult: 'SAT butonuna tıklanır.' },
          { stepNumber: 8, action: '\'Paranın Çekileceği Döviz Hesabı\' textine sahip \'Buton\' tıklanır', expectedResult: 'Döviz hesabı seçim listesi açılır.' },
          { stepNumber: 9, action: '\'Hesap_Listesi_Birinci_Vadesiz_USD_Hesabı\' kartına tıklanır', expectedResult: 'Birinci Vadesiz USD Hesabı seçilir.' },
          { stepNumber: 10, action: '\'Paranın Yatırılacağı TL Hesabı\' textine sahip \'Buton\' tıklanır', expectedResult: 'TL hesap seçim listesi açılır.' },
          { stepNumber: 11, action: 'Hesap_Listesi_Birinci_Vadesiz_TL_Hesabı tıklanır', expectedResult: 'Birinci Vadesiz TL Hesabı seçilir.' },
          { stepNumber: 12, action: '10 saniye beklenir', expectedResult: '10 saniye bekleme gerçekleşir.' },
          { stepNumber: 13, action: 'Satılacak Tutar Alanına \'10\' yazılır', expectedResult: 'Tutar alanına \'10\' yazılır.' },
          { stepNumber: 14, action: 'Uygulamanın stabil olması beklenir', expectedResult: 'Uygulama stabil hale gelir.' },
          { stepNumber: 15, action: '\'Devam\' textine sahip \'Buton\' tıklanır', expectedResult: 'Devam butonuna tıklanır.' },
          { stepNumber: 16, action: 'Sayfa \'asagi\' yönde scroll edilir', expectedResult: 'Sayfa aşağı kaydırılır.' },
          { stepNumber: 17, action: '\'Devam\' textine sahip \'Buton\' tıklanır', expectedResult: 'Devam butonuna tıklanır.' },
          { stepNumber: 18, action: '\'Döviz Cinsi\' texti ekranda görünmelidir', expectedResult: '\'Döviz Cinsi\' texti görüntülenir.' },
          { stepNumber: 19, action: '\'Banka Alış Kuru\' texti ekranda görünmelidir', expectedResult: '\'Banka Alış Kuru\' texti görüntülenir.' },
          { stepNumber: 20, action: '\'Bozduracağınız Döviz Tutarı\' texti ekranda görünmelidir', expectedResult: '\'Bozduracağınız Döviz Tutarı\' texti görüntülenir.' },
          { stepNumber: 21, action: '\'Alınacak Tutar\' texti ekranda görünmelidir', expectedResult: '\'Alınacak Tutar\' texti görüntülenir.' },
          { stepNumber: 22, action: 'Döviz satış ekranındaki "Alınacak Tutar" değerinin kur ve bozdurulan tutar ile doğru hesaplandığı doğrulanır', expectedResult: 'Hesaplamanın doğru olduğu doğrulanır.' },
          { stepNumber: 23, action: '\'Onayla\' textine sahip \'Buton\' tıklanır', expectedResult: 'Onayla butonuna tıklanır.' },
          { stepNumber: 24, action: '\'Döviz satış işleminiz başarıyla gerçekleşmiştir.\' texti ekranda görünmelidir', expectedResult: 'Başarı mesajı ekranda görüntülenir.' },
        ],
      },
    },
  });

  // Test Case 6: TG12_04_DovizIslemleri_Doviz_Cevirici
  await prisma.testCase.create({
    data: {
      code: 'IOS-TC-6',
      title: 'Döviz İşlemleri: Döviz Çeviricide hesaplama başarılı olmalıdır',
      description: 'Feature: Döviz İşlemleri Test Senaryoları\nTags: @TTB_Mobile_App_Test_Automation @TESTGROUP12 @IOS @Bireysel @Dövizİslemleri @Regression @Pozitif @TG12_04_DovizIslemleri_Doviz_Cevirici',
      type: TestType.MOBILE,
      priority: Priority.NORMAL,
      precondition: 'TTB Mobil Uygulaması Başlatılır ve Kullanıcı Başarıyla Giriş Yapar',
      suiteId: dovizSuite.id,
      steps: {
        create: [
          { stepNumber: 1, action: 'Ana_Sayfa_Islemler_Butonu tıklanır', expectedResult: 'İşlemler menüsü açılır.' },
          { stepNumber: 2, action: '\'Yatırımlar\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Yatırımlar menüsü açılır.' },
          { stepNumber: 3, action: '\'Döviz İşlemleri\' textine sahip \'Başlık\' tıklanır', expectedResult: 'Döviz İşlemleri ekranı açılır.' },
          { stepNumber: 4, action: '\'Döviz Çevirici\' textine sahip \'Buton\' tıklanır', expectedResult: 'Döviz Çevirici ekranı açılır.' },
          { stepNumber: 5, action: 'Döviz_Çevirici_Tutar_Alanı alanına \'50000\' yazılır', expectedResult: 'Tutar alanına \'50000\' yazılır.' },
          { stepNumber: 6, action: 'Döviz_Çevirici_Switch_Butonu tıklanır', expectedResult: 'Döviz Çevirici switch butonu tıklanır.' },
          { stepNumber: 7, action: 'Döviz_Çevirici_Switch_Butonu tıklanır', expectedResult: 'Döviz Çevirici switch mevcuttur.' },
          { stepNumber: 8, action: '\'0,00\' texti ekranda görünmemelidir', expectedResult: '\'0,00\' texti ekranda görünmez.' },
        ],
      },
    },
  });


  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
