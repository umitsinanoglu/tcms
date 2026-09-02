# 🚀 Test Otomasyon Merkezi & TCMS Entegrasyon Kılavuzu (API & Webhook)

Bu doküman, **Test Otomasyon Merkezi (Harici Otomasyon Projesi)** ile **TCMS (Test Case Management System)** arasındaki çift yönlü (bi-directional) entegrasyonu kurmanız için gereken tüm API ve Webhook standartlarını içerir.

---

## 🧭 Mimari ve Veri Akışı

```mermaid
sequenceDiagram
    autonumber
    actor QA as QA / Tester / CI/CD
    participant TCMS as TCMS (Port 3000 / 3001)
    participant TOM as Test Otomasyon Merkezi (External)

    Note over TCMS, TOM: 1. AŞAMA: Otomasyonu Tetikleme (Outbound Webhook)
    QA->>TCMS: "⚡ Otomasyonu Tetikle (Webhook)" butonuna basar
    TCMS->>TCMS: IN_PROGRESS statüsünde TestRun oluşturur
    TCMS->>TOM: POST {TOM_WEBHOOK_URL} (testRunId, caseCodes, environment, callbackUrl)
    TOM-->>TCMS: 200 OK (Koşu Kabul Edildi & Başlatıldı)

    Note over TOM, TCMS: 2. AŞAMA: Testlerin Koşulması ve Sonuç Aktarımı (Inbound Ingestion)
    TOM->>TOM: Selenium / Playwright / Cypress / PyTest testlerini koşar
    TOM->>TCMS: POST /api/v1/projects/:projectId/runs/automation (Test Sonuçları, Base64 Ekran Görüntüleri, Jira ID)
    TCMS-->>TOM: 201 Created (Sonuçlar ve İstatistikler Kaydedildi)
    TCMS->>QA: Dashboard, Runs & Defect modüllerinde canlı güncellenir
```

---

## 📚 Canlı Swagger / OpenAPI Erişimi

Backend ayağa kalktığında interaktif dokümantasyona ve otomatik istemci kod üretimi için JSON şemasına aşağıdaki adreslerden erişebilirsiniz:

