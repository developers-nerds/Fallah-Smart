import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData } from '../../screens/weather/WeatherScreen';
import { theme } from '../../theme/theme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Obtenir les dimensions de l'écran
const { height } = Dimensions.get('window');
// Hauteur estimée du TabBar
const TAB_BAR_HEIGHT = 60;
// Hauteur disponible pour le contenu
const AVAILABLE_HEIGHT = height - TAB_BAR_HEIGHT;

interface PlantingCalendarProps {
  weatherData: WeatherData;
}

// Crop categories
const CROP_CATEGORIES = [
  { id: 'all', label: 'جميع المحاصيل', icon: 'sprout' },
  { id: 'vegetables', label: 'الخضروات', icon: 'carrot' },
  { id: 'fruits', label: 'الفواكه', icon: 'fruit-watermelon' },
  { id: 'grains', label: 'الحبوب', icon: 'barley' },
  { id: 'herbs', label: 'الأعشاب', icon: 'leaf' },
];

// Define seasons in Tunisia
const SEASONS = [
  { id: 'winter', label: 'الشتاء', months: [12, 1, 2], color: '#90CAF9' },
  { id: 'spring', label: 'الربيع', months: [3, 4, 5], color: '#A5D6A7' },
  { id: 'summer', label: 'الصيف', months: [6, 7, 8], color: '#FFCC80' },
  { id: 'fall', label: 'الخريف', months: [9, 10, 11], color: '#FFAB91' },
];

// Crop data for Tunisia
const CROPS = [
  {
    id: 'tomatoes',
    name: 'طماطم',
    category: 'vegetables',
    icon: '🍅',
    plantMonths: [2, 3, 4, 8, 9],
    harvestMonths: [6, 7, 8, 11, 12],
    idealTemp: { min: 15, max: 35 },
    notes: 'تحتاج إلى الكثير من الشمس والماء. تزرع في الربيع والخريف في تونس لتجنب حرارة الصيف القاسية.',
  },
  {
    id: 'potatoes',
    name: 'بطاطا',
    category: 'vegetables',
    icon: '🥔',
    plantMonths: [1, 2, 8, 9],
    harvestMonths: [4, 5, 11, 12],
    idealTemp: { min: 10, max: 30 },
    notes: 'تنمو جيدًا في الشتاء والخريف في تونس. تحتاج إلى تربة رطبة وجيدة التصريف.',
  },
  {
    id: 'peppers',
    name: 'فلفل',
    category: 'vegetables',
    icon: '🌶️',
    plantMonths: [2, 3, 4],
    harvestMonths: [7, 8, 9, 10],
    idealTemp: { min: 18, max: 32 },
    notes: 'محصول صيفي يحب الشمس. يزرع في أواخر الشتاء وأوائل الربيع للحصاد في الصيف والخريف.',
  },
  {
    id: 'watermelons',
    name: 'بطيخ',
    category: 'fruits',
    icon: '🍉',
    plantMonths: [3, 4],
    harvestMonths: [7, 8, 9],
    idealTemp: { min: 21, max: 35 },
    notes: 'يزرع في الربيع للحصاد في الصيف. يحتاج إلى مساحة كبيرة والكثير من المياه والشمس.',
  },
  {
    id: 'oranges',
    name: 'برتقال',
    category: 'fruits',
    icon: '🍊',
    plantMonths: [2, 3],
    harvestMonths: [11, 12, 1, 2],
    idealTemp: { min: 13, max: 35 },
    notes: 'من أهم المحاصيل في تونس. تزرع الأشجار في الربيع وتحصد الثمار في الشتاء.',
  },
  {
    id: 'olives',
    name: 'زيتون',
    category: 'fruits',
    icon: '🫒',
    plantMonths: [2, 3, 11],
    harvestMonths: [9, 10, 11, 12],
    idealTemp: { min: 15, max: 40 },
    notes: 'محصول أساسي في تونس. تبدأ عملية الحصاد عادة في سبتمبر وتستمر حتى يناير.',
  },
  {
    id: 'wheat',
    name: 'قمح',
    category: 'grains',
    icon: '🌾',
    plantMonths: [10, 11, 12],
    harvestMonths: [5, 6, 7],
    idealTemp: { min: 4, max: 32 },
    notes: 'يزرع في الخريف والشتاء للحصاد في أواخر الربيع وأوائل الصيف. من المحاصيل الأساسية في تونس.',
  },
  {
    id: 'barley',
    name: 'شعير',
    category: 'grains',
    icon: '🌾',
    plantMonths: [10, 11],
    harvestMonths: [4, 5],
    idealTemp: { min: 4, max: 30 },
    notes: 'محصول شتوي، يزرع في الخريف ويحصد في الربيع. يتحمل الجفاف والملوحة بشكل أفضل من القمح.',
  },
  {
    id: 'mint',
    name: 'نعناع',
    category: 'herbs',
    icon: '🌿',
    plantMonths: [3, 4, 5, 9, 10],
    harvestMonths: [6, 7, 8, 9, 10, 11],
    idealTemp: { min: 10, max: 30 },
    notes: 'من الأعشاب الشائعة في المطبخ التونسي. يمكن زراعته في الربيع والخريف ويستمر لفترة طويلة.',
  },
  {
    id: 'thyme',
    name: 'زعتر',
    category: 'herbs',
    icon: '🌿',
    plantMonths: [2, 3, 9, 10],
    harvestMonths: [5, 6, 7, 8, 9, 10, 11],
    idealTemp: { min: 7, max: 35 },
    notes: 'عشب مقاوم للجفاف يمكن حصاده عدة مرات في السنة. يستخدم بكثرة في المطبخ التونسي التقليدي.',
  },
];

