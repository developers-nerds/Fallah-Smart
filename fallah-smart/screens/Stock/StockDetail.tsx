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
import { StockStackParamList } from '../../navigation/StockNavigator';
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
            <Text style={[styles.modalTitle, { color: theme.colors.neutral.textPrimary }]}>
              {type === 'add' ? 'Ajouter au stock' : 'Retirer du stock'}
            </Text>

            <View style={styles.modalInputContainer}>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: theme.colors.neutral.background,
                  color: theme.colors.neutral.textPrimary 
                }]}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder={`Quantité en ${unit}`}
                placeholderTextColor={theme.colors.neutral.textSecondary}
                editable={!loading}
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
                placeholder="Notes (optionnel)"
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
                  Annuler
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
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Confirmer</Text>
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

  return (
    <View style={[styles.historyItem, { backgroundColor: theme.colors.neutral.surface }]}>
      <View style={styles.historyHeader}>
        <Feather 
          name={isAdd ? 'plus-circle' : 'minus-circle'} 
          size={20} 
          color={isAdd ? theme.colors.success : theme.colors.error} 
        />
        <Text style={[styles.historyDate, { color: theme.colors.neutral.textSecondary }]}>
          {new Date(history.date).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.historyQuantity, { 
        color: isAdd ? theme.colors.success : theme.colors.error 
      }]}>
        {isAdd ? '+' : '-'}{history.quantity} {unit}
      </Text>
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
  if (category === 'all') return 'Tous';
  
  const categories: CategoryMap = {
    seeds: 'Semences',
    fertilizer: 'Engrais',
    harvest: 'Récoltes',
    feed: 'Aliments',
    pesticide: 'Pesticides',
    equipment: 'Équipement',
    tools: 'Outils',
    animals: 'Animaux'
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
    good: 'Bon',
    medium: 'Moyen',
    poor: 'Mauvais'
  };
  return quality ? qualities[quality] : 'Non défini';
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
            Ajouter un nouveau stock
          </Text>

          <ScrollView>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom du produit*"
              value={formData.name}
              onChangeText={text => setFormData(prev => ({ ...prev, name: text }))}
            />

            <View style={styles.pickerContainer}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>Catégorie</Text>
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
              placeholder="Quantité initiale"
              keyboardType="numeric"
              value={formData.quantity.toString()}
              onChangeText={text => setFormData(prev => ({ ...prev, quantity: Number(text) }))}
            />

            <View style={styles.pickerContainer}>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>Unité</Text>
              <Picker
                selectedValue={formData.unit}
                style={styles.modalInput}
                onValueChange={(itemValue) => setFormData(prev => ({ ...prev, unit: itemValue as StockUnit }))}
              >
                {STOCK_UNITS.map(unit => (
                  <Picker.Item key={unit} label={unit.toUpperCase()} value={unit} />
                ))}
              </Picker>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Seuil d'alerte*"
              keyboardType="numeric"
              value={formData.lowStockThreshold.toString()}
              onChangeText={text => setFormData(prev => ({ ...prev, lowStockThreshold: Number(text) }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Emplacement"
              value={formData.location}
              onChangeText={text => setFormData(prev => ({ ...prev, location: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Fournisseur"
              value={formData.supplier}
              onChangeText={text => setFormData(prev => ({ ...prev, supplier: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Prix (€)"
              keyboardType="numeric"
              value={formData.price?.toString() || ''}
              onChangeText={text => setFormData(prev => ({ ...prev, price: Number(text) }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Numéro de lot"
              value={formData.batchNumber}
              onChangeText={text => setFormData(prev => ({ ...prev, batchNumber: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Date d'expiration (AAAA-MM-JJ)"
              value={formData.expiryDate}
              onChangeText={text => setFormData(prev => ({ ...prev, expiryDate: text }))}
            />

            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: theme.colors.neutral.textPrimary }]}>Produit naturel</Text>
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
              <Picker.Item label="Sélectionner la qualité" value={undefined} />
              <Picker.Item label="Bon" value="good" />
              <Picker.Item label="Moyen" value="medium" />
              <Picker.Item label="Mauvais" value="poor" />
            </Picker>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleAdd}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.buttonText, { color: '#fff' }]}>Ajouter</Text>
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
          title="Réessayer" 
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
        <Text style={[styles.errorText, { color: theme.colors.error }]}>Stock non trouvé</Text>
        <CustomButton 
          title="Retour" 
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
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.neutral.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          Détails du Stock
        </Text>
      </Animated.View>

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
                  <Text style={styles.naturalText}>Naturel</Text>
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
              <Text style={[styles.stockLevelText, { 
                color: isLowStock ? theme.colors.error : theme.colors.success 
              }]}>
                {stock.quantity} {stock.unit}
              </Text>
              <Text style={[styles.thresholdText, { color: theme.colors.neutral.textSecondary }]}>
                Seuil: {stock.lowStockThreshold} {stock.unit}
              </Text>
            </View>
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
              <Feather name="plus" size={20} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                Ajouter
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
              <Feather name="minus" size={20} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                Retirer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            Détails
          </Text>
          <View style={styles.detailsGrid}>
            {stock.location && (
              <View style={styles.infoItem}>
                <Feather name="map-pin" size={16} color={theme.colors.neutral.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.neutral.textPrimary }]}>
                  {stock.location}
                </Text>
              </View>
            )}

            {stock.supplier && (
              <View style={styles.infoItem}>
                <Feather name="truck" size={16} color={theme.colors.neutral.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.neutral.textPrimary }]}>
                  {stock.supplier}
                </Text>
              </View>
            )}

            {stock.price && (
              <View style={styles.infoItem}>
                <Feather name="tag" size={16} color={theme.colors.neutral.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.neutral.textPrimary }]}>
                  {stock.price} €/{stock.unit}
                </Text>
              </View>
            )}

            {stock.batchNumber && (
              <View style={styles.infoItem}>
                <Feather name="hash" size={16} color={theme.colors.neutral.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.neutral.textPrimary }]}>
                  Lot: {stock.batchNumber}
                </Text>
              </View>
            )}

            {stock.expiryDate && (
              <View style={styles.infoItem}>
                <Feather name="calendar" size={16} color={theme.colors.neutral.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.neutral.textPrimary }]}>
                  Exp: {new Date(stock.expiryDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {stock.qualityStatus && (
              <View style={styles.infoItem}>
                <MaterialCommunityIcons 
                  name="check-decagram" 
                  size={16} 
                  color={getQualityColor(stock.qualityStatus, theme)} 
                />
                <Text style={[styles.infoText, { color: theme.colors.neutral.textPrimary }]}>
                  Qualité: {getQualityLabel(stock.qualityStatus)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            Historique
          </Text>
          <View style={styles.section}>
            <StockHistoryComponent 
              history={history} 
              unit={stock.unit} 
              loading={historyLoading}
            />
          </View>
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
    marginTop: 24,
  },
  stockLevelBar: {
    height: 8,
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stockLevelFill: {
    height: '100%',
    borderRadius: 4,
  },
  stockLevelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stockLevelText: {
    fontSize: 18,
    fontWeight: '600',
  },
  thresholdText: {
    fontSize: 14,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
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
}));

export default StockDetail; 