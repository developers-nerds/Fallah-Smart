export interface Animal {
  id: number;
  name: string;
  icon: string;
  category: string;
}

export interface AnimalDetails {
  id: number;
  feeding: string;
  care: string;
  health: string;
  housing: string;
  breeding: string;
  diseases: string;
  medications: string;
  behavior: string;
  economics: string;
  vaccination: string;
  animalId: number;
}

export interface Crop {
  id: number;
  name: string;
  icon: string;
  category: string;
}

export interface CropDetails {
  id: number;
  plantingGuide: string;
  harvestingGuide: string;
  weatherConsiderations: string;
  fertilizers: string;
  bestPractices: string;
  diseaseManagement: string;
  pestControl: string;
  waterManagement: string;
  soilPreparation: string;
  storageGuidelines: string;
  marketValue: string;
  environmentalImpact: string;
  organicFarming: string;
  cropId: number;
} 