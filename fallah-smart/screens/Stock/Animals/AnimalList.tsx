import React from 'react';
import { View, FlatList, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useStock } from '../../../context/StockContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';

const AnimalList = () => {
  const theme = useTheme();
  const { animals, deleteAnimal, addAnimalQuantity, removeAnimalQuantity } = useStock();

  const handleDeleteAnimal = (id: string) => {
    Alert.alert(
      'Supprimer l\'animal',
      'Êtes-vous sûr de vouloir supprimer cet animal?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          onPress: () => deleteAnimal(id),
          style: 'destructive',
        },
      ]
    );
  };

  const handleQuantityChange = (id: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      addAnimalQuantity(id, 1);
    } else {
      removeAnimalQuantity(id, 1);
    }
  };

  const renderAnimalItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.neutral.surface }]}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="cow" size={24} color={theme.colors.primary.base} />
        <View style={styles.animalInfo}>
          <Text style={[styles.animalType, { color: theme.colors.neutral.textPrimary }]}>
            {item.type} ({item.gender === 'male' ? 'Mâle' : 'Femelle'})
          </Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              onPress={() => handleQuantityChange(item.id, 'remove')}
              style={[styles.quantityButton, { 
                backgroundColor: theme.colors.error,
                opacity: item.count > 0 ? 1 : 0.5 
              }]}
              disabled={item.count === 0}
            >
              <MaterialCommunityIcons 
                name="minus" 
                size={16} 
                color={theme.colors.neutral.surface} 
              />
            </TouchableOpacity>
            <Text style={[styles.quantityText, { color: theme.colors.neutral.textPrimary }]}>
              {item.count}
            </Text>
            <TouchableOpacity
              onPress={() => handleQuantityChange(item.id, 'add')}
              style={[styles.quantityButton, { backgroundColor: theme.colors.success }]}
            >
              <MaterialCommunityIcons 
                name="plus" 
                size={16} 
                color={theme.colors.neutral.surface} 
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteAnimal(item.id)}
            style={styles.deleteButton}
          >
            <MaterialCommunityIcons 
              name="trash-can-outline" 
              size={20} 
              color={theme.colors.error} 
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.infoText, { color: theme.colors.neutral.textPrimary }]}>
          Santé: {item.healthStatus}
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.neutral.textPrimary }]}>
          Alimentation: {item.feedingSchedule}
        </Text>
        {item.notes && (
          <Text style={[styles.infoText, { color: theme.colors.neutral.textPrimary }]}>
            Notes: {item.notes}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <FlatList
        data={animals}
        renderItem={renderAnimalItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="cow" 
              size={64} 
              color={theme.colors.neutral.textSecondary} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              Aucun animal enregistré
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
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  animalType: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardContent: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  animalInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
}));

export default AnimalList; 