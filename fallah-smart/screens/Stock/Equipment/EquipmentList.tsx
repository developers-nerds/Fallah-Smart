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
  TextInput,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEquipment } from '../../../context/EquipmentContext';
import { StockEquipment } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { FAB } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { TextInput as GestureTextInput } from 'react-native-gesture-handler';

const ITEMS_PER_PAGE = 10;

type EquipmentListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'EquipmentList'>;
};

const EquipmentListScreen: React.FC<EquipmentListScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { equipment, fetchEquipment, loading } = useEquipment();
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEquipment();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchEquipment();
      setCurrentPage(1);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحديث قائمة المعدات');
    } finally {
      setRefreshing(false);
    }
  }, [fetchEquipment]);

  const loadMoreItems = () => {
    if (isLoadingMore || equipment.length <= currentPage * ITEMS_PER_PAGE) return;
    
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
    setIsLoadingMore(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tractor':
        return '🚜';
      case 'harvester':
        return '🌾';
      case 'irrigation':
        return '💧';
      case 'storage':
        return '🏭';
      default:
        return '🔧';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.success.base;
      case 'inactive':
        return theme.colors.error.base;
      case 'maintenance':
        return theme.colors.warning.base;
      default:
        return theme.colors.neutral.textSecondary;
    }
  };

  const renderEquipmentItem = ({ item, index }: { item: StockEquipment, index: number }) => {
    return (
      <Animatable.View 
        animation="fadeInUp"
        duration={500}
        delay={index * 100}
      >
        <TouchableOpacity
          style={[styles.card, { 
            backgroundColor: theme.colors.neutral.surface,
            borderLeftWidth: 4,
            borderLeftColor: getStatusColor(item.status),
            shadowColor: '#000',
          }]}
          onPress={() => navigation.navigate('EquipmentDetail', { equipmentId: item.id })}
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
                الحالة:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {item.status}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                تاريخ الصيانة:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {new Date(item.lastMaintenanceDate).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الموقع:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {item.location}
              </Text>
            </View>
          </View>

          {item.status === 'maintenance' && (
            <View style={[styles.alert, { backgroundColor: theme.colors.warning.light }]}>
              <MaterialCommunityIcons
                name="alert"
                size={16}
                color={theme.colors.warning.dark}
              />
              <Text style={[styles.alertText, { color: theme.colors.warning.dark }]}>
                تحتاج إلى صيانة
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  const paginatedData = equipment.slice(0, currentPage * ITEMS_PER_PAGE);
  const filteredData = paginatedData.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={[styles.header, { 
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.neutral.border 
      }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          المعدات
        </Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.neutral.surface }]}>
        <GestureTextInput
          style={[styles.searchInput, { color: theme.colors.neutral.textPrimary }]}
          placeholder="ابحث عن المعدات..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.neutral.textSecondary}
        />
        <MaterialCommunityIcons 
          name="magnify" 
          size={24} 
          color={theme.colors.neutral.textSecondary} 
        />
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderEquipmentItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMoreItems}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="tools" 
              size={48} 
              color={theme.colors.neutral.textSecondary} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              لا توجد معدات
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddEquipment')}
      >
        <MaterialCommunityIcons name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    margin: 16,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 8,
    height: 48,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
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
  separator: {
    height: 12,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default EquipmentListScreen; 