import { ensureSuccess, unwrap, type HttpClient } from './client';
import { tokenManager } from './token';
import type { LoginResponse, User } from './types';

export function createAuthApi(http: HttpClient) {
  const getCurrentUser = async (): Promise<User | undefined> => {
    const response = await http.request<User>('/auth/me');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get user info');
  };

  return {
    testConnection: (): Promise<boolean> => http.testConnection(),

    async login(email: string, password: string): Promise<LoginResponse> {
      const response = await http.request<LoginResponse>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
        true
      );
      const data = unwrap(response, 'Login failed');
      await tokenManager.save(data.token);
      return data;
    },

    async register(email: string, name: string | null, password: string): Promise<void> {
      const response = await http.request(
        '/auth/register',
        { method: 'POST', body: JSON.stringify({ email, name, password }) },
        true
      );
      ensureSuccess(response, 'Registration failed');
    },

    async logout(): Promise<void> {
      try {
        if (await tokenManager.get()) {
          await http.request('/auth/logout', { method: 'POST' });
        }
      } finally {
        await tokenManager.remove();
      }
    },

    getCurrentUser,

    async validateToken(): Promise<boolean> {
      try {
        await getCurrentUser();
        return true;
      } catch {
        return false;
      }
    },

    async resendVerificationEmail(email: string): Promise<void> {
      const response = await http.request(
        '/auth/resend-verification-by-email',
        { method: 'POST', body: JSON.stringify({ email }) },
        true
      );
      ensureSuccess(response, 'Failed to resend verification email');
    },

    async forgotPassword(email: string): Promise<void> {
      const response = await http.request(
        '/auth/forgot-password',
        { method: 'POST', body: JSON.stringify({ email }) },
        true
      );
      ensureSuccess(response, 'Failed to request password reset');
    },

    async resetPassword(token: string, newPassword: string): Promise<void> {
      const response = await http.request(
        '/auth/reset-password',
        { method: 'POST', body: JSON.stringify({ token, newPassword }) },
        true
      );
      ensureSuccess(response, 'Failed to reset password');
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
