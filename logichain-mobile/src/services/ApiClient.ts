import { API_BASE_URL } from '../config/env';
import { SecureStorage } from './SecureStorage';
import type { AuthTokens } from '../types/dtos';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Client HTTP centralise : ajoute automatiquement le token JWT, et
 * rafraichit la session via le refresh token en cas de 401 (intercepteur).
 * C'est la SEULE couche autorisee a parler au reseau ; les hooks/ecrans ne
 * font jamais de fetch() directement.
 */
class ApiClientImpl {
  private refreshPromise: Promise<string | null> | null = null;

  async request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
    const accessToken = await SecureStorage.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined)
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    if (response.status === 401 && retry) {
      const newAccessToken = await this.refreshAccessToken();
      if (newAccessToken) {
        return this.request<T>(path, options, false);
      }
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: response.statusText }));
      throw new ApiError(response.status, body.error || 'Erreur reseau');
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  // Coalesce les rafraichissements concurrents en un seul appel reseau
  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this._doRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async _doRefresh(): Promise<string | null> {
    const refreshToken = await SecureStorage.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!response.ok) {
        await SecureStorage.clearTokens();
        return null;
      }
      const tokens: AuthTokens = await response.json();
      await SecureStorage.saveTokens(tokens.accessToken, tokens.refreshToken);
      return tokens.accessToken;
    } catch {
      return null;
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }
}

export const ApiClient = new ApiClientImpl();
