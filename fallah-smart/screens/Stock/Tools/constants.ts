export type ToolType = 'hand_tools' | 'power_tools' | 'pruning_tools' | 'irrigation_tools' | 'harvesting_tools' | 'measuring_tools' | 'safety_equipment' | 'other';
export type ToolStatus = 'available' | 'in_use' | 'maintenance' | 'lost';
export type ToolCondition = 'new' | 'good' | 'fair' | 'poor' | 'broken';

export const TOOL_TYPES: Record<ToolType, { name: string; icon: string }> = {
  hand_tools: { name: 'أدوات يدوية', icon: '🔨' },
  power_tools: { name: 'أدوات كهربائية', icon: '🔌' },
  pruning_tools: { name: 'أدوات تقليم', icon: '✂️' },
  irrigation_tools: { name: 'أدوات ري', icon: '💦' },
  harvesting_tools: { name: 'أدوات حصاد', icon: '🌾' },
  measuring_tools: { name: 'أدوات قياس', icon: '📏' },
  safety_equipment: { name: 'معدات سلامة', icon: '⛑️' },
  other: { name: 'أخرى', icon: '🔧' }
};

export const TOOL_STATUS: Record<ToolStatus, { name: string; icon: string; color: string }> = {
  available: { name: 'متاح', icon: '✅', color: '#4CAF50' },
  in_use: { name: 'قيد الاستخدام', icon: '🔄', color: '#2196F3' },
  maintenance: { name: 'في الصيانة', icon: '🔧', color: '#FFC107' },
  lost: { name: 'مفقود', icon: '❓', color: '#F44336' }
};

export const TOOL_CONDITION: Record<ToolCondition, { name: string; icon: string; color: string }> = {
  new: { name: 'جديد', icon: '🌟', color: '#4CAF50' },
  good: { name: 'جيد', icon: '👍', color: '#2196F3' },
  fair: { name: 'متوسط', icon: '👌', color: '#FF9800' },
  poor: { name: 'سيء', icon: '👎', color: '#795548' },
  broken: { name: 'معطل', icon: '❌', color: '#F44336' }
};

export const TOOL_ICONS = {
  sections: {
    basic: '📋',
    purchase: '💰',
    location: '📍',
    maintenance: '🔧',
    instructions: '📝'
  },
  basic: {
    tools: '🧰',
    name: '🏷️',
    quantity: '🔢',
    minQuantity: '⚠️',
    category: '📁',
    condition: '📊',
  },
  purchase: {
    date: '📅',
    price: '💲',
    brand: '🏭',
    model: '🔍',
  },
  location: {
    storage: '🏠',
    assigned: '👤',
  },
  maintenance: {
    last: '⏮️',
    next: '⏭️',
    interval: '⏱️',
    notes: '📝',
  },
  instructions: {
    usage: '📘',
    safety: '⚠️',
  }
}; 