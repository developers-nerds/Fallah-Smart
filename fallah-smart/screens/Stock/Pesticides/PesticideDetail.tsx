import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  I18nManager,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { usePesticide } from '../../../context/PesticideContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/StockNavigator';
import { PESTICIDE_TYPE_ICONS, SAFETY_ICONS, STATUS_ICONS, ACTION_ICONS, UNIT_ICONS } from './constants';
import { SafeAreaView } from 'react-native-safe-area-context';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type PesticideDetailProps = {
  route: RouteProp<StockStackParamList, 'PesticideDetail'>;
  navigation: StackNavigationProp<StockStackParamList>;
};

// Field icons for different sections
const FIELD_ICONS = {
  quantity: '📦',
  minQuantityAlert: '⚠️',
  price: '💰',
  purchaseDate: '📅',
  expiryDate: '⏳',
  manufacturer: '🏭',
  supplier: '🚚',
  activeIngredients: '🧪',
  targetPests: '🐛',
  applicationRate: '💧',
  safetyInterval: '⏱️',
  safetyPrecautions: '⚠️',
  storageInstructions: '📍',
  registrationNumber: '🔢',
  toxicityClass: '☣️',
  formulation: '🧴',
  notes: '📝',
};

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
        // Show error or alert that you can't remove more than current quantity
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
        <BlurView intensity={80} tint="dark" style={styles.modalBlur}>
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
                placeholder={`الكمية بـ ${unit}`}
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
        </BlurView>
      </View>
    </Modal>
  );
};

