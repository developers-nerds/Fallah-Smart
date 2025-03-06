import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../utils/createThemedStyles';

interface ThemedTextProps extends TextProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral';
  size?: 'h1' | 'h2' | 'body' | 'caption' | 'button';
  weight?: 'regular' | 'medium' | 'bold';
}

export const ThemedText: React.FC<ThemedTextProps> = ({ 
  style, 
  variant = 'neutral',
  size = 'body',
  weight = 'regular',
  ...props 
}) => {
  const theme = useTheme();
  
  const styles = createThemedStyles((theme) => ({
    base: {
      color: theme.colors[variant].base || theme.colors.neutral.textPrimary,
      fontSize: theme.fontSizes[size],
      fontFamily: theme.fonts[weight],
    },
  }));

  return <Text style={[styles.base, style]} {...props} />;
}; 