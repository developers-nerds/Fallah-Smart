import React, { useEffect, useState, useCallback } from 'react';
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
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useFertilizer } from '../../../context/FertilizerContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { FERTILIZER_TYPES, FERTILIZER_CATEGORIES, FertilizerType } from './constants';
import type { Fertilizer } from '../../../types/fertilizer';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import axios from 'axios';
import { storage } from '../../../utils/storage';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Direct API URL for testing
const DIRECT_API_URL = `${process.env.EXPO_PUBLIC_API_URL}/stock/fertilizer`;

// Add these constants at the top of the file after imports
const FERTILIZER_ICONS = {
  organic: '🌱',
  chemical: '🧪',
  liquid: '💧',
  solid: '🧱',
  granular: '🌰',
  powder: '☁️',
  npk: '🔬',
  urea: '⚗️',
};

// Field icons for different sections
const FIELD_ICONS = {
  quantity: '📦',
  minQuantityAlert: '⚠️',
  price: '💰',
  expiryDate: '📅',
  npkRatio: '🧪',
  applicationRate: '⚖️',
  supplier: '🏭',
  safetyGuidelines: '🛡️',
  notes: '📝',
};

type FertilizerDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'FertilizerDetail'>;
  route: RouteProp<StockStackParamList, 'FertilizerDetail'>;
};

