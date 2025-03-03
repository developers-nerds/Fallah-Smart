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
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  const handleRegister = async () => {
    try {
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      setIsLoading(true);
      setError('');

      const response = await axios.post(`${API_BASE_URL}/users/register`, {
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
              onChangeText={(text) => setFormData({ ...formData, password: text })}
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
});

export default Register;
