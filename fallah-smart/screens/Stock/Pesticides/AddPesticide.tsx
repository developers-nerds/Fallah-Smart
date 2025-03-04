import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ViewStyle,
  Modal,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { usePesticide } from '../../../context/PesticideContext';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { Button as CustomButton } from '../../../components/Button';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type AddPesticideProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddPesticide'>;
};

const UNITS = [
  { label: 'Kilogrammes (kg)', value: 'kg' },
  { label: 'Litres (L)', value: 'L' },
  { label: 'Millilitres (mL)', value: 'mL' },
  { label: 'Grammes (g)', value: 'g' },
];

interface FormPage {
  title: string;
  fields: string[];
}

const FORM_PAGES: FormPage[] = [
  {
    title: 'Informations de base',
    fields: ['name', 'description', 'isNatural'],
  },
  {
    title: 'Quantité et prix',
    fields: ['quantity', 'unit', 'price'],
  },
  {
    title: 'Détails supplémentaires',
    fields: ['manufacturer', 'expiryDate'],
  },
  {
    title: 'Instructions',
    fields: ['applicationInstructions', 'safetyPrecautions'],
  },
];

export const AddPesticide = ({ navigation }: AddPesticideProps) => {
  const theme = useTheme();
  const { createPesticide, loading } = usePesticide();
  const [currentPage, setCurrentPage] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: '',
    price: '',
    isNatural: false,
    manufacturer: '',
    expiryDate: '',
    applicationInstructions: '',
    safetyPrecautions: '',
  });
  const [error, setError] = useState<string | null>(null);
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withSpring(currentPage / (FORM_PAGES.length - 1));
  }, [currentPage]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        expiryDate: selectedDate.toISOString().split('T')[0],
      });
    }
  };

  const handleSubmit = async () => {
    if (currentPage < FORM_PAGES.length - 1) {
      setCurrentPage(currentPage + 1);
      return;
    }

    try {
      setError(null);
      await createPesticide({
        ...formData,
        quantity: Number(formData.quantity),
        price: Number(formData.price),
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pesticide');
    }
  };

  const renderField = (field: string) => {
    switch (field) {
      case 'name':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Nom du pesticide
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nom du pesticide"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>
        );

      case 'description':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Description
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Description du pesticide"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'quantity':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Quantité
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              placeholder="0"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              keyboardType="numeric"
            />
          </View>
        );

      case 'unit':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Unité
            </Text>
            <TouchableOpacity
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                borderColor: theme.colors.neutral.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }]}
              onPress={() => setShowUnitPicker(true)}
            >
              <Text style={{ color: formData.unit ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary }}>
                {formData.unit || 'Sélectionner une unité'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.neutral.textSecondary} />
            </TouchableOpacity>
            <Modal
              visible={showUnitPicker}
              transparent
              animationType="slide"
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.pickerContainer, { backgroundColor: theme.colors.neutral.surface }]}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                      <Text style={[styles.pickerButton, { color: theme.colors.primary.base }]}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                      <Text style={[styles.pickerButton, { color: theme.colors.primary.base }]}>OK</Text>
                    </TouchableOpacity>
                  </View>
                  <Picker
                    selectedValue={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    {UNITS.map((unit) => (
                      <Picker.Item key={unit.value} label={unit.label} value={unit.value} />
                    ))}
                  </Picker>
                </View>
              </View>
            </Modal>
          </View>
        );

      case 'price':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Prix
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="0"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              keyboardType="numeric"
            />
          </View>
        );

      case 'manufacturer':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Fabricant
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.manufacturer}
              onChangeText={(text) => setFormData({ ...formData, manufacturer: text })}
              placeholder="Nom du fabricant"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>
        );

      case 'expiryDate':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Date d'expiration
            </Text>
            <TouchableOpacity
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                borderColor: theme.colors.neutral.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: formData.expiryDate ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary }}>
                {formData.expiryDate || 'Sélectionner une date'}
              </Text>
              <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.neutral.textSecondary} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.expiryDate ? new Date(formData.expiryDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>
        );

      case 'applicationInstructions':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Instructions d'application
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.applicationInstructions}
              onChangeText={(text) => setFormData({ ...formData, applicationInstructions: text })}
              placeholder="Instructions d'application"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'safetyPrecautions':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              Précautions de sécurité
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border
              }]}
              value={formData.safetyPrecautions}
              onChangeText={(text) => setFormData({ ...formData, safetyPrecautions: text })}
              placeholder="Précautions de sécurité"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'isNatural':
        return (
          <TouchableOpacity
            style={[styles.checkboxContainer, { borderColor: theme.colors.neutral.border }]}
            onPress={() => setFormData({ ...formData, isNatural: !formData.isNatural })}
          >
            <View style={[
              styles.checkbox,
              formData.isNatural && { backgroundColor: theme.colors.success }
            ]}>
              {formData.isNatural && (
                <Feather name="check" size={16} color="#FFF" />
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.colors.neutral.textPrimary }]}>
              Pesticide naturel
            </Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.neutral.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          {FORM_PAGES[currentPage].title}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.neutral.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.primary.base },
              progressStyle,
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.neutral.textSecondary }]}>
          Étape {currentPage + 1} sur {FORM_PAGES.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {FORM_PAGES[currentPage].fields.map((field) => renderField(field))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {currentPage > 0 && (
          <CustomButton
            title="Précédent"
            onPress={() => setCurrentPage(currentPage - 1)}
            variant="secondary"
            style={{ flex: 1, marginRight: 8 }}
          />
        )}
        <CustomButton
          title={currentPage === FORM_PAGES.length - 1 ? 'Terminer' : 'Suivant'}
          onPress={handleSubmit}
          variant="primary"
          loading={loading}
          style={{ flex: 1, marginLeft: currentPage > 0 ? 8 : 0 }}
        />
      </View>
    </View>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  } as ViewStyle,
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressContainer: {
    padding: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.neutral.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  pickerButton: {
    fontSize: 16,
    fontWeight: '600',
  },
}));

export default AddPesticide; 