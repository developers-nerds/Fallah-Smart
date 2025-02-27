import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useStock } from '../../../context/StockContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../../components/Button';
import { createThemedStyles } from '../../../utils/createThemedStyles';

interface Animal {
  id: string;
  type: string;
  count: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  feedingSchedule: string;
  gender: 'male' | 'female';
  notes: string;
}

const AnimalsScreen = ({ navigation }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    type: '',
    count: '',
    healthStatus: 'good',
    feedingSchedule: '',
    gender: 'male',
    notes: ''
  });

  const { addAnimal } = useStock();

  const handleAddAnimal = () => {
    // Validate required fields
    if (!formData.type.trim()) {
      alert('Le type d\'animal est requis');
      return;
    }

    const count = Number(formData.count);
    if (isNaN(count) || count <= 0) {
      alert('Le nombre doit être un nombre positif');
      return;
    }

    // Add the animal using the context
    addAnimal({
      type: formData.type.trim(),
      count: count,
      healthStatus: formData.healthStatus,
      feedingSchedule: formData.feedingSchedule.trim(),
      gender: formData.gender,
      notes: formData.notes.trim()
    });

    // Clear the form
    setFormData({
      type: '',
      count: '',
      healthStatus: 'good',
      feedingSchedule: '',
      gender: 'male',
      notes: ''
    });

    // Optionally navigate back or show success message
    alert('Animal ajouté avec succès!');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {/* Animal Type */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Type d'animal
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.neutral.surface }]}
              placeholder="Ex: Vache, Mouton..."
              value={formData.type}
              onChangeText={(text) => setFormData({ ...formData, type: text })}
            />
          </View>

          {/* Number of Animals */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Nombre
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.neutral.surface }]}
              keyboardType="numeric"
              placeholder="Nombre d'animaux"
              value={formData.count}
              onChangeText={(text) => setFormData({ ...formData, count: text })}
            />
          </View>

          {/* Health Status */}
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
                  onPress={() => setFormData({ ...formData, healthStatus: status as any })}
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

          {/* Feeding Schedule */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Programme d'alimentation
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.neutral.surface }]}
              placeholder="Ex: 2 fois par jour"
              value={formData.feedingSchedule}
              onChangeText={(text) => setFormData({ ...formData, feedingSchedule: text })}
            />
          </View>

          {/* Gender */}
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
                  onPress={() => setFormData({ ...formData, gender: gender as any })}
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

          {/* Notes */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Notes
            </Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.colors.neutral.surface,
                  height: 100,
                  textAlignVertical: 'top'
                }
              ]}
              multiline
              placeholder="Conseils naturels, maladies..."
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
            />
          </View>
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

const styles = createThemedStyles((theme) => ({
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
    height: 48,
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
}));

export default AnimalsScreen; 