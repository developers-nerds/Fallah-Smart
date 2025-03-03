import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useStock } from '../../../context/StockContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../../components/Button';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { Animal, HealthStatus, Gender } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';

type AnimalsScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'Animals'>;
};

const AnimalsScreen: React.FC<AnimalsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    type: '',
    count: '',
    healthStatus: 'good' as HealthStatus,
    feedingSchedule: '',
    gender: 'male' as Gender,
    feeding: '',
    care: '',
    health: '',
    housing: '',
    breeding: '',
    diseases: '',
    medications: '',
    behavior: '',
    economics: '',
    vaccination: '',
    notes: ''
  });

  const { createAnimal } = useStock();

  const handleAddAnimal = () => {
    if (!formData.type.trim()) {
      alert('Le type d\'animal est requis');
      return;
    }

    const count = Number(formData.count);
    if (isNaN(count) || count <= 0) {
      alert('Le nombre doit être un nombre positif');
      return;
    }

    createAnimal({
      ...formData,
      count,
      type: formData.type.trim(),
      feedingSchedule: formData.feedingSchedule.trim(),
      feeding: formData.feeding.trim() || null,
      care: formData.care.trim() || null,
      health: formData.health.trim() || null,
      housing: formData.housing.trim() || null,
      breeding: formData.breeding.trim() || null,
      diseases: formData.diseases.trim() || null,
      medications: formData.medications.trim() || null,
      behavior: formData.behavior.trim() || null,
      economics: formData.economics.trim() || null,
      vaccination: formData.vaccination.trim() || null,
      notes: formData.notes.trim() || null
    });

    setFormData({
      type: '',
      count: '',
      healthStatus: 'good',
      feedingSchedule: '',
      gender: 'male',
      feeding: '',
      care: '',
      health: '',
      housing: '',
      breeding: '',
      diseases: '',
      medications: '',
      behavior: '',
      economics: '',
      vaccination: '',
      notes: ''
    });

    alert('Animal ajouté avec succès!');
  };

  const renderTextField = (
    label: string, 
    field: keyof typeof formData, 
    placeholder: string, 
    multiline: boolean = false
  ) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: theme.colors.neutral.surface,
            height: multiline ? 100 : 48,
            textAlignVertical: multiline ? 'top' : 'center'
          }
        ]}
        placeholder={placeholder}
        value={formData[field] as string}
        onChangeText={(text) => setFormData({ ...formData, [field]: text })}
        multiline={multiline}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {renderTextField('Type d\'animal', 'type', 'Ex: Vache, Mouton...')}
          {renderTextField('Nombre', 'count', 'Nombre d\'animaux')}
          
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              État de santé
            </Text>
            <View style={styles.radioGroup}>
              {['excellent', 'good', 'fair', 'poor'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.radioButton,
                    {
                      backgroundColor: formData.healthStatus === status 
                        ? theme.colors.primary.base 
                        : theme.colors.neutral.surface,
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, healthStatus: status as HealthStatus })}
                >
                  <Text 
                    style={[
                      styles.radioText,
                      {
                        color: formData.healthStatus === status 
                          ? theme.colors.neutral.surface 
                          : theme.colors.neutral.textPrimary,
                      }
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Sexe
            </Text>
            <View style={styles.radioGroup}>
              {['male', 'female'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.radioButton,
                    {
                      backgroundColor: formData.gender === gender 
                        ? theme.colors.primary.base 
                        : theme.colors.neutral.surface,
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, gender: gender as Gender })}
                >
                  <Text 
                    style={[
                      styles.radioText,
                      {
                        color: formData.gender === gender 
                          ? theme.colors.neutral.surface 
                          : theme.colors.neutral.textPrimary,
                      }
                    ]}
                  >
                    {gender === 'male' ? 'Mâle' : 'Femelle'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {renderTextField('Programme d\'alimentation', 'feedingSchedule', 'Ex: 2 fois par jour')}
          {renderTextField('Alimentation', 'feeding', 'Détails sur l\'alimentation...', true)}
          {renderTextField('Soins', 'care', 'Détails sur les soins...', true)}
          {renderTextField('Santé', 'health', 'État de santé détaillé...', true)}
          {renderTextField('Logement', 'housing', 'Conditions de logement...', true)}
          {renderTextField('Reproduction', 'breeding', 'Informations sur la reproduction...', true)}
          {renderTextField('Maladies', 'diseases', 'Historique des maladies...', true)}
          {renderTextField('Médicaments', 'medications', 'Traitements médicaux...', true)}
          {renderTextField('Comportement', 'behavior', 'Observations comportementales...', true)}
          {renderTextField('Économie', 'economics', 'Aspects économiques...', true)}
          {renderTextField('Vaccination', 'vaccination', 'Programme de vaccination...', true)}
          {renderTextField('Notes', 'notes', 'Notes additionnelles...', true)}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.neutral.surface }]}>
        <Button
          title="Ajouter Animal"
          onPress={handleAddAnimal}
          style={styles.addButton}
        />
        <Button
          title="Voir les Animaux"
          onPress={() => navigation.navigate('AnimalList')}
          variant="outline"
          style={styles.viewButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  form: {
    marginBottom: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  addButton: {
    width: '100%',
  },
  viewButton: {
    marginTop: 8,
  },
});

export default AnimalsScreen; 