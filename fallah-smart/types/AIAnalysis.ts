import { MaterialCommunityIcons } from '@expo/vector-icons';

// Types for AI analysis
export interface Insight {
  type: 'critical' | 'warning' | 'info';
  message: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  explanation: string;
  confidence: number; // percentage 0-100
  recommendations: string[];
  severity: 'high' | 'medium' | 'low';
}

export interface Prediction {
  title: string;
  description: string;
  timeframe: string;
  confidence: number; // percentage 0-100
  data?: number[];
  labels?: string[];
}

export interface Risk {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  likelihood: number; // percentage 0-100
  mitigationSteps: string[];
}

export interface AIAnalysis {
  insights: Insight[];
  predictions: Prediction[];
  risks: Risk[];
  generatedAt: string;
} 