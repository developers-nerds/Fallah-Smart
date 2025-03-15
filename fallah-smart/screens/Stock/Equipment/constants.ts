export type EquipmentType = 'tractor' | 'harvester' | 'irrigation_system' | 'planter' | 'sprayer' | 'tillage_equipment' | 'generator' | 'pump' | 'storage_unit' | 'processing_equipment' | 'transport_vehicle' | 'other';
export type EquipmentStatus = 'operational' | 'in_use' | 'maintenance' | 'repair' | 'broken' | 'retired' | 'reserved';
export type OperationalStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type FuelType = 'diesel' | 'petrol' | 'electric' | 'hybrid' | 'none';

export const EQUIPMENT_TYPES: Record<EquipmentType, { icon: string; name: string }> = {
  tractor: { icon: '🚜', name: 'جرار' },
  harvester: { icon: '🌾', name: 'حصادة' },
  irrigation_system: { icon: '💧', name: 'نظام ري' },
  planter: { icon: '🌱', name: 'آلة زراعة' },
  sprayer: { icon: '💨', name: 'رشاش' },
  tillage_equipment: { icon: '⚒️', name: 'معدات حرث' },
  generator: { icon: '⚡', name: 'مولد كهربائي' },
  pump: { icon: '🔌', name: 'مضخة' },
  storage_unit: { icon: '🏢', name: 'وحدة تخزين' },
  processing_equipment: { icon: '⚙️', name: 'معدات معالجة' },
  transport_vehicle: { icon: '🚛', name: 'مركبة نقل' },
  other: { icon: '🔧', name: 'أخرى' }
};

export const EQUIPMENT_STATUS: Record<EquipmentStatus, { icon: string; name: string; color: string }> = {
  operational: { icon: '✅', name: 'تشغيلي', color: '#4CAF50' },
  in_use: { icon: '🔄', name: 'قيد الاستخدام', color: '#2196F3' },
  maintenance: { icon: '🔧', name: 'صيانة', color: '#FFC107' },
  repair: { icon: '🛠️', name: 'إصلاح', color: '#FF9800' },
  broken: { icon: '❌', name: 'معطل', color: '#F44336' },
  retired: { icon: '⚰️', name: 'متقاعد', color: '#9E9E9E' },
  reserved: { icon: '📅', name: 'محجوز', color: '#673AB7' }
};

export const OPERATIONAL_STATUS: Record<OperationalStatus, { icon: string; name: string; color: string }> = {
  excellent: { icon: '⭐', name: 'ممتاز', color: '#4CAF50' },
  good: { icon: '✅', name: 'جيد', color: '#8BC34A' },
  fair: { icon: '⚠️', name: 'مقبول', color: '#FFC107' },
  poor: { icon: '⛔', name: 'سيء', color: '#FF9800' },
  critical: { icon: '🚫', name: 'حرج', color: '#F44336' }
};

export const FUEL_TYPES: Record<FuelType, { icon: string; name: string }> = {
  diesel: { icon: '⛽', name: 'ديزل' },
  petrol: { icon: '⛽', name: 'بنزين' },
  electric: { icon: '⚡', name: 'كهرباء' },
  hybrid: { icon: '🔋', name: 'هجين' },
  none: { icon: '❌', name: 'لا يوجد' }
};

export const UNIT_ICONS = {
  'unit': { icon: '📦', label: 'وحدة' },
  'hours': { icon: '⏱️', label: 'ساعة' },
  'km': { icon: '🛣️', label: 'كم' },
  'liters': { icon: '💧', label: 'لتر' }
}; 