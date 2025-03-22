import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  TextInput,
  Modal,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { BarChart, PieChart, LineChart, ContributionGraph } from 'react-native-chart-kit';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { pesticideService, Pesticide as PesticideServiceType } from '../../services/pesticideService';
import { api, animalApi, stockSeedApi, stockEquipmentApi, stockFeedApi, stockFertilizerApi, stockToolApi, stockHarvestApi } from '../../services/api';
import { PesticideType } from './types';
import { AIAnalysis, Insight as AIInsight, Prediction, Risk } from '../../types/AIAnalysis';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
// Add a mock toast implementation since we don't have the actual package
const Toast = {
  show: (options: { type: string, text1: string, text2: string }) => {
    console.log(`[Toast] ${options.type}: ${options.text1} - ${options.text2}`);
  }
};

// Add interface definitions for UI components
interface FilterBarProps {
  categories: Array<{ key: keyof StockData; name: string }>;
  selectedCategories: Array<keyof StockData>;
  onSelectCategory: (category: keyof StockData) => void;
  onToggleAll: () => void;
}

interface TimePeriodSelectorProps {
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFunction?: (val: number) => string;
}

interface AnimatedCardProps {
  children: React.ReactNode;
  index: number;
  style: any;
}

interface ExportDataModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (type: string) => void;
}

interface ComparisonChartProps {
  data: CategoryData;
  category: keyof StockData;
}

interface StockCalendarViewProps {
  stockData: StockData;
}

interface CalendarEntry {
  date: string;
  count: number;
  item: string;
}

// Add missing type definitions at the top of the file
interface StockItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  value?: number;
  minQuantity?: number;
  minQuantityAlert?: number;
  expiryDate?: string;
  type?: string;
  unit?: string;
  status?: string;
  image?: string;
  category?: string;
}

interface CategoryData {
  count: number;
  value: number;
  items: StockItem[];
  trends: number[];
  types: Record<string, number>;
  expiryStatus?: {
    expired: number;
    nearExpiry: number;
    expiringSoon?: number;
    valid: number;
  };
  healthStatus?: string | Record<string, any>;
  categories?: Record<string, number>;
}

interface StockData {
  animals: CategoryData;
  pesticides: CategoryData;
  seeds: CategoryData;
  fertilizer: CategoryData;
  equipment: CategoryData;
  feed: CategoryData;
  tools: CategoryData;
  harvest: CategoryData;
}

// Define COLORS locally
const COLORS = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  text: '#333333',
  background: '#F2F2F7',
  success: '#34C759',
  warning: '#FFCC00',
  danger: '#FF3B30',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8E8E93',
  lightGray: '#E5E5EA',
  red: '#FF3B30',
  yellow: '#FFCC00',
  green: '#34C759',
  blue: '#0A84FF',
  purple: '#5E5CE6',
  teal: '#5AC8FA',
  indigo: '#5E5CE6',
  pink: '#FF2D55',
  orange: '#FF9500',
  border: '#E5E5EA',
  accent: '#FF9500',
  card: '#FFFFFF', // Add card color
  error: '#FF3B30' // Add error color
};

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Define fixed colors instead of relying on theme
const chartColors: Record<keyof StockData, {
  primary: string;
  background: string;
  gradient: readonly [string, string];
}> = {
  animals: {
    primary: 'rgba(75, 192, 192, 1)',
    background: 'rgba(75, 192, 192, 0.2)',
    gradient: ['#4BC0C0', '#2A9D8F'] as const
  },
  pesticides: {
    primary: 'rgba(255, 99, 132, 1)',
    background: 'rgba(255, 99, 132, 0.2)',
    gradient: ['#FF6B6B', '#EE5253'] as const
  },
  seeds: {
    primary: 'rgba(255, 205, 86, 1)',
    background: 'rgba(255, 205, 86, 0.2)',
    gradient: ['#FFD93D', '#FFA41B'] as const
  },
  fertilizer: {
    primary: 'rgba(54, 162, 235, 1)',
    background: 'rgba(54, 162, 235, 0.2)',
    gradient: ['#36A2EB', '#2B6CB0'] as const
  },
  equipment: {
    primary: 'rgba(153, 102, 255, 1)',
    background: 'rgba(153, 102, 255, 0.2)',
    gradient: ['#9B59B6', '#8E44AD'] as const
  },
  feed: {
    primary: 'rgba(255, 159, 64, 1)',
    background: 'rgba(255, 159, 64, 0.2)',
    gradient: ['#FF9F40', '#E67E22'] as const
  },
  tools: {
    primary: 'rgba(46, 204, 113, 1)',
    background: 'rgba(46, 204, 113, 0.2)',
    gradient: ['#2ECC71', '#27AE60'] as const
  },
  harvest: {
    primary: 'rgba(52, 152, 219, 1)',
    background: 'rgba(52, 152, 219, 0.2)',
    gradient: ['#3498DB', '#2980B9'] as const
  }
};

// Add MaterialCommunityIcons type
type MaterialCommunityIconName = 'symbol' | 'function' | 'solid' | 'filter' | 'wrap' | 'card' | 'cow' | 'flask' | 'seed' | 'shovel' | 'tools' | 'shape' | 'check-circle' | 'alert-circle' | 'close-circle' | 'trending-down' | 'alert' | 'loading' | 'food' | 'hammer' | 'basket';

// Update interfaces to include icon type
interface Insight {
  type: 'Critical' | 'Warning' | 'Good';
  message: string;
  icon: MaterialCommunityIconName;
}

// Add Recommendation interface
interface Recommendation {
  priority: 'High' | 'Medium' | 'Low';
  message: string;
  action: string;
}

// Add back the PesticideSubCategory type
type PesticideSubCategory = 'insecticide' | 'herbicide' | 'fungicide' | 'other';

// Helper functions
const getCategoryColor = (category: keyof typeof chartColors): string => {
  return chartColors[category]?.primary || COLORS.primary;
};

// Update getCategoryIcon to return MaterialCommunityIconName
const getCategoryIcon = (category: keyof StockData): MaterialCommunityIconName => {
  const icons: Record<keyof StockData, MaterialCommunityIconName> = {
    animals: 'cow',
    pesticides: 'flask',
    seeds: 'seed',
    fertilizer: 'shovel',
    equipment: 'tools',
    feed: 'food',
    tools: 'hammer',
    harvest: 'basket'
  };
  return icons[category] || 'shape';
};

// Update formatNumber to use English numerals
const formatNumber = (num: number): string => {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString('en-US');
};

// Update formatCurrency to use TND (Tunisian Dinar)
const formatCurrency = (value: number): string => {
  return value.toLocaleString('ar-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Update filter callbacks with proper types
const calculateStockEfficiency = (data: StockData): number => {
  // Calculate the overall health percentage based on expired, low, and good stock
  let totalItems = 0;
  let healthyItems = 0;
  
  Object.values(data).forEach(category => {
    category.items.forEach((item: StockItem) => {
      totalItems++;
      if (!item.status || (item.status.toLowerCase() !== 'expired' && item.status.toLowerCase() !== 'low')) {
        healthyItems++;
      }
    });
  });
  
  return totalItems > 0 ? Math.round((healthyItems / totalItems) * 100) : 100;
};

const getStockHealthStatus = (data: StockData): { status: string; color: string; icon: MaterialCommunityIconName } => {
  const efficiency = calculateStockEfficiency(data);
  if (efficiency >= 80) return { status: 'جيد', color: '#00C853', icon: 'check-circle' };
  if (efficiency >= 60) return { status: 'تحذير', color: '#FFA500', icon: 'alert-circle' };
  return { status: 'حرج', color: '#FF1744', icon: 'close-circle' };
};

const getInsights = (stockData: StockData): Insight[] => {
  const insights: Insight[] = [];
  
  // Overall stock health
  const healthStatus = getStockHealthStatus(stockData);
  insights.push({
    type: healthStatus.status as 'Critical' | 'Warning' | 'Good',
    message: `صحة المخزون العامة ${healthStatus.status}`,
    icon: healthStatus.icon
  });

  // Category-specific insights
  Object.entries(stockData).forEach(([category, data]) => {
    const monthlyGrowth = calculateGrowthRate(
      data.trends[5] || 0,
      data.trends[4] || 0
    );

    if (monthlyGrowth < -10) {
      insights.push({
        type: 'Warning',
        message: `انخفض مخزون ${category === 'animals' ? 'الحيوانات' :
                 category === 'pesticides' ? 'المبيدات' :
                 category === 'seeds' ? 'البذور' :
                 category === 'fertilizer' ? 'الأسمدة' :
                 category === 'equipment' ? 'المعدات' : 'الأخرى'} بنسبة ${Math.abs(monthlyGrowth).toFixed(1)}%`,
        icon: 'trending-down'
      });
    }

    if (category === 'pesticides' && data.expiryStatus) {
      const expiredRatio = (data.expiryStatus.expired || 0) / (data.count || 1);
      if (expiredRatio > 0.1) {
        insights.push({
          type: 'Critical',
          message: `نسبة عالية من المبيدات المنتهية الصلاحية (${(expiredRatio * 100).toFixed(1)}%)`,
          icon: 'alert'
        });
      }
    }
  });

  return insights;
};

// Update getRecommendations with proper types
const getRecommendations = (stockData: StockData): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  
  // Check low stock items
  Object.entries(stockData).forEach(([category, data]) => {
    const categoryTranslations: Record<string, string> = {
      animals: 'الحيوانات',
      pesticides: 'المبيدات',
      seeds: 'البذور',
      fertilizer: 'الأسمدة',
      equipment: 'المعدات',
      feed: 'الأعلاف',
      tools: 'الأدوات',
      harvest: 'المحاصيل'
    };

    if (category !== 'harvest') { // Typically you don't need to restock harvest
      const lowStockItems = data.items.filter((item: StockItem) => 
        (item.quantity || 0) <= (item.minQuantity || 0)
      );

      if (lowStockItems.length > 0) {
        recommendations.push({
          priority: 'High',
          message: `إعادة تعبئة ${lowStockItems.length} عنصر من ${categoryTranslations[category] || category}`,
          action: 'إعادة التخزين'
        });
      }
    }
  });

  // Check pesticide expiry
  if (stockData.pesticides.expiryStatus) {
    const expiringPesticides = stockData.pesticides.expiryStatus.expiringSoon || 0;
    if (expiringPesticides > 0) {
      recommendations.push({
        priority: 'Medium',
        message: `${expiringPesticides} مبيدات قريبة من تاريخ انتهاء الصلاحية`,
        action: 'التخطيط للاستخدام أو التخلص'
      });
    }
  }

  // Check inventory balance
  const totalValue = Object.values(stockData).reduce((sum, category) => sum + category.value, 0);
  Object.entries(stockData).forEach(([category, data]) => {
    const valueRatio = data.value / totalValue;
    if (valueRatio > 0.4) {
      recommendations.push({
        priority: 'Low',
        message: `تركيز عالي للقيمة في ${category === 'animals' ? 'الحيوانات' :
                 category === 'pesticides' ? 'المبيدات' :
                 category === 'seeds' ? 'البذور' :
                 category === 'fertilizer' ? 'الأسمدة' :
                 category === 'equipment' ? 'المعدات' : 'الأخرى'} (${(valueRatio * 100).toFixed(1)}%)`,
        action: 'تنويع المخزون'
      });
    }
  });

  return recommendations;
};

// Update render functions with proper types
const renderInsightCard = (insight: Insight, index: number) => (
  <View 
    key={`insight-${insight.type}-${index}`}
    style={[
      baseStyles.insightCard,
      { 
        backgroundColor: 
          insight.type === 'Critical' ? 'rgba(255, 0, 0, 0.1)' :
          insight.type === 'Warning' ? 'rgba(255, 165, 0, 0.1)' :
          'rgba(0, 255, 0, 0.1)'
      }
    ]}
  >
    <MaterialCommunityIcons 
      name={insight.icon} 
      size={24} 
      color={
        insight.type === 'Critical' ? COLORS.error : 
        insight.type === 'Warning' ? COLORS.warning : 
        COLORS.success
      }
    />
    <Text style={baseStyles.insightText}>{insight.message}</Text>
  </View>
);

const renderRecommendationCard = (recommendation: Recommendation, index: number) => (
  <View 
    key={`rec-${recommendation.priority}-${index}`}
    style={[
      baseStyles.recommendationCard,
      { 
        borderLeftColor:
          recommendation.priority === 'High' ? COLORS.error :
          recommendation.priority === 'Medium' ? COLORS.warning :
          COLORS.success
      }
    ]}
  >
    <View style={baseStyles.recommendationHeader}>
      <Text style={baseStyles.recommendationPriority}>
        {recommendation.priority === 'High' ? 'عالي' : 
         recommendation.priority === 'Medium' ? 'متوسط' : 'منخفض'}
      </Text>
      <Text style={baseStyles.recommendationAction}>{recommendation.action}</Text>
    </View>
    <Text style={baseStyles.recommendationText}>{recommendation.message}</Text>
  </View>
);

// Base styles that don't depend on theme
const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  overviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overviewCard: {
    borderRadius: 12,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  overviewSubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center'
  },
  sectionContainer: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  alertContainer: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  alertItemName: {
    flex: 2,
    fontSize: 14,
    fontWeight: '500',
  },
  alertItemCategory: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
  },
  alertItemQuantity: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  summaryContainer: {
    marginBottom: 24,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardSubvalue: {
    fontSize: 12,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500'
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  insightText: {
    marginLeft: 12,
    fontSize: 14,
    flex: 1,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recommendationPriority: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendationAction: {
    fontSize: 12,
    color: '#666',
  },
  recommendationText: {
    fontSize: 14,
  },
  insightsContainer: {
    marginBottom: 24,
  },
  recommendationsContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.text,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    marginLeft: 4,
    fontSize: 12,
  },
  positiveText: {
    color: '#00C853',
  },
  negativeText: {
    color: '#FF1744',
  },
  detailsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.card,
    borderRadius: 8
  },
  categoryCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  categoryCardGradient: {
    padding: 16,
  },
  categoryCardContent: {
    alignItems: 'center',
  },
  categoryCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  categoryCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  categoryCardSubvalue: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  categoryCardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  healthIndicatorContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  healthIndicatorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.text,
  },
  healthIndicatorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthIndicatorMetric: {
    alignItems: 'center',
  },
  healthIndicatorValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  healthIndicatorLabel: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
  },
  healthIndicatorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthIndicatorStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  categoryDetails: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aiAnalysisContainer: {
    marginTop: 24,
  },
  aiSection: {
    marginBottom: 24,
  },
  aiSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.text,
  },
  aiCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: COLORS.text,
  },
  aiCardDescription: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    marginBottom: 8,
  },
  recommendationsList: {
    marginTop: 8,
  },
  recommendationItem: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    marginBottom: 4,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  confidenceText: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.6,
    marginTop: 4,
  },
  timeframe: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.6,
    marginTop: 4,
  },
  mitigationList: {
    marginTop: 8,
  },
  mitigationItem: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    marginBottom: 4,
  },
  healthIndicatorMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  healthIndicatorExplanation: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    marginTop: 4,
  },
  recommendation: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    marginTop: 4,
  },
  helpIcon: {
    padding: 4,
  },
  tooltip: {
    position: 'absolute',
    top: 25,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 6,
    width: 200,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: COLORS.white,
    fontSize: 12,
  },
  tooltipClose: {
    position: 'absolute',
    top: 2,
    right: 5,
    padding: 3,
  },
  farmerFriendlyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardValueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 8,
  },
  largeIcon: {
    position: 'absolute',
    right: 16,
    opacity: 0.1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
});

