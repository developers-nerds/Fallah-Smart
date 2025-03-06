import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../utils/createThemedStyles';
import { ThemedText } from './ThemedText';

interface ThemedButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  title: string;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({ 
  style, 
  variant = 'primary',
  size = 'medium',
  loading = false,
  title,
  disabled,
  ...props 
}) => {
  const theme = useTheme();
  
  const styles = createThemedStyles((theme) => ({
    base: {
      backgroundColor: variant === 'outline' 
        ? 'transparent' 
        : theme.colors[variant].base,
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: theme.colors[variant].base,
      paddingVertical: theme.spacing[size === 'small' ? 'xs' : size === 'medium' ? 'sm' : 'md'],
      paddingHorizontal: theme.spacing[size === 'small' ? 'sm' : size === 'medium' ? 'md' : 'lg'],
      borderRadius: theme.borderRadius.medium,
      opacity: disabled ? 0.5 : 1,
    },
  }));

  return (
    <TouchableOpacity 
      style={[styles.base, style]} 
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? theme.colors[variant].base : '#FFFFFF'} 
        />
      ) : (
        <ThemedText
          variant={variant === 'outline' ? variant : 'neutral'}
          size="button"
          weight="medium"
          style={{ color: variant === 'outline' ? theme.colors[variant].base : '#FFFFFF' }}
        >
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}; 