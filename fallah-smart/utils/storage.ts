import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  USER: '@user',
  ACCESS_TOKEN: '@access_token',
  REFRESH_TOKEN: '@refresh_token',
};

export const storage = {
  // Store user data
  setUser: async (user: any) => {
    try {
      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  },

  // Get user data
  getUser: async () => {
    try {
      const user = await AsyncStorage.getItem(StorageKeys.USER);
      return user ? JSON.parse(user) : null;
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
    }
  },

  // Get tokens
  getTokens: async () => {
    try {
      const tokens = await AsyncStorage.multiGet([
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
      ]);
      return {
        accessToken: tokens[0][1],
        refreshToken: tokens[1][1],
      };
    } catch (error) {
      console.error('Error getting tokens:', error);
      return { accessToken: null, refreshToken: null };
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
    }
  },
}; 