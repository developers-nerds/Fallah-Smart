import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { theme } from '../../theme/theme';
import { normalize, responsivePadding, isSmallDevice } from '../../utils/responsive';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { storage, StorageKeys } from '../../utils/storage';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const unitOptions = [
  'kg',
  'g',
  'l',
  'ml',
  'pcs',
  'bag',
  'box',
  'can',
  'bottle',
  'jar',
  'packet',
  'piece',
  'roll',
  'sheet',
  'tube',
  'unit',
] as const;

const listingTypes = ['fixed', 'auction'] as const;

const currencies = ['SAR', 'USD', 'EUR', 'AED', 'TND'] as const;

// Sample crop categories - replace with actual categories from your API
const cropCategories = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Herbs',
  'Nuts',
  'Flowers',
  'Seeds',
  'Seedlings',
  'Other',
] as const;

type FormData = {
  crop_name: string;
  sub_category: string;
  quantity: string;
  price: string;
  currency: string;
  description: string;
  unit: string;
  listing_type: 'fixed' | 'auction';
};

type FormErrors = {
  crop_name: string;
  quantity: string;
  price: string;
  description: string;
};

// Define Supplier interface
interface Supplier {
  id: number;
  company_name: string;
  about_us: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  company_logo: string;
  company_banner: string;
  open_time: string;
  close_time: string;
  createdAt: string;
  updatedAt: string;
}

