import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../../theme/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
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
      
      for (const animal of animals) {
        if (animal.quizId) {
          const scoreKey = `animal_score_${animal.quizId}`;
          const score = await AsyncStorage.getItem(scoreKey);
          if (score) {
            scores[animal.id] = parseFloat(score);
          }
        }
      }
      
      setAnimalScores(scores);
    } catch (error) {
      console.error('Error fetching animal scores:', error);
    }
  };

  // Fetch scores when component mounts
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
      if (animals.length > 0) {
        fetchScores();
      }
      return () => {};
    }, [animals])
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
                <Text style={styles.animalName}>{animal.name}</Text>
                {animalScores[animal.id] !== undefined && (
                  <View style={getScoreContainerStyle(animal.id)}>
                    <MaterialCommunityIcons 
                      name="star" 
                      size={10} 
                      color={animalScores[animal.id] === 100 ? COMPLETED_COLOR : theme.colors.primary.base} 
                    />
                    <Text style={getScoreTextStyle(animal.id)}>
                      {animalScores[animal.id].toFixed(0)}%
                    </Text>
                  </View>
                )}
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
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary.base,
    marginBottom: theme.spacing.sm,
    textAlign: 'right',
  },
  animalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
  },
  animalItem: {
    alignItems: 'center',
    width: '30%',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
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
    marginTop: 4,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary.base,
    marginLeft: 2,
  },
});

export default AnimalsLessons; 