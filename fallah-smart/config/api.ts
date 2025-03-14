// API configuration
import { Platform } from 'react-native';

// Determine the appropriate API URL based on the platform and environment
// For Android emulator, use 10.0.2.2 to access the host machine's localhost
// For iOS simulator, use localhost
// For physical devices, use the actual IP address of your backend server

let baseUrl: string;

if (__DEV__) {
  // Development environment
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host's localhost
    baseUrl = 'http://10.0.2.2:5000';
  } else {
    // iOS simulator can use localhost
    baseUrl = 'http://localhost:5000';
  }
} else {
  // Production environment - use your production API URL
  baseUrl = 'https://api.fallah-smart.com'; // Replace with your actual production API URL
}

// Allow overriding the API URL with an environment variable if available
export const API_URL = process.env.API_URL || baseUrl;

// Export other API-related constants
export const API_TIMEOUT = 15000; // 15 seconds timeout for API requests

// Weather API configuration
export const WEATHER_CONFIG = {
  API_KEY: '49b109a541db459ab2885035250603',
  API_URL: 'http://api.weatherapi.com/v1/forecast.json'
};

// Other API configurations
export const API_CONFIG = {
  BASE_URL: 'http://192.168.104.24:5000',
  API_URL: 'http://192.168.104.24:5000/api',
  BLOG_URL: '192.168.104.24:5000'
};
