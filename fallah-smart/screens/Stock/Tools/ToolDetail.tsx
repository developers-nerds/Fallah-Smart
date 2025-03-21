import React, { useState, useEffect, useCallback } from 'react';
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
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOOL_TYPES, TOOL_STATUS, TOOL_CONDITION, TOOL_ICONS, ToolType, ToolStatus, ToolCondition } from './constants';
import { storage } from '../../../utils/storage';
import axios from 'axios';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/date';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Field icons
const FIELD_ICONS = {
  name: '🔧',
  quantity: '📦',
  minQuantityAlert: '⚠️',
  category: '📑',
  status: '📊',
  condition: '🔍',
  purchaseDate: '📅',
  lastMaintenanceDate: '🔧',
  nextMaintenanceDate: '⏰',
  maintenanceInterval: '⌛',
  brand: '🏭',
  model: '📋',
  purchasePrice: '💰',
  replacementCost: '💲',
  storageLocation: '📍',
  assignedTo: '👨‍🔧',
  maintenanceNotes: '📝',
  usageInstructions: '📋',
  safetyGuidelines: '⚠️',
};

// Get tool icon based on category
const getToolIcon = (category: string): string => {
  if (!category) return '🔧';
  
  const toolType = TOOL_TYPES[category as ToolType];
  return toolType?.icon || '🔧';
};

// Get condition color
const getConditionColor = (condition: string, theme: any): string => {
  if (!condition) return theme.colors.neutral.border;
  
  const toolCondition = TOOL_CONDITION[condition as ToolCondition];
  return toolCondition?.color || theme.colors.neutral.border;
};

// Get status color
const getStatusColor = (status: string, theme: any): string => {
  if (!status) return theme.colors.neutral.border;
  
  const toolStatus = TOOL_STATUS[status as ToolStatus];
  return toolStatus?.color || theme.colors.neutral.border;
};

interface Tool {
  id: string;
  name: string;
  quantity: number;
  minQuantityAlert: number;
  category: ToolType;
  status: ToolStatus;
  condition: ToolCondition;
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
}

type ToolDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'ToolDetail'>;
  route: RouteProp<StockStackParamList, 'ToolDetail'>;
};

