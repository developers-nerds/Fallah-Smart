import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StockItem } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StockStatisticsProps {
  stocks: StockItem[];
}

export const StockStatistics: React.FC<StockStatisticsProps> = ({ stocks }) => {
  const theme = useTheme();

  const statistics = {
    animals: {
      total: stocks.filter(s => s.category === 'animals').reduce((acc, curr) => acc + curr.quantity, 0),
      types: stocks.filter(s => s.category === 'animals').length,
      lowStock: stocks.filter(s => s.category === 'animals' && curr.quantity <= (curr.lowStockThreshold || 0)).length
    },
    pesticides: {
      total: stocks.filter(s => s.category === 'pesticide').reduce((acc, curr) => acc + curr.quantity, 0),
      types: stocks.filter(s => s.category === 'pesticide').length,
      lowStock: stocks.filter(s => s.category === 'pesticide' && curr.quantity <= (curr.lowStockThreshold || 0)).length
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
        إحصائيات المخزون
      </Text>

      <View style={styles.cardsContainer}>
        {/* Animals Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.primary.light }]}>
          <MaterialCommunityIcons name="cow" size={32} color={theme.colors.primary.base} />
          <Text style={[styles.cardTitle, { color: theme.colors.neutral.textPrimary }]}>الحيوانات</Text>
          <Text style={[styles.cardValue, { color: theme.colors.primary.base }]}>
            {statistics.animals.total.toLocaleString('en-US')}
          </Text>
          <Text style={[styles.cardSubtext, { color: theme.colors.neutral.textSecondary }]}>
            {statistics.animals.types} نوع
          </Text>
          {statistics.animals.lowStock > 0 && (
            <Text style={[styles.warningText, { color: theme.colors.warning }]}>
              {statistics.animals.lowStock} مخزون منخفض
            </Text>
          )}
        </View>

        {/* Pesticides Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.accent.light }]}>
          <MaterialCommunityIcons name="bug" size={32} color={theme.colors.accent.base} />
          <Text style={[styles.cardTitle, { color: theme.colors.neutral.textPrimary }]}>المبيدات</Text>
          <Text style={[styles.cardValue, { color: theme.colors.accent.base }]}>
            {statistics.pesticides.total.toLocaleString('en-US')}
          </Text>
          <Text style={[styles.cardSubtext, { color: theme.colors.neutral.textSecondary }]}>
            {statistics.pesticides.types} نوع
          </Text>
          {statistics.pesticides.lowStock > 0 && (
            <Text style={[styles.warningText, { color: theme.colors.warning }]}>
              {statistics.pesticides.lowStock} مخزون منخفض
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'right',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    marginTop: 8,
  },
}); 