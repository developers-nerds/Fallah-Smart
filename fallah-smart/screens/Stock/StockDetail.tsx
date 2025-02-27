import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { StockItem, StockHistory, StockCategory } from './types';
import { useStock } from '../../context/StockContext';
import { Feather } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../navigation/StockNavigator';
import { createThemedStyles } from '../../utils/createThemedStyles';
import { FeatherNames } from '../../types/icons';

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
  unit
}: { 
  visible: boolean; 
  onClose: () => void; 
  onConfirm: (quantity: number) => void;
  type: 'add' | 'remove';
  currentQuantity: number;
  unit: string;
}) => {
  const [quantity, setQuantity] = useState('');
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.neutral.textPrimary }]}>
            {type === 'add' ? 'Ajouter au stock' : 'Retirer du stock'}
          </Text>
          <TextInput
            style={[styles.modalInput, { 
              backgroundColor: theme.colors.neutral.background,
              color: theme.colors.neutral.textPrimary 
            }]}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="Entrer la quantité"
            placeholderTextColor={theme.colors.neutral.textSecondary}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]} 
              onPress={() => {
                const num = Number(quantity);
                if (num > 0) {
                  onConfirm(num);
                  onClose();
                  setQuantity('');
                }
              }}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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

export const StockDetail = ({ route, navigation }: StockDetailProps) => {
  const theme = useTheme();
  const { stockId } = route.params;
  const { stocks, addStockQuantity, removeStockQuantity } = useStock();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const stock = stocks.find(s => s.id === stockId);
  if (!stock) return <Text>Stock not found</Text>;

  const isLowStock = stock.quantity <= stock.lowStockThreshold;

  const leafIcon: FeatherNames = 'leaf';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <ScrollView>
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
              <View 
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
              style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
              onPress={() => setShowAddModal(true)}
            >
              <Feather name="plus-circle" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Ajouter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
              onPress={() => setShowRemoveModal(true)}
            >
              <Feather name="minus-circle" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Retirer</Text>
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
          {stock.history.map((historyItem) => (
            <HistoryItem 
              key={historyItem.id} 
              history={historyItem}
              unit={stock.unit}
            />
          ))}
        </View>
      </ScrollView>

      <QuantityModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={(quantity) => addStockQuantity(stock.id, quantity)}
        type="add"
        currentQuantity={stock.quantity}
        unit={stock.unit}
      />

      <QuantityModal
        visible={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={(quantity) => removeStockQuantity(stock.id, quantity)}
        type="remove"
        currentQuantity={stock.quantity}
        unit={stock.unit}
      />
    </View>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontWeight: '500',
  },
  stockLevelContainer: {
    marginTop: 16,
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
    fontSize: 16,
    fontWeight: '600',
  },
  thresholdText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  detailsGrid: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
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
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  historyItem: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyDate: {
    marginLeft: 8,
    fontSize: 14,
  },
  historyQuantity: {
    fontSize: 16,
    fontWeight: '500',
  },
})); 