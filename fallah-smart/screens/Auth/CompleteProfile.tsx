import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../navigation/types';
import { API_URL as configApiUrl } from '../../config/api';

type CompleteProfileRouteProp = RouteProp<StockStackParamList, 'CompleteProfile'>;
type CompleteProfileNavigationProp = NativeStackNavigationProp<StockStackParamList>;

const arabicTranslations = {
  completeProfile: 'إكمال الملف الشخصي',
  completeProfileDesc: 'أكمل معلومات ملفك الشخصي للمتابعة',
  username: 'اسم المستخدم',
  firstName: 'الاسم الأول',
  lastName: 'اللقب',
  email: 'البريد الإلكتروني',
  gender: 'الجنس',
  male: 'ذكر',
  female: 'أنثى',
  save: 'حفظ',
  error: 'خطأ',
  success: 'تم بنجاح',
  profileUpdated: 'تم تحديث الملف الشخصي بنجاح',
  missingFields: 'يرجى ملء جميع الحقول المطلوبة',
  selectGender: 'يرجى اختيار الجنس',
  requiredInfo: 'جميع الحقول مطلوبة لإكمال تسجيل حسابك',
  validEmail: 'يرجى إدخال بريد إلكتروني صالح',
  welcomeMessage: 'مرحباً بك في تطبيق فلاح سمارت!',
  readyToGo: 'بعد إكمال هذه المعلومات، ستتمكن من استخدام كافة ميزات التطبيق'
};

