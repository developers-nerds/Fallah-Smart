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
import { useEquipment } from '../../../context/EquipmentContext';
import { StockEquipment } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';

type EquipmentDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'EquipmentDetail'>;
  route: RouteProp<StockStackParamList, 'EquipmentDetail'>;
};

const EquipmentDetailScreen: React.FC<EquipmentDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { equipment, updateEquipment, deleteEquipment, loading } = useEquipment();
  const [equipmentItem, setEquipmentItem] = useState<StockEquipment | null>(null);

  useEffect(() => {
    const foundEquipment = equipment.find(e => e.id === route.params.equipmentId);
    if (foundEquipment) {
      setEquipmentItem(foundEquipment);
    }
  }, [equipment, route.params.equipmentId]);

  const handleDelete = async () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه المعدة؟',
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
              await deleteEquipment(route.params.equipmentId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف المعدة');
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

  if (!equipmentItem) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <MaterialCommunityIcons
          name="tools"
          size={48}
          color={theme.colors.neutral.textSecondary}
        />
        <Text style={[styles.errorText, { color: theme.colors.neutral.textSecondary }]}>
          لم يتم العثور على المعدة
        </Text>
      </View>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tractor':
        return 'tractor';
      case 'harvester':
        return 'combine';
      case 'irrigation':
        return 'water-pump';
      case 'storage':
        return 'warehouse';
      case 'processing':
        return 'factory';
      default:
        return 'tools';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons
            name={getTypeIcon(equipmentItem.type)}
            size={32}
            color={theme.colors.primary.base}
          />
          <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
            {equipmentItem.name}
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
              {equipmentItem.type}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              الكمية:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {equipmentItem.quantity} {equipmentItem.unit}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              السعر:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {equipmentItem.price} د.أ
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              الحالة:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {equipmentItem.condition}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            معلومات إضافية
          </Text>
          {equipmentItem.manufacturer && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الشركة المصنعة:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {equipmentItem.manufacturer}
              </Text>
            </View>
          )}
          {equipmentItem.model && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الموديل:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {equipmentItem.model}
              </Text>
            </View>
          )}
          {equipmentItem.serialNumber && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الرقم التسلسلي:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {equipmentItem.serialNumber}
              </Text>
            </View>
          )}
          {equipmentItem.purchaseDate && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                تاريخ الشراء:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {new Date(equipmentItem.purchaseDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          {equipmentItem.warrantyExpiryDate && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                تاريخ انتهاء الضمان:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {new Date(equipmentItem.warrantyExpiryDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          {equipmentItem.location && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الموقع:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {equipmentItem.location}
              </Text>
            </View>
          )}
          {equipmentItem.supplier && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                المورد:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {equipmentItem.supplier}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            معلومات الصيانة
          </Text>
          {equipmentItem.lastMaintenanceDate && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                تاريخ آخر صيانة:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {new Date(equipmentItem.lastMaintenanceDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          {equipmentItem.nextMaintenanceDate && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                تاريخ الصيانة القادمة:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {new Date(equipmentItem.nextMaintenanceDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {equipmentItem.notes && (
          <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
              ملاحظات
            </Text>
            <Text style={[styles.notes, { color: theme.colors.neutral.textPrimary }]}>
              {equipmentItem.notes}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="تعديل"
            onPress={() => navigation.navigate('AddEquipment', { equipmentId: equipmentItem.id })}
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

export default EquipmentDetailScreen; 