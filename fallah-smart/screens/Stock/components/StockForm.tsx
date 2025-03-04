import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, Platform, Switch, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StockItem, StockUnit, StockCategory } from '../types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../../components/Button';
import { Formik } from 'formik';
import * as Yup from 'yup';
import RNPickerSelect from 'react-native-picker-select';
import CheckBox from '@react-native-community/checkbox';
import Animated, { FadeIn, FadeInRight, FadeInLeft } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

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

const categories: { value: StockCategory; label: string; icon: string }[] = [
  { value: 'seeds', label: 'Semences', icon: 'seed-outline' },
  { value: 'fertilizer', label: 'Engrais', icon: 'bottle-tonic-plus-outline' },
  { value: 'harvest', label: 'Récoltes', icon: 'basket-outline' },
  { value: 'feed', label: 'Aliments', icon: 'food-outline' },
  { value: 'pesticide', label: 'Pesticides', icon: 'spray-bottle' },
  { value: 'equipment', label: 'Équipement', icon: 'tractor-variant' },
  { value: 'tools', label: 'Outils', icon: 'tools' }
];

const units: { value: StockUnit; label: string; icon: string }[] = [
  { value: 'kg', label: 'Kilogrammes', icon: 'scale' },
  { value: 'g', label: 'Grammes', icon: 'scale' },
  { value: 'l', label: 'Litres', icon: 'bottle-water' },
  { value: 'ml', label: 'Millilitres', icon: 'bottle-water' },
  { value: 'units', label: 'Unités', icon: 'package-variant' }
];

