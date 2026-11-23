import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, tokenManager, type User } from '../utils/api';

export type { User };

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);

      const token = await tokenManager.get();
      if (!token) {
        setUser(null);
        return;
      }

      const isValid = await apiClient.validateToken();
      if (isValid) {
        const userData = await apiClient.getCurrentUser();
        setUser(userData ?? null);
      } else {
        setUser(null);
        await apiClient.logout(); // 無効なトークンを削除
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      await apiClient.logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const loginResponse = await apiClient.login(email, password);
      setUser(loginResponse.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      checkAuthStatus,
    }),
    [user, isLoading, login, logout, checkAuthStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
