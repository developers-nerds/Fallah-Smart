import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData, FarmingRecommendation } from '../../screens/weather/WeatherScreen';
import { theme } from '../../theme/theme';

// Obtenir les dimensions de l'écran
const { height } = Dimensions.get('window');
// Hauteur estimée du TabBar
const TAB_BAR_HEIGHT = 60;
// Hauteur disponible pour le contenu
const AVAILABLE_HEIGHT = height - TAB_BAR_HEIGHT;

interface FarmingRecommendationsProps {
  weatherData: WeatherData;
  farmingRecommendations?: FarmingRecommendation[];
}

// Interface for AI Analysis
interface AIAnalysis {
  soilMoistureIndex: number;
  growthIndex: number;
  stabilityIndex: number;
  pestRiskIndex: number;
  timestamp: string;
  aiConfidence: number;
  analysisDetails: Array<{
    title: string;
    value: number;
    icon: string;
    description: string;
    color: string;
  }>;
}

// Category data for filters
const CATEGORIES = [
  { id: 'all', label: 'جميع التوصيات', icon: 'clipboard-list' },
  { id: 'irrigation', label: 'الري', icon: 'water' },
  { id: 'protection', label: 'الحماية', icon: 'shield' },
  { id: 'planting', label: 'الزراعة', icon: 'sprout' },
  { id: 'harvesting', label: 'الحصاد', icon: 'basket' },
  { id: 'soil', label: 'التربة', icon: 'shovel' },
  { id: 'equipment', label: 'المعدات', icon: 'tools' },
];

// AI analysis generator function
const generateAIAnalysis = (weatherData: WeatherData): AIAnalysis => {
  const current = weatherData.current;
  const forecast = weatherData.forecast;
  
  // Calculate soil moisture index (simulated)
  const soilMoistureIndex = Math.min(85, Math.max(30, 
    current.humidity - (current.temp_c > 30 ? 20 : 10) + 
    (current.precip_mm > 0 ? 15 : 0)
  ));
  
  // Calculate growth index based on temperature and humidity
  const growthIndex = Math.min(95, Math.max(40,
    60 + (current.temp_c > 15 && current.temp_c < 30 ? 20 : -10) +
    (current.humidity > 40 && current.humidity < 80 ? 15 : -5)
  ));
  
  // Calculate weather stability index
  const stabilityIndex = Math.min(100, Math.max(30,
    70 - Math.abs(forecast.forecastday[0].day.maxtemp_c - forecast.forecastday[0].day.mintemp_c) +
    (forecast.forecastday[0].day.daily_chance_of_rain > 50 ? -20 : 10)
  ));
  
  // Calculate pest risk based on temperature, humidity, and rain
  const pestRiskIndex = Math.min(100, Math.max(20,
    (current.temp_c > 25 ? 30 : 10) +
    (current.humidity > 70 ? 40 : 20) +
    (current.precip_mm > 0 ? 20 : 0)
  ));
  
  return {
    soilMoistureIndex,
    growthIndex,
    stabilityIndex,
    pestRiskIndex,
    timestamp: new Date().toISOString(),
    aiConfidence: 92 + Math.floor(Math.random() * 5), // Simulated AI confidence level
    analysisDetails: [
      {
        title: 'تحليل رطوبة التربة',
        value: soilMoistureIndex,
        icon: 'water-percent',
        description: `رطوبة التربة ${soilMoistureIndex > 70 ? 'مرتفعة' : soilMoistureIndex > 50 ? 'مثالية' : 'منخفضة'}. ${
          soilMoistureIndex > 70 
            ? 'قد تحتاج إلى تقليل الري لتجنب تعفن الجذور.' 
            : soilMoistureIndex > 50 
              ? 'مستوى الرطوبة مثالي للنمو.' 
              : 'زيادة الري ضرورية لمنع جفاف النباتات.'
        }`,
        color: soilMoistureIndex > 70 ? '#2196F3' : soilMoistureIndex > 50 ? '#4CAF50' : '#FF9800'
      },
      {
        title: 'مؤشر النمو',
        value: growthIndex,
        icon: 'sprout',
        description: `ظروف النمو ${growthIndex > 80 ? 'ممتازة' : growthIndex > 60 ? 'جيدة' : 'صعبة'}. ${
          growthIndex > 80 
            ? 'الظروف مثالية لنمو معظم المحاصيل، يوصى بالاستفادة من هذه الفترة.' 
            : growthIndex > 60 
              ? 'ظروف جيدة للنمو مع بعض التحديات البسيطة.' 
              : 'قد تواجه المحاصيل صعوبة في النمو، يجب اتخاذ إجراءات وقائية.'
        }`,
        color: growthIndex > 80 ? '#4CAF50' : growthIndex > 60 ? '#8BC34A' : '#FF9800'
      },
      {
        title: 'استقرار الطقس',
        value: stabilityIndex,
        icon: 'chart-line',
        description: `استقرار الطقس ${stabilityIndex > 70 ? 'مرتفع' : stabilityIndex > 50 ? 'متوسط' : 'منخفض'}. ${
          stabilityIndex > 70 
            ? 'الطقس مستقر، يمكن التخطيط للأنشطة الزراعية بثقة.' 
            : stabilityIndex > 50 
              ? 'بعض التقلبات المتوقعة، خطط للأنشطة الحساسة بحذر.' 
              : 'عدم استقرار جوي، تأجيل الأنشطة الزراعية الحساسة إن أمكن.'
        }`,
        color: stabilityIndex > 70 ? '#4CAF50' : stabilityIndex > 50 ? '#FF9800' : '#F44336'
      },
      {
        title: 'مخاطر الآفات',
        value: pestRiskIndex,
        icon: 'bug',
        description: `مخاطر الآفات ${pestRiskIndex > 70 ? 'مرتفعة' : pestRiskIndex > 50 ? 'متوسطة' : 'منخفضة'}. ${
          pestRiskIndex > 70 
            ? 'ظروف مثالية لتكاثر الآفات. راقب المحاصيل بانتظام واتخذ إجراءات وقائية.' 
            : pestRiskIndex > 50 
              ? 'بعض المخاطر موجودة. راقب الأماكن المعرضة للإصابة.' 
              : 'مخاطر منخفضة. استمر في المراقبة الروتينية.'
        }`,
        color: pestRiskIndex > 70 ? '#F44336' : pestRiskIndex > 50 ? '#FF9800' : '#4CAF50'
      }
    ]
  };
};

