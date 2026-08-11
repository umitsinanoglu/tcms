# TMS Geliştirme Planı — Basit TestCase/Scenario Bazlı Execution + Jira Ready

Mevcut teknoloji kararlarını koruyarak basit, sürdürülebilir ve ileride genişletilebilir bir Test Management System (TMS) geliştir.

## 1. Teknoloji Mimarisi

* Database: Local PostgreSQL
* ORM: Prisma
* Backend: Node.js + TypeScript + NestJS
* API: REST API
* API Documentation: OpenAPI 3.0 / Swagger
* Frontend: Next.js App Router + TypeScript
* UI: Tailwind CSS + shadcn/ui
* API Client: Axios veya native Fetch

Temel geliştirme yaklaşımı:

> **DB-First + Jira Ready + TestCase/Scenario seviyesinde execution**

Sistem ilk aşamada mümkün olduğunca basit tutulmalıdır. Gereksiz Jira API entegrasyonu, step-level execution, karmaşık workflow ve gelişmiş raporlama MVP kapsamına alınmamalıdır.

---

# 2. Temel Kavramsal Model

Sistemde test senaryosu ile test koşumu birbirinden ayrılmalıdır.

```text
Project
   │
   └── Suite
        │
        └── TestCase
             │
             ├── TestStep
             └── TestResult
                    │
                    └── TestRun
```

### Önemli karar

**TestStep yalnızca test senaryosunun tanımıdır.**

Test execution sırasında ayrı bir `TestStepResult` oluşturulmayacaktır.

Örneğin:

```text
TestCase: MOB-TC-102

Steps:
1. Login ekranını aç
2. Kullanıcı adı ve şifreyi gir
3. Login butonuna tıkla
4. Dashboard'ın açıldığını doğrula

Execution Result:
FAILED
```

Sonuç test case/senaryo seviyesinde tutulur.

`TestResult` içerisinde hangi step'in başarısız olduğu tutulmayacaktır.

Ancak `errorMessage` veya `actualResult` gibi genel bir açıklama alanı bulunabilir.

---

# 3. Prisma Veri Modeli

Aşağıdaki modelleri oluştur:

## Project

```prisma
model Project {
  id             String     @id @default(uuid())
  name           String
  key            String
  description    String?
  jiraProjectKey String?
  createdAt      DateTime   @default(now())

  suites         Suite[]
  testRuns       TestRun[]
}
```

## Suite

Suite yapısı klasör ağacını desteklemelidir.

```prisma
model Suite {
  id         String   @id @default(uuid())
  name       String
  projectId  String
  project    Project  @relation(fields: [projectId], references: [id])

  parentId   String?
  parent     Suite?   @relation("SuiteToSuite", fields: [parentId], references: [id])
  children   Suite[]  @relation("SuiteToSuite")

  cases      TestCase[]
  orderIndex Int      @default(0)
}
```

## TestCase

TestCase sistemin temel test senaryosu varlığıdır.

```prisma
model TestCase {
  id           String       @id @default(uuid())
  code         String
  title        String
  description  String?
  type         TestType
  priority     Priority
  precondition String?

  suiteId      String
  suite        Suite        @relation(fields: [suiteId], references: [id])

  steps        TestStep[]
  results      TestResult[]

  // Jira Ready
  jiraStoryKey String?
  jiraIssueUrl String?
}
```

## TestStep

Step'ler yalnızca test senaryosunun tanımıdır.

```prisma
model TestStep {
  id             String   @id @default(uuid())
  stepNumber     Int
  action         String
  expectedResult String

  testCaseId     String
  testCase       TestCase @relation(
    fields: [testCaseId],
    references: [id],
    onDelete: Cascade
  )
}
```

**TestStepResult modeli oluşturma.**

---

# 4. TestRun

TestRun, belirli bir zamanda yapılan test koşumunu temsil eder.

```prisma
model TestRun {
  id          String     @id @default(uuid())
  title       String

  version     String
  environment String

  status      RunStatus  @default(IN_PROGRESS)

  executedBy  String
  testerEmail String

  projectId   String
  project     Project    @relation(fields: [projectId], references: [id])

  results     TestResult[]

  createdAt   DateTime   @default(now())
}
```

`RunStatus`:

```prisma
enum RunStatus {
  IN_PROGRESS
  COMPLETED
  ABORTED
}
```

