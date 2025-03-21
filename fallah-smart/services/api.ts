import axios from 'axios';
import { storage } from '../utils/storage';
import Constants from 'expo-constants';
import { StockItem, StockHarvest } from '../screens/Stock/types';
import { API_URL as configApiUrl } from '../config/api';

// Set up basic error tracking without using window.addEventListener 
try {
  // Simple logging setup that works in React Native
  console.log('[API Service] Setting up error handling');
  
  // Avoid using window.addEventListener which is not available in React Native
} catch (e) {
  console.log('Error setting up error handlers', e);
}

// Get API URL from environment variables or config with more explicit logging
console.log('[API Service] Environment variables:');
console.log('- process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('- Constants.expoConfig?.extra?.expoPublicApiUrl:', Constants.expoConfig?.extra?.expoPublicApiUrl);
console.log('- configApiUrl:', configApiUrl);

// Get API URL with priority and better fallback logic
const API_URL = process.env.EXPO_PUBLIC_API_URL || 
                Constants.expoConfig?.extra?.expoPublicApiUrl || 
                configApiUrl || 
                'http://192.168.1.3:5000/api'; // Fallback for development

// Log API URL for debugging with more emphasis
console.log('[API Service] FINAL SELECTED API URL:', API_URL);
console.log('[API Service] Making requests to:', API_URL);

// Check for empty or malformed API URL
if (!API_URL) {
  console.error('[API Service] CRITICAL ERROR: API_URL is empty! Requests will fail.');
} else if (!API_URL.includes('://')) {
  console.error('[API Service] WARNING: API_URL doesn\'t contain protocol (http:// or https://). This may cause failures.');
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor for logging and throttling
// Use a simple object instead of Map for tracking requests
const pendingRequests: Record<string, number> = {};
const REQUEST_THROTTLE_MS = 3000; // Increased to 3 seconds

// Cache for storing recent responses
const responseCache: Record<string, any> = {};
const CACHE_TTL = 30000; // Increased cache time to 30 seconds for better reliability

api.interceptors.request.use(
  (config) => {
    // Create a key for this request
    const requestKey = `${config.method}:${config.url}`;
    
    // Check if we have a pending/recent request for this endpoint
    const lastRequestTime = pendingRequests[requestKey];
    const now = Date.now();
    
    if (lastRequestTime && (now - lastRequestTime) < REQUEST_THROTTLE_MS) {
      // Check if we have a cached response
      const cachedResponse = responseCache[requestKey];
      
      if (cachedResponse) {
        console.log(`[API] Throttling duplicate request to ${requestKey}`);
        console.log(`Request throttled, using cached data from ${now - lastRequestTime}ms ago`);
        
        // Return the cached response data wrapped in a special object
        return Promise.reject({
          throttled: true,
          message: 'Request throttled to prevent excessive calls',
          cachedData: cachedResponse,
          throttleTime: now - lastRequestTime
        });
      }
      
      console.log(`[API] Throttling duplicate request to ${requestKey}`);
      return Promise.reject({
        throttled: true,
        message: 'Request throttled to prevent excessive calls'
      });
    }
    
    // Track this request
    pendingRequests[requestKey] = now;
    
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

// Modified response interceptor to cache successful responses
api.interceptors.response.use(
  (response) => {
    try {
      // Cache the response
      const requestKey = `${response.config.method}:${response.config.url}`;
      responseCache[requestKey] = response.data;
      
      // Set timeout to clear the cache entry
      setTimeout(() => {
        delete responseCache[requestKey];
      }, CACHE_TTL);
      
      return response;
    } catch (error) {
      console.error('Error in response interceptor:', error);
      return response;
    }
  },
  async (error) => {
    try {
      // Handle throttled requests with cached data
      if (error.throttled && error.cachedData) {
        console.log('Returning cached data for throttled request');
        // Return a simulated successful response with cached data
        return Promise.resolve({
          status: 200,
          data: error.cachedData,
          headers: {},
          config: error.config || {},
          cached: true,
          throttleTime: error.throttleTime
        });
      }
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await storage.clearAuth();
          // TODO: Navigate to login screen
        }
      }
    } catch (interceptorError) {
      console.error('Error in error interceptor:', interceptorError);
    }
    
    return Promise.reject(error);
  }
);

// Utility function to help with retries
const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 2, delayMs = 1000): Promise<T> => {
  let lastError: any;
  let attemptCount = 0;
  
  // Improved network error detection
  const isNetworkError = (err: any): boolean => {
    // Don't use navigator.onLine which doesn't work reliably in Expo
    const isNetErr = err && (
      err.message === 'Network Error' || 
      err.code === 'ECONNABORTED' || 
      err.message?.includes('timeout') ||
      err.message?.includes('network')
    );
    
    if (isNetErr) {
      console.log('[API] Network error detected:', err.message || 'Unknown network error');
    }
    
    return isNetErr;
  };
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      attemptCount++;
      
      // For debugging - log the URL being called
      if (attempt > 0) {
        const backoffTime = delayMs * Math.pow(1.5, attempt - 1);
        console.log(`[API] Retry attempt ${attempt}/${maxRetries} after ${backoffTime}ms delay...`);
        // Wait before retry, with exponential backoff
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      } else {
        console.log(`[API] Making request (attempt ${attempt + 1}/${maxRetries + 1})...`);
      }
      
      // Don't check for navigator.onLine - it's unreliable in React Native
      // Just try to make the request and catch any network errors
      
      const result = await apiCall();
      console.log(`[API] Request successful on attempt ${attempt + 1}`);
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Log the error details
      console.error(`[API] Request failed on attempt ${attempt + 1}/${maxRetries + 1}:`, 
        error.response?.status || error.message || 'Unknown error');
      
      // If we got cached data due to throttling, just return that
      if (error.throttled && error.cachedData) {
        console.log(`[API] Using cached data due to throttling (attempt ${attemptCount}/${maxRetries + 1})`);
        return error.cachedData;
      }
      
      // Handle specific error cases
      if (axios.isAxiosError(error)) {
        // Log detailed error information
        if (error.response) {
          console.error(`[API] Server responded with status ${error.response.status}:`, 
            error.response.data || 'No response data');
        } else if (error.request) {
          console.error('[API] No response received from server (request was sent)');
        }
        
        // Don't retry on 401/403/404/409/422
        if (error.response && [401, 403, 404, 409, 422].includes(error.response.status)) {
          console.log(`[API] Not retrying for status code ${error.response.status}`);
          throw error;
        }
        
        // Always retry on network errors, even beyond max retries if needed
        if (isNetworkError(error) && attempt === maxRetries) {
          console.log('[API] Network error detected, adding extra retry attempt');
          // Continue with one extra retry
          continue;
        }
      }
      
      // Otherwise only retry if we haven't reached max retries yet
      if (attempt === maxRetries) {
        console.error(`[API] Max retries (${maxRetries}) reached. Giving up.`);
        if (isNetworkError(error)) {
          throw new Error('فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
        }
        throw error;
      }
    }
  }
  
  throw lastError;
};

