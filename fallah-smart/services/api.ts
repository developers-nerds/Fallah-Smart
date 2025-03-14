import axios from 'axios';
import { storage } from '../utils/storage';
import Constants from 'expo-constants';
import { StockItem } from '../screens/Stock/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
console.log('Using API URL:', API_URL); // For debugging

// Add this check
if (!API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL environment variable is not set');
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Additional configuration to track request and response
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log('[API Request] Headers:', config.headers);
    console.log('[API Request] Data:', config.data);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add token to requests
api.interceptors.request.use(async (config) => {
  try {
    const tokens = await storage.getTokens();
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
      console.log('[Auth] Token added to request');
    } else {
      console.warn('[Auth] No access token available');
    }
    return config;
  } catch (error) {
    console.error('Error setting auth token:', error);
    return config;
  }
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    console.log('[API Response] Data:', response.data);
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error)) {
      console.error(`[API Error] ${error.response?.status} ${error.config?.url}`);
      console.error('[API Error] Response data:', error.response?.data);
      console.error('[API Error] Request data:', error.config?.data);
      console.error('[API Error] Request headers:', error.config?.headers);
      
      if (error.response?.status === 401) {
        await storage.clearAuth();
        console.warn('[Auth] 401 Unauthorized - clearing auth tokens');
        // TODO: Navigate to login screen
      }
    } else {
      console.error('[API Error] Non-Axios error:', error);
    }
    return Promise.reject(error);
  }
);

