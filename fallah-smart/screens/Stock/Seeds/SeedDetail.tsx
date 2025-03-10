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
import { useSeed } from '../../../context/SeedContext';
import { StockSeed } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';

type SeedDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'SeedDetail'>;
  route: RouteProp<StockStackParamList, 'SeedDetail'>;
};

const SeedDetailScreen: React.FC<SeedDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { seeds, updateSeed, deleteSeed, loading } = useSeed();
  const [seedItem, setSeedItem] = useState<StockSeed | null>(null);

  useEffect(() => {
    const foundSeed = seeds.find(s => s.id === route.params.seedId);
    if (foundSeed) {
      setSeedItem(foundSeed);
    }
  }, [seeds, route.params.seedId]);

  const handleDelete = async () => {
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
              await deleteSeed(route.params.seedId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف البذور');
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

  if (!seedItem) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <MaterialCommunityIcons
          name="seed"
          size={48}
          color={theme.colors.neutral.textSecondary}
        />
        <Text style={[styles.errorText, { color: theme.colors.neutral.textSecondary }]}>
          لم يتم العثور على البذور
        </Text>
      </View>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vegetable':
        return 'food-variant';
      case 'fruit':
        return 'fruit-watermelon';
      case 'grain':
        return 'wheat';
      case 'flower':
        return 'flower';
      default:
        return 'seed';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons
            name={getTypeIcon(seedItem.type)}
            size={32}
            color={theme.colors.primary.base}
          />
          <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
            {seedItem.name}
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
              {seedItem.type}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              الكمية:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {seedItem.quantity} {seedItem.unit}
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
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {new Date(seedItem.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
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
                {new Date(seedItem.purchaseDate).toLocaleDateString()}
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
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
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
        </View>

        {seedItem.notes && (
          <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
              ملاحظات
            </Text>
            <Text style={[styles.notes, { color: theme.colors.neutral.textPrimary }]}>
              {seedItem.notes}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="تعديل"
            onPress={() => navigation.navigate('AddSeed', { seedId: seedItem.id })}
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

export default SeedDetailScreen; 