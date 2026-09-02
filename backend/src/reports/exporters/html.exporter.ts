import { Injectable } from '@nestjs/common';

@Injectable()
export class HtmlExporter {
  /**
   * Generates rich, printable HTML report for a project
   */
  generateProjectHtml(data: any): string {
    const p = data.project || {};
    const m = data.metrics || {};
    const dateStr = new Date(data.generatedAt).toLocaleString('tr-TR');
    const rStatus = data.readiness?.status || 'GO';
    const rReason = data.readiness?.reason || 'Kalite hedefleri sağlandı.';
    const rColor = rStatus === 'GO' ? '#10b981' : rStatus === 'CAUTION' ? '#f59e0b' : '#f43f5e';
    const rTitle = rStatus === 'GO' ? 'CANLIYA YAYINA UYGUN (GO)' : rStatus === 'CAUTION' ? 'ŞARTLI & RİSKLİ YAYIN (CAUTION)' : 'YAYINA UYGUN DEĞİL (NO-GO)';

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>TCMS Yönetici Test Raporu - ${p.name || ''}</title>
  <style>
    :root {
      --primary: #b83a4b;
      --bg: #0b0f17;
      --card-bg: #141821;
      --border: #232b3b;
      --text: #f1f5f9;
      --text-muted: #8e9bb0;
      --passed: #10b981;
      --failed: #f43f5e;
      --blocked: #f59e0b;
      --untested: #64748b;
    }
    @media print {
      body { background: #fff !important; color: #000 !important; }
      .card { border: 1px solid #ccc !important; background: #fff !important; color: #000 !important; page-break-inside: avoid; }
      .no-print { display: none !important; }
      .text-muted { color: #555 !important; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd !important; color: #000 !important; }
      .readiness-box { border: 2px solid #000 !important; color: #000 !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 32px 24px; line-height: 1.5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 20px; margin-bottom: 24px; }
    .title-group h1 { font-size: 24px; font-weight: 800; color: #fff; }
    .title-group p { color: var(--text-muted); font-size: 13px; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-key { background: rgba(184, 58, 75, 0.2); color: #f87171; border: 1px solid rgba(184, 58, 75, 0.4); }
    .btn-print { background: var(--primary); color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    
    .readiness-box { background: var(--card-bg); border: 1px solid var(--border); border-left: 6px solid ${rColor}; border-radius: 12px; padding: 18px 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
    .readiness-verdict { font-size: 18px; font-weight: 800; color: ${rColor}; }
    .readiness-desc { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
    .readiness-score { font-size: 28px; font-weight: 900; color: #fff; text-align: right; }
    
    .grid-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .metric-val { font-size: 30px; font-weight: 800; margin-top: 6px; }
    .metric-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600; }
    .progress-bar-bg { height: 8px; background: #232b3b; border-radius: 4px; overflow: hidden; margin-top: 12px; display: flex; }
    .progress-fill { height: 100%; }
    
    .section-title { font-size: 16px; font-weight: 700; margin: 32px 0 14px 0; display: flex; align-items: center; gap: 8px; }
    
    .grid-channels { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .channel-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
    .channel-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
    
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
    th { background: rgba(0,0,0,0.25); text-align: left; padding: 10px 12px; font-weight: 700; color: var(--text-muted); border-bottom: 1px solid var(--border); }
    td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .status-PASSED { color: var(--passed); font-weight: 700; }
    .status-FAILED { color: var(--failed); font-weight: 700; }
    .status-BLOCKED { color: var(--blocked); font-weight: 700; }
    .status-UNTESTED { color: var(--untested); }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); text-align: center; font-size: 12px; color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-group">
        <div style="display: flex; align-items: center; gap: 10px;">
          <h1>${p.name || 'Proje'}</h1>
          <span class="badge badge-key">${p.key || ''}</span>
        </div>
        <p>Banka Test Planı Yönetici Kalite ve Yürütme Raporu • Oluşturulma: ${dateStr}</p>
      </div>
      <button class="btn-print no-print" onclick="window.print()">Raporu Yazdır / PDF</button>
    </div>

    <!-- Go/No-Go Decision Banner -->
    <div class="readiness-box">
      <div>
        <div class="readiness-verdict">${rTitle}</div>
        <div class="readiness-desc">${rReason}</div>
      </div>
      <div class="readiness-score">
        %${m.passRate || 0}
        <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Başarı Oranı</div>
      </div>
    </div>

    <!-- Executive Metrics Grid -->
    <div class="grid-metrics">
      <div class="card">
        <div class="metric-label">Toplam Test & Kapsam</div>
        <div class="metric-val" style="color: #fff;">${m.totalCases || 0}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Koşulan: ${m.executedTotal || 0} (%${m.totalCases > 0 ? Math.round((m.executedTotal / m.totalCases) * 100) : 0})</div>
      </div>
      <div class="card">
        <div class="metric-label">Genel Kalite & Başarı</div>
        <div class="metric-val" style="color: ${(m.passRate || 0) >= 85 ? 'var(--passed)' : (m.passRate || 0) >= 70 ? 'var(--blocked)' : 'var(--failed)'};">
          %${m.passRate || 0}
        </div>
        <div class="progress-bar-bg">
          <div class="progress-fill" style="width: ${m.passRate || 0}%; background: var(--passed);"></div>
          <div class="progress-fill" style="width: ${((m.failed || 0) / (m.totalCases || 1)) * 100}%; background: var(--failed);"></div>
          <div class="progress-fill" style="width: ${((m.blocked || 0) / (m.totalCases || 1)) * 100}%; background: var(--blocked);"></div>
        </div>
      </div>
      <div class="card">
        <div class="metric-label">Aksiyon Gereken (Hatalı/Bloke)</div>
        <div class="metric-val" style="color: ${(m.failed || 0) > 0 ? 'var(--failed)' : 'var(--passed)'};">${m.failed || 0} Hata</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${m.blocked || 0} Bloke Senaryo</div>
      </div>
      <div class="card">
        <div class="metric-label">Otomasyon Oranı</div>
        <div class="metric-val" style="color: #38bdf8;">%${data.automation?.percentage || 0}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${data.automation?.automation || 0} Otomasyon / ${data.automation?.manual || 0} Manuel</div>
      </div>
    </div>

    <!-- Banking Channel Health -->
    <div class="section-title">🏦 Banka Sistem & Kanal Sağlık Matrisi</div>
    <div class="grid-channels">
      ${(data.channels || [])
        .map(
          (ch: any) => `
        <div class="channel-card">
          <div class="channel-title">${ch.name}</div>
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 22px; font-weight: 800; color: ${ch.passRate >= 80 ? 'var(--passed)' : ch.passRate >= 60 ? 'var(--blocked)' : 'var(--failed)'};">%${ch.passRate}</span>
            <span style="font-size: 12px; color: var(--text-muted);">${ch.passed}/${ch.total} Geçti</span>
          </div>
          <div class="progress-bar-bg" style="margin-top: 8px;">
            <div class="progress-fill" style="width: ${ch.passRate}%; background: var(--passed);"></div>
            <div class="progress-fill" style="width: ${(ch.failed / (ch.total || 1)) * 100}%; background: var(--failed);"></div>
          </div>
        </div>
      `,
        )
        .join('')}
    </div>

    <!-- Suite Level Breakdown -->
    <div class="section-title">📁 Modül & Suite Bazlı Sağlık Durumu</div>
    <div class="card" style="padding: 0; overflow: hidden;">
      <table>
        <thead>
          <tr>
            <th>Modül / Suite Adı</th>
            <th>Toplam Test</th>
            <th>Geçti</th>
            <th>Kaldı</th>
            <th>Bloke</th>
            <th>Başarı Oranı</th>
          </tr>
        </thead>
        <tbody>
          ${(data.suites || [])
            .map(
              (s: any) => `
            <tr>
              <td style="font-weight: 600;">${s.name}</td>
              <td>${s.totalCases}</td>
              <td class="status-PASSED">${s.passed}</td>
              <td class="status-FAILED">${s.failed}</td>
              <td class="status-BLOCKED">${s.blocked}</td>
              <td style="font-weight: 700; color: ${s.passRate >= 80 ? 'var(--passed)' : s.passRate >= 60 ? 'var(--blocked)' : 'var(--failed)'};">%${s.passRate}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <!-- Failed Cases / Action Items -->
    ${
      (data.failedCases || []).length > 0
        ? `
      <div class="section-title">⚠️ Kritik Hatalar ve Aksiyon Bekleyen Senaryolar</div>
      <div class="card" style="padding: 0; overflow: hidden;">
        <table>
          <thead>
            <tr>
              <th>Test Kodu</th>
              <th>Test Başlığı</th>
              <th>Suite</th>
              <th>Öncelik</th>
              <th>Hata Mesajı</th>
              <th>Jira Bug</th>
            </tr>
          </thead>
          <tbody>
            ${data.failedCases
              .map(
                (fc: any) => `
              <tr>
                <td style="font-weight: 700; color: #f87171;">${fc.code}</td>
                <td>${fc.title}</td>
                <td>${fc.suiteName}</td>
                <td><span class="badge" style="background: rgba(244,63,94,0.15); color: #f43f5e;">${fc.priority}</span></td>
                <td style="color: #f87171; font-family: monospace; font-size: 11px;">${fc.errorMessage || 'Belirtilmemiş'}</td>
                <td>${fc.jiraBugKey ? `<a href="${fc.jiraBugUrl || '#'}" target="_blank" style="color: #38bdf8; text-decoration: none; font-weight: 700;">${fc.jiraBugKey}</a>` : '-'}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
        : ''
    }

    <div class="footer">
      TCMS - Test Case Management System • Bu rapor sistem tarafından otomatik olarak üretilmiştir.
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generates rich printable HTML report for a test run
   */
  generateRunHtml(data: any): string {
    const r = data.run || {};
    const m = data.metrics || {};
    const dateStr = new Date(data.generatedAt).toLocaleString('tr-TR');

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>TCMS Koşum Raporu - ${r.title || ''}</title>
  <style>
    :root {
      --primary: #b83a4b;
      --bg: #0b0f17;
      --card-bg: #141821;
      --border: #232b3b;
      --text: #f1f5f9;
      --text-muted: #8e9bb0;
      --passed: #10b981;
      --failed: #f43f5e;
      --blocked: #f59e0b;
      --skipped: #64748b;
    }
    @media print {
      body { background: #fff !important; color: #000 !important; }
      .card { border: 1px solid #ccc !important; background: #fff !important; color: #000 !important; page-break-inside: avoid; }
      .no-print { display: none !important; }
      .text-muted { color: #555 !important; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd !important; color: #000 !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 32px 24px; line-height: 1.5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 20px; margin-bottom: 24px; }
    .title-group h1 { font-size: 22px; font-weight: 800; color: #fff; }
    .title-group p { color: var(--text-muted); font-size: 13px; margin-top: 4px; }
    .btn-print { background: var(--primary); color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    
    .grid-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
    .metric-val { font-size: 26px; font-weight: 800; margin-top: 4px; }
    .metric-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600; }
    
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
    th { background: rgba(0,0,0,0.25); text-align: left; padding: 10px 12px; font-weight: 700; color: var(--text-muted); border-bottom: 1px solid var(--border); }
    td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .status-PASSED { color: var(--passed); font-weight: 700; }
    .status-FAILED { color: var(--failed); font-weight: 700; }
    .status-BLOCKED { color: var(--blocked); font-weight: 700; }
    .status-SKIPPED { color: var(--skipped); }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); text-align: center; font-size: 12px; color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-group">
        <h1>${r.title || ''} (${r.version || ''} / ${r.environment || ''})</h1>
        <p>Proje: ${r.projectName || ''} [${r.projectKey || ''}] • Koşan: ${r.executedBy || ''} • Tarih: ${dateStr}</p>
      </div>
      <button class="btn-print no-print" onclick="window.print()">Raporu Yazdır / PDF</button>
    </div>

    <div class="grid-metrics">
      <div class="card">
        <div class="metric-label">Toplam Koşulan</div>
        <div class="metric-val" style="color: #fff;">${m.total || 0}</div>
      </div>
      <div class="card">
        <div class="metric-label">Başarı Oranı</div>
        <div class="metric-val" style="color: ${(m.passRate || 0) >= 80 ? 'var(--passed)' : 'var(--failed)'};">%${m.passRate || 0}</div>
      </div>
      <div class="card">
        <div class="metric-label">Başarılı (Passed)</div>
        <div class="metric-val status-PASSED">${m.passed || 0}</div>
      </div>
      <div class="card">
        <div class="metric-label">Hatalı (Failed)</div>
        <div class="metric-val status-FAILED">${m.failed || 0}</div>
      </div>
      <div class="card">
        <div class="metric-label">Ortalama Süre</div>
        <div class="metric-val" style="color: #38bdf8;">${m.avgExecutionMs || 0} ms</div>
      </div>
    </div>

    <div class="card" style="padding: 0; overflow: hidden; margin-top: 20px;">
      <table>
        <thead>
          <tr>
            <th>Test Kodu</th>
            <th>Test Başlığı</th>
            <th>Modül</th>
            <th>Öncelik</th>
            <th>Sonuç</th>
            <th>Süre</th>
            <th>Hata & Notlar</th>
            <th>Jira</th>
          </tr>
        </thead>
        <tbody>
          ${(data.results || [])
            .map(
              (res: any) => `
            <tr>
              <td style="font-weight: 700;">${res.testCaseCode}</td>
              <td>${res.testCaseTitle}</td>
              <td>${res.suiteName}</td>
              <td>${res.priority}</td>
              <td class="status-${res.status}">${res.status}</td>
              <td>${res.executionMs ? `${res.executionMs} ms` : '-'}</td>
              <td style="font-size: 11px; color: ${res.errorMessage ? '#f87171' : 'var(--text-muted)'};">${res.errorMessage || '-'}</td>
              <td>${res.jiraBugKey ? `<a href="${res.jiraBugUrl || '#'}" target="_blank" style="color: #38bdf8; font-weight: 700;">${res.jiraBugKey}</a>` : '-'}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      TCMS - Test Case Management System • Koşum İnceleme Raporu
    </div>
  </div>
</body>
</html>`;
  }
}
