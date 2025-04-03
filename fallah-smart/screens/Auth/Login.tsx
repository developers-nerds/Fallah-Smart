import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  ToastAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { storage } from '../../utils/storage';
import { StockStackParamList } from '../../navigation/types';
import { API_URL as configApiUrl } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import NotificationHelper from '../../utils/NotificationHelper';

// Define the navigation type for this screen
type LoginNavigationProps = NativeStackNavigationProp<StockStackParamList>;

const arabicTranslations = {
  welcomeBack: 'مرحباً بعودتك!',
  signInToContinue: 'سجل دخول للمتابعة',
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور',
  login: 'تسجيل الدخول',
  or: 'أو',
  loginWithPhone: 'تسجيل الدخول برقم الهاتف',
  dontHaveAccount: 'ليس لديك حساب؟',
  register: 'تسجيل',
  validationError: 'خطأ في التحقق',
  enterBothFields: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور',
  loginError: 'خطأ في تسجيل الدخول',
  loading: 'جاري تسجيل الدخول...',
  savingUserData: 'جاري حفظ بيانات المستخدم...',
  loginSuccess: 'تم تسجيل الدخول بنجاح!',
  welcomeBackNotification: 'تم تسجيل الدخول بنجاح! مرحباً بعودتك.',
  errorOccurred: 'حدث خطأ أثناء تسجيل الدخول'
};

