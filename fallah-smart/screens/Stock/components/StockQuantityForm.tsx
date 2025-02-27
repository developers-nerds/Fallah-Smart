import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { Button } from '../../../components/Button';
import { useTheme } from '../../../context/ThemeContext';
import { StockItem } from '../types';

interface StockQuantityFormProps {
  stock: StockItem;
  type: 'add' | 'remove';
  onSubmit: (quantity: number) => void;
  onCancel: () => void;
}

export const StockQuantityForm = ({ stock, type, onSubmit, onCancel }: StockQuantityFormProps) => {
  const theme = useTheme();
  const [quantity, setQuantity] = useState('');

  const handleSubmit = () => {
    const numQuantity = Number(quantity);
    if (numQuantity > 0) {
      onSubmit(numQuantity);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
        {type === 'add' ? 'Add to Stock' : 'Remove from Stock'}
      </Text>
      
      <View style={styles.info}>
        <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
          Product:
        </Text>
        <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
          {stock.name}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
          Current Stock:
        </Text>
        <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
          {stock.quantity} {stock.unit}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
          Quantity to {type === 'add' ? 'Add' : 'Remove'}:
        </Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.neutral.surface,
            color: theme.colors.neutral.textPrimary 
          }]}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder={`Enter quantity in ${stock.unit}`}
          placeholderTextColor={theme.colors.neutral.textSecondary}
        />
      </View>

      <View style={styles.buttons}>
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          style={styles.button}
        />
        <Button
          title={type === 'add' ? 'Add' : 'Remove'}
          onPress={handleSubmit}
          variant={type === 'add' ? 'primary' : 'secondary'}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
}); 