import axios from 'axios';
import { storage } from '../utils/storage';
import Constants from 'expo-constants';
import { StockItem, StockHarvest } from '../screens/Stock/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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
    return config;
  },
  (error) => {
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
    return config;
  }
});

// Add response interceptor for error handling
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
      throw error;
    }
  },

  // Create pesticide
  createPesticide: async (pesticideData: any) => {
    try {
      const response = await api.post('/pesticides', pesticideData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update pesticide
  updatePesticide: async (id: string, data: any) => {
    try {
      const response = await api.put(`/pesticides/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete pesticide
  deletePesticide: async (id: string) => {
    try {
      const response = await api.delete(`/pesticides/${id}`);
      return response.data;
    } catch (error) {
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
      throw error;
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
  getAllFeed: async () => {
    try {
      const response = await api.get('/stock/feed');
      return response.data;
    } catch (error) {
      throw error;
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
const harvestApi = {
  // Get all harvests
  getAllHarvests: async () => {
    try {
      const response = await api.get('/stock/harvest');
      return response.data;
    } catch (error) {
      throw error;
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
  harvestApi
}; 