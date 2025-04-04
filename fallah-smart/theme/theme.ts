import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';

// Theme Definition
export const theme = {
  colors: {
    primary: {
      base: '#093731',    // Deep forest green (main brand color)
      light: '#1A4F47',   // Fresh leaf green
      dark: '#052420',    // Deep forest
      disabled: '#A5C4C0', // Muted green
      surface: '#E8F5F3',  // Light green surface
    },
    secondary: {
      base: '#6F732F',    // Olive green (secondary brand color)
      light: '#8B8F4A',   // Light olive
      dark: '#4A4D1F',    // Deep olive
      disabled: '#C4C6A3', // Muted olive
      surface: '#F5F6E8',  // Light olive surface
    },
    accent: {
      base: '#DB2763',    // Vibrant pink (accent color)
      light: '#E85B8B',   // Light pink
      dark: '#B31B4A',    // Deep pink
      disabled: '#F0A3B8', // Muted pink
      surface: '#FDF0F3',  // Light pink surface
    },
    neutral: {
      background: '#F8F9F6', // Light sage
      surface: '#FFFFFF',    // Clean white
      textPrimary: '#1A2F2B', // Deep forest
      textSecondary: '#4A5F5B', // Aged leaf
      border: '#E6EAE8',      // Natural fiber
      gray: {
        base: '#846A6A',     // Warm gray (from provided colors)
        light: '#F0E9E9',    // Light warm gray
        dark: '#5C4A4A',     // Dark warm gray
        darker: '#3C3030',   // Darker warm gray
      },
    },
    error: '#DB2763',     // Using accent pink for errors
    success: '#093731',   // Using primary green for success
    warning: '#6F732F',   // Using secondary olive for warnings
    info: '#846A6A',      // Using neutral gray for info
  },
  fonts: {
    regular: 'Roboto-Regular',
    medium: 'Roboto-Medium',
    bold: 'Roboto-Bold',
  },
  fontSizes: {
    h1: 32,    // Large headers
    h2: 24,    // Subheaders
    body: 18,  // Main text - larger for better readability
    caption: 16, // Small text - larger for better readability
    button: 20, // Button text - larger for better touch targets
  },
  spacing: {
    xs: 8,   // Extra small
    sm: 12,  // Small
    md: 20,  // Medium
    lg: 32,  // Large
    xl: 40,  // Extra large
  },
  borderRadius: {
    small: 8,   // Inputs, alerts
    medium: 12, // Buttons, cards
    large: 20,  // Modals
  },
  typography: {
    arabic: {
      h1: {
        fontSize: 40,
        lineHeight: 48,
        fontWeight: 'bold',
        letterSpacing: 0.15,
      },
      h2: {
        fontSize: 32,
        lineHeight: 40,
        fontWeight: '600',
        letterSpacing: 0.15,
      },
      h3: {
        fontSize: 28,
        lineHeight: 36,
        fontWeight: '600',
        letterSpacing: 0.15,
      },
      body: {
        fontSize: 20,
        lineHeight: 28,
        fontWeight: 'normal',
        letterSpacing: 0.5,
      },
      caption: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: 'normal',
        letterSpacing: 0.25,
      },
      body1: {
        fontSize: 16,
      },
    },
  },
  shadows: {
    small: {
      shadowColor: '#093731',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#093731',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#093731',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
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
    ...theme.shadows.small,
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
    ...theme.shadows.small,
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
    ...theme.shadows.small,
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
    color: '#FFFFFF',
  },
  buttonTextDark: {
    color: theme.colors.neutral.textPrimary,
  },
  buttonTextOutline: {
    color: theme.colors.primary.base,
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
    ...theme.shadows.small,
  },
  inputFocused: {
    borderColor: theme.colors.primary.base,
    ...theme.shadows.medium,
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
    ...theme.shadows.medium,
    marginBottom: theme.spacing.md,
  },

  // Navigation (Bottom Tab)
  tabBar: {
    backgroundColor: theme.colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.gray.light,
    padding: theme.spacing.sm,
    ...theme.shadows.medium,
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
    ...theme.shadows.large,
  },
  modalOverlay: {
    backgroundColor: 'rgba(9, 55, 49, 0.5)',
  },

  // Alert
  alertSuccess: {
    backgroundColor: theme.colors.primary.base,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  alertWarning: {
    backgroundColor: theme.colors.secondary.base,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  alertError: {
    backgroundColor: theme.colors.accent.base,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
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
