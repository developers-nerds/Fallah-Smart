import React, { useEffect, useState } from 'react';
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
import { useFertilizer } from '../../../context/FertilizerContext';
import { StockFertilizer } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';

const ITEMS_PER_PAGE = 10;

type FertilizerListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'FertilizerList'>;
};

const FertilizerListScreen: React.FC<FertilizerListScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { fertilizers, fetchFertilizers, loading } = useFertilizer();
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchFertilizers();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchFertilizers();
      setCurrentPage(1);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحديث قائمة الأسمدة');
    } finally {
      setRefreshing(false);
    }
  }, [fetchFertilizers]);

  const loadMoreItems = () => {
    if (isLoadingMore || fertilizers.length <= currentPage * ITEMS_PER_PAGE) return;
    
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
    setIsLoadingMore(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'organic':
        return '🌱';
      case 'inorganic':
        return '⚗️';
      case 'bio':
        return '🧪';
      default:
        return '💩';
    }
  };

  const renderFertilizerItem = ({ item }: { item: StockFertilizer }) => {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.neutral.surface }]}
        onPress={() => navigation.navigate('FertilizerDetail', { fertilizerId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
            <Text style={[styles.cardTitle, { color: theme.colors.neutral.textPrimary }]}>
              {item.name}
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
              تاريخ الصلاحية:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {new Date(item.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {item.quantity <= item.minQuantityAlert && (
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

  const paginatedData = fertilizers.slice(0, currentPage * ITEMS_PER_PAGE);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          الأسمدة
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={() => navigation.navigate('AddFertilizer')}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={paginatedData}
        renderItem={renderFertilizerItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.base]}
          />
        }
        onEndReached={loadMoreItems}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💩</Text>
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              لا يوجد أسمدة
            </Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.colors.primary.base} />
            </View>
          ) : null
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
  list: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    gap: 4,
    marginTop: 12,
    padding: 8,
    borderRadius: 6,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
}));

export default FertilizerListScreen; 