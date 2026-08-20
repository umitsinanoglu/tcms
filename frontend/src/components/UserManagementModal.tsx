'use client';

import React, { useState } from 'react';
import { User, UserRole, UsersService, CreateUserInput } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Mail,
  User as UserIcon,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { users, currentUser, refreshUsers, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateUserInput>({
    name: '',
    email: '',
    role: 'TESTER',
    department: 'Kalite Güvence / QA',
    avatarUrl: '',
  });

  if (!isOpen || !isAdmin) return null;

  const showNotification = (type: 'SUCCESS' | 'ERROR', msg: string) => {
    if (type === 'SUCCESS') {
      setSuccessMsg(msg);
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    } else {
      setErrorMsg(msg);
      setSuccessMsg(null);
      setTimeout(() => setErrorMsg(null), 4500);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await UsersService.updateUser(userId, { role: newRole });
      await refreshUsers();
      showNotification('SUCCESS', 'Kullanıcı rolü başarıyla güncellendi.');
    } catch (err: any) {
      showNotification('ERROR', err.response?.data?.message || 'Rol güncellenirken hata oluştu.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await UsersService.updateUser(user.id, { isActive: !user.isActive });
      await refreshUsers();
      showNotification(
        'SUCCESS',
        `Kullanıcı ${!user.isActive ? 'aktif edildi' : 'pasifleştirildi'}.`,
      );
    } catch (err: any) {
      showNotification('ERROR', err.response?.data?.message || 'Durum değiştirilemedi.');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('Kendi hesabınızı silemezsiniz.');
      return;
    }
    if (!confirm(`'${user.name}' adlı kullanıcıyı silmek istediğinize emin misiniz?`)) {
      return;
    }
    try {
      await UsersService.deleteUser(user.id);
      await refreshUsers();
      showNotification('SUCCESS', 'Kullanıcı sistemden silindi.');
    } catch (err: any) {
      showNotification('ERROR', err.response?.data?.message || 'Kullanıcı silinemedi.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showNotification('ERROR', 'Lütfen ad-soyad ve e-posta alanlarını doldurun.');
      return;
    }

    try {
      setIsSubmitting(true);
      await UsersService.createUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        department: formData.department?.trim() || undefined,
        avatarUrl: formData.avatarUrl?.trim() || undefined,
      });
      await refreshUsers();
      showNotification('SUCCESS', 'Yeni kullanıcı başarıyla oluşturuldu.');
      setFormData({
        name: '',
        email: '',
        role: 'TESTER',
        department: 'Kalite Güvence / QA',
        avatarUrl: '',
      });
      setActiveTab('LIST');
    } catch (err: any) {
      showNotification('ERROR', err.response?.data?.message || 'Kullanıcı oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'TEST_LEAD':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      case 'TESTER':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'VIEWER':
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>Kullanıcı & Rol Yönetimi (RBAC)</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  Faz 1
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sistem kullanıcılarını, erişim seviyelerini ve yetki rollerini yönetin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('LIST')}
              className={`flex items-center space-x-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'LIST'
                  ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kullanıcı Listesi ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('CREATE')}
              className={`flex items-center space-x-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'CREATE'
                  ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Yeni Kullanıcı Ekle</span>
            </button>
          </div>
        </div>

        {/* Toast / Notification Banner */}
        {successMsg && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center space-x-2 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-5 mt-3 p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center space-x-2 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === 'LIST' ? (
            <div className="space-y-3">
              {users.map((u) => {
                const isMe = u.id === currentUser?.id;
                return (
                  <div
                    key={u.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      u.isActive
                        ? 'bg-slate-50/70 dark:bg-[#141b27] border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                        : 'bg-slate-100/50 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    {/* User Info */}
                    <div className="flex items-center space-x-3 min-w-0">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
                          {u.name.charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {u.name}
                          </span>
                          {isMe && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              SEN
                            </span>
                          )}
                          {!u.isActive && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                              PASİF
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center space-x-1.5 mt-0.5">
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

                    {/* Role Selector & Actions */}
                    <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-center">
                      <div className="flex items-center space-x-1.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className={`text-xs font-bold font-mono px-2.5 py-1.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer ${getRoleBadgeStyle(
                            u.role,
                          )} bg-white dark:bg-slate-900`}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="TEST_LEAD">TEST_LEAD</option>
                          <option value="TESTER">TESTER</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      </div>

                      {/* Toggle Active/Inactive */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        disabled={isMe}
                        className={`p-1.5 rounded-xl border text-xs transition-colors ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 hover:bg-slate-300'
                        } ${isMe ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={u.isActive ? 'Hesabı Pasifleştir' : 'Hesabı Aktifleştir'}
                      >
                        {u.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        disabled={isMe}
                        className={`p-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors ${
                          isMe ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                        title="Kullanıcıyı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4 max-w-xl mx-auto">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ad ve Soyad <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  E-Posta Adresi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="ahmet.yilmaz@ttb.com.tr"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kullanıcı Rolü <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                  >
                    <option value="ADMIN">ADMIN (Sistem Yöneticisi)</option>
                    <option value="TEST_LEAD">TEST_LEAD (Test Lideri)</option>
                    <option value="TESTER">TESTER (Test Uzmanı)</option>
                    <option value="VIEWER">VIEWER (Gözlemci / Salt Okunur)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Departman / Birim
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Örn: Dijital Bankacılık QA"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Avatar / Fotoğraf URL (İsteğe bağlı)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('LIST')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Kullanıcıyı Kaydet'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer / Role Legend */}
        <div className="p-3 sm:px-5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Rol İzinleri:</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-bold text-[10px]">
              ADMIN: Tam Yetki + Kullanıcı Yönetimi
            </span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px]">
              TEST_LEAD: Plan/Suite/Case/Koşu Yönetimi
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px]">
              TESTER: Case Ekleme & Koşma
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-400 font-mono font-bold text-[10px]">
              VIEWER: Salt Okunur
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
