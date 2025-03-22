import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  I18nManager,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput } from '../../../components/TextInput';
import { Button } from '../../../components/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TOOL_TYPES, TOOL_STATUS, TOOL_CONDITION, TOOL_ICONS, ToolType, ToolStatus, ToolCondition } from './constants';
import { storage } from '../../../utils/storage';
import axios from 'axios';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  withTiming,
  runOnJS
} from 'react-native-reanimated';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

type AddToolScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddTool'>;
  route: RouteProp<StockStackParamList, 'AddTool'>;
};

interface FormData {
  name: string;
  quantity: string;
  minQuantityAlert: string;
  category: ToolType;
  status: ToolStatus;
  condition: ToolCondition;
  purchaseDate: Date | null;
  lastMaintenanceDate: Date | null;
  nextMaintenanceDate: Date | null;
  maintenanceInterval: string;
  brand: string;
  model: string;
  purchasePrice: string;
  replacementCost: string;
  storageLocation: string;
  assignedTo: string;
  maintenanceNotes: string;
  usageInstructions: string;
  safetyGuidelines: string;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('اسم الأداة مطلوب'),
  quantity: Yup.number()
    .required('الكمية مطلوبة')
    .min(0, 'الكمية يجب أن تكون أكبر من 0'),
  minQuantityAlert: Yup.number()
    .required('حد التنبيه مطلوب')
    .min(0, 'حد التنبيه يجب أن يكون أكبر من 0'),
  category: Yup.string().required('نوع الأداة مطلوب'),
  status: Yup.string().required('حالة الأداة مطلوبة'),
  condition: Yup.string().required('حالة الأداة مطلوبة'),
  purchasePrice: Yup.number()
    .min(0, 'السعر يجب أن يكون أكبر من 0'),
});

const initialFormData: FormData = {
  name: '',
  quantity: '',
  minQuantityAlert: '2',
  category: 'hand_tools',
  status: 'available',
  condition: 'new',
  purchaseDate: null,
  lastMaintenanceDate: null,
  nextMaintenanceDate: null,
  maintenanceInterval: '',
  brand: '',
  model: '',
  purchasePrice: '',
  replacementCost: '',
  storageLocation: '',
  assignedTo: '',
  maintenanceNotes: '',
  usageInstructions: '',
  safetyGuidelines: '',
};

const SECTIONS = [
  {
    id: 'basic',
    title: `${TOOL_ICONS.sections.basic} المعلومات الأساسية`,
    description: 'اسم الأداة، الكمية، والنوع',
    icon: '🛠️'
  },
  {
    id: 'purchase',
    title: `${TOOL_ICONS.sections.purchase} معلومات الشراء`,
    description: 'السعر وتاريخ الشراء',
    icon: '💰'
  },
  {
    id: 'location',
    title: `${TOOL_ICONS.sections.location} المكان والمسؤول`,
    description: 'مكان التخزين والشخص المسؤول',
    icon: '📍'
  },
  {
    id: 'maintenance',
    title: `${TOOL_ICONS.sections.maintenance} الصيانة`,
    description: 'مواعيد وملاحظات الصيانة',
    icon: '🔧'
  },
  {
    id: 'instructions',
    title: `${TOOL_ICONS.sections.instructions} التعليمات`,
    description: 'كيفية الاستخدام وإرشادات السلامة',
    icon: '📝'
  }
];

