import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';

// Theme Definition
export const theme = {
  colors: {
    primary: {
      base: '#2F5E1E',    // Natural forest green
      light: '#4B7B2C',   // Fresh leaf green
      dark: '#1B3912',    // Deep forest green
      disabled: '#A5C49B', // Muted green
    },
    secondary: {
      base: '#8B5E3C',    // Earth brown
      light: '#A67C52',   // Light soil
      dark: '#5C3C22',    // Deep soil
      disabled: '#CCAD91', // Muted brown
    },
    accent: {
      base: '#D4AF37',    // Wheat gold
      light: '#E6C65C',   // Light wheat
      dark: '#B39125',    // Rich harvest
      disabled: '#F2E3AA', // Pale wheat
    },
    neutral: {
      background: '#F8F6F1', // Light parchment
      surface: '#FFFFFF',    // Clean white
      textPrimary: '#2C1810', // Deep bark
      textSecondary: '#6B5750', // Aged wood
      border: '#E6DFD5',      // Natural fiber
      gray: {
        base: '#B0A69A',     // Stone
        light: '#ECE9E4',    // Light sand
        dark: '#786F67',     // Dark stone
      },
    },
    error: '#C23616',     // Terracotta red
    success: '#3C8C2C',   // Natural green
    warning: '#CD950C',   // Amber honey
    info: '#4B6584',      // Rain cloud
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
export const styles = StyleSheet.create({
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
