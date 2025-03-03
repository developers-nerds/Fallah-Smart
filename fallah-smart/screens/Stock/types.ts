export type StockUnit = 'kg' | 'g' | 'l' | 'ml' | 'units';

export type StockCategory = 
  | 'all'        // Tous
  | 'seeds'      // Semences
  | 'fertilizer' // Engrais
  | 'harvest'    // Récoltes
  | 'feed'       // Aliments
  | 'pesticide'  // Pesticides
  | 'equipment'  // Équipement
  | 'tools'      // Outils
  | 'animals';   // Animaux

export const STOCK_CATEGORIES: StockCategory[] = [
  'all',
  'seeds',
  'fertilizer',
  'harvest',
  'feed',
  'pesticide',
  'equipment',
  'tools',
  'animals'
];

export const STOCK_UNITS: StockUnit[] = [
  'kg',
  'g',
  'l',
  'ml',
  'units'
];

export type StockHistoryType = 'add' | 'remove' | 'expired' | 'damaged';

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor';
export type Gender = 'male' | 'female';

export interface Animal {
  id: string;
  type: string;
  count: number;
  healthStatus: HealthStatus;
  feedingSchedule: string;
  gender: Gender;
  feeding: string | null;
  care: string | null;
  health: string | null;
  housing: string | null;
  breeding: string | null;
  diseases: string | null;
  medications: string | null;
  behavior: string | null;
  economics: string | null;
  vaccination: string | null;
  notes: string | null;
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