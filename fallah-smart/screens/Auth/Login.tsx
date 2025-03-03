import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { storage } from '../../utils/storage';

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        email,
        password,
      });

      const { user, tokens } = response.data;

      await Promise.all([
        storage.setUser(user),
        storage.setTokens(tokens.access.token, tokens.refresh.token)
      ]);

      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access.token}`;

      // Changed from 'Home' to 'StockTab' to match your navigation structure
      navigation.navigate('StockTab');

    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login');
      Alert.alert('Login Error', error);
    } finally {
      setIsLoading(false);
    }
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
        <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>Welcome Back!</Text>
        <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>Sign in to continue</Text>
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
            style={[styles.input, { color: theme.colors.neutral.textPrimary }]}
            placeholder="Email"
            placeholderTextColor={theme.colors.neutral.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={theme.colors.neutral.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={[styles.forgotPasswordText, { color: theme.colors.neutral.textSecondary }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

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
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: theme.colors.neutral.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              navigation.navigate('Register');
            }}
          >
            <Text style={[styles.registerLink, { color: theme.colors.primary.base }]}>
              Register
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  forgotPasswordText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
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
});

export default Login;
