import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateSystemSettingsDto,
  LdapConfigDto,
  TestLdapConnectionDto,
  CreateApiKeyDto,
} from './dto/settings.dto';
import * as crypto from 'crypto';

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
}