// Calendar months in Arabic
const MONTHS = [
  { id: 1, name: 'يناير', shortName: 'ينا' },
  { id: 2, name: 'فبراير', shortName: 'فبر' },
  { id: 3, name: 'مارس', shortName: 'مار' },
  { id: 4, name: 'أبريل', shortName: 'أبر' },
  { id: 5, name: 'مايو', shortName: 'ماي' },
  { id: 6, name: 'يونيو', shortName: 'يون' },
  { id: 7, name: 'يوليو', shortName: 'يول' },
  { id: 8, name: 'أغسطس', shortName: 'أغس' },
  { id: 9, name: 'سبتمبر', shortName: 'سبت' },
  { id: 10, name: 'أكتوبر', shortName: 'أكت' },
  { id: 11, name: 'نوفمبر', shortName: 'نوف' },
  { id: 12, name: 'ديسمبر', shortName: 'ديس' },
];

// Interface for crop analysis
interface CropAnalysis {
  temperatureScore: number;
  seasonScore: number;
  overallScore: number;
  growthRate: string;
  risks: string[];
  recommendations: Array<{
    type: string;
    icon: string;
    text: string;
  }>;
}

// AI Analysis functions
const generatePlantingInsights = (weatherData: WeatherData, selectedMonth: number) => {
  const currentTemp = weatherData.current.temp_c;
  const currentHumidity = weatherData.current.humidity;
  const currentWindSpeed = weatherData.current.wind_kph;
  const currentUV = weatherData.current.uv;
  
  const insights = [];
  
  // Temperature analysis with more details
  if (currentTemp > 35) {
    insights.push({
      type: 'warning',
      icon: 'thermometer-high',
      title: 'درجة حرارة مرتفعة',
      description: 'درجة الحرارة مرتفعة جداً. المحاصيل المعرضة للخطر: الخس، السبانخ، البروكلي. قم بزيادة الري وتوفير التظليل.',
      impactScore: 85,
    });
  } else if (currentTemp < 5) {
    insights.push({
      type: 'warning',
      icon: 'thermometer-low',
      title: 'درجة حرارة منخفضة',
      description: 'درجة الحرارة منخفضة. المحاصيل المعرضة للخطر: الطماطم، الفلفل، الباذنجان. قم بتغطية المحاصيل باستخدام أغطية خاصة.',
      impactScore: 80,
    });
  } else {
    insights.push({
      type: 'success',
      icon: 'thermometer',
      title: 'درجة حرارة مثالية',
      description: 'درجة الحرارة مناسبة لمعظم المحاصيل الموسمية. استغل هذه الفترة للزراعة والصيانة.',
      impactScore: 90,
    });
  }

  // Enhanced humidity analysis
  if (currentHumidity > 80) {
    insights.push({
      type: 'warning',
      icon: 'water-percent',
      title: 'رطوبة عالية',
      description: 'الرطوبة العالية تزيد من خطر الأمراض الفطرية مثل البياض الدقيقي والبياض الزغبي. تأكد من التهوية الجيدة وتجنب الري العلوي.',
      impactScore: 75,
    });
  } else if (currentHumidity < 30) {
    insights.push({
      type: 'warning',
      icon: 'water-percent',
      title: 'رطوبة منخفضة',
      description: 'الرطوبة منخفضة مما يزيد من احتياجات الري. راقب علامات الذبول وجفاف التربة. قم بالري في الصباح الباكر أو المساء.',
      impactScore: 70,
    });
  } else {
    insights.push({
      type: 'success',
      icon: 'water-percent',
      title: 'مستوى رطوبة مثالي',
      description: 'مستوى الرطوبة الحالي مناسب لمعظم المحاصيل ويقلل من خطر الأمراض الفطرية والجفاف.',
      impactScore: 85,
    });
  }

  // Enhanced wind analysis
  if (currentWindSpeed > 30) {
    insights.push({
      type: 'warning',
      icon: 'weather-windy',
      title: 'رياح قوية',
      description: 'الرياح القوية قد تسبب تلف الأوراق والسيقان وزيادة فقدان الماء. قم بإنشاء مصدات للرياح وتدعيم النباتات الطويلة.',
      impactScore: 80,
    });
  }

  // Enhanced UV analysis
  if (currentUV > 8) {
    insights.push({
      type: 'warning',
      icon: 'weather-sunny-alert',
      title: 'أشعة UV مرتفعة',
      description: 'مستوى الأشعة فوق البنفسجية مرتفع. قد تتعرض المحاصيل لحروق الشمس. استخدم شباك التظليل بنسبة 30-50% لحماية النباتات الحساسة.',
      impactScore: 75,
    });
  }

  return insights;
};

