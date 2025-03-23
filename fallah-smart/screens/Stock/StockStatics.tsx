import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  SafeAreaView,
  FlatList
} from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { pesticideService } from '../../services/pesticideService';
import { api, animalApi, stockSeedApi, stockEquipmentApi, stockFeedApi, stockFertilizerApi, stockToolApi, stockHarvestApi, stockPesticideApi } from '../../services/api';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation } from '@react-navigation/native';

// Toast implementation for notifications
const Toast = {
  show: (options: { type: string, text1: string, text2: string }) => {
    console.log(`[Toast] ${options.type}: ${options.text1} - ${options.text2}`);
  }
};

// Get the window dimensions
const { width } = Dimensions.get('window');

// Define the interfaces for stock data structure
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
  cropName?: string;
  count?: number; // Add count field for animals
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

// Weather information interface
interface WeatherInfo {
  temperature: number;
  condition: string;
  humidity: number;
  rainfall: number;
  icon: string;
}

// Farm task interface
interface FarmTask {
  id: string;
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  category: keyof StockData;
}

// AI analysis interfaces
interface Insight {
  type: 'Critical' | 'Warning' | 'Good';
  message: string;
  icon: 'alert-circle' | 'alert' | 'check-circle';
}

interface Recommendation {
  priority: 'High' | 'Medium' | 'Low';
  message: string;
  action: string;
}

interface FarmAnalysis {
  overallHealth: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  inventoryStatus: string;
  financialHealth: string;
  seasonalPreparedness: string;
  mainIssues: string[];
  opportunityAreas: string[];
  recommendedActions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

// Icon types
type MaterialCommunityIconName = 
  'cow' | 'flask' | 'seed' | 'shovel' | 'tools' | 'food' | 'hammer' | 
  'alert-circle' | 'check-circle' | 'information' | 'trending-up' | 
  'trending-down' | 'robot' | 'lightbulb-on' | 'arrow-right-bold-circle' | 
  'weather-rainy' | 'weather-sunny' | 'weather-cloudy' | 'clipboard-plus' | 
  'barcode-scan' | 'file-chart' | 'alert' | 'image-multiple' | 'folder-download' | 
  'share-variant' | 'file-pdf-box' | 'check' | 'calendar' | 'water' | 'printer' | 
  'water-percent' | 'sprout' | 'leaf' | 'snowflake' | 'minus' | 'gauge' | 
  'bucket' | 'tractor' | 'leaf-maple' | 'flower' | 'fruit-watermelon' | 
  'food-apple' | 'bee' | 'food-drumstick' | 'egg' | 'silo' | 'spray' | 
  'fertilizer' | 'watering-can' | 'bulldozer' | 'knife' | 'scythe';

// Colors for the app
const COLORS = {
  primary: '#075E54',
  secondary: '#128C7E',
  accent: '#25D366',
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#333333',
  subtext: '#666666',
  border: '#DDDDDD',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
  white: '#FFFFFF',
  gray: '#9E9E9E',
  lightGray: '#EEEEEE',
  darkGray: '#616161',
  transparent: 'transparent',
  orange: '#FF9500',
  black: '#000000'
};

// Colors for different stock categories
const chartColors = {
  animals: {
    primary: 'rgba(63, 81, 181, 1)',
    background: 'rgba(63, 81, 181, 0.2)',
    gradient: ['#3F51B5', '#303F9F'] as const
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
    primary: 'rgba(75, 192, 192, 1)',
    background: 'rgba(75, 192, 192, 0.2)',
    gradient: ['#6DD5FA', '#2193B0'] as const
  },
  equipment: {
    primary: 'rgba(153, 102, 255, 1)',
    background: 'rgba(153, 102, 255, 0.2)',
    gradient: ['#9F7AEA', '#6B46C1'] as const
  },
  feed: {
    primary: 'rgba(255, 159, 64, 1)',
    background: 'rgba(255, 159, 64, 0.2)',
    gradient: ['#FF9F43', '#F68B2A'] as const
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

// Arabic translations for categories
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

// Arabic translations for dashboard elements
const dashboardTranslations = {
  stockHealth: 'صحة المخزون',
  stockEfficiency: 'كفاءة المخزون',
  totalItems: 'إجمالي العناصر',
  totalValue: 'القيمة الإجمالية',
  lowStock: 'مخزون منخفض',
  expiringSoon: 'ينتهي قريبًا',
  insights: 'رؤى وتحليلات',
  recommendations: 'توصيات',
  categories: 'الفئات',
  stockActivity: 'نشاط المخزون',
  viewAll: 'عرض الكل',
  searchPlaceholder: 'بحث في المخزون...',
  stockSummary: 'ملخص المخزون',
  needsAttention: 'يحتاج إلى اهتمام',
  farmAnalysis: 'تحليل المزرعة',
  healthScore: 'مؤشر الصحة',
  animalHealth: 'صحة الحيوانات',
  cropHealth: 'صحة المحاصيل',
  equipmentStatus: 'حالة المعدات',
  financialStatus: 'الوضع المالي',
  farmTasks: 'مهام المزرعة',
  weather: 'الطقس',
  exportData: 'تصدير البيانات',
  print: 'طباعة',
  share: 'مشاركة',
  save: 'حفظ',
  close: 'إغلاق',
  farmerAdvice: 'نصائح للمزارع',
  mainIssues: 'المشاكل الرئيسية',
  opportunities: 'الفرص المتاحة',
  actions: 'الإجراءات الموصى بها',
  immediate: 'فوري',
  shortTerm: 'قصير المدى',
  longTerm: 'طويل المدى',
  currentYear: 'العام الحالي',
  lastYear: 'العام الماضي',
};

// Utility functions
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).replace(/TND/g, 'د.ت');
};

const getMonthName = (monthIndex: number): string => {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[monthIndex];
};

const getFullMonthLabel = (monthsAgo: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const monthName = getMonthName(date.getMonth());
  const year = date.getFullYear();
  return `${monthName} ${year}`;
};

const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const getCategoryIcon = (category: keyof StockData): MaterialCommunityIconName => {
  switch(category) {
    case 'animals': return 'cow';
    case 'pesticides': return 'flask';
    case 'seeds': return 'seed';
    case 'fertilizer': return 'seed';
    case 'equipment': return 'shovel';
    case 'feed': return 'food';
    case 'tools': return 'tools';
    case 'harvest': return 'food';
    default: return 'seed';
  }
};

// Comprehensive animal name translations from AddAnimal.tsx
const animalNameMap: Record<string, string> = {
  // Livestock (ماشية)
  'cow': 'بقرة',
  'bull': 'ثور',
  'buffalo': 'جاموس',
  'sheep': 'خروف',
  'ram': 'كبش',
  'goat': 'ماعز',
  'camel': 'جمل',
  'horse': 'حصان',
  'donkey': 'حمار',
  'ox': 'ثور الحراثة',
  'llama': 'لاما',
  
  // Poultry (دواجن)
  'chicken': 'دجاج',
  'rooster': 'ديك',
  'chick': 'كتكوت',
  'duck': 'بط',
  'turkey': 'ديك رومي',
  'goose': 'إوز',
  
  // Birds (طيور)
  'pigeon': 'حمام',
  'dove': 'يمام',
  'peacock': 'طاووس',
  'parrot': 'ببغاء',
  
  // Small Animals (حيوانات صغيرة)
  'rabbit': 'أرنب',
  
  // Guard/Working Animals (حيوانات الحراسة والعمل)
  'dog': 'كلب حراسة',
  
  // Insects (حشرات)
  'bee': 'نحل',

  // Plurals and variations
  'horses': 'حصان',
  'chickens': 'دجاج',
  'cows': 'بقرة',
  'goats': 'ماعز',
  'zebra': 'حمار مخطط',
  'cattle': 'ماشية'
};

// Create a mapping for harvest types based on AddHarvest.tsx
const harvestNameMap: Record<string, string> = {
  'wheat': 'قمح',
  'barley': 'شعير',
  'corn': 'ذرة',
  'rice': 'أرز',
  'tomato': 'طماطم',
  'potato': 'بطاطس',
  'cucumber': 'خيار',
  'eggplant': 'باذنجان',
  'apple': 'تفاح',
  'orange': 'برتقال',
  'olive': 'زيتون',
  'grape': 'عنب',
  'dates': 'تمر',
  'watermelon': 'بطيخ',
  'melon': 'شمام',
  'strawberry': 'فراولة',
  'lettuce': 'خس',
  'carrot': 'جزر',
  'onion': 'بصل',
  'garlic': 'ثوم'
};

// Create translations for fertilizer types
const fertilizerNameMap: Record<string, string> = {
  'npk': 'NPK',
  'urea': 'يوريا',
  'phosphate': 'فوسفات',
  'potassium': 'بوتاسيوم',
  'compost': 'سماد عضوي',
  'manure': 'روث',
  'vermicompost': 'سماد الديدان',
  'rhizobium': 'رايزوبيوم',
  'azotobacter': 'أزوتوباكتر',
  'mycorrhiza': 'فطريات جذرية'
};

// Create translations for pesticide types
const pesticideNameMap: Record<string, string> = {
  'insecticide': 'مبيد حشري',
  'herbicide': 'مبيد أعشاب',
  'fungicide': 'مبيد فطري',
  'rodenticide': 'مبيد قوارض',
  'natural': 'مبيد طبيعي',
  'biological': 'مبيد حيوي'
};

// Create translations for equipment types
const equipmentNameMap: Record<string, string> = {
  'tractor': 'جرار',
  'plow': 'محراث',
  'harvester': 'حصادة',
  'seeder': 'بذارة',
  'sprayer': 'رشاشة',
  'irrigation': 'نظام ري'
};

// Create translations for tool types
const toolNameMap: Record<string, string> = {
  'hand_tools': 'أدوات يدوية',
  'power_tools': 'أدوات كهربائية',
  'gardening': 'أدوات بستنة',
  'measuring': 'أدوات قياس',
  'safety': 'معدات أمان',
  'storage': 'معدات تخزين'
};

// Create translations for feed types
const feedNameMap: Record<string, string> = {
  'hay': 'قش',
  'grain': 'حبوب',
  'silage': 'علف مخزن',
  'concentrate': 'علف مركز',
  'fodder': 'علف أخضر',
  'supplement': 'مكملات غذائية'
};

// Create translations for seed types
const seedNameMap: Record<string, string> = {
  'grain': 'حبوب',
  'vegetable': 'خضروات',
  'fruit': 'فواكه',
  'flower': 'زهور',
  'herb': 'أعشاب',
  'cover_crop': 'محاصيل تغطية'
};

// Get the name of a stock item in a user-friendly way
const getItemName = (item: StockItem, category: keyof StockData): string => {
  try {
    if (category === 'animals') {
      // For animals, use the type name from mapping
      const animalType = item.type || '';
      return animalNameMap[animalType] || animalType;
    } else if (category === 'harvest') {
      // For harvest, use the cropName
      const cropType = item.cropName || '';
      return harvestNameMap[cropType] || cropType;
    } else if (item.type) {
      return item.type;
    } else if (item.name) {
      return item.name;
    } else {
      return 'غير معروف';
    }
  } catch (error) {
    console.error("[Item Name] Error getting item name:", error);
    return item.name || item.type || 'غير معروف';
  }
};

// Helper components
const StatusIndicator: React.FC<{
  status: 'good' | 'warning' | 'critical';
  size?: number;
}> = ({ status, size = 10 }) => {
  let color = '';
  
  switch(status) {
    case 'good':
      color = COLORS.success;
      break;
    case 'warning':
      color = COLORS.warning;
      break;
    case 'critical':
      color = COLORS.error;
      break;
  }
  
  return (
    <View 
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        marginLeft: 8
      }}
    />
  );
};

const HelpTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <View>
      <TouchableOpacity
        onPress={() => setShowTooltip(true)}
        style={{ padding: 4 }}
      >
        <MaterialCommunityIcons name="information" size={16} color={COLORS.primary} />
      </TouchableOpacity>
      
      <Modal
        transparent={true}
        visible={showTooltip}
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <TouchableOpacity 
          style={styles.tooltipOverlay} 
          activeOpacity={1} 
          onPress={() => setShowTooltip(false)}
        >
          <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipText}>{text}</Text>
            <TouchableOpacity 
              style={styles.tooltipCloseButton}
              onPress={() => setShowTooltip(false)}
            >
              <Text style={styles.tooltipCloseText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const AnimatedNumber: React.FC<{ 
  value: number;
  duration?: number;
  formatFunction?: (val: number) => string;
}> = ({ 
  value, 
  duration = 1000, 
  formatFunction = (val: number) => val.toString() 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(formatFunction(0));
  
  useEffect(() => {
    animatedValue.setValue(0);
    
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      useNativeDriver: true
    }).start();
    
    const listener = animatedValue.addListener(({ value: v }) => {
      const newValue = value * v;
      setDisplayValue(formatFunction(newValue));
    });
    
    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value]);
  
  return (
    <Text>{displayValue}</Text>
  );
};

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
        <MaterialCommunityIcons name="check" size={16} color={COLORS.white} />
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

// Add a helper function to get the correct quantity for any item
const getItemQuantity = (item: StockItem, category: keyof StockData): number => {
  // For animals, use count instead of quantity when available
  if (category === 'animals' && item.count !== undefined) {
    return item.count;
  }
  // For all other categories, use quantity
  return item.quantity || 0;
};

// Generate farm analysis based on stock data and weather
const generateFarmAnalysis = (stockData: StockData, weatherInfo: WeatherInfo): FarmAnalysis => {
  // Calculate total inventory value and count
  let totalValue = 0;
  let totalItems = 0;
  let lowStockCount = 0;
  let expiringCount = 0;
  
  Object.entries(stockData).forEach(([category, data]) => {
    totalValue += data.value;
    totalItems += data.count;
    
    // Count low stock items
    data.items.forEach((item: StockItem) => {
      // Get effective quantity based on category
      const effectiveQuantity = getItemQuantity(item, category as keyof StockData);
      
      if (effectiveQuantity < (item.minQuantityAlert || 5)) {
        lowStockCount++;
      }
      
      // Count expiring items
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const now = new Date();
        const daysDiff = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 0 && daysDiff < 30) {
          expiringCount++;
        }
      }
    });
  });
  
  // Identify low stock items
  const lowStockItems = Object.entries(stockData).flatMap(([category, data]) => 
    data.items.filter((item: StockItem) => {
      const effectiveQuantity = getItemQuantity(item, category as keyof StockData);
      return effectiveQuantity < (item.minQuantityAlert || 5);
    }).map((item: StockItem) => ({ ...item, category }))
  );
  
  // Identify expiring items
  const expiringItems = Object.entries(stockData).flatMap(([category, data]) => 
    data.items.filter((item: StockItem) => 
      item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).map((item: StockItem) => ({ ...item, category }))
  );
  
  // Calculate seasonal preparedness based on time of year
  const currentMonth = new Date().getMonth();
  const isPlantingSeason = currentMonth >= 2 && currentMonth <= 4; // Spring
  const isHarvestSeason = currentMonth >= 8 && currentMonth <= 10; // Fall
  const isWinterPrep = currentMonth >= 10 || currentMonth <= 1; // Winter prep
  
  // Check seed inventory for planting season
  const lowSeedsForPlanting = isPlantingSeason && 
    stockData.seeds.count < 10; // Arbitrary threshold
  
  // Check harvest storage for harvest season
  const lowHarvestStorage = isHarvestSeason && 
    stockData.harvest.count < 10; // Arbitrary threshold
  
  // Check animal feed for winter
  const lowFeedForWinter = isWinterPrep && 
    stockData.feed.count < 20; // Arbitrary threshold
  
  // Assess overall health
  let overallHealth: FarmAnalysis['overallHealth'] = 'excellent';
  if (lowStockItems.length > 5 || expiringItems.length > 5) {
    overallHealth = 'poor';
  } else if (lowStockItems.length > 2 || expiringItems.length > 2) {
    overallHealth = 'average';
  } else if (lowStockItems.length > 0 || expiringItems.length > 0) {
    overallHealth = 'good';
  }
  
  // Weather-based insights
  const isHotAndDry = weatherInfo.temperature > 30 && weatherInfo.humidity < 40;
  const isHeavyRainfall = weatherInfo.rainfall > 50;
  
  // Main issues
  const mainIssues: string[] = [];
  if (lowStockItems.length > 0) {
    mainIssues.push(`${lowStockItems.length} عناصر في المخزون منخفضة وتحتاج إلى تجديد.`);
  }
  if (expiringItems.length > 0) {
    mainIssues.push(`${expiringItems.length} عناصر ستنتهي صلاحيتها قريبًا وتحتاج إلى استخدام.`);
  }
  if (isHotAndDry) {
    mainIssues.push("الطقس حار وجاف، قد تكون هناك حاجة لزيادة الري ومراقبة المحاصيل.");
  }
  if (isHeavyRainfall) {
    mainIssues.push("هطول أمطار غزيرة متوقعة، تأكد من تصريف المياه وحماية المحاصيل.");
  }
  if (lowSeedsForPlanting) {
    mainIssues.push("مخزون البذور منخفض خلال موسم الزراعة، يُنصح بالتزود بها.");
  }
  if (lowHarvestStorage) {
    mainIssues.push("مساحة تخزين المحاصيل منخفضة خلال موسم الحصاد، قد تحتاج لتوسيع التخزين.");
  }
  if (lowFeedForWinter) {
    mainIssues.push("مخزون العلف منخفض قبل فصل الشتاء، قد تحتاج للتزود به للحيوانات.");
  }
  
  // Opportunity areas
  const opportunityAreas: string[] = [];
  
  // Check categories with high value but low utilization
  const categories = Object.entries(stockData).map(([name, data]) => ({
    name,
    value: data.value,
    count: data.count
  }));
  
  // Sort by value to find high-value categories
  categories.sort((a, b) => b.value - a.value);
  
  // Suggest focus on high-value categories
  if (categories.length > 0) {
    opportunityAreas.push(`التركيز على إدارة ${getCategoryTranslation(categories[0].name as keyof StockData)} التي تمثل أعلى قيمة في المخزون.`);
  }
  
  // Weather opportunities
  if (isHotAndDry) {
    opportunityAreas.push("فرصة لاستخدام أنظمة ري موفرة للمياه وتقنيات الزراعة الجافة.");
  } else if (isHeavyRainfall) {
    opportunityAreas.push("فرصة لتجميع مياه الأمطار للاستخدام المستقبلي.");
  }
  
  // Seasonal opportunities
  if (isPlantingSeason) {
    opportunityAreas.push("موسم الزراعة الحالي مناسب لتجربة محاصيل جديدة أو تقنيات زراعية حديثة.");
  } else if (isHarvestSeason) {
    opportunityAreas.push("فرصة لمعالجة وتخزين المنتجات للبيع خارج الموسم بأسعار أفضل.");
  }
  
  return {
    overallHealth,
    inventoryStatus: totalItems > 50 ? "مخزون كافٍ ومتنوع" : "مخزون محدود",
    financialHealth: totalValue > 1000 ? "قيمة المخزون جيدة" : "قيمة المخزون منخفضة",
    seasonalPreparedness: mainIssues.length < 2 ? "الاستعداد الموسمي جيد" : "يحتاج لتحسين الاستعداد الموسمي",
    mainIssues,
    opportunityAreas,
    recommendedActions: {
      immediate: [
        ...lowStockItems.slice(0, 3).map(item => `شراء المزيد من ${getItemName(item, item.category as keyof StockData)}`),
        ...expiringItems.slice(0, 3).map(item => `استخدام ${getItemName(item, item.category as keyof StockData)} قبل انتهاء صلاحيته`)
      ],
      shortTerm: [
        isPlantingSeason ? "التخطيط للزراعة المقبلة بناءً على متطلبات السوق" : "",
        isHarvestSeason ? "ترتيب مساحات تخزين إضافية للمحاصيل" : "",
        "مراجعة استراتيجيات التسعير للمنتجات الزراعية",
        "تحسين كفاءة استخدام المدخلات الزراعية"
      ].filter(Boolean),
      longTerm: [
        "الاستثمار في تقنيات زراعية أكثر كفاءة",
        "تنويع المنتجات الزراعية لتقليل المخاطر",
        "تطوير خطة للتعامل مع تغيرات الموسم والطقس",
        "بناء علاقات مع موردين وعملاء جدد"
      ]
    }
  };
};

