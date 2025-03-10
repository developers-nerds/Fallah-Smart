import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../theme/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
}

const animals: Animal[] = [
  // ماشية (Livestock)
  {
    id: 1,
    name: 'الأبقار',
    icon: '🐄',
    category: 'ماشية',
    videoUrl: 'animal_1',
    quizId: 1,
  },
  {
    id: 2,
    name: 'الأغنام',
    icon: '🐑',
    category: 'ماشية',
    videoUrl: 'animal_2',
    quizId: 2,
  },
  {
    id: 3,
    name: 'الماعز',
    icon: '🐐',
    category: 'ماشية',
    videoUrl: 'animal_3',
    quizId: 3,
  },
  // دواجن (Poultry)
  {
    id: 4,
    name: 'الدجاج',
    icon: '🐔',
    category: 'دواجن',
    videoUrl: 'animal_4',
    quizId: 4,
  },
  {
    id: 5,
    name: 'الديك الرومي',
    icon: '🦃',
    category: 'دواجن',
    videoUrl: 'animal_5',
    quizId: 5,
  },
  // حيوانات صغيرة (Small Animals)
  {
    id: 6,
    name: 'الأرانب',
    icon: '🐰',
    category: 'حيوانات صغيرة',
    videoUrl: 'animal_6',
    quizId: 6,
  },
  // طيور (Birds)
  {
    id: 7,
    name: 'الحمام',
    icon: '🕊️',
    category: 'طيور',
    videoUrl: 'animal_7',
    quizId: 7,
  },
];

const AnimalsLessons = () => {
  const navigation = useNavigation<AnimalsLessonsNavigationProp>();
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Group animals by category
  const animalsByCategory = animals.reduce((acc, animal) => {
    if (!acc[animal.category]) {
      acc[animal.category] = [];
    }
    acc[animal.category].push(animal);
    return acc;
  }, {} as { [key: string]: Animal[] });

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
                <View style={styles.iconCircle}>
                  <Text style={styles.animalIcon}>{animal.icon}</Text>
                </View>
                <Text style={styles.animalName}>{animal.name}</Text>
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
});

export default AnimalsLessons; 