import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface FABProps {
  icon: string;
  onPress: () => void;
  style?: ViewStyle;
  size?: number;
  disabled?: boolean;
}

export const FAB = ({ 
  icon, 
  onPress, 
  style, 
  size = 24,
  disabled = false 
}: FABProps) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { backgroundColor: theme.colors.primary.base },
        disabled && { opacity: 0.6 },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialCommunityIcons 
        name={icon} 
        size={size} 
        color="#FFF" 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
}); 