import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../navigation/types';

type AddStockScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddStock'>;
};

const AddStockScreen: React.FC<AddStockScreenProps> = ({ navigation }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
        إضافة مخزون جديد
      </Text>
      {/* StockForm component will be added here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default AddStockScreen; 