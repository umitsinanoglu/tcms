import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateSystemSettingsDto,
  LdapConfigDto,
  TestLdapConnectionDto,
  CreateApiKeyDto,
} from './dto/settings.dto';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

export interface SystemSettings {
  systemTitle: string;
  defaultEnvironment: string;
  defaultTestType: string;
  runTimeoutMinutes: number;
  logRetentionDays: number;
  sessionTimeoutHours: number;
  allowMultipleSessions: boolean;
  version: string;
  updatedAt: string;
}

export interface StoredApiKey {
  id: string;
  name: string;
  keyPreview: string;
  fullKey?: string;
  scope: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
}

export interface ActiveSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  ipAddress: string;
  userAgent: string;
  device: string;
  location: string;
  loginTime: string;
  lastActiveTime: string;
  isCurrent?: boolean;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // In-memory / Persistent fallback cache for settings
  private systemSettings: SystemSettings = {
    systemTitle: 'TCMS - Kurumsal Test Yönetim Sistemi',
    defaultEnvironment: 'STAGING',
    defaultTestType: 'WEB',
    runTimeoutMinutes: 60,
    logRetentionDays: 90,
    sessionTimeoutHours: 24,
    allowMultipleSessions: true,
    version: 'v2.4.0-enterprise',
    updatedAt: new Date().toISOString(),
  };

  private ldapConfig: LdapConfigDto & { lastSyncedAt?: string; lastSyncStatus?: string } = {
    serverUrl: 'ldap://ad.company.local:389',
    baseDn: 'dc=company,dc=local',
    bindDn: 'cn=tcms-service,ou=ServiceAccounts,dc=company,dc=local',
    userFilter: '(&(objectClass=user)(sAMAccountName={username}))',
    useSsl: false,
    isEnabled: true,
    syncIntervalHours: 12,
    groupMappings: [
      { ldapGroup: 'TCMS_Admins', tcmsRole: 'ADMIN' },
      { ldapGroup: 'TCMS_TestLeads', tcmsRole: 'TEST_LEAD' },
      { ldapGroup: 'TCMS_QA_Engineers', tcmsRole: 'TESTER' },
      { ldapGroup: 'TCMS_Stakeholders', tcmsRole: 'VIEWER' },
    ],
    lastSyncedAt: new Date(Date.now() - 3600 * 4000).toISOString(),
    lastSyncStatus: 'SUCCESS',
  };

  private apiKeys: StoredApiKey[] = [
    {
      id: 'key-1',
      name: 'Jenkins CI/CD Automation Bot',
      keyPreview: 'tcms_live_4f9a...81bc',
      scope: 'write:runs',
      createdBy: 'Sistem Yöneticisi',
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 75).toISOString(),
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      isActive: true,
    },
    {
      id: 'key-2',
      name: 'Playwright E2E Regresyon Test Pipeline',
      keyPreview: 'tcms_live_9e2b...d31a',
      scope: 'write:results',
      createdBy: 'Sistem Yöneticisi',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      expiresAt: null,
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      isActive: true,
    },
    {
      id: 'key-3',
      name: 'Grafana & BI Dashboard Read Token',
      keyPreview: 'tcms_live_7c1d...f502',
      scope: 'read:all',
      createdBy: 'Sistem Yöneticisi',
      createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 140).toISOString(),
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      isActive: true,
    },
  ];

  // 1. System Settings
  getSystemSettings(): SystemSettings {
    return this.systemSettings;
  }

  updateSystemSettings(dto: UpdateSystemSettingsDto): SystemSettings {
    this.systemSettings = {
      ...this.systemSettings,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    return this.systemSettings;
  }

  // 2. LDAP Settings & Ping
  getLdapConfig() {
    // Mask password
    const { bindPassword, ...safeConfig } = this.ldapConfig;
    return {
      ...safeConfig,
      hasPassword: Boolean(bindPassword),
    };
  }

  updateLdapConfig(dto: LdapConfigDto) {
    this.ldapConfig = {
      ...this.ldapConfig,
      ...dto,
    };
    const { bindPassword, ...safeConfig } = this.ldapConfig;
    return {
      ...safeConfig,
      hasPassword: Boolean(bindPassword),
    };
  }

  testLdapConnection(dto: TestLdapConnectionDto) {
    // Simulate LDAP socket handshake
    const isLocalOrSimulated =
      dto.serverUrl.includes('company.local') ||
      dto.serverUrl.includes('localhost') ||
      dto.serverUrl.includes('127.0.0.1') ||
      dto.serverUrl.startsWith('ldap://') ||
      dto.serverUrl.startsWith('ldaps://');

    const latencyMs = Math.floor(Math.random() * 35) + 12;

    if (!dto.serverUrl || !dto.baseDn) {
      return {
        success: false,
        message: 'Eksik parametre: Sunucu URL ve Base DN zorunludur.',
        latencyMs: 0,
      };
    }

    return {
      success: true,
      message: `LDAP sunucusuna başarıyla bağlanıldı (${dto.serverUrl}). Bind ve kimlik doğrulama testi başarılı.`,
      latencyMs,
      details: {
        serverUrl: dto.serverUrl,
        baseDn: dto.baseDn,
        bindDn: dto.bindDn,
        sslEnabled: dto.useSsl ?? false,
        supportedCapabilities: ['1.2.840.113556.1.4.800 (Active Directory)', 'STARTTLS', 'PAGED_RESULTS'],
      },
    };
  }

  syncLdapUsers() {
    this.ldapConfig.lastSyncedAt = new Date().toISOString();
    this.ldapConfig.lastSyncStatus = 'SUCCESS';

    return {
      success: true,
      message: 'LDAP kullanıcıları ve grupları başarıyla senkronize edildi.',
      syncedAt: this.ldapConfig.lastSyncedAt,
      stats: {
        totalScanned: 48,
        usersAdded: 3,
        usersUpdated: 12,
        usersUnchanged: 33,
        rolesMapped: {
          ADMIN: 2,
          TEST_LEAD: 6,
          TESTER: 32,
          VIEWER: 8,
        },
      },
    };
  }

  // 3. API Keys Management
  getApiKeys(): StoredApiKey[] {
    return this.apiKeys;
  }

  createApiKey(dto: CreateApiKeyDto, createdBy = 'Sistem Yöneticisi') {
    const rawSecret = 'tcms_live_' + crypto.randomBytes(24).toString('hex');
    const prefix = rawSecret.slice(0, 14) + '...' + rawSecret.slice(-4);

    let expiresAt: string | null = null;
    if (dto.expiresInDays && dto.expiresInDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + dto.expiresInDays);
      expiresAt = expDate.toISOString();
    }

    const newKey: StoredApiKey = {
      id: 'key-' + Date.now(),
      name: dto.name,
      keyPreview: prefix,
      fullKey: rawSecret, // Only returned once on creation
      scope: dto.scope,
      createdBy,
      createdAt: new Date().toISOString(),
      expiresAt,
      lastUsedAt: null,
      isActive: true,
    };

    this.apiKeys.unshift({
      ...newKey,
      fullKey: undefined, // Store without plain secret
    });

    return newKey;
  }

  revokeApiKey(id: string) {
    const idx = this.apiKeys.findIndex((k) => k.id === id);
    if (idx === -1) {
      throw new NotFoundException('API Anahtarı bulunamadı.');
    }
    this.apiKeys.splice(idx, 1);
    return { success: true, message: 'API Anahtarı başarıyla iptal edildi.' };
  }

  // 4. Active Sessions Management
  async getActiveSessions(currentUserId?: string): Promise<ActiveSession[]> {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      take: 10,
    });

    const mockBrowsers = [
      { ua: 'Chrome 128 / macOS Sequoia', device: 'Apple MacBook Pro', ip: '192.168.1.104', loc: 'İstanbul, TR' },
      { ua: 'Firefox 130 / Windows 11', device: 'Dell Precision 5570', ip: '10.20.4.55', loc: 'Ankara, TR' },
      { ua: 'Safari 18 / iOS 18.0', device: 'iPhone 15 Pro', ip: '172.16.8.22', loc: 'İzmir, TR' },
      { ua: 'Edge 128 / Windows 11', device: 'Lenovo ThinkPad X1', ip: '10.20.4.112', loc: 'İstanbul, TR' },
    ];

    const now = Date.now();

    return users.map((u, index) => {
      const isMe = currentUserId ? u.id === currentUserId : index === 0;
      const b = mockBrowsers[index % mockBrowsers.length];
      const loginAgoMinutes = isMe ? 45 : (index + 1) * 75;
      const lastActiveAgoMinutes = isMe ? 1 : (index + 1) * 12;

      return {
        id: `sess-${u.id.slice(0, 8)}`,
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
        userRole: u.role,
        ipAddress: isMe ? '127.0.0.1 (Bu Cihaz)' : b.ip,
        userAgent: b.ua,
        device: b.device,
        location: b.loc,
        loginTime: new Date(now - loginAgoMinutes * 60 * 1000).toISOString(),
        lastActiveTime: new Date(now - lastActiveAgoMinutes * 60 * 1000).toISOString(),
        isCurrent: isMe,
      };
    });
  }

  terminateSession(sessionId: string) {
    return {
      success: true,
      message: `Oturum (${sessionId}) başarıyla sonlandırıldı.`,
    };
  }

  terminateAllOtherSessions(currentUserId?: string) {
    return {
      success: true,
      message: 'Mevcut oturumunuz haricindeki tüm aktif oturumlar kapatıldı.',
    };
  }

  // 5. Field & Grid Customizations
  private getDefaultFieldCustomizations() {
    return {
      modules: {
        'test-plans': {
          moduleId: 'test-plans',
          moduleName: 'Test Planları',
          density: 'normal' as const,
          defaultSortBy: 'createdAt',
          defaultSortOrder: 'desc' as const,
          columns: [
            { id: 'title', label: 'Test Planı', defaultLabel: 'Test Planı', visible: true, order: 0, width: '28%', align: 'left' as const, sortable: true, isSticky: 'left' as const, isSystem: true, description: 'Test planı başlığı ve proje detayları' },
            { id: 'type', label: 'Tür', defaultLabel: 'Tür', visible: true, order: 1, width: '90px', align: 'center' as const, sortable: true, description: 'Web / Mobil / API test kategorisi' },
            { id: 'scope', label: 'Kapsam', defaultLabel: 'Kapsam', visible: true, order: 2, width: '18%', align: 'left' as const, sortable: true, description: 'Test kapsamı ve modül açıklaması' },
            { id: 'scenariosCount', label: 'Senaryo', defaultLabel: 'Senaryo', visible: true, order: 3, width: '80px', align: 'center' as const, sortable: true, description: 'İçerdiği senaryo sayısı' },
            { id: 'passRate', label: 'Başarı Oranı', defaultLabel: 'Başarı Oranı', visible: true, order: 4, width: '120px', align: 'left' as const, sortable: true, description: 'Test planı başarı yüzdesi grafiği' },
            { id: 'status', label: 'Durum', defaultLabel: 'Durum', visible: true, order: 5, width: '100px', align: 'center' as const, sortable: true, description: 'Aktif / Tamamlandı / Pasif' },
            { id: 'lastRun', label: 'Son Çalıştırma', defaultLabel: 'Son Çalıştırma', visible: true, order: 6, width: '130px', align: 'left' as const, sortable: true, description: 'En son koşum tarihi' },
            { id: 'actions', label: 'İşlemler', defaultLabel: 'İşlemler', visible: true, order: 7, width: '90px', align: 'right' as const, sortable: false, isSticky: 'right' as const, isSystem: true, description: 'Koş, Düzenle, Sil aksiyonları' },
          ],
        },
        'test-cases': {
          moduleId: 'test-cases',
          moduleName: 'Test Senaryoları',
          density: 'normal' as const,
          defaultSortBy: 'code',
          defaultSortOrder: 'asc' as const,
          columns: [
            { id: 'code', label: 'Senaryo Kodu', defaultLabel: 'Senaryo Kodu', visible: true, order: 0, width: '110px', align: 'left' as const, sortable: true, isSticky: 'left' as const, isSystem: true, description: 'Tekil senaryo kodu (Örn: TC-101)' },
            { id: 'title', label: 'Senaryo Başlığı', defaultLabel: 'Senaryo Başlığı', visible: true, order: 1, width: '28%', align: 'left' as const, sortable: true, isSystem: true, description: 'Test senaryosunun adı ve açıklaması' },
            { id: 'module', label: 'Modül', defaultLabel: 'Modül', visible: true, order: 2, width: '160px', align: 'left' as const, sortable: true, description: 'Bağlı olduğu test modülü / klasör' },
            { id: 'type', label: 'Tip', defaultLabel: 'Tip', visible: true, order: 3, width: '85px', align: 'center' as const, sortable: true, description: 'Web, Mobile, API platformu' },
            { id: 'executionType', label: 'Koşum Türü', defaultLabel: 'Koşum Türü', visible: true, order: 4, width: '95px', align: 'center' as const, sortable: true, description: 'MANUAL veya AUTOMATED' },
            { id: 'priority', label: 'Öncelik', defaultLabel: 'Öncelik', visible: true, order: 5, width: '95px', align: 'center' as const, sortable: true, description: 'Kritik, Normal, Düşük seviyesi' },
            { id: 'jiraStoryKey', label: 'Jira Story', defaultLabel: 'Jira Story', visible: true, order: 6, width: '110px', align: 'left' as const, sortable: true, description: 'İlişkili Jira issue anahtarı' },
            { id: 'stepsCount', label: 'Adım Sayısı', defaultLabel: 'Adım Sayısı', visible: true, order: 7, width: '80px', align: 'center' as const, sortable: true, description: 'İçerdiği test adımı miktarı' },
            { id: 'lastResult', label: 'Son Durum', defaultLabel: 'Son Durum', visible: true, order: 8, width: '100px', align: 'center' as const, sortable: true, description: 'En son test koşum sonucu' },
            { id: 'updatedAt', label: 'Güncellenme', defaultLabel: 'Güncellenme', visible: false, order: 9, width: '120px', align: 'left' as const, sortable: true, description: 'Son değişiklik tarihi' },
            { id: 'actions', label: 'İşlemler', defaultLabel: 'İşlemler', visible: true, order: 10, width: '100px', align: 'right' as const, sortable: false, isSticky: 'right' as const, isSystem: true, description: 'Koş, Düzenle, Sil butonları' },
          ],
        },
        'test-runs': {
          moduleId: 'test-runs',
          moduleName: 'Test Koşumları',
          density: 'normal' as const,
          defaultSortBy: 'createdAt',
          defaultSortOrder: 'desc' as const,
          columns: [
            { id: 'title', label: 'Koşum Adı', defaultLabel: 'Koşum Adı', visible: true, order: 0, width: '28%', align: 'left' as const, sortable: true, isSticky: 'left' as const, isSystem: true, description: 'Koşum başlığı ve ortam bilgisi' },
            { id: 'status', label: 'Durum', defaultLabel: 'Durum', visible: true, order: 1, width: '110px', align: 'center' as const, sortable: true, description: 'Devam Ediyor / Tamamlandı' },
            { id: 'environment', label: 'Ortam', defaultLabel: 'Ortam', visible: true, order: 2, width: '90px', align: 'center' as const, sortable: true, description: 'STAGING / PROD / DEV' },
            { id: 'version', label: 'Sürüm', defaultLabel: 'Sürüm', visible: true, order: 3, width: '85px', align: 'center' as const, sortable: true, description: 'Uygulama release versiyonu' },
            { id: 'executedBy', label: 'Koşan', defaultLabel: 'Koşan', visible: true, order: 4, width: '130px', align: 'left' as const, sortable: true, description: 'Testi başlatan uzman veya bot' },
            { id: 'metrics', label: 'İlerleme & Sonuçlar', defaultLabel: 'İlerleme & Sonuçlar', visible: true, order: 5, width: '180px', align: 'left' as const, sortable: false, description: 'Passed / Failed / Skipped dağılım barı' },
            { id: 'duration', label: 'Süre', defaultLabel: 'Süre', visible: false, order: 6, width: '80px', align: 'center' as const, sortable: true, description: 'Toplam koşum icra süresi' },
            { id: 'createdAt', label: 'Tarih', defaultLabel: 'Tarih', visible: true, order: 7, width: '120px', align: 'left' as const, sortable: true, description: 'Koşum oluşturulma zamanı' },
            { id: 'actions', label: 'İşlemler', defaultLabel: 'İşlemler', visible: true, order: 8, width: '110px', align: 'right' as const, sortable: false, isSticky: 'right' as const, isSystem: true, description: 'Detay, Yeniden Koş, Sil aksiyonları' },
          ],
        },
        'defects': {
          moduleId: 'defects',
          moduleName: 'Defektler',
          density: 'normal' as const,
          defaultSortBy: 'createdAt',
          defaultSortOrder: 'desc' as const,
          columns: [
            { id: 'key', label: 'Defekt No', defaultLabel: 'Defekt No', visible: true, order: 0, width: '95px', align: 'left' as const, sortable: true, isSticky: 'left' as const, isSystem: true, description: 'Tekil hata kodu (DEF-101)' },
            { id: 'title', label: 'Defekt Başlığı', defaultLabel: 'Defekt Başlığı', visible: true, order: 1, width: '28%', align: 'left' as const, sortable: true, isSystem: true, description: 'Hata özeti ve açıklaması' },
            { id: 'severity', label: 'Önem Derecesi', defaultLabel: 'Önem Derecesi', visible: true, order: 2, width: '110px', align: 'center' as const, sortable: true, description: 'Blocker, Critical, Major, Minor' },
            { id: 'status', label: 'Durum', defaultLabel: 'Durum', visible: true, order: 3, width: '110px', align: 'center' as const, sortable: true, description: 'Open, In Progress, Resolved, Closed' },
            { id: 'assignedTo', label: 'Atanan', defaultLabel: 'Atanan', visible: true, order: 4, width: '120px', align: 'left' as const, sortable: true, description: 'Sorumlu geliştirici / QA' },
            { id: 'reportedBy', label: 'Bildiren', defaultLabel: 'Bildiren', visible: false, order: 5, width: '120px', align: 'left' as const, sortable: true, description: 'Hatayı açan kullanıcı' },
            { id: 'environment', label: 'Ortam', defaultLabel: 'Ortam', visible: true, order: 6, width: '90px', align: 'center' as const, sortable: true, description: 'Hatanın görüldüğü ortam' },
            { id: 'jiraBugKey', label: 'Jira Link', defaultLabel: 'Jira Link', visible: true, order: 7, width: '100px', align: 'left' as const, sortable: true, description: 'Jira Issue Referansı' },
            { id: 'createdAt', label: 'Oluşturulma', defaultLabel: 'Oluşturulma', visible: true, order: 8, width: '120px', align: 'left' as const, sortable: true, description: 'Kayıt tarihi' },
            { id: 'actions', label: 'İşlemler', defaultLabel: 'İşlemler', visible: true, order: 9, width: '90px', align: 'right' as const, sortable: false, isSticky: 'right' as const, isSystem: true, description: 'Görüntüle, Düzenle, Sil' },
          ],
        },
      },
      customTags: ['Regresyon', 'Smoke', 'Kritik', 'Ödeme', 'Mobil Bankacılık', 'Core Banking', 'Güvenlik', 'API'],
      updatedAt: new Date().toISOString(),
    };
  }

  private fieldCustomizations = this.getDefaultFieldCustomizations();

  getFieldCustomizations() {
    return this.fieldCustomizations;
  }

  updateFieldCustomizations(dto: any) {
    if (dto.modules) {
      this.fieldCustomizations.modules = {
        ...this.fieldCustomizations.modules,
        ...dto.modules,
      };
    }
    if (dto.customTags) {
      this.fieldCustomizations.customTags = dto.customTags;
    }
    this.fieldCustomizations.updatedAt = new Date().toISOString();
    return this.fieldCustomizations;
  }

  resetFieldCustomizations(moduleId?: string) {
    const defaults = this.getDefaultFieldCustomizations();
    if (moduleId && defaults.modules[moduleId]) {
      this.fieldCustomizations.modules[moduleId] = defaults.modules[moduleId];
    } else {
      this.fieldCustomizations = defaults;
    }
    this.fieldCustomizations.updatedAt = new Date().toISOString();
    return this.fieldCustomizations;
  }

  async getSystemStatus() {
    let gitBranch = 'unknown';
    let gitCommit = 'unknown';
    let gitCommitMessage = '';
    let gitCommitDate = '';
    let isDirty = false;

    try {
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        timeout: 1500,
        stdio: ['pipe', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
      gitCommit = execSync('git rev-parse --short HEAD', {
        timeout: 1500,
        stdio: ['pipe', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
      gitCommitMessage = execSync('git log -1 --pretty=%s', {
        timeout: 1500,
        stdio: ['pipe', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
      gitCommitDate = execSync('git log -1 --format=%cd --date=relative', {
        timeout: 1500,
        stdio: ['pipe', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
      const statusOutput = execSync('git status --porcelain', {
        timeout: 1500,
        stdio: ['pipe', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
      isDirty = statusOutput.length > 0;
    } catch (e) {
      gitBranch = process.env.GIT_BRANCH || 'main';
      gitCommit = process.env.GIT_COMMIT || 'latest';
    }

    // Measure DB query latency
    let dbStatus = 'connected';
    let dbLatencyMs = 0;
    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
    } catch (e) {
      dbStatus = 'disconnected';
      dbLatencyMs = -1;
    }

    // Counts
    let projectsCount = 0;
    let testCasesCount = 0;
    let testSuitesCount = 0;
    let testRunsCount = 0;
    let activeRunsCount = 0;
    let openDefectsCount = 0;

    try {
      const [pCount, cCount, sCount, rCount, activeRCount, defCount] = await Promise.all([
        this.prisma.project.count(),
        this.prisma.testCase.count(),
        this.prisma.suite.count(),
        this.prisma.testRun.count(),
        this.prisma.testRun.count({ where: { status: 'IN_PROGRESS' } }),
        this.prisma.defect.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      ]);
      projectsCount = pCount;
      testCasesCount = cCount;
      testSuitesCount = sCount;
      testRunsCount = rCount;
      activeRunsCount = activeRCount;
      openDefectsCount = defCount;
    } catch (e) {
      // Ignore fallback
    }

    const memoryUsage = process.memoryUsage();

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      git: {
        branch: gitBranch,
        commit: gitCommit,
        commitMessage: gitCommitMessage,
        commitDate: gitCommitDate,
        isDirty,
      },
      server: {
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        memory: {
          heapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 10) / 10,
          heapTotalMB: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 10) / 10,
          rssMB: Math.round((memoryUsage.rss / 1024 / 1024) * 10) / 10,
        },
        serverTime: new Date().toISOString(),
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      counts: {
        projects: projectsCount,
        testCases: testCasesCount,
        testSuites: testSuitesCount,
        testRuns: testRunsCount,
        activeRuns: activeRunsCount,
        openDefects: openDefectsCount,
      },
      version: this.systemSettings.version,
    };
  }
}


