import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  ViewStyle,
  Modal,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
  FadeInDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { usePesticide } from '../../../context/PesticideContext';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { Button as CustomButton } from '../../../components/Button';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/StockNavigator';
import { PESTICIDE_TYPE_ICONS, SAFETY_ICONS, STATUS_ICONS, ACTION_ICONS, UNIT_ICONS } from './constants';
import { SafeAreaView } from 'react-native-safe-area-context';

type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;

type PesticideDetailProps = {
  route: RouteProp<StockStackParamList, 'PesticideDetail'>;
  navigation: StackNavigationProp<StockStackParamList>;
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
  const fadeAnim = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      fadeAnim.value = 1;
    } else {
      fadeAnim.value = 0;
    }
  }, [visible]);

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
  const scrollY = useSharedValue(0);

  const pesticide = pesticides.find(p => p.id === pesticideId);
  const typeInfo = pesticide ? (PESTICIDE_TYPE_ICONS[pesticide.type] || PESTICIDE_TYPE_ICONS.other) : PESTICIDE_TYPE_ICONS.other;
  const unitInfo = pesticide ? UNIT_ICONS[pesticide.unit.toLowerCase() as keyof typeof UNIT_ICONS] : null;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPesticides();
    setRefreshing(false);
  }, [refreshPesticides]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.9],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      backgroundColor: theme.colors.neutral.surface,
    };
  });

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
              await deletePesticide(pesticideId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف المبيد');
            }
          },
        },
      ]
    );
  };

  if (loading && !pesticide) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (error || !pesticide) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <Text>
          ❌
        </Text>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>لم يتم العثور على المبيد</Text>
        <CustomButton 
          title="رجوع" 
          onPress={() => navigation.goBack()}
          variant="primary"
        />
      </View>
    );
  }

  const isLowStock = pesticide.quantity <= pesticide.minQuantityAlert;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.iconText, { fontSize: 24, color: theme.colors.neutral.textPrimary }]}>
            ⬅️
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Text style={{ fontSize: 24 }}>🧪</Text>
          {' تفاصيل المبيد'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
          entering={FadeInDown.springify().delay(100)} 
          style={styles.mainCard}
        >
          <View style={styles.iconSection}>
            <View style={[styles.mainIcon, { 
              backgroundColor: typeInfo.color + '15',
              borderWidth: 2,
              borderColor: typeInfo.color + '30'
            }]}>
              <Text style={[styles.iconText, { 
                color: typeInfo.color,
                fontSize: 64 
              }]}>
                {typeInfo.icon}
              </Text>
            </View>
            <Text style={[styles.pesticideName, { marginTop: 16 }]}>{pesticide.name}</Text>
            <Text style={[styles.pesticideType, { color: typeInfo.color }]}>
              {typeInfo.label}
            </Text>
            
            <View style={styles.badges}>
              {pesticide.isNatural && (
                <View style={[styles.badge, { 
                  backgroundColor: STATUS_ICONS.natural.color + '15',
                  borderWidth: 1,
                  borderColor: STATUS_ICONS.natural.color
                }]}>
                  <Text style={[styles.badgeIcon, { color: STATUS_ICONS.natural.color }]}>
                    {STATUS_ICONS.natural.icon}
                  </Text>
                  <Text style={[styles.badgeText, { color: STATUS_ICONS.natural.color }]}>طبيعي</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton, { elevation: 2 }]}
              onPress={() => navigation.navigate('EditPesticide', { pesticideId })}
            >
              <Text style={[styles.iconText, { fontSize: 20, color: '#FFF' }]}>
                ✏️
              </Text>
              <Text style={styles.actionButtonText}>تعديل</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton, { elevation: 2 }]}
              onPress={handleDelete}
            >
              <Text style={[styles.iconText, { fontSize: 20, color: '#FFF' }]}>
                🗑️
              </Text>
              <Text style={styles.actionButtonText}>حذف</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsSection}>
            <View style={[styles.statCard, { elevation: 1 }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.iconText, { 
                  fontSize: 24, 
                  color: theme.colors.neutral.textSecondary 
                }]}>
                  📦
                </Text>
                <Text style={styles.statTitle}>الكمية المتوفرة</Text>
              </View>
              <View style={styles.statValue}>
                <Text style={[
                  styles.quantityText,
                  { color: isLowStock ? theme.colors.error : theme.colors.neutral.textPrimary }
                ]}>
                  {pesticide.quantity}
                </Text>
                <Text style={styles.unitText}>
                  {unitInfo?.label || pesticide.unit}
                </Text>
              </View>
              {isLowStock && (
                <View style={[styles.lowStockBadge, { 
                  backgroundColor: theme.colors.error + '15',
                  borderWidth: 1,
                  borderColor: theme.colors.error + '30'
                }]}>
                  <Text style={[styles.iconText, { fontSize: 20, color: theme.colors.error }]}>
                    ⚠️
                  </Text>
                  <Text style={[styles.lowStockText, { color: theme.colors.error }]}>
                    مخزون منخفض (الحد الأدنى: {pesticide.minQuantityAlert})
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={[
                  styles.quantityButton, 
                  { 
                    backgroundColor: theme.colors.success,
                    elevation: 2
                  }
                ]}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={[styles.iconText, { fontSize: 20, color: '#FFF' }]}>
                  ➕
                </Text>
                <Text style={styles.quantityButtonText}>إضافة للمخزون</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.quantityButton, 
                  { 
                    backgroundColor: theme.colors.error,
                    elevation: 2
                  }
                ]}
                onPress={() => setShowRemoveModal(true)}
              >
                <Text style={[styles.iconText, { fontSize: 20, color: '#FFF' }]}>
                  ➖
                </Text>
                <Text style={styles.quantityButtonText}>سحب من المخزون</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.springify().delay(200)} 
          style={styles.detailsSection}
        >
          <Text style={styles.sectionTitle}>معلومات المبيد</Text>
          
          <View style={styles.infoCards}>
            {[
              { icon: '📅', title: 'تاريخ الانتهاء', value: pesticide.expiryDate ? new Date(pesticide.expiryDate).toLocaleDateString() : null },
              { icon: '🏭', title: 'الشركة المصنعة', value: pesticide.manufacturer },
              { icon: '🧪', title: 'المكونات النشطة', value: pesticide.activeIngredients },
              { icon: '🐛', title: 'الآفات المستهدفة', value: pesticide.targetPests },
              { icon: '💨', title: 'معدل التطبيق', value: pesticide.applicationRate },
              { icon: '⏰', title: 'فترة الأمان', value: pesticide.safetyInterval },
              { icon: '⚠️', title: 'احتياطات السلامة', value: pesticide.safetyPrecautions },
              { icon: '🚛', title: 'المورد', value: pesticide.supplier },
              { icon: '💰', title: 'السعر', value: pesticide.price },
              { icon: '🔢', title: 'رقم التسجيل', value: pesticide.registrationNumber }
            ].map((item, index) => item.value && (
              <Animated.View 
                key={item.title}
                entering={FadeInDown.springify().delay(300 + index * 50)}
                style={[styles.infoCard, { elevation: 1 }]}
              >
                <View style={styles.infoCardHeader}>
                  <Text style={[styles.iconText, { 
                    fontSize: 24, 
                    color: theme.colors.neutral.textSecondary 
                  }]}>
                    {item.icon}
                  </Text>
                  <Text style={styles.infoCardTitle}>{item.title}</Text>
                </View>
                <Text style={styles.infoCardValue}>
                  {item.value}
                </Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
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

const styles = createThemedStyles((theme) => {
  // Define fallback values for typography to prevent undefined errors
  const getTypographySize = (typePath: string, fallback: number) => {
    try {
      const paths = typePath.split('.');
      let result: any = theme; // Type as any to avoid index signature errors
      for (const path of paths) {
        if (!result || result[path] === undefined) return fallback;
        result = result[path];
      }
      return result;
    } catch (e) {
      return fallback;
    }
  };

  return {
    container: {
      flex: 1,
      backgroundColor: theme.colors.neutral.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.neutral.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral.border,
      elevation: 2,
    },
    backButton: {
      padding: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: getTypographySize('typography.arabic.h3.fontSize', 28),
      fontWeight: '600',
      color: theme.colors.neutral.textPrimary,
    },
    headerRight: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.md,
      gap: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    mainCard: {
      backgroundColor: theme.colors.neutral.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.neutral.textPrimary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    iconSection: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    mainIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    iconText: {
      fontSize: 48,
    },
    pesticideName: {
      fontSize: getTypographySize('typography.arabic.h2.fontSize', 32),
      fontWeight: '600',
      color: theme.colors.neutral.textPrimary,
      textAlign: 'center',
    },
    pesticideType: {
      fontSize: getTypographySize('typography.arabic.h4.fontSize', 24),
      fontWeight: '500',
      color: theme.colors.neutral.textSecondary,
      textAlign: 'center',
    },
    badges: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.medium,
      gap: theme.spacing.xs,
    },
    badgeIcon: {
      fontSize: 16,
      color: '#FFF',
    },
    badgeText: {
      fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
      fontWeight: '500',
      color: '#FFF',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.medium,
      gap: theme.spacing.sm,
    },
    editButton: {
      backgroundColor: theme.colors.primary.base,
    },
    deleteButton: {
      backgroundColor: theme.colors.error,
    },
    actionButtonText: {
      color: '#FFF',
      fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
      fontWeight: '600',
    },
    statsSection: {
      gap: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    statCard: {
      backgroundColor: theme.colors.neutral.background,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    statTitle: {
      fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
      color: theme.colors.neutral.textSecondary,
    },
    statValue: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.xs,
    },
    quantityText: {
      fontSize: getTypographySize('typography.arabic.h2.fontSize', 32),
      fontWeight: '600',
    },
    unitText: {
      fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
      color: theme.colors.neutral.textSecondary,
      marginBottom: 4,
    },
    lowStockBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.medium,
      gap: theme.spacing.sm,
    },
    lowStockText: {
      fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
      fontWeight: '500',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    quantityButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.medium,
      gap: theme.spacing.sm,
    },
    quantityButtonText: {
      color: '#FFF',
      fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
      fontWeight: '600',
    },
    detailsSection: {
      gap: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: getTypographySize('typography.arabic.h3.fontSize', 28),
      fontWeight: '600',
      color: theme.colors.neutral.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    infoCards: {
      gap: theme.spacing.md,
    },
    infoCard: {
      backgroundColor: theme.colors.neutral.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.neutral.textPrimary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    infoCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    infoCardTitle: {
      fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
      color: theme.colors.neutral.textSecondary,
    },
    infoCardValue: {
      fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
      fontWeight: '500',
      color: theme.colors.neutral.textPrimary,
    },
    errorText: {
      fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
      marginTop: theme.spacing.sm,
      textAlign: 'center',
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
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    modalTitle: {
      fontSize: getTypographySize('typography.arabic.h3.fontSize', 28),
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    modalInputContainer: {
      gap: theme.spacing.md,
    },
    modalInput: {
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.neutral.border,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.md,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    modalButton: {
      flex: 1,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.medium,
    },
    cancelButton: {
      backgroundColor: theme.colors.neutral.background,
      borderWidth: 1,
      borderColor: theme.colors.neutral.border,
    },
    confirmButton: {
      backgroundColor: theme.colors.primary.base,
    },
    buttonText: {
      fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
      fontWeight: '600',
    },
  };
});

export default PesticideDetail;