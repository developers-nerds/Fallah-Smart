import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { createThemedStyles } from '../../../utils/createThemedStyles';

interface QuantityModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  type: 'add' | 'remove';
  currentQuantity?: number;
  unit?: string;
}

export const QuantityModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  type,
  currentQuantity,
  unit 
}: QuantityModalProps) => {
  const theme = useTheme();
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const num = Number(quantity);
    setError(null);

    if (isNaN(num) || num <= 0) {
      setError('La quantité doit être un nombre positif');
      return;
    }

    if (type === 'remove' && currentQuantity && num > currentQuantity) {
      setError('La quantité à retirer ne peut pas dépasser le stock actuel');
      return;
    }

    onConfirm(num);
    setQuantity('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.neutral.surface }]}>
          <View style={styles.modalHeader}>
            <Feather 
              name={type === 'add' ? 'plus-circle' : 'minus-circle'} 
              size={24} 
              color={type === 'add' ? theme.colors.success : theme.colors.error} 
            />
            <Text style={[styles.modalTitle, { color: theme.colors.neutral.textPrimary }]}>
              {type === 'add' ? 'Ajouter au stock' : 'Retirer du stock'}
            </Text>
          </View>

          {currentQuantity && (
            <Text style={[styles.currentQuantity, { color: theme.colors.neutral.textSecondary }]}>
              Stock actuel: {currentQuantity} {unit}
            </Text>
          )}

          <TextInput
            style={[styles.modalInput, { 
              backgroundColor: theme.colors.neutral.background,
              color: theme.colors.neutral.textPrimary,
              borderColor: error ? theme.colors.error : theme.colors.neutral.border
            }]}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder={`Quantité à ${type === 'add' ? 'ajouter' : 'retirer'}`}
            placeholderTextColor={theme.colors.neutral.textSecondary}
          />

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: theme.colors.neutral.textPrimary }]}>
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.modalButton, 
                { backgroundColor: type === 'add' ? theme.colors.success : theme.colors.error }
              ]} 
              onPress={handleConfirm}
            >
              <Text style={[styles.buttonText, { color: theme.colors.neutral.surface }]}>
                Confirmer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = createThemedStyles((theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  currentQuantity: {
    fontSize: 16,
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.neutral.gray.light,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})); 