import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Card, TouchableCard } from '../../components/ui';

export const StockList = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const stockSections = [
    {
      id: 'fertilizers',
      title: t('stock.fertilizers'),
      icon: 'leaf',
      screen: 'FertilizerList',
      description: t('stock.fertilizersDesc'),
    },
    {
      id: 'equipment',
      title: t('stock.equipment'),
      icon: 'tractor',
      screen: 'EquipmentList',
      description: t('stock.equipmentDesc'),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('stock.selectSection')}</Text>
      
      <View style={styles.grid}>
        {stockSections.map(section => (
          <TouchableCard
            key={section.id}
            style={styles.card}
            onPress={() => navigation.navigate(section.screen)}
          >
            <MaterialCommunityIcons
              name={section.icon}
              size={48}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardDescription}>{section.description}</Text>
          </TouchableCard>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
}); 