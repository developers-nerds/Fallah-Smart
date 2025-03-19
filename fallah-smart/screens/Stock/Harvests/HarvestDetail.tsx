import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  I18nManager,
  Platform,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useHarvest } from '../../../context/HarvestContext';
import { StockHarvest } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { HARVEST_TYPES, QUALITY_TYPES, UNIT_TYPES, HARVEST_CATEGORIES } from './constants';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Create type-safe helper functions to avoid TypeScript errors
// and ensure consistent behavior with HarvestList.tsx
const getTypeIcon = (type: string): string => {
  // For vegetables
  if (type === 'vegetable' || type === 'خضروات') return '🥕';
  if (type === 'tomato' || type === 'طماطم') return '🍅';
  if (type === 'cucumber' || type === 'خيار') return '🥒';
  if (type === 'potato' || type === 'بطاطا') return '🥔';
  if (type === 'carrot' || type === 'جزر') return '🥕';
  if (type === 'onion' || type === 'بصل') return '🧅';
  if (type === 'garlic' || type === 'ثوم') return '🧄';
  if (type === 'lettuce' || type === 'خس') return '🥬';
  if (type === 'pepper' || type === 'فلفل') return '🌶️';
  if (type === 'eggplant' || type === 'باذنجان') return '🍆';
  if (type === 'broccoli' || type === 'بروكلي') return '🥦';
  if (type === 'corn' || type === 'ذرة') return '🌽';
  
  // For fruits
  if (type === 'fruit' || type === 'فواكه') return '🍎';
  if (type === 'apple' || type === 'تفاح') return '🍎';
  if (type === 'orange' || type === 'برتقال') return '🍊';
  if (type === 'banana' || type === 'موز') return '🍌';
  if (type === 'grape' || type === 'عنب') return '🍇';
  if (type === 'watermelon' || type === 'بطيخ') return '🍉';
  if (type === 'strawberry' || type === 'فراولة') return '🍓';
  if (type === 'pear' || type === 'كمثرى') return '🍐';
  if (type === 'peach' || type === 'خوخ') return '🍑';
  
  // For grains
  if (type === 'grain' || type === 'حبوب') return '🌾';
  if (type === 'wheat' || type === 'قمح') return '🌾';
  if (type === 'rice' || type === 'أرز') return '🍚';
  
  // For herbs
  if (type === 'herb' || type === 'أعشاب') return '🌿';
  if (type === 'mint' || type === 'نعناع') return '🌿';
  if (type === 'parsley' || type === 'بقدونس') return '🌿';
  if (type === 'coriander' || type === 'كزبرة') return '🌿';
  
  // Other
  if (type === 'other' || type === 'أخرى') return '🧺';
  
  // Default fallback
  return '🌱';
};

const getTypeName = (type: string): string => {
  // For vegetables
  if (type === 'vegetable') return 'خضروات';
  if (type === 'tomato') return 'طماطم';
  if (type === 'cucumber') return 'خيار';
  if (type === 'potato') return 'بطاطا';
  if (type === 'carrot') return 'جزر';
  if (type === 'onion') return 'بصل';
  if (type === 'garlic') return 'ثوم';
  if (type === 'lettuce') return 'خس';
  if (type === 'pepper') return 'فلفل';
  if (type === 'eggplant') return 'باذنجان';
  if (type === 'broccoli') return 'بروكلي';
  if (type === 'corn') return 'ذرة';
  
  // For fruits
  if (type === 'fruit') return 'فواكه';
  if (type === 'apple') return 'تفاح';
  if (type === 'orange') return 'برتقال';
  if (type === 'banana') return 'موز';
  if (type === 'grape') return 'عنب';
  if (type === 'watermelon') return 'بطيخ';
  if (type === 'strawberry') return 'فراولة';
  if (type === 'pear') return 'كمثرى';
  if (type === 'peach') return 'خوخ';
  
  // For grains
  if (type === 'grain') return 'حبوب';
  if (type === 'wheat') return 'قمح';
  if (type === 'rice') return 'أرز';
  
  // For herbs
  if (type === 'herb') return 'أعشاب';
  if (type === 'mint') return 'نعناع';
  if (type === 'parsley') return 'بقدونس';
  if (type === 'coriander') return 'كزبرة';
  
  // Other
  if (type === 'other') return 'أخرى';
  
  // Default - return the type itself
  return type;
};

type HarvestDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'HarvestDetail'>;
  route: RouteProp<StockStackParamList, 'HarvestDetail'>;
};

