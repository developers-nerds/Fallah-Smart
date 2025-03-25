// API configuration
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Determine the appropriate API URL based on the platform and environment
// For Android emulator, use 10.0.2.2 to access the host machine's localhost
// For iOS simulator, use localhost
// For physical devices, use the actual IP address of your backend server

// Get environment variables or use fallbacks
const ENV_API_URL = Constants.expoConfig?.extra?.expoPublicApiUrl || 
                     process.env.EXPO_PUBLIC_API_URL || 
                     null;

const ENV_API_BASE = Constants.expoConfig?.extra?.expoPublicApi || 
                      process.env.EXPO_PUBLIC_API || 
                      null;

// Determine base URL based on platform and environment
let baseUrl: string;

// Check if environment variable is set and use it first
if (ENV_API_BASE) {
  console.log('Using API base URL from environment:', ENV_API_BASE);
  baseUrl = ENV_API_BASE;
} else if (__DEV__) {
  // Development environment - detect platform
  if (Platform.OS === 'android') {
    // Check if running in emulator (based on device model or other markers)
    const isEmulator = (Platform as any).constants?.Model?.includes('sdk') || 
                       (Platform as any).constants?.Manufacturer?.includes('Google');
    
    if (isEmulator) {
      // Android emulator uses 10.0.2.2 to access host's localhost
      baseUrl = 'http://10.0.2.2:5000';
    } else {
      // Physical Android device - use the server's local IP address
      baseUrl = 'http://192.168.1.3:5000';
    }
  } else {
    // iOS simulator can use localhost
    baseUrl = 'http://localhost:5000';
  }
} else {
  // Production environment - use production API URL
  baseUrl = 'https://api.fallah-smart.com'; // Replace with actual production URL
}

// Get full API URL either from environment variable or construct it
export const API_URL = ENV_API_URL || `${baseUrl}/api`;

// Log which URL is being used
console.log('API base URL:', baseUrl);
console.log('API full URL:', API_URL);

// Export other API-related constants
export const API_TIMEOUT = 15000; // 15 seconds timeout for API requests

// Weather API configuration
export const WEATHER_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_WEATHER_API_KEY || '49b109a541db459ab2885035250603',
  API_URL: process.env.EXPO_PUBLIC_WEATHER_API_URL || 'http://api.weatherapi.com/v1/forecast.json'
};

// Other API configurations
export const API_CONFIG = {
  BASE_URL: baseUrl,
  API_URL: API_URL,
  BLOG_URL: process.env.EXPO_PUBLIC_BLOG || '192.168.1.3'
};
