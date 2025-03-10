import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

type EducationStackParamList = {
  Education: undefined;
  AnimalsLessons: undefined;
  CropsLessons: undefined;
  VideoLesson: { videoUrl: string };
  QuizLesson: { lessonId: number };
};

type EducationScreenNavigationProp = StackNavigationProp<EducationStackParamList>;

const { width } = Dimensions.get('window');

const categories = [
  {
    id: 1,
    title: 'حيوانات',
    iconName: 'cow' as const,
    screen: 'AnimalsLessons' as const,
    description: 'تعلم عن رعاية الحيوانات',
    progress: 0.1,
    color: '#4CAF50',
  },
  {
    id: 2,
    title: 'المحاصيل',
    iconName: 'seed' as const,
    screen: 'CropsLessons' as const,
    description: 'تعلم عن زراعة المحاصيل',
    progress: 0.5,
    color: '#FF9800',
  },
];

const EducationScreen = () => {
  const navigation = useNavigation<EducationScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [scaleAnims] = useState(categories.map(() => new Animated.Value(1)));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000); // Simulate loading
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
                          width: `${category.progress * 100}%`,
                          backgroundColor: category.color,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.progressText, { color: category.color }]}>
                    {Math.round(category.progress * 100)}%
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
    height: 2,
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: 1,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
});

export default EducationScreen;