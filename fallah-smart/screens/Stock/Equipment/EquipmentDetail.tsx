import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, Alert, ActivityIndicator, Platform, StatusBar, I18nManager } from 'react-native';
import { useRoute, useNavigation, useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEquipment } from '../../../context/EquipmentContext';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUS, OPERATIONAL_STATUS, FUEL_TYPES, EquipmentStatus, EquipmentType, OperationalStatus, FuelType } from './constants';
import { formatDate } from '../../../utils/date';
import { Button, IconButton, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { StockEquipment } from '../../Stock/types';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import DateTimePicker from '@react-native-community/datetimepicker';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export const EquipmentDetail = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { equipment, loading: contextLoading, error: contextError, updateEquipment, deleteEquipment, recordMaintenance, updateStatus, fetchEquipment } = useEquipment();

  const equipmentId = route.params?.equipmentId;
  const [equipmentItem, setEquipmentItem] = useState<StockEquipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [maintenanceData, setMaintenanceData] = useState({
    notes: '',
    cost: '',
    nextMaintenanceDate: new Date(),
  });

  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);

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
        setLoading(true);
        setError(null);
        
        // Try direct API call first
        const equipmentData = await fetchEquipmentDirectly();
        
        if (isMounted && equipmentData) {
          console.log('Equipment details fetched successfully, updating UI');
          setEquipmentItem(equipmentData);
        } else {
          // If direct API fails, try to get from context
          const contextEquipment = equipment.find(item => item.id === equipmentId);
          if (contextEquipment) {
            setEquipmentItem(contextEquipment);
          } else {
            // If not found in context, refresh the context
            await fetchEquipment();
            const refreshedEquipment = equipment.find(item => item.id === equipmentId);
            if (refreshedEquipment) {
              setEquipmentItem(refreshedEquipment);
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
          const contextEquipment = equipment.find(item => item.id === equipmentId);
          if (contextEquipment) {
            setEquipmentItem(contextEquipment);
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
          setLoading(false);
        }
      }
    };
    
    loadEquipmentDetails();
    
    return () => {
      console.log('EquipmentDetail unmounting - cleaning up');
      isMounted = false;
    };
  }, [equipmentId, fetchEquipmentDirectly, equipment, fetchEquipment]);

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
      setLoading(true);
      
      // Try direct API update
      try {
        const tokens = await storage.getTokens();
        const DIRECT_API_URL = `${process.env.EXPO_PUBLIC_API_URL}/stock/equipment/${equipmentId}/status`;
        
        const response = await axios.patch(DIRECT_API_URL, 
          { status: newStatus },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
            }
          }
        );
        
        console.log('Status updated successfully via direct API');
        setEquipmentItem(response.data);
      } catch (directError) {
        console.error('Direct status update failed, falling back to context:', directError);
        // Fall back to context update
      await updateStatus(equipmentId, newStatus);
        // Refresh equipment item from context
        const updatedEquipment = equipment.find(item => item.id === equipmentId);
        if (updatedEquipment) {
          setEquipmentItem(updatedEquipment);
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      Alert.alert('خطأ', 'فشل في تحديث حالة المعدة');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordMaintenance = async () => {
    try {
      setMaintenanceLoading(true);
      setMaintenanceError(null);

      // Try direct API maintenance record
      try {
        const tokens = await storage.getTokens();
        const DIRECT_API_URL = `${process.env.EXPO_PUBLIC_API_URL}/stock/equipment/${equipmentId}/maintenance`;
        
        const response = await axios.post(DIRECT_API_URL, 
          {
            maintenanceNotes: maintenanceData.notes,
            cost: parseFloat(maintenanceData.cost),
            nextMaintenanceDate: maintenanceData.nextMaintenanceDate
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
            }
          }
        );
        
        console.log('Maintenance recorded successfully via direct API');
        setEquipmentItem(response.data);
      } catch (directError) {
        console.error('Direct maintenance record failed, falling back to context:', directError);
        // Fall back to context method
      await recordMaintenance(equipmentId, {
          maintenanceNotes: maintenanceData.notes,
        cost: parseFloat(maintenanceData.cost),
          nextMaintenanceDate: maintenanceData.nextMaintenanceDate,
        });
        
        // Refresh equipment item from context
        const updatedEquipment = equipment.find(item => item.id === equipmentId);
        if (updatedEquipment) {
          setEquipmentItem(updatedEquipment);
        }
      }

      setShowMaintenanceForm(false);
      setMaintenanceData({
        notes: '',
        cost: '',
        nextMaintenanceDate: new Date(),
      });
      
      Alert.alert('نجاح', 'تم تسجيل الصيانة بنجاح');
    } catch (err) {
      console.error('Error recording maintenance:', err);
      setMaintenanceError(t('equipment.maintenanceError'));
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setMaintenanceData(prev => ({ ...prev, nextMaintenanceDate: selectedDate }));
    }
  };

  // Custom DatePicker component
  const CustomDatePicker = ({ label, value, onChange }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Button
        mode="outlined"
        onPress={() => setShowDatePicker(true)}
        style={styles.datePickerButton}
      >
        {value ? formatDate(value) : 'اختر تاريخ'}
      </Button>
      
      {showDatePicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          backgroundColor={theme.colors.background}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.loadingContainer}
          >
            <Text style={styles.loadingIcon}>⚙️</Text>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>
              جاري تحميل تفاصيل المعدة...
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !equipmentItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          backgroundColor={theme.colors.background}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.errorContainer}
          >
            <Text style={styles.notFoundIcon}>🔍</Text>
            <Text style={styles.notFoundText}>
              {error || 'لم يتم العثور على المعدة'}
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              العودة
            </Button>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const equipmentType = EQUIPMENT_TYPES[equipmentItem.type as EquipmentType] || { icon: '🔧', name: 'معدة' };
  const statusInfo = EQUIPMENT_STATUS[equipmentItem.status as EquipmentStatus] || { icon: '❓', name: equipmentItem.status, color: '#9E9E9E' };
  const operationalInfo = OPERATIONAL_STATUS[equipmentItem.operationalStatus as OperationalStatus] || { icon: '❓', name: equipmentItem.operationalStatus, color: '#9E9E9E' };
  const fuelInfo = equipmentItem.fuelType ? (FUEL_TYPES[equipmentItem.fuelType as FuelType] || { icon: '⛽', name: equipmentItem.fuelType }) : null;

  const needsMaintenance = equipmentItem.nextMaintenanceDate && new Date(equipmentItem.nextMaintenanceDate) <= new Date();
  const isInMaintenance = equipmentItem.status === 'maintenance';
  const isBroken = equipmentItem.status === 'broken';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle="dark-content"
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View 
          entering={FadeInDown.springify()}
          style={styles.header}
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
            {needsMaintenance && <Text style={styles.statusIndicator}>⚠️</Text>}
            {isBroken && <Text style={styles.statusIndicator}>❌</Text>}
          </View>
          
          <View style={styles.headerInfo}>
          <Text style={styles.title}>{equipmentItem.name}</Text>
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
          <Animated.View 
            entering={FadeInDown.delay(100).springify()}
            style={styles.section}
          >
          <Text style={styles.sectionTitle}>{t('equipment.basicInfo')}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('equipment.type')}:</Text>
              <Text>{equipmentType.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('equipment.quantity')}:</Text>
            <Text>{equipmentItem.quantity}</Text>
          </View>

            {equipmentItem.serialNumber && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>{t('equipment.serialNumber')}:</Text>
                <Text>{equipmentItem.serialNumber}</Text>
              </View>
            )}

            {equipmentItem.model && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>{t('equipment.model')}:</Text>
                <Text>{equipmentItem.model}</Text>
              </View>
            )}

            {equipmentItem.manufacturer && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>{t('equipment.manufacturer')}:</Text>
                <Text>{equipmentItem.manufacturer}</Text>
              </View>
            )}

            {equipmentItem.yearOfManufacture && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>{t('equipment.yearOfManufacture')}:</Text>
                <Text>{equipmentItem.yearOfManufacture}</Text>
              </View>
            )}
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(200).springify()}
            style={styles.section}
          >
          <Text style={styles.sectionTitle}>{t('equipment.purchaseInfo')}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('equipment.purchaseDate')}:</Text>
            <Text>{formatDate(equipmentItem.purchaseDate)}</Text>
          </View>

          {equipmentItem.warrantyExpiryDate && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.warrantyExpiry')}:</Text>
              <Text>{formatDate(equipmentItem.warrantyExpiryDate)}</Text>
            </View>
          )}

          {equipmentItem.purchasePrice && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.purchasePrice')}:</Text>
                <Text>{equipmentItem.purchasePrice} د.ج</Text>
            </View>
          )}
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(300).springify()}
            style={styles.section}
          >
          <Text style={styles.sectionTitle}>{t('equipment.technicalInfo')}</Text>

          {equipmentItem.fuelType && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.fuelType')}:</Text>
                <Text>{fuelInfo?.name}</Text>
            </View>
          )}

          {equipmentItem.fuelCapacity && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.fuelCapacity')}:</Text>
                <Text>{equipmentItem.fuelCapacity} لتر</Text>
            </View>
          )}

          {equipmentItem.powerOutput && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.powerOutput')}:</Text>
              <Text>{equipmentItem.powerOutput}</Text>
            </View>
          )}

          {equipmentItem.dimensions && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.dimensions')}:</Text>
              <Text>{equipmentItem.dimensions}</Text>
            </View>
          )}

          {equipmentItem.weight && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.weight')}:</Text>
                <Text>{equipmentItem.weight} كغ</Text>
            </View>
          )}
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(400).springify()}
            style={styles.section}
          >
          <Text style={styles.sectionTitle}>{t('equipment.maintenanceInfo')}</Text>
          
          {equipmentItem.lastMaintenanceDate && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.lastMaintenance')}:</Text>
              <Text>{formatDate(equipmentItem.lastMaintenanceDate)}</Text>
            </View>
          )}

          {equipmentItem.nextMaintenanceDate && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.nextMaintenance')}:</Text>
                <Text style={needsMaintenance ? styles.alertText : null}>
                  {formatDate(equipmentItem.nextMaintenanceDate)}
                  {needsMaintenance && ' (مطلوب الصيانة)'}
                </Text>
            </View>
          )}

          {equipmentItem.maintenanceInterval && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.maintenanceInterval')}:</Text>
              <Text>{equipmentItem.maintenanceInterval} {t('common.days')}</Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={() => setShowMaintenanceForm(!showMaintenanceForm)}
            style={styles.maintenanceButton}
          >
            {showMaintenanceForm ? t('common.cancel') : t('equipment.recordMaintenance')}
          </Button>

          {showMaintenanceForm && (
              <Animated.View 
                entering={FadeInDown.springify()}
                style={styles.maintenanceForm}
              >
              <TextInput
                style={styles.textInput}
                placeholder={t('equipment.maintenanceNotes')}
                value={maintenanceData.notes}
                onChangeText={(value) => setMaintenanceData(prev => ({ ...prev, notes: value }))}
                multiline
                numberOfLines={3}
              />

              <TextInput
                style={styles.textInput}
                placeholder={t('equipment.maintenanceCost')}
                value={maintenanceData.cost}
                onChangeText={(value) => setMaintenanceData(prev => ({ ...prev, cost: value }))}
                keyboardType="numeric"
              />

              <CustomDatePicker
                label={t('equipment.nextMaintenance')}
                value={maintenanceData.nextMaintenanceDate}
                onChange={(value) => setMaintenanceData(prev => ({ ...prev, nextMaintenanceDate: value }))}
              />

              {maintenanceError && (
                  <Text style={styles.error}>{maintenanceError}</Text>
              )}

              <Button
                mode="contained"
                onPress={handleRecordMaintenance}
                loading={maintenanceLoading}
                disabled={!maintenanceData.notes || !maintenanceData.cost}
                style={styles.submitButton}
              >
                {t('common.save')}
              </Button>
              </Animated.View>
            )}
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(500).springify()}
            style={styles.section}
          >
          <Text style={styles.sectionTitle}>{t('equipment.operationalInfo')}</Text>
          
          {equipmentItem.location && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.location')}:</Text>
              <Text>{equipmentItem.location}</Text>
            </View>
          )}

          {equipmentItem.assignedOperator && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.assignedOperator')}:</Text>
              <Text>{equipmentItem.assignedOperator}</Text>
            </View>
          )}

          {equipmentItem.operatingHours && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.operatingHours')}:</Text>
                <Text>{equipmentItem.operatingHours} ساعة</Text>
            </View>
          )}

          {equipmentItem.lastOperationDate && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('equipment.lastOperation')}:</Text>
              <Text>{formatDate(equipmentItem.lastOperationDate)}</Text>
            </View>
          )}
          </Animated.View>

      {(equipmentItem.notes || equipmentItem.operatingInstructions || equipmentItem.safetyGuidelines) && (
            <Animated.View 
              entering={FadeInDown.delay(600).springify()}
              style={styles.section}
            >
            <Text style={styles.sectionTitle}>{t('equipment.additionalInfo')}</Text>
            
            {equipmentItem.notes && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>{t('equipment.notes')}:</Text>
                <Text>{equipmentItem.notes}</Text>
              </View>
            )}

            {equipmentItem.operatingInstructions && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>{t('equipment.operatingInstructions')}:</Text>
                <Text>{equipmentItem.operatingInstructions}</Text>
              </View>
            )}

            {equipmentItem.safetyGuidelines && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>{t('equipment.safetyGuidelines')}:</Text>
                <Text>{equipmentItem.safetyGuidelines}</Text>
              </View>
            )}
            </Animated.View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('AddEquipment', { equipmentId })}
              style={styles.editButton}
            >
              تعديل
            </Button>
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={styles.deleteButton}
              textColor="#F44336"
            >
              حذف
            </Button>
          </View>
        </View>
    </ScrollView>
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
    backgroundColor: 'white',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
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
});

export default EquipmentDetail;