import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { storage } from '../../utils/storage';
import EmailStep from './RegisterSteps/EmailStep';
import PersonalInfoStep from './RegisterSteps/PersonalInfoStep';
import PasswordStep from './RegisterSteps/PasswordStep';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type RootStackParamList = {
  Login: undefined;
  StockTab: undefined;
  // Add other routes here if needed
};

export interface FormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  gender: 'male' | 'female';
}

export interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

// Translations (exported for use in step components)
export const arabicTranslations = {
  createAccount: 'إنشاء حساب',
  signUpToStart: 'سجل للبدء',
  username: 'اسم المستخدم',
  firstName: 'الاسم ',
  lastName: ' اللقب ',
  email: 'البريد الإلكتروني',
  phoneNumber: 'رقم الهاتف',
  gender: 'الجنس',
  male: 'ذكر',
  female: 'أنثى',
  password: 'كلمة المرور',
  confirmPassword: 'تأكيد كلمة المرور',
  register: 'تسجيل',
  next: 'التالي',
  back: 'رجوع',
  step1Title: 'أدخل بريدك الإلكتروني',
  step2Title: 'معلوماتك الشخصية',
  step3Title: 'أنشئ كلمة المرور',
  alreadyHaveAccount: 'لديك حساب بالفعل؟',
  login: 'تسجيل الدخول',
  passwordRequirements: {
    title: 'يجب أن تحتوي كلمة المرور على:',
    minLength: '8 أحرف على الأقل',
    uppercase: 'حرف كبير واحد على الأقل',
    lowercase: 'حرف صغير واحد على الأقل',
    number: 'رقم واحد على الأقل',
    special: 'رمز خاص واحد على الأقل'
  },
  validation: {
    passwordsMatch: 'كلمات المرور غير متطابقة',
    emailRequired: 'البريد الإلكتروني مطلوب',
    error: 'خطأ في التسجيل',
    success: 'تم التسجيل بنجاح!'
  }
};

// Main Register component - serves as coordinator for the registration process
const Register = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Mark onboarding as complete when component mounts
  useEffect(() => {
    const markOnboardingComplete = async () => {
      try {
        await AsyncStorage.setItem('@onboarding_complete', 'true');
        console.log('Onboarding marked as complete on Register mount');
      } catch (error) {
        console.error('Error marking onboarding as complete:', error);
      }
    };
    
    markOnboardingComplete();
  }, []);
  
  // Form data is shared across all steps
  const [formData, setFormData] = useState<FormData>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    gender: 'male',
  });

  // Update form data from any step
  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      Alert.alert('Error', arabicTranslations.validation.emailRequired);
      return false;
    }
    return true;
  };
  
  const validatePersonalInfo = () => {
    if (!formData.username || !formData.firstName || !formData.lastName) {
      Alert.alert('Error', 'Please complete all required fields');
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    // Password validation regex
    const passwordRegex = {
      minLength: /.{8,}/,
      hasUppercase: /[A-Z]/,
      hasLowercase: /[a-z]/,
      hasNumber: /[0-9]/,
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/
    };

    // Check if all password requirements are met
    const isValid = Object.values(passwordRegex).every(regex => 
      regex.test(formData.password)
    );

    if (!isValid) {
      Alert.alert('Error', 'Password does not meet requirements');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', arabicTranslations.validation.passwordsMatch);
      return false;
    }

    return true;
  };

  const goToNextStep = () => {
    if (currentStep === 1 && !validateEmail()) return;
    if (currentStep === 2 && !validatePersonalInfo()) return;
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleRegister = async () => {
    if (!validatePassword()) return;

    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    console.log(API_URL, "API URL");
    
    try {
      setIsLoading(true);
      setError('');

      const response = await axios.post(`${API_URL}/users/register`, {
        ...formData,
        role: 'user',
      });

      const { user, tokens } = response.data;

      // Store user and tokens
      await Promise.all([
        storage.setUser(user),
        storage.setTokens(tokens.access.token, tokens.refresh.token)
      ]);
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access.token}`;

      Alert.alert('Success', 'Registration successful!', [
        { 
          text: 'OK', 
          onPress: () => {
            // Navigate directly to home screen, bypassing onboarding
            navigation.reset({
              index: 0,
              routes: [{ name: 'StockTab' }],
            });
          }
        }
      ]);

    } catch (err) {
      const errorMessage = (err as any).response?.data?.message || 'An error occurred during registration';
      setError(errorMessage);
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <EmailStep 
            email={formData.email}
            onEmailChange={(email) => updateFormData({ email })}
            onNext={goToNextStep}
          />
        );
      case 2:
        return (
          <PersonalInfoStep 
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 3:
        return (
          <PasswordStep 
            password={formData.password}
            confirmPassword={formData.confirmPassword}
            updatePassword={(password, confirmPassword) => 
              updateFormData({ password, confirmPassword })
            }
            onBack={goToPreviousStep}
            onSubmit={handleRegister}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderStep()}
      
      {/* Login link shown on all steps */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.colors.neutral.textSecondary }]}>
              {arabicTranslations.alreadyHaveAccount}{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.loginLink, { color: theme.colors.primary.base }]}>
            {arabicTranslations.login}
          </Text>
            </TouchableOpacity>
          </View>
        </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  loginText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
  },
  loginLink: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  }
});

export default Register;