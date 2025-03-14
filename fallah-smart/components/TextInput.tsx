import React from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../utils/createThemedStyles';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
          {label}
        </Text>
      )}
      <RNTextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.neutral.background,
            borderColor: error ? theme.colors.error.base : theme.colors.neutral.border,
            color: theme.colors.neutral.textPrimary,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.neutral.textSecondary}
        {...props}
      />
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error.base }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
})); 