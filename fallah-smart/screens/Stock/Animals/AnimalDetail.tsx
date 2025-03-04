import React, { useCallback, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  Alert,
  Dimensions 
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useStock } from '../../../context/StockContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animal, HealthStatus } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { RouteProp } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type AnimalDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AnimalDetail'>;
  route: RouteProp<StockStackParamList, 'AnimalDetail'>;
};

const getHealthStatusColor = (status: HealthStatus, theme: any) => {
  switch (status) {
    case 'excellent':
      return theme.colors.success;
    case 'good':
      return theme.colors.primary.base;
    case 'fair':
      return theme.colors.warning;
    case 'poor':
      return theme.colors.error;
    default:
      return theme.colors.neutral.textSecondary;
  }
};

const getHealthStatusLabel = (status: HealthStatus): string => {
  switch (status) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Bon';
    case 'fair':
      return 'Moyen';
    case 'poor':
      return 'Mauvais';
    default:
      return status;
  }
};

const getAnimalIcon = (type: string): string => {
  const lowercaseType = type.toLowerCase();
  if (lowercaseType.includes('vache') || lowercaseType.includes('boeuf')) return 'cow';
  if (lowercaseType.includes('mouton') || lowercaseType.includes('brebis')) return 'sheep';
  if (lowercaseType.includes('poule') || lowercaseType.includes('coq')) return 'bird';
  if (lowercaseType.includes('chèvre')) return 'goat';
  return 'paw';
};

export const AnimalDetailScreen = ({ navigation, route }: AnimalDetailScreenProps) => {
  const theme = useTheme();
  const { animals, deleteAnimal, addAnimalQuantity, removeAnimalQuantity } = useStock();
  const [isDeleting, setIsDeleting] = useState(false);

  const animal = animals.find(a => a.id === route.params.animalId);

  if (!animal) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Animal non trouvé
        </Text>
      </View>
    );
  }

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Supprimer l\'animal',
      'Êtes-vous sûr de vouloir supprimer cet animal ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAnimal(animal.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting animal:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [animal.id, deleteAnimal, navigation]);

  const handleQuantityChange = useCallback(async (action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        await addAnimalQuantity(animal.id, 1);
      } else {
        await removeAnimalQuantity(animal.id, 1);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la modification de la quantité');
    }
  }, [animal.id, addAnimalQuantity, removeAnimalQuantity]);

  const renderInfoSection = (title: string, icon: string, content: string | null) => {
    if (!content) return null;

    return (
      <View style={[styles.infoSection, { backgroundColor: theme.colors.neutral.surface }]}>
        <View style={styles.infoHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary.base }]}>
            <MaterialCommunityIcons
              name={icon}
              size={24}
              color="#FFF"
            />
          </View>
          <Text style={[styles.infoTitle, { color: theme.colors.neutral.textPrimary }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.infoContent, { color: theme.colors.neutral.textSecondary }]}>
          {content}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <ScrollView style={styles.scrollView}>
        <Animated.View 
          entering={FadeInDown.springify()}
          style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}
        >
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary.base }]}>
              <MaterialCommunityIcons
                name={getAnimalIcon(animal.type)}
                size={32}
                color="#FFF"
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.animalType, { color: theme.colors.neutral.textPrimary }]}>
                {animal.type}
              </Text>
              <Text style={[styles.animalGender, { color: theme.colors.neutral.textSecondary }]}>
                {animal.gender === 'male' ? 'Mâle' : 'Femelle'}
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: theme.colors.error }]}
                onPress={() => handleQuantityChange('remove')}
                disabled={animal.count === 0 || isDeleting}
              >
                <MaterialCommunityIcons name="minus" size={20} color="#FFF" />
              </TouchableOpacity>
              <View style={[styles.quantityDisplay, { backgroundColor: theme.colors.primary.base }]}>
                <Text style={[styles.quantityText, { color: '#FFF' }]}>
                  {animal.count}
                </Text>
                <Text style={[styles.quantityLabel, { color: '#FFF' }]}>
                  animaux
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: theme.colors.success }]}
                onPress={() => handleQuantityChange('add')}
                disabled={isDeleting}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={[
              styles.healthStatus,
              { backgroundColor: getHealthStatusColor(animal.healthStatus, theme) }
            ]}>
              <MaterialCommunityIcons name="heart-pulse" size={20} color="#FFF" />
              <Text style={styles.healthText}>
                {getHealthStatusLabel(animal.healthStatus)}
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.content}>
          {renderInfoSection('Programme d\'alimentation', 'food-apple', animal.feedingSchedule)}
          {renderInfoSection('Alimentation', 'food', animal.feeding)}
          {renderInfoSection('Soins', 'medical-bag', animal.care)}
          {renderInfoSection('Santé', 'heart-pulse', animal.health)}
          {renderInfoSection('Logement', 'home', animal.housing)}
          {renderInfoSection('Reproduction', 'baby-face', animal.breeding)}
          {renderInfoSection('Maladies', 'virus', animal.diseases)}
          {renderInfoSection('Médicaments', 'pill', animal.medications)}
          {renderInfoSection('Comportement', 'eye', animal.behavior)}
          {renderInfoSection('Économie', 'cash', animal.economics)}
          {renderInfoSection('Vaccination', 'needle', animal.vaccination)}
          {renderInfoSection('Notes', 'note-text', animal.notes)}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.neutral.surface }]}>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <MaterialCommunityIcons name="trash-can" size={24} color="#FFF" />
          <Text style={styles.deleteButtonText}>
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    padding: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  animalType: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  animalGender: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '600',
  },
  quantityLabel: {
    fontSize: 12,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
  },
  healthText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  infoContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    marginTop: 8,
  },
}); 