- **Swagger UI:** [`http://localhost:3001/api/docs`](http://localhost:3001/api/docs)
- **OpenAPI JSON Şeması:** [`http://localhost:3001/api/docs-json`](http://localhost:3001/api/docs-json)

> **💡 İpucu (Client Generator):** Diğer projenizde (Python, Java, TypeScript, C# vb.) `openapi-generator-cli` veya `orval` kullanarak OpenAPI şemasından otomatik API Client kütüphanesi türetebilirsiniz:
> ```bash
> npx @openapitools/openapi-generator-cli generate -i http://localhost:3001/api/docs-json -g typescript-axios -o ./src/tcms-client
> ```

---

## 🔌 1. TCMS'ten Test Otomasyon Merkezini Tetikleme (Outbound Webhook)

TCMS arayüzündeki **"⚡ Otomasyonu Tetikle (Webhook)"** butonu veya doğrudan REST API çağrısı ile Test Otomasyon Merkezi projenize bir HTTP POST sinyali fırlatılır.

### TCMS Webhook Tetikleme API'si
- **Metot:** `POST`
- **URL:** `http://localhost:3001/api/v1/projects/{projectId}/webhooks/trigger`
- **Header:** `Content-Type: application/json`

#### TCMS'e Gönderilecek Tetikleme İsteği:
```json
{
  "webhookUrl": "http://localhost:8000/api/webhook/trigger",
  "title": "Nightly Regression Suite #104",
  "environment": "STAGING",
  "version": "v2.4.0",
  "scope": "ALL",
  "secretToken": "your-secure-shared-secret"
}
```

#### Test Otomasyon Merkezine Ulaşacak Webhook Payload'ı:
```json
{
  "event": "AUTOMATION_TRIGGER",
  "project": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "key": "MOB",
    "name": "Mobil Bankacılık"
  },
  "testRun": {
    "id": "run-uuid-998877",
    "title": "Nightly Regression Suite #104",
    "environment": "STAGING",
    "version": "v2.4.0",
    "status": "IN_PROGRESS"
  },
  "scope": "ALL",
  "caseCodes": ["MOB-TC-1", "MOB-TC-2", "MOB-TC-3"],
  "triggeredBy": "Ahmet Yılmaz",
  "callbackUrl": "http://localhost:3001/api/v1/projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/runs/automation",
  "timestamp": "2026-08-28T09:00:00.000Z"
}
```

---

## 📥 2. Test Sonuçlarını TCMS'e Aktarma (Ingestion API)

Test Otomasyon Merkezi testleri tamamladığında, sonuçları TCMS'e tek bir istek ile toplu olarak aktarır.

- **Metot:** `POST`
- **URL:** `http://localhost:3001/api/v1/projects/{projectId}/runs/automation`
- **Header Bilgileri:**
  - `Content-Type: application/json`
  - `x-user-name`: `Automation Bot` *(Opsiyonel)*
  - `x-user-role`: `TESTER` *(Opsiyonel)*

### JSON İstek Gövdesi (Payload):
```json
{
  "title": "Playwright Regression Run - Build #84",
  "version": "v2.4.0-rc1",
  "environment": "STAGING",
  "executedBy": "Playwright CI Runner",
  "testerEmail": "automation@ttb.com.tr",
  "results": [
    {
      "caseCode": "MOB-TC-1",
      "status": "PASSED",
      "durationMs": 420
    },
    {
      "caseCode": "MOB-TC-2",
      "status": "FAILED",
      "durationMs": 1350,
      "errorMessage": "AssertionError: Element '#login-btn' did not appear within 5000ms timeout",
      "screenshotUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "jiraBugKey": "MOB-991",
      "jiraBugUrl": "https://company.atlassian.net/browse/MOB-991"
    },
    {
      "caseCode": "MOB-TC-3",
      "status": "SKIPPED",
      "durationMs": 0,
      "errorMessage": "Skipped due to dependency MOB-TC-2 failure"
    }
  ]
}
```

### Alan Açıklamaları:
| Alan | Tip | Zorunlu? | Açıklama |
| :--- | :--- | :---: | :--- |
| `title` | `string` | Hayır | Koşu başlığı (Boş ise otomatik oluşturulur) |
| `version` | `string` | Hayır | Test edilen sürüm / build no (Varsayılan: `v1.0.0`) |
| `environment` | `string` | Hayır | Test ortamı (`DEV`, `STAGING`, `UAT`, `PROD`) |
| `executedBy` | `string` | Hayır | Koşuyu gerçekleştiren kişi veya bot adı |
| `testerEmail`| `string` | Hayır | Bildirimler ve loglar için e-posta |
| `results` | `array` | **Evet** | Test senaryosu sonuçları dizisi |
| `results[].caseCode` | `string` | **Evet** | TCMS'teki Test Case Kodu (örn. `MOB-TC-1`) |
| `results[].status` | `enum` | **Evet** | Durum: `PASSED`, `FAILED`, `SKIPPED`, `BLOCKED` |
| `results[].durationMs` | `number` | Hayır | Milisaniye cinsinden çalışma süresi |
| `results[].errorMessage`| `string` | Hayır | Hata/Stacktrace detayı (FAILED için) |
| `results[].screenshotUrl`| `string`| Hayır | Ekran görüntüsü URL'i veya `data:image/png;base64,...` formatında veri |
| `results[].jiraBugKey` | `string` | Hayır | İlgili Jira hata anahtarı (örn. `MOB-991`) |

---

## 💻 Hazır Entegrasyon Kodları (Code Snippets)

### A) Python (PyTest / Selenium / Robot Framework)
```python
import requests

def report_to_tcms(project_id: str, test_results: list, run_title: str = "PyTest Run"):
    tcms_url = f"http://localhost:3001/api/v1/projects/{project_id}/runs/automation"
    
    headers = {
        "Content-Type": "application/json",
        "x-user-name": "PyTest Bot",
        "x-user-role": "TESTER"
    }
    
    payload = {
        "title": run_title,
        "environment": "STAGING",
        "version": "v1.2.0",
        "executedBy": "PyTest Automation Runner",
        "testerEmail": "qa-automation@ttb.com.tr",
        "results": test_results
    }
    
    response = requests.post(tcms_url, json=payload, headers=headers, timeout=30)
    response.raise_for_status()
    print("✅ TCMS'e sonuçlar başarıyla aktarıldı:", response.json().get("id"))
    return response.json()

# Örnek Kullanım:
if __name__ == "__main__":
    results = [
        {"caseCode": "MOB-TC-1", "status": "PASSED", "durationMs": 350},
        {"caseCode": "MOB-TC-2", "status": "FAILED", "durationMs": 1200, "errorMessage": "Element not clickable"}
    ]
    report_to_tcms("PROJECT_UUID_BURAYA", results)
```

---

### B) TypeScript / JavaScript (Playwright / Cypress Reporter)
```typescript
import axios from 'axios';

export async function sendResultsToTCMS(
  projectId: string,
  results: Array<{
    caseCode: string;
    status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED';
    durationMs?: number;
    errorMessage?: string;
    screenshotUrl?: string;
  }>
) {
  const url = `http://localhost:3001/api/v1/projects/${projectId}/runs/automation`;

  const payload = {
    title: `Playwright CI Run - ${new Date().toISOString()}`,
    environment: process.env.TEST_ENV || 'STAGING',
    version: process.env.APP_VERSION || 'v1.0.0',
    executedBy: 'Playwright Reporter Bot',
    results,
  };

  const response = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-name': 'Playwright Runner',
      'x-user-role': 'TESTER',
    },
  });

  console.log('✅ TCMS Koşusu Kaydedildi:', response.data.id);
  return response.data;
}
```

---

### C) Java (JUnit 5 / TestNG / RestAssured)
```java
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import java.util.*;