// Add a function to get the current season
const getCurrentSeason = (): string => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
};

// Add a function to get seasonal advice based on current season
const getSeasonalAdvice = (season: string): string => {
  switch (season) {
    case 'spring':
      return 'موسم الزراعة: تأكد من توفر البذور والأسمدة. راقب نمو المحاصيل المبكرة.';
    case 'summer':
      return 'موسم النمو: راقب الري والأمراض. تأكد من صيانة المعدات تحسباً للحصاد.';
    case 'fall':
      return 'موسم الحصاد: تأكد من جاهزية معدات الحصاد ومساحات التخزين.';
    case 'winter':
      return 'وقت الصيانة: صيانة المعدات واستعد للموسم القادم. تأكد من توفر العلف للحيوانات.';
    default:
      return '';
  }
};

// Print Modal for generating and saving reports
const PrintModal: React.FC<{ visible: boolean, onClose: () => void, stockData: StockData }> = ({ visible, onClose, stockData }) => {
  const [options, setOptions] = useState({
    summary: true,
    details: true,
    charts: false,
    recommendations: true
  });
  const [saving, setSaving] = useState(false);
  const { hasPermission } = useMediaLibraryPermission();
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const toggleOption = (option: keyof typeof options) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Replace the broken HTML generation with a fixed version that handles animal counts correctly
  const generateHTML = () => {
    const totalItems = Object.values(stockData).reduce((sum, category) => sum + category.count, 0);
    const totalValue = Object.values(stockData).reduce((sum, category) => sum + category.value, 0);
    
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
    
    // Helper function to get the correct quantity for an item based on its category
    const getItemDisplayQuantity = (item: StockItem, category: keyof StockData): number => {
      // For animals, always use count if available
      if (category === 'animals') {
        if (item.count !== undefined) {
          return item.count;
        }
        // Log warning if count is missing
        console.warn(`[PDF] Animal without count field: ${item.type || item.name || item.id}`);
      }
      // For all other categories, use quantity
      return item.quantity || 0;
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
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .logo {
            max-width: 100px;
            height: auto;
          }
          .date {
            color: #777;
            font-size: 14px;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            text-align: right;
            padding: 12px 15px;
            border-bottom: 1px solid #E0E0E0;
          }
          th {
            background-color: #F5F5F5;
            font-weight: bold;
          }
          tr:hover {
            background-color: #FAFAFA;
          }
          .section {
            margin-bottom: 30px;
          }
          .summary-box {
            background-color: #F1F8E9;
            border-right: 4px solid #7CB342;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .alert-box {
            background-color: #FFF8E1;
            border-right: 4px solid #FFB300;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .stat-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .stat-box {
            background-color: #E8F5E9;
            padding: 15px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .stat-title {
            font-size: 14px;
            color: #555;
            margin-bottom: 5px;
          }
          .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #2E7D32;
          }
          .status-good {
            color: #4CAF50;
          }
          .status-warning {
            color: #FF9800;
          }
          .status-critical {
            color: #F44336;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 14px;
            color: #777;
            border-top: 1px solid #E0E0E0;
            padding-top: 20px;
          }
          .flex-container {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
          }
          .box {
            width: 48%;
            margin-bottom: 20px;
            padding: 15px;
            background-color: #F9F9F9;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .box-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #2E7D32;
          }
          .advice-list {
            list-style-type: none;
            padding-right: 20px;
          }
          .advice-list li {
            position: relative;
            margin-bottom: 10px;
          }
          .advice-list li:before {
            content: "•";
            color: #4CAF50;
            font-weight: bold;
            display: inline-block;
            width: 20px;
            margin-right: -20px;
          }
        </style>
      </head>
      <body>
        <h1>تقرير مخزون مزرعتك</h1>
        <p class="date">تاريخ التقرير: ${formattedDate}</p>
    `;
    
    // Summary section
    if (options.summary) {
      // Filter to only include real items with quantity > 0
      const realItems = Object.entries(stockData).flatMap(([category, data]) => {
        return data.items.filter((item: StockItem) => {
          // Get the correct quantity based on category
          const effectiveQuantity = category === 'animals' ? 
            (item.count !== undefined ? item.count : item.quantity) : 
            item.quantity;
          
          // Make sure items have actual quantity and a valid name/type/cropName
          return effectiveQuantity > 0 && 
            ((item.type && item.type.length > 0) || 
             (item.name && item.name.length > 0) || 
             (item.cropName && item.cropName.length > 0));
        }).map((item: StockItem) => ({...item, _categoryKey: category}));
      });
      
      const totalItems = realItems.length;
      const totalValue = realItems.reduce((sum, item) => sum + (item.value || 0), 0);
      
      // Improved filtering for low stock and expired items
      const lowStockItems = realItems.filter((item: StockItem & {_categoryKey: string}) => {
        const effectiveQuantity = getItemDisplayQuantity(item, item._categoryKey as keyof StockData);
        return item.status === 'low' || 
          (effectiveQuantity > 0 && effectiveQuantity < (item.minQuantityAlert || 5));
      });
      
      const expiredItems = realItems.filter((item: StockItem & {_categoryKey: string}) => 
        item.status === 'expired' || 
        (item.expiryDate && new Date(item.expiryDate) < new Date())
      );
      
      html += `
        <div class="section">
          <h2>ملخص المخزون</h2>
          <div class="summary-box">
            <p>إجمالي العناصر: <strong>${formatEnglishNumber(totalItems)}</strong></p>
            <p>القيمة الإجمالية: <strong>${formatEnglishCurrency(totalValue)}</strong></p>
            <p>العناصر منخفضة المخزون: <strong>${formatEnglishNumber(lowStockItems.length)}</strong></p>
            <p>العناصر المنتهية الصلاحية: <strong>${formatEnglishNumber(expiredItems.length)}</strong></p>
          </div>
          
          <h3>توزيع المخزون حسب الفئات</h3>
          <div class="stat-grid">
      `;
      
      // Only include categories that have real items
      Object.entries(stockData).forEach(([category, data]) => {
        const catKey = category as keyof StockData;
        // Only include if there are real items in this category
        const realCategoryItems = data.items.filter((item: StockItem) => {
          // Get the correct quantity based on category
          const effectiveQuantity = category === 'animals' ? 
            (item.count !== undefined ? item.count : item.quantity) : 
            item.quantity;
          
          // Make sure items have actual quantity and a valid name/type/cropName
          return effectiveQuantity > 0 && 
            ((item.type && item.type.length > 0) || 
             (item.name && item.name.length > 0) || 
             (item.cropName && item.cropName.length > 0));
        });
        
        if(realCategoryItems.length > 0) {
          html += `
            <div class="stat-box">
              <div class="stat-title">${categoryTranslations[catKey]}</div>
              <div class="stat-value">${formatEnglishNumber(realCategoryItems.length)}</div>
            </div>
          `;
        }
      });
      
      html += `
          </div>
          
          <h3>توصية موسمية</h3>
          <div class="alert-box">
            ${seasonalInsight}
          </div>
        </div>
      `;
    }
    
    // Detailed inventory section
    if (options.details) {
      html += `<div class="section"><h2>تفاصيل المخزون حسب الفئة</h2>`;
      
      Object.entries(stockData).forEach(([cat, data]) => {
        const catKey = cat as keyof StockData;
        // Better filtering to ensure we only include real items
        const realItems = data.items.filter((item: StockItem) => {
          // Get the correct quantity based on category
          const effectiveQuantity = catKey === 'animals' ? 
            (item.count !== undefined ? item.count : item.quantity) : 
            item.quantity;
          
          return effectiveQuantity > 0 && 
            ((catKey === 'animals' && item.type && item.type.length > 0) || 
             (catKey === 'harvest' && item.cropName && item.cropName.length > 0) ||
             (item.name && item.name.length > 0));
        });
        
        if (realItems.length > 0) {
          html += `
            <h3>${categoryTranslations[catKey]}</h3>
            <table class="items-table">
              <tr>
                <th>الاسم</th>
                <th>الكمية</th>
                <th>الحالة</th>
              </tr>
          `;
          
          realItems.forEach((item: StockItem) => {
            const itemName = getItemName(item, catKey);
            // Use the correct quantity based on category
            const displayQuantity = getItemDisplayQuantity(item, catKey);
            
            const status = item.status?.toLowerCase() === 'expired' ? 'منتهي الصلاحية' :
                          item.status?.toLowerCase() === 'low' ? 'مخزون منخفض' : 'جيد';
            html += `
              <tr>
                <td>${itemName}</td>
                <td>${formatEnglishNumber(displayQuantity)}</td>
                <td>${status}</td>
              </tr>
            `;
          });
          
          html += `</table>`;
        }
      });
      
      html += `</div>`;
    }
    
    // AI Recommendations section
    if (options.recommendations) {
      html += `
        <div class="section">
          <h2>توصيات ونصائح للمزارع</h2>
          
          <div class="flex-container">
            <div class="box">
              <div class="box-title">نصائح للرعاية بالحيوانات</div>
              <ul class="advice-list">
                <li>تأكد من توفير مياه نظيفة وكافية للحيوانات بشكل يومي</li>
                <li>فحص الحيوانات بشكل دوري للتأكد من عدم وجود أمراض</li>
                <li>توفير مساحة كافية وتهوية جيدة في حظائر الحيوانات</li>
                <li>الاحتفاظ بسجلات منتظمة لصحة ونمو الحيوانات</li>
              </ul>
            </div>
            
            <div class="box">
              <div class="box-title">نصائح للعناية بالمحاصيل</div>
              <ul class="advice-list">
                <li>مراقبة المحاصيل بانتظام للكشف المبكر عن الآفات والأمراض</li>
                <li>استخدام دورة زراعية متنوعة لتحسين خصوبة التربة</li>
                <li>توفير الري المناسب حسب نوع المحصول والموسم</li>
                <li>اختيار البذور عالية الجودة والمناسبة للمناخ المحلي</li>
              </ul>
            </div>
            
            <div class="box">
              <div class="box-title">نصائح لإدارة المخزون</div>
              <ul class="advice-list">
                <li>تخزين المنتجات في مكان جاف وبارد بعيداً عن أشعة الشمس المباشرة</li>
                <li>استخدام مبدأ "الوارد أولاً يصرف أولاً" لتجنب انتهاء الصلاحية</li>
                <li>وضع علامات واضحة على جميع المنتجات مع تواريخ انتهاء الصلاحية</li>
                <li>الاحتفاظ بمخزون احتياطي للمواد الأساسية</li>
              </ul>
            </div>
            
            <div class="box">
              <div class="box-title">نصائح للمعدات والأدوات</div>
              <ul class="advice-list">
                <li>صيانة المعدات بانتظام قبل وبعد موسم الاستخدام الرئيسي</li>
                <li>تنظيف الأدوات بعد كل استخدام وتخزينها في مكان جاف</li>
                <li>فحص المعدات الكهربائية للتأكد من سلامتها قبل الاستخدام</li>
                <li>الاحتفاظ بقطع غيار للمعدات الأكثر استخداماً</li>
              </ul>
            </div>
          </div>
          
          <h3>عناصر تحتاج إلى انتباه فوري</h3>
      `;
      
      // Low stock items
      if (lowStockItems.length > 0) {
        html += `
          <table>
            <thead>
              <tr>
                <th>العنصر</th>
                <th>الفئة</th>
                <th>الكمية الحالية</th>
                <th>الحد الأدنى</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        lowStockItems.slice(0, 5).forEach((item: any) => {
          const category = item._categoryKey as keyof StockData;
          const categoryName = categoryTranslations[category] || '';
          // Use the correct quantity based on category
          const displayQuantity = getItemDisplayQuantity(item, category);
          
          html += `
            <tr>
              <td>${getItemName(item, category)}</td>
              <td>${categoryName}</td>
              <td>${formatEnglishNumber(displayQuantity)}</td>
              <td>${formatEnglishNumber(item.minQuantityAlert || 5)}</td>
            </tr>
          `;
        });
        
        html += `
            </tbody>
          </table>
        `;
      } else {
        html += `<p>لا توجد عناصر منخفضة المخزون في الوقت الحالي.</p>`;
      }
      
      html += `
        </div>
      `;
    }
    
    // Footer
    html += `
        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة تطبيق فلاح سمارت - ${formattedDate}</p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  };

  // Add back the saveMethod variable with a fixed value
  const [saveMethod] = useState('downloads');

  // Simplify the createPDF function with better error handling
  const createPDF = async () => {
    try {
      setSaving(true);
      console.log("[PDF] Starting PDF creation process...");
      
      // Generate HTML content
      const htmlContent = generateHTML();
      console.log("[PDF] HTML content generated successfully");
      
      // Create PDF file with a timeout to prevent hanging
      console.log("[PDF] Converting HTML to PDF...");
      const pdfResult = await Promise.race([
        Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("PDF generation timed out after 15 seconds")), 15000)
        )
      ]) as { uri: string };
      
      console.log(`[PDF] File created at: ${pdfResult.uri}`);
      
      // Check if file exists and has content
      const fileInfo = await FileSystem.getInfoAsync(pdfResult.uri);
      if (!fileInfo.exists) {
        throw new Error(`File does not exist at path: ${pdfResult.uri}`);
      }
      if (fileInfo.size < 100) {
        throw new Error(`Generated PDF file is too small (${fileInfo.size} bytes), likely corrupted`);
      }
      
      console.log(`[PDF] File verified, size: ${fileInfo.size} bytes`);
      
      // Save to downloads directly
      const saveResult = await saveToDownloads(pdfResult.uri);
      if (!saveResult) {
        throw new Error("Failed to save PDF to downloads");
      }
      
      console.log("[PDF] Process completed successfully");
    } catch (error) {
      console.error('[PDF] Error in PDF creation process:', error);
      Alert.alert(
        'خطأ في إنشاء الملف',
        'حدث خطأ أثناء إنشاء أو حفظ ملف PDF. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      // Always reset loading state
      setSaving(false);
    }
  };

  const saveToGallery = async (fileUri: string) => {
    try {
      console.log("[PDF] Saving to gallery...");
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync("Fallah Smart", asset, false);
      console.log("[PDF] Saved to gallery successfully");
      
      Alert.alert(
        'تم الحفظ بنجاح',
        'تم حفظ التقرير في معرض الصور ضمن ألبوم Fallah Smart.'
      );
    } catch (error) {
      console.error("[PDF] Error saving to gallery:", error);
      Alert.alert(
        'خطأ في الحفظ',
        'حدث خطأ أثناء حفظ الملف في المعرض. يرجى المحاولة مرة أخرى.'
      );
    }
  };

  // Improve the saveToDownloads function with better error handling
  const saveToDownloads = async (fileUri: string) => {
    try {
      console.log("[PDF] Starting save to downloads process...");
      
      // Create a valid filename with date and time
      const date = new Date();
      const timestamp = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}`;
      const fileName = `farm_report_${timestamp}.pdf`;
      
      if (Platform.OS === 'android') {
        console.log("[PDF] Android platform detected");
        
        // Create Downloads directory if it doesn't exist
        const downloadDir = FileSystem.documentDirectory + 'Download/';
        console.log(`[PDF] Using download directory: ${downloadDir}`);
        
        const dirInfo = await FileSystem.getInfoAsync(downloadDir);
        if (!dirInfo.exists) {
          console.log("[PDF] Creating download directory...");
          await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
        }
        
        const destinationUri = downloadDir + fileName;
        console.log(`[PDF] Destination path: ${destinationUri}`);
        
        // Copy file to downloads
        await FileSystem.copyAsync({
          from: fileUri,
          to: destinationUri
        });
        
        // Verify the file was copied successfully
        const savedFileInfo = await FileSystem.getInfoAsync(destinationUri);
        if (!savedFileInfo.exists) {
          throw new Error(`Failed to copy file to ${destinationUri}`);
        }
        
        console.log(`[PDF] File saved to downloads, size: ${savedFileInfo.size} bytes`);
        
        // Try to open the file with a viewer
        try {
          const contentUri = await FileSystem.getContentUriAsync(destinationUri);
          console.log(`[PDF] Content URI for viewer: ${contentUri}`);
          
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: 'application/pdf'
          });
          console.log("[PDF] Opened file with viewer");
        } catch (viewerError) {
          console.error("[PDF] Error opening file with viewer:", viewerError);
          // Continue anyway as the file is saved
        }
        
        Alert.alert('تم الحفظ بنجاح', `تم حفظ الملف في مجلد التنزيلات باسم ${fileName}`);
        return true;
      } 
      else {
        console.log("[PDF] iOS platform detected");
        
        // Create temp file path
        const cacheFilePath = `${FileSystem.cacheDirectory}${fileName}`;
        console.log(`[PDF] iOS cache path: ${cacheFilePath}`);
        
        // Copy file to cache
        await FileSystem.copyAsync({
          from: fileUri,
          to: cacheFilePath
        });
        
        // Verify copy was successful
        const cacheFileInfo = await FileSystem.getInfoAsync(cacheFilePath);
        if (!cacheFileInfo.exists) {
          throw new Error(`Failed to copy file to ${cacheFilePath}`);
        }
        
        console.log(`[PDF] File copied to cache, size: ${cacheFileInfo.size} bytes`);
        
        // Share the file
        await Sharing.shareAsync(cacheFilePath, {
          mimeType: 'application/pdf',
          dialogTitle: 'حفظ تقرير المخزون',
          UTI: 'com.adobe.pdf'
        });
        
        console.log("[PDF] File shared successfully");
        
        Alert.alert('تم المشاركة', 'استخدم خيار "حفظ في الملفات" من القائمة لحفظ التقرير');
        return true;
      }
    } catch (error) {
      console.error("[PDF] Error in saveToDownloads:", error);
      Alert.alert(
        'خطأ في حفظ الملف',
        'فشل في حفظ الملف. يرجى التحقق من إذن الوصول إلى التخزين.'
      );
      return false;
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
          
          <TouchableOpacity 
            style={styles.pdfButton} 
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

// Farm analysis component
const FarmAnalysisSection: React.FC<{ stockData: StockData; weatherInfo: WeatherInfo }> = ({ 
  stockData,
  weatherInfo
}) => {
  const analysis = useMemo(() => generateFarmAnalysis(stockData, weatherInfo), [stockData, weatherInfo]);
  
  // Get current season for contextual advice
  const currentSeason = getCurrentSeason();
  const seasonalAdvice = getSeasonalAdvice(currentSeason);
  
  // Color mapping for health status
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return COLORS.success;
      case 'good': return COLORS.primary;
      case 'average': return COLORS.warning;
      case 'poor': return COLORS.orange;
      case 'critical': return COLORS.error;
      default: return COLORS.gray;
    }
  };
  
  return (
    <View style={styles.analysisCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.sectionTitle}>تحليل ذكي للمزرعة</Text>
        <MaterialCommunityIcons name="robot" size={24} color={COLORS.primary} />
      </View>
      
      <View style={styles.analysisOverview}>
        <View style={[
          styles.healthIndicator, 
          { backgroundColor: getHealthColor(analysis.overallHealth) }
        ]}>
          <Text style={styles.healthText}>
            {analysis.overallHealth === 'excellent' ? 'ممتاز' :
             analysis.overallHealth === 'good' ? 'جيد' :
             analysis.overallHealth === 'average' ? 'متوسط' :
             analysis.overallHealth === 'poor' ? 'ضعيف' : 'حرج'}
          </Text>
        </View>
        
        <View style={styles.analysisTextContainer}>
          <Text style={styles.analysisTitle}>حالة المزرعة الحالية</Text>
          <Text style={styles.analysisDescription}>{analysis.inventoryStatus}</Text>
        </View>
      </View>
      
      {/* Add seasonal context */}
      <View style={styles.seasonalContainer}>
        <View style={styles.seasonBadge}>
          <MaterialCommunityIcons 
            name={
              currentSeason === 'spring' ? 'sprout' : 
              currentSeason === 'summer' ? 'weather-sunny' :
              currentSeason === 'fall' ? 'leaf' : 'snowflake'
            } 
            size={18} 
            color={COLORS.white} 
          />
          <Text style={styles.seasonText}>
            {currentSeason === 'spring' ? 'الربيع' : 
             currentSeason === 'summer' ? 'الصيف' :
             currentSeason === 'fall' ? 'الخريف' : 'الشتاء'}
          </Text>
        </View>
        <Text style={styles.seasonalAdvice}>{seasonalAdvice}</Text>
      </View>
      
      <View style={styles.divider} />
      
      {/* Main issues section */}
      {analysis.mainIssues.length > 0 && (
        <View style={styles.analysisSection}>
          <Text style={styles.analysisSectionTitle}>تحتاج الانتباه</Text>
          
          {analysis.mainIssues.map((issue, index) => (
            <View key={`issue-${index}`} style={styles.bulletPoint}>
              <MaterialCommunityIcons name="alert-circle" size={18} color={COLORS.warning} />
              <Text style={styles.bulletText}>{issue}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Opportunities section */}
      {analysis.opportunityAreas.length > 0 && (
        <View style={styles.analysisSection}>
          <Text style={styles.analysisSectionTitle}>فرص للتحسين</Text>
          
          {analysis.opportunityAreas.map((opportunity, index) => (
            <View key={`opportunity-${index}`} style={styles.bulletPoint}>
              <MaterialCommunityIcons name="lightbulb-on" size={18} color={COLORS.primary} />
              <Text style={styles.bulletText}>{opportunity}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.divider} />
      
      {/* Recommended actions */}
      <View style={styles.analysisSection}>
        <Text style={styles.analysisSectionTitle}>الإجراءات الموصى بها</Text>
        
        {analysis.recommendedActions.immediate.length > 0 && (
          <>
            <Text style={styles.actionTimeframe}>حالاً</Text>
            {analysis.recommendedActions.immediate.map((action, index) => (
              <View key={`immediate-${index}`} style={styles.bulletPoint}>
                <MaterialCommunityIcons name="arrow-right-bold-circle" size={18} color={COLORS.error} />
                <Text style={styles.bulletText}>{action}</Text>
              </View>
            ))}
          </>
        )}
        
        {analysis.recommendedActions.shortTerm.length > 0 && (
          <>
            <Text style={styles.actionTimeframe}>خلال الشهر القادم</Text>
            {analysis.recommendedActions.shortTerm.map((action, index) => (
              <View key={`short-${index}`} style={styles.bulletPoint}>
                <MaterialCommunityIcons name="arrow-right-bold-circle" size={18} color={COLORS.warning} />
                <Text style={styles.bulletText}>{action}</Text>
              </View>
            ))}
          </>
        )}
        
        {analysis.recommendedActions.longTerm.length > 0 && (
          <>
            <Text style={styles.actionTimeframe}>على المدى الطويل</Text>
            {analysis.recommendedActions.longTerm.map((action, index) => (
              <View key={`long-${index}`} style={styles.bulletPoint}>
                <MaterialCommunityIcons name="arrow-right-bold-circle" size={18} color={COLORS.primary} />
                <Text style={styles.bulletText}>{action}</Text>
              </View>
            ))}
          </>
        )}
      </View>
      
      {/* Weather context */}
      <View style={styles.weatherDataNote}>
        <MaterialCommunityIcons name="information" size={18} color={COLORS.gray} />
        <Text style={styles.weatherNoteText}>
          يعتمد هذا التحليل على بيانات المخزون وظروف الطقس الحالية. قد تتغير التوصيات مع تغير الظروف.
        </Text>
      </View>
    </View>
  );
};

// Weather card component
const WeatherCard: React.FC<{ weatherInfo: WeatherInfo }> = ({ weatherInfo }) => {
  // Determine weather advice based on conditions
  const getWeatherAdvice = () => {
    if (weatherInfo.condition === 'rainy' && weatherInfo.rainfall > 30) {
      return 'تأجيل الرش والأنشطة الخارجية';
    } else if (weatherInfo.condition === 'sunny' && weatherInfo.temperature > 30) {
      return 'زيادة الري والتظليل';
    } else if (weatherInfo.humidity > 80) {
      return 'مراقبة الأمراض الفطرية';
    }
    return 'ظروف مناسبة للأنشطة الزراعية';
  };
  
  return (
    <View style={styles.weatherCard}>
      <View style={styles.weatherHeader}>
        <Text style={styles.sectionTitle}>الطقس</Text>
        <MaterialCommunityIcons 
          name={weatherInfo.icon as any} 
          size={24} 
          color={COLORS.primary}
        />
      </View>
      
      <View style={styles.weatherContent}>
        <MaterialCommunityIcons 
          name={weatherInfo.icon as any}
          size={48} 
          color={
            weatherInfo.condition === 'sunny' ? '#FF9500' :
            weatherInfo.condition === 'cloudy' ? '#8F8F8F' :
            weatherInfo.condition === 'rainy' ? '#2196F3' : COLORS.primary
          }
        />
        <Text style={styles.temperatureText}>{weatherInfo.temperature}°C</Text>
        <Text style={styles.conditionText}>
          {weatherInfo.condition === 'sunny' ? 'مشمس' :
           weatherInfo.condition === 'rainy' ? 'ممطر' : 
           weatherInfo.condition === 'cloudy' ? 'غائم' : weatherInfo.condition}
        </Text>
        
        {/* Weather advice */}
        <View style={styles.weatherAdviceContainer}>
          <Text style={styles.weatherAdviceText}>{getWeatherAdvice()}</Text>
        </View>
      </View>
      
      <View style={styles.weatherDetails}>
        <View style={styles.weatherDetail}>
          <MaterialCommunityIcons name="water-percent" size={16} color={COLORS.primary} />
          <Text style={styles.weatherDetailText}>رطوبة: {weatherInfo.humidity}%</Text>
        </View>
        <View style={styles.weatherDetail}>
          <MaterialCommunityIcons name="weather-rainy" size={16} color={COLORS.primary} />
          <Text style={styles.weatherDetailText}>هطول: {weatherInfo.rainfall} مم</Text>
        </View>
      </View>
    </View>
  );
};

// Task card component
const TaskCard: React.FC<{ tasks: FarmTask[] }> = ({ tasks }) => {
  const [localTasks, setLocalTasks] = useState<FarmTask[]>(tasks);
  
  const toggleTaskComplete = (taskId: string) => {
    setLocalTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed } 
          : task
      )
    );
  };
  
  return (
    <View style={styles.tasksCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.sectionTitle}>{dashboardTranslations.farmTasks}</Text>
        <MaterialCommunityIcons name="calendar" size={24} color={COLORS.primary} />
      </View>
      
      {localTasks.length === 0 ? (
        <View style={styles.emptyTasksContainer}>
          <MaterialCommunityIcons name="check-circle" size={32} color={COLORS.gray} />
          <Text style={styles.emptyTasksText}>لا توجد مهام قادمة</Text>
        </View>
      ) : (
        localTasks.map((task) => {
          const priorityColor = 
            task.priority === 'High' ? COLORS.error :
            task.priority === 'Medium' ? COLORS.warning : 
            COLORS.success;
          
          return (
            <TouchableOpacity 
              key={task.id} 
              style={styles.taskItem}
              onPress={() => alert(`ستفتح تفاصيل المهمة: ${task.title}`)}
            >
              <View style={[styles.taskPriorityIndicator, { backgroundColor: priorityColor }]} />
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>
                  {task.title}
                </Text>
                <Text style={styles.taskDueDate}>
                  {new Date(task.dueDate).toLocaleDateString('ar-SA')}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.taskCheckButton}
                onPress={() => toggleTaskComplete(task.id)}
              >
                <CustomCheckBox value={task.completed} onValueChange={() => toggleTaskComplete(task.id)} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
};

// Quick actions component
const QuickActions: React.FC<{setShowPrintModal: (show: boolean) => void}> = ({ setShowPrintModal }) => {
  const navigation = useNavigation();
  
  const handleAddItem = () => {
    // Navigate to add item screen
    alert('سيتم توجيهك إلى شاشة إضافة عنصر جديد');
    // In a real app: navigation.navigate('AddStockItem');
  };
  
  const handleScanStock = () => {
    // Navigate to barcode scanner
    alert('سيتم فتح ماسح الباركود لفحص المخزون');
    // In a real app: navigation.navigate('BarcodeScanner');
  };
  
  const handleQuickReport = () => {
    // Show print modal
    setShowPrintModal(true);
  };
  
  const handleExpiredItems = () => {
    // Filter to show only expired items
    alert('سيتم عرض العناصر منتهية الصلاحية فقط');
    // In a real app: setItemFilter('expired');
  };
  
  return (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity style={styles.quickActionButton} onPress={handleAddItem}>
        <View style={styles.quickActionIcon}>
          <MaterialCommunityIcons name="clipboard-plus" size={24} color={COLORS.white} />
        </View>
        <Text style={styles.quickActionText}>إضافة عنصر</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickActionButton} onPress={handleScanStock}>
        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warning }]}>
          <MaterialCommunityIcons name="barcode-scan" size={24} color={COLORS.white} />
        </View>
        <Text style={styles.quickActionText}>فحص المخزون</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickActionButton} onPress={handleQuickReport}>
        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.success }]}>
          <MaterialCommunityIcons name="file-chart" size={24} color={COLORS.white} />
        </View>
        <Text style={styles.quickActionText}>تقرير سريع</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickActionButton} onPress={handleExpiredItems}>
        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.error }]}>
          <MaterialCommunityIcons name="alert-circle" size={24} color={COLORS.white} />
        </View>
        <Text style={styles.quickActionText}>عناصر منتهية</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 10,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'right',
  },
  printButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'right',
    color: COLORS.text,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'right',
  },
  overviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    marginRight: 16,
  },
  healthScoreText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  healthStatsContainer: {
    flex: 1,
  },
  healthStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  healthStatLabel: {
    color: COLORS.gray,
    fontSize: 14,
  },
  healthStatValue: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  alertItemsContainer: {
    marginTop: 8,
  },
  alertItemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'right',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  alertItemName: {
    flex: 1,
    color: COLORS.text,
    marginHorizontal: 10,
    textAlign: 'right',
  },
  alertItemStatus: {
    color: COLORS.warning,
    fontSize: 12,
  },
  noAlertsText: {
    color: COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryCardContent: {
    padding: 12,
    alignItems: 'center',
  },
  categoryCardTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  categoryCardCount: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  categoryCardValue: {
    color: COLORS.white,
    fontSize: 14,
    marginTop: 4,
  },
  categoryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryTrendText: {
    color: COLORS.white,
    fontSize: 12,
    marginLeft: 4,
  },
  weatherCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherContent: {
    alignItems: 'center',
  },
  temperatureText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  conditionText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 4,
  },
  weatherDetails: {
    marginTop: 16,
    width: '100%',
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherDetailText: {
    marginLeft: 8,
    color: COLORS.text,
    fontSize: 12,
  },
  tasksCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  taskPriorityIndicator: {
    width: 4,
    height: '80%',
    borderRadius: 2,
    marginRight: 8,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    color: COLORS.text,
    fontSize: 14,
    textAlign: 'right',
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.gray,
  },
  taskDueDate: {
    color: COLORS.gray,
    fontSize: 12,
    textAlign: 'right',
  },
  taskCheckButton: {
    padding: 4,
  },
  emptyTasksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTasksText: {
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickActionButton: {
    alignItems: 'center',
    width: '22%',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    color: COLORS.text,
    fontSize: 12,
    textAlign: 'center',
  },
  analysisCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  analysisOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 16,
  },
  healthText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  analysisTextContainer: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'right',
  },
  analysisDescription: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  analysisSection: {
    marginBottom: 16,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'right',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletText: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.text,
    textAlign: 'right',
  },
  actionTimeframe: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'right',
  },
  weatherDataNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  weatherNoteText: {
    fontSize: 12,
    color: COLORS.text,
    marginLeft: 8,
    textAlign: 'right',
    flex: 1,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    width: '80%',
    alignItems: 'center',
  },
  tooltipText: {
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  tooltipCloseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tooltipCloseText: {
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  printModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  printModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  printModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  printInstructions: {
    color: COLORS.gray,
    marginBottom: 16,
    textAlign: 'right',
  },
  printOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  printOptionText: {
    color: COLORS.text,
    marginLeft: 10,
    flex: 1,
    textAlign: 'right',
  },
  pdfButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  printButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  permissionWarning: {
    color: COLORS.warning,
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'right',
  },
  saveMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  saveMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flex: 1,
    marginHorizontal: 4,
  },
  saveMethodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  saveMethodText: {
    color: COLORS.primary,
    marginLeft: 4,
    fontSize: 12,
  },
  saveMethodTextActive: {
    color: COLORS.white,
  },
  seasonalContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  seasonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  seasonalAdvice: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'right',
  },
  categoryStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  categoryStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  weatherAdviceContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 6,
    marginTop: 8,
    width: '100%',
  },
  weatherAdviceText: {
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
  },
  // Properly name button styles to avoid duplicates
  headerPrintButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  printModalButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
});