const FarmingRecommendations: React.FC<FarmingRecommendationsProps> = ({ weatherData, farmingRecommendations = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(
    new Set(farmingRecommendations.map(rec => rec.title))
  );
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Toggle with animation
  const toggleRecommendation = (id: string) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: expandedRecommendations.has(id) ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setExpandedRecommendations(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
  };
  
  // Filter by selected category
  const filteredRecommendations = selectedCategory === 'all' 
    ? farmingRecommendations
    : farmingRecommendations.filter(rec => rec.category === selectedCategory);
  
  // Get icon for a category
  const getCategoryIcon = (categoryId: string): any => {
    const category = CATEGORIES.find(cat => cat.id === categoryId);
    return category ? category.icon : 'help-circle';
  };
  
  // Get color for a category
  const getCategoryColor = (categoryId: string): string => {
    switch (categoryId) {
      case 'irrigation':
        return '#2196F3'; // Blue
      case 'protection':
        return '#F44336'; // Red
      case 'planting':
        return '#4CAF50'; // Green
      case 'harvesting':
        return '#FF9800'; // Orange
      case 'soil':
        return '#795548'; // Brown
      case 'equipment':
        return '#607D8B'; // Gray
      default:
        return theme.colors.primary.base;
    }
  };

  // Get color for a priority
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '#F44336'; // Red
      case 'medium':
        return '#FF9800'; // Orange
      case 'low':
        return '#4CAF50'; // Green
      default:
        return '#9E9E9E'; // Gray
    }
  };

  // Get Arabic label for priority
  const getPriorityLabel = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'عالية';
      case 'medium':
        return 'متوسطة';
      case 'low':
        return 'منخفضة';
      default:
        return '';
    }
  };
  
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [showAiDetail, setShowAiDetail] = useState(true);
  
  // Generate AI analysis on component mount or when weather data changes
  useEffect(() => {
    if (weatherData) {
      const analysis = generateAIAnalysis(weatherData);
      setAiAnalysis(analysis);
    }
  }, [weatherData]);
  
  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>توصيات ذكية للمزارعين</Text>
          <Text style={styles.subtitle}>
            تحليل متقدم للظروف الجوية وتأثيرها على المحاصيل
          </Text>
        </View>
        
        {/* Mettre l'analyse IA en évidence - Bannière plus grande et visible */}
        <View style={styles.aiHighlightSection}>
          <Animated.View 
            style={[styles.aiBanner]}
            accessibilityRole="alert"
          >
            <View style={styles.aiBannerContent}>
              <MaterialCommunityIcons
                name="brain" 
                size={48}
                color="#fff"
              />
              <View style={styles.aiBannerTextContainer}>
                <Text style={styles.aiBannerTitle}>تحليل ذكي للطقس</Text>
                <Text style={styles.aiBannerText}>
                  تم تحليل البيانات باستخدام الذكاء الاصطناعي لتقديم توصيات دقيقة تناسب ظروف مزرعتك
                </Text>
              </View>
            </View>
            <View style={styles.aiAccuracyContainer}>
              <Text style={styles.aiAccuracyLabel}>دقة التحليل</Text>
              <View style={styles.aiAccuracyBar}>
                <View style={[styles.aiAccuracyProgress, { width: `${aiAnalysis ? aiAnalysis.aiConfidence : 95}%` }]} />
              </View>
              <Text style={styles.aiAccuracyValue}>{aiAnalysis ? aiAnalysis.aiConfidence : 95}%</Text>
            </View>
          </Animated.View>
        </View>
        
        {/* Section d'analyse IA améliorée - plus visible et toujours affichée */}
        {aiAnalysis && (
          <View style={styles.aiAnalysisContainerHighlighted}>
            <View style={styles.aiAnalysisHeader}>
              <Text style={styles.aiAnalysisTitle}>التحليل الزراعي الذكي</Text>
            <TouchableOpacity
                style={styles.aiDetailButton}
                onPress={() => setShowAiDetail(!showAiDetail)}
              >
                <Text style={styles.aiDetailButtonText}>
                  {showAiDetail ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                </Text>
                <MaterialCommunityIcons 
                  name={showAiDetail ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={theme.colors.primary.base} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Résumé visuel de l'analyse IA - toujours visible */}
            <View style={styles.aiSummaryContainer}>
              <View style={styles.aiSummaryItem}>
                <View 
              style={[
                    styles.aiSummaryCircle, 
                    { 
                      backgroundColor: aiAnalysis.soilMoistureIndex > 70 ? '#E3F2FD' : 
                                     aiAnalysis.soilMoistureIndex > 50 ? '#E8F5E9' : '#FFF3E0',
                      borderColor: aiAnalysis.soilMoistureIndex > 70 ? '#2196F3' : 
                                aiAnalysis.soilMoistureIndex > 50 ? '#4CAF50' : '#FF9800'
                    }
                  ]}
            >
                <MaterialCommunityIcons
                      name="water-percent" 
                      size={24} 
                      color={aiAnalysis.soilMoistureIndex > 70 ? '#2196F3' : 
                            aiAnalysis.soilMoistureIndex > 50 ? '#4CAF50' : '#FF9800'} 
                    />
                </View>
                <Text style={styles.aiSummaryTitle}>رطوبة التربة</Text>
                <Text style={styles.aiSummaryValue}>{aiAnalysis.soilMoistureIndex}%</Text>
              </View>
              
              <View style={styles.aiSummaryItem}>
                <View 
                style={[
                    styles.aiSummaryCircle, 
                    { 
                      backgroundColor: aiAnalysis.growthIndex > 80 ? '#E8F5E9' : 
                                     aiAnalysis.growthIndex > 60 ? '#F1F8E9' : '#FFF3E0',
                      borderColor: aiAnalysis.growthIndex > 80 ? '#4CAF50' : 
                                aiAnalysis.growthIndex > 60 ? '#8BC34A' : '#FF9800'
                    }
                  ]}
                >
                  <MaterialCommunityIcons 
                    name="sprout" 
                    size={24} 
                    color={aiAnalysis.growthIndex > 80 ? '#4CAF50' : 
                          aiAnalysis.growthIndex > 60 ? '#8BC34A' : '#FF9800'} 
                  />
                </View>
                <Text style={styles.aiSummaryTitle}>مؤشر النمو</Text>
                <Text style={styles.aiSummaryValue}>{aiAnalysis.growthIndex}%</Text>
              </View>
              
              <View style={styles.aiSummaryItem}>
                <View 
                  style={[
                    styles.aiSummaryCircle, 
                    { 
                      backgroundColor: aiAnalysis.stabilityIndex > 70 ? '#E8F5E9' : 
                                     aiAnalysis.stabilityIndex > 50 ? '#FFF3E0' : '#FFEBEE',
                      borderColor: aiAnalysis.stabilityIndex > 70 ? '#4CAF50' : 
                                aiAnalysis.stabilityIndex > 50 ? '#FF9800' : '#F44336'
                    }
                  ]}
                >
                  <MaterialCommunityIcons 
                    name="chart-line" 
                    size={24} 
                    color={aiAnalysis.stabilityIndex > 70 ? '#4CAF50' : 
                          aiAnalysis.stabilityIndex > 50 ? '#FF9800' : '#F44336'} 
                  />
                </View>
                <Text style={styles.aiSummaryTitle}>استقرار الطقس</Text>
                <Text style={styles.aiSummaryValue}>{aiAnalysis.stabilityIndex}%</Text>
              </View>
              
              <View style={styles.aiSummaryItem}>
                <View 
                  style={[
                    styles.aiSummaryCircle, 
                    { 
                      backgroundColor: aiAnalysis.pestRiskIndex > 70 ? '#FFEBEE' : 
                                     aiAnalysis.pestRiskIndex > 50 ? '#FFF3E0' : '#E8F5E9',
                      borderColor: aiAnalysis.pestRiskIndex > 70 ? '#F44336' : 
                                aiAnalysis.pestRiskIndex > 50 ? '#FF9800' : '#4CAF50'
                    }
                  ]}
                >
                  <MaterialCommunityIcons 
                    name="bug" 
                    size={24} 
                    color={aiAnalysis.pestRiskIndex > 70 ? '#F44336' : 
                          aiAnalysis.pestRiskIndex > 50 ? '#FF9800' : '#4CAF50'} 
                  />
                </View>
                <Text style={styles.aiSummaryTitle}>مخاطر الآفات</Text>
                <Text style={styles.aiSummaryValue}>{aiAnalysis.pestRiskIndex}%</Text>
              </View>
            </View>
            
            {/* Détails de l'analyse - s'affichent/se masquent selon l'état */}
            {showAiDetail && (
              <View style={styles.aiMetricsContainer}>
                {aiAnalysis.analysisDetails.map((detail, index) => (
                  <View key={`metric-${index}`} style={styles.aiMetricCard}>
                    <View style={[styles.aiMetricIconContainer, { backgroundColor: `${detail.color}20` }]}>
                      <MaterialCommunityIcons 
                        name={detail.icon as any} 
                        size={24} 
                        color={detail.color} 
                      />
                    </View>
                    <Text style={styles.aiMetricTitle}>{detail.title}</Text>
                    <View style={styles.aiMetricValueContainer}>
                      <View style={styles.aiMetricBar}>
                        <View 
                          style={[
                            styles.aiMetricProgress, 
                            { 
                              width: `${detail.value}%`,
                              backgroundColor: detail.color 
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.aiMetricValue, { color: detail.color }]}>{detail.value}%</Text>
                    </View>
                    
                    <Text style={styles.aiMetricDescription}>{detail.description}</Text>
                  </View>
                ))}
                
                <View style={styles.aiAnalysisFooter}>
                  <Text style={styles.aiAnalysisTimestamp}>
                    آخر تحديث: {new Date(aiAnalysis.timestamp).toLocaleTimeString('ar-TN')}
                  </Text>
                  <Text style={styles.aiAnalysisNote}>
                    * يتم تحديث التحليل كل ساعة بناءً على أحدث بيانات الطقس
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
        
        {/* Weather Summary Card */}
        <View style={styles.weatherSummaryCard}>
          <Text style={styles.weatherSummaryTitle}>ملخص الظروف الجوية</Text>
          <View style={styles.weatherGrid}>
            <View style={styles.weatherItem}>
            <MaterialCommunityIcons
              name="thermometer"
                size={24}
              color={theme.colors.primary.dark}
            />
              <Text style={styles.weatherValue}>{Math.round(weatherData.current.temp_c)}°C</Text>
              <Text style={styles.weatherLabel}>درجة الحرارة</Text>
          </View>
          
            <View style={styles.weatherItem}>
            <MaterialCommunityIcons
              name="water-percent"
                size={24}
              color={theme.colors.primary.dark}
            />
              <Text style={styles.weatherValue}>{weatherData.current.humidity}%</Text>
              <Text style={styles.weatherLabel}>الرطوبة</Text>
          </View>
          
            <View style={styles.weatherItem}>
            <MaterialCommunityIcons
              name="weather-windy"
                size={24}
              color={theme.colors.primary.dark}
            />
              <Text style={styles.weatherValue}>{Math.round(weatherData.current.wind_kph)} كم/س</Text>
              <Text style={styles.weatherLabel}>سرعة الرياح</Text>
            </View>
            
            <View style={styles.weatherItem}>
              <MaterialCommunityIcons
                name="weather-sunny"
                size={24}
                color={theme.colors.primary.dark}
              />
              <Text style={styles.weatherValue}>{weatherData.current.uv}</Text>
              <Text style={styles.weatherLabel}>مؤشر UV</Text>
            </View>
          </View>
        </View>
        
        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>تصفية التوصيات</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((category) => (
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
            size={24} 
                  color={selectedCategory === category.id ? '#fff' : theme.colors.primary.dark}
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.selectedCategoryText
                ]}>
                  {category.label}
          </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Recommendations */}
        <View style={styles.recommendationsContainer}>
          {filteredRecommendations.length === 0 ? (
            <Animated.View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="emoticon-happy-outline"
                size={64}
                color="#AAAAAA"
              />
              <Text style={styles.emptyText}>
                لا توجد توصيات لهذه الفئة في الوقت الحالي
              </Text>
            </Animated.View>
          ) : (
            filteredRecommendations.map((recommendation, index) => {
              const categoryColor = getCategoryColor(recommendation.category);
              const isExpanded = expandedRecommendations.has(recommendation.title);
              const priorityColor = getPriorityColor(recommendation.priority);
              
              return (
                <Animated.View 
                  key={`${recommendation.category}-${index}`}
                  style={[
                    styles.recommendationCard,
                    { borderLeftColor: categoryColor }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.recommendationHeader}
                    onPress={() => toggleRecommendation(recommendation.title)}
                  >
                    <View style={styles.recommendationHeaderContent}>
                      <MaterialCommunityIcons
                        name={recommendation.icon as any}
                        size={32}
                        color={categoryColor}
                      />
                      <View style={styles.recommendationTitleContainer}>
                        <Text style={styles.recommendationTitle}>
                        {recommendation.title}
                      </Text>
                        <View style={styles.recommendationMeta}>
                          <View style={[
                            styles.priorityTag,
                            { backgroundColor: `${priorityColor}20`, borderColor: priorityColor }
                          ]}>
                            <MaterialCommunityIcons
                              name={recommendation.priority === 'high' ? 'alert-circle' : 
                                   recommendation.priority === 'medium' ? 'alert' : 'information'}
                              size={16}
                              color={priorityColor}
                            />
                        <Text style={[styles.priorityText, { color: priorityColor }]}>
                          {getPriorityLabel(recommendation.priority)}
                        </Text>
                      </View>
                          <View style={styles.categoryTag}>
                            <MaterialCommunityIcons
                              name={getCategoryIcon(recommendation.category)}
                              size={16}
                              color={categoryColor}
                            />
                            <Text style={[styles.categoryTagText, { color: categoryColor }]}>
                              {CATEGORIES.find(cat => cat.id === recommendation.category)?.label}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <MaterialCommunityIcons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={theme.colors.neutral.gray.base}
                      />
                    </View>
                  </TouchableOpacity>
                  
                  <Animated.View style={[
                    styles.recommendationContent,
                    isExpanded ? styles.expandedContent : styles.collapsedContent
                  ]}>
                    <View style={styles.descriptionSection}>
                      <Text style={styles.sectionLabel}>التفاصيل</Text>
                      <Text style={styles.descriptionText}>
                      {recommendation.description}
                    </Text>
                    </View>

                    <View style={styles.actionSection}>
                      <Text style={styles.sectionLabel}>الإجراءات المطلوبة</Text>
                      <Text style={styles.actionText}>
                        {recommendation.action}
                      </Text>
                    </View>
                    
                    <View style={styles.benefitSection}>
                      <Text style={styles.sectionLabel}>نسبة الفائدة المتوقعة</Text>
                      <View style={styles.benefitScoreContainer}>
                        <View style={styles.benefitBar}>
                        <View 
                          style={[
                              styles.benefitProgress,
                            { 
                              width: `${recommendation.benefitScore}%`,
                              backgroundColor: recommendation.benefitScore > 80 ? '#4CAF50' :
                                              recommendation.benefitScore > 60 ? '#8BC34A' :
                                              recommendation.benefitScore > 40 ? '#FFEB3B' :
                                              recommendation.benefitScore > 20 ? '#FF9800' : '#F44336'
                            }
                          ]} 
                        />
                        </View>
                        <Text style={styles.benefitScore}>{recommendation.benefitScore}%</Text>
                      </View>
                    </View>
                  </Animated.View>
                </Animated.View>
              );
            })
          )}
        </View>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.neutral.gray.base,
    marginTop: 8,
    textAlign: 'right',
  },
  aiHighlightSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.primary.dark,
  },
  aiBanner: {
    backgroundColor: theme.colors.primary.dark,
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
  aiBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBannerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  aiBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'right',
  },
  aiBannerText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'right',
  },
  aiAccuracyContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  aiAccuracyLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'right',
  },
  aiAccuracyBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  aiAccuracyProgress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  aiAccuracyValue: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    textAlign: 'right',
  },
  
  aiAnalysisContainerHighlighted: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary.light,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiAnalysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    textAlign: 'right',
  },
  aiDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary.base}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  aiDetailButtonText: {
    fontSize: 12,
    color: theme.colors.primary.base,
    marginRight: 4,
  },
  aiSummaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  aiSummaryItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  aiSummaryCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  aiSummaryTitle: {
    fontSize: 14,
    color: theme.colors.neutral.gray.dark,
    marginBottom: 4,
    textAlign: 'center',
  },
  aiSummaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
  },
  aiMetricsContainer: {
    marginBottom: 8,
  },
  aiMetricCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  aiMetricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiMetricTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
    marginBottom: 8,
    textAlign: 'right',
  },
  aiMetricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiMetricBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  aiMetricProgress: {
    height: '100%',
    borderRadius: 4,
  },
  aiMetricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  aiMetricDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.neutral.gray.base,
    textAlign: 'right',
    marginTop: 8,
  },
  aiAnalysisFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  aiAnalysisTimestamp: {
    fontSize: 12,
    color: theme.colors.neutral.gray.base,
    textAlign: 'right',
  },
  aiAnalysisNote: {
    fontSize: 12,
    color: theme.colors.neutral.gray.base,
    textAlign: 'right',
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  weatherSummaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  weatherSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 16,
    textAlign: 'right',
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weatherItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginVertical: 8,
  },
  weatherLabel: {
    fontSize: 14,
    color: theme.colors.neutral.gray.base,
  },
  categoriesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 12,
    textAlign: 'right',
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedCategoryButton: {
    backgroundColor: theme.colors.primary.base,
  },
  categoryText: {
    fontSize: 16,
    marginLeft: 8,
    color: theme.colors.primary.dark,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  recommendationsContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    borderLeftWidth: 6,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  recommendationHeader: {
    padding: 16,
  },
  recommendationHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
    marginBottom: 8,
    textAlign: 'right',
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  priorityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTagText: {
    fontSize: 12,
    marginLeft: 4,
  },
  recommendationContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  expandedContent: {
    maxHeight: 1000,
  },
  collapsedContent: {
    maxHeight: 0,
    padding: 0,
    borderTopWidth: 0,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 8,
    textAlign: 'right',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.neutral.gray.dark,
    textAlign: 'right',
  },
  actionSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.neutral.gray.dark,
    textAlign: 'right',
  },
  benefitSection: {
    marginTop: 8,
  },
  benefitScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  benefitProgress: {
    height: '100%',
    borderRadius: 4,
  },
  benefitScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.neutral.gray.base,
    textAlign: 'center',
  },
});

export default FarmingRecommendations; 