import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
  optional?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'اختر تاريخ',
  error,
  optional = false,
}) => {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return optional ? 'غير محدد' : placeholder;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const handleClear = () => {
    if (optional) {
      onChange(null as any);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.neutral.surface,
            borderColor: error ? theme.colors.error : theme.colors.neutral.border,
          },
        ]}
        onPress={() => setShowPicker(true)}
      >
        <View style={styles.buttonContent}>
          <MaterialCommunityIcons
            name="calendar"
            size={24}
            color={theme.colors.primary.base}
          />
          <Text
            style={[
              styles.buttonText,
              {
                color: value
                  ? theme.colors.neutral.textPrimary
                  : theme.colors.neutral.textTertiary || '#9E9E9E',
              },
            ]}
          >
            {formatDate(value)}
          </Text>
          {value && optional && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={theme.colors.neutral.textTertiary || '#9E9E9E'}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.colors.neutral.surface },
              ]}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  style={styles.cancelButton}
                >
                  <Text style={{ color: theme.colors.error }}>إلغاء</Text>
                </TouchableOpacity>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.colors.neutral.textPrimary },
                  ]}
                >
                  {placeholder}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  style={styles.doneButton}
                >
                  <Text style={{ color: theme.colors.primary.base }}>تم</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="spinner"
                onChange={handleChange}
                style={styles.iOSPicker}
                locale="ar-SA"
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    textAlign: 'right',
  },
  clearButton: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 4,
  },
  doneButton: {
    padding: 4,
  },
  iOSPicker: {
    height: 200,
  },
}); 