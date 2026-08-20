# Changelog

All notable changes to the **TCMS (Test Case Management System)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed
- Top navigation sağ üst alana Swagger Docs butonu eklendi
- **Değişiklikleri Kaydet & Koşum Geçmişi Koruma Düzeltmesi**: `TestCasesService.update` backend metoduna `results` ve `testRun` ilişkileri dahil edildi ve `page.tsx`'teki `handleSaveCase`, `handleQuickRunSuccess` ile `ManualRunModal` `onClose` akışları iyileştirildi; böylece bir test senaryosunda değişiklik kaydedildiğinde veya yeni bir koşu yapıldığında tüm önceki koşum kayıtları, test notları ve ekran görüntüleri eksiksiz korunarak anında güncellenmesi sağlandı.
- **Test Koşum Geçmişi ve Kanıt Görselleri Düzeltmesi**: `ProjectsService.getTree` API'sindeki `take: 1` sınırlandırması kaldırılarak ve `testRun` ilişkisi dahil edilerek tüm geçmiş koşuların (`results`), koşu başlıklarının (`testRun.title`), bağımsız test notlarının/yorumlarının ve kanıt ekran görüntülerinin (`screenshotUrl`) `TestCaseEditor` içindeki "Koşum Geçmişi & Tüm Tekrar Koşuları" bölümünde eksiksiz görüntülenmesi ve Lightbox ile büyütülebilmesi sağlandı.
- Navigasyon geçmişi yöneticisinde (`NavigationContext`) state kilitlenmesi ve closure gecikmesi giderildi; senkron ref takibi ve akıllı fallback mekanizması ile "Geri" butonunun tüm sayfalarda kesintisiz çalışması sağlandı.
- Dashboard üzerindeki Suite klasör kartlarına ("123", "abc", "Data" vb.) tıklandığında veya "Klasörü Aç" butonuna basıldığında ilgili Suite görünümüne girilmesi ve Suite içinde alt klasörlerin (sub-suites) hiyerarşik kartlar olarak gösterilmesi sağlandı.
- Fix QuickRun DTO validation 500 error, test case code collision logic, and implement full Test Plan CRUD with EditProjectModal
- Sol navigasyon tree klasör sürükle-bırak marifetleri iyileştirildi: Kök seviyeye (ana dizine) taşıma alanı eklendi ve döngüsel sürükleme koruması sağlandı.

### Changed
- Tema seçici ikon görünümüne getirildi, Swagger butonu kompakt yapıldı, basit login (standart şifre: password1234, 24 saat session) eklendi, profil switch kaldırıldı, kullanıcı yönetimi sadece adminlere kısıtlandı, Yeni Test Planı butonu sol menü altına taşındı
- Kök test case'ler ağaç yapısında en üstte gösterildi, suite altındaki case'ler bir tık girintiyle (indent) netleştirildi
- Sol menü (AppSidebar) item yerleşimleri sola yaslandı, girintiler optimize edildi ve menü genişliği ferahlatıldı
- **Test Case Koştur Modalı Yatay (Landscape) 2 Sütunlu Yerleşim**: QuickRunModal dikey sıkışık formdan çıkarılarak geniş yatay (max-w-5xl/6xl) 2 sütunlu ergonomik bir yerleşime geçirildi. Sol tarafta Test Case bilgileri, versiyon/ortam parametreleri ve kaydırılabilir test adımları/beklenen sonuçlar; sağ tarafta ise sonuç durumu kartları, koşu notları, Jira Mock entegrasyonu ve çoklu ekran görüntüsü kanıt yükleme alanı ayrıştırılarak kullanım kolaylığı sağlandı.
- **Test Case Buton İsimlendirmesi**: Test Case detay editöründeki (TestCaseEditor) 'Run Case' butonu 'Test Case Koştur' olarak güncellendi.
- **Test Koşuları Sayfası Başlık Butonları**: Test Koşumları sayfasının sağ üst kısmında yer alan "Yeni Manuel Koşu" ve "Otomasyon API Entegrasyonu" butonları kaldırıldı.
- **Test Planı Başlığı**: Dashboard ve Header başlıkları seçili Test Planı adına (`[KEY] Plan Adı`) dinamik olarak bağlandı.
- **Test Koşuları Sayfası Revizyonu**: Test Koşuları tablosuna ve detay modalına test case'lerin bağlı olduğu **Ebeveyn Nesne / Modül (Parent Suite)** ve **Ürün Tipi (WEB, MOBILE, IOS, ANDROID, API)** sütunları ve rozetleri eklendi.
- Sol üstteki genel geri butonu kaldırıldı; test planı etiket alanı yerine arama destekli, açılır menülü ve hızlı geçiş sağlayan Test Planı Navigasyon Combobox bileşeni entegre edildi.
- Revised UI Design System, Theme Tokens, and AI Rules to Enterprise SDLC Edition v2.
- Top navigasyon header sadeleştirildi, 2. görseldeki minimalist tasarıma uyarlanarak gereksiz butonlar kaldırıldı.
- Header top navigation menu update with Project Combobox, Explorer tab, and Quick Action buttons with empty database support.
- Arayüz genelinde Test Senaryosu ve Senaryo terimleri 'Test Case' olarak standartlaştırıldı.
- Manual Execution Dashboard (Manuel Test Koşum Paneli) modalı Türkçe diline çevrildi ve tema ile tam uyumlu hale getirildi.

