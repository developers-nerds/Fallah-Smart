import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Dimensions } from 'react-native';
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
    <View style={styles.container}>
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
                  backgroundColor: `${category.color}15`,
                  borderColor: category.color,
                }
              ]}
            >
              <TouchableOpacity
                style={styles.categoryContent}
                onPress={() => navigation.navigate(category.screen)}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
                  <MaterialCommunityIcons
                    name={category.iconName}
                    size={64}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  headerGradient: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xl * 1.5,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...theme.shadows.large,
  },
  header: {
    fontSize: theme.typography.arabic.h1.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subheader: {
    fontSize: theme.typography.arabic.body.fontSize,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.arabic.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'right',
    marginTop: theme.spacing.xl,
  },
  gifContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.medium,
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
    borderRadius: theme.borderRadius.large,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  categoryCard: {
    width: width * 0.48,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.large,
    borderWidth: 2,
    ...theme.shadows.medium,
  },
  categoryContent: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  categoryTitle: {
    fontSize: theme.typography.arabic.h3.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  categoryDescription: {
    fontSize: theme.typography.arabic.caption.fontSize,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: theme.typography.arabic.caption.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default EducationScreen;