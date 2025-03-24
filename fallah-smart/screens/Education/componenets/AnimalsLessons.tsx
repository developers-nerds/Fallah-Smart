import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../../theme/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getUserIdFromToken, getAllUserProgress } from '../utils/userProgress';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type EducationStackParamList = {
  Education: undefined;
  AnimalsLessons: undefined;
  CropsLessons: undefined;
  VideoLesson: { videoId: string; type: 'animal' | 'crop' };
  QuizLesson: { lessonId: number; type: 'animal' | 'crop' };
};

type AnimalsLessonsNavigationProp = StackNavigationProp<EducationStackParamList>;

interface Animal {
  id: number;
  name: string;
  icon: string;
  category: string;
  videoUrl?: string;
  quizId?: number;
  createdAt?: string;
  updatedAt?: string;
  videoId?: number | null;
}

const COMPLETED_COLOR = '#00C853'; // Bright green for 100% completion

const AnimalsLessons = () => {
  const navigation = useNavigation<AnimalsLessonsNavigationProp>();
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [animalScores, setAnimalScores] = useState<{[key: number]: number}>({});
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch animals data
  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/education/animals`);
      setAnimals(response.data);
    } catch (error) {
      console.error('Error fetching animals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group animals by category
  const animalsByCategory = animals.reduce((acc, animal) => {
    if (!acc[animal.category]) {
      acc[animal.category] = [];
    }
    acc[animal.category].push(animal);
    return acc;
  }, {} as { [key: string]: Animal[] });

  // Fetch scores for all animals
  const fetchScores = async () => {
    try {
      const scores: {[key: number]: number} = {};
      
      // Get user ID using the improved function
      const userId = await getUserIdFromToken();
      if (!userId) {
        console.log('User not authenticated, cannot fetch scores');
        return;
      }
      
      // Get all user progress from API
      const userProgressData = await getAllUserProgress(userId);
      
      if (userProgressData && Array.isArray(userProgressData)) {
        // First, create a map of quizId to score for faster lookup
        const quizScores: {[quizId: number]: number} = {};
        
        userProgressData.forEach(progress => {
          if (progress.quizId && progress.Education_Quiz?.type === 'animal') {
            // If we have multiple entries for the same quiz, keep the highest score
            if (!quizScores[progress.quizId] || progress.score > quizScores[progress.quizId]) {
              quizScores[progress.quizId] = progress.score;
            }
          }
        });
        
        // Then map these scores to animal IDs
        for (const animal of animals) {
          if (animal.quizId && quizScores[animal.quizId] !== undefined) {
            scores[animal.id] = quizScores[animal.quizId];
            console.log(`Mapped score ${quizScores[animal.quizId]} to animal ${animal.name} (ID: ${animal.id})`);
          }
        }
      }
      
      setAnimalScores(scores);
      console.log(`Loaded scores for ${Object.keys(scores).length} animals`);
    } catch (error) {
      console.error('Error fetching animal scores:', error);
    }
  };

  // Fetch animals when component mounts
  useEffect(() => {
    fetchAnimals();
  }, []);

  // Fetch scores after animals are loaded
  useEffect(() => {
    if (animals.length > 0) {
      fetchScores();
    }
  }, [animals]);

  // Refetch scores when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('AnimalsLessons screen focused, refreshing data...');
      // Always fetch fresh data when screen comes into focus
      fetchAnimals();
      
      return () => {
        // Cleanup function when screen loses focus
        console.log('AnimalsLessons screen unfocused');
      };
    }, [])
  );

  const handleAnimalPress = (animal: Animal) => {
    setSelectedAnimal(animal);
    setShowModal(true);
  };

  const handleLearningOption = (type: 'video' | 'quiz') => {
    if (!selectedAnimal) return;

    if (type === 'video' && selectedAnimal.videoUrl) {
      navigation.navigate('VideoLesson', { 
        videoId: selectedAnimal.videoUrl.split('_')[1],
        type: 'animal'
      });
    } else if (type === 'quiz' && selectedAnimal.quizId) {
      navigation.navigate('QuizLesson', { 
        lessonId: selectedAnimal.quizId,
        type: 'animal'
      });
    }
    setShowModal(false);
  };

  // Helper function to get icon circle style based on score
  const getIconCircleStyle = (animalId: number) => {
    const score = animalScores[animalId];
    const isCompleted = score === 100;
    
    return [
      styles.iconCircle,
      isCompleted && {
        backgroundColor: `${COMPLETED_COLOR}20`,
        borderWidth: 2,
        borderColor: COMPLETED_COLOR,
      }
    ];
  };

  // Helper function to get score container style based on score
  const getScoreContainerStyle = (animalId: number) => {
    const score = animalScores[animalId];
    if (score === undefined) {
      return styles.scoreContainerEmpty;
    }
    
    const isCompleted = score === 100;
    
    return [
      styles.scoreContainer,
      isCompleted && {
        backgroundColor: `${COMPLETED_COLOR}15`,
      }
    ];
  };

  // Helper function to get score text style based on score
  const getScoreTextStyle = (animalId: number) => {
    const score = animalScores[animalId];
    if (score === undefined) {
      return styles.scoreTextEmpty;
    }
    
    const isCompleted = score === 100;
    
    return [
      styles.scoreText,
      isCompleted && {
        color: COMPLETED_COLOR,
      }
    ];
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[theme.colors.primary.base, theme.colors.primary.dark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>تعلم عن الحيوانات</Text>
        <Text style={styles.headerSubtitle}>اختر الحيوان الذي تريد التعلم عنه</Text>
      </LinearGradient>

      {Object.entries(animalsByCategory).map(([category, categoryAnimals]) => (
        <View key={category} style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <View style={styles.animalsGrid}>
            {categoryAnimals.map((animal) => (
              <TouchableOpacity
                key={animal.id}
                style={styles.animalItem}
                onPress={() => handleAnimalPress(animal)}
              >
                <View style={getIconCircleStyle(animal.id)}>
                  <Text style={styles.animalIcon}>{animal.icon}</Text>
                </View>
                <Text style={styles.animalName} numberOfLines={1} ellipsizeMode="tail">
                  {animal.name}
                </Text>
                <View style={getScoreContainerStyle(animal.id)}>
                  <MaterialCommunityIcons 
                    name="star" 
                    size={10} 
                    color={animalScores[animal.id] === 100 ? COMPLETED_COLOR : theme.colors.neutral.gray.base} 
                  />
                  <Text style={getScoreTextStyle(animal.id)}>
                    {animalScores[animal.id] !== undefined ? `${animalScores[animal.id].toFixed(0)}%` : '0%'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              كيف تريد التعلم عن {selectedAnimal?.name}؟
            </Text>
            
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={() => handleLearningOption('video')}
            >
              <MaterialCommunityIcons name="play-circle" size={24} color="white" />
              <Text style={styles.optionButtonText}>تعلم بالفيديو</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: theme.colors.secondary.base }]}
              onPress={() => handleLearningOption('quiz')}
            >
              <MaterialCommunityIcons name="pencil-circle" size={24} color="white" />
              <Text style={styles.optionButtonText}>اختبر معلوماتك</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: theme.colors.neutral.gray.base }]}
              onPress={() => setShowModal(false)}
            >
              <MaterialCommunityIcons name="close-circle" size={24} color="white" />
              <Text style={styles.optionButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.neutral.textSecondary,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  categoryContainer: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary.base,
    marginBottom: theme.spacing.md,
    marginRight: 5,
    textAlign: 'right',
  },
  animalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  animalItem: {
    alignItems: 'center',
    width: '33.33%',
    height: 120,
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  iconCircle: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: theme.colors.neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...theme.shadows.medium,
  },
  animalIcon: {
    fontSize: 32,
  },
  animalName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral.textPrimary,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 20,
    padding: theme.spacing.lg,
    width: '80%',
    alignItems: 'stretch',
    ...theme.shadows.large,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.neutral.textPrimary,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  optionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary.base}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    height: 20,
    minWidth: 40,
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary.base,
    marginLeft: 2,
  },
  scoreContainerEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.neutral.gray.light}30`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    height: 20,
    minWidth: 40,
    justifyContent: 'center',
  },
  scoreTextEmpty: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.neutral.gray.base,
    marginLeft: 2,
  },
});

export default AnimalsLessons; 