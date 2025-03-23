import { StockItem } from '../services/stockService';

// Format currency values
export const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3
  }).format(value);
};

// Format dates
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get status color for health or operational status
export const getStatusColor = (status?: string): string => {
  if (!status) return 'secondary';
  
  const normalizedStatus = status.toLowerCase();
  
  if (['excellent', 'good', 'operational', 'available', 'new'].includes(normalizedStatus)) {
    return 'success';
  } else if (['fair', 'maintenance', 'in_use', 'standard'].includes(normalizedStatus)) {
    return 'warning';
  } else if (['poor', 'critical', 'broken', 'retired', 'secondary'].includes(normalizedStatus)) {
    return 'danger';
  } else {
    return 'secondary';
  }
};

// Calculate stock level status (low, medium, high)
export const getStockLevelStatus = (item: StockItem): 'low' | 'medium' | 'high' => {
  const quantity = item.quantity || item.count || 0;
  const minAlert = item.minQuantityAlert || 0;
  
  if (quantity <= minAlert) {
    return 'low';
  } else if (quantity <= minAlert * 2) {
    return 'medium';
  } else {
    return 'high';
  }
};

// Get stock level color
export const getStockLevelColor = (stockLevel: 'low' | 'medium' | 'high'): string => {
  switch (stockLevel) {
    case 'low':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'high':
      return 'success';
    default:
      return 'secondary';
  }
};

// Check if an item is expiring soon (within next 30 days)
export const isExpiringSoon = (expiryDate?: string): boolean => {
  if (!expiryDate) return false;
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const differenceInDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return differenceInDays >= 0 && differenceInDays <= 30;
};

// Check if an item is expired
export const isExpired = (expiryDate?: string): boolean => {
  if (!expiryDate) return false;
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  
  return expiry < today;
};

// Calculate total value of stock items
export const calculateTotalValue = (items: StockItem[]): number => {
  return items.reduce((total, item) => {
    const quantity = item.quantity || item.count || 0;
    const price = item.price || 0;
    return total + (quantity * price);
  }, 0);
};

// Get display quantity with appropriate unit
export const getDisplayQuantity = (item: StockItem): string => {
  const quantity = item.count !== undefined ? item.count : item.quantity;
  
  if (quantity === undefined || quantity === null) {
    return 'N/A';
  }
  
  if (item.unit) {
    return `${quantity} ${item.unit}`;
  }
  
  return quantity.toString();
};

// Check if maintenance is due soon (within next 7 days)
export const isMaintenanceDueSoon = (nextMaintenanceDate?: string): boolean => {
  if (!nextMaintenanceDate) return false;
  
  const today = new Date();
  const maintenanceDate = new Date(nextMaintenanceDate);
  const differenceInDays = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return differenceInDays >= 0 && differenceInDays <= 7;
};

// Get item type display name (formatted and capitalized)
export const getItemTypeDisplay = (type?: string): string => {
  if (!type) return 'N/A';
  
  // Replace underscores with spaces and capitalize each word
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get category translation for display
export const getCategoryTranslation = (category: string): string => {
  const categoryMap: Record<string, string> = {
    animals: 'Animals',
    pesticides: 'Pesticides',
    equipment: 'Equipment',
    feeds: 'Feed',
    fertilizers: 'Fertilizer',
    harvests: 'Harvest',
    seeds: 'Seeds',
    tools: 'Tools'
  };
  
  return categoryMap[category] || category;
};

// Generate stock alert message
export const generateAlertMessage = (item: StockItem, category: string): string | null => {
  const quantity = item.quantity || item.count || 0;
  const minAlert = item.minQuantityAlert || 0;
  
  if (quantity <= minAlert) {
    return `Low stock: ${item.name || item.type || ''} (${getCategoryTranslation(category)})`;
  }
  
  if (item.expiryDate && isExpiringSoon(item.expiryDate)) {
    return `Expiring soon: ${item.name || item.type || ''} (${getCategoryTranslation(category)})`;
  }
  
  if (item.expiryDate && isExpired(item.expiryDate)) {
    return `Expired: ${item.name || item.type || ''} (${getCategoryTranslation(category)})`;
  }
  
  return null;
};

// Get categorized alerts from stock data
export interface StockAlert {
  category: string;
  item: StockItem;
  message: string;
  type: 'low_stock' | 'expiring_soon' | 'expired' | 'maintenance_due';
}

export const getStockAlerts = (stockData: Record<string, StockItem[]>): StockAlert[] => {
  const alerts: StockAlert[] = [];
  
  Object.entries(stockData).forEach(([category, items]) => {
    items.forEach(item => {
      const quantity = item.quantity || item.count || 0;
      const minAlert = item.minQuantityAlert || 0;
      
      // Check for low stock
      if (quantity <= minAlert) {
        alerts.push({
          category,
          item,
          message: `Low stock: ${item.name || item.type || ''} (${quantity} remaining)`,
          type: 'low_stock'
        });
      }
      
      // Check for expiring soon
      if (item.expiryDate && isExpiringSoon(item.expiryDate)) {
        alerts.push({
          category,
          item,
          message: `Expiring soon: ${item.name || item.type || ''} (${formatDate(item.expiryDate)})`,
          type: 'expiring_soon'
        });
      }
      
      // Check for expired
      if (item.expiryDate && isExpired(item.expiryDate)) {
        alerts.push({
          category,
          item,
          message: `Expired: ${item.name || item.type || ''} (${formatDate(item.expiryDate)})`,
          type: 'expired'
        });
      }
      
      // Check for maintenance due
      if (item.nextMaintenanceDate && isMaintenanceDueSoon(item.nextMaintenanceDate)) {
        alerts.push({
          category,
          item,
          message: `Maintenance due: ${item.name || ''} (${formatDate(item.nextMaintenanceDate)})`,
          type: 'maintenance_due'
        });
      }
    });
  });
  
  return alerts;
};

export default {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStockLevelStatus,
  getStockLevelColor,
  isExpiringSoon,
  isExpired,
  calculateTotalValue,
  getDisplayQuantity,
  isMaintenanceDueSoon,
  getItemTypeDisplay,
  getCategoryTranslation,
  generateAlertMessage,
  getStockAlerts
}; 