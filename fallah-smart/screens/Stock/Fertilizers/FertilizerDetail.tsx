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
import { useFertilizer } from '../../../context/FertilizerContext';
import { StockFertilizer } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';

type FertilizerDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'FertilizerDetail'>;
  route: RouteProp<StockStackParamList, 'FertilizerDetail'>;
};

const FertilizerDetailScreen: React.FC<FertilizerDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { fertilizers, updateFertilizer, deleteFertilizer, loading } = useFertilizer();
  const [fertilizerItem, setFertilizerItem] = useState<StockFertilizer | null>(null);

  useEffect(() => {
    const foundFertilizer = fertilizers.find(f => f.id === route.params.fertilizerId);
    if (foundFertilizer) {
      setFertilizerItem(foundFertilizer);
    }
  }, [fertilizers, route.params.fertilizerId]);

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
              await deleteFertilizer(route.params.fertilizerId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف السماد');
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

  if (!fertilizerItem) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <MaterialCommunityIcons
          name="fertilizer"
          size={48}
          color={theme.colors.neutral.textSecondary}
        />
        <Text style={[styles.errorText, { color: theme.colors.neutral.textSecondary }]}>
          لم يتم العثور على السماد
        </Text>
      </View>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'organic':
        return 'leaf';
      case 'inorganic':
        return 'flask';
      case 'bio':
        return 'bacteria';
      default:
        return 'fertilizer';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons
            name={getTypeIcon(fertilizerItem.type)}
            size={32}
            color={theme.colors.primary.base}
          />
          <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
            {fertilizerItem.name}
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
              {fertilizerItem.type}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              الكمية:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {fertilizerItem.quantity} {fertilizerItem.unit}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              السعر:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {fertilizerItem.price} د.أ
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              تاريخ الصلاحية:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {new Date(fertilizerItem.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            معلومات إضافية
          </Text>
          {fertilizerItem.manufacturer && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الشركة المصنعة:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {fertilizerItem.manufacturer}
              </Text>
            </View>
          )}
          {fertilizerItem.batchNumber && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                رقم الدفعة:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {fertilizerItem.batchNumber}
              </Text>
            </View>
          )}
          {fertilizerItem.purchaseDate && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                تاريخ الشراء:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {new Date(fertilizerItem.purchaseDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          {fertilizerItem.location && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الموقع:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {fertilizerItem.location}
              </Text>
            </View>
          )}
          {fertilizerItem.supplier && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                المورد:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {fertilizerItem.supplier}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            معلومات التركيب
          </Text>
          {fertilizerItem.composition && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                التركيب:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {fertilizerItem.composition}
              </Text>
            </View>
          )}
          {fertilizerItem.npk && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                نسبة NPK:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {fertilizerItem.npk}
              </Text>
            </View>
          )}
          {fertilizerItem.usageInstructions && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                تعليمات الاستخدام:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {fertilizerItem.usageInstructions}
              </Text>
            </View>
          )}
        </View>

        {fertilizerItem.notes && (
          <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
              ملاحظات
            </Text>
            <Text style={[styles.notes, { color: theme.colors.neutral.textPrimary }]}>
              {fertilizerItem.notes}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="تعديل"
            onPress={() => navigation.navigate('AddFertilizer', { fertilizerId: fertilizerItem.id })}
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

export default FertilizerDetailScreen; 