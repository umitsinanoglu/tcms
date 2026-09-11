'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, UsersService } from '@/services/api';

export type PermissionAction =
  | 'MANAGE_USERS'
  | 'CREATE_PROJECT'
  | 'EDIT_PROJECT'
  | 'DELETE_PROJECT'
  | 'CREATE_SUITE'
  | 'EDIT_SUITE'
  | 'DELETE_SUITE'
  | 'CREATE_CASE'
  | 'EDIT_CASE'
  | 'DELETE_CASE'
  | 'CREATE_PLAN'
  | 'EDIT_PLAN'
  | 'DELETE_PLAN'
  | 'EXECUTE_RUN'
  | 'DELETE_RUN'
  | 'DELETE_DEFECT'
  | 'VIEW_REPORTS'
  | 'AUTOMATION_ACCESS';

interface AuthSessionData {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  loginTime: number;
  expiresAt: number;
}

const SESSION_STORAGE_KEY = 'tcms_auth_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Hours
export const STANDARD_PASSWORD = 'password1234';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  can: (action: PermissionAction) => boolean;
  refreshUsers: () => Promise<void>;
  isViewer: boolean;
  isAdmin: boolean;
  isTestLead: boolean;
  isTester: boolean;
  isAutomationEngineer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to validate and restore session from localStorage
  const checkAndRestoreSession = useCallback((userList: User[]) => {
    try {
      const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!rawSession) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        return false;
      }

      const session: AuthSessionData = JSON.parse(rawSession);
      const now = Date.now();

      // Check 24-hour expiration
      if (!session.expiresAt || now > session.expiresAt) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setIsAuthenticated(false);
        setCurrentUser(null);
        return false;
      }

      // Find user in active list
      const matchedUser = userList.find((u) => u.id === session.userId || u.email.toLowerCase() === session.email.toLowerCase());
      if (matchedUser && matchedUser.isActive) {
        if (session.role !== matchedUser.role || session.name !== matchedUser.name) {
          session.role = matchedUser.role;
          session.name = matchedUser.name;
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          localStorage.setItem('tcms_active_user_role', matchedUser.role);
          localStorage.setItem('tcms_active_user_name', matchedUser.name);
        }
        setCurrentUser(matchedUser);
        setIsAuthenticated(true);
        return true;
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setIsAuthenticated(false);
        setCurrentUser(null);
        return false;
      }
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setIsAuthenticated(false);
      setCurrentUser(null);
      return false;
    }
  }, []);

  // Fetch users and initialize auth state on mount (background refresh does not trigger full-screen unmount)
  const refreshUsers = useCallback(async () => {
    try {
      const userList = await UsersService.getUsers();
      setUsers(userList);
      checkAndRestoreSession(userList);
    } catch (err) {
      console.error('Failed to load users for AuthContext:', err);
    } finally {
      setIsLoading(false);
    }
  }, [checkAndRestoreSession]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  // Login handler
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !email.trim()) {
      return { success: false, error: 'Lütfen e-posta adresinizi giriniz.' };
    }

    if (!password) {
      return { success: false, error: 'Lütfen şifrenizi giriniz.' };
    }

    // Standard password verification
    if (password !== STANDARD_PASSWORD) {
      return { success: false, error: 'Hatalı şifre. Lütfen standart şifreyi (password1234) giriniz.' };
    }

    let activeUsers = users;
    if (activeUsers.length === 0) {
      try {
        activeUsers = await UsersService.getUsers();
        setUsers(activeUsers);
      } catch {
        return { success: false, error: 'Kullanıcı listesi yüklenemedi. Lütfen bağlantınızı kontrol ediniz.' };
      }
    }

    const matchedUser = activeUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!matchedUser) {
      return { success: false, error: 'Bu e-posta adresine ait bir kullanıcı bulunamadı.' };
    }

    if (!matchedUser.isActive) {
      return { success: false, error: 'Bu kullanıcı hesabı devre dışı bırakılmıştır. Lütfen sistem yöneticinizle iletişime geçin.' };
    }

    const now = Date.now();
    const sessionData: AuthSessionData = {
      userId: matchedUser.id,
      email: matchedUser.email,
      role: matchedUser.role,
      name: matchedUser.name,
      loginTime: now,
      expiresAt: now + SESSION_DURATION_MS, // 24 Hours
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    localStorage.setItem('tcms_active_user_id', matchedUser.id);
    localStorage.setItem('tcms_active_user_role', matchedUser.role);
    localStorage.setItem('tcms_active_user_email', matchedUser.email);
    localStorage.setItem('tcms_active_user_name', matchedUser.name);

    setCurrentUser(matchedUser);
    setIsAuthenticated(true);

    return { success: true };
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('tcms_active_user_id');
    localStorage.removeItem('tcms_active_user_role');
    localStorage.removeItem('tcms_active_user_email');
    localStorage.removeItem('tcms_active_user_name');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const effectiveRole: UserRole = currentUser?.role || 'VIEWER';

  const hasRole = useCallback(
    (allowedRoles: UserRole[]) => {
      return allowedRoles.includes(effectiveRole);
    },
    [effectiveRole],
  );

  const can = useCallback(
    (action: PermissionAction): boolean => {
      if (!isAuthenticated) return false;

      switch (action) {
        case 'MANAGE_USERS':
          return effectiveRole === 'ADMIN';

        case 'CREATE_PROJECT':
        case 'EDIT_PROJECT':
        case 'DELETE_PROJECT':
          return effectiveRole === 'ADMIN' || effectiveRole === 'TEST_LEAD';

        case 'CREATE_SUITE':
        case 'EDIT_SUITE':
          return effectiveRole === 'ADMIN' || effectiveRole === 'TEST_LEAD' || effectiveRole === 'TESTER' || effectiveRole === 'AUTOMATION_ENGINEER';

        case 'DELETE_SUITE':
          return effectiveRole === 'ADMIN' || effectiveRole === 'TEST_LEAD';

        case 'CREATE_CASE':
        case 'EDIT_CASE':
        case 'CREATE_PLAN':
        case 'EDIT_PLAN':
        case 'EXECUTE_RUN':
          return effectiveRole === 'ADMIN' || effectiveRole === 'TEST_LEAD' || effectiveRole === 'TESTER' || effectiveRole === 'AUTOMATION_ENGINEER';

        case 'DELETE_CASE':
        case 'DELETE_PLAN':
        case 'DELETE_RUN':
          return effectiveRole === 'ADMIN' || effectiveRole === 'TEST_LEAD';

        case 'DELETE_DEFECT':
          return effectiveRole === 'ADMIN';

        case 'AUTOMATION_ACCESS':
          return effectiveRole === 'ADMIN' || effectiveRole === 'AUTOMATION_ENGINEER';

        case 'VIEW_REPORTS':
          return true; // All authenticated roles can view reports

        default:
          return false;
      }
    },
    [effectiveRole, isAuthenticated],
  );

  const isAdmin = effectiveRole === 'ADMIN';
  const isTestLead = effectiveRole === 'TEST_LEAD';
  const isTester = effectiveRole === 'TESTER';
  const isAutomationEngineer = effectiveRole === 'AUTOMATION_ENGINEER' || effectiveRole === 'ADMIN';
  const isViewer = effectiveRole === 'VIEWER';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        role: effectiveRole,
        isAuthenticated,
        isLoading,
        login,
        logout,
        hasRole,
        can,
        refreshUsers,
        isViewer,
        isAdmin,
        isTestLead,
        isTester,
        isAutomationEngineer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
