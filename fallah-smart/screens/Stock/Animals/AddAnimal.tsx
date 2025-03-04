import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Platform,
  Dimensions 
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useStock } from '../../../context/StockContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animal, HealthStatus, Gender } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import Animated, { FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type AddAnimalScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddAnimal'>;
};

interface FormPage {
  title: string;
  subtitle: string;
  icon: string;
  fields: {
    key: keyof FormData;
    label: string;
    placeholder: string;
    multiline?: boolean;
    required?: boolean;
  }[];
}

interface FormData {
  type: string;
  count: string;
  healthStatus: HealthStatus;
  feedingSchedule: string;
  gender: Gender;
  feeding: string;
  care: string;
  health: string;
  housing: string;
  breeding: string;
  diseases: string;
  medications: string;
  behavior: string;
  economics: string;
  vaccination: string;
  notes: string;
}

const initialFormData: FormData = {
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
};

const formPages: FormPage[] = [
  {
    title: 'Informations de base',
    subtitle: 'Entrez les informations essentielles de l\'animal',
    icon: 'information',
    fields: [
      { key: 'type', label: 'Type d\'animal', placeholder: 'Ex: Vache, Mouton...', required: true },
      { key: 'count', label: 'Nombre', placeholder: 'Nombre d\'animaux', required: true },
      { key: 'feedingSchedule', label: 'Programme d\'alimentation', placeholder: 'Ex: 2 fois par jour' }
    ]
  },
  {
    title: 'Santé et soins',
    subtitle: 'Détaillez l\'état de santé et les soins nécessaires',
    icon: 'heart-pulse',
    fields: [
      { key: 'health', label: 'État de santé', placeholder: 'État de santé détaillé...', multiline: true },
      { key: 'care', label: 'Soins', placeholder: 'Détails sur les soins...', multiline: true },
      { key: 'medications', label: 'Médicaments', placeholder: 'Traitements médicaux...', multiline: true },
      { key: 'vaccination', label: 'Vaccination', placeholder: 'Programme de vaccination...', multiline: true }
    ]
  },
  {
    title: 'Gestion',
    subtitle: 'Informations sur la gestion quotidienne',
    icon: 'cog',
    fields: [
      { key: 'feeding', label: 'Alimentation', placeholder: 'Détails sur l\'alimentation...', multiline: true },
      { key: 'housing', label: 'Logement', placeholder: 'Conditions de logement...', multiline: true },
      { key: 'behavior', label: 'Comportement', placeholder: 'Observations comportementales...', multiline: true }
    ]
  },
  {
    title: 'Informations supplémentaires',
    subtitle: 'Ajoutez des détails complémentaires',
    icon: 'text-box',
    fields: [
      { key: 'breeding', label: 'Reproduction', placeholder: 'Informations sur la reproduction...', multiline: true },
      { key: 'diseases', label: 'Maladies', placeholder: 'Historique des maladies...', multiline: true },
      { key: 'economics', label: 'Économie', placeholder: 'Aspects économiques...', multiline: true },
      { key: 'notes', label: 'Notes', placeholder: 'Notes additionnelles...', multiline: true }
    ]
  }
];

