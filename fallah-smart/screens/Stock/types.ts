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
  quantity: number;
  unit: StockUnit;
  category: StockCategory;
  lowStockThreshold: number;
  history: StockHistory[];
  isNatural?: boolean;
  location?: string;
  notes?: string;
  expiryDate?: Date;        // Date d'expiration
  supplier?: string;        // Fournisseur
  price?: number;          // Prix unitaire
  lastCheckDate?: Date;    // Dernière date de vérification
  qualityStatus?: 'good' | 'medium' | 'poor';  // État du stock
  batchNumber?: string;    // Numéro de lot
} 