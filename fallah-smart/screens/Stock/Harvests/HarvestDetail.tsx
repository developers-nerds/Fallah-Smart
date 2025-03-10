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
import { useHarvest } from '../../../context/HarvestContext';
import { StockHarvest } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';

type HarvestDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'HarvestDetail'>;
  route: RouteProp<StockStackParamList, 'HarvestDetail'>;
};

const HarvestDetailScreen: React.FC<HarvestDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { harvests, updateHarvest, deleteHarvest, loading } = useHarvest();
  const [harvestItem, setHarvestItem] = useState<StockHarvest | null>(null);

  useEffect(() => {
    const foundHarvest = harvests.find(h => h.id === route.params.harvestId);
    if (foundHarvest) {
      setHarvestItem(foundHarvest);
    }
  }, [harvests, route.params.harvestId]);

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
              await deleteHarvest(route.params.harvestId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف المحصول');
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

  if (!harvestItem) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <MaterialCommunityIcons
          name="food"
          size={48}
          color={theme.colors.neutral.textSecondary}
        />
        <Text style={[styles.errorText, { color: theme.colors.neutral.textSecondary }]}>
          لم يتم العثور على المحصول
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
      case 'herb':
        return 'leaf';
      default:
        return 'food';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons
            name={getTypeIcon(harvestItem.type)}
            size={32}
            color={theme.colors.primary.base}
          />
          <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
            {harvestItem.name}
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
              {harvestItem.type}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              الكمية:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {harvestItem.quantity} {harvestItem.unit}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              السعر:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {harvestItem.price} د.أ
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              تاريخ الحصاد:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {new Date(harvestItem.harvestDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            معلومات إضافية
          </Text>
          {harvestItem.variety && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الصنف:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {harvestItem.variety}
              </Text>
            </View>
          )}
          {harvestItem.location && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                موقع الحصاد:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {harvestItem.location}
              </Text>
            </View>
          )}
          {harvestItem.quality && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الجودة:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {harvestItem.quality}
              </Text>
            </View>
          )}
          {harvestItem.storageConditions && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                ظروف التخزين:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {harvestItem.storageConditions}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            معلومات الحصاد
          </Text>
          {harvestItem.harvestMethod && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                طريقة الحصاد:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {harvestItem.harvestMethod}
              </Text>
            </View>
          )}
          {harvestItem.yield && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الإنتاجية:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {harvestItem.yield}
              </Text>
            </View>
          )}
          {harvestItem.weatherConditions && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الظروف الجوية:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {harvestItem.weatherConditions}
              </Text>
            </View>
          )}
        </View>

        {harvestItem.notes && (
          <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
              ملاحظات
            </Text>
            <Text style={[styles.notes, { color: theme.colors.neutral.textPrimary }]}>
              {harvestItem.notes}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="تعديل"
            onPress={() => navigation.navigate('AddHarvest', { harvestId: harvestItem.id })}
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

export default HarvestDetailScreen; 