const qualityOptions: { value: 'good' | 'medium' | 'poor'; label: string; icon: string; color: string }[] = [
  { value: 'good', label: 'Bon', icon: 'check-decagram', color: '#4CAF50' },
  { value: 'medium', label: 'Moyen', icon: 'alert-circle', color: '#FFC107' },
  { value: 'poor', label: 'Mauvais', icon: 'close-circle', color: '#F44336' }
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

const FormPage = ({ 
  children, 
  title, 
  subtitle, 
  icon,
  isActive,
  entering
}: { 
  children: React.ReactNode;
  title: string;
  subtitle: string;
  icon: string;
  isActive: boolean;
  entering: any;
}) => {
  const theme = useTheme();
  
  if (!isActive) return null;

  return (
    <Animated.View 
      entering={entering}
      style={styles.pageContainer}
    >
      <View style={styles.pageHeader}>
        <MaterialCommunityIcons
          name={icon}
          size={32}
          color={theme.colors.primary.base}
        />
        <View style={styles.pageTitleContainer}>
          <Text style={[styles.pageTitle, { color: theme.colors.neutral.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.pageSubtitle, { color: theme.colors.neutral.textSecondary }]}>
            {subtitle}
          </Text>
        </View>
      </View>
      {children}
    </Animated.View>
  );
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
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 3;

  const handleSubmit = (values: StockFormValues) => {
    onSubmit(values);
  };

  const formInitialValues: StockFormValues = {
    ...defaultValues,
    ...initialValues
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
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

            <ScrollView style={styles.scrollView}>
              <FormPage
                title="Informations de base"
                subtitle="Remplissez les informations essentielles du produit"
                icon="package-variant"
                isActive={currentPage === 0}
                entering={FadeInRight}
              >
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    Nom du produit *
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
                    <MaterialCommunityIcons
                      name="tag-text"
                      size={24}
                      color={theme.colors.neutral.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { color: theme.colors.neutral.textPrimary },
                        touched.name && errors.name && styles.inputError
                      ]}
                      onChangeText={handleChange('name')}
                      onBlur={handleBlur('name')}
                      value={values.name}
                      placeholder="Nom du produit"
                      placeholderTextColor={theme.colors.neutral.textSecondary}
                      editable={!isSubmitting}
                    />
                  </View>
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
                    <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
                      <MaterialCommunityIcons
                        name="scale"
                        size={24}
                        color={theme.colors.neutral.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          { color: theme.colors.neutral.textPrimary },
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
                    </View>
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
                    <View style={[styles.pickerContainer, { backgroundColor: theme.colors.neutral.surface }]}>
                      <RNPickerSelect
                        items={units.map(unit => ({
                          label: unit.label,
                          value: unit.value,
                          icon: unit.icon
                        }))}
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
                  <View style={[styles.pickerContainer, { backgroundColor: theme.colors.neutral.surface }]}>
                    <RNPickerSelect
                      items={categories.map(cat => ({
                        label: cat.label,
                        value: cat.value,
                        icon: cat.icon
                      }))}
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
                  <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
                    <MaterialCommunityIcons
                      name="alert-circle"
                      size={24}
                      color={theme.colors.neutral.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { color: theme.colors.neutral.textPrimary },
                        touched.lowStockThreshold && errors.lowStockThreshold && styles.inputError
                      ]}
                      onChangeText={(text) => setFieldValue('lowStockThreshold', parseFloat(text) || 0)}
                      onBlur={handleBlur('lowStockThreshold')}
                      value={values.lowStockThreshold.toString()}
                      keyboardType="numeric"
                      placeholder="Seuil d'alerte"
                      placeholderTextColor={theme.colors.neutral.textSecondary}
                      editable={!isSubmitting}
                    />
                  </View>
                  {touched.lowStockThreshold && errors.lowStockThreshold && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {errors.lowStockThreshold}
                    </Text>
                  )}
                </View>
              </FormPage>

              <FormPage
                title="Détails supplémentaires"
                subtitle="Ajoutez des informations complémentaires"
                icon="information"
                isActive={currentPage === 1}
                entering={FadeInRight}
              >
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    Emplacement
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={24}
                      color={theme.colors.neutral.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.colors.neutral.textPrimary }]}
                      onChangeText={handleChange('location')}
                      onBlur={handleBlur('location')}
                      value={values.location}
                      placeholder="Emplacement (optionnel)"
                      placeholderTextColor={theme.colors.neutral.textSecondary}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    Fournisseur
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
                    <MaterialCommunityIcons
                      name="truck"
                      size={24}
                      color={theme.colors.neutral.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.colors.neutral.textPrimary }]}
                      onChangeText={handleChange('supplier')}
                      onBlur={handleBlur('supplier')}
                      value={values.supplier}
                      placeholder="Fournisseur (optionnel)"
                      placeholderTextColor={theme.colors.neutral.textSecondary}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    Prix unitaire
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
                    <MaterialCommunityIcons
                      name="currency-eur"
                      size={24}
                      color={theme.colors.neutral.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.colors.neutral.textPrimary }]}
                      onChangeText={(text) => setFieldValue('price', text ? parseFloat(text) : undefined)}
                      onBlur={handleBlur('price')}
                      value={values.price?.toString() || ''}
                      keyboardType="numeric"
                      placeholder="Prix unitaire (optionnel)"
                      placeholderTextColor={theme.colors.neutral.textSecondary}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    Numéro de lot
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
                    <MaterialCommunityIcons
                      name="barcode"
                      size={24}
                      color={theme.colors.neutral.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.colors.neutral.textPrimary }]}
                      onChangeText={handleChange('batchNumber')}
                      onBlur={handleBlur('batchNumber')}
                      value={values.batchNumber}
                      placeholder="Numéro de lot (optionnel)"
                      placeholderTextColor={theme.colors.neutral.textSecondary}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>
              </FormPage>

              <FormPage
                title="Qualité et péremption"
                subtitle="Spécifiez la qualité et la date d'expiration"
                icon="check-decagram"
                isActive={currentPage === 2}
                entering={FadeInRight}
              >
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
                        styles.inputContainer,
                        { backgroundColor: theme.colors.neutral.surface }
                      ]}
                      disabled={isSubmitting}
                    >
                      <MaterialCommunityIcons
                        name="calendar"
                        size={24}
                        color={theme.colors.neutral.textSecondary}
                        style={styles.inputIcon}
                      />
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
                  <View style={styles.qualityOptions}>
                    {qualityOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.qualityOption,
                          {
                            backgroundColor: values.qualityStatus === option.value
                              ? option.color
                              : theme.colors.neutral.surface,
                            borderColor: option.color
                          }
                        ]}
                        onPress={() => setFieldValue('qualityStatus', option.value)}
                        disabled={isSubmitting}
                      >
                        <MaterialCommunityIcons
                          name={option.icon}
                          size={24}
                          color={values.qualityStatus === option.value ? '#FFF' : option.color}
                        />
                        <Text style={[
                          styles.qualityOptionText,
                          {
                            color: values.qualityStatus === option.value ? '#FFF' : option.color
                          }
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    Notes
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
                    <MaterialCommunityIcons
                      name="note-text"
                      size={24}
                      color={theme.colors.neutral.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                        { color: theme.colors.neutral.textPrimary }
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
                </View>
              </FormPage>
            </ScrollView>

            <View style={styles.paginationContainer}>
              <View style={styles.paginationDots}>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor: currentPage === index
                          ? theme.colors.primary.base
                          : theme.colors.neutral.border
                      }
                    ]}
                  />
                ))}
              </View>
              <View style={styles.paginationButtons}>
                {currentPage > 0 && (
                  <TouchableOpacity
                    style={[styles.paginationButton, { backgroundColor: theme.colors.neutral.surface }]}
                    onPress={prevPage}
                    disabled={isSubmitting}
                  >
                    <MaterialCommunityIcons
                      name="chevron-left"
                      size={24}
                      color={theme.colors.neutral.textPrimary}
                    />
                    <Text style={[styles.paginationButtonText, { color: theme.colors.neutral.textPrimary }]}>
                      Précédent
                    </Text>
                  </TouchableOpacity>
                )}
                {currentPage < totalPages - 1 ? (
                  <TouchableOpacity
                    style={[styles.paginationButton, { backgroundColor: theme.colors.primary.base }]}
                    onPress={nextPage}
                    disabled={isSubmitting}
                  >
                    <Text style={[styles.paginationButtonText, { color: '#FFF' }]}>
                      Suivant
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.paginationButton, { backgroundColor: theme.colors.success }]}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting}
                  >
                    <Text style={[styles.paginationButtonText, { color: '#FFF' }]}>
                      {isSubmitting ? "En cours..." : "Enregistrer"}
                    </Text>
                    <MaterialCommunityIcons
                      name="check"
                      size={24}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Annuler"
                onPress={onCancel}
                style={[styles.button, styles.cancelButton]}
                disabled={isSubmitting}
              />
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  pageContainer: {
    padding: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  pageTitleContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
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
    padding: 16,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
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
  qualityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  qualityOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paginationContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  paginationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  paginationButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 