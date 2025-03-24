import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { storage } from '../../utils/storage';
import { BackButton } from '../../components/BackButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  normalize,
  scaleSize,
  isSmallDevice,
  responsivePadding,
  responsiveWidth,
  responsiveHeight,
} from '../../utils/responsive';
import countryCodesData from '../../utils/countryCodes';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';

const BaseUrl = process.env.EXPO_PUBLIC_API_URL;
const { width } = Dimensions.get('window');

// Add helper function for image URLs
const getImageUrl = (imageUrl: string | undefined): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) {
    return imageUrl.replace(/http:\/\/\d+\.\d+\.\d+\.\d+:\d+/, BaseUrl);
  }
  return `${BaseUrl}${imageUrl}`;
};

// Define types for components
interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  [key: string]: any;
}

interface FormData {
  company_name: string;
  about_us: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  company_logo: string | null;
  company_banner: string | null;
  open_time: string;
  close_time: string;
}

// Add navigation type
type NavigationProp = NativeStackNavigationProp<any>;

// Steps for the form
const STEPS = [
  { id: 'basic', title: 'Basic Info', icon: 'store-outline' },
  { id: 'contact', title: 'Contact Info', icon: 'phone' },
  { id: 'media', title: 'Media', icon: 'image' },
  { id: 'hours', title: 'Business Hours', icon: 'clock-outline' },
  { id: 'review', title: 'Review', icon: 'check-circle' },
];

