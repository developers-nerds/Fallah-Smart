import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData } from '../../screens/weather/WeatherScreen';
import { theme } from '../../theme/theme';

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

const PlantingCalendar: React.FC<PlantingCalendarProps> = ({ weatherData }) => {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

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

  return (
    <ScrollView style={styles.container}>
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

      {/* Planting section */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="seed"
            size={24}
            color={theme.colors.primary.dark}
          />
          <Text style={styles.activityTitle}>محاصيل للزراعة هذا الشهر</Text>
        </View>
        
        {plantingCrops.length === 0 ? (
          <View style={styles.emptyCrops}>
            <Text style={styles.emptyCropsText}>
              لا توجد محاصيل موصى بزراعتها في {getMonthName(selectedMonth)}
            </Text>
          </View>
        ) : (
          <View style={styles.cropsGrid}>
            {plantingCrops.map(crop => (
              <TouchableOpacity
                key={`plant-${crop.id}`}
                style={[
                  styles.cropCard,
                  selectedCrop === crop.id && styles.selectedCropCard
                ]}
                onPress={() => setSelectedCrop(crop.id)}
              >
                <Text style={styles.cropIcon}>{crop.icon}</Text>
                <Text style={styles.cropName}>{crop.name}</Text>
                <View style={[
                  styles.cropBadge,
                  { backgroundColor: '#E8F5E9' }
                ]}>
                  <Text style={[styles.cropBadgeText, { color: '#4CAF50' }]}>
                    زراعة
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Harvesting section */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="basket"
            size={24}
            color={theme.colors.primary.dark}
          />
          <Text style={styles.activityTitle}>محاصيل للحصاد هذا الشهر</Text>
        </View>
        
        {harvestingCrops.length === 0 ? (
          <View style={styles.emptyCrops}>
            <Text style={styles.emptyCropsText}>
              لا توجد محاصيل جاهزة للحصاد في {getMonthName(selectedMonth)}
            </Text>
          </View>
        ) : (
          <View style={styles.cropsGrid}>
            {harvestingCrops.map(crop => (
              <TouchableOpacity
                key={`harvest-${crop.id}`}
                style={[
                  styles.cropCard,
                  selectedCrop === crop.id && styles.selectedCropCard
                ]}
                onPress={() => setSelectedCrop(crop.id)}
              >
                <Text style={styles.cropIcon}>{crop.icon}</Text>
                <Text style={styles.cropName}>{crop.name}</Text>
                <View style={[
                  styles.cropBadge,
                  { backgroundColor: '#FFF3E0' }
                ]}>
                  <Text style={[styles.cropBadgeText, { color: '#FF9800' }]}>
                    حصاد
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Selected crop details */}
      {selectedCropDetails && (
        <View style={styles.cropDetailsCard}>
          <View style={styles.cropDetailsHeader}>
            <Text style={styles.cropDetailsIcon}>{selectedCropDetails.icon}</Text>
            <Text style={styles.cropDetailsName}>{selectedCropDetails.name}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedCrop(null)}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.neutral.gray.base}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.cropDetailRow}>
            <Text style={styles.cropDetailLabel}>الفئة:</Text>
            <Text style={styles.cropDetailValue}>
              {CROP_CATEGORIES.find(cat => cat.id === selectedCropDetails.category)?.label || ''}
            </Text>
          </View>
          
          <View style={styles.cropDetailRow}>
            <Text style={styles.cropDetailLabel}>موسم الزراعة:</Text>
            <View style={styles.cropDetailMonths}>
              {selectedCropDetails.plantMonths.map(month => (
                <View 
                  key={`plant-${month}`}
                  style={[
                    styles.cropDetailMonth,
                    { backgroundColor: '#E8F5E9' }
                  ]}
                >
                  <Text style={[styles.cropDetailMonthText, { color: '#4CAF50' }]}>
                    {MONTHS.find(m => m.id === month)?.shortName || ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.cropDetailRow}>
            <Text style={styles.cropDetailLabel}>موسم الحصاد:</Text>
            <View style={styles.cropDetailMonths}>
              {selectedCropDetails.harvestMonths.map(month => (
                <View 
                  key={`harvest-${month}`}
                  style={[
                    styles.cropDetailMonth,
                    { backgroundColor: '#FFF3E0' }
                  ]}
                >
                  <Text style={[styles.cropDetailMonthText, { color: '#FF9800' }]}>
                    {MONTHS.find(m => m.id === month)?.shortName || ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.cropDetailRow}>
            <Text style={styles.cropDetailLabel}>درجة الحرارة المثالية:</Text>
            <Text style={styles.cropDetailValue}>
              {`${selectedCropDetails.idealTemp.min}°C - ${selectedCropDetails.idealTemp.max}°C`}
            </Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
});

export default PlantingCalendar; 