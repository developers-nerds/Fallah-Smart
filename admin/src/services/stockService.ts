import axios from 'axios';

const API_URL = import.meta.env.VITE_API;

// Generic stock item interface
export interface StockItem {
  id?: number;
  name?: string;
  type?: string;
  quantity?: number;
  count?: number;
  price?: number;
  minQuantityAlert?: number;
  unit?: string;
  expiryDate?: string;
  status?: string;
  cropName?: string;
  category?: string;
  [key: string]: any; // Allow for additional properties
}

// Set auth token for API requests
export const setAuthHeader = (token: string) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Get API endpoint based on category
const getEndpoint = (category: string, itemId?: number): string => {
  const baseEndpoints: Record<string, string> = {
    animals: `${API_URL}/animals`,
    pesticides: `${API_URL}/pesticides`,
    equipment: `${API_URL}/stock/equipment`,
    feeds: `${API_URL}/stock/feed`,
    fertilizers: `${API_URL}/stock/fertilizer`,
    harvests: `${API_URL}/stock/harvest`,
    seeds: `${API_URL}/stock/seeds`,
    tools: `${API_URL}/stock/tools`
  };

  const baseEndpoint = baseEndpoints[category] || baseEndpoints.animals;
  
  return itemId ? `${baseEndpoint}/${itemId}` : baseEndpoint;
};

// Stock service functions
export const stockService = {
  // Get all items in a category
  getAll: async (category: string, token: string): Promise<StockItem[]> => {
    const response = await axios.get(getEndpoint(category), setAuthHeader(token));
    return response.data;
  },

  // Get a single item by ID
  getById: async (category: string, itemId: number, token: string): Promise<StockItem> => {
    const response = await axios.get(getEndpoint(category, itemId), setAuthHeader(token));
    return response.data;
  },

  // Create a new item
  create: async (category: string, itemData: StockItem, token: string): Promise<StockItem> => {
    const response = await axios.post(getEndpoint(category), itemData, setAuthHeader(token));
    return response.data;
  },

  // Update an existing item
  update: async (category: string, itemId: number, itemData: StockItem, token: string): Promise<StockItem> => {
    const response = await axios.put(getEndpoint(category, itemId), itemData, setAuthHeader(token));
    return response.data;
  },

  // Delete an item
  delete: async (category: string, itemId: number, token: string): Promise<void> => {
    await axios.delete(getEndpoint(category, itemId), setAuthHeader(token));
  },

  // Update quantity for specific item
  updateQuantity: async (
    category: string, 
    itemId: number, 
    quantity: number, 
    type: 'add' | 'remove', 
    token: string
  ): Promise<StockItem> => {
    const endpoint = `${getEndpoint(category, itemId)}/quantity`;
    const response = await axios.patch(
      endpoint, 
      { quantity, type }, 
      setAuthHeader(token)
    );
    return response.data;
  },

  // Additional specialized methods for different stock types

  // For equipment
  recordMaintenance: async (
    equipmentId: number, 
    maintenanceData: { 
      maintenanceNotes: string, 
      cost?: number, 
      nextMaintenanceDate?: string 
    }, 
    token: string
  ): Promise<StockItem> => {
    const endpoint = `${API_URL}/stock/equipment/${equipmentId}/maintenance`;
    const response = await axios.post(endpoint, maintenanceData, setAuthHeader(token));
    return response.data;
  },

  updateEquipmentStatus: async (
    equipmentId: number, 
    status: string, 
    token: string
  ): Promise<StockItem> => {
    const endpoint = `${API_URL}/stock/equipment/${equipmentId}/status`;
    const response = await axios.patch(endpoint, { status }, setAuthHeader(token));
    return response.data;
  },

  // For harvests
  updateHarvestQuality: async (
    harvestId: number, 
    qualityData: { 
      qualityGrade: string, 
      qualityNotes?: string 
    }, 
    token: string
  ): Promise<StockItem> => {
    const endpoint = `${API_URL}/stock/harvest/${harvestId}/quality`;
    const response = await axios.patch(endpoint, qualityData, setAuthHeader(token));
    return response.data;
  },

  // Get dashboard summary 
  getDashboardSummary: async (token: string) => {
    try {
      // Get counts from each category
      const [animals, pesticides, equipment, feeds, fertilizers, harvests, seeds, tools] = await Promise.all([
        stockService.getAll('animals', token),
        stockService.getAll('pesticides', token),
        stockService.getAll('equipment', token),
        stockService.getAll('feeds', token),
        stockService.getAll('fertilizers', token),
        stockService.getAll('harvests', token),
        stockService.getAll('seeds', token),
        stockService.getAll('tools', token)
      ]);

      // Calculate total value across all categories
      const calculateValue = (items: StockItem[]): number => {
        return items.reduce((sum, item) => {
          const qty = item.quantity || item.count || 0;
          const price = item.price || 0;
          return sum + (qty * price);
        }, 0);
      };

      // Count low stock items
      const countLowStock = (items: StockItem[]): number => {
        return items.filter(item => {
          const qty = item.quantity || item.count || 0;
          return qty < (item.minQuantityAlert || 0);
        }).length;
      };

      // Count expiring items (within 30 days)
      const countExpiring = (items: StockItem[]): number => {
        const today = new Date();
        return items.filter(item => {
          if (!item.expiryDate) return false;
          const expiry = new Date(item.expiryDate);
          const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 30;
        }).length;
      };

      return {
        totalItems: {
          animals: animals.length,
          pesticides: pesticides.length,
          equipment: equipment.length,
          feeds: feeds.length,
          fertilizers: fertilizers.length,
          harvests: harvests.length,
          seeds: seeds.length,
          tools: tools.length,
          total: animals.length + pesticides.length + equipment.length + feeds.length + 
                 fertilizers.length + harvests.length + seeds.length + tools.length
        },
        totalValue: {
          animals: calculateValue(animals),
          pesticides: calculateValue(pesticides),
          equipment: calculateValue(equipment),
          feeds: calculateValue(feeds),
          fertilizers: calculateValue(fertilizers),
          harvests: calculateValue(harvests),
          seeds: calculateValue(seeds),
          tools: calculateValue(tools),
          total: calculateValue(animals) + calculateValue(pesticides) + calculateValue(equipment) + 
                 calculateValue(feeds) + calculateValue(fertilizers) + calculateValue(harvests) + 
                 calculateValue(seeds) + calculateValue(tools)
        },
        lowStock: {
          animals: countLowStock(animals),
          pesticides: countLowStock(pesticides),
          equipment: countLowStock(equipment),
          feeds: countLowStock(feeds),
          fertilizers: countLowStock(fertilizers),
          seeds: countLowStock(seeds),
          tools: countLowStock(tools),
          total: countLowStock(animals) + countLowStock(pesticides) + countLowStock(equipment) + 
                 countLowStock(feeds) + countLowStock(fertilizers) + countLowStock(seeds) + 
                 countLowStock(tools)
        },
        expiring: {
          pesticides: countExpiring(pesticides),
          feeds: countExpiring(feeds),
          fertilizers: countExpiring(fertilizers),
          seeds: countExpiring(seeds),
          harvests: countExpiring(harvests),
          total: countExpiring(pesticides) + countExpiring(feeds) + countExpiring(fertilizers) + 
                 countExpiring(seeds) + countExpiring(harvests)
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }
};

export default stockService; 