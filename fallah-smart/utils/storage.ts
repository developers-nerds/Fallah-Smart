import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  USER: '@user',
  ACCESS_TOKEN: '@access_token',
  REFRESH_TOKEN: '@refresh_token',
};

export const storage = {
  // Generic get and set methods
  get: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item with key ${key}:`, error);
      return null;
    }
  },

  set: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item with key ${key}:`, error);
      throw error;
    }
  },

  // Store user data
  setUser: async (user: any) => {
    try {
      const userString = JSON.stringify(user);
      await AsyncStorage.setItem(StorageKeys.USER, userString);
    } catch (error) {
      console.error('Error storing user:', error);
      throw error;
    }
  },

  // Get user data
  getUser: async () => {
    try {
      const userString = await AsyncStorage.getItem(StorageKeys.USER);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // Store tokens
  setTokens: async (accessToken: string, refreshToken: string) => {
    try {
      await AsyncStorage.multiSet([
        [StorageKeys.ACCESS_TOKEN, accessToken],
        [StorageKeys.REFRESH_TOKEN, refreshToken],
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  },

  // Get tokens
  getTokens: async () => {
    try {
      console.log('[Storage] Attempting to get auth tokens...');
      const tokens = await AsyncStorage.multiGet([
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
      ]);
      
      // Debug log
      const hasAccessToken = tokens[0][1] !== null;
      const hasRefreshToken = tokens[1][1] !== null;
      console.log(`[Storage] Token retrieval: Access token ${hasAccessToken ? 'found' : 'missing'}, Refresh token ${hasRefreshToken ? 'found' : 'missing'}`);
      
      if (!hasAccessToken) {
        console.warn('[Storage] Warning: Access token not found in storage');
      }
      
      return {
        access: tokens[0][1],
        refresh: tokens[1][1],
      };
    } catch (error) {
      console.error('[Storage] Error getting tokens:', error);
      return { access: null, refresh: null };
    }
  },

  // Clear all auth data
  clearAuth: async () => {
    try {
      await AsyncStorage.multiRemove([
        StorageKeys.USER,
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },
}; 