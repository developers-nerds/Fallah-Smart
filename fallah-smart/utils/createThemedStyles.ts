import { StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

type Theme = typeof theme;
type StyleFunction = (theme: Theme) => any;

export const createThemedStyles = (styleFunction: StyleFunction) => {
  return styleFunction(theme);
};

export const createDynamicStyles = (styleFunction: StyleFunction) => {
  return (theme: Theme) => styleFunction(theme);
};

export const getThemedColor = (colorPath: string) => {
  const path = colorPath.split('.');
  let value: any = theme.colors;
  
  for (const key of path) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color path "${colorPath}" not found in theme`);
      return theme.colors.primary.base;
    }
  }
  
  return value;
};

export const getThemedSpacing = (size: keyof Theme['spacing']) => {
  return theme.spacing[size];
};

export const getThemedFontSize = (size: keyof Theme['fontSizes']) => {
  return theme.fontSizes[size];
};

export const getThemedFontFamily = (weight: keyof Theme['fonts']) => {
  return theme.fonts[weight];
};

export const getThemedBorderRadius = (size: keyof Theme['borderRadius']) => {
  return theme.borderRadius[size];
};

export const getThemedShadow = (size: keyof Theme['shadows']) => {
  return theme.shadows[size];
}; 