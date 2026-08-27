import * as XLSX from 'xlsx';
import {
  TestCase,
  TestPlan,
  TestRun,
  BulkTestCaseItemInput,
  BulkTestPlanItemInput,
  Priority,
  TestType,
  PlanStatus,
} from '@/services/api';

// Helper to save workbook file in browser
function saveWorkbook(wb: XLSX.WorkBook, filename: string) {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// 1. TEST CASE TEMPLATE & EXPORT / IMPORT
// -------------------------------------------------------------

export function downloadTestCaseTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Template Data with sample rows
  const headers = [
    'Modül / Klasör (Suite)',
    'Senaryo Kodu (Opsiyonel)',
    'Senaryo Başlığı (*)',
    'Açıklama',
    'Önkoşul',
    'Öncelik (BLOCKER/CRITICAL/NORMAL/LOW)',
    'Test Tipi (WEB/MOBILE/IOS/ANDROID/API/MANUAL/PERFORMANCE/OTHER)',
    'Jira Story Key',
    'Adım No',
    'Test Adımı / Aksiyon (*)',
    'Beklenen Sonuç',
  ];

  const sampleRows = [
    [
      'Kimlik Doğrulama',
      'TC-001',
      'Geçerli kullanıcı adı ve şifre ile başarılı giriş',
      'Kullanıcının ana sayfaya ve yetkili panele yönlendirildiğini doğrula',
      'Kullanıcı sisteme kayıtlı ve aktif olmalıdır',
      'CRITICAL',
      'WEB',
      'PROJ-101',
      1,
      'Giriş ekranını aç (https://app.example.com/login)',
      'Giriş formu ve alanları eksiksiz görüntülenir',
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      2,
      'Geçerli e-posta (test@example.com) ve şifreyi gir',
      'Form alanları doldurulur',
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      3,
      '"Giriş Yap" butonuna tıkla',
      'Kullanıcı Dashboard sayfasına yönlendirilir ve hoş geldin mesajı çıkar',
    ],
    [
      'Ödeme Modülü',
      'TC-002',
      'Geçersiz kredi kartı numarası ile ödeme hatası doğrulama',
      'Hatalı kart numarası girildiğinde kullanıcıya uygun hata mesajı gösterilmelidir',
      'Sepette en az bir ürün bulunmalıdır',
      'BLOCKER',
      'WEB',
      'PROJ-105',
      1,
      'Ödeme adımına ilerle ve geçersiz kart numarası (4111 1111) gir',
      'Kart alanı kırmızı uyarı verir ve "Geçersiz Kart Numarası" mesajı gösterilir',
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      2,
      '"Ödemeyi Tamamla" butonuna tıkla',
      'İşlem reddedilir, ödeme tetiklenmez',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Adjust column widths
  ws['!cols'] = [
    { wch: 22 }, // Suite
    { wch: 18 }, // Code
    { wch: 38 }, // Title
    { wch: 32 }, // Description
    { wch: 26 }, // Precondition
    { wch: 20 }, // Priority
    { wch: 18 }, // Type
    { wch: 14 }, // Jira
    { wch: 10 }, // Step No
    { wch: 45 }, // Action
    { wch: 45 }, // Expected Result
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Test Senaryoları');

  // Sheet 2: User Guide / Reference
  const guideHeaders = ['Alan Adı', 'Zorunlu mu?', 'Kabul Edilen Değerler', 'Açıklama'];
  const guideRows = [
    ['Modül / Klasör (Suite)', 'Hayır', 'Metin (Örn: Kimlik Doğrulama)', 'Senaryonun ekleneceği modül. Mevcut değilse otomatik oluşturulur.'],
    ['Senaryo Kodu', 'Hayır', 'Metin (Örn: TC-001)', 'Boş bırakılırsa sistem otomatik artan benzersiz kod üretir (Örn: PRJ-TC-1).'],
    ['Senaryo Başlığı (*)', 'Evet', 'Metin', 'Senaryonun tek satırlık net başlığı.'],
    ['Açıklama', 'Hayır', 'Metin', 'Senaryo hedefi ve detayları.'],
    ['Önkoşul', 'Hayır', 'Metin', 'Test öncesi sağlanması gereken şartlar.'],
    ['Öncelik', 'Hayır', 'BLOCKER, CRITICAL, NORMAL, LOW', 'Varsayılan: NORMAL.'],
    ['Test Tipi', 'Hayır', 'WEB, MOBILE, IOS, ANDROID, API, MANUAL, PERFORMANCE, OTHER', 'Varsayılan: WEB.'],
    ['Jira Story Key', 'Hayır', 'Metin (Örn: PROJ-123)', 'İlişkili Jira issue veya user story anahtarı.'],
    ['Adım No', 'Hayır', 'Sayı (1, 2, 3...)', 'Test adımının sırası.'],
    ['Test Adımı / Aksiyon (*)', 'Hayır', 'Metin', 'Test esnasında yapılacak işlem.'],
    ['Beklenen Sonuç', 'Hayır', 'Metin', 'Adım tamamlandığında beklenen sistem tepkisi.'],
    ['', '', '', ''],
    ['ÇOKLU ADIM KURALI:', '', '', 'Aynı senaryoya birden fazla adım eklemek için, ilk satırda senaryo bilgilerini doldurun, sonraki adımları alt satırlarda başlık sütununu BOŞ bırakarak sadece Adım No, Aksiyon ve Beklenen Sonuç ile yazın.'],
  ];

  const guideWs = XLSX.utils.aoa_to_sheet([guideHeaders, ...guideRows]);
  guideWs['!cols'] = [
    { wch: 25 },
    { wch: 14 },
    { wch: 35 },
    { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, guideWs, 'Kullanım Kılavuzu');

  saveWorkbook(wb, 'TCMS_Test_Senaryolari_Sablonu.xlsx');
}

export function exportTestCasesToExcel(testCases: TestCase[], projectName?: string) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Modül / Klasör (Suite)',
    'Senaryo Kodu',
    'Senaryo Başlığı',
    'Açıklama',
    'Önkoşul',
    'Öncelik',
    'Test Tipi',
    'Yöntem',
    'Jira Story Key',
    'Adım No',
    'Test Adımı / Aksiyon',
    'Beklenen Sonuç',
  ];

  const rows: any[][] = [];

  testCases.forEach((tc) => {
    const suiteName = tc.suite?.name || '';
    const steps = tc.steps || [];

    if (steps.length === 0) {
      rows.push([
        suiteName,
        tc.code,
        tc.title,
        tc.description || '',
        tc.precondition || tc.preconditions || '',
        tc.priority,
        tc.type,
        tc.executionType || 'MANUAL',
        tc.jiraStoryKey || '',
        '',
        '',
        '',
      ]);
    } else {
      steps.forEach((step, idx) => {
        if (idx === 0) {
          rows.push([
            suiteName,
            tc.code,
            tc.title,
            tc.description || '',
            tc.precondition || tc.preconditions || '',
            tc.priority,
            tc.type,
            tc.executionType || 'MANUAL',
            tc.jiraStoryKey || '',
            step.stepNumber || 1,
            step.action,
            step.expectedResult || '',
          ]);
        } else {
          rows.push([
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            step.stepNumber || idx + 1,
            step.action,
            step.expectedResult || '',
          ]);
        }
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 38 },
    { wch: 32 },
    { wch: 26 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 45 },
    { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Test Senaryoları');

  const date = new Date().toISOString().split('T')[0];
  const safeName = (projectName || 'TCMS').replace(/[^a-zA-Z0-9_-]/g, '_');
  saveWorkbook(wb, `${safeName}_Test_Senaryolari_${date}.xlsx`);
}

export interface ParseTestCasesResult {
  validCases: BulkTestCaseItemInput[];
  errors: { row: number; message: string; details?: string }[];
  totalRows: number;
}

export async function parseTestCasesExcel(file: File): Promise<ParseTestCasesResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          resolve({ validCases: [], errors: [{ row: 0, message: 'Excel dosyasında sayfa bulunamadı' }], totalRows: 0 });
          return;
        }

        // Convert to 2D array
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rawRows.length < 2) {
          resolve({ validCases: [], errors: [{ row: 0, message: 'Excel dosyası boş veya başlık satırı eksik' }], totalRows: 0 });
          return;
        }

        // Find header indices dynamically
        const headerRow = rawRows[0].map((h: any) => String(h || '').trim().toLowerCase());
        const getColIdx = (patterns: string[]): number => {
          return headerRow.findIndex((col) => patterns.some((p) => col.includes(p)));
        };

        const idxSuite = getColIdx(['modül', 'suite', 'klasör']);
        const idxCode = getColIdx(['kod', 'code']);
        const idxTitle = getColIdx(['başlık', 'title', 'senaryo']);
        const idxDesc = getColIdx(['açıklama', 'description']);
        const idxPre = getColIdx(['önkoşul', 'precondition']);
        const idxPriority = getColIdx(['öncelik', 'priority']);
        const idxType = getColIdx(['tip', 'type']);
        const idxJira = getColIdx(['jira', 'story']);
        const idxStepNo = getColIdx(['adım no', 'step no', 'step number']);
        const idxAction = getColIdx(['aksiyon', 'eylem', 'action', 'adım']);
        const idxExpected = getColIdx(['beklenen', 'expected']);

        const validCases: BulkTestCaseItemInput[] = [];
        const errors: { row: number; message: string; details?: string }[] = [];

        let currentCase: BulkTestCaseItemInput | null = null;

        for (let r = 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0 || row.every((c) => c === undefined || c === null || String(c).trim() === '')) {
            continue; // Skip completely blank lines
          }

          const rowNum = r + 1;
          const titleVal = idxTitle >= 0 && row[idxTitle] ? String(row[idxTitle]).trim() : '';
          const actionVal = idxAction >= 0 && row[idxAction] ? String(row[idxAction]).trim() : '';
          const expectedVal = idxExpected >= 0 && row[idxExpected] ? String(row[idxExpected]).trim() : '';
          const stepNoVal = idxStepNo >= 0 && row[idxStepNo] ? Number(row[idxStepNo]) : undefined;

          // If titleVal exists, this is a NEW test case
          if (titleVal) {
            // Save previous case if any
            if (currentCase) {
              validCases.push(currentCase);
            }

            // Parse Priority
            let rawPriority = (idxPriority >= 0 && row[idxPriority] ? String(row[idxPriority]).trim().toUpperCase() : 'NORMAL') as Priority;
            const validPriorities: Priority[] = ['BLOCKER', 'CRITICAL', 'NORMAL', 'LOW'];
            if (!validPriorities.includes(rawPriority)) {
              rawPriority = 'NORMAL';
            }

            // Parse TestType
            let rawType = (idxType >= 0 && row[idxType] ? String(row[idxType]).trim().toUpperCase() : 'WEB') as TestType;
            const validTypes: TestType[] = ['WEB', 'MOBILE', 'IOS', 'ANDROID', 'API', 'MANUAL', 'PERFORMANCE', 'OTHER'];
            if (!validTypes.includes(rawType)) {
              rawType = 'WEB';
            }

            const suiteNameVal = idxSuite >= 0 && row[idxSuite] ? String(row[idxSuite]).trim() : undefined;
            const codeVal = idxCode >= 0 && row[idxCode] ? String(row[idxCode]).trim() : undefined;
            const descVal = idxDesc >= 0 && row[idxDesc] ? String(row[idxDesc]).trim() : undefined;
            const preVal = idxPre >= 0 && row[idxPre] ? String(row[idxPre]).trim() : undefined;
            const jiraVal = idxJira >= 0 && row[idxJira] ? String(row[idxJira]).trim() : undefined;

            currentCase = {
              title: titleVal,
              suiteName: suiteNameVal,
              code: codeVal,
              description: descVal,
              precondition: preVal,
              priority: rawPriority,
              type: rawType,
              jiraStoryKey: jiraVal,
              steps: [],
            };

            // Add step if present on the same row
            if (actionVal || expectedVal) {
              currentCase.steps!.push({
                stepNumber: stepNoVal || 1,
                action: actionVal || 'Aksiyon belirtilmedi',
                expectedResult: expectedVal || '',
              });
            }
          } else {
            // This is a sub-step row for the current test case
            if (currentCase) {
              if (actionVal || expectedVal) {
                const nextStepNum = stepNoVal || (currentCase.steps!.length + 1);
                currentCase.steps!.push({
                  stepNumber: nextStepNum,
                  action: actionVal || 'Aksiyon belirtilmedi',
                  expectedResult: expectedVal || '',
                });
              }
            } else {
              errors.push({
                row: rowNum,
                message: 'Başlık alanı boş ve bağlanacak bir önceki test senaryosu bulunamadı',
                details: `Satır içeriği: ${row.slice(0, 4).join(', ')}`,
              });
            }
          }
        }

        // Push last case
        if (currentCase) {
          validCases.push(currentCase);
        }

        resolve({
          validCases,
          errors,
          totalRows: rawRows.length - 1,
        });
      } catch (err: any) {
        reject(new Error(`Excel dosyası okunurken hata oluştu: ${err?.message || err}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Dosya okunamadı'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// -------------------------------------------------------------
// 2. TEST PLAN TEMPLATE & EXPORT / IMPORT
// -------------------------------------------------------------

export function downloadTestPlanTemplate() {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Plan Başlığı (*)',
    'Açıklama',
    'Versiyon (Örn: v1.0.0)',
    'Test Ortamı (STAGING/PROD/DEV/QA)',
    'Durum (ACTIVE/DRAFT/COMPLETED/ARCHIVED)',
    'Kapsam ve Modüller',
    'Gereksinimler / Jira Keys',
  ];

  const sampleRows = [
    [
      'Sprint 24 Regresyon Test Planı',
      'Ödeme ve Kullanıcı Giriş modüllerinin uçtan uca regresyon doğrulaması',
      'v2.4.0',
      'STAGING',
      'ACTIVE',
      'Kimlik Doğrulama, Ödeme Geçidi, Sepet',
      'PROJ-101, PROJ-102, PROJ-105',
    ],
    [
      'Mobil v1.2 Smoke Test Planı',
      'iOS ve Android kritik akışların hızlı doğrulaması',
      'v1.2.0',
      'PROD',
      'DRAFT',
      'Splash, Login, Push Bildirimleri',
      'MOB-45, MOB-48',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 35 },
    { wch: 45 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 35 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Test Planları');

  saveWorkbook(wb, 'TCMS_Test_Planlari_Sablonu.xlsx');
}

export function exportTestPlansToExcel(testPlans: TestPlan[], projectName?: string) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Plan Başlığı',
    'Açıklama',
    'Versiyon',
    'Ortam',
    'Durum',
    'Kapsam',
    'Gereksinimler / Jira',
    'Koşum Sayısı',
    'Oluşturulma Tarihi',
  ];

  const rows = testPlans.map((tp) => [
    tp.title,
    tp.description || '',
    tp.version || 'v1.0.0',
    tp.environment || 'STAGING',
    tp.status || 'ACTIVE',
    tp.scope || '',
    tp.requirements || '',
    tp._count?.testRuns || tp.testRuns?.length || 0,
    tp.createdAt ? new Date(tp.createdAt).toLocaleDateString('tr-TR') : '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 35 },
    { wch: 40 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 35 },
    { wch: 25 },
    { wch: 14 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Test Planları');

  const date = new Date().toISOString().split('T')[0];
  const safeName = (projectName || 'TCMS').replace(/[^a-zA-Z0-9_-]/g, '_');
  saveWorkbook(wb, `${safeName}_Test_Planlari_${date}.xlsx`);
}

export interface ParseTestPlansResult {
  validPlans: BulkTestPlanItemInput[];
  errors: { row: number; message: string }[];
  totalRows: number;
}

export async function parseTestPlansExcel(file: File): Promise<ParseTestPlansResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!worksheet) {
          resolve({ validPlans: [], errors: [{ row: 0, message: 'Sayfa bulunamadı' }], totalRows: 0 });
          return;
        }

        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rawRows.length < 2) {
          resolve({ validPlans: [], errors: [{ row: 0, message: 'Dosya boş veya başlık satırı eksik' }], totalRows: 0 });
          return;
        }

        const headerRow = rawRows[0].map((h: any) => String(h || '').trim().toLowerCase());
        const getColIdx = (patterns: string[]): number => {
          return headerRow.findIndex((col) => patterns.some((p) => col.includes(p)));
        };

        const idxTitle = getColIdx(['başlık', 'title', 'plan']);
        const idxDesc = getColIdx(['açıklama', 'description']);
        const idxVer = getColIdx(['versiyon', 'version', 'sürüm']);
        const idxEnv = getColIdx(['ortam', 'environment']);
        const idxStatus = getColIdx(['durum', 'status']);
        const idxScope = getColIdx(['kapsam', 'scope']);
        const idxReq = getColIdx(['gereksinim', 'jira', 'requirement']);

        const validPlans: BulkTestPlanItemInput[] = [];
        const errors: { row: number; message: string }[] = [];

        for (let r = 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0 || row.every((c) => c === undefined || c === null || String(c).trim() === '')) {
            continue;
          }

          const rowNum = r + 1;
          const titleVal = idxTitle >= 0 && row[idxTitle] ? String(row[idxTitle]).trim() : '';

          if (!titleVal) {
            errors.push({ row: rowNum, message: 'Plan Başlığı alanı zorunludur' });
            continue;
          }

          let statusVal = (idxStatus >= 0 && row[idxStatus] ? String(row[idxStatus]).trim().toUpperCase() : 'ACTIVE') as PlanStatus;
          const validStatuses: PlanStatus[] = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];
          if (!validStatuses.includes(statusVal)) {
            statusVal = 'ACTIVE';
          }

          validPlans.push({
            title: titleVal,
            description: idxDesc >= 0 && row[idxDesc] ? String(row[idxDesc]).trim() : undefined,
            version: idxVer >= 0 && row[idxVer] ? String(row[idxVer]).trim() : 'v1.0.0',
            environment: idxEnv >= 0 && row[idxEnv] ? String(row[idxEnv]).trim().toUpperCase() : 'STAGING',
            status: statusVal,
            scope: idxScope >= 0 && row[idxScope] ? String(row[idxScope]).trim() : undefined,
            requirements: idxReq >= 0 && row[idxReq] ? String(row[idxReq]).trim() : undefined,
          });
        }

        resolve({
          validPlans,
          errors,
          totalRows: rawRows.length - 1,
        });
      } catch (err: any) {
        reject(new Error(`Test planları Excel dosyası okunurken hata: ${err?.message || err}`));
      }
    };

    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsArrayBuffer(file);
  });
}

// -------------------------------------------------------------
// 3. TEST RUNS EXPORT
// -------------------------------------------------------------

export function exportTestRunsToExcel(testRuns: TestRun[], projectName?: string) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Run Summaries
  const runHeaders = [
    'Koşum Başlığı',
    'Versiyon',
    'Ortam',
    'Durum',
    'Çalıştıran',
    'E-posta',
    'Toplam Test',
    'Başarılı (Passed)',
    'Başarısız (Failed)',
    'Engellenen (Blocked)',
    'Atlanan (Skipped)',
    'Başarı Oranı (%)',
    'Tarih',
  ];

  const runRows = testRuns.map((r) => {
    const results = r.results || [];
    const total = results.length;
    const passed = results.filter((res) => res.status === 'PASSED').length;
    const failed = results.filter((res) => res.status === 'FAILED').length;
    const blocked = results.filter((res) => res.status === 'BLOCKED').length;
    const skipped = results.filter((res) => res.status === 'SKIPPED').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return [
      r.title,
      r.version,
      r.environment,
      r.status,
      r.executedBy,
      r.testerEmail,
      total,
      passed,
      failed,
      blocked,
      skipped,
      `%${passRate}`,
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('tr-TR') : '',
    ];
  });

  const wsRuns = XLSX.utils.aoa_to_sheet([runHeaders, ...runRows]);
  wsRuns['!cols'] = [
    { wch: 32 },
    { wch: 14 },
    { wch: 14 },
    { wch: 15 },
    { wch: 20 },
    { wch: 25 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRuns, 'Koşum Özetleri');

  // Sheet 2: Detailed Results
  const detailHeaders = [
    'Koşum Başlığı',
    'Senaryo Kodu',
    'Senaryo Başlığı',
    'Sonuç Durumu',
    'Koşan Kişi',
    'Süre (ms)',
    'Hata Mesajı',
    'Jira Bug Key',
    'Platform',
    'Cihaz',
    'Tarih',
  ];

  const detailRows: any[][] = [];
  testRuns.forEach((r) => {
    (r.results || []).forEach((res) => {
      detailRows.push([
        r.title,
        res.testCase?.code || '',
        res.testCase?.title || '',
        res.status,
        res.executedBy || r.executedBy,
        res.executionMs || '',
        res.errorMessage || '',
        res.jiraBugKey || '',
        res.platform || '',
        res.device || '',
        res.executedAt ? new Date(res.executedAt).toLocaleString('tr-TR') : '',
      ]);
    });
  });

  if (detailRows.length > 0) {
    const wsDetails = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
    wsDetails['!cols'] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 35 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 40 },
      { wch: 15 },
      { wch: 14 },
      { wch: 16 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetails, 'Detaylı Sonuçlar');
  }

  const date = new Date().toISOString().split('T')[0];
  const safeName = (projectName || 'TCMS').replace(/[^a-zA-Z0-9_-]/g, '_');
  saveWorkbook(wb, `${safeName}_Test_Kosumlari_${date}.xlsx`);
}
