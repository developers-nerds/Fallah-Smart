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

const categories: { value: StockCategory; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'seeds', label: 'البذور', icon: 'seed-outline' },
  { value: 'fertilizer', label: 'الأسمدة', icon: 'bottle-tonic-plus-outline' },
  { value: 'harvest', label: 'المحاصيل', icon: 'basket-outline' },
  { value: 'feed', label: 'الأعلاف', icon: 'food-outline' },
  { value: 'pesticide', label: 'المبيدات', icon: 'spray-bottle' },
  { value: 'equipment', label: 'المعدات', icon: 'tractor-variant' },
  { value: 'tools', label: 'الأدوات', icon: 'tools' }
];

const units: { value: StockUnit; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'kg', label: 'كيلوغرام', icon: 'scale' },
  { value: 'g', label: 'غرام', icon: 'scale' },
  { value: 'l', label: 'لتر', icon: 'bottle-soda' },
  { value: 'ml', label: 'مليلتر', icon: 'bottle-soda' },
  { value: 'units', label: 'وحدة', icon: 'package-variant' }
];

const qualityOptions: { value: 'good' | 'medium' | 'poor'; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
  { value: 'good', label: 'جيد', icon: 'check-decagram', color: '#4CAF50' },
  { value: 'medium', label: 'متوسط', icon: 'alert-circle', color: '#FFC107' },
  { value: 'poor', label: 'سيء', icon: 'close-circle', color: '#F44336' }
];

const validationSchema = Yup.object().shape({
  name: Yup.string().required('اسم المنتج مطلوب'),
  quantity: Yup.number()
    .required('الكمية مطلوبة')
    .min(0, 'يجب أن تكون الكمية إيجابية'),
  unit: Yup.string().required('الوحدة مطلوبة'),
  category: Yup.string().required('الفئة مطلوبة'),
  lowStockThreshold: Yup.number()
    .required('الحد الأدنى للمخزون مطلوب')
    .min(0, 'يجب أن يكون الحد الأدنى إيجابياً'),
  location: Yup.string(),
  supplier: Yup.string(),
  price: Yup.number().nullable().min(0, 'يجب أن يكون السعر إيجابياً'),
  notes: Yup.string(),
  isNatural: Yup.boolean(),
  qualityStatus: Yup.string().oneOf(['good', 'medium', 'poor']).required('حالة الجودة مطلوبة'),
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
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
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
    const stockItem: Omit<StockItem, 'id' | 'stockHistory' | 'createdAt' | 'updatedAt'> = {
      name: values.name,
      category: values.category,
      quantity: values.quantity,
      unit: values.unit,
      lowStockThreshold: values.lowStockThreshold,
      location: values.location,
      supplier: values.supplier,
      price: values.price,
      batchNumber: values.batchNumber,
      expiryDate: values.expiryDate?.toISOString(),
      isNatural: values.isNatural,
      qualityStatus: values.qualityStatus,
      notes: values.notes
    };
    onSubmit(stockItem as any);
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
                title="المعلومات الأساسية"
                subtitle="أدخل المعلومات الأساسية للمنتج"
                icon="package-variant"
                isActive={currentPage === 0}
                entering={FadeInRight}
              >
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    اسم المنتج *
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
                      placeholder="اسم المنتج"
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
                      الكمية *
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
                        placeholder="الكمية"
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
                      الوحدة *
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
                    الفئة *
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
                    الحد الأدنى للمخزون *
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
                      placeholder="الحد الأدنى للمخزون"
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
                title="الكمية والسعر"
                subtitle="حدد الكمية والسعر"
                icon="currency-usd"
                isActive={currentPage === 1}
                entering={FadeInRight}
              >
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    الموقع (اختياري)
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
                      placeholder="الموقع (اختياري)"
                      placeholderTextColor={theme.colors.neutral.textSecondary}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    المورد
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
                      placeholder="المورد (اختياري)"
                      placeholderTextColor={theme.colors.neutral.textSecondary}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    السعر (درهم)
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
                      placeholder="السعر (درهم)"
                      placeholderTextColor={theme.colors.neutral.textSecondary}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    رقم الدفعة
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
                      placeholder="رقم الدفعة (اختياري)"
                      placeholderTextColor={theme.colors.neutral.textSecondary}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>
              </FormPage>

              <FormPage
                title="تفاصيل إضافية"
                subtitle="أضف معلومات إضافية"
                icon="information"
                isActive={currentPage === 2}
                entering={FadeInRight}
              >
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    تاريخ انتهاء الصلاحية
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
                        {values.expiryDate ? values.expiryDate.toLocaleDateString() : "اختر تاريخ"}
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
                    منتج طبيعي
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                    حالة الجودة *
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
                    ملاحظات
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
                      placeholder="ملاحظات إضافية (اختياري)"
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
                      السابق
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
                      التالي
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
                      {isSubmitting ? "جاري التحميل..." : "حفظ"}
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
                title="إلغاء"
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