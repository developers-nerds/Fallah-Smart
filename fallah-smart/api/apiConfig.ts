import axios from 'axios';

// Get environment variables without exposing IP addresses in code
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const BASE_URL = process.env.EXPO_PUBLIC_API;
const BLOG_URL = process.env.EXPO_PUBLIC_BLOG;

// Only check if API_URL is loaded - this is the critical one
if (!API_URL) {
  // Log warning instead of throwing error
  console.warn(
    'EXPO_PUBLIC_API_URL environment variable is missing. API calls may fail. Please check your .env file.'
  );
}

// Add fallbacks for other variables if missing
const config = {
  BASE_URL: BASE_URL || API_URL?.replace('/api', '') || 'http://192.168.1.3:5000',
  API_URL: API_URL || 'http://192.168.1.3:5000/api',
  BLOG_URL: BLOG_URL || '192.168.1.3'
};

// Export API configuration for use in other files
export const API_CONFIG = config;

// Create axios instance with proper defaults
const axiosInstance = axios.create({
  baseURL: config.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add interceptor to handle common errors
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // Just return the rejected promise without console.log
    return Promise.reject(error);
  }
);

export default axiosInstance; 

// Weather API configuration
export const WEATHER_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_WEATHER_API_KEY || '49b109a541db459ab2885035250603',
  API_URL: process.env.EXPO_PUBLIC_WEATHER_API_URL || 'http://api.weatherapi.com/v1/forecast.json'
};