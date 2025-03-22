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
  Platform,
  I18nManager,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StockFeed } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type FeedDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'FeedDetail'>;
  route: RouteProp<StockStackParamList, 'FeedDetail'>;
};

// Feed type icons mapped to emoji
const FEED_ICONS = {
  cattle: '🐄',
  sheep: '🐑',
  poultry: '🐔',
  camel: '🐪',
  fish: '🐟',
  general: '🥗',
};

// Field icons for different sections
const FIELD_ICONS = {
  quantity: '📦',
  minQuantityAlert: '⚠️',
  dailyConsumptionRate: '📊',
  price: '💰',
  expiryDate: '📅',
  manufacturer: '🏭',
  batchNumber: '🔢',
  purchaseDate: '🛒',
  location: '📍',
  supplier: '🚚',
  nutritionalInfo: '🍽️',
  recommendedUsage: '📋',
  targetAnimals: '🦓',
  notes: '📝',
};

// Add QuantityModal component
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

const FeedDetailScreen: React.FC<FeedDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const [feedItem, setFeedItem] = useState<StockFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [quantityLoading, setQuantityLoading] = useState(false);

  const fetchFeedItem = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        setError('الرجاء تسجيل الدخول أولا');
        return;
      }
      
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/feed/${route.params.feedId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        }
      );
      
      if (response.data) {
        setFeedItem(response.data);
      }
    } catch (error) {
      console.error('Error fetching feed item:', error);
      setError('فشل في جلب بيانات العلف');
    } finally {
      setLoading(false);
    }
  }, [route.params.feedId]);

  useEffect(() => {
    fetchFeedItem();
  }, [fetchFeedItem]);

  const handleDelete = useCallback(async () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا العلف؟',
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
                `${process.env.EXPO_PUBLIC_API_URL}/stock/feed/${route.params.feedId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${tokens.access}`
                  }
                }
              );
              
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting feed:', error);
              Alert.alert('خطأ', 'فشل في حذف العلف');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [navigation, route.params.feedId]);

  const getAnimalTypeIcon = (animalType: string) => {
    switch (animalType) {
      case 'cattle':
        return FEED_ICONS.cattle;
      case 'sheep':
        return FEED_ICONS.sheep;
      case 'poultry':
        return FEED_ICONS.poultry;
      case 'camel':
        return FEED_ICONS.camel;
      case 'fish':
        return FEED_ICONS.fish;
      default:
        return FEED_ICONS.general;
    }
  };

  const getAnimalTypeInArabic = (animalType: string) => {
    switch (animalType) {
      case 'cattle':
        return 'أبقار';
      case 'sheep':
        return 'أغنام';
      case 'poultry':
        return 'دواجن';
      case 'camel':
        return 'إبل';
      case 'fish':
        return 'أسماك';
      default:
        return 'أخرى';
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

  // Add quantity change handler
  const handleQuantityChange = async (type: 'add' | 'remove', quantity: number, notes?: string) => {
    if (!feedItem) return;
    
    try {
      setQuantityLoading(true);
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
        return;
      }
      
      const updatedQuantity = type === 'add' 
        ? feedItem.quantity + quantity
        : Math.max(0, feedItem.quantity - quantity);
      
      const response = await axios.patch(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/feed/${route.params.feedId}`,
        {
          quantity: updatedQuantity,
          notes: notes ? `${type === 'add' ? 'إضافة' : 'سحب'} ${quantity} ${feedItem.unit}. ${notes}` : undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        setFeedItem(response.data);
        
        if (type === 'add') {
          setShowAddModal(false);
        } else {
          setShowRemoveModal(false);
        }
        
        Alert.alert(
          'نجاح',
          `تم ${type === 'add' ? 'إضافة' : 'سحب'} ${quantity} ${feedItem.unit} بنجاح`
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

  if (error) {
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
            {error}
            </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary.base }]}
            onPress={fetchFeedItem}
          >
            <Text style={{ color: theme.colors.neutral.surface }}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!feedItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
        <View style={[styles.container, styles.centerContent]}>
          <MaterialCommunityIcons
            name="food"
            size={48}
            color={theme.colors.neutral.textSecondary}
          />
          <Text style={[styles.errorText, { color: theme.colors.neutral.textSecondary }]}>
            لم يتم العثور على العلف
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

  const isLowStock = feedItem.minQuantityAlert && feedItem.quantity <= feedItem.minQuantityAlert;
  const isExpired = feedItem.expiryDate && new Date(feedItem.expiryDate) <= new Date();

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
              <Text style={styles.feedIcon}>{getAnimalTypeIcon(feedItem.animalType)}</Text>
              {isLowStock && <Text style={styles.statusIndicator}>⚠️</Text>}
              {isExpired && <Text style={styles.statusIndicator}>❗</Text>}
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.name}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>
                {getAnimalTypeInArabic(feedItem.animalType)}
              </Text>
            </View>
        </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.quantity}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                {feedItem.unit}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.price}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                د.أ
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.dailyConsumptionRate}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                {feedItem.unit}/يوم
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
              disabled={feedItem.quantity <= 0}
            >
              <Text style={styles.quantityButtonIcon}>➖</Text>
              <Text style={styles.quantityButtonText}>سحب من المخزون</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={() => navigation.navigate('AddFeed', { feedId: feedItem.id })}
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
          {renderField('الكمية', `${feedItem.quantity} ${feedItem.unit}`, FIELD_ICONS.quantity)}
          {renderField('الحد الأدنى للتنبيه', `${feedItem.minQuantityAlert} ${feedItem.unit}`, FIELD_ICONS.minQuantityAlert)}
          {renderField('معدل الإستهلاك اليومي', `${feedItem.dailyConsumptionRate} ${feedItem.unit}/يوم`, FIELD_ICONS.dailyConsumptionRate)}
          {renderField('السعر', `${feedItem.price} د.أ`, FIELD_ICONS.price)}
          {renderField('تاريخ الصلاحية', new Date(feedItem.expiryDate).toLocaleDateString('ar-EG'), FIELD_ICONS.expiryDate)}
          
          {feedItem.manufacturer && renderField('الشركة المصنعة', feedItem.manufacturer, FIELD_ICONS.manufacturer)}
          {feedItem.batchNumber && renderField('رقم الدفعة', feedItem.batchNumber, FIELD_ICONS.batchNumber)}
          {feedItem.purchaseDate && renderField('تاريخ الشراء', new Date(feedItem.purchaseDate).toLocaleDateString('ar-EG'), FIELD_ICONS.purchaseDate)}
          {feedItem.location && renderField('الموقع', feedItem.location, FIELD_ICONS.location)}
          {feedItem.supplier && renderField('المورد', feedItem.supplier, FIELD_ICONS.supplier)}
          
          {feedItem.nutritionalInfo && renderField('المعلومات الغذائية', feedItem.nutritionalInfo, FIELD_ICONS.nutritionalInfo)}
          {feedItem.recommendedUsage && renderField('الاستخدام الموصى به', feedItem.recommendedUsage, FIELD_ICONS.recommendedUsage)}
          {feedItem.targetAnimals && renderField('الحيوانات المستهدفة', feedItem.targetAnimals, FIELD_ICONS.targetAnimals)}
          
          {feedItem.notes && renderField('ملاحظات', feedItem.notes, FIELD_ICONS.notes)}
      </View>
    </ScrollView>

      <QuantityModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={(quantity, notes) => handleQuantityChange('add', quantity, notes)}
        type="add"
        currentQuantity={feedItem.quantity}
        unit={feedItem.unit}
        loading={quantityLoading}
      />

      <QuantityModal
        visible={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={(quantity, notes) => handleQuantityChange('remove', quantity, notes)}
        type="remove"
        currentQuantity={feedItem.quantity}
        unit={feedItem.unit}
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
  feedIcon: {
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

export default FeedDetailScreen; 