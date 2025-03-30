import React, { useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Keyboard,
  NativeSyntheticEvent,
  TextInputChangeEventData
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
  const inputRef = useRef<TextInput>(null);
  
  // Handling text changes without losing focus
  const handleChangeText = (text: string) => {
    onChangeText(text);
    // Ensure input maintains focus
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };
  
  // Make sure the input stays focused when value changes externally
  useEffect(() => {
    if (inputRef.current && value.length > 0) {
      inputRef.current.focus();
    }
  }, [value]);

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
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.neutral.textSecondary}
        style={[
          styles.input,
          { color: theme.colors.neutral.textPrimary },
          inputStyle
        ]}
        autoCorrect={false}
        returnKeyType="search"
        keyboardType="default"
        blurOnSubmit={false}
        autoCapitalize="none"
        clearButtonMode="while-editing" // iOS only
        enablesReturnKeyAutomatically={false}
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      {value.length > 0 && (
        <TouchableOpacity 
          onPress={() => {
            onChangeText('');
            // Ensure input regains focus after clearing
            setTimeout(() => {
              inputRef.current?.focus();
            }, 10);
          }}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
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