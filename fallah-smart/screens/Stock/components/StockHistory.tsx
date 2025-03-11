import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StockHistory as StockHistoryType } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StockHistoryProps {
  history: StockHistoryType[];
}

export const StockHistory: React.FC<StockHistoryProps> = ({ history }) => {
  const theme = useTheme();

  const getHistoryTypeColor = (type: 'add' | 'remove') => {
    return type === 'add' 
      ? theme.colors.success 
      : theme.colors.error;
  };

  const getHistoryTypeIcon = (type: 'add' | 'remove') => {
    return type === 'add' 
      ? 'plus-circle-outline' 
      : 'minus-circle-outline';
  };

  const renderHistoryItem = ({ item }: { item: StockHistoryType }) => {
    return (
      <View style={[styles.historyCard, { 
        backgroundColor: theme.colors.neutral.surface,
        borderColor: theme.colors.neutral.border,
      }]}>
        <View style={styles.historyHeader}>
          <View style={styles.typeContainer}>
            <MaterialCommunityIcons 
              name={getHistoryTypeIcon(item.type)} 
              size={24} 
              color={getHistoryTypeColor(item.type)} 
            />
            <Text style={[styles.typeText, { color: getHistoryTypeColor(item.type) }]}>
              {item.type === 'add' ? 'إضافة' : 'سحب'}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: theme.colors.neutral.textSecondary }]}>
            {new Date(item.date).toLocaleDateString('ar-SA')}
          </Text>
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.colors.neutral.border }]} />
        
        <View style={styles.detailsContainer}>
          <Text style={[styles.quantityLabel, { color: theme.colors.neutral.textSecondary }]}>
            الكمية:
          </Text>
          <Text style={[styles.quantityValue, { color: theme.colors.neutral.textPrimary }]}>
            {item.quantity}
          </Text>
        </View>
        
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={[styles.notesLabel, { color: theme.colors.neutral.textSecondary }]}>
              ملاحظات:
            </Text>
            <Text style={[styles.notesValue, { color: theme.colors.neutral.textPrimary }]}>
              {item.notes}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!history || history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="history" 
          size={48} 
          color={theme.colors.neutral.textSecondary} 
        />
        <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
          لا يوجد سجل حركة للمخزون
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={renderHistoryItem}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  historyCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dateText: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  quantityLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  notesValue: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default StockHistory; 