export const PesticideDetail = ({ route, navigation }: PesticideDetailProps) => {
  const theme = useTheme();
  const { pesticideId } = route.params;
  const { 
    pesticides, 
    loading, 
    error, 
    refreshPesticides,
    addPesticideQuantity,
    removePesticideQuantity,
    deletePesticide
  } = usePesticide();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const pesticide = pesticides.find(p => p.id === pesticideId);
  const typeInfo = pesticide ? (PESTICIDE_TYPE_ICONS[pesticide.type] || PESTICIDE_TYPE_ICONS.other) : PESTICIDE_TYPE_ICONS.other;
  const unitInfo = pesticide ? UNIT_ICONS[pesticide.unit.toLowerCase() as keyof typeof UNIT_ICONS] : null;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPesticides();
    setRefreshing(false);
  }, [refreshPesticides]);

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleCloseRemoveModal = useCallback(() => {
    setShowRemoveModal(false);
  }, []);

  const handleQuantityChange = async (type: 'add' | 'remove', quantity: number, notes?: string) => {
    if (!pesticide) return;
    
    try {
      if (type === 'add') {
        await addPesticideQuantity(pesticide.id, quantity, notes);
        handleCloseAddModal();
      } else {
        if (quantity > pesticide.quantity) {
          // You could show an error message here
          return;
        }
        await removePesticideQuantity(pesticide.id, quantity, notes);
        handleCloseRemoveModal();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'حذف المبيد',
      'هل أنت متأكد من حذف هذا المبيد؟',
      [
        { 
          text: 'إلغاء', 
          style: 'cancel' 
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deletePesticide(pesticideId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف المبيد');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

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

  if (loading && !pesticide || isDeleting) {
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

  if (error || !pesticide) {
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
            {error || 'لم يتم العثور على المبيد'}
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

  const isLowStock = pesticide.quantity <= pesticide.minQuantityAlert;
  const isExpired = pesticide.expiryDate && new Date(pesticide.expiryDate) <= new Date();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
          />
        }
      >
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
              <Text style={styles.pesticideIcon}>{typeInfo.icon}</Text>
              {isLowStock && <Text style={styles.statusIndicator}>⚠️</Text>}
              {isExpired && <Text style={styles.statusIndicator}>❗</Text>}
              {pesticide.isNatural && <Text style={styles.natureIndicator}>🌿</Text>}
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
                {pesticide.name}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>
                {typeInfo.label}
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <Text style={[styles.statValue, { 
                color: isLowStock ? theme.colors.error : theme.colors.neutral.textPrimary 
              }]}>
                {pesticide.quantity}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                {unitInfo?.label || pesticide.unit}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                {pesticide.price || '-'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                د.أ
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <View style={[
                styles.toxicityIndicator,
                { 
                  backgroundColor: (() => {
                    switch (pesticide.toxicityClass) {
                      case 'high': return theme.colors.error;
                      case 'medium': return theme.colors.warning;
                      case 'low': return theme.colors.info;
                      case 'none': return theme.colors.success;
                      default: return theme.colors.neutral.border;
                    }
                  })()
                }
              ]}>
                <Text style={styles.toxicityIcon}>
                  {(() => {
                    switch (pesticide.toxicityClass) {
                      case 'high': return '☠️';
                      case 'medium': return '⚠️';
                      case 'low': return '⚕️';
                      case 'none': return '✅';
                      default: return '❓';
                    }
                  })()}
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                {(() => {
                  switch (pesticide.toxicityClass) {
                    case 'high': return 'سمية عالية';
                    case 'medium': return 'سمية متوسطة';
                    case 'low': return 'سمية منخفضة';
                    case 'none': return 'غير سام';
                    default: return 'غير محدد';
                  }
                })()}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[
                styles.quantityButton, 
                { 
                  backgroundColor: theme.colors.success,
                }
              ]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.quantityButtonIcon}>➕</Text>
              <Text style={styles.quantityButtonText}>إضافة للمخزون</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.quantityButton, 
                { 
                  backgroundColor: theme.colors.error,
                }
              ]}
              onPress={() => setShowRemoveModal(true)}
            >
              <Text style={styles.quantityButtonIcon}>➖</Text>
              <Text style={styles.quantityButtonText}>سحب من المخزون</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={() => navigation.navigate('EditPesticide', { pesticideId })}
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
          {isLowStock && (
            <Animated.View 
              entering={FadeInDown.delay(100).springify()}
              style={[
                styles.warningCard, 
                { 
                  backgroundColor: theme.colors.warning + '15',
                  borderColor: theme.colors.warning,
                }
              ]}
            >
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={[styles.warningText, { color: theme.colors.warning }]}>
                المخزون منخفض (الحد الأدنى: {pesticide.minQuantityAlert} {unitInfo?.label || pesticide.unit})
              </Text>
            </Animated.View>
          )}

          {isExpired && (
            <Animated.View 
              entering={FadeInDown.delay(150).springify()}
              style={[
                styles.warningCard, 
                { 
                  backgroundColor: theme.colors.error + '15',
                  borderColor: theme.colors.error,
                }
              ]}
            >
              <Text style={styles.warningIcon}>⏰</Text>
              <Text style={[styles.warningText, { color: theme.colors.error }]}>
                منتهي الصلاحية منذ {new Date(pesticide.expiryDate).toLocaleDateString('ar-SA')}
              </Text>
            </Animated.View>
          )}

          {/* Basic Information */}
          {renderField('الكمية', `${pesticide.quantity} ${unitInfo?.label || pesticide.unit}`, FIELD_ICONS.quantity)}
          {renderField('السعر', pesticide.price ? `${pesticide.price} د.أ` : null, FIELD_ICONS.price)}
          {renderField('تاريخ الشراء', pesticide.purchaseDate ? new Date(pesticide.purchaseDate).toLocaleDateString('ar-SA') : null, FIELD_ICONS.purchaseDate)}
          {renderField('تاريخ انتهاء الصلاحية', pesticide.expiryDate ? new Date(pesticide.expiryDate).toLocaleDateString('ar-SA') : null, FIELD_ICONS.expiryDate)}
          {renderField('الحد الأدنى للتنبيه', pesticide.minQuantityAlert ? `${pesticide.minQuantityAlert} ${unitInfo?.label || pesticide.unit}` : null, FIELD_ICONS.minQuantityAlert)}
          
          {/* Manufacturing Information */}
          {renderField('الشركة المصنعة', pesticide.manufacturer, FIELD_ICONS.manufacturer)}
          {renderField('المورد', pesticide.supplier, FIELD_ICONS.supplier)}
          {renderField('المكونات النشطة', pesticide.activeIngredients, FIELD_ICONS.activeIngredients)}
          {renderField('رقم التسجيل', pesticide.registrationNumber, FIELD_ICONS.registrationNumber)}
          {renderField('نوع التركيبة', pesticide.formulation, FIELD_ICONS.formulation)}
          
          {/* Usage Information */}
          {renderField('الآفات المستهدفة', pesticide.targetPests, FIELD_ICONS.targetPests)}
          {renderField('معدل التطبيق', pesticide.applicationRate, FIELD_ICONS.applicationRate)}
          {renderField('فترة الأمان', pesticide.safetyInterval, FIELD_ICONS.safetyInterval)}
          {renderField('احتياطات السلامة', pesticide.safetyPrecautions, FIELD_ICONS.safetyPrecautions)}
          {renderField('تعليمات التخزين', pesticide.storageInstructions, FIELD_ICONS.storageInstructions)}
          
          {/* Notes */}
          {renderField('ملاحظات', pesticide.notes, FIELD_ICONS.notes)}
        </View>
      </ScrollView>

      <QuantityModal
        visible={showAddModal}
        onClose={handleCloseAddModal}
        onConfirm={(quantity, notes) => handleQuantityChange('add', quantity, notes)}
        type="add"
        currentQuantity={pesticide.quantity}
        unit={pesticide.unit}
        loading={loading}
      />

      <QuantityModal
        visible={showRemoveModal}
        onClose={handleCloseRemoveModal}
        onConfirm={(quantity, notes) => handleQuantityChange('remove', quantity, notes)}
        type="remove"
        currentQuantity={pesticide.quantity}
        unit={pesticide.unit}
        loading={loading}
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
  pesticideIcon: {
    fontSize: 40,
  },
  statusIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 20,
  },
  natureIndicator: {
    position: 'absolute',
    bottom: -5,
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
  toxicityIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toxicityIcon: {
    fontSize: 24,
    color: '#FFF',
  },
  actionsRow: {
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  warningIcon: {
    fontSize: 24,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBlur: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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

export default PesticideDetail;