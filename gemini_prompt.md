### Mimarinin Temel Kararları

* **Database:** PostgreSQL (Local)
* **ORM:** Prisma
* **Backend:** Node.js (TypeScript / NestJS)
* **Documentation & API Standard:** OpenAPI 3.0 (Swagger)
* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui

---

### AI Agent İçin Adım Adım Prompt Setleri

#### 1. ADIM: Database & Prisma ORM Kurulumu (DB-First)

> **AI Agent Prompt - Adım 1:**
> "Local PostgreSQL veritabanımız üzerinde çalışacak bir Test Yönetim Sistemi (TMS) geliştiriyoruz. İlk olarak DB-First yaklaşımıyla Prisma ORM modellerini oluşturacağız.
> Lütfen aşağıdaki varlıkları (entities) ve aralarındaki ilişkileri içeren `schema.prisma` dosyasını oluştur:
> 1. **Project:** `id` (uuid), `name`, `key` (örn: 'PRJ', 'ATOM'), `description`, `createdAt`, `updatedAt`.
> 2. **Suite (Klasör Ağacı):** Self-referencing hiyerarşi (`parentId` -> `parent/children`). `id`, `name`, `projectId`, `orderIndex` (sıralama için).
> 3. **TestCase:** `id`, `code` (Auto-generated: `PRJ-TC-1`, `PRJ-TC-2` biçiminde), `title`, `description`, `type` (Enum: WEB, MOBILE, API, MANUAL), `priority` (Enum: BLOCKER, CRITICAL, NORMAL, LOW), `preconditions`, `suiteId`.
> 4. **TestStep:** `id`, `stepNumber`, `action`, `expectedResult`, `testCaseId` (Cascade delete).
> 5. **TestRun:** `id`, `title`, `environment` (STAGING, PROD vb.), `status` (IN_PROGRESS, COMPLETED), `projectId`, `createdAt`.
> 6. **TestResult:** `id`, `testRunId`, `testCaseId`, `status` (PASSED, FAILED, SKIPPED, BLOCKED), `executionTimeMs`, `errorMessage`, `stackTrace`, `executedAt`.
> 
> 
> İlişkileri ve `onDelete: Cascade` kurallarını doğru tanımla. Local PostgreSQL connection string (`DATABASE_URL`) için `.env.example` hazırla ve migration oluşturma komutunu sağla."

---

#### 2. ADIM: NestJS Backend Yapısı ve Core CRUD Modülleri

> **AI Agent Prompt - Adım 2:**
> "Şimdi NestJS projesini oluşturacağız ve Prisma Client entegrasyonunu tamamlayacağız.
> Lütfen şu modülleri ve mimari bileşenleri oluştur:
> 1. **PrismaModule & PrismaService:** Global Prisma veritabanı bağlantı servisi.
> 2. **Projects Module:** CRUD servisleri ve controller'ı.
> 3. **Suites Module:** Suite ekleme, silme, güncelleme ve yer değiştirme (`orderIndex` ve `parentId` güncelleme) servisleri.
> 4. **TestCases Module:** Step'ler ile birlikte Case oluşturma, güncelleme ve tekil detay getirme servisleri.
> 5. **OpenAPI / Swagger Setup:** `main.ts` içinde `@nestjs/swagger` kurulumunu yap. Tüm DTO'lar için `class-validator` ve Swagger dekoratörlerini (`@ApiProperty`, `@ApiTags` vb.) eksiksiz ekle."
> 
> 

---

#### 3. ADIM: Hiyerarşik Ağaç Yapısı ve Otomasyon Entegrasyon Endpoint'leri

> **AI Agent Prompt - Adım 3:**
> "Backend tarafında test otomasyon araçlarının ve UI'ın kullanacağı iki kritik servisi geliştir:
> 1. **Tree API (`GET /api/v1/projects/:projectId/tree`):**
> * Seçili projeye ait tüm Suite ve TestCase'leri, klasör derinliği sınırı olmadan iç içe geçmiş (nested tree) JSON formatında tek seferde yüksek performansla döndüren bir servis yaz.
> 
> 
> 2. **Execution / Automation Results API (`POST /api/v1/projects/:projectId/runs`):**
> * Selenium, Playwright, Cypress, Appium veya Postman gibi otomasyon araçlarının doğrudan koşu sonucu atabilmesi için endpoint tasarla.
> * DTO yapısı toplu sonuç kabul etmeli (`results: [{ caseCode: 'PRJ-TC-1', status: 'PASSED', durationMs: 450 }]`).
> * Bu endpoint otomatik olarak yeni bir `TestRun` kaydı açmalı ve içindeki sonuçları `TestResult` tablosuna işlemeli.
> * Swagger üzerinde bu endpoint'in cURL örneğini ve istek body şemasını açıkça dökümante et."
> 
> 
> 
> 

---

#### 4. ADIM: Frontend (Next.js + Tailwind + shadcn/ui)

> **AI Agent Prompt - Adım 4:**
> "Backend ve OpenAPI dokümantasyonumuz hazır olduğuna göre Next.js (App Router) frontend uygulamasını geliştirmeye geçebiliriz.
> Tasarım Şartları:
> * **Styling & UI Components:** Tailwind CSS ve shadcn/ui.
> * **Layout:**
> * **Sol Panel (Explorer):** Proje seçimi ve backend'deki `/tree` API'sinden gelen sürükle-bırak destekli (örn: `@hello-pangea/dnd` veya `@dnd-kit`) Suite/Case ağaç yapısı.
> * **Orta Panel (Editor):** Ağaçtan seçilen TestCase'in detayları, ön koşulları ve adımlarının (Step No, Action, Expected Result) hızlıca düzenlenebildiği minimalist tablo/form.
> * **Üst Bar:** Yeni Suite/Case ekleme butonları ve Swagger API dokümantasyonuna yönlendiren hızlı bağlantı.
> 
> 
> 
> 
> Lütfen API istekleri için `Axios` veya `Fetch` sarmalayıcısı (client-side API service) oluşturarak backend servisleriyle entegrasyonu tamamla."

---

#### 5. ADIM: Manuel Test Koşu Modu (Fast Execution Dashboard)

> **AI Agent Prompt - Adım 5:**
> "Arayüze manuel test yapan QA, Dev veya Analistlerin hızlıca test koşabileceği bir **Execution Dashboard** ekle.
> Özellikler:
> 1. Bir Test Suite seçilip 'Run Manual Test' istendiğinde bir modal/overlay açılsın.
> 2. Ekranın ortasında sırayla TestCase adımları görünsün.
> 3. Kullanıcı klavye kısayolları (Örn: `P` -> Pass, `F` -> Fail) veya butonlarla adımları saniyeler içinde işaretleyebilsin.
> 4. Koşu bittiğinde backend'deki `POST /runs` endpoint'ine sonucu göndersin ve başarı oranını gösteren özet grafiği üretsin."
> 
>