// Stock API methods
const stockApi = {
  // Get all stocks
  getAllStocks: async () => {
    try {
      console.log('Fetching all stocks from:', `${API_URL}/stocks`);
      const response = await api.get('/stocks');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching stocks:', error.response?.data || error.message);
      } else {
        console.error('Error fetching stocks:', error);
      }
      throw error;
    }
  },

  // Get single stock
  getStock: async (id: string) => {
    try {
      const response = await api.get(`/stocks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stock:', error);
      throw error;
    }
  },

  // Create stock
  createStock: async (stockData: Omit<StockItem, 'id' | 'stockHistory'>) => {
    try {
      console.log('Creating stock at:', `${API_URL}/stocks`);
      console.log('Stock data:', JSON.stringify(stockData, null, 2));
      const response = await api.post('/stocks', stockData);
      console.log('Create stock response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error creating stock:', error.response?.data || error.message);
        console.error('Full error:', error);
      } else {
        console.error('Error creating stock:', error);
      }
      throw error;
    }
  },

  // Update stock quantity
  updateStockQuantity: async (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => {
    try {
      const response = await api.post(`/stocks/${id}/quantity`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating stock quantity:', error);
      throw error;
    }
  },

  // Update stock details
  updateStock: async (id: string, data: any) => {
    try {
      const response = await api.put(`/stocks/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  // Delete stock
  deleteStock: async (id: string) => {
    try {
      const response = await api.delete(`/stocks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting stock:', error);
      throw error;
    }
  },

  // Get stock history
  getStockHistory: async (stockId: string) => {
    try {
      const response = await api.get(`/stocks/${stockId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stock history:', error);
      throw error;
    }
  }
};

// Animal API methods
const animalApi = {
  // Get all animals
  getAllAnimals: async () => {
    try {
      const response = await api.get('/animals');
      console.log('Fetched animals:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching animals:', error);
      throw error;
    }
  },

  // Create animal
  createAnimal: async (animalData: any) => {
    try {
      console.log('Creating animal with data:', JSON.stringify(animalData, null, 2));
      const response = await api.post('/animals', animalData);
      console.log('Created animal response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating animal:', error);
      throw error;
    }
  },

  // Update animal
  updateAnimal: async (id: string, data: any) => {
    try {
      console.log('Updating animal with data:', JSON.stringify(data, null, 2));
      const response = await api.put(`/animals/${id}`, data);
      console.log('Updated animal response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating animal:', error);
      throw error;
    }
  },

  // Delete animal
  deleteAnimal: async (id: string) => {
    try {
      const response = await api.delete(`/animals/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting animal:', error);
      throw error;
    }
  },
};

// Stock Statistics API
const stockStatisticsApi = {
  getStatistics: async (params?: { startDate?: string; endDate?: string; category?: string }) => {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.category) queryParams.append('category', params.category);
      
      const queryString = queryParams.toString();
      const url = `/stock-statistics${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stock statistics:', error);
      throw error;
    }
  }
};

// Pesticide API methods
const pesticideApi = {
  // Get all pesticides
  getAllPesticides: async () => {
    try {
      console.log('Fetching all pesticides');
      const response = await api.get('/pesticides');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching pesticides:', error.response?.data || error.message);
      } else {
        console.error('Error fetching pesticides:', error);
      }
      throw error;
    }
  },

  // Create pesticide
  createPesticide: async (pesticideData: any) => {
    try {
      console.log('Creating pesticide with data:', JSON.stringify(pesticideData, null, 2));
      const response = await api.post('/pesticides', pesticideData);
      console.log('Create pesticide response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error creating pesticide:', error.response?.data || error.message);
        console.error('Full error:', error);
      } else {
        console.error('Error creating pesticide:', error);
      }
      throw error;
    }
  },

  // Update pesticide
  updatePesticide: async (id: string, data: any) => {
    try {
      const response = await api.put(`/pesticides/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating pesticide:', error);
      throw error;
    }
  },

  // Delete pesticide
  deletePesticide: async (id: string) => {
    try {
      const response = await api.delete(`/pesticides/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting pesticide:', error);
      throw error;
    }
  },
};

// Seed API methods
const seedApi = {
  // Get all seeds
  getAllSeeds: async () => {
    try {
      console.log('Fetching all seeds from:', `${API_URL}/stock/seeds`);
      const response = await api.get('/stock/seeds');
      console.log('Seeds response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching seeds:', error.response?.data || error.message);
        console.error('Error status:', error.response?.status);
        console.error('Error headers:', error.response?.headers);
      } else {
        console.error('Error fetching seeds:', error);
      }
      throw error;
    }
  },

  // Create seed
  createSeed: async (seedData: any) => {
    try {
      console.log('Creating seed at:', `${API_URL}/stock/seeds`);
      console.log('Request headers:', api.defaults.headers);
      console.log('Seed data being sent:', JSON.stringify(seedData, null, 2));
      
      // Add validation for required fields
      if (!seedData.cropType) {
        console.error('Missing required field: cropType');
        seedData.cropType = 'عام'; // Set a default value
      }
      
      // Ensure userId is a number
      if (seedData.userId && typeof seedData.userId === 'string') {
        seedData.userId = parseInt(seedData.userId, 10);
      }
      
      console.log('Final seed data after validation:', JSON.stringify(seedData, null, 2));
      const response = await api.post('/stock/seeds', seedData);
      console.log('Create seed response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error creating seed - Response data:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Error headers:', error.response?.headers);
        console.error('Request config that caused error:', error.config);
        console.error('Full error:', error);
      } else {
        console.error('Error creating seed (non-Axios):', error);
      }
      throw error;
    }
  },

  // Update seed
  updateSeed: async (id: string, data: any) => {
    try {
      const response = await api.put(`/stock/seeds/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating seed:', error);
      throw error;
    }
  },

  // Delete seed
  deleteSeed: async (id: string) => {
    try {
      const response = await api.delete(`/stock/seeds/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting seed:', error);
      throw error;
    }
  },

  // Update seed quantity
  updateSeedQuantity: async (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => {
    try {
      const response = await api.patch(`/stock/seeds/${id}/quantity`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating seed quantity:', error);
      throw error;
    }
  }
};

// Export both the base API and specific methods
export { api, stockApi, animalApi, stockStatisticsApi, pesticideApi, seedApi }; 