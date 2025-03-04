import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { StockItem, STOCK_CATEGORIES, STOCK_UNITS } from '../types';
import { useTheme } from '../../../context/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface StockItemCardProps {
  item: StockItem;
  onPress: () => void;
}

const getCategoryLabel = (category: string): string => {
  const categories = {
    seeds: 'البذور',
    fertilizer: 'الأسمدة',
    harvest: 'المحاصيل',
    feed: 'الأعلاف',
    pesticide: 'المبيدات',
    equipment: 'المعدات',
    tools: 'الأدوات',
    animals: 'الحيوانات'
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
    good: 'جيد',
    medium: 'متوسط',
    poor: 'سيء'
  };
  return qualities[quality || ''] || 'غير محدد';
};

const getCategoryIcon = (category: string): string => {
  const icons = {
    seeds: 'seed',
    fertilizer: 'watering-can',
    harvest: 'sprout',
    feed: 'food-variant',
    pesticide: 'bug',
    equipment: 'tractor',
    tools: 'tools',
    animals: 'cow'
  };
  return icons[category] || 'package-variant';
};

export const StockItemCard = ({ item, onPress }: StockItemCardProps) => {
  const theme = useTheme();
  const isLowStock = item.quantity <= (item.lowStockThreshold || 0);
  const daysUntilExpiry = item.expiryDate 
    ? Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.neutral.surface,
          borderColor: isLowStock ? theme.colors.warning : theme.colors.neutral.border,
          borderWidth: isLowStock ? 2 : 1,
        }
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name={getCategoryIcon(item.category)}
            size={32}
            color={theme.colors.primary.base}
            style={styles.categoryIcon}
          />
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: theme.colors.neutral.textPrimary }]}>
              {item.name}
            </Text>
            <Text style={[styles.category, { color: theme.colors.neutral.textSecondary }]}>
              {STOCK_CATEGORIES.find(cat => cat.value === item.category)?.label || item.category}
            </Text>
          </View>
        </View>
        {isLowStock && (
          <View style={[styles.lowStockBadge, { backgroundColor: theme.colors.warning }]}>
            <Feather name="alert-triangle" size={16} color={theme.colors.neutral.surface} />
            <Text style={[styles.lowStockText, { color: theme.colors.neutral.surface }]}>
              مخزون منخفض
            </Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.quantityContainer}>
          <View style={styles.quantityRow}>
            <MaterialCommunityIcons
              name="scale"
              size={24}
              color={theme.colors.neutral.textSecondary}
              style={styles.icon}
            />
            <Text style={[
              styles.quantity, 
              { color: isLowStock ? theme.colors.warning : theme.colors.neutral.textPrimary }
            ]}>
              {item.quantity.toLocaleString('en-US')} {STOCK_UNITS.find(unit => unit.value === item.unit)?.label || item.unit}
            </Text>
          </View>
          {item.location && (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color={theme.colors.neutral.textSecondary}
                style={styles.icon}
              />
              <Text style={[styles.location, { color: theme.colors.neutral.textSecondary }]}>
                {item.location}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          {item.qualityStatus && (
            <View style={styles.qualityRow}>
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={getQualityColor(item.qualityStatus, theme)}
                style={styles.icon}
              />
              <Text style={[
                styles.quality, 
                { color: getQualityColor(item.qualityStatus, theme) }
              ]}>
                {getQualityLabel(item.qualityStatus)}
              </Text>
            </View>
          )}
          {item.expiryDate && (
            <View style={styles.expiryRow}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={24}
                color={daysUntilExpiry && daysUntilExpiry <= 30 ? theme.colors.error : theme.colors.neutral.textSecondary}
                style={styles.icon}
              />
              <Text style={[
                styles.expiry, 
                { 
                  color: daysUntilExpiry && daysUntilExpiry <= 30 
                    ? theme.colors.error 
                    : theme.colors.neutral.textSecondary 
                }
              ]}>
                ينتهي في {new Date(item.expiryDate).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {daysUntilExpiry && daysUntilExpiry <= 30 && (
                  <Text style={{ color: theme.colors.error }}>
                    {' '}({daysUntilExpiry.toLocaleString('en-US')} يوم)
                  </Text>
                )}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    fontWeight: '500',
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  lowStockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  details: {
    gap: 12,
  },
  quantityContainer: {
    gap: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContainer: {
    gap: 8,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  quantity: {
    fontSize: 18,
    fontWeight: '600',
  },
  location: {
    fontSize: 14,
  },
  quality: {
    fontSize: 16,
    fontWeight: '500',
  },
  expiry: {
    fontSize: 14,
  },
}); 