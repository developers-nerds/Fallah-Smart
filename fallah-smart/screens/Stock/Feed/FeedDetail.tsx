import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StockFeed } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import axios from 'axios';
import { storage } from '../../../utils/storage';

type FeedDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'FeedDetail'>;
  route: RouteProp<StockStackParamList, 'FeedDetail'>;
};

const FeedDetailScreen: React.FC<FeedDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const [feedItem, setFeedItem] = useState<StockFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedItem = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        setError('الرجاء تسجيل الدخول أولا');
        return;
      }
      
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/feed/${route.params.feedId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        }
      );
      
      if (response.data) {
        setFeedItem(response.data);
      }
    } catch (error) {
      console.error('Error fetching feed item:', error);
      setError('فشل في جلب بيانات العلف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedItem();
  }, [route.params.feedId]);

  const handleDelete = async () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا العلف؟',
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
              
              const tokens = await storage.getTokens();
              
              if (!tokens?.access) {
                Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
                return;
              }
              
              await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/stock/feed/${route.params.feedId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${tokens.access}`
                  }
                }
              );
              
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting feed:', error);
              Alert.alert('خطأ', 'فشل في حذف العلف');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading || isDeleting) {
    return (
      <View style={[styles(theme).container, styles(theme).centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        {isDeleting && <Text style={{ color: theme.colors.neutral.textSecondary, marginTop: 16 }}>جاري الحذف...</Text>}
        {loading && !isDeleting && <Text style={{ color: theme.colors.neutral.textSecondary, marginTop: 16 }}>جاري التحميل...</Text>}
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles(theme).container, styles(theme).centerContent]}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={48}
          color={theme.colors.neutral.textSecondary}
        />
        <Text style={[styles(theme).errorText, { color: theme.colors.neutral.textSecondary }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles(theme).retryButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={fetchFeedItem}
        >
          <Text style={{ color: theme.colors.neutral.surface }}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!feedItem) {
    return (
      <View style={[styles(theme).container, styles(theme).centerContent]}>
        <MaterialCommunityIcons
          name="food"
          size={48}
          color={theme.colors.neutral.textSecondary}
        />
        <Text style={[styles(theme).errorText, { color: theme.colors.neutral.textSecondary }]}>
          لم يتم العثور على العلف
        </Text>
        <TouchableOpacity
          style={[styles(theme).retryButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: theme.colors.neutral.surface }}>العودة للقائمة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getAnimalTypeIcon = (animalType: string) => {
    switch (animalType) {
      case 'cattle':
        return 'cow';
      case 'sheep':
        return 'sheep';
      case 'poultry':
        return 'duck';
      case 'camel':
        return 'camel';
      case 'fish':
        return 'fish';
      default:
        return 'food';
    }
  };

  const getAnimalTypeInArabic = (animalType: string) => {
    switch (animalType) {
      case 'cattle':
        return 'أبقار';
      case 'sheep':
        return 'أغنام';
      case 'poultry':
        return 'دواجن';
      case 'camel':
        return 'إبل';
      case 'fish':
        return 'أسماك';
      default:
        return 'أخرى';
    }
  };

  return (
    <ScrollView style={styles(theme).container}>
      <View style={[styles(theme).header, { backgroundColor: theme.colors.neutral.surface }]}>
        <View style={styles(theme).headerContent}>
          <MaterialCommunityIcons
            name={getAnimalTypeIcon(feedItem.animalType)}
            size={32}
            color={theme.colors.primary.base}
          />
          <Text style={[styles(theme).title, { color: theme.colors.neutral.textPrimary }]}>
            {feedItem.name}
          </Text>
        </View>
      </View>

      <View style={styles(theme).content}>
        <View style={[styles(theme).section, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles(theme).sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            المعلومات الأساسية
          </Text>
          <View style={styles(theme).infoRow}>
            <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
              نوع الحيوان:
            </Text>
            <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
              {getAnimalTypeInArabic(feedItem.animalType)}
            </Text>
          </View>
          <View style={styles(theme).infoRow}>
            <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
              الكمية:
            </Text>
            <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
              {feedItem.quantity} {feedItem.unit}
            </Text>
          </View>
          <View style={styles(theme).infoRow}>
            <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
              الحد الأدنى للتنبيه:
            </Text>
            <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
              {feedItem.minQuantityAlert} {feedItem.unit}
            </Text>
          </View>
          <View style={styles(theme).infoRow}>
            <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
              معدل الإستهلاك اليومي:
            </Text>
            <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
              {feedItem.dailyConsumptionRate} {feedItem.unit}/يوم
            </Text>
          </View>
          <View style={styles(theme).infoRow}>
            <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
              السعر:
            </Text>
            <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
              {feedItem.price} د.أ
            </Text>
          </View>
          <View style={styles(theme).infoRow}>
            <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
              تاريخ الصلاحية:
            </Text>
            <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
              {new Date(feedItem.expiryDate).toLocaleDateString('ar-EG')}
            </Text>
          </View>
        </View>

        <View style={[styles(theme).section, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles(theme).sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            معلومات إضافية
          </Text>
          {feedItem.manufacturer && (
            <View style={styles(theme).infoRow}>
              <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
                الشركة المصنعة:
              </Text>
              <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.manufacturer}
              </Text>
            </View>
          )}
          {feedItem.batchNumber && (
            <View style={styles(theme).infoRow}>
              <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
                رقم الدفعة:
              </Text>
              <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.batchNumber}
              </Text>
            </View>
          )}
          {feedItem.purchaseDate && (
            <View style={styles(theme).infoRow}>
              <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
                تاريخ الشراء:
              </Text>
              <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
                {new Date(feedItem.purchaseDate).toLocaleDateString('ar-EG')}
              </Text>
            </View>
          )}
          {feedItem.location && (
            <View style={styles(theme).infoRow}>
              <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
                الموقع:
              </Text>
              <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.location}
              </Text>
            </View>
          )}
          {feedItem.supplier && (
            <View style={styles(theme).infoRow}>
              <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
                المورد:
              </Text>
              <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.supplier}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles(theme).section, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles(theme).sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            معلومات التغذية
          </Text>
          {feedItem.nutritionalInfo && (
            <View style={styles(theme).infoRow}>
              <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
                المعلومات الغذائية:
              </Text>
              <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.nutritionalInfo}
              </Text>
            </View>
          )}
          {feedItem.recommendedUsage && (
            <View style={styles(theme).infoRow}>
              <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
                الاستخدام الموصى به:
              </Text>
              <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.recommendedUsage}
              </Text>
            </View>
          )}
          {feedItem.targetAnimals && (
            <View style={styles(theme).infoRow}>
              <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
                الحيوانات المستهدفة:
              </Text>
              <Text style={[styles(theme).value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.targetAnimals}
              </Text>
            </View>
          )}
        </View>

        {feedItem.notes && (
          <View style={[styles(theme).section, { backgroundColor: theme.colors.neutral.surface }]}>
            <Text style={[styles(theme).sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
              ملاحظات
            </Text>
            <Text style={[styles(theme).notes, { color: theme.colors.neutral.textPrimary }]}>
              {feedItem.notes}
            </Text>
          </View>
        )}

        <View style={styles(theme).buttonContainer}>
          <Button
            title="تعديل"
            onPress={() => navigation.navigate('AddFeed', { feedId: feedItem.id })}
            variant="primary"
          />
          <Button
            title="حذف"
            onPress={handleDelete}
            variant="danger"
            disabled={isDeleting}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    textAlign: 'right',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
    marginBottom: 24,
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

export default FeedDetailScreen; 