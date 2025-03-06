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
} from 'react-native';
import axios from 'axios';
import { storage } from '../../utils/storage';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type UserProfile = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  profilePicture?: string;
};

// Add gender options
const GENDER_OPTIONS = ['Male', 'Female'];
const API_URL = 'http://192.168.104.24:5000/api';

// Add this helper function at the top of the file
const getImageUrl = (imageUrl: string | undefined) => {
  if (!imageUrl) return null;
  
  // If it's already a full URL, return it
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Otherwise, construct the full URL
  // Note: imageUrl already includes '/uploads/'
  return `${API_URL}${imageUrl}`;
};

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

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const storedUser = await storage.getUser();
      if (storedUser) {
        setProfile(storedUser);
        console.log("Complete profile picture URL:", getImageUrl(storedUser.profilePicture));
      }

      const response = await axios.get(`${API_URL}/users/profile`);
      if (response?.data) {
        console.log("Complete server profile picture URL:", getImageUrl(response.data.profilePicture));
        setProfile(response.data);
        setEditedProfile(response.data);
        await storage.setUser(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profile');
      console.error('Profile fetch error:', error);
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

  // Update the profile update function
  const updateProfile = async () => {
    if (!editedProfile) return;
    
    try {
      setIsSubmitting(true);
      
      // Create FormData object
      const formData = new FormData();
      
      // Add profile fields
      formData.append('username', editedProfile.username || '');
      formData.append('firstName', editedProfile.firstName || '');
      formData.append('lastName', editedProfile.lastName || '');
      formData.append('gender', editedProfile.gender || '');
      formData.append('phoneNumber', editedProfile.phoneNumber || '');
      
      // Handle image upload if there's a selected image
      if (selectedImage) {
        const fileExtension = selectedImage.uri.split('.').pop() || 'jpg';
        const fileName = `profile-${Date.now()}.${fileExtension}`;
        
        formData.append('profileImage', {
          uri: Platform.OS === 'android' ? selectedImage.uri : selectedImage.uri.replace('file://', ''),
          type: `image/${fileExtension}`,
          name: fileName,
        } as any);

        console.log('Uploading image:', {
          uri: selectedImage.uri,
          type: `image/${fileExtension}`,
          name: fileName
        });
      }
      
      // Make the API request with proper headers
      const response = await axios.put(
        `${API_URL}/users/profile`,
        formData,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          transformRequest: (data, headers) => {
            return formData; // Return FormData directly
          },
        }
      );
      
      // Handle successful response
      if (response.data) {
        console.log('Profile update response:', response.data);
        setProfile(response.data);
        setEditedProfile(response.data);
        await storage.setUser(response.data);
        setIsEditing(false);
        setSelectedImage(null); // Clear selected image after successful upload
        Alert.alert('Success', 'Profile updated successfully!');
      }
      
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response) {
        Alert.alert(
          'Update Failed',
          error.response.data?.message || 'Server error occurred'
        );
      } else if (error.request) {
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
        Alert.alert(
          'Error',
          'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
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
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with pattern background */}
        <View style={styles.header}>
          <View style={styles.patternBackground} />
          
          {/* Profile avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {profile?.profilePicture ? (
                <Image 
                  source={{ 
                    uri: getImageUrl(profile.profilePicture)
                  }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                  <FontAwesome name="user" size={60} color="#cccccc" />
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Profile sections */}
        <View style={styles.content}>
          {/* General Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>General</Text>
            
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Username</Text>
              <Text style={styles.fieldValue}>
                {profile?.username || 'Not set'}
              </Text>
            </View>
            
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <Text style={styles.fieldValue}>
                {(profile?.firstName || '') + ' ' + (profile?.lastName || '')}
              </Text>
            </View>
            
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>
                {profile?.email || 'Not provided'}
              </Text>
            </View>
          </View>
          
          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Contact Information</Text>
            
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <Text style={styles.fieldValue}>
                {profile?.phoneNumber || 'Not provided'}
              </Text>
            </View>
            
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <Text style={styles.fieldValue}>
                {profile?.gender || 'Not specified'}
              </Text>
            </View>
          </View>
          
          {/* Edit button - visible only when needed */}
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <MaterialCommunityIcons 
              name="pencil" 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        {/* Edit Modal */}
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
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    setEditedProfile(profile);
                    setIsEditing(false);
                  }}
                >
                  <MaterialCommunityIcons name="close" size={24} color={theme.colors.neutral.textSecondary || '#999'} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.username || ''}
                    onChangeText={(text) => setEditedProfile(prev => prev ? {...prev, username: text} : null)}
                    placeholder="Enter username"
                    placeholderTextColor={theme.colors.neutral.textSecondary || '#999'}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.firstName || ''}
                    onChangeText={(text) => setEditedProfile(prev => prev ? {...prev, firstName: text} : null)}
                    placeholder="Enter first name"
                    placeholderTextColor={theme.colors.neutral.textSecondary || '#999'}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.lastName || ''}
                    onChangeText={(text) => setEditedProfile(prev => prev ? {...prev, lastName: text} : null)}
                    placeholder="Enter last name"
                    placeholderTextColor={theme.colors.neutral.textSecondary || '#999'}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.phoneNumber || ''}
                    onChangeText={(text) => setEditedProfile(prev => prev ? {...prev, phoneNumber: text} : null)}
                    keyboardType="phone-pad"
                    placeholder="Enter phone number"
                    placeholderTextColor={theme.colors.neutral.textSecondary || '#999'}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Gender</Text>
                  <View style={styles.genderContainer}>
                    {GENDER_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.genderOption,
                          editedProfile?.gender === option && styles.genderOptionSelected
                        ]}
                        onPress={() => setEditedProfile(prev => prev ? {...prev, gender: option} : null)}
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            editedProfile?.gender === option && styles.genderOptionTextSelected
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Add this image upload section in the modal */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Profile Picture</Text>
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
                          source={{ 
                            uri: getImageUrl(profile.profilePicture)
                          }} 
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
                      <MaterialCommunityIcons name="image-plus" size={24} color={theme.colors.primary.base} />
                      <Text style={styles.selectImageText}>
                        {selectedImage ? 'Change Photo' : profile?.profilePicture ? 'Change Photo' : 'Add Photo'}
                      </Text>
                    </TouchableOpacity>
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
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={updateProfile}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
  profileImage: {
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
});

export default Profile;