import { Platform } from 'react-native';

// Get the server URL from environment variable
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api`;

// API Base URL configuration
export const getApiBaseUrl = () => {
  return API_URL;
};

// Console logging for easy debugging
const baseUrl = getApiBaseUrl();
console.log('🌐 API Base URL:', baseUrl);

export const API_BASE_URL = baseUrl;
export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/users/login`,
  REGISTER: `${API_BASE_URL}/users/register`,
  PROFILE: `${API_BASE_URL}/users/profile`,
  BLOG: `${API_BASE_URL}/blog`,
  POSTS: `${API_BASE_URL}/blog/posts`,
}; 