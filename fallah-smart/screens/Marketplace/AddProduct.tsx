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

  // Update the currentStep state to support only 2 steps
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

  // Add a new state variable to track whether submission was attempted
  const [submissionAttempted, setSubmissionAttempted] = useState(false);

  // Add state for success message
  const [showSuccess, setShowSuccess] = useState(false);

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
        Alert.alert('خطأ في المصادقة', 'يجب تسجيل الدخول لإضافة منتج', [
          { text: 'موافق', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      // Verify baseUrl
      if (!baseUrl) {
        console.error('API URL is undefined');
        Alert.alert('خطأ في التكوين', 'لم يتم تكوين عنوان API بشكل صحيح', [
          { text: 'موافق', onPress: () => navigation.goBack() },
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
          Alert.alert('ملف تعريف مطلوب', 'تحتاج إلى إنشاء ملف تعريف مورد قبل إضافة المنتجات', [
            { text: 'موافق', onPress: () => navigation.goBack() },
          ]);
          return;
        }

        if (!data.supplier || !data.supplier.id) {
          console.error('Invalid supplier data received:', data);
          Alert.alert(
            'خطأ في الملف الشخصي',
            'ملف تعريف المورد الخاص بك غير مكتمل. يرجى إكمال ملفك الشخصي أولاً.',
            [{ text: 'موافق', onPress: () => navigation.goBack() }]
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
            Alert.alert('ملف تعريف مطلوب', 'تحتاج إلى إنشاء ملف تعريف مورد قبل إضافة المنتجات', [
              { text: 'موافق', onPress: () => navigation.goBack() },
            ]);
            return;
          }

          if (!data.supplier || !data.supplier.id) {
            console.error('Invalid supplier data received:', data);
            Alert.alert(
              'خطأ في الملف الشخصي',
              'ملف تعريف المورد الخاص بك غير مكتمل. يرجى إكمال ملفك الشخصي أولاً.',
              [{ text: 'موافق', onPress: () => navigation.goBack() }]
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

      Alert.alert('خطأ', errorMessage, [{ text: 'موافق', onPress: () => navigation.goBack() }]);
    } finally {
      setFetchingSupplier(false);
    }
  };

  // Add improved validation for first step
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
    } else if (formData.crop_name.trim().length < 2) {
      newErrors.crop_name = 'اسم المحصول يجب أن يكون على الأقل حرفين';
      isValid = false;
    }

    // Validate quantity - update to match database limit DECIMAL(30,2)
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'الكمية مطلوبة';
      isValid = false;
    } else if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'الكمية يجب أن تكون رقمًا موجبًا';
      isValid = false;
    } else {
      // Check if the number exceeds the maximum database limit (28 digits before decimal)
      const quantityNum = parseFloat(formData.quantity);
      const quantityStr = quantityNum.toString();
      const integerPart = quantityStr.split('.')[0];

      if (integerPart.length > 28) {
        newErrors.quantity = 'الكمية كبيرة جداً. الحد الأقصى هو 28 رقماً';
        isValid = false;
      }
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

    if (!isValid) {
      // Show a helpful message to the user
      Alert.alert('تحقق من البيانات', 'يرجى التحقق من الحقول المطلوبة وإصلاح الأخطاء المذكورة');
    }

    return isValid;
  };

  // Update the main validation function
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
    } else if (formData.crop_name.trim().length < 2) {
      newErrors.crop_name = 'اسم المحصول يجب أن يكون على الأقل حرفين';
      isValid = false;
    }

    // Validate quantity - update to match database limit DECIMAL(30,2)
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'الكمية مطلوبة';
      isValid = false;
    } else if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'الكمية يجب أن تكون رقمًا موجبًا';
      isValid = false;
    } else {
      // Check if the number exceeds the maximum database limit (28 digits before decimal)
      const quantityNum = parseFloat(formData.quantity);
      const quantityStr = quantityNum.toString();
      const integerPart = quantityStr.split('.')[0];

      if (integerPart.length > 28) {
        newErrors.quantity = 'الكمية كبيرة جداً. الحد الأقصى هو 28 رقماً';
        isValid = false;
      }
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

    // Validate price - also using DECIMAL(15,2) in the database
    if (!formData.price.trim()) {
      newErrors.price = 'السعر مطلوب';
      isValid = false;
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'السعر يجب أن يكون رقمًا موجبًا';
      isValid = false;
    } else {
      // Check if the price exceeds the database limit (13 digits before decimal)
      const priceNum = parseFloat(formData.price);
      const priceStr = priceNum.toString();
      const integerPart = priceStr.split('.')[0];

      if (integerPart.length > 13) {
        newErrors.price = 'السعر أكبر من الحد المسموح به';
        isValid = false;
      }
    }

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'الوصف مطلوب';
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'يجب أن يكون الوصف على الأقل 10 حروف';
      isValid = false;
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'الوصف يجب أن يكون أقل من 500 حرف';
      isValid = false;
    }

    // Check if images are added
    if (formData.images.length === 0) {
      Alert.alert('الصور مطلوبة', 'يرجى إضافة صورة واحدة على الأقل للمنتج');
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      // Show a helpful message to the user
      Alert.alert('تحقق من البيانات', 'يرجى التحقق من الحقول المطلوبة وإصلاح الأخطاء المذكورة');
    }

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
    setSubmissionAttempted(true);

    if (!validateForm()) {
      return;
    }

    if (!supplier) {
      Alert.alert('خطأ', 'لم يتم العثور على ملف تعريف المورد. الرجاء إنشاء واحد أولاً.');
      return;
    }

    setLoading(true);

    try {
      const { access: accessToken } = await storage.getTokens();

      if (!accessToken) {
        Alert.alert('خطأ', 'يجب تسجيل الدخول لإضافة منتج');
        setLoading(false);
        return;
      }

      // Convert string values to numbers where appropriate to ensure correct data types
      const quantity = parseFloat(formData.quantity);
      const minOrderQuantity = parseFloat(formData.min_order_quantity);
      const price = parseFloat(formData.price);

      // Double check validation one more time before sending to backend
      if (minOrderQuantity >= quantity) {
        Alert.alert('خطأ', 'الحد الأدنى للطلب يجب أن يكون أقل من الكمية المتاحة');
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
        throw new Error('لم يتم تكوين عنوان API');
      }

      const url = `${baseUrl}/crops/listings`;
      console.log('POST request to:', url);

      const response = await axios.post(url, formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('Response status:', response.status);

      // Show success message
      setShowSuccess(true);

      // Hide success message after 2 seconds and navigate back
      setTimeout(() => {
        setShowSuccess(false);
        navigation.goBack();
      }, 2000);
    } catch (error) {
      console.error('Error adding product:', error);

      let errorMessage = 'حدث خطأ غير متوقع';

      if (axios.isAxiosError(error)) {
        console.log('Axios error status:', error.response?.status);

        // Try to extract the most helpful error message
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('خطأ', errorMessage);
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
        Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول إلى مكتبة الصور الخاصة بك لتحديد الصور.');
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
      Alert.alert('خطأ', 'فشل في تحديد الصور');
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

  // After the user enters basic info, they'll see the images/details step
  const goToNextStep = () => {
    if (currentStep === 1) {
      // Validate first step fields
      const firstStepValid = validateFirstStep();
      if (!firstStepValid) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Submit directly from step 2
      handleSubmit();
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
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

  // Translate loading message to Arabic
  if (fetchingSupplier) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={styles.loadingText}>جاري تحميل معلومات المورد...</Text>
      </View>
    );
  }

  // Render progress indicator with only 2 steps
  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: currentStep === 1 ? '50%' : '100%',
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
          textAlign="right"
          placeholderTextColor={theme.colors.neutral.textSecondary}
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
            textAlign="right"
            placeholderTextColor={theme.colors.neutral.textSecondary}
            maxLength={30} // Max length of DECIMAL(30,2)
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
          textAlign="right"
          placeholderTextColor={theme.colors.neutral.textSecondary}
          maxLength={30} // Max length matching quantity
        />
        {errors.min_order_quantity ? (
          <Text style={styles.errorText}>{errors.min_order_quantity}</Text>
        ) : null}
      </View>

      {/* Next Step Button */}
      <TouchableOpacity style={styles.submitButton} onPress={goToNextStep}>
        <Text style={styles.submitButtonText}>التالي</Text>
        <MaterialCommunityIcons name="arrow-right" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );

  // Render form step 2
  const renderStep2 = () => (
    <View style={styles.formContainer}>
      {/* Price and Currency */}
      <View style={styles.rowContainer}>
        <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
          <Text style={styles.label}>السعر *</Text>
          <TextInput
            style={[styles.input, errors.price ? styles.inputError : null]}
            placeholder="أدخل السعر"
            keyboardType="decimal-pad"
            value={formData.price}
            onChangeText={(text) => handleInputChange('price', text)}
            textAlign="right"
            placeholderTextColor={theme.colors.neutral.textSecondary}
            maxLength={15} // Max length of DECIMAL(15,2)
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
          textAlign="right"
          placeholderTextColor={theme.colors.neutral.textSecondary}
          maxLength={1000} // Reasonable limit for TEXT field
        />
        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
      </View>

      {/* Add images section */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>صور المنتج</Text>

        <TouchableOpacity style={styles.imagePickerButton} onPress={handleSelectImages}>
          <MaterialCommunityIcons name="image-plus" size={28} color={theme.colors.primary.base} />
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
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.primary.base} />
          <Text style={styles.backButtonText}>السابق</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, { flex: 2, marginLeft: 10 }]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="plus" size={22} color="white" />
              <Text style={styles.submitButtonText}>إضافة منتج</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Add a success overlay component
  const SuccessOverlay = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showSuccess}
      onRequestClose={() => setShowSuccess(false)}>
      <View style={styles.successOverlay}>
        <View style={styles.successContent}>
          <MaterialCommunityIcons name="check-circle" size={80} color={theme.colors.primary.base} />
          <Text style={styles.successTitle}>تمت الإضافة بنجاح!</Text>
          <Text style={styles.successText}>تمت إضافة المنتج بنجاح إلى المتجر</Text>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: responsivePadding(theme.spacing.xl) }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>إضافة منتج جديد</Text>
          {renderProgressIndicator()}
        </View>

        {currentStep === 1 ? renderStep1() : renderStep2()}
      </ScrollView>

      {/* Success overlay */}
      <SuccessOverlay />
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
    fontSize: normalize(24),
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
    height: 6,
    backgroundColor: theme.colors.neutral.border,
    borderRadius: 3,
    marginBottom: responsivePadding(theme.spacing.md),
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary.base,
    borderRadius: 3,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  activeStepIndicator: {
    backgroundColor: theme.colors.primary.base,
    borderColor: theme.colors.primary.base,
  },
  stepIndicatorText: {
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textSecondary,
  },
  activeStepText: {
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
    color: 'white',
  },
  stepLabel: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    marginTop: responsivePadding(theme.spacing.xs),
  },
  formContainer: {
    padding: responsivePadding(theme.spacing.md),
    backgroundColor: 'white',
    margin: responsivePadding(theme.spacing.md),
    borderRadius: theme.borderRadius.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: responsivePadding(theme.spacing.lg),
  },
  label: {
    fontSize: normalize(16),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginBottom: responsivePadding(theme.spacing.xs),
    textAlign: 'right',
  },
  input: {
    backgroundColor: theme.colors.neutral.surface,
    paddingHorizontal: responsivePadding(theme.spacing.md),
    paddingVertical: responsivePadding(theme.spacing.md),
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    fontSize: normalize(16),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  inputError: {
    borderColor: theme.colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    marginTop: responsivePadding(theme.spacing.xs),
    textAlign: 'right',
  },
  pickerContainer: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    overflow: 'hidden',
  },
  picker: {
    height: isSmallDevice ? 45 : 55,
    textAlign: 'right',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textArea: {
    backgroundColor: theme.colors.neutral.surface,
    paddingHorizontal: responsivePadding(theme.spacing.md),
    paddingVertical: responsivePadding(theme.spacing.md),
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    fontSize: normalize(16),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    minHeight: 120,
    textAlign: 'right',
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: responsivePadding(theme.spacing.lg),
  },
  submitButton: {
    backgroundColor: theme.colors.primary.base,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsivePadding(theme.spacing.md),
    borderRadius: theme.borderRadius.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  submitButtonText: {
    color: 'white',
    fontSize: normalize(18),
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
    borderWidth: 1.5,
    borderColor: theme.colors.primary.base,
    flex: 1,
  },
  backButtonText: {
    color: theme.colors.primary.base,
    fontSize: normalize(18),
    fontFamily: theme.fonts.medium,
    marginLeft: responsivePadding(theme.spacing.xs),
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsivePadding(theme.spacing.xl),
  },
  loadingText: {
    marginTop: responsivePadding(theme.spacing.md),
    fontSize: normalize(18),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsivePadding(theme.spacing.lg),
    borderRadius: theme.borderRadius.medium,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary.base,
    backgroundColor: theme.colors.primary.surface,
  },
  imagePickerText: {
    marginLeft: responsivePadding(theme.spacing.sm),
    fontSize: normalize(16),
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
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  imagePreview: {
    width: normalize(120),
    height: normalize(120),
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.surface,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    backgroundColor: 'white',
    padding: responsivePadding(theme.spacing.xl),
    borderRadius: theme.borderRadius.large,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  successTitle: {
    fontSize: normalize(24),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginTop: responsivePadding(theme.spacing.md),
    marginBottom: responsivePadding(theme.spacing.sm),
    textAlign: 'center',
  },
  successText: {
    fontSize: normalize(16),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
  },
});

export default AddProduct;
