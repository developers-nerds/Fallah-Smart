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

export type BreedingStatus = 'pregnant' | 'not_breeding' | 'in_heat' | 'nursing';

export interface Animal {
  id: string;
  name: string;
  type: string;
  count: number;
  quantity: number;
  healthStatus: HealthStatus;
  location: string;
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

export type StockPesticide = Pesticide;

export type StockAnimal = Animal;

export interface StockSeed {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  price: number;
  expiryDate: string;
  variety?: string;
  manufacturer?: string;
  batchNumber?: string;
  purchaseDate?: string;
  location?: string;
  notes?: string;
  supplier?: string;
  plantingInstructions?: string;
  germinationTime?: string;
  growingSeason?: string;
  minQuantityAlert: number;
  cropType?: string;
  plantingSeasonStart?: string;
  plantingSeasonEnd?: string;
  germination?: number;
  certificationInfo?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockEquipment {
  id: number;
  name: string;
  quantity: number;
  type: string;
  status: string;
  operationalStatus: string;
  purchaseDate: string;
  warrantyExpiryDate?: string | null;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDate?: string | null;
  maintenanceInterval?: number | null;
  maintenanceSchedule?: any | null;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  yearOfManufacture?: number | null;
  purchasePrice?: number | null;
  currentValue?: number | null;
  depreciationRate?: number | null;
  fuelType?: string | null;
  fuelCapacity?: number | null;
  fuelEfficiency?: number | null;
  powerOutput?: string | null;
  dimensions?: string | null;
  weight?: number | null;
  location?: string | null;
  assignedOperator?: string | null;
  operatingHours?: number | null;
  lastOperationDate?: string | null;
  insuranceInfo?: any | null;
  registrationNumber?: string | null;
  certifications?: any | null;
  maintenanceHistory?: any[] | null;
  partsInventory?: any | null;
  operatingCost?: number | null;
  maintenanceCosts?: number | null;
  notes?: string | null;
  operatingInstructions?: string | null;
  safetyGuidelines?: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockFeed {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantityAlert: number;
  price: number;
  animalType: string;
  dailyConsumptionRate: number;
  expiryDate: string;
  supplier?: string;
  manufacturer?: string;
  batchNumber?: string;
  purchaseDate?: string;
  location?: string;
  nutritionalInfo?: string;
  recommendedUsage?: string;
  targetAnimals?: string;
  notes?: string;
  type?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockHarvest {
  id?: string;
  cropName: string;
  type: string;
  quantity: number;
  unit: string;
  price: number;
  minQuantityAlert?: number;
  harvestDate: Date | string;
  storageLocation?: string;
  quality?: string;
  batchNumber?: string;
  expiryDate?: Date | string;
  moisture?: number;
  storageConditions?: string;
  certifications?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryData {
  items: StockItem[];
  count: number;
  value: number;
  trends: number[];
  types?: Record<string, number>;
  totalWeight?: number;
  averageAge?: number;
  healthStatus?: {
    healthy: number;
    sick: number;
    quarantine: number;
  };
  totalVolume?: number;
  averagePrice?: number;
  expiryStatus?: {
    valid: number;
    expiringSoon: number;
    expired: number;
  };
  categories?: Record<string, number>;
}

export interface StockData {
  animals: CategoryData;
  pesticides: CategoryData;
  seeds: CategoryData;
  fertilizer: CategoryData;
  equipment: CategoryData;
  other: CategoryData;
}

export interface Insight {
  type: 'critical' | 'warning' | 'info';
  message: string;
  icon: string;
  color?: string;
  explanation: string;
  confidence: number;
  recommendations: string[];
  severity: 'high' | 'medium' | 'low';
} 