import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

export interface CustomButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  type?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  loading?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  disabled = false,
  type = 'primary',
  style,
  loading = false,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#ccc';
    switch (type) {
      case 'primary':
        return '#5CA73C';
      case 'secondary':
        return '#E9EFF6';
      case 'outline':
        return 'transparent';
      default:
        return '#5CA73C';
    }
  };

  const getTextColor = () => {
    if (disabled) return '#888';
    switch (type) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return '#4A4A4A';
      case 'outline':
        return '#5CA73C';
      default:
        return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    if (disabled) return '#ccc';
    return type === 'outline' ? '#5CA73C' : 'transparent';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: type === 'outline' ? 1 : 0,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 