public class TCMSReporter {
    public static void reportResults(String projectId, List<Map<String, Object>> results) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "Java JUnit5 Regression Suite");
        payload.put("environment", "STAGING");
        payload.put("version", "v1.0.0");
        payload.put("executedBy", "JUnit5 CI Runner");
        payload.put("results", results);

        RestAssured.given()
            .baseUri("http://localhost:3001/api/v1")
            .contentType(ContentType.JSON)
            .header("x-user-name", "JUnit5 Runner")
            .header("x-user-role", "TESTER")
            .body(payload)
            .when()
            .post("/projects/" + projectId + "/runs/automation")
            .then()
            .statusCode(201);
    }
}
```

---

### D) cURL Test Komutu
```bash
curl -X POST "http://localhost:3001/api/v1/projects/YOUR_PROJECT_ID/runs/automation" \
  -H "Content-Type: application/json" \
  -H "x-user-name: CLI Automation Bot" \
  -d '{
    "title": "Smoke Test Run via cURL",
    "environment": "STAGING",
    "version": "v1.0.0",
    "results": [
      {
        "caseCode": "MOB-TC-1",
        "status": "PASSED",
        "durationMs": 280
      }
    ]
  }'
```

---

## ⚡ 3. Test Otomasyon Merkezi'nde Webhook Alıcı Servisi (FastAPI / Flask / Express Örneği)

Test Otomasyon Merkezinizde TCMS'ten gelen tetiklemeyi dinleyen örnek bir Python FastAPI servisi:

```python
from fastapi import FastAPI, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import subprocess

app = FastAPI(title="Test Otomasyon Merkezi Webhook Receiver")

class TriggerPayload(BaseModel):
    event: str
    project: dict
    testRun: dict
    scope: str
    caseCodes: Optional[List[str]] = []
    callbackUrl: str
    triggeredBy: str

def run_tests_and_report_back(payload: TriggerPayload):
    print(f"🚀 Testler başlatılıyor: Kapsam={payload.scope}, Case={payload.caseCodes}")
    # 1. PyTest veya Playwright'ı çalıştır
    # subprocess.run(["pytest", "-k", " or ".join(payload.caseCodes)])
    
    # 2. Testler bittiğinde callbackUrl'e sonuçları POST et!
    # requests.post(payload.callbackUrl, json={ "results": [...] })

@app.post("/api/webhook/trigger")
async def handle_tcms_trigger(
    payload: TriggerPayload, 
    background_tasks: BackgroundTasks,
    authorization: Optional[str] = Header(None)
):
    # Opsiyonel: Token doğrulama
    # if authorization != "Bearer your-secure-shared-secret":
    #     raise HTTPException(status_code=401, detail="Yetkisiz erişim")

    # Testleri asenkron olarak arka planda başlat
    background_tasks.add_task(run_tests_and_report_back, payload)

    return {
        "status": "ACCEPTED",
        "message": f"Test koşumu başlatıldı (Run ID: {payload.testRun['id']})",
        "testRunId": payload.testRun["id"]
    }
```

---

## 🛡️ Güvenlik & Yetkilendirme (RBAC)

TCMS API'si varsayılan olarak `ADMIN`, `TEST_LEAD` veya `TESTER` rolündeki çağrıları kabul eder. Otomasyon sistemlerinden yapılan çağrılarda HTTP Header üzerinden kimlik tanımlaması yapabilirsiniz:

- `x-user-role`: `TESTER` veya `ADMIN`
- `x-user-name`: `Test Otomasyon Botu`
- `x-user-email`: `automation@ttb.com.tr`

Herhangi bir header gönderilmediğinde sistem güvenli varsayılan olarak istekleri kabul eder.

---

## 📞 Destek & Geliştirme

Entegrasyon sırasında herhangi bir alan ekleme veya özelleştirme ihtiyacınız olduğunda `backend/src/test-runs/dto/automation-run-result.dto.ts` ve `backend/src/webhooks/` modüllerini genişletebilirsiniz.
