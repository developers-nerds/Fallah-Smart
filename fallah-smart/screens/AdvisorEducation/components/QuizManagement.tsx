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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdvisorStackParamList } from '../../../navigation/types';
import { getAuthToken } from '../../Education/utils/userProgress';
import { theme } from '../../../theme/theme';
import axios from 'axios';
import { isValidQuizId, getQuizRange } from '../../Education/utils/quizMapping';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Quiz {
  id: number;
  title: string;
  description: string;
  type: 'animal' | 'crop';
  questionCount?: number;
}

const QuizManagement = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AdvisorStackParamList>>();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'animal' | 'crop'>('animal');

  useEffect(() => {
    fetchQuizzes();
  }, [activeTab]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/education/quizzes/type/${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter quizzes based on valid ID ranges
      const validQuizzes = response.data.filter((quiz: Quiz) => 
        isValidQuizId(quiz.id, activeTab)
      );

      // Sort quizzes by ID to ensure correct order
      validQuizzes.sort((a: Quiz, b: Quiz) => a.id - b.id);
      
      // Get question counts for each quiz
      const quizzesWithCounts = await Promise.all(
        validQuizzes.map(async (quiz: Quiz) => {
          try {
            const questionsResponse = await axios.get(
              `${API_URL}/education/questions/quiz/${quiz.id}`, 
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return { ...quiz, questionCount: questionsResponse.data.length };
          } catch (error) {
            return { ...quiz, questionCount: 0 };
          }
        })
      );
      
      setQuizzes(quizzesWithCounts);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      Alert.alert('خطأ', 'فشل في تحميل الاختبارات، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuiz = () => {
    const { max } = getQuizRange(activeTab);
    const nextId = quizzes.length > 0 ? Math.max(...quizzes.map(q => q.id)) + 1 : (activeTab === 'animal' ? 1 : 8);
    
    if (nextId > max) {
      Alert.alert(
        'تنبيه',
        `لا يمكن إضافة المزيد من الاختبارات. الحد الأقصى هو ${max} اختبار.`
      );
      return;
    }
    
    navigation.navigate('QuizForm', { quizId: undefined, type: activeTab });
  };

  const handleEditQuiz = (quizId: number) => {
    navigation.navigate('QuizForm', { quizId });
  };

  const handleManageQuestions = (quizId: number) => {
    navigation.navigate('QuestionManagement', { quizId });
  };

  const handleDeleteQuiz = async (quizId: number) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الاختبار؟ سيتم حذف جميع الأسئلة المرتبطة به أيضًا.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              await axios.delete(`${API_URL}/education/quizzes/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              // Update the quizzes list
              setQuizzes(quizzes.filter(q => q.id !== quizId));
              Alert.alert('تم', 'تم حذف الاختبار بنجاح');
            } catch (error) {
              console.error('Error deleting quiz:', error);
              Alert.alert('خطأ', 'فشل في حذف الاختبار، يرجى المحاولة مرة أخرى');
            }
          }
        }
      ]
    );
  };

  const renderQuizItem = ({ item }: { item: Quiz }) => {
    return (
      <View style={styles.quizCard}>
        <View style={styles.quizContent}>
          <Text style={styles.quizTitle}>{item.title}</Text>
          <Text style={styles.quizDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.quizMeta}>
            <Text style={styles.quizCount}>
              عدد الأسئلة: {item.questionCount || 0}
            </Text>
            <Text style={styles.quizId}>
              رقم الاختبار: {item.id}
            </Text>
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleManageQuestions(item.id)}
          >
            <MaterialIcons name="list" size={22} color={theme.colors.primary.base} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditQuiz(item.id)}
          >
            <MaterialIcons name="edit" size={22} color={theme.colors.primary.base} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteQuiz(item.id)}
          >
            <MaterialIcons name="delete" size={22} color={theme.colors.accent.base} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const { min, max } = getQuizRange(activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة الاختبارات</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddQuiz}>
          <MaterialIcons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'animal' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('animal')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'animal' && styles.activeTabButtonText
          ]}>
            حيوان ({min}-{max})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'crop' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('crop')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'crop' && styles.activeTabButtonText
          ]}>
            محصول ({min}-{max})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
        </View>
      ) : quizzes.length > 0 ? (
        <FlatList
          data={quizzes}
          renderItem={renderQuizItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="quiz" size={64} color={theme.colors.neutral.gray.base} />
          <Text style={styles.emptyText}>
            لا توجد اختبارات {activeTab === 'animal' ? 'للحيوانات' : 'للمحاصيل'} بعد
          </Text>
          <TouchableOpacity 
            style={styles.emptyAddButton}
            onPress={handleAddQuiz}
          >
            <Text style={styles.emptyAddButtonText}>إضافة اختبار جديد</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    ...theme.shadows.small,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: theme.colors.primary.base,
  },
  tabButtonText: {
    fontSize: 16,
    color: theme.colors.neutral.textSecondary,
  },
  activeTabButtonText: {
    color: theme.colors.primary.base,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  quizCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  quizContent: {
    marginBottom: 12,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.neutral.textPrimary,
    marginBottom: 4,
  },
  quizDescription: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 8,
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizCount: {
    fontSize: 14,
    color: theme.colors.primary.base,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
    paddingTop: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 12,
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
    marginBottom: 24,
    textAlign: 'center',
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
  quizId: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    marginLeft: 12,
  },
});

export default QuizManagement; 