import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SearchBar } from '../../../components/SearchBar';
import { FAB } from '../../../components/FAB';
import { TOOL_TYPES, TOOL_STATUS, TOOL_CONDITION, TOOL_ICONS, ToolType } from './constants';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import { withRetry } from '../../../services/api';
import { API_URL } from '../../../config/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 6;

type ToolListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'ToolList'>;
};

interface Tool {
  id: string;
  name: string;
  quantity: number;
  minQuantityAlert: number;
  category: ToolType;
  status: string;
  condition: string;
  purchaseDate: string | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  maintenanceInterval: number | null;
  brand: string;
  model: string;
  purchasePrice: number | null;
  replacementCost: number | null;
  storageLocation: string;
  assignedTo: string;
  maintenanceNotes: string;
  usageInstructions: string;
  safetyGuidelines: string;
  updatedAt: string;
}

const ToolListScreen: React.FC<ToolListScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>('الكل');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const REFRESH_THRESHOLD = 5000; // Only refresh if it's been at least 5 seconds since last fetch
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      setError(null);
      const tokens = await storage.getTokens();
      
      const response = await withRetry(async () => {
        return axios.get(
          `${API_URL}/stock/tools`,
          {
            headers: {
              'Authorization': `Bearer ${tokens?.access}`
            }
          }
        );
      }, 3, 1500);

      if (response.data) {
        setTools(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching tools:', error);
      if (error.message && error.message.includes('فشل الاتصال بالخادم')) {
        setError(error.message);
      } else {
        setError('فشل في تحميل الأدوات');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add useFocusEffect to reload data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('ToolListScreen focused - checking if refresh needed');
      
      const now = Date.now();
      // Only fetch if sufficient time has passed since the last fetch
      if (now - lastFetchTime > REFRESH_THRESHOLD) {
        console.log('Refreshing tool list - threshold passed');
        fetchTools();
        setLastFetchTime(now);
      } else {
        console.log('Skipping refresh - too soon since last fetch');
      }
      
      return () => {
        // Cleanup function when component is unfocused
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [lastFetchTime])
  );

  const handleRefresh = useCallback(async () => {
    if (refreshing) return; // Prevent multiple refresh calls
    
    setRefreshing(true);
    try {
      await fetchTools();
      setPage(1);
      setError(null);
    } catch (error) {
      console.error('Error refreshing tools:', error);
      setError('فشل في تحديث قائمة الأدوات');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (page !== 1) {
      searchTimeoutRef.current = setTimeout(() => {
        setPage(1);
        searchTimeoutRef.current = null;
      }, 300);
    }
  }, [page]);

  const categories = useMemo(() => {
    return ['الكل', ...Object.keys(TOOL_TYPES)];
  }, []);

  const filteredTools = useMemo(() => {
    return tools
      .filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.storageLocation?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = !selectedCategory || selectedCategory === 'الكل' || 
                               tool.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [tools, searchQuery, selectedCategory]);

  const paginatedTools = useMemo(() => {
    return filteredTools.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredTools, page]);

  const renderCategoryChip = useCallback(({ item }: { item: string }) => {
    const isSelected = selectedCategory === item;
    const typeInfo = item === 'الكل' ? {
      icon: '🛠️',
      color: theme.colors.primary.base,
      name: 'كل الأدوات'
    } : TOOL_TYPES[item as ToolType];
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          { 
            backgroundColor: isSelected ? typeInfo.color || theme.colors.primary.base : theme.colors.neutral.surface,
            borderColor: isSelected ? (typeInfo.color || theme.colors.primary.base) : theme.colors.neutral.border,
            ...Platform.select({
              ios: isSelected ? {
                shadowColor: typeInfo.color || theme.colors.primary.base,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
              } : {},
              android: isSelected ? {
                elevation: 2,
              } : {},
            }),
          }
        ]}
        onPress={() => setSelectedCategory(isSelected ? null : item)}
      >
        <Text style={styles.categoryIcon}>{typeInfo.icon}</Text>
        <Text style={[
          styles.categoryText,
          { color: isSelected ? '#FFF' : theme.colors.neutral.textSecondary }
        ]}>
          {item === 'الكل' ? 'كل الأدوات' : typeInfo.name}
        </Text>
        {isSelected && (
          <MaterialCommunityIcons 
            name="close-circle" 
            size={16} 
            color="#FFF" 
          />
        )}
      </TouchableOpacity>
    );
  }, [selectedCategory, theme]);

  const renderToolCard = useCallback(({ item, index }: { item: Tool; index: number }) => {
    const isLowStock = item.quantity <= item.minQuantityAlert;
    const toolType = TOOL_TYPES[item.category];
    const toolCondition = TOOL_CONDITION[item.condition as keyof typeof TOOL_CONDITION] || { name: item.condition, icon: '🔧', color: theme.colors.neutral.textSecondary };
    
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50).springify().damping(12)}
        style={[
          styles.card,
          { 
            backgroundColor: theme.colors.neutral.surface,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.neutral.textPrimary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.12,
                shadowRadius: 6,
              },
              android: {
                elevation: 3,
              },
            }),
          }
        ]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => navigation.navigate('ToolDetail', { toolId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: (toolType.color || theme.colors.primary.base) + '20' }
            ]}>
              <Text style={[styles.toolIcon, { color: toolType.color || theme.colors.primary.base }]}>
                {toolType.icon}
              </Text>
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={[styles.toolName, { color: theme.colors.neutral.textPrimary }]}>
                {item.name}
              </Text>
              <View style={styles.subtitleContainer}>
                <Text style={[styles.toolType, { color: toolType.color || theme.colors.primary.base }]}>
                  {toolType.name}
                </Text>
                
                {item.brand && (
                  <View style={styles.brandContainer}>
                    <MaterialCommunityIcons name="factory" size={14} color={theme.colors.neutral.textSecondary} />
                    <Text style={[styles.brandText, { color: theme.colors.neutral.textSecondary }]}>
                      {item.brand}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={[
              styles.conditionBadge, 
              { backgroundColor: (toolCondition.color || theme.colors.neutral.textSecondary) + '20' }
            ]}>
              <Text style={styles.conditionIcon}>{toolCondition.icon}</Text>
              <Text style={[
                styles.conditionText,
                { color: toolCondition.color || theme.colors.neutral.textSecondary }
              ]}>
                {toolCondition.name}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.quantityContainer}>
              <Text style={[styles.quantity, { 
                color: isLowStock ? theme.colors.error : theme.colors.neutral.textPrimary 
              }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.unitText, { color: theme.colors.neutral.textSecondary }]}>
                قطعة
              </Text>
            </View>

            {isLowStock && (
              <View style={[styles.statusBadge, { backgroundColor: theme.colors.error + '20' }]}>
                <MaterialCommunityIcons 
                  name="alert" 
                  size={16} 
                  color={theme.colors.error} 
                />
                <Text style={[styles.statusText, { color: theme.colors.error }]}>
                  مخزون منخفض
                </Text>
              </View>
            )}
            
            {item.storageLocation && (
              <View style={styles.locationContainer}>
                <MaterialCommunityIcons 
                  name="map-marker" 
                  size={16} 
                  color={theme.colors.neutral.textSecondary} 
                />
                <Text style={[styles.locationText, { color: theme.colors.neutral.textSecondary }]}>
                  {item.storageLocation}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [theme, navigation]);

  const renderHeader = useCallback(() => (
    <Animated.View entering={FadeIn.duration(300).springify()}>
      <View style={[styles.searchContainer, { 
        borderBottomWidth: 0,
        paddingBottom: theme.spacing.sm,
      }]}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="ابحث عن الأدوات..."
          style={[styles.searchBar, {
            backgroundColor: theme.colors.neutral.background,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.neutral.textPrimary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              },
              android: {
                elevation: 2,
              },
            }),
          }]}
        />
      </View>
      <View style={{paddingBottom: theme.spacing.sm}}>
        <FlatList
          data={categories}
          renderItem={renderCategoryChip}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesList}
          contentContainerStyle={styles.categoriesContent}
          keyExtractor={item => item}
          keyboardShouldPersistTaps="always"
        />
      </View>
    </Animated.View>
  ), [searchQuery, categories, renderCategoryChip, theme, handleSearchChange]);

  const renderFooter = useCallback(() => {
    if (paginatedTools.length >= filteredTools.length) return null;
    
    return (
      <TouchableOpacity
        style={[
          styles.seeMoreButton, 
          { 
            backgroundColor: theme.colors.primary.base,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.primary.base,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
              },
              android: {
                elevation: 3,
              },
            }),
          }
        ]}
        onPress={() => setPage(prev => prev + 1)}
      >
        <Text style={styles.seeMoreText}>عرض المزيد</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#FFF" />
      </TouchableOpacity>
    );
  }, [paginatedTools.length, filteredTools.length, theme]);

  const styles = createThemedStyles((theme) => {
    // Define fallback values for typography to prevent undefined errors
    const getTypographySize = (typePath: string, fallback: number) => {
      try {
        const paths = typePath.split('.');
        let result: any = theme; // Type as any to avoid index signature errors
        for (const path of paths) {
          if (!result || result[path] === undefined) return fallback;
          result = result[path];
        }
        return result;
      } catch (e) {
        return fallback;
      }
    };

    return {
      container: {
        flex: 1,
        backgroundColor: theme.colors.neutral.background,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.neutral.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.neutral.border,
      },
      searchContainer: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xs,
        backgroundColor: theme.colors.neutral.surface,
      },
      searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: theme.borderRadius.pill, // More rounded search bar
        paddingHorizontal: theme.spacing.md,
        height: 40,
      },
      categoriesList: {
        maxHeight: 48,
      },
      categoriesContent: {
        paddingHorizontal: 16,
        gap: 8,
      },
      categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.pill, // More rounded for better appearance
        gap: theme.spacing.xs,
        borderWidth: 1,
        marginHorizontal: 4,
      },
      categoryIcon: {
        fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
      },
      categoryText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
      },
      listContent: {
        padding: theme.spacing.md,
        gap: theme.spacing.md,
      },
      card: {
        borderRadius: theme.borderRadius.medium,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
        borderWidth: 0.5,
        borderColor: theme.colors.neutral.border + '50',
      },
      cardContent: {
        padding: theme.spacing.sm,
      },
      cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: theme.spacing.sm,
        gap: theme.spacing.xs,
      },
      iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
      },
      toolIcon: {
        fontSize: getTypographySize('typography.arabic.h4.fontSize', 24),
      },
      headerInfo: {
        flex: 1,
        gap: 2,
      },
      toolName: {
        fontSize: getTypographySize('typography.arabic.h4.fontSize', 22),
        fontWeight: '600',
      },
      subtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
      },
      toolType: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
      },
      brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      brandText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
      },
      conditionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.small,
        gap: 2,
      },
      conditionIcon: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
      },
      conditionText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
      },
      cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.neutral.border,
      },
      quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      quantity: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '600',
      },
      unitText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
      },
      statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        borderRadius: 4,
        gap: 4,
      },
      statusText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
      },
      locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
      locationText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
        gap: theme.spacing.lg,
      },
      emptyIcon: {
        fontSize: 48,
        color: theme.colors.neutral.textSecondary,
        marginBottom: theme.spacing.md,
      },
      emptyText: {
        fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
        color: theme.colors.neutral.textSecondary,
        textAlign: 'center',
      },
      centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
      },
      seeMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.small,
        marginTop: theme.spacing.sm,
        gap: theme.spacing.xs,
      },
      seeMoreText: {
        color: '#FFF',
        fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
        fontWeight: '600',
      },
      emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.pill,
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
        ...Platform.select({
          ios: {
            shadowColor: theme.colors.primary.base,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
          },
          android: {
            elevation: 3,
          },
        }),
      },
      emptyButtonText: {
        color: '#FFF',
        fontSize: getTypographySize('typography.arabic.body.fontSize', 18),
        fontWeight: '600',
      },
    };
  });

  if (loading && !tools.length) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.emptyText, { color: theme.colors.error }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      
      <FlatList
        data={paginatedTools}
        renderItem={renderToolCard}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          paginatedTools.length === 0 && { flex: 1, justifyContent: 'center' }
        ]}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <Animated.View 
            entering={FadeIn.delay(300).duration(500)}
            style={styles.emptyContainer}
          >
            <MaterialCommunityIcons 
              name="tools" 
              size={72} 
              color={theme.colors.neutral.textSecondary + '80'} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              لا توجد أدوات
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={() => navigation.navigate('AddTool')}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
              <Text style={styles.emptyButtonText}>إضافة أداة</Text>
            </TouchableOpacity>
          </Animated.View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
          />
        }
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        scrollEventThrottle={16}
      />
      
      <FAB
        icon="plus"
        onPress={() => navigation.navigate('AddTool')}
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.primary.base,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
            },
            android: {
              elevation: 6,
            },
          }),
        }}
      />
    </SafeAreaView>
  );
};

export default ToolListScreen; 