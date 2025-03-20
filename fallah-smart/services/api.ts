import axios from 'axios';
import { storage } from '../utils/storage';
import Constants from 'expo-constants';
import { StockItem, StockHarvest } from '../screens/Stock/types';

// Get API URL from environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.3:5000/api';

// Log API URL for debugging
console.log('Using API URL:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor for logging and throttling
const pendingRequests = new Map();
const REQUEST_THROTTLE_MS = 1000; // 1 second throttle

api.interceptors.request.use(
  (config) => {
    // Create a key for this request
    const requestKey = `${config.method}:${config.url}`;
    
    // Check if we have a pending/recent request for this endpoint
    const lastRequestTime = pendingRequests.get(requestKey);
    const now = Date.now();
    
    if (lastRequestTime && (now - lastRequestTime) < REQUEST_THROTTLE_MS) {
      console.log(`[API] Throttling duplicate request to ${requestKey}`);
      return Promise.reject({
        throttled: true,
        message: 'Request throttled to prevent excessive calls'
      });
    }
    
    // Track this request
    pendingRequests.set(requestKey, now);
    
    // Log request for debugging
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add token to requests
api.interceptors.request.use(async (config) => {
  try {
    const tokens = await storage.getTokens();
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  } catch (error) {
    console.error('Error adding auth token:', error);
    return config;
  }
});

// Additional configuration to track request and response
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        await storage.clearAuth();
        // TODO: Navigate to login screen
      }
    }
    return Promise.reject(error);
  }
);