// Email validation function
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const CompleteProfile = () => {
  const navigation = useNavigation<CompleteProfileNavigationProp>();
  const route = useRoute<CompleteProfileRouteProp>();
  const { userId } = route.params;
  
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    gender: 'male',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
  });
  
  // Get API URL with fallback options
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 
                  configApiUrl || 
                  'http://192.168.1.3:5000/api';

  // Validate form inputs
  const validateForm = () => {
    let isValid = true;
    const errors = {
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      gender: '',
    };

    // Check required fields
    if (!formData.username.trim()) {
      errors.username = 'اسم المستخدم مطلوب';
      isValid = false;
    } else if (formData.username.trim().length < 3) {
      errors.username = 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل';
      isValid = false;
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'الاسم الأول مطلوب';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'اللقب مطلوب';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'البريد الإلكتروني مطلوب';
      isValid = false;
    } else if (!isValidEmail(formData.email.trim())) {
      errors.email = 'يرجى إدخال بريد إلكتروني صالح';
      isValid = false;
    }

    if (!formData.gender) {
      errors.gender = 'يرجى اختيار الجنس';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Save profile information
  const handleSaveProfile = async () => {
    try {
      // Validate form
      if (!validateForm()) {
        Alert.alert(arabicTranslations.error, arabicTranslations.missingFields);
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      // Make API request to update profile
      const response = await axios.put(`${API_URL}/phone-auth/complete-profile`, formData, {
        headers: {
          'Content-Type': 'application/json',
          // Authorization header is set globally in axios defaults after phone login
        }
      });
      
      Alert.alert(arabicTranslations.success, arabicTranslations.profileUpdated, [
        { 
          text: 'OK', 
          onPress: () => navigation.navigate({
            name: 'WelcomeOnboarding',
            params: undefined
          })
        }
      ]);
      
    } catch (error: any) {
      let errorMessage = 'حدث خطأ أثناء تحديث الملف الشخصي';
      
      console.error('Profile Update Error:', error);
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      Alert.alert(arabicTranslations.error, errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
            {arabicTranslations.completeProfile}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>
            {arabicTranslations.completeProfileDesc}
          </Text>
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>{arabicTranslations.welcomeMessage}</Text>
          <Text style={styles.welcomeText}>{arabicTranslations.readyToGo}</Text>
          <Text style={styles.requiredInfoText}>{arabicTranslations.requiredInfo}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <View style={[
              styles.inputContainer, 
              { backgroundColor: theme.colors.neutral.surface },
              formErrors.username ? { borderColor: theme.colors.error } : null
            ]}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={formErrors.username ? theme.colors.error : theme.colors.neutral.textSecondary} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, { color: theme.colors.neutral.textPrimary, textAlign: 'right' }]}
                placeholder={arabicTranslations.username}
                placeholderTextColor={theme.colors.neutral.textSecondary}
                value={formData.username}
                onChangeText={(text) => {
                  setFormData({ ...formData, username: text });
                  if (formErrors.username) {
                    setFormErrors({...formErrors, username: ''});
                  }
                }}
                autoCapitalize="none"
              />
            </View>
            {formErrors.username ? <Text style={styles.errorText}>{formErrors.username}</Text> : null}
          </View>

          <View style={styles.inputWrapper}>
            <View style={[
              styles.inputContainer, 
              { backgroundColor: theme.colors.neutral.surface },
              formErrors.firstName ? { borderColor: theme.colors.error } : null
            ]}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={formErrors.firstName ? theme.colors.error : theme.colors.neutral.textSecondary} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, { color: theme.colors.neutral.textPrimary, textAlign: 'right' }]}
                placeholder={arabicTranslations.firstName}
                placeholderTextColor={theme.colors.neutral.textSecondary}
                value={formData.firstName}
                onChangeText={(text) => {
                  setFormData({ ...formData, firstName: text });
                  if (formErrors.firstName) {
                    setFormErrors({...formErrors, firstName: ''});
                  }
                }}
              />
            </View>
            {formErrors.firstName ? <Text style={styles.errorText}>{formErrors.firstName}</Text> : null}
          </View>

          <View style={styles.inputWrapper}>
            <View style={[
              styles.inputContainer, 
              { backgroundColor: theme.colors.neutral.surface },
              formErrors.lastName ? { borderColor: theme.colors.error } : null
            ]}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={formErrors.lastName ? theme.colors.error : theme.colors.neutral.textSecondary} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, { color: theme.colors.neutral.textPrimary, textAlign: 'right' }]}
                placeholder={arabicTranslations.lastName}
                placeholderTextColor={theme.colors.neutral.textSecondary}
                value={formData.lastName}
                onChangeText={(text) => {
                  setFormData({ ...formData, lastName: text });
                  if (formErrors.lastName) {
                    setFormErrors({...formErrors, lastName: ''});
                  }
                }}
              />
            </View>
            {formErrors.lastName ? <Text style={styles.errorText}>{formErrors.lastName}</Text> : null}
          </View>

          <View style={styles.inputWrapper}>
            <View style={[
              styles.inputContainer, 
              { backgroundColor: theme.colors.neutral.surface },
              formErrors.email ? { borderColor: theme.colors.error } : null
            ]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={formErrors.email ? theme.colors.error : theme.colors.neutral.textSecondary} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, { color: theme.colors.neutral.textPrimary, textAlign: 'right' }]}
                placeholder={arabicTranslations.email}
                placeholderTextColor={theme.colors.neutral.textSecondary}
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text });
                  if (formErrors.email) {
                    setFormErrors({...formErrors, email: ''});
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {formErrors.email ? <Text style={styles.errorText}>{formErrors.email}</Text> : null}
          </View>
          
          <View style={styles.genderContainer}>
            <Text style={[
              styles.genderLabel, 
              { color: formErrors.gender ? theme.colors.error : theme.colors.neutral.textPrimary }
            ]}>
              {arabicTranslations.gender}
            </Text>
            <View style={styles.genderOptions}>
              <TouchableOpacity 
                style={[
                  styles.genderOption, 
                  formData.gender === 'male' && { 
                    backgroundColor: theme.colors.primary.light,
                    borderColor: theme.colors.primary.base
                  },
                  formErrors.gender && !formData.gender && { borderColor: theme.colors.error }
                ]}
                onPress={() => {
                  setFormData({...formData, gender: 'male'});
                  if (formErrors.gender) {
                    setFormErrors({...formErrors, gender: ''});
                  }
                }}
              >
                <Ionicons 
                  name={formData.gender === 'male' ? 'radio-button-on' : 'radio-button-off'} 
                  size={20} 
                  color={formData.gender === 'male' ? theme.colors.primary.base : theme.colors.neutral.textSecondary} 
                />
                <Text style={[
                  styles.genderText, 
                  { color: formData.gender === 'male' ? theme.colors.primary.base : theme.colors.neutral.textPrimary }
                ]}>
                  {arabicTranslations.male}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.genderOption, 
                  formData.gender === 'female' && { 
                    backgroundColor: theme.colors.primary.light,
                    borderColor: theme.colors.primary.base
                  },
                  formErrors.gender && !formData.gender && { borderColor: theme.colors.error }
                ]}
                onPress={() => {
                  setFormData({...formData, gender: 'female'});
                  if (formErrors.gender) {
                    setFormErrors({...formErrors, gender: ''});
                  }
                }}
              >
                <Ionicons 
                  name={formData.gender === 'female' ? 'radio-button-on' : 'radio-button-off'} 
                  size={20} 
                  color={formData.gender === 'female' ? theme.colors.primary.base : theme.colors.neutral.textSecondary} 
                />
                <Text style={[
                  styles.genderText, 
                  { color: formData.gender === 'female' ? theme.colors.primary.base : theme.colors.neutral.textPrimary }
                ]}>
                  {arabicTranslations.female}
                </Text>
              </TouchableOpacity>
            </View>
            {formErrors.gender ? <Text style={styles.errorText}>{formErrors.gender}</Text> : null}
          </View>

          {error ? (
            <Text style={[styles.formErrorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.colors.primary.base },
              isLoading && { backgroundColor: theme.colors.primary.disabled }
            ]}
            onPress={handleSaveProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.neutral.surface} />
            ) : (
              <Text style={styles.saveButtonText}>{arabicTranslations.save}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSizes.h1,
    fontFamily: theme.fonts.bold,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
  },
  welcomeContainer: {
    backgroundColor: theme.colors.primary.light,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
  },
  welcomeTitle: {
    fontSize: theme.fontSizes.subtitle,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  requiredInfoText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.dark,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  inputWrapper: {
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    height: 50,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
  },
  errorText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.error,
    marginTop: 4,
    marginRight: theme.spacing.sm,
  },
  formErrorText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  genderContainer: {
    marginBottom: theme.spacing.md,
  },
  genderLabel: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    marginBottom: theme.spacing.sm,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.medium,
    width: '48%',
  },
  genderText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
  },
  saveButton: {
    borderRadius: theme.borderRadius.medium,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  saveButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
  },
});

export default CompleteProfile; 