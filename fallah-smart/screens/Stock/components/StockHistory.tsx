import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StockHistory as StockHistoryType } from '../types';
import { Feather } from '@expo/vector-icons';

interface StockHistoryComponentProps {
  history: StockHistoryType[];
  unit: string;
  loading: boolean;
}

const getTypeInfo = (type: string) => {
  switch (type) {
    case 'add':
      return { icon: 'plus-circle', label: 'Ajout', color: '#4CAF50' };
    case 'remove':
      return { icon: 'minus-circle', label: 'Retrait', color: '#F44336' };
    case 'expired':
      return { icon: 'alert-circle', label: 'Expiré', color: '#FF9800' };
    case 'damaged':
      return { icon: 'alert-octagon', label: 'Endommagé', color: '#F44336' };
    default:
      return { icon: 'activity', label: 'Modification', color: '#2196F3' };
  }
};

export const StockHistoryComponent: React.FC<StockHistoryComponentProps> = ({ history, unit, loading }) => {
  const theme = useTheme();

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return typeof date === 'string' ? date : date.toISOString();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather 
          name="clock" 
          size={48} 
          color={theme.colors.neutral.textSecondary} 
        />
        <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
          Aucun historique disponible
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {history.map((item) => {
        const { icon, label, color } = getTypeInfo(item.type);
        
        return (
          <View 
            key={item.id} 
            style={[styles.historyItem, { backgroundColor: theme.colors.neutral.surface }]}
          >
            <View style={styles.historyHeader}>
              <View style={styles.typeContainer}>
                <Feather name={icon as any} size={20} color={color} />
                <Text style={[styles.typeText, { color }]}>{label}</Text>
              </View>
              <Text style={[styles.dateText, { color: theme.colors.neutral.textSecondary }]}>
                {formatDate(item.date)}
              </Text>
            </View>
            
            <View style={styles.detailsContainer}>
              <Text style={[styles.quantityText, { color: theme.colors.neutral.textPrimary }]}>
                {item.type === 'add' ? '+' : '-'} {item.quantity} {unit}
              </Text>
              {item.notes && (
                <Text style={[styles.notesText, { color: theme.colors.neutral.textSecondary }]}>
                  {item.notes}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 16,
  },
  historyItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
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
    gap: 8,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
  },
  detailsContainer: {
    gap: 4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
}); 