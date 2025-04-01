import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StockStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { storage } from '../../utils/storage';
import { theme } from '../../theme/theme';
import { API_URL as configApiUrl } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

type PhoneLoginNavigationProp = NativeStackNavigationProp<StockStackParamList>;

// Arabic translations
const arabicTranslations = {
  phoneLogin: 'تسجيل الدخول برقم الهاتف',
  phoneNumber: 'رقم الهاتف',
  sendCode: 'إرسال رمز التحقق',
  resendCode: 'إعادة إرسال الرمز',
  verifyCode: 'التحقق من الرمز',
  verificationCode: 'رمز التحقق',
  enterVerificationCode: 'أدخل رمز التحقق المرسل إلى هاتفك',
  incorrectCode: 'رمز التحقق غير صحيح',
  enterPhoneNumber: 'أدخل رقم هاتفك للتحقق. سيتم إرسال رمز التحقق برسالة نصية.',
  inSeconds: 'في {{seconds}} ثانية',
  phoneNumberInvalid: 'رقم الهاتف غير صالح',
  networkError: 'خطأ في الشبكة. يرجى المحاولة مرة أخرى.',
  smsSent: 'تم إرسال رمز التحقق إلى رقم هاتفك. يرجى التحقق من الرسائل النصية الواردة.',
  verificationCodeIs: 'رمز التحقق الخاص بك هو: ',
  developmentMode: 'وضع التطوير: تم إظهار الرمز كإشعار',
};