const generateCropAnalysis = (crop: any, weatherData: any): CropAnalysis | null => {
  if (!crop) return null;
  
  const currentTemp = weatherData.current.temp_c;
  const currentHumidity = weatherData.current.humidity;
  const currentWindSpeed = weatherData.current.wind_kph;
  
  // Calculate temperature compatibility
  const tempDiff = Math.abs(
    (crop.idealTemp.max + crop.idealTemp.min) / 2 - currentTemp
  );
  const tempScore = Math.max(0, 100 - tempDiff * 5);
  
  // Calculate season compatibility
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const seasonScore = crop.plantMonths.includes(currentMonth) ? 90 : 
                      crop.harvestMonths.includes(currentMonth) ? 80 : 50;
  
  // Calculate overall compatibility
  const overallScore = Math.round((tempScore * 0.6) + (seasonScore * 0.4));
  
  // Generate growth prediction (simplified simulation)
  const growthRate = overallScore > 80 ? 'سريع' : 
                     overallScore > 60 ? 'متوسط' : 'بطيء';
  
  // Generate risk assessment
  const risks = [];
  if (currentTemp > crop.idealTemp.max + 5) {
    risks.push('الإجهاد الحراري');
  }
  if (currentTemp < crop.idealTemp.min - 5) {
    risks.push('الضرر من البرودة');
  }
  if (currentHumidity > 80) {
    risks.push('الأمراض الفطرية');
  }
  if (currentHumidity < 30) {
    risks.push('الجفاف');
  }
  if (currentWindSpeed > 30) {
    risks.push('أضرار الرياح');
  }
  
  return {
    temperatureScore: tempScore,
    seasonScore: seasonScore,
    overallScore: overallScore,
    growthRate: growthRate,
    risks: risks,
    recommendations: generateCropRecommendations(crop, weatherData)
  };
};

const generateCropRecommendations = (crop: any, weatherData: any) => {
  const currentTemp = weatherData.current.temp_c;
  const recommendations = [];
  
  // Temperature-based recommendations
  if (currentTemp > crop.idealTemp.max) {
    recommendations.push({
      type: 'irrigation',
      icon: 'water',
      text: 'زيادة معدل الري للتعويض عن ارتفاع درجة الحرارة'
    });
    recommendations.push({
      type: 'protection',
      icon: 'shield',
      text: 'توفير تظليل جزئي (30-50%) خلال ساعات الذروة'
    });
  } else if (currentTemp < crop.idealTemp.min) {
    recommendations.push({
      type: 'protection',
      icon: 'shield',
      text: 'حماية المحصول من البرودة باستخدام أغطية واقية'
    });
    recommendations.push({
      type: 'irrigation',
      icon: 'water',
      text: 'تقليل كمية الري لمنع برودة التربة'
    });
  } else {
    recommendations.push({
      type: 'optimal',
      icon: 'check-circle',
      text: 'الظروف الحالية مثالية، استمر في برنامج الري المعتاد'
    });
  }
  
  // Season-based recommendations
  const currentMonth = new Date().getMonth() + 1; // 1-12
  if (crop.plantMonths.includes(currentMonth)) {
    recommendations.push({
      type: 'planting',
      icon: 'seed',
      text: 'موسم مثالي لزراعة هذا المحصول'
    });
  } else if (crop.harvestMonths.includes(currentMonth)) {
    recommendations.push({
      type: 'harvesting',
      icon: 'basket',
      text: 'موسم مثالي لحصاد هذا المحصول'
    });
  }
  
  return recommendations;
};

// Fonction pour générer un tableau de jours du mois
const getDaysInMonth = (month: number, year: number = new Date().getFullYear()) => {
  // Nombre de jours dans le mois
  const daysInMonth = new Date(year, month, 0).getDate();
  // Jour de la semaine du premier jour (0 = dimanche, 6 = samedi)
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  
  const days = [];
  // Ajouter des cases vides pour les jours précédant le premier jour du mois
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ day: '', isCurrentMonth: false, hasPlanting: false, hasHarvesting: false });
  }
  
  // Ajouter les jours du mois
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ 
      day: i, 
      isCurrentMonth: true,
      // Simuler des jours de plantation et de récolte
      hasPlanting: Math.random() > 0.7,
      hasHarvesting: Math.random() > 0.8
    });
  }
  
  return days;
};