const ToolDetailScreen: React.FC<ToolDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToolDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/tools/${route.params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        }
      );

        setTool(response.data);
    } catch (error) {
      console.error('Error fetching tool details:', error);
      setError('فشل في تحميل تفاصيل الأداة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToolDetails();
  }, [route.params.id]);

  const handleDelete = useCallback(async () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه الأداة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              
              const tokens = await storage.getTokens();
              
              if (!tokens?.access) {
                Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
                return;
              }
              
              await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/stock/tools/${route.params.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${tokens.access}`
                  }
                }
              );

              navigation.goBack();
            } catch (error) {
              console.error('Error deleting tool:', error);
              Alert.alert('خطأ', 'فشل في حذف الأداة');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [route.params.id, navigation]);

  // Function to render fields with icons
  const renderField = useCallback((label: string, value: any, icon: string) => {
    if (value === null || value === undefined || value === '') return null;
    
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
          {typeof value === 'number' ? value.toLocaleString() : value.toString()}
        </Text>
      </Animated.View>
    );
  }, [theme.colors.neutral]);

  if (loading || isDeleting) {
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
              {isDeleting ? 'جاري الحذف...' : 'جاري التحميل...'}
            </Text>
          </Animated.View>
      </View>
      </SafeAreaView>
    );
  }

  if (error || !tool) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
        <View style={[styles.container, styles.centerContent]}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={48}
            color={theme.colors.neutral.textSecondary}
          />
          <Text style={[styles.errorText, { color: theme.colors.neutral.textSecondary }]}>
            {error || 'لم يتم العثور على الأداة'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary.base }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: theme.colors.neutral.surface }}>العودة للقائمة</Text>
          </TouchableOpacity>
      </View>
      </SafeAreaView>
    );
  }

  const needsMaintenance = tool.nextMaintenanceDate && 
                           new Date(tool.nextMaintenanceDate) <= new Date();
  
  const isLowStock = tool.minQuantityAlert && 
                     tool.quantity <= tool.minQuantityAlert;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
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
              { 
                backgroundColor: needsMaintenance
                  ? theme.colors.warning + '20'
                  : isLowStock
                    ? theme.colors.error + '20'
                    : tool.condition === 'poor'
                      ? theme.colors.warning + '20'
                      : theme.colors.success + '20'
              }
            ]}>
              <Text style={styles.toolIcon}>{getToolIcon(tool.category)}</Text>
              {needsMaintenance && <Text style={styles.statusIndicator}>⚠️</Text>}
              {isLowStock && <Text style={styles.statusIndicator}>❗</Text>}
      </View>

            <View style={styles.headerInfo}>
              <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
                {tool.name}
            </Text>
              <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>
                {TOOL_TYPES[tool.category]?.name || tool.category}
            </Text>
          </View>
        </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                {tool.quantity}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                الكمية
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <View style={[
                styles.statusIndicatorBadge,
                { backgroundColor: getConditionColor(tool.condition, theme) }
              ]}>
                <Text style={styles.statusIconText}>
                  {TOOL_CONDITION[tool.condition]?.icon || '❓'}
                </Text>
            </View>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                {TOOL_CONDITION[tool.condition]?.name || 'غير محدد'}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
              <View style={[
                styles.statusIndicatorBadge,
                { backgroundColor: getStatusColor(tool.status, theme) }
              ]}>
                <Text style={styles.statusIconText}>
                  {TOOL_STATUS[tool.status]?.icon || '❓'}
              </Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                {TOOL_STATUS[tool.status]?.name || 'غير محدد'}
              </Text>
            </View>
        </View>

          <View style={styles.headerActions}>
              <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={() => navigation.navigate('AddTool', { id: tool?.id })}
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
        </Animated.View>

        <View style={styles.content}>
          {/* Basic Information */}
          {renderField('اسم الأداة', tool.name, FIELD_ICONS.name)}
          {renderField('الكمية', tool.quantity, FIELD_ICONS.quantity)}
          {renderField('حد التنبيه', tool.minQuantityAlert, FIELD_ICONS.minQuantityAlert)}
          {renderField('النوع', TOOL_TYPES[tool.category]?.name || tool.category, FIELD_ICONS.category)}
          {renderField('الحالة', TOOL_STATUS[tool.status]?.name || tool.status, FIELD_ICONS.status)}
          {renderField('الحالة الفنية', TOOL_CONDITION[tool.condition]?.name || tool.condition, FIELD_ICONS.condition)}
          
          {/* Purchase Information */}
          {tool.purchaseDate && renderField(
            'تاريخ الشراء', 
            new Date(tool.purchaseDate).toLocaleDateString('ar-SA'), 
            FIELD_ICONS.purchaseDate
          )}
          {renderField('الشركة المصنعة', tool.brand, FIELD_ICONS.brand)}
          {renderField('الموديل', tool.model, FIELD_ICONS.model)}
          {tool.purchasePrice && renderField('سعر الشراء', `${tool.purchasePrice} د.أ`, FIELD_ICONS.purchasePrice)}
          {tool.replacementCost && renderField('تكلفة الاستبدال', `${tool.replacementCost} د.أ`, FIELD_ICONS.replacementCost)}
          
          {/* Location Information */}
          {renderField('موقع التخزين', tool.storageLocation, FIELD_ICONS.storageLocation)}
          {renderField('المستخدم الحالي', tool.assignedTo, FIELD_ICONS.assignedTo)}
          
          {/* Maintenance Information */}
          {tool.lastMaintenanceDate && renderField(
            'تاريخ آخر صيانة', 
            new Date(tool.lastMaintenanceDate).toLocaleDateString('ar-SA'), 
            FIELD_ICONS.lastMaintenanceDate
          )}
          {tool.nextMaintenanceDate && renderField(
            'تاريخ الصيانة القادمة', 
            new Date(tool.nextMaintenanceDate).toLocaleDateString('ar-SA'), 
            FIELD_ICONS.nextMaintenanceDate
          )}
          {tool.maintenanceInterval && renderField(
            'فترة الصيانة', 
            `${tool.maintenanceInterval} يوم`, 
            FIELD_ICONS.maintenanceInterval
          )}
          {renderField('ملاحظات الصيانة', tool.maintenanceNotes, FIELD_ICONS.maintenanceNotes)}
          
          {/* Instructions */}
          {renderField('تعليمات الاستخدام', tool.usageInstructions, FIELD_ICONS.usageInstructions)}
          {renderField('إرشادات السلامة', tool.safetyGuidelines, FIELD_ICONS.safetyGuidelines)}
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
    position: 'relative',
  },
  toolIcon: {
    fontSize: 40,
  },
  statusIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'right',
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
  statusIndicatorBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconText: {
    fontSize: 24,
    color: '#FFF',
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
  content: {
    padding: 24,
    gap: 16,
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
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
});

export default ToolDetailScreen; 