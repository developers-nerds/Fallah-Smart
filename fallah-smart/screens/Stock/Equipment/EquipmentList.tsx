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
  Dimensions
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useEquipment } from '../../../context/EquipmentContext';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { FAB, Card, Button, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../utils/date';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUS, OPERATIONAL_STATUS, EquipmentType, EquipmentStatus, OperationalStatus } from './constants';
import { StockEquipment } from '../../Stock/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { TextInput } from '../../../components/TextInput';
import { SwipeableRow } from '../../../components/SwipeableRow';
import axios from 'axios';
import { storage } from '../../../utils/storage';

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
  onDelete: (id: string) => void;
  index: number;
}

const EquipmentListScreen: React.FC<EquipmentListScreenProps> = ({ navigation }) => {
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

  // Add debugging logs
  useEffect(() => {
    console.log('Equipment state updated:', {
      contextCount: contextEquipment.length,
      localCount: localEquipment.length,
      contextLoading,
      loading,
      contextError,
      localError
    });
    
    if (localEquipment.length > 0) {
      console.log('First local equipment item:', JSON.stringify(localEquipment[0], null, 2));
    } else if (contextEquipment.length > 0) {
      console.log('First context equipment item:', JSON.stringify(contextEquipment[0], null, 2));
    } else {
      console.log('No equipment items available in either local or context state');
    }
  }, [contextEquipment, localEquipment, contextLoading, loading, contextError, localError]);

  // Add mock data for testing when no data is available
  const MOCK_EQUIPMENT: StockEquipment[] = [
    {
      id: 'mock-1',
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
      userId: '1'
    },
    {
      id: 'mock-2',
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
      userId: '1'
    },
    {
      id: 'mock-3',
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
      userId: '1'
    },
    {
      id: 'mock-4',
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
      userId: '1'
    },
    {
      id: 'mock-5',
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
      userId: '1'
    }
  ];

  // Direct API fetch function similar to FertilizerList
  const fetchEquipmentDirectly = useCallback(async () => {
    try {
      const tokens = await storage.getTokens();
      console.log('Tokens available:', tokens ? 'Yes' : 'No');
      
      const DIRECT_API_URL = `${process.env.EXPO_PUBLIC_API_URL}/stock/equipment`;
      console.log('Fetching equipment directly from:', DIRECT_API_URL);
      
      const response = await axios.get(DIRECT_API_URL, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
        },
        timeout: 10000
      });
      
      console.log('API Response Status:', response.status);
      console.log('Equipment fetched successfully, count:', response.data?.length || 0);
      
      return response.data;
    } catch (error) {
      console.error('Direct API fetch error:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:');
        console.error('- Status:', error.response?.status);
        console.error('- Response data:', error.response?.data);
        
        if (error.response?.status === 401) {
          console.log('Unauthorized, trying without token...');
          try {
            const DIRECT_API_URL = `${process.env.EXPO_PUBLIC_API_URL}/stock/equipment`;
            const fallbackResponse = await axios.get(DIRECT_API_URL, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000
            });
            
            console.log('Fallback API call successful, equipment count:', fallbackResponse.data?.length || 0);
            return fallbackResponse.data;
          } catch (fallbackError) {
            console.error('Fallback API call also failed:', fallbackError);
            throw fallbackError;
          }
        }
      }
      
      throw error;
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
          console.log('Fetched equipment data:', JSON.stringify(equipmentData, null, 2));
          
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
    navigation.navigate('AddEquipment');
  }, [navigation]);

  const handleViewEquipment = useCallback((id: string) => {
    navigation.navigate('EquipmentDetail', { equipmentId: id });
  }, [navigation]);

  const handleDeleteEquipment = useCallback((id: string) => {
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
      await deleteEquipment(id);
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

  // Function to handle loading more items
  const handleLoadMore = useCallback(() => {
    if (paginatedEquipment.length < filteredEquipment.length) {
      setPage(prev => prev + 1);
    }
  }, [paginatedEquipment.length, filteredEquipment.length]);

  // Function to render equipment type filters
  const renderTypeFilters = useCallback(() => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typesContainer}
      >
        <TouchableOpacity
          key="all"
          style={[
            styles.typeChip,
            { 
              backgroundColor: selectedType === null ? theme.colors.primary : theme.colors.background,
              borderColor: theme.colors.border,
            }
          ]}
          onPress={() => setSelectedType(null)}
        >
          <Text style={styles.typeIcon}>🔧</Text>
          <Text style={[
            styles.typeText,
            { color: selectedType === null ? '#FFF' : theme.colors.text }
          ]}>
            الكل
          </Text>
        </TouchableOpacity>
        
        {Object.entries(EQUIPMENT_TYPES).map(([type, { icon, name }]) => (
          <Animated.View
            key={type}
            entering={FadeInDown.springify().delay(100)}
          >
            <TouchableOpacity
              style={[
                styles.typeChip,
                { 
                  backgroundColor: selectedType === type ? theme.colors.primary : theme.colors.background,
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={() => setSelectedType(type as EquipmentType)}
            >
              <Text style={styles.typeIcon}>{icon}</Text>
              <Text style={[
                styles.typeText,
                { color: selectedType === type ? '#FFF' : theme.colors.text }
              ]}>
                {name}
              </Text>
              {selectedType === type && (
              <MaterialCommunityIcons 
                  name="close-circle" 
                  size={16} 
                  color="#FFF"
                  style={styles.clearIcon}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    );
  }, [selectedType, theme]);

  // Function to render the header
  const renderHeader = useCallback(() => (
    <Animated.View entering={FadeIn.springify()}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="البحث عن المعدات..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
              />
            </View>
      {renderTypeFilters()}
    </Animated.View>
  ), [searchQuery, renderTypeFilters]);

  // Function to render an equipment item
  const renderItem = useCallback(({ item, index }: { item: StockEquipment; index: number }) => {
    const equipmentType = EQUIPMENT_TYPES[item.type as EquipmentType] || { icon: '🔧', name: 'معدة' };
    const statusInfo = EQUIPMENT_STATUS[item.status as EquipmentStatus] || { icon: '❓', name: item.status, color: '#9E9E9E' };
    const operationalInfo = OPERATIONAL_STATUS[item.operationalStatus as OperationalStatus] || { icon: '❓', name: item.operationalStatus, color: '#9E9E9E' };

    const needsMaintenance = item.nextMaintenanceDate && new Date(item.nextMaintenanceDate) <= new Date();
    const isBroken = item.status === 'broken';
    const isInMaintenance = item.status === 'maintenance';

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={[
          styles.card,
          { 
            backgroundColor: theme.colors.background,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              },
              android: {
                elevation: 4,
              },
            }),
          }
        ]}
      >
        <SwipeableRow
          onDelete={() => handleDeleteEquipment(item.id)}
          onEdit={() => navigation.navigate('AddEquipment')}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => handleViewEquipment(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={[
                styles.iconContainer, 
                { 
                  backgroundColor: isBroken 
                    ? '#F44336' + '20' 
                    : isInMaintenance 
                      ? '#FFC107' + '20' 
                      : needsMaintenance
                        ? '#FF9800' + '20'
                        : '#E8F5E9' 
                }
              ]}>
                <Text style={styles.equipmentIconText}>{equipmentType.icon}</Text>
                {needsMaintenance && <Text style={styles.statusIndicator}>⚠️</Text>}
                {isBroken && <Text style={styles.statusIndicator}>❌</Text>}
          </View>

              <View style={styles.headerInfo}>
                <Text style={[styles.equipmentName, { color: theme.colors.text }]}>
                  {item.name}
                </Text>
                <View style={styles.subtitleContainer}>
                  <Text style={[styles.equipmentType, { color: theme.colors.text + '80' }]}>
                    {equipmentType.name}
                  </Text>
            </View>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.quantityContainer}>
                <Text style={[styles.equipmentQuantity, { color: theme.colors.primary }]}>
                  {item.quantity} وحدة
                </Text>
                {item.purchasePrice && (
                  <Text style={[styles.equipmentPrice, { color: theme.colors.primary }]}>
                    {item.purchasePrice} د.ج
                  </Text>
                )}
              </View>

              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                <MaterialCommunityIcons 
                  name={isBroken ? "alert" : isInMaintenance ? "tools" : "check-circle"} 
                  size={16} 
                  color={statusInfo.color} 
                />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.name}
                </Text>
            </View>

              {needsMaintenance && !isBroken && !isInMaintenance && (
                <View style={[styles.statusBadge, { backgroundColor: '#FF9800' + '20' }]}>
                  <MaterialCommunityIcons 
                    name="calendar-alert" 
                    size={16} 
                    color="#FF9800" 
                  />
                  <Text style={[styles.statusText, { color: '#FF9800' }]}>
                    بحاجة للصيانة
                  </Text>
            </View>
              )}

              {item.operationalStatus && (
                <View style={[styles.statusBadge, { backgroundColor: operationalInfo.color + '20' }]}>
                  <Text style={[styles.statusText, { color: operationalInfo.color }]}>
                    {operationalInfo.name}
                  </Text>
              </View>
            )}
          </View>
          </TouchableOpacity>
        </SwipeableRow>
      </Animated.View>
    );
  }, [theme, navigation, handleViewEquipment, handleDeleteEquipment]);

  // Render the "See More" button if there are more items to load
  const renderSeeMoreButton = useCallback(() => {
    if (paginatedEquipment.length < filteredEquipment.length) {
      return (
        <Animated.View 
          entering={FadeInDown.delay(300).springify()}
          style={styles.seeMoreButtonContainer}
        >
          <TouchableOpacity
            style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleLoadMore}
          >
            <Text style={styles.seeMoreText}>عرض المزيد ({filteredEquipment.length - paginatedEquipment.length} متبقية)</Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      );
    }
    return null;
  }, [paginatedEquipment.length, filteredEquipment.length, handleLoadMore, theme.colors.primary]);

  if (loading && !localEquipment.length && !contextEquipment.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          backgroundColor={theme.colors.background}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.loadingContainer}
          >
            <Text style={styles.equipmentIconLarge}>🔧</Text>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text + '80' }]}>
              جاري تحميل المعدات...
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if ((localError || contextError) && !localEquipment.length && !contextEquipment.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          backgroundColor={theme.colors.background}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.errorContainer}
          >
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={[styles.errorText, { color: 'red' }]}>
              حدث خطأ: {localError || contextError}
            </Text>
            <Text style={[styles.errorSubText, { color: theme.colors.text + '80' }]}>
              يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={onRefresh}
            >
              <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
              <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
      </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle="dark-content"
      />
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            المعدات ({filteredEquipment.length})
        </Text>
      </View>

      <FlashList
          data={paginatedEquipment}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderSeeMoreButton}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔧</Text>
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                لا توجد معدات في المخزون
              </Text>
              <Text style={[styles.emptySubText, { color: theme.colors.text + '80' }]}>
                يمكنك إضافة معدات جديدة عن طريق الضغط على زر الإضافة
              </Text>
              <TouchableOpacity
                style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary }]}
                onPress={onRefresh}
              >
                <Text style={styles.seeMoreText}>تحديث</Text>
                <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          estimatedItemSize={200}
      />

      <FAB
        icon="plus"
        onPress={handleAddEquipment}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
    paddingTop: 0,
  },
  searchInput: {
    marginBottom: 16,
  },
  typesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
      },
      android: {
    elevation: 2,
      },
    }),
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeIcon: {
    fontSize: 18,
  },
  clearIcon: {
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  equipmentIconText: {
    fontSize: 32,
  },
  equipmentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  equipmentType: {
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    flexWrap: 'wrap',
    gap: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  equipmentQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  equipmentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  emptySubText: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  equipmentIconLarge: {
    fontSize: 80,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    maxWidth: '80%',
  },
  errorSubText: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24,
    marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  seeMoreButtonContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
    width: '80%',
    alignSelf: 'center',
  },
  seeMoreText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default EquipmentListScreen;