const AddToolScreen: React.FC<AddToolScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showLastMaintenanceDatePicker, setShowLastMaintenanceDatePicker] = useState(false);
  const [showNextMaintenanceDatePicker, setShowNextMaintenanceDatePicker] = useState(false);
  
  const translateX = useSharedValue(0);

  const handleNext = () => {
    if (currentSection < SECTIONS.length - 1) {
      translateX.value = withSpring(-(currentSection + 1) * width);
      setCurrentSection(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      translateX.value = withSpring(-(currentSection - 1) * width);
      setCurrentSection(prev => prev - 1);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      const tokens = await storage.getTokens();
      
      const toolData = {
        ...values,
        quantity: Number(values.quantity),
        minQuantityAlert: Number(values.minQuantityAlert),
        purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : undefined,
        replacementCost: values.replacementCost ? Number(values.replacementCost) : undefined,
        maintenanceInterval: values.maintenanceInterval ? Number(values.maintenanceInterval) : undefined,
      };

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/tools`,
        toolData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens?.access}`
          }
        }
      );

      if (response.data) {
      navigation.goBack();
      }
    } catch (error) {
      console.error('Error adding tool:', error);
      Alert.alert('خطأ', 'فشل في إضافة الأداة');
    } finally {
      setLoading(false);
    }
  };

  const renderSectionHeader = () => (
    <View style={[styles.header, { borderBottomColor: theme.colors.neutral.border }]}>
      <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.primary.surface }]}>
        <Text style={styles.sectionIcon}>{SECTIONS[currentSection].icon}</Text>
      </View>
      <Text style={[styles.sectionTitle, theme.typography.arabic.h2, { color: theme.colors.neutral.textPrimary }]}>
        {SECTIONS[currentSection].title}
      </Text>
      <Text style={[styles.sectionDescription, theme.typography.arabic.body, { color: theme.colors.neutral.textSecondary }]}>
        {SECTIONS[currentSection].description}
      </Text>
    </View>
  );

  const renderProgressBar = () => (
    <View style={[styles.progressContainer, { padding: theme.spacing.md }]}>
      <View style={styles.progressBar}>
        {SECTIONS.map((section, index) => (
          <TouchableOpacity
            key={section.id}
            onPress={() => {
              translateX.value = withSpring(-index * width);
              setCurrentSection(index);
            }}
            style={[
              styles.progressStep,
              {
                backgroundColor: index <= currentSection 
                  ? theme.colors.primary.base
                  : theme.colors.neutral.border,
                ...theme.shadows.small
              }
            ]}
          >
            <Text style={[styles.progressStepText, { color: theme.colors.neutral.surface }]}>
              {index + 1}
            </Text>
            <Text style={styles.progressStepLabel}>{section.icon}</Text>
          </TouchableOpacity>
        ))}
        <View 
          style={[
            styles.progressLine,
            { backgroundColor: theme.colors.neutral.border }
          ]} 
        />
      </View>
    </View>
  );

  const renderBasicSection = (values: FormData, setFieldValue: any, errors: any, touched: any) => (
    <View style={[styles.section, { width }]}>
            <TextInput
        label={`${TOOL_ICONS.basic.name} اسم الأداة`}
              value={values.name}
              onChangeText={(text) => setFieldValue('name', text)}
              error={touched.name && errors.name}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
            label={`${TOOL_ICONS.basic.quantity} الكمية`}
                  value={values.quantity}
                  onChangeText={(text) => setFieldValue('quantity', text)}
                  keyboardType="numeric"
                  error={touched.quantity && errors.quantity}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
            label={`${TOOL_ICONS.basic.minQuantity} حد التنبيه`}
                  value={values.minQuantityAlert}
                  onChangeText={(text) => setFieldValue('minQuantityAlert', text)}
                  keyboardType="numeric"
                  error={touched.minQuantityAlert && errors.minQuantityAlert}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
            {TOOL_ICONS.basic.category} النوع
                </Text>
          <TouchableOpacity
            style={[styles.select, { 
              borderColor: theme.colors.neutral.border,
              shadowColor: theme.colors.neutral.textSecondary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }]}
            onPress={() => {
              Alert.alert(
                'اختر النوع',
                '',
                Object.entries(TOOL_TYPES).map(([key, value]) => ({
                  text: `${value.icon} ${value.name}`,
                  onPress: () => setFieldValue('category', key)
                }))
              );
            }}
          >
            <Text style={{ color: theme.colors.neutral.textPrimary }}>
              {TOOL_TYPES[values.category].icon} {TOOL_TYPES[values.category].name}
            </Text>
          </TouchableOpacity>
              </View>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
            {TOOL_ICONS.basic.condition} الحالة
                </Text>
          <TouchableOpacity
            style={[styles.select, { borderColor: theme.colors.neutral.border }]}
            onPress={() => {
              Alert.alert(
                'اختر الحالة',
                '',
                Object.entries(TOOL_CONDITION).map(([key, value]) => ({
                  text: `${value.icon} ${value.name}`,
                  onPress: () => setFieldValue('condition', key)
                }))
              );
            }}
          >
            <Text style={{ color: theme.colors.neutral.textPrimary }}>
              {TOOL_CONDITION[values.condition].icon} {TOOL_CONDITION[values.condition].name}
            </Text>
          </TouchableOpacity>
        </View>
              </View>
            </View>
  );

  const renderPurchaseSection = (values: FormData, setFieldValue: any, errors: any, touched: any) => (
    <View style={[styles.section, { width }]}>
      <TouchableOpacity
        style={[styles.dateButton, { 
          borderColor: theme.colors.neutral.border,
          shadowColor: theme.colors.neutral.textSecondary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }]}
        onPress={() => setShowPurchaseDatePicker(true)}
      >
        <Text style={[styles.dateButtonText, { 
          color: values.purchaseDate ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary 
        }]}>
          {TOOL_ICONS.purchase.date} {values.purchaseDate
            ? values.purchaseDate.toLocaleDateString('en-GB')
            : 'تاريخ الشراء'}
        </Text>
      </TouchableOpacity>

            <TextInput
        label={`${TOOL_ICONS.purchase.brand} الشركة المصنعة`}
        value={values.brand}
        onChangeText={(text) => setFieldValue('brand', text)}
            />

            <TextInput
        label={`${TOOL_ICONS.purchase.model} الموديل`}
              value={values.model}
              onChangeText={(text) => setFieldValue('model', text)}
            />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <TextInput
            label={`${TOOL_ICONS.purchase.price} سعر الشراء`}
            value={values.purchasePrice}
            onChangeText={(text) => setFieldValue('purchasePrice', text)}
            keyboardType="numeric"
            error={touched.purchasePrice && errors.purchasePrice}
          />
        </View>
        <View style={styles.halfInput}>
          <TextInput
            label={`${TOOL_ICONS.purchase.price} تكلفة الاستبدال`}
            value={values.replacementCost}
            onChangeText={(text) => setFieldValue('replacementCost', text)}
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );

  const renderLocationSection = (values: FormData, setFieldValue: any) => (
    <View style={[styles.section, { width }]}>
      <TextInput
        label={`${TOOL_ICONS.location.storage} موقع التخزين`}
        value={values.storageLocation}
        onChangeText={(text) => setFieldValue('storageLocation', text)}
      />

      <TextInput
        label={`${TOOL_ICONS.location.assigned} المستخدم الحالي`}
        value={values.assignedTo}
        onChangeText={(text) => setFieldValue('assignedTo', text)}
      />
    </View>
  );

  const renderMaintenanceSection = (values: FormData, setFieldValue: any) => (
    <View style={[styles.section, { width }]}>
              <TouchableOpacity
                style={[styles.dateButton, { 
                  borderColor: theme.colors.neutral.border,
                  shadowColor: theme.colors.neutral.textSecondary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }]}
                onPress={() => setShowLastMaintenanceDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { 
                  color: values.lastMaintenanceDate ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary 
                }]}>
                  {TOOL_ICONS.maintenance.last} {values.lastMaintenanceDate
                    ? values.lastMaintenanceDate.toLocaleDateString('en-GB')
                    : 'تاريخ آخر صيانة'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateButton, { 
                  borderColor: theme.colors.neutral.border,
                  shadowColor: theme.colors.neutral.textSecondary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }]}
                onPress={() => setShowNextMaintenanceDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { 
                  color: values.nextMaintenanceDate ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary 
                }]}>
                  {TOOL_ICONS.maintenance.next} {values.nextMaintenanceDate
                    ? values.nextMaintenanceDate.toLocaleDateString('en-GB')
                    : 'تاريخ الصيانة القادمة'}
                </Text>
              </TouchableOpacity>

            <TextInput
        label={`${TOOL_ICONS.maintenance.notes} ملاحظات الصيانة`}
        value={values.maintenanceNotes}
        onChangeText={(text) => setFieldValue('maintenanceNotes', text)}
        multiline
        numberOfLines={4}
      />
    </View>
  );

  const renderInstructionsSection = (values: FormData, setFieldValue: any) => (
    <View style={[styles.section, { width }]}>
            <TextInput
        label={`${TOOL_ICONS.instructions.usage} تعليمات الاستخدام`}
        value={values.usageInstructions}
        onChangeText={(text) => setFieldValue('usageInstructions', text)}
        multiline
        numberOfLines={4}
            />

            <TextInput
        label={`${TOOL_ICONS.instructions.safety} إرشادات السلامة`}
        value={values.safetyGuidelines}
        onChangeText={(text) => setFieldValue('safetyGuidelines', text)}
              multiline
              numberOfLines={4}
            />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      {renderSectionHeader()}
      {renderProgressBar()}

      <Formik
        initialValues={initialFormData}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, handleSubmit, errors, touched }) => (
          <>
            <ScrollView 
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={[styles.sectionsContainer, animatedStyle]}>
                {renderBasicSection(values, setFieldValue, errors, touched)}
                {renderPurchaseSection(values, setFieldValue, errors, touched)}
                {renderLocationSection(values, setFieldValue)}
                {renderMaintenanceSection(values, setFieldValue)}
                {renderInstructionsSection(values, setFieldValue)}
              </Animated.View>
            </ScrollView>

            <View style={[styles.footer, { 
              borderTopColor: theme.colors.neutral.border,
              padding: theme.spacing.md
            }]}>
              <View style={styles.navigationButtons}>
                {currentSection > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        backgroundColor: theme.colors.neutral.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.primary.base,
                        ...theme.shadows.small
                      }
                    ]}
                    onPress={handlePrevious}
                  >
                    <Text style={[
                      styles.navButtonText,
                      theme.typography.arabic.body,
                      { color: theme.colors.primary.base }
                    ]}>السابق ←</Text>
                  </TouchableOpacity>
                )}
                {currentSection < SECTIONS.length - 1 ? (
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        backgroundColor: theme.colors.primary.base,
                        ...theme.shadows.small
                      }
                    ]}
                    onPress={handleNext}
                  >
                    <Text style={[
                      styles.navButtonText,
                      theme.typography.arabic.body,
                      { color: theme.colors.neutral.surface }
                    ]}>→ التالي</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      {
                        backgroundColor: loading ? theme.colors.primary.disabled : theme.colors.primary.base,
                        ...theme.shadows.small
                      }
                    ]}
                onPress={() => handleSubmit()}
                disabled={loading}
                  >
                    <Text style={[
                      styles.navButtonText,
                      theme.typography.arabic.body,
                      { color: theme.colors.neutral.surface }
                    ]}>
                      {loading ? 'جاري الحفظ...' : 'حفظ ✅'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {showPurchaseDatePicker && (
              <DateTimePicker
                value={values.purchaseDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowPurchaseDatePicker(false);
                  if (date) {
                    setFieldValue('purchaseDate', date);
                  }
                }}
                maximumDate={new Date()}
              />
            )}

            {showLastMaintenanceDatePicker && (
              <DateTimePicker
                value={values.lastMaintenanceDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowLastMaintenanceDatePicker(false);
                  if (date) {
                    setFieldValue('lastMaintenanceDate', date);
                  }
                }}
                maximumDate={new Date()}
              />
            )}

            {showNextMaintenanceDatePicker && (
              <DateTimePicker
                value={values.nextMaintenanceDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowNextMaintenanceDatePicker(false);
                  if (date) {
                    setFieldValue('nextMaintenanceDate', date);
                  }
                }}
                minimumDate={new Date()}
              />
            )}
          </>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  sectionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 32,
  },
  sectionTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionDescription: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  progressContainer: {
    padding: 20,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    height: 60,
  },
  progressLine: {
    position: 'absolute',
    height: 3,
    top: '50%',
    left: '10%',
    zIndex: 0,
    width: '80%',
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  progressStepText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressStepLabel: {
    position: 'absolute',
    bottom: -25,
    fontSize: 20,
  },
  formContainer: {
    flex: 1,
  },
  sectionsContainer: {
    flexDirection: 'row',
  },
  section: {
    padding: 20,
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  halfInput: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontWeight: 'bold',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  dateButtonText: {
    fontSize: 18,
    textAlign: 'center',
  },
  select: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
});

export default AddToolScreen; 