const PlantingCalendar: React.FC<PlantingCalendarProps> = ({ weatherData }) => {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // Générer le calendrier du mois
  const calendarDays = getDaysInMonth(selectedMonth, selectedYear);

  // Get current season
  const getCurrentSeason = () => {
    const season = SEASONS.find(s => s.months.includes(selectedMonth));
    return season || SEASONS[0];
  };

  // Filter crops by selected category and relevance to current month
  const getFilteredCrops = () => {
    return CROPS.filter(crop => 
      (selectedCategory === 'all' || crop.category === selectedCategory) &&
      (crop.plantMonths.includes(selectedMonth) || crop.harvestMonths.includes(selectedMonth))
    );
  };

  // Get crops for a specific action (planting or harvesting) in current month
  const getCropsByAction = (action: 'plant' | 'harvest') => {
    return CROPS.filter(crop => 
      (selectedCategory === 'all' || crop.category === selectedCategory) &&
      (action === 'plant' ? crop.plantMonths.includes(selectedMonth) : crop.harvestMonths.includes(selectedMonth))
    );
  };

  // Get detailed crop if selected
  const getSelectedCropDetails = () => {
    return selectedCrop ? CROPS.find(crop => crop.id === selectedCrop) : null;
  };

  // Check if current temperature is ideal for selected crop
  const isTemperatureIdealForCrop = (crop: any) => {
    const currentTemp = weatherData.current.temp_c;
    return currentTemp >= crop.idealTemp.min && currentTemp <= crop.idealTemp.max;
  };

  // Get month name
  const getMonthName = (monthId: number) => {
    return MONTHS.find(m => m.id === monthId)?.name || '';
  };

  // Generate month buttons for the month carousel
  const monthButtons = MONTHS.map(month => {
    const season = SEASONS.find(s => s.months.includes(month.id));
    const isSelected = selectedMonth === month.id;
    
    return (
      <TouchableOpacity
        key={month.id}
        style={[
          styles.monthButton,
          { backgroundColor: isSelected ? season?.color : '#f5f5f5' },
          isSelected && styles.selectedMonthButton
        ]}
        onPress={() => setSelectedMonth(month.id)}
      >
        <Text
          style={[
            styles.monthName,
            isSelected && styles.selectedMonthName
          ]}
        >
          {month.shortName}
        </Text>
      </TouchableOpacity>
    );
  });

  const currentSeason = getCurrentSeason();
  const filteredCrops = getFilteredCrops();
  const plantingCrops = getCropsByAction('plant');
  const harvestingCrops = getCropsByAction('harvest');
  const selectedCropDetails = getSelectedCropDetails();

  // Add new state for AI analysis
  const [cropAnalysis, setCropAnalysis] = useState<CropAnalysis | null>(null);
  const [showAiDetail, setShowAiDetail] = useState(false);
  
  // Update analysis when crop selection changes
  useEffect(() => {
    const analysis = generateCropAnalysis(selectedCropDetails, weatherData);
    setCropAnalysis(analysis);
  }, [selectedCrop, weatherData]);
  
  // Animation value for insights
  const fadeAnimation = useSharedValue(0);
  
  useEffect(() => {
    fadeAnimation.value = withTiming(1, { duration: 500 });
  }, []);
  
  const insights = generatePlantingInsights(weatherData, selectedMonth);

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>تقويم الزراعة والحصاد</Text>
          <Text style={styles.subtitle}>
            دليل الزراعة والحصاد المناسب لمناخ تونس
          </Text>
        </View>

        {/* Season banner */}
        <View style={[styles.seasonBanner, { backgroundColor: currentSeason.color }]}>
          <Text style={styles.seasonName}>{currentSeason.label}</Text>
          <Text style={styles.seasonDescription}>
            {`موسم ${currentSeason.label} - ${getMonthName(selectedMonth)}`}
          </Text>
        </View>

        {/* AI Insights Banner */}
        <View style={styles.aiInsightsBanner}>
          <View style={styles.aiHeader}>
            <MaterialCommunityIcons
              name="brain"
              size={48}
              color="#fff"
            />
            <View style={styles.aiHeaderText}>
              <Text style={styles.aiTitle}>تحليل ذكي للظروف الزراعية</Text>
              <Text style={styles.aiSubtitle}>
                تحليل الظروف الجوية وتأثيرها على المحاصيل
              </Text>
            </View>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.insightsContainer}
          >
            {insights.map((insight, index) => (
              <View 
                key={index}
                style={[
                  styles.insightCard,
                  { 
                    backgroundColor: insight.type === 'warning' ? '#FFF3E0' : '#E8F5E9',
                    borderColor: insight.type === 'warning' ? '#FF9800' : '#4CAF50'
                  }
                ]}
              >
                <MaterialCommunityIcons
                  name={insight.icon as any}
                  size={24}
                  color={insight.type === 'warning' ? '#FF9800' : '#4CAF50'}
                />
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                <View style={styles.insightImpactContainer}>
                  <Text style={styles.insightImpactLabel}>مستوى التأثير:</Text>
                  <View style={styles.insightImpactBar}>
                    <View 
                      style={[
                        styles.insightImpactProgress, 
                        { 
                          width: `${insight.impactScore}%`,
                          backgroundColor: insight.type === 'warning' ? '#FF9800' : '#4CAF50' 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.insightImpactValue}>{insight.impactScore}%</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* NOUVEAU - Calendrier mensuel */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>تقويم الشهر</Text>
            <View style={styles.monthYearSelector}>
              <TouchableOpacity 
                style={styles.monthNavButton}
                onPress={() => {
                  if (selectedMonth === 1) {
                    setSelectedMonth(12);
                    setSelectedYear(selectedYear - 1);
                  } else {
                    setSelectedMonth(selectedMonth - 1);
                  }
                }}
              >
                <MaterialCommunityIcons name="chevron-left" size={24} color={theme.colors.primary.dark} />
              </TouchableOpacity>
              
              <Text style={styles.monthYearText}>
                {MONTHS.find(m => m.id === selectedMonth)?.name} {selectedYear}
              </Text>
              
              <TouchableOpacity 
                style={styles.monthNavButton}
                onPress={() => {
                  if (selectedMonth === 12) {
                    setSelectedMonth(1);
                    setSelectedYear(selectedYear + 1);
                  } else {
                    setSelectedMonth(selectedMonth + 1);
                  }
                }}
              >
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.primary.dark} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Jours de la semaine */}
          <View style={styles.weekdaysRow}>
            <Text style={styles.weekdayText}>أحد</Text>
            <Text style={styles.weekdayText}>إثنين</Text>
            <Text style={styles.weekdayText}>ثلاثاء</Text>
            <Text style={styles.weekdayText}>أربعاء</Text>
            <Text style={styles.weekdayText}>خميس</Text>
            <Text style={styles.weekdayText}>جمعة</Text>
            <Text style={styles.weekdayText}>سبت</Text>
          </View>
          
          {/* Grille du calendrier */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => (
              <TouchableOpacity 
                key={`day-${index}`}
                style={[
                  styles.calendarDay,
                  !day.isCurrentMonth && styles.calendarDayInactive,
                  selectedDay === day.day && styles.calendarDaySelected
                ]}
                onPress={() => day.isCurrentMonth && setSelectedDay(day.day as number)}
                disabled={!day.isCurrentMonth}
              >
                <Text style={[
                  styles.calendarDayText,
                  !day.isCurrentMonth && styles.calendarDayTextInactive,
                  selectedDay === day.day && styles.calendarDayTextSelected
                ]}>
                  {day.day}
                </Text>
                
                {/* Indicateurs de plantation et récolte */}
                {day.isCurrentMonth && (
                  <View style={styles.dayIndicators}>
                    {day.hasPlanting && (
                      <View style={[styles.dayIndicator, { backgroundColor: '#4CAF50' }]} />
                    )}
                    {day.hasHarvesting && (
                      <View style={[styles.dayIndicator, { backgroundColor: '#FF9800' }]} />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Légende du calendrier */}
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>مناسب للزراعة</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>مناسب للحصاد</Text>
            </View>
          </View>
        </View>
        
        {/* Month selector */}
        <View style={styles.monthSelector}>
          <Text style={styles.sectionTitle}>اختر الشهر</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthsContainer}
          >
            {monthButtons}
          </ScrollView>
        </View>

        {/* Category filter */}
        <View style={styles.categorySelector}>
          <Text style={styles.sectionTitle}>تصفية حسب النوع</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CROP_CATEGORIES.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.selectedCategoryButton
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <MaterialCommunityIcons
                  name={category.icon as any}
                  size={18}
                  color={selectedCategory === category.id ? '#fff' : theme.colors.primary.dark}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.selectedCategoryText
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Weather conditions */}
        <View style={styles.weatherSummary}>
          <Text style={styles.sectionTitle}>أحوال الطقس الحالية</Text>
          <View style={styles.weatherConditions}>
            <View style={styles.weatherCondition}>
              <MaterialCommunityIcons
                name="thermometer"
                size={22}
                color={theme.colors.primary.dark}
              />
              <Text style={styles.weatherValue}>
                {Math.round(weatherData.current.temp_c)}°C
              </Text>
            </View>

            <View style={styles.weatherCondition}>
              <MaterialCommunityIcons
                name="water-percent"
                size={22}
                color={theme.colors.primary.dark}
              />
              <Text style={styles.weatherValue}>
                {weatherData.current.humidity}%
              </Text>
            </View>

            <View style={styles.weatherCondition}>
              <MaterialCommunityIcons
                name="weather-windy"
                size={22}
                color={theme.colors.primary.dark}
              />
              <Text style={styles.weatherValue}>
                {Math.round(weatherData.current.wind_kph)} كم/س
              </Text>
            </View>
          </View>
        </View>

        {/* Recommandations basées sur le jour sélectionné */}
        {selectedDay && (
          <View style={styles.dayRecommendations}>
            <Text style={styles.dayRecommendationsTitle}>
              توصيات ليوم {selectedDay} {MONTHS.find(m => m.id === selectedMonth)?.name}
            </Text>
            
            <View style={styles.recommendationCards}>
              <View style={styles.recommendationCard}>
                <MaterialCommunityIcons name="seed" size={24} color="#4CAF50" />
                <Text style={styles.recommendationTitle}>مناسب لزراعة</Text>
                <Text style={styles.recommendationText}>الطماطم، الفلفل، البطاطس</Text>
              </View>
              
              <View style={styles.recommendationCard}>
                <MaterialCommunityIcons name="basket" size={24} color="#FF9800" />
                <Text style={styles.recommendationTitle}>مناسب لحصاد</Text>
                <Text style={styles.recommendationText}>البصل، الجزر، الخيار</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* AI Crop Analysis */}
        {selectedCropDetails && cropAnalysis && (
          <View style={styles.cropAnalysisContainer}>
            <View style={styles.compatibilityScore}>
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreHeaderText}>ملاءمة المحصول للظروف الحالية</Text>
              </View>
              <View style={styles.scoreContent}>
                <View style={styles.overallScoreContainer}>
                  <View style={[
                    styles.scoreCircle, 
                    { borderColor: cropAnalysis.overallScore > 80 ? '#4CAF50' : 
                                   cropAnalysis.overallScore > 60 ? '#FF9800' : '#F44336' }
                  ]}>
                    <Text style={[
                      styles.scoreText, 
                      { color: cropAnalysis.overallScore > 80 ? '#4CAF50' : 
                              cropAnalysis.overallScore > 60 ? '#FF9800' : '#F44336' }
                    ]}>
                      {cropAnalysis.overallScore}%
                    </Text>
                  </View>
                  <Text style={styles.scoreLabel}>ملاءمة إجمالية</Text>
                </View>
                
                <View style={styles.subScoresContainer}>
                  <View style={styles.subScoreItem}>
                    <Text style={styles.subScoreLabel}>ملاءمة درجة الحرارة</Text>
                    <View style={styles.subScoreProgressContainer}>
                      <View style={styles.subScoreProgressBg}>
                        <View style={[
                          styles.subScoreProgress, 
                          { 
                            width: `${cropAnalysis.temperatureScore}%`,
                            backgroundColor: cropAnalysis.temperatureScore > 80 ? '#4CAF50' : 
                                            cropAnalysis.temperatureScore > 60 ? '#FF9800' : '#F44336'
                          }
                        ]} />
                      </View>
                      <Text style={styles.subScoreValue}>{cropAnalysis.temperatureScore}%</Text>
                    </View>
                  </View>
                  
                  <View style={styles.subScoreItem}>
                    <Text style={styles.subScoreLabel}>ملاءمة الموسم</Text>
                    <View style={styles.subScoreProgressContainer}>
                      <View style={styles.subScoreProgressBg}>
                        <View style={[
                          styles.subScoreProgress, 
                          { 
                            width: `${cropAnalysis.seasonScore}%`,
                            backgroundColor: cropAnalysis.seasonScore > 80 ? '#4CAF50' : 
                                            cropAnalysis.seasonScore > 60 ? '#FF9800' : '#F44336'
                          }
                        ]} />
                      </View>
                      <Text style={styles.subScoreValue}>{cropAnalysis.seasonScore}%</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Growth and Risks Sections */}
              <View style={styles.cropInsightsContainer}>
                <View style={styles.insightsCard}>
                  <View style={styles.growthMetrics}>
                    <View style={styles.growthRateContainer}>
                      <MaterialCommunityIcons 
                        name="sprout" 
                        size={24} 
                        color={cropAnalysis.growthRate === 'سريع' ? '#4CAF50' : 
                               cropAnalysis.growthRate === 'متوسط' ? '#FF9800' : '#F44336'} 
                      />
                      <Text style={styles.growthRateText}>
                        معدل النمو المتوقع: <Text style={styles.growthRateValue}>{cropAnalysis.growthRate}</Text>
                      </Text>
                    </View>
                    
                    {cropAnalysis.risks.length > 0 && (
                      <View style={styles.risksContainer}>
                        <Text style={styles.risksTitle}>المخاطر المحتملة:</Text>
                        {cropAnalysis.risks.map((risk: string, index: number) => (
                          <View key={`risk-${index}`} style={styles.riskItem}>
                            <MaterialCommunityIcons name="alert-circle" size={16} color="#F44336" />
                            <Text style={styles.riskText}>{risk}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.recommendationsCard}>
                    <Text style={styles.recommendationsTitle}>توصيات الذكاء الاصطناعي</Text>
                    {cropAnalysis.recommendations.map((recommendation: any, index: number) => (
                      <View key={`rec-${index}`} style={styles.recommendationItem}>
                        <View style={[
                          styles.recommendationIcon,
                          { 
                            backgroundColor: recommendation.type === 'optimal' ? '#E8F5E9' :
                                            recommendation.type === 'warning' ? '#FFF3E0' : '#E3F2FD'
                          }
                        ]}>
                          <MaterialCommunityIcons 
                            name={recommendation.icon as any} 
                            size={20} 
                            color={recommendation.type === 'optimal' ? '#4CAF50' :
                                  recommendation.type === 'warning' ? '#FF9800' : '#2196F3'} 
                          />
                        </View>
                        <Text style={styles.recommendationText}>{recommendation.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
            
            <View style={[
              styles.temperatureAlert,
              { 
                backgroundColor: isTemperatureIdealForCrop(selectedCropDetails) ? 
                  '#E8F5E9' : '#FEE7E6' 
              }
            ]}>
              <MaterialCommunityIcons
                name={isTemperatureIdealForCrop(selectedCropDetails) ? 
                  "check-circle" : "alert-circle"}
                size={20}
                color={isTemperatureIdealForCrop(selectedCropDetails) ? 
                  '#4CAF50' : '#F44336'}
              />
              <Text style={[
                styles.temperatureAlertText,
                { 
                  color: isTemperatureIdealForCrop(selectedCropDetails) ? 
                    '#4CAF50' : '#F44336' 
                }
              ]}>
                {isTemperatureIdealForCrop(selectedCropDetails) ?
                  `درجة الحرارة الحالية مناسبة لـ${selectedCropDetails.name}` :
                  `درجة الحرارة الحالية غير مثالية لـ${selectedCropDetails.name}`}
              </Text>
            </View>
            
            <View style={styles.cropNotes}>
              <Text style={styles.cropNotesLabel}>ملاحظات:</Text>
              <Text style={styles.cropNotesText}>{selectedCropDetails.notes}</Text>
            </View>
          </View>
        )}
        
        {/* Seasonal Tips */}
        <View style={styles.seasonalTips}>
          <Text style={styles.sectionTitle}>نصائح موسمية</Text>
          
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <MaterialCommunityIcons
                name={currentSeason.id === 'summer' ? "weather-sunny" : 
                      currentSeason.id === 'winter' ? "snowflake" :
                      currentSeason.id === 'spring' ? "flower" : "leaf-maple"}
                size={28}
                color="#fff"
                style={{ backgroundColor: currentSeason.color, padding: 12, borderRadius: 24 }}
              />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>
                {currentSeason.id === 'summer' ? "نصائح لموسم الصيف" : 
                 currentSeason.id === 'winter' ? "نصائح لموسم الشتاء" :
                 currentSeason.id === 'spring' ? "نصائح لموسم الربيع" : "نصائح لموسم الخريف"}
              </Text>
              <Text style={styles.tipText}>
                {currentSeason.id === 'summer' ? 
                  "تأكد من توفير الري الكافي للمحاصيل. حماية النباتات من أشعة الشمس المباشرة في ساعات الذروة. تجنب الري في منتصف النهار لتقليل التبخر." : 
                 currentSeason.id === 'winter' ? 
                  "حماية المحاصيل الحساسة من الصقيع. تقليل كمية المياه للمحاصيل التي لا تحتاج إلى الكثير من الماء في الشتاء. الاستفادة من هطول الأمطار الموسمية." :
                 currentSeason.id === 'spring' ? 
                  "وقت مثالي لبدء معظم المحاصيل. مراقبة الآفات التي تظهر مع ارتفاع درجات الحرارة. الاستعداد للتقلبات المفاجئة في درجات الحرارة." : 
                  "موسم مناسب لزراعة المحاصيل الشتوية. الاستفادة من بقايا المحاصيل كسماد عضوي. مراقبة هطول الأمطار والاستعداد للتغيرات الموسمية."}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Espace supplémentaire en bas pour éviter que le contenu soit caché par le TabBar */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.neutral.gray.base,
    marginTop: 4,
    textAlign: 'right',
  },
  seasonBanner: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  seasonDescription: {
    fontSize: 14,
    color: '#fff',
  },
  monthSelector: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 12,
    textAlign: 'right',
  },
  monthsContainer: {
    paddingVertical: 8,
  },
  monthButton: {
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedMonthButton: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  monthName: {
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
  },
  selectedMonthName: {
    color: '#fff',
  },
  categorySelector: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategoryButton: {
    backgroundColor: theme.colors.primary.base,
    borderColor: theme.colors.primary.dark,
  },
  categoryText: {
    fontSize: 14,
    marginLeft: 6,
    color: theme.colors.primary.dark,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  weatherSummary: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  weatherConditions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherCondition: {
    alignItems: 'center',
  },
  weatherValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
  },
  activitySection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginRight: 8,
  },
  emptyCrops: {
    padding: 16,
    alignItems: 'center',
  },
  emptyCropsText: {
    fontSize: 14,
    color: theme.colors.neutral.gray.base,
    textAlign: 'center',
  },
  cropsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  cropCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    width: '30%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCropCard: {
    borderColor: theme.colors.primary.base,
    borderWidth: 2,
    backgroundColor: '#f0f8ff',
  },
  cropIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  cropName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  cropBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cropBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cropDetailsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary.light,
  },
  cropDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
    marginBottom: 16,
  },
  cropDetailsIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cropDetailsName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  cropDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cropDetailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
    minWidth: 100,
    textAlign: 'right',
  },
  cropDetailValue: {
    fontSize: 14,
    color: theme.colors.neutral.gray.base,
    flex: 1,
    textAlign: 'right',
  },
  cropDetailMonths: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: 1,
  },
  cropDetailMonth: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 4,
    marginBottom: 4,
  },
  cropDetailMonthText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  temperatureAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  temperatureAlertText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    textAlign: 'right',
  },
  cropNotes: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  cropNotesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 8,
    textAlign: 'right',
  },
  cropNotesText: {
    fontSize: 14,
    color: theme.colors.neutral.gray.dark,
    lineHeight: 20,
    textAlign: 'right',
  },
  seasonalTips: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    marginBottom: 100,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tipIcon: {
    marginLeft: 16,
  },
  tipContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 8,
    textAlign: 'right',
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.neutral.gray.dark,
    lineHeight: 20,
    textAlign: 'right',
  },
  aiInsightsBanner: {
    backgroundColor: theme.colors.primary.dark,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
  },
  aiSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'right',
  },
  insightsContainer: {
    paddingVertical: 8,
  },
  insightCard: {
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 280,
    borderWidth: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'right',
  },
  insightDescription: {
    fontSize: 14,
    color: theme.colors.neutral.gray.base,
    marginBottom: 12,
    textAlign: 'right',
  },
  insightImpactContainer: {
    marginTop: 8,
  },
  insightImpactLabel: {
    fontSize: 12,
    color: theme.colors.neutral.gray.base,
    marginBottom: 4,
    textAlign: 'right',
  },
  insightImpactBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  insightImpactProgress: {
    height: '100%',
    borderRadius: 3,
  },
  insightImpactValue: {
    fontSize: 12,
    color: theme.colors.neutral.gray.base,
    marginTop: 4,
    textAlign: 'right',
  },
  cropAnalysisContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginHorizontal: 16,
  },
  compatibilityScore: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
  },
  scoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overallScoreContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: theme.colors.neutral.gray.base,
    textAlign: 'center',
  },
  subScoresContainer: {
    flex: 1,
  },
  subScoreItem: {
    marginBottom: 12,
  },
  subScoreLabel: {
    fontSize: 12,
    color: theme.colors.neutral.gray.base,
    marginBottom: 4,
    textAlign: 'right',
  },
  subScoreProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subScoreProgressBg: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 2,
  },
  subScoreProgress: {
    height: '100%',
    borderRadius: 3,
  },
  subScoreValue: {
    fontSize: 12,
    color: theme.colors.neutral.gray.dark,
    textAlign: 'right',
  },
  cropInsightsContainer: {
    marginTop: 16,
  },
  insightsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  growthMetrics: {
    marginBottom: 16,
  },
  growthRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  growthRateText: {
    fontSize: 14,
    color: theme.colors.neutral.gray.dark,
    marginRight: 8,
    textAlign: 'right',
  },
  growthRateValue: {
    fontWeight: 'bold',
  },
  risksContainer: {
    marginTop: 8,
  },
  risksTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
    marginBottom: 8,
    textAlign: 'right',
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'flex-end',
  },
  riskText: {
    fontSize: 14,
    color: theme.colors.neutral.gray.dark,
    marginRight: 8,
    textAlign: 'right',
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 12,
    textAlign: 'right',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'flex-end',
  },
  recommendationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  recommendationText: {
    fontSize: 12,
    color: theme.colors.neutral.gray.base,
    textAlign: 'center',
    marginTop: 4,
  },
  calendarSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  calendarHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthYearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  monthNavButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginHorizontal: 16,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.neutral.gray.base,
    fontWeight: 'bold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: '14%', // 7 jours par semaine
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  calendarDayInactive: {
    backgroundColor: 'transparent',
  },
  calendarDaySelected: {
    backgroundColor: `${theme.colors.primary.base}20`,
    borderWidth: 2,
    borderColor: theme.colors.primary.base,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
  },
  calendarDayTextInactive: {
    color: theme.colors.neutral.gray.light,
  },
  calendarDayTextSelected: {
    color: theme.colors.primary.dark,
  },
  dayIndicators: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.neutral.gray.base,
  },
  dayRecommendations: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  dayRecommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 16,
    textAlign: 'right',
  },
  recommendationCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recommendationCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

export default PlantingCalendar; 