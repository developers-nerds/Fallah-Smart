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
  Dimensions,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { usePesticide } from '../../../context/PesticideContext';
import { StockPesticide } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const ITEMS_PER_PAGE = 10;
const { width } = Dimensions.get('window');

type PesticideListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'PesticideList'>;
};

const PesticideListScreen: React.FC<PesticideListScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { pesticides, fetchPesticides, loading } = usePesticide();
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchPesticides();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPesticides();
      setCurrentPage(1);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحديث قائمة المبيدات');
    } finally {
      setRefreshing(false);
    }
  }, [fetchPesticides]);

  const loadMoreItems = () => {
    if (isLoadingMore || pesticides.length <= currentPage * ITEMS_PER_PAGE) return;
    
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
    setIsLoadingMore(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'insecticide':
        return '🐛';
      case 'herbicide':
        return '🌿';
      case 'fungicide':
        return '🍄';
      case 'rodenticide':
        return '🐭';
      default:
        return '🧪';
    }
  };

  const renderPesticideItem = ({ item, index }: { item: StockPesticide; index: number }) => {
    const isLowStock = item.quantity <= item.minQuantityAlert;
    
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 100)}
        style={[styles.itemContainer, { backgroundColor: theme.colors.neutral.surface }]}
      >
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => navigation.navigate('PesticideDetail', { pesticideId: item.id })}
        >
          <View style={styles.itemHeader}>
            <View style={styles.typeIconContainer}>
              <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
            </View>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
                {item.name}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>
                {item.type}
              </Text>
            </View>
            {item.isNatural && (
              <View style={[styles.naturalBadge, { backgroundColor: theme.colors.success }]}>
                <Feather name="check-circle" size={12} color="#FFF" />
                <Text style={styles.naturalText}>طبيعي</Text>
              </View>
            )}
          </View>

          <View style={styles.itemDetails}>
            <View style={styles.quantityContainer}>
              <MaterialCommunityIcons
                name="scale"
                size={20}
                color={theme.colors.neutral.textSecondary}
              />
              <Text style={[styles.quantity, { color: theme.colors.neutral.textPrimary }]}>
                {item.quantity} {item.unit}
              </Text>
            </View>

            {item.expiryDate && (
              <View style={styles.expiryContainer}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={20}
                  color={theme.colors.neutral.textSecondary}
                />
                <Text style={[styles.expiry, { color: theme.colors.neutral.textSecondary }]}>
                  {new Date(item.expiryDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {isLowStock && (
            <View style={[styles.alertContainer, { backgroundColor: theme.colors.error }]}>
              <MaterialCommunityIcons name="alert" size={16} color="#FFF" />
              <Text style={styles.alertText}>
                مخزون منخفض
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.colors.neutral.background }]}>
      <MaterialCommunityIcons
        name="flask-empty-outline"
        size={64}
        color={theme.colors.neutral.textSecondary}
      />
      <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
        لا توجد مبيدات في المخزون
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary.base }]}
        onPress={() => navigation.navigate('AddPesticide')}
      >
        <Feather name="plus" size={24} color="#FFF" />
        <Text style={styles.addButtonText}>إضافة مبيد جديد</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={theme.colors.primary.base} />
      </View>
    );
  };

  const paginatedData = pesticides.slice(0, currentPage * ITEMS_PER_PAGE);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          المبيدات
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={() => navigation.navigate('AddPesticide')}
        >
          <Feather name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={paginatedData}
        renderItem={renderPesticideItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreItems}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeIcon: {
    fontSize: 24,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
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
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '500',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiry: {
    fontSize: 14,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  alertText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
});

export default PesticideListScreen;