---

# 5. TestResult

Her test case'in belirli bir test run içerisindeki sonucunu temsil eder.

```prisma
model TestResult {
  id           String       @id @default(uuid())

  testRunId    String
  testRun      TestRun      @relation(fields: [testRunId], references: [id])

  testCaseId   String
  testCase     TestCase     @relation(fields: [testCaseId], references: [id])

  status       ResultStatus

  executionMs  Int?
  errorMessage String?

  executedBy   String?
  testerEmail  String?

  // Jira Ready
  jiraBugKey   String?
  jiraBugUrl   String?

  executedAt   DateTime     @default(now())
}
```

Sonuç enum'u:

```prisma
enum ResultStatus {
  PASSED
  FAILED
  SKIPPED
  BLOCKED
}
```

Test türleri:

```prisma
enum TestType {
  WEB
  MOBILE
  API
  MANUAL
}
```

Öncelikler:

```prisma
enum Priority {
  BLOCKER
  CRITICAL
  NORMAL
  LOW
}
```

---

# 6. Execution Mantığı

İlk versiyonda execution yalnızca **TestCase seviyesinde** çalışmalıdır.

Örnek:

```text
Sprint 24 Regression Run

MOB-TC-101    Login successfully        PASSED
MOB-TC-102    Invalid password          FAILED
MOB-TC-103    Forgot password           SKIPPED
MOB-TC-104    Logout                     BLOCKED
```

Her satır bir `TestResult` oluşturur.

Test adımlarının tek tek PASS/FAIL durumu tutulmaz.

---

# 7. Backend Modülleri

NestJS içerisinde aşağıdaki modülleri oluştur:

### Core

* PrismaModule
* PrismaService

### Project

* ProjectsModule
* ProjectsController
* ProjectsService

### Suite

* SuitesModule
* SuitesController
* SuitesService

### TestCase

* TestCasesModule
* TestCasesController
* TestCasesService

### TestRun / Execution

* TestRunsModule
* TestRunsController
* TestRunsService

### Swagger

`main.ts` içerisinde OpenAPI/Swagger kurulumu yap.

Tüm DTO'larda:

* `class-validator`
* `@ApiProperty`
* `@ApiTags`
* uygun HTTP response dekoratörleri

kullan.

---

# 8. Temel REST API'ler

## Projects

```text
POST   /api/v1/projects
GET    /api/v1/projects
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id
DELETE /api/v1/projects/:id
```

## Suites

```text
POST   /api/v1/projects/:projectId/suites
PATCH  /api/v1/suites/:id
DELETE /api/v1/suites/:id
```

Suite için `parentId` ve `orderIndex` desteklenmelidir.

## TestCases

```text
POST   /api/v1/suites/:suiteId/test-cases
GET    /api/v1/test-cases/:id
PATCH  /api/v1/test-cases/:id
DELETE /api/v1/test-cases/:id
```

TestCase oluşturma/güncelleme sırasında TestStep'ler de yönetilebilmelidir.

---

# 9. Tree API

Aşağıdaki endpoint oluştur:

```text
GET /api/v1/projects/:projectId/tree
```

Örnek yapı:

```json
{
  "project": {
    "id": "xxx",
    "name": "Mobile Banking"
  },
  "children": [
    {
      "type": "suite",
      "name": "Login",
      "children": [
        {
          "type": "testCase",
          "code": "MOB-TC-101",
          "title": "Successful Login",
          "jiraStoryKey": "MOB-402"
        }
      ]
    }
  ]
}
```

Suite hiyerarşisi desteklenmelidir.

TestCase içerisinde Jira bilgisi varsa `jiraStoryKey` döndürülmelidir.

---

# 10. Jira Ready

İlk versiyonda gerçek Jira REST API entegrasyonu yapılmayacaktır.

Ancak sistem Jira entegrasyonuna hazır tasarlanmalıdır.

TestCase:

```text
jiraStoryKey
jiraIssueUrl
```

TestResult:

```text
jiraBugKey
jiraBugUrl
```

alanlarını içermelidir.

Project:

```text
jiraProjectKey
```

alanını içermelidir.

---

# 11. Jira Story Mapping API

```text
PATCH /api/v1/test-cases/:id/jira-link
```

Bu endpoint:

* Jira Story key eklemeli
* mevcut key'i güncelleyebilmeli
* mapping kaldırılabilmeli

Örnek:

```json
{
  "jiraStoryKey": "MOB-402"
}
```

Frontend tarafında Jira URL'si oluşturulabilir.

Örneğin:

```text
https://company.atlassian.net/browse/MOB-402
```

Jira Base URL şimdilik configuration/env üzerinden yönetilebilir.

Gerçek Jira API çağrısı yapılmayacaktır.

---

# 12. Test Run Oluşturma

Manuel execution başlatıldığında yeni bir `TestRun` oluşturulmalıdır.

Örnek:

```json
{
  "title": "Sprint 24 Regression",
  "version": "v2.4.0-rc1",
  "environment": "STAGING",
  "executedBy": "Ahmet Yılmaz",
  "testerEmail": "ahmet.yilmaz@sirket.com"
}
```

Endpoint:

```text
POST /api/v1/projects/:projectId/runs
```

Bu işlem sonucunda `IN_PROGRESS` durumunda bir TestRun oluşturulur.

---

# 13. Test Run Execution

TestRun içerisinde projeye ait TestCase'ler listelenir.

Kullanıcı her TestCase için:

```text
PASS
FAIL
SKIPPED
BLOCKED
```

sonuçlarından birini seçebilir.

Örnek:

```text
┌─────────────────────────────────────────────┐
│ Sprint 24 Regression                        │
│ v2.4.0-rc1 | STAGING | Ahmet Yılmaz        │
├─────────────────────────────────────────────┤
│                                             │
│ MOB-TC-101                                  │
│ Successful Login                            │
│                                             │
│ [ PASS ] [ FAIL ] [ SKIP ] [ BLOCKED ]     │
│                                             │
├─────────────────────────────────────────────┤
│ MOB-TC-102                                  │
│ Invalid Password                            │
│                                             │
│ [ PASS ] [ FAIL ] [ SKIP ] [ BLOCKED ]     │
└─────────────────────────────────────────────┘
```

**Step'ler bu ekranda ayrı ayrı execute edilmeyecektir.**

Kullanıcı TestCase'i değerlendirerek tek bir sonuç verir.

---

# 14. Failed TestCase

Bir TestCase `FAILED` olduğunda:

```text
Status: FAILED
```

ve isteğe bağlı olarak:

```text
Error Message
```

girilebilir.

Örneğin:

```json
{
  "testCaseId": "xxx",
  "status": "FAILED",
  "errorMessage": "Login button does not respond"
}
```

İlk versiyonda failed step tutulmayacaktır.

---

# 15. Jira Bug

Failed TestCase üzerinde:

```text
Create Jira Bug
```

aksiyonu gösterilebilir.

İlk versiyonda gerçek Jira API kullanılmayacaktır.

Mock/placeholder akışı yeterlidir.

Örneğin kullanıcı:

```text
Create Jira Bug
```

dediğinde:

```text
Jira Bug Key:
MOB-550

Jira Bug URL:
https://company.atlassian.net/browse/MOB-550
```

bilgilerini TestResult üzerine kaydedebilmelidir.

İleride bu mekanizma Jira REST API ile değiştirilecektir.

---

# 16. Execution API

Test sonuçlarının kaydedilmesi için:

```text
POST /api/v1/projects/:projectId/runs/:runId/results
```

endpoint'i oluştur.

Örnek:

```json
{
  "results": [
    {
      "testCaseId": "case-101",
      "status": "PASSED",
      "executionMs": 1200
    },
    {
      "testCaseId": "case-102",
      "status": "FAILED",
      "errorMessage": "Login button does not respond",
      "jiraBugKey": "MOB-550",
      "jiraBugUrl": "https://company.atlassian.net/browse/MOB-550"
    }
  ]
}
```

Sonuçlar `TestResult` tablosuna kaydedilmelidir.

---

# 17. Test Run Tamamlama

Test koşumu tamamlandığında:

```text
PATCH /api/v1/runs/:runId/complete
```

endpoint'i kullanılabilir.

TestRun:

```text
IN_PROGRESS
      ↓
COMPLETED
```

ve kullanıcı koşumu yarıda bırakırsa:

```text
IN_PROGRESS
      ↓
ABORTED
```

olabilir.

---

# 18. Frontend

Next.js + shadcn/ui ile aşağıdaki temel ekranları oluştur.