// Stock API methods
const stockApi = {
  // Get all stocks
  getAllStocks: async () => {
    return withRetry(async () => {
      const response = await api.get('/stocks');
      return response.data;
    });
  },

  // Get single stock
  getStock: async (id: string) => {
    return withRetry(async () => {
      const response = await api.get(`/stocks/${id}`);
      return response.data;
    });
  },

  // Create stock
  createStock: async (stockData: Omit<StockItem, 'id' | 'stockHistory'>) => {
    return withRetry(async () => {
      const response = await api.post('/stocks', stockData);
      return response.data;
    });
  },

  // Update stock quantity
  updateStockQuantity: async (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => {
    return withRetry(async () => {
      const response = await api.post(`/stocks/${id}/quantity`, data);
      return response.data;
    });
  },

  // Update stock details
  updateStock: async (id: string, data: any) => {
    return withRetry(async () => {
      const response = await api.put(`/stocks/${id}`, data);
      return response.data;
    });
  },

  // Delete stock
  deleteStock: async (id: string) => {
    return withRetry(async () => {
      const response = await api.delete(`/stocks/${id}`);
      return response.data;
    });
  },

  // Get stock history
  getStockHistory: async (stockId: string) => {
    return withRetry(async () => {
      const response = await api.get(`/stocks/${stockId}/history`);
      return response.data;
    });
  }
};

// Animal API methods
const animalApi = {
  // Get all animals
  getAllAnimals: async () => {
    return withRetry(async () => {
      const response = await api.get('/animals');
      return response.data;
    });
  },

  // Create animal
  createAnimal: async (animalData: any) => {
    return withRetry(async () => {
      const response = await api.post('/animals', animalData);
      return response.data;
    });
  },

  // Update animal
  updateAnimal: async (id: string, data: any) => {
    return withRetry(async () => {
      const response = await api.put(`/animals/${id}`, data);
      return response.data;
    });
  },

  // Delete animal
  deleteAnimal: async (id: string) => {
    return withRetry(async () => {
      const response = await api.delete(`/animals/${id}`);
      return response.data;
    });
  },
};

// Stock Statistics API
const stockStatisticsApi = {
  getStatistics: async (params?: { startDate?: string; endDate?: string; category?: string }) => {
    return withRetry(async () => {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.category) queryParams.append('category', params.category);
      
      const queryString = queryParams.toString();
      const url = `/stock-statistics${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    });
  }
};

// Pesticide API methods
const pesticideApi = {
  // Get all pesticides
  getAllPesticides: async () => {
    return withRetry(async () => {
      const response = await api.get('/pesticides');
      return response.data;
    });
  },

  // Get pesticides for notification service
  getPesticides: async () => {
    try {
      const response = await api.get('/pesticides');
      return response.data;
    } catch (error) {
      console.error('Error fetching pesticides:', error);
      // Return empty array instead of throwing to avoid stopping notification checks
      return [];
    }
  },

  // Create pesticide
  createPesticide: async (pesticideData: any) => {
    return withRetry(async () => {
      const response = await api.post('/pesticides', pesticideData);
      return response.data;
    });
  },

  // Update pesticide
  updatePesticide: async (id: string, data: any) => {
    return withRetry(async () => {
      const response = await api.put(`/pesticides/${id}`, data);
      return response.data;
    });
  },

  // Delete pesticide
  deletePesticide: async (id: string) => {
    return withRetry(async () => {
      const response = await api.delete(`/pesticides/${id}`);
      return response.data;
    });
  },
};

// Seed API methods
const seedApi = {
  // Get all seeds
  getAllSeeds: async () => {
    return withRetry(async () => {
      const response = await api.get('/stock/seeds');
      return response.data;
    });
  },

  // Create seed
  createSeed: async (seedData: any) => {
    return withRetry(async () => {
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
    });
  },

  // Update seed
  updateSeed: async (id: string, data: any) => {
    return withRetry(async () => {
      const response = await api.put(`/stock/seeds/${id}`, data);
      return response.data;
    });
  },

  // Delete seed
  deleteSeed: async (id: string) => {
    return withRetry(async () => {
      const response = await api.delete(`/stock/seeds/${id}`);
      return response.data;
    });
  },

  // Update seed quantity
  updateSeedQuantity: async (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => {
    return withRetry(async () => {
      const response = await api.patch(`/stock/seeds/${id}/quantity`, data);
      return response.data;
    });
  }
};

// Stock Equipment API methods
const stockEquipmentApi = {
  // Get all equipment
  getAllEquipment: async () => {
    return withRetry(async () => {
      const response = await api.get('/stock/equipment');
      return response.data;
    });
  },

  // Get single equipment
  getEquipment: async (id: string) => {
    return withRetry(async () => {
      const response = await api.get(`/stock/equipment/${id}`);
      return response.data;
    });
  },

  // Create equipment
  createEquipment: async (equipmentData: any) => {
    return withRetry(async () => {
      const response = await api.post('/stock/equipment', equipmentData);
      return response.data;
    });
  },

  // Update equipment
  updateEquipment: async (id: string, data: any) => {
    return withRetry(async () => {
      const response = await api.put(`/stock/equipment/${id}`, data);
      return response.data;
    });
  },

  // Delete equipment
  deleteEquipment: async (id: string) => {
    return withRetry(async () => {
      const response = await api.delete(`/stock/equipment/${id}`);
      return response.data;
    });
  },

  // Record maintenance
  recordMaintenance: async (id: string, data: { maintenanceNotes: string; cost: number; nextMaintenanceDate?: Date }) => {
    return withRetry(async () => {
      const response = await api.post(`/stock/equipment/${id}/maintenance`, data);
      return response.data;
    });
  },

  // Update equipment status
  updateStatus: async (id: string, status: string) => {
    return withRetry(async () => {
      const response = await api.patch(`/stock/equipment/${id}/status`, { status });
      return response.data;
    });
  }
};

// Stock Feed API methods
const stockFeedApi = {
  // Get all feeds
  getAllFeeds: async () => {
    return withRetry(async () => {
      const response = await api.get('/stock/feed');
      return response.data;
    });
  },

  // Get feeds for notification service
  getFeeds: async () => {
    return withRetry(async () => {
      const response = await api.get('/stock/feed');
      return response.data;
    }, 2, 2000);
  },

  // Get single feed
  getFeed: async (id: string) => {
    return withRetry(async () => {
      const response = await api.get(`/stock/feed/${id}`);
      return response.data;
    });
  },

  // Create feed
  createFeed: async (feedData: any) => {
    return withRetry(async () => {
      const response = await api.post('/stock/feed', feedData);
      return response.data;
    });
  },

  // Update feed
  updateFeed: async (id: string, data: any) => {
    return withRetry(async () => {
      const response = await api.put(`/stock/feed/${id}`, data);
      return response.data;
    });
  },

  // Delete feed
  deleteFeed: async (id: string) => {
    return withRetry(async () => {
      const response = await api.delete(`/stock/feed/${id}`);
      return response.data;
    });
  },

  // Update feed quantity
  updateFeedQuantity: async (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => {
    return withRetry(async () => {
      const response = await api.patch(`/stock/feed/${id}/quantity`, data);
      return response.data;
    });
  }
};

// Stock Fertilizer API methods
const stockFertilizerApi = {
  // Get all fertilizers
  getAllFertilizers: async () => {
    return withRetry(async () => {
      const response = await api.get('/stock/fertilizer');
      return response.data;
    });
  },

  // Get fertilizers for notification service
  getFertilizers: async () => {
    return withRetry(async () => {
      const response = await api.get('/stock/fertilizer');
      return response.data;
    }, 2, 2000);
  },

  // Get single fertilizer
  getFertilizer: async (id: string) => {
    return withRetry(async () => {
      const response = await api.get(`/stock/fertilizer/${id}`);
      return response.data;
    });
  },

  // Create fertilizer
  createFertilizer: async (fertilizerData: any) => {
    return withRetry(async () => {
      const response = await api.post('/stock/fertilizer', fertilizerData);
      return response.data;
    });
  },

  // Update fertilizer
  updateFertilizer: async (id: string, data: any) => {
    return withRetry(async () => {
      const response = await api.put(`/stock/fertilizer/${id}`, data);
      return response.data;
    });
  },

  // Delete fertilizer
  deleteFertilizer: async (id: string) => {
    return withRetry(async () => {
      const response = await api.delete(`/stock/fertilizer/${id}`);
      return response.data;
    });
  },

  // Update fertilizer quantity
  updateFertilizerQuantity: async (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => {
    return withRetry(async () => {
      const response = await api.patch(`/stock/fertilizer/${id}/quantity`, data);
      return response.data;
    });
  }
};

// Stock Harvest API methods
const stockHarvestApi = {
  // Get all harvests
  getAllHarvests: async () => {
    return withRetry(async () => {
      const response = await api.get('/stock/harvest');
      return response.data;
    });
  },

  // Get harvests for notification service
  getHarvests: async () => {
    return withRetry(async () => {
      const response = await api.get('/stock/harvest');
      return response.data;
    }, 2, 2000);
  },

  // Get single harvest
  getHarvest: async (id: string) => {
    return withRetry(async () => {
      const response = await api.get(`/stock/harvest/${id}`);
      return response.data;
    });
  },

  // Create harvest
  createHarvest: async (harvestData: Partial<StockHarvest>) => {
    return withRetry(async () => {
      const response = await api.post('/stock/harvest', harvestData);
      return response.data;
    });
  },

  // Update harvest
  updateHarvest: async (id: string, data: Partial<StockHarvest>) => {
    return withRetry(async () => {
      const response = await api.put(`/stock/harvest/${id}`, data);
      return response.data;
    });
  },

  // Delete harvest
  deleteHarvest: async (id: string) => {
    return withRetry(async () => {
      const response = await api.delete(`/stock/harvest/${id}`);
      return response.data;
    });
  },

  // Update harvest quantity
  updateHarvestQuantity: async (id: string, data: { quantity: number; type: 'add' | 'remove'; notes?: string }) => {
    return withRetry(async () => {
      const response = await api.patch(`/stock/harvest/${id}/quantity`, data);
      return response.data;
    });
  }
};

// Seed API methods
const stockSeedApi = {
  getSeeds: async () => {
    return withRetry(async () => {
      const response = await api.get('/stock/seeds');
      return response.data;
    }, 2, 2000);
  }
  // other seed methods...
};

// Tool API methods
const stockToolApi = {
  getTools: async () => {
    return withRetry(async () => {
      const response = await api.get('/stock/tools');
      return response.data;
    });
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
  stockToolApi,
  withRetry // Export withRetry for use in other modules
}; 