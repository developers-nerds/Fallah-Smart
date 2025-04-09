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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';
import { arabicTranslations, PasswordValidation } from '../Register';

interface PasswordStepProps {
  password: string;
  confirmPassword: string;
  updatePassword: (password: string, confirmPassword: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

// Component for password requirements
const PasswordRequirements = ({ validation }: { validation: PasswordValidation }) => (
  <View style={styles.passwordRequirements}>
    <Text style={styles.requirementsTitle}>{arabicTranslations.passwordRequirements.title}</Text>
    <View style={styles.requirementRow}>
      <FontAwesome 
        name={validation.minLength ? "check-circle" : "circle-o"} 
        size={14} 
        color={validation.minLength ? theme.colors.success : theme.colors.neutral.gray.light} 
      />
      <Text style={styles.requirementText}>{arabicTranslations.passwordRequirements.minLength}</Text>
    </View>
    <View style={styles.requirementRow}>
      <FontAwesome 
        name={validation.hasUppercase ? "check-circle" : "circle-o"} 
        size={14} 
        color={validation.hasUppercase ? theme.colors.success : theme.colors.neutral.gray.light} 
      />
      <Text style={styles.requirementText}>{arabicTranslations.passwordRequirements.uppercase}</Text>
    </View>
    <View style={styles.requirementRow}>
      <FontAwesome 
        name={validation.hasLowercase ? "check-circle" : "circle-o"} 
        size={14} 
        color={validation.hasLowercase ? theme.colors.success : theme.colors.neutral.gray.light} 
      />
      <Text style={styles.requirementText}>{arabicTranslations.passwordRequirements.lowercase}</Text>
    </View>
    <View style={styles.requirementRow}>
      <FontAwesome 
        name={validation.hasNumber ? "check-circle" : "circle-o"} 
        size={14} 
        color={validation.hasNumber ? theme.colors.success : theme.colors.neutral.gray.light} 
      />
      <Text style={styles.requirementText}>{arabicTranslations.passwordRequirements.number}</Text>
    </View>
    <View style={styles.requirementRow}>
      <FontAwesome 
        name={validation.hasSpecial ? "check-circle" : "circle-o"} 
        size={14} 
        color={validation.hasSpecial ? theme.colors.success : theme.colors.neutral.gray.light} 
      />
      <Text style={styles.requirementText}>{arabicTranslations.passwordRequirements.special}</Text>
    </View>
  </View>
);

const PasswordStep = ({ 
  password, 
  confirmPassword, 
  updatePassword, 
  onBack, 
  onSubmit, 
  isLoading 
}: PasswordStepProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });

  // Update password validation when password changes
  useEffect(() => {
    validatePassword(password);
  }, [password]);

  const validatePassword = (pwd: string) => {
    setPasswordValidation({
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    });
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(value => value);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
            {arabicTranslations.createAccount}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>
            {arabicTranslations.signUpToStart}
          </Text>
        </View>

        {/* Step Content */}
        <View style={styles.formContainer}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>{arabicTranslations.step3Title}</Text>
          </View>

          {/* Password Fields */}
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
              onChangeText={(text) => updatePassword(text, confirmPassword)}
              secureTextEntry={!showPassword}
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(false)}
            />
            <TouchableOpacity
              onPress={toggleShowPassword}
              style={[styles.eyeIcon, { backgroundColor: theme.colors.neutral.surface }]}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={theme.colors.neutral.textSecondary}
              />
            </TouchableOpacity>
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
              placeholder={arabicTranslations.confirmPassword}
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={confirmPassword}
              onChangeText={(text) => updatePassword(password, text)}
              secureTextEntry={!showPassword}
            />
          </View>

          {/* Password Requirements */}
          {showPasswordRequirements && (
            <PasswordRequirements validation={passwordValidation} />
          )}

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.backButton, { borderColor: theme.colors.primary.base }]}
              onPress={onBack}
              disabled={isLoading}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.primary.base }]}>
                {arabicTranslations.back}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button, 
                styles.registerButton, 
                { backgroundColor: theme.colors.primary.base },
                (!isPasswordValid() || password !== confirmPassword || isLoading) && 
                  { backgroundColor: theme.colors.primary.disabled }
              ]}
              onPress={onSubmit}
              disabled={!isPasswordValid() || password !== confirmPassword || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.neutral.surface} />
              ) : (
                <Text style={styles.registerButtonText}>{arabicTranslations.register}</Text>
              )}
            </TouchableOpacity>
          </View>
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
    marginBottom: theme.spacing.xl,
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
    paddingBottom: theme.spacing.xl,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  button: {
    borderRadius: theme.borderRadius.medium,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  backButton: {
    borderWidth: 1,
    marginRight: 10,
  },
  registerButton: {
    marginLeft: 10,
  },
  backButtonText: {
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
  },
  registerButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
  },
  passwordRequirements: {
    backgroundColor: theme.colors.neutral.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  requirementsTitle: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    marginBottom: 8,
    color: theme.colors.neutral.textPrimary,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    marginLeft: 8,
    color: theme.colors.neutral.textSecondary,
  },
});

export default PasswordStep; 