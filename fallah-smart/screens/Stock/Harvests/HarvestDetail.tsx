import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  I18nManager,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useHarvest } from '../../../context/HarvestContext';
import { StockHarvest } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { HARVEST_TYPES, QUALITY_TYPES, UNIT_TYPES, HARVEST_CATEGORIES } from './constants';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Field icons for different sections
const FIELD_ICONS = {
  quantity: '📦',
  minQuantityAlert: '⚠️',
  price: '💰',
  harvestDate: '📅',
  expiryDate: '⏳',
  storageLocation: '📍',
  batchNumber: '🔢',
  storageConditions: '🌡️',
  quality: '🔍',
  moisture: '💧',
  certifications: '🏅',
  notes: '📝',
};

// Create type-safe helper functions to avoid TypeScript errors
// and ensure consistent behavior with HarvestList.tsx
const getTypeIcon = (type: string): string => {
  // For vegetables
  if (type === 'vegetable' || type === 'خضروات') return '🥕';
  if (type === 'tomato' || type === 'طماطم') return '🍅';
  if (type === 'cucumber' || type === 'خيار') return '🥒';
  if (type === 'potato' || type === 'بطاطا') return '🥔';
  if (type === 'carrot' || type === 'جزر') return '🥕';
  if (type === 'onion' || type === 'بصل') return '🧅';
  if (type === 'garlic' || type === 'ثوم') return '🧄';
  if (type === 'lettuce' || type === 'خس') return '🥬';
  if (type === 'pepper' || type === 'فلفل') return '🌶️';
  if (type === 'eggplant' || type === 'باذنجان') return '🍆';
  if (type === 'broccoli' || type === 'بروكلي') return '🥦';
  if (type === 'corn' || type === 'ذرة') return '🌽';
  
  // For fruits
  if (type === 'fruit' || type === 'فواكه') return '🍎';
  if (type === 'apple' || type === 'تفاح') return '🍎';
  if (type === 'orange' || type === 'برتقال') return '🍊';
  if (type === 'banana' || type === 'موز') return '🍌';
  if (type === 'grape' || type === 'عنب') return '🍇';
  if (type === 'watermelon' || type === 'بطيخ') return '🍉';
  if (type === 'strawberry' || type === 'فراولة') return '🍓';
  if (type === 'pear' || type === 'كمثرى') return '🍐';
  if (type === 'peach' || type === 'خوخ') return '🍑';
  
  // For grains
  if (type === 'grain' || type === 'حبوب') return '🌾';
  if (type === 'wheat' || type === 'قمح') return '🌾';
  if (type === 'rice' || type === 'أرز') return '🍚';
  
  // For herbs
  if (type === 'herb' || type === 'أعشاب') return '🌿';
  if (type === 'mint' || type === 'نعناع') return '🌿';
  if (type === 'parsley' || type === 'بقدونس') return '🌿';
  if (type === 'coriander' || type === 'كزبرة') return '🌿';
  
  // Other
  if (type === 'other' || type === 'أخرى') return '🧺';
  
  // Default fallback
  return '🌱';
};

const getTypeName = (type: string): string => {
  // For vegetables
  if (type === 'vegetable') return 'خضروات';
  if (type === 'tomato') return 'طماطم';
  if (type === 'cucumber') return 'خيار';
  if (type === 'potato') return 'بطاطا';
  if (type === 'carrot') return 'جزر';
  if (type === 'onion') return 'بصل';
  if (type === 'garlic') return 'ثوم';
  if (type === 'lettuce') return 'خس';
  if (type === 'pepper') return 'فلفل';
  if (type === 'eggplant') return 'باذنجان';
  if (type === 'broccoli') return 'بروكلي';
  if (type === 'corn') return 'ذرة';
  
  // For fruits
  if (type === 'fruit') return 'فواكه';
  if (type === 'apple') return 'تفاح';
  if (type === 'orange') return 'برتقال';
  if (type === 'banana') return 'موز';
  if (type === 'grape') return 'عنب';
  if (type === 'watermelon') return 'بطيخ';
  if (type === 'strawberry') return 'فراولة';
  if (type === 'pear') return 'كمثرى';
  if (type === 'peach') return 'خوخ';
  
  // For grains
  if (type === 'grain') return 'حبوب';
  if (type === 'wheat') return 'قمح';
  if (type === 'rice') return 'أرز';
  
  // For herbs
  if (type === 'herb') return 'أعشاب';
  if (type === 'mint') return 'نعناع';
  if (type === 'parsley') return 'بقدونس';
  if (type === 'coriander') return 'كزبرة';
  
  // Other
  if (type === 'other') return 'أخرى';
  
  // Default - return the type itself
  return type;
};

type HarvestDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'HarvestDetail'>;
  route: RouteProp<StockStackParamList, 'HarvestDetail'>;
};

// Add QuantityModal component before the HarvestDetailScreen component
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
              placeholder={`الكمية (${getUnitAbbreviation(unit)})`}
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

const HarvestDetailScreen: React.FC<HarvestDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [harvestItem, setHarvestItem] = useState<StockHarvest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [quantityLoading, setQuantityLoading] = useState(false);

  useEffect(() => {
    fetchHarvestDetail();
  }, [route.params.harvestId]);

  const fetchHarvestDetail = async () => {
    try {
      setLoading(true);
      
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/harvest/${route.params.harvestId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        }
      );
      
      setHarvestItem(response.data);
    } catch (error) {
      console.error('Error fetching harvest detail:', error);
      setError('فشل في تحميل تفاصيل المحصول');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(async () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا المحصول؟',
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
              const tokens = await storage.getTokens();
              
              if (!tokens?.access) {
                Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
                return;
              }

              await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/stock/harvest/${route.params.harvestId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${tokens.access}`
                  }
                }
              );
              
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting harvest:', error);
              Alert.alert('خطأ', 'فشل في حذف المحصول');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [navigation, route.params.harvestId]);

  // Replace the getTypeEmoji function with our new simpler version
  const getTypeEmoji = (item: StockHarvest | null): string => {
    if (!item || !item.type) return '🌱';
    return getTypeIcon(item.type);
  };

  // Fix the quality info handling to avoid dynamic access
  const getQualityInfo = (quality: string | undefined) => {
    if (!quality) return { icon: '⭐', name: 'قياسي' };
    
    // Direct mapping instead of dynamic access
    switch (quality) {
      case 'premium': return { icon: '⭐⭐⭐', name: 'ممتاز' };
      case 'standard': return { icon: '⭐⭐', name: 'قياسي' };
      case 'economy': case 'secondary': return { icon: '⭐', name: 'اقتصادي' };
      default: return { icon: '⭐', name: quality };
    }
  };

  // Get unit abbreviation safely without dynamic property access
  const getUnitAbbreviation = (unit: string): string => {
    switch(unit) {
      case 'kg': return 'كغ';
      case 'g': return 'غ';
      case 'ton': return 'طن';
      case 'box': return 'صندوق';
      case 'piece': return 'قطعة';
      case 'bunch': return 'حزمة';
      default: return unit;
    }
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

  // Replace the type name function with our new version
  const getTypeNameFromItem = (item: StockHarvest | null): string => {
    if (!item || !item.type) return '';
    return getTypeName(item.type);
  };

  // Add quantity change handler method
  const handleQuantityChange = async (type: 'add' | 'remove', quantity: number, notes?: string) => {
    if (!harvestItem) return;
    
    try {
      setQuantityLoading(true);
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
        return;
      }
      
      const updatedQuantity = type === 'add' 
        ? harvestItem.quantity + quantity
        : Math.max(0, harvestItem.quantity - quantity);
      
      const response = await axios.patch(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/harvest/${route.params.harvestId}`,
        {
          quantity: updatedQuantity,
          notes: notes ? `${type === 'add' ? 'إضافة' : 'سحب'} ${quantity} ${getUnitAbbreviation(harvestItem.unit)}. ${notes}` : undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        setHarvestItem(response.data);
        
        if (type === 'add') {
          setShowAddModal(false);
        } else {
          setShowRemoveModal(false);
        }
        
        Alert.alert(
          'نجاح',
          `تم ${type === 'add' ? 'إضافة' : 'سحب'} ${quantity} ${getUnitAbbreviation(harvestItem.unit)} بنجاح`
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

  if (error || !harvestItem) {
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
              {error || 'لم يتم العثور على المحصول'}
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

  const isLowStock = harvestItem.minQuantityAlert !== undefined && 
    harvestItem.minQuantityAlert > 0 && 
    harvestItem.quantity <= harvestItem.minQuantityAlert;

  const isExpired = harvestItem.expiryDate && new Date(harvestItem.expiryDate) <= new Date();
  const qualityInfo = getQualityInfo(harvestItem.quality);

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
                backgroundColor: isLowStock 
                  ? theme.colors.warning + '20'
                  : isExpired
                    ? theme.colors.error + '20'
                    : theme.colors.success + '20'
              }
            ]}>
              <Text style={styles.harvestIcon}>{getTypeEmoji(harvestItem)}</Text>
              {isLowStock && <Text style={styles.statusIndicator}>⚠️</Text>}
              {isExpired && <Text style={styles.statusIndicator}>❗</Text>}
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
                {harvestItem.cropName}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>
                    {getTypeNameFromItem(harvestItem)}
                  </Text>
                </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                {harvestItem.quantity}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                {getUnitAbbreviation(harvestItem.unit)}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                {harvestItem.price}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                د.أ
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <View style={[
                styles.qualityIndicator,
                    { 
                      backgroundColor: (() => {
                        switch (harvestItem.quality) {
                      case 'premium': return theme.colors.success;
                      case 'standard': return theme.colors.info;
                      case 'economy': case 'secondary': return theme.colors.warning;
                      default: return theme.colors.neutral.border;
                        }
                      })()
                    }
              ]}>
                <Text style={styles.qualityIcon}>
                  {qualityInfo.icon}
                  </Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                {qualityInfo.name}
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
              disabled={harvestItem.quantity <= 0}
            >
              <Text style={styles.quantityButtonIcon}>➖</Text>
              <Text style={styles.quantityButtonText}>سحب من المخزون</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={() => navigation.navigate('AddHarvest', { harvestId: harvestItem?.id })}
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
          {renderField('الكمية', `${harvestItem.quantity} ${getUnitAbbreviation(harvestItem.unit)}`, FIELD_ICONS.quantity)}
          {renderField('السعر', `${harvestItem.price} د.أ`, FIELD_ICONS.price)}
          {renderField('تاريخ الحصاد', new Date(harvestItem.harvestDate).toLocaleDateString('ar-SA'), FIELD_ICONS.harvestDate)}
          {harvestItem.minQuantityAlert && renderField('الحد الأدنى للتنبيه', `${harvestItem.minQuantityAlert} ${getUnitAbbreviation(harvestItem.unit)}`, FIELD_ICONS.minQuantityAlert)}
          
          {harvestItem.storageLocation && renderField('موقع التخزين', harvestItem.storageLocation, FIELD_ICONS.storageLocation)}
          {harvestItem.batchNumber && renderField('رقم الدفعة', harvestItem.batchNumber, FIELD_ICONS.batchNumber)}
          {harvestItem.expiryDate && renderField('تاريخ انتهاء الصلاحية', new Date(harvestItem.expiryDate).toLocaleDateString('ar-SA'), FIELD_ICONS.expiryDate)}
          {harvestItem.storageConditions && renderField('ظروف التخزين', harvestItem.storageConditions, FIELD_ICONS.storageConditions)}
          
          {harvestItem.quality && renderField('الجودة', qualityInfo.name, FIELD_ICONS.quality)}
          {harvestItem.moisture && harvestItem.moisture > 0 && renderField('نسبة الرطوبة', `${harvestItem.moisture}%`, FIELD_ICONS.moisture)}
          {harvestItem.certifications && renderField('الشهادات', harvestItem.certifications, FIELD_ICONS.certifications)}
          
          {harvestItem.notes && renderField('ملاحظات', harvestItem.notes, FIELD_ICONS.notes)}
        </View>
      </ScrollView>

      <QuantityModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={(quantity, notes) => handleQuantityChange('add', quantity, notes)}
        type="add"
        currentQuantity={harvestItem.quantity}
        unit={harvestItem.unit}
        loading={quantityLoading}
      />

      <QuantityModal
        visible={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={(quantity, notes) => handleQuantityChange('remove', quantity, notes)}
        type="remove"
        currentQuantity={harvestItem.quantity}
        unit={harvestItem.unit}
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
  harvestIcon: {
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
  qualityIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityIcon: {
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

export default HarvestDetailScreen; 