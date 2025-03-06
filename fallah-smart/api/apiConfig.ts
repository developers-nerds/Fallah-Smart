import axios from 'axios';

// Create axios instance with proper defaults
const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API, // Make sure this is correct
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
    if (error.message === 'Network Error') {
      console.error('Network error occurred. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 
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