const AddProduct = () => {
  const navigation = useNavigation();
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  const [loading, setLoading] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [fetchingSupplier, setFetchingSupplier] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    crop_name: '',
    sub_category: cropCategories[0],
    quantity: '',
    price: '',
    currency: 'SAR',
    description: '',
    unit: 'kg',
    listing_type: 'fixed',
  });

  const [errors, setErrors] = useState<FormErrors>({
    crop_name: '',
    quantity: '',
    price: '',
    description: '',
  });

  // Fetch supplier data on component mount
  useEffect(() => {
    fetchSupplierData();
  }, []);

  // Function to fetch supplier data
  const fetchSupplierData = async () => {
    try {
      setFetchingSupplier(true);
      
      // Try multiple token retrieval methods
      // Method 1: Direct from AsyncStorage (explicit key)
      const accessToken = await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);
      
      // Method 2: Via the storage utility
      const { access: accessFromUtil } = await storage.getTokens();
      
      // Use whichever token we got
      const finalToken = accessToken || accessFromUtil;
      
      console.log('Token from AsyncStorage direct:', accessToken);
      console.log('Token from storage utility:', accessFromUtil);
      
      if (!finalToken) {
        console.log('No access token found with any method');
        Alert.alert(
          'Authentication Error', 
          'You must be logged in to add a product', 
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Verify baseUrl
      if (!baseUrl) {
        console.error('API URL is undefined');
        Alert.alert(
          'Configuration Error',
          'API URL is not configured properly',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      console.log('Fetching supplier data with token:', finalToken);
      
      // Use axios for supplier fetch too
      const url = `${baseUrl}/suppliers/me`;
      console.log('GET request to:', url);
      
      const axiosConfig = {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${finalToken}`
        }
      };
      
      console.log('Supplier API request config:', JSON.stringify(axiosConfig, null, 2));
      
      try {
        const response = await axios.get(url, axiosConfig);
        
        console.log('Supplier API response status:', response.status);
        console.log('Supplier API response data:', JSON.stringify(response.data, null, 2));
        
        const data = response.data;
        
        // Verify supplier data is valid
        if (!data.hasAccount) {
          Alert.alert(
            'Profile Required', 
            'You need to create a supplier profile before adding products',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
        
        if (!data.supplier || !data.supplier.id) {
          console.error('Invalid supplier data received:', data);
          Alert.alert(
            'Profile Error', 
            'Your supplier profile is incomplete. Please complete your profile first.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
        
        console.log('Successfully retrieved supplier with ID:', data.supplier.id);
        setSupplier(data.supplier);
      } catch (firstError) {
        console.error('First supplier fetch attempt failed, trying alternate method');
        
        try {
          // Try with token in URL as query parameter explicitly
          const urlWithToken = `${url}?token=${encodeURIComponent(finalToken)}`;
          const altConfig = {
            headers: {
              'Accept': 'application/json'
            }
          };
          
          console.log('Trying alternate supplier fetch with token in URL:', urlWithToken);
          const response = await axios.get(urlWithToken, altConfig);
          
          console.log('Supplier API response status:', response.status);
          console.log('Supplier API response data:', JSON.stringify(response.data, null, 2));
          
          const data = response.data;
          
          // Verify supplier data is valid
          if (!data.hasAccount) {
            Alert.alert(
              'Profile Required', 
              'You need to create a supplier profile before adding products',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            return;
          }
          
          if (!data.supplier || !data.supplier.id) {
            console.error('Invalid supplier data received:', data);
            Alert.alert(
              'Profile Error', 
              'Your supplier profile is incomplete. Please complete your profile first.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            return;
          }
          
          console.log('Successfully retrieved supplier with ID:', data.supplier.id);
          setSupplier(data.supplier);
        } catch (finalError) {
          throw finalError; // Let the outer catch handle it
        }
      }
    } catch (error) {
      console.error('Error fetching supplier data:', error);
      
      let errorMessage = 'Failed to load your supplier profile';
      
      if (axios.isAxiosError(error)) {
        console.log('Axios error status:', error.response?.status);
        console.log('Axios error data:', JSON.stringify(error.response?.data, null, 2));
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Error', 
        errorMessage,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setFetchingSupplier(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors: FormErrors = {
      crop_name: '',
      quantity: '',
      price: '',
      description: '',
    };

    // Validate crop name
    if (!formData.crop_name.trim()) {
      newErrors.crop_name = 'Crop name is required';
      isValid = false;
    }

    // Validate quantity
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
      isValid = false;
    } else if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
      isValid = false;
    }

    // Validate price
    if (formData.listing_type === 'fixed') {
      if (!formData.price.trim()) {
        newErrors.price = 'Price is required for fixed listings';
        isValid = false;
      } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
        newErrors.price = 'Price must be a positive number';
        isValid = false;
      }
    }

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description should be at least 10 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    // Clear error when user types
    if (field in errors) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!supplier) {
      Alert.alert('Error', 'Supplier profile not found. Please create one first.');
      return;
    }

    setLoading(true);

    try {
      // Get token with proper key from storage utility
      const { access: accessToken } = await storage.getTokens();
      
      if (!accessToken) {
        Alert.alert('Error', 'You must be logged in to add a product');
        setLoading(false);
        return;
      }
      
      console.log(`Using token: ${accessToken.substring(0, 15)}...`);
      
      // Ensure price is set for non-auction listings
      let finalPrice = 0;
      if (formData.listing_type === 'fixed') {
        finalPrice = parseFloat(formData.price);
        if (isNaN(finalPrice) || finalPrice <= 0) {
          throw new Error('Invalid price value');
        }
      }

      // Ensure quantity is valid
      const finalQuantity = parseFloat(formData.quantity);
      if (isNaN(finalQuantity) || finalQuantity <= 0) {
        throw new Error('Invalid quantity value');
      }
      
      // Create data structure that matches backend expectations
      // Backend will get the supplier from the userId in the token
      const submitData = {
        crop_name: formData.crop_name.trim(),
        sub_category: formData.sub_category,
        quantity: finalQuantity,
        price: finalPrice,
        currency: formData.currency,
        description: formData.description.trim(),
        unit: formData.unit,
        listing_type: formData.listing_type
      };

      console.log('Submitting data:', JSON.stringify(submitData, null, 2));
      
      // Check URL
      if (!baseUrl) {
        throw new Error('API URL is not configured');
      }
      
      const url = `${baseUrl}/crops/listings`;
      console.log('POST request to:', url);
      
      // Use simple axios request with proper Authorization header
      const response = await axios.post(url, submitData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      Alert.alert(
        'Success',
        'Your product has been listed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to the Marketplace screen
              // The useFocusEffect in Marketplace will trigger a refresh when it comes into focus
              console.log('Product added successfully, returning to marketplace');
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error adding product:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (axios.isAxiosError(error)) {
        console.log('Axios error status:', error.response?.status);
        console.log('Axios error data:', JSON.stringify(error.response?.data, null, 2));
        
        // Try to extract the most helpful error message
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while fetching supplier data
  if (fetchingSupplier) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={styles.loadingText}>Loading supplier information...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Add New Product</Text>
        
        <View style={styles.formContainer}>
          {/* Crop Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Crop Name *</Text>
            <TextInput
              style={[styles.input, errors.crop_name ? styles.inputError : null]}
              placeholder="Enter crop name"
              value={formData.crop_name}
              onChangeText={(text) => handleInputChange('crop_name', text)}
            />
            {errors.crop_name ? <Text style={styles.errorText}>{errors.crop_name}</Text> : null}
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.sub_category}
                onValueChange={(value) => handleInputChange('sub_category', value)}
                style={styles.picker}
              >
                {cropCategories.map((category, index) => (
                  <Picker.Item key={index} label={category} value={category} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Quantity and Unit */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={[styles.input, errors.quantity ? styles.inputError : null]}
                placeholder="Enter quantity"
                keyboardType="decimal-pad"
                value={formData.quantity}
                onChangeText={(text) => handleInputChange('quantity', text)}
              />
              {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Unit *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.unit}
                  onValueChange={(value) => handleInputChange('unit', value)}
                  style={styles.picker}
                >
                  {unitOptions.map((unit, index) => (
                    <Picker.Item key={index} label={unit} value={unit} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* Listing Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Listing Type *</Text>
            <View style={styles.radioContainer}>
              {listingTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.radioButton}
                  onPress={() => handleInputChange('listing_type', type)}
                >
                  <View
                    style={[
                      styles.radio,
                      formData.listing_type === type ? styles.radioSelected : null,
                    ]}
                  >
                    {formData.listing_type === type && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.radioLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price and Currency (only for fixed price) */}
          {formData.listing_type === 'fixed' && (
            <View style={styles.rowContainer}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
                <Text style={styles.label}>Price *</Text>
                <TextInput
                  style={[styles.input, errors.price ? styles.inputError : null]}
                  placeholder="Enter price"
                  keyboardType="decimal-pad"
                  value={formData.price}
                  onChangeText={(text) => handleInputChange('price', text)}
                />
                {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Currency *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.currency}
                    onValueChange={(value) => handleInputChange('currency', value)}
                    style={styles.picker}
                  >
                    {currencies.map((currency, index) => (
                      <Picker.Item key={index} label={currency} value={currency} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.textArea, errors.description ? styles.inputError : null]}
              placeholder="Enter product description"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
            />
            {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="plus" size={20} color="white" />
                <Text style={styles.submitButtonText}>Add Product</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  header: {
    fontSize: normalize(22),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    padding: responsivePadding(theme.spacing.md),
    textAlign: 'center',
  },
  formContainer: {
    padding: responsivePadding(theme.spacing.md),
  },
  inputGroup: {
    marginBottom: responsivePadding(theme.spacing.md),
  },
  label: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginBottom: responsivePadding(theme.spacing.xs),
  },
  input: {
    backgroundColor: theme.colors.neutral.surface,
    paddingHorizontal: responsivePadding(theme.spacing.md),
    paddingVertical: responsivePadding(theme.spacing.sm),
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: normalize(12),
    fontFamily: theme.fonts.regular,
    marginTop: responsivePadding(theme.spacing.xs),
  },
  pickerContainer: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textArea: {
    backgroundColor: theme.colors.neutral.surface,
    paddingHorizontal: responsivePadding(theme.spacing.md),
    paddingVertical: responsivePadding(theme.spacing.sm),
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    minHeight: 100,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: responsivePadding(theme.spacing.lg),
  },
  radio: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.primary.base,
  },
  radioDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary.base,
  },
  radioLabel: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    marginLeft: responsivePadding(theme.spacing.xs),
  },
  submitButton: {
    backgroundColor: theme.colors.primary.base,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsivePadding(theme.spacing.md),
    borderRadius: theme.borderRadius.medium,
    marginTop: responsivePadding(theme.spacing.md),
  },
  submitButtonText: {
    color: 'white',
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
    marginLeft: responsivePadding(theme.spacing.xs),
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: normalize(16),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
  },
});

export default AddProduct; 