const HarvestDetailScreen: React.FC<HarvestDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [harvestItem, setHarvestItem] = useState<StockHarvest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHarvestDetail();
  }, [route.params.harvestId]);

  const fetchHarvestDetail = async () => {
    try {
      setLoading(true);
      
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/harvest/${route.params.harvestId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        }
      );
      
      setHarvestItem(response.data);
    } catch (error) {
      console.error('Error fetching harvest detail:', error);
      setError('فشل في تحميل تفاصيل المحصول');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا المحصول؟',
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
              const tokens = await storage.getTokens();
              
              if (!tokens?.access) {
                Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
                return;
              }

              await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/stock/harvest/${route.params.harvestId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${tokens.access}`
                  }
                }
              );
              
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting harvest:', error);
              Alert.alert('خطأ', 'فشل في حذف المحصول');
            }
          },
        },
      ]
    );
  };

  // Replace the getTypeEmoji function with our new simpler version
  const getTypeEmoji = (item: StockHarvest | null): string => {
    if (!item || !item.type) return '🌱';
    return getTypeIcon(item.type);
  };

  // Fix the quality info handling to avoid dynamic access
  const getQualityInfo = (quality: string | undefined) => {
    if (!quality) return { icon: '⭐', name: 'قياسي' };
    
    // Direct mapping instead of dynamic access
    switch (quality) {
      case 'premium': return { icon: '⭐⭐⭐', name: 'ممتاز' };
      case 'standard': return { icon: '⭐⭐', name: 'قياسي' };
      case 'economy': case 'secondary': return { icon: '⭐', name: 'اقتصادي' };
      default: return { icon: '⭐', name: quality };
    }
  };

  // Get unit abbreviation safely without dynamic property access
  const getUnitAbbreviation = (unit: string): string => {
    switch(unit) {
      case 'kg': return 'كغ';
      case 'g': return 'غ';
      case 'ton': return 'طن';
      case 'box': return 'صندوق';
      case 'piece': return 'قطعة';
      case 'bunch': return 'حزمة';
      default: return unit;
    }
  };

  // Render info row with icon and value
  const renderInfoRow = (label: string, value: any, icon: string, isOptional: boolean = false) => {
    // If the value is empty/null/undefined and it's optional, don't display anything
    if ((value === null || value === undefined || value === '') && isOptional) {
      return null;
    }
    
    // If it's not optional but empty, show as "غير محدد" (not specified)
    const displayValue = (value === null || value === undefined || value === '') 
      ? 'غير محدد' 
      : value;
    
    return (
      <View style={styles.infoRow}>
        <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
          {icon} {label}:
        </Text>
        <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
          {displayValue}
        </Text>
      </View>
    );
  };

  // Render section with title and children
  const renderSection = (title: string, icon: string, children: React.ReactNode) => {
    // Only render section if it has visible children
    if (!React.Children.toArray(children).some(child => child !== null)) {
      return null;
    }

    return (
      <Animated.View 
        entering={FadeInDown.springify()}
        style={[styles.section, { 
          backgroundColor: theme.colors.neutral.surface,
          shadowColor: theme.colors.neutral.textPrimary,
        }]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
          {icon} {title}
        </Text>
        {children}
      </Animated.View>
    );
  };

  // Replace the type name function with our new version
  const getTypeNameFromItem = (item: StockHarvest | null): string => {
    if (!item || !item.type) return '';
    return getTypeName(item.type);
  };

  if (loading) {
  return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.loadingContainer}
          >
            <Text style={styles.loadingIcon}>⚙️</Text>
            <ActivityIndicator size="large" color={theme.colors.primary.base} />
            <Text style={[styles.loadingText, { color: theme.colors.neutral.textSecondary }]}>
              جاري تحميل تفاصيل المحصول...
            </Text>
          </Animated.View>
          </View>
      </SafeAreaView>
    );
  }

  if (error || !harvestItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.errorContainer}
          >
            <Text style={styles.notFoundIcon}>🔍</Text>
            <Text style={[styles.notFoundText, { color: theme.colors.neutral.textSecondary }]}>
              {error || 'لم يتم العثور على المحصول'}
            </Text>
            <Button
              title="العودة ↩️"
              onPress={() => navigation.goBack()}
              variant="primary"
              style={{ minWidth: 120 }}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const isLowStock = harvestItem.minQuantityAlert !== undefined && 
    harvestItem.minQuantityAlert > 0 && 
    harvestItem.quantity <= harvestItem.minQuantityAlert;

  const isExpired = harvestItem.expiryDate && new Date(harvestItem.expiryDate) <= new Date();
  const qualityInfo = getQualityInfo(harvestItem.quality);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          entering={FadeInDown.springify()}
          style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}
        >
          <View style={styles.headerContent}>
            <View style={[
              styles.iconContainer,
              { 
                backgroundColor: isLowStock 
                  ? theme.colors.warning + '20'
                  : isExpired
                    ? theme.colors.error + '20'
                    : theme.colors.success + '20'
              }
            ]}>
              <Text style={styles.harvestIconText}>
                {getTypeEmoji(harvestItem)}
              </Text>
              {isLowStock && <Text style={styles.statusIndicator}>⚠️</Text>}
              {isExpired && <Text style={styles.statusIndicator}>❗</Text>}
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
                {harvestItem.cropName}
              </Text>
              <View style={styles.badgeContainer}>
                <View 
                  style={[
                    styles.badge, 
                    { 
                      backgroundColor: harvestItem.type === 'vegetable' ? '#4CAF50' : 
                        harvestItem.type === 'fruit' ? '#FF9800' : 
                        harvestItem.type === 'grain' ? '#FFEB3B' : 
                        harvestItem.type === 'herb' ? '#8BC34A' : '#9E9E9E' 
                    }
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {getTypeNameFromItem(harvestItem)}
                  </Text>
                </View>
                <View 
                  style={[
                    styles.badge, 
                    { 
                      backgroundColor: (() => {
                        // Direct mapping for badge color
                        switch (harvestItem.quality) {
                          case 'premium': return '#4CAF50';
                          case 'standard': return '#FFC107';
                          case 'economy': case 'secondary': return '#FF9800';
                          default: return '#9E9E9E';
                        }
                      })()
                    }
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {qualityInfo.name}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.primary.surface }]}
              onPress={() => {
                navigation.navigate('AddHarvest', { 
                  harvestId: harvestItem?.id
                });
              }}
            >
              <MaterialCommunityIcons 
                name="pencil" 
                size={22} 
                color={theme.colors.primary.base} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.error + '10' }]}
              onPress={handleDelete}
            >
              <MaterialCommunityIcons 
                name="delete" 
                size={22} 
                color={theme.colors.error} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.content}>
          {renderSection('المعلومات الأساسية', '📊', <>
            {renderInfoRow('الكمية', `${harvestItem.quantity} ${getUnitAbbreviation(harvestItem.unit)}`, '📦')}
            {renderInfoRow('السعر', `${harvestItem.price} د.أ`, '💰')}
            {renderInfoRow('تاريخ الحصاد', new Date(harvestItem.harvestDate).toLocaleDateString('ar-SA'), '📅')}
            {renderInfoRow('الحد الأدنى للتنبيه', harvestItem.minQuantityAlert, '⚠️', true)}
          </>)}

          {renderSection('معلومات التخزين', '📦', <>
            {renderInfoRow('موقع التخزين', harvestItem.storageLocation, '📍', true)}
            {renderInfoRow('رقم الدفعة', harvestItem.batchNumber, '🔢', true)}
            {renderInfoRow('تاريخ انتهاء الصلاحية', harvestItem.expiryDate ? new Date(harvestItem.expiryDate).toLocaleDateString('ar-SA') : null, '⏳', true)}
            {renderInfoRow('ظروف التخزين', harvestItem.storageConditions, '🌡️', true)}
          </>)}

          {renderSection('معلومات الجودة', '🔍', <>
            {renderInfoRow('الجودة', qualityInfo.name, qualityInfo.icon)}
            {renderInfoRow('نسبة الرطوبة', harvestItem?.moisture && harvestItem.moisture > 0 ? `${harvestItem.moisture}%` : null, '💧', true)}
            {renderInfoRow('الشهادات', harvestItem.certifications, '🏅', true)}
          </>)}

          {harvestItem.notes && renderSection('ملاحظات', '📝', <>
            <Text style={[styles.notes, { color: theme.colors.neutral.textPrimary }]}>
              {harvestItem.notes}
            </Text>
          </>)}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.editButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={() => {
                navigation.navigate('AddHarvest', { 
                  harvestId: harvestItem?.id
                });
              }}
            >
              <MaterialCommunityIcons name="pencil" size={22} color="white" />
              <Text style={styles.buttonText}>تعديل</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.deleteButton, { backgroundColor: theme.colors.error }]}
              onPress={handleDelete}
            >
              <MaterialCommunityIcons name="delete" size={22} color="white" />
              <Text style={styles.buttonText}>حذف</Text>
            </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  harvestIconText: {
    fontSize: 36,
  },
  statusIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: '400',
    maxWidth: '60%',
    textAlign: 'left',
  },
  notes: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  notFoundText: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default HarvestDetailScreen; 