const Login = () => {
  const navigation = useNavigation<LoginNavigationProps>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const { forceSendAllNotifications } = useAuth();
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // Animation effect when loading state changes
  useEffect(() => {
    if (isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [isLoading, fadeAnim]);

  // Get API URL with fallback options
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 
                  configApiUrl || 
                  'http://192.168.1.3:5000/api';

  // Helper for showing toast messages
  const showToast = (message: string) => {
    NotificationHelper.showToast(message);
  };

  const handleLogin = async () => {
    try {
      // Remove any existing authorization header
      delete axios.defaults.headers.common['Authorization'];
      
      // Input validation
      if (!email || !password) {
        Alert.alert('Validation Error', 'Please enter both email and password');
        return;
      }

      // Log API URL for debugging
      console.log(`[Login] Using API URL: ${API_URL}`);
      
      setIsLoading(true);
      setError('');
      
      // Show login progress
      setLoadingMessage('جاري تسجيل الدخول...');
  
      const response = await axios.post(`${API_URL}/users/login`, {
        email: email.trim(),
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      const { user, tokens } = response.data;
  
      if (!user || !tokens) {
        throw new Error('Invalid response from server');
      }
      
      // Update loading message
      setLoadingMessage('جاري حفظ بيانات المستخدم...');
  
      await Promise.all([
        storage.setUser(user),
        storage.setTokens(tokens.access.token, tokens.refresh.token)
      ]);
  
      // Set the authorization header for subsequent requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access.token}`;
  
      // You might also want to add this to properly refresh the token
      console.log('Login successful, token stored:', tokens.access.token);
      
      // Update loading message
      setLoadingMessage('تم تسجيل الدخول بنجاح!');
  
      // Send a direct notification after login success
      try {
        // Import the notification service directly
        const notificationService = require('../../services/NotificationService').default;
        
        // Send notification immediately after login
        setTimeout(async () => {
          try {
            console.log('[Login] Triggering immediate login notification...');
            const notificationId = await notificationService.scheduleTestNotification(
              'تم تسجيل الدخول بنجاح! مرحبًا بعودتك.' // Login successful! Welcome back.
            );
            console.log('[Login] Login notification triggered with ID:', notificationId);
          } catch (notifError) {
            console.error('[Login] Failed to show login notification:', notifError);
          }
        }, 1000);
      } catch (notifSetupError) {
        console.error('[Login] Error setting up notification:', notifSetupError);
      }
      
      // Add a delay before navigation for a smoother experience
      setTimeout(() => {
        navigation.navigate('StockTab');
  
        // After a short delay, force-trigger stock notifications
        setTimeout(async () => {
          console.log('[Login] Triggering stock notifications after login...');
          try {
            const result = await forceSendAllNotifications();
            console.log('[Login] Stock notifications triggered:', result);
          } catch (notifError) {
            console.error('[Login] Failed to trigger stock notifications:', notifError);
          }
        }, 2000);
      }, 1000);
    } catch (error: any) {
      let errorMessage = 'An error occurred during login';
      
      console.error('Login Error:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        url: error.config?.url
      });
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      Alert.alert('Login Error', errorMessage);
    } finally {
      // Delay hiding loading indicator for better UX
      setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage('');
      }, 500);
    }
  };

  const handlePhoneLoginPress = () => {
    // Use object syntax for navigation to avoid type errors
    navigation.navigate({
      name: 'PhoneLogin',
      params: undefined
    });
  };

  const handleRegisterPress = () => {
    // Use object syntax for navigation to avoid type errors
    navigation.navigate({
      name: 'Register',
      params: undefined
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}
    >
      <View style={styles.logoContainer}>
        <MaterialCommunityIcons 
          name="leaf" 
          size={80} 
          color={theme.colors.primary.base}
          style={styles.logo}
        />
        <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>{arabicTranslations.welcomeBack}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>{arabicTranslations.signInToContinue}</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
          <Ionicons 
            name="mail-outline" 
            size={20} 
            color={theme.colors.neutral.textSecondary} 
            style={styles.inputIcon} 
          />
          <TextInput
            style={[styles.input, { color: theme.colors.neutral.textPrimary, textAlign: 'right' }]}
            placeholder={arabicTranslations.email}
            placeholderTextColor={theme.colors.neutral.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
          <Ionicons 
            name="lock-closed-outline" 
            size={20} 
            color={theme.colors.neutral.textSecondary} 
            style={styles.inputIcon} 
          />
          <TextInput
            style={[styles.input, { color: theme.colors.neutral.textPrimary, textAlign: 'right' }]}
            placeholder={arabicTranslations.password}
            placeholderTextColor={theme.colors.neutral.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={theme.colors.neutral.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.loginButton,
            { backgroundColor: theme.colors.primary.base },
            isLoading && { backgroundColor: theme.colors.primary.disabled }
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.neutral.surface} />
          ) : (
            <Text style={styles.loginButtonText}>{arabicTranslations.login}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: theme.colors.neutral.border }]} />
          <Text style={[styles.dividerText, { color: theme.colors.neutral.textSecondary }]}>{arabicTranslations.or}</Text>
          <View style={[styles.divider, { backgroundColor: theme.colors.neutral.border }]} />
        </View>

        {/* New Phone Login Button */}
        <TouchableOpacity
          style={[styles.phoneLoginButton, { borderColor: theme.colors.primary.base }]}
          onPress={handlePhoneLoginPress}
        >
          <Ionicons 
            name="phone-portrait-outline" 
            size={20} 
            color={theme.colors.primary.base} 
            style={styles.phoneButtonIcon} 
          />
          <Text style={[styles.phoneLoginText, { color: theme.colors.primary.base }]}>
            {arabicTranslations.loginWithPhone}
          </Text>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: theme.colors.neutral.textSecondary }]}>
            {arabicTranslations.dontHaveAccount}{' '}
          </Text>
          <TouchableOpacity onPress={handleRegisterPress}>
            <Text style={[styles.registerLink, { color: theme.colors.primary.base }]}>
              {arabicTranslations.register}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading overlay with animation */}
      <Animated.View 
        style={[
          styles.loadingOverlay,
          { 
            opacity: fadeAnim,
            display: isLoading ? 'flex' : 'none'
          }
        ]}
      >
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
          {loadingMessage ? (
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          ) : null}
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  logo: {
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
  formContainer: {
    paddingHorizontal: theme.spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
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
  eyeIcon: {
    padding: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  loginButton: {
    borderRadius: theme.borderRadius.medium,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  loginButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  registerText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
  },
  registerLink: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: theme.colors.neutral.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.neutral.textPrimary,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    marginTop: theme.spacing.md,
  },
  phoneLoginButton: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.medium,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
  },
  phoneButtonIcon: {
    marginRight: theme.spacing.sm,
  },
  phoneLoginText: {
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
  },
});

export default Login;