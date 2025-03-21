import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../../theme/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getUserIdFromToken, getAllUserProgress, getQuizDetails } from '../utils/userProgress';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type EducationStackParamList = {
  Education: undefined;
  AnimalsLessons: undefined;
  CropsLessons: undefined;
  VideoLesson: { videoId: string; type: 'animal' | 'crop' };
  QuizLesson: { lessonId: number; type: 'animal' | 'crop' };
};

type CropsLessonsNavigationProp = StackNavigationProp<EducationStackParamList>;

interface Crop {
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

const CropsLessons = () => {
  const navigation = useNavigation<CropsLessonsNavigationProp>();
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cropScores, setCropScores] = useState<{[key: number]: number}>({});
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch crops data
  const fetchCrops = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/education/crops`);
      setCrops(response.data);
    } catch (error) {
      console.error('Error fetching crops:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group crops by category
  const cropsByCategory = crops.reduce((acc, crop) => {
    if (!acc[crop.category]) {
      acc[crop.category] = [];
    }
    acc[crop.category].push(crop);
    return acc;
  }, {} as { [key: string]: Crop[] });

  // Fetch scores for all crops
  const fetchScores = async () => {
    try {
      const scores: { [key: number]: number } = {};

      // Get user ID using the improved function
      const userId = await getUserIdFromToken();
      if (!userId) {
        console.log('User not authenticated, cannot fetch scores');
        return;
      }

      console.log(`Fetching scores for user ID: ${userId}`);

      // Get all user progress from API
      const userProgressData = await getAllUserProgress(userId);

      if (userProgressData && Array.isArray(userProgressData)) {
        console.log(`Received ${userProgressData.length} progress entries from API`);

        // Filter out only crop quiz entries
        const cropQuizEntries = userProgressData.filter(
          progress => progress.quizId && progress.Education_Quiz?.type === 'crop'
        );

        console.log(`Found ${cropQuizEntries.length} crop quiz entries`);

        // Create a map of quizId to score for faster lookup
        const quizScores: { [quizId: number]: number } = {};

        cropQuizEntries.forEach(progress => {
          // If we have multiple entries for the same quiz, keep the highest score
          if (!quizScores[progress.quizId] || progress.score > quizScores[progress.quizId]) {
            quizScores[progress.quizId] = progress.score;
            console.log(`Quiz ID ${progress.quizId} has score: ${progress.score}`);
          }
        });

        console.log('Quiz ID to Score mapping:', quizScores);

        // Map scores to crop IDs using the correct quiz ID
        for (const crop of crops) {
          if (crop.quizId) {
            // Check if we have a score for this quiz ID
            if (quizScores[crop.quizId] !== undefined) {
              scores[crop.id] = quizScores[crop.quizId];
              console.log(`✅ Mapped score ${quizScores[crop.quizId]} to crop ${crop.name} (ID: ${crop.id}, Quiz ID: ${crop.quizId})`);
            } else {
              // Try to find the correct quiz ID for this crop by matching the quiz title
              const matchingQuizEntry = cropQuizEntries.find(
                entry => entry.Education_Quiz?.title?.includes(crop.name)
              );

              if (matchingQuizEntry) {
                scores[crop.id] = matchingQuizEntry.score;
                console.log(`🔄 Mapped score ${matchingQuizEntry.score} to crop ${crop.name} (ID: ${crop.id}) using matching quiz title`);
              } else {
                console.log(`❌ No score found for crop ${crop.name} (ID: ${crop.id}, Quiz ID: ${crop.quizId})`);
              }
            }
          }
        }
      } else {
        console.log('No progress data received from API or invalid format');
      }

      console.log(`Final scores object:`, scores);
      setCropScores(scores);
      console.log(`Loaded scores for ${Object.keys(scores).length} crops`);
    } catch (error) {
      console.error('Error fetching crop scores:', error);
    }
  };

  // Fetch crops when component mounts
  useEffect(() => {
    fetchCrops();
  }, []);

  // Fetch scores after crops are loaded
  useEffect(() => {
    if (crops.length > 0) {
      fetchScores();
    }
  }, [crops]);

  // Refetch scores when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('CropsLessons screen focused, refreshing data...');
      // Always fetch fresh data when screen comes into focus
      fetchCrops();

      return () => {
        // Cleanup function when screen loses focus
        console.log('CropsLessons screen unfocused');
      };
    }, [])
  );

  const handleCropPress = (crop: Crop) => {
    setSelectedCrop(crop);
    setShowModal(true);
  };

  const handleLearningOption = (type: 'video' | 'quiz') => {
    if (!selectedCrop) return;

    if (type === 'video' && selectedCrop.videoUrl) {
      navigation.navigate('VideoLesson', {
        videoId: selectedCrop.videoUrl.split('_')[1],
        type: 'crop'
      });
    } else if (type === 'quiz' && selectedCrop.quizId) {
      navigation.navigate('QuizLesson', {
        lessonId: selectedCrop.quizId,
        type: 'crop'
      });
    }
    setShowModal(false);
  };

  // Helper function to get icon circle style based on score
  const getIconCircleStyle = (cropId: number) => {
    const score = cropScores[cropId];
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
  const getScoreContainerStyle = (cropId: number) => {
    const score = cropScores[cropId];
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
  const getScoreTextStyle = (cropId: number) => {
    const score = cropScores[cropId];
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
        <Text style={styles.headerTitle}>تعلم عن المحاصيل</Text>
        <Text style={styles.headerSubtitle}>اختر المحصول الذي تريد التعلم عنه</Text>
      </LinearGradient>

      {Object.entries(cropsByCategory).map(([category, categoryCrops]) => (
        <View key={category} style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <View style={styles.cropsGrid}>
            {categoryCrops.map((crop) => (
              <TouchableOpacity
                key={crop.id}
                style={styles.cropItem}
                onPress={() => handleCropPress(crop)}
              >
                <View style={getIconCircleStyle(crop.id)}>
                  <Text style={styles.cropIcon}>{crop.icon}</Text>
                </View>
                <Text style={styles.cropName} numberOfLines={1} ellipsizeMode="tail">
                  {crop.name}
                </Text>
                <View style={getScoreContainerStyle(crop.id)}>
                  <MaterialCommunityIcons
                    name="star"
                    size={10}
                    color={cropScores[crop.id] === 100 ? COMPLETED_COLOR : theme.colors.neutral.gray.base}
                  />
                  <Text style={getScoreTextStyle(crop.id)}>
                    {cropScores[crop.id] !== undefined ? `${cropScores[crop.id].toFixed(0)}%` : '0%'}
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
              كيف تريد التعلم عن {selectedCrop?.name}؟
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
  cropsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
  },
  cropItem: {
    alignItems: 'center',
    width: '30%',
    height: 130,
    justifyContent: 'space-between',
    marginBottom: 10,
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
  cropIcon: {
    fontSize: 32,
  },
  cropName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
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

export default CropsLessons;