import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  I18nManager,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useSeed } from '../../../context/SeedContext';
import { StockSeed } from '../types';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SEED_TYPES, SEED_CATEGORIES } from './constants';
import axios from 'axios';
import { storage } from '../../../utils/storage';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

// Direct API URL for testing
const DIRECT_API_URL = `${process.env.EXPO_PUBLIC_API_URL}/stock/seeds`;

type SeedDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'SeedDetail'>;
  route: RouteProp<StockStackParamList, 'SeedDetail'>;
};

type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;

// Helper function to get category icon
const getCategoryIcon = (type: string | undefined): string => {
  if (!type) return '🌱';
  
  const seedType = Object.keys(SEED_TYPES).find(key => 
    SEED_TYPES[key as keyof typeof SEED_TYPES].name === type || key === type.toLowerCase()
  );
  
  if (seedType) {
    const category = SEED_TYPES[seedType as keyof typeof SEED_TYPES].category;
    return SEED_CATEGORIES[category as keyof typeof SEED_CATEGORIES] || '🌱';
  }
  
  return '🌱';
};

// Helper function to get seed type icon
const getSeedTypeIcon = (type: string | undefined): string => {
  if (!type) return '🌱';
  
  const seedType = Object.keys(SEED_TYPES).find(key => 
    SEED_TYPES[key as keyof typeof SEED_TYPES].name === type || key === type.toLowerCase()
  );
  
  if (seedType) {
    return SEED_TYPES[seedType as keyof typeof SEED_TYPES].icon;
  }
  
  return '🌱';
};

// Helper function to determine if stock is low
const isLowStock = (seed: StockSeed): boolean => {
  return seed.quantity <= (seed.minQuantityAlert || 0);
};

// Helper function to determine if seed is near expiry
const isNearExpiry = (expiryDate: string): boolean => {
  if (!expiryDate) return false;
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= 30 && diffDays >= 0;
};

// Helper function to determine if seed is expired
const isExpired = (expiryDate: string): boolean => {
  if (!expiryDate) return false;
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  
  return expiry < today;
};

// Helper function to get material icon name
const getTypeIcon = (type: string | undefined): MaterialIconName => {
  if (!type) return 'seed';
  
  const lowercaseType = type.toLowerCase();
  
  if (lowercaseType.includes('طماطم') || lowercaseType === 'tomato') return 'food-apple';
  if (lowercaseType.includes('خيار') || lowercaseType === 'cucumber') return 'food-variant';
  if (lowercaseType.includes('بطاطس') || lowercaseType === 'potato') return 'food-croissant';
  if (lowercaseType.includes('فلفل') || lowercaseType === 'pepper') return 'chili-hot';
  if (lowercaseType.includes('بصل') || lowercaseType === 'onion') return 'fruit-citrus';
  if (lowercaseType.includes('ثوم') || lowercaseType === 'garlic') return 'fruit-cherries';
  if (lowercaseType.includes('قمح') || lowercaseType === 'wheat') return 'wheat';
  if (lowercaseType.includes('ذرة') || lowercaseType === 'corn') return 'corn';
  if (lowercaseType.includes('ورد') || lowercaseType === 'rose') return 'flower';
  if (lowercaseType.includes('توليب') || lowercaseType === 'tulip') return 'flower-tulip';
  if (lowercaseType.includes('عباد الشمس') || lowercaseType === 'sunflower') return 'flower-poppy';
  if (lowercaseType.includes('خضروات') || lowercaseType === 'vegetable') return 'food-variant';
  if (lowercaseType.includes('فواكه') || lowercaseType === 'fruit') return 'fruit-watermelon';
  if (lowercaseType.includes('حبوب') || lowercaseType === 'grain') return 'wheat';
  if (lowercaseType.includes('زهور') || lowercaseType === 'flower') return 'flower';
  
  return 'seed';
};

