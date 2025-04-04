import axios from 'axios';

const API_URL = import.meta.env.VITE_API';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't already tried to refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/';
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${API_URL}/auth/refresh-tokens`, {
          refreshToken,
        });
        
        const { access, refresh } = response.data.tokens;
        
        // Store new tokens
        localStorage.setItem('accessToken', access.token);
        localStorage.setItem('refreshToken', refresh.token);
        
        // Update header and retry
        api.defaults.headers.common['Authorization'] = `Bearer ${access.token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access.token}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 
