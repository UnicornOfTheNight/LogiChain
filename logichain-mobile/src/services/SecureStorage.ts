import * as SecureStore from 'expo-secure-store';

/**
 * Encapsule le stockage securise des tokens (Keychain iOS / Keystore
 * Android via expo-secure-store). Aucun autre module ne doit appeler
 * expo-secure-store directement.
 */
const ACCESS_TOKEN_KEY = 'logichain_access_token';
const REFRESH_TOKEN_KEY = 'logichain_refresh_token';

export class SecureStorage {
  static async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  }

  static async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }

  static async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }

  static async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}
