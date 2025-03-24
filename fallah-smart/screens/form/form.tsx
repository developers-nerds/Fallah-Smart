import React, { useState, useRef, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
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

export const SupplierRegistrationForm: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    about_us: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    company_logo: null,
    company_banner: null,
    open_time: '09:00',
    close_time: '17:00',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, arrowPosition: 'bottom' });
  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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

      // Validate required fields
      if (
        !formData.company_name ||
        !formData.about_us ||
        !formData.company_address ||
        !formData.company_phone ||
        !formData.company_email
      ) {
        setError('Please fill in all required fields');
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

      // Update supplier status immediately without requiring manual refresh
      try {
        // This will fetch the user profile and update the supplier status in the app state
        await fetch(`${BaseUrl}/users/profile`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('Successfully refreshed user profile after supplier registration');
      } catch (refreshError) {
        console.error('Error refreshing profile after supplier registration:', refreshError);
        // Continue with navigation even if refresh fails
      }

      // Show success message
      Alert.alert('Success', 'Your supplier account has been created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            console.log('Navigating to marketplace after successful registration');
            navigation.navigate('Marketplace', { skipRefreshPrompt: true }); // Add param to skip refresh prompt
          },
        },
      ]);
    } catch (err) {
      console.error('Submission error:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred while creating your account'
      );
    } finally {
      setLoading(false);
    }
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
      <View style={styles.inputWrapper}>
        {options.icon && (
          <TouchableOpacity
            onPress={(e) => showTooltip(tooltips[field], e)}
            style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={options.icon as any}
              size={24}
              color={theme.colors.primary.base}
              style={styles.inputIcon}
            />
          </TouchableOpacity>
        )}
        <TextInput
          style={[
            styles.input,
            options.multiline && styles.textArea,
            { textAlignVertical: options.multiline ? 'top' : 'center' },
          ]}
          value={formData[field] as string}
          onChangeText={(text) => setFormData({ ...formData, [field]: text })}
          placeholder={placeholder}
          multiline={options.multiline}
          numberOfLines={options.multiline ? 4 : 1}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize="none"
          placeholderTextColor={theme.colors.neutral.gray.base}
        />
      </View>
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

      {renderInput('About Us', 'about_us', 'Tell us about your company', {
        multiline: true,
        required: true,
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

      {renderInput('Company Address', 'company_address', 'Enter your company address', {
        required: true,
        icon: 'map-marker',
      })}

      {renderInput('Phone Number', 'company_phone', 'Enter your phone number', {
        keyboardType: 'phone-pad',
        required: true,
        icon: 'phone',
      })}

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
            onPress={() => setShowCloseTimePicker(true)}>
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

  const renderCurrentStep = () => {
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      {/* Tooltip Modal */}
      <Modal transparent visible={tooltipVisible} animationType="fade" onRequestClose={hideTooltip}>
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

          {error && <Text style={styles.errorText}>{error}</Text>}

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
});
