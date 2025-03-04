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
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
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

type PesticideDetailProps = {
  route: RouteProp<StockStackParamList, 'PesticideDetail'>;
  navigation: StackNavigationProp<StockStackParamList, 'PesticideDetail'>;
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
    removePesticideQuantity
  } = usePesticide();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useSharedValue(0);

  const pesticide = pesticides.find(p => p.id === pesticideId);

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

  if (loading && !pesticide) {
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
          name="flask-empty-outline" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <CustomButton 
          title="Réessayer" 
          onPress={refreshPesticides}
          variant="primary"
        />
      </View>
    );
  }

  if (!pesticide) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <MaterialCommunityIcons 
          name="flask-empty-outline" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>Pesticide non trouvé</Text>
        <CustomButton 
          title="Retour" 
          onPress={() => navigation.goBack()}
          variant="primary"
        />
      </View>
    );
  }

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
          Détails du Pesticide
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
          <View style={styles.titleContainer}>
            <View style={styles.titleContent}>
              <MaterialCommunityIcons
                name="flask-outline"
                size={32}
                color={pesticide.isNatural ? theme.colors.success : theme.colors.accent.base}
              />
              <Text style={[styles.name, { color: theme.colors.neutral.textPrimary }]}>
                {pesticide.name}
              </Text>
            </View>
            {pesticide.isNatural && (
              <View style={[styles.naturalBadge, { backgroundColor: theme.colors.success }]}>
                <Feather name="leaf" size={12} color="#FFF" />
                <Text style={styles.naturalText}>Naturel</Text>
              </View>
            )}
          </View>

          <View style={styles.stockLevelContainer}>
            <View style={styles.stockLevelHeader}>
              <MaterialCommunityIcons
                name="package-variant"
                size={24}
                color={pesticide.quantity <= pesticide.lowStockThreshold 
                  ? theme.colors.error 
                  : theme.colors.success}
              />
              <Text style={[styles.stockLevelTitle, { 
                color: pesticide.quantity <= pesticide.lowStockThreshold 
                  ? theme.colors.error 
                  : theme.colors.success 
              }]}>
                Stock actuel
              </Text>
            </View>
            <View style={styles.stockLevelBar}>
              <Animated.View 
                style={[
                  styles.stockLevelFill,
                  { 
                    backgroundColor: pesticide.quantity <= pesticide.lowStockThreshold 
                      ? theme.colors.error 
                      : theme.colors.success,
                    width: `${Math.min((pesticide.quantity / pesticide.lowStockThreshold) * 100, 100)}%`
                  }
                ]} 
              />
            </View>
            <View style={styles.stockLevelInfo}>
              <View style={styles.quantityContainer}>
                <Text style={[styles.stockLevelText, { 
                  color: pesticide.quantity <= pesticide.lowStockThreshold 
                    ? theme.colors.error 
                    : theme.colors.success 
                }]}>
                  {pesticide.quantity}
                </Text>
                <Text style={[styles.unitText, { 
                  color: pesticide.quantity <= pesticide.lowStockThreshold 
                    ? theme.colors.error 
                    : theme.colors.success 
                }]}>
                  {pesticide.unit}
                </Text>
              </View>
              <View style={styles.thresholdContainer}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={16}
                  color={theme.colors.neutral.textSecondary}
                />
                <Text style={[styles.thresholdText, { color: theme.colors.neutral.textSecondary }]}>
                  Seuil: {pesticide.lowStockThreshold} {pesticide.unit}
                </Text>
              </View>
            </View>
            {pesticide.quantity <= pesticide.lowStockThreshold && (
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
                Ajouter du stock
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
                Retirer du stock
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.neutral.textSecondary }]}>
                Informations générales
              </Text>
              <View style={[styles.infoItem, { backgroundColor: theme.colors.neutral.background }]}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary.base }]}>
                  <MaterialCommunityIcons name="bug-outline" size={20} color="#FFF" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.colors.neutral.textSecondary }]}>
                    Cible
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.colors.neutral.textPrimary }]}>
                    {pesticide.target || 'Non spécifié'}
                  </Text>
                </View>
              </View>

              {pesticide.waitingPeriod && (
                <View style={[styles.infoItem, { backgroundColor: theme.colors.neutral.background }]}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning }]}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#FFF" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.neutral.textSecondary }]}>
                      Délai avant récolte
                    </Text>
                    <Text style={[styles.infoValue, { color: theme.colors.warning }]}>
                      {pesticide.waitingPeriod} jours
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.neutral.textSecondary }]}>
                Sécurité et application
              </Text>
              {pesticide.safetyInstructions && (
                <View style={[styles.infoItem, { backgroundColor: theme.colors.neutral.background }]}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.colors.error }]}>
                    <MaterialCommunityIcons name="shield-alert" size={20} color="#FFF" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.neutral.textSecondary }]}>
                      Instructions de sécurité
                    </Text>
                    <Text style={[styles.infoValue, { color: theme.colors.neutral.textPrimary }]}>
                      {pesticide.safetyInstructions}
                    </Text>
                  </View>
                </View>
              )}

              {pesticide.applicationInstructions && (
                <View style={[styles.infoItem, { backgroundColor: theme.colors.neutral.background }]}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent.base }]}>
                    <MaterialCommunityIcons name="spray" size={20} color="#FFF" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: theme.colors.neutral.textSecondary }]}>
                      Instructions d'application
                    </Text>
                    <Text style={[styles.infoValue, { color: theme.colors.neutral.textPrimary }]}>
                      {pesticide.applicationInstructions}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Animated.ScrollView>

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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  } as ViewStyle,
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  titleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  name: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
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
    fontFamily: theme.fonts.medium,
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
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.bold,
  },
  infoGrid: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  infoSection: {
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
    backgroundColor: 'transparent',
  },
  confirmButton: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  } as ViewStyle,
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
}));

export default PesticideDetail;