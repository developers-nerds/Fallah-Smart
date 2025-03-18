  import axios from 'axios';

// Get environment variables without exposing IP addresses in code
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const BASE_URL = process.env.EXPO_PUBLIC_API;
const BLOG_URL = process.env.EXPO_PUBLIC_BlOG;

// Check if environment variables are properly loaded
if (!API_URL || !BASE_URL || !BLOG_URL) {
  // Instead of console.warn, we'll throw an error during development
  // In production, this could be handled differently
  if (__DEV__) {
    throw new Error(
      'API environment variables are missing. Please check your .env file and ensure all required variables are defined.'
    );
  }
}

// Export API configuration for use in other files
export const API_CONFIG = {
  BASE_URL,
  API_URL,
  BLOG_URL
};

// Create axios instance with proper defaults
const axiosInstance = axios.create({
  baseURL: API_URL,
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
  API_KEY: process.env.EXPO_PUBLIC_WEATHER_API_KEY,
  API_URL: process.env.EXPO_PUBLIC_WEATHER_API_URL
};