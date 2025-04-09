import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';
import { arabicTranslations, FormData } from '../Register';

interface PersonalInfoStepProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Gender selector component
const GenderSelector = ({ 
  selectedGender, 
  onSelectGender 
}: { 
  selectedGender: 'male' | 'female'; 
  onSelectGender: (gender: 'male' | 'female') => void 
}) => (
  <View style={styles.genderContainer}>
    <Text style={[styles.genderLabel, { color: theme.colors.neutral.textPrimary }]}>
      {arabicTranslations.gender}
    </Text>
    <View style={styles.genderOptions}>
      <TouchableOpacity 
        style={[
          styles.genderOption, 
          selectedGender === 'male' && { 
            backgroundColor: theme.colors.primary.light,
            borderColor: theme.colors.primary.base
          }
        ]}
        onPress={() => onSelectGender('male')}
      >
        <Ionicons 
          name={selectedGender === 'male' ? 'radio-button-on' : 'radio-button-off'} 
          size={20} 
          color={selectedGender === 'male' ? theme.colors.primary.base : theme.colors.neutral.textSecondary} 
        />
        <Text style={[
          styles.genderText, 
          { color: selectedGender === 'male' ? theme.colors.primary.base : theme.colors.neutral.textPrimary }
        ]}>
          {arabicTranslations.male}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.genderOption, 
          selectedGender === 'female' && { 
            backgroundColor: theme.colors.primary.light,
            borderColor: theme.colors.primary.base
          }
        ]}
        onPress={() => onSelectGender('female')}
      >
        <Ionicons 
          name={selectedGender === 'female' ? 'radio-button-on' : 'radio-button-off'} 
          size={20} 
          color={selectedGender === 'female' ? theme.colors.primary.base : theme.colors.neutral.textSecondary} 
        />
        <Text style={[
          styles.genderText, 
          { color: selectedGender === 'female' ? theme.colors.primary.base : theme.colors.neutral.textPrimary }
        ]}>
          {arabicTranslations.female}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const PersonalInfoStep = ({ formData, updateFormData, onNext, onBack }: PersonalInfoStepProps) => {
  const handleInputChange = (field: keyof FormData, value: string) => {
    updateFormData({ [field]: value });
  };

  const setGender = (gender: 'male' | 'female') => {
    updateFormData({ gender });
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
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>{arabicTranslations.step2Title}</Text>
          </View>

          {/* Personal Information Inputs */}
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
            <Ionicons
              name="person-outline"
              size={20}
              color={theme.colors.neutral.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.neutral.textPrimary, textAlign: 'right' }]}
              placeholder={arabicTranslations.username}
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
            <Ionicons
              name="person-outline"
              size={20}
              color={theme.colors.neutral.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.neutral.textPrimary, textAlign: 'right' }]}
              placeholder={arabicTranslations.firstName}
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              autoCapitalize="words"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
            <Ionicons
              name="person-outline"
              size={20}
              color={theme.colors.neutral.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.neutral.textPrimary, textAlign: 'right' }]}
              placeholder={arabicTranslations.lastName}
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
              autoCapitalize="words"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
            <Ionicons
              name="call-outline"
              size={20}
              color={theme.colors.neutral.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.neutral.textPrimary, textAlign: 'right' }]}
              placeholder={arabicTranslations.phoneNumber}
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.phoneNumber}
              onChangeText={(text) => handleInputChange('phoneNumber', text)}
              keyboardType={"phone-pad" as KeyboardTypeOptions}
            />
          </View>

          {/* Gender Selection */}
          <GenderSelector
            selectedGender={formData.gender}
            onSelectGender={setGender}
          />

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.backButton, { borderColor: theme.colors.primary.base }]}
              onPress={onBack}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.primary.base }]}>
                {arabicTranslations.back}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.nextButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={onNext}
            >
              <Text style={styles.nextButtonText}>
                {arabicTranslations.next}
              </Text>
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
  nextButton: {
    marginLeft: 10,
  },
  backButtonText: {
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
  },
  nextButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
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
});

export default PersonalInfoStep; 