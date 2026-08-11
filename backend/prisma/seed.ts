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
