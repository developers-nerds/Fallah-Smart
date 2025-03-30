import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdvisorStackParamList } from '../../../navigation/types';
import { theme } from '../../../theme/theme';
import axios from 'axios';
import { isValidQuizId, getQuizRange, mapActualToSequentialId } from '../utils/quizMapping';

type QuizSelectorRouteProp = RouteProp<AdvisorStackParamList, 'QuizSelector'>;

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Quiz {
  id: number;
  title: string;
  description: string;
  type: 'animal' | 'crop';
  createdAt?: string;
  updatedAt?: string;
  questionCount?: number;
  displayId: number;
}

const QuizSelector = () => {
  const navigation = useNavigation<any>(); // Using 'any' to access drawer methods
  const route = useRoute<QuizSelectorRouteProp>();
  const initialType = route.params?.type || 'animal';
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentType, setCurrentType] = useState<'animal' | 'crop'>(initialType);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const response = await axios.get(`${API_URL}/education/quizzes/type/${currentType}?t=${timestamp}`);
      
      if (response.data && Array.isArray(response.data)) {
        // Filter valid quizzes based on ID ranges and sort them
        const validQuizzes = response.data
          .filter((quiz: Quiz) => isValidQuizId(quiz.id, currentType))
          .sort((a: Quiz, b: Quiz) => a.id - b.id)
          .map((quiz: Quiz) => ({
            ...quiz,
            displayId: quiz.id // The ID is already in the correct range (1-7 for animals, 8-38 for crops)
          }));

        // Get question counts for each quiz
        const quizzesWithCounts = await Promise.all(
          validQuizzes.map(async (quiz: Quiz) => {
            try {
              const questionsResponse = await axios.get(
                `${API_URL}/education/questions/quiz/${quiz.id}?t=${timestamp}`
              );
              return {
                ...quiz,
                questionCount: questionsResponse.data.length
              };
            } catch (error) {
              console.error(`Error fetching questions for quiz ${quiz.id}:`, error);
              return {
                ...quiz,
                questionCount: 0
              };
            }
          })
        );

        setQuizzes(quizzesWithCounts);
        setFilteredQuizzes(quizzesWithCounts);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [currentType]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredQuizzes(quizzes);
    } else {
      const filtered = quizzes.filter(quiz => 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredQuizzes(filtered);
    }
  }, [searchQuery, quizzes]);

  const handleSelectQuiz = (quiz: Quiz) => {
    // The quiz.id is already in the correct range (1-7 for animals, 8-38 for crops)
    navigation.navigate('QuestionManagement', { quizId: quiz.id });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleMenuPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const renderQuizItem = ({ item }: { item: Quiz }) => (
    <TouchableOpacity 
      style={styles.quizCard}
      onPress={() => handleSelectQuiz(item)}
    >
      <View style={styles.quizContent}>
        <View style={styles.quizHeader}>
          <Text style={styles.quizTitle}>{item.title}</Text>
          <View style={[
            styles.typeTag,
            { backgroundColor: item.type === 'animal' ? 
              theme.colors.secondary.base : 
              theme.colors.success || theme.colors.secondary.dark 
            }
          ]}>
            <MaterialIcons 
              name={item.type === 'animal' ? 'pets' : 'grass'} 
              size={12} 
              color="#fff" 
            />
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
          <Text style={styles.idText}>رقم الاختبار: {item.displayId}</Text>
        </View>
      </View>
      <View style={styles.actionContainer}>
        <MaterialIcons name="edit" size={24} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  const toggleType = () => {
    setCurrentType(currentType === 'animal' ? 'crop' : 'animal');
  };

  const { min, max } = getQuizRange(currentType);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          إضافة أسئلة لاختبار {currentType === 'animal' ? 'الحيوانات' : 'المحاصيل'}
        </Text>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <MaterialIcons name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.instructionContainer}>
        <MaterialIcons name="info" size={20} color={theme.colors.secondary.base} />
        <Text style={styles.instructionText}>
          اختر اختبارًا لإضافة أو تعديل الأسئلة الخاصة به (الأرقام {min} إلى {max})
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={theme.colors.neutral.gray.base} />
        <TextInput
          style={styles.searchInput}
          placeholder="البحث عن اختبار..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.neutral.gray.base}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color={theme.colors.neutral.gray.base} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.typeFilterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            currentType === 'animal' && styles.activeFilterButton
          ]}
          onPress={() => setCurrentType('animal')}
        >
          <MaterialIcons name="pets" size={16} color={currentType === 'animal' ? '#fff' : theme.colors.primary.base} />
          <Text style={[
            styles.filterButtonText,
            currentType === 'animal' && styles.activeFilterText
          ]}>
            اختبارات الحيوانات (1-7)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton,
            currentType === 'crop' && styles.activeFilterButton
          ]}
          onPress={() => setCurrentType('crop')}
        >
          <MaterialIcons name="grass" size={16} color={currentType === 'crop' ? '#fff' : theme.colors.primary.base} />
          <Text style={[
            styles.filterButtonText,
            currentType === 'crop' && styles.activeFilterText
          ]}>
            اختبارات المحاصيل (8-38)
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
        </View>
      ) : filteredQuizzes.length > 0 ? (
        <FlatList
          data={filteredQuizzes}
          renderItem={renderQuizItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons 
            name={currentType === 'animal' ? 'pets' : 'grass'} 
            size={64} 
            color={theme.colors.neutral.gray.base} 
          />
          <Text style={styles.emptyText}>
            لا توجد اختبارات {currentType === 'animal' ? 'حيوانات' : 'محاصيل'} متاحة
          </Text>
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
    padding: 8,
    borderRadius: 20,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: theme.borderRadius.medium,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary.base,
  },
  instructionText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.neutral.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: theme.colors.neutral.textPrimary,
  },
  typeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.small,
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
    flex: 1,
    marginHorizontal: 4,
  },
  activeFilterButton: {
    backgroundColor: theme.colors.primary.base,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary.base,
    marginLeft: 4,
  },
  activeFilterText: {
    color: '#ffffff',
  },
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
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  quizContent: {
    flex: 1,
    marginRight: 12,
    padding: 12,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.textPrimary,
    flex: 1,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 4,
  },
  quizDescription: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 8,
  },
  quizFooter: {
    flexDirection: 'row',
    alignItems: 'center',
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
    height: '100%',
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
    fontSize: 18,
    color: theme.colors.neutral.textSecondary,
    marginTop: 16,
  },
  idText: {
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
    marginLeft: 8,
  },
});

export default QuizSelector; 