// Stock API methods
const stockApi = {
  // Get all stocks
  getAllStocks: async () => {
    try {
      const response = await api.get('/stocks');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single stock
  getStock: async (id: string) => {
    try {
      const response = await api.get(`/stocks/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create stock
  createStock: async (stockData: Omit<StockItem, 'id' | 'stockHistory'>) => {
    try {
      const response = await api.post('/stocks', stockData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update stock quantity
  updateStockQuantity: async (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => {
    try {
      const response = await api.post(`/stocks/${id}/quantity`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update stock details
  updateStock: async (id: string, data: any) => {
    try {
      const response = await api.put(`/stocks/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete stock
  deleteStock: async (id: string) => {
    try {
      const response = await api.delete(`/stocks/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get stock history
  getStockHistory: async (stockId: string) => {
    try {
      const response = await api.get(`/stocks/${stockId}/history`);
      return response.data;
    } catch (error) {
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
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create animal
  createAnimal: async (animalData: any) => {
    try {
      const response = await api.post('/animals', animalData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update animal
  updateAnimal: async (id: string, data: any) => {
    try {
      const response = await api.put(`/animals/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete animal
  deleteAnimal: async (id: string) => {
    try {
      const response = await api.delete(`/animals/${id}`);
      return response.data;
    } catch (error) {
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
      throw error;
    }
  }
};

// Pesticide API methods
const pesticideApi = {
  // Get all pesticides
  getAllPesticides: async () => {
    try {
      const response = await api.get('/pesticides');
      return response.data;
    } catch (error) {
      console.error('Error fetching pesticides:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to fetch pesticides: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  },

  // Get pesticides for notification service
  getPesticides: async () => {
    try {
      const response = await api.get('/pesticides');
      return response.data;
    } catch (error) {
      console.error('Error fetching pesticides:', error);
      return [];
    }
  },

  // Create pesticide
  createPesticide: async (pesticideData: any) => {
    try {
      const response = await api.post('/pesticides', pesticideData);
      return response.data;
    } catch (error) {
      console.error('Error creating pesticide:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to create pesticide: ${error.response.status} ${error.response.statusText}`);
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
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to update pesticide: ${error.response.status} ${error.response.statusText}`);
      }
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
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to delete pesticide: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  },
};

// Seed API methods
const seedApi = {
  // Get all seeds
  getAllSeeds: async () => {
    try {
      const response = await api.get('/stock/seeds');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create seed
  createSeed: async (seedData: any) => {
    try {
      // Add validation for required fields
      if (!seedData.cropType) {
        seedData.cropType = 'عام'; // Set a default value
      }
      
      // Ensure userId is a number
      if (seedData.userId && typeof seedData.userId === 'string') {
        seedData.userId = parseInt(seedData.userId, 10);
      }
      
      const response = await api.post('/stock/seeds', seedData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update seed
  updateSeed: async (id: string, data: any) => {
    try {
      const response = await api.put(`/stock/seeds/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete seed
  deleteSeed: async (id: string) => {
    try {
      const response = await api.delete(`/stock/seeds/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update seed quantity
  updateSeedQuantity: async (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => {
    try {
      const response = await api.patch(`/stock/seeds/${id}/quantity`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Stock Equipment API methods
const stockEquipmentApi = {
  // Get all equipment
  getAllEquipment: async () => {
    try {
      const response = await api.get('/stock/equipment');
      return response.data;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }
  },

  // Get single equipment
  getEquipment: async (id: string) => {
    try {
      const response = await api.get(`/stock/equipment/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create equipment
  createEquipment: async (equipmentData: any) => {
    try {
      const response = await api.post('/stock/equipment', equipmentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update equipment
  updateEquipment: async (id: string, data: any) => {
    try {
      const response = await api.put(`/stock/equipment/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete equipment
  deleteEquipment: async (id: string) => {
    try {
      const response = await api.delete(`/stock/equipment/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Record maintenance
  recordMaintenance: async (id: string, data: { maintenanceNotes: string; cost: number; nextMaintenanceDate?: Date }) => {
    try {
      const response = await api.post(`/stock/equipment/${id}/maintenance`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update equipment status
  updateStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/stock/equipment/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Stock Feed API methods
const stockFeedApi = {
  // Get all feeds
  getAllFeeds: async () => {
    try {
      const response = await api.get('/stock/feed');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get feeds for notification service
  getFeeds: async () => {
    try {
      const response = await api.get('/stock/feed');
      return response.data;
    } catch (error) {
      console.error('Error fetching feeds:', error);
      return [];
    }
  },

  // Get single feed
  getFeed: async (id: string) => {
    try {
      const response = await api.get(`/stock/feed/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create feed
  createFeed: async (feedData: any) => {
    try {
      const response = await api.post('/stock/feed', feedData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update feed
  updateFeed: async (id: string, data: any) => {
    try {
      const response = await api.put(`/stock/feed/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete feed
  deleteFeed: async (id: string) => {
    try {
      const response = await api.delete(`/stock/feed/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update feed quantity
  updateFeedQuantity: async (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => {
    try {
      const response = await api.patch(`/stock/feed/${id}/quantity`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Stock Fertilizer API methods
const stockFertilizerApi = {
  // Get all fertilizers
  getAllFertilizers: async () => {
    try {
      const response = await api.get('/stock/fertilizer');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get fertilizers for notification service
  getFertilizers: async () => {
    try {
      const response = await api.get('/stock/fertilizer');
      return response.data;
    } catch (error) {
      console.error('Error fetching fertilizers:', error);
      return [];
    }
  },

  // Get single fertilizer
  getFertilizer: async (id: string) => {
    try {
      const response = await api.get(`/stock/fertilizer/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create fertilizer
  createFertilizer: async (fertilizerData: any) => {
    try {
      const response = await api.post('/stock/fertilizer', fertilizerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update fertilizer
  updateFertilizer: async (id: string, data: any) => {
    try {
      const response = await api.put(`/stock/fertilizer/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete fertilizer
  deleteFertilizer: async (id: string) => {
    try {
      const response = await api.delete(`/stock/fertilizer/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update fertilizer quantity
  updateFertilizerQuantity: async (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => {
    try {
      const response = await api.patch(`/stock/fertilizer/${id}/quantity`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Stock Harvest API methods
const stockHarvestApi = {
  // Get all harvests
  getAllHarvests: async () => {
    try {
      const response = await api.get('/stock/harvest');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get harvests for notification service
  getHarvests: async () => {
    try {
      const response = await api.get('/stock/harvest');
      return response.data;
    } catch (error) {
      console.error('Error fetching harvests:', error);
      return [];
    }
  },

  // Get single harvest
  getHarvest: async (id: string) => {
    try {
      const response = await api.get(`/stock/harvest/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create harvest
  createHarvest: async (harvestData: Partial<StockHarvest>) => {
    try {
      const response = await api.post('/stock/harvest', harvestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update harvest
  updateHarvest: async (id: string, data: Partial<StockHarvest>) => {
    try {
      const response = await api.put(`/stock/harvest/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete harvest
  deleteHarvest: async (id: string) => {
    try {
      const response = await api.delete(`/stock/harvest/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update harvest quantity
  updateHarvestQuantity: async (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => {
    try {
      const response = await api.patch(`/stock/harvest/${id}/quantity`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Seed API methods
const stockSeedApi = {
  getSeeds: async () => {
    try {
      const response = await api.get('/stock/seeds');
      return response.data;
    } catch (error) {
      console.error('Error fetching seeds:', error);
      return [];
    }
  },
  // other seed methods...
};

// Tool API methods
const stockToolApi = {
  getTools: async () => {
    try {
      const response = await api.get('/stock/tools');
      return response.data;
    } catch (error) {
      console.error('Error fetching tools:', error);
      return [];
    }
  },
  // other tool methods...
};

// Export both the base API and specific methods
export { 
  api, 
  stockApi, 
  animalApi, 
  stockStatisticsApi, 
  pesticideApi, 
  seedApi, 
  stockEquipmentApi,
  stockFeedApi,
  stockFertilizerApi,
  stockHarvestApi,
  pesticideApi as stockPesticideApi, // Alias pesticideApi as stockPesticideApi
  stockSeedApi,
  stockToolApi
}; 