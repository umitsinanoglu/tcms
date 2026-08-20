'use client';

import React, { useState } from 'react';
import { useAuth, STANDARD_PASSWORD } from '@/context/AuthContext';
import { TTBLogo } from './TTBLogo';
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
  CheckCircle2,
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
      case 'VIEWER':
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 relative overflow-hidden p-4 select-none">
      {/* Background Decorative Gradients & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#821c2b]/20 via-slate-950 to-slate-950" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#821c2b]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#b83a4b]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 mb-3 shadow-inner">
            <TTBLogo variant="horizontal" height={42} showSubtitle={false} />
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
            Test Case Management System
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kurumsal Test Yönetim & Otomasyon Platformu
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#b83a4b]/15 border border-[#b83a4b]/30 text-rose-300 text-xs flex items-start space-x-2 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / User Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/50 focus:border-[#b83a4b] transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Şifre
              </label>
              <span className="text-[10px] text-[#d66b7a] font-mono">
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
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b83a4b]/50 focus:border-[#b83a4b] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                tabIndex={-1}
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
          <div className="flex items-center space-x-2 py-2 px-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-[#d66b7a] shrink-0" />
            <span>Oturumunuz <strong>24 saat</strong> boyunca aktif kalacaktır.</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoggingIn || isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#b83a4b] to-[#821c2b] hover:from-[#c54859] hover:to-[#962534] text-white text-xs font-bold rounded-xl transition-all duration-150 shadow-md shadow-[#821c2b]/30 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isLoggingIn ? (
              <span>Giriş Yapılıyor...</span>
            ) : (
              <>
                <span>Giriş Yap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick User Selection Chips */}
        {users.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Users className="w-3 h-3 text-[#b83a4b]" />
                <span>Kullanıcı Seç & Otomatik Doldur:</span>
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {users.map((u) => {
                const isSelected = email.toLowerCase() === u.email.toLowerCase();
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectQuickUser(u.email)}
                    className={`text-left p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? 'bg-[#b83a4b]/15 border-[#b83a4b]/40 text-white'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200 shrink-0">
                          {u.name.charAt(0)}
                        </div>
                      )}
                      <div className="truncate">
                        <span className="font-semibold block truncate">{u.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{u.email}</span>
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

        {/* Security Footer */}
        <div className="mt-5 text-center text-[10px] text-slate-500 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#b83a4b]" />
          <span>Türk Ticaret Bankası BT Kalite Güvence & Test Güvenlik Standartları</span>
        </div>
      </div>
    </div>
  );
};