const PhoneLogin = () => {
  const navigation = useNavigation<PhoneLoginNavigationProp>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { forceSendAllNotifications } = useAuth();
  
  // Countdown for resend button
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  
  // Timer for countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);
  
  // Input refs
  const codeInputRef = useRef<TextInput>(null);
  
  // API URL with fallback
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 
                  configApiUrl || 
                  'http://192.168.1.3:5000/api';
  
  // Format phone number to ensure it has country code
  const formatPhoneNumber = (number: string) => {
    // Remove all non-digit characters
    let digits = number.replace(/\D/g, '');
    
    // If the number already has a country code (starts with +), return as is
    if (number.startsWith('+')) {
      return number;
    }
    
    // If the number starts with 00, replace with +
    if (number.startsWith('00')) {
      return '+' + digits.substring(2);
    }
    
    // If the number starts with 0, assume it's a local number and add Tunisia country code
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    
    // Add Tunisia country code (+216)
    return '+216' + digits;
  };
  
  // Handle send verification code
  const handleSendCode = async () => {
    try {
      Keyboard.dismiss();
      setError('');
      
      // Basic validation
      if (!phoneNumber.trim()) {
        setError(arabicTranslations.phoneNumberInvalid);
        return;
      }
      
      // Format phone number
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber.trim());
      console.log("Formatted phone number:", formattedPhoneNumber);
      
      setIsLoading(true);
      
      // Send verification code
      const response = await axios.post(`${API_URL}/phone-auth/send-code`, {
        phoneNumber: formattedPhoneNumber
      });
      
      console.log("Send code response:", response.data);
      
      // Start countdown for resend (60 seconds)
      setCountdown(60);
      setCanResend(false);
      
      // Update UI to show verification code input
      setIsVerificationSent(true);
      
      // Focus on code input
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
      
      // Display verification code for development mode
      if (response.data.inDevelopment && response.data.verificationCode) {
        const verificationCode = response.data.verificationCode;
        
        // Show code in alert
        Alert.alert(
          'رمز التحقق (وضع التطوير)',
          `${arabicTranslations.verificationCodeIs} ${verificationCode}`,
          [{ text: 'نسخ وإغلاق', style: 'default' }]
        );
        
        // Also show as toast
        if (Platform.OS === 'android') {
          ToastAndroid.showWithGravity(
            `${arabicTranslations.verificationCodeIs} ${verificationCode}`,
            ToastAndroid.LONG,
            ToastAndroid.TOP
          );
        }
        
        // Set the verification code automatically
        setVerificationCode(verificationCode);
      } else {
        // Regular alert for SMS sent
        Alert.alert(
          'رمز التحقق',
          arabicTranslations.smsSent
        );
      }
      
    } catch (error: any) {
      console.error('Send code error:', error);
      let errorMessage = arabicTranslations.networkError;
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      Alert.alert('خطأ', errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle verify and login
  const handleVerifyAndLogin = async () => {
    try {
      Keyboard.dismiss();
      setError('');
      
      // Basic validation
      if (!verificationCode.trim()) {
        setError(arabicTranslations.incorrectCode);
        return;
      }
      
      // Format phone number
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber.trim());
      
      setIsLoading(true);
      
      // Verify code and login/register
      const response = await axios.post(`${API_URL}/phone-auth/verify`, {
        phoneNumber: formattedPhoneNumber,
        verificationCode: verificationCode.trim()
      });
      
      console.log("Verification response:", response.data);
      
      const { user, tokens, isNewUser } = response.data;
      
      if (!user || !tokens) {
        throw new Error('Invalid response from server');
      }
      
      // Save tokens using the storage utility (same as in Login.tsx)
      await Promise.all([
        storage.setUser(user),
        storage.setTokens(tokens.access.token, tokens.refresh.token)
      ]);
      
      // Set auth header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access.token}`;
      
      console.log('Login successful, token stored:', tokens.access.token);
      
      // Trigger notifications after successful login (similar to Login.tsx)
      setTimeout(async () => {
        try {
          console.log('Triggering stock notifications after phone login...');
          const result = await forceSendAllNotifications();
          console.log('Stock notifications triggered:', result);
        } catch (error) {
          console.error('Failed to trigger stock notifications:', error);
        }
      }, 2000);
      
      // Check if user is new (needs to complete profile)
      if (isNewUser) {
        // Navigate to complete profile
        navigation.replace('CompleteProfile', { userId: user.id });
      } else {
        // Navigate to home screen
        navigation.replace('WelcomeOnboarding');
      }
      
    } catch (error: any) {
      console.error('Verification error:', error);
      let errorMessage = arabicTranslations.incorrectCode;
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      Alert.alert('خطأ', errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {arabicTranslations.phoneLogin}
          </Text>
        </View>
        
        {!isVerificationSent ? (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary.base} />
              <Text style={styles.infoText}>
                {arabicTranslations.enterPhoneNumber}
              </Text>
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { textAlign: 'right' }]}
                placeholder={arabicTranslations.phoneNumber}
                placeholderTextColor={theme.colors.neutral.textSecondary}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                onSubmitEditing={handleSendCode}
                editable={!isLoading}
              />
            </View>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: isLoading ? theme.colors.primary.disabled : theme.colors.primary.base }
              ]}
              onPress={handleSendCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.neutral.surface} />
              ) : (
                <Text style={styles.buttonText}>{arabicTranslations.sendCode}</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.primary.base} />
              <Text style={styles.infoText}>
                {arabicTranslations.enterVerificationCode}
              </Text>
            </View>
            
            <View style={styles.codeContainer}>
              <TextInput
                ref={codeInputRef}
                style={[styles.codeInput, { textAlign: 'center' }]}
                placeholder={arabicTranslations.verificationCode}
                placeholderTextColor={theme.colors.neutral.textSecondary}
                keyboardType="number-pad"
                value={verificationCode}
                onChangeText={setVerificationCode}
                onSubmitEditing={handleVerifyAndLogin}
                editable={!isLoading}
                maxLength={6}
              />
            </View>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: isLoading ? theme.colors.primary.disabled : theme.colors.primary.base }
              ]}
              onPress={handleVerifyAndLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.neutral.surface} />
              ) : (
                <Text style={styles.buttonText}>{arabicTranslations.verifyCode}</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.resendButton,
                { opacity: canResend ? 1 : 0.5 }
              ]}
              onPress={handleSendCode}
              disabled={!canResend || isLoading}
            >
              <Text style={styles.resendText}>
                {canResend 
                  ? arabicTranslations.resendCode 
                  : `${arabicTranslations.resendCode} ${arabicTranslations.inSeconds.replace('{{seconds}}', countdown.toString())}`
                }
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.changePhoneButton}
              onPress={() => {
                setIsVerificationSent(false);
                setVerificationCode('');
                setError('');
              }}
              disabled={isLoading}
            >
              <Text style={styles.changePhoneText}>
                <Ionicons name="arrow-back" size={16} />
                تغيير رقم الهاتف
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      
      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator 
            size="large" 
            color={theme.colors.primary.base} 
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.xl,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSizes.h1,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.light,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.primary.dark,
    marginLeft: theme.spacing.sm,
    textAlign: 'right',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.surface,
    marginBottom: theme.spacing.md,
  },
  input: {
    height: 50,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
  codeContainer: {
    marginBottom: theme.spacing.md,
  },
  codeInput: {
    height: 60,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.surface,
    fontSize: 24,
    fontFamily: theme.fonts.bold,
    letterSpacing: 4,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.primary.base,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  button: {
    height: 50,
    borderRadius: theme.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  buttonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
  },
  resendButton: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  resendText: {
    color: theme.colors.primary.base,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  },
  changePhoneButton: {
    alignItems: 'center',
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  changePhoneText: {
    color: theme.colors.neutral.textSecondary,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});

export default PhoneLogin; 