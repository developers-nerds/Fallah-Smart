export interface Fertilizer {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  price: number;
  minQuantityAlert: number;
  npkRatio?: string;
  applicationRate?: string;
  supplier?: string;
  expiryDate: string;
  safetyGuidelines?: string;
} 