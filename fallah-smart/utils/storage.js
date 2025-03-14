import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for storage
const TOKENS_KEY = 'auth_tokens';
const USER_KEY = 'user_data';

export const storage = {
  // Set tokens
  async setTokens(accessToken, refreshToken) {
    try {
      const tokenData = {
        access: accessToken,
        refresh: refreshToken
      };
      await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokenData));
      return true;
    } catch (error) {
      console.error('Error storing tokens:', error);
      return false;
    }
  },

  // Get tokens
  async getTokens() {
    try {
      const tokensString = await AsyncStorage.getItem(TOKENS_KEY);
      if (!tokensString) {
        return { access: null, refresh: null };
      }
      return JSON.parse(tokensString);
    } catch (error) {
      console.error('Error retrieving tokens:', error);
      return { access: null, refresh: null };
    }
  },

  // Set user data
  async setUser(userData) {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  },

  // Get user data
  async getUser() {
    try {
      const userString = await AsyncStorage.getItem(USER_KEY);
      if (!userString) return null;
      return JSON.parse(userString);
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  },

  // Clear all auth data (for logout)
  async clearAuth() {
    try {
      await AsyncStorage.multiRemove([TOKENS_KEY, USER_KEY]);
      return true;
    } catch (error) {
      console.error('Error clearing auth data:', error);
      return false;
    }
  }
}; 