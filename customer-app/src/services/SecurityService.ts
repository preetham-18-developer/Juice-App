import * as SecureStore from 'expo-secure-store';

const JWT_KEY = 'juicy_app_jwt';
const REFRESH_TOKEN_KEY = 'juicy_app_refresh_token';

export const SecurityService = {
  async saveTokens(accessToken: string, refreshToken: string) {
    try {
      await SecureStore.setItemAsync(JWT_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Error saving tokens securely', error);
    }
  },

  async getAccessToken() {
    return await SecureStore.getItemAsync(JWT_KEY);
  },

  async getRefreshToken() {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async clearTokens() {
    await SecureStore.deleteItemAsync(JWT_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
};