// Get the category translation
const getCategoryTranslation = (category: keyof StockData): string => {
  const translations: Record<keyof StockData, string> = {
    animals: 'الحيوانات',
    pesticides: 'المبيدات',
    seeds: 'البذور',
    fertilizer: 'الأسمدة',
    equipment: 'المعدات',
    feed: 'الأعلاف',
    tools: 'الأدوات',
    harvest: 'المحاصيل'
  };
  
  return translations[category] || category;
};

// Main component
const StockStatisticsScreen: React.FC = () => {
  // Safe area insets for better mobile layout
  const insets = useSafeAreaInsets();
  
  // Stock data state
  const [stockData, setStockData] = useState<StockData>({
    animals: { count: 0, value: 0, items: [], trends: [0, 0, 0, 0, 0, 0], types: {} },
    pesticides: { count: 0, value: 0, items: [], trends: [0, 0, 0, 0, 0, 0], types: {} },
    seeds: { count: 0, value: 0, items: [], trends: [0, 0, 0, 0, 0, 0], types: {} },
    fertilizer: { count: 0, value: 0, items: [], trends: [0, 0, 0, 0, 0, 0], types: {} },
    equipment: { count: 0, value: 0, items: [], trends: [0, 0, 0, 0, 0, 0], types: {} },
    feed: { count: 0, value: 0, items: [], trends: [0, 0, 0, 0, 0, 0], types: {} },
    tools: { count: 0, value: 0, items: [], trends: [0, 0, 0, 0, 0, 0], types: {} },
    harvest: { count: 0, value: 0, items: [], trends: [0, 0, 0, 0, 0, 0], types: {} },
  });
  
  // Other state variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    condition: 'sunny',
    humidity: 65,
    rainfall: 20,
    icon: 'weather-sunny'
  });
  
  // Fetch all data from API
  const fetchAllStockData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel
      const [
        animalsData,
        pesticidesData,
        seedsData,
        equipmentData,
        feedData, 
        fertilizerData,
        harvestData,
        toolsData
      ] = await Promise.all([
        animalApi.getAllAnimals(),
        stockPesticideApi.getAllPesticides(),
        stockSeedApi.getSeeds(),
        stockEquipmentApi.getAllEquipment(),
        stockFeedApi.getAllFeeds(),
        stockFertilizerApi.getAllFertilizers(),
        stockHarvestApi.getAllHarvests(),
        stockToolApi.getTools()
      ]);

      console.log('[Stock Statistics] Successfully fetched data from all APIs');
      
      // Process animal data - IMPORTANT: Use count field for animals instead of quantity
      const processedAnimals = {
        count: animalsData.length,
        value: animalsData.reduce((sum: number, animal: any) => {
          // Use count for value calculation, defaulting to 1 if missing
          const animalCount = animal.count !== undefined ? animal.count : 1;
          return sum + (animal.price || 0) * animalCount;
        }, 0),
        items: animalsData.map((animal: any) => {
          // Get the count from the API response
          const animalCount = animal.count !== undefined ? animal.count : 1;
          
          return {
            id: animal.id,
            name: animal.name || animal.type,
            type: animal.type,
            quantity: 1, // Base quantity is 1 per animal record
            count: animalCount, // Use count from the database for total animals
            price: animal.price || 0,
            value: (animal.price || 0) * animalCount, // Use count for value calculation
            status: animal.healthStatus === 'poor' ? 'low' : 
                    animal.healthStatus === 'fair' ? 'warning' : 'good',
            category: 'animals',
            // Include other fields that might be useful
            gender: animal.gender,
            feedingSchedule: animal.feedingSchedule,
            healthStatus: animal.healthStatus
          };
        }),
        trends: [0, 0, 0, 0, 0, 0], // Placeholder for trends
        types: animalsData.reduce((acc: Record<string, number>, animal: any) => {
          const type = animal.type || 'unknown';
          // Use count when aggregating by type
          const animalCount = animal.count !== undefined ? animal.count : 1;
          acc[type] = (acc[type] || 0) + animalCount;
          return acc;
        }, {})
      };
      
      // Log animal data for debugging with proper type annotation
      console.log('[Stock Statistics] Processed animal data with count field:', 
        processedAnimals.items.slice(0, 2).map((item: StockItem) => ({
          type: item.type, 
          count: item.count,
          quantity: item.quantity
        }))
      );
      
      // Process pesticides data
      const processedPesticides = {
        count: pesticidesData.length,
        value: pesticidesData.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0), 0),
        items: pesticidesData.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 0,
          price: item.price || 0,
          value: (item.price || 0) * (item.quantity || 0),
          expiryDate: item.expiryDate,
          minQuantityAlert: item.minQuantityAlert || 5,
          status: item.quantity <= (item.minQuantityAlert || 5) ? 'low' : 
                 (item.expiryDate && new Date(item.expiryDate) < new Date()) ? 'expired' : 'good',
          category: 'pesticides'
        })),
        trends: [0, 0, 0, 0, 0, 0],
        types: {}
      };
      
      // Process seeds data
      const processedSeeds = {
        count: seedsData.length,
        value: seedsData.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0), 0),
        items: seedsData.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 0,
          price: item.price || 0,
          value: (item.price || 0) * (item.quantity || 0),
          expiryDate: item.expiryDate,
          minQuantityAlert: item.minQuantityAlert || 5,
          status: item.quantity <= (item.minQuantityAlert || 5) ? 'low' : 
                 (item.expiryDate && new Date(item.expiryDate) < new Date()) ? 'expired' : 'good',
          category: 'seeds'
        })),
        trends: [0, 0, 0, 0, 0, 0],
        types: {}
      };
      
      // Process equipment data
      const processedEquipment = {
        count: equipmentData.length,
        value: equipmentData.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0),
        items: equipmentData.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price || 0,
          value: (item.price || 0) * (item.quantity || 1),
          status: item.status === 'needs_maintenance' ? 'low' : 
                 item.status === 'broken' ? 'expired' : 'good',
          category: 'equipment'
        })),
        trends: [0, 0, 0, 0, 0, 0],
        types: {}
      };
      
      // Process feed data
      const processedFeed = {
        count: feedData.length,
        value: feedData.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0), 0),
        items: feedData.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 0,
          price: item.price || 0,
          value: (item.price || 0) * (item.quantity || 0),
          expiryDate: item.expiryDate,
          minQuantityAlert: item.minQuantityAlert || 5,
          status: item.quantity <= (item.minQuantityAlert || 5) ? 'low' : 
                 (item.expiryDate && new Date(item.expiryDate) < new Date()) ? 'expired' : 'good',
          category: 'feed'
        })),
        trends: [0, 0, 0, 0, 0, 0],
        types: {}
      };
      
      // Process fertilizer data
      const processedFertilizer = {
        count: fertilizerData.length,
        value: fertilizerData.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0), 0),
        items: fertilizerData.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 0,
          price: item.price || 0,
          value: (item.price || 0) * (item.quantity || 0),
          expiryDate: item.expiryDate,
          minQuantityAlert: item.minQuantityAlert || 5,
          status: item.quantity <= (item.minQuantityAlert || 5) ? 'low' : 
                 (item.expiryDate && new Date(item.expiryDate) < new Date()) ? 'expired' : 'good',
          category: 'fertilizer'
        })),
        trends: [0, 0, 0, 0, 0, 0],
        types: {}
      };
      
      // Process harvest data
      const processedHarvest = {
        count: harvestData.length,
        value: harvestData.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0), 0),
        items: harvestData.map((item: any) => ({
          id: item.id,
          name: item.name || item.cropName,
          cropName: item.cropName,
          quantity: item.quantity || 0,
          price: item.price || 0,
          value: (item.price || 0) * (item.quantity || 0),
          expiryDate: item.expiryDate,
          minQuantityAlert: item.minQuantityAlert || 5,
          status: item.quantity <= (item.minQuantityAlert || 5) ? 'low' : 
                 (item.expiryDate && new Date(item.expiryDate) < new Date()) ? 'expired' : 'good',
          category: 'harvest'
        })),
        trends: [0, 0, 0, 0, 0, 0],
        types: {}
      };
      
      // Process tools data
      const processedTools = {
        count: toolsData.length,
        value: toolsData.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0),
        items: toolsData.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price || 0,
          value: (item.price || 0) * (item.quantity || 1),
          status: item.status === 'needs_maintenance' ? 'low' : 
                 item.status === 'broken' ? 'expired' : 'good',
          category: 'tools'
        })),
        trends: [0, 0, 0, 0, 0, 0],
        types: {}
      };
      
      // Set all data into state
      setStockData({
        animals: processedAnimals,
        pesticides: processedPesticides,
        seeds: processedSeeds,
        fertilizer: processedFertilizer,
        equipment: processedEquipment,
        feed: processedFeed,
        tools: processedTools,
        harvest: processedHarvest,
      });
    } catch (err) {
      console.error('[Stock Statistics] Error fetching data:', err);
      setError('حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data when component mounts
  useEffect(() => {
    fetchAllStockData();
  }, [fetchAllStockData]);
  
  // Add a refresh handler for pull-to-refresh
  const handleRefresh = useCallback(() => {
    fetchAllStockData();
  }, [fetchAllStockData]);
  
  // Display loading state
  if (loading && !stockData.animals.items.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.text }}>جاري تحميل البيانات...</Text>
      </View>
    );
  }
  
  // Display error state
  if (error && !stockData.animals.items.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <MaterialCommunityIcons name="alert-circle" size={40} color={COLORS.error} />
        <Text style={{ marginTop: 10, color: COLORS.text, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchAllStockData}
        >
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Search handler
  const filterItemsBySearch = (items: StockItem[]) => {
    if (!searchQuery.trim()) return items;
    
    return items.filter(item => 
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.type && item.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ((item as any).cropName && (item as any).cropName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };
  
  // Get alert items for dashboard
  const getAlertItems = () => {
    const alerts: StockItem[] = [];
    
    // Low stock items
    const lowStockItems = Object.values(stockData)
      .flatMap((category, index) => {
        const categoryName = Object.keys(stockData)[index];
        return (category.items as StockItem[]).filter((item: StockItem) => {
          // For animals, use count instead of quantity
          if (categoryName === 'animals') {
            return item.status === 'low' || ((item.count || 0) < (item.minQuantityAlert || 5));
          }
          // For other items, use quantity
          return item.status === 'low' || ((item.quantity || 0) < (item.minQuantityAlert || 5));
        });
      }).slice(0, 3);
    
    // Expiring items
    const expiringItems = Object.values(stockData)
      .flatMap(category => {
        if (!category.items) return [];
        return (category.items as StockItem[]).filter((item: StockItem) => {
          if (!item.expiryDate) return false;
          const expiry = new Date(item.expiryDate);
          const now = new Date();
          const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
        });
      }).slice(0, 3);
    
    return [...lowStockItems, ...expiringItems].slice(0, 5);
  };
  
  // Calculate farm health score
  const getFarmHealthScore = () => {
    // Initialize with default values
    let sum = 0;
    let total = 0;
    
    // Check each category
    Object.values(stockData).forEach(category => {
      if (category.count === 0) return;
      const totalItems = category.count;
      total += 1;
      
      if (totalItems === 0) return sum;
      
      const problemItems = category.items.filter((item: StockItem) => 
        item.status === 'low' || 
        item.status === 'expired' || 
        item.status === 'near_expiry' || 
        (item.quantity < (item.minQuantity || 5))
      );
      
      // Calculate the percentage of healthy items
      const healthyPercentage = (totalItems - problemItems.length) / totalItems;
      sum += healthyPercentage;
    });
    
    // Return a simplified score
    if (sum / total >= 0.75) return { score: 'جيد', color: '#34C759', icon: 'check-circle' as any };
    if (sum / total >= 0.5) return { score: 'متوسط', color: '#FF9500', icon: 'alert' as any };
    return { score: 'ضعيف', color: '#FF3B30', icon: 'alert-circle' as any };
  };
  
  // Render a category card
  const renderCategoryCard = (category: keyof StockData) => {
    const data = stockData[category];
    const categoryColors = {
      animals: ['#5C8D89', '#6FA8A2'],
      pesticides: ['#8C5D5D', '#A96F6F'],
      seeds: ['#78866B', '#94A688'],
      fertilizer: ['#956F29', '#BE8B33'],
      equipment: ['#4A6FAD', '#5C87D6'],
      feed: ['#9A7D0A', '#C9A20D'],
      tools: ['#6B6B6B', '#868686'],
      harvest: ['#7C4A1E', '#9E5D25']
    };
    
    // Calculate health status based on various factors
    const calculateHealth = () => {
      // Check for low stock items
      const lowStockCount = data.items.filter((item: StockItem) => 
        item.quantity < (item.minQuantity || 5)
      ).length;
      
      // Check for expiring items
      const expiringCount = data.items.filter((item: StockItem) => 
        item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ).length;
      
      const totalIssues = lowStockCount + expiringCount;
      
      if (totalIssues === 0) return 'جيد';
      if (totalIssues < 3) return 'متوسط';
      return 'يحتاج تدخل';
    };
    
    // Get the trend icon and text
    const getTrendInfo = () => {
      // Use last two entries to determine trend
      const trends = data.trends;
      if (!trends || trends.length < 2) {
        return { icon: 'minus', text: 'ثابت', color: COLORS.gray };
      }
      
      const lastTrend = trends[trends.length - 1];
      const previousTrend = trends[trends.length - 2];
      const growth = calculateGrowthRate(lastTrend, previousTrend);
      
      if (growth > 5) {
        return { icon: 'trending-up', text: `+${Math.round(growth)}%`, color: COLORS.success };
      } else if (growth < -5) {
        return { icon: 'trending-down', text: `${Math.round(growth)}%`, color: COLORS.error };
      } else {
        return { icon: 'minus', text: 'ثابت', color: COLORS.gray };
      }
    };
    
    const healthStatus = calculateHealth();
    const trendInfo = getTrendInfo();
    
    return (
      <View key={category} style={styles.categoryCard}>
        <LinearGradient
          colors={categoryColors[category] ? [categoryColors[category][0], categoryColors[category][1]] as readonly [string, string] : ['#888888', '#666666'] as readonly [string, string]}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.categoryCardContent}>
            <MaterialCommunityIcons
              name={getCategoryIcon(category) as any}
              size={32}
              color={COLORS.white}
            />
            <Text style={styles.categoryCardTitle}>
              {getCategoryTranslation(category)}
            </Text>
            <Text style={styles.categoryCardCount}>
              {formatNumber(data.count)}
            </Text>
            <Text style={styles.categoryCardValue}>
              {formatCurrency(data.value)}
            </Text>
            
            <View style={styles.categoryTrend}>
              <MaterialCommunityIcons
                name={trendInfo.icon as any}
                size={16}
                color={trendInfo.color}
              />
              <Text style={[styles.categoryTrendText, { color: trendInfo.color }]}>
                {trendInfo.text}
              </Text>
            </View>
            
            {/* Add status badge */}
            <View style={[
              styles.categoryStatus,
              { 
                backgroundColor: 
                  healthStatus === 'جيد' ? 'rgba(0, 255, 0, 0.2)' : 
                  healthStatus === 'متوسط' ? 'rgba(255, 255, 0, 0.2)' : 
                  'rgba(255, 0, 0, 0.2)' 
              }
            ]}>
              <Text style={[
                styles.categoryStatusText,
                { 
                  color: 
                    healthStatus === 'جيد' ? COLORS.success : 
                    healthStatus === 'متوسط' ? COLORS.warning : 
                    COLORS.error 
                }
              ]}>
                {healthStatus}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>جاري تحميل بيانات المخزون...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={40} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAllStockData}>
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
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>إحصائيات المخزون</Text>
              <Text style={styles.headerSubtitle}>مزرعتك في أرقام</Text>
            </View>
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={() => setShowPrintModal(true)}
            >
              <MaterialCommunityIcons name="printer" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={dashboardTranslations.searchPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.gray}
            />
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.gray} style={styles.searchIcon} />
          </View>
          
          {/* Quick Actions */}
          <View style={styles.sectionContainer}>
            <QuickActions setShowPrintModal={setShowPrintModal} />
          </View>
          
          {/* Farm Health Overview */}
          <View style={styles.overviewCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>{dashboardTranslations.stockHealth}</Text>
              <MaterialCommunityIcons name="chart-donut" size={24} color={COLORS.primary} />
            </View>
            
            <View style={styles.healthScoreContainer}>
              <View style={[styles.healthScoreBadge, { backgroundColor: getFarmHealthScore().color }]}>
                <MaterialCommunityIcons name={getFarmHealthScore().icon} size={24} color={COLORS.white} />
                <Text style={styles.healthScoreText}>{getFarmHealthScore().score}</Text>
              </View>
              
              <View style={styles.healthStatsContainer}>
                <View style={styles.healthStat}>
                  <Text style={styles.healthStatLabel}>{dashboardTranslations.totalItems}</Text>
                  <Text style={styles.healthStatValue}>
                    {formatNumber(Object.values(stockData).reduce((sum, category) => sum + category.count, 0))}
                  </Text>
                </View>
                
                <View style={styles.healthStat}>
                  <Text style={styles.healthStatLabel}>{dashboardTranslations.totalValue}</Text>
                  <Text style={styles.healthStatValue}>
                    {formatCurrency(Object.values(stockData).reduce((sum, category) => sum + category.value, 0))}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.alertItemsContainer}>
              <Text style={styles.alertItemsTitle}>{dashboardTranslations.needsAttention}</Text>
              
              {getAlertItems().length > 0 ? (
                getAlertItems().map((item, index) => (
                  <View key={`alert-${item.id || index}`} style={styles.alertItem}>
                    <MaterialCommunityIcons 
                      name={item.status === 'expired' || item.status === 'near_expiry' ? 'alert-circle' : 'alert'} 
                      size={16} 
                      color={item.status === 'expired' ? COLORS.error : COLORS.warning} 
                    />
                    <Text style={styles.alertItemName}>
                      {getItemName(item, item.category as keyof StockData || 'animals')}
                    </Text>
                    <Text style={styles.alertItemStatus}>
                      {item.status === 'low' ? 'مخزون منخفض' : 
                       item.status === 'expired' ? 'منتهي الصلاحية' : 
                       item.status === 'near_expiry' ? 'ينتهي قريبًا' : 
                       item.status}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noAlertsText}>لا توجد عناصر تحتاج إلى انتباه</Text>
              )}
            </View>
          </View>
          
          {/* Categories Grid */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{dashboardTranslations.categories}</Text>
            </View>
            
            <View style={styles.categoriesGrid}>
              {(Object.keys(stockData) as Array<keyof StockData>).map(category => 
                renderCategoryCard(category)
              )}
            </View>
          </View>
          
          {/* Weather and Tasks Row */}
          <View style={styles.rowContainer}>
            <WeatherCard weatherInfo={weatherInfo} />
            <TaskCard tasks={farmTasks} />
          </View>
          
          {/* Farm AI Analysis Section */}
          <FarmAnalysisSection stockData={stockData} weatherInfo={weatherInfo} />
          
          {/* Bottom Spacing */}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
      
      {/* Print Modal */}
      <PrintModal
        visible={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        stockData={stockData}
      />
    </SafeAreaView>
  );
};

export default StockStatisticsScreen; 