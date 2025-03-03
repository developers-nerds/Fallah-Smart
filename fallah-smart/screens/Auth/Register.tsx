import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { storage } from '../../utils/storage';
import { FontAwesome } from '@expo/vector-icons';


const Register = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    gender: 'male',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const handleRegister = async () => {
    try {
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      setIsLoading(true);
      setError('');

      const response = await axios.post('http:192.168.104.24:5000/api/users/register', {
        ...formData,
        role: 'user',
      });

      const { user, tokens } = response.data;

      // Store user and tokens
      await Promise.all([
        storage.setUser(user),
        storage.setTokens(tokens.access.token, tokens.refresh.token)
      ]);

      // Set up axios defaults for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access.token}`;

      Alert.alert('Success', 'Registration successful!', [
        { 
          text: 'OK', 
          onPress: () => navigation.navigate('Login') // Navigate to Login after successful registration
        }
      ]);

    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration');
      Alert.alert('Registration Error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (password) => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>
            Sign up to get started
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
            <Ionicons 
              name="person-outline" 
              size={20} 
              color={theme.colors.neutral.textSecondary} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={[styles.input, { color: theme.colors.neutral.textPrimary }]}
              placeholder="Username"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
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
              style={[styles.input, { color: theme.colors.neutral.textPrimary }]}
              placeholder="First Name"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
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
              style={[styles.input, { color: theme.colors.neutral.textPrimary }]}
              placeholder="Last Name"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color={theme.colors.neutral.textSecondary} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={[styles.input, { color: theme.colors.neutral.textPrimary }]}
              placeholder="Email"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
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
              style={[styles.input, { color: theme.colors.neutral.textPrimary }]}
              placeholder="Phone Number"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.genderContainer}>
            <Text style={[styles.genderLabel, { color: theme.colors.neutral.textPrimary }]}>
              Gender
            </Text>
            <View style={styles.genderOptions}>
              <TouchableOpacity 
                style={[
                  styles.genderOption, 
                  formData.gender === 'male' && { 
                    backgroundColor: theme.colors.primary.light,
                    borderColor: theme.colors.primary.base
                  }
                ]}
                onPress={() => setFormData({...formData, gender: 'male'})}
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
                  Male
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.genderOption, 
                  formData.gender === 'female' && { 
                    backgroundColor: theme.colors.primary.light,
                    borderColor: theme.colors.primary.base
                  }
                ]}
                onPress={() => setFormData({...formData, gender: 'female'})}
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
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={theme.colors.neutral.textSecondary} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={[styles.input, { color: theme.colors.neutral.textPrimary }]}
              placeholder="Password"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.password}
              onChangeText={(text) => {
                setFormData({ ...formData, password: text });
                validatePassword(text);
              }}
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(false)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
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
              style={[styles.input, { color: theme.colors.neutral.textPrimary }]}
              placeholder="Confirm Password"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry={!showPassword}
            />
          </View>

          {showPasswordRequirements && (
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Password must have:</Text>
              <View style={styles.requirementRow}>
                <FontAwesome 
                  name={passwordValidation.minLength ? "check-circle" : "circle-o"} 
                  size={14} 
                  color={passwordValidation.minLength ? theme.colors.success : theme.colors.neutral.gray.medium} 
                />
                <Text style={styles.requirementText}>At least 8 characters</Text>
              </View>
              <View style={styles.requirementRow}>
                <FontAwesome 
                  name={passwordValidation.hasUppercase ? "check-circle" : "circle-o"} 
                  size={14} 
                  color={passwordValidation.hasUppercase ? theme.colors.success : theme.colors.neutral.gray.medium} 
                />
                <Text style={styles.requirementText}>At least one uppercase letter</Text>
              </View>
              <View style={styles.requirementRow}>
                <FontAwesome 
                  name={passwordValidation.hasLowercase ? "check-circle" : "circle-o"} 
                  size={14} 
                  color={passwordValidation.hasLowercase ? theme.colors.success : theme.colors.neutral.gray.medium} 
                />
                <Text style={styles.requirementText}>At least one lowercase letter</Text>
              </View>
              <View style={styles.requirementRow}>
                <FontAwesome 
                  name={passwordValidation.hasNumber ? "check-circle" : "circle-o"} 
                  size={14} 
                  color={passwordValidation.hasNumber ? theme.colors.success : theme.colors.neutral.gray.medium} 
                />
                <Text style={styles.requirementText}>At least one number</Text>
              </View>
              <View style={styles.requirementRow}>
                <FontAwesome 
                  name={passwordValidation.hasSpecial ? "check-circle" : "circle-o"} 
                  size={14} 
                  color={passwordValidation.hasSpecial ? theme.colors.success : theme.colors.neutral.gray.medium} 
                />
                <Text style={styles.requirementText}>At least one special character</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.registerButton,
              { backgroundColor: theme.colors.primary.base },
              isLoading && { backgroundColor: theme.colors.primary.disabled }
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.neutral.surface} />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.colors.neutral.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: theme.colors.primary.base }]}>Login</Text>
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
  registerButton: {
    borderRadius: theme.borderRadius.medium,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  registerButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  loginText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
  },
  loginLink: {
    fontSize: theme.fontSizes.body,
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

export default Register;