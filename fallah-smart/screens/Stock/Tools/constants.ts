export type ToolType = 'hand_tools' | 'power_tools' | 'pruning_tools' | 'irrigation_tools' | 'harvesting_tools' | 'measuring_tools' | 'safety_equipment' | 'other';
export type ToolStatus = 'available' | 'in_use' | 'maintenance' | 'broken' | 'lost';
export type ToolCondition = 'new' | 'good' | 'fair' | 'poor';

export const TOOL_TYPES: Record<ToolType, { icon: string; name: string }> = {
  hand_tools: { icon: '🔨', name: 'أدوات يدوية' },
  power_tools: { icon: '⚡', name: 'أدوات كهربائية' },
  pruning_tools: { icon: '✂️', name: 'أدوات تقليم' },
  irrigation_tools: { icon: '💧', name: 'أدوات ري' },
  harvesting_tools: { icon: '🌾', name: 'أدوات حصاد' },
  measuring_tools: { icon: '📏', name: 'أدوات قياس' },
  safety_equipment: { icon: '⛑️', name: 'معدات السلامة' },
  other: { icon: '🔧', name: 'أخرى' }
};

export const TOOL_STATUS: Record<ToolStatus, { icon: string; name: string; color: string }> = {
  available: { icon: '✅', name: 'متاح', color: '#4CAF50' },
  in_use: { icon: '🔄', name: 'قيد الاستخدام', color: '#2196F3' },
  maintenance: { icon: '🔧', name: 'صيانة', color: '#FFC107' },
  broken: { icon: '❌', name: 'معطل', color: '#F44336' },
  lost: { icon: '❓', name: 'مفقود', color: '#9E9E9E' }
};

export const TOOL_CONDITION: Record<ToolCondition, { icon: string; name: string; color: string }> = {
  new: { icon: '⭐', name: 'جديد', color: '#4CAF50' },
  good: { icon: '✅', name: 'جيد', color: '#8BC34A' },
  fair: { icon: '⚠️', name: 'مقبول', color: '#FFC107' },
  poor: { icon: '⛔', name: 'سيء', color: '#F44336' }
};

export const TOOL_ICONS = {
  sections: {
    basic: '📋',
    purchase: '🛒',
    location: '📍',
    maintenance: '🔧',
    instructions: '📖'
  },
  basic: {
    tools: '🔧',
    name: '📝',
    type: '🔧',
    quantity: '📦',
    minQuantity: '⚠️',
    condition: '🔍',
    category: '📁',
    status: '📊'
  },
  purchase: {
    date: '🛒',
    price: '💰',
    brand: '🏢',
    model: '📱'
  },
  maintenance: {
    last: '🔨',
    next: '📅',
    interval: '⏱️',
    notes: '📝'
  },
  location: {
    storage: '📍',
    assigned: '👤'
  },
  instructions: {
    usage: '📖',
    safety: '⚠️'
  },
  status: {
    available: '✅',
    inUse: '🔄',
    maintenance: '🔧',
    broken: '❌',
    lost: '❓'
  }
}; 