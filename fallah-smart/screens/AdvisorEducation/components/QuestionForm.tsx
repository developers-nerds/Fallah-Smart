import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdvisorStackParamList } from '../../../navigation/types';
import { getAuthToken } from '../../Education/utils/userProgress';
import { theme } from '../../../theme/theme';
import axios from 'axios';
import { isValidQuizId } from '../../Education/utils/quizMapping';

type QuestionFormRouteProp = RouteProp<AdvisorStackParamList, 'QuestionForm'>;

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

interface QuestionOption {
  text: string;
  isCorrect?: boolean;
}

const QuestionForm = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AdvisorStackParamList>>();
  const route = useRoute<QuestionFormRouteProp>();
  const { quizId, questionId } = route.params;
  const isEditing = !!questionId;

  const [quizInfo, setQuizInfo] = useState<{ title: string; type: 'animal' | 'crop' } | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<QuestionOption[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [existingQuestions, setExistingQuestions] = useState<{id: number, question: string}[]>([]);
  const [showExistingQuestions, setShowExistingQuestions] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // First, get the quiz info to display the type
        const quizResponse = await axios.get(`${API_URL}/education/quizzes/${quizId}`);
        const quizData = quizResponse.data;
        
        // Validate quiz ID
        if (!isValidQuizId(quizData.id, quizData.type)) {
          throw new Error(`Invalid quiz ID ${quizData.id} for type ${quizData.type}`);
        }
        
        setQuizInfo({
          title: quizData.title,
          type: quizData.type
        });
        
        // Get existing questions
        const questionsResponse = await axios.get(`${API_URL}/education/questions/quiz/${quizId}`);
        setExistingQuestions(questionsResponse.data.map((q: any) => ({ 
          id: q.id, 
          question: q.question 
        })));
        
        // If editing, also load the question details
        if (isEditing) {
          await fetchQuestionDetails();
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        Alert.alert('خطأ', 'فشل في تحميل البيانات الأولية');
        navigation.goBack();
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadData();
  }, [quizId, questionId]);

  const fetchQuestionDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/education/questions/${questionId}`);
      const questionData = response.data;
      
      setQuestionText(questionData.question);
      
      // Format the options based on API response
      if (Array.isArray(questionData.options)) {
        const formattedOptions = questionData.options.map((optionText: string, index: number) => ({
          text: optionText,
          isCorrect: index === questionData.correctAnswer
        }));
        
        // Ensure we have at least 4 options
        while (formattedOptions.length < 4) {
          formattedOptions.push({ text: '', isCorrect: false });
        }
        
        setOptions(formattedOptions);
      }
      
      setExplanation(questionData.explanation || '');
    } catch (error) {
      console.error('Error fetching question details:', error);
      Alert.alert('خطأ', 'فشل في تحميل بيانات السؤال');
      navigation.goBack();
    }
  };

  const validateForm = () => {
    if (!questionText.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال نص السؤال');
      return false;
    }

    // Check if we have at least 2 options
    const filledOptions = options.filter(option => option.text.trim() !== '');
    if (filledOptions.length < 2) {
      Alert.alert('خطأ', 'يجب إدخال خيارين على الأقل');
      return false;
    }

    // Check if we have a correct answer
    const hasCorrectAnswer = options.some(option => option.isCorrect && option.text.trim() !== '');
    if (!hasCorrectAnswer) {
      Alert.alert('خطأ', 'يجب تحديد إجابة صحيحة واحدة على الأقل');
      return false;
    }

    return true;
  };

  const handleSetCorrectOption = (index: number) => {
    setOptions(options.map((option, i) => ({
      ...option,
      isCorrect: i === index
    })));
  };

  const handleChangeOptionText = (text: string, index: number) => {
    setOptions(options.map((option, i) => (
      i === index ? { ...option, text } : option
    )));
  };
  
  const handleAddOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Format options and find the correct answer index
      const filteredOptions = options.filter(option => option.text.trim() !== '');
      const correctAnswerIndex = filteredOptions.findIndex(option => option.isCorrect);

      const questionData = {
        question: questionText,
        options: filteredOptions.map(option => option.text),
        correctAnswer: correctAnswerIndex,
        explanation: explanation || '',
        quizId
      };

      if (isEditing) {
        // Update existing question
        await axios.put(
          `${API_URL}/education/questions/${questionId}`,
          questionData,
          { headers }
        );
        Alert.alert('نجاح', 'تم تحديث السؤال بنجاح', [
          { text: 'حسناً', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Create new question with retry mechanism
        let success = false;
        let retryCount = 0;
        let error = null;
        
        while (!success && retryCount < 3) {
          try {
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            await axios.post(
              `${API_URL}/education/questions?t=${timestamp}`,
              questionData,
              { headers }
            );
            success = true;
          } catch (err) {
            error = err;
            retryCount++;
            console.log(`Attempt ${retryCount} failed, retrying...`, err);
            // Wait 500ms before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (success) {
          // Update existing questions list
          try {
            const questionsResponse = await axios.get(`${API_URL}/education/questions/quiz/${quizId}`);
            setExistingQuestions(questionsResponse.data.map((q: any) => ({ 
              id: q.id, 
              question: q.question 
            })));
          } catch (err) {
            console.error('Error refreshing questions list:', err);
          }
          
          Alert.alert('نجاح', 'تم إضافة السؤال بنجاح', [
            { text: 'إضافة سؤال آخر', style: 'default' },
            { text: 'العودة', onPress: () => navigation.goBack() }
          ]);

          // Reset form for new question
          setQuestionText('');
          setOptions([
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ]);
          setExplanation('');
        } else {
          console.error('Failed after 3 attempts:', error);
          Alert.alert('خطأ', 'فشل في حفظ السؤال. يبدو أن هناك مشكلة في قاعدة البيانات. يرجى المحاولة مرة أخرى لاحقاً.');
        }
      }
    } catch (error) {
      console.error('Error saving question:', error);
      Alert.alert('خطأ', 'فشل في حفظ السؤال. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'تعديل سؤال' : 'إضافة سؤال جديد'}
        </Text>
        <View style={styles.rightPlaceholder} />
      </View>

      {quizInfo && (
        <View style={[
          styles.quizInfoBanner,
          quizInfo.type === 'animal' ? styles.animalBanner : styles.cropBanner
        ]}>
          <MaterialIcons 
            name={quizInfo.type === 'animal' ? 'pets' : 'grass'} 
            size={18} 
            color="#ffffff" 
          />
          <Text style={styles.quizInfoText}>
            {quizInfo.title} ({quizInfo.type === 'animal' ? 'حيوان' : 'محصول'})
          </Text>
        </View>
      )}

      <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContentContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>نص السؤال</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="أدخل نص السؤال هنا..."
            value={questionText}
            onChangeText={setQuestionText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor={theme.colors.neutral.gray.base}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>خيارات الإجابة</Text>
          <Text style={styles.helperText}>اختر إجابة صحيحة واحدة على الأقل</Text>

          {options.map((option, index) => (
            <View key={index} style={styles.optionContainer}>
              <TouchableOpacity 
                style={[
                  styles.radioButton,
                  option.isCorrect && styles.radioButtonSelected
                ]}
                onPress={() => handleSetCorrectOption(index)}
              >
                {option.isCorrect && <View style={styles.radioInner} />}
              </TouchableOpacity>
              
              <TextInput
                style={styles.optionInput}
                placeholder={`الخيار ${index + 1}`}
                value={option.text}
                onChangeText={(text) => handleChangeOptionText(text, index)}
                placeholderTextColor={theme.colors.neutral.gray.base}
              />
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addOptionButton} 
            onPress={handleAddOption}
          >
            <MaterialIcons name="add" size={16} color={theme.colors.primary.base} />
            <Text style={styles.addOptionText}>إضافة خيار آخر</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>الشرح (اختياري)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="أدخل شرحًا للإجابة الصحيحة..."
            value={explanation}
            onChangeText={setExplanation}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor={theme.colors.neutral.gray.base}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'تحديث السؤال' : 'إضافة السؤال'}
            </Text>
          )}
        </TouchableOpacity>
        
        {existingQuestions.length > 0 && (
          <View style={styles.existingQuestionsContainer}>
            <TouchableOpacity 
              style={styles.toggleExistingButton}
              onPress={() => setShowExistingQuestions(!showExistingQuestions)}
            >
              <Text style={styles.toggleExistingText}>
                {showExistingQuestions ? 'إخفاء الأسئلة الموجودة' : 'عرض الأسئلة الموجودة'}
              </Text>
              <MaterialIcons 
                name={showExistingQuestions ? 'expand-less' : 'expand-more'} 
                size={20} 
                color={theme.colors.primary.base} 
              />
            </TouchableOpacity>
            
            {showExistingQuestions && (
              <FlatList
                data={existingQuestions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}) => (
                  <View style={styles.existingQuestionItem}>
                    <Text style={styles.existingQuestionText} numberOfLines={2}>
                      {item.question}
                    </Text>
                  </View>
                )}
                style={styles.existingQuestionsList}
                contentContainerStyle={{ paddingVertical: 8 }}
              />
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    textAlign: 'center',
  },
  backButton: {
    padding: 4,
  },
  rightPlaceholder: {
    width: 32,
  },
  formContainer: {
    flex: 1,
  },
  formContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.textPrimary,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.small,
    padding: 12,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
  },
  textArea: {
    minHeight: 100,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioButton: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary.base,
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary.base,
  },
  optionInput: {
    flex: 1,
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.small,
    padding: 12,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
  },
  submitButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginTop: 20,
    ...theme.shadows.small,
  },
  disabledButton: {
    backgroundColor: theme.colors.primary.disabled,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 20,
  },
  animalBanner: {
    backgroundColor: theme.colors.secondary.base,
  },
  cropBanner: {
    backgroundColor: theme.colors.success || theme.colors.secondary.dark,
  },
  quizInfoText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  addOptionText: {
    marginLeft: 8,
    color: theme.colors.primary.base,
    fontWeight: 'bold',
  },
  existingQuestionsContainer: {
    marginTop: 20,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  toggleExistingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.neutral.surface,
  },
  toggleExistingText: {
    fontWeight: 'bold',
    color: theme.colors.primary.base,
  },
  existingQuestionsList: {
    maxHeight: 200,
  },
  existingQuestionItem: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  existingQuestionText: {
    color: theme.colors.neutral.textSecondary,
  },
});

export default QuestionForm; 