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
      const scores: {[key: number]: number} = {};
      
      for (const crop of crops) {
        if (crop.quizId) {
          const scoreKey = `crop_score_${crop.quizId}`;
          const score = await AsyncStorage.getItem(scoreKey);
          if (score) {
            scores[crop.id] = parseFloat(score);
          }
        }
      }
      
      setCropScores(scores);
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
      if (crops.length > 0) {
        fetchScores();
      }
      return () => {};
    }, [crops])
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
                <Text style={styles.cropName}>{crop.name}</Text>
                {cropScores[crop.id] !== undefined && (
                  <View style={getScoreContainerStyle(crop.id)}>
                    <MaterialCommunityIcons 
                      name="star" 
                      size={10} 
                      color={cropScores[crop.id] === 100 ? COMPLETED_COLOR : theme.colors.primary.base} 
                    />
                    <Text style={getScoreTextStyle(crop.id)}>
                      {cropScores[crop.id].toFixed(0)}%
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

export default CropsLessons; 