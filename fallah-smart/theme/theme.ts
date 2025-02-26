import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';

// Theme Definition
const theme = {
  colors: {
    primary: {
      base: '#2E7D32', // Main actions (e.g., Diagnose, Accept)
      light: '#4CAF50', // Hover/active
      dark: '#1B5E20',  // Pressed/shadows
      disabled: '#A5D6A7', // Inactive
    },
    secondary: {
      base: '#5D4037', // Secondary actions (e.g., Cancel)
      light: '#8D6E63', // Hover/active
      dark: '#3E2723',  // Pressed
      disabled: '#BCAAA4', // Inactive
    },
    accent: {
      base: '#FBC02D', // Highlights (e.g., Subscribe, Alerts)
      light: '#FFD54F', // Hover/active
      dark: '#F9A825',  // Pressed
      disabled: '#FFF59D', // Inactive
    },
    neutral: {
      background: '#F5F5F5', // App background
      surface: '#FFFFFF',    // Cards, modals
      textPrimary: '#212121', // Main text
      textSecondary: '#757575', // Subtext
      gray: {
        base: '#B0BEC5', // Borders, icons
        light: '#ECEFF1', // Light backgrounds
        dark: '#78909C',  // Darker emphasis
      },
    },
    error: '#D32F2F', // Error states
  },
  fonts: {
    regular: 'Roboto-Regular',
    medium: 'Roboto-Medium',
    bold: 'Roboto-Bold',
  },
  fontSizes: {
    h1: 24,    // Headers
    h2: 20,    // Subheaders
    body: 14,  // Main text
    caption: 12, // Small text
    button: 16, // Button text
  },
  spacing: {
    xs: 4,  // Extra small
    sm: 8,  // Small
    md: 16, // Medium
    lg: 24, // Large
    xl: 32, // Extra large
  },
  borderRadius: {
    small: 4,  // Inputs, alerts
    medium: 8, // Buttons, cards
    large: 16, // Modals
  },
};

// Styles for UI Elements
const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
    padding: theme.spacing.md,
  },

  // Typography
  header: {
    fontSize: theme.fontSizes.h1,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginBottom: theme.spacing.lg,
  },
  subheader: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.md,
  },
  bodyText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
  caption: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },

  // Buttons
  primaryButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  primaryButtonDisabled: {
    backgroundColor: theme.colors.primary.disabled,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  secondaryButtonDisabled: {
    backgroundColor: theme.colors.secondary.disabled,
  },
  accentButton: {
    backgroundColor: theme.colors.accent.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  accentButtonDisabled: {
    backgroundColor: theme.colors.accent.disabled,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  outlineButtonDisabled: {
    borderColor: theme.colors.primary.disabled,
  },
  buttonText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.button,
    color: '#FFFFFF', // Default for filled buttons
  },
  buttonTextDark: {
    color: theme.colors.neutral.textPrimary, // For accent button
  },
  buttonTextOutline: {
    color: theme.colors.primary.base, // For outline button
  },
  buttonTextDisabled: {
    color: theme.colors.neutral.textSecondary,
  },

  // Text Input
  input: {
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray.base,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.md,
  },
  inputFocused: {
    borderColor: theme.colors.primary.base,
  },
  inputDisabled: {
    backgroundColor: theme.colors.neutral.gray.light,
    color: theme.colors.neutral.textSecondary,
  },

  // Card
  card: {
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray.light,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: theme.spacing.md,
  },

  // Navigation (Bottom Tab)
  tabBar: {
    backgroundColor: theme.colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.gray.light,
    padding: theme.spacing.sm,
  },
  tabActive: {
    color: theme.colors.primary.base,
  },
  tabInactive: {
    color: theme.colors.neutral.textSecondary,
  },

  // Modal
  modal: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // Alert
  alertSuccess: {
    backgroundColor: theme.colors.primary.base,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing.sm,
  },
  alertWarning: {
    backgroundColor: theme.colors.accent.base,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing.sm,
  },
  alertError: {
    backgroundColor: theme.colors.error,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing.sm,
  },
  alertText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.body,
  },
  alertTextWarning: {
    color: theme.colors.neutral.textPrimary,
  },

  // Toggle Switch
  switchOn: {
    backgroundColor: theme.colors.primary.base,
  },
  switchOff: {
    backgroundColor: theme.colors.neutral.gray.base,
  },
  switchThumb: {
    backgroundColor: theme.colors.neutral.surface,
  },

  // Progress Indicator
  progress: {
    color: theme.colors.primary.base,
  },
});
