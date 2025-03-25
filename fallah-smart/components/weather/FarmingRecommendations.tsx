import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData, FarmingRecommendation } from '../../screens/weather/WeatherScreen';
import { theme } from '../../theme/theme';

interface FarmingRecommendationsProps {
  weatherData: WeatherData;
  farmingRecommendations?: FarmingRecommendation[];
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
  const getCategoryIcon = (categoryId: string): string => {
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
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">توصيات زراعية</Text>
        <Text style={styles.subtitle} accessibilityRole="text">نصائح زراعية بناءً على حالة الطقس الحالية</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        decelerationRate="fast"
        snapToAlignment="center"
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.selectedCategoryButton
            ]}
            onPress={() => setSelectedCategory(category.id)}
            accessibilityRole="button"
            accessibilityLabel={category.label}
            accessibilityHint={`اختر فئة ${category.label}`}
          >
            <MaterialCommunityIcons
              name={category.icon as any}
              size={20}
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
      
      <View style={styles.weatherSummary}>
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
      
      <Animated.View 
        style={[
          styles.aiBanner,
          { opacity: fadeAnim }
        ]}
        accessibilityRole="alert"
      >
        <MaterialCommunityIcons 
          name="brain" 
          size={24} 
          color="#fff" 
        />
        <Text style={styles.aiBannerText}>
          تم توليد هذه التوصيات بواسطة الذكاء الاصطناعي بناءً على بيانات الطقس الحالية
        </Text>
      </Animated.View>
      
      <View style={styles.recommendationsContainer}>
        {filteredRecommendations.length === 0 ? (
          <Animated.View 
            style={[styles.emptyContainer, { opacity: fadeAnim }]}
            accessibilityRole="alert"
          >
            <MaterialCommunityIcons
              name="emoticon-happy-outline"
              size={48}
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
                  { 
                    borderLeftColor: categoryColor,
                    opacity: fadeAnim,
                    transform: [{ scale: fadeAnim }]
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.recommendationHeader}
                  onPress={() => toggleRecommendation(recommendation.title)}
                  accessibilityRole="button"
                  accessibilityLabel={recommendation.title}
                  accessibilityHint={isExpanded ? 'اضغط للطي' : 'اضغط للتوسيع'}
                >
                  <View style={styles.recommendationTitle}>
                    <MaterialCommunityIcons
                      name={recommendation.icon as any}
                      size={24}
                      color={categoryColor}
                    />
                    <Text style={styles.recommendationTitleText}>
                      {recommendation.title}
                    </Text>
                  </View>
                  
                  <Animated.View style={[
                    styles.headerRight,
                    {
                      transform: [{
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '180deg']
                        })
                      }]
                    }
                  ]}>
                    <View style={[styles.priorityTag, { backgroundColor: priorityColor + '20', borderColor: priorityColor }]}>
                      <Text style={[styles.priorityText, { color: priorityColor }]}>
                        {getPriorityLabel(recommendation.priority)}
                      </Text>
                    </View>
                    
                    <MaterialCommunityIcons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={24}
                      color={theme.colors.neutral.gray.base}
                    />
                  </Animated.View>
                </TouchableOpacity>
                
                <Animated.View style={[
                  styles.recommendationContent,
                  isExpanded ? styles.expandedContent : styles.collapsedContent,
                  {
                    opacity: isExpanded ? fadeAnim : 0
                  }
                ]}>
                  <Text style={styles.recommendationDescription}>
                    {recommendation.description}
                  </Text>
                  
                  <View style={styles.actionContainer}>
                    <Text style={styles.actionTitle}>الإجراء المقترح:</Text>
                    <View style={styles.actionContent}>
                      <View style={styles.actionDot} />
                      <Text style={styles.actionText}>{recommendation.action}</Text>
                    </View>
                  </View>
                  
                  {/* Score indicator */}
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreTitle}>نسبة الفائدة:</Text>
                    <View style={styles.scoreBar}>
                      <View 
                        style={[
                          styles.scoreProgress, 
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
                    <Text style={styles.scoreValue}>{recommendation.benefitScore}%</Text>
                  </View>
                </Animated.View>
              </Animated.View>
            );
          })
        )}
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
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    borderColor: theme.colors.primary.dark,
    transform: [{ scale: 1.05 }],
  },
  categoryText: {
    fontSize: 15,
    marginLeft: 8,
    color: theme.colors.primary.dark,
    fontWeight: '600',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  weatherSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    borderRadius: 8,
    marginHorizontal: 16,
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
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.dark,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 20,
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
  aiBannerText: {
    color: '#fff',
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    lineHeight: 22,
  },
  recommendationsContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderLeftWidth: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
    marginLeft: 8,
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendationContent: {
    paddingHorizontal: 12,
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-in-out',
  },
  expandedContent: {
    paddingBottom: 12,
    maxHeight: 1000,
  },
  collapsedContent: {
    maxHeight: 0,
  },
  recommendationDescription: {
    fontSize: 14,
    color: theme.colors.neutral.gray.dark,
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 12,
  },
  actionContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 8,
    textAlign: 'right',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary.base,
    marginTop: 6,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 14,
    color: theme.colors.neutral.gray.dark,
    textAlign: 'right',
    flex: 1,
  },
  scoreContainer: {
    marginTop: 8,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 8,
    textAlign: 'right',
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 12,
    color: theme.colors.neutral.gray.dark,
    marginTop: 4,
    textAlign: 'right',
  },
});

export default FarmingRecommendations; 