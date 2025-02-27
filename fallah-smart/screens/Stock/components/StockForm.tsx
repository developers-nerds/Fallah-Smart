import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StockItem, StockUnit, StockCategory } from '../types';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '../../../components/Button';

interface StockFormProps {
  initialValues?: Partial<StockItem>;
  onSubmit: (values: Omit<StockItem, 'id' | 'history'>) => void;
  onCancel: () => void;
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

export const StockForm = ({ onSubmit, onCancel }: StockFormProps) => {
  const theme = useTheme();
  
  const [values, setValues] = useState({
    name: '',
    quantity: '',
    unit: 'kg' as StockUnit,
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
  const [error, setError] = useState<string | null>(null);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  const handleSubmit = () => {
    setError(null);
    
    if (!values.name.trim()) {
      setError('Le nom est requis');
      return;
    }
    
    const quantity = Number(values.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('La quantité doit être un nombre positif');
      return;
    }

    const threshold = Number(values.lowStockThreshold);
    if (isNaN(threshold) || threshold < 0) {
      setError('Le seuil d\'alerte doit être un nombre positif');
      return;
    }

    const price = Number(values.price);
    if (values.price && (isNaN(price) || price < 0)) {
      setError('Le prix doit être un nombre positif');
      return;
    }

    if (values.expiryDate && values.expiryDate < new Date()) {
      setError('La date d\'expiration ne peut pas être dans le passé');
      return;
    }

    onSubmit({
      name: values.name.trim(),
      quantity,
      unit: values.unit,
      category: values.category,
      lowStockThreshold: threshold,
      isNatural: values.isNatural,
      location: values.location?.trim(),
      notes: values.notes?.trim(),
      expiryDate: values.expiryDate,
      supplier: values.supplier?.trim(),
      price: price || undefined,
      lastCheckDate: values.lastCheckDate,
      qualityStatus: values.qualityStatus,
      batchNumber: values.batchNumber?.trim(),
    });
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
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Nom du produit
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              value={values.name}
              onChangeText={(text) => setValues({ ...values, name: text })}
              placeholder="Entrer le nom du produit"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>

          {/* Quantity and Unit Row */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Quantité
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.neutral.surface,
                  color: theme.colors.neutral.textPrimary 
                }]}
                value={values.quantity}
                onChangeText={(text) => setValues({ ...values, quantity: text })}
                keyboardType="numeric"
                placeholder="Entrer la quantité"
                placeholderTextColor={theme.colors.neutral.textSecondary}
              />
            </View>

            <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                Unité
              </Text>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor: theme.colors.neutral.surface }]}
                onPress={() => setShowUnitDropdown(!showUnitDropdown)}
              >
                <Text style={{ color: theme.colors.neutral.textPrimary }}>
                  {units.find(u => u.value === values.unit)?.label || 'Sélectionner'}
                </Text>
                <Feather name={showUnitDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.neutral.textSecondary} />
              </TouchableOpacity>
              {showUnitDropdown && (
                <View style={[styles.dropdownList, { backgroundColor: theme.colors.neutral.surface }]}>
                  {units.map((unit) => (
                    <TouchableOpacity
                      key={unit.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setValues({ ...values, unit: unit.value });
                        setShowUnitDropdown(false);
                      }}
                    >
                      <Text style={{ color: theme.colors.neutral.textPrimary }}>{unit.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Catégorie
            </Text>
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: theme.colors.neutral.surface }]}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <Text style={{ color: theme.colors.neutral.textPrimary }}>
                {categories.find(c => c.value === values.category)?.label || 'Sélectionner'}
              </Text>
              <Feather name={showCategoryDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.neutral.textSecondary} />
            </TouchableOpacity>
            {showCategoryDropdown && (
              <View style={[styles.dropdownList, { backgroundColor: theme.colors.neutral.surface }]}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setValues({ ...values, category: category.value });
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={{ color: theme.colors.neutral.textPrimary }}>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Low Stock Threshold */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Seuil d'alerte stock bas
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              value={values.lowStockThreshold}
              onChangeText={(text) => setValues({ ...values, lowStockThreshold: text })}
              keyboardType="numeric"
              placeholder="Entrer la quantité minimale"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Emplacement
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              value={values.location}
              onChangeText={(text) => setValues({ ...values, location: text })}
              placeholder="Emplacement de stockage"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Notes
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                height: 100,
                textAlignVertical: 'top'
              }]}
              value={values.notes}
              onChangeText={(text) => setValues({ ...values, notes: text })}
              placeholder="Notes additionnelles"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Supplier */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Fournisseur
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.neutral.surface }]}
              value={values.supplier}
              onChangeText={(text) => setValues({ ...values, supplier: text })}
              placeholder="Nom du fournisseur"
            />
          </View>

          {/* Price */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Prix unitaire
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.neutral.surface }]}
              value={values.price}
              onChangeText={(text) => setValues({ ...values, price: text })}
              keyboardType="numeric"
              placeholder="Prix par unité"
            />
          </View>

          {/* Batch Number */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Numéro de lot
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.neutral.surface }]}
              value={values.batchNumber}
              onChangeText={(text) => setValues({ ...values, batchNumber: text })}
              placeholder="Numéro de lot"
            />
          </View>

          {/* Quality Status */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              État du stock
            </Text>
            <View style={styles.qualityContainer}>
              {qualityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.qualityOption,
                    { 
                      backgroundColor: values.qualityStatus === option.value 
                        ? theme.colors.primary.base 
                        : theme.colors.neutral.surface 
                    }
                  ]}
                  onPress={() => setValues({ ...values, qualityStatus: option.value })}
                >
                  <Text style={[
                    styles.qualityText,
                    { 
                      color: values.qualityStatus === option.value 
                        ? theme.colors.neutral.surface 
                        : theme.colors.neutral.textPrimary 
                    }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Expiry Date */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Date d'expiration
            </Text>
            <TouchableOpacity
              style={[styles.input, { backgroundColor: theme.colors.neutral.surface }]}
              onPress={() => setShowExpiryDatePicker(true)}
            >
              <Text style={{ color: theme.colors.neutral.textPrimary }}>
                {values.expiryDate ? values.expiryDate.toLocaleDateString() : 'Sélectionner une date'}
              </Text>
            </TouchableOpacity>
            {(showExpiryDatePicker || Platform.OS === 'ios') && (
              <DateTimePicker
                value={values.expiryDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Error Message */}
          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}
        </View>
      </ScrollView>
      
      <View style={[styles.footer, { backgroundColor: theme.colors.neutral.surface }]}>
        <View style={styles.buttonRow}>
          <Button
            title="Annuler"
            onPress={handleCancel}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Enregistrer"
            onPress={handleSubmit}
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 16,
  },
  dropdown: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  dropdownList: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    borderRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  qualityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  qualityOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 