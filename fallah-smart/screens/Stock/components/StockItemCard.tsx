import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StockItem } from '../types';
import { useTheme } from '../../../context/ThemeContext';
import { Feather } from '@expo/vector-icons';

interface StockItemCardProps {
  item: StockItem;
  onPress: () => void;
}

const getCategoryLabel = (category: string): string => {
  const categories = {
    seeds: 'Semences',
    fertilizer: 'Engrais',
    harvest: 'Récoltes',
    feed: 'Aliments',
    pesticide: 'Pesticides',
    equipment: 'Équipement',
    tools: 'Outils'
  };
  return categories[category] || category;
};

const getQualityColor = (quality: string | undefined, theme: any) => {
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

const getQualityLabel = (quality: string | undefined): string => {
  const qualities = {
    good: 'Bon',
    medium: 'Moyen',
    poor: 'Mauvais'
  };
  return qualities[quality || ''] || 'Non défini';
};

export const StockItemCard = ({ item, onPress }: StockItemCardProps) => {
  const theme = useTheme();
  const isLowStock = item.quantity <= item.lowStockThreshold;

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.colors.neutral.surface }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={[styles.name, { color: theme.colors.neutral.textPrimary }]}>
          {item.name}
        </Text>
        <View style={[styles.badge, { backgroundColor: theme.colors.primary.light }]}>
          <Text style={[styles.badgeText, { color: theme.colors.primary.base }]}>
            {getCategoryLabel(item.category)}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.quantityContainer}>
          <Text style={[
            styles.quantity, 
            { color: isLowStock ? theme.colors.error : theme.colors.neutral.textPrimary }
          ]}>
            {item.quantity} {item.unit}
            {isLowStock && (
              <Feather 
                name="alert-triangle" 
                size={16} 
                color={theme.colors.error} 
                style={styles.alertIcon}
              />
            )}
          </Text>
          {item.location && (
            <Text style={[styles.location, { color: theme.colors.neutral.textSecondary }]}>
              <Feather name="map-pin" size={12} /> {item.location}
            </Text>
          )}
        </View>

        <View style={styles.infoContainer}>
          {item.qualityStatus && (
            <Text style={[
              styles.quality, 
              { color: getQualityColor(item.qualityStatus, theme) }
            ]}>
              {getQualityLabel(item.qualityStatus)}
            </Text>
          )}
          {item.expiryDate && (
            <Text style={[styles.expiry, { color: theme.colors.neutral.textSecondary }]}>
              Exp: {new Date(item.expiryDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  quantityContainer: {
    flex: 1,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '500',
  },
  location: {
    fontSize: 12,
    marginTop: 4,
  },
  infoContainer: {
    alignItems: 'flex-end',
  },
  quality: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  expiry: {
    fontSize: 12,
  },
  alertIcon: {
    marginLeft: 4,
  },
}); 