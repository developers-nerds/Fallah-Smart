import axios from 'axios';

// Create axios instance with proper defaults
const axiosInstance = axios.create({
  baseURL: 'http://192.168.1.13:5000', // Make sure this is correct
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