import React from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  ViewStyle,
  TextStyle
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export const SearchBar = ({ 
  value, 
  onChangeText, 
  placeholder = 'Rechercher...', 
  style,
  inputStyle
}: SearchBarProps) => {
  const theme = useTheme();

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.neutral.surface },
      style
    ]}>
      <MaterialCommunityIcons 
        name="magnify" 
        size={24} 
        color={theme.colors.neutral.textSecondary} 
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.neutral.textSecondary}
        style={[
          styles.input,
          { color: theme.colors.neutral.textPrimary },
          inputStyle
        ]}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <MaterialCommunityIcons 
            name="close-circle" 
            size={20} 
            color={theme.colors.neutral.textSecondary} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    margin: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
}); 