### Added
- Faz 1 Rol Bazlı Kullanıcı Yönetimi (RBAC) ve Ekran Yetkilendirme Çerçevesi
- Dinamik Database Environment desteği eklendi (ENVIRONMENT=supabase / ENVIRONMENT=local)
- Kapsamlı kurumsal dummy test verisi (6 proje, 40+ suite, 120+ test case, 20+ test run) eklendi
- **Test Case Koştur (QuickRunModal) Çoklu Ekran Görüntüsü & Skipped/Blocked Yorum Desteği**: Hızlı test koşturma modalına birden fazla ekran görüntüsü/kanıt yükleme (çoklu dosya seçimi ve panodan `Ctrl+V` ile yapıştırma), galeri görünümü, görsel silme/ekleme ve tam ekran Lightbox carousel desteği eklendi. Ayrıca SKIPPED (Atlanma) ve BLOCKED (Engellenme) durumları için detaylı açıklama/yorum giriş alanları entegre edildi.
- **Test Plan 1, 2 ve 3 Kapsamlı Test Verileri & Koşum Geçmişi**: Uygulama testi için 3 farklı domainde (Web E-Ticaret Platformu [TP1], Mobil Bankacılık & Finansal İşlemler [TP2], B2B API Gateway & Entegrasyon Servisleri [TP3]) toplam 24 Suite/Sub-suite, 30 detaylı Test Case (adım adımlı adımlar, ön koşullar, Jira anahtarları, WEB/MOBILE/IOS/ANDROID/API/PERFORMANCE tipleri) ve 9 farklı Test Koşumu ile Passed/Failed/Blocked/Skipped koşum sonuçları yüklendi.
- **Bağımsız Test Koşum Kayıtları & Koşum Geçmişi**: Her bir test koşumu bağımsız bir kayıt olarak geçmişte tutulacak şekilde backend ve frontend güncellendi; her koşum için bağımsız koşu notu/yorumu, kanıt ekran görüntüsü (lightbox önizlemeli), tester ve yürütme detayları TestCaseEditor "Koşum Geçmişi & Tüm Tekrar Koşuları" bölümünde listelendi.
- **Kalıcı & Daralabilir Sol Gezgin Menüsü (`AppSidebar`)**: Tüm sayfalarda (`Dashboard`, `Explorer`, `Test Koşuları`) solda sabit kalan, daralıp genişleyebilen (`w-16` / `w-84`), `Test Planı veya anahtar ara` anlık arama filtreli, `[1] 123`, `[A] abc`, `[P] Plan` formatında rozetli plan kartları ve `Test Planları → Test Suite → Case` hiyerarşik ağaç yapısına sahip birleşik sol menü geliştirildi.
- **Test Adımlarına Çoklu Ekran Görüntüsü & Yorum Desteği**: Her bir test adımına birden fazla ekran görüntüsü (maksimum 10 adet, dosya başı 5MB limiti, PNG/JPG/WebP/GIF dosya tipi ve boyut denetimi) ekleme, her görselin altına özel yorum/açıklama satırı girme, panodan doğrudan görsel yapıştırma (`Ctrl + V`), tam ekran inceleme (Lightbox) ve koşum ekranlarında adım referans görsellerini görüntüleme desteği entegre edildi.
- Uygulama geneline "Geri" (Back) ve "İleri" (Forward) navigasyon geçmişi yöneticisi (NavigationContext), Header ve ekran içi (TestCaseEditor, SuiteCasesView) geri butonları ile klavye kısayolu (Alt+Sol Ok) entegrasyonu eklendi.
- Başarılı (PASSED) ve engellenen (BLOCKED) test koşularına da kanıt ekran görüntüsü ekleme desteği eklendi (QuickRunModal & ManualRunModal). Panodan doğrudan görsel yapıştırma (`Ctrl + V` / `Cmd + V`), tam ekran inceleme (Lightbox) ve görsel düzenleme/silme fonksiyonları entegre edildi.
- Resmi Türk Ticaret Bankası ana logo ve amblemi sisteme entegre edildi; Koyu ve Açık temalara göre otomatik dinamik renk geçişi (Coral Red & White / Corporate Red) sağlandı.
- Kapsamlı Raporlama Katmanı (Reporting Layer) ve çok formatlı (CSV, HTML, PDF/Yazdır, JSON) rapor çıkarma özellikleri eklendi.
- Test Case'lerin bir Suite'e bagli kalmadan dogrudan Test Plani altinda olusturulabilmesi ve yonetilebilmesi destegi eklendi.
- Test Case niteliklerinde Manuel/Otomasyon ve dinamik Test Tipi ayrimi, Dashboard Yeni Suite Ekle butonu, Yeni Case Ekle baglam fixi ve Suite hiyerarsi duzeltmesi.
- Top Dashboard Left Projects Navigation Sidebar and Repeat Test Suite/Case Execution with Run History
- Header logo link to Top Dashboard, ThemeSelector overflow/z-index fixes, and Suite test cases Card View
- **AI Agent Context Infrastructure**:
  - `AGENTS.md`: Guidelines and rapid project overview for AI agents.
  - `PROJECT_CONTEXT.md`: High-density architectural and schema snapshot.
  - `scripts/generate_vector_context.py`: Tool to extract code chunks and metadata into `project_vector_context.json` for RAG/Vector stores.
- **Changelog Tracking System**:
  - `CHANGELOG.md`: Structured change history tracker.
  - `scripts/update_changelog.py`: Helper CLI script for adding categorized changelog entries.
- **Clean Restart Logic**: Updated `restart.sh` to clear stale Next.js build caches before launching services.

---

## [1.0.0] - 2026-08-14

### Added
- **Core Backend Service (NestJS & Prisma)**:
  - Database schema models: `Project`, `Suite`, `TestCase`, `TestRun`, `TestResult`, `Tag`.
  - Modules & Controllers for Projects, Suites, Test Cases, and Test Runs management.
  - SQLite database integration via Prisma ORM.
- **Modern Web Frontend (Next.js 14 & Tailwind CSS)**:
  - Interactive Suite & Test Case Explorer Tree view.
  - Test Suite & Test Case Creation & Modification Modals.
  - Test Run Execution Modals (Manual & Quick Run) with step status tracking (Passed, Failed, Blocked, Skipped).
  - Test Execution Dashboard with metrics and visual status breakdowns.
  - Theme Selector supporting Dark, Light, and Glassmorphism themes.
- **Process & Orchestration Scripts**:
  - `start.sh`, `stop.sh`, and `restart.sh` helper scripts for dual-service lifecycle management.
