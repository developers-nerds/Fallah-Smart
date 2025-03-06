import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../theme/theme';
import { StackNavigationProp } from '@react-navigation/stack';

type EducationStackParamList = {
  Education: undefined;
  AnimalsLessons: undefined;
  CropsLessons: undefined;
  VideoLesson: { videoUrl: string };
  QuizLesson: { lessonId: number };
};

type AnimalsLessonsNavigationProp = StackNavigationProp<EducationStackParamList>;

interface Lesson {
  id: number;
  title: string;
  description: string;
  type: 'video' | 'quiz';
  source?: string;
}

const AnimalsLessons = () => {
  const navigation = useNavigation<AnimalsLessonsNavigationProp>();

  const lessons: Lesson[] = [
    {
      id: 1,
      title: 'تربية الأغنام',
      description: 'تعلم أساسيات تربية الأغنام وكيفية العناية بها',
      type: 'video',
      source: 'https://youtu.be/DwDBVfsrQXo?si=SELXFymtaJRl4lmS'
    },
    {
      id: 2,
      title: 'تربية الأبقار',
      description: 'دليل شامل لتربية الأبقار وإنتاج الحليب',
      type: 'quiz',
    },
    // Add more lessons as needed
  ];

  const handleLessonPress = (lesson: Lesson) => {
    if (lesson.type === 'video' && lesson.source) {
      navigation.navigate('VideoLesson', { videoUrl: lesson.source });
    } else {
      navigation.navigate('QuizLesson', { lessonId: lesson.id });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>دروس تربية الحيوانات</Text>
      <View style={styles.lessonsContainer}>
        {lessons.map((lesson) => (
          <TouchableOpacity
            key={lesson.id}
            style={styles.lessonCard}
            onPress={() => handleLessonPress(lesson)}
          >
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            <Text style={styles.lessonDescription}>{lesson.description}</Text>
            <Text style={styles.lessonType}>
              {lesson.type === 'video' ? '🎥 فيديو تعليمي' : '📝 اختبار'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  header: {
    fontSize: theme.typography.arabic.h1.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    color: theme.colors.primary.base,
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  lessonsContainer: {
    padding: 20,
    gap: 15,
  },
  lessonCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: 20,
    ...theme.shadows.small,
  },
  lessonTitle: {
    fontSize: theme.typography.arabic.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.primary.base,
    marginBottom: 8,
  },
  lessonDescription: {
    fontSize: theme.typography.arabic.body.fontSize,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 12,
  },
  lessonType: {
    fontSize: theme.typography.arabic.caption.fontSize,
    color: theme.colors.accent.base,
    textAlign: 'right',
  },
});

export default AnimalsLessons; 