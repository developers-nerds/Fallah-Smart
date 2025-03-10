export type StockUnit = 'kg' | 'g' | 'l' | 'ml' | 'units' | 'piece' | 'box' | 'bag' | 'bottle' | 'can' | 'pack' | 'roll' | 'meter' | 'cm' | 'other';

export type StockCategory = 
  | 'all'        // Tous
  | 'seeds'      // Semences
  | 'fertilizer' // Engrais
  | 'harvest'    // Récoltes
  | 'feed'       // Aliments
  | 'pesticide'  // Pesticides
  | 'equipment'  // Équipement
  | 'tools'      // Outils
  | 'machinery'  // المعدات
  | 'animals'    // Animaux
  | 'other';     // أخرى

export const STOCK_CATEGORIES = [
  { value: 'all', label: 'الكل' },
  { value: 'seeds', label: 'البذور' },
  { value: 'fertilizers', label: 'الأسمدة' },
  { value: 'tools', label: 'الأدوات' },
  { value: 'machinery', label: 'المعدات' },
  { value: 'animals', label: 'الحيوانات' },
  { value: 'other', label: 'أخرى' }
] as const;

export const STOCK_UNITS = [
  { value: 'kg', label: 'كيلوغرام' },
  { value: 'g', label: 'غرام' },
  { value: 'l', label: 'لتر' },
  { value: 'ml', label: 'ملليلتر' },
  { value: 'unit', label: 'وحدة' },
  { value: 'piece', label: 'قطعة' },
  { value: 'box', label: 'صندوق' },
  { value: 'bag', label: 'كيس' },
  { value: 'bottle', label: 'زجاجة' },
  { value: 'can', label: 'علبة' },
  { value: 'pack', label: 'حزمة' },
  { value: 'roll', label: 'لفة' },
  { value: 'meter', label: 'متر' },
  { value: 'cm', label: 'سنتيمتر' },
  { value: 'other', label: 'أخرى' }
] as const;

export type StockHistoryType = 'add' | 'remove' | 'expired' | 'damaged';

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor';
export type Gender = 'male' | 'female';

export interface Animal {
  id: string;
  type: string;
  count: number;
  healthStatus: HealthStatus;
  gender: Gender;
  feedingSchedule?: string;
  feeding?: string | null;
  care?: string | null;
  health?: string | null;
  housing?: string | null;
  breeding?: string | null;
  diseases?: string | null;
  medications?: string | null;
  behavior?: string | null;
  economics?: string | null;
  vaccination?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockHistory {
  id: string;
  stockId: string;
  type: 'add' | 'remove';
  quantity: number;
  date: string;
  notes?: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  quantity: number;
  unit: StockUnit;
  lowStockThreshold: number;
  location?: string;
  supplier?: string;
  price?: number;
  batchNumber?: string;
  expiryDate?: string;
  isNatural: boolean;
  qualityStatus?: 'good' | 'medium' | 'poor';
  notes?: string;
  stockHistory: StockHistory[];
  createdAt: string;
  updatedAt: string;
} 