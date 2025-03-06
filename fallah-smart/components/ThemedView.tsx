import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../utils/createThemedStyles';

interface ThemedViewProps extends ViewProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'surface';
}

export const ThemedView: React.FC<ThemedViewProps> = ({ 
  style, 
  variant = 'neutral',
  ...props 
}) => {
  const theme = useTheme();
  
  const styles = createThemedStyles((theme) => ({
    base: {
      backgroundColor: theme.colors[variant].surface || theme.colors.neutral.surface,
    },
  }));

  return <View style={[styles.base, style]} {...props} />;
}; 