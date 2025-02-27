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

export type StockHistoryType = 'add' | 'remove' | 'expired' | 'damaged';

export interface StockHistory {
  id: string;
  date: Date;
  quantity: number;
  type: StockHistoryType;
  notes?: string;
  reason?: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  location?: string;
  supplier?: string;
  price?: number;
  batchNumber?: string;
  expiryDate?: string;
  isNatural?: boolean;
  qualityStatus?: 'good' | 'medium' | 'poor';
  stockHistory?: StockHistory[];
} 