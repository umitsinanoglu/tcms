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
  | 'EXECUTE_RUN'
  | 'VIEW_REPORTS';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  role: UserRole;
  isLoading: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  can: (action: PermissionAction) => boolean;
  switchUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  refreshUsers: () => Promise<void>;
  isViewer: boolean;
  isAdmin: boolean;
  isTestLead: boolean;
  isTester: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch users on mount
  const refreshUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const userList = await UsersService.getUsers();
      setUsers(userList);

      const savedUserId = localStorage.getItem('tcms_active_user_id');
      const savedUserRole = localStorage.getItem('tcms_active_user_role') as UserRole | null;

      let matchedUser: User | null = null;
      if (savedUserId) {
        matchedUser = userList.find((u) => u.id === savedUserId) || null;
      }

      // Default to first Admin or first user if none saved
      if (!matchedUser && userList.length > 0) {
        matchedUser = userList.find((u) => u.role === 'ADMIN') || userList[0];
      }

      if (matchedUser) {
        setCurrentUser(matchedUser);
        localStorage.setItem('tcms_active_user_id', matchedUser.id);
        localStorage.setItem('tcms_active_user_role', savedUserRole || matchedUser.role);
        localStorage.setItem('tcms_active_user_email', matchedUser.email);
        localStorage.setItem('tcms_active_user_name', matchedUser.name);
      }
    } catch (err) {
      console.error('Failed to load users for AuthContext:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const effectiveRole: UserRole = roleOverride || currentUser?.role || 'ADMIN';

  const switchUser = (user: User) => {
    setCurrentUser(user);
    setRoleOverride(null);
    localStorage.setItem('tcms_active_user_id', user.id);
    localStorage.setItem('tcms_active_user_role', user.role);
    localStorage.setItem('tcms_active_user_email', user.email);
    localStorage.setItem('tcms_active_user_name', user.name);
  };

  const switchRole = (newRole: UserRole) => {
    setRoleOverride(newRole);
    localStorage.setItem('tcms_active_user_role', newRole);
  };

  const hasRole = useCallback(
    (allowedRoles: UserRole[]) => {
      return allowedRoles.includes(effectiveRole);
    },
    [effectiveRole],
  );

  const can = useCallback(
    (action: PermissionAction): boolean => {
      switch (action) {
        case 'MANAGE_USERS':
          return effectiveRole === 'ADMIN';

        case 'CREATE_PROJECT':
        case 'EDIT_PROJECT':
        case 'DELETE_PROJECT':
          return effectiveRole === 'ADMIN' || effectiveRole === 'TEST_LEAD';

        case 'CREATE_SUITE':
        case 'EDIT_SUITE':
          return effectiveRole === 'ADMIN' || effectiveRole === 'TEST_LEAD' || effectiveRole === 'TESTER';

        case 'DELETE_SUITE':
          return effectiveRole === 'ADMIN' || effectiveRole === 'TEST_LEAD';

        case 'CREATE_CASE':
        case 'EDIT_CASE':
        case 'DELETE_CASE':
        case 'EXECUTE_RUN':
          return effectiveRole === 'ADMIN' || effectiveRole === 'TEST_LEAD' || effectiveRole === 'TESTER';

        case 'VIEW_REPORTS':
          return true; // All roles can view reports

        default:
          return false;
      }
    },
    [effectiveRole],
  );

  const isAdmin = effectiveRole === 'ADMIN';
  const isTestLead = effectiveRole === 'TEST_LEAD';
  const isTester = effectiveRole === 'TESTER';
  const isViewer = effectiveRole === 'VIEWER';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        role: effectiveRole,
        isLoading,
        hasRole,
        can,
        switchUser,
        switchRole,
        refreshUsers,
        isViewer,
        isAdmin,
        isTestLead,
        isTester,
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
