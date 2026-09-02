'use client';

import React, { useState } from 'react';
import { useAuth, STANDARD_PASSWORD } from '@/context/AuthContext';
import { TTBLogo } from './TTBLogo';
import { ThemeSelector } from './ThemeSelector';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Users,
  FolderTree,
  PlayCircle,
  Target,
  BarChart3,
  CheckCircle2,
  Cpu,
  Layers,
  ExternalLink,
  Shield,
  Zap,
} from 'lucide-react';
import { UserRole } from '@/services/api';

export const LoginView: React.FC = () => {
  const { login, users, isLoading } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoggingIn(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Giriş yapılamadı.');
      }
    } catch (err: any) {
      setErrorMsg('Giriş işlemi sırasında beklenmeyen bir hata oluştu.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSelectQuickUser = (userEmail: string) => {
    setEmail(userEmail);
    setPassword(STANDARD_PASSWORD);
    setErrorMsg(null);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'TEST_LEAD':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      case 'TESTER':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'AUTOMATION_ENGINEER':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'VIEWER':
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const projectCapabilities = [
    {
      icon: FolderTree,
      title: 'Hiyerarşik Test Suite & Senaryo Mimarisi',
      description:
        'Modüler klasör ağacı, dinamik test türleri (Web, Mobil, API, Manuel), ön koşullar, zengin adımlar ve öncelik derecelendirmesi.',
      badge: 'Test Cases & Suites',
      color: 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      icon: PlayCircle,
      title: 'Çoklu Ortam & Hızlı Koşum Motoru',
      description:
        'Staging, Prod ve UAT ortamlarında anlık test icrası, Passed, Failed, Blocked statü takibi ve detaylı yürütme logları.',
      badge: 'Execution & Runs',
      color: 'text-sky-500 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      icon: Target,
      title: 'Akıllı Test Planları & Milestone Takibi',
      description:
        'Hedef odaklı kalite planları, sürüm kapsamı, otomatik senaryo eşleştirmesi ve aşamalı başarı kontrolü.',
      badge: 'Quality Planning',
      color: 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: BarChart3,
      title: 'Gerçek Zamanlı Kalite Metrikleri & Jira Köprüsü',
      description:
        'Anlık Pass Rate grafikleri, hata eğilim analizleri, Jira User Story/Bug entegrasyonu ve kurumsal JSON/CSV rapor ihracı.',
      badge: 'Analytics & Jira',
      color: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f2f5f8] dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors duration-200 relative overflow-x-hidden flex flex-col justify-between">
      {/* Background Decorative Gradients & Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-[var(--accent-dark)]/10 dark:bg-[var(--accent-dark)]/15 rounded-full blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-[var(--accent-primary)]/10 dark:bg-[var(--accent-primary)]/15 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-slate-400/10 dark:bg-indigo-950/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--accent-primary)_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      {/* Top Bar / Theme Switcher */}
      <header className="relative z-10 w-full px-6 sm:px-12 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TTBLogo variant="horizontal" height={38} showSubtitle={true} subtitleText="Test Yönetim Sistemi" />
          <span className="hidden sm:inline-block h-5 w-px bg-slate-300 dark:bg-slate-700" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
            <Sparkles className="w-3 h-3" />
            TCMS v2.5 Enterprise
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeSelector />
        </div>
      </header>

      {/* Main Content: Split Grid Layout */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch w-full">
          
          {/* LEFT COLUMN: Project Introduction & Core Capabilities */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8 pr-0 lg:pr-4">
            <div>
              {/* Badge & Headline */}
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 mb-4 backdrop-blur-sm">
                <Shield className="w-3.5 h-3.5" />
                <span>Türk Ticaret Bankası BT Kalite Güvence Sistemi</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Kurumsal Kalite Güvence ve{' '}
                <span className="bg-accent-gradient bg-clip-text text-transparent">
                  Test Yönetim
                </span>{' '}
                Platformu
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
                Yazılım geliştirme yaşam döngüsünde (SDLC) uçtan uca test senaryolarını tasarlayın,
                test koşumlarını yönetin, Jira entegrasyonuyla kusursuz izlenebilirlik sağlayın ve
                gerçek zamanlı kalite metriklerini takip edin.
              </p>

              {/* High-Impact Stat Badges */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm">
                  <Layers className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  4+ Test Türü (Web, Mobil, API, Manuel)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Hızlı Koşum & Çoklu Ortam
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Jira & Hata Entegrasyonu
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  Rol Tabanlı Yetkilendirme (RBAC)
                </span>
              </div>
            </div>

            {/* 4 Core Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {projectCapabilities.map((cap, idx) => {
                const IconComponent = cap.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/70 dark:bg-[#1d232f]/80 border border-slate-200/90 dark:border-[#2e3748] shadow-sm hover:shadow-md hover:border-[var(--accent-primary)]/40 transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl border ${cap.color} transition-transform group-hover:scale-105`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                          {cap.badge}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent-primary)] transition-colors">
                        {cap.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {cap.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compliance & Security Note */}
            <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-200/50 dark:bg-slate-800/40 border border-slate-300/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 text-xs">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
              <span>
                Bankacılık ve finansal standartlarda uçtan uca test izlenebilirliği, denetim günlüğü ve güvenli veri koruması.
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Login Form & Fast User Switcher */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="relative w-full bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-[#2e3748] rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-300/30 dark:shadow-black/50 transition-all duration-200">
              {/* Subtle Top Accent Border */}
              <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent rounded-full" />

              {/* Login Header */}
              <div className="mb-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Kullanıcı Girişi
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      TCMS platformuna erişmek için hesabınızı doğrulayın.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1 font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kullanıcı E-Postası
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@turkticaretbankasi.com.tr"
                      className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Şifre
                    </label>
                    <span className="text-[10px] text-[var(--accent-primary)] font-mono font-medium">
                      Standart: {STANDARD_PASSWORD}
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Şifrenizi giriniz..."
                      className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                      tabIndex={-1}
                      title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Session Banner */}
                <div className="flex items-center space-x-2 py-2 px-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                  <span>
                    Oturumunuz <strong>24 saat</strong> boyunca aktif tutulacaktır.
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoggingIn || isLoading}
                  className="w-full py-2.5 px-4 bg-accent-gradient hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-[var(--accent-dark)]/25 flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <span>Giriş Yapılıyor...</span>
                  ) : (
                    <>
                      <span>Giriş Yap</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick User Selection Chips */}
              {users.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>Kayıtlı Kullanıcı Seç & Otomatik Doldur:</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {users.map((u) => {
                      const isSelected = email.toLowerCase() === u.email.toLowerCase();
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectQuickUser(u.email)}
                          className={`text-left p-2 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--accent-primary)]/10 dark:bg-[var(--accent-primary)]/20 border-[var(--accent-primary)]/50 text-slate-900 dark:text-white shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.name}
                                className="w-5 h-5 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center text-[10px] font-bold shrink-0">
                                {u.name.charAt(0)}
                              </div>
                            )}
                            <div className="truncate">
                              <span className="font-semibold block truncate leading-tight">{u.name}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate leading-tight">
                                {u.email}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ml-1.5 ${getRoleBadge(
                              u.role,
                            )}`}
                          >
                            {u.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Card Footer Assurance */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Türk Ticaret Bankası BT Kalite Güvence & Güvenlik</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 sm:px-12 py-4 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 Türk Ticaret Bankası A.Ş. — Test Case Management System (TCMS)</span>
        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Cpu className="w-3 h-3 text-[var(--accent-primary)]" />
            v2.5.0 Production
          </span>
        </div>
      </footer>
    </div>
  );
};
