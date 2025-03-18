import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useHarvest } from '../../../context/HarvestContext';
import { StockHarvest } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { HARVEST_TYPES } from './constants';

const ITEMS_PER_PAGE = 10;

type HarvestListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'HarvestList'>;
};

type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;

const getCategoryIcon = (type: string): string => {
  if (type === 'vegetable') return '🥕';
  if (type === 'fruit') return '🍎';
  if (type === 'grain') return '🌾';
  if (type === 'herb') return '🌿';
  return '🌱';
};

const getTypeIcon = (type: string): MaterialIconName => {
  if (type === 'vegetable') return 'carrot';
  if (type === 'fruit') return 'fruit-cherries';
  if (type === 'grain') return 'grain';
  if (type === 'herb') return 'grass';
  return 'sprout';
};

const HarvestListScreen: React.FC<HarvestListScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { harvests, fetchHarvests, loading, error } = useHarvest();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHarvests();
    setRefreshing(false);
  }, [fetchHarvests]);

  useEffect(() => {
    fetchHarvests();
  }, [fetchHarvests]);

  const handleLoadMore = () => {
    if (loadingMore || harvests.length <= page * pageSize) return;
    setLoadingMore(true);
    setPage(prevPage => prevPage + 1);
    setLoadingMore(false);
  };

  const renderHarvestItem = ({ item }: { item: StockHarvest }) => {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.neutral.surface }]}
        onPress={() => navigation.navigate('HarvestDetail', { harvestId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.typeIcon}>{getCategoryIcon(item.type)}</Text>
            <Text style={[styles.cardTitle, { color: theme.colors.neutral.textPrimary }]}>
              {item.cropName}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={theme.colors.neutral.textSecondary}
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              الكمية:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {item.quantity} {item.unit}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              السعر:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {item.price} د.أ
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              تاريخ الحصاد:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {new Date(item.harvestDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {(item.minQuantityAlert !== undefined && item.quantity <= item.minQuantityAlert && item.minQuantityAlert > 0) && (
          <View style={[styles.alert, { backgroundColor: theme.colors.error.light }]}>
            <MaterialCommunityIcons
              name="alert"
              size={16}
              color={theme.colors.error.dark}
            />
            <Text style={[styles.alertText, { color: theme.colors.error.dark }]}>
              المخزون منخفض
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary.base} />
      </View>
    );
  };

  if (loading && !refreshing && !loadingMore) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <Text style={{ color: theme.colors.error.base }}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={{ color: theme.colors.primary.base }}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          المحاصيل
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={() => navigation.navigate('AddHarvest')}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={harvests.slice(0, page * pageSize)}
        renderItem={renderHarvestItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.base]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="sprout"
              size={48}
              color={theme.colors.neutral.textSecondary}
            />
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              لا توجد محاصيل
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.neutral.textTertiary }]}>
              قم بإضافة محاصيل جديدة للبدء
            </Text>
          </View>
        }
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.error.border,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  footerLoader: {
    marginVertical: 16,
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 16,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

export default HarvestListScreen; 