// Main SeedDetail component
const SeedDetailScreen: React.FC<SeedDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { seeds, deleteSeed, loading: contextLoading } = useSeed();
  const [seedItem, setSeedItem] = useState<StockSeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch seed details on mount
  useEffect(() => {
    console.log('SeedDetail screen mounted - looking for seed ID:', route.params.seedId);
    
    const fetchSeed = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to find seed in context first
        const foundSeed = seeds.find(s => s.id === route.params.seedId);
        
        if (foundSeed) {
          console.log('Seed found in context');
          setSeedItem(foundSeed);
          setLoading(false);
          return;
        }
        
        // If not found in context, try to fetch directly
        console.log('Seed not found in context, fetching directly');
        try {
          const tokens = await storage.getTokens();
          const directUrl = `${DIRECT_API_URL}/${route.params.seedId}`;
          console.log('Fetching seed from:', directUrl);
          
          const response = await axios.get(directUrl, {
            headers: {
              'Authorization': tokens?.accessToken ? `Bearer ${tokens.accessToken}` : '',
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data) {
            console.log('Seed fetched successfully from API');
            setSeedItem(response.data);
          } else {
            console.log('API returned no data');
            setError('لم يتم العثور على البذور');
          }
        } catch (apiError) {
          console.error('Error fetching seed from API:', apiError);
          setError('فشل في جلب بيانات البذور');
        }
      } catch (err) {
        console.error('Error in fetchSeed:', err);
        setError('حدث خطأ أثناء البحث عن البذور');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSeed();
  }, [route.params.seedId, seeds]);

  // Handle delete with confirmation
  const handleDelete = useCallback(() => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه البذور؟',
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
              setIsDeleting(true);
              
              // Try direct API delete first
              try {
                const tokens = await storage.getTokens();
                const deleteURL = `${DIRECT_API_URL}/${route.params.seedId}`;
                console.log('Deleting seed at:', deleteURL);
                
                await axios.delete(deleteURL, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': tokens?.accessToken ? `Bearer ${tokens.accessToken}` : ''
                  }
                });
                
                console.log('Seed deleted successfully via direct API');
                navigation.goBack();
                return;
              } catch (directError) {
                console.error('Direct delete failed, falling back to context:', directError);
                
                // Fall back to context delete
                await deleteSeed(route.params.seedId);
                console.log('Seed deleted successfully via context');
                navigation.goBack();
              }
            } catch (error) {
              console.error('Error deleting seed:', error);
              Alert.alert('خطأ', 'فشل في حذف البذور');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [route.params.seedId, deleteSeed, navigation]);

  // Render a field with icon
  const renderField = useCallback((label: string, value: string | undefined | null, icon: string) => {
    if (!value) return null;
    
    return (
      <Animated.View 
        entering={FadeInDown.delay(100).springify()}
        style={[styles.infoCard, { backgroundColor: theme.colors.neutral.surface }]}
      >
        <View style={styles.infoHeader}>
          <Text style={styles.fieldIcon}>{icon}</Text>
          <Text style={[styles.infoTitle, { color: theme.colors.neutral.textPrimary }]}>
            {label}
          </Text>
        </View>
        <Text style={[styles.infoContent, { color: theme.colors.neutral.textSecondary }]}>
          {value}
        </Text>
      </Animated.View>
    );
  }, [theme.colors.neutral.surface, theme.colors.neutral.textPrimary, theme.colors.neutral.textSecondary]);

  // If loading, show loading indicator
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar
          backgroundColor={theme.colors.neutral.surface}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
          <Text style={[styles.loadingText, { color: theme.colors.neutral.textSecondary }]}>
            جاري تحميل البذور...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If error or no seed found, show error state
  if (error || !seedItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar
          backgroundColor={theme.colors.neutral.surface}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <MaterialCommunityIcons 
            name="alert-circle-outline" 
            size={64} 
            color={theme.colors.error} 
          />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error || 'لم يتم العثور على البذور'}
          </Text>
          <TouchableOpacity
            style={[styles.goBackButton, { backgroundColor: theme.colors.primary.base }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const seedType = seedItem.type ? Object.keys(SEED_TYPES).find(key => 
    SEED_TYPES[key as keyof typeof SEED_TYPES].name === seedItem.type || key === seedItem.type.toLowerCase()
  ) : null;
  
  const seedCategory = seedType 
    ? SEED_TYPES[seedType as keyof typeof SEED_TYPES].category 
    : 'أخرى';
  
  const seedTypeIcon = getSeedTypeIcon(seedItem.type);
  const lowStockStatus = isLowStock(seedItem);
  const nearExpiryStatus = isNearExpiry(seedItem.expiryDate);
  const expiredStatus = isExpired(seedItem.expiryDate);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <ScrollView style={styles.scrollView}>
          <Animated.View 
            entering={FadeInDown.springify()}
            style={[
              styles.header,
              { 
                backgroundColor: theme.colors.neutral.surface,
                ...Platform.select({
                  ios: {
                    shadowColor: theme.colors.neutral.textPrimary,
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
            <View style={styles.headerContent}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: expiredStatus 
                  ? theme.colors.error + '20'
                  : lowStockStatus 
                    ? theme.colors.warning + '20' 
                    : '#E8F5E9' 
                }
              ]}>
                <Text style={styles.seedIconText}>{seedTypeIcon}</Text>
              </View>
              <View style={styles.headerInfo}>
                <View style={styles.titleContainer}>
                  <Text style={[styles.seedName, { color: theme.colors.neutral.textPrimary }]}>
                    {seedItem.name || 'بذور'}
                  </Text>
                  <Text style={[styles.seedCategory, { color: theme.colors.neutral.textSecondary }]}>
                    {seedCategory || 'أخرى'}
                  </Text>
                </View>
                <View style={styles.subtitleContainer}>
                  {seedItem.variety && (
                    <Text style={[styles.varietyText, { color: theme.colors.neutral.textSecondary }]}>
                      الصنف: {seedItem.variety}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary.base }]}
                onPress={() => navigation.navigate('AddSeed', { seedId: seedItem.id })}
              >
                <MaterialCommunityIcons name="pencil" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="delete" size={24} color="#FFF" />
                    <Text style={styles.actionButtonText}>حذف</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
              <Animated.View 
                entering={FadeInDown.delay(100).springify()}
                style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}
              >
                <Text style={[styles.statValue, { 
                  color: lowStockStatus ? theme.colors.error : theme.colors.neutral.textPrimary 
                }]}>
                  {seedItem.quantity}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                  {seedItem.unit}
                </Text>
                {lowStockStatus && (
                  <View style={[styles.badgeContainer, { backgroundColor: theme.colors.error + '20' }]}>
                    <MaterialCommunityIcons name="alert" size={12} color={theme.colors.error} />
                    <Text style={[styles.badgeText, { color: theme.colors.error }]}>
                      مخزون منخفض
                    </Text>
                  </View>
                )}
              </Animated.View>

              <Animated.View 
                entering={FadeInDown.delay(150).springify()}
                style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}
              >
                <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                  {seedItem.price}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                  د.أ
                </Text>
              </Animated.View>

              <Animated.View 
                entering={FadeInDown.delay(200).springify()}
                style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}
              >
                <View style={[
                  styles.expiryIndicator,
                  { 
                    backgroundColor: expiredStatus 
                      ? theme.colors.error + '20' 
                      : nearExpiryStatus 
                        ? theme.colors.warning + '20' 
                        : theme.colors.success + '20'
                  }
                ]}>
                  <Text style={styles.expiryIcon}>
                    {expiredStatus ? '⚠️' : nearExpiryStatus ? '⏳' : '✅'}
                  </Text>
                </View>
                <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                  الصلاحية
                </Text>
                <Text style={[styles.expiryStatus, { 
                  color: expiredStatus 
                    ? theme.colors.error 
                    : nearExpiryStatus 
                      ? theme.colors.warning 
                      : theme.colors.neutral.textPrimary 
                }]}>
                  {expiredStatus ? 'منتهية الصلاحية' : nearExpiryStatus ? 'قريبة الانتهاء' : 'صالحة'}
                </Text>
                <View style={styles.expiryDateContainer}>
                  <Text style={styles.calendarIcon}>📅</Text>
                  <Text style={[styles.expiryDate, { 
                    color: expiredStatus 
                      ? theme.colors.error 
                      : nearExpiryStatus 
                        ? theme.colors.warning 
                        : theme.colors.neutral.textSecondary 
                  }]}>
                    {new Date(seedItem.expiryDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </Text>
                </View>
              </Animated.View>
            </View>
          </Animated.View>

          <View style={styles.content}>
            {/* Basic Information */}
            <Animated.View 
              entering={FadeInDown.delay(250).springify()}
              style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                المعلومات الأساسية
              </Text>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  النوع:
                </Text>
                <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                  {seedItem.type}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  الكمية:
                </Text>
                <Text style={[styles.value, { 
                  color: lowStockStatus ? theme.colors.error : theme.colors.neutral.textPrimary 
                }]}>
                  {seedItem.quantity} {seedItem.unit}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  الحد الأدنى للتنبيه:
                </Text>
                <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                  {seedItem.minQuantityAlert} {seedItem.unit}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  السعر:
                </Text>
                <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                  {seedItem.price} د.أ
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  تاريخ الصلاحية:
                </Text>
                <Text style={[styles.value, { 
                  color: expiredStatus 
                    ? theme.colors.error 
                    : nearExpiryStatus 
                      ? theme.colors.warning 
                      : theme.colors.neutral.textPrimary 
                }]}>
                  {new Date(seedItem.expiryDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </Animated.View>

            {/* Additional Information */}
            {(seedItem.variety || seedItem.manufacturer || seedItem.batchNumber || 
              seedItem.purchaseDate || seedItem.location || seedItem.supplier) && (
              <Animated.View 
                entering={FadeInDown.delay(300).springify()}
                style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}
              >
                <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                  معلومات إضافية
                </Text>
                {seedItem.variety && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                      الصنف:
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                      {seedItem.variety}
                    </Text>
                  </View>
                )}
                {seedItem.manufacturer && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                      الشركة المصنعة:
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                      {seedItem.manufacturer}
                    </Text>
                  </View>
                )}
                {seedItem.batchNumber && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                      رقم الدفعة:
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                      {seedItem.batchNumber}
                    </Text>
                  </View>
                )}
                {seedItem.purchaseDate && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                      تاريخ الشراء:
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                      {new Date(seedItem.purchaseDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                )}
                {seedItem.location && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                      الموقع:
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                      {seedItem.location}
                    </Text>
                  </View>
                )}
                {seedItem.supplier && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                      المورد:
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                      {seedItem.supplier}
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}

            {/* Planting Information */}
            {(seedItem.plantingInstructions || seedItem.germinationTime || 
              seedItem.growingSeason || seedItem.plantingSeasonStart || 
              seedItem.plantingSeasonEnd || seedItem.germination) && (
              <Animated.View 
                entering={FadeInDown.delay(350).springify()}
                style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}
              >
                <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                  معلومات الزراعة
                </Text>
                {seedItem.plantingInstructions && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                      تعليمات الزراعة:
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                      {seedItem.plantingInstructions}
                    </Text>
                  </View>
                )}
                {seedItem.germinationTime && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                      وقت الإنبات:
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                      {seedItem.germinationTime}
                    </Text>
                  </View>
                )}
                {seedItem.growingSeason && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                      موسم النمو:
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                      {seedItem.growingSeason}
                    </Text>
                  </View>
                )}
                {seedItem.plantingSeasonStart && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                      بداية موسم الزراعة:
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                      {new Date(seedItem.plantingSeasonStart).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {seedItem.plantingSeasonEnd && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                      نهاية موسم الزراعة:
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                      {new Date(seedItem.plantingSeasonEnd).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {seedItem.germination && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                      نسبة الإنبات:
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                      {seedItem.germination}%
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}

            {/* Notes */}
            {seedItem.notes && (
              <Animated.View 
                entering={FadeInDown.delay(400).springify()}
                style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}
              >
                <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                  ملاحظات
                </Text>
                <Text style={[styles.notes, { color: theme.colors.neutral.textPrimary }]}>
                  {seedItem.notes}
                </Text>
              </Animated.View>
            )}
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    gap: 24,
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seedIconText: {
    fontSize: 40,
  },
  headerInfo: {
    flex: 1,
    gap: 8,
  },
  titleContainer: {
    gap: 4,
  },
  seedName: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'right',
  },
  seedCategory: {
    fontSize: 16,
    textAlign: 'right',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  varietyText: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 14,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  expiryIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expiryIcon: {
    fontSize: 24,
  },
  expiryStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  expiryDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  expiryDate: {
    fontSize: 12,
  },
  calendarIcon: {
    fontSize: 16,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  notes: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  infoContent: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
  fieldIcon: {
    fontSize: 24,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  goBackButton: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goBackButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default SeedDetailScreen; 