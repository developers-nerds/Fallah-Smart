import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ActivityIndicator,
  Platform,
  RefreshControl,
  Dimensions,
  Switch,
  ViewStyle
} from 'react-native';
import Animated, { 
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeInDown
} from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../context/ThemeContext';
import { StockItem, StockHistory, StockCategory, StockUnit, STOCK_CATEGORIES, STOCK_UNITS } from './types';
import { useStock } from '../../context/StockContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../navigation/types';
import { createThemedStyles } from '../../utils/createThemedStyles';
import { FeatherNames } from '../../types/icons';
import { Button as CustomButton } from '../../components/Button';
import { StockHistoryComponent } from './components/StockHistory';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface StockDetailProps {
  route: RouteProp<StockStackParamList, 'StockDetail'>;
  navigation: StackNavigationProp<StockStackParamList, 'StockDetail'>;
}

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

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

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withSpring(1);
    } else {
      fadeAnim.value = withSpring(0);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    fadeAnim.value = withSpring(0, {}, (finished) => {
      if (finished) {
        setQuantity('');
        setNotes('');
        onClose();
      }
    });
  }, [fadeAnim, onClose]);

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

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const translateStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(
        fadeAnim.value,
        [0, 1],
        [20, 0],
        Extrapolate.CLAMP
      ),
    }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View 
        style={[
          styles.modalOverlay,
          fadeStyle,
          translateStyle
        ]}
      >
        <BlurView intensity={80} tint="dark" style={styles.modalBlur}>
          <Animated.View 
            style={[
              styles.modalContent,
              { 
                backgroundColor: theme.colors.neutral.surface,
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons
                name={type === 'add' ? 'plus-circle' : 'minus-circle'}
                size={32}
                color={type === 'add' ? theme.colors.success : theme.colors.error}
              />
              <Text style={[styles.modalTitle, { color: theme.colors.neutral.textPrimary }]}>
                {type === 'add' ? 'إضافة للمخزون' : 'سحب من المخزون'}
              </Text>
            </View>

            <View style={styles.currentQuantityContainer}>
              <Text style={[styles.currentQuantityLabel, { color: theme.colors.neutral.textSecondary }]}>
                المخزون الحالي
              </Text>
              <Text style={[styles.currentQuantity, { color: theme.colors.neutral.textPrimary }]}>
                {currentQuantity.toLocaleString('en-US')} {unit}
              </Text>
            </View>

            <View style={styles.modalInputContainer}>
              <View style={styles.quantityInputContainer}>
                <MaterialCommunityIcons
                  name="scale"
                  size={24}
                  color={theme.colors.neutral.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: theme.colors.neutral.background,
                    color: theme.colors.neutral.textPrimary 
                  }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder={`الكمية بـ ${unit}`}
                  placeholderTextColor={theme.colors.neutral.textSecondary}
                  editable={!loading}
                />
              </View>

              <View style={styles.notesInputContainer}>
                <MaterialCommunityIcons
                  name="note-text"
                  size={24}
                  color={theme.colors.neutral.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: theme.colors.neutral.background,
                    color: theme.colors.neutral.textPrimary,
                    height: 100,
                    textAlignVertical: 'top'
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
          </Animated.View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

const HistoryItem = ({ history, unit }: { history: StockHistory; unit: string }) => {
  const theme = useTheme();
  const isAdd = history.type === 'add';
  const date = new Date(history.date);
  const formattedDate = date.toLocaleDateString('en-US', { 
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <View style={[styles.historyItem, { backgroundColor: theme.colors.neutral.surface }]}>
      <View style={styles.historyHeader}>
        <View style={[
          styles.historyIconContainer,
          { backgroundColor: isAdd ? theme.colors.success : theme.colors.error }
        ]}>
          <MaterialCommunityIcons
            name={isAdd ? 'plus-circle' : 'minus-circle'}
            size={24}
            color="#FFF"
          />
        </View>
        <View style={styles.historyInfo}>
          <Text style={[styles.historyDate, { color: theme.colors.neutral.textPrimary }]}>
            {formattedDate}
          </Text>
          <Text style={[styles.historyTime, { color: theme.colors.neutral.textSecondary }]}>
            {formattedTime}
          </Text>
        </View>
      </View>
      <View style={styles.historyDetails}>
        <View style={styles.historyQuantityContainer}>
          <MaterialCommunityIcons
            name="scale"
            size={20}
            color={isAdd ? theme.colors.success : theme.colors.error}
          />
          <Text style={[styles.historyQuantity, { 
            color: isAdd ? theme.colors.success : theme.colors.error 
          }]}>
            {isAdd ? '+' : '-'}{history.quantity.toLocaleString('en-US')} {unit}
          </Text>
        </View>
        {history.notes && (
          <View style={styles.historyNotesContainer}>
            <MaterialCommunityIcons
              name="note-text"
              size={16}
              color={theme.colors.neutral.textSecondary}
            />
            <Text style={[styles.historyNotes, { color: theme.colors.neutral.textSecondary }]}>
              {history.notes}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

type CategoryMap = {
  seeds: string;
  fertilizer: string;
  harvest: string;
  feed: string;
  pesticide: string;
  equipment: string;
  tools: string;
  animals: string;
};

type QualityMap = {
  good: string;
  medium: string;
  poor: string;
};

const getCategoryLabel = (category: StockCategory): string => {
  if (category === 'all') return 'الكل';
  
  const categories: CategoryMap = {
    seeds: 'البذور',
    fertilizer: 'الأسمدة',
    harvest: 'المحاصيل',
    feed: 'الأعلاف',
    pesticide: 'المبيدات',
    equipment: 'المعدات',
    tools: 'الأدوات',
    animals: 'الحيوانات'
  };
  return categories[category];
};

const getQualityColor = (quality: 'good' | 'medium' | 'poor' | undefined, theme: any) => {
  switch (quality) {
    case 'good':
      return theme.colors.success;
    case 'medium':
      return theme.colors.accent.base;
    case 'poor':
      return theme.colors.error;
    default:
      return theme.colors.neutral.textSecondary;
  }
};

const getQualityLabel = (quality: 'good' | 'medium' | 'poor' | undefined): string => {
  const qualities: QualityMap = {
    good: 'جيد',
    medium: 'متوسط',
    poor: 'سيء'
  };
  return quality ? qualities[quality] : 'غير محدد';
};

const AddStockModal = ({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (stock: Omit<StockItem, 'id' | 'stockHistory'>) => Promise<void>;
}) => {
  const [formData, setFormData] = useState<Omit<StockItem, 'id' | 'stockHistory'>>({
    name: '',
    category: 'seeds' as StockCategory,
    quantity: 0,
    unit: 'kg' as StockUnit,
    lowStockThreshold: 10,
    location: '',
    supplier: '',
    price: undefined,
    batchNumber: '',
    expiryDate: '',
    isNatural: false,
    qualityStatus: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleAdd = async () => {
    try {
      setLoading(true);
      await onAdd({
        ...formData,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      onClose();
      setFormData({
        name: '',
        category: 'seeds' as StockCategory,
        quantity: 0,
        unit: 'kg' as StockUnit,
        lowStockThreshold: 10,
        location: '',
        supplier: '',
        price: undefined,
        batchNumber: '',
        expiryDate: '',
        isNatural: false,
        qualityStatus: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding stock:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.neutral.textPrimary }]}>
            إضافة مخزون جديد
          </Text>

          <ScrollView>
            <TextInput
              style={styles.modalInput}
              placeholder="اسم المنتج*"
              value={formData.name}
              onChangeText={text => setFormData(prev => ({ ...prev, name: text }))}
            />

            <View style={styles.pickerContainer}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>الفئة</Text>
              <Picker
                selectedValue={formData.category}
                style={styles.modalInput}
                onValueChange={(itemValue) => setFormData(prev => ({ ...prev, category: itemValue as StockCategory }))}
              >
                {STOCK_CATEGORIES.map(category => (
                  <Picker.Item key={category} label={getCategoryLabel(category)} value={category} />
                ))}
              </Picker>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="الكمية الأولية"
              keyboardType="numeric"
              value={formData.quantity.toString()}
              onChangeText={text => setFormData(prev => ({ ...prev, quantity: Number(text) }))}
            />

            <View style={styles.pickerContainer}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>الوحدة</Text>
              <Picker
                selectedValue={formData.unit}
                style={styles.modalInput}
                onValueChange={(itemValue) => setFormData(prev => ({ ...prev, unit: itemValue as StockUnit }))}
              >
                {STOCK_UNITS.map(unit => (
                  <Picker.Item key={unit.value} label={unit.label} value={unit.value} />
                ))}
              </Picker>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="الحد الأدنى للتنبيه*"
              keyboardType="numeric"
              value={formData.lowStockThreshold.toString()}
              onChangeText={text => setFormData(prev => ({ ...prev, lowStockThreshold: Number(text) }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="الموقع"
              value={formData.location}
              onChangeText={text => setFormData(prev => ({ ...prev, location: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="المورد"
              value={formData.supplier}
              onChangeText={text => setFormData(prev => ({ ...prev, supplier: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="السعر (درهم)"
              keyboardType="numeric"
              value={formData.price?.toString() || ''}
              onChangeText={text => setFormData(prev => ({ ...prev, price: Number(text) }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="رقم الدفعة"
              value={formData.batchNumber}
              onChangeText={text => setFormData(prev => ({ ...prev, batchNumber: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="تاريخ انتهاء الصلاحية (YYYY-MM-DD)"
              value={formData.expiryDate}
              onChangeText={text => setFormData(prev => ({ ...prev, expiryDate: text }))}
            />

            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: theme.colors.neutral.textPrimary }]}>منتج طبيعي</Text>
              <Switch
                value={formData.isNatural}
                onValueChange={(value: boolean) => setFormData(prev => ({ ...prev, isNatural: value }))}
                trackColor={{ false: '#767577', true: theme.colors.success }}
                thumbColor={formData.isNatural ? '#fff' : '#f4f3f4'}
              />
            </View>

            <Picker
              selectedValue={formData.qualityStatus}
              style={styles.modalInput}
              onValueChange={(itemValue) => setFormData(prev => ({ ...prev, qualityStatus: itemValue as 'good' | 'medium' | 'poor' | undefined }))}
            >
              <Picker.Item label="اختر الجودة" value={undefined} />
              <Picker.Item label="جيد" value="good" />
              <Picker.Item label="متوسط" value="medium" />
              <Picker.Item label="سيء" value="poor" />
            </Picker>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleAdd}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.buttonText, { color: '#fff' }]}>إضافة</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const StockDetail = ({ route, navigation }: StockDetailProps) => {
  const theme = useTheme();
  const { stockId } = route.params;
  const { 
    stocks, 
    addStockQuantity, 
    removeStockQuantity, 
    loading, 
    error, 
    refreshStocks, 
    fetchStockHistory 
  } = useStock();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<'details' | 'history' | null>(null);
  const scrollY = useSharedValue(0);

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
      shadowColor: '#000',
    };
  });

  const stock = stocks.find(s => s.id === stockId);

  const loadHistory = useCallback(async () => {
    if (stock) {
      try {
        const historyData = await fetchStockHistory(stock.id);
        setHistory(historyData);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setHistoryLoading(false);
      }
    }
  }, [stock, fetchStockHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshStocks(), loadHistory()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleCloseRemoveModal = useCallback(() => {
    setShowRemoveModal(false);
  }, []);

  const handleQuantityChange = async (type: 'add' | 'remove', quantity: number, notes?: string) => {
    if (!stock) return;
    
    try {
      if (type === 'add') {
        await addStockQuantity(stock.id, quantity, notes);
        handleCloseAddModal();
      } else {
        if (quantity > stock.quantity) {
          // You could show an error message here
          return;
        }
        await removeStockQuantity(stock.id, quantity, notes);
        handleCloseRemoveModal();
      }
      await loadHistory();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const toggleSection = (section: 'details' | 'history') => {
    setActiveSection(current => current === section ? null : section);
  };

  if (loading && !stock) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <MaterialCommunityIcons 
          name="package-variant" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <CustomButton 
          title="إعادة المحاولة" 
          onPress={refreshStocks}
          variant="primary"
        />
      </View>
    );
  }

  if (!stock) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <MaterialCommunityIcons 
          name="package-variant" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>لم يتم العثور على المخزون</Text>
        <CustomButton 
          title="رجوع" 
          onPress={() => navigation.goBack()}
          variant="primary"
        />
      </View>
    );
  }

  const isLowStock = stock.quantity <= stock.lowStockThreshold;
  const leafIcon: FeatherNames = 'check-circle';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
          />
        }
      >
        <View style={[styles.card, { backgroundColor: theme.colors.neutral.surface }]}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.name, { color: theme.colors.neutral.textPrimary }]}>
                {stock.name}
              </Text>
              {stock.isNatural && (
                <View style={[styles.naturalBadge, { backgroundColor: theme.colors.success }]}>
                  <Feather name={leafIcon} size={12} color="#FFF" />
                  <Text style={styles.naturalText}>طبيعي</Text>
                </View>
              )}
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: theme.colors.accent.light }]}>
              <Text style={[styles.categoryText, { color: theme.colors.accent.dark }]}>
                {getCategoryLabel(stock.category)}
              </Text>
            </View>
          </View>

          <View style={styles.stockLevelContainer}>
            <View style={styles.stockLevelHeader}>
              <MaterialCommunityIcons
                name="package-variant"
                size={24}
                color={isLowStock ? theme.colors.error : theme.colors.success}
              />
              <Text style={[styles.stockLevelTitle, { 
                color: isLowStock ? theme.colors.error : theme.colors.success 
              }]}>
                المخزون الحالي
              </Text>
            </View>
            <View style={styles.stockLevelBar}>
              <Animated.View 
                style={[
                  styles.stockLevelFill,
                  { 
                    backgroundColor: isLowStock ? theme.colors.error : theme.colors.success,
                    width: `${Math.min((stock.quantity / stock.lowStockThreshold) * 100, 100)}%`
                  }
                ]} 
              />
            </View>
            <View style={styles.stockLevelInfo}>
              <View style={styles.quantityContainer}>
                <Text style={[styles.stockLevelText, { 
                  color: isLowStock ? theme.colors.error : theme.colors.success 
                }]}>
                  {stock.quantity.toLocaleString('en-US')}
                </Text>
                <Text style={[styles.unitText, { 
                  color: isLowStock ? theme.colors.error : theme.colors.success 
                }]}>
                  {stock.unit}
                </Text>
              </View>
              <View style={styles.thresholdContainer}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={16}
                  color={theme.colors.neutral.textSecondary}
                />
                <Text style={[styles.thresholdText, { color: theme.colors.neutral.textSecondary }]}>
                  الحد الأدنى: {stock.lowStockThreshold.toLocaleString('en-US')} {stock.unit}
                </Text>
              </View>
            </View>
            {isLowStock && (
              <View style={[styles.lowStockWarning, { backgroundColor: theme.colors.error }]}>
                <MaterialCommunityIcons name="alert" size={20} color="#FFF" />
                <Text style={styles.lowStockWarningText}>
                  Stock faible! Reapprovisionnez bientôt
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.success }
              ]}
              onPress={() => setShowAddModal(true)}
              disabled={loading}
            >
              <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                إضافة للمخزون
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.error }
              ]}
              onPress={() => setShowRemoveModal(true)}
              disabled={loading}
            >
              <MaterialCommunityIcons name="minus-circle" size={24} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                سحب من المخزون
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.neutral.surface }]}>
          <TouchableOpacity 
            style={[
              styles.sectionHeader,
              { 
                backgroundColor: activeSection === 'details' 
                  ? theme.colors.neutral.surface
                  : theme.colors.neutral.background,
                borderWidth: 1,
                borderColor: theme.colors.neutral.border
              }
            ]}
            onPress={() => toggleSection('details')}
          >
            <View style={styles.sectionHeaderContent}>
              <MaterialCommunityIcons
                name="information"
                size={24}
                color={theme.colors.neutral.textPrimary}
              />
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                التفاصيل
              </Text>
              <View style={[
                styles.sectionBadge,
                {
                  backgroundColor: activeSection === 'details'
                    ? theme.colors.primary.base
                    : theme.colors.neutral.gray.base
                }
              ]}>
                <Text style={styles.sectionSubtitle}>
                  {activeSection === 'details' ? 'إخفاء' : 'عرض'}
                </Text>
              </View>
            </View>
            <Feather 
              name="chevron-down" 
              size={24} 
              color={theme.colors.neutral.textPrimary}
              style={{
                transform: [{ rotate: activeSection === 'details' ? '180deg' : '0deg' }]
              }}
            />
          </TouchableOpacity>

          {activeSection === 'details' && (
            <Animated.View 
              entering={FadeInDown}
              exiting={FadeIn}
              style={styles.detailsGrid}
            >
              <View style={styles.detailsSection}>
                <Text style={[styles.sectionLabel, { color: theme.colors.neutral.textSecondary }]}>
                  معلومات عامة
                </Text>
                {stock.location && (
                  <View style={[styles.infoItem, { backgroundColor: theme.colors.neutral.background }]}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary.base }]}>
                      <Feather name="map-pin" size={20} color="#FFF" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.neutral.textSecondary }]}>
                        الموقع
                      </Text>
                      <Text style={[styles.infoValue, { color: theme.colors.neutral.textPrimary }]}>
                        {stock.location}
                      </Text>
                    </View>
                  </View>
                )}

                {stock.supplier && (
                  <View style={[styles.infoItem, { backgroundColor: theme.colors.neutral.background }]}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent.base }]}>
                      <Feather name="truck" size={20} color="#FFF" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.neutral.textSecondary }]}>
                        المورد
                      </Text>
                      <Text style={[styles.infoValue, { color: theme.colors.neutral.textPrimary }]}>
                        {stock.supplier}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.detailsSection}>
                <Text style={[styles.sectionLabel, { color: theme.colors.neutral.textSecondary }]}>
                  تفاصيل المنتج
                </Text>
                {stock.price && (
                  <View style={[styles.infoItem, { backgroundColor: theme.colors.neutral.background }]}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.success }]}>
                      <Feather name="tag" size={20} color="#FFF" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.neutral.textSecondary }]}>
                        السعر
                      </Text>
                      <Text style={[styles.infoValue, { color: theme.colors.neutral.textPrimary }]}>
                        {stock.price.toLocaleString('en-US')} درهم/{stock.unit}
                      </Text>
                    </View>
                  </View>
                )}

                {stock.batchNumber && (
                  <View style={[styles.infoItem, { backgroundColor: theme.colors.neutral.background }]}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning }]}>
                      <Feather name="hash" size={20} color="#FFF" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.neutral.textSecondary }]}>
                        رقم الدفعة
                      </Text>
                      <Text style={[styles.infoValue, { color: theme.colors.neutral.textPrimary }]}>
                        {stock.batchNumber}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.detailsSection}>
                <Text style={[styles.sectionLabel, { color: theme.colors.neutral.textSecondary }]}>
                  الجودة وتاريخ الانتهاء
                </Text>
                {stock.expiryDate && (
                  <View style={[styles.infoItem, { backgroundColor: theme.colors.neutral.background }]}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning }]}>
                      <Feather name="calendar" size={20} color="#FFF" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.neutral.textSecondary }]}>
                        تاريخ الانتهاء
                      </Text>
                      <Text style={[styles.infoValue, { color: theme.colors.neutral.textPrimary }]}>
                        {new Date(stock.expiryDate).toLocaleDateString('ar-SA')}
                      </Text>
                    </View>
                  </View>
                )}

                {stock.qualityStatus && (
                  <View style={[styles.infoItem, { backgroundColor: theme.colors.neutral.background }]}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent.base }]}>
                      <Feather name="check-circle" size={20} color="#FFF" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.neutral.textSecondary }]}>
                        الجودة
                      </Text>
                      <Text style={[styles.infoValue, { color: theme.colors.neutral.textPrimary }]}>
                        {stock.qualityStatus === 'good' ? 'جيد' : 
                         stock.qualityStatus === 'medium' ? 'متوسط' : 'سيء'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.neutral.surface }]}>
          <TouchableOpacity 
            style={[
              styles.sectionHeader,
              { 
                backgroundColor: activeSection === 'history' 
                  ? theme.colors.neutral.surface
                  : theme.colors.neutral.background,
                borderWidth: 1,
                borderColor: theme.colors.neutral.border
              }
            ]}
            onPress={() => toggleSection('history')}
          >
            <View style={styles.sectionHeaderContent}>
              <MaterialCommunityIcons
                name="history"
                size={24}
                color={theme.colors.neutral.textPrimary}
              />
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                السجل
              </Text>
              <View style={[
                styles.sectionBadge,
                {
                  backgroundColor: activeSection === 'history'
                    ? theme.colors.accent.base
                    : theme.colors.neutral.gray.base
                }
              ]}>
                <Text style={styles.sectionSubtitle}>
                  {activeSection === 'history' ? 'إخفاء' : 'عرض'}
                </Text>
              </View>
            </View>
            <Feather 
              name="chevron-down" 
              size={24} 
              color={theme.colors.neutral.textPrimary}
              style={{
                transform: [{ rotate: activeSection === 'history' ? '180deg' : '0deg' }]
              }}
            />
          </TouchableOpacity>

          {activeSection === 'history' && (
            <Animated.View 
              entering={FadeInDown}
              exiting={FadeIn}
              style={styles.section}
            >
              <StockHistoryComponent 
                history={history} 
                unit={stock.unit} 
                loading={historyLoading}
              />
            </Animated.View>
          )}
        </View>
      </Animated.ScrollView>

      <QuantityModal
        visible={showAddModal}
        onClose={handleCloseAddModal}
        onConfirm={(quantity, notes) => handleQuantityChange('add', quantity, notes)}
        type="add"
        currentQuantity={stock.quantity}
        unit={stock.unit}
        loading={loading}
      />

      <QuantityModal
        visible={showRemoveModal}
        onClose={handleCloseRemoveModal}
        onConfirm={(quantity, notes) => handleQuantityChange('remove', quantity, notes)}
        type="remove"
        currentQuantity={stock.quantity}
        unit={stock.unit}
        loading={loading}
      />
    </View>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowColor: '#000000',
    zIndex: 1000,
  } as ViewStyle,
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stockLevelContainer: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.neutral.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
  },
  stockLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  stockLevelTitle: {
    fontSize: theme.fontSizes.h3,
    fontFamily: theme.fonts.bold,
  },
  stockLevelBar: {
    height: 12,
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: 6,
    overflow: 'hidden',
    marginVertical: theme.spacing.sm,
  },
  stockLevelFill: {
    height: '100%',
    borderRadius: 6,
  },
  stockLevelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  stockLevelText: {
    fontSize: theme.fontSizes.h1,
    fontFamily: theme.fonts.bold,
  },
  unitText: {
    fontSize: theme.fontSizes.h3,
    fontFamily: theme.fonts.medium,
  },
  thresholdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  thresholdText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  },
  lowStockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.sm,
  },
  lowStockWarningText: {
    color: '#FFF',
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.h3,
    fontFamily: theme.fonts.bold,
  },
  sectionBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    marginLeft: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
  },
  detailsGrid: {
    gap: theme.spacing.lg,
  },
  detailsSection: {
    gap: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: theme.fontSizes.h4,
    fontFamily: theme.fonts.bold,
    marginBottom: theme.spacing.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  },
  naturalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  naturalText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    elevation: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  } as ViewStyle,
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalInputContainer: {
    gap: 16,
  },
  modalInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.neutral.background,
  },
  confirmButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  currentQuantityContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.background,
    borderRadius: theme.borderRadius.medium,
  },
  currentQuantityLabel: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    marginBottom: theme.spacing.xs,
  },
  currentQuantity: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
  },
  notesInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.neutral.background,
    borderRadius: theme.borderRadius.medium,
  },
  inputIcon: {
    padding: theme.spacing.md,
  },
  historyItem: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  historyIconContainer: {
    marginRight: theme.spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  },
  historyTime: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
  },
  historyDetails: {
    marginLeft: theme.spacing.xl,
  },
  historyQuantity: {
    fontSize: theme.fontSizes.h3,
    fontFamily: theme.fonts.bold,
    marginBottom: theme.spacing.xs,
  },
  historyNotes: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
  },
}));

export default StockDetail; 