import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { usePesticide } from '../../../context/PesticideContext';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { StockPesticide } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SearchBar } from '../../../components/SearchBar';
import { FAB } from '../../../components/FAB';
import { PESTICIDE_TYPE_ICONS, STATUS_ICONS, UNIT_ICONS } from './constants';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { API_URL } from '../../../config/api';
import { withRetry } from '../../../services/api';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import { pesticideService } from '../../../services/pesticideService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 4;

type PesticideListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'PesticideList'>;
};

export const PesticideListScreen = ({ navigation }: PesticideListScreenProps) => {
  const theme = useTheme();
  const { 
    pesticides: contextPesticides, 
    loading: contextLoading, 
    error: contextError, 
    fetchPesticides 
  } = usePesticide();
  
  // Local state for UI interaction
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>('الكل');
  const [localError, setLocalError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add useFocusEffect to reload data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Load or reload pesticides when the screen gains focus
      const loadData = async () => {
        try {
          setRefreshing(true);
          await fetchPesticides();
          setLocalError(null);
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? (error.message.includes('فشل الاتصال بالخادم') 
                ? error.message 
                : 'Failed to load pesticides')
            : 'Failed to load pesticides';
          setLocalError(errorMessage);
          console.error('Error loading pesticides on focus:', error);
        } finally {
          setRefreshing(false);
        }
      };
      
      loadData();
      
      return () => {
        // Clean up any pending operations when losing focus
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [fetchPesticides])
  );

  const handleRefresh = useCallback(async () => {
    if (refreshing) return; // Prevent multiple refresh calls
    
    setRefreshing(true);
    try {
      await fetchPesticides();
      setPage(1);
      setLocalError(null);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? (error.message.includes('فشل الاتصال بالخادم') 
            ? error.message 
            : 'Failed to refresh pesticides')
        : 'Failed to refresh pesticides';
      setLocalError(errorMessage);
      console.error('Error refreshing pesticides:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPesticides, refreshing]);

  const types = useMemo(() => {
    const uniqueTypes = new Set(contextPesticides.map(pesticide => pesticide.type));
    return ['الكل', ...Array.from(uniqueTypes)];
  }, [contextPesticides]);

  const filteredPesticides = useMemo(() => {
    return contextPesticides
      .filter(pesticide => {
        const matchesSearch = pesticide.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!selectedType || selectedType === 'الكل') return matchesSearch;
        return matchesSearch && pesticide.type === selectedType;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [contextPesticides, searchQuery, selectedType]);

  const paginatedPesticides = useMemo(() => {
    return filteredPesticides.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredPesticides, page]);

  const renderFooter = useCallback(() => {
    if (paginatedPesticides.length >= filteredPesticides.length) return null;
    
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
  }, [paginatedPesticides.length, filteredPesticides.length, theme]);

  const renderTypeChip = useCallback(({ item }: { item: string }) => {
    const typeInfo = item === 'الكل' ? { 
      icon: '🌐', 
      color: theme.colors.primary.base,
      label: 'كل المبيدات',
      materialIcon: 'check-all'
    } : (PESTICIDE_TYPE_ICONS[item as keyof typeof PESTICIDE_TYPE_ICONS] || PESTICIDE_TYPE_ICONS.other);
    
    const isSelected = selectedType === item;
    
    return (
      <TouchableOpacity
        style={[
          styles.typeChip,
          { 
            backgroundColor: isSelected ? typeInfo.color : theme.colors.neutral.surface,
            borderColor: isSelected ? typeInfo.color : theme.colors.neutral.border,
            ...Platform.select({
              ios: isSelected ? {
                shadowColor: typeInfo.color,
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
        onPress={() => setSelectedType(isSelected ? null : item)}
      >
        <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
        <Text style={[
          styles.typeText,
          { color: isSelected ? '#FFF' : theme.colors.neutral.textSecondary }
        ]}>
          {item === 'الكل' ? 'كل المبيدات' : typeInfo.label}
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
  }, [selectedType, theme]);

  const renderPesticideCard = useCallback(({ item, index }: { item: StockPesticide; index: number }) => {
    const isLowStock = item.quantity <= item.minQuantityAlert;
    const typeInfo = PESTICIDE_TYPE_ICONS[item.type] || PESTICIDE_TYPE_ICONS.other;
    const unitInfo = UNIT_ICONS[item.unit.toLowerCase() as keyof typeof UNIT_ICONS];
    
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
          onPress={() => navigation.navigate('PesticideDetail', { pesticideId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: typeInfo.color + '20' }
            ]}>
              <Text style={[styles.pesticideIcon, { color: typeInfo.color }]}>
                {typeInfo.icon}
              </Text>
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={[styles.pesticideName, { color: theme.colors.neutral.textPrimary }]}>
                {item.name}
              </Text>
              <View style={styles.subtitleContainer}>
                <Text style={[styles.pesticideType, { color: typeInfo.color }]}>
                  {typeInfo.label}
                </Text>
                
                {item.manufacturer && (
                  <View style={styles.manufacturerContainer}>
                    <MaterialCommunityIcons name="factory" size={14} color={theme.colors.neutral.textSecondary} />
                    <Text style={[styles.manufacturerText, { color: theme.colors.neutral.textSecondary }]}>
                      {item.manufacturer}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {item.isNatural && (
              <View style={[styles.naturalBadge, { backgroundColor: STATUS_ICONS.natural.color }]}>
                <Text style={styles.naturalIcon}>{STATUS_ICONS.natural.icon}</Text>
                <Text style={styles.naturalText}>طبيعي</Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.quantityContainer}>
              <Text style={[styles.quantity, { 
                color: isLowStock ? theme.colors.error : theme.colors.neutral.textPrimary 
              }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.unit, { color: theme.colors.neutral.textSecondary }]}>
                {unitInfo?.label || item.unit}
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
            
            {item.expiryDate && (
              <View style={styles.expiryContainer}>
                <MaterialCommunityIcons 
                  name="calendar" 
                  size={16} 
                  color={theme.colors.neutral.textSecondary} 
                />
                <Text style={[styles.expiryText, { color: theme.colors.neutral.textSecondary }]}>
                  {new Date(item.expiryDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [theme, navigation]);

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

  const renderHeader = useCallback(() => (
    <Animated.View entering={FadeIn.duration(300).springify()}>
      <View style={[styles.searchContainer, { 
        borderBottomWidth: 0,
        paddingBottom: theme.spacing.sm,
      }]}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="ابحث عن المبيدات..."
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
          data={types}
          renderItem={renderTypeChip}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typesList}
          contentContainerStyle={styles.typesContent}
          keyExtractor={item => item}
          keyboardShouldPersistTaps="always"
        />
      </View>
    </Animated.View>
  ), [searchQuery, types, renderTypeChip, theme, handleSearchChange]);

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
      headerTitle: {
        fontSize: getTypographySize('typography.arabic.h2.fontSize', 32),
        fontWeight: '600',
        color: theme.colors.neutral.textPrimary,
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
      searchInput: {
        flex: 1,
        fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
        color: theme.colors.neutral.textPrimary,
        textAlign: 'right',
        paddingHorizontal: theme.spacing.sm,
      },
      searchIcon: {
        fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
        color: theme.colors.neutral.textSecondary,
      },
      typeFilters: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
      },
      typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.pill, // More rounded for better appearance
        gap: theme.spacing.xs,
        borderWidth: 1,
        marginHorizontal: 4,
      },
      typeChipSelected: {
        ...theme.shadows.small,
      },
      typeIcon: {
        fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
      },
      typeText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
      },
      content: {
        flex: 1,
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
      pesticideIcon: {
        fontSize: getTypographySize('typography.arabic.h4.fontSize', 24),
      },
      headerInfo: {
        flex: 1,
        gap: 2,
      },
      subtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
      },
      manufacturerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      manufacturerText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
      },
      pesticideName: {
        fontSize: getTypographySize('typography.arabic.h4.fontSize', 22),
        fontWeight: '600',
        color: theme.colors.neutral.textPrimary,
      },
      pesticideType: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        color: theme.colors.neutral.textSecondary,
      },
      naturalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.small,
        gap: 2,
      },
      naturalIcon: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        color: '#FFF',
      },
      naturalText: {
        color: '#FFF',
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
      unit: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        color: theme.colors.neutral.textSecondary,
      },
      statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        borderRadius: 4,
        gap: 4,
      },
      statusText: {
        color: '#FFF',
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
      },
      expiryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
      expiryText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
      },
      typesList: {
        maxHeight: 48,
      },
      typesContent: {
        paddingHorizontal: 16,
        gap: 8,
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

  if (contextLoading && !contextPesticides.length) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (contextError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.emptyText, { color: theme.colors.error }]}>
          {contextError}
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
        data={paginatedPesticides}
        renderItem={renderPesticideCard}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          paginatedPesticides.length === 0 && { flex: 1, justifyContent: 'center' }
        ]}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <Animated.View 
            entering={FadeIn.delay(300).duration(500)}
            style={styles.emptyContainer}
          >
            <MaterialCommunityIcons 
              name="flask-empty-outline" 
              size={72} 
              color={theme.colors.neutral.textSecondary + '80'} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              لا توجد مبيدات
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={() => navigation.navigate('AddPesticide')}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
              <Text style={styles.emptyButtonText}>إضافة مبيد</Text>
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
        onPress={() => navigation.navigate('AddPesticide')}
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

export default PesticideListScreen;