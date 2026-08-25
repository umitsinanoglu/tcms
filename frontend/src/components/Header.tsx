import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ThemeSelector } from './ThemeSelector';
import { TTBLogo } from './TTBLogo';
import {
  BookOpen,
  Users,
  Eye,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  onNavigateHome?: () => void;
  onOpenUserManagement?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateHome,
  onOpenUserManagement,
}) => {
  const { currentUser, role, isAdmin, isViewer, logout } = useAuth();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserDropdownOpen]);

  const userInitial = currentUser?.name?.trim() ? currentUser.name.trim().charAt(0).toUpperCase() : 'U';

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return { label: 'ADMIN', bg: 'bg-[#b83a4b]/15 text-[#b83a4b] dark:text-[#d66b7a] border-[#b83a4b]/30' };
      case 'TEST_LEAD':
        return { label: 'LEAD', bg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' };
      case 'TESTER':
        return { label: 'TESTER', bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
      case 'VIEWER':
        return { label: 'VIEWER', bg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30' };
      default:
        return { label: r, bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
    }
  };

  const roleBadge = getRoleBadge(role);

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-40 sticky top-0 transition-colors duration-200 select-none">
      {/* Left: Official Brand Logo & Name */}
      <div className="flex items-center space-x-3 shrink-0">
        <div
          onClick={onNavigateHome}
          className="flex items-center shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
          title="Ana Sayfa / Dashboard"
        >
          <TTBLogo variant="horizontal" height={32} showSubtitle={true} subtitleText="Test Yönetim Sistemi" />
        </div>
      </div>

      {/* Right: Actions (Viewer Alert, Admin Users, Docs, Theme, User Profile Initial Avatar) */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Viewer Mode Alert Indicator */}
        {isViewer && (
          <div
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-[11px] font-medium"
            title="Gözlemci modundasınız. Veriler üzerinde değişiklik yapamazsınız."
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Salt Okunur</span>
          </div>
        )}

        {/* Admin: User Management Icon Button */}
        {isAdmin && onOpenUserManagement && (
          <button
            type="button"
            onClick={onOpenUserManagement}
            className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#b83a4b] dark:hover:text-[#d66b7a] bg-slate-100/90 dark:bg-slate-800/80 hover:bg-[#b83a4b]/10 dark:hover:bg-[#b83a4b]/15 border border-slate-200 dark:border-slate-700 hover:border-[#b83a4b]/30 dark:hover:border-[#b83a4b]/40 rounded-xl transition-all shadow-sm shrink-0"
            title="Kullanıcı & Rol Yönetimi"
            aria-label="Kullanıcı Yönetimi"
          >
            <Users className="w-4 h-4 text-[#b83a4b]" />
          </button>
        )}

        {/* Swagger / OpenAPI Docs Link Button */}
        <a
          href={
            process.env.NEXT_PUBLIC_API_URL
              ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '/api/docs')
              : 'http://localhost:3001/api/docs'
          }
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#b83a4b] dark:hover:text-[#d66b7a] bg-slate-100/90 dark:bg-slate-800/80 hover:bg-[#b83a4b]/10 dark:hover:bg-[#b83a4b]/15 border border-slate-200 dark:border-slate-700 hover:border-[#b83a4b]/30 dark:hover:border-[#b83a4b]/40 rounded-xl transition-all shadow-sm shrink-0"
          title="Swagger / OpenAPI API Dokümantasyonu (Yeni Sekme)"
          aria-label="Swagger API Docs"
        >
          <BookOpen className="w-4 h-4 text-[#b83a4b]" />
        </a>

        {/* Theme Selector Button */}
        <ThemeSelector />

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />

        {/* User Profile: Single Capital Letter Avatar (Requirement 6) */}
        <div className="relative" ref={userDropdownRef}>
          <button
            type="button"
            onClick={() => setIsUserDropdownOpen((prev) => !prev)}
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 shadow-sm cursor-pointer ${
              isUserDropdownOpen
                ? 'bg-gradient-to-tr from-[#821c2b] to-[#b83a4b] text-white ring-2 ring-[#b83a4b]/50 scale-105'
                : 'bg-gradient-to-tr from-[#b83a4b] to-[#d66b7a] text-white hover:opacity-95 hover:shadow-[0_2px_10px_rgba(184,58,75,0.35)]'
            }`}
            title={`Kullanıcı: ${currentUser?.name || 'Kullanıcı'} (${role})`}
            aria-label="Kullanıcı Menüsü"
          >
            {userInitial}
          </button>

          {/* User Popover Menu */}
          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#1d232f] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
              {/* Profile Card Header */}
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#b83a4b] to-[#d66b7a] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentUser?.name || 'Kullanıcı'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                    {currentUser?.email || ''}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${roleBadge.bg}`}>
                      {roleBadge.label}
                    </span>
                    {currentUser?.department && (
                      <span className="text-[10px] text-slate-400 truncate">
                        {currentUser.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              {isAdmin && onOpenUserManagement && (
                <div className="p-1.5 border-b border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      onOpenUserManagement();
                    }}
                    className="w-full flex items-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#b83a4b]/10 hover:text-[#b83a4b] dark:hover:text-[#d66b7a] transition-colors"
                  >
                    <Users className="w-4 h-4 text-[#b83a4b]" />
                    <span>Kullanıcı & Rol Yönetimi</span>
                  </button>
                </div>
              )}

              {/* Logout Action */}
              <div className="p-1.5 bg-slate-50/50 dark:bg-slate-900/30">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