// Add this new component for displaying errors with animation
const ErrorMessage = ({ message, onDismiss }: ErrorMessageProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  return (
    <Animated.View
      style={[
        styles.errorContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      <View style={styles.errorContent}>
        <MaterialCommunityIcons name="alert-circle" size={24} color={theme.colors.accent.base} />
        <Text style={styles.errorMessage}>{message}</Text>
      </View>
      <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
        <MaterialCommunityIcons name="close" size={20} color={theme.colors.neutral.gray.base} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Add this function after your imports to generate random strings without uuid
const generateRandomKey = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const SupplierRegistrationForm: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();

  // Check if we're coming from verification request
  const showVerificationOnly = route.params?.showVerificationOnly || false;
  // Get the email from route params if available
  const supplierEmail = route.params?.supplierEmail || '';

  // Initialize form data with the email from params if present
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    about_us: '',
    company_address: '',
    company_phone: '',
    company_email: supplierEmail, // Use the email from params
    company_website: '',
    company_logo: null,
    company_banner: null,
    open_time: '',
    close_time: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, arrowPosition: 'bottom' });
  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressQuery, setAddressQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('+216');
  const [showCountryCodePicker, setShowCountryCodePicker] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(countryCodesData);
  const [showVerification, setShowVerification] = useState(showVerificationOnly);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [codeInputs, setCodeInputs] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(generateRandomKey());
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Add refs for code inputs to allow focus management
  const codeInputRefs = useRef<Array<TextInput | null>>([]);

  // Update progress animation when step changes
  useEffect(() => {
    // Update progress bar
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / STEPS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Fade out and slide out current form
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset position
      slideAnim.setValue(width);

      // Fade in and slide in new form
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [currentStep]);

  // Debounce function to limit API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressQuery.length > 2) {
        fetchAddressSuggestions(addressQuery);
        setShowSuggestions(true);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [addressQuery]);

  const fetchAddressSuggestions = async (query: string) => {
    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            // Add a user-agent as per Nominatim usage policy
            'User-Agent': 'FallahSmartApp/1.0',
          },
        }
      );

      if (!response.ok) {
        console.error('Address API error:', await response.text());
        return;
      }

      const data = await response.json();
      setAddressSuggestions(data as AddressSuggestion[]);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item: AddressSuggestion) => {
    // Update form data with the selected address
    setFormData({
      ...formData,
      company_address: item.display_name,
      // Store coordinates if needed for future use
      // latitude: parseFloat(item.lat),
      // longitude: parseFloat(item.lon),
    });
    setAddressQuery(item.display_name);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrors([]);

      // Validate required fields with specific errors
      const newErrors = [];

      if (!formData.company_name) {
        newErrors.push({ field: 'company_name', message: 'Company name is required' });
      }

      if (!formData.company_address) {
        newErrors.push({ field: 'company_address', message: 'Company address is required' });
      }

      if (!formData.company_phone) {
        newErrors.push({ field: 'company_phone', message: 'Phone number is required' });
      } else if (!/^\+\d{8,15}$/.test(formData.company_phone)) {
        newErrors.push({ field: 'company_phone', message: 'Please enter a valid phone number' });
      }

      if (!formData.company_email) {
        newErrors.push({ field: 'company_email', message: 'Email address is required' });
      } else if (!/\S+@\S+\.\S+/.test(formData.company_email)) {
        newErrors.push({ field: 'company_email', message: 'Please enter a valid email address' });
      }

      if (formData.company_website && !/^https?:\/\/\S+\.\S+/.test(formData.company_website)) {
        newErrors.push({ field: 'company_website', message: 'Please enter a valid website URL' });
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        // Set main error message for the error banner
        setError('Please fix the highlighted fields');
        return;
      }

      // Get the auth token from storage
      const { access: token } = await storage.getTokens();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Create form data
      const formDataToSend = new FormData();
      formDataToSend.append('company_name', formData.company_name);
      formDataToSend.append('about_us', formData.about_us);
      formDataToSend.append('company_address', formData.company_address);
      formDataToSend.append('company_phone', formData.company_phone);
      formDataToSend.append('company_email', formData.company_email);
      formDataToSend.append('company_website', formData.company_website || '');
      formDataToSend.append('open_time', formData.open_time);
      formDataToSend.append('close_time', formData.close_time);

      // Append files if they exist with proper naming
      if (formData.company_logo) {
        try {
          const response = await fetch(formData.company_logo);
          const blob = await response.blob();
          const fileName = 'company_logo_' + Date.now() + '.jpg';
          formDataToSend.append('company_logo', {
            uri: formData.company_logo,
            type: 'image/jpeg',
            name: fileName,
          } as any);
          console.log('Appending logo:', fileName);
        } catch (error) {
          console.error('Error processing logo:', error);
          throw new Error('Failed to process company logo');
        }
      }

      if (formData.company_banner) {
        try {
          const response = await fetch(formData.company_banner);
          const blob = await response.blob();
          const fileName = 'company_banner_' + Date.now() + '.jpg';
          formDataToSend.append('company_banner', {
            uri: formData.company_banner,
            type: 'image/jpeg',
            name: fileName,
          } as any);
          console.log('Appending banner:', fileName);
        } catch (error) {
          console.error('Error processing banner:', error);
          throw new Error('Failed to process company banner');
        }
      }

      console.log('Sending request to:', `${BaseUrl}/suppliers/register`);

      // Make API call
      const response = await fetch(`${BaseUrl}/suppliers/register`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create supplier account');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create supplier account');
      }

      // Show verification screen instead of alert
      setShowVerification(true);
    } catch (err) {
      console.error('Submission error:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred while creating your account'
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a field has errors
  const hasFieldError = (fieldName: string) => {
    return errors.some((error) => error.field === fieldName);
  };

  // Helper function to get error message for a field
  const getFieldErrorMessage = (fieldName: string) => {
    const error = errors.find((error) => error.field === fieldName);
    return error ? error.message : '';
  };

  // Function to show tooltip
  const showTooltip = (text: string, event: any) => {
    // Get the position of the pressed element
    const { pageX, pageY } = event.nativeEvent;

    // Calculate safe position that keeps tooltip on screen
    // Tooltip width is 300, so ensure it doesn't go off the edges
    const tooltipWidth = 300;
    const tooltipHeight = 100; // Approximate height
    const margin = 10; // Margin from screen edge

    // Calculate x position - center on tap point but keep within screen
    let x = Math.max(margin, Math.min(width - tooltipWidth - margin, pageX - tooltipWidth / 2));

    // Position above the icon by default, but if too close to top of screen, position below
    let y = pageY - tooltipHeight - 20;
    let arrowPosition = 'bottom'; // Arrow points down by default

    if (y < 50) {
      // If too close to top
      y = pageY + 30; // Position below the tap point
      arrowPosition = 'top'; // Arrow points up
    }

    setTooltipPosition({ x, y, arrowPosition });
    setTooltipText(text);
    setTooltipVisible(true);

    // Auto-hide tooltip after 3 seconds
    setTimeout(() => {
      setTooltipVisible(false);
    }, 3000);
  };

  // Function to hide tooltip
  const hideTooltip = () => {
    setTooltipVisible(false);
  };

  // Define tooltips for each field
  const tooltips = {
    company_name: 'Enter your legal business name as it appears on official documents.',
    about_us: 'Describe what your company does, your mission, and what makes you unique.',
    company_address:
      'Enter your complete business address including street, city, and postal code.',
    company_phone: 'Enter a business phone number where customers can reach you.',
    company_email: 'Enter a business email that you check regularly for customer inquiries.',
    company_website: 'Enter your company website URL starting with http:// or https://.',
    company_logo: 'Add a URL to your company logo image (recommended size: 200x200px).',
    company_banner:
      'Add a URL to a banner image for your profile header (recommended size: 1200x300px).',
    open_time: 'Enter the time your business opens, using 24-hour format (e.g., 09:00).',
    close_time: 'Enter the time your business closes, using 24-hour format (e.g., 17:00).',
  };

  // Update renderInput to show field-specific errors
  const renderInput = (
    label: string,
    field: keyof FormData,
    placeholder: string,
    options: {
      multiline?: boolean;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      required?: boolean;
      icon?: string;
    } = {}
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label} {options.required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={[styles.inputWrapper, hasFieldError(field) && styles.inputWrapperError]}>
        {options.icon && (
          <TouchableOpacity
            onPress={(e) => showTooltip(tooltips[field], e)}
            style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={options.icon as any}
              size={24}
              color={hasFieldError(field) ? theme.colors.accent.base : theme.colors.primary.base}
              style={styles.inputIcon}
            />
          </TouchableOpacity>
        )}
        <TextInput
          style={[
            styles.input,
            options.multiline && styles.textArea,
            { textAlignVertical: options.multiline ? 'top' : 'center' },
            hasFieldError(field) && styles.inputError,
          ]}
          value={formData[field] as string}
          onChangeText={(text) => {
            setFormData({ ...formData, [field]: text });
            // Clear error when user types
            if (hasFieldError(field)) {
              setErrors(errors.filter((error) => error.field !== field));
              if (errors.length === 1) setError(null);
            }
          }}
          placeholder={placeholder}
          multiline={options.multiline}
          numberOfLines={options.multiline ? 4 : 1}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize="none"
          placeholderTextColor={theme.colors.neutral.gray.base}
        />
      </View>
      {hasFieldError(field) && (
        <View style={styles.fieldErrorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={16}
            color={theme.colors.accent.base}
          />
          <Text style={styles.fieldErrorText}>{getFieldErrorMessage(field)}</Text>
        </View>
      )}
    </View>
  );

  const renderBasicInfoStep = () => (
    <View style={styles.formGroup}>
      <View style={styles.illustration}>
        <MaterialCommunityIcons
          name="store"
          size={100}
          color={theme.colors.secondary.base}
          style={{ opacity: 0.8 }}
        />
      </View>

      <View style={styles.formGroupHeader}>
        <MaterialCommunityIcons name="store-outline" size={24} color={theme.colors.primary.base} />
        <Text style={styles.groupTitle}>Let's start with your company basics</Text>
      </View>

      {renderInput('Company Name', 'company_name', 'Enter your company name', {
        required: true,
        icon: 'office-building',
      })}

      {renderInput('About Us (optional)', 'about_us', 'Tell us about your company ', {
        multiline: true,
        required: false,
        icon: 'information-outline',
      })}
    </View>
  );

  const renderContactStep = () => (
    <View style={styles.formGroup}>
      <View style={styles.illustration}>
        <MaterialCommunityIcons
          name="contacts"
          size={100}
          color={theme.colors.secondary.base}
          style={{ opacity: 0.8 }}
        />
      </View>

      <View style={styles.formGroupHeader}>
        <MaterialCommunityIcons name="phone" size={24} color={theme.colors.primary.base} />
        <Text style={styles.groupTitle}>How can customers reach you?</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          Company Address <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            onPress={(e) => showTooltip(tooltips.company_address, e)}
            style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="map-marker"
              size={24}
              color={theme.colors.primary.base}
              style={styles.inputIcon}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={addressQuery}
            onChangeText={(text) => {
              setAddressQuery(text);
              setFormData({ ...formData, company_address: text });
            }}
            placeholder="Enter your company address"
            placeholderTextColor={theme.colors.neutral.gray.base}
          />
          {addressQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setAddressQuery('');
                setFormData({ ...formData, company_address: '' });
                setAddressSuggestions([]);
                setShowSuggestions(false);
              }}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={theme.colors.neutral.gray.base}
              />
            </TouchableOpacity>
          )}
        </View>

        {showSuggestions && addressSuggestions.length > 0 && (
          <Animated.View
            style={[
              styles.suggestionsContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}>
            <ScrollView
              style={styles.suggestionsScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}>
              {addressSuggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionItem,
                    index === addressSuggestions.length - 1 && styles.lastSuggestionItem,
                  ]}
                  onPress={() => handleSelectSuggestion(item)}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={20}
                    color={theme.colors.primary.base}
                    style={styles.suggestionIcon}
                  />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          Phone Number <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.phoneInputContainer}>
          <TouchableOpacity
            style={styles.countryCodeSelector}
            onPress={() => {
              setShowCountryCodePicker(true);
              setCountrySearchQuery('');
              setFilteredCountries(countryCodesData);
            }}>
            <Text style={styles.countryCodeText}>{selectedCountryCode}</Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={theme.colors.neutral.textSecondary}
            />
          </TouchableOpacity>

          <View style={[styles.inputWrapper, styles.phoneNumberInput]}>
            <TouchableOpacity
              onPress={(e) => showTooltip(tooltips.company_phone, e)}
              style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="phone"
                size={24}
                color={theme.colors.primary.base}
                style={styles.inputIcon}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={formData.company_phone.replace(selectedCountryCode, '')}
              onChangeText={(text) => {
                // Only allow numbers
                const numbersOnly = text.replace(/[^0-9]/g, '');
                setFormData({ ...formData, company_phone: selectedCountryCode + numbersOnly });
              }}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              placeholderTextColor={theme.colors.neutral.gray.base}
            />
          </View>
        </View>

        {/* Country Code Modal Picker */}
        <Modal
          transparent
          visible={showCountryCodePicker}
          animationType="slide"
          onRequestClose={() => setShowCountryCodePicker(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCountryCodePicker(false)}>
            <View style={styles.countryPickerContainer}>
              <View style={styles.countryPickerHeader}>
                <Text style={styles.countryPickerTitle}>Select Country Code</Text>
                <TouchableOpacity onPress={() => setShowCountryCodePicker(false)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={theme.colors.neutral.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.countrySearchContainer}>
                <TextInput
                  style={styles.countrySearchInput}
                  value={countrySearchQuery}
                  onChangeText={setCountrySearchQuery}
                  placeholder="Search country or code..."
                  placeholderTextColor={theme.colors.neutral.gray.base}
                  autoCapitalize="none"
                />
              </View>

              <ScrollView style={styles.countryList}>
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <TouchableOpacity
                      key={country.code}
                      style={[
                        styles.countryItem,
                        selectedCountryCode === country.dial_code && {
                          backgroundColor: theme.colors.primary.light + '20',
                          borderLeftWidth: 3,
                          borderLeftColor: theme.colors.primary.base,
                        },
                      ]}
                      onPress={() => {
                        setSelectedCountryCode(country.dial_code);
                        setFormData({
                          ...formData,
                          company_phone:
                            country.dial_code + formData.company_phone.replace(/^\+\d+/, ''),
                        });
                        setShowCountryCodePicker(false);
                      }}>
                      <Text style={styles.countryFlag}>{country.flag}</Text>
                      <Text style={styles.countryName} numberOfLines={1}>
                        {country.name}
                      </Text>
                      <Text style={styles.countryDialCode}>{country.dial_code}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View
                    style={{ padding: responsivePadding(theme.spacing.lg), alignItems: 'center' }}>
                    <MaterialCommunityIcons
                      name="magnify-close"
                      size={40}
                      color={theme.colors.neutral.gray.base}
                    />
                    <Text
                      style={{
                        textAlign: 'center',
                        marginTop: theme.spacing.md,
                        color: theme.colors.neutral.gray.base,
                        fontSize: normalize(14),
                      }}>
                      No countries found matching "{countrySearchQuery}"
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      {renderInput('Email', 'company_email', 'Enter your email address', {
        keyboardType: 'email-address',
        required: true,
        icon: 'email',
      })}

      {renderInput('Website (optional)', 'company_website', 'Enter your website URL', {
        icon: 'web',
      })}
    </View>
  );

  const renderMediaStep = () => {
    const pickImage = async (type: 'logo' | 'banner') => {
      try {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access media library was denied');
          return;
        }

        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: type === 'logo' ? [1, 1] : [16, 9],
          quality: 0.8,
        });

        if (!result.canceled) {
          // Update form data with the selected image URI
          setFormData({
            ...formData,
            [type === 'logo' ? 'company_logo' : 'company_banner']: result.assets[0].uri,
          });
        }
      } catch (err) {
        setError('Error picking image');
        console.error('Error picking image:', err);
      }
    };

    return (
      <View style={styles.formGroup}>
        <View style={styles.formGroupHeader}>
          <MaterialCommunityIcons name="image" size={24} color={theme.colors.primary.base} />
          <Text style={styles.groupTitle}>Make your profile visually appealing</Text>
        </View>

        <View style={styles.imagePreviewSection}>
          <Text style={styles.inputLabel}>Company Logo</Text>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={() => pickImage('logo')}
            activeOpacity={0.8}>
            {formData.company_logo ? (
              <Image source={{ uri: formData.company_logo }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePreviewPlaceholder}>
                <MaterialCommunityIcons
                  name="image-plus"
                  size={40}
                  color={theme.colors.neutral.gray.base}
                />
                <Text style={styles.placeholderText}>Add Logo</Text>
                <Text style={styles.placeholderSubText}>Tap to choose</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.imagePreviewSection}>
          <Text style={styles.inputLabel}>Company Banner</Text>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={() => pickImage('banner')}
            activeOpacity={0.8}>
            {formData.company_banner ? (
              <Image source={{ uri: formData.company_banner }} style={styles.bannerPreview} />
            ) : (
              <View style={styles.bannerPreviewPlaceholder}>
                <MaterialCommunityIcons
                  name="image-plus"
                  size={40}
                  color={theme.colors.neutral.gray.base}
                />
                <Text style={styles.placeholderText}>Add Banner</Text>
                <Text style={styles.placeholderSubText}>Tap to choose</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHoursStep = () => (
    <View style={styles.formGroup}>
      <View style={styles.illustration}>
        <MaterialCommunityIcons
          name="clock-time-four-outline"
          size={100}
          color={theme.colors.secondary.base}
          style={{ opacity: 0.8 }}
        />
      </View>

      <View style={styles.formGroupHeader}>
        <MaterialCommunityIcons name="clock-outline" size={24} color={theme.colors.primary.base} />
        <Text style={styles.groupTitle}>When are you open for business?</Text>
      </View>

      <View style={styles.timeContainer}>
        <View style={styles.timeInput}>
          <Text style={styles.inputLabel}>
            Opening Time <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => setShowOpenTimePicker(true)}>
            <MaterialCommunityIcons
              name="clock-start"
              size={24}
              color={theme.colors.primary.base}
              style={styles.inputIcon}
            />
            <Text style={[styles.input, { flex: 1 }]}>{formData.open_time}</Text>
          </TouchableOpacity>
          {showOpenTimePicker && (
            <DateTimePicker
              value={new Date(`2000-01-01T${formData.open_time}`)}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedDate) => {
                setShowOpenTimePicker(false);
                if (selectedDate) {
                  const hours = selectedDate.getHours().toString().padStart(2, '0');
                  const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
                  setFormData({ ...formData, open_time: `${hours}:${minutes}` });
                }
              }}
            />
          )}
        </View>
        <View style={styles.timeInput}>
          <Text style={styles.inputLabel}>
            Closing Time <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => setShowCloseTimePicker(true)}
            disabled={isVerifying}>
            <MaterialCommunityIcons
              name="clock-end"
              size={24}
              color={theme.colors.primary.base}
              style={styles.inputIcon}
            />
            <Text style={[styles.input, { flex: 1 }]}>{formData.close_time}</Text>
          </TouchableOpacity>
          {showCloseTimePicker && (
            <DateTimePicker
              value={new Date(`2000-01-01T${formData.close_time}`)}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedDate) => {
                setShowCloseTimePicker(false);
                if (selectedDate) {
                  const hours = selectedDate.getHours().toString().padStart(2, '0');
                  const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
                  setFormData({ ...formData, close_time: `${hours}:${minutes}` });
                }
              }}
            />
          )}
        </View>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.formGroup}>
      <View style={styles.formGroupHeader}>
        <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary.base} />
        <Text style={styles.groupTitle}>Review your company profile</Text>
      </View>

      <View style={styles.reviewContainer}>
        {/* Company Info */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Company Info</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Name:</Text>
            <Text style={styles.reviewValue}>{formData.company_name || 'Not provided'}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>About:</Text>
            <Text style={styles.reviewValue}>{formData.about_us || 'Not provided'}</Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Contact Info</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Address:</Text>
            <Text style={styles.reviewValue}>{formData.company_address || 'Not provided'}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Phone:</Text>
            <Text style={styles.reviewValue}>{formData.company_phone || 'Not provided'}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Email:</Text>
            <Text style={styles.reviewValue}>{formData.company_email || 'Not provided'}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Website:</Text>
            <Text style={styles.reviewValue}>{formData.company_website || 'Not provided'}</Text>
          </View>
        </View>

        {/* Hours */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Business Hours</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Hours:</Text>
            <Text style={styles.reviewValue}>
              {formData.open_time} - {formData.close_time}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderVerificationScreen = () => (
    <View style={styles.verificationContainer}>
      {renderCaptchaModal()}

      <View style={styles.verificationCard}>
        <MaterialCommunityIcons
          name="email-check-outline"
          size={80}
          color={theme.colors.primary.base}
          style={styles.verificationIcon}
        />

        <Text style={styles.verificationTitle}>
          {verificationSuccess ? 'Verification Complete!' : 'Almost there!'}
        </Text>

        {verificationSuccess ? (
          <>
            <View style={styles.successIconContainer}>
              <MaterialCommunityIcons
                name="check-circle"
                size={60}
                color={theme.colors.success}
                style={styles.successIcon}
              />
            </View>

            <Text style={styles.verificationDescription}>
              Your email has been successfully verified!
            </Text>

            <Text style={styles.verificationInstructions}>
              You can now access all supplier features on the platform.
            </Text>

            <TouchableOpacity style={styles.continueButton} onPress={() => navigation.goBack()}>
              <Text style={styles.continueButtonText}>Continue to Profile</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.verificationDescription}>We've sent a verification code to:</Text>

            <View style={styles.emailContainer}>
              <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary.base} />
              <Text style={styles.emailText}>{formData.company_email}</Text>
            </View>

            <Text style={styles.verificationInstructions}>
              Please enter the 6-digit code sent to your email to verify your account.
            </Text>

            {/* Verification code input */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCodePaste}
              style={styles.codeInputContainer}>
              {codeInputs.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (codeInputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : {},
                    verificationError ? styles.codeInputError : {},
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeInputChange(index, value)}
                  onKeyPress={(e) => handleKeyPress(index, e)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </TouchableOpacity>

            {verificationError && (
              <View style={styles.codeErrorContainer}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={18}
                  color={theme.colors.accent.base}
                />
                <Text style={styles.codeErrorText}>{verificationError}</Text>
              </View>
            )}

            <View style={styles.verificationActions}>
              <TouchableOpacity
                style={[styles.resendButton, resendDisabled && styles.resendButtonDisabled]}
                onPress={() => {
                  // Reset captcha token to force new captcha verification
                  setCaptchaToken(null);
                  sendVerificationCode();
                }}
                disabled={resendDisabled || isVerifying}>
                <Text
                  style={[
                    styles.resendButtonText,
                    resendDisabled && styles.resendButtonTextDisabled,
                  ]}>
                  {resendDisabled
                    ? `Resend Code (${resendCountdown}s)`
                    : 'Resend Verification Code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  isVerifying && styles.verifyButtonDisabled,
                  codeInputs.some((digit) => digit === '') && styles.verifyButtonDisabled,
                ]}
                onPress={() => verifyCode(codeInputs.join(''))}
                disabled={isVerifying || codeInputs.some((digit) => digit === '')}>
                {isVerifying ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.verifyButtonText}>Verify Email</Text>
                    <MaterialCommunityIcons
                      name="shield-check"
                      size={20}
                      color="white"
                      style={{ marginLeft: 8 }}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );

  const renderCaptchaModal = () => (
    <Modal
      transparent
      visible={showCaptcha}
      animationType="fade"
      onRequestClose={() => setShowCaptcha(false)}>
      <View style={styles.captchaModalOverlay}>
        <View style={styles.captchaModalContainer}>
          <View style={styles.captchaHeader}>
            <Text style={styles.captchaTitle}>Security Verification</Text>
            <TouchableOpacity onPress={() => setShowCaptcha(false)}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.neutral.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {isLoadingCaptcha && (
            <View style={styles.captchaLoadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary.base} />
              <Text style={styles.captchaLoadingText}>Loading security check...</Text>
            </View>
          )}

          <WebView
            key={captchaKey}
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
                  <style>
                    body { 
                      display: flex; 
                      justify-content: center; 
                      align-items: center; 
                      height: 100vh; 
                      margin: 0; 
                      padding: 0;
                      background-color: #f5f5f5;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    }
                    .container {
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      padding: 10px;
                      width: 100%;
                      box-sizing: border-box;
                    }
                    .title {
                      margin-bottom: 15px;
                      color: #333;
                      text-align: center;
                      font-size: 16px;
                    }
                    .g-recaptcha {
                      transform-origin: center;
                      -webkit-transform-origin: center;
                    }
                    @media screen and (max-width: 340px) {
                      .g-recaptcha {
                        transform: scale(0.85);
                        -webkit-transform: scale(0.85);
                        margin-left: -20px;
                      }
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h3 class="title">Please complete the security check</h3>
                    <div class="g-recaptcha" 
                      data-sitekey="6LcvM6EoAAAAALNpCsY1SigB6G-NiJFxBzm0GvGq" 
                      data-callback="onCaptchaCompleted"
                      data-size="normal">
                    </div>
                  </div>
                  
                  <script>
                    // Function to check if reCAPTCHA loaded successfully
                    function checkRecaptchaLoaded() {
                      if (typeof grecaptcha === 'undefined' || 
                          !document.querySelector('.g-recaptcha-response')) {
                        // If not loaded after 10 seconds, notify app
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'captchaError',
                          error: 'reCAPTCHA failed to load'
                        }));
                      } else {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'captchaLoaded'
                        }));
                      }
                    }
                    
                    function onCaptchaCompleted(token) {
                      // Validate token is not empty
                      if (!token) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'captchaError',
                          error: 'Invalid token received'
                        }));
                        return;
                      }
                      
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'captchaCompleted',
                        token: token
                      }));
                    }
                    
                    // Set timeout to check if reCAPTCHA loaded
                    setTimeout(checkRecaptchaLoaded, 10000);
                    
                    // Notify when page is fully loaded
                    window.onload = function() {
                      setTimeout(function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'pageLoaded'
                        }));
                      }, 1000);
                    };
                  </script>
                </body>
                </html>
              `,
            }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                console.log('Received WebView message:', data.type);

                if (data.type === 'captchaCompleted') {
                  handleCaptchaComplete(data.token);
                } else if (data.type === 'captchaLoaded' || data.type === 'pageLoaded') {
                  setIsLoadingCaptcha(false);
                } else if (data.type === 'captchaError') {
                  console.error('reCAPTCHA error:', data.error);
                  handleWebViewFailure('Security check failed. Please try again.');
                }
              } catch (error) {
                console.error('Error processing WebView message:', error);
                handleWebViewFailure('Failed to verify security check. Please try again.');
              }
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              handleWebViewFailure('Failed to load security check. Please try again.');
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView HTTP error:', nativeEvent);
              handleWebViewFailure('Network error loading security check. Please try again.');
            }}
            style={[styles.captchaWebView, isLoadingCaptcha && { opacity: 0 }]}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            bounces={false}
          />

          <View style={styles.captchaFooter}>
            <TouchableOpacity style={styles.captchaRefreshButton} onPress={resetCaptcha}>
              <MaterialCommunityIcons name="refresh" size={18} color={theme.colors.primary.base} />
              <Text style={styles.captchaRefreshText}>Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captchaCancelButton}
              onPress={() => {
                setShowCaptcha(false);
                if (__DEV__) {
                  // In development mode, skip captcha verification
                  handleCaptchaComplete('dev_mode_fallback_token');
                }
              }}>
              <Text style={styles.captchaCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCurrentStep = () => {
    if (showVerification) {
      return renderVerificationScreen();
    }

    switch (currentStep) {
      case 0:
        return renderBasicInfoStep();
      case 1:
        return renderContactStep();
      case 2:
        return renderMediaStep();
      case 3:
        return renderHoursStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  // Modify sendVerificationCode to include captcha verification or bypass in development
  const sendVerificationCode = async () => {
    try {
      // Show captcha before proceeding, except in development mode with fallback enabled
      if (!captchaToken && !(__DEV__ && Platform.OS === 'android')) {
        setShowCaptcha(true);
        return;
      }

      setIsVerifying(true);
      setVerificationError(null);

      // Call the backend API to send verification code
      const { access: token } = await storage.getTokens();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${BaseUrl}/verification/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.company_email,
          captchaToken: captchaToken || 'dev_mode_fallback_token', // Send token or fallback in dev mode
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      // Reset captcha token after successful use
      setCaptchaToken(null);

      // Disable resend button and start countdown
      setResendDisabled(true);
      let countDown = 60;
      const timer = setInterval(() => {
        countDown -= 1;
        setResendCountdown(countDown);
        if (countDown <= 0) {
          clearInterval(timer);
          setResendDisabled(false);
        }
      }, 1000);

      Alert.alert(
        'Verification Code Sent',
        `A verification code has been sent to ${formData.company_email}. Please check your inbox.`
      );
    } catch (error) {
      console.error('Error sending verification code:', error);
      setVerificationError(
        error instanceof Error
          ? error.message
          : 'Failed to send verification code. Please try again.'
      );
      // Reset captcha on error
      setCaptchaToken(null);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle captcha completion
  const handleCaptchaComplete = (token: string) => {
    setCaptchaToken(token);
    setShowCaptcha(false);

    // Automatically proceed with email verification after captcha completion
    setTimeout(() => {
      sendVerificationCode();
    }, 500);
  };

  // Reset captcha
  const resetCaptcha = () => {
    setCaptchaKey(generateRandomKey());
    setCaptchaToken(null);
    setIsLoadingCaptcha(true);
  };

  // Function to handle code input with improved focus management
  const handleCodeInputChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) {
        value = value[0]; // Only take the first digit if multiple are pasted
      }

      const newCodeInputs = [...codeInputs];
      newCodeInputs[index] = value;
      setCodeInputs(newCodeInputs);

      // Auto advance to next input
      if (value !== '' && index < 5 && codeInputRefs.current[index + 1]) {
        codeInputRefs.current[index + 1]?.focus();
      }

      // Check if all inputs are filled to auto-submit
      if (newCodeInputs.every((digit) => digit !== '') && newCodeInputs.join('').length === 6) {
        verifyCode(newCodeInputs.join(''));
      }
    },
    [codeInputs]
  );

  // Function to handle backspace key for better UX
  const handleKeyPress = useCallback(
    (index: number, e: any) => {
      // Handle backspace - move to previous input when current is empty
      if (e.nativeEvent.key === 'Backspace' && codeInputs[index] === '' && index > 0) {
        codeInputRefs.current[index - 1]?.focus();
      }
    },
    [codeInputs]
  );

  // Add this function after the existing verifyCode function
  const updateSupplierVerificationStatus = async (token: string) => {
    try {
      console.log('Updating supplier verification status...');

      const response = await fetch(`${BaseUrl}/suppliers/verify`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update verification status:', errorData);
        // We don't throw error here to avoid blocking the user experience
        return false;
      }

      const data = await response.json();
      console.log('Verification status updated successfully:', data);
      return true;
    } catch (error) {
      console.error('Error updating verification status:', error);
      // Don't block the user experience, just log the error
      return false;
    }
  };

  // Now modify the existing verifyCode function to call this new function after successful verification
  const verifyCode = async (code: string) => {
    try {
      setIsVerifying(true);
      setVerificationError(null);

      // Get auth token
      const { access: token } = await storage.getTokens();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Call verification API
      const response = await fetch(`${BaseUrl}/verification/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.company_email,
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Clear the code inputs when verification fails
        setCodeInputs(['', '', '', '', '', '']);

        // Focus on the first input after clearing
        if (codeInputRefs.current[0]) {
          codeInputRefs.current[0].focus();
        }

        throw new Error(data.message || 'Failed to verify code');
      }

      // Success! Now call the supplier verification API
      const verificationUpdated = await updateSupplierVerificationStatus(token);

      if (verificationUpdated) {
        console.log('Supplier verification status updated successfully');
      } else {
        console.warn('Failed to update supplier verification status, but email was verified');
        // We continue anyway because the email was verified successfully
      }

      // Update the UI
      setVerificationSuccess(true);
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError(
        error instanceof Error ? error.message : 'Invalid verification code. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Paste handler for code input
  const handleCodePaste = useCallback(async () => {
    try {
      const clipboard = await Clipboard.getStringAsync();
      if (/^\d{6}$/.test(clipboard)) {
        // If clipboard contains exactly 6 digits, populate the inputs
        const digits = clipboard.split('');
        setCodeInputs(digits);

        // Auto-verify after paste
        verifyCode(clipboard);
      }
    } catch (error) {
      console.error('Error pasting code:', error);
    }
  }, []);

  // Modify the useEffect hook to handle captcha setup and add dev mode bypass
  useEffect(() => {
    // Auto-send verification code when verification screen first appears
    if (showVerification) {
      // In development mode, we can bypass captcha completely for testing
      if (__DEV__ && Platform.OS === 'android') {
        console.log('DEV MODE: Bypassing captcha verification');
        // Directly send verification code without showing captcha
        setCaptchaToken('dev_mode_bypass_token');
        setTimeout(() => {
          sendVerificationCode();
        }, 500);
      } else {
        // Reset captcha token to force captcha verification
        setCaptchaToken(null);
        sendVerificationCode();
      }
    }
  }, [showVerification]);

  // Add a helper function to handle WebView loading failures
  const handleWebViewFailure = (errorMessage: string) => {
    console.error('WebView failure:', errorMessage);
    setVerificationError(errorMessage);
    setShowCaptcha(false);

    // In development mode, provide a fallback
    if (__DEV__) {
      console.log('DEV MODE: Using fallback token after WebView failure');
      setCaptchaToken('dev_mode_fallback_token');
      setTimeout(() => {
        sendVerificationCode();
      }, 1000);
    }
  };

  // Add useEffect to handle direct navigation to verification
  useEffect(() => {
    if (showVerificationOnly) {
      setCurrentStep(5); // Set to the right step number for verification
      // You might need to check if the user has an account already
      // and populate any required fields
    }
  }, [showVerificationOnly]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      {/* Conditionally render either the form or verification screen */}
      {showVerification ? (
        renderVerificationScreen()
      ) : (
        <>
          {/* Error Banner */}
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

          {/* Tooltip Modal */}
          <Modal
            transparent
            visible={tooltipVisible}
            animationType="fade"
            onRequestClose={hideTooltip}>
            <TouchableOpacity style={styles.tooltipOverlay} activeOpacity={1} onPress={hideTooltip}>
              <View
                style={[
                  styles.tooltipContainer,
                  {
                    left: tooltipPosition.x,
                    top: tooltipPosition.y,
                  },
                ]}>
                {tooltipPosition.arrowPosition === 'bottom' ? (
                  <View style={styles.tooltipArrowBottom} />
                ) : (
                  <View style={styles.tooltipArrowTop} />
                )}
                <Text style={styles.tooltipText}>{tooltipText}</Text>
              </View>
            </TouchableOpacity>
          </Modal>

          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.stepsContainer}>
            {STEPS.map((step, index) => (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.stepIndicator,
                  currentStep === index && styles.currentStepIndicator,
                  currentStep > index && styles.completedStepIndicator,
                ]}
                onPress={() => index <= currentStep && setCurrentStep(index)}
                disabled={index > currentStep}>
                <MaterialCommunityIcons
                  name={step.icon as any}
                  size={18}
                  color={
                    currentStep === index
                      ? theme.colors.neutral.surface
                      : currentStep > index
                        ? theme.colors.primary.surface
                        : theme.colors.neutral.gray.base
                  }
                />
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{STEPS[currentStep].title}</Text>
              <Text style={styles.formSubtitle}>
                Step {currentStep + 1} of {STEPS.length}
              </Text>
            </View>

            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                },
              ]}>
              {renderCurrentStep()}

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.backButton} onPress={handlePrev}>
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={24}
                    color={theme.colors.primary.base}
                  />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                {currentStep < STEPS.length - 1 ? (
                  <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>Next</Text>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="white" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color={theme.colors.neutral.surface} />
                    ) : (
                      <>
                        <Text style={styles.submitButtonText}>Create Profile</Text>
                        <MaterialCommunityIcons name="check-circle" size={24} color="white" />
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  progressContainer: {
    height: 4,
    backgroundColor: theme.colors.neutral.border,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary.base,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.medium,
  },
  stepIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentStepIndicator: {
    backgroundColor: theme.colors.primary.base,
    ...theme.shadows.small,
  },
  completedStepIndicator: {
    backgroundColor: theme.colors.primary.light,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  formHeader: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  formTitle: {
    fontSize: normalize(isSmallDevice ? 20 : 24),
    marginBottom: responsivePadding(theme.spacing.xs),
  },
  formSubtitle: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    padding: theme.spacing.lg,
  },
  formGroup: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.large,
    padding: responsivePadding(theme.spacing.md),
    marginBottom: responsivePadding(theme.spacing.md),
    ...theme.shadows.medium,
  },
  formGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  groupTitle: {
    fontSize: normalize(isSmallDevice ? 16 : 18),
    marginLeft: responsivePadding(theme.spacing.sm),
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  required: {
    color: theme.colors.accent.base,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.medium,
  },
  inputIcon: {
    // Remove padding as it's now on the container
  },
  input: {
    flex: 1,
    padding: responsivePadding(theme.spacing.sm),
    fontSize: normalize(isSmallDevice ? 14 : 16),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
  textArea: {
    height: 120,
    paddingTop: theme.spacing.md,
  },
  imagePreviewSection: {
    marginBottom: theme.spacing.md,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  imagePreview: {
    width: responsiveWidth(isSmallDevice ? 30 : 35),
    height: responsiveWidth(isSmallDevice ? 30 : 35),
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  imagePreviewPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 2,
    borderColor: theme.colors.neutral.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.gray.base,
    marginTop: theme.spacing.xs,
  },
  placeholderSubText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.gray.light,
    marginTop: theme.spacing.xs,
  },
  bannerPreview: {
    width: '100%',
    height: responsiveHeight(isSmallDevice ? 15 : 20),
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  bannerPreviewPlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 2,
    borderColor: theme.colors.neutral.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  timeInput: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: isSmallDevice ? 'column' : 'row',
    gap: responsivePadding(theme.spacing.sm),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
    backgroundColor: theme.colors.neutral.surface,
  },
  backButtonText: {
    color: theme.colors.primary.base,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    marginLeft: theme.spacing.xs,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.base,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    flex: isSmallDevice ? undefined : 1,
    width: isSmallDevice ? '100%' : 'auto',
    marginTop: isSmallDevice ? responsivePadding(theme.spacing.sm) : 0,
    ...theme.shadows.medium,
  },
  nextButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    marginRight: theme.spacing.xs,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.base,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.medium,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.bold,
    marginRight: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.accent.base,
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  illustration: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  reviewContainer: {
    gap: theme.spacing.lg,
  },
  reviewSection: {
    backgroundColor: theme.colors.neutral.background,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
  },
  reviewSectionTitle: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginBottom: theme.spacing.sm,
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  reviewLabel: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    width: 80,
  },
  reviewValue: {
    flex: 1,
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
  iconContainer: {
    padding: theme.spacing.sm,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tooltipContainer: {
    position: 'absolute',
    width: 300,
    backgroundColor: theme.colors.primary.dark,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    ...theme.shadows.medium,
  },
  tooltipArrowBottom: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    borderWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: theme.colors.primary.dark,
  },
  tooltipArrowTop: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -10,
    borderWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: theme.colors.primary.dark,
  },
  tooltipText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    textAlign: 'center',
  },
  imagePickerButton: {
    width: '100%',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  suggestionsContainer: {
    marginTop: 5,
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.medium,
    maxHeight: responsiveHeight(isSmallDevice ? 25 : 30),
    ...theme.shadows.medium,
    zIndex: 10,
  },
  suggestionsScrollView: {
    width: '100%',
    maxHeight: responsiveHeight(isSmallDevice ? 25 : 30),
  },
  suggestionItem: {
    padding: responsivePadding(theme.spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lastSuggestionItem: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  suggestionText: {
    fontSize: normalize(isSmallDevice ? 14 : 16),
    color: theme.colors.neutral.textPrimary,
    flex: 1,
  },
  clearButton: {
    padding: theme.spacing.sm,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsivePadding(theme.spacing.xs),
    marginBottom: theme.spacing.sm,
  },
  countryCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.neutral.background,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: responsivePadding(theme.spacing.sm),
    paddingVertical: responsivePadding(theme.spacing.sm),
    minWidth: responsiveWidth(isSmallDevice ? 24 : 20),
    maxWidth: responsiveWidth(isSmallDevice ? 28 : 24),
    height: 50,
    ...theme.shadows.small,
  },
  countryCodeText: {
    fontSize: normalize(isSmallDevice ? 14 : 16),
    color: theme.colors.neutral.textPrimary,
    fontFamily: theme.fonts.medium,
    flex: 1,
    textAlign: 'center',
    marginRight: responsivePadding(theme.spacing.xs),
  },
  phoneNumberInput: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  countryPickerContainer: {
    backgroundColor: theme.colors.neutral.surface,
    borderTopLeftRadius: theme.borderRadius.large,
    borderTopRightRadius: theme.borderRadius.large,
    height: responsiveHeight(isSmallDevice ? 60 : 70),
    ...theme.shadows.large,
  },
  countryPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsivePadding(theme.spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  countryPickerTitle: {
    fontSize: normalize(18),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
  },
  countryList: {
    padding: responsivePadding(theme.spacing.md),
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsivePadding(theme.spacing.md),
    paddingHorizontal: responsivePadding(theme.spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.small,
  },
  countryFlag: {
    fontSize: normalize(22),
    marginRight: responsivePadding(theme.spacing.sm),
  },
  countryName: {
    flex: 1,
    fontSize: normalize(isSmallDevice ? 14 : 16),
    color: theme.colors.neutral.textPrimary,
    fontFamily: theme.fonts.regular,
  },
  countryDialCode: {
    fontSize: normalize(isSmallDevice ? 14 : 16),
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.medium,
    marginLeft: responsivePadding(theme.spacing.sm),
    minWidth: responsiveWidth(10),
    textAlign: 'right',
  },
  countrySearchContainer: {
    padding: responsivePadding(theme.spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  countrySearchInput: {
    backgroundColor: theme.colors.neutral.background,
    borderRadius: theme.borderRadius.medium,
    padding: responsivePadding(theme.spacing.md),
    fontSize: normalize(16),
    color: theme.colors.neutral.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  verificationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.neutral.background,
  },
  verificationCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  verificationIcon: {
    marginBottom: theme.spacing.lg,
  },
  verificationTitle: {
    fontSize: normalize(24),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  verificationDescription: {
    fontSize: normalize(16),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.lg,
    width: '100%',
    justifyContent: 'center',
  },
  emailText: {
    fontSize: normalize(18),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.dark,
    marginLeft: theme.spacing.sm,
  },
  verificationInstructions: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  resendButton: {
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  resendButtonText: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
    textDecorationLine: 'underline',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.medium,
    width: '100%',
    ...theme.shadows.small,
  },
  continueButtonText: {
    fontSize: normalize(16),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.surface,
    marginRight: theme.spacing.sm,
  },
  errorContainer: {
    position: 'absolute',
    top: 60, // Adjust based on your header height
    left: 0,
    right: 0,
    zIndex: 100,
    margin: theme.spacing.md,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: responsivePadding(theme.spacing.sm),
    paddingHorizontal: responsivePadding(theme.spacing.md),
    ...theme.shadows.medium,
  },
  errorContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorMessage: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
  },
  dismissButton: {
    padding: theme.spacing.xs,
  },
  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  fieldErrorText: {
    fontSize: normalize(12),
    fontFamily: theme.fonts.regular,
    color: theme.colors.accent.base,
    marginLeft: theme.spacing.xs,
  },
  inputWrapperError: {
    borderColor: theme.colors.accent.base,
    borderWidth: 1.5,
    backgroundColor: theme.colors.accent.light + '10',
  },
  inputError: {
    color: theme.colors.neutral.textPrimary,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 1.5,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.small,
    textAlign: 'center',
    fontSize: normalize(20),
    fontFamily: theme.fonts.medium,
    backgroundColor: theme.colors.neutral.background,
    color: theme.colors.neutral.textPrimary,
  },
  codeInputFilled: {
    borderColor: theme.colors.primary.base,
    backgroundColor: theme.colors.primary.light + '20',
  },
  codeInputError: {
    borderColor: theme.colors.accent.base,
    backgroundColor: theme.colors.accent.light + '15',
  },
  verificationActions: {
    width: '100%',
    marginTop: theme.spacing.md,
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonTextDisabled: {
    color: theme.colors.neutral.gray.base,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.medium,
    width: '100%',
    marginTop: theme.spacing.md,
    ...theme.shadows.small,
  },
  verifyButtonDisabled: {
    backgroundColor: theme.colors.neutral.gray.base,
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: normalize(16),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.surface,
  },
  successIconContainer: {
    backgroundColor: theme.colors.success + '20',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  successIcon: {
    // No additional styles needed
  },
  codeErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.accent.light + '20',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    width: '100%',
  },
  codeErrorText: {
    fontSize: normalize(12),
    fontFamily: theme.fonts.regular,
    color: theme.colors.accent.base,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  captchaModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captchaModalContainer: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
    ...theme.shadows.large,
  },
  captchaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsivePadding(theme.spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  captchaTitle: {
    fontSize: normalize(18),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
  },
  captchaWebView: {
    height: 400,
    width: '100%',
    backgroundColor: theme.colors.neutral.background,
  },
  captchaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: responsivePadding(theme.spacing.md),
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  captchaRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  captchaRefreshText: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
    marginLeft: theme.spacing.xs,
  },
  captchaCancelButton: {
    padding: theme.spacing.sm,
  },
  captchaCancelText: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
  },
  captchaLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    zIndex: 10,
  },
  captchaLoadingText: {
    marginTop: theme.spacing.md,
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
  },
});