export const AddAnimalScreen = ({ navigation }: AddAnimalScreenProps) => {
  const theme = useTheme();
  const { createAnimal } = useStock();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentPage, setCurrentPage] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.type.trim()) {
      newErrors.type = 'Le type d\'animal est requis';
    }

    const count = Number(formData.count);
    if (isNaN(count) || count <= 0) {
      newErrors.count = 'Le nombre doit être un nombre positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await createAnimal({
        ...formData,
        count: Number(formData.count),
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

      navigation.goBack();
    } catch (error) {
      console.error('Error creating animal:', error);
      // Handle error
    }
  };

  const nextPage = () => {
    if (currentPage < formPages.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const renderTextField = (
    field: FormPage['fields'][0]
  ) => (
    <View key={field.key} style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
        {field.label}
        {field.required && <Text style={{ color: theme.colors.error }}> *</Text>}
      </Text>
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.neutral.surface }]}>
        <TextInput
          style={[
            styles.input,
            field.multiline && styles.textArea,
            errors[field.key] && styles.inputError
          ]}
          placeholder={field.placeholder}
          value={formData[field.key]}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, [field.key]: text }));
            if (errors[field.key]) {
              setErrors(prev => ({ ...prev, [field.key]: undefined }));
            }
          }}
          multiline={field.multiline}
          numberOfLines={field.multiline ? 4 : 1}
          placeholderTextColor={theme.colors.neutral.textSecondary}
        />
      </View>
      {errors[field.key] && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {errors[field.key]}
        </Text>
      )}
    </View>
  );

  const renderHealthStatus = () => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
        État de santé
      </Text>
      <View style={styles.optionsGrid}>
        {['excellent', 'good', 'fair', 'poor'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.optionButton,
              {
                backgroundColor: formData.healthStatus === status 
                  ? theme.colors.primary.base 
                  : theme.colors.neutral.surface,
              }
            ]}
            onPress={() => setFormData(prev => ({ ...prev, healthStatus: status as HealthStatus }))}
          >
            <MaterialCommunityIcons
              name={status === 'excellent' ? 'star' : status === 'good' ? 'check-circle' : status === 'fair' ? 'alert' : 'alert-circle'}
              size={24}
              color={formData.healthStatus === status ? '#FFF' : theme.colors.neutral.textSecondary}
            />
            <Text 
              style={[
                styles.optionText,
                {
                  color: formData.healthStatus === status 
                    ? '#FFF'
                    : theme.colors.neutral.textPrimary,
                }
              ]}
            >
              {status === 'excellent' ? 'Excellent' : 
               status === 'good' ? 'Bon' :
               status === 'fair' ? 'Moyen' : 'Mauvais'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGender = () => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
        Sexe
      </Text>
      <View style={styles.genderButtons}>
        {[
          { value: 'male', label: 'Mâle', icon: 'gender-male' },
          { value: 'female', label: 'Femelle', icon: 'gender-female' }
        ].map((gender) => (
          <TouchableOpacity
            key={gender.value}
            style={[
              styles.genderButton,
              {
                backgroundColor: formData.gender === gender.value 
                  ? theme.colors.primary.base 
                  : theme.colors.neutral.surface,
              }
            ]}
            onPress={() => setFormData(prev => ({ ...prev, gender: gender.value as Gender }))}
          >
            <MaterialCommunityIcons
              name={gender.icon}
              size={24}
              color={formData.gender === gender.value ? '#FFF' : theme.colors.neutral.textSecondary}
            />
            <Text 
              style={[
                styles.genderText,
                {
                  color: formData.gender === gender.value 
                    ? '#FFF'
                    : theme.colors.neutral.textPrimary,
                }
              ]}
            >
              {gender.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <ScrollView style={styles.scrollView}>
        {formPages.map((page, index) => (
          <Animated.View
            key={index}
            entering={FadeInRight}
            style={[
              styles.page,
              { display: currentPage === index ? 'flex' : 'none' }
            ]}
          >
            <View style={styles.pageHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary.light }]}>
                <MaterialCommunityIcons
                  name={page.icon}
                  size={24}
                  color={theme.colors.primary.base}
                />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.pageTitle, { color: theme.colors.neutral.textPrimary }]}>
                  {page.title}
                </Text>
                <Text style={[styles.pageSubtitle, { color: theme.colors.neutral.textSecondary }]}>
                  {page.subtitle}
                </Text>
              </View>
            </View>

            <View style={styles.pageContent}>
              {index === 0 && (
                <>
                  {page.fields.slice(0, 2).map(renderTextField)}
                  {renderHealthStatus()}
                  {renderGender()}
                  {renderTextField(page.fields[2])}
                </>
              )}
              {index > 0 && page.fields.map(renderTextField)}
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.neutral.surface }]}>
        <View style={styles.pagination}>
          {formPages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: currentPage === index 
                    ? theme.colors.primary.base 
                    : theme.colors.neutral.border
                }
              ]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {currentPage > 0 && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                { backgroundColor: theme.colors.neutral.background }
              ]}
              onPress={prevPage}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={theme.colors.neutral.textPrimary}
              />
              <Text style={[styles.buttonText, { color: theme.colors.neutral.textPrimary }]}>
                Précédent
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              { backgroundColor: theme.colors.primary.base }
            ]}
            onPress={nextPage}
          >
            <Text style={[styles.buttonText, { color: '#FFF' }]}>
              {currentPage === formPages.length - 1 ? 'Ajouter' : 'Suivant'}
            </Text>
            <MaterialCommunityIcons
              name={currentPage === formPages.length - 1 ? 'check' : 'chevron-right'}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
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
  },
  page: {
    padding: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
  },
  pageContent: {
    gap: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  inputError: {
    borderWidth: 1,
    borderColor: 'red',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: (width - 48) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  primaryButton: {
    flex: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 