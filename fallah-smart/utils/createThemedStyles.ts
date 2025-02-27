import { StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

export const createThemedStyles = (styleCreator: (theme: typeof theme) => any) => {
  return StyleSheet.create(styleCreator(theme));
}; 