import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Image,
  Platform,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { storage } from '../../utils/storage';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type UserProfile = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  profilePicture?: string;
  role: string;
};

// Add gender options
const GENDER_OPTIONS = ['Male', 'Female'];

// Add image picker function
const pickImage = async () => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload an image.');
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image');
    return null;
  }
};

// Update your API URL to be more consistent
// Change this:
const API_URL = process.env.EXPO_PUBLIC_API_URL || `${process.env.EXPO_PUBLIC_API}/api`;

const Profile = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [localProfileImage, setLocalProfileImage] = useState(null);
  const [updateProgress, setUpdateProgress] = useState('');

  useEffect(() => {
    fetchProfile();
    // Debug API URL configuration
    console.log('API URL Configuration:');
    console.log('EXPO_PUBLIC_API:', process.env.EXPO_PUBLIC_API);
    console.log('EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
    console.log('Constructed API URL:', `${process.env.EXPO_PUBLIC_API}/api`);
  }, []);

  const fetchProfile = async () => {
    try {
      const storedUser = await storage.getUser();
      if (storedUser) {
        setProfile(storedUser);
        console.log("Using stored user profile picture:", storedUser.profilePicture);
      }

      // Log the exact URL you're calling
      const profileUrl = `${API_URL}/users/profile`;
      console.log('Fetching profile from:', profileUrl);

      const response = await axios.get(profileUrl);
      if (response?.data) {
        console.log("Server response profile picture:", response.data.profilePicture);
        setProfile(response.data);
        setEditedProfile(response.data);
        await storage.setUser(response.data);
        if (response.data.profilePicture) {
          const fullImageUrl = getFullImageUrl(response.data.profilePicture);
          console.log('Profile picture URL:', {
            original: response.data.profilePicture,
            full: fullImageUrl
          });
        }
      }
    } catch (error) {
      // Improved error logging
      console.error('Profile fetch error:', error);
      
      if (error.response) {
        console.error('Server responded with error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response received. Network issue. Request details:', error.request);
      } else {
        console.error('Error creating request:', error.message);
      }
      
      Alert.alert('Connection Error', 
        'Could not reach the server. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add function to handle image selection
  const handleSelectImage = async () => {
    const image = await pickImage();
    if (image) {
      setSelectedImage(image);
    }
  };

  // Update the profile update function to properly handle authorization and file upload
  const updateProfile = async () => {
    if (!editedProfile) return;
    
    try {
      setIsSubmitting(true);
      console.log('Starting profile update...');
      
      // Get the auth token using the correct property name
      const tokens = await storage.getTokens();
      console.log('Retrieved tokens:', tokens);
      
      // Fix the token access - it should match the structure in Login.tsx
      if (!tokens || !tokens.access) {
        console.error('Missing access token in storage');
        Alert.alert('Authentication Error', 'Please log in again');
        setIsSubmitting(false);
        return;
      }
      
      const accessToken = tokens.access;
      console.log('Using access token:', accessToken);
      
      // Create FormData object for file upload
      const formData = new FormData();
      
      // Add profile fields - make sure to include username
      formData.append('firstName', editedProfile.firstName || '');
      formData.append('lastName', editedProfile.lastName || '');
      formData.append('email', editedProfile.email || '');
      formData.append('phoneNumber', editedProfile.phoneNumber || '');
      formData.append('gender', editedProfile.gender || '');
      formData.append('username', editedProfile.username || '');  // Add username
      
      console.log('Sending profile update with data:', {
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        email: editedProfile.email,
        phoneNumber: editedProfile.phoneNumber,
        gender: editedProfile.gender,
        username: editedProfile.username
      });
      
      // Handle image upload if there's a selected image
      if (selectedImage) {
        console.log('Adding image to form data:', selectedImage);
        const fileExtension = selectedImage.uri.split('.').pop() || 'jpg';
        const fileName = `profile_${Date.now()}.${fileExtension}`;
        const mimeType = fileExtension.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
        
        // Make sure to use 'profilePicture' as the field name to match the backend
        formData.append('profilePicture', {
          uri: Platform.OS === 'android' ? selectedImage.uri : selectedImage.uri.replace('file://', ''),
          name: fileName,
          type: mimeType
        } as any);
      }
      
      // Log the request details for debugging
      console.log(`Sending to: ${API_URL}/users/profile`);
      
      // Fix the Authorization header to match what your server expects
      const response = await axios({
        method: 'PUT',
        url: `${API_URL}/users/profile`,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: 30000 // 30 second timeout
      });
      
      console.log('Profile update response:', response.status, response.data);
      
      if (response.data) {
        // Update local storage and state
        setProfile(response.data);
        setEditedProfile(response.data);
        await storage.setUser(response.data);
        setIsEditing(false);
        setSelectedImage(null); // Clear selected image after successful upload
        Alert.alert('Success', 'Profile updated successfully!');
      }
      
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error.response) {
        console.error('Server error details:', {
          status: error.response.status,
          data: error.response.data
        });
        
        Alert.alert(
          'Update Failed',
          error.response.data?.message || `Server error: ${error.response.status}`
        );
      } else if (error.request) {
        console.error('Network error: No response received');
        
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection.',
          [
            { text: 'OK' },
            {
              text: 'Retry',
              onPress: () => updateProfile()
            }
          ]
        );
      } else {
        console.error('General error:', error.message);
        Alert.alert(
          'Error',
          'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fix the getFullImageUrl function to properly handle different URL formats
  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    // Already a complete URL (starts with http/https)
    if (imageUrl.startsWith('http')) return imageUrl;
    
    // Handle relative paths from the server
    // Make sure we don't add double slashes
    const baseUrl = process.env.EXPO_PUBLIC_API.endsWith('/')
      ? process.env.EXPO_PUBLIC_API.slice(0, -1)
      : process.env.EXPO_PUBLIC_API;
      
    const imagePath = imageUrl.startsWith('/')
      ? imageUrl
      : `/${imageUrl}`;
      
    return `${baseUrl}${imagePath}`;
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  // Enhanced direct photo update function
  const handleDirectPhotoUpdate = async () => {
    try {
      // Pick an image first
      const image = await pickImage();
      if (!image) return;
      
      // Set a local state to show preview immediately
      const localUri = { uri: image.uri };
      setLocalProfileImage(localUri);
      
      // Ask for confirmation with preview
      Alert.alert(
        "Update Profile Picture",
        "Do you want to update your profile picture?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setLocalProfileImage(null)
          },
          {
            text: "Update",
            onPress: async () => {
              try {
                // Show loading indicator
                setIsSubmitting(true);
                setUpdateProgress('Preparing image...');
                
                // Get tokens for authorization
                const tokens = await storage.getTokens();
                if (!tokens || !tokens.access) {
                  throw new Error('Authentication required');
                }
                
                // Create FormData only for the profile image
                const formData = new FormData();
                
                // Prepare image for upload with proper mime type detection
                const fileUri = image.uri;
                const fileExtension = (fileUri.split('.').pop() || 'jpg').toLowerCase();
                const mimeType = fileExtension === 'png' ? 'image/png' : 
                                 fileExtension === 'gif' ? 'image/gif' : 
                                 'image/jpeg';
                
                // Generate a unique filename with timestamp
                const fileName = `profile_${Date.now()}.${fileExtension}`;
                
                // Safe URI processing for different platforms
                const processedUri = Platform.OS === 'android' 
                  ? fileUri 
                  : fileUri.replace('file://', '');
                
                setUpdateProgress('Uploading image...');
                
                // Append the file to form data with proper type annotation
                formData.append('profilePicture', {
                  uri: processedUri,
                  name: fileName,
                  type: mimeType
                } as any);
                
                // Use axios with timeout and cancel token
                const cancelTokenSource = axios.CancelToken.source();
                const timeoutId = setTimeout(() => {
                  cancelTokenSource.cancel('Upload took too long');
                }, 30000);
                
                // Send only the image update
                const response = await axios({
                  method: 'PUT',
                  url: `${API_URL}/users/profile`,
                  data: formData,
                  headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${tokens.access}`
                  },
                  timeout: 30000,
                  cancelToken: cancelTokenSource.token,
                  onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                      (progressEvent.loaded * 100) / (progressEvent.total || 1)
                    );
                    setUpdateProgress(`Uploading: ${percentCompleted}%`);
                  }
                });
                
                clearTimeout(timeoutId);
                
                if (response.data) {
                  setUpdateProgress('Processing...');
                  
                  // Update local state and storage
                  setProfile(response.data);
                  setEditedProfile(response.data);
                  await storage.setUser(response.data);
                  
                  // Clear temporary image
                  setLocalProfileImage(null);
                  
                  // Show success message
                  Alert.alert(
                    'Success', 
                    'Your profile picture has been updated!',
                    [{ text: 'OK' }]
                  );
                }
              } catch (error) {
                handlePhotoUploadError(error);
              } finally {
                setIsSubmitting(false);
                setUpdateProgress('');
              }
            }
          }
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error in direct photo update:', error);
      Alert.alert('Error', 'Could not update profile picture. Please try again later.');
    }
  };

  // Add specialized error handler
  const handlePhotoUploadError = (error) => {
    console.error('Photo update error:', error);
    
    if (axios.isCancel(error)) {
      Alert.alert('Upload Cancelled', 'The upload was cancelled or timed out. Please try again.');
      return;
    }
    
    if (error.response) {
      // Server responded with an error status
      const status = error.response.status;
      const message = error.response.data?.message || 'Unknown server error';
      
      if (status === 413) {
        Alert.alert('File Too Large', 'The image file is too large. Please choose a smaller image.');
      } else if (status === 401 || status === 403) {
        Alert.alert('Authentication Error', 'Please log in again to update your profile picture.');
      } else {
        Alert.alert('Server Error', `Could not update profile picture (${status}): ${message}`);
      }
    } else if (error.request) {
      // Request made but no response received
      Alert.alert(
        'Network Error',
        'Could not connect to the server. Please check your internet connection.',
        [
          { text: 'OK' },
          { 
            text: 'Try Again',
            onPress: () => handleDirectPhotoUpdate()
          }
        ]
      );
    } else {
      // Error setting up the request
      const message = error.message || 'An unexpected error occurred';
      Alert.alert('Error', `Could not update profile picture: ${message}`);
    }
  };

  // Add function to navigate to notification settings
  const navigateToNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Add RefreshControl to ScrollView */}
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
          />
        }
      >
        {/* Enhanced header with clearer visual indication */}
        <View style={styles.header}>
          <View style={styles.patternBackground}>
            {/* Optional: Add a subtle pattern or gradient here */}
          </View>
          
          {/* Profile avatar with clearer edit button */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              style={styles.avatarTouchable}
              onPress={handleDirectPhotoUpdate}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <View style={styles.avatar}>
                {localProfileImage ? (
                  <Image 
                    source={localProfileImage} 
                    style={styles.avatar}
                    onError={() => console.log('Error loading local profile image')}
                  />
                ) : profile?.profilePicture ? (
                  <Image 
                    source={{ 
                      uri: getFullImageUrl(profile.profilePicture),
                      // Add cache control to prevent stale images
                      cache: 'reload'
                    }} 
                    style={styles.avatar}
                    onError={(e) => {
                      console.log('Error loading profile image:', e.nativeEvent.error);
                      // Could set a fallback image here
                    }}
                  />
                ) : (
                  <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <Text style={styles.avatarText}>
                      {profile?.firstName && profile?.lastName
                        ? `${profile.firstName[0]}${profile.lastName[0]}`
                        : profile?.username?.[0] || '?'}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Verification badge for advisors */}
              {profile?.role === 'ADVISOR' && (
                <View style={styles.verificationBadge}>
                  <MaterialIcons name="verified" size={24} color={theme.colors.primary.base} />
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Add upload progress indicator */}
          {isSubmitting && (
            <View style={styles.uploadProgressContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary.base} />
              <Text style={styles.uploadProgressText}>{updateProgress}</Text>
            </View>
          )}
          
          {/* Add user's name directly below avatar for better context */}
          <Text style={styles.profileName}>
            {profile?.firstName && profile?.lastName 
              ? `${profile.firstName} ${profile.lastName}` 
              : profile?.username || 'ملفك الشخصي'}
          </Text>
        </View>
        
        {/* Enhanced content sections */}
        <View style={styles.content}>
          {/* Personal Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>المعلومات الشخصية</Text>
              <MaterialCommunityIcons name="account" size={20} color={theme.colors.primary.base} />
            </View>
            
            {/* Display profile fields with icons for visual cues */}
            <View style={styles.profileField}>
              <View style={styles.fieldRow}>
                <MaterialCommunityIcons name="account-circle" size={18} color="#555" style={styles.fieldIcon} />
                <Text style={styles.fieldLabel}>اسم المستخدم</Text>
              </View>
              <Text style={styles.fieldValue}>
                {profile?.username || <Text style={styles.fieldValueLight}>غير محدد</Text>}
              </Text>
            </View>
            
            {/* Add similar styling for other fields */}
            <View style={styles.profileField}>
              <View style={styles.fieldRow}>
                <MaterialCommunityIcons name="card-account-details" size={18} color="#555" style={styles.fieldIcon} />
                <Text style={styles.fieldLabel}>الاسم الكامل</Text>
              </View>
              <Text style={styles.fieldValue}>
                {profile?.firstName && profile?.lastName 
                  ? `${profile.firstName} ${profile.lastName}` 
                  : <Text style={styles.fieldValueLight}>غير محدد</Text>}
              </Text>
            </View>
            
            <View style={styles.profileField}>
              <View style={styles.fieldRow}>
                <MaterialCommunityIcons name="gender-male-female" size={18} color="#555" style={styles.fieldIcon} />
                <Text style={styles.fieldLabel}>الجنس</Text>
              </View>
              <Text style={styles.fieldValue}>
                {profile?.gender || <Text style={styles.fieldValueLight}>غير محدد</Text>}
              </Text>
            </View>
          </View>
          
          {/* Contact Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>معلومات الاتصال</Text>
              <MaterialCommunityIcons name="contacts" size={20} color={theme.colors.primary.base} />
            </View>
            
            <View style={styles.profileField}>
              <View style={styles.fieldRow}>
                <MaterialCommunityIcons name="email" size={18} color="#555" style={styles.fieldIcon} />
                <Text style={styles.fieldLabel}>البريد الإلكتروني</Text>
              </View>
              <Text style={styles.fieldValue}>
                {profile?.email || <Text style={styles.fieldValueLight}>غير محدد</Text>}
              </Text>
            </View>
            
            <View style={styles.profileField}>
              <View style={styles.fieldRow}>
                <MaterialCommunityIcons name="phone" size={18} color="#555" style={styles.fieldIcon} />
                <Text style={styles.fieldLabel}>رقم الهاتف</Text>
              </View>
              <Text style={styles.fieldValue}>
                {profile?.phoneNumber || <Text style={styles.fieldValueLight}>غير محدد</Text>}
              </Text>
            </View>
          </View>
          
          {/* Edit Profile Button - make it more prominent */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setEditedProfile(profile);
              setIsEditing(true);
            }}
          >
            <MaterialCommunityIcons name="account-edit" size={20} color="#FFFFFF" />
            <Text style={styles.editButtonText}>تعديل الملف الشخصي</Text>
          </TouchableOpacity>
        </View>
        
        {/* Add this somewhere appropriate in the UI, for example: */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
            الإعدادات
          </Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.colors.neutral.surface }]} 
            onPress={navigateToNotificationSettings}
          >
            <View style={styles.settingItemContent}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.primary.base} />
              <Text style={[styles.settingItemText, { color: theme.colors.neutral.textPrimary }]}>
                إعدادات الإشعارات
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.neutral.textSecondary} />
          </TouchableOpacity>
          
          {/* Other settings items */}
        </View>
      </ScrollView>
      
      {/* Enhanced Edit Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setEditedProfile(profile);
          setIsEditing(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تعديل الملف الشخصي</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setEditedProfile(profile);
                  setIsEditing(false);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.neutral.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Profile image section at the top for better visibility */}
              <View style={styles.modalImageSection}>
                <View style={styles.imageUploadContainer}>
                  {selectedImage ? (
                    <View style={styles.selectedImageContainer}>
                      <Image 
                        source={{ uri: selectedImage.uri }} 
                        style={styles.selectedImage} 
                      />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => setSelectedImage(null)}
                      >
                        <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : profile?.profilePicture ? (
                    <View style={styles.selectedImageContainer}>
                      <Image 
                        source={{ uri: getFullImageUrl(profile.profilePicture) }} 
                        style={styles.selectedImage} 
                      />
                    </View>
                  ) : (
                    <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                      <FontAwesome name="user" size={60} color="#cccccc" />
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.selectImageButton}
                    onPress={handleSelectImage}
                  >
                    <MaterialCommunityIcons name="camera" size={18} color={theme.colors.primary.base} />
                    <Text style={styles.selectImageText}>
                      {selectedImage || profile?.profilePicture ? 'تغيير الصورة' : 'إضافة صورة'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Form fields with better visual structure and icons */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>معلومات الحساب</Text>
                
                <View style={styles.inputContainer}>
                  <View style={styles.inputLabelRow}>
                    <MaterialCommunityIcons name="account" size={16} color={theme.colors.neutral.textSecondary} />
                    <Text style={styles.inputLabel}>اسم المستخدم</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.username || ''}
                    onChangeText={(text) => 
                      setEditedProfile(prev => ({ ...prev, username: text }))
                    }
                    placeholder="أدخل اسم المستخدم"
                    placeholderTextColor={theme.colors.neutral.textSecondary}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <View style={styles.inputLabelRow}>
                    <MaterialCommunityIcons name="badge-account" size={16} color={theme.colors.neutral.textSecondary} />
                    <Text style={styles.inputLabel}>الاسم الأول</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.firstName || ''}
                    onChangeText={(text) => 
                      setEditedProfile(prev => ({ ...prev, firstName: text }))
                    }
                    placeholder="أدخل الاسم الأول"
                    placeholderTextColor={theme.colors.neutral.textSecondary}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <View style={styles.inputLabelRow}>
                    <MaterialCommunityIcons name="badge-account" size={16} color={theme.colors.neutral.textSecondary} />
                    <Text style={styles.inputLabel}>اسم العائلة</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.lastName || ''}
                    onChangeText={(text) => 
                      setEditedProfile(prev => ({ ...prev, lastName: text }))
                    }
                    placeholder="أدخل اسم العائلة"
                    placeholderTextColor={theme.colors.neutral.textSecondary}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <View style={styles.inputLabelRow}>
                    <MaterialCommunityIcons name="gender-male-female" size={16} color={theme.colors.neutral.textSecondary} />
                    <Text style={styles.inputLabel}>الجنس</Text>
                  </View>
                  <View style={styles.genderContainer}>
                    {GENDER_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.genderOption,
                          editedProfile?.gender === option && styles.genderOptionSelected,
                        ]}
                        onPress={() => 
                          setEditedProfile(prev => ({ ...prev, gender: option }))
                        }
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            editedProfile?.gender === option && styles.genderOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>معلومات الاتصال</Text>
                
                <View style={styles.inputContainer}>
                  <View style={styles.inputLabelRow}>
                    <MaterialCommunityIcons name="email" size={16} color={theme.colors.neutral.textSecondary} />
                    <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.email || ''}
                    onChangeText={(text) => 
                      setEditedProfile(prev => ({ ...prev, email: text }))
                    }
                    placeholder="أدخل البريد الإلكتروني"
                    placeholderTextColor={theme.colors.neutral.textSecondary}
                    keyboardType="email-address"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <View style={styles.inputLabelRow}>
                    <MaterialCommunityIcons name="phone" size={16} color={theme.colors.neutral.textSecondary} />
                    <Text style={styles.inputLabel}>رقم الهاتف</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.phoneNumber || ''}
                    onChangeText={(text) => 
                      setEditedProfile(prev => ({ ...prev, phoneNumber: text }))
                    }
                    placeholder="أدخل رقم الهاتف"
                    placeholderTextColor={theme.colors.neutral.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditedProfile(profile);
                  setIsEditing(false);
                }}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.saveButton,
                  isSubmitting && styles.saveButtonDisabled
                ]}
                onPress={updateProfile}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Loading overlay */}
      {loading && !profile && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    height: 180,
    position: 'relative',
    alignItems: 'center',
  },
  patternBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.neutral.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.base,
    marginBottom: 16,
  },
  profileField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  fieldValueLight: {
    fontSize: 16,
    color: '#999999',
    fontStyle: 'italic',
  },
  signOutText: {
    color: '#FF3B30',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.base,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    marginVertical: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.neutral.surface,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 24,
    paddingTop: 20,
    maxHeight: '85%',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  modalScroll: {
    maxHeight: '70%',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  cancelButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.neutral.background,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary.base,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  cancelButtonText: {
    color: theme.colors.neutral.textPrimary,
  },
  saveButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: 16,
    fontFamily: theme.fonts.medium,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    backgroundColor: '#FAFAFA',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  genderOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  genderOptionSelected: {
    backgroundColor: theme.colors.primary.base,
    borderColor: theme.colors.primary.base,
  },
  genderOptionText: {
    color: theme.colors.neutral.textPrimary,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  },
  genderOptionTextSelected: {
    color: theme.colors.neutral.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  selectedImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  selectImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  selectImageText: {
    marginLeft: 8,
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.medium,
  },
  profileImagePlaceholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary.base,
    overflow: 'hidden',
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 20,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldIcon: {
    marginRight: 8,
  },
  quickEditAvatar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary.base,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.primary.base,
    fontSize: 16,
    fontFamily: theme.fonts.medium,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
    marginBottom: 12,
  },
  modalImageSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  emailEditNote: {
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.primary.disabled,
  },
  avatarTouchable: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  uploadProgressContainer: {
    marginTop: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  uploadProgressText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.medium,
  },
  verificationBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: theme.colors.neutral.surface,
  },
  placeholderAvatar: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
  },
  settingsSection: {
    marginTop: 24,
    marginBottom: 16,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'right',
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Profile;