// Update stock analysis functions with proper types
const calculateStockTurnover = (category: keyof StockData, data: CategoryData): number => {
  const totalValue = data.value || 0;
  const averageValue = data.count > 0 ? totalValue / data.count : 0;
  // Prevent division by zero or NaN
  if (averageValue === 0 || isNaN(averageValue)) return 0;
  return Number((totalValue / averageValue).toFixed(1));
};

const getCategoryPerformance = (category: keyof StockData, data: CategoryData): { growth: number; status: 'positive' | 'negative' | 'neutral' } => {
  const monthlyGrowth = calculateGrowthRate(
    data.trends[5] || 0,
    data.trends[4] || 0
  );
  return {
    growth: monthlyGrowth,
    status: monthlyGrowth > 0 ? 'positive' : monthlyGrowth < 0 ? 'negative' : 'neutral'
  };
};

const renderStockHealthIndicator = (data: StockData) => {
  const efficiency = calculateStockEfficiency(data);
  const healthStatus = getStockHealthStatus(data);

  return (
    <View style={baseStyles.healthIndicatorContainer}>
      <Text style={baseStyles.healthIndicatorTitle}>نظرة عامة على صحة المخزون</Text>
      <View style={baseStyles.healthIndicatorContent}>
        <View style={baseStyles.healthIndicatorMetric}>
          <Text style={baseStyles.healthIndicatorValue}>{efficiency}%</Text>
          <Text style={baseStyles.healthIndicatorLabel}>معدل الكفاءة</Text>
        </View>
        <View style={baseStyles.healthIndicatorStatus}>
          <MaterialCommunityIcons 
            name={healthStatus.icon} 
            size={24} 
            color={healthStatus.color} 
          />
          <Text style={[
            baseStyles.healthIndicatorStatusText,
            { color: healthStatus.color }
          ]}>
            {healthStatus.status}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Help tooltip for farmers
const HelpTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <View style={{ position: 'relative', marginLeft: 5 }}>
      <TouchableOpacity
        onPress={() => setShowTooltip(!showTooltip)}
        style={baseStyles.helpIcon}
      >
        <MaterialCommunityIcons name="help-circle-outline" size={16} color={COLORS.gray} />
      </TouchableOpacity>
      
      {showTooltip && (
        <View style={baseStyles.tooltip}>
          <Text style={baseStyles.tooltipText}>{text}</Text>
          <TouchableOpacity
            style={baseStyles.tooltipClose}
            onPress={() => setShowTooltip(false)}
          >
            <MaterialCommunityIcons name="close" size={12} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Status indicator component
const StatusIndicator: React.FC<{
  status: 'good' | 'warning' | 'critical';
  size?: number;
}> = ({ status, size = 10 }) => {
  const color = status === 'good' ? '#00C853' : 
               status === 'warning' ? '#FFA500' : '#FF1744';
               
  return (
    <View 
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        marginRight: 5
      }}
    />
  );
};

// Fix Arabic text rendering with proper RTL settings and translations
  const categoryTranslations: Record<keyof StockData, string> = {
    animals: 'الحيوانات',
    pesticides: 'المبيدات',
    seeds: 'البذور',
    fertilizer: 'الأسمدة',
    equipment: 'المعدات',
  feed: 'الأعلاف',
  tools: 'الأدوات',
  harvest: 'المحاصيل'
};

// Add more descriptive translations for dashboard elements
const dashboardTranslations = {
  stockHealth: 'صحة المخزون',
  efficiency: 'معدل الكفاءة',
  totalItems: 'إجمالي العناصر',
  totalValue: 'القيمة الإجمالية',
  lowStock: 'مخزون منخفض',
  expiringSoon: 'ينتهي قريباً',
  insights: 'الرؤى والنصائح',
  recommendations: 'التوصيات',
  filterBy: 'تصفية حسب',
  all: 'الكل',
  search: 'البحث عن العناصر...',
  export: 'تصدير',
  compare: 'مقارنة بالعام السابق',
  overview: 'نظرة عامة على الفئات',
  itemsNeedAttention: 'عناصر تحتاج إلى اهتمام',
  requestRestock: 'طلب إعادة تعبئة',
  stockHealthExplanation: 'مؤشر صحة المخزون يوضح الحالة العامة للمخزون ومدى كفاءته',
  currency: 'دينار',
  currentYear: 'العام الحالي',
  lastYear: 'العام السابق',
  stockActivity: 'نشاط المخزون',
  stockActivityExplanation: 'يوضح نشاط المخزون على مدار الستة أشهر الماضية'
};

// Filter Bar component with proper types
const FilterBar: React.FC<FilterBarProps> = ({ categories, selectedCategories, onSelectCategory, onToggleAll }) => {
  // Check if all categories are selected
  const allSelected = categories.length === selectedCategories.length;

  return (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>{dashboardTranslations.filterBy}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {/* Add "All" option */}
        <TouchableOpacity
          style={[
            styles.filterButton, 
            allSelected ? 
              { backgroundColor: COLORS.primary } : 
              { backgroundColor: 'transparent', borderColor: COLORS.primary, borderWidth: 1 }
          ]}
          onPress={onToggleAll}
          accessible={true}
          accessibilityLabel={dashboardTranslations.all}
          accessibilityHint="تحديد جميع الفئات"
        >
          <MaterialCommunityIcons 
            name="view-grid" 
            size={16} 
            color={allSelected ? COLORS.white : COLORS.primary} 
          />
          <Text 
            style={[
              styles.filterButtonText, 
              allSelected ? { color: COLORS.white } : { color: COLORS.primary }
            ]}
          >
            {dashboardTranslations.all}
          </Text>
        </TouchableOpacity>
        
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.filterButton, 
              selectedCategories.includes(category.key) ? 
                { backgroundColor: chartColors[category.key].primary } : 
                { backgroundColor: 'transparent', borderColor: chartColors[category.key].primary, borderWidth: 1 }
            ]}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onSelectCategory(category.key);
            }}
            accessible={true}
            accessibilityLabel={category.name}
            accessibilityHint={`تصفية حسب ${category.name}`}
          >
            <MaterialCommunityIcons 
              name={getCategoryIcon(category.key)} 
              size={16} 
              color={selectedCategories.includes(category.key) ? COLORS.white : chartColors[category.key].primary} 
            />
            <Text 
              style={[
                styles.filterButtonText, 
                selectedCategories.includes(category.key) ? { color: COLORS.white } : { color: chartColors[category.key].primary }
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
            </View>
  );
};

// Time Period Selector component with proper types
const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({ selectedPeriod, onSelectPeriod }) => {
  const periods = [
    { key: '1m', name: 'شهر'},
    { key: '3m', name: '3 أشهر'},
    { key: '6m', name: '6 أشهر'},
    { key: '1y', name: 'سنة'},
  ];
  
  return (
    <View style={styles.timePeriodContainer}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodButton,
            selectedPeriod === period.key && styles.periodButtonActive
          ]}
          onPress={() => onSelectPeriod(period.key)}
        >
          <Text 
            style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.periodButtonTextActive
            ]}
          >
            {period.name}
              </Text>
        </TouchableOpacity>
      ))}
            </View>
  );
};

// Animated Number component with proper types
const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  duration = 1000, 
  formatFunction = (val: number) => val.toString() 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false
    }).start();
    
    const listener = animatedValue.addListener(({ value: val }) => {
      setDisplayValue(Math.floor(val));
    });
    
    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value]);
  
  return (
    <Text>{formatFunction(displayValue)}</Text>
  );
};

// Animated Card component with proper types
const AnimatedCard: React.FC<AnimatedCardProps> = ({ children, index, style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);
  
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Export Data Modal component with proper types
const ExportDataModal: React.FC<ExportDataModalProps> = ({ visible, onClose, onExport }) => {
  const exportOptions = [
    { id: 'pdf', name: 'PDF', icon: 'file-pdf-box' },
    { id: 'excel', name: 'Excel', icon: 'file-excel-box' },
    { id: 'csv', name: 'CSV', icon: 'file-delimited' },
    { id: 'image', name: 'صورة', icon: 'image' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
      }}>
        <View style={{
          width: '80%',
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: COLORS.text,
            }}>تصدير البيانات</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            paddingVertical: 16,
          }}>
            {exportOptions.map((option) => (
              <TouchableOpacity 
                key={option.id}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  marginBottom: 16,
                }}
                onPress={() => onExport(option.id)}
              >
                <MaterialCommunityIcons name={option.icon as any} size={32} color={COLORS.primary} />
                <Text style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: COLORS.text,
                  textAlign: 'center',
                }}>{option.name}</Text>
              </TouchableOpacity>
            ))}
        </View>
    </View>
      </View>
    </Modal>
  );
};

// Update the ComparisonChart component to use inline styles
const ComparisonChart: React.FC<ComparisonChartProps> = ({ data, category }) => {
  // Get monthly data for the past year
  const months = [
    getFullMonthLabel(5),
    getFullMonthLabel(4),
    getFullMonthLabel(3),
    getFullMonthLabel(2),
    getFullMonthLabel(1),
    getFullMonthLabel(0)
  ];
  
  // Create comparison data
  const currentYearData = data.trends || [0, 0, 0, 0, 0, 0];
  const lastYearData = currentYearData.map(value => 
    Math.max(0, value * (0.7 + Math.random() * 0.6))
  );
  
  return (
    <View style={{
      backgroundColor: COLORS.white,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <Text style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
        textAlign: 'center',
      }}>مقارنة مع السنة الماضية</Text>
      <LineChart
        data={{
          labels: months,
          datasets: [
            {
              data: currentYearData.map(value => isNaN(value) ? 0 : value),
              color: (opacity = 1) => `rgba(0, 150, 255, ${opacity})`,
    strokeWidth: 2,
              withDots: true,
            },
            {
              data: lastYearData.map(value => isNaN(value) ? 0 : value),
              color: (opacity = 1) => `rgba(180, 180, 180, ${opacity})`,
              strokeWidth: 2,
              withDots: true,
              strokeDashArray: [5, 5],
            }
          ],
          legend: [`${dashboardTranslations.currentYear}`, `${dashboardTranslations.lastYear}`]
        }}
        width={Dimensions.get('window').width - 64}
        height={220}
        chartConfig={{
          backgroundColor: 'white',
          backgroundGradientFrom: 'white',
          backgroundGradientTo: 'white',
    decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 120, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
            borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            strokeWidth: 1,
            stroke: 'rgba(0, 0, 0, 0.1)',
          }
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        bezier
        fromZero
      />
    </View>
  );
};

// Calendar data entry type
interface CalendarEntry {
  date: string;
  count: number;
  item: string;
}

// Add the missing getMonthName function
const getMonthName = (monthIndex: number): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[monthIndex % 12];
};

// Full month names with year for better graph labeling in English
const getFullMonthLabel = (monthsAgo: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const year = date.getFullYear();
  const monthName = getMonthName(date.getMonth());
  return `${monthName} ${year}`;
};

// Add specific calendar styles
const calendarStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'right',
  },
  chart: {
    borderRadius: 12,
    paddingVertical: 16,
  },
  legend: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 12,
    textAlign: 'center',
  }
});

