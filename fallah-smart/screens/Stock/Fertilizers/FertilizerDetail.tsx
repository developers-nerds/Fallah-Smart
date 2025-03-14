import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  I18nManager,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useFertilizer } from '../../../context/FertilizerContext';
import { StockFertilizer } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { FERTILIZER_TYPES, FERTILIZER_CATEGORIES, FertilizerType } from './constants';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';
import { storage } from '../../../utils/storage';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Direct API URL for testing
const DIRECT_API_URL = `${process.env.EXPO_PUBLIC_API_URL}/stock/fertilizer`;

// Add these constants at the top of the file after imports
const STOCK_ICONS = {
  quantity: '📦',
  price: '💰',
  alert: '⚠️',
  expired: '⏱️',
  nearExpiry: '⌛',
  lowStock: '📉',
  npk: '🧪',
  applicationRate: '⚖️',
  supplier: '🏭',
  expiryDate: '📅',
  safety: '⚡',
  edit: '✏️',
  delete: '🗑️',
  back: '↩️',
  loading: '⚗️',
  notFound: '🔍'
};

type FertilizerDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'FertilizerDetail'>;
  route: RouteProp<StockStackParamList, 'FertilizerDetail'>;
};

const FertilizerDetailScreen: React.FC<FertilizerDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { fertilizers: contextFertilizers, deleteFertilizer: contextDeleteFertilizer } = useFertilizer();
  const [fertilizer, setFertilizer] = useState<StockFertilizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch fertilizer details directly from API
  const fetchFertilizerDirectly = async () => {
    try {
      const tokens = await storage.getTokens();
      console.log('Fetching fertilizer details for ID:', route.params.fertilizerId);
      
      const response = await axios.get(`${DIRECT_API_URL}/${route.params.fertilizerId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokens?.accessToken ? `Bearer ${tokens.accessToken}` : ''
        },
        timeout: 10000
      });
      
      console.log('Fertilizer details fetched successfully');
      return response.data;
    } catch (error) {
      console.error('Error fetching fertilizer details:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Try without token as fallback
          try {
            const fallbackResponse = await axios.get(`${DIRECT_API_URL}/${route.params.fertilizerId}`, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000
            });
            return fallbackResponse.data;
          } catch (fallbackError) {
            console.error('Fallback fetch also failed:', fallbackError);
            throw fallbackError;
          }
        }
      }
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadFertilizerDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try direct API first
        const fertilizerData = await fetchFertilizerDirectly();
        
        if (isMounted) {
          setFertilizer(fertilizerData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading fertilizer details:', err);
        
        // Fallback to context
        try {
          const contextFertilizer = contextFertilizers.find(f => f.id === route.params.fertilizerId);
          if (contextFertilizer && isMounted) {
            setFertilizer(contextFertilizer);
          } else {
            setError('Fertilizer not found');
          }
        } catch (contextErr) {
          if (isMounted) {
            setError('Failed to load fertilizer details');
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    loadFertilizerDetails();

    return () => {
      isMounted = false;
    };
  }, [route.params.fertilizerId, contextFertilizers]);

  const handleDelete = async () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا السماد؟',
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
              // Try direct API delete first
              try {
                const tokens = await storage.getTokens();
                await axios.delete(`${DIRECT_API_URL}/${route.params.fertilizerId}`, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': tokens?.accessToken ? `Bearer ${tokens.accessToken}` : ''
                  }
                });
                console.log('Fertilizer deleted successfully via direct API');
              } catch (directError) {
                console.error('Direct delete failed, falling back to context:', directError);
                await contextDeleteFertilizer(route.params.fertilizerId);
                console.log('Fertilizer deleted successfully via context');
              }
              
              navigation.goBack();
              Alert.alert('نجاح', 'تم حذف السماد بنجاح');
            } catch (error) {
              console.error('Error deleting fertilizer:', error);
              Alert.alert('خطأ', 'فشل في حذف السماد');
            }
          },
        },
      ]
    );
  };

  const getFertilizerTypeInfo = (type: string) => {
    return (
      FERTILIZER_TYPES[type as FertilizerType] ||
      Object.values(FERTILIZER_TYPES).find(fert => fert.name === type) ||
      { icon: '⚗️', name: 'سماد', category: 'chemical' }
    );
  };

  const isLowStock = (fertilizer: StockFertilizer): boolean => {
    return fertilizer.quantity <= (fertilizer.minQuantityAlert || 0);
  };

  const isNearExpiry = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar
          backgroundColor={theme.colors.neutral.surface}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeInDown.springify()}
            style={styles.loadingContainer}
          >
            <Text style={styles.loadingIcon}>{STOCK_ICONS.loading}</Text>
            <ActivityIndicator size="large" color={theme.colors.primary.base} />
            <Text style={[styles.loadingText, { color: theme.colors.neutral.textSecondary }]}>
              جاري تحميل تفاصيل السماد...
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !fertilizer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar
          backgroundColor={theme.colors.neutral.surface}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeInDown.springify()}
            style={styles.errorContainer}
          >
            <Text style={styles.notFoundIcon}>{STOCK_ICONS.notFound}</Text>
            <Text style={[styles.notFoundText, { color: theme.colors.neutral.textSecondary }]}>
              {error || 'لم يتم العثور على السماد'}
            </Text>
            <Button
              title={`${STOCK_ICONS.back} العودة`}
              onPress={() => navigation.goBack()}
              variant="primary"
              style={styles.backButton}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const fertilizerType = getFertilizerTypeInfo(fertilizer.type);
  const lowStock = isLowStock(fertilizer);
  const nearExpiry = isNearExpiry(fertilizer.expiryDate);
  const expired = isExpired(fertilizer.expiryDate);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View 
          entering={FadeInDown.springify()}
          style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}
        >
          <View style={[
            styles.iconContainer,
            { 
              backgroundColor: expired 
                ? theme.colors.error + '20'
                : lowStock
                  ? theme.colors.warning + '20'
                  : nearExpiry
                    ? theme.colors.info + '20'
                    : '#E8F5E9'
            }
          ]}>
            <Text style={styles.fertilizerIcon}>{fertilizerType.icon}</Text>
            {lowStock && <Text style={styles.statusIndicator}>{STOCK_ICONS.lowStock}</Text>}
            {expired && <Text style={styles.statusIndicator}>{STOCK_ICONS.expired}</Text>}
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
              {fertilizer.name}
            </Text>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryIcon}>
                {FERTILIZER_CATEGORIES[fertilizerType.category].icon}
              </Text>
              <Text style={[styles.categoryText, { color: theme.colors.neutral.textSecondary }]}>
                {FERTILIZER_CATEGORIES[fertilizerType.category].label}
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.content}>
          <Animated.View 
            entering={FadeInDown.delay(100).springify()}
            style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
              {STOCK_ICONS.quantity} معلومات المخزون
            </Text>
            
            <View style={styles.stockInfo}>
              <View style={[styles.stockCard, { backgroundColor: theme.colors.primary.base + '20' }]}>
                <Text style={styles.stockIcon}>{STOCK_ICONS.quantity}</Text>
                <Text style={[styles.stockValue, { color: theme.colors.primary.base }]}>
                  {fertilizer.quantity} {fertilizer.unit}
                </Text>
                <Text style={[styles.stockLabel, { color: theme.colors.neutral.textSecondary }]}>
                  الكمية المتوفرة
                </Text>
              </View>

              <View style={[styles.stockCard, { backgroundColor: theme.colors.accent.base + '20' }]}>
                <Text style={styles.stockIcon}>{STOCK_ICONS.price}</Text>
                <Text style={[styles.stockValue, { color: theme.colors.accent.base }]}>
                  {fertilizer.price} د.ج
                </Text>
                <Text style={[styles.stockLabel, { color: theme.colors.neutral.textSecondary }]}>
                  السعر
                </Text>
              </View>

              <View style={[styles.stockCard, { 
                backgroundColor: lowStock 
                  ? theme.colors.error + '20' 
                  : theme.colors.success + '20'
              }]}>
                <Text style={styles.stockIcon}>{STOCK_ICONS.alert}</Text>
                <Text style={[styles.stockValue, { 
                  color: lowStock ? theme.colors.error : theme.colors.success
                }]}>
                  {fertilizer.minQuantityAlert} {fertilizer.unit}
                </Text>
                <Text style={[styles.stockLabel, { color: theme.colors.neutral.textSecondary }]}>
                  حد التنبيه
                </Text>
              </View>
            </View>

            {(lowStock || expired || nearExpiry) && (
              <View style={styles.alerts}>
                {lowStock && (
                  <Animated.View 
                    entering={FadeInDown.delay(150).springify()}
                    style={[styles.alert, { backgroundColor: theme.colors.error + '20' }]}
                  >
                    <Text style={styles.alertIcon}>{STOCK_ICONS.lowStock}</Text>
                    <Text style={[styles.alertText, { color: theme.colors.error }]}>
                      المخزون منخفض
                    </Text>
                  </Animated.View>
                )}

                {expired && (
                  <Animated.View 
                    entering={FadeInDown.delay(200).springify()}
                    style={[styles.alert, { backgroundColor: theme.colors.error + '20' }]}
                  >
                    <Text style={styles.alertIcon}>{STOCK_ICONS.expired}</Text>
                    <Text style={[styles.alertText, { color: theme.colors.error }]}>
                      منتهي الصلاحية
                    </Text>
                  </Animated.View>
                )}

                {nearExpiry && !expired && (
                  <Animated.View 
                    entering={FadeInDown.delay(250).springify()}
                    style={[styles.alert, { backgroundColor: theme.colors.warning + '20' }]}
                  >
                    <Text style={styles.alertIcon}>{STOCK_ICONS.nearExpiry}</Text>
                    <Text style={[styles.alertText, { color: theme.colors.warning }]}>
                      قريب من انتهاء الصلاحية
                    </Text>
                  </Animated.View>
                )}
              </View>
            )}
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(200).springify()}
            style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
              {STOCK_ICONS.npk} معلومات السماد
            </Text>
            
            {fertilizer.npkRatio && (
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  {STOCK_ICONS.npk} نسبة NPK:
                </Text>
                <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                  {fertilizer.npkRatio}
                </Text>
              </View>
            )}

            {fertilizer.applicationRate && (
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  {STOCK_ICONS.applicationRate} معدل الاستخدام:
                </Text>
                <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                  {fertilizer.applicationRate}
                </Text>
              </View>
            )}

            {fertilizer.supplier && (
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  {STOCK_ICONS.supplier} المورد:
                </Text>
                <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                  {fertilizer.supplier}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                {STOCK_ICONS.expiryDate} تاريخ الصلاحية:
              </Text>
              <Text style={[
                styles.value, 
                { 
                  color: expired 
                    ? theme.colors.error 
                    : nearExpiry 
                      ? theme.colors.warning 
                      : theme.colors.neutral.textPrimary 
                }
              ]}>
                {new Date(fertilizer.expiryDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </Text>
            </View>
          </Animated.View>

          {fertilizer.safetyGuidelines && (
            <Animated.View 
              entering={FadeInDown.delay(300).springify()}
              style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                {STOCK_ICONS.safety} تعليمات السلامة
              </Text>
              <Text style={[styles.guidelines, { color: theme.colors.neutral.textPrimary }]}>
                {fertilizer.safetyGuidelines}
              </Text>
            </Animated.View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title={`${STOCK_ICONS.edit} تعديل`}
              onPress={() => navigation.navigate('AddFertilizer', { fertilizerId: fertilizer.id })}
              variant="primary"
              style={[styles.button, styles.updateButton]}
            />
            <Button
              title={`${STOCK_ICONS.delete} حذف`}
              onPress={handleDelete}
              variant="primary"
              style={[styles.button, styles.updateButton, { backgroundColor: theme.colors.error }]}
            />
          </View>
        </View>
      </ScrollView>
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
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fertilizerIcon: {
    fontSize: 40,
  },
  statusIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  stockInfo: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  stockCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stockValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stockLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  alerts: {
    gap: 8,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  guidelines: {
    fontSize: 14,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    minHeight: 45,
  },
  updateButton: {
    borderRadius: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  stockIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  notFoundIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  notFoundText: {
    fontSize: 18,
    marginBottom: 24,
  },
  backButton: {
    minWidth: 120,
  },
});

export default FertilizerDetailScreen; 