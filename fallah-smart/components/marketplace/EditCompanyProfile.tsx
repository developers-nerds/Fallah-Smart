import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme/theme';
import {
  normalize,
  scaleSize,
  isSmallDevice,
  responsivePadding,
  responsiveHeight,
  responsiveWidth,
} from '../../utils/responsive';
import { storage } from '../../utils/storage';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

const EditCompanyProfile = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { supplier } = route.params;
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;

  const [formData, setFormData] = useState({
    company_name: supplier.company_name,
    about_us: supplier.about_us || '',
    company_address: supplier.company_address,
    company_website: supplier.company_website || '',
    open_time: supplier.open_time?.slice(0, 5) || '09:00',
    close_time: supplier.close_time?.slice(0, 5) || '17:00',
  });

  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);
  const [addressQuery, setAddressQuery] = useState(supplier.company_address || '');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Add address suggestion interface
  interface AddressSuggestion {
    display_name: string;
    lat: string;
    lon: string;
    [key: string]: any;
  }

  // Add debounced address search
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

  // Add address suggestion fetch function
  const fetchAddressSuggestions = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'FallahSmartApp/1.0',
          },
        }
      );

      if (!response.ok) {
        console.error('Address API error:', await response.text());
        return;
      }

      const data = await response.json();
      setAddressSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Add address selection handler
  const handleSelectSuggestion = (item: AddressSuggestion) => {
    setFormData({
      ...formData,
      company_address: item.display_name,
    });
    setAddressQuery(item.display_name);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const pickImage = async (type: 'logo' | 'banner') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        if (type === 'logo') {
          setLogo(result.assets[0].uri);
        } else {
          setBanner(result.assets[0].uri);
        }
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في اختيار الصورة');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate form data
      if (!formData.company_name || !formData.company_address) {
        Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      const { access } = await storage.getTokens();
      if (!access) {
        Alert.alert('خطأ', 'يرجى تسجيل الدخول مرة أخرى');
        return;
      }

      // Create form data
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Add images if selected
      if (logo) {
        const logoFile = {
          uri: logo,
          type: 'image/jpeg',
          name: 'company_logo.jpg',
        };
        formDataToSend.append('company_logo', logoFile);
      }

      if (banner) {
        const bannerFile = {
          uri: banner,
          type: 'image/jpeg',
          name: 'company_banner.jpg',
        };
        formDataToSend.append('company_banner', bannerFile);
      }

      // Send update request
      const response = await axios.patch(`${baseUrl}/suppliers/update`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${access}`,
        },
      });

      if (response.data.success) {
        Alert.alert('نجاح', 'تم تحديث معلومات الشركة بنجاح');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('خطأ', 'فشل في تحديث معلومات الشركة');
    } finally {
      setLoading(false);
    }
  };

  // Update the address input section in your render
  const renderAddressInput = () => (
    <View style={styles.inputGroup}>
      <View style={styles.labelContainer}>
        <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary.base} />
        <Text style={styles.label}>العنوان *</Text>
      </View>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={addressQuery}
          onChangeText={(text) => {
            setAddressQuery(text);
            setFormData({ ...formData, company_address: text });
          }}
          placeholder="أدخل عنوان شركتك"
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
        <View style={styles.suggestionsContainer}>
          <ScrollView style={styles.suggestionsScrollView} keyboardShouldPersistTaps="handled">
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
        </View>
      )}
    </View>
  );

  // Update the time inputs section
  const renderTimeInputs = () => (
    <View style={styles.timeContainer}>
      <View style={styles.timeInput}>
        <View style={styles.labelContainer}>
          <MaterialCommunityIcons name="clock-start" size={20} color={theme.colors.primary.base} />
          <Text style={styles.label}>وقت الفتح</Text>
        </View>
        <TouchableOpacity
          style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
          onPress={() => setShowOpenTimePicker(true)}>
          <Text style={styles.timeText}>{formData.open_time}</Text>
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
        <View style={styles.labelContainer}>
          <MaterialCommunityIcons name="clock-end" size={20} color={theme.colors.primary.base} />
          <Text style={styles.label}>وقت الإغلاق</Text>
        </View>
        <TouchableOpacity
          style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
          onPress={() => setShowCloseTimePicker(true)}>
          <Text style={styles.timeText}>{formData.close_time}</Text>
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
  );

  return (
    <View style={styles.mainContainer}>
      {/* Custom Status Bar */}
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary.dark} />

      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Banner and Logo Section */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.bannerContainer} onPress={() => pickImage('banner')}>
            <Image
              source={{
                uri:
                  banner ||
                  (supplier.company_banner.startsWith('http')
                    ? supplier.company_banner
                    : `${baseUrl}${supplier.company_banner}`),
              }}
              style={styles.bannerImage}
            />
            <View style={styles.bannerOverlay}>
              <View style={styles.bannerEditButton}>
                <MaterialCommunityIcons name="camera" size={20} color="white" />
                <Text style={styles.editText}>تغيير صورة الغلاف</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoWrapper} onPress={() => pickImage('logo')}>
            <View style={styles.logoContainer}>
              <Image
                source={{
                  uri:
                    logo ||
                    (supplier.company_logo.startsWith('http')
                      ? supplier.company_logo
                      : `${baseUrl}${supplier.company_logo}`),
                }}
                style={styles.logoImage}
              />
              <View style={styles.logoOverlay}>
                <MaterialCommunityIcons name="camera" size={20} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>معلومات الشركة</Text>

          {/* Company Name Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <MaterialCommunityIcons
                name="office-building"
                size={20}
                color={theme.colors.primary.base}
              />
              <Text style={styles.label}>اسم الشركة *</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.company_name}
              onChangeText={(text) => setFormData({ ...formData, company_name: text })}
              placeholder="اسم الشركة"
            />
          </View>

          {/* About Company Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={theme.colors.primary.base}
              />
              <Text style={styles.label}>عن الشركة</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.about_us}
              onChangeText={(text) => setFormData({ ...formData, about_us: text })}
              placeholder="اكتب نبذة عن شركتك"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Replace address input with new component */}
          {renderAddressInput()}

          {/* Website Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <MaterialCommunityIcons name="web" size={20} color={theme.colors.primary.base} />
              <Text style={styles.label}>الموقع الإلكتروني</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.company_website}
              onChangeText={(text) => setFormData({ ...formData, company_website: text })}
              placeholder="www.example.com"
              keyboardType="url"
            />
          </View>

          {/* Replace time inputs with new component */}
          {renderTimeInputs()}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save" size={20} color="white" />
              <Text style={styles.submitButtonText}>حفظ التغييرات</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary.base,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: normalize(18),
    fontFamily: theme.fonts.bold,
    color: 'white',
  },
  imageSection: {
    position: 'relative',
    marginBottom: responsivePadding(60),
  },
  bannerContainer: {
    width: '100%',
    height: responsiveHeight(25),
    backgroundColor: theme.colors.neutral.gray.light,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerEditButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.large,
    alignItems: 'center',
  },
  editText: {
    color: 'white',
    marginLeft: 8,
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
  },
  logoWrapper: {
    position: 'absolute',
    bottom: responsivePadding(-40),
    alignSelf: 'center',
  },
  logoContainer: {
    width: responsiveWidth(25),
    height: responsiveWidth(25),
    borderRadius: responsiveWidth(12.5),
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 3,
    borderColor: theme.colors.neutral.surface,
    ...theme.shadows.large,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: responsiveWidth(12.5),
  },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: responsiveWidth(12.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: theme.spacing.md,
  },
  formTitle: {
    fontSize: normalize(20),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginLeft: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    fontSize: normalize(16),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    textAlign: 'right',
    ...theme.shadows.small,
  },
  textArea: {
    height: responsiveHeight(15),
    textAlignVertical: 'top',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  timeInput: {
    flex: 1,
  },
  timeField: {
    textAlign: 'center',
  },
  bottomContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
    ...theme.shadows.medium,
  },
  submitButton: {
    backgroundColor: theme.colors.primary.base,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
    marginLeft: theme.spacing.sm,
  },
  suggestionsContainer: {
    marginTop: 5,
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.medium,
    maxHeight: 200,
    ...theme.shadows.medium,
  },
  suggestionsScrollView: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  lastSuggestionItem: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    marginRight: theme.spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: normalize(14),
    color: theme.colors.neutral.textPrimary,
  },
  clearButton: {
    padding: theme.spacing.sm,
  },
  timeText: {
    flex: 1,
    fontSize: normalize(16),
    color: theme.colors.neutral.textPrimary,
    textAlign: 'center',
  },
});

export default EditCompanyProfile;
