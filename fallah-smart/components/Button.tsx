import { forwardRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type ButtonProps = {
  title?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
} & TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(({ title, variant = 'primary', ...touchableProps }, ref) => {
  const theme = useTheme();

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: variant === 'primary' ? theme.colors.primary.base :
        variant === 'secondary' ? theme.colors.secondary.base :
        variant === 'accent' ? theme.colors.accent.base :
        'transparent',
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: variant === 'outline' ? theme.colors.primary.base : undefined,
    },
    touchableProps.disabled && { backgroundColor: theme.colors.primary.disabled },
    touchableProps.style,
  ];

  const textStyles = [
    styles.buttonText,
    {
      color: variant === 'outline' ? theme.colors.primary.base :
        variant === 'accent' ? theme.colors.neutral.textPrimary :
        theme.colors.neutral.surface,
    },
    touchableProps.disabled && { color: theme.colors.neutral.textSecondary },
  ];

  return (
    <TouchableOpacity ref={ref} {...touchableProps} style={buttonStyles}>
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 24,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