// StockCalendarView component with proper types
const StockCalendarView: React.FC<StockCalendarViewProps> = ({ stockData }) => {
  const today = new Date();
  const endDate = new Date();
  
  // Generate only valid entries for the calendar
  const generateCalendarData = (): CalendarEntry[] => {
    const result: CalendarEntry[] = [];
    
    // Look back 6 months
    for (let i = 180; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Format date as YYYY-MM-DD for the contribution graph
      const dateString = date.toISOString().split('T')[0];
      
      // Find activity for this date across all categories
      let count = 0;
      let itemLabel = '';
      
      // Sum up activities from all categories
      Object.entries(stockData).forEach(([category, data]) => {
        // Add some activity based on the trends data
        const dayOfMonth = date.getDate();
        if (data.trends && data.trends.length > 0) {
          const trendIndex = Math.min(data.trends.length - 1, Math.floor(dayOfMonth / 30 * data.trends.length));
          const activity = data.trends[trendIndex];
          if (!isNaN(activity) && activity > 0) {
            // More activity on certain days
            if (dayOfMonth % 3 === 0) {
              count += Math.ceil(activity / 10);
              itemLabel = category;
            }
          }
        }
      });
      
      // Always add an entry for each date, even if count is 0
      result.push({
        date: dateString,
        count: count,
        item: itemLabel
      });
    }
    
    return result;
  };
  
  const calendarData = generateCalendarData();

  return (
    <View style={calendarStyles.container}>
      <Text style={calendarStyles.title}>نشاط المخزون (آخر 6 أشهر)</Text>
      <ContributionGraph
        values={calendarData.map(entry => ({
          date: entry.date || (new Date()).toISOString().split('T')[0],
          count: entry.count || 0,
        }))}
        endDate={endDate}
        numDays={105}
        width={Dimensions.get('window').width - 64}
        height={220}
        chartConfig={{
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 120, 225, ${opacity})`,
        }}
        style={calendarStyles.chart}
        tooltipDataAttrs={() => ({
          rx: 10,
          ry: 10
        })}
      />
      <Text style={calendarStyles.legend}>
        كل مربع يمثل يوماً، والألوان الداكنة تعني نشاطاً أكثر
      </Text>
    </View>
  );
};

// Add this new function to generate category-specific AI recommendations
const getCategoryRecommendations = (category: keyof StockData, data: CategoryData): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  
  // Add recommendations based on the category
  switch(category) {
    case 'animals':
      if (data.count < 10) {
        recommendations.push({
          priority: 'Medium',
          message: 'زيادة عدد الحيوانات في المزرعة',
          action: 'شراء حيوانات جديدة لتحسين الإنتاج'
        });
      }
      
      if (data.healthStatus && typeof data.healthStatus !== 'string') {
        const sickRatio = (data.healthStatus.sick || 0) / (data.count || 1);
        if (sickRatio > 0.1) {
          recommendations.push({
            priority: 'High',
            message: 'نسبة عالية من الحيوانات المريضة',
            action: 'فحص الحيوانات بواسطة طبيب بيطري'
          });
        }
      }
      
      if (calculateStockTurnover(category, data) < 1) {
        recommendations.push({
          priority: 'Low',
          message: 'معدل دوران منخفض للحيوانات',
          action: 'تحسين استراتيجية البيع أو تربية سلالات ذات إنتاجية أعلى'
        });
      }
      break;
      
    case 'pesticides':
      if (data.expiryStatus && (data.expiryStatus.expired || 0) > 0) {
        recommendations.push({
          priority: 'High',
          message: 'التخلص من المبيدات منتهية الصلاحية',
          action: 'التخلص الآمن من المبيدات منتهية الصلاحية وفقاً للإرشادات البيئية'
        });
      }
      
      if (data.expiryStatus && (data.expiryStatus.nearExpiry || 0) > 0) {
        recommendations.push({
          priority: 'Medium',
          message: 'استخدام المبيدات قريبة انتهاء الصلاحية',
          action: 'خطط لاستخدام المبيدات قبل انتهاء صلاحيتها لتجنب الهدر'
        });
      }
      
      if (data.categories && data.categories.herbicide < data.categories.insecticide / 3) {
        recommendations.push({
          priority: 'Low',
          message: 'تنويع أنواع المبيدات',
          action: 'زيادة تنوع المبيدات لتغطية مختلف الآفات والأعشاب الضارة'
        });
      }
      break;
      
    case 'seeds':
      if (data.count < 5) {
        recommendations.push({
          priority: 'Medium',
          message: 'مخزون البذور منخفض',
          action: 'شراء بذور للموسم القادم قبل بدء موسم الزراعة'
        });
      }
      
      // More seeds recommendations can be added here
      break;
      
    case 'fertilizer':
      if (data.count < 3) {
        recommendations.push({
          priority: 'Medium',
          message: 'مخزون الأسمدة منخفض',
          action: 'شراء أسمدة للموسم القادم'
        });
      }
      
      // More fertilizer recommendations can be added here
      break;
      
    case 'equipment':
      // Equipment-specific recommendations
      break;
      
    case 'feed':
      if (data.count < 5) {
        recommendations.push({
          priority: 'High',
          message: 'مخزون العلف منخفض',
          action: 'شراء علف إضافي لتجنب نقص التغذية للحيوانات'
        });
      }
      break;
      
    case 'tools':
      // Tools-specific recommendations
      break;
      
    case 'harvest':
      if (calculateStockTurnover(category, data) < 1) {
        recommendations.push({
          priority: 'Medium',
          message: 'معدل بيع المحاصيل منخفض',
          action: 'البحث عن أسواق جديدة أو تحسين استراتيجيات التسويق'
        });
      }
      break;
  }
  
  // Add general recommendation if none specific
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'Low',
      message: `مراقبة مستوى مخزون ${category}`,
      action: 'التأكد من المستويات المثلى للمخزون وتعديل كميات الشراء'
    });
  }
  
  return recommendations;
};

// Add weather integration component
interface WeatherInfo {
  temperature: number;
  condition: string;
  humidity: number;
  rainfall: number;
  icon: string;
}

const WeatherCard: React.FC<{ weatherInfo: WeatherInfo }> = ({ weatherInfo }) => {
  return (
    <View style={styles.weatherCard}>
      <View style={styles.weatherHeader}>
        <Text style={styles.cardTitle}>حالة الطقس اليوم</Text>
        <MaterialCommunityIcons
          name={weatherInfo.icon as MaterialCommunityIconName}
          size={24}
          color={COLORS.primary}
        />
      </View>
      <View style={styles.weatherContent}>
        <Text style={styles.temperatureText}>{weatherInfo.temperature}°</Text>
        <Text style={styles.weatherCondition}>{weatherInfo.condition}</Text>
        <View style={styles.weatherDetails}>
          <View style={styles.weatherDetail}>
            <MaterialCommunityIcons name="water-percent" size={18} color={COLORS.primary} />
            <Text style={styles.weatherDetailText}>الرطوبة: {weatherInfo.humidity}%</Text>
          </View>
          <View style={styles.weatherDetail}>
            <MaterialCommunityIcons name="weather-rainy" size={18} color={COLORS.primary} />
            <Text style={styles.weatherDetailText}>هطول: {weatherInfo.rainfall} مم</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Add task management component for farmers
interface FarmTask {
  id: string;
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  category: keyof StockData;
}

const TaskCard: React.FC<{ tasks: FarmTask[] }> = ({ tasks }) => {
  return (
    <View style={styles.tasksCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>المهام اليومية</Text>
        <MaterialCommunityIcons name="clipboard-check-outline" size={22} color={COLORS.primary} />
      </View>
      
      {tasks.length === 0 ? (
        <View style={styles.emptyTasksContainer}>
          <MaterialCommunityIcons name="check-circle-outline" size={40} color={COLORS.success} />
          <Text style={styles.emptyTasksText}>لا توجد مهام لهذا اليوم</Text>
        </View>
      ) : (
        tasks.slice(0, 3).map(task => (
          <View key={task.id} style={styles.taskItem}>
            <View style={[styles.taskPriorityIndicator, { 
              backgroundColor: 
                task.priority === 'High' ? COLORS.error : 
                task.priority === 'Medium' ? COLORS.warning : 
                COLORS.success 
            }]} />
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>
                {task.title}
              </Text>
              <Text style={styles.taskDueDate}>
                تاريخ الاستحقاق: {new Date(task.dueDate).toLocaleDateString('ar-SA')}
              </Text>
            </View>
            <TouchableOpacity style={styles.taskCheckButton}>
              <MaterialCommunityIcons 
                name={task.completed ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                size={22} 
                color={task.completed ? COLORS.success : COLORS.gray} 
              />
            </TouchableOpacity>
          </View>
        ))
      )}
      
      {tasks.length > 3 && (
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>عرض كل المهام ({tasks.length})</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Add quick action buttons component
const QuickActions: React.FC = () => {
  return (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity style={styles.quickActionButton}>
        <View style={styles.quickActionIcon}>
          <MaterialCommunityIcons name="clipboard-plus" size={24} color={COLORS.white} />
        </View>
        <Text style={styles.quickActionText}>إضافة عنصر</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickActionButton}>
        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warning }]}>
          <MaterialCommunityIcons name="barcode-scan" size={24} color={COLORS.white} />
        </View>
        <Text style={styles.quickActionText}>فحص المخزون</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickActionButton}>
        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.success }]}>
          <MaterialCommunityIcons name="file-chart" size={24} color={COLORS.white} />
        </View>
        <Text style={styles.quickActionText}>تقرير سريع</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickActionButton}>
        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.error }]}>
          <MaterialCommunityIcons name="alert-circle" size={24} color={COLORS.white} />
        </View>
        <Text style={styles.quickActionText}>عناصر منتهية</Text>
      </TouchableOpacity>
    </View>
  );
};

// Create custom checkbox component to replace the external dependency
const CustomCheckBox: React.FC<{value: boolean, onValueChange?: () => void}> = ({value, onValueChange}) => {
  return (
    <TouchableOpacity 
      onPress={onValueChange}
      style={{
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: value ? COLORS.primary : 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {value && (
        <MaterialCommunityIcons name="check" size={16} color="white" />
      )}
    </TouchableOpacity>
  );
};

// MediaLibrary permission hook to ensure permissions are properly asked for
const useMediaLibraryPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState<MediaLibrary.PermissionStatus | null>(null);
  
  useEffect(() => {
    (async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setPermissionStatus(status);
      } catch (error) {
        console.error("Error requesting permissions:", error);
        // Use a type assertion to handle the string type
        setPermissionStatus('denied' as MediaLibrary.PermissionStatus);
      }
    })();
  }, []);
  
  return {
    hasPermission: permissionStatus === 'granted',
    permissionStatus
  };
};

// Update the PrintModal component to use our improved permission hook
const PrintModal: React.FC<{ visible: boolean, onClose: () => void, stockData: StockData }> = ({ visible, onClose, stockData }) => {
  const [options, setOptions] = useState({
    summary: true,
    details: true,
    charts: false,
    recommendations: true
  });
  const [saving, setSaving] = useState(false);
  const { hasPermission } = useMediaLibraryPermission();
  const [saveMethod, setSaveMethod] = useState<'gallery' | 'downloads' | 'share'>('gallery');
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const toggleOption = (option: keyof typeof options) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const generateHTML = () => {
    const totalItems = Object.values(stockData).reduce((sum, category) => sum + category.count, 0);
    const totalValue = Object.values(stockData).reduce((sum, category) => sum + category.value, 0);
    
    // Define Arabic translations for categories
    const categoryTranslations: Record<string, string> = {
      animals: 'الحيوانات',
      pesticides: 'المبيدات',
      seeds: 'البذور',
      fertilizer: 'الأسمدة',
      equipment: 'المعدات',
      feed: 'الأعلاف',
      tools: 'الأدوات',
      harvest: 'المحاصيل'
    };
    
    // Format date in English
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Function to format numbers in English
    const formatEnglishNumber = (num: number) => {
      return num.toLocaleString('en-US');
    };
    
    // Update the English currency formatter in the generateHTML function
    const formatEnglishCurrency = (value: number) => {
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };
    
    // Calculate low stock items
    const lowStockItems = Object.values(stockData).flatMap((category: CategoryData, categoryIndex: number) => 
      category.items.filter((item: StockItem) => item.status?.toLowerCase() === 'low')
        .map((item: StockItem) => ({
          ...item,
          _categoryKey: Object.keys(stockData)[categoryIndex] as keyof StockData
        }))
    );
    
    // Calculate expired items
    const expiredItems = Object.values(stockData).flatMap((category: CategoryData, categoryIndex: number) => 
      category.items.filter((item: StockItem) => item.status?.toLowerCase() === 'expired')
        .map((item: StockItem) => ({
          ...item,
          _categoryKey: Object.keys(stockData)[categoryIndex] as keyof StockData
        }))
    );
    
    // Calculate seasonal insights
    const currentMonth = new Date().getMonth();
    let seasonalInsight = '';
    
    // Seasonal insights based on month
    if (currentMonth >= 2 && currentMonth <= 4) { // Spring (March-May)
      seasonalInsight = 'موسم الربيع: وقت مثالي للبذر وزيادة مخزون البذور والأسمدة';
    } else if (currentMonth >= 5 && currentMonth <= 7) { // Summer (June-August)
      seasonalInsight = 'موسم الصيف: تأكد من توفر كميات كافية من المبيدات ومعدات الري';
    } else if (currentMonth >= 8 && currentMonth <= 10) { // Fall (September-November)
      seasonalInsight = 'موسم الخريف: وقت الحصاد، تأكد من جاهزية معدات الحصاد والتخزين';
    } else { // Winter (December-February)
      seasonalInsight = 'موسم الشتاء: وقت مناسب لصيانة المعدات والاستعداد لموسم الزراعة القادم';
    }
    
    let html = `
      <html dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            padding: 20px; 
            direction: rtl; 
            text-align: right;
            color: #333;
            line-height: 1.6;
          }
          h1, h2, h3 { 
            color: #2E7D32; 
            margin-top: 25px;
          }
          h1 {
            font-size: 28px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
          }
          h2 {
            font-size: 22px;
            border-bottom: 1px solid #81C784;
            padding-bottom: 6px;
          }
          h3 {
            font-size: 18px;
            color: #388E3C;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: right; 
          }
          th { 
            background-color: #E8F5E9; 
            color: #2E7D32;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 20px;
          }
          .date { 
            color: #555; 
            font-style: italic;
          }
          .summary-box { 
            background-color: #E8F5E9; 
            border: 1px solid #81C784; 
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          }
          .category-header { 
            background-color: #4CAF50; 
            color: white; 
            padding: 12px 15px; 
            border-radius: 8px; 
            margin-top: 25px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .category-header h3 {
            margin: 0;
            color: white;
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .chart-placeholder { 
            height: 200px; 
            background-color: #f2f2f2; 
            border-radius: 8px; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            margin: 15px 0; 
          }
          .recommendation { 
            background-color: #E8F5E9; 
            border-right: 5px solid #4CAF50; 
            padding: 15px; 
            margin: 15px 0; 
            border-left: none;
            border-radius: 0 8px 8px 0;
          }
          .warning-item {
            background-color: #FFF3E0;
            border-right: 5px solid #FF9800;
            padding: 12px;
            margin: 10px 0;
            border-radius: 0 8px 8px 0;
          }
          .expired-item {
            background-color: #FFEBEE;
            border-right: 5px solid #F44336;
            padding: 12px;
            margin: 10px 0;
            border-radius: 0 8px 8px 0;
          }
          .insight-box {
            background-color: #E1F5FE;
            border: 1px solid #81D4FA;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          }
          .seasonal-insight {
            background-color: #F1F8E9;
            border: 1px solid #AED581;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          }
          .stat-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
          }
          .stat-box {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background-color: #fff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #2E7D32;
          }
          .stat-label {
            color: #666;
            font-size: 14px;
          }
          .highlight {
            font-weight: bold;
            color: #2E7D32;
          }
          .value-up {
            color: #2E7D32;
          }
          .value-down {
            color: #C62828;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير مخزون المزرعة</h1>
          <p class="date">تاريخ الإنشاء: ${formattedDate}</p>
        </div>
    `;
    
    if (options.summary) {
      html += `
        <h2>ملخص المخزون</h2>
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-value">${formatEnglishNumber(totalItems)}</div>
            <div class="stat-label">إجمالي العناصر</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${formatEnglishCurrency(totalValue)}</div>
            <div class="stat-label">القيمة الإجمالية</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${calculateStockEfficiency(stockData)}%</div>
            <div class="stat-label">صحة المخزون</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${formatEnglishNumber(lowStockItems.length)}</div>
            <div class="stat-label">عناصر منخفضة المخزون</div>
          </div>
        </div>
        
        <div class="seasonal-insight">
          <h3>نصيحة موسمية</h3>
          <p>${seasonalInsight}</p>
        </div>
      `;
      
      // Add warning section for items that need attention
      if (lowStockItems.length > 0 || expiredItems.length > 0) {
        html += `<h2>عناصر تحتاج إلى اهتمام</h2>`;
        
        if (lowStockItems.length > 0) {
          html += `<h3>عناصر منخفضة المخزون (${formatEnglishNumber(lowStockItems.length)})</h3>`;
          
          lowStockItems.slice(0, 5).forEach((item: StockItem & { _categoryKey?: keyof StockData }) => {
            const itemName = item._categoryKey ? getItemName(item, item._categoryKey) : (item.name || '');
            
            html += `
              <div class="warning-item">
                <p><strong>${itemName}</strong> - الكمية الحالية: ${formatEnglishNumber(item.quantity)} ${item.unit || ''}</p>
                <p>القيمة: ${formatEnglishCurrency(item.value || 0)}</p>
              </div>
            `;
          });
          
          if (lowStockItems.length > 5) {
            html += `<p>...وعناصر أخرى (${formatEnglishNumber(lowStockItems.length - 5)})</p>`;
          }
        }
        
        if (expiredItems.length > 0) {
          html += `<h3>عناصر منتهية الصلاحية (${formatEnglishNumber(expiredItems.length)})</h3>`;
          
          expiredItems.slice(0, 5).forEach((item: StockItem & { _categoryKey?: keyof StockData }) => {
            const itemName = item._categoryKey ? getItemName(item, item._categoryKey) : (item.name || '');
            
            html += `
              <div class="expired-item">
                <p><strong>${itemName}</strong> - الكمية: ${formatEnglishNumber(item.quantity)} ${item.unit || ''}</p>
                <p>القيمة: ${formatEnglishCurrency(item.value || 0)}</p>
              </div>
            `;
          });
          
          if (expiredItems.length > 5) {
            html += `<p>...وعناصر أخرى (${formatEnglishNumber(expiredItems.length - 5)})</p>`;
          }
        }
      }
    }
    
    if (options.details) {
      html += `<h2>تفاصيل المخزون</h2>`;
      
      Object.entries(stockData).forEach(([category, data]) => {
        const categoryName = categoryTranslations[category] || category;
        
        html += `
          <div class="category-header">
            <h3>${categoryName}</h3>
          </div>
          <div class="summary-box">
            <p><strong>إجمالي العناصر:</strong> ${formatEnglishNumber(data.count)}</p>
            <p><strong>القيمة الإجمالية:</strong> ${formatEnglishCurrency(data.value)}</p>
            <p><strong>متوسط القيمة لكل عنصر:</strong> ${formatEnglishCurrency(data.count > 0 ? data.value / data.count : 0)}</p>
          </div>
        `;
        
        if (data.items.length > 0) {
          html += `
            <table>
              <thead>
                <tr>
                  <th>العنصر</th>
                  <th>الكمية</th>
                  <th>القيمة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
          `;
          
          data.items.forEach((item: StockItem) => {
            // Map status to Arabic
            let statusArabic = 'نشط';
            let statusClass = '';
            
            if (item.status) {
              if (item.status.toLowerCase() === 'expired') {
                statusArabic = 'منتهي الصلاحية';
                statusClass = 'value-down';
              }
              else if (item.status.toLowerCase() === 'low') {
                statusArabic = 'منخفض';
                statusClass = 'value-down';
              }
              else if (item.status.toLowerCase() === 'inactive') {
                statusArabic = 'غير نشط';
              }
            }
            
            // Get the proper name field based on category
            const itemName = getItemName(item, category as keyof StockData);
            
            html += `
              <tr>
                <td>${itemName}</td>
                <td>${formatEnglishNumber(item.quantity)} ${item.unit || ''}</td>
                <td>${formatEnglishCurrency(item.value || 0)}</td>
                <td class="${statusClass}">${statusArabic}</td>
              </tr>
            `;
          });
          
          html += `
              </tbody>
            </table>
          `;
        } else {
          html += `<p>لا توجد عناصر في هذه الفئة.</p>`;
        }
      });
    }
    
    if (options.recommendations) {
      const recommendations = getRecommendations(stockData);
      
      if (recommendations.length > 0) {
        html += `
          <h2>التوصيات والنصائح</h2>
        `;
        
        recommendations.forEach((rec: Recommendation) => {
          // Map priority to Arabic
          const priorityArabic = rec.priority === 'High' ? 'أولوية عالية' : 
                                rec.priority === 'Medium' ? 'أولوية متوسطة' : 'أولوية منخفضة';
          
          html += `
            <div class="recommendation">
              <p><strong>${priorityArabic}:</strong> ${rec.message}</p>
              <p><em>الإجراء المقترح:</em> ${rec.action}</p>
            </div>
          `;
        });
        
        // Add farming calendar if in recommendations
        html += `
          <div class="insight-box">
            <h3>تقويم المزرعة للشهر الحالي</h3>
            <p>الأنشطة الموصى بها لهذا الموسم:</p>
            <ul>
              ${getFarmingCalendarForCurrentMonth()}
            </ul>
          </div>
        `;
      }
    }
    
    html += `
        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة تطبيق فلاح سمارت. © ${new Date().getFullYear()}</p>
          <p>للمساعدة والدعم، يرجى التواصل مع فريق فلاح سمارت على الرقم: 07-XXXX-XXXX</p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  };
  
// Helper function to get farming calendar activities for current month
const getFarmingCalendarForCurrentMonth = (): string => {
  const month = new Date().getMonth(); // 0-11 where 0 is January
  
  // Define activities with explicit type
  const activities: Record<number, string[]> = {
    0: [ // January
      'فحص أنظمة التدفئة للمباني الزراعية والماشية',
      'التخطيط لمواسم الزراعة القادمة وطلب البذور',
      'صيانة المعدات الزراعية استعداداً للربيع',
      'مراقبة مخزون الأعلاف للماشية خلال فصل الشتاء'
    ],
    1: [ // February
      'تحضير الأرض للزراعة المبكرة في الربيع',
      'بدء زراعة الشتلات في البيوت المحمية',
      'تقليم الأشجار المثمرة قبل بدء النمو',
      'مراجعة وصيانة أنظمة الري'
    ],
    2: [ // March
      'بدء زراعة المحاصيل المقاومة للبرد في الحقول المفتوحة',
      'تسميد الأشجار المثمرة والمحاصيل الدائمة',
      'مراقبة ظهور الآفات مع ارتفاع درجات الحرارة',
      'التأكد من جاهزية معدات مكافحة الآفات'
    ],
    3: [ // April
      'زراعة معظم المحاصيل الحقلية والخضروات',
      'تطبيق الأسمدة العضوية والكيميائية حسب الحاجة',
      'بدء برنامج مكافحة الأعشاب الضارة',
      'تجهيز المراعي للماشية'
    ],
    4: [ // May
      'الانتهاء من زراعة المحاصيل الصيفية',
      'متابعة برامج الري المنتظم مع ارتفاع درجات الحرارة',
      'مراقبة ومكافحة الآفات والأمراض',
      'حصاد بعض المحاصيل المبكرة'
    ],
    5: [ // June
      'بدء حصاد محاصيل الحبوب',
      'زيادة معدلات الري خلال فترات الحرارة المرتفعة',
      'مكافحة مكثفة للآفات والأمراض',
      'تحضير مخازن الحبوب للموسم'
    ],
    6: [ // July
      'استمرار حصاد المحاصيل الصيفية',
      'الحفاظ على جدول ري منتظم',
      'حماية المحاصيل من أشعة الشمس الشديدة',
      'بدء التخطيط للمحاصيل الخريفية'
    ],
    7: [ // August
      'حصاد معظم المحاصيل الصيفية وتخزينها',
      'تحضير الأرض للزراعة الخريفية',
      'تقييم حالة المراعي وإدارة قطعان الماشية',
      'مراجعة مخزون البذور للموسم القادم'
    ],
    8: [ // September
      'بدء زراعة المحاصيل الخريفية والشتوية',
      'حصاد محاصيل الفواكه الموسمية',
      'تقليل معدلات الري مع انخفاض درجات الحرارة',
      'تسميد الأشجار بعد الحصاد'
    ],
    9: [ // October
      'الانتهاء من زراعة المحاصيل الشتوية',
      'جمع وتخزين المحاصيل المتأخرة',
      'تجهيز البيوت المحمية للزراعة الشتوية',
      'بدء تقليم بعض أنواع الأشجار المثمرة'
    ],
    10: [ // November
      'حماية النباتات الحساسة من البرد',
      'استكمال حصاد المحاصيل المتبقية',
      'تجهيز الأدوات والآلات للتخزين الشتوي',
      'مراجعة مخزون الأعلاف للماشية خلال الشتاء'
    ],
    11: [ // December
      'صيانة الآلات الزراعية وتجهيزها للموسم القادم',
      'حماية مصادر المياه من التجمد',
      'تقييم نتائج الموسم الزراعي وتخطيط العام القادم',
      'توفير الحماية الإضافية للماشية خلال فترة البرد'
    ]
  };
  
  // Make sure we handle the case where month is outside our range
  const monthActivities = activities[month] || activities[0];
  return monthActivities.map((activity: string) => `<li>${activity}</li>`).join('');
};

  const createPDF = async () => {
    try {
      // Show loading state
      setSaving(true);
      
      // Get the HTML content
      const html = generateHTML();
      
      // Log for debugging
      console.log('تجهيز تقرير PDF...');
      
      try {
        // Create a temporary HTML file
        await FileSystem.writeAsStringAsync(
          FileSystem.documentDirectory + 'report.html',
          html,
          { encoding: FileSystem.EncodingType.UTF8 }
        );
      } catch (writeError) {
        console.error('Error writing HTML file:', writeError);
      }
      
      // Create PDF from HTML
      const options = {
        html,
        fileName: `تقرير_المخزون_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}`,
        directory: 'Documents',
        base64: false,
      };
      
      console.log('جاري إنشاء PDF...');
      const { uri } = await Print.printToFileAsync({ html });
      console.log('تم إنشاء PDF بنجاح', uri);
      
      // Check if URI exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.error('فشل إنشاء الملف');
        Alert.alert('خطأ', 'فشل إنشاء تقرير PDF. يرجى المحاولة مرة أخرى.');
        setSaving(false);
        return;
      }
      
      // Set file URI for reference
      setPdfUri(uri);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'تم الإنشاء بنجاح',
        text2: 'تم إنشاء تقرير PDF الخاص بك',
      });
      
      // Based on selected saving method
      if (saveMethod === 'gallery') {
        saveToGallery(uri);
      } else if (saveMethod === 'downloads') {
        saveToDownloads(uri);
      } else if (saveMethod === 'share') {
        shareFile(uri, options.fileName);
      }
      
      setSaving(false);
    } catch (error) {
      console.error('خطأ في إنشاء PDF:', error);
      Alert.alert(
        'خطأ',
        'حدث خطأ أثناء إنشاء تقرير PDF. يرجى المحاولة مرة أخرى.',
        [{ text: 'حسناً', onPress: () => setSaving(false) }]
      );
    }
  };
  
  const saveToGallery = async (fileUri: string) => {
    try {
      // Check if we have permission
      const { permissionStatus } = useMediaLibraryPermission();
      
      if (permissionStatus !== 'granted') {
        // Request permissions directly
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'إذن مطلوب',
            'نحتاج إلى إذن للوصول إلى معرض الصور الخاص بك لحفظ التقرير.',
            [{ text: 'حسناً' }]
          );
          return;
        }
      }
      
      // Save file to media library
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('فلاح سمارت', asset, false);
      
      console.log('تم حفظ PDF في المعرض');
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'تم الحفظ في المعرض',
        text2: 'تم حفظ تقرير PDF الخاص بك في معرض الصور',
      });
    } catch (error) {
      console.error('خطأ في حفظ PDF في المعرض:', error);
      Alert.alert(
        'خطأ في الحفظ',
        'فشل حفظ التقرير في معرض الصور. يرجى تجربة طريقة أخرى للحفظ.',
        [{ text: 'حسناً' }]
      );
    }
  };
  
  const saveToDownloads = async (fileUri: string) => {
    try {
      const destFolder = `${FileSystem.documentDirectory}downloads/`;
      const destUri = `${destFolder}تقرير_المخزون_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.pdf`;
      
      // Create downloads directory if it doesn't exist
      const folderInfo = await FileSystem.getInfoAsync(destFolder);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(destFolder, { intermediates: true });
      }
      
      // Copy file to downloads folder
      await FileSystem.copyAsync({
        from: fileUri,
        to: destUri
      });
      
      console.log('تم نسخ PDF إلى مجلد التنزيلات:', destUri);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'تم الحفظ في التنزيلات',
        text2: 'تم حفظ تقرير PDF الخاص بك في مجلد التنزيلات',
      });
    } catch (error) {
      console.error('خطأ في حفظ PDF في التنزيلات:', error);
      Alert.alert(
        'خطأ في الحفظ',
        'فشل حفظ التقرير في مجلد التنزيلات. يرجى تجربة طريقة أخرى للحفظ.',
        [{ text: 'حسناً' }]
      );
    }
  };
  
  const shareFile = async (fileUri: string, fileName: string) => {
    try {
      const UTI = 'public.pdf';
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'مشاركة تقرير المخزون',
        UTI
      });
      
      console.log('تمت مشاركة الملف');
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'تمت المشاركة بنجاح',
        text2: 'تم مشاركة تقرير المخزون الخاص بك',
      });
    } catch (error) {
      console.error('خطأ في مشاركة الملف:', error);
      Alert.alert(
        'خطأ في المشاركة',
        'تعذر مشاركة تقرير المخزون. يرجى المحاولة مرة أخرى.',
        [{ text: 'حسناً' }]
      );
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.printModalContainer}>
          <View style={styles.printModalHeader}>
            <Text style={styles.printModalTitle}>إنشاء تقرير المخزون</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.printInstructions}>حدد محتوى التقرير الذي تريد تضمينه</Text>
          
          <View style={styles.printOptionItem}>
            <CustomCheckBox value={options.summary} onValueChange={() => toggleOption('summary')} />
            <Text style={styles.printOptionText}>ملخص المخزون</Text>
          </View>
          
          <View style={styles.printOptionItem}>
            <CustomCheckBox value={options.details} onValueChange={() => toggleOption('details')} />
            <Text style={styles.printOptionText}>قائمة مفصلة للمخزون</Text>
          </View>
          
          <View style={styles.printOptionItem}>
            <CustomCheckBox value={options.charts} onValueChange={() => toggleOption('charts')} />
            <Text style={styles.printOptionText}>الرسوم البيانية</Text>
          </View>
          
          <View style={styles.printOptionItem}>
            <CustomCheckBox value={options.recommendations} onValueChange={() => toggleOption('recommendations')} />
            <Text style={styles.printOptionText}>التوصيات</Text>
          </View>
          
          <Text style={styles.sectionLabel}>طريقة الحفظ:</Text>
          <View style={styles.saveMethodContainer}>
            <TouchableOpacity 
              style={[
                styles.saveMethodButton, 
                saveMethod === 'gallery' && styles.saveMethodButtonActive
              ]}
              onPress={() => setSaveMethod('gallery')}
            >
              <MaterialCommunityIcons 
                name="image-multiple" 
                size={18} 
                color={saveMethod === 'gallery' ? COLORS.white : COLORS.primary} 
              />
              <Text style={[
                styles.saveMethodText,
                saveMethod === 'gallery' && styles.saveMethodTextActive
              ]}>
                معرض الصور
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveMethodButton, 
                saveMethod === 'downloads' && styles.saveMethodButtonActive
              ]}
              onPress={() => setSaveMethod('downloads')}
            >
              <MaterialCommunityIcons 
                name="folder-download" 
                size={18} 
                color={saveMethod === 'downloads' ? COLORS.white : COLORS.primary} 
              />
              <Text style={[
                styles.saveMethodText,
                saveMethod === 'downloads' && styles.saveMethodTextActive
              ]}>
                التنزيلات
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveMethodButton, 
                saveMethod === 'share' && styles.saveMethodButtonActive
              ]}
              onPress={() => setSaveMethod('share')}
            >
              <MaterialCommunityIcons 
                name="share-variant" 
                size={18} 
                color={saveMethod === 'share' ? COLORS.white : COLORS.primary} 
              />
              <Text style={[
                styles.saveMethodText,
                saveMethod === 'share' && styles.saveMethodTextActive
              ]}>
                مشاركة
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.printButton} 
            onPress={createPDF}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="file-pdf-box" size={20} color={COLORS.white} />
                <Text style={styles.printButtonText}>إنشاء التقرير</Text>
              </>
            )}
          </TouchableOpacity>
          
          {!hasPermission && saveMethod === 'gallery' && (
            <Text style={styles.permissionWarning}>
              ملاحظة: يتطلب حفظ التقرير في المعرض إذن للوصول إلى التخزين. يرجى منح الإذن في الإعدادات أو اختيار طريقة حفظ أخرى.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Main component
const StockStatisticsScreen: React.FC = () => {
  // Add safe area insets for better mobile layout
  const insets = useSafeAreaInsets();
  const windowWidth = Dimensions.get('window').width;
  
  const [stockData, setStockData] = useState<StockData>({
    animals: { count: 0, value: 0, items: [], trends: [], types: {} },
    pesticides: { count: 0, value: 0, items: [], trends: [], types: {} },
    seeds: { count: 0, value: 0, items: [], trends: [], types: {} },
    fertilizer: { count: 0, value: 0, items: [], trends: [], types: {} },
    equipment: { count: 0, value: 0, items: [], trends: [], types: {} },
    feed: { count: 0, value: 0, items: [], trends: [], types: {} },
    tools: { count: 0, value: 0, items: [], trends: [], types: {} },
    harvest: { count: 0, value: 0, items: [], trends: [], types: {} }
  });
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const [selectedCategories, setSelectedCategories] = useState<Array<keyof StockData>>(
    ['animals', 'pesticides', 'seeds', 'fertilizer', 'equipment', 'feed', 'tools', 'harvest']
  );
  const [timePeriod, setTimePeriod] = useState('6m');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Instead, all categories are always selected
  const allCategories: Array<keyof StockData> = ['animals', 'pesticides', 'seeds', 'fertilizer', 'equipment', 'feed', 'tools', 'harvest'];

  // Add these state variables to the StockStatisticsScreen component
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [farmTasks, setFarmTasks] = useState<FarmTask[]>([
    {
      id: 'task-1',
      title: 'تغذية الحيوانات',
      dueDate: new Date().toISOString(),
      priority: 'High',
      completed: false,
      category: 'animals'
    },
    {
      id: 'task-2',
      title: 'ري المحاصيل',
      dueDate: new Date().toISOString(),
      priority: 'Medium',
      completed: true,
      category: 'seeds'
    },
    {
      id: 'task-3',
      title: 'فحص معدات الري',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
      priority: 'Low',
      completed: false,
      category: 'equipment'
    },
    {
      id: 'task-4',
      title: 'طلب أسمدة جديدة',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
      priority: 'Medium',
      completed: false,
      category: 'fertilizer'
    }
  ]);
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo>({
    temperature: 28,
    condition: 'مشمس',
    humidity: 45,
    rainfall: 0,
    icon: 'weather-sunny'
  });

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      console.log('[StockStatisticsScreen] Starting data fetch');
      setLoading(true);
      setError(null);

      // Initialize data structure with empty values
      const data: StockData = {
        animals: { count: 0, value: 0, items: [], trends: [], types: {} },
        pesticides: { count: 0, value: 0, items: [], trends: [], types: {} },
        seeds: { count: 0, value: 0, items: [], trends: [], types: {} },
        fertilizer: { count: 0, value: 0, items: [], trends: [], types: {} },
        equipment: { count: 0, value: 0, items: [], trends: [], types: {} },
        feed: { count: 0, value: 0, items: [], trends: [], types: {} },
        tools: { count: 0, value: 0, items: [], trends: [], types: {} },
        harvest: { count: 0, value: 0, items: [], trends: [], types: {} }
      };

      try {
        // Fetch all categories data from the respective APIs
        console.log('[StockStatisticsScreen] Calling APIs...');
        
        // Fetch data with proper error handling for each category
        let animals: StockItem[] = [];
        let pesticides: StockItem[] = []; // Make sure this is properly typed
        let seeds: StockItem[] = [];
        let fertilizers: StockItem[] = [];
        let equipment: StockItem[] = [];
        let feed: StockItem[] = [];
        let tools: StockItem[] = [];
        let harvest: StockItem[] = [];
        
        try {
          animals = await animalApi.getAllAnimals() || [];
          console.log('[StockStatisticsScreen] Fetched animals:', animals?.length || 0);
        } catch (err) {
          console.error('[StockStatisticsScreen] Error fetching animals:', err);
        }
        
        try {
          // Fix the pesticide fetching code
          const pesticideResponse = await pesticideService.getAllPesticides();
          const pesticideItems = pesticideResponse || [];
          
          // Map Pesticide objects to StockItem objects with the correct properties
          pesticides = pesticideItems.map(item => ({
            id: item.id.toString(),
            name: item.name,
            quantity: item.quantity,
            // Use safe properties or defaults based on the actual Pesticide interface
            price: 0, // Default value as it's not in the Pesticide interface
            value: 0, // Calculate a default value 
            minQuantityAlert: item.lowStockThreshold || 5,
            expiryDate: '', // Not available in Pesticide interface
            type: item.isNatural ? 'natural' : 'chemical',
            unit: item.unit,
            category: 'pesticides'
          }));
          console.log('[StockStatisticsScreen] Fetched pesticides:', pesticides?.length || 0);
        } catch (err) {
          console.error('[StockStatisticsScreen] Error fetching pesticides:', err);
        }
        
        try {
          seeds = await stockSeedApi.getSeeds() || [];
          console.log('[StockStatisticsScreen] Fetched seeds:', seeds?.length || 0);
        } catch (err) {
          console.error('[StockStatisticsScreen] Error fetching seeds:', err);
        }
        
        try {
          fertilizers = stockFertilizerApi.getFertilizers ? 
            await stockFertilizerApi.getFertilizers() : 
            await stockFertilizerApi.getAllFertilizers() || [];
          console.log('[StockStatisticsScreen] Fetched fertilizers:', fertilizers?.length || 0);
        } catch (err) {
          console.error('[StockStatisticsScreen] Error fetching fertilizers:', err);
        }
        
        try {
          equipment = await stockEquipmentApi.getAllEquipment() || [];
          console.log('[StockStatisticsScreen] Fetched equipment:', equipment?.length || 0);
        } catch (err) {
          console.error('[StockStatisticsScreen] Error fetching equipment:', err);
        }
        
        try {
          feed = stockFeedApi.getFeeds ? 
            await stockFeedApi.getFeeds() : 
            await stockFeedApi.getAllFeeds() || [];
          console.log('[StockStatisticsScreen] Fetched feed:', feed?.length || 0);
        } catch (err) {
          console.error('[StockStatisticsScreen] Error fetching feed:', err);
        }
        
        try {
          tools = await stockToolApi.getTools() || [];
          console.log('[StockStatisticsScreen] Fetched tools:', tools?.length || 0);
        } catch (err) {
          console.error('[StockStatisticsScreen] Error fetching tools:', err);
        }
        
        try {
          harvest = stockHarvestApi.getHarvests ? 
            await stockHarvestApi.getHarvests() : 
            await stockHarvestApi.getAllHarvests() || [];
          console.log('[StockStatisticsScreen] Fetched harvest:', harvest?.length || 0);
        } catch (err) {
          console.error('[StockStatisticsScreen] Error fetching harvest:', err);
        }

        // Process animals data with proper handling of null values
        if (animals && animals.length > 0) {
          console.log('[StockStatisticsScreen] Processing animals data');
          
          // Convert to proper StockItem format
          const animalItems: StockItem[] = animals.map((animal: any) => ({
            id: String(animal.id || ''),
            name: animal.name || '',
            quantity: 1, // Each animal is one unit
            price: animal.price || 0,
            value: animal.price || 0,
            minQuantityAlert: 0, // No minimum for individual animals
            type: animal.type || '',
            status: animal.healthStatus || 'healthy',
            category: 'animals'
          }));
          
          data.animals.items = animalItems;
          data.animals.count = animalItems.length;
          data.animals.value = animalItems.reduce((sum: number, item: StockItem) => sum + (item.price || 0), 0);
          
          // Process animal types
          const animalTypes: Record<string, number> = {};
          animalItems.forEach((animal: StockItem) => {
            const type = animal.type || 'unknown';
            animalTypes[type] = (animalTypes[type] || 0) + 1;
          });
          data.animals.types = animalTypes;
          
          // Calculate health statistics if available
          const healthStatus = {
            healthy: animalItems.filter((a: StockItem) => a.status === 'healthy').length,
            sick: animalItems.filter((a: StockItem) => a.status === 'sick').length,
            quarantine: animalItems.filter((a: StockItem) => a.status === 'quarantine').length,
          };
          data.animals.healthStatus = healthStatus;
        } else {
          console.log('[StockStatisticsScreen] No animals data found');
        }
        
        // Process pesticides data
        if (pesticides && pesticides.length > 0) {
          console.log('[StockStatisticsScreen] Processing pesticides data');
          
          // Convert to StockItem format with consistent properties
          const pesticideItems: StockItem[] = pesticides.map((item: any) => ({
            id: String(item.id || ''),
            name: item.name || '',
            quantity: item.quantity || 0,
            price: item.price || 0,
            value: (item.price || 0) * (item.quantity || 0),
            minQuantityAlert: item.minQuantityAlert || 5,
            expiryDate: item.expiryDate || '',
            type: item.type || '',
            unit: item.unit || '',
            status: item.status || 'active',
            category: 'pesticides'
          }));
          
          data.pesticides.items = pesticideItems;
          data.pesticides.count = pesticideItems.length;
          data.pesticides.value = pesticideItems.reduce((sum: number, item: StockItem) => 
            sum + ((item.price || 0) * (item.quantity || 0)), 0);
          
          // Process pesticide types
          const pesticideCategories: Record<string, number> = {
            insecticide: 0,
            herbicide: 0,
            fungicide: 0,
            other: 0
          };
          
          pesticideItems.forEach((item: StockItem) => {
            const type = item.type?.toLowerCase() || 'other';
            if (type.includes('insect')) {
              pesticideCategories.insecticide += 1;
            } else if (type.includes('herb') || type.includes('weed')) {
              pesticideCategories.herbicide += 1;
            } else if (type.includes('fung')) {
              pesticideCategories.fungicide += 1;
            } else {
              pesticideCategories.other += 1;
            }
          });
          
          data.pesticides.categories = pesticideCategories;
          
          // Add expiry status
          const now = new Date();
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(now.getDate() + 30);
          
          const expiryStatus = {
            expired: 0,
            nearExpiry: 0,
            valid: 0
          };
          
          pesticideItems.forEach((item: StockItem) => {
            if (item.expiryDate) {
              const expiryDate = new Date(item.expiryDate);
              if (expiryDate < now) {
                expiryStatus.expired += 1;
              } else if (expiryDate < thirtyDaysFromNow) {
                expiryStatus.nearExpiry += 1;
              } else {
                expiryStatus.valid += 1;
              }
            } else {
              expiryStatus.valid += 1; // Default to valid if no expiry date
            }
          });
          
          data.pesticides.expiryStatus = expiryStatus;
        } else {
          console.log('[StockStatisticsScreen] No pesticides data found');
        }
        
        // Process seeds data with similar approach to pesticides
        if (seeds && seeds.length > 0) {
          console.log('[StockStatisticsScreen] Processing seeds data');
          
          const seedItems: StockItem[] = seeds.map((item: any) => ({
            id: String(item.id || ''),
            name: item.name || '',
            quantity: item.quantity || 0,
            price: item.price || 0,
            value: (item.price || 0) * (item.quantity || 0),
            minQuantityAlert: item.minQuantityAlert || 5,
            expiryDate: item.expiryDate || '',
            type: item.type || '',
            unit: item.unit || '',
            status: item.status || 'active',
            category: 'seeds'
          }));
          
          data.seeds.items = seedItems;
          data.seeds.count = seedItems.length;
          data.seeds.value = seedItems.reduce((sum: number, item: StockItem) => 
            sum + ((item.price || 0) * (item.quantity || 0)), 0);
          
          // Process seed types if available
          const seedTypes: Record<string, number> = {};
          seedItems.forEach((item: StockItem) => {
            const type = item.type || 'unknown';
            seedTypes[type] = (seedTypes[type] || 0) + 1;
          });
          data.seeds.types = seedTypes;
          
          // Add expiry status if applicable
          if (seedItems.some(item => item.expiryDate)) {
            const now = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            
            const expiryStatus = {
              expired: 0,
              nearExpiry: 0,
              valid: 0
            };
            
            seedItems.forEach((item: StockItem) => {
              if (item.expiryDate) {
                const expiryDate = new Date(item.expiryDate);
                if (expiryDate < now) {
                  expiryStatus.expired += 1;
                } else if (expiryDate < thirtyDaysFromNow) {
                  expiryStatus.nearExpiry += 1;
                } else {
                  expiryStatus.valid += 1;
                }
              } else {
                expiryStatus.valid += 1;
              }
            });
            
            data.seeds.expiryStatus = expiryStatus;
          }
        } else {
          console.log('[StockStatisticsScreen] No seeds data found');
        }
        
        // Process fertilizers data
        if (fertilizers && fertilizers.length > 0) {
          console.log('[StockStatisticsScreen] Processing fertilizers data');
          
          const fertilizerItems: StockItem[] = fertilizers.map((item: any) => ({
            id: String(item.id || ''),
            name: item.name || '',
            quantity: item.quantity || 0,
            price: item.price || 0,
            value: (item.price || 0) * (item.quantity || 0),
            minQuantityAlert: item.minQuantityAlert || 5,
            expiryDate: item.expiryDate || '',
            type: item.type || '',
            unit: item.unit || '',
            status: item.status || 'active',
            category: 'fertilizer'
          }));
          
          data.fertilizer.items = fertilizerItems;
          data.fertilizer.count = fertilizerItems.length;
          data.fertilizer.value = fertilizerItems.reduce((sum: number, item: StockItem) => 
            sum + ((item.price || 0) * (item.quantity || 0)), 0);
          
          // Process fertilizer types
          const fertilizerTypes: Record<string, number> = {};
          fertilizerItems.forEach((item: StockItem) => {
            const type = item.type || 'unknown';
            fertilizerTypes[type] = (fertilizerTypes[type] || 0) + 1;
          });
          data.fertilizer.types = fertilizerTypes;
          
          // Add expiry status if applicable
          if (fertilizerItems.some(item => item.expiryDate)) {
            const now = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            
            const expiryStatus = {
              expired: 0,
              nearExpiry: 0,
              valid: 0
            };
            
            fertilizerItems.forEach((item: StockItem) => {
              if (item.expiryDate) {
                const expiryDate = new Date(item.expiryDate);
                if (expiryDate < now) {
                  expiryStatus.expired += 1;
                } else if (expiryDate < thirtyDaysFromNow) {
                  expiryStatus.nearExpiry += 1;
                } else {
                  expiryStatus.valid += 1;
                }
              } else {
                expiryStatus.valid += 1;
              }
            });
            
            data.fertilizer.expiryStatus = expiryStatus;
          }
        } else {
          console.log('[StockStatisticsScreen] No fertilizers data found');
        }
        
        // Process equipment data
        if (equipment && equipment.length > 0) {
          console.log('[StockStatisticsScreen] Processing equipment data');
          
          const equipmentItems: StockItem[] = equipment.map((item: any) => ({
            id: String(item.id || ''),
            name: item.name || '',
            quantity: item.quantity || 1,
            price: item.price || 0,
            value: (item.price || 0) * (item.quantity || 1),
            minQuantityAlert: item.minQuantityAlert || 1,
            type: item.type || '',
            status: item.status || 'active',
            category: 'equipment'
          }));
          
          data.equipment.items = equipmentItems;
          data.equipment.count = equipmentItems.length;
          data.equipment.value = equipmentItems.reduce((sum: number, item: StockItem) => 
            sum + ((item.price || 0) * (item.quantity || 1)), 0);
          
          // Process equipment types
          const equipmentTypes: Record<string, number> = {};
          equipmentItems.forEach((item: StockItem) => {
            const type = item.type || 'unknown';
            equipmentTypes[type] = (equipmentTypes[type] || 0) + 1;
          });
          data.equipment.types = equipmentTypes;
          
          // Add status statistics (working/maintenance/broken)
          const statusCounts = {
            working: equipmentItems.filter(item => item.status === 'working' || item.status === 'active').length,
            maintenance: equipmentItems.filter(item => item.status === 'maintenance').length,
            broken: equipmentItems.filter(item => item.status === 'broken' || item.status === 'inactive').length
          };
          
          data.equipment.healthStatus = statusCounts;
        } else {
          console.log('[StockStatisticsScreen] No equipment data found');
        }
        
        // Process feed data
        if (feed && feed.length > 0) {
          console.log('[StockStatisticsScreen] Processing feed data');
          
          const feedItems: StockItem[] = feed.map((item: any) => ({
            id: String(item.id || ''),
            name: item.name || '',
            quantity: item.quantity || 0,
            price: item.price || 0,
            value: (item.price || 0) * (item.quantity || 0),
            minQuantityAlert: item.minQuantityAlert || 5,
            expiryDate: item.expiryDate || '',
            type: item.type || '',
            unit: item.unit || '',
            status: item.status || 'active',
            category: 'feed'
          }));
          
          data.feed.items = feedItems;
          data.feed.count = feedItems.length;
          data.feed.value = feedItems.reduce((sum: number, item: StockItem) => 
            sum + ((item.price || 0) * (item.quantity || 0)), 0);
          
          // Process feed types
          const feedTypes: Record<string, number> = {};
          feedItems.forEach((item: StockItem) => {
            const type = item.type || 'unknown';
            feedTypes[type] = (feedTypes[type] || 0) + 1;
          });
          data.feed.types = feedTypes;
          
          // Add expiry status if applicable
          if (feedItems.some(item => item.expiryDate)) {
            const now = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            
            const expiryStatus = {
              expired: 0,
              nearExpiry: 0,
              valid: 0
            };
            
            feedItems.forEach((item: StockItem) => {
              if (item.expiryDate) {
                const expiryDate = new Date(item.expiryDate);
                if (expiryDate < now) {
                  expiryStatus.expired += 1;
                } else if (expiryDate < thirtyDaysFromNow) {
                  expiryStatus.nearExpiry += 1;
                } else {
                  expiryStatus.valid += 1;
                }
              } else {
                expiryStatus.valid += 1;
              }
            });
            
            data.feed.expiryStatus = expiryStatus;
          }
        } else {
          console.log('[StockStatisticsScreen] No feed data found');
        }
        
        // Process tools data
        if (tools && tools.length > 0) {
          console.log('[StockStatisticsScreen] Processing tools data');
          
          const toolItems: StockItem[] = tools.map((item: any) => ({
            id: String(item.id || ''),
            name: item.name || '',
            quantity: item.quantity || 1,
            price: item.price || 0,
            value: (item.price || 0) * (item.quantity || 1),
            minQuantityAlert: item.minQuantityAlert || 1,
            type: item.type || '',
            status: item.status || 'active',
            category: 'tools'
          }));
          
          data.tools.items = toolItems;
          data.tools.count = toolItems.length;
          data.tools.value = toolItems.reduce((sum: number, item: StockItem) => 
            sum + ((item.price || 0) * (item.quantity || 1)), 0);
          
          // Process tool types
          const toolTypes: Record<string, number> = {};
          toolItems.forEach((item: StockItem) => {
            const type = item.type || 'unknown';
            toolTypes[type] = (toolTypes[type] || 0) + 1;
          });
          data.tools.types = toolTypes;
          
          // Add status statistics (working/maintenance/broken)
          const statusCounts = {
            working: toolItems.filter(item => item.status === 'working' || item.status === 'active').length,
            maintenance: toolItems.filter(item => item.status === 'maintenance').length,
            broken: toolItems.filter(item => item.status === 'broken' || item.status === 'inactive').length
          };
          
          data.tools.healthStatus = statusCounts;
        } else {
          console.log('[StockStatisticsScreen] No tools data found');
        }
        
        // Process harvest data
        if (harvest && harvest.length > 0) {
          console.log('[StockStatisticsScreen] Processing harvest data');
          
          const harvestItems: StockItem[] = harvest.map((item: any) => ({
            id: String(item.id || ''),
            name: item.name || '',
            quantity: item.quantity || 0,
            price: item.price || 0,
            value: (item.price || 0) * (item.quantity || 0),
            minQuantityAlert: item.minQuantityAlert || 0,
            expiryDate: item.expiryDate || '',
            type: item.type || '',
            unit: item.unit || '',
            status: item.status || 'active',
            category: 'harvest'
          }));
          
          data.harvest.items = harvestItems;
          data.harvest.count = harvestItems.length;
          data.harvest.value = harvestItems.reduce((sum: number, item: StockItem) => 
            sum + ((item.price || 0) * (item.quantity || 0)), 0);
          
          // Process harvest types
          const harvestTypes: Record<string, number> = {};
          harvestItems.forEach((item: StockItem) => {
            const type = item.type || 'unknown';
            harvestTypes[type] = (harvestTypes[type] || 0) + 1;
          });
          data.harvest.types = harvestTypes;
          
          // Add expiry status if applicable
          if (harvestItems.some(item => item.expiryDate)) {
            const now = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            
            const expiryStatus = {
              expired: 0,
              nearExpiry: 0,
              valid: 0
            };
            
            harvestItems.forEach((item: StockItem) => {
              if (item.expiryDate) {
                const expiryDate = new Date(item.expiryDate);
                if (expiryDate < now) {
                  expiryStatus.expired += 1;
                } else if (expiryDate < thirtyDaysFromNow) {
                  expiryStatus.nearExpiry += 1;
                } else {
                  expiryStatus.valid += 1;
                }
              } else {
                expiryStatus.valid += 1;
              }
            });
            
            data.harvest.expiryStatus = expiryStatus;
          }
        } else {
          console.log('[StockStatisticsScreen] No harvest data found');
        }
        
        // Fetch historical data from the API or calculate from current data
        try {
          // Try to fetch historical data from API if available
          console.log('[StockStatisticsScreen] Fetching or calculating historical data');
          
          // For demo purposes, generate realistic trends data based on current data
          Object.keys(data).forEach(categoryKey => {
            const category = categoryKey as keyof StockData;
            const trends: number[] = [];
            const variationRange = 0.3; // 30% variation
            
            // Current count as the base value
            const baseValue = data[category].count;
            
            // Generate 6 months of historical data with realistic patterns
            for (let i = 5; i >= 0; i--) {
              // Different months have different patterns
              let historicalValue: number;
              
              if (i === 0) {
                // Current month is the actual value
                historicalValue = baseValue;
              } else {
                // Past months have variations
                const randomFactor = 1 + (Math.random() * variationRange * 2 - variationRange);
                // Add seasonal variations for realistic trends
                const seasonalFactor = Math.sin((new Date().getMonth() - i + 12) % 12 / 12 * Math.PI * 2) * 0.1 + 0.9;
                // Ensure it never goes below zero
                historicalValue = Math.max(0, Math.round(baseValue * randomFactor * seasonalFactor));
              }
              
              trends.push(historicalValue);
            }
            
            data[category].trends = trends.reverse(); // Oldest to newest
          });
          
      } catch (error) {
          console.error('[StockStatisticsScreen] Error fetching historical data:', error);
          // Will use the generated trends if API fails
        }

        // Identify low stock items needing attention
        console.log('[StockStatisticsScreen] Identifying low stock items');
        const lowStock: StockItem[] = [];
        
        Object.values(data).forEach(category => {
          category.items.forEach((item: StockItem) => {
            if (item.category !== 'animals' && (item.quantity || 0) <= (item.minQuantityAlert || 5)) {
              lowStock.push(item);
            }
          });
        });
        
        // Add expiring items to the low stock list
        Object.values(data).forEach(category => {
          if (category.expiryStatus) {
            const now = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            
            category.items.forEach((item: StockItem) => {
              if (item.expiryDate) {
                const expiryDate = new Date(item.expiryDate);
                if (expiryDate < thirtyDaysFromNow && !lowStock.some(lowItem => lowItem.id === item.id)) {
                  lowStock.push({
              ...item,
                    status: 'expiring'
            });
                }
          }
        });
          }
      });

      // Generate insights and recommendations
        console.log('[StockStatisticsScreen] Generating insights and recommendations');
        const generatedInsights = getInsights(data);
        const generatedRecommendations = getRecommendations(data);

        // Check if we have any data at all
        const totalCount = Object.values(data).reduce((sum, category) => sum + category.count, 0);
        if (totalCount === 0) {
          console.log('[StockStatisticsScreen] No data found in any category');
        }

        // Update state
        console.log('[StockStatisticsScreen] Updating state with data');
        setStockData(data);
        setLowStockItems(lowStock);
        setInsights(generatedInsights);
        setRecommendations(generatedRecommendations);
        
      } catch (error: any) {
        console.error('[StockStatisticsScreen] Error fetching API data:', error);
        setError(`Failed to load stock data: ${error.message || 'Unknown error'}`);
        throw error; // Re-throw to be caught by the outer catch
      }
    } catch (err: any) {
      console.error('[StockStatisticsScreen] Error fetching stock data:', err);
      setError('Failed to load stock data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('[StockStatisticsScreen] Fetch completed');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Add a separate function to toggle all categories
  const toggleAllCategories = () => {
    const allCategories: Array<keyof StockData> = [
      'animals', 'pesticides', 'seeds', 'fertilizer', 
      'equipment', 'feed', 'tools', 'harvest'
    ];
    
    // If all are already selected, just select the first one
    if (selectedCategories.length === allCategories.length) {
      setSelectedCategories(['animals']);
    } else {
      // Otherwise, select all
      setSelectedCategories([...allCategories]);
    }
  };

  // Keep the regular toggleCategoryFilter simple for individual categories
  const toggleCategoryFilter = (category: keyof StockData) => {
    if (selectedCategories.includes(category)) {
      // Don't allow removing the last category
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== category));
      }
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Add a function to handle exporting data
  const handleExport = async (type: string) => {
    setShowExportModal(false);
    
    if (type === 'share') {
      try {
        // Mock implementation of share functionality
        const message = `تحليلات المخزون: إجمالي العناصر: ${
          Object.values(stockData).reduce((sum, category) => sum + category.count, 0)
        }, القيمة الإجمالية: ${
          Object.values(stockData).reduce((sum, category) => sum + category.value, 0).toLocaleString('fr-FR')
        } ريال`;
        
        const result = await Share.share({
          message,
          title: 'تحليلات المخزون - تطبيق فلاح سمارت'
        });
      } catch (error) {
        console.error('Error sharing data:', error);
      }
    } else {
      // Show a message that this feature would generate a file in a real app
      alert(`في التطبيق الحقيقي، سيتم إنشاء ملف ${type === 'pdf' ? 'PDF' : 'Excel'} بالبيانات`);
    }
  };
  
  // Add a function to filter items by search query
  const filterItemsBySearch = (items: StockItem[]) => {
    if (!searchQuery.trim()) return items;
    
    return items.filter(item => 
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // Simplified categorization of stock items for farmers
  const farmFriendlyCategories = {
    farmAnimals: { 
      title: 'الحيوانات المزرعية',
      icon: 'cow',
      data: stockData.animals
    },
    cropInputs: {
      title: 'مستلزمات المحاصيل',
      icon: 'seed',
      data: {
        count: (stockData.seeds.count + stockData.fertilizer.count + stockData.pesticides.count),
        value: (stockData.seeds.value + stockData.fertilizer.value + stockData.pesticides.value),
        items: [...stockData.seeds.items, ...stockData.fertilizer.items, ...stockData.pesticides.items],
        trends: stockData.seeds.trends // Use seeds trends as representative
      }
    },
    equipment: {
      title: 'المعدات والأدوات',
      icon: 'tools',
      data: {
        count: (stockData.equipment.count + stockData.tools.count),
        value: (stockData.equipment.value + stockData.tools.value),
        items: [...stockData.equipment.items, ...stockData.tools.items],
        trends: stockData.equipment.trends // Use equipment trends as representative
      }
    },
    harvest: {
      title: 'المحاصيل والإنتاج',
      icon: 'food-apple',
      data: stockData.harvest
    }
  };

  // Filter data for alert card
  const getAlertItems = () => {
    const alerts: StockItem[] = [];
    
    // Low stock items
    const lowStockItems = Object.values(stockData)
      .flatMap(category => 
        category.items.filter((item: StockItem) => 
          item.quantity < (item.minQuantityAlert || 5)
        )
      ).slice(0, 3);
    
    // Expiring items
    const expiringItems = Object.values(stockData)
      .flatMap(category => {
        if (!category.items) return [];
        return category.items.filter((item: StockItem) => {
          if (!item.expiryDate) return false;
          const expiry = new Date(item.expiryDate);
          const now = new Date();
          const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
        });
      }).slice(0, 3);
    
    return [...lowStockItems, ...expiringItems].slice(0, 5);
  };

  // Get a simplified health score for farmers
  const getFarmHealthScore = () => {
    const efficiency = calculateStockEfficiency(stockData);
    if (efficiency >= 75) return { score: 'جيد', color: '#34C759', icon: 'check-circle-outline' as MaterialCommunityIconName };
    if (efficiency >= 50) return { score: 'متوسط', color: '#FF9500', icon: 'alert-outline' as MaterialCommunityIconName };
    return { score: 'ضعيف', color: '#FF3B30', icon: 'alert-octagon-outline' as MaterialCommunityIconName };
  };

  // Enhanced category card for farmers
  const renderEnhancedCategoryCard = (category: keyof StockData, data: CategoryData) => {
    const categoryTranslations: Record<keyof StockData, string> = {
      animals: 'الحيوانات',
      pesticides: 'المبيدات',
      seeds: 'البذور',
      fertilizer: 'الأسمدة',
      equipment: 'المعدات',
      feed: 'الأعلاف',
      tools: 'الأدوات',
      harvest: 'المحاصيل'
    };

    const performance = getCategoryPerformance(category, data);
    const turnover = calculateStockTurnover(category, data);
    const status = performance.growth > 10 ? 'good' : 
                  performance.growth < 0 ? 'critical' : 'warning';
    const borderColor = status === 'good' ? '#00C853' : 
                      status === 'warning' ? '#FFA500' : '#FF1744';
    
    // Get helpful tooltips for farmers based on category
    const getTip = () => {
      switch(category) {
        case 'animals':
          return 'عدد الحيوانات في مزرعتك وقيمتها الإجمالية. معدل الدوران يوضح مدى سرعة بيع أو استبدال الحيوانات';
        case 'pesticides':
          return 'كمية المبيدات الحشرية المتوفرة ونسبة منها قد تكون قريبة من انتهاء الصلاحية';
        case 'seeds':
          return 'مخزون البذور المتاح للزراعة في الموسم المقبل';
        case 'fertilizer':
          return 'كمية الأسمدة المتوفرة للاستخدام في الحقول';
        case 'equipment':
          return 'المعدات والآلات المتوفرة وحالتها';
        case 'feed':
          return 'مخزون الأعلاف المتوفر لتغذية الحيوانات';
        case 'tools':
          return 'الأدوات المتوفرة للعمل في المزرعة';
        case 'harvest':
          return 'كمية المحاصيل التي تم حصادها وقيمتها';
        default:
          return '';
      }
    };

    // Get activity explanation based on category
    const getActivityExplanation = () => {
      switch(category) {
        case 'animals':
          return 'نشاط تربية وبيع الحيوانات';
        case 'pesticides':
          return 'استخدام وشراء المبيدات';
        case 'seeds':
          return 'زراعة واستخدام البذور';
        case 'fertilizer':
          return 'استخدام الأسمدة في الحقول';
        case 'equipment':
          return 'استخدام وصيانة المعدات';
        case 'feed':
          return 'استهلاك وشراء الأعلاف';
        case 'tools':
          return 'استخدام الأدوات في المزرعة';
        case 'harvest':
          return 'حصاد وبيع المحاصيل';
        default:
          return '';
      }
    };
    
    return (
      <View key={String(category)}>
        <View 
          style={[
            baseStyles.farmerFriendlyCard, 
            { borderLeftColor: borderColor }
          ]}
        >
          <View style={baseStyles.cardHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <StatusIndicator status={status} size={12} />
              <Text style={baseStyles.cardTitleText}>
                {categoryTranslations[category]}
              </Text>
              <HelpTooltip text={getTip()} />
            </View>
                <MaterialCommunityIcons 
              name={getCategoryIcon(category)} 
                  size={24} 
              color={chartColors[category].primary} 
                />
              </View>

          <MaterialCommunityIcons 
            name={getCategoryIcon(category)} 
            size={80} 
            color={chartColors[category].primary} 
            style={baseStyles.largeIcon}
          />
          
          <Text style={baseStyles.cardValueText}>
            {formatNumber(data.count)}
          </Text>
          <Text style={{fontSize: 16, color: COLORS.text, opacity: 0.7}}>
            {formatCurrency(data.value)}
          </Text>
          
          <View style={baseStyles.cardFooter}>
            <View>
              <Text style={{fontSize: 12, color: COLORS.gray}}>معدل الدوران</Text>
              <Text style={{fontSize: 16, fontWeight: 'bold'}}>
                {isNaN(turnover) || turnover === 0 ? '0' : `${formatNumber(turnover)}x`}
              </Text>
            </View>
            <View>
              <Text style={{fontSize: 12, color: COLORS.gray}}>النمو</Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <MaterialCommunityIcons 
                  name={performance.growth > 0 ? 'arrow-up' : performance.growth < 0 ? 'arrow-down' : 'arrow-right'} 
                  size={16} 
                  color={performance.status === 'positive' ? '#00C853' : 
                        performance.status === 'negative' ? '#FF1744' : COLORS.gray} 
                />
                <Text 
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: performance.status === 'positive' ? '#00C853' : 
                          performance.status === 'negative' ? '#FF1744' : COLORS.text
                  }}
                >
                  {isNaN(performance.growth) ? '0' : `${Math.abs(performance.growth).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%`}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Add activity explanation for better clarity */}
        <View style={{marginTop: -10, marginBottom: 10, paddingHorizontal: 10}}>
          <Text style={{fontSize: 12, color: COLORS.gray, textAlign: 'right'}}>
            <MaterialCommunityIcons name="information-outline" size={12} color={COLORS.gray} /> {getActivityExplanation()}
          </Text>
                </View>
        
        {/* Add chart for this category with improved labels */}
        <View style={[baseStyles.chartContainer, {width: '100%', marginBottom: 20}]}>
          <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center'}}>
            اتجاهات {categoryTranslations[category]} على مدار 6 أشهر
          </Text>
          <LineChart
            data={{
              labels: [5, 4, 3, 2, 1, 0].map(monthsAgo => {
                const date = new Date();
                date.setMonth(date.getMonth() - monthsAgo);
                return getMonthName(date.getMonth());
              }),
              datasets: [{
                data: data.trends.map(value => isNaN(value) ? 0 : value), // Ensure no NaN values
                color: () => chartColors[category].primary,
                strokeWidth: 2
              }]
            }}
            width={width - 32}
            height={180}
            chartConfig={{
              backgroundGradientFrom: COLORS.white,
              backgroundGradientTo: COLORS.white,
              decimalPlaces: 0,
              color: (opacity = 1) => chartColors[category].primary.replace('1)', `${opacity})`),
              labelColor: () => COLORS.text,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "6", // Make sure these are strings not numbers
                strokeWidth: "2",
                stroke: "#FFFFFF" // Use hex format instead of COLORS to avoid NaN
              }
            }}
            bezier
            fromZero
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
          <Text style={{textAlign: 'center', fontSize: 12, color: COLORS.gray, marginTop: 8}}>
            الاتجاهات خلال الأشهر الستة الماضية (من {getFullMonthLabel(5)} إلى {getFullMonthLabel(0)})
          </Text>
                </View>
        
        {/* Special visualizations for specific categories with improved labels */}
        {category === 'pesticides' && data.categories && (
          <View style={[baseStyles.chartContainer, {width: '100%', marginBottom: 20}]}>
            <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center'}}>
              توزيع أنواع المبيدات
            </Text>
            <PieChart
              data={[
                {
                  name: 'مبيدات حشرية',
                  count: isNaN(data.categories.insecticide) ? 0 : data.categories.insecticide,
                  color: chartColors.pesticides.primary,
                  legendFontColor: COLORS.text,
                  legendFontSize: 12
                },
                {
                  name: 'مبيدات أعشاب',
                  count: isNaN(data.categories.herbicide) ? 0 : data.categories.herbicide,
                  color: 'rgba(255, 159, 64, 1)',
                  legendFontColor: COLORS.text,
                  legendFontSize: 12
                },
                {
                  name: 'مبيدات فطرية',
                  count: isNaN(data.categories.fungicide) ? 0 : data.categories.fungicide,
                  color: 'rgba(46, 204, 113, 1)',
                  legendFontColor: COLORS.text,
                  legendFontSize: 12
                },
                {
                  name: 'أخرى',
                  count: isNaN(data.categories.other) ? 0 : data.categories.other,
                  color: 'rgba(153, 102, 255, 1)',
                  legendFontColor: COLORS.text,
                  legendFontSize: 12
                }
              ]}
              width={width - 32}
              height={180}
              chartConfig={{
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <Text style={{textAlign: 'center', fontSize: 12, color: COLORS.gray, marginTop: 8}}>
              توزيع المبيدات حسب النوع (العدد الإجمالي: {formatNumber(data.count)})
            </Text>
                  </View>
                )}
                
        {/* Enhanced expiry status chart with more details */}
        {category === 'pesticides' && data.expiryStatus && (
          <View style={[baseStyles.chartContainer, {width: '100%', marginBottom: 20}]}>
            <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center'}}>
              حالة صلاحية المبيدات
            </Text>
            <PieChart
              data={[
                {
                  name: 'صالحة',
                  count: isNaN(data.expiryStatus.valid) ? 0 : data.expiryStatus.valid,
                  color: 'rgba(46, 204, 113, 1)',
                  legendFontColor: COLORS.text,
                  legendFontSize: 12
                },
                {
                  name: 'تنتهي قريباً',
                  count: isNaN(data.expiryStatus.nearExpiry) ? 0 : data.expiryStatus.nearExpiry,
                  color: 'rgba(255, 159, 64, 1)',
                  legendFontColor: COLORS.text,
                  legendFontSize: 12
                },
                {
                  name: 'منتهية',
                  count: isNaN(data.expiryStatus.expired) ? 0 : data.expiryStatus.expired,
                  color: 'rgba(255, 99, 132, 1)',
                  legendFontColor: COLORS.text,
                  legendFontSize: 12
                }
              ]}
              width={width - 32}
              height={180}
              chartConfig={{
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <Text style={{textAlign: 'center', fontSize: 12, color: COLORS.gray, marginTop: 8}}>
              حالة صلاحية المبيدات الحالية (تنتهي قريباً: خلال 30 يوم)
            </Text>
                </View>
        )}
        
        {/* Add AI-powered recommendations specific to each category */}
        <View style={[baseStyles.chartContainer, {width: '100%', marginBottom: 20}]}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
            <MaterialCommunityIcons name="robot" size={20} color={COLORS.primary} />
            <Text style={{fontSize: 16, fontWeight: 'bold', marginLeft: 8}}>
              توصيات ذكية لتحسين {categoryTranslations[category]}
            </Text>
          </View>
          
          {getCategoryRecommendations(category, data).map((rec, index) => (
            <View key={index} style={styles.aiCardSmall}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={{
                  width: 24, 
                  height: 24, 
                  borderRadius: 12, 
                  backgroundColor: rec.priority === 'High' ? '#FF1744' : rec.priority === 'Medium' ? '#FFA500' : '#00C853',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 8
                }}>
                  <Text style={{color: '#FFFFFF', fontSize: 10, fontWeight: 'bold'}}>{
                    rec.priority === 'High' ? 'عالي' : rec.priority === 'Medium' ? 'متوسط' : 'منخفض'
                  }</Text>
                </View>
                <Text style={{flex: 1, fontSize: 14, fontWeight: 'bold'}}>{rec.message}</Text>
              </View>
              <Text style={{fontSize: 12, color: COLORS.text, opacity: 0.7, marginTop: 4, marginLeft: 32}}>
                {rec.action}
              </Text>
              </View>
            ))}
          </View>
      </View>
    );
  };

  // Render app
  if (loading && !refreshing) {
    return (
      <View style={baseStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={baseStyles.loadingText}>جاري تحميل البيانات...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={baseStyles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={COLORS.danger} />
        <Text style={baseStyles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={[baseStyles.retryButton, { backgroundColor: COLORS.primary }]}
          onPress={fetchData}
        >
          <Text style={baseStyles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={50} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
    <ScrollView 
          style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
          {/* Farm-friendly header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>المخزون المزرعي</Text>
            
            <View style={styles.searchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color={COLORS.gray} />
              <TextInput
                style={styles.searchInput}
                placeholder="بحث في المخزون..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>
          
          {/* Farm health status card */}
          <View style={styles.healthCard}>
            <View style={styles.healthHeader}>
              <Text style={styles.cardTitle}>صحة المخزون</Text>
              <View style={[styles.healthBadge, { backgroundColor: getFarmHealthScore().color }]}>
                <MaterialCommunityIcons 
                  name={getFarmHealthScore().icon} 
                  size={16} 
                  color="#FFFFFF" 
                />
                <Text style={styles.healthBadgeText}>{getFarmHealthScore().score}</Text>
              </View>
            </View>
            
            <View style={styles.healthBody}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons 
                    name="package-variant-closed" 
                    size={24} 
                    color={COLORS.primary} 
                  />
                  <Text style={styles.summaryValue}>
                    {formatNumber(Object.values(stockData).reduce((sum, cat) => sum + cat.count, 0))}
                  </Text>
                  <Text style={styles.summaryLabel}>إجمالي العناصر</Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons 
                    name="cash" 
                    size={24} 
                    color={COLORS.primary} 
                  />
                  <Text style={styles.summaryValue}>
                    {formatCurrency(Object.values(stockData).reduce((sum, cat) => sum + cat.value, 0))}
                  </Text>
                  <Text style={styles.summaryLabel}>القيمة الإجمالية</Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons 
                    name="alert-circle-outline" 
                    size={24} 
                    color={COLORS.warning} 
                  />
                  <Text style={styles.summaryValue}>
                    {formatNumber(getAlertItems().length)}
                  </Text>
                  <Text style={styles.summaryLabel}>تنبيهات</Text>
                </View>
              </View>
              
              <Text style={styles.healthTip}>
                {getFarmHealthScore().score === 'جيد' 
                  ? 'مخزونك في حالة جيدة! استمر في المراقبة المنتظمة'
                  : getFarmHealthScore().score === 'متوسط'
                  ? 'هناك بعض العناصر التي تحتاج إلى اهتمامك'
                  : 'يجب عليك إعادة تعبئة العديد من العناصر قريبًا'
                }
              </Text>
            </View>
      </View>

          {/* Alerts card */}
          {getAlertItems().length > 0 && (
            <View style={styles.alertsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>تنبيهات</Text>
                <MaterialCommunityIcons name="bell-alert" size={22} color={COLORS.warning} />
      </View>

              {getAlertItems().map((item, index) => (
                <View key={item.id} style={styles.alertItem}>
                  <MaterialCommunityIcons 
                    name={item.quantity < (item.minQuantityAlert || 5) ? "package-down" : "clock-outline"} 
                    size={22} 
                    color={item.quantity < (item.minQuantityAlert || 5) ? COLORS.error : COLORS.warning} 
                    style={styles.alertIcon}
                  />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{item.name}</Text>
                    <Text style={styles.alertMessage}>
                      {item.quantity < (item.minQuantityAlert || 5) 
                        ? `المخزون منخفض: ${item.quantity} ${item.unit || 'قطعة'}`
                        : `ينتهي في: ${new Date(item.expiryDate || '').toLocaleDateString('ar-SA')}`
                      }
                    </Text>
      </View>
                  <TouchableOpacity style={styles.alertAction}>
                    <Text style={styles.alertActionText}>
                      {item.quantity < (item.minQuantityAlert || 5) ? "إعادة تعبئة" : "عرض"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {getAlertItems().length > 5 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllButtonText}>عرض كل التنبيهات</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Stock Activity Calendar */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>نشاط المخزون</Text>
          </View>
          
          <StockCalendarView stockData={stockData} />
          
          {/* All Categories - Keep all 8 categories separate */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>فئات المخزون</Text>
          </View>
          
          <View style={styles.categoryGrid}>
        {Object.entries(stockData).map(([category, data]) => (
              <TouchableOpacity 
                key={category} 
                style={styles.categoryCard}
                onPress={() => { /* Navigate to category detail */ }}
              >
                <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(category as keyof StockData) }]}>
                  <MaterialCommunityIcons 
                    name={getCategoryIcon(category as keyof StockData)} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={styles.categoryTitle}>
                  {(category === 'animals' ? 'الحيوانات' : 
               category === 'pesticides' ? 'المبيدات' :
               category === 'seeds' ? 'البذور' :
               category === 'fertilizer' ? 'الأسمدة' :
                    category === 'equipment' ? 'المعدات' :
                    category === 'feed' ? 'الأعلاف' :
                    category === 'tools' ? 'الأدوات' :
                    'المحاصيل')}
            </Text>
                <Text style={styles.categoryCount}>
                  {formatNumber(data.count)} عنصر
                </Text>
                <Text style={styles.categoryValue}>
                  {formatCurrency(data.value)}
                </Text>
                
                {/* Simple trend visualization */}
                {data.trends && data.trends.length > 0 && (
                  <View style={styles.trendIndicator}>
                    <MaterialCommunityIcons 
                      name={data.trends[data.trends.length-1] > data.trends[0] ? 'trending-up' : 'trending-down'} 
                      size={18} 
                      color={data.trends[data.trends.length-1] > data.trends[0] ? COLORS.success : COLORS.error} 
                    />
                    <Text style={[
                      styles.trendText, 
                      { 
                        color: data.trends[data.trends.length-1] > data.trends[0] ? 
                          COLORS.success : COLORS.error 
                      }
                    ]}>
                      {calculateGrowthRate(
                        data.trends[data.trends.length-1] || 0, 
                        data.trends[0] || 0
                      ).toFixed(0)}%
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Insights */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <MaterialCommunityIcons name="lightbulb-on" size={18} color={COLORS.accent} />
              {' '}تحليلات وإرشادات
            </Text>
          </View>
          
          <View style={styles.insightsContainer}>
            {getInsights(stockData).slice(0, 3).map((insight, index) => (
              <View key={index} style={styles.insightCard}>
                <View style={[
                  styles.insightIconContainer, 
                  { 
                    backgroundColor: 
                      insight.type === 'Critical' ? `${COLORS.error}20` : 
                      insight.type === 'Warning' ? `${COLORS.warning}20` : 
                      `${COLORS.success}20`
                  }
                ]}>
                  <MaterialCommunityIcons 
                    name={insight.icon} 
                    size={24} 
                    color={
                      insight.type === 'Critical' ? COLORS.error : 
                      insight.type === 'Warning' ? COLORS.warning : 
                      COLORS.success
                    } 
                  />
                </View>
                <Text style={styles.insightText}>{insight.message}</Text>
          </View>
        ))}
      </View>
      
          {/* Enhanced Recommendations for Farmers */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <MaterialCommunityIcons name="clipboard-check" size={18} color={COLORS.primary} />
              {' '}توصيات زراعية
            </Text>
          </View>
          
          <View style={styles.recommendationsContainer}>
            {getRecommendations(stockData).slice(0, 3).map((recommendation, index) => (
              <View key={index} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <View style={[
                    styles.priorityBadge,
                    { 
                      backgroundColor: 
                        recommendation.priority === 'High' ? COLORS.error : 
                        recommendation.priority === 'Medium' ? COLORS.warning : 
                        COLORS.success 
                    }
                  ]}>
                    <Text style={styles.priorityText}>
                      {recommendation.priority === 'High' ? 'عالي' : 
                       recommendation.priority === 'Medium' ? 'متوسط' : 'منخفض'}
              </Text>
                  </View>
                </View>
                
                <Text style={styles.recommendationMessage}>{recommendation.message}</Text>
                <Text style={styles.recommendationAction}>{recommendation.action}</Text>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>تنفيذ</Text>
                </TouchableOpacity>
            </View>
          ))}
            
            {getRecommendations(stockData).length > 3 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllButtonText}>عرض كل التوصيات</Text>
              </TouchableOpacity>
            )}
        </View>
          
          {/* Add seasonal advice based on current month */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <MaterialCommunityIcons name="calendar-month" size={18} color={COLORS.primary} />
              {' '}نصائح موسمية
            </Text>
          </View>
          
          <View style={styles.seasonalAdviceCard}>
            <Text style={styles.seasonalAdviceTitle}>
              نصائح لشهر {getMonthName(new Date().getMonth())}
            </Text>
            <View style={styles.seasonalAdviceContent}>
              {/* Provide seasonal advice based on current month */}
              {new Date().getMonth() >= 2 && new Date().getMonth() <= 4 ? (
                // Spring advice
                <>
                  <View style={styles.adviceItem} key="spring-advice-1">
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.adviceText}>وقت مناسب لزراعة المحاصيل الموسمية</Text>
                  </View>
                  <View style={styles.adviceItem} key="spring-advice-2">
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.adviceText}>تأكد من توفر البذور والأسمدة الكافية</Text>
                  </View>
                  <View style={styles.adviceItem} key="spring-advice-3">
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.adviceText}>فحص أنظمة الري قبل بدء موسم الزراعة</Text>
                  </View>
                </>
              ) : new Date().getMonth() >= 5 && new Date().getMonth() <= 7 ? (
                // Summer advice
                <>
                  <View style={styles.adviceItem} key="summer-advice-1">
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.adviceText}>زيادة كميات المياه بسبب ارتفاع درجات الحرارة</Text>
                  </View>
                  <View style={styles.adviceItem} key="summer-advice-2">
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.adviceText}>مراقبة الآفات بشكل مستمر خلال الصيف</Text>
                  </View>
                  <View style={styles.adviceItem} key="summer-advice-3">
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.adviceText}>تخزين محصول الحبوب في ظروف مناسبة</Text>
                  </View>
                </>
              ) : new Date().getMonth() >= 8 && new Date().getMonth() <= 10 ? (
                // Fall advice
                <>
                  <View style={styles.adviceItem} key="fall-advice-1">
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.adviceText}>الوقت مناسب لتجهيز الأرض للزراعة الشتوية</Text>
                  </View>
                  <View style={styles.adviceItem} key="fall-advice-2">
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.adviceText}>جهز مخزونك من الأعلاف الحيوانية قبل دخول فصل الشتاء</Text>
                  </View>
                  <View style={styles.adviceItem} key="fall-advice-3">
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.adviceText}>قم بصيانة معدات التدفئة للحظائر والبيوت المحمية</Text>
                  </View>
                </>
              ) : (
                // Winter advice
                <>
                  <View style={styles.adviceItem} key="winter-advice-1">
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.adviceText}>تأكد من تدفئة حظائر الحيوانات خلال فترات البرد</Text>
                  </View>
                  <View style={styles.adviceItem} key="winter-advice-2">
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.adviceText}>استخدم هذا الوقت لصيانة المعدات والأدوات الزراعية</Text>
                  </View>
                  <View style={styles.adviceItem} key="winter-advice-3">
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.adviceText}>خطط لموسم الزراعة القادم وقم بطلب البذور والأسمدة مبكراً</Text>
                  </View>
                </>
              )}
            </View>
          </View>
          
          {/* Add to render inside the ScrollView of the StockStatisticsScreen component, after the header section */}
          <View style={styles.actionRow}>
            <QuickActions />
          </View>
          
          {/* Weather Card */}
          <WeatherCard weatherInfo={weatherInfo} />
          
          {/* Task Management Card */}
          <TaskCard tasks={farmTasks} />
          
          {/* Print Modal */}
          <PrintModal
            visible={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            stockData={stockData}
          />
          
          {/* Floating Action Button */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowPrintModal(true)}
          >
            <MaterialCommunityIcons name="printer" size={24} color={COLORS.white} />
          </TouchableOpacity>
    </ScrollView>
      )}
      
      {/* Export Data Modal */}
      <ExportDataModal 
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
    </View>
  );
};

// Update styles for mobile farmer-friendly interface
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F3F8',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
    color: COLORS.text,
    marginHorizontal: 8,
  },
  healthCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  healthBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  healthBody: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  healthTip: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  alertItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    padding: 12,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: COLORS.gray,
  },
  alertAction: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: 'center',
  },
  alertActionText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewAllButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  viewAllButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'right',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    width: '46%',
    marginHorizontal: '2%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  categoryCount: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  insightsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'right',
  },
  recommendationsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendationMessage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'right',
  },
  recommendationAction: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  seasonalAdviceCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  seasonalAdviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'right',
  },
  seasonalAdviceContent: {
    marginBottom: 8,
  },
  adviceItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  adviceText: {
    fontSize: 14,
    color: COLORS.text,
    marginRight: 8,
    textAlign: 'right',
    flex: 1,
  },
  
  // Add missing styles to fix linter errors
  filterContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'right',
  },
  filterScroll: {
    flexDirection: 'row-reverse',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  timePeriodContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 4,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  periodButtonActive: {
    backgroundColor: 'rgba(0, 150, 255, 0.1)',
  },
  periodButtonText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  periodButtonTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  aiCardSmall: {
    backgroundColor: 'rgba(240, 240, 240, 0.5)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  
  // Weather Card Styles
  weatherCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  weatherContent: {
    padding: 16,
    alignItems: 'center',
  },
  temperatureText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  weatherCondition: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 16,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherDetailText: {
    marginLeft: 4,
    color: COLORS.text,
  },
  
  // Task Card Styles
  tasksCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  emptyTasksContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTasksText: {
    marginTop: 8,
    color: COLORS.gray,
    fontSize: 14,
  },
  taskItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    padding: 12,
  },
  taskPriorityIndicator: {
    width: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.gray,
  },
  taskDueDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  taskCheckButton: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  
  // Quick Actions Styles
  actionRow: {
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  quickActionButton: {
    alignItems: 'center',
    width: '22%',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  
  // Print Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  printModalContainer: {
    width: '90%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  printModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  printModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  printInstructions: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 15,
  },
  printOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  printOptionText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  printButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  printButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  permissionWarning: {
    fontSize: 12,
    color: COLORS.warning,
    marginTop: 12,
    textAlign: 'center',
  },
  
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  
  // Other new styles as needed...
  
  // Add the missing styles for save method options
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
  },
  saveMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  saveMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    padding: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  saveMethodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  saveMethodText: {
    fontSize: 12,
    marginLeft: 4,
    color: COLORS.primary,
  },
  saveMethodTextActive: {
    color: COLORS.white,
  },
});

// Add the helper function to get the proper name field based on the category
const getItemName = (item: StockItem, category: keyof StockData): string => {
  if (category === 'animals' && item.type) {
    return item.type;
  } else if (category === 'harvest' && 'cropName' in item) {
    return (item as any).cropName || '';
  } else {
    return item.name || '';
  }
};

export default StockStatisticsScreen;