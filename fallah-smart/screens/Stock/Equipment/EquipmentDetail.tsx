import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  I18nManager,
  SafeAreaView,
  Dimensions,
  TextInput,
  Modal
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEquipment } from '../../../context/EquipmentContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { formatDate } from '../../../utils/date';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUS, OPERATIONAL_STATUS, FUEL_TYPES, EquipmentStatus, EquipmentType, OperationalStatus, FuelType } from './constants';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { StockEquipment } from '../types';
import { Button, IconButton, Card } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

// Equipment-related icons
const EQUIPMENT_ICONS = {
  tractor: '🚜',
  harvester: '🚚',
  irrigation: '💧',
  pestControl: '🔫',
  seeder: '🌱',
  plow: '⚒️',
  other: '🔧',
  basic: {
    type: '🔧',
    quantity: '📦',
    serial: '🔢',
    model: '📱',
    manufacturer: '🏭',
    year: '📅',
  },
  purchase: {
    date: '🛒',
    warranty: '📜',
    price: '💰',
  },
  technical: {
    fuel: '⛽',
    capacity: '🔋',
    power: '⚡',
    dimensions: '📏',
    weight: '⚖️',
  },
  maintenance: {
    last: '🔨',
    next: '📅',
    interval: '⏱️',
    record: '📝',
    cost: '💵',
    notes: '📋',
    cancel: '❌',
    save: '💾',
  },
  operation: {
    location: '📍',
    operator: '👨‍🔧',
    hours: '⏰',
    lastOperation: '📆',
  },
  status: {
    broken: '❌',
    maintenance: '🔧',
    warning: '⚠️',
    operational: '✅',
  },
  actions: {
    edit: '✏️',
    delete: '🗑️',
    save: '💾',
    cancel: '❌',
  },
  loading: '⚙️',
  notFound: '🔍',
  back: '↩️',
  notes: '📝',
};

// Field icons for different sections
const FIELD_ICONS = {
  purchaseDate: '📅',
  lastMaintenanceDate: '🔧',
  nextMaintenanceDate: '⏰',
  condition: '🔍',
  brand: '🏭',
  model: '📋',
  serialNumber: '🔢',
  status: '📊',
  purchasePrice: '💰',
  currentValue: '💲',
  location: '📍',
  operator: '👨‍🌾',
  fuelType: '⛽',
  power: '⚡',
  capacity: '📦',
  notes: '📝',
  quantity: '📦',
  yearOfManufacture: '📅',
  manufacturer: '🏭',
  dimensions: '📏',
  weight: '⚖️',
  operatingHours: '⏱️',
  lastOperationDate: '📆',
  operatingInstructions: '📋',
  safetyGuidelines: '⚠️',
  warrantyExpiryDate: '📜',
};

// Get equipment icon based on type
const getEquipmentIcon = (type: string): string => {
  if (!type) return EQUIPMENT_ICONS.other;
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('tractor') || lowerType.includes('جرار')) return EQUIPMENT_ICONS.tractor;
  if (lowerType.includes('harvester') || lowerType.includes('حصادة')) return EQUIPMENT_ICONS.harvester;
  if (lowerType.includes('irrigation') || lowerType.includes('ري')) return EQUIPMENT_ICONS.irrigation;
  if (lowerType.includes('pest') || lowerType.includes('spray') || lowerType.includes('مبيد')) return EQUIPMENT_ICONS.pestControl;
  if (lowerType.includes('seed') || lowerType.includes('زراعة') || lowerType.includes('بذر')) return EQUIPMENT_ICONS.seeder;
  if (lowerType.includes('plow') || lowerType.includes('محراث')) return EQUIPMENT_ICONS.plow;
  
  return EQUIPMENT_ICONS.other;
};

// Get condition badge color
const getConditionColor = (condition: string, theme: any): string => {
  switch (condition?.toLowerCase()) {
    case 'excellent':
    case 'ممتاز':
      return theme.colors.success;
    case 'good':
    case 'جيد':
      return theme.colors.info;
    case 'fair':
    case 'مقبول':
      return theme.colors.warning;
    case 'poor':
    case 'سيء':
      return theme.colors.error;
    default:
      return theme.colors.neutral.border;
  }
};

// Get condition display name
const getConditionName = (condition: string): string => {
  switch (condition?.toLowerCase()) {
    case 'excellent': return 'ممتاز';
    case 'good': return 'جيد';
    case 'fair': return 'مقبول';
    case 'poor': return 'سيء';
    default: return condition || 'غير محدد';
  }
};

// Get status display name
const getStatusName = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active': return 'نشط';
    case 'inactive': return 'غير نشط';
    case 'maintenance': return 'قيد الصيانة';
    case 'broken': return 'معطل';
    default: return status || 'غير محدد';
  }
};

