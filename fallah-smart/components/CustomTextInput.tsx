import React from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useField } from 'formik';

interface CustomTextInputProps extends RNTextInputProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  icon?: string;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  name,
  label,
  placeholder,
  required = false,
  icon,
  ...props
}) => {
  const theme = useTheme();
  console.log(`Rendering CustomTextInput for field: ${name}`);
  const [field, meta, helpers] = useField(name);
  console.log(`Field state for ${name}:`, { value: field.value, touched: meta.touched, error: meta.error });

  const handleChange = (text: string) => {
    helpers.setValue(text);
  };

  const handleBlur = () => {
    helpers.setTouched(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={theme.colors.neutral.textPrimary}
            style={styles.icon}
          />
        )}
        <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
          {label}{required && ' *'}
        </Text>
      </View>
      
      <RNTextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.neutral.background,
            color: theme.colors.neutral.textPrimary,
            borderColor: meta.error && meta.touched 
              ? theme.colors.error 
              : theme.colors.neutral.border,
          },
          props.multiline && { height: 100, textAlignVertical: 'top' },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.neutral.textSecondary}
        value={field.value ? String(field.value) : ''}
        onChangeText={handleChange}
        onBlur={handleBlur}
        {...props}
      />

      {meta.error && meta.touched && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {meta.error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default CustomTextInput; 