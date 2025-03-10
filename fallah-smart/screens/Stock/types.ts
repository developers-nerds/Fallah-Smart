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

export type BreedingStatus = 'not_breeding' | 'in_heat' | 'pregnant' | 'nursing';

export interface Animal {
  id: string;
  type: string;
  count: number;
  healthStatus: HealthStatus;
  feedingSchedule: string;
  gender: Gender;
  feeding?: string | null;
  health?: string | null;
  diseases?: string | null;
  medications?: string | null;
  vaccination?: string | null;
  notes?: string | null;
  birthDate?: string | null;
  weight?: number | null;
  lastWeightUpdate?: string | null;
  dailyFeedConsumption?: number | null;
  lastFeedingTime?: string | null;
  breedingStatus: BreedingStatus;
  lastBreedingDate?: string | null;
  expectedBirthDate?: string | null;
  offspringCount: number;
  nextVaccinationDate?: string | null;
  vaccinationHistory?: Array<{
    date: string;
    type: string;
  }> | null;
  motherId?: string | null;
  userId: string;
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

export type PesticideType = 'insecticide' | 'herbicide' | 'fungicide' | 'other';

export interface Pesticide {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantityAlert: number;
  price: number;
  isNatural: boolean;
  type: PesticideType;
  activeIngredients?: string | null;
  targetPests?: string | null;
  applicationRate?: number | null;
  safetyInterval?: number | null;
  expiryDate?: string | null;
  manufacturer?: string | null;
  registrationNumber?: string | null;
  storageConditions?: string | null;
  safetyPrecautions?: string | null;
  emergencyProcedures?: string | null;
  lastApplicationDate?: string | null;
  supplier?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockFormValues {
  name: string;
  quantity: number;
  unit: StockUnit;
  category: StockCategory;
  lowStockThreshold: number;
  location: string;
  supplier: string;
  price?: number;
  notes: string;
  isNatural: boolean;
  qualityStatus: 'good' | 'medium' | 'poor';
  batchNumber?: string;
  expiryDate?: Date;
} 