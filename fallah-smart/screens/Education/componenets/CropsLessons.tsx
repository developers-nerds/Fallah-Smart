import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../../theme/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

const COMPLETED_COLOR = '#00C853'; // Bright green for 100% completion

const crops: Crop[] = [
  // الحبوب والأرز
  {
    id: 1,
    name: 'القمح',
    icon: '🌾',
    category: 'الحبوب والأرز',
    videoUrl: 'crop_1',
    quizId: 1,
  },
  {
    id: 2,
    name: 'الأرز',
    icon: '🌾',
    category: 'الحبوب والأرز',
    videoUrl: 'crop_2',
    quizId: 2,
  },
  {
    id: 3,
    name: 'الذرة',
    icon: '🌽',
    category: 'الحبوب والأرز',
    videoUrl: 'crop_3',
    quizId: 3,
  },
  {
    id: 4,
    name: 'الشعير',
    icon: '🌾',
    category: 'الحبوب والأرز',
    videoUrl: 'crop_4',
    quizId: 4,
  },
  // الخضروات
  {
    id: 5,
    name: 'الطماطم',
    icon: '🍅',
    category: 'الخضروات',
    videoUrl: 'crop_5',
    quizId: 5,
  },
  {
    id: 6,
    name: 'البطاطس',
    icon: '🥔',
    category: 'الخضروات',
    videoUrl: 'crop_6',
    quizId: 6,
  },
  {
    id: 7,
    name: 'الباذنجان',
    icon: '🍆',
    category: 'الخضروات',
    videoUrl: 'crop_7',
    quizId: 7,
  },
  {
    id: 8,
    name: 'الخيار',
    icon: '🥒',
    category: 'الخضروات',
    videoUrl: 'crop_8',
    quizId: 8,
  },
  {
    id: 9,
    name: 'الجزر',
    icon: '🥕',
    category: 'الخضروات',
    videoUrl: 'crop_9',
    quizId: 9,
  },
  {
    id: 10,
    name: 'البصل',
    icon: '🧅',
    category: 'الخضروات',
    videoUrl: 'crop_10',
    quizId: 10,
  },
  {
    id: 11,
    name: 'الثوم',
    icon: '🧄',
    category: 'الخضروات',
    videoUrl: 'crop_11',
    quizId: 11,
  },
  {
    id: 12,
    name: 'الفلفل',
    icon: '🫑',
    category: 'الخضروات',
    videoUrl: 'crop_12',
    quizId: 12,
  },
  {
    id: 13,
    name: 'البامية',
    icon: '🥬',
    category: 'الخضروات',
    videoUrl: 'crop_13',
    quizId: 13,
  },
  {
    id: 14,
    name: 'الكوسة',
    icon: '🥬',
    category: 'الخضروات',
    videoUrl: 'crop_14',
    quizId: 14,
  },
  {
    id: 15,
    name: 'الملفوف',
    icon: '🥬',
    category: 'الخضروات',
    videoUrl: 'crop_15',
    quizId: 15,
  },
  // البقوليات
  {
    id: 16,
    name: 'الفول',
    icon: '🫘',
    category: 'البقوليات',
    videoUrl: 'crop_16',
    quizId: 16,
  },
  {
    id: 17,
    name: 'العدس',
    icon: '🫘',
    category: 'البقوليات',
    videoUrl: 'crop_17',
    quizId: 17,
  },
  {
    id: 18,
    name: 'الحمص',
    icon: '🫘',
    category: 'البقوليات',
    videoUrl: 'crop_18',
    quizId: 18,
  },
  {
    id: 19,
    name: 'الفاصوليا',
    icon: '🫘',
    category: 'البقوليات',
    videoUrl: 'crop_19',
    quizId: 19,
  },
  // الفواكه
  {
    id: 20,
    name: 'البرتقال',
    icon: '🍊',
    category: 'الفواكه',
    videoUrl: 'crop_20',
    quizId: 20,
  },
  {
    id: 21,
    name: 'الليمون',
    icon: '🍋',
    category: 'الفواكه',
    videoUrl: 'crop_21',
    quizId: 21,
  },
  {
    id: 22,
    name: 'العنب',
    icon: '🍇',
    category: 'الفواكه',
    videoUrl: 'crop_22',
    quizId: 22,
  },
  {
    id: 23,
    name: 'التفاح',
    icon: '🍎',
    category: 'الفواكه',
    videoUrl: 'crop_23',
    quizId: 23,
  },
  {
    id: 24,
    name: 'المانجو',
    icon: '🥭',
    category: 'الفواكه',
    videoUrl: 'crop_24',
    quizId: 24,
  },
  {
    id: 25,
    name: 'الموز',
    icon: '🍌',
    category: 'الفواكه',
    videoUrl: 'crop_25',
    quizId: 25,
  },
  {
    id: 26,
    name: 'التين',
    icon: '🫐',
    category: 'الفواكه',
    videoUrl: 'crop_26',
    quizId: 26,
  },
  {
    id: 27,
    name: 'الرمان',
    icon: '🍎',
    category: 'الفواكه',
    videoUrl: 'crop_27',
    quizId: 27,
  },
  {
    id: 28,
    name: 'المشمش',
    icon: '🍑',
    category: 'الفواكه',
    videoUrl: 'crop_28',
    quizId: 28,
  },
  {
    id: 29,
    name: 'الخوخ',
    icon: '🍑',
    category: 'الفواكه',
    videoUrl: 'crop_29',
    quizId: 29,
  },
  // المحاصيل الزيتية
  {
    id: 30,
    name: 'عباد الشمس',
    icon: '🌻',
    category: 'المحاصيل الزيتية',
    videoUrl: 'crop_30',
    quizId: 30,
  },
  {
    id: 31,
    name: 'الزيتون',
    icon: '🫒',
    category: 'المحاصيل الزيتية',
    videoUrl: 'crop_31',
    quizId: 31,
  }
];

const CropsLessons = () => {
  const navigation = useNavigation<CropsLessonsNavigationProp>();
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cropScores, setCropScores] = useState<{[key: number]: number}>({});

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

  // Fetch scores when component mounts
  useEffect(() => {
    fetchScores();
  }, []);

  // Refetch scores when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchScores();
      return () => {};
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