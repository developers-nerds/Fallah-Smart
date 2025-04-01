import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  Alert,
  FlatList
} from 'react-native';
import axios from 'axios';
import { getCurrentUser } from '../Education/utils/userProgress';
import { theme } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdvisorStackParamList } from '../../navigation/types';
import { mapAnimalIdToQuizId, mapCropIdToQuizId } from './utils/quizMapping';

const API_URL = process.env.EXPO_PUBLIC_API_URL 

interface Animal {
  id: number;
  name: string;
  icon: string;
  category: string;
  videoUrl?: string;
  quizId?: number;
}

interface Crop {
  id: number;
  name: string;
  icon: string;
  category: string;
  videoUrl?: string;
  quizId?: number;
}

// Update the AdvisorStackParamList type in navigation/types.ts if needed
// This is for reference only
type EnhancedAdvisorStackParamList = AdvisorStackParamList & {
  QuizForm: { type: 'animal' | 'crop' };
  QuestionManagement: { quizId: number; title?: string; type?: 'animal' | 'crop' };
};

const Advisor = () => {
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<'animal' | 'crop'>('animal');
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fetchingItems, setFetchingItems] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<EnhancedAdvisorStackParamList>>();

  useEffect(() => {
    checkUserRole();
  }, []);
  
  useEffect(() => {
    if (!loading) {
      fetchItems();
    }
  }, [activeType, loading]);

  const checkUserRole = async () => {
    try {
      const userData = await getCurrentUser();
      if (!userData || userData.role !== 'ADVISOR') {
        Alert.alert('عذراً', 'لا يمكنك الوصول إلى هذه الصفحة. يجب أن تكون مستشاراً.');
        navigation.goBack();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء التحقق من صلاحيات المستخدم');
      navigation.goBack();
    }
  };

  const fetchItems = async () => {
    setFetchingItems(true);
    try {
      if (activeType === 'animal') {
        const response = await axios.get(`${API_URL}/education/animals`);
        console.log('Animals response:', response.data);
        const mappedAnimals = response.data.map((animal: any) => ({
          ...animal,
          quizId: mapAnimalIdToQuizId(animal.id)
        }));
        setAnimals(mappedAnimals);
      } else {
        const response = await axios.get(`${API_URL}/education/crops`);
        console.log('Crops response:', response.data);
        const mappedCrops = response.data.map((crop: any) => ({
          ...crop,
          quizId: mapCropIdToQuizId(crop.id)
        }));
        setCrops(mappedCrops);
      }
    } catch (error) {
      console.error(`Error fetching ${activeType}s:`, error);
    } finally {
      setFetchingItems(false);
    }
  };

  const handleTypeToggle = (type: 'animal' | 'crop') => {
    setActiveType(type);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleItemPress = (item: any) => {
    const quizId = activeType === 'animal' ? 
      mapAnimalIdToQuizId(item.id) : 
      mapCropIdToQuizId(item.id);
    
    navigation.navigate('QuestionManagement', { 
      quizId,
      title: item.name,
      type: activeType
    });
  };

  const renderItem = ({ item }: { item: Animal | Crop }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <Text style={styles.itemName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
        >
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة المحتوى التعليمي</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      <View style={styles.typeFilterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            activeType === 'animal' && styles.activeFilterButton
          ]}
          onPress={() => handleTypeToggle('animal')}
        >
          <MaterialIcons name="pets" size={16} color={activeType === 'animal' ? '#fff' : theme.colors.primary.base} />
          <Text style={[
            styles.filterButtonText,
            activeType === 'animal' && styles.activeFilterText
          ]}>
            الحيوانات
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton,
            activeType === 'crop' && styles.activeFilterButton
          ]}
          onPress={() => handleTypeToggle('crop')}
        >
          <MaterialIcons name="grass" size={16} color={activeType === 'crop' ? '#fff' : theme.colors.primary.base} />
          <Text style={[
            styles.filterButtonText,
            activeType === 'crop' && styles.activeFilterText
          ]}>
            المحاصيل
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {fetchingItems ? (
          <View style={styles.loadingItemsContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.base} />
            <Text style={styles.loadingText}>جاري تحميل {activeType === 'animal' ? 'الحيوانات' : 'المحاصيل'}...</Text>
          </View>
        ) : (
          <FlatList
            data={activeType === 'animal' ? animals : crops}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            contentContainerStyle={styles.itemsGrid}
            columnWrapperStyle={styles.row}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons 
                  name={activeType === 'animal' ? 'pets' : 'grass'} 
                  size={60} 
                  color={theme.colors.neutral.textSecondary} 
                />
                <Text style={styles.emptyText}>
                  لا توجد {activeType === 'animal' ? 'حيوانات' : 'محاصيل'} متاحة حاليًا
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: theme.colors.primary.base,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.medium,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerPlaceholder: {
    width: 40,
  },
  typeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.small,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.small,
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
    flex: 1,
    marginHorizontal: 8,
  },
  activeFilterButton: {
    backgroundColor: theme.colors.primary.base,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary.base,
    marginLeft: 8,
  },
  activeFilterText: {
    color: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  loadingItemsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.neutral.textSecondary,
  },
  itemsGrid: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  itemCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: '1%',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    width: '60%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconText: {
    fontSize: 32,
    textAlign: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginTop: 8,
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
  }
});

export default Advisor;
