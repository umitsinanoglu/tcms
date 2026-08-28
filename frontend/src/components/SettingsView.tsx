'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Project,
  User,
  UserRole,
  UsersService,
  ProjectsService,
  SettingsService,
  SystemSettings,
  LdapConfig,
  ApiKeyItem,
  ActiveSessionItem,
  LdapTestResult,
  LdapSyncResult,
  WebhooksService,
  CreateUserInput,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Users,
  ShieldCheck,
  ShieldAlert,
  Key,
  Webhook,
  Network,
  Lock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Laptop,
  Smartphone,
  Globe,
  Radio,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Sparkles,
  Zap,
  Server,
  Code2,
  Save,
  CheckSquare,
  XSquare,
  Clock,
  Terminal,
} from 'lucide-react';

export type SettingsTab =
  | 'PROJECTS_SYSTEM'
  | 'USERS'
  | 'SESSIONS'
  | 'ROLES'
  | 'LDAP'
  | 'API_KEYS'
  | 'WEBHOOKS';

interface SettingsViewProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (p: Project) => void;
  onRefreshProjects: () => Promise<void>;
  onOpenCreateProject?: () => void;
  onOpenEditProject?: (p: Project) => void;
  onDeleteProject?: (id: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  onRefreshProjects,
  onOpenCreateProject,
  onOpenEditProject,
  onDeleteProject,
}) => {
  const { currentUser, users, refreshUsers, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('PROJECTS_SYSTEM');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'SUCCESS' | 'ERROR'; msg: string } | null>(null);

  const showToast = (type: 'SUCCESS' | 'ERROR', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. System Settings State
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    systemTitle: 'TCMS - Kurumsal Test Yönetim Sistemi',
    defaultEnvironment: 'STAGING',
    defaultTestType: 'WEB',
    runTimeoutMinutes: 60,
    logRetentionDays: 90,
    sessionTimeoutHours: 24,
    allowMultipleSessions: true,
    version: 'v2.4.0-enterprise',
    updatedAt: new Date().toISOString(),
  });
  const [isSavingSystem, setIsSavingSystem] = useState(false);

  // 2. User Management Form Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState<CreateUserInput>({
    name: '',
    email: '',
    role: 'TESTER',
    department: 'Kalite Güvence / QA',
    avatarUrl: '',
  });
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // 3. Active Sessions State
  const [sessions, setSessions] = useState<ActiveSessionItem[]>([]);

  // 4. LDAP State
  const [ldapConfig, setLdapConfig] = useState<LdapConfig>({
    serverUrl: 'ldap://ad.company.local:389',
    baseDn: 'dc=company,dc=local',
    bindDn: 'cn=tcms-service,ou=ServiceAccounts,dc=company,dc=local',
    bindPassword: '',
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
  });
  const [isTestingLdap, setIsTestingLdap] = useState(false);
  const [ldapTestResult, setLdapTestResult] = useState<LdapTestResult | null>(null);
  const [isSyncingLdap, setIsSyncingLdap] = useState(false);
  const [ldapSyncResult, setLdapSyncResult] = useState<LdapSyncResult | null>(null);
  const [showLdapPassword, setShowLdapPassword] = useState(false);

  // 5. API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    scope: 'write:runs',
    expiresInDays: 90,
  });
  const [createdKeySecret, setCreatedKeySecret] = useState<string | null>(null);

  // 6. Webhooks State
  const [webhooksList, setWebhooksList] = useState<
    {
      id: string;
      name: string;
      url: string;
      secretToken: string;
      events: string[];
      isActive: boolean;
      lastTriggeredAt?: string;
      lastStatus?: number;
    }[]
  >([
    {
      id: 'wh-1',
      name: 'Test Otomasyon Merkezi (Playwright & Mobile Hub)',
      url: 'http://localhost:8000/api/webhook/trigger',
      secretToken: 'tcms_wh_sec_89fa12b',
      events: ['test_run.started', 'test_run.completed'],
      isActive: true,
      lastTriggeredAt: '12 dakika önce',
      lastStatus: 200,
    },
    {
      id: 'wh-2',
      name: 'Kurumsal Slack / Teams QA Kanal Bildirimi',
      url: 'https://hooks.slack.com/services/T00/B00/XXXXX',
      secretToken: 'tcms_wh_sec_51bc99a',
      events: ['defect.created', 'test_run.completed'],
      isActive: true,
      lastTriggeredAt: '2 saat önce',
      lastStatus: 200,
    },
  ]);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [newWebhookData, setNewWebhookData] = useState({
    name: '',
    url: '',
    secretToken: '',
    events: ['test_run.started', 'test_run.completed'],
  });
  const [isPingingWebhook, setIsPingingWebhook] = useState<string | null>(null);
  const [webhookPingResult, setWebhookPingResult] = useState<{ id: string; success: boolean; msg: string } | null>(
    null,
  );

  // Load Initial Settings Data
  const loadAllSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sysRes, ldapRes, keysRes, sessRes] = await Promise.all([
        SettingsService.getSystemSettings().catch(() => null),
        SettingsService.getLdapConfig().catch(() => null),
        SettingsService.getApiKeys().catch(() => []),
        SettingsService.getActiveSessions().catch(() => []),
      ]);

      if (sysRes) setSystemSettings(sysRes);
      if (ldapRes) setLdapConfig((prev) => ({ ...prev, ...ldapRes }));
      if (keysRes) setApiKeys(keysRes);
      if (sessRes) setSessions(sessRes);
    } catch (err) {
      console.error('Settings load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    showToast('SUCCESS', 'Panoya kopyalandı!');
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  // --- Handlers: 1. System Settings ---
  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSystem(true);
      const updated = await SettingsService.updateSystemSettings(systemSettings);
      setSystemSettings(updated);
      showToast('SUCCESS', 'Sistem ayarları başarıyla kaydedildi.');
    } catch (err: any) {
      showToast('ERROR', err.response?.data?.message || 'Sistem ayarları kaydedilemedi.');
    } finally {
      setIsSavingSystem(false);
    }
  };

  // --- Handlers: 2. User Management ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      showToast('ERROR', 'Lütfen ad-soyad ve e-posta alanlarını eksiksiz doldurunuz.');
      return;
    }
    try {
      await UsersService.createUser({
        name: userFormData.name.trim(),
        email: userFormData.email.trim().toLowerCase(),
        role: userFormData.role,
        department: userFormData.department?.trim() || undefined,
        avatarUrl: userFormData.avatarUrl?.trim() || undefined,
      });
      await refreshUsers();
      setIsUserModalOpen(false);
      setUserFormData({
        name: '',
        email: '',
        role: 'TESTER',
        department: 'Kalite Güvence / QA',
        avatarUrl: '',
      });
      showToast('SUCCESS', 'Yeni kullanıcı başarıyla oluşturuldu.');
    } catch (err: any) {
      showToast('ERROR', err.response?.data?.message || 'Kullanıcı oluşturulurken bir hata meydana geldi.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await UsersService.updateUser(userId, { role: newRole });
      await refreshUsers();
      showToast('SUCCESS', 'Kullanıcı rolü güncellendi.');
    } catch (err: any) {
      showToast('ERROR', err.response?.data?.message || 'Rol güncellenemedi.');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await UsersService.updateUser(user.id, { isActive: !user.isActive });
      await refreshUsers();
      showToast('SUCCESS', `Kullanıcı ${!user.isActive ? 'aktif edildi' : 'pasifleştirildi'}.`);
    } catch (err: any) {
      showToast('ERROR', err.response?.data?.message || 'Kullanıcı durumu değiştirilemedi.');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('Kendi hesabınızı silemezsiniz.');
      return;
    }
    if (!confirm(`'${user.name}' adlı kullanıcıyı silmek istediğinize emin misiniz?`)) return;
    try {
      await UsersService.deleteUser(user.id);
      await refreshUsers();
      showToast('SUCCESS', 'Kullanıcı sistemden silindi.');
    } catch (err: any) {
      showToast('ERROR', err.response?.data?.message || 'Kullanıcı silinemedi.');
    }
  };

  // --- Handlers: 3. Active Sessions ---
  const handleTerminateSession = async (sessionId: string) => {
    try {
      await SettingsService.terminateSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      showToast('SUCCESS', 'Oturum sonlandırıldı.');
    } catch (err: any) {
      showToast('ERROR', err.response?.data?.message || 'Oturum sonlandırılamadı.');
    }
  };

  const handleTerminateAllOtherSessions = async () => {
    if (!confirm('Mevcut oturumunuz hariç diğer tüm aktif oturumları kapatmak istediğinize emin misiniz?')) return;
    try {
      await SettingsService.terminateAllOtherSessions();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      showToast('SUCCESS', 'Tüm harici oturumlar kapatıldı.');
    } catch (err: any) {
      showToast('ERROR', err.response?.data?.message || 'İşlem gerçekleştirilemedi.');
    }
  };

  // --- Handlers: 5. LDAP Operations ---
  const handleSaveLdap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await SettingsService.updateLdapConfig(ldapConfig);
      setLdapConfig((prev) => ({ ...prev, ...updated }));
      showToast('SUCCESS', 'LDAP yapılandırması başarıyla kaydedildi.');
    } catch (err: any) {
      showToast('ERROR', err.response?.data?.message || 'LDAP ayarları kaydedilemedi.');
    }
  };

  const handleTestLdap = async () => {
    try {
      setIsTestingLdap(true);
      setLdapTestResult(null);
      const res = await SettingsService.testLdap(ldapConfig);
      setLdapTestResult(res);
      if (res.success) {
        showToast('SUCCESS', res.message);
      } else {
        showToast('ERROR', res.message);
      }
    } catch (err: any) {
      setLdapTestResult({
        success: false,
        message: err.response?.data?.message || 'LDAP sunucusuna erişilemedi.',
        latencyMs: 0,
      });
      showToast('ERROR', 'LDAP bağlantı testi başarısız.');
    } finally {
      setIsTestingLdap(false);
    }
  };

  const handleSyncLdap = async () => {
    try {
      setIsSyncingLdap(true);
      setLdapSyncResult(null);
      const res = await SettingsService.syncLdap();
      setLdapSyncResult(res);
      await refreshUsers();
      showToast('SUCCESS', res.message);
    } catch (err: any) {
      showToast('ERROR', err.response?.data?.message || 'LDAP senkronizasyonunda hata oluştu.');
    } finally {
      setIsSyncingLdap(false);
    }
  };

  // --- Handlers: 6. API Keys ---
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyData.name.trim()) {
      showToast('ERROR', 'Lütfen API anahtarı için bir açıklama giriniz.');
      return;
    }
    try {
      const created = await SettingsService.createApiKey(newKeyData);
      setApiKeys((prev) => [created, ...prev]);
      setCreatedKeySecret(created.fullKey || null);
      showToast('SUCCESS', 'Yeni API anahtarı oluşturuldu!');
      setNewKeyData({ name: '', scope: 'write:runs', expiresInDays: 90 });
    } catch (err: any) {
      showToast('ERROR', err.response?.data?.message || 'API anahtarı oluşturulamadı.');
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm('Bu API anahtarını iptal etmek istediğinize emin misiniz? Bu anahtarı kullanan otomasyonlar erişimini kaybedecektir.')) return;
    try {
      await SettingsService.revokeApiKey(keyId);
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      showToast('SUCCESS', 'API anahtarı iptal edildi.');
    } catch (err: any) {
      showToast('ERROR', err.response?.data?.message || 'API anahtarı iptal edilemedi.');
    }
  };

  // --- Handlers: 7. Webhook Operations ---
  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookData.name.trim() || !newWebhookData.url.trim()) {
      showToast('ERROR', 'Lütfen webhook adı ve hedef URL alanlarını doldurun.');
      return;
    }
    const newWh = {
      id: 'wh-' + Date.now(),
      name: newWebhookData.name.trim(),
      url: newWebhookData.url.trim(),
      secretToken: newWebhookData.secretToken.trim() || 'tcms_wh_' + Math.random().toString(36).substring(2, 10),
      events: newWebhookData.events,
      isActive: true,
      lastTriggeredAt: 'Henüz tetiklenmedi',
      lastStatus: undefined,
    };
    setWebhooksList((prev) => [newWh, ...prev]);
    setIsWebhookModalOpen(false);
    setNewWebhookData({
      name: '',
      url: '',
      secretToken: '',
      events: ['test_run.started', 'test_run.completed'],
    });
    showToast('SUCCESS', 'Webhook başarıyla eklendi.');
  };

  const handlePingWebhook = async (wh: { id: string; url: string; secretToken: string }) => {
    try {
      setIsPingingWebhook(wh.id);
      setWebhookPingResult(null);
      const res = await WebhooksService.testWebhook(selectedProject?.id || 'global', wh.url, wh.secretToken);
      setWebhookPingResult({
        id: wh.id,
        success: res.success,
        msg: res.success ? `Başarılı HTTP 200 (Yanıt alındı)` : `Bağlantı Hatası: ${res.error || 'Ulaşılamadı'}`,
      });
      showToast(res.success ? 'SUCCESS' : 'ERROR', res.success ? 'Webhook ping başarılı!' : 'Webhook ulaşılamadı.');
    } catch (err: any) {
      setWebhookPingResult({
        id: wh.id,
        success: false,
        msg: err.response?.data?.message || 'Uç noktaya ulaşılamadı.',
      });
      showToast('ERROR', 'Webhook bağlantı hatası.');
    } finally {
      setIsPingingWebhook(null);
    }
  };

  const handleDeleteWebhook = (whId: string) => {
    if (!confirm('Bu webhook yapılandırmasını silmek istediğinize emin misiniz?')) return;
    setWebhooksList((prev) => prev.filter((w) => w.id !== whId));
    showToast('SUCCESS', 'Webhook silindi.');
  };

  // Nav Items config
  const navTabs = [
    { id: 'PROJECTS_SYSTEM' as SettingsTab, label: 'Projeler & Sistem', icon: Building2, desc: 'Proje ID, İsim ve Genel Ayarlar' },
    { id: 'USERS' as SettingsTab, label: 'Kullanıcı Yönetimi', icon: Users, desc: 'Kullanıcılar, Departman ve Durumlar', count: users.length },
    { id: 'SESSIONS' as SettingsTab, label: 'Oturumlar & Güvenlik', icon: Lock, desc: 'Aktif Oturumlar ve İstemciler', count: sessions.length },
    { id: 'ROLES' as SettingsTab, label: 'Rol & Yetki Matrisi', icon: ShieldCheck, desc: 'RBAC İzin ve Rol Yapılandırması' },
    { id: 'LDAP' as SettingsTab, label: 'LDAP / SSO Entegrasyonu', icon: Network, desc: 'Active Directory ve Senkronizasyon' },
    { id: 'API_KEYS' as SettingsTab, label: 'API Anahtarları (Tokens)', icon: Key, desc: 'Otomasyon ve CI/CD Tokenları', count: apiKeys.length },
    { id: 'WEBHOOKS' as SettingsTab, label: 'Webhook Entegrasyonları', icon: Webhook, desc: 'Dış Sistem Bildirimleri ve Ping', count: webhooksList.length },
  ];

  const filteredUsers = users.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#f4f6f8] dark:bg-[#141821] text-slate-900 dark:text-slate-100 select-none">
      {/* Toast Banner */}
      {toast && (
        <div className="fixed top-18 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold backdrop-blur-md border ${
              toast.type === 'SUCCESS'
                ? 'bg-emerald-500/90 border-emerald-400 text-white'
                : 'bg-[#b83a4b]/95 border-rose-400 text-white'
            }`}
          >
            {toast.type === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* 1. Header Bar */}
      <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#1d232f]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b83a4b] to-[#821c2b] text-white flex items-center justify-center shadow-md shadow-[#821c2b]/25">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Sistem & Yönetim Ayarları
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/30">
                Enterprise Hub
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kullanıcılar, Oturumlar, LDAP, API Anahtarları, Webhook ve Proje parametrelerini yönetin.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={loadAllSettings}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Split: Horizontal Tab Navigator + Scrollable Panel */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Settings Navigation (Desktop 260px Sidebar, Mobile Scrollable Strip) */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#191f2c]/50 p-2.5 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0">
          <div className="hidden md:block px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Yönetim Modülleri
          </div>
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white shadow-sm shadow-[#821c2b]/30 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div className="text-left truncate">
                    <div className="truncate">{tab.label}</div>
                  </div>
                </div>
                {tab.count !== undefined && (
                  <span
                    className={`ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Right Active Panel Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ========================================================================= */}
          {/* 1. PROJECTS & SYSTEM TAB                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'PROJECTS_SYSTEM' && (
            <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl">
              {/* Top Card: Projects Management */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Kayıtlı Projeler & ID Yönetimi
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sistemdeki tüm projeleri, benzersiz anahtarları (Key) ve Jira entegrasyonlarını yönetin.
                      </p>
                    </div>
                  </div>

                  {onOpenCreateProject && (
                    <button
                      type="button"
                      onClick={onOpenCreateProject}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white text-xs font-semibold shadow-md shadow-[#821c2b]/20 hover:from-[#c54859] hover:to-[#962534] transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Yeni Proje Ekle</span>
                    </button>
                  )}
                </div>

                {/* Project Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {projects.map((proj) => {
                    const isSelected = selectedProject?.id === proj.id;
                    return (
                      <div
                        key={proj.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#b83a4b]/5 dark:bg-[#b83a4b]/10 border-[#b83a4b]/40 ring-1 ring-[#b83a4b]/30'
                            : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                  {proj.name}
                                </span>
                                {isSelected && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    AKTİF
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {proj.description || 'Açıklama belirtilmemiş.'}
                              </p>
                            </div>
                            <span className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                              {proj.key}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800/80 font-mono text-[10px]">
                              UUID: {proj.id.slice(0, 8)}...
                            </span>
                            {proj.jiraProjectKey && (
                              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-semibold text-[10px] border border-indigo-500/20">
                                Jira: {proj.jiraProjectKey}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => onSelectProject(proj)}
                            className="text-xs font-semibold text-[#b83a4b] dark:text-[#d66b7a] hover:underline cursor-pointer"
                          >
                            Bu Projeyi Seç →
                          </button>

                          <div className="flex items-center space-x-1.5">
                            {onOpenEditProject && (
                              <button
                                type="button"
                                onClick={() => onOpenEditProject(proj)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                title="Projeyi Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteProject && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`'${proj.name}' projesini silmek istediğinize emin misiniz?`)) {
                                    onDeleteProject(proj.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                                title="Projeyi Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Card: Global System Settings Form */}
              <form
                onSubmit={handleSaveSystemSettings}
                className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Genel Sistem Parametreleri
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Uygulama başlığı, varsayılan test ortamları ve oturum zaman aşımı süreleri.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Sistem Başlığı (Application Title)
                    </label>
                    <input
                      type="text"
                      value={systemSettings.systemTitle}
                      onChange={(e) => setSystemSettings({ ...systemSettings, systemTitle: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Varsayılan Test Ortamı
                    </label>
                    <select
                      value={systemSettings.defaultEnvironment}
                      onChange={(e) => setSystemSettings({ ...systemSettings, defaultEnvironment: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b] font-medium"
                    >
                      <option value="DEV">DEV (Geliştirme)</option>
                      <option value="TEST">TEST (QA Ortamı)</option>
                      <option value="UAT">UAT (Kullanıcı Kabul)</option>
                      <option value="STAGING">STAGING (Ön Prodüksiyon)</option>
                      <option value="PROD">PROD (Canlı Ortam)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Koşum Zaman Aşımı (Timeout - Dakika)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={systemSettings.runTimeoutMinutes}
                      onChange={(e) =>
                        setSystemSettings({ ...systemSettings, runTimeoutMinutes: parseInt(e.target.value) || 60 })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Oturum Zaman Aşımı (Saat)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={168}
                      value={systemSettings.sessionTimeoutHours}
                      onChange={(e) =>
                        setSystemSettings({ ...systemSettings, sessionTimeoutHours: parseInt(e.target.value) || 24 })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400">
                    Sürüm: <span className="font-bold text-slate-600 dark:text-slate-300">{systemSettings.version}</span>
                  </div>
                  {isAdmin && (
                    <button
                      type="submit"
                      disabled={isSavingSystem}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white text-xs font-semibold shadow-md shadow-[#821c2b]/20 hover:from-[#c54859] hover:to-[#962534] transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingSystem ? 'Kaydediliyor...' : 'Ayarları Kaydet'}</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. USERS TAB                                                              */}
          {/* ========================================================================= */}
          {activeTab === 'USERS' && (
            <div className="space-y-5 animate-in fade-in duration-150 max-w-5xl">
              {/* Header with Search and New User CTA */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a]">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Kullanıcı Rehberi ve Rolleri ({users.length})
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sistem kullanıcılarını, departmanlarını ve yetki rollerini yönetin.
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsUserModalOpen(true)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white text-xs font-semibold shadow-md shadow-[#821c2b]/20 hover:from-[#c54859] hover:to-[#962534] transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Yeni Kullanıcı Ekle</span>
                    </button>
                  )}
                </div>

                {/* Search Bar */}
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Kullanıcı adı, e-posta veya departman ile ara..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                  />
                </div>

                {/* User List Cards */}
                <div className="space-y-2 pt-1">
                  {filteredUsers.map((u) => {
                    const isMe = u.id === currentUser?.id;
                    return (
                      <div
                        key={u.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#b83a4b]/20 to-[#821c2b]/30 text-[#b83a4b] dark:text-[#d66b7a] flex items-center justify-center font-bold text-sm shrink-0 border border-[#b83a4b]/30">
                              {u.name.charAt(0)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                                {u.name}
                              </span>
                              {isMe && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#b83a4b]/20 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/30">
                                  BEN
                                </span>
                              )}
                              {!u.isActive && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                                  PASİF
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center space-x-1.5 mt-0.5">
                              <span>{u.email}</span>
                              {u.department && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{u.department}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Role Select & Actions */}
                        <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-center">
                          {isAdmin ? (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              className="text-xs font-bold font-mono px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#b83a4b] cursor-pointer"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="TEST_LEAD">TEST_LEAD</option>
                              <option value="TESTER">TESTER</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>
                          ) : (
                            <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                              {u.role}
                            </span>
                          )}

                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u)}
                                disabled={isMe}
                                className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                                  u.isActive
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 hover:bg-slate-300'
                                } ${isMe ? 'opacity-40 cursor-not-allowed' : ''}`}
                                title={u.isActive ? 'Hesabı Pasifleştir' : 'Hesabı Aktifleştir'}
                              >
                                {u.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                disabled={isMe}
                                className={`p-1.5 rounded-xl bg-[#b83a4b]/10 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/20 hover:bg-[#b83a4b]/20 transition-colors cursor-pointer ${
                                  isMe ? 'opacity-40 cursor-not-allowed' : ''
                                }`}
                                title="Kullanıcıyı Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SESSIONS & SECURITY TAB                                                */}
          {/* ========================================================================= */}
          {activeTab === 'SESSIONS' && (
            <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Aktif Oturumlar ve Cihaz Güvenliği ({sessions.length})
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Bağlı istemcileri, IP adreslerini, tarayıcıları ve oturum sürelerini denetleyin.
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleTerminateAllOtherSessions}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/25 transition-all cursor-pointer"
                    >
                      Diğer Tüm Oturumları Kapat
                    </button>
                  )}
                </div>

                {/* Session List */}
                <div className="space-y-3">
                  {sessions.map((sess) => {
                    const isMobile = sess.userAgent.toLowerCase().includes('ios') || sess.userAgent.toLowerCase().includes('android');
                    return (
                      <div
                        key={sess.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          sess.isCurrent
                            ? 'bg-[#b83a4b]/5 dark:bg-[#b83a4b]/10 border-[#b83a4b]/30'
                            : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                            {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                                {sess.device} — {sess.userAgent}
                              </span>
                              {sess.isCurrent && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  BU CİHAZ
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>Kullanıcı: <strong className="text-slate-700 dark:text-slate-300">{sess.userName}</strong> ({sess.userRole})</span>
                              <span>•</span>
                              <span className="font-mono">IP: {sess.ipAddress}</span>
                              <span>•</span>
                              <span>Konum: {sess.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                          <div className="text-right text-[11px] text-slate-400 font-mono hidden md:block">
                            <div>Giriş: {new Date(sess.loginTime).toLocaleTimeString('tr-TR')}</div>
                            <div className="text-emerald-500">Aktif</div>
                          </div>

                          {!sess.isCurrent && isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleTerminateSession(sess.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Sonlandır
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. ROLES & RBAC MATRIX TAB                                                */}
          {/* ========================================================================= */}
          {activeTab === 'ROLES' && (
            <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl">
              {/* Role Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-white dark:bg-[#1d232f] border border-[#b83a4b]/30 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a]">
                      ADMIN
                    </span>
                    <ShieldCheck className="w-4 h-4 text-[#b83a4b]" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Sistem Yöneticisi</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kullanıcı yönetimi, sistem parametreleri, LDAP, API anahtarları ve tam veri silme/güncelleme yetkisi.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#1d232f] border border-indigo-500/30 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                      TEST_LEAD
                    </span>
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Test Lideri</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Proje, Test Planı, Suite oluşturma/silme, Koşum başlatma, Rapor alma ve Webhook tetikleme yetkisi.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#1d232f] border border-emerald-500/30 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      TESTER
                    </span>
                    <Zap className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Test Uzmanı</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Test senaryosu yazma, adım düzenleme, manuel ve hızlı koşum yapma, defect kaydetme yetkisi.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#1d232f] border border-slate-300 dark:border-slate-700 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      VIEWER
                    </span>
                    <Eye className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Gözlemci / Salt Okunur</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Test planlarını, senaryoları, koşum sonuçlarını ve yönetici raporlarını salt-okunur olarak görüntüleme.
                  </p>
                </div>
              </div>

              {/* Comprehensive Permission Matrix Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Rol İzin ve Yetki Matrisi (RBAC Matrix)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Her kullanıcı rolünün sistem eylemlerine erişim haklarının tam listesi.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
                        <th className="py-2.5 px-3 font-bold">İşlem / Fonksiyonel Alan</th>
                        <th className="py-2.5 px-3 font-bold text-center">ADMIN</th>
                        <th className="py-2.5 px-3 font-bold text-center">TEST_LEAD</th>
                        <th className="py-2.5 px-3 font-bold text-center">TESTER</th>
                        <th className="py-2.5 px-3 font-bold text-center">VIEWER</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {[
                        { action: 'Proje Oluşturma / Düzenleme', admin: true, lead: true, tester: false, viewer: false },
                        { action: 'Proje Silme', admin: true, lead: true, tester: false, viewer: false },
                        { action: 'Test Planı Oluşturma / Düzenleme', admin: true, lead: true, tester: true, viewer: false },
                        { action: 'Test Planı Silme', admin: true, lead: true, tester: false, viewer: false },
                        { action: 'Test Senaryosu (Case) Ekleme / Güncelleme', admin: true, lead: true, tester: true, viewer: false },
                        { action: 'Test Senaryosu Silme', admin: true, lead: true, tester: true, viewer: false },
                        { action: 'Manuel & Quick Run Koşumu Başlatma', admin: true, lead: true, tester: true, viewer: false },
                        { action: 'Defect (Hata) Açma ve Güncelleme', admin: true, lead: true, tester: true, viewer: false },
                        { action: 'Yönetici & Kalite Raporlarını Dışa Aktarma (PDF/CSV/HTML)', admin: true, lead: true, tester: true, viewer: true },
                        { action: 'Kullanıcı Ekleme / Rol Değiştirme (RBAC)', admin: true, lead: false, tester: false, viewer: false },
                        { action: 'LDAP / SSO Entegrasyon Yapılandırması', admin: true, lead: false, tester: false, viewer: false },
                        { action: 'API Anahtarları (Tokens) Üretme & İptal Etme', admin: true, lead: false, tester: false, viewer: false },
                        { action: 'Webhook Fırlatma & Otomasyon Tetikleme', admin: true, lead: true, tester: true, viewer: false },
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{row.action}</td>
                          <td className="py-2 px-3 text-center">
                            {row.admin ? (
                              <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.lead ? (
                              <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.tester ? (
                              <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.viewer ? (
                              <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. LDAP / ACTIVE DIRECTORY TAB                                            */}
          {/* ========================================================================= */}
          {activeTab === 'LDAP' && (
            <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl">
              <form
                onSubmit={handleSaveLdap}
                className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                      <Network className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        LDAP & Active Directory Entegrasyonu
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Kurumsal dizin servisi ile kullanıcı doğrulama ve rol eşleştirme ayarları.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleTestLdap}
                      disabled={isTestingLdap}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Radio className={`w-3.5 h-3.5 ${isTestingLdap ? 'animate-pulse' : ''}`} />
                      <span>{isTestingLdap ? 'Test Ediliyor...' : 'Bağlantıyı Test Et (Ping)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncLdap}
                      disabled={isSyncingLdap}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white text-xs font-semibold shadow-md shadow-[#821c2b]/20 hover:from-[#c54859] hover:to-[#962534] transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLdap ? 'animate-spin' : ''}`} />
                      <span>{isSyncingLdap ? 'Senkronize Ediliyor...' : 'Kullanıcıları Senkronize Et'}</span>
                    </button>
                  </div>
                </div>

                {/* LDAP Test Results Card */}
                {ldapTestResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs animate-in fade-in ${
                      ldapTestResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-[#b83a4b]/10 border-[#b83a4b]/30 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center space-x-2">
                        {ldapTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{ldapTestResult.message}</span>
                      </div>
                      {ldapTestResult.latencyMs > 0 && (
                        <span className="font-mono text-[11px]">Gecikme: {ldapTestResult.latencyMs} ms</span>
                      )}
                    </div>
                  </div>
                )}

                {/* LDAP Sync Results Card */}
                {ldapSyncResult && (
                  <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between font-bold">
                      <span>{ldapSyncResult.message}</span>
                      <span className="font-mono text-[10px]">{new Date(ldapSyncResult.syncedAt).toLocaleTimeString('tr-TR')}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 rounded-lg bg-indigo-500/10">Taranan: <strong>{ldapSyncResult.stats.totalScanned}</strong></div>
                      <div className="p-2 rounded-lg bg-indigo-500/10">Eklenen: <strong>{ldapSyncResult.stats.usersAdded}</strong></div>
                      <div className="p-2 rounded-lg bg-indigo-500/10">Güncellenen: <strong>{ldapSyncResult.stats.usersUpdated}</strong></div>
                      <div className="p-2 rounded-lg bg-indigo-500/10">Değişmeyen: <strong>{ldapSyncResult.stats.usersUnchanged}</strong></div>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      LDAP Sunucu URL (Host & Port)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ldap://ad.company.local:389 veya ldaps://..."
                      value={ldapConfig.serverUrl}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, serverUrl: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Base DN (Kullanıcı Kök Dizini)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="dc=company,dc=local"
                      value={ldapConfig.baseDn}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, baseDn: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Bind DN (Admin / Servis Kullanıcısı)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cn=tcms-svc,ou=ServiceAccounts,dc=company,dc=local"
                      value={ldapConfig.bindDn}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, bindDn: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Bind Şifresi
                    </label>
                    <div className="relative">
                      <input
                        type={showLdapPassword ? 'text' : 'password'}
                        placeholder={ldapConfig.hasPassword ? '•••••••• (Kayıtlı)' : 'Şifre giriniz'}
                        value={ldapConfig.bindPassword || ''}
                        onChange={(e) => setLdapConfig({ ...ldapConfig, bindPassword: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-9 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLdapPassword(!showLdapPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showLdapPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Kullanıcı Arama Filtresi (User Search Filter)
                    </label>
                    <input
                      type="text"
                      placeholder="(&(objectClass=user)(sAMAccountName={username}))"
                      value={ldapConfig.userFilter || ''}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, userFilter: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                    />
                  </div>
                </div>

                {/* Group Mapping Box */}
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Active Directory Grup - TCMS Rol Haritalaması
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between">
                      <span>CN=TCMS_Admins</span>
                      <strong className="text-[#b83a4b]">ADMIN</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between">
                      <span>CN=TCMS_TestLeads</span>
                      <strong className="text-indigo-500">TEST_LEAD</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between">
                      <span>CN=TCMS_QA_Engineers</span>
                      <strong className="text-emerald-500">TESTER</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between">
                      <span>CN=TCMS_Stakeholders</span>
                      <strong className="text-slate-400">VIEWER</strong>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white text-xs font-semibold shadow-md shadow-[#821c2b]/20 hover:from-[#c54859] hover:to-[#962534] transition-all cursor-pointer"
                    >
                      LDAP Yapılandırmasını Kaydet
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. API KEYS TAB                                                           */}
          {/* ========================================================================= */}
          {activeTab === 'API_KEYS' && (
            <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl">
              {/* Created Token Alert Banner */}
              {createdKeySecret && (
                <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 space-y-2 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Yeni API Anahtarınız Oluşturuldu!</span>
                    </div>
                    <button
                      onClick={() => setCreatedKeySecret(null)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Kapat
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Lütfen bu anahtarı güvenli bir yerde saklayın. Güvenlik nedeniyle bu anahtar bir daha gösterilmeyecektir.
                  </p>
                  <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-900/90 p-2.5 rounded-xl border border-emerald-500/30">
                    <code className="font-mono text-xs text-slate-900 dark:text-slate-100 flex-1 select-all break-all">
                      {createdKeySecret}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(createdKeySecret, 'created-secret')}
                      className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shrink-0 cursor-pointer"
                      title="Kopyala"
                    >
                      {copiedKeyId === 'created-secret' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Header and Add Key CTA */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        API Erişim Anahtarları ({apiKeys.length})
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Jenkins, GitHub Actions, Playwright ve dış test otomasyon merkezleri için API tokenları.
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsNewKeyModalOpen(true)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white text-xs font-semibold shadow-md shadow-[#821c2b]/20 hover:from-[#c54859] hover:to-[#962534] transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Yeni API Anahtarı Oluştur</span>
                    </button>
                  )}
                </div>

                {/* API Keys List */}
                <div className="space-y-3">
                  {apiKeys.map((k) => (
                    <div
                      key={k.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{k.name}</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            {k.scope}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <code className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                            {k.keyPreview}
                          </code>
                        </div>

                        <p className="text-[11px] text-slate-400 flex items-center space-x-2">
                          <span>Oluşturan: {k.createdBy}</span>
                          <span>•</span>
                          <span>Tarih: {new Date(k.createdAt).toLocaleDateString('tr-TR')}</span>
                          {k.lastUsedAt && (
                            <>
                              <span>•</span>
                              <span>Son Kullanım: {new Date(k.lastUsedAt).toLocaleTimeString('tr-TR')}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleRevokeApiKey(k.id)}
                            className="p-1.5 rounded-xl bg-[#b83a4b]/10 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/20 hover:bg-[#b83a4b]/20 text-xs font-semibold transition-colors cursor-pointer"
                            title="Anahtarı İptal Et"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* cURL Integration Snippet Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Örnek Entegrasyon (cURL ile Otomasyon Sonucu Yükleme)
                  </h3>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800">
{`curl -X POST "http://localhost:3001/api/v1/projects/${selectedProject?.id || 'PROJECT_ID'}/runs" \\
  -H "Authorization: Bearer tcms_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Automated Regression Run", "version": "v2.1.0", "environment": "TEST"}'`}
                </pre>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. WEBHOOKS TAB                                                           */}
          {/* ========================================================================= */}
          {activeTab === 'WEBHOOKS' && (
            <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Webhook className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Webhook Uç Noktaları ({webhooksList.length})
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Test koşumu ve defect olaylarında harici sistemlere otomatik HTTP POST fırlatın.
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsWebhookModalOpen(true)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white text-xs font-semibold shadow-md shadow-[#821c2b]/20 hover:from-[#c54859] hover:to-[#962534] transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Yeni Webhook Ekle</span>
                    </button>
                  )}
                </div>

                {/* Webhook Ping Feedback */}
                {webhookPingResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs animate-in fade-in ${
                      webhookPingResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-[#b83a4b]/10 border-[#b83a4b]/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-bold">
                      {webhookPingResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{webhookPingResult.msg}</span>
                    </div>
                  </div>
                )}

                {/* Webhooks List */}
                <div className="space-y-3">
                  {webhooksList.map((wh) => (
                    <div
                      key={wh.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{wh.name}</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            AKTİF
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <code className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 truncate max-w-md">
                            {wh.url}
                          </code>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {wh.events.map((ev, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handlePingWebhook(wh)}
                          disabled={isPingingWebhook === wh.id}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Radio className={`w-3.5 h-3.5 ${isPingingWebhook === wh.id ? 'animate-pulse' : ''}`} />
                          <span>{isPingingWebhook === wh.id ? 'Test Ediliyor...' : 'Ping Testi'}</span>
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteWebhook(wh.id)}
                            className="p-1.5 rounded-xl bg-[#b83a4b]/10 text-[#b83a4b] dark:text-[#d66b7a] border border-[#b83a4b]/20 hover:bg-[#b83a4b]/20 text-xs font-semibold transition-colors cursor-pointer"
                            title="Webhook'u Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: NEW USER                                                           */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#b83a4b]" />
                <span>Yeni Kullanıcı Tanımla</span>
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Ad ve Soyad *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ayşe Demir"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">E-Posta Adresi *</label>
                <input
                  type="email"
                  required
                  placeholder="ayse.demir@company.com"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Kullanıcı Rolü *</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b] font-medium"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="TEST_LEAD">TEST_LEAD</option>
                    <option value="TESTER">TESTER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Departman</label>
                  <input
                    type="text"
                    placeholder="QA / Core Banking"
                    value={userFormData.department}
                    onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white text-xs font-semibold shadow-md shadow-[#821c2b]/20 hover:from-[#c54859] hover:to-[#962534]"
                >
                  Kullanıcıyı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW API KEY                                                        */}
      {/* ========================================================================= */}
      {isNewKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Yeni API Anahtarı Oluştur</span>
              </h3>
              <button
                onClick={() => setIsNewKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                handleCreateApiKey(e);
                setIsNewKeyModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Anahtar Adı / Kullanım Amacı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Jenkins Playwright Pipeline"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Yetki Kapsamı (Scope) *</label>
                <select
                  value={newKeyData.scope}
                  onChange={(e) => setNewKeyData({ ...newKeyData, scope: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b] font-medium"
                >
                  <option value="write:runs">write:runs (Koşum Oluşturma & Sonuç Kaydetme)</option>
                  <option value="write:results">write:results (Yalnızca Test Sonucu Gönderme)</option>
                  <option value="read:all">read:all (Salt Okunur / Dashboard ve BI)</option>
                  <option value="admin:all">admin:all (Tam Yönetici Erişimi)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Geçerlilik Süresi (Gün)</label>
                <select
                  value={newKeyData.expiresInDays}
                  onChange={(e) => setNewKeyData({ ...newKeyData, expiresInDays: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b] font-medium"
                >
                  <option value={30}>30 Gün</option>
                  <option value={90}>90 Gün (Önerilen)</option>
                  <option value={180}>180 Gün</option>
                  <option value={365}>1 Yıl</option>
                  <option value={0}>Süresiz (Dikkatli Kullanınız)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewKeyModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white text-xs font-semibold shadow-md shadow-[#821c2b]/20 hover:from-[#c54859] hover:to-[#962534]"
                >
                  Anahtarı Üret
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW WEBHOOK                                                        */}
      {/* ========================================================================= */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Webhook className="w-4 h-4 text-emerald-500" />
                <span>Yeni Webhook Tanımla</span>
              </h3>
              <button
                onClick={() => setIsWebhookModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Uç Nokta Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: CI/CD Test Otomasyon Merkezi"
                  value={newWebhookData.name}
                  onChange={(e) => setNewWebhookData({ ...newWebhookData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Hedef URL *</label>
                <input
                  type="url"
                  required
                  placeholder="http://localhost:8000/api/webhook veya https://..."
                  value={newWebhookData.url}
                  onChange={(e) => setNewWebhookData({ ...newWebhookData, url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Gizli Anahtar (HMAC Secret Token)</label>
                <input
                  type="text"
                  placeholder="İsteğe bağlı secret token"
                  value={newWebhookData.secretToken}
                  onChange={(e) => setNewWebhookData({ ...newWebhookData, secretToken: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#b83a4b]"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWebhookModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#b83a4b] to-[#821c2b] text-white text-xs font-semibold shadow-md shadow-[#821c2b]/20 hover:from-[#c54859] hover:to-[#962534]"
                >
                  Webhook Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