// Get status icon
const getStatusIcon = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active': return '✅';
    case 'inactive': return '⏸️';
    case 'maintenance': return '🔧';
    case 'broken': return '❌';
    default: return '❓';
  }
};

interface CustomDatePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

interface MaintenanceFormData {
  notes: string;
  cost: string;
  nextMaintenanceDate: Date;
}

interface MaintenanceData {
  maintenanceNotes: string;
  cost: number;
  nextMaintenanceDate: Date;
}

type EquipmentDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'EquipmentDetail'>;
  route: RouteProp<StockStackParamList, 'EquipmentDetail'>;
};

// Add types for the QuantityModal component
interface QuantityModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, notes: string) => void;
  type: 'add' | 'remove';
  currentQuantity: number;
  loading: boolean;
}

const QuantityModal: React.FC<QuantityModalProps> = ({
  visible,
  onClose,
  onConfirm,
  type,
  currentQuantity,
  loading,
}) => {
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const theme = useTheme();

  const handleClose = useCallback(() => {
    setQuantity('');
    setNotes('');
    onClose();
  }, [onClose]);

  const handleConfirm = async () => {
    const num = Number(quantity);
    if (num > 0) {
      if (type === 'remove' && num > currentQuantity) {
        Alert.alert('خطأ', 'لا يمكن سحب كمية أكبر من المتوفرة');
        return;
      }
      try {
        await onConfirm(num, notes);
        setQuantity('');
        setNotes('');
    } catch (error) {
        console.error('Error updating quantity:', error);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.neutral.textPrimary }]}>
            {type === 'add' ? 'إضافة للمخزون' : 'سحب من المخزون'}
          </Text>

          <View style={styles.modalInputContainer}>
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: theme.colors.neutral.background,
                color: theme.colors.neutral.textPrimary,
                textAlign: 'right'
              }]}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="الكمية"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              editable={!loading}
            />

            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: theme.colors.neutral.background,
                color: theme.colors.neutral.textPrimary,
                height: 100,
                textAlignVertical: 'top',
                textAlign: 'right'
              }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="ملاحظات (اختياري)"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
              editable={!loading}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: theme.colors.neutral.textPrimary }]}>
                إلغاء
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.modalButton, 
                styles.confirmButton,
                { backgroundColor: type === 'add' ? theme.colors.success : theme.colors.error },
                loading && { opacity: 0.7 }
              ]} 
              onPress={handleConfirm}
              disabled={loading || !quantity}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.buttonText, { color: '#fff' }]}>تأكيد</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const EquipmentDetailScreen: React.FC<EquipmentDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { equipmentId } = route.params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [equipment, setEquipment] = useState<StockEquipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [quantityLoading, setQuantityLoading] = useState(false);
  
  const { deleteEquipment } = useEquipment();

  // Direct API fetch function for equipment details
  const fetchEquipmentDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
        setIsLoading(false);
        return;
      }
      
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/equipment/${equipmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        }
      );
      
      setEquipment(response.data);
    } catch (error) {
      console.error('Error fetching equipment detail:', error);
      setError('فشل في تحميل تفاصيل المعدة');
      } finally {
          setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipmentDetail();
  }, [equipmentId]);

  const handleDelete = useCallback(async () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه المعدة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              
                const tokens = await storage.getTokens();
              
              if (!tokens?.access) {
                Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
                return;
              }

              await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/stock/equipment/${equipmentId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${tokens.access}`
                  }
                }
              );
                
                navigation.goBack();
            } catch (error) {
              console.error('Error deleting equipment:', error);
              Alert.alert('خطأ', 'فشل في حذف المعدة');
            } finally {
              setIsDeleting(false);
    }
          },
        },
      ]
    );
  }, [equipmentId, navigation]);

  // Function to render fields with icons
  const renderField = useCallback((label: string, value: any, icon: string) => {
    if (value === null || value === undefined || value === '') return null;

    return (
      <Animated.View 
        entering={FadeInDown.delay(100).springify()}
        style={[styles.infoCard, { backgroundColor: theme.colors.neutral.surface }]}
      >
        <View style={styles.infoHeader}>
          <Text style={styles.fieldIcon}>{icon}</Text>
          <Text style={[styles.infoTitle, { color: theme.colors.neutral.textPrimary }]}>
            {label}
          </Text>
        </View>
        <Text style={[styles.infoContent, { color: theme.colors.neutral.textSecondary }]}>
          {typeof value === 'number' ? value.toLocaleString() : value.toString()}
        </Text>
      </Animated.View>
    );
  }, [theme.colors.neutral]);

  // Add quantity change handler
  const handleQuantityChange = async (type: 'add' | 'remove', quantity: number, notes: string) => {
    if (!equipment) return;
    
    setQuantityLoading(true);
    try {
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
        return;
      }
      
      const updatedQuantity = type === 'add' 
        ? equipment.quantity + quantity
        : Math.max(0, equipment.quantity - quantity);
      
      const response = await axios.patch(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/equipment/${equipmentId}`,
        {
          quantity: updatedQuantity,
          notes: notes ? `${type === 'add' ? 'إضافة' : 'سحب'} ${quantity} وحدة. ${notes}` : undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        setEquipment(response.data);
        
        if (type === 'add') {
          setShowAddModal(false);
      } else {
          setShowRemoveModal(false);
        }
        
        Alert.alert(
          'نجاح',
          `تم ${type === 'add' ? 'إضافة' : 'سحب'} ${quantity} وحدة بنجاح`
        );
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('خطأ', `فشل في ${type === 'add' ? 'إضافة' : 'سحب'} الكمية`);
    } finally {
      setQuantityLoading(false);
    }
  };

  if (isLoading || isDeleting) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.loadingContainer}
          >
            <Text style={styles.loadingIcon}>⚙️</Text>
            <ActivityIndicator size="large" color={theme.colors.primary.base} />
            <Text style={[styles.loadingText, { color: theme.colors.neutral.textSecondary }]}>
              {isDeleting ? 'جاري الحذف...' : 'جاري التحميل...'}
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !equipment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
        <View style={[styles.container, styles.centerContent]}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={48}
            color={theme.colors.neutral.textSecondary}
          />
          <Text style={[styles.errorText, { color: theme.colors.neutral.textSecondary }]}>
              {error || 'لم يتم العثور على المعدة'}
            </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={() => navigation.goBack()}
            >
            <Text style={{ color: theme.colors.neutral.surface }}>العودة للقائمة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const needsMaintenance = equipment.nextMaintenanceDate && 
                          new Date(equipment.nextMaintenanceDate) <= new Date();
  
  const statusInfo = EQUIPMENT_STATUS[equipment.status as EquipmentStatus] || { 
    name: equipment.status || 'غير محدد', 
    color: theme.colors.neutral.border,
    icon: '❓' 
  };
  
  const equipmentType = EQUIPMENT_TYPES[equipment.type as EquipmentType] || { 
    name: equipment.type || 'غير محدد' 
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <Animated.View 
          entering={FadeInDown.springify()}
          style={[
            styles.header,
            { 
            backgroundColor: theme.colors.neutral.surface,
              ...Platform.select({
                ios: {
                  shadowColor: theme.colors.neutral.textPrimary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                },
                android: {
                  elevation: 4,
                },
              }),
            }
          ]}
        >
          <View style={styles.headerContent}>
          <View style={[
            styles.iconContainer,
            { 
                backgroundColor: equipment.status === 'broken'
                  ? theme.colors.error + '20'
                  : equipment.status === 'maintenance'
                    ? theme.colors.warning + '20'
                  : needsMaintenance
                      ? theme.colors.info + '20'
                      : theme.colors.success + '20'
              }
            ]}>
              <Text style={styles.equipmentIcon}>{getEquipmentIcon(equipment.type)}</Text>
              {equipment.status === 'broken' && <Text style={styles.statusIndicator}>❌</Text>}
              {equipment.status === 'maintenance' && <Text style={styles.statusIndicator}>🔧</Text>}
              {needsMaintenance && equipment.status !== 'maintenance' && <Text style={styles.statusIndicator}>⚠️</Text>}
          </View>
          
          <View style={styles.headerInfo}>
              <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
                {equipment.name}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>
                {equipmentType.name}
              </Text>
              </View>
              </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                {equipment.quantity || 1}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                الكمية
              </Text>
        </View>
          
            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                {equipment.purchasePrice || '-'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                د.أ
              </Text>
        </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <View style={[
                styles.statusIndicatorBadge,
                { backgroundColor: statusInfo.color }
              ]}>
                <Text style={styles.statusIconText}>
                  {statusInfo.icon || '❓'}
              </Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                {statusInfo.name}
              </Text>
            </View>
        </View>
          
          <View style={styles.quantityActions}>
                <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: theme.colors.success }]}
              onPress={() => setShowAddModal(true)}
                >
              <Text style={styles.quantityButtonIcon}>➕</Text>
              <Text style={styles.quantityButtonText}>إضافة للمخزون</Text>
                </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quantityButton, { backgroundColor: theme.colors.error }]}
              onPress={() => setShowRemoveModal(true)}
              disabled={equipment.quantity <= 0}
            >
              <Text style={styles.quantityButtonIcon}>➖</Text>
              <Text style={styles.quantityButtonText}>سحب من المخزون</Text>
            </TouchableOpacity>
            </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={() => navigation.navigate('AddEquipment', { equipmentId })}
            >
              <MaterialCommunityIcons name="pencil" size={24} color="#FFF" />
              <Text style={styles.actionButtonText}>تعديل</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="delete" size={24} color="#FFF" />
                  <Text style={styles.actionButtonText}>حذف</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.content}>
          {/* Basic Information Section */}
          {renderField('النوع', equipmentType.name, FIELD_ICONS.model)}
          {renderField('الكمية', equipment.quantity, FIELD_ICONS.quantity)}
          {renderField('الرقم التسلسلي', equipment.serialNumber, FIELD_ICONS.serialNumber)}
          {renderField('الموديل', equipment.model, FIELD_ICONS.model)}
          {renderField('الشركة المصنعة', equipment.manufacturer, FIELD_ICONS.manufacturer)}
          {renderField('سنة التصنيع', equipment.yearOfManufacture, FIELD_ICONS.yearOfManufacture)}
          
          {/* Purchase Information */}
          {renderField('تاريخ الشراء', equipment.purchaseDate ? formatDate(equipment.purchaseDate) : 'N/A', FIELD_ICONS.purchaseDate)}
          {renderField('تاريخ انتهاء الضمان', equipment.warrantyExpiryDate ? formatDate(equipment.warrantyExpiryDate) : 'N/A', FIELD_ICONS.warrantyExpiryDate)}
          {renderField('سعر الشراء', equipment.purchasePrice ? `${equipment.purchasePrice} د.ج` : null, FIELD_ICONS.purchasePrice)}
          
          {/* Maintenance Information */}
          {renderField('آخر صيانة', equipment.lastMaintenanceDate ? formatDate(equipment.lastMaintenanceDate) : 'N/A', FIELD_ICONS.lastMaintenanceDate)}
          {renderField('الصيانة القادمة', equipment.nextMaintenanceDate ? formatDate(equipment.nextMaintenanceDate) : 'N/A', FIELD_ICONS.nextMaintenanceDate)}
          {renderField('فترة الصيانة', equipment.maintenanceInterval ? `${equipment.maintenanceInterval} يوم` : null, FIELD_ICONS.nextMaintenanceDate)}
          {renderField('ملاحظات الصيانة', equipment.maintenanceCosts, FIELD_ICONS.notes)}
          
          {/* Technical Information */}
          {renderField('نوع الوقود', FUEL_TYPES[equipment.fuelType as FuelType]?.name, FIELD_ICONS.fuelType)}
          {renderField('سعة الوقود', equipment.fuelCapacity ? `${equipment.fuelCapacity} لتر` : null, FIELD_ICONS.capacity)}
          {renderField('القدرة', equipment.powerOutput, FIELD_ICONS.power)}
          {renderField('الأبعاد', equipment.dimensions, FIELD_ICONS.dimensions)}
          {renderField('الوزن', equipment.weight ? `${equipment.weight} كغ` : null, FIELD_ICONS.weight)}
          
          {/* Operation Information */}
          {renderField('الموقع', equipment.location, FIELD_ICONS.location)}
          {renderField('المشغل المعين', equipment.assignedOperator, FIELD_ICONS.operator)}
          {renderField('ساعات التشغيل', equipment.operatingHours ? `${equipment.operatingHours} ساعة` : null, FIELD_ICONS.operatingHours)}
          {renderField('آخر تشغيل', equipment.lastOperationDate ? formatDate(equipment.lastOperationDate) : 'N/A', FIELD_ICONS.lastOperationDate)}
          
          {/* Additional Information */}
          {renderField('ملاحظات', equipment.notes, FIELD_ICONS.notes)}
          {renderField('تعليمات التشغيل', equipment.operatingInstructions, FIELD_ICONS.operatingInstructions)}
          {renderField('إرشادات السلامة', equipment.safetyGuidelines, FIELD_ICONS.safetyGuidelines)}
        </View>
    </ScrollView>

      <QuantityModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={(quantity, notes) => handleQuantityChange('add', quantity, notes)}
        type="add"
        currentQuantity={equipment.quantity}
        loading={quantityLoading}
      />

      <QuantityModal
        visible={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={(quantity, notes) => handleQuantityChange('remove', quantity, notes)}
        type="remove"
        currentQuantity={equipment.quantity}
        loading={quantityLoading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    gap: 24,
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  equipmentIcon: {
    fontSize: 40,
  },
  statusIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 14,
  },
  statusIndicatorBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconText: {
    fontSize: 24,
    color: '#FFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  infoContent: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
  fieldIcon: {
    fontSize: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  quantityActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quantityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  quantityButtonIcon: {
    fontSize: 16,
    color: '#FFF',
  },
  quantityButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInputContainer: {
    gap: 16,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  confirmButton: {
    backgroundColor: '#4caf50',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EquipmentDetailScreen;