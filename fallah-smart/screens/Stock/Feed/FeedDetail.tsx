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
import { useFeed } from '../../../context/FeedContext';
import { StockFeed } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';

type FeedDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'FeedDetail'>;
  route: RouteProp<StockStackParamList, 'FeedDetail'>;
};

const FeedDetailScreen: React.FC<FeedDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { feeds, updateFeed, deleteFeed, loading } = useFeed();
  const [feedItem, setFeedItem] = useState<StockFeed | null>(null);

  useEffect(() => {
    const foundFeed = feeds.find(f => f.id === route.params.feedId);
    if (foundFeed) {
      setFeedItem(foundFeed);
    }
  }, [feeds, route.params.feedId]);

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
              await deleteFeed(route.params.feedId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف العلف');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (!feedItem) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <MaterialCommunityIcons
          name="food"
          size={48}
          color={theme.colors.neutral.textSecondary}
        />
        <Text style={[styles.errorText, { color: theme.colors.neutral.textSecondary }]}>
          لم يتم العثور على العلف
        </Text>
      </View>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hay':
        return 'grass';
      case 'grain':
        return 'wheat';
      case 'pellets':
        return 'food-variant';
      case 'supplement':
        return 'pill';
      default:
        return 'food';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons
            name={getTypeIcon(feedItem.type)}
            size={32}
            color={theme.colors.primary.base}
          />
          <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
            {feedItem.name}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            المعلومات الأساسية
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              النوع:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {feedItem.type}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              الكمية:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {feedItem.quantity} {feedItem.unit}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              السعر:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {feedItem.price} د.أ
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              تاريخ الصلاحية:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {new Date(feedItem.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            معلومات إضافية
          </Text>
          {feedItem.manufacturer && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الشركة المصنعة:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.manufacturer}
              </Text>
            </View>
          )}
          {feedItem.batchNumber && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                رقم الدفعة:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.batchNumber}
              </Text>
            </View>
          )}
          {feedItem.purchaseDate && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                تاريخ الشراء:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {new Date(feedItem.purchaseDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          {feedItem.location && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الموقع:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.location}
              </Text>
            </View>
          )}
          {feedItem.supplier && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                المورد:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.supplier}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            معلومات التغذية
          </Text>
          {feedItem.nutritionalInfo && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                المعلومات الغذائية:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.nutritionalInfo}
              </Text>
            </View>
          )}
          {feedItem.recommendedUsage && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الاستخدام الموصى به:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.recommendedUsage}
              </Text>
            </View>
          )}
          {feedItem.targetAnimals && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الحيوانات المستهدفة:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {feedItem.targetAnimals}
              </Text>
            </View>
          )}
        </View>

        {feedItem.notes && (
          <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
              ملاحظات
            </Text>
            <Text style={[styles.notes, { color: theme.colors.neutral.textPrimary }]}>
              {feedItem.notes}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="تعديل"
            onPress={() => navigation.navigate('AddFeed', { feedId: feedItem.id })}
            variant="primary"
          />
          <Button
            title="حذف"
            onPress={handleDelete}
            variant="danger"
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = createThemedStyles((theme) => ({
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
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
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
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
  },
}));

export default FeedDetailScreen; 