## Project Explorer

Sol tarafta:

```text
Projects
 └── Mobile Banking
      ├── Login
      │    ├── MOB-TC-101
      │    └── MOB-TC-102
      ├── Payments
      │    ├── MOB-TC-103
      │    └── MOB-TC-104
      └── Logout
```

göster.

İlk versiyonda drag & drop zorunlu değildir.

Öncelik:

> doğru tree yapısı + doğru CRUD.

---

# 19. TestCase Editor

Seçilen TestCase için:

* Code
* Title
* Description
* Type
* Priority
* Preconditions
* Steps
* Jira Story Key
* Jira URL

göster.

Step editörü:

```text
Step | Action | Expected Result
```

formatında olabilir.

Ancak bu step'ler sadece test senaryosunun tanımıdır.

---

# 20. Traceability

Basit bir filtreleme görünümü oluştur:

```text
[ All ]

[ Jira Linked ]

[ Jira Not Linked ]
```

Örneğin:

| Test Case  | Title         | Jira    | Last Result  |
| ---------- | ------------- | ------- | ------------ |
| MOB-TC-101 | Login         | MOB-402 | PASS         |
| MOB-TC-102 | Invalid Login | MOB-403 | FAIL         |
| MOB-TC-103 | Logout        | —       | NOT EXECUTED |

Bu görünüm ilk aşamada yeterlidir.

---

# 21. Execution Dashboard

Manuel execution ekranında:

```text
Run
Version
Environment
Tester
```

bilgileri üst bölümde göster.

Alt bölümde TestCase'ler listelensin.

Her TestCase için:

```text
PASS
FAIL
SKIPPED
BLOCKED
```

butonları bulunsun.

`FAILED` seçildiğinde:

```text
Error Message
Create Jira Bug
```

alanları gösterilebilir.

---

# 22. MVP Kapsamı Dışında Tutulacaklar

İlk versiyonda aşağıdakileri geliştirme:

* TestStepResult
* Step-level execution
* Jira REST API
* Jira OAuth/API authentication
* Jira Webhook
* Jira → TMS synchronization
* otomatik Jira Bug oluşturma
* gelişmiş RTM
* gelişmiş dashboard/analytics
* test execution history karşılaştırmaları
* test case versioning
* approval workflow
* attachment management
* gelişmiş permission/role sistemi

Bunlar ileride ayrı fazlar olarak eklenebilir.

---

# 23. Geliştirme Önceliği

Aşağıdaki sırayı takip et:

### Phase 1 — Database

1. Prisma schema
2. PostgreSQL connection
3. Migration
4. Prisma Client

### Phase 2 — Backend Core

5. NestJS modules
6. Project CRUD
7. Suite CRUD
8. TestCase CRUD
9. TestStep CRUD
10. Swagger

### Phase 3 — Tree

11. Project tree API
12. Nested Suite structure
13. TestCase tree nodes

### Phase 4 — Execution

14. TestRun creation
15. TestCase-level TestResult
16. PASS/FAIL/SKIPPED/BLOCKED
17. Complete / Abort Run

### Phase 5 — Jira Ready

18. Jira Story mapping
19. Jira Bug fields
20. Jira link UI
21. Mock Create Jira Bug

### Phase 6 — Frontend

22. Project Explorer
23. TestCase Editor
24. Execution Dashboard
25. Traceability View

---

# 24. Temel Tasarım İlkesi

Bu MVP'nin temel prensibi:

> **Önce basit ve doğru bir Test Management System oluştur. Jira'yı sistemin merkezine koyma; yalnızca traceability katmanı olarak konumlandır.**

İlişki:

```text
Jira Requirement
       ↕
   TestCase
       ↓
   TestRun
       ↓
   TestResult
       ↓
   Jira Bug
```

olmalıdır.

TestStep'ler yalnızca TestCase'in içeriğini tanımlar:

```text
TestCase
 ├── Step 1
 ├── Step 2
 ├── Step 3
 └── Step 4

       ↓ EXECUTION

TestResult
 └── PASSED / FAILED / SKIPPED / BLOCKED
```

Bu aşamada **step-level execution kesinlikle uygulanmayacaktır.**

Ama veri modeli ileride bu özelliğin eklenmesine engel olacak şekilde tasarlanmamalıdır.
