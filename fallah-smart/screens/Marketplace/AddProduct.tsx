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
  Image,
  Modal,
} from 'react-native';
import { theme } from '../../theme/theme';
import { normalize, responsivePadding, isSmallDevice } from '../../utils/responsive';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { storage, StorageKeys } from '../../utils/storage';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

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
  'خضروات',
  'فواكه',
  'حبوب',
  'أعشاب',
  'مكسرات',
  'زهور',
  'بذور',
  'شتلات',
  'أخرى',
] as const;

type FormData = {
  crop_name: string;
  sub_category: string;
  quantity: string;
  price: string;
  currency: string;
  description: string;
  unit: string;
  min_order_quantity: string;
  listing_type: 'fixed' | 'auction';
  images: Array<{
    uri: string;
    type: string;
    name: string;
  }>;
};

type FormErrors = {
  crop_name: string;
  quantity: string;
  price: string;
  description: string;
  min_order_quantity: string;
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

  // Update the currentStep state to support 3 steps
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    crop_name: '',
    sub_category: cropCategories[0],
    quantity: '',
    price: '',
    currency: 'SAR',
    description: '',
    unit: 'kg',
    min_order_quantity: '1',
    listing_type: 'fixed',
    images: [],
  });

  const [errors, setErrors] = useState<FormErrors>({
    crop_name: '',
    quantity: '',
    price: '',
    description: '',
    min_order_quantity: '',
  });

  // Add state for terms agreement
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Add a new state variable to track whether submission was attempted
  const [submissionAttempted, setSubmissionAttempted] = useState(false);

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
        Alert.alert('Authentication Error', 'You must be logged in to add a product', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      // Verify baseUrl
      if (!baseUrl) {
        console.error('API URL is undefined');
        Alert.alert('Configuration Error', 'API URL is not configured properly', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      console.log('Fetching supplier data with token:', finalToken);

      // Use axios for supplier fetch too
      const url = `${baseUrl}/suppliers/me`;
      console.log('GET request to:', url);

      const axiosConfig = {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${finalToken}`,
        },
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
              Accept: 'application/json',
            },
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

      Alert.alert('Error', errorMessage, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setFetchingSupplier(false);
    }
  };

  const validateForm = () => {
    setSubmissionAttempted(true); // Set this to true whenever validation runs

    let isValid = true;
    const newErrors: FormErrors = {
      crop_name: '',
      quantity: '',
      price: '',
      description: '',
      min_order_quantity: '',
    };

    // Validate crop name
    if (!formData.crop_name.trim()) {
      newErrors.crop_name = 'اسم المحصول مطلوب';
      isValid = false;
    }

    // Validate quantity
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'الكمية مطلوبة';
      isValid = false;
    } else if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'الكمية يجب أن تكون رقمًا موجبًا';
      isValid = false;
    }

    // Validate minimum order quantity
    if (!formData.min_order_quantity.trim()) {
      newErrors.min_order_quantity = 'الحد الأدنى للطلب مطلوب';
      isValid = false;
    } else if (
      isNaN(parseFloat(formData.min_order_quantity)) ||
      parseFloat(formData.min_order_quantity) <= 0
    ) {
      newErrors.min_order_quantity = 'الحد الأدنى للطلب يجب أن يكون رقمًا موجبًا';
      isValid = false;
    } else if (parseFloat(formData.min_order_quantity) >= parseFloat(formData.quantity)) {
      // Ensure min_order_quantity is less than quantity
      newErrors.min_order_quantity = 'الحد الأدنى للطلب يجب أن يكون أقل من الكمية المتاحة';
      isValid = false;
    }

    // Validate price - always required since we're always using fixed listing
    if (!formData.price.trim()) {
      newErrors.price = 'السعر مطلوب';
      isValid = false;
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'السعر يجب أن يكون رقمًا موجبًا';
      isValid = false;
    }

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'الوصف مطلوب';
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'يجب أن يكون الوصف على الأقل 10 حروف';
      isValid = false;
    }

    // Validate terms agreement
    if (!termsAgreed) {
      Alert.alert('خطأ', 'يجب عليك الموافقة على الشروط والأحكام للمتابعة');
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
    setSubmissionAttempted(true); // Set this to true when user tries to submit

    if (!validateForm()) {
      return;
    }

    if (!supplier) {
      Alert.alert('Error', 'Supplier profile not found. Please create one first.');
      return;
    }

    setLoading(true);

    try {
      const { access: accessToken } = await storage.getTokens();

      if (!accessToken) {
        Alert.alert('Error', 'You must be logged in to add a product');
        setLoading(false);
        return;
      }

      // Convert string values to numbers where appropriate to ensure correct data types
      const quantity = parseFloat(formData.quantity);
      const minOrderQuantity = parseFloat(formData.min_order_quantity);
      const price = parseFloat(formData.price);

      // Double check validation one more time before sending to backend
      if (minOrderQuantity >= quantity) {
        Alert.alert('Error', 'الحد الأدنى للطلب يجب أن يكون أقل من الكمية المتاحة');
        setLoading(false);
        return;
      }

      // Create FormData instance
      const formDataObj = new FormData();

      // Add all the text fields with proper formatting
      formDataObj.append('crop_name', formData.crop_name.trim());
      formDataObj.append('sub_category', formData.sub_category);
      formDataObj.append('quantity', quantity.toString());
      formDataObj.append('min_order_quantity', minOrderQuantity.toString());
      formDataObj.append('price', price.toString());
      formDataObj.append('currency', formData.currency);
      formDataObj.append('description', formData.description.trim());
      formDataObj.append('unit', formData.unit);
      formDataObj.append('listing_type', 'fixed');

      // Add images
      formData.images.forEach((image, index) => {
        formDataObj.append('images', {
          uri: image.uri,
          type: image.type,
          name: image.name,
        } as any);
      });

      if (!baseUrl) {
        throw new Error('API URL is not configured');
      }

      const url = `${baseUrl}/crops/listings`;
      console.log('POST request to:', url);
      console.log('Sending data:', {
        crop_name: formData.crop_name.trim(),
        sub_category: formData.sub_category,
        quantity: quantity,
        min_order_quantity: minOrderQuantity,
        price: price,
        currency: formData.currency,
        unit: formData.unit,
        listing_type: 'fixed',
        images_count: formData.images.length,
      });

      const response = await axios.post(url, formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));

      Alert.alert('Success', 'Your product has been listed successfully!', [
        {
          text: 'OK',
          onPress: () => {
            console.log('Product added successfully, returning to marketplace');
            navigation.goBack();
          },
        },
      ]);
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

  // Add this function to handle image picking
  const handleSelectImages = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to select images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `image-${Date.now()}.jpg`,
        }));

        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...newImages],
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select images');
      console.error('Image selection error:', error);
    }
  };

  // Add this function to remove images
  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // After the user enters basic info and images, they'll see the contract step
  const goToNextStep = () => {
    if (currentStep === 1) {
      // Validate first step fields
      const firstStepValid = validateFirstStep();
      if (!firstStepValid) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Go to contract step
      setCurrentStep(3);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  // Add validation for first step
  const validateFirstStep = () => {
    let isValid = true;
    const newErrors: FormErrors = {
      crop_name: '',
      quantity: '',
      price: '',
      description: '',
      min_order_quantity: '',
    };

    // Validate crop name
    if (!formData.crop_name.trim()) {
      newErrors.crop_name = 'اسم المحصول مطلوب';
      isValid = false;
    }

    // Validate quantity
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'الكمية مطلوبة';
      isValid = false;
    } else if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'الكمية يجب أن تكون رقمًا موجبًا';
      isValid = false;
    }

    // Validate minimum order quantity
    if (!formData.min_order_quantity.trim()) {
      newErrors.min_order_quantity = 'الحد الأدنى للطلب مطلوب';
      isValid = false;
    } else if (
      isNaN(parseFloat(formData.min_order_quantity)) ||
      parseFloat(formData.min_order_quantity) <= 0
    ) {
      newErrors.min_order_quantity = 'الحد الأدنى للطلب يجب أن يكون رقمًا موجبًا';
      isValid = false;
    } else if (parseFloat(formData.min_order_quantity) >= parseFloat(formData.quantity)) {
      // Ensure min_order_quantity is less than quantity
      newErrors.min_order_quantity = 'الحد الأدنى للطلب يجب أن يكون أقل من الكمية المتاحة';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Add a real-time validation when minimum order quantity or quantity changes
  useEffect(() => {
    // Only run this validation if both fields have values
    if (formData.quantity && formData.min_order_quantity) {
      const quantityValue = parseFloat(formData.quantity);
      const minOrderValue = parseFloat(formData.min_order_quantity);

      if (!isNaN(quantityValue) && !isNaN(minOrderValue)) {
        if (minOrderValue >= quantityValue) {
          setErrors((prev) => ({
            ...prev,
            min_order_quantity: 'الحد الأدنى للطلب يجب أن يكون أقل من الكمية المتاحة',
          }));
        } else {
          // Clear the error if values are valid
          setErrors((prev) => ({
            ...prev,
            min_order_quantity: '',
          }));
        }
      }
    }
  }, [formData.quantity, formData.min_order_quantity]);

  // Show loading state while fetching supplier data
  if (fetchingSupplier) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={styles.loadingText}>Loading supplier information...</Text>
      </View>
    );
  }

  // Render progress indicator
  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: currentStep === 1 ? '33%' : currentStep === 2 ? '66%' : '100%',
            },
          ]}
        />
      </View>
      <View style={styles.stepsContainer}>
        <View style={styles.stepIndicatorWrapper}>
          <View style={[styles.stepIndicator, styles.activeStepIndicator]}>
            <Text style={styles.activeStepText}>1</Text>
          </View>
          <Text style={styles.stepLabel}>البيانات الأساسية</Text>
        </View>
        <View style={styles.stepIndicatorWrapper}>
          <View style={[styles.stepIndicator, currentStep >= 2 ? styles.activeStepIndicator : {}]}>
            <Text style={currentStep >= 2 ? styles.activeStepText : styles.stepIndicatorText}>
              2
            </Text>
          </View>
          <Text style={styles.stepLabel}>التفاصيل والصور</Text>
        </View>
        <View style={styles.stepIndicatorWrapper}>
          <View style={[styles.stepIndicator, currentStep === 3 ? styles.activeStepIndicator : {}]}>
            <Text style={currentStep === 3 ? styles.activeStepText : styles.stepIndicatorText}>
              3
            </Text>
          </View>
          <Text style={styles.stepLabel}>العقد والموافقة</Text>
        </View>
      </View>
    </View>
  );

  // Render form step 1
  const renderStep1 = () => (
    <View style={styles.formContainer}>
      {/* Crop Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>اسم المحصول *</Text>
        <TextInput
          style={[styles.input, errors.crop_name ? styles.inputError : null]}
          placeholder="أدخل اسم المحصول"
          value={formData.crop_name}
          onChangeText={(text) => handleInputChange('crop_name', text)}
        />
        {errors.crop_name ? <Text style={styles.errorText}>{errors.crop_name}</Text> : null}
      </View>

      {/* Category */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>الفئة *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.sub_category}
            onValueChange={(value) => handleInputChange('sub_category', value)}
            style={styles.picker}>
            {cropCategories.map((category, index) => (
              <Picker.Item key={index} label={category} value={category} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Quantity and Unit */}
      <View style={styles.rowContainer}>
        <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
          <Text style={styles.label}>الكمية *</Text>
          <TextInput
            style={[styles.input, errors.quantity ? styles.inputError : null]}
            placeholder="أدخل الكمية"
            keyboardType="decimal-pad"
            value={formData.quantity}
            onChangeText={(text) => handleInputChange('quantity', text)}
          />
          {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>الوحدة *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.unit}
              onValueChange={(value) => handleInputChange('unit', value)}
              style={styles.picker}>
              {unitOptions.map((unit, index) => (
                <Picker.Item key={index} label={unit} value={unit} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Minimum Order Quantity */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>الحد الأدنى للطلب *</Text>
        <TextInput
          style={[styles.input, errors.min_order_quantity ? styles.inputError : null]}
          placeholder="أدخل الحد الأدنى للطلب"
          keyboardType="decimal-pad"
          value={formData.min_order_quantity}
          onChangeText={(text) => handleInputChange('min_order_quantity', text)}
        />
        {errors.min_order_quantity ? (
          <Text style={styles.errorText}>{errors.min_order_quantity}</Text>
        ) : null}
      </View>

      {/* Next Step Button */}
      <TouchableOpacity style={styles.submitButton} onPress={goToNextStep}>
        <Text style={styles.submitButtonText}>التالي</Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  // Render form step 2
  const renderStep2 = () => (
    <View style={styles.formContainer}>
      {/* Price and Currency - always show since we only have fixed listings now */}
      <View style={styles.rowContainer}>
        <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
          <Text style={styles.label}>السعر *</Text>
          <TextInput
            style={[styles.input, errors.price ? styles.inputError : null]}
            placeholder="أدخل السعر"
            keyboardType="decimal-pad"
            value={formData.price}
            onChangeText={(text) => handleInputChange('price', text)}
          />
          {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>العملة *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.currency}
              onValueChange={(value) => handleInputChange('currency', value)}
              style={styles.picker}>
              {currencies.map((currency, index) => (
                <Picker.Item key={index} label={currency} value={currency} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>الوصف *</Text>
        <TextInput
          style={[styles.textArea, errors.description ? styles.inputError : null]}
          placeholder="أدخل وصف المنتج"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={formData.description}
          onChangeText={(text) => handleInputChange('description', text)}
        />
        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
      </View>

      {/* Add images section */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>صور المنتج</Text>

        <TouchableOpacity style={styles.imagePickerButton} onPress={handleSelectImages}>
          <MaterialCommunityIcons name="image-plus" size={24} color={theme.colors.primary.base} />
          <Text style={styles.imagePickerText}>إضافة صور</Text>
        </TouchableOpacity>

        {formData.images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagePreviewContainer}>
            {formData.images.map((image, index) => (
              <View key={index} style={styles.imagePreviewWrapper}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={24}
                    color={theme.colors.error}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={goToPreviousStep}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.primary.base} />
          <Text style={styles.backButtonText}>السابق</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, { flex: 2, marginLeft: 10 }]}
          onPress={goToNextStep}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>التالي</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render form step 3 with improved contract design
  const renderStep3 = () => (
    <View style={styles.formContainer}>
      <View style={styles.contractHeader}>
        <MaterialCommunityIcons
          name="file-document-outline"
          size={28}
          color={theme.colors.primary.base}
        />
        <Text style={styles.contractTitle}>عقد البائع لمنصة فلاح سمارت</Text>
      </View>

      <View style={styles.contractDescriptionContainer}>
        <Text style={styles.contractDescription}>
          برجاء قراءة شروط العقد بعناية قبل الموافقة عليه. هذا العقد يحكم العلاقة بينك وبين منصة
          فلاح سمارت.
        </Text>
      </View>

      <ScrollView
        style={styles.contractScrollView}
        contentContainerStyle={styles.contractScrollContent}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}>
        <View style={styles.contractContainer}>
          <View style={styles.contractIntroContainer}>
            <Text style={styles.contractIntro}>
              تم الاتفاق بين فلاح سمارت (المنصة) و البائع، كما هو معرف في المنصة. من خلال إدراج
              المنتجات للبيع، يوافق البائع على الشروط والأحكام التالية.
            </Text>
          </View>

          {/* Section 1 */}
          <View style={styles.contractSection}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.contractSectionNumber}>1</Text>
              <Text style={styles.contractSectionTitle}>الشروط العامة</Text>
            </View>
            <View style={styles.contractClause}>
              <View style={styles.clauseNumberContainer}>
                <Text style={styles.contractClauseNumber}>1.1</Text>
              </View>
              <Text style={styles.contractClauseText}>
                يقوم البائع بإدراج منتجات للبيع على منصة فلاح سمارت، والتي تتخذ من تونس مقرًا لها.
              </Text>
            </View>

            <View style={styles.contractClause}>
              <View style={styles.clauseNumberContainer}>
                <Text style={styles.contractClauseNumber}>1.2</Text>
              </View>
              <Text style={styles.contractClauseText}>
                من خلال إدراج المنتجات على هذه المنصة، يوافق البائع على الشروط والأحكام التي تحكم
                عملية المعاملات بين المشترين والبائعين.
              </Text>
            </View>
          </View>

          {/* Section 2 */}
          <View style={styles.contractSection}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.contractSectionNumber}>2</Text>
              <Text style={styles.contractSectionTitle}>إدراج المنتجات والكمية</Text>
            </View>

            <View style={styles.contractClause}>
              <View style={styles.clauseNumberContainer}>
                <Text style={styles.contractClauseNumber}>2.1</Text>
              </View>
              <Text style={styles.contractClauseText}>
                يحق للبائع إدراج المنتجات بكميات كبيرة مع سعر ثابت لكل وحدة. يمكن أن تشمل الأمثلة
                بيع المنتجات بالأطنان أو الكيلوغرامات أو وحدات قابلة للقياس.
              </Text>
            </View>

            <View style={styles.contractClause}>
              <View style={styles.clauseNumberContainer}>
                <Text style={styles.contractClauseNumber}>2.2</Text>
              </View>
              <Text style={styles.contractClauseText}>
                جودة المنتج المدرج من قبل البائع يجب أن تتوافق مع المواصفات المتفق عليها في الوصف
                المدرج للمنتج. يضمن البائع أن المنتج ذو جودة جيدة.
              </Text>
            </View>

            <View style={styles.contractClause}>
              <View style={styles.clauseNumberContainer}>
                <Text style={styles.contractClauseNumber}>2.3</Text>
              </View>
              <Text style={styles.contractClauseText}>
                حقوق المشتري: يحق للمشتري طلب استرداد الأموال إذا كانت جودة المنتج لا تتطابق مع
                الوصف الذي قدمه البائع، استنادًا إلى تقييم المشتري بعد استلام السلع.
              </Text>
            </View>
          </View>

          {/* Section 3 */}
          <View style={styles.contractSection}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.contractSectionNumber}>3</Text>
              <Text style={styles.contractSectionTitle}>عملية الشراء</Text>
            </View>

            <View style={styles.contractClause}>
              <View style={styles.clauseNumberContainer}>
                <Text style={styles.contractClauseNumber}>3.1</Text>
              </View>
              <Text style={styles.contractClauseText}>
                اختيار المشتري: يمكن للمشتري اختيار أي جزء من الكمية الإجمالية المدرجة للمنتج (على
                سبيل المثال، شراء 1 طن من أصل 10 أطنان).
              </Text>
            </View>

            <View style={styles.contractClause}>
              <View style={styles.clauseNumberContainer}>
                <Text style={styles.contractClauseNumber}>3.2</Text>
              </View>
              <Text style={styles.contractClauseText}>
                توقيع العقد: قبل إتمام عملية الشراء، يجب على البائع والمشتري توقيع العقد إلكترونيًا
                عبر منصة فلاح سمارت.
              </Text>
            </View>

            <View style={styles.contractClause}>
              <View style={styles.clauseNumberContainer}>
                <Text style={styles.contractClauseNumber}>3.3</Text>
              </View>
              <Text style={styles.contractClauseText}>
                يتم تخزين العقد الموقع بأمان في قاعدة بيانات المنصة وسيتم استخدامه للتحقق من
                المعاملة.
              </Text>
            </View>
          </View>

          {/* Section 4 */}
          <View style={styles.contractSection}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.contractSectionNumber}>4</Text>
              <Text style={styles.contractSectionTitle}>شروط وأحكام الدفع</Text>
            </View>

            <View style={styles.contractClause}>
              <View style={styles.clauseNumberContainer}>
                <Text style={styles.contractClauseNumber}>4.1</Text>
              </View>
              <Text style={styles.contractClauseText}>
                رسوم المنصة: ستحجز المنصة 10% من قيمة المعاملة كرسوم. يتم دفع هذه الرسوم قبل إتمام
                المعاملة من قبل المشتري.
              </Text>
            </View>

            <View style={styles.contractClause}>
              <View style={styles.clauseNumberContainer}>
                <Text style={styles.contractClauseNumber}>4.2</Text>
              </View>
              <Text style={styles.contractClauseText}>
                إطلاق الدفع: سيتم إطلاق الـ 10% من الرسوم للبائع فقط عندما يؤكد المشتري استلام
                البضاعة.
              </Text>
            </View>

            <View style={styles.contractClause}>
              <View style={styles.clauseNumberContainer}>
                <Text style={styles.contractClauseNumber}>4.3</Text>
              </View>
              <Text style={styles.contractClauseText}>
                عملية الاسترداد: إذا لم يؤكد المشتري الاستلام في غضون 15 يومًا من استلام البضاعة،
                سيتم تأكيد الطلب تلقائيًا وسيتلقى البائع المدفوعات.
              </Text>
            </View>

            <View style={styles.contractClause}>
              <View style={styles.clauseNumberContainer}>
                <Text style={styles.contractClauseNumber}>4.4</Text>
              </View>
              <View style={styles.clauseContentContainer}>
                <Text style={styles.contractClauseText}>فشل البائع في الوفاء بالطلب:</Text>
                <View style={styles.contractSubClause}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.contractClauseText}>
                    إذا فشل البائع في الوفاء بالطلب (مثلًا لم يظهر أو لم يقم بالتسليم)، سيحصل
                    المشتري على استرداد كامل.
                  </Text>
                </View>
                <View style={styles.contractSubClause}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.contractClauseText}>
                    البائعون الذين لا يظهرون للوفاء بالطلب أكثر من 3 مرات سيتعرضون لـ حظر مؤقت من
                    المنصة. بعد 5 حالات، سيتم حظر البائع بشكل دائم.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sections 5-9 (continue the pattern) */}
          {/* ... other sections ... */}

          {/* Conclusion */}
          <View style={styles.contractConclusion}>
            <MaterialCommunityIcons
              name="information-outline"
              size={24}
              color={theme.colors.primary.dark}
              style={styles.conclusionIcon}
            />
            <Text style={styles.contractConclusionText}>
              من خلال إدراج المنتجات على منصة فلاح سمارت، يوافق البائع على الالتزام بهذه الشروط
              والأحكام. هذا العقد هو نموذج قابل لإعادة الاستخدام لجميع قوائم المنتجات على المنصة،
              ويتكيف تلقائيًا مع كل عملية شراء من المشتري.
            </Text>
          </View>

          <View style={styles.contractSignatureSection}>
            <View style={styles.contractSignatureLine} />
            <Text style={styles.contractSignatureText}>توقيع البائع الإلكتروني</Text>
          </View>
        </View>
      </ScrollView>

      {/* Contract Agreement Checkbox */}
      <View style={styles.contractAgreementContainer}>
        <View style={styles.contractSeparator} />

        <TouchableOpacity
          style={styles.contractCheckboxContainer}
          onPress={() => setTermsAgreed(!termsAgreed)}>
          <View
            style={[styles.contractCheckbox, termsAgreed ? styles.contractCheckboxChecked : {}]}>
            {termsAgreed && <MaterialCommunityIcons name="check" size={18} color="white" />}
          </View>
          <Text style={styles.contractAgreementText}>
            أقر بأنني قرأت وفهمت وأوافق على جميع بنود العقد المذكورة أعلاه
          </Text>
        </TouchableOpacity>

        {submissionAttempted && !termsAgreed && (
          <Text style={styles.contractWarningText}>* يجب الموافقة على شروط العقد للمتابعة</Text>
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={goToPreviousStep}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.primary.base} />
          <Text style={styles.backButtonText}>السابق</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, { flex: 2, marginLeft: 10, opacity: termsAgreed ? 1 : 0.5 }]}
          onPress={handleSubmit}
          disabled={!termsAgreed || loading}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="plus" size={20} color="white" />
              <Text style={styles.submitButtonText}>إضافة منتج</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>إضافة منتج جديد</Text>
          {renderProgressIndicator()}
        </View>

        {currentStep === 1 ? renderStep1() : currentStep === 2 ? renderStep2() : renderStep3()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  headerContainer: {
    backgroundColor: 'white',
    paddingVertical: responsivePadding(theme.spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  header: {
    fontSize: normalize(22),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    padding: responsivePadding(theme.spacing.sm),
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: responsivePadding(theme.spacing.md),
    marginTop: responsivePadding(theme.spacing.sm),
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: theme.colors.neutral.border,
    borderRadius: 2,
    marginBottom: responsivePadding(theme.spacing.md),
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary.base,
    borderRadius: 2,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: responsivePadding(theme.spacing.sm),
  },
  stepIndicatorWrapper: {
    alignItems: 'center',
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeStepIndicator: {
    backgroundColor: theme.colors.primary.base,
    borderColor: theme.colors.primary.base,
  },
  stepIndicatorText: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textSecondary,
  },
  activeStepText: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.bold,
    color: 'white',
  },
  stepLabel: {
    fontSize: normalize(12),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
  },
  formContainer: {
    padding: responsivePadding(theme.spacing.md),
    backgroundColor: 'white',
    margin: responsivePadding(theme.spacing.md),
    borderRadius: theme.borderRadius.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
    height: isSmallDevice ? 40 : 50,
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
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    padding: responsivePadding(theme.spacing.sm),
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: responsivePadding(theme.spacing.lg),
    paddingVertical: responsivePadding(theme.spacing.xs),
  },
  radio: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.primary.base,
  },
  radioDot: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary.base,
  },
  radioLabel: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    marginLeft: responsivePadding(theme.spacing.xs),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: responsivePadding(theme.spacing.md),
  },
  submitButton: {
    backgroundColor: theme.colors.primary.base,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsivePadding(theme.spacing.md),
    borderRadius: theme.borderRadius.medium,
  },
  submitButtonText: {
    color: 'white',
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
    marginRight: responsivePadding(theme.spacing.xs),
    marginLeft: responsivePadding(theme.spacing.xs),
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsivePadding(theme.spacing.md),
    paddingHorizontal: responsivePadding(theme.spacing.md),
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
    flex: 1,
  },
  backButtonText: {
    color: theme.colors.primary.base,
    fontSize: normalize(16),
    fontFamily: theme.fonts.medium,
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
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsivePadding(theme.spacing.md),
    borderRadius: theme.borderRadius.medium,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary.base,
    backgroundColor: theme.colors.primary.surface,
  },
  imagePickerText: {
    marginLeft: responsivePadding(theme.spacing.sm),
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
  },
  imagePreviewContainer: {
    marginTop: responsivePadding(theme.spacing.md),
    flexDirection: 'row',
  },
  imagePreviewWrapper: {
    marginRight: responsivePadding(theme.spacing.sm),
    position: 'relative',
  },
  imagePreview: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.surface,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  termsContainer: {
    marginTop: responsivePadding(theme.spacing.md),
    marginBottom: responsivePadding(theme.spacing.sm),
    backgroundColor: theme.colors.neutral.surface,
    padding: responsivePadding(theme.spacing.sm),
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.primary.base,
    marginRight: responsivePadding(theme.spacing.sm),
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary.base,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsCheckboxText: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    lineHeight: normalize(20),
  },
  termsWarningText: {
    marginTop: responsivePadding(theme.spacing.xs),
    color: theme.colors.error,
    fontSize: normalize(13),
    fontFamily: theme.fonts.medium,
    marginLeft: responsivePadding(theme.spacing.xl),
  },
  termsLink: {
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.bold,
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsivePadding(theme.spacing.md),
  },
  modalContent: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.large,
    width: '100%',
    maxHeight: '90%',
    padding: responsivePadding(theme.spacing.md),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsivePadding(theme.spacing.md),
    paddingBottom: responsivePadding(theme.spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  modalTitle: {
    fontSize: normalize(20),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
  },
  termsScrollView: {
    maxHeight: '80%',
  },
  termsSectionContainer: {
    marginBottom: responsivePadding(theme.spacing.md),
  },
  termsSectionTitle: {
    fontSize: normalize(17),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.dark || theme.colors.primary.base,
    marginBottom: responsivePadding(theme.spacing.sm),
    paddingBottom: responsivePadding(theme.spacing.xs),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  termsText: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    lineHeight: normalize(22),
  },
  termsBulletContainer: {
    marginTop: responsivePadding(theme.spacing.xs),
    paddingLeft: responsivePadding(theme.spacing.xs),
  },
  termsBulletPoint: {
    flexDirection: 'row',
    marginBottom: responsivePadding(theme.spacing.sm),
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.base,
    marginTop: 8,
    marginRight: responsivePadding(theme.spacing.sm),
  },
  termsConclusion: {
    marginTop: responsivePadding(theme.spacing.md),
    paddingTop: responsivePadding(theme.spacing.md),
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  closeModalButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: responsivePadding(theme.spacing.sm),
    paddingHorizontal: responsivePadding(theme.spacing.md),
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginTop: responsivePadding(theme.spacing.md),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsivePadding(theme.spacing.md),
    paddingBottom: responsivePadding(theme.spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.lighter,
  },
  contractTitle: {
    fontSize: normalize(22),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginLeft: responsivePadding(theme.spacing.sm),
  },
  contractDescriptionContainer: {
    marginBottom: responsivePadding(theme.spacing.md),
    backgroundColor: theme.colors.primary.lighter + '30',
    padding: responsivePadding(theme.spacing.md),
    borderRadius: theme.borderRadius.medium,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary.base,
  },
  contractDescription: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.dark,
    textAlign: 'right',
  },
  contractScrollView: {
    height: 350,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.surface,
  },
  contractScrollContent: {
    padding: responsivePadding(theme.spacing.md),
  },
  contractContainer: {
    padding: responsivePadding(theme.spacing.sm),
  },
  contractIntroContainer: {
    marginBottom: responsivePadding(theme.spacing.lg),
    backgroundColor: '#f9f9f9',
    padding: responsivePadding(theme.spacing.md),
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  contractIntro: {
    fontSize: normalize(15),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    lineHeight: normalize(22),
    textAlign: 'right',
  },
  contractSection: {
    marginBottom: responsivePadding(theme.spacing.lg),
    borderRadius: theme.borderRadius.medium,
    backgroundColor: 'white',
    padding: responsivePadding(theme.spacing.md),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsivePadding(theme.spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    paddingBottom: responsivePadding(theme.spacing.sm),
  },
  contractSectionNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary.base,
    color: 'white',
    textAlign: 'center',
    lineHeight: 26,
    fontSize: normalize(14),
    fontFamily: theme.fonts.bold,
    marginLeft: responsivePadding(theme.spacing.sm),
  },
  contractSectionTitle: {
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.dark,
  },
  contractClause: {
    flexDirection: 'row',
    marginBottom: responsivePadding(theme.spacing.sm),
    paddingRight: responsivePadding(theme.spacing.xs),
  },
  clauseNumberContainer: {
    marginLeft: responsivePadding(theme.spacing.sm),
    marginTop: 2,
  },
  contractClauseNumber: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.dark,
    opacity: 0.8,
  },
  clauseContentContainer: {
    flex: 1,
  },
  contractClauseText: {
    flex: 1,
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    lineHeight: normalize(20),
    textAlign: 'right',
  },
  contractSubClause: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsivePadding(theme.spacing.xs),
    paddingRight: responsivePadding(theme.spacing.sm),
  },
  contractConclusion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: responsivePadding(theme.spacing.lg),
    padding: responsivePadding(theme.spacing.md),
    backgroundColor: theme.colors.primary.lighter + '20',
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.primary.lighter,
  },
  conclusionIcon: {
    marginLeft: responsivePadding(theme.spacing.sm),
    marginTop: 2,
  },
  contractConclusionText: {
    flex: 1,
    fontSize: normalize(15),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.dark,
    lineHeight: normalize(22),
    textAlign: 'right',
  },
  contractSignatureSection: {
    marginTop: responsivePadding(theme.spacing.lg),
    alignItems: 'center',
    paddingVertical: responsivePadding(theme.spacing.md),
  },
  contractSignatureLine: {
    width: '60%',
    height: 1,
    backgroundColor: theme.colors.neutral.border,
    marginBottom: responsivePadding(theme.spacing.sm),
  },
  contractSignatureText: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
  },
  contractAgreementContainer: {
    marginTop: responsivePadding(theme.spacing.md),
    marginBottom: responsivePadding(theme.spacing.sm),
  },
  contractSeparator: {
    height: 1,
    backgroundColor: theme.colors.neutral.border,
    marginBottom: responsivePadding(theme.spacing.md),
  },
  contractCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsivePadding(theme.spacing.sm),
    backgroundColor: theme.colors.primary.lighter + '20',
    borderRadius: theme.borderRadius.medium,
    padding: responsivePadding(theme.spacing.md),
  },
  contractCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.primary.base,
    marginRight: responsivePadding(theme.spacing.sm),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  contractCheckboxChecked: {
    backgroundColor: theme.colors.primary.base,
  },
  contractAgreementText: {
    flex: 1,
    fontSize: normalize(15),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    lineHeight: normalize(22),
  },
  contractWarningText: {
    color: theme.colors.error,
    fontSize: normalize(13),
    fontFamily: theme.fonts.medium,
    marginTop: responsivePadding(theme.spacing.xs),
    textAlign: 'right',
  },
});

export default AddProduct;
