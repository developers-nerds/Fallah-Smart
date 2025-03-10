import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { usePesticide } from '../../../context/PesticideContext';
import { Pesticide } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';

type PesticideListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'PesticideList'>;
};

const PesticideListScreen: React.FC<PesticideListScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { pesticides, fetchPesticides, loading } = usePesticide();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchPesticides();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPesticides();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحديث قائمة المبيدات');
    } finally {
      setRefreshing(false);
    }
  }, [fetchPesticides]);

  const renderPesticideItem = ({ item }: { item: Pesticide }) => {
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'insecticide':
          return 'bug';
        case 'herbicide':
          return 'flower';
        case 'fungicide':
          return 'mushroom';
        default:
          return 'spray';
      }
    };

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.neutral.surface }]}
        onPress={() => navigation.navigate('PesticideDetail', { pesticideId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <MaterialCommunityIcons
              name={getTypeIcon(item.type)}
              size={24}
              color={theme.colors.primary.base}
            />
            <Text style={[styles.cardTitle, { color: theme.colors.neutral.textPrimary }]}>
              {item.name}
            </Text>
          </View>
          {item.isNatural && (
            <MaterialCommunityIcons
              name="leaf"
              size={20}
              color={theme.colors.success}
            />
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              الكمية:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {item.quantity} {item.unit}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              السعر:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {item.price} د.أ
            </Text>
          </View>

          {item.expiryDate && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                تاريخ الانتهاء:
              </Text>
              <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
                {new Date(item.expiryDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {item.quantity <= item.minQuantityAlert && (
          <View style={[styles.alert, { backgroundColor: '#FFEBEE' }]}>
            <MaterialCommunityIcons
              name="alert"
              size={16}
              color="#D32F2F"
            />
            <Text style={[styles.alertText, { color: '#D32F2F' }]}>
              المخزون منخفض
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          المبيدات
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={() => navigation.navigate('AddPesticide')}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={pesticides}
        renderItem={renderPesticideItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.base]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="spray"
              size={48}
              color={theme.colors.neutral.textSecondary}
            />
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              لا يوجد مبيدات
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardContent: {
    gap: 8,
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
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    padding: 8,
    borderRadius: 6,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
}));

export default PesticideListScreen;