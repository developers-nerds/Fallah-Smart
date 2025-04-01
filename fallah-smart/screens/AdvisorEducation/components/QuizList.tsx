import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdvisorStackParamList } from '../../../navigation/types';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL 

interface Quiz {
  id: number;
  title: string;
  description: string;
  type: 'animal' | 'crop';
  questionCount?: number;
  createdAt: string;
}

interface QuizListProps {
  type: 'animal' | 'crop';
}

const QuizList: React.FC<QuizListProps> = ({ type }) => {
  const navigation = useNavigation<NativeStackNavigationProp<AdvisorStackParamList>>();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, [type]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      // Add a retry mechanism for network requests
      let retryCount = 0;
      let quizzesData: Quiz[] = [];
      let success = false;
      
      while (!success && retryCount < 3) {
        try {
          // Add timestamp to avoid caching issues
          const timestamp = new Date().getTime();
          const response = await axios.get(`${API_URL}/education/quizzes/type/${type}?t=${timestamp}`);
          quizzesData = response.data;
          success = true;
        } catch (err) {
          console.log(`Fetch attempt ${retryCount + 1} failed:`, err);
          retryCount++;
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!success) {
        throw new Error('Failed to fetch quizzes after multiple attempts');
      }
      
      // Get question counts for each quiz
      const quizzesWithCounts = await Promise.all(
        quizzesData.map(async (quiz: Quiz) => {
          try {
            const timestamp = new Date().getTime();
            const questionsResponse = await axios.get(
              `${API_URL}/education/questions/quiz/${quiz.id}?t=${timestamp}`
            );
            return { ...quiz, questionCount: questionsResponse.data.length };
          } catch (error) {
            console.error(`Error fetching questions for quiz ${quiz.id}:`, error);
            return { ...quiz, questionCount: 0 };
          }
        })
      );
      
      setQuizzes(quizzesWithCounts);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      // Don't show an alert here as it might be disruptive to the user experience
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (quizId: number) => {
    navigation.navigate('QuestionManagement', { quizId });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-TN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderQuizItem = ({ item }: { item: Quiz }) => {
    return (
      <TouchableOpacity 
        style={styles.quizCard}
        onPress={() => handleStartQuiz(item.id)}
      >
        <View style={styles.quizContent}>
          <View style={styles.quizHeader}>
            <Text style={styles.quizTitle}>{item.title}</Text>
            <View style={styles.typeIndicator}>
              <Text style={styles.typeText}>
                {item.type === 'animal' ? 'حيوان' : 'محصول'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.quizDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.quizFooter}>
            <View style={styles.metaInfo}>
              <MaterialIcons name="help" size={16} color={theme.colors.primary.base} />
              <Text style={styles.metaText}>{item.questionCount || 0} أسئلة</Text>
            </View>
            
            <View style={styles.metaInfo}>
              <MaterialIcons name="calendar-today" size={16} color={theme.colors.neutral.textSecondary} />
              <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actionContainer}>
          <MaterialIcons name="edit" size={24} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  };

  // Don't filter out quizzes with no questions - advisors need to add questions to empty quizzes too
  const validQuizzes = quizzes;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (validQuizzes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="quiz" size={120} color={theme.colors.neutral.gray.base} />
        <Text style={styles.emptyText}>
          لا توجد اختبارات متاحة حاليًا
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={validQuizzes}
      renderItem={renderQuizItem}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  quizCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    ...theme.shadows.small,
  },
  quizContent: {
    flex: 1,
    padding: 16,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.neutral.textPrimary,
    flex: 1,
  },
  typeIndicator: {
    backgroundColor: theme.colors.primary.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.small,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 12,
    color: theme.colors.primary.base,
    fontWeight: 'bold',
  },
  quizDescription: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  quizFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
    marginLeft: 4,
  },
  actionContainer: {
    width: 50,
    backgroundColor: theme.colors.primary.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default QuizList; 