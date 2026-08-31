import { Injectable } from '@nestjs/common';

@Injectable()
export class CsvExporter {
  /**
   * Helper: Escape CSV string and format for Excel with quotes
   */
  escapeCsv(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Generates UTF-8 BOM CSV for project test report
   */
  generateProjectCsv(data: any): string {
    const BOM = '\uFEFF';
    const headers = [
      'Test Kodu',
      'Test Başlığı',
      'Suite / Modül',
      'Öncelik',
      'Platform / Tip',
      'Yürütme Türü',
      'Son Koşum Durumu',
      'Jira Story',
      'Jira Bug',
      'Hata Detayı',
      'Süre (ms)',
      'Ön Koşullar',
      'Adım Sayısı',
      'Son Koşum Tarihi',
    ];

    const rows = (data.testCases || []).map((tc: any) => [
      this.escapeCsv(tc.code),
      this.escapeCsv(tc.title),
      this.escapeCsv(tc.suiteName),
      this.escapeCsv(tc.priority),
      this.escapeCsv(tc.type),
      this.escapeCsv(tc.executionType),
      this.escapeCsv(tc.latestStatus),
      this.escapeCsv(tc.jiraStoryKey || ''),
      this.escapeCsv(tc.latestJiraBugKey || ''),
      this.escapeCsv(tc.latestErrorMessage || ''),
      this.escapeCsv(tc.latestExecutionMs || ''),
      this.escapeCsv(tc.precondition || ''),
      this.escapeCsv(tc.stepsCount),
      this.escapeCsv(tc.latestExecutedAt ? new Date(tc.latestExecutedAt).toLocaleString('tr-TR') : ''),
    ]);

    return BOM + [headers.map((h) => this.escapeCsv(h)).join(','), ...rows.map((r: string[]) => r.join(','))].join('\r\n');
  }

  /**
   * Generates UTF-8 BOM CSV for test run report
   */
  generateRunCsv(data: any): string {
    const BOM = '\uFEFF';
    const headers = [
      'Test Kodu',
      'Test Başlığı',
      'Suite / Modül',
      'Öncelik',
      'Test Tipi',
      'Yürütme Türü',
      'Sonuç Durumu',
      'Koşum Süresi (ms)',
      'Jira Bug',
      'Hata Mesajı',
      'Test Eden',
      'Koşum Tarihi',
    ];

    const rows = (data.results || []).map((r: any) => [
      this.escapeCsv(r.testCaseCode),
      this.escapeCsv(r.testCaseTitle),
      this.escapeCsv(r.suiteName),
      this.escapeCsv(r.priority),
      this.escapeCsv(r.type),
      this.escapeCsv(r.executionType),
      this.escapeCsv(r.status),
      this.escapeCsv(r.executionMs || ''),
      this.escapeCsv(r.jiraBugKey || ''),
      this.escapeCsv(r.errorMessage || ''),
      this.escapeCsv(r.executedBy || ''),
      this.escapeCsv(r.executedAt ? new Date(r.executedAt).toLocaleString('tr-TR') : ''),
    ]);

    return BOM + [headers.map((h) => this.escapeCsv(h)).join(','), ...rows.map((r: string[]) => r.join(','))].join('\r\n');
  }
}
