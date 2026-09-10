import { ApiClient } from './ApiClient';
import { SecureStorage } from './SecureStorage';
import type { AuthTokens, AuthUser } from '../types/dtos';

/**
 * Authentification et onboarding (connexion securisee + telechargement
 * initial du referentiel gere separement par ItemService.refreshFromApi).
 */
export class AuthService {
  static async login(email: string, password: string): Promise<AuthUser> {
    const tokens = await ApiClient.post<AuthTokens>('/auth/login', { email, password });
    await SecureStorage.saveTokens(tokens.accessToken, tokens.refreshToken);
    return tokens.user;
  }

  static async logout(): Promise<void> {
    await SecureStorage.clearTokens();
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = await SecureStorage.getAccessToken();
    return token !== null;
  }

  static async getCurrentUser(): Promise<AuthUser> {
    return ApiClient.get<AuthUser>('/auth/me');
  }
}
