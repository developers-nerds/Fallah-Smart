import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StockItem, StockUnit, StockCategory } from '../types';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '../../../components/Button';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Picker } from '@react-native-picker/picker';

interface StockFormProps {
  initialValues?: Partial<StockItem>;
  onSubmit: (values: Omit<StockItem, 'id' | 'stockHistory'>) => void;
  onCancel: () => void;
  error?: string | null;
  isSubmitting?: boolean;
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
  price: Yup.number().min(0, 'Le prix doit être positif'),
  notes: Yup.string(),
});

const defaultValues = {
  name: '',
  quantity: '0',
  unit: 'units' as StockUnit,
  category: 'seeds' as StockCategory,
  lowStockThreshold: '10',
  location: '',
  supplier: '',
  price: '',
  notes: '',
  isNatural: false,
  qualityStatus: 'good' as 'good' | 'medium' | 'poor',
};

export const StockForm = ({ 
  onSubmit, 
  onCancel, 
  initialValues = defaultValues,
  error,
  isSubmitting = false
}: StockFormProps) => {
  const theme = useTheme();
  
  const [values, setValues] = useState({
    name: '',
    quantity: '',
    unit: 'units' as StockUnit,
    category: 'seeds' as StockCategory,
    lowStockThreshold: '',
    isNatural: false,
    location: '',
    notes: '',
    expiryDate: undefined as Date | undefined,
    supplier: '',
    price: '',
    lastCheckDate: new Date(),
    qualityStatus: 'good' as 'good' | 'medium' | 'poor',
    batchNumber: '',
  });

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  const handleSubmit = (values: typeof defaultValues) => {
    // Convert string values to numbers where needed
    const formattedValues = {
      ...values,
      quantity: parseFloat(values.quantity),
      lowStockThreshold: parseFloat(values.lowStockThreshold),
      price: values.price ? parseFloat(values.price) : undefined,
    };

    onSubmit(formattedValues);
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowExpiryDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setValues({ ...values, expiryDate: selectedDate });
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <Formik
        initialValues={initialValues}
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
                  onChangeText={handleChange('quantity')}
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
                  <Picker
                    selectedValue={values.unit}
                    onValueChange={(value) => setFieldValue('unit', value)}
                    enabled={!isSubmitting}
                    style={{ color: theme.colors.neutral.textPrimary }}
                  >
                    <Picker.Item label="Unités" value="units" />
                    <Picker.Item label="Kilogrammes" value="kg" />
                    <Picker.Item label="Grammes" value="g" />
                    <Picker.Item label="Litres" value="l" />
                    <Picker.Item label="Millilitres" value="ml" />
                  </Picker>
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
                <Picker
                  selectedValue={values.category}
                  onValueChange={(value) => setFieldValue('category', value)}
                  enabled={!isSubmitting}
                  style={{ color: theme.colors.neutral.textPrimary }}
                >
                  <Picker.Item label="Semences" value="seeds" />
                  <Picker.Item label="Engrais" value="fertilizer" />
                  <Picker.Item label="Récoltes" value="harvest" />
                  <Picker.Item label="Aliments" value="feed" />
                  <Picker.Item label="Pesticides" value="pesticide" />
                  <Picker.Item label="Équipement" value="equipment" />
                  <Picker.Item label="Outils" value="tools" />
                </Picker>
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
                onChangeText={handleChange('lowStockThreshold')}
                onBlur={handleBlur('lowStockThreshold')}
                value={values.lowStockThreshold.toString()}
                keyboardType="numeric"
                placeholder="Seuil d'alerte"
                placeholderTextColor={theme.colors.neutral.textSecondary}
                editable={!isSubmitting}
              />
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
                onChangeText={handleChange('price')}
                onBlur={handleBlur('price')}
                value={values.price}
                keyboardType="numeric"
                placeholder="Prix unitaire (optionnel)"
                placeholderTextColor={theme.colors.neutral.textSecondary}
                editable={!isSubmitting}
              />
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
                onPress={handleCancel}
                style={[styles.button, styles.cancelButton]}
                disabled={isSubmitting}
              />
              <Button
                title={isSubmitting ? "En cours..." : "Enregistrer"}
                onPress={handleSubmit}
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
}); 