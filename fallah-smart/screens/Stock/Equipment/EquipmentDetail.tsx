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
  TextInput
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

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

// Equipment-related icons
const EQUIPMENT_ICONS = {
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

const EquipmentDetailScreen: React.FC<EquipmentDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.neutral.surface,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    equipmentIcon: {
      fontSize: 40,
    },
    statusIndicator: {
      position: 'absolute',
      top: 0,
      right: 0,
      fontSize: 20,
    },
    headerInfo: {
      flex: 1,
      marginLeft: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    statusContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    content: {
      padding: 16,
      gap: 16,
    },
    section: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      ...Platform.select({
        ios: {
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
    },
    maintenanceButton: {
      marginTop: 16,
    },
    maintenanceForm: {
      marginTop: 16,
      gap: 16,
    },
    error: {
      color: '#F44336',
      textAlign: 'center',
    },
    alertText: {
      color: '#FF9800',
      fontWeight: 'bold',
    },
    submitButton: {
      marginTop: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 10,
      marginBottom: 8,
      fontSize: 16,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 16,
      marginBottom: 8,
      fontWeight: '500',
    },
    datePickerButton: {
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 16,
      marginBottom: 32,
    },
    editButton: {
      flex: 1,
    },
    deleteButton: {
      flex: 1,
      borderColor: '#F44336',
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
      color: 'gray',
    },
    errorContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    notFoundIcon: {
      fontSize: 80,
      marginBottom: 16,
    },
    notFoundText: {
      fontSize: 18,
      marginBottom: 24,
      color: 'gray',
    },
    backButton: {
      minWidth: 120,
    },
    dateText: {
      fontSize: 16,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const { equipmentId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [equipment, setEquipment] = useState<StockEquipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { 
    equipment: equipmentList, 
    fetchEquipment,
    deleteEquipment,
    updateStatus,
    recordMaintenance 
  } = useEquipment();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [maintenanceFormData, setMaintenanceFormData] = useState<MaintenanceFormData>({
    notes: '',
    cost: '',
    nextMaintenanceDate: new Date()
  });

  const handleMaintenanceSubmit = async () => {
    const maintenanceData: MaintenanceData = {
      maintenanceNotes: maintenanceFormData.notes,
      cost: parseFloat(maintenanceFormData.cost),
      nextMaintenanceDate: maintenanceFormData.nextMaintenanceDate
    };

    try {
      setIsLoading(true);
      
      // Try direct API update
      const response = await axios.post(`/api/equipment/${equipmentId}/maintenance`, maintenanceData);
      
      if (response.data) {
        console.log('Maintenance recorded successfully via direct API');
        setEquipment(response.data);
      } else {
        console.log('Direct API update returned no data, falling back to context');
        await recordMaintenance(equipmentId, maintenanceData);
        const updatedEquipment = equipmentList.find(item => item.id.toString() === equipmentId);
        if (updatedEquipment) {
          setEquipment(updatedEquipment);
        }
      }

      // Reset form
      setMaintenanceFormData({
        notes: '',
        cost: '',
        nextMaintenanceDate: new Date()
      });
    } catch (error) {
      console.error('Error recording maintenance:', error);
      Alert.alert('خطأ', 'فشل في تسجيل الصيانة');
    } finally {
      setIsLoading(false);
    }
  };

  // Direct API fetch function for equipment details
  const fetchEquipmentDirectly = useCallback(async () => {
    try {
      const tokens = await storage.getTokens();
      console.log('Tokens available:', tokens ? 'Yes' : 'No');
      
      const DIRECT_API_URL = `${process.env.EXPO_PUBLIC_API_URL}/stock/equipment/${equipmentId}`;
      console.log('Fetching equipment details directly from:', DIRECT_API_URL);
      
      const response = await axios.get(DIRECT_API_URL, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
        },
        timeout: 10000
      });
      
      console.log('API Response Status:', response.status);
      console.log('Equipment details fetched successfully');
      
      return response.data;
    } catch (error) {
      console.error('Direct API fetch error:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:');
        console.error('- Status:', error.response?.status);
        console.error('- Response data:', error.response?.data);
        
        if (error.response?.status === 401) {
          console.log('Unauthorized, trying without token...');
          try {
            const DIRECT_API_URL = `${process.env.EXPO_PUBLIC_API_URL}/stock/equipment/${equipmentId}`;
            const fallbackResponse = await axios.get(DIRECT_API_URL, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000
            });
            
            console.log('Fallback API call successful');
            return fallbackResponse.data;
          } catch (fallbackError) {
            console.error('Fallback API call also failed:', fallbackError);
            throw fallbackError;
          }
        }
      }
      
      throw error;
    }
  }, [equipmentId]);

  useEffect(() => {
    console.log('EquipmentDetail mounted - fetching equipment details');
    
    let isMounted = true;
    
    const loadEquipmentDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try direct API call first
        const equipmentData = await fetchEquipmentDirectly();
        
        if (isMounted && equipmentData) {
          console.log('Equipment details fetched successfully, updating UI');
          setEquipment(equipmentData);
        } else {
          // If direct API fails, try to get from context
          const contextEquipment = equipmentList.find(item => item.id.toString() === equipmentId);
          if (contextEquipment) {
            setEquipment(contextEquipment);
          } else {
            // If not found in context, refresh the context
            await fetchEquipment();
            const refreshedEquipment = equipmentList.find(item => item.id.toString() === equipmentId);
            if (refreshedEquipment) {
              setEquipment(refreshedEquipment);
            } else {
              setError('لم يتم العثور على المعدة');
            }
          }
        }
      } catch (err) {
        console.error('Error loading equipment details:', err);
        
        // Try context as fallback
        try {
          console.log('Falling back to context method...');
          const contextEquipment = equipmentList.find(item => item.id.toString() === equipmentId);
          if (contextEquipment) {
            setEquipment(contextEquipment);
          } else {
            setError('لم يتم العثور على المعدة');
          }
        } catch (contextErr) {
          console.error('Context method also failed:', contextErr);
          
          if (isMounted) {
            const errorMsg = err instanceof Error 
              ? err.message 
              : 'فشل في تحميل تفاصيل المعدة';
            setError(errorMsg);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadEquipmentDetails();
    
    return () => {
      console.log('EquipmentDetail unmounting - cleaning up');
      isMounted = false;
    };
  }, [equipmentId, fetchEquipmentDirectly, fetchEquipment, equipmentList]);

  const handleDelete = async () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه المعدة؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              // Try direct API delete
              try {
                const tokens = await storage.getTokens();
                const DIRECT_API_URL = `${process.env.EXPO_PUBLIC_API_URL}/stock/equipment/${equipmentId}`;
                
                await axios.delete(DIRECT_API_URL, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
                  }
                });
                
                console.log('Equipment deleted successfully via direct API');
                navigation.goBack();
                Alert.alert('نجاح', 'تم حذف المعدة بنجاح');
              } catch (directError) {
                console.error('Direct delete failed, falling back to context:', directError);
                // Fall back to context delete
      await deleteEquipment(equipmentId);
      navigation.goBack();
                Alert.alert('نجاح', 'تم حذف المعدة بنجاح');
              }
    } catch (err) {
      console.error('Error deleting equipment:', err);
              Alert.alert('خطأ', 'فشل في حذف المعدة');
    }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (newStatus: EquipmentStatus) => {
    try {
      setIsLoading(true);
      
      // Try direct API update
      const response = await axios.patch(`/api/equipment/${equipmentId}/status`, {
        status: newStatus
      });
      
      if (response.data) {
        console.log('Status updated successfully via direct API');
        setEquipment(response.data);
      } else {
        console.log('Direct API update returned no data, falling back to context');
      await updateStatus(equipmentId, newStatus);
        const updatedEquipment = equipmentList.find(item => item.id.toString() === equipmentId);
        if (updatedEquipment) {
          setEquipment(updatedEquipment);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('خطأ', 'فشل في تحديث حالة المعدة');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusIcon = (equipment: StockEquipment) => {
    if (isBroken) {
      return <Text style={styles.statusIndicator}>{EQUIPMENT_ICONS.status.broken}</Text>;
    }
    if (needsMaintenance) {
      return <Text style={styles.statusIndicator}>{EQUIPMENT_ICONS.status.warning}</Text>;
    }
    if (isInMaintenance) {
      return <Text style={styles.statusIndicator}>{EQUIPMENT_ICONS.status.maintenance}</Text>;
    }
    return <Text style={styles.statusIndicator}>{EQUIPMENT_ICONS.status.operational}</Text>;
  };

  const renderInfoRow = (label: string, value: string | number | undefined | null, icon: string) => {
    if (!value) return null;
    
    return (
      <View style={styles.infoRow}>
        <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
          {icon} {label}:
        </Text>
        <Text style={{ color: theme.colors.neutral.textPrimary }}>
          {value}
        </Text>
      </View>
    );
  };

  const renderSection = (title: string, icon: string, children: React.ReactNode) => {
    // Only render section if it has visible children
    if (!React.Children.toArray(children).some(child => child !== null)) {
      return null;
    }

    return (
      <Animated.View 
        entering={FadeInDown.springify()}
        style={[styles.section, { 
          backgroundColor: theme.colors.neutral.surface,
          shadowColor: theme.colors.neutral.textPrimary,
        }]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
          {icon} {title}
        </Text>
        {children}
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar
          backgroundColor={theme.colors.neutral.surface}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.loadingContainer}
          >
            <Text style={styles.loadingIcon}>{EQUIPMENT_ICONS.loading}</Text>
            <ActivityIndicator size="large" color={theme.colors.primary.base} />
            <Text style={[styles.loadingText, { color: theme.colors.neutral.textSecondary }]}>
              جاري تحميل تفاصيل المعدة...
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !equipment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar
          backgroundColor={theme.colors.neutral.surface}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.errorContainer}
          >
            <Text style={styles.notFoundIcon}>{EQUIPMENT_ICONS.notFound}</Text>
            <Text style={[styles.notFoundText, { color: theme.colors.neutral.textSecondary }]}>
              {error || 'لم يتم العثور على المعدة'}
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.buttonText}>{`${EQUIPMENT_ICONS.back} العودة`}</Text>
            </Button>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const equipmentType = EQUIPMENT_TYPES[equipment.type as EquipmentType] || { icon: '🔧', name: 'معدة' };
  const statusInfo = EQUIPMENT_STATUS[equipment.status as EquipmentStatus] || { icon: '❓', name: equipment.status, color: '#9E9E9E' };
  const operationalInfo = OPERATIONAL_STATUS[equipment.operationalStatus as OperationalStatus] || { icon: '❓', name: equipment.operationalStatus, color: '#9E9E9E' };
  const fuelInfo = equipment.fuelType ? (FUEL_TYPES[equipment.fuelType as FuelType] || { icon: '⛽', name: equipment.fuelType }) : null;

  const needsMaintenance = equipment.nextMaintenanceDate && new Date(equipment.nextMaintenanceDate) <= new Date();
  const isInMaintenance = equipment.status === 'maintenance';
  const isBroken = equipment.status === 'broken';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View 
          entering={FadeInDown.springify()}
          style={[styles.header, { 
            backgroundColor: theme.colors.neutral.surface,
            borderBottomColor: theme.colors.neutral.border
          }]}
        >
          <View style={[
            styles.iconContainer,
            { 
              backgroundColor: isBroken 
                ? '#F44336' + '20'
                : isInMaintenance
                  ? '#FFC107' + '20'
                  : needsMaintenance
                    ? '#FF9800' + '20'
                    : '#4CAF50' + '20'
            }
          ]}>
            <Text style={styles.equipmentIcon}>{equipmentType.icon}</Text>
            {renderStatusIcon(equipment)}
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{equipment.name}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                <Text style={styles.statusText}>{statusInfo.name}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: operationalInfo.color }]}>
                <Text style={styles.statusText}>{operationalInfo.name}</Text>
              </View>
            </View>
        </View>
          
        <View style={styles.actions}>
          <IconButton
            icon="pencil"
            size={24}
              onPress={() => navigation.navigate('AddEquipment', { equipmentId })}
          />
          <IconButton
            icon="delete"
            size={24}
              iconColor="#F44336"
            onPress={handleDelete}
          />
        </View>
        </Animated.View>

        <View style={styles.content}>
          {renderSection('معلومات أساسية', EQUIPMENT_ICONS.basic.type, <>
            {renderInfoRow('النوع', equipmentType.name, EQUIPMENT_ICONS.basic.type)}
            {renderInfoRow('الكمية', equipment.quantity, EQUIPMENT_ICONS.basic.quantity)}
            {renderInfoRow('الرقم التسلسلي', equipment.serialNumber, EQUIPMENT_ICONS.basic.serial)}
            {renderInfoRow('الموديل', equipment.model, EQUIPMENT_ICONS.basic.model)}
            {renderInfoRow('الشركة المصنعة', equipment.manufacturer, EQUIPMENT_ICONS.basic.manufacturer)}
            {renderInfoRow('سنة التصنيع', equipment.yearOfManufacture, EQUIPMENT_ICONS.basic.year)}
          </>)}

          {renderSection('معلومات الشراء', EQUIPMENT_ICONS.purchase.date, <>
            {renderInfoRow('تاريخ الشراء', formatDate(equipment.purchaseDate), EQUIPMENT_ICONS.purchase.date)}
            {renderInfoRow('تاريخ انتهاء الضمان', equipment.warrantyExpiryDate ? formatDate(equipment.warrantyExpiryDate) : null, EQUIPMENT_ICONS.purchase.warranty)}
            {renderInfoRow('سعر الشراء', equipment.purchasePrice ? `${equipment.purchasePrice} د.ج` : null, EQUIPMENT_ICONS.purchase.price)}
          </>)}

          {renderSection('معلومات الوقود', EQUIPMENT_ICONS.technical.fuel, <>
            {renderInfoRow('نوع الوقود', fuelInfo?.name, EQUIPMENT_ICONS.technical.fuel)}
            {renderInfoRow('سعة الوقود', equipment.fuelCapacity ? `${equipment.fuelCapacity} لتر` : null, EQUIPMENT_ICONS.technical.capacity)}
            {renderInfoRow('القدرة', equipment.powerOutput, EQUIPMENT_ICONS.technical.power)}
          </>)}

          {renderSection('معلومات الأبعاد والوزن', EQUIPMENT_ICONS.technical.dimensions, <>
            {renderInfoRow('الأبعاد', equipment.dimensions, EQUIPMENT_ICONS.technical.dimensions)}
            {renderInfoRow('الوزن', equipment.weight ? `${equipment.weight} كغ` : null, EQUIPMENT_ICONS.technical.weight)}
          </>)}

          {renderSection('معلومات الصيانة', EQUIPMENT_ICONS.maintenance.last, <>
            {renderInfoRow('آخر صيانة', equipment.lastMaintenanceDate ? formatDate(equipment.lastMaintenanceDate) : null, EQUIPMENT_ICONS.maintenance.last)}
            {renderInfoRow('الصيانة القادمة', equipment.nextMaintenanceDate ? formatDate(equipment.nextMaintenanceDate) : null, EQUIPMENT_ICONS.maintenance.next)}
            {renderInfoRow('فترة الصيانة', equipment.maintenanceInterval ? `${equipment.maintenanceInterval} يوم` : null, EQUIPMENT_ICONS.maintenance.interval)}

          <Button
            mode="contained"
              onPress={() => setShowDatePicker(true)}
              style={[styles.maintenanceButton, { backgroundColor: theme.colors.primary.base }]}
          >
              <Text style={{ color: '#FFFFFF' }}>
                {showDatePicker ? EQUIPMENT_ICONS.maintenance.cancel : EQUIPMENT_ICONS.maintenance.record}
              </Text>
          </Button>

            {showDatePicker && (
              <View style={styles.maintenanceForm}>
              <TextInput
                style={styles.textInput}
                  placeholder="ملاحظات الصيانة"
                  value={maintenanceFormData.notes}
                  onChangeText={(value) => setMaintenanceFormData(prev => ({ ...prev, notes: value }))}
                multiline
              />
              <TextInput
                style={styles.textInput}
                  placeholder="تكلفة الصيانة"
                  value={maintenanceFormData.cost}
                  onChangeText={(value) => setMaintenanceFormData(prev => ({ ...prev, cost: value }))}
                keyboardType="numeric"
              />
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>الصيانة القادمة: {formatDate(maintenanceFormData.nextMaintenanceDate)}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={maintenanceFormData.nextMaintenanceDate}
                    mode="date"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) {
                        setMaintenanceFormData(prev => ({ ...prev, nextMaintenanceDate: date }));
                      }
                    }}
                  />
                )}
              <Button
                mode="contained"
                  onPress={handleMaintenanceSubmit}
                  loading={isLoading}
                  disabled={!maintenanceFormData.notes || !maintenanceFormData.cost}
                style={styles.submitButton}
              >
                  {EQUIPMENT_ICONS.maintenance.save} حفظ الصيانة
              </Button>
            </View>
          )}
          </>)}

          {renderSection('معلومات التشغيل', EQUIPMENT_ICONS.operation.location, <>
            {renderInfoRow('الموقع', equipment.location, EQUIPMENT_ICONS.operation.location)}
            {renderInfoRow('المشغل المعين', equipment.assignedOperator, EQUIPMENT_ICONS.operation.operator)}
            {renderInfoRow('ساعات التشغيل', equipment.operatingHours ? `${equipment.operatingHours} ساعة` : null, EQUIPMENT_ICONS.operation.hours)}
            {renderInfoRow('آخر تشغيل', equipment.lastOperationDate ? formatDate(equipment.lastOperationDate) : null, EQUIPMENT_ICONS.operation.lastOperation)}
          </>)}

          {(equipment.notes || equipment.operatingInstructions || equipment.safetyGuidelines) && 
            renderSection('معلومات إضافية', EQUIPMENT_ICONS.notes, <>
              {renderInfoRow('ملاحظات', equipment.notes, EQUIPMENT_ICONS.notes)}
              {renderInfoRow('تعليمات التشغيل', equipment.operatingInstructions, EQUIPMENT_ICONS.notes)}
              {renderInfoRow('إرشادات السلامة', equipment.safetyGuidelines, EQUIPMENT_ICONS.notes)}
            </>)
          }

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('AddEquipment', { equipmentId })}
              style={[styles.editButton, { backgroundColor: theme.colors.primary.base }]}
            >
              <Text style={{ color: '#FFFFFF' }}>
                {EQUIPMENT_ICONS.actions.edit} تعديل
              </Text>
            </Button>
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={[styles.deleteButton, { borderColor: theme.colors.error }]}
            >
              <Text style={{ color: theme.colors.error }}>
                {EQUIPMENT_ICONS.actions.delete} حذف
              </Text>
            </Button>
          </View>
        </View>
    </ScrollView>
    </SafeAreaView>
  );
};

export default EquipmentDetailScreen;