import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdvisorStackParamList } from '../../../navigation/types';
import { getAuthToken } from '../../Education/utils/userProgress';
import { theme } from '../../../theme/theme';
import axios from 'axios';

type QuestionManagementRouteProp = RouteProp<AdvisorStackParamList, 'QuestionManagement'>;

const API_URL = process.env.EXPO_PUBLIC_API_URL 

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  quizId: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  type: 'animal' | 'crop';
}

const QuestionManagement = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AdvisorStackParamList>>();
  const route = useRoute<QuestionManagementRouteProp>();
  const { quizId } = route.params;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionCount, setQuestionCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshKey(prevKey => prevKey + 1);
    });
    
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchQuizAndQuestions();
  }, [quizId, refreshKey]);

  const fetchQuizAndQuestions = async () => {
    setLoading(true);
    try {
      const [quizResponse, questionsResponse] = await Promise.all([
        axios.get(`${API_URL}/education/quizzes/${quizId}`),
        axios.get(`${API_URL}/education/questions/quiz/${quizId}?t=${Date.now()}`)
      ]);
      
      setQuiz(quizResponse.data);
      setQuestions(questionsResponse.data);
      setQuestionCount(questionsResponse.data.length);
    } catch (error) {
      console.error('Error fetching quiz and questions:', error);
      Alert.alert('خطأ', 'فشل في تحميل البيانات، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    navigation.navigate('QuestionForm', { quizId });
  };

  const handleEditQuestion = (questionId: number) => {
    navigation.navigate('QuestionForm', { quizId, questionId });
  };

  const handleDeleteQuestion = async (questionId: number) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا السؤال؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              await axios.delete(`${API_URL}/education/questions/${questionId}?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              const filtered = questions.filter(q => q.id !== questionId);
              setQuestions(filtered);
              setQuestionCount(filtered.length);
              Alert.alert('تم', 'تم حذف السؤال بنجاح');
            } catch (error) {
              console.error('Error deleting question:', error);
              
              fetchQuizAndQuestions();
              Alert.alert('خطأ', 'فشل في حذف السؤال، يرجى المحاولة مرة أخرى');
            }
          }
        }
      ]
    );
  };

  const renderQuestionItem = ({ item }: { item: Question }) => {
    // Truncate question text if too long
    const questionText = item.question.length > 50 
      ? `${item.question.substring(0, 50)}...` 
      : item.question;

    return (
      <View style={styles.questionCard}>
        <View style={styles.questionContent}>
          <Text style={styles.questionText}>{questionText}</Text>
          <Text style={styles.optionsText}>
            {item.options.length} خيارات | الإجابة: {item.correctAnswer + 1}
          </Text>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditQuestion(item.id)}
          >
            <MaterialIcons name="edit" size={22} color={theme.colors.primary.base} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteQuestion(item.id)}
          >
            <MaterialIcons name="delete" size={22} color={theme.colors.accent.base} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>أسئلة الاختبار</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddQuestion}>
          <MaterialIcons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {quiz && (
        <View style={[
          styles.quizInfoContainer,
          quiz.type === 'animal' ? styles.animalQuizInfo : styles.cropQuizInfo
        ]}>
          <View style={styles.quizTitleRow}>
            <Text style={styles.quizTitle}>{quiz.title}</Text>
            <View style={styles.quizTypeTag}>
              <MaterialIcons 
                name={quiz.type === 'animal' ? 'pets' : 'grass'} 
                size={14} 
                color={theme.colors.primary.base} 
              />
              <Text style={styles.quizTypeText}>
                {quiz.type === 'animal' ? 'حيوان' : 'محصول'}
              </Text>
            </View>
          </View>
          <Text style={styles.quizDescription} numberOfLines={2}>
            {quiz.description}
          </Text>
          <Text style={styles.questionsCount}>
            عدد الأسئلة: {questionCount}
          </Text>
        </View>
      )}

      {questions.length > 0 ? (
        <FlatList
          data={questions}
          renderItem={renderQuestionItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="help" size={64} color={theme.colors.neutral.gray.base} />
          <Text style={styles.emptyText}>لا توجد أسئلة لهذا الاختبار بعد</Text>
          <Text style={styles.emptySubText}>
            قم بإضافة أسئلة لبدء تحدي الفلاحين بمعرفتهم حول {quiz?.type === 'animal' ? 'الحيوانات' : 'المحاصيل'}
          </Text>
          <TouchableOpacity 
            style={styles.emptyAddButton}
            onPress={handleAddQuestion}
          >
            <Text style={styles.emptyAddButtonText}>إضافة سؤال جديد</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
  },
  header: {
    backgroundColor: theme.colors.primary.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    ...theme.shadows.medium,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  addButton: {
    padding: 4,
  },
  quizInfoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  animalQuizInfo: {
    backgroundColor: theme.colors.secondary.surface || theme.colors.primary.surface,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary.base,
  },
  cropQuizInfo: {
    backgroundColor: theme.colors.primary.surface,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary.base,
  },
  quizTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.base,
    flex: 1,
  },
  quizTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
  },
  quizTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary.base,
    marginLeft: 4,
  },
  quizDescription: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 8,
  },
  questionsCount: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  questionContent: {
    flex: 1,
    marginRight: 12,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.textPrimary,
    marginBottom: 4,
  },
  optionsText: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.neutral.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  emptyAddButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  emptyAddButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QuestionManagement; 