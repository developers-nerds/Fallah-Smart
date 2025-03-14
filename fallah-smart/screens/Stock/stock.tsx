import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ScrollView,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StockCategory } from './types';
import Animated, { 
  FadeInDown
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = width * 0.42; // Slightly less than half to ensure 2 per row

type StockScreenNavigationProp = StackNavigationProp<StockStackParamList, 'StockList'>;

const categories: { value: StockCategory; label: string; icon: string }[] = [
  { value: 'seeds', label: 'البذور', icon: '🌾' },
  { value: 'fertilizer', label: 'الأسمدة', icon: '🪣' },
  { value: 'harvest', label: 'المحاصيل', icon: '🌽' },
  { value: 'feed', label: 'الأعلاف', icon: '🌿' },
  { value: 'pesticide', label: 'المبيدات', icon: '🧪' },
  { value: 'equipment', label: 'المعدات', icon: '🚜' },
  { value: 'tools', label: 'الأدوات', icon: '🛠️' },
  { value: 'animals', label: 'الحيوانات', icon: '🐄' }
];

const StockScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<StockScreenNavigationProp>();

  const handleCategoryPress = (category: StockCategory) => {
    switch (category) {
      case 'animals':
        navigation.navigate('Animals');
        break;
      case 'pesticide':
        navigation.navigate('PesticideList');
        break;
      case 'tools':
        navigation.navigate('ToolList');
        break;
      case 'equipment':
        navigation.navigate('EquipmentList');
        break;
      case 'seeds':
        navigation.navigate('SeedList');
        break;
      case 'feed':
        navigation.navigate('FeedList');
        break;
      case 'harvest':
        navigation.navigate('HarvestList');
        break;
      case 'fertilizer':
        navigation.navigate('FertilizerList');
        break;
      default:
        navigation.navigate('StockList', { category });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.neutral.background,
    },
    header: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral.border,
    },
    headerTitle: {
      fontSize: theme.fontSizes.h1,
      fontFamily: theme.fonts.bold,
      color: theme.colors.neutral.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    content: {
      padding: theme.spacing.md,
    },
    statsWrapper: {
      width: '100%',
      marginBottom: theme.spacing.md,
    },
    statsButton: {
      width: '100%',
      aspectRatio: 2.5, // Make it less tall than other buttons
      backgroundColor: theme.colors.neutral.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...theme.shadows.medium,
    },
    statsIcon: {
      fontSize: 32,
      marginRight: theme.spacing.sm,
    },
    statsLabel: {
      fontSize: theme.fontSizes.h2,
      fontFamily: theme.fonts.medium,
      color: theme.colors.neutral.textPrimary,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    categoryWrapper: {
      width: '48%',
      marginBottom: theme.spacing.md,
    },
    categoryButton: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: theme.colors.neutral.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.medium,
    },
    categoryIcon: {
      fontSize: 48,
      marginBottom: theme.spacing.sm,
    },
    categoryLabel: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fonts.medium,
      color: theme.colors.neutral.textPrimary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المخزون</Text>
      </View>

      <ScrollView style={styles.content}>
        <Animated.View
          style={styles.statsWrapper}
          entering={FadeInDown.delay(0)}
        >
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => navigation.navigate('Statistics')}
          >
            <Text style={styles.statsIcon}>📊</Text>
            <Text style={styles.statsLabel}>الإحصائيات</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <Animated.View
              key={category.value}
              style={styles.categoryWrapper}
              entering={FadeInDown.delay((index + 1) * 100)}
            >
              <TouchableOpacity
                style={styles.categoryButton}
                onPress={() => handleCategoryPress(category.value)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default StockScreen;
