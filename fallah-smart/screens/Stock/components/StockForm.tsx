import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, Platform, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StockItem, StockUnit, StockCategory } from '../types';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../../components/Button';
import { Formik } from 'formik';
import * as Yup from 'yup';
import RNPickerSelect from 'react-native-picker-select';
import CheckBox from '@react-native-community/checkbox';

interface StockFormProps {
  initialValues?: Partial<StockFormValues>;
  onSubmit: (values: StockFormValues) => void;
  onCancel: () => void;
  error?: string | null;
  isSubmitting?: boolean;
}

interface StockFormValues {
  name: string;
  quantity: number;
  unit: StockUnit;
  category: StockCategory;
  lowStockThreshold: number;
  location: string;
  supplier: string;
  price?: number;
  notes: string;
  isNatural: boolean;
  qualityStatus: 'good' | 'medium' | 'poor';
  batchNumber?: string;
  expiryDate?: Date;
}

const categories: { value: StockCategory; label: string }[] = [
  { value: 'seeds', label: 'Semences' },
  { value: 'fertilizer', label: 'Engrais' },
  { value: 'harvest', label: 'Récoltes' },
  { value: 'feed', label: 'Aliments' },
  { value: 'pesticide', label: 'Pesticides' },
  { value: 'equipment', label: 'Équipement' },
  { value: 'tools', label: 'Outils' }
];

const units: { value: StockUnit; label: string }[] = [
  { value: 'kg', label: 'Kilogrammes' },
  { value: 'g', label: 'Grammes' },
  { value: 'l', label: 'Litres' },
  { value: 'ml', label: 'Millilitres' },
  { value: 'units', label: 'Unités' }
];

const qualityOptions: { value: 'good' | 'medium' | 'poor'; label: string }[] = [
  { value: 'good', label: 'Bon' },
  { value: 'medium', label: 'Moyen' },
  { value: 'poor', label: 'Mauvais' }
];

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Le nom est requis'),
  quantity: Yup.number()
    .required('La quantité est requise')
    .min(0, 'La quantité doit être positive'),
  unit: Yup.string().required('L\'unité est requise'),
  category: Yup.string().required('La catégorie est requise'),
  lowStockThreshold: Yup.number()
    .required('Le seuil de stock bas est requis')
    .min(0, 'Le seuil doit être positif'),
  location: Yup.string(),
  supplier: Yup.string(),
  price: Yup.number().nullable().min(0, 'Le prix doit être positif'),
  notes: Yup.string(),
  isNatural: Yup.boolean(),
  qualityStatus: Yup.string().oneOf(['good', 'medium', 'poor']).required('La qualité est requise'),
  batchNumber: Yup.string(),
  expiryDate: Yup.date().nullable()
});

const defaultValues: StockFormValues = {
  name: '',
  quantity: 0,
  unit: 'units',
  category: 'seeds',
  lowStockThreshold: 10,
  location: '',
  supplier: '',
  price: undefined,
  notes: '',
  isNatural: false,
  qualityStatus: 'good',
  batchNumber: '',
  expiryDate: undefined
};

export const StockForm = ({ 
  onSubmit, 
  onCancel, 
  initialValues,
  error,
  isSubmitting = false
}: StockFormProps) => {
  const theme = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = (values: StockFormValues) => {
    onSubmit(values);
  };

  const formInitialValues: StockFormValues = {
    ...defaultValues,
    ...initialValues
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <Formik
        initialValues={formInitialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles.form}>
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: theme.colors.error }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Nom du produit *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.colors.neutral.surface,
                    color: theme.colors.neutral.textPrimary 
                  },
                  touched.name && errors.name && styles.inputError
                ]}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                value={values.name}
                placeholder="Nom du produit"
                placeholderTextColor={theme.colors.neutral.textSecondary}
                editable={!isSubmitting}
              />
              {touched.name && errors.name && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.name}
                </Text>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                  Quantité *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: theme.colors.neutral.surface,
                      color: theme.colors.neutral.textPrimary 
                    },
                    touched.quantity && errors.quantity && styles.inputError
                  ]}
                  onChangeText={(text) => setFieldValue('quantity', parseFloat(text) || 0)}
                  onBlur={handleBlur('quantity')}
                  value={values.quantity.toString()}
                  keyboardType="numeric"
                  placeholder="Quantité"
                  placeholderTextColor={theme.colors.neutral.textSecondary}
                  editable={!isSubmitting}
                />
                {touched.quantity && errors.quantity && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.quantity}
                  </Text>
                )}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                  Unité *
                </Text>
                <View style={[
                  styles.pickerContainer,
                  { backgroundColor: theme.colors.neutral.surface }
                ]}>
                  <RNPickerSelect
                    items={units}
                    onValueChange={(value) => setFieldValue('unit', value)}
                    value={values.unit}
                    disabled={isSubmitting}
                    style={{
                      inputIOS: {
                        color: theme.colors.neutral.textPrimary,
                      },
                      inputAndroid: {
                        color: theme.colors.neutral.textPrimary,
                      },
                    }}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Catégorie *
              </Text>
              <View style={[
                styles.pickerContainer,
                { backgroundColor: theme.colors.neutral.surface }
              ]}>
                <RNPickerSelect
                  items={categories}
                  onValueChange={(value) => setFieldValue('category', value)}
                  value={values.category}
                  disabled={isSubmitting}
                  style={{
                    inputIOS: {
                      color: theme.colors.neutral.textPrimary,
                    },
                    inputAndroid: {
                      color: theme.colors.neutral.textPrimary,
                    },
                  }}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Seuil de stock bas *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.colors.neutral.surface,
                    color: theme.colors.neutral.textPrimary 
                  }
                ]}
                onChangeText={(text) => setFieldValue('lowStockThreshold', parseFloat(text) || 0)}
                onBlur={handleBlur('lowStockThreshold')}
                value={values.lowStockThreshold.toString()}
                keyboardType="numeric"
                placeholder="Seuil d'alerte"
                placeholderTextColor={theme.colors.neutral.textSecondary}
                editable={!isSubmitting}
              />
              {touched.lowStockThreshold && errors.lowStockThreshold && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.lowStockThreshold}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Emplacement
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.colors.neutral.surface,
                    color: theme.colors.neutral.textPrimary 
                  }
                ]}
                onChangeText={handleChange('location')}
                onBlur={handleBlur('location')}
                value={values.location}
                placeholder="Emplacement (optionnel)"
                placeholderTextColor={theme.colors.neutral.textSecondary}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Fournisseur
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.colors.neutral.surface,
                    color: theme.colors.neutral.textPrimary 
                  }
                ]}
                onChangeText={handleChange('supplier')}
                onBlur={handleBlur('supplier')}
                value={values.supplier}
                placeholder="Fournisseur (optionnel)"
                placeholderTextColor={theme.colors.neutral.textSecondary}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Prix unitaire
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.colors.neutral.surface,
                    color: theme.colors.neutral.textPrimary 
                  }
                ]}
                onChangeText={(text) => setFieldValue('price', text ? parseFloat(text) : undefined)}
                onBlur={handleBlur('price')}
                value={values.price?.toString() || ''}
                keyboardType="numeric"
                placeholder="Prix unitaire (optionnel)"
                placeholderTextColor={theme.colors.neutral.textSecondary}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Numéro de lot
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.colors.neutral.surface,
                    color: theme.colors.neutral.textPrimary 
                  }
                ]}
                onChangeText={handleChange('batchNumber')}
                onBlur={handleBlur('batchNumber')}
                value={values.batchNumber}
                placeholder="Numéro de lot (optionnel)"
                placeholderTextColor={theme.colors.neutral.textSecondary}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Date d'expiration
              </Text>
              {(Platform.OS === 'ios' || showDatePicker) && (
                <DateTimePicker
                  value={values.expiryDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'default' : 'calendar'}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setFieldValue('expiryDate', date);
                    }
                  }}
                  disabled={isSubmitting}
                />
              )}
              {Platform.OS === 'android' && !showDatePicker && (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[
                    styles.input,
                    { 
                      backgroundColor: theme.colors.neutral.surface,
                      justifyContent: 'center' 
                    }
                  ]}
                  disabled={isSubmitting}
                >
                  <Text style={{ color: theme.colors.neutral.textPrimary }}>
                    {values.expiryDate ? values.expiryDate.toLocaleDateString() : "Sélectionner une date"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.checkboxContainer}>
              <Switch
                value={values.isNatural}
                onValueChange={(value: boolean) => {
                  setFieldValue('isNatural', value);
                }}
                disabled={isSubmitting}
              />
              <Text style={[styles.checkboxLabel, { color: theme.colors.neutral.textPrimary }]}>
                Produit naturel
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Qualité *
              </Text>
              <View style={[
                styles.pickerContainer,
                { backgroundColor: theme.colors.neutral.surface }
              ]}>
                <RNPickerSelect
                  items={qualityOptions}
                  onValueChange={(value) => setFieldValue('qualityStatus', value)}
                  value={values.qualityStatus}
                  disabled={isSubmitting}
                  style={{
                    inputIOS: {
                      color: theme.colors.neutral.textPrimary,
                    },
                    inputAndroid: {
                      color: theme.colors.neutral.textPrimary,
                    },
                  }}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Notes
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { 
                    backgroundColor: theme.colors.neutral.surface,
                    color: theme.colors.neutral.textPrimary 
                  }
                ]}
                onChangeText={handleChange('notes')}
                onBlur={handleBlur('notes')}
                value={values.notes}
                placeholder="Notes additionnelles (optionnel)"
                placeholderTextColor={theme.colors.neutral.textSecondary}
                multiline
                numberOfLines={4}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Annuler"
                onPress={onCancel}
                style={[styles.button, styles.cancelButton]}
                disabled={isSubmitting}
              />
              <Button
                title={isSubmitting ? "En cours..." : "Enregistrer"}
                onPress={() => handleSubmit()}
                style={[styles.button, styles.submitButton]}
                disabled={isSubmitting}
              />
            </View>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  inputError: {
    borderWidth: 1,
    borderColor: 'red',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
}); 