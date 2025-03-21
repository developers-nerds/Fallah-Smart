import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  I18nManager,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
  FlatList,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEquipment } from '../../../context/EquipmentContext';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { FAB } from '../../../components/FAB';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../utils/date';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUS, OPERATIONAL_STATUS, EquipmentType, EquipmentStatus, OperationalStatus } from './constants';
import { StockEquipment } from '../../Stock/types';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SearchBar } from '../../../components/SearchBar';
import { SwipeableRow } from '../../../components/SwipeableRow';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import { API_URL } from '../../../config/api';
import { withRetry } from '../../../services/api';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

const ITEMS_PER_PAGE = 4;

type EquipmentListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'EquipmentList'>;
};

interface EquipmentCardProps {
  equipment: StockEquipment;
  onPress: () => void;
  onDelete: (id: number) => void;
}

export const EquipmentListScreen = ({ navigation }: EquipmentListScreenProps) => {
  const theme = useTheme();
  const { equipment: contextEquipment, fetchEquipment, loading: contextLoading, error: contextError, deleteEquipment } = useEquipment();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<EquipmentType | null>(null);
  const [page, setPage] = useState(1);
  const { t } = useTranslation();
  const [localError, setLocalError] = useState<string | null>(null);

  // Add local state for equipment data
  const [localEquipment, setLocalEquipment] = useState<StockEquipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Add mock data for testing when no data is available
  const MOCK_EQUIPMENT: StockEquipment[] = [
    {
      id: 1,
      name: 'جرار زراعي',
      type: 'tractor',
      status: 'operational',
      operationalStatus: 'excellent',
      quantity: 1,
      purchaseDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serialNumber: 'TR-12345',
      manufacturer: 'John Deere',
      model: 'X9',
      yearOfManufacture: 2022,
      purchasePrice: 250000,
      location: 'المخزن الرئيسي',
      notes: 'جرار جديد للمزرعة',
      userId: 1
    },
    {
      id: 2,
      name: 'آلة حصاد',
      type: 'harvester',
      status: 'operational',
      operationalStatus: 'good',
      quantity: 1,
      purchaseDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serialNumber: 'HV-67890',
      manufacturer: 'Claas',
      model: 'Lexion 8900',
      yearOfManufacture: 2021,
      purchasePrice: 350000,
      location: 'المخزن الرئيسي',
      notes: 'آلة حصاد للحبوب',
      userId: 1
    },
    {
      id: 3,
      name: 'نظام ري بالتنقيط',
      type: 'irrigation_system',
      status: 'maintenance',
      operationalStatus: 'fair',
      quantity: 5,
      purchaseDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serialNumber: 'IR-54321',
      manufacturer: 'Netafim',
      model: 'DripNet PC',
      yearOfManufacture: 2020,
      purchasePrice: 15000,
      location: 'الحقل الشرقي',
      notes: 'نظام ري بالتنقيط للخضروات',
      userId: 1
    },
    {
      id: 4,
      name: 'مضخة مياه',
      type: 'pump',
      status: 'operational',
      operationalStatus: 'good',
      quantity: 2,
      purchaseDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serialNumber: 'PM-98765',
      manufacturer: 'Grundfos',
      model: 'CR 32',
      yearOfManufacture: 2021,
      purchasePrice: 12000,
      location: 'بئر المزرعة',
      notes: 'مضخة مياه للري',
      userId: 1
    },
    {
      id: 5,
      name: 'آلة بذر',
      type: 'seeder',
      status: 'operational',
      operationalStatus: 'excellent',
      quantity: 1,
      purchaseDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serialNumber: 'SD-45678',
      manufacturer: 'Amazone',
      model: 'Cirrus 6003',
      yearOfManufacture: 2022,
      purchasePrice: 180000,
      location: 'المخزن الرئيسي',
      notes: 'آلة بذر دقيقة',
      userId: 1
    }
  ];

  // Direct API fetch function
  const fetchEquipmentDirectly = useCallback(async () => {
    try {
      setLoading(true);
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        console.error('No auth token available');
        return [];
      }
      
      const response = await withRetry(async () => {
        return axios.get(`${API_URL}/stock/equipment`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        });
      }, 2, 1500);
      
      if (response && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching equipment:', error);
      if (error.message && error.message.includes('فشل الاتصال بالخادم')) {
        setLocalError(error.message);
      } else {
        setLocalError('فشل في جلب المعدات');
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('EquipmentListScreen mounted - fetching equipment');
    
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setRefreshing(true);
        setLocalError(null);
        
        // Try direct API call first
        let equipmentData;
        try {
          equipmentData = await fetchEquipmentDirectly();
        } catch (apiError) {
          console.error('API fetch failed, using mock data:', apiError);
          equipmentData = MOCK_EQUIPMENT;
        }
        
        if (isMounted && equipmentData) {
          console.log('Equipment fetched successfully, updating UI');
          
          // Store the equipment data locally
          setLocalEquipment(equipmentData || []);
          
          // Also update the context
          try {
            await fetchEquipment();
            console.log('Context updated with equipment data');
          } catch (contextError) {
            console.error('Failed to update context, but we have local data:', contextError);
          }
        }
      } catch (err) {
        console.error('Error directly loading equipment:', err);
        
        // Try context as fallback
        try {
          console.log('Falling back to context method...');
          await fetchEquipment();
          
          if (isMounted) {
            console.log('Context method succeeded');
            // If we have context data but no local data, use the context data
            if (contextEquipment.length > 0 && localEquipment.length === 0) {
              setLocalEquipment(contextEquipment);
            } else if (localEquipment.length === 0) {
              // If still no data, use mock data
              console.log('No data from API or context, using mock data');
              setLocalEquipment(MOCK_EQUIPMENT);
            }
          }
        } catch (contextErr) {
          console.error('Context method also failed:', contextErr);
          
          if (isMounted) {
            // Use mock data as last resort
            console.log('All methods failed, using mock data');
            setLocalEquipment(MOCK_EQUIPMENT);
            
            const errorMsg = err instanceof Error 
              ? err.message 
              : 'Failed to load equipment';
            setLocalError(errorMsg);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      console.log('EquipmentListScreen unmounting - cleaning up');
      isMounted = false;
    };
  }, [fetchEquipment, fetchEquipmentDirectly, contextEquipment]);

  const onRefresh = useCallback(async () => {
    console.log('Refreshing equipment list...');
    setRefreshing(true);
    setLocalError(null);
    
    try {
      // Try direct API first
      let equipmentData;
      try {
        equipmentData = await fetchEquipmentDirectly();
      } catch (apiError) {
        console.error('API refresh failed, using mock data:', apiError);
        equipmentData = MOCK_EQUIPMENT;
      }
      
      if (equipmentData) {
        setLocalEquipment(equipmentData);
      }
      
      // Then update context
      try {
    await fetchEquipment();
      } catch (contextError) {
        console.error('Failed to update context during refresh:', contextError);
      }
      
      setPage(1);
      console.log('Equipment refreshed successfully');
    } catch (err) {
      console.error('Error refreshing equipment:', err);
      // Use mock data as fallback
      setLocalEquipment(MOCK_EQUIPMENT);
      setLocalError('Failed to refresh equipment. Using mock data.');
    } finally {
    setRefreshing(false);
    }
  }, [fetchEquipment, fetchEquipmentDirectly]);

  const handleAddEquipment = useCallback(() => {
    navigation.navigate('AddEquipment', {});
  }, [navigation]);

  const handleViewEquipment = useCallback((id: number) => {
    navigation.navigate('EquipmentDetail', { equipmentId: id.toString() });
  }, [navigation]);

  const handleDeleteEquipment = useCallback((id: number) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه المعدة؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
    try {
              await deleteEquipment(id.toString());
              Alert.alert('نجاح', 'تم حذف المعدة بنجاح');
    } catch (err) {
      console.error('Error deleting equipment:', err);
              Alert.alert('خطأ', 'فشل في حذف المعدة');
            }
          },
        },
      ]
    );
  }, [deleteEquipment]);

  // Filter equipment based on search query and type
  const filteredEquipment = useMemo(() => {
    // Use local equipment data first, fall back to context data if local is empty
    const equipmentToUse = localEquipment.length > 0 ? localEquipment : contextEquipment;
    
    console.log('Filtering equipment:', {
      localCount: localEquipment.length,
      contextCount: contextEquipment.length,
      usingLocalData: localEquipment.length > 0,
      searchQuery,
      selectedType
    });
    
    let result = equipmentToUse;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          (EQUIPMENT_TYPES[item.type as EquipmentType]?.name || '').toLowerCase().includes(query)
      );
    }

    if (selectedType) {
      result = result.filter(item => item.type === selectedType);
    }

    console.log('Filtered equipment count:', result.length);
    return result.sort((a, b) => 
      new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime()
    );
  }, [localEquipment, contextEquipment, searchQuery, selectedType]);

  // Get paginated equipment
  const paginatedEquipment = useMemo(() => {
    return filteredEquipment.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredEquipment, page]);

  // Check if there are more items to load
  const hasMore = useMemo(() => {
    return paginatedEquipment.length < filteredEquipment.length;
  }, [paginatedEquipment.length, filteredEquipment.length]);

  // Function to handle loading more items
  const handleLoadMore = useCallback(() => {
    if (hasMore) {
      setPage(prev => prev + 1);
    }
  }, [hasMore]);

  // Add EquipmentCard component
  const EquipmentCard = ({ equipment, onPress, onDelete }: EquipmentCardProps) => {
    const equipmentType = EQUIPMENT_TYPES[equipment.type as EquipmentType] || { icon: '🔧', name: 'معدة' };
    const statusInfo = EQUIPMENT_STATUS[equipment.status as EquipmentStatus] || { icon: '❓', name: equipment.status, color: '#9E9E9E' };
    
    const needsMaintenance = equipment.nextMaintenanceDate && new Date(equipment.nextMaintenanceDate) <= new Date();
    const isBroken = equipment.status === 'broken';
    const isInMaintenance = equipment.status === 'maintenance';

    return (
      <Animated.View 
        entering={FadeInDown.duration(300).delay(150)}
        style={[styles.card, { backgroundColor: theme.colors.neutral.surface }]}
      >
        <TouchableOpacity 
          onPress={onPress}
          style={styles.cardContent}
        >
          <View style={styles.cardHeader}>
            <View style={[
              styles.iconContainer, 
              { backgroundColor: theme.colors.primary.surface }
            ]}>
              <Text style={styles.equipmentIconText}>
                {equipmentType.icon}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.titleContainer}>
                <Text style={[styles.equipmentName, { color: theme.colors.neutral.textPrimary }]}>
                  {equipment.name}
                </Text>
                <Text style={[styles.equipmentType, { color: theme.colors.neutral.textSecondary }]}>
                  {equipmentType.name}
                </Text>
              </View>
            </View>
            {equipment.quantity > 1 && (
              <View style={[
                styles.countBadge, 
                { backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success }
              ]}>
                <Text style={[styles.countText, { color: theme.colors.success }]}>
                  🔢 {equipment.quantity}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.cardFooter}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: statusInfo.color + '20' }
            ]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.icon} {statusInfo.name}
              </Text>
            </View>
            {equipment.purchaseDate && (
              <View style={styles.purchaseDateContainer}>
                <Text style={[styles.purchaseDate, { color: theme.colors.neutral.textSecondary }]}>
                  🗓️ {new Date(equipment.purchaseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Function to render the header
  const renderHeader = useCallback(() => {
    return (
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="البحث عن معدة..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[
              styles.filterButton,
              !selectedType && { backgroundColor: theme.colors.primary.base }
          ]}
          onPress={() => setSelectedType(null)}
        >
          <Text style={[
              styles.filterButtonText,
              !selectedType && { color: '#FFF' }
          ]}>
            الكل
          </Text>
        </TouchableOpacity>
          {Object.entries(EQUIPMENT_TYPES).map(([type, info]) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                selectedType === type && { backgroundColor: theme.colors.primary.base }
              ]}
              onPress={() => setSelectedType(type as EquipmentType)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedType === type && { color: '#FFF' }
              ]}>
                {info.icon} {info.name}
              </Text>
            </TouchableOpacity>
        ))}
      </ScrollView>
      </View>
    );
  }, [searchQuery, selectedType, theme]);

  // Function to render an equipment item
  const renderItem = useCallback(({ item }: { item: StockEquipment }) => {
    return (
      <EquipmentCard 
        equipment={item}
            onPress={() => handleViewEquipment(item.id)}
        onDelete={handleDeleteEquipment}
      />
    );
  }, [handleViewEquipment, handleDeleteEquipment]);

  // Function to render the footer
  const renderFooter = useCallback(() => {
    if (paginatedEquipment.length >= filteredEquipment.length) return null;
    
    return (
      <TouchableOpacity
        style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base }]}
        onPress={handleLoadMore}
      >
        <Text style={styles.seeMoreText}>عرض المزيد</Text>
        <MaterialCommunityIcons name="chevron-down" size={24} color="#FFF" />
          </TouchableOpacity>
    );
  }, [paginatedEquipment.length, filteredEquipment.length, handleLoadMore, theme]);

  // Function to render empty list component
  const renderListEmptyComponent = useCallback(() => {
      return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
          لا توجد معدات
        </Text>
          <TouchableOpacity
          style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={onRefresh}
          >
          <Text style={styles.seeMoreText}>تحديث</Text>
          <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
          </TouchableOpacity>
      </View>
      );
  }, [theme, onRefresh]);

  if (loading && !localEquipment.length && !contextEquipment.length) {
    return (
        <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={{ marginTop: 10, color: theme.colors.neutral.textSecondary }}>
              جاري تحميل المعدات...
            </Text>
        </View>
    );
  }

  if ((localError || contextError) && !localEquipment.length && !contextEquipment.length) {
    return (
        <View style={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
              حدث خطأ: {localError || contextError}
            </Text>
            <TouchableOpacity
          style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base, marginTop: 20 }]}
              onPress={onRefresh}
            >
          <Text style={styles.seeMoreText}>إعادة المحاولة</Text>
              <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
            </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        {localEquipment.length > 0 ? (
          <>
            <FlatList
          data={paginatedEquipment}
          renderItem={renderItem}
              keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderListEmptyComponent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[theme.colors.primary.base]}
                  tintColor={theme.colors.primary.base}
                />
              }
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              لم يتم العثور على معدات
              </Text>
              <TouchableOpacity
              style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base, marginTop: 20 }]}
                onPress={onRefresh}
              >
                <Text style={styles.seeMoreText}>تحديث</Text>
                <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
        )}
      <FAB
        icon="plus"
        onPress={handleAddEquipment}
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.primary.base
          }}
      />
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    marginBottom: 0,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipmentIconText: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  titleContainer: {
    gap: 2,
  },
  equipmentName: {
    fontSize: 22,
    fontWeight: '600',
  },
  equipmentType: {
    fontSize: 18,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  countText: {
    fontSize: 18,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '500',
  },
  purchaseDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  purchaseDate: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  seeMoreText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterButtonText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#666',
  },
});

export default EquipmentListScreen;