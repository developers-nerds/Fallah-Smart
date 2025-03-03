import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type ThemedTextProps = TextProps & {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  arabic?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'textPrimary' | 'textSecondary';
};

export const ThemedText: React.FC<ThemedTextProps> = ({ 
  style, 
  variant = 'body',
  arabic = true,
  color = 'textPrimary',
  ...props 
}) => {
  const theme = useTheme();
  
  const getColor = () => {
    switch (color) {
      case 'primary':
        return theme.colors.primary.base;
      case 'secondary':
        return theme.colors.secondary.base;
      case 'accent':
        return theme.colors.accent.base;
      case 'textSecondary':
        return theme.colors.neutral.textSecondary;
      default:
        return theme.colors.neutral.textPrimary;
    }
  };

  return (
    <Text 
      style={[
        theme.typography.arabic[variant],
        arabic && styles.arabic,
        { color: getColor() },
        style
      ]} 
      {...props} 
    />
  );
};

const styles = StyleSheet.create({
  arabic: {
    writingDirection: 'rtl',
    textAlign: 'right',
    fontFamily: 'Arial',
  },
}); 