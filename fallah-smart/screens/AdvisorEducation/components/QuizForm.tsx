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
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdvisorStackParamList } from '../../../navigation/types';
import { getAuthToken } from '../../Education/utils/userProgress';
import { theme } from '../../../theme/theme';
import axios, { AxiosResponse } from 'axios';
import { isValidQuizId, getQuizRange } from '../../Education/utils/quizMapping';

type QuizFormRouteProp = RouteProp<AdvisorStackParamList, 'QuizForm'>;

const API_URL = process.env.EXPO_PUBLIC_API_URL 

// Define Quiz interface
interface Quiz {
  id: number;
  title: string;
  description: string;
  type: 'animal' | 'crop';
  createdAt?: string;
  updatedAt?: string;
}

interface QuizResponse {
  id: number;
  title: string;
  description: string;
  type: 'animal' | 'crop';
}

const QuizForm = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AdvisorStackParamList>>();
  const route = useRoute<QuizFormRouteProp>();
  const quizId = route.params?.quizId;
  const initialType = route.params?.type || 'animal';
  const isEditing = !!quizId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quizType, setQuizType] = useState<'animal' | 'crop'>(initialType);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      fetchQuizDetails();
    }
  }, [quizId]);

  const fetchQuizDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/education/quizzes/${quizId}`);
      const quizData = response.data;
      
      if (!isValidQuizId(quizData.id, quizData.type)) {
        throw new Error(`Invalid quiz ID ${quizData.id} for type ${quizData.type}`);
      }
      
      setTitle(quizData.title);
      setDescription(quizData.description);
      setQuizType(quizData.type);
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      Alert.alert('خطأ', 'فشل في تحميل بيانات الاختبار');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان الاختبار');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال وصف الاختبار');
      return false;
    }

    return true;
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

      const quizData = {
        title,
        description,
        type: quizType
      };

      if (isEditing) {
        // Update existing quiz
        await axios.put(
          `${API_URL}/education/quizzes/${quizId}`,
          quizData,
          { headers }
        );
        Alert.alert('نجاح', 'تم تحديث الاختبار بنجاح', [
          { text: 'حسناً', onPress: () => navigation.goBack() }
        ]);
      } else {
        try {
          // First, get all existing quizzes of this type to determine the next ID
          const timestamp = new Date().getTime();
          const existingQuizzes = await axios.get(
            `${API_URL}/education/quizzes/type/${quizType}?t=${timestamp}`,
            { headers }
          );

          // Filter valid quizzes and get the next available ID
          const validQuizzes = existingQuizzes.data.filter((quiz: any) => 
            isValidQuizId(quiz.id, quizType)
          );
          
          const { min, max } = getQuizRange(quizType);
          let nextId;
          
          if (validQuizzes.length === 0) {
            // If no quizzes exist, use the minimum ID for the type
            nextId = min;
          } else {
            // Find the next available ID within the valid range
            const usedIds = validQuizzes.map((quiz: any) => quiz.id);
            nextId = min;
            while (usedIds.includes(nextId) && nextId <= max) {
              nextId++;
            }
          }

          if (nextId > max) {
            throw new Error(`No available IDs in range ${min}-${max}`);
          }

          // Create new quiz with the determined ID
          let retryCount = 0;
          let success = false;
          let response: { data: QuizResponse } | undefined;

          while (!success && retryCount < 3) {
            try {
              response = await axios.post<QuizResponse>(
                `${API_URL}/education/quizzes?t=${timestamp}`,
                { ...quizData, id: nextId },
                { headers }
              );

              if (response.data && isValidQuizId(response.data.id, quizType)) {
                success = true;
              } else {
                throw new Error(`Invalid quiz ID ${response.data?.id} for type ${quizType}`);
              }
            } catch (err) {
              console.log(`Creation attempt ${retryCount + 1} failed:`, err);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          if (!success) {
            throw new Error('Failed after retry attempts');
          }

          Alert.alert(
            'نجاح', 
            'تم إنشاء الاختبار بنجاح. هل تريد إضافة أسئلة الآن؟',
            [
              { 
                text: 'لاحقاً', 
                style: 'cancel',
                onPress: () => navigation.goBack() 
              },
              { 
                text: 'إضافة أسئلة', 
                onPress: () => {
                  if (response?.data && response.data.id) {
                    navigation.navigate('QuestionManagement', { quizId: response.data.id });
                  } else {
                    console.error('No quiz ID returned from server');
                    Alert.alert('خطأ', 'لا يمكن إضافة أسئلة. يرجى المحاولة مرة أخرى.');
                    navigation.goBack();
                  }
                }
              }
            ]
          );
        } catch (createError: unknown) {
          if (createError instanceof Error && createError.message.includes('No available IDs')) {
            Alert.alert('خطأ', `لا يمكن إضافة المزيد من الاختبارات. الحد الأقصى هو ${max} اختبار.`);
          } else {
            throw createError;
          }
        }
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server error details:', error.response.data);
      }
      Alert.alert('خطأ', 'فشل في حفظ الاختبار. يرجى المحاولة مرة أخرى لاحقًا.');
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

  const { min, max } = getQuizRange(quizType);

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
          {isEditing ? 'تعديل اختبار' : `إضافة اختبار ${quizType === 'animal' ? 'حيوان' : 'محصول'} جديد`}
        </Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContentContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>عنوان الاختبار</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل عنوان الاختبار"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={theme.colors.neutral.gray.base}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>وصف الاختبار</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="أدخل وصف الاختبار"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor={theme.colors.neutral.gray.base}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>نوع الاختبار (الأرقام {min} إلى {max})</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setQuizType('animal')}
              disabled={isEditing}
            >
              <View style={[
                styles.radioButton,
                quizType === 'animal' && styles.radioButtonSelected
              ]}>
                {quizType === 'animal' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>حيوان</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setQuizType('crop')}
              disabled={isEditing}
            >
              <View style={[
                styles.radioButton,
                quizType === 'crop' && styles.radioButtonSelected
              ]}>
                {quizType === 'crop' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>محصول</Text>
            </TouchableOpacity>
          </View>
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
              {isEditing ? 'تحديث الاختبار' : 'إنشاء اختبار'}
            </Text>
          )}
        </TouchableOpacity>
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
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.textPrimary,
    marginBottom: 8,
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
    minHeight: 120,
  },
  radioGroup: {
    marginTop: 10,
  },
  radioOption: {
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
  radioText: {
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
});

export default QuizForm; 