// Add the QuantityModal component before the FertilizerDetailScreen
const QuantityModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  type,
  currentQuantity,
  unit,
  loading
}: { 
  visible: boolean; 
  onClose: () => void; 
  onConfirm: (quantity: number, notes?: string) => Promise<void>;
  type: 'add' | 'remove';
  currentQuantity: number;
  unit: string;
  loading: boolean;
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
              placeholder={`الكمية (${unit})`}
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

const FertilizerDetailScreen: React.FC<FertilizerDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { fertilizers: contextFertilizers, deleteFertilizer: contextDeleteFertilizer } = useFertilizer();
  const [fertilizer, setFertilizer] = useState<Fertilizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [quantityLoading, setQuantityLoading] = useState(false);

  // Fetch fertilizer details directly from API
  const fetchFertilizerDirectly = async () => {
    try {
      const tokens = await storage.getTokens();
      console.log('Fetching fertilizer details for ID:', route.params.fertilizerId);
      
      const response = await axios.get(`${DIRECT_API_URL}/${route.params.fertilizerId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
        },
        timeout: 10000
      });
      
      console.log('Fertilizer details fetched successfully');
      return response.data;
    } catch (error) {
      console.error('Error fetching fertilizer details:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Try without token as fallback
          try {
            const fallbackResponse = await axios.get(`${DIRECT_API_URL}/${route.params.fertilizerId}`, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000
            });
            return fallbackResponse.data;
          } catch (fallbackError) {
            console.error('Fallback fetch also failed:', fallbackError);
            throw fallbackError;
          }
        }
      }
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadFertilizerDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try direct API first
        const fertilizerData = await fetchFertilizerDirectly();
        
        if (isMounted) {
          setFertilizer(fertilizerData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading fertilizer details:', err);
        
        // Fallback to context
        try {
          const contextFertilizer = contextFertilizers.find(f => f.id === route.params.fertilizerId);
          if (contextFertilizer && isMounted) {
            setFertilizer(contextFertilizer);
          } else {
            setError('Fertilizer not found');
          }
        } catch (contextErr) {
          if (isMounted) {
            setError('Failed to load fertilizer details');
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    loadFertilizerDetails();

    return () => {
      isMounted = false;
    };
  }, [route.params.fertilizerId, contextFertilizers]);

  const handleDelete = useCallback(async () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا السماد؟',
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
              setIsDeleting(true);
              // Try direct API delete first
              try {
                const tokens = await storage.getTokens();
                await axios.delete(`${DIRECT_API_URL}/${route.params.fertilizerId}`, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
                  }
                });
                console.log('Fertilizer deleted successfully via direct API');
              } catch (directError) {
                console.error('Direct delete failed, falling back to context:', directError);
                await contextDeleteFertilizer(route.params.fertilizerId);
                console.log('Fertilizer deleted successfully via context');
              }
              
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting fertilizer:', error);
              Alert.alert('خطأ', 'فشل في حذف السماد');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [navigation, route.params.fertilizerId, contextDeleteFertilizer]);

  const getFertilizerTypeInfo = (type: string) => {
    return (
      FERTILIZER_TYPES[type as keyof typeof FERTILIZER_TYPES] ||
      Object.values(FERTILIZER_TYPES).find(fert => fert.name === type) ||
      { icon: '🧪', name: 'سماد', category: 'chemical' }
    );
  };

  const isLowStock = (fertilizer: Fertilizer): boolean => {
    return fertilizer.quantity <= (fertilizer.minQuantityAlert || 0);
  };

  const isNearExpiry = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const renderField = useCallback((label: string, value: string | number | undefined | null, icon: string) => {
    if (!value) return null;
    
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
          {value}
        </Text>
      </Animated.View>
    );
  }, [theme.colors.neutral]);

  // Add quantity change handler method
  const handleQuantityChange = async (type: 'add' | 'remove', quantity: number, notes?: string) => {
    if (!fertilizer) return;
    
    try {
      setQuantityLoading(true);
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
        return;
      }
      
      const updatedQuantity = type === 'add' 
        ? fertilizer.quantity + quantity
        : Math.max(0, fertilizer.quantity - quantity);
      
      const response = await axios.patch(
        `${DIRECT_API_URL}/${fertilizer.id}`,
        {
          quantity: updatedQuantity,
          notes: notes ? `${type === 'add' ? 'إضافة' : 'سحب'} ${quantity} ${fertilizer.unit}. ${notes}` : undefined
        },
        {
          headers: {
            'Authorization': tokens?.access ? `Bearer ${tokens.access}` : '',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        setFertilizer(response.data);
        
        if (type === 'add') {
          setShowAddModal(false);
        } else {
          setShowRemoveModal(false);
        }
        
        Alert.alert(
          'نجاح',
          `تم ${type === 'add' ? 'إضافة' : 'سحب'} ${quantity} ${fertilizer.unit} بنجاح`
        );
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('خطأ', `فشل في ${type === 'add' ? 'إضافة' : 'سحب'} الكمية`);
    } finally {
      setQuantityLoading(false);
    }
  };

  if (loading || isDeleting) {
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

  if (error || !fertilizer) {
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
              {error || 'لم يتم العثور على السماد'}
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

  const fertilizerType = getFertilizerTypeInfo(fertilizer.type);
  const lowStock = isLowStock(fertilizer);
  const nearExpiry = isNearExpiry(fertilizer.expiryDate);
  const expired = isExpired(fertilizer.expiryDate);
  
  const fertilizerTypeIcon = FERTILIZER_ICONS[fertilizerType.category as keyof typeof FERTILIZER_ICONS] || '🧪';

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
              backgroundColor: expired 
                ? theme.colors.error + '20'
                : lowStock
                  ? theme.colors.warning + '20'
                  : nearExpiry
                    ? theme.colors.info + '20'
                      : theme.colors.success + '20'
              }
            ]}>
              <Text style={styles.fertilizerIcon}>{fertilizerTypeIcon}</Text>
              {lowStock && <Text style={styles.statusIndicator}>⚠️</Text>}
              {expired && <Text style={styles.statusIndicator}>❗</Text>}
              {nearExpiry && !expired && !lowStock && <Text style={styles.statusIndicator}>⌛</Text>}
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
              {fertilizer.name}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>
                {fertilizerType.name}
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                {fertilizer.quantity}
                </Text>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                {fertilizer.unit}
                </Text>
              </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                {fertilizer.price}
                </Text>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                د.أ
                </Text>
            </View>

            <View style={[styles.statCard, { 
              backgroundColor: theme.colors.neutral.background
            }]}>
              <View style={[
                styles.statusIndicatorContainer,
                { 
                  backgroundColor: expired 
                    ? theme.colors.error 
                    : lowStock
                      ? theme.colors.warning
                    : nearExpiry 
                        ? theme.colors.info
                        : theme.colors.success 
                }
              ]}>
                <Text style={styles.statusIcon}>
                  {expired ? '⏱️' : lowStock ? '📉' : nearExpiry ? '⌛' : '✅'}
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                {expired ? 'منتهي الصلاحية' : lowStock ? 'مخزون منخفض' : nearExpiry ? 'قريب الانتهاء' : 'حالة جيدة'}
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
              disabled={fertilizer.quantity <= 0}
            >
              <Text style={styles.quantityButtonIcon}>➖</Text>
              <Text style={styles.quantityButtonText}>سحب من المخزون</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={() => navigation.navigate('AddFertilizer', { fertilizerId: fertilizer.id })}
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
          {renderField('الكمية', `${fertilizer.quantity} ${fertilizer.unit}`, FIELD_ICONS.quantity)}
          {renderField('الحد الأدنى للتنبيه', `${fertilizer.minQuantityAlert} ${fertilizer.unit}`, FIELD_ICONS.minQuantityAlert)}
          {renderField('السعر', `${fertilizer.price} د.أ`, FIELD_ICONS.price)}
          {renderField('تاريخ الصلاحية', new Date(fertilizer.expiryDate).toLocaleDateString('ar-EG'), FIELD_ICONS.expiryDate)}
          
          {fertilizer.npkRatio && renderField('نسبة NPK', fertilizer.npkRatio, FIELD_ICONS.npkRatio)}
          {fertilizer.applicationRate && renderField('معدل الاستخدام', fertilizer.applicationRate, FIELD_ICONS.applicationRate)}
          {fertilizer.supplier && renderField('المورد', fertilizer.supplier, FIELD_ICONS.supplier)}
          
          {fertilizer.safetyGuidelines && renderField('تعليمات السلامة', fertilizer.safetyGuidelines, FIELD_ICONS.safetyGuidelines)}
          {fertilizer.notes && renderField('ملاحظات', fertilizer.notes, FIELD_ICONS.notes)}
        </View>
      </ScrollView>

      <QuantityModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={(quantity, notes) => handleQuantityChange('add', quantity, notes)}
        type="add"
        currentQuantity={fertilizer.quantity}
        unit={fertilizer.unit}
        loading={quantityLoading}
      />

      <QuantityModal
        visible={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={(quantity, notes) => handleQuantityChange('remove', quantity, notes)}
        type="remove"
        currentQuantity={fertilizer.quantity}
        unit={fertilizer.unit}
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
  fertilizerIcon: {
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
  statusIndicatorContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 24,
    color: '#FFF',
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

export default FertilizerDetailScreen; 