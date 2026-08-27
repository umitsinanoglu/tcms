/**
 * SVG UI Mockup & Screenshot Generator for TCMS Banking Test Scenarios
 * Generates high-fidelity Data URI SVGs mimicking actual iOS/Android Mobile Banking & Web interfaces.
 */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 1. Mobile Banking - FAST Instant Money Transfer Receipt
 */
export function createMobileFASTTransferScreenshot(params: {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  senderName: string;
  senderIban: string;
  receiverName: string;
  receiverIban: string;
  amount: string;
  fastRefId: string;
  timestamp: string;
  latencyMs?: number;
  failureReason?: string;
}): string {
  const isSuccess = params.status === 'SUCCESS';
  const isFailed = params.status === 'FAILED';
  const statusColor = isSuccess ? '#10b981' : isFailed ? '#ef4444' : '#f59e0b';
  const statusBg = isSuccess ? '#064e3b' : isFailed ? '#7f1d1d' : '#78350f';
  const statusTitle = isSuccess
    ? 'Transfer Başarılı (FAST 7/24)'
    : isFailed
    ? 'Transfer Başarısız Oldu'
    : 'İşlem Sıraya Alındı';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="fastBadge" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#0369a1"/>
      </linearGradient>
    </defs>

    <!-- Background Window -->
    <rect width="100%" height="100%" fill="url(#bgGrad)" rx="16"/>
    
    <!-- App Bar / Window Controls -->
    <rect x="0" y="0" width="760" height="46" fill="#1e293b" rx="16"/>
    <circle cx="28" cy="23" r="6.5" fill="#ef4444"/>
    <circle cx="48" cy="23" r="6.5" fill="#f59e0b"/>
    <circle cx="68" cy="23" r="6.5" fill="#10b981"/>
    <text x="96" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="600">📱 NeoBank Mobil Şube v4.5 • FAST / EFT Anlık Para Transferi Ekranı</text>
    <rect x="630" y="12" width="105" height="22" fill="#334155" rx="11"/>
    <text x="682" y="27" fill="#cbd5e1" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">iOS 18.2 • 5G</text>

    <!-- Main Container -->
    <g transform="translate(30, 64)">
      <!-- Status Box -->
      <rect x="0" y="0" width="700" height="96" fill="${statusBg}" rx="12" stroke="${statusColor}" stroke-width="1.5"/>
      <circle cx="50" cy="48" r="26" fill="${statusColor}"/>
      <text x="50" y="56" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle">${isSuccess ? '✓' : isFailed ? '✕' : '⏳'}</text>
      
      <text x="92" y="38" fill="#ffffff" font-family="sans-serif" font-size="17" font-weight="bold">${escapeXml(statusTitle)}</text>
      <text x="92" y="60" fill="#cbd5e1" font-family="sans-serif" font-size="13">TCMB FAST Takas Merkezi Referans Kodu: <tspan font-family="monospace" fill="#38bdf8" font-weight="bold">${escapeXml(params.fastRefId)}</tspan></text>
      <text x="92" y="80" fill="#94a3b8" font-family="sans-serif" font-size="12">İşlem Zamanı: ${escapeXml(params.timestamp)} ${params.latencyMs ? `• Ağ Gecikmesi: ${params.latencyMs}ms` : ''}</text>
      
      <!-- Transfer Amount Card -->
      <rect x="0" y="112" width="700" height="90" fill="url(#cardGrad)" rx="12" stroke="#334155" stroke-width="1"/>
      <text x="24" y="142" fill="#94a3b8" font-family="sans-serif" font-size="12" font-weight="600" text-transform="uppercase">Transfer Edilen Tutar</text>
      <text x="24" y="180" fill="#f8fafc" font-family="sans-serif" font-size="30" font-weight="800">${escapeXml(params.amount)} <tspan font-size="18" fill="#38bdf8">TL</tspan></text>
      
      <rect x="520" y="132" width="156" height="48" fill="url(#fastBadge)" rx="8"/>
      <text x="598" y="152" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">⚡ TCMB FAST</text>
      <text x="598" y="169" fill="#bae6fd" font-family="sans-serif" font-size="10" text-anchor="middle">7/24 Kesintisiz Takas</text>

      <!-- Details Table -->
      <rect x="0" y="218" width="700" height="150" fill="#090d16" rx="12" stroke="#1e293b" stroke-width="1"/>
      
      <!-- Row 1: Gönderen -->
      <text x="24" y="248" fill="#64748b" font-family="sans-serif" font-size="12">Gönderen Hesap:</text>
      <text x="170" y="248" fill="#e2e8f0" font-family="sans-serif" font-size="12" font-weight="bold">${escapeXml(params.senderName)}</text>
      <text x="420" y="248" fill="#94a3b8" font-family="monospace" font-size="11">${escapeXml(params.senderIban)}</text>

      <line x1="24" y1="262" x2="676" y2="262" stroke="#1e293b" stroke-width="1"/>

      <!-- Row 2: Alıcı -->
      <text x="24" y="288" fill="#64748b" font-family="sans-serif" font-size="12">Alıcı Bilgisi:</text>
      <text x="170" y="288" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="bold">${escapeXml(params.receiverName)}</text>
      <text x="420" y="288" fill="#94a3b8" font-family="monospace" font-size="11">${escapeXml(params.receiverIban)}</text>

      <line x1="24" y1="302" x2="676" y2="302" stroke="#1e293b" stroke-width="1"/>

      <!-- Row 3: İşlem Tipi / Açıklama -->
      <text x="24" y="328" fill="#64748b" font-family="sans-serif" font-size="12">İşlem Türü &amp; Ücret:</text>
      <text x="170" y="328" fill="#10b981" font-family="sans-serif" font-size="12" font-weight="600">FAST Bireysel Transfer • Masraf: ₺0,00 (Ücretsiz)</text>
      
      <line x1="24" y1="342" x2="676" y2="342" stroke="#1e293b" stroke-width="1"/>

      <!-- Row 4: Durum Notu -->
      <text x="24" y="358" fill="#64748b" font-family="sans-serif" font-size="12">Durum Bilgisi:</text>
      <text x="170" y="358" fill="${statusColor}" font-family="sans-serif" font-size="12" font-weight="bold">
        ${escapeXml(params.failureReason || 'Alıcı banka hesabına anında aktarıldı. e-Dekont üretildi.')}
      </text>

      <!-- Action Buttons -->
      <rect x="0" y="382" width="220" height="38" fill="#2563eb" rx="8"/>
      <text x="110" y="406" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">📄 e-Dekont İndir (PDF)</text>

      <rect x="236" y="382" width="220" height="38" fill="#1e293b" rx="8" stroke="#334155" stroke-width="1"/>
      <text x="346" y="406" fill="#cbd5e1" font-family="sans-serif" font-size="12" font-weight="600" text-anchor="middle">⭐ Sık Kullanılanlara Ekle</text>

      <rect x="472" y="382" width="228" height="38" fill="#1e293b" rx="8" stroke="#334155" stroke-width="1"/>
      <text x="586" y="406" fill="#cbd5e1" font-family="sans-serif" font-size="12" font-weight="600" text-anchor="middle">🔄 Yeni Transfer Yap</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 2. Credit Card & Virtual Card Management UI
 */
export function createCreditCardVirtualManagementScreenshot(params: {
  cardHolder: string;
  cardNumberMasked: string;
  expiry: string;
  dynamicCvv: string;
  cvvTimeRemainingSec: number;
  availableLimit: string;
  totalLimit: string;
  isOnlineActive: boolean;
  isAbroadActive: boolean;
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520">
    <defs>
      <linearGradient id="cardMesh" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3b82f6"/>
        <stop offset="40%" stop-color="#1d4ed8"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="100%" stop-color="#ca8a04"/>
      </linearGradient>
    </defs>

    <!-- App Window Frame -->
    <rect width="100%" height="100%" fill="#090d16" rx="16"/>
    <rect x="0" y="0" width="760" height="46" fill="#1e293b" rx="16"/>
    <circle cx="28" cy="23" r="6.5" fill="#ef4444"/>
    <circle cx="48" cy="23" r="6.5" fill="#f59e0b"/>
    <circle cx="68" cy="23" r="6.5" fill="#10b981"/>
    <text x="96" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="600">💳 NeoBank Kart Yönetim Merkezi • Dinamik CVV'li Dijital Sanal Kart</text>

    <!-- Main Grid -->
    <g transform="translate(30, 60)">
      <!-- Left: Metallic Virtual Card -->
      <g transform="translate(0, 0)">
        <rect width="360" height="220" rx="16" fill="url(#cardMesh)" stroke="#60a5fa" stroke-width="1.5"/>
        
        <!-- EMV Chip -->
        <rect x="24" y="28" width="46" height="34" rx="6" fill="url(#chipGrad)"/>
        <line x1="24" y1="45" x2="70" y2="45" stroke="#854d0e" stroke-width="1"/>
        <line x1="47" y1="28" x2="47" y2="62" stroke="#854d0e" stroke-width="1"/>
        
        <!-- Contactless Icon -->
        <path d="M 85 45 A 12 12 0 0 1 85 30 M 90 49 A 17 17 0 0 1 90 26 M 95 53 A 22 22 0 0 1 95 22" fill="none" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/>

        <!-- Bank Brand -->
        <text x="336" y="44" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="900" text-anchor="end">NeoBank <tspan fill="#38bdf8" font-size="12">PLATINUM</tspan></text>

        <!-- Card Number -->
        <text x="24" y="118" fill="#ffffff" font-family="monospace" font-size="20" font-weight="700" letter-spacing="2">${escapeXml(params.cardNumberMasked)}</text>

        <!-- Expiry & Holder -->
        <text x="24" y="160" fill="#93c5fd" font-family="sans-serif" font-size="9" text-transform="uppercase">Kart Sahibi</text>
        <text x="24" y="180" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="bold">${escapeXml(params.cardHolder)}</text>

        <text x="180" y="160" fill="#93c5fd" font-family="sans-serif" font-size="9" text-transform="uppercase">Son Kullanma</text>
        <text x="180" y="180" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="bold">${escapeXml(params.expiry)}</text>

        <!-- Mastercard / Visa Circles -->
        <circle cx="304" cy="174" r="16" fill="#eb001b" opacity="0.9"/>
        <circle cx="324" cy="174" r="16" fill="#f79e1b" opacity="0.9"/>
      </g>

      <!-- Right: Dynamic CVV Panel -->
      <g transform="translate(380, 0)">
        <rect width="320" height="220" rx="16" fill="#111827" stroke="#374151" stroke-width="1"/>
        <text x="20" y="32" fill="#9ca3af" font-family="sans-serif" font-size="12" font-weight="bold" text-transform="uppercase">🛡️ Dinamik Güvenlik Kodu (CVV)</text>
        
        <!-- Dynamic CVV Value Display -->
        <rect x="20" y="48" width="280" height="64" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="160" y="90" fill="#38bdf8" font-family="monospace" font-size="32" font-weight="900" text-anchor="middle" letter-spacing="6">${escapeXml(params.dynamicCvv)}</text>

        <circle cx="44" cy="142" r="14" fill="#0284c7"/>
        <text x="44" y="146" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">⏱</text>
        <text x="68" y="138" fill="#cbd5e1" font-family="sans-serif" font-size="12" font-weight="600">Kalan Süre: <tspan fill="#38bdf8" font-weight="bold">${params.cvvTimeRemainingSec} saniye</tspan></text>
        <text x="68" y="154" fill="#64748b" font-family="sans-serif" font-size="10">Her 60 saniyede bir otomatik yenilenir (PCI-DSS v4.0)</text>

        <rect x="20" y="174" width="280" height="34" rx="8" fill="#2563eb"/>
        <text x="160" y="195" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">🔄 Yeni Kod Üret</text>
      </g>

      <!-- Bottom: Limit & Card Permissions -->
      <g transform="translate(0, 236)">
        <rect width="700" height="200" rx="14" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>

        <!-- Limit Progress -->
        <text x="24" y="32" fill="#cbd5e1" font-family="sans-serif" font-size="13" font-weight="bold">Kart Limit &amp; Harcama Durumu</text>
        <text x="676" y="32" fill="#94a3b8" font-family="sans-serif" font-size="12" text-anchor="end">Toplam Limit: <tspan fill="#f8fafc" font-weight="bold">${escapeXml(params.totalLimit)} TL</tspan></text>

        <rect x="24" y="46" width="652" height="12" rx="6" fill="#1e293b"/>
        <rect x="24" y="46" width="460" height="12" rx="6" fill="#10b981"/>

        <text x="24" y="76" fill="#10b981" font-family="sans-serif" font-size="12" font-weight="bold">Kullanılabilir Limit: ${escapeXml(params.availableLimit)} TL</text>
        <text x="676" y="76" fill="#64748b" font-family="sans-serif" font-size="11" text-anchor="end">Güncel Dönem Borcu: ₺35.500,00 TL</text>

        <line x1="24" y1="92" x2="676" y2="92" stroke="#1e293b" stroke-width="1"/>

        <!-- Card Security Toggles -->
        <text x="24" y="122" fill="#94a3b8" font-family="sans-serif" font-size="12" font-weight="bold">Güvenlik İzinleri:</text>

        <!-- Toggle 1 -->
        <rect x="24" y="136" width="200" height="42" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <circle cx="48" cy="157" r="10" fill="${params.isOnlineActive ? '#10b981' : '#64748b'}"/>
        <text x="68" y="152" fill="#e2e8f0" font-family="sans-serif" font-size="11" font-weight="bold">İnternet Alışverişi</text>
        <text x="68" y="167" fill="${params.isOnlineActive ? '#34d399' : '#94a3b8'}" font-family="sans-serif" font-size="10">${params.isOnlineActive ? 'AÇIK (Aktif)' : 'KAPALI'}</text>

        <!-- Toggle 2 -->
        <rect x="238" y="136" width="200" height="42" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <circle cx="262" cy="157" r="10" fill="${params.isAbroadActive ? '#10b981' : '#64748b'}"/>
        <text x="282" y="152" fill="#e2e8f0" font-family="sans-serif" font-size="11" font-weight="bold">Yurt Dışı Kullanımı</text>
        <text x="282" y="167" fill="${params.isAbroadActive ? '#34d399' : '#94a3b8'}" font-family="sans-serif" font-size="10">${params.isAbroadActive ? 'AÇIK (Aktif)' : 'KAPALI'}</text>

        <!-- Toggle 3 -->
        <rect x="452" y="136" width="224" height="42" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <circle cx="476" cy="157" r="10" fill="#10b981"/>
        <text x="496" y="152" fill="#e2e8f0" font-family="sans-serif" font-size="11" font-weight="bold">Temassız Ödeme &amp; NFC</text>
        <text x="496" y="167" fill="#34d399" font-family="sans-serif" font-size="10">AÇIK (Limit: ₺1.500/işlem)</text>
      </g>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 3. 3D Secure 2.2 SMS / OTP Challenge Modal
 */
export function create3DSecureVerificationScreenshot(params: {
  merchantName: string;
  amount: string;
  cardMasked: string;
  phoneMasked: string;
  otpCode: string;
  expirySeconds: number;
  status: 'VERIFIED' | 'FAILED' | 'CHALLENGE_REQUIRED';
}): string {
  const isVerified = params.status === 'VERIFIED';
  const isFailed = params.status === 'FAILED';
  const headerBg = isVerified ? '#064e3b' : isFailed ? '#7f1d1d' : '#1e3a8a';
  const statusBadge = isVerified ? '#10b981' : isFailed ? '#ef4444' : '#3b82f6';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520">
    <rect width="100%" height="100%" fill="#090d16" rx="16"/>
    <rect x="0" y="0" width="760" height="46" fill="#1e293b" rx="16"/>
    <circle cx="28" cy="23" r="6.5" fill="#ef4444"/>
    <circle cx="48" cy="23" r="6.5" fill="#f59e0b"/>
    <circle cx="68" cy="23" r="6.5" fill="#10b981"/>
    <text x="96" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="600">🛡️ BKM / EMV 3D Secure 2.2 Güvenli Ödeme Doğrulama Penceresi</text>

    <!-- Modal Box -->
    <g transform="translate(100, 68)">
      <rect width="560" height="420" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      
      <!-- Modal Header -->
      <rect x="0" y="0" width="560" height="64" rx="16" fill="${headerBg}"/>
      <text x="24" y="32" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">NeoBank 3D Secure Doğrulama</text>
      <text x="24" y="49" fill="#93c5fd" font-family="sans-serif" font-size="11">Verified by Visa • Mastercard Identity Check • Troy Güvenli Alışveriş</text>

      <rect x="420" y="18" width="116" height="28" fill="${statusBadge}" rx="6"/>
      <text x="478" y="36" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">EMV 3DS 2.2.0</text>

      <!-- Transaction Details -->
      <rect x="24" y="80" width="512" height="96" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1"/>
      <text x="40" y="106" fill="#94a3b8" font-family="sans-serif" font-size="11">İşyeri / Üye Kuruluş:</text>
      <text x="180" y="106" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">${escapeXml(params.merchantName)}</text>

      <text x="40" y="130" fill="#94a3b8" font-family="sans-serif" font-size="11">İşlem Tutarı:</text>
      <text x="180" y="130" fill="#38bdf8" font-family="sans-serif" font-size="14" font-weight="bold">${escapeXml(params.amount)} TL</text>

      <text x="40" y="154" fill="#94a3b8" font-family="sans-serif" font-size="11">Kullanılan Kart:</text>
      <text x="180" y="154" fill="#cbd5e1" font-family="monospace" font-size="12">${escapeXml(params.cardMasked)}</text>

      <!-- OTP Instruction -->
      <text x="24" y="200" fill="#cbd5e1" font-family="sans-serif" font-size="12">
        <tspan fill="#38bdf8" font-weight="bold">${escapeXml(params.phoneMasked)}</tspan> numaralı telefonunuza gönderilen 6 haneli şifreyi giriniz:
      </text>

      <!-- OTP Input Boxes -->
      <g transform="translate(24, 218)">
        ${[0, 1, 2, 3, 4, 5]
          .map((idx) => {
            const digit = params.otpCode[idx] || '';
            const x = idx * 60;
            return `
            <rect x="${x}" y="0" width="48" height="54" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
            <text x="${x + 24}" y="36" fill="#ffffff" font-family="monospace" font-size="24" font-weight="bold" text-anchor="middle">${digit}</text>
          `;
          })
          .join('')}
      </g>

      <text x="400" y="250" fill="#f59e0b" font-family="sans-serif" font-size="12" font-weight="bold">⏱ ${params.expirySeconds} sn</text>
      <text x="400" y="266" fill="#64748b" font-family="sans-serif" font-size="10">Kalan Süre</text>

      <!-- Action Buttons -->
      <g transform="translate(24, 296)">
        <rect width="248" height="42" rx="8" fill="#2563eb"/>
        <text x="124" y="26" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">✓ Şifreyi Onayla</text>

        <rect x="264" width="248" height="42" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <text x="388" y="26" fill="#94a3b8" font-family="sans-serif" font-size="12" font-weight="600" text-anchor="middle">Mobil Şifrebaz ile Onayla</text>
      </g>

      <!-- Security Trust Footer -->
      <g transform="translate(24, 356)">
        <rect width="512" height="44" rx="8" fill="#090d16" stroke="#1e293b" stroke-width="1"/>
        <text x="16" y="26" fill="#10b981" font-family="sans-serif" font-size="11" font-weight="bold">🔒 256-Bit SSL &amp; ISO 27001 Güvenlik Sertifikalı İşlem</text>
        <text x="500" y="26" fill="#64748b" font-family="sans-serif" font-size="10" text-anchor="end">Cihaz Parmak İzi: OK</text>
      </g>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 4. Findeks Credit Score & Instant Loan Approval Screen
 */
export function createLoanApprovalFindeksScreenshot(params: {
  customerName: string;
  findeksScore: number;
  requestedAmount: string;
  approvedAmount: string;
  monthlyInstallment: string;
  maturityMonths: number;
  interestRate: string;
  status: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
}): string {
  const isApproved = params.status === 'APPROVED';
  const scorePercent = Math.min(100, Math.max(0, ((params.findeksScore - 1) / 1900) * 100));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520">
    <rect width="100%" height="100%" fill="#090d16" rx="16"/>
    <rect x="0" y="0" width="760" height="46" fill="#1e293b" rx="16"/>
    <circle cx="28" cy="23" r="6.5" fill="#ef4444"/>
    <circle cx="48" cy="23" r="6.5" fill="#f59e0b"/>
    <circle cx="68" cy="23" r="6.5" fill="#10b981"/>
    <text x="96" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="600">💰 Kredi Karar Motoru &amp; Findeks Skorlama • Anında İhtiyaç Kredisi Onayı</text>

    <g transform="translate(30, 60)">
      <!-- Left: Findeks Score Gauge Card -->
      <g transform="translate(0, 0)">
        <rect width="320" height="430" rx="14" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        <text x="24" y="34" fill="#94a3b8" font-family="sans-serif" font-size="11" font-weight="bold" text-transform="uppercase">KKB / Findeks Kredi Notu</text>

        <!-- Big Score Number -->
        <circle cx="160" cy="130" r="70" fill="none" stroke="#1e293b" stroke-width="12"/>
        <circle cx="160" cy="130" r="70" fill="none" stroke="#10b981" stroke-width="12" stroke-dasharray="440" stroke-dashoffset="${440 - (440 * scorePercent) / 100}" stroke-linecap="round" transform="rotate(-90 160 130)"/>
        
        <text x="160" y="132" fill="#f8fafc" font-family="sans-serif" font-size="34" font-weight="900" text-anchor="middle">${params.findeksScore}</text>
        <text x="160" y="154" fill="#10b981" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">ÇOK İYİ (A+ Risk)</text>

        <rect x="24" y="220" width="272" height="74" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <text x="36" y="244" fill="#94a3b8" font-family="sans-serif" font-size="11">Findeks Risk Grubu:</text>
        <text x="170" y="244" fill="#38bdf8" font-family="sans-serif" font-size="11" font-weight="bold">1. Sınıf Düşük Risk</text>
        <text x="36" y="268" fill="#94a3b8" font-family="sans-serif" font-size="11">Gecikme Kaydı:</text>
        <text x="170" y="268" fill="#10b981" font-family="sans-serif" font-size="11" font-weight="bold">0 Adet (Kusursuz)</text>

        <rect x="24" y="310" width="272" height="100" rx="8" fill="#090d16" stroke="#1e293b" stroke-width="1"/>
        <text x="36" y="336" fill="#cbd5e1" font-family="sans-serif" font-size="11" font-weight="bold">Müşteri:</text>
        <text x="110" y="336" fill="#e2e8f0" font-family="sans-serif" font-size="11">${escapeXml(params.customerName)}</text>
        <text x="36" y="360" fill="#cbd5e1" font-family="sans-serif" font-size="11" font-weight="bold">Gelir Teyidi:</text>
        <text x="110" y="360" fill="#10b981" font-family="sans-serif" font-size="11">SGK Otomatik Doğrulandı</text>
        <text x="36" y="384" fill="#cbd5e1" font-family="sans-serif" font-size="11" font-weight="bold">Kredi Limiti:</text>
        <text x="110" y="384" fill="#38bdf8" font-family="sans-serif" font-size="11" font-weight="bold">₺250.000 (Ön Onaylı)</text>
      </g>

      <!-- Right: Decision & Loan Proposal -->
      <g transform="translate(340, 0)">
        <rect width="360" height="430" rx="14" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>

        <!-- Decision Banner -->
        <rect x="0" y="0" width="360" height="60" rx="14" fill="${isApproved ? '#064e3b' : '#7f1d1d'}"/>
        <text x="24" y="36" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">${isApproved ? '🎉 KREDİNİZ ANINDA ONAYLANDI' : '⚠️ İnceleme Gerekli'}</text>

        <!-- Loan Summary Details -->
        <g transform="translate(24, 76)">
          <text x="0" y="24" fill="#94a3b8" font-family="sans-serif" font-size="12">Kredi Tutarı:</text>
          <text x="312" y="24" fill="#38bdf8" font-family="sans-serif" font-size="18" font-weight="800" text-anchor="end">${escapeXml(params.approvedAmount)} TL</text>

          <line x1="0" y1="38" x2="312" y2="38" stroke="#1e293b" stroke-width="1"/>

          <text x="0" y="62" fill="#94a3b8" font-family="sans-serif" font-size="12">Vade:</text>
          <text x="312" y="62" fill="#f8fafc" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="end">${params.maturityMonths} Ay</text>

          <line x1="0" y1="76" x2="312" y2="76" stroke="#1e293b" stroke-width="1"/>

          <text x="0" y="100" fill="#94a3b8" font-family="sans-serif" font-size="12">Aylık Faiz Oranı:</text>
          <text x="312" y="100" fill="#10b981" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="end">%${escapeXml(params.interestRate)}</text>

          <line x1="0" y1="114" x2="312" y2="114" stroke="#1e293b" stroke-width="1"/>

          <text x="0" y="140" fill="#cbd5e1" font-family="sans-serif" font-size="13" font-weight="bold">Aylık Taksit Tutarı:</text>
          <text x="312" y="140" fill="#f59e0b" font-family="sans-serif" font-size="20" font-weight="900" text-anchor="end">${escapeXml(params.monthlyInstallment)} TL</text>
        </g>

        <!-- Terms & Checkbox -->
        <rect x="24" y="240" width="312" height="74" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <text x="36" y="262" fill="#10b981" font-family="sans-serif" font-size="11" font-weight="bold">✓ Kredi Sözleşmesi ve Ödeme Planı</text>
        <text x="36" y="280" fill="#94a3b8" font-family="sans-serif" font-size="10">Dijital onay ile vadesiz hesabınıza anında aktarılacaktır.</text>
        <text x="36" y="298" fill="#38bdf8" font-family="sans-serif" font-size="10">Dosya Masrafı: ₺750 • Hayat Sigortası: Dahil</text>

        <!-- Action Button -->
        <rect x="24" y="334" width="312" height="46" rx="8" fill="#10b981"/>
        <text x="180" y="362" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">💸 Hesaba Aktar &amp; Onayla</text>

        <rect x="24" y="388" width="312" height="28" rx="6" fill="#1e293b"/>
        <text x="180" y="406" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Ödeme Planı Detaylarını İncele</text>
      </g>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 5. Live FX / Currency & Gold Exchange Trading Screen
 */
export function createFXTradingMarketScreenshot(params: {
  pair: string;
  rate: string;
  changePercent: string;
  buyRate: string;
  sellRate: string;
  tradedAmount: string;
  totalReceived: string;
  status: 'EXECUTED' | 'REJECTED' | 'RATE_EXPIRED';
}): string {
  const isExecuted = params.status === 'EXECUTED';
  const isPositive = !params.changePercent.startsWith('-');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520">
    <rect width="100%" height="100%" fill="#090d16" rx="16"/>
    <rect x="0" y="0" width="760" height="46" fill="#1e293b" rx="16"/>
    <circle cx="28" cy="23" r="6.5" fill="#ef4444"/>
    <circle cx="48" cy="23" r="6.5" fill="#f59e0b"/>
    <circle cx="68" cy="23" r="6.5" fill="#10b981"/>
    <text x="96" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="600">📈 Canlı Döviz &amp; Altın Piyasası • Anlık Kur ile FX Alım / Satım Ekranı</text>

    <g transform="translate(30, 60)">
      <!-- Top Live Market Bar -->
      <rect width="700" height="80" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
      <g transform="translate(24, 20)">
        <text x="0" y="24" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="900">${escapeXml(params.pair)}</text>
        <text x="0" y="44" fill="#94a3b8" font-family="sans-serif" font-size="11">TCMB Bankalararası Piyasa</text>

        <text x="240" y="24" fill="#38bdf8" font-family="sans-serif" font-size="24" font-weight="900">${escapeXml(params.rate)}</text>
        <rect x="240" y="32" width="74" height="20" rx="4" fill="${isPositive ? '#064e3b' : '#7f1d1d'}"/>
        <text x="277" y="46" fill="${isPositive ? '#34d399' : '#f87171'}" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${escapeXml(params.changePercent)}</text>

        <!-- Rates Box -->
        <rect x="420" y="-4" width="120" height="48" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <text x="480" y="14" fill="#94a3b8" font-family="sans-serif" font-size="10" text-anchor="middle">BANKA ALIŞ</text>
        <text x="480" y="34" fill="#10b981" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${escapeXml(params.buyRate)}</text>

        <rect x="552" y="-4" width="120" height="48" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <text x="612" y="14" fill="#94a3b8" font-family="sans-serif" font-size="10" text-anchor="middle">BANKA SATIŞ</text>
        <text x="612" y="34" fill="#ef4444" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${escapeXml(params.sellRate)}</text>
      </g>

      <!-- Sparkline Trend Chart -->
      <g transform="translate(0, 96)">
        <rect width="700" height="140" rx="12" fill="#090d16" stroke="#1e293b" stroke-width="1"/>
        <text x="24" y="28" fill="#64748b" font-family="sans-serif" font-size="11" font-weight="bold">CANLI 24 SAATLİK KUR GRAFİĞİ</text>
        
        <!-- Grid Lines -->
        <line x1="24" y1="50" x2="676" y2="50" stroke="#1e293b" stroke-width="1" stroke-dasharray="4"/>
        <line x1="24" y1="85" x2="676" y2="85" stroke="#1e293b" stroke-width="1" stroke-dasharray="4"/>
        <line x1="24" y1="120" x2="676" y2="120" stroke="#1e293b" stroke-width="1" stroke-dasharray="4"/>

        <!-- Sparkline Path -->
        <path d="M 24 110 Q 90 95 160 105 T 300 70 T 440 60 T 580 45 T 676 38" fill="none" stroke="#10b981" stroke-width="3"/>
        <circle cx="676" cy="38" r="5" fill="#10b981"/>
      </g>

      <!-- Execution Panel -->
      <g transform="translate(0, 252)">
        <rect width="700" height="170" rx="12" fill="#0f172a" stroke="${isExecuted ? '#059669' : '#dc2626'}" stroke-width="1.5"/>

        <rect x="24" y="20" width="312" height="80" rx="8" fill="#1e293b"/>
        <text x="40" y="44" fill="#94a3b8" font-family="sans-serif" font-size="11">İşlem Tutarı (Satılan):</text>
        <text x="40" y="78" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">${escapeXml(params.tradedAmount)}</text>

        <rect x="364" y="20" width="312" height="80" rx="8" fill="#1e293b"/>
        <text x="380" y="44" fill="#94a3b8" font-family="sans-serif" font-size="11">Hesaba Geçen (Alınan):</text>
        <text x="380" y="78" fill="#38bdf8" font-family="sans-serif" font-size="22" font-weight="bold">${escapeXml(params.totalReceived)}</text>

        <!-- Status Confirmation -->
        <rect x="24" y="114" width="652" height="42" rx="8" fill="${isExecuted ? '#064e3b' : '#7f1d1d'}"/>
        <text x="350" y="140" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">
          ${isExecuted ? '✓ Döviz Alış Emri Gerçekleşti • Kur Sabitlendi • Vadesiz FX Hesabına Aktarıldı' : '✕ Kur Değişti - İşlem Yeniden Fiyatlandırıldı'}
        </text>
      </g>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 6. ATM QR Code Cash Withdrawal Screen
 */
export function createATMQRCodeWithdrawalScreenshot(params: {
  atmName: string;
  amount: string;
  accountIbanMasked: string;
  dailyRemainingLimit: string;
  status: 'SCAN_READY' | 'COMPLETED' | 'EXPIRED';
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520">
    <rect width="100%" height="100%" fill="#090d16" rx="16"/>
    <rect x="0" y="0" width="760" height="46" fill="#1e293b" rx="16"/>
    <circle cx="28" cy="23" r="6.5" fill="#ef4444"/>
    <circle cx="48" cy="23" r="6.5" fill="#f59e0b"/>
    <circle cx="68" cy="23" r="6.5" fill="#10b981"/>
    <text x="96" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="600">📲 Kartsız ATM İşlemleri • QR Kod ile Anında Para Çekme</text>

    <g transform="translate(40, 68)">
      <!-- Left: Mobile Scanner View -->
      <rect width="320" height="410" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      <text x="24" y="34" fill="#94a3b8" font-family="sans-serif" font-size="12" font-weight="bold">MOBİL KAMERA TARAYICI</text>
      
      <!-- QR Scanner Target -->
      <rect x="40" y="56" width="240" height="240" rx="12" fill="#020617" stroke="#3b82f6" stroke-width="2"/>
      
      <!-- QR Pattern Mock -->
      <g transform="translate(64, 80)">
        <rect width="60" height="60" fill="#38bdf8" rx="4"/>
        <rect x="12" y="12" width="36" height="36" fill="#020617" rx="2"/>
        <rect x="20" y="20" width="20" height="20" fill="#38bdf8" rx="2"/>

        <rect x="132" width="60" height="60" fill="#38bdf8" rx="4"/>
        <rect x="144" y="12" width="36" height="36" fill="#020617" rx="2"/>
        <rect x="152" y="20" width="20" height="20" fill="#38bdf8" rx="2"/>

        <rect y="132" width="60" height="60" fill="#38bdf8" rx="4"/>
        <rect x="12" y="144" width="36" height="36" fill="#020617" rx="2"/>
        <rect x="20" y="152" width="20" height="20" fill="#38bdf8" rx="2"/>

        <!-- Middle Dots -->
        <circle cx="96" cy="30" r="6" fill="#38bdf8"/>
        <circle cx="96" cy="70" r="8" fill="#38bdf8"/>
        <circle cx="70" cy="96" r="6" fill="#38bdf8"/>
        <circle cx="120" cy="96" r="6" fill="#38bdf8"/>
        <circle cx="150" cy="150" r="10" fill="#38bdf8"/>
        <circle cx="96" cy="160" r="8" fill="#38bdf8"/>
      </g>

      <!-- Laser Scanner Line -->
      <line x1="42" y1="176" x2="278" y2="176" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="6"/>

      <text x="160" y="320" fill="#10b981" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">✓ QR Kod Başarıyla Okundu</text>
      <text x="160" y="340" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Kamera Odaklama &amp; Konum Doğrulandı</text>
    </g>

    <!-- Right: ATM Machine State -->
    <g transform="translate(390, 68)">
      <rect width="330" height="410" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      <rect x="0" y="0" width="330" height="54" rx="16" fill="#1e293b"/>
      <text x="20" y="32" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">🏧 ${escapeXml(params.atmName)}</text>

      <g transform="translate(20, 74)">
        <text x="0" y="20" fill="#94a3b8" font-family="sans-serif" font-size="11">Çekilecek Tutar:</text>
        <text x="290" y="20" fill="#38bdf8" font-family="sans-serif" font-size="20" font-weight="900" text-anchor="end">${escapeXml(params.amount)} TL</text>

        <line x1="0" y1="36" x2="290" y2="36" stroke="#1e293b" stroke-width="1"/>

        <text x="0" y="60" fill="#94a3b8" font-family="sans-serif" font-size="11">Kaynak Hesap:</text>
        <text x="290" y="60" fill="#e2e8f0" font-family="monospace" font-size="11" text-anchor="end">${escapeXml(params.accountIbanMasked)}</text>

        <line x1="0" y1="76" x2="290" y2="76" stroke="#1e293b" stroke-width="1"/>

        <text x="0" y="100" fill="#94a3b8" font-family="sans-serif" font-size="11">Kalan Günlük QR Limiti:</text>
        <text x="290" y="100" fill="#10b981" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="end">${escapeXml(params.dailyRemainingLimit)} TL</text>

        <line x1="0" y1="116" x2="290" y2="116" stroke="#1e293b" stroke-width="1"/>

        <!-- Banknote Breakdown -->
        <rect x="0" y="130" width="290" height="74" rx="8" fill="#1e293b"/>
        <text x="14" y="154" fill="#cbd5e1" font-family="sans-serif" font-size="11" font-weight="bold">Hazırlanan Banknotlar:</text>
        <text x="14" y="174" fill="#94a3b8" font-family="sans-serif" font-size="11">10 Adet ₺200 Banknot • ATM Para Yuvası Açılıyor</text>

        <rect x="0" y="224" width="290" height="50" rx="8" fill="#059669"/>
        <text x="145" y="254" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">💵 Paranızı Bölmeden Alınız</text>
      </g>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 7. Fraud & AML Security Alert Monitor
 */
export function createFraudAMLAlertScreenshot(params: {
  alertId: string;
  riskScore: number;
  threatType: string;
  customerName: string;
  sourceLocation: string;
  suspiciousLocation: string;
  actionTaken: string;
}): string {
  const isHighRisk = params.riskScore >= 80;
  const headerBg = isHighRisk ? '#7f1d1d' : '#78350f';
  const badgeColor = isHighRisk ? '#ef4444' : '#f59e0b';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520">
    <rect width="100%" height="100%" fill="#090d16" rx="16"/>
    <rect x="0" y="0" width="760" height="46" fill="#1e293b" rx="16"/>
    <circle cx="28" cy="23" r="6.5" fill="#ef4444"/>
    <circle cx="48" cy="23" r="6.5" fill="#f59e0b"/>
    <circle cx="68" cy="23" r="6.5" fill="#10b981"/>
    <text x="96" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="600">🚨 SOC Siber Güvenlik &amp; AML Sahtekarlık Tespit Motoru v2.4</text>

    <g transform="translate(30, 64)">
      <!-- Risk Header -->
      <rect width="700" height="80" rx="12" fill="${headerBg}" stroke="${badgeColor}" stroke-width="1.5"/>
      <circle cx="50" cy="40" r="24" fill="${badgeColor}"/>
      <text x="50" y="47" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">⚠️</text>

      <text x="90" y="32" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">KRİTİK GÜVENLİK ALARMI: ${escapeXml(params.threatType)}</text>
      <text x="90" y="54" fill="#fecaca" font-family="sans-serif" font-size="12">Alarm ID: <tspan font-family="monospace" font-weight="bold">${escapeXml(params.alertId)}</tspan> • Risk Skoru: <tspan font-weight="bold">${params.riskScore} / 100</tspan></text>

      <!-- Details Grid -->
      <g transform="translate(0, 96)">
        <rect width="700" height="200" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>

        <!-- Impossible Travel Visual -->
        <text x="24" y="32" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="bold">COĞRAFİ İMKANSIZ HIZ (IMPOSSIBLE TRAVEL) TESPİTİ:</text>

        <rect x="24" y="46" width="312" height="70" rx="8" fill="#1e293b"/>
        <text x="38" y="70" fill="#94a3b8" font-family="sans-serif" font-size="11">İlk Giriş Konumu (14:12):</text>
        <text x="38" y="94" fill="#e2e8f0" font-family="sans-serif" font-size="13" font-weight="bold">📍 ${escapeXml(params.sourceLocation)}</text>

        <rect x="364" y="46" width="312" height="70" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="1"/>
        <text x="378" y="70" fill="#f87171" font-family="sans-serif" font-size="11">Şüpheli Transfer İsteği (14:16):</text>
        <text x="378" y="94" fill="#fca5a5" font-family="sans-serif" font-size="13" font-weight="bold">🚨 ${escapeXml(params.suspiciousLocation)}</text>

        <line x1="24" y1="130" x2="676" y2="130" stroke="#1e293b" stroke-width="1"/>

        <text x="24" y="156" fill="#64748b" font-family="sans-serif" font-size="11">Etkilenen Hesap:</text>
        <text x="140" y="156" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">${escapeXml(params.customerName)}</text>

        <text x="24" y="180" fill="#64748b" font-family="sans-serif" font-size="11">Cihaz Parmak İzi:</text>
        <text x="140" y="180" fill="#f59e0b" font-family="monospace" font-size="11">Bilinmeyen Linux VM / Tor Çıkış Düğümü (Anormal Cihaz)</text>
      </g>

      <!-- Action Taken Console -->
      <g transform="translate(0, 312)">
        <rect width="700" height="96" rx="12" fill="#020617" stroke="#1e293b" stroke-width="1"/>
        <text x="24" y="28" fill="#10b981" font-family="monospace" font-size="11" font-weight="bold">&gt; OTO-BLOKE &amp; GÜVENLİK AKSİYONU:</text>
        <text x="24" y="52" fill="#cbd5e1" font-family="monospace" font-size="12">[AKSIYON] ${escapeXml(params.actionTaken)}</text>
        <text x="24" y="74" fill="#94a3b8" font-family="monospace" font-size="11">[BILDIRIM] SMS &amp; Push bildirim ile müşteriye 'Şüpheli Giriş Denemesi' uyarısı yollandı.</text>
      </g>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 8. Corporate Maker-Checker Approval Screen
 */
export function createMakerCheckerApprovalScreenshot(params: {
  batchId: string;
  companyName: string;
  creatorName: string;
  approverName: string;
  totalAmount: string;
  recipientCount: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}): string {
  const isApproved = params.status === 'APPROVED';
  const statusBg = isApproved ? '#064e3b' : '#78350f';
  const statusColor = isApproved ? '#10b981' : '#f59e0b';
  const statusText = isApproved ? '2. Seviye İmza Onayı Tamamlandı' : '1. Onay Verildi, 2. Yönetici İmzası Bekleniyor';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520">
    <rect width="100%" height="100%" fill="#090d16" rx="16"/>
    <rect x="0" y="0" width="760" height="46" fill="#1e293b" rx="16"/>
    <circle cx="28" cy="23" r="6.5" fill="#ef4444"/>
    <circle cx="48" cy="23" r="6.5" fill="#f59e0b"/>
    <circle cx="68" cy="23" r="6.5" fill="#10b981"/>
    <text x="96" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="600">🏢 NeoBank Kurumsal İnternet Şubesi • Çift Onaylı Toplu Ödeme İşlemi</text>

    <g transform="translate(30, 64)">
      <rect width="700" height="84" rx="12" fill="${statusBg}" stroke="${statusColor}" stroke-width="1.5"/>
      <circle cx="48" cy="42" r="22" fill="${statusColor}"/>
      <text x="48" y="50" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">${isApproved ? '✓' : '⌛'}</text>
      <text x="86" y="34" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">${escapeXml(statusText)}</text>
      <text x="86" y="56" fill="#cbd5e1" font-family="sans-serif" font-size="12">Toplu Transfer Paketi: <tspan font-family="monospace" font-weight="bold" fill="#38bdf8">${escapeXml(params.batchId)}</tspan> • Firma: <tspan font-weight="bold">${escapeXml(params.companyName)}</tspan></text>

      <g transform="translate(0, 98)">
        <rect width="700" height="190" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
        <text x="24" y="32" fill="#94a3b8" font-family="sans-serif" font-size="12" font-weight="bold">TOPLU TRANSFER BİLGİLERİ (MAKER-CHECKER MATRİSİ):</text>

        <rect x="24" y="48" width="310" height="60" rx="8" fill="#1e293b"/>
        <text x="38" y="70" fill="#94a3b8" font-family="sans-serif" font-size="11">1. Hazırlayan (Maker / Muhasebe Uzmanı):</text>
        <text x="38" y="92" fill="#e2e8f0" font-family="sans-serif" font-size="12" font-weight="bold">👤 ${escapeXml(params.creatorName)}</text>

        <rect x="366" y="48" width="310" height="60" rx="8" fill="#1e293b" stroke="${statusColor}" stroke-width="1"/>
        <text x="380" y="70" fill="#94a3b8" font-family="sans-serif" font-size="11">2. Onaylayan (Checker / CFO / İmza Yetkilisi):</text>
        <text x="380" y="92" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="bold">🔑 ${escapeXml(params.approverName)}</text>

        <line x1="24" y1="124" x2="676" y2="124" stroke="#1e293b" stroke-width="1"/>

        <text x="24" y="152" fill="#64748b" font-family="sans-serif" font-size="12">Toplam Bordro Tutarı:</text>
        <text x="170" y="152" fill="#10b981" font-family="sans-serif" font-size="16" font-weight="bold">${escapeXml(params.totalAmount)} TL</text>

        <text x="420" y="152" fill="#64748b" font-family="sans-serif" font-size="12">Kişi / Çalışan Sayısı:</text>
        <text x="560" y="152" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="bold">${params.recipientCount} Alıcı (ISO 20022)</text>
      </g>

      <g transform="translate(0, 304)">
        <rect width="700" height="100" rx="12" fill="#020617" stroke="#1e293b" stroke-width="1"/>
        <text x="24" y="28" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold">&gt; ELEKTRONİK İMZA &amp; MUTABAKAT PROTOKOLÜ:</text>
        <text x="24" y="52" fill="#cbd5e1" font-family="monospace" font-size="12">[E-IMZA] 5070 Sayılı Kanun Kapsamında Mobil İmza Doğrulaması Başarılı (SHA-256 HSM Token)</text>
        <text x="24" y="74" fill="#94a3b8" font-family="monospace" font-size="11">[CORE BANKING] Toplu FAST/EFT Kuyruğuna İletildi • Toplam 42 İşlem 1.2sn içinde Takasa Yollandı.</text>
      </g>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 9. BKM GEÇİT Open Banking API Response Screen
 */
export function createOpenBankingAPIScreenshot(params: {
  endpoint: string;
  tppName: string;
  consentId: string;
  statusCode: number;
  latencyMs: number;
}): string {
  const isSuccess = params.statusCode === 200;
  const statusBg = isSuccess ? '#064e3b' : '#7f1d1d';
  const statusColor = isSuccess ? '#10b981' : '#ef4444';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520">
    <rect width="100%" height="100%" fill="#090d16" rx="16"/>
    <rect x="0" y="0" width="760" height="46" fill="#1e293b" rx="16"/>
    <circle cx="28" cy="23" r="6.5" fill="#ef4444"/>
    <circle cx="48" cy="23" r="6.5" fill="#f59e0b"/>
    <circle cx="68" cy="23" r="6.5" fill="#10b981"/>
    <text x="96" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="600">🌐 BKM GEÇİT • Açık Bankacılık API Gateway (AISP / PISP v2.1)</text>

    <g transform="translate(30, 64)">
      <rect width="700" height="76" rx="12" fill="${statusBg}" stroke="${statusColor}" stroke-width="1.5"/>
      <text x="24" y="32" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">BKM GEÇİT Açık Bankacılık İstek Yanıtı: HTTP ${params.statusCode} OK</text>
      <text x="24" y="54" fill="#cbd5e1" font-family="sans-serif" font-size="12">Yetkili Üçüncü Taraf (TPP): <tspan font-weight="bold" fill="#38bdf8">${escapeXml(params.tppName)}</tspan> • Yanıt Süresi: <tspan font-weight="bold">${params.latencyMs}ms</tspan></text>

      <g transform="translate(0, 90)">
        <rect width="700" height="310" rx="12" fill="#020617" stroke="#1e293b" stroke-width="1"/>
        <text x="24" y="30" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold">API REQUEST &amp; RESPONSE PAYLOAD (JSON/mTLS):</text>

        <text x="24" y="58" fill="#94a3b8" font-family="monospace" font-size="11">GET ${escapeXml(params.endpoint)}</text>
        <text x="24" y="78" fill="#94a3b8" font-family="monospace" font-size="11">X-Consent-Id: ${escapeXml(params.consentId)}</text>
        <text x="24" y="98" fill="#94a3b8" font-family="monospace" font-size="11">Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...</text>

        <line x1="24" y1="112" x2="676" y2="112" stroke="#1e293b" stroke-width="1"/>

        <text x="24" y="136" fill="#10b981" font-family="monospace" font-size="12">{</text>
        <text x="44" y="156" fill="#cbd5e1" font-family="monospace" font-size="12">  "consentStatus": "VALID",</text>
        <text x="44" y="176" fill="#cbd5e1" font-family="monospace" font-size="12">  "accounts": [</text>
        <text x="64" y="196" fill="#cbd5e1" font-family="monospace" font-size="12">    { "iban": "TR330006200000012345678901", "currency": "TRY", "balance": 184520.50 },</text>
        <text x="64" y="216" fill="#cbd5e1" font-family="monospace" font-size="12">    { "iban": "TR770006200000019876543210", "currency": "USD", "balance": 12400.00 }</text>
        <text x="44" y="236" fill="#cbd5e1" font-family="monospace" font-size="12">  ],</text>
        <text x="44" y="256" fill="#cbd5e1" font-family="monospace" font-size="12">  "bkmGeçitTraceId": "BKM-2026-TR-88194",</text>
        <text x="44" y="276" fill="#cbd5e1" font-family="monospace" font-size="12">  "serverTime": "2026-08-27T14:30:00Z"</text>
        <text x="24" y="296" fill="#10b981" font-family="monospace" font-size="12">}</text>
      </g>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 10. KYC Remote Onboarding / OCR & NFC Liveness Verification
 */
export function createKYCOnboardingScreenshot(params: {
  customerName: string;
  tcknMasked: string;
  ocrStatus: string;
  nfcChipStatus: string;
  livenessConfidence: number;
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520">
    <rect width="100%" height="100%" fill="#090d16" rx="16"/>
    <rect x="0" y="0" width="760" height="46" fill="#1e293b" rx="16"/>
    <circle cx="28" cy="23" r="6.5" fill="#ef4444"/>
    <circle cx="48" cy="23" r="6.5" fill="#f59e0b"/>
    <circle cx="68" cy="23" r="6.5" fill="#10b981"/>
    <text x="96" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="600">📱 NeoBank Mobil • Uzaktan Müşteri Edinimi &amp; Biyometrik Kimlik Doğrulama (KYC)</text>

    <g transform="translate(30, 64)">
      <rect width="700" height="76" rx="12" fill="#064e3b" stroke="#10b981" stroke-width="1.5"/>
      <text x="24" y="32" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">Uzaktan Müşteri Kabulü Başarılı (BDDK 2021/4 Uyumlu)</text>
      <text x="24" y="54" fill="#cbd5e1" font-family="sans-serif" font-size="12">Müşteri: <tspan font-weight="bold" fill="#38bdf8">${escapeXml(params.customerName)}</tspan> • TCKN: <tspan font-family="monospace" font-weight="bold">${escapeXml(params.tcknMasked)}</tspan></text>

      <g transform="translate(0, 90)">
        <rect width="700" height="210" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
        <text x="24" y="30" fill="#94a3b8" font-family="sans-serif" font-size="12" font-weight="bold">BİYOMETRİK VE ÇİP DOĞRULAMA DETAYLARI:</text>

        <rect x="24" y="46" width="200" height="80" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1"/>
        <text x="36" y="68" fill="#94a3b8" font-family="sans-serif" font-size="11">1. T.C. Kimlik OCR:</text>
        <text x="36" y="90" fill="#10b981" font-family="sans-serif" font-size="13" font-weight="bold">✓ ${escapeXml(params.ocrStatus)}</text>
        <text x="36" y="110" fill="#64748b" font-family="sans-serif" font-size="10">MRZ &amp; Holo Doğrulandı</text>

        <rect x="250" y="46" width="200" height="80" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1"/>
        <text x="262" y="68" fill="#94a3b8" font-family="sans-serif" font-size="11">2. Temassız NFC Çip:</text>
        <text x="262" y="90" fill="#10b981" font-family="sans-serif" font-size="13" font-weight="bold">✓ ${escapeXml(params.nfcChipStatus)}</text>
        <text x="262" y="110" fill="#64748b" font-family="sans-serif" font-size="10">ICAO 9303 Sertifikalı</text>

        <rect x="476" y="46" width="200" height="80" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1"/>
        <text x="488" y="68" fill="#94a3b8" font-family="sans-serif" font-size="11">3. Canlılık (Liveness):</text>
        <text x="488" y="90" fill="#38bdf8" font-family="sans-serif" font-size="13" font-weight="bold">✓ %${params.livenessConfidence} Güven</text>
        <text x="488" y="110" fill="#64748b" font-family="sans-serif" font-size="10">3D Yüz Haritalama</text>

        <line x1="24" y1="144" x2="676" y2="144" stroke="#1e293b" stroke-width="1"/>

        <text x="24" y="172" fill="#64748b" font-family="sans-serif" font-size="12">Görüntülü Müşteri Temsilcisi:</text>
        <text x="220" y="172" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">Ayşe Demir (Müşteri Kabul Temsilcisi #841)</text>

        <text x="24" y="194" fill="#64748b" font-family="sans-serif" font-size="12">Açılan Temel Hesap:</text>
        <text x="220" y="194" fill="#10b981" font-family="monospace" font-size="12" font-weight="bold">TR33 0006 2000 0001 9988 7766 55 (TL Vadesiz)</text>
      </g>

      <g transform="translate(0, 316)">
        <rect width="700" height="86" rx="12" fill="#020617" stroke="#1e293b" stroke-width="1"/>
        <text x="24" y="28" fill="#10b981" font-family="monospace" font-size="11" font-weight="bold">&gt; SÖZLEŞME VE HESAP AKTİVASYON LOGU:</text>
        <text x="24" y="52" fill="#cbd5e1" font-family="monospace" font-size="12">[ONAY] Dijital Bankacılık Temel Bankacılık Sözleşmesi ve KVKK İzni SMS OTP ile İmzalandı.</text>
        <text x="24" y="72" fill="#94a3b8" font-family="monospace" font-size="11">[CORE] Müşteri No: 84920194 oluşturuldu • Vadesiz hesap anında kullanıma açıldı.</text>
      </g>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

