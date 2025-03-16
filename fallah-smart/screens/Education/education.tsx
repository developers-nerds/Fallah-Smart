import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Dimensions, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
const API_URL = process.env.EXPO_PUBLIC_API_URL;
type EducationStackParamList = {
  Education: undefined;
  AnimalsLessons: undefined;
  CropsLessons: undefined;  
  VideoLesson: { videoUrl: string };
  QuizLesson: { lessonId: number };
};

type EducationScreenNavigationProp = StackNavigationProp<EducationStackParamList>;

const { width } = Dimensions.get('window');

const EducationScreen = () => {
  const navigation = useNavigation<EducationScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [scaleAnims] = useState(Array(2).fill(new Animated.Value(1)));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [categoryProgress, setCategoryProgress] = useState<{[key: string]: number}>({
    animals: 0,
    crops: 0
  });
  const [categoryStats, setCategoryStats] = useState<{[key: string]: { completed: number, total: number }}>({
    animals: { completed: 0, total: 0 },
    crops: { completed: 0, total: 0 }
  });
  const [categories, setCategories] = useState([
    {
      id: 1,
      title: 'حيوانات',
      iconName: 'cow' as const,
      screen: 'AnimalsLessons' as const,
      description: 'تعلم عن رعاية الحيوانات',
      totalItems: 0,
      color: '#4CAF50',
    },
    {
      id: 2,
      title: 'المحاصيل',
      iconName: 'seed' as const,
      screen: 'CropsLessons' as const,
      description: 'تعلم عن زراعة المحاصيل',
      totalItems: 0,
      color: '#FF9800',
    },
  ]);

  const fetchTotals = async () => {
    try {
      // Fetch animals count
      const animalsResponse = await axios.get(`${API_URL}/education/animals`);
      const animalsTotal = animalsResponse.data.length;
      
      // Fetch crops count
      const cropsResponse = await axios.get(`${API_URL}/education/crops`);
      const cropsTotal = cropsResponse.data.length;
      
      // Update categories with the correct totals
      setCategories(prev => prev.map(cat => {
        if (cat.id === 1) {
          return {...cat, totalItems: animalsTotal};
        } else if (cat.id === 2) {
          return {...cat, totalItems: cropsTotal};
        }
        return cat;
      }));
      
      // Update category stats with the correct totals
      setCategoryStats({
        animals: { completed: categoryStats.animals.completed, total: animalsTotal },
        crops: { completed: categoryStats.crops.completed, total: cropsTotal }
      });
      
    } catch (error) {
      console.error('Error fetching totals:', error);
    }
  };

  const calculateProgress = async () => {
    try {
      // Fetch user progress for animals
      let completedAnimals = 0;
      let animalScores = 0;
      
      // Get animal quizzes
      const animalQuizzesResponse = await axios.get(`${API_URL}/education/quizzes/type/animal`);
      const animalQuizzes = animalQuizzesResponse.data;
      
      for (const quiz of animalQuizzes) {
        // Check if user has completed this quiz
        const userProgressKey = `animal_score_${quiz.id}`;
        const score = await AsyncStorage.getItem(userProgressKey);
        if (score) {
          animalScores += parseFloat(score);
          completedAnimals++;
        }
      }
      
      // Fetch user progress for crops
      let completedCrops = 0;
      let cropScores = 0;
      
      // Get crop quizzes
      const cropQuizzesResponse = await axios.get(`${API_URL}/education/quizzes/type/crop`);
      const cropQuizzes = cropQuizzesResponse.data;
      
      for (const quiz of cropQuizzes) {
        // Check if user has completed this quiz
        const userProgressKey = `crop_score_${quiz.id}`;
        const score = await AsyncStorage.getItem(userProgressKey);
        if (score) {
          cropScores += parseFloat(score);
          completedCrops++;
        }
      }

      // Get totals from current state
      const totalAnimals = categoryStats.animals.total;
      const totalCrops = categoryStats.crops.total;

      // Calculate total progress including unanswered questions (counted as 0%)
      const totalAnimalProgress = totalAnimals > 0 ? animalScores / (totalAnimals * 100) : 0;
      const totalCropProgress = totalCrops > 0 ? cropScores / (totalCrops * 100) : 0;

      setCategoryProgress({
        animals: totalAnimalProgress,
        crops: totalCropProgress
      });

      setCategoryStats({
        animals: { completed: completedAnimals, total: totalAnimals },
        crops: { completed: completedCrops, total: totalCrops }
      });
    } catch (error) {
      console.error('Error calculating progress:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchTotals();
      await calculateProgress();
      setIsLoading(false);
      
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    };
    
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      calculateProgress();
      return () => {};
    }, [categoryStats.animals.total, categoryStats.crops.total])
  );

  const handlePressIn = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[theme.colors.primary.base, theme.colors.primary.dark]}
        style={styles.headerGradient}
      >
        <Text style={styles.header}>تعلم للفلاح</Text>
        <Text style={styles.subheader}>مرحباً بك في منصة التعلم الذكية</Text>
      </LinearGradient>
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.gifContainer}>
          {isLoading && (
            <ActivityIndicator 
              size="large" 
              color={theme.colors.primary.base} 
              style={styles.loader}
            />
          )}
          <Image
            source="https://gifdb.com/images/high/farmer-tractor-harvest-78fbnua36ze8jeie.gif"
            style={styles.gif}
            contentFit="cover"
            onLoad={() => setIsLoading(false)}
          />
        </View>

        <Text style={styles.sectionTitle}>اختر الفئة التي تريد التعلم عنها</Text>
        
        <View style={styles.categoriesContainer}>
          {categories.map((category, index) => (
            <Animated.View
              key={category.id}
              style={[
                styles.categoryCard,
                { 
                  transform: [{ scale: scaleAnims[index] }],
                }
              ]}
            >
              <TouchableOpacity
                style={[styles.categoryContent, { backgroundColor: `${category.color}15` }]}
                onPress={() => navigation.navigate(category.screen)}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
                  <MaterialCommunityIcons
                    name={category.iconName}
                    size={48}
                    color={category.color}
                  />
                </View>
                <Text style={[styles.categoryTitle, { color: category.color }]}>
                  {category.title}
                </Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
                <View style={styles.progressWrapper}>
                  <View style={styles.progressContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: `${(category.id === 1 ? categoryProgress.animals : categoryProgress.crops) * 100}%`,
                          backgroundColor: category.color,
                        }
                      ]} 
                    />
                    <Text style={[
                      styles.progressText, 
                      { color: 'white' }
                    ]}>
                      {Math.round((category.id === 1 ? categoryProgress.animals : categoryProgress.crops) * 100)}%
                    </Text>
                  </View>
                  <Text style={[styles.completionText, { color: category.color }]}>
                    {category.id === 1 
                      ? `${categoryStats.animals.completed}/${categoryStats.animals.total} مكتمل`
                      : `${categoryStats.crops.completed}/${categoryStats.crops.total} مكتمل`
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  headerGradient: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...theme.shadows.medium,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  subheader: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  gifContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.small,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  gif: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.medium,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  categoryCard: {
    width: width * 0.35,
    aspectRatio: 0.85,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.small,
  },
  categoryContent: {
    flex: 1,
    padding: theme.spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 16,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    ...theme.shadows.small,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  progressWrapper: {
    width: '85%',
    marginTop: 'auto',
  },
  progressContainer: {
    width: '100%',
    height: 24,
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  progressBar: {
    height: '100%',
    borderRadius: 12,
    position: 'absolute',
    left: 0,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  completionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default EducationScreen;