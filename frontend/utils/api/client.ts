import { tokenManager } from './token';
import type { ApiResponse } from './types';

export const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? 'http://127.0.0.1:8787' : '');

/** success かつ data がある場合に data を返し、それ以外は例外を投げる */
export function unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || fallbackMessage);
}

/** success でなければ例外を投げる */
export function ensureSuccess(response: ApiResponse, fallbackMessage: string): void {
  if (!response.success) {
    throw new Error(response.error || fallbackMessage);
  }
}

/** エラーメッセージが 404 / not found を示すか */
export function isNotFoundError(message?: string): boolean {
  return !!message && (message.includes('not found') || message.includes('404'));
}

export class HttpClient {
  constructor(private readonly configuredBaseUrl: string = DEFAULT_API_BASE_URL) {}

  get baseUrl(): string {
    const url = this.configuredBaseUrl.trim().replace(/\/+$/, '');
    if (!url) throw new Error('EXPO_PUBLIC_API_URL にAPIのURLを設定してください');
    return url;
  }

  /**
   * JSON API を呼び出す。HTTP エラー時はレスポンスの error を使って例外を投げる。
   * skipAuth が true の場合は Authorization ヘッダーを付けない。
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
    skipAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = skipAuth ? null : await tokenManager.get();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error('Invalid response format');
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: API request failed`);
    }

    return data;
  }

  /** APIサーバーへの疎通確認 */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, { method: 'OPTIONS' });
      return response.status === 200 || response.status === 204;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}
