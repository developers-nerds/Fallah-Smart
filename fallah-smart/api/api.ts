import axiosInstance from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';

export const api = {
  // Get the stored token
  getToken: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Set the token
  setToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('Error setting token:', error);
      return false;
    }
  },

  // Remove the token
  removeToken: async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      return true;
    } catch (error) {
      console.error('Error removing token:', error);
      return false;
    }
  },

  // Make an authenticated request
  request: async (config: any) => {
    try {
      const token = await api.getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }
      return await axiosInstance(config);
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }
};

export default api; 