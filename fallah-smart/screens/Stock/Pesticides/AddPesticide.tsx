import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { usePesticide } from '../../../context/PesticideContext';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { Button as CustomButton } from '../../../components/Button';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/StockNavigator';
import { Feather } from '@expo/vector-icons';

type AddPesticideProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddPesticide'>;
};

export const AddPesticide = ({ navigation }: AddPesticideProps) => {
  const theme = useTheme();
  const { createPesticide, loading } = usePesticide();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: '',
    price: '',
    isNatural: false,
    manufacturer: '',
    expiryDate: '',
    applicationInstructions: '',
    safetyPrecautions: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setError(null);
      await createPesticide({
        ...formData,
        quantity: Number(formData.quantity),
        price: Number(formData.price),
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pesticide');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.neutral.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          Ajouter un Pesticide
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Nom du pesticide
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nom du pesticide"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Description
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Description du pesticide"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Quantité
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.neutral.surface,
                  color: theme.colors.neutral.textPrimary,
                  borderColor: theme.colors.neutral.border
                }]}
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                placeholder="0"
                placeholderTextColor={theme.colors.neutral.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Unité
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.neutral.surface,
                  color: theme.colors.neutral.textPrimary,
                  borderColor: theme.colors.neutral.border
                }]}
                value={formData.unit}
                onChangeText={(text) => setFormData({ ...formData, unit: text })}
                placeholder="kg, L, etc."
                placeholderTextColor={theme.colors.neutral.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Prix
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="0"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Fabricant
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.manufacturer}
              onChangeText={(text) => setFormData({ ...formData, manufacturer: text })}
              placeholder="Nom du fabricant"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Date d'expiration
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.expiryDate}
              onChangeText={(text) => setFormData({ ...formData, expiryDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Instructions d'application
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.applicationInstructions}
              onChangeText={(text) => setFormData({ ...formData, applicationInstructions: text })}
              placeholder="Instructions d'application"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Précautions de sécurité
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.safetyPrecautions}
              onChangeText={(text) => setFormData({ ...formData, safetyPrecautions: text })}
              placeholder="Précautions de sécurité"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.checkboxContainer, { borderColor: theme.colors.neutral.border }]}
            onPress={() => setFormData({ ...formData, isNatural: !formData.isNatural })}
          >
            <View style={[
              styles.checkbox,
              formData.isNatural && { backgroundColor: theme.colors.success }
            ]}>
              {formData.isNatural && (
                <Feather name="check" size={16} color="#FFF" />
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.colors.neutral.textPrimary }]}>
              Pesticide naturel
            </Text>
          </TouchableOpacity>

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}

          <CustomButton
            title="Ajouter le pesticide"
            onPress={handleSubmit}
            variant="primary"
            disabled={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowColor: '#000000',
  } as ViewStyle,
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderWidth: 1,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.success,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
}));

export default AddPesticide; 