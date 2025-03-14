import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Image
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { storage } from '../../utils/storage';
import { LinearGradient } from 'expo-linear-gradient';

const AdvisorApplicationScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const [formData, setFormData] = useState({
    specialization: '',
    experience: '',
    education: '',
    certifications: '',
    applicationNote: '',
  });
  
  const [documents, setDocuments] = useState([]);
  const [certificationPhotos, setCertificationPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const API_URL = process.env.EXPO_PUBLIC_API;

  useEffect(() => {
    checkApplicationStatus();
  }, []);

  const checkApplicationStatus = async () => {
    setLoading(true);
    try {
      const tokens = await storage.getTokens();
      if (!tokens || !tokens.access) {
        setLoading(false);
        return;
      }

      // Try to fetch the application status
      const response = await axios.get(
        `${API_URL}/api/users/advisor-application-status`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        }
      );

      console.log('Application status response:', response.data);
      
      if (response.data && response.data.status) {
        setApplicationStatus(response.data.status);
      }
    } catch (error) {
      // 404 means no application found, which is fine
      // 500 might mean the endpoint is not implemented yet
      console.log('Error checking application status:', error);
      
      // Don't set error state - just continue to show the application form
      // This allows the user to submit an application even if status check fails
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const selectedDoc = result.assets[0];
        console.log('Document picked:', selectedDoc);
        
        // Add to documents list
        setDocuments([...documents, {
          uri: selectedDoc.uri,
          name: selectedDoc.name,
          type: selectedDoc.mimeType
        }]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'There was an error selecting your document. Please try again.');
    }
  };
  
  const removeDocument = (index) => {
    const newDocs = [...documents];
    newDocs.splice(index, 1);
    setDocuments(newDocs);
  };

  const pickCertificationPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedPhoto = result.assets[0];
        console.log('Photo picked:', selectedPhoto);
        
        // Create a photo object with necessary metadata
        const certPhoto = {
          uri: selectedPhoto.uri,
          name: `certification_${Date.now()}.jpg`,
          type: 'image/jpeg',
        };
        
        // Add to certification photos list
        setCertificationPhotos([...certificationPhotos, certPhoto]);
      }
    } catch (error) {
      console.error('Error picking certification photo:', error);
      Alert.alert('Error', 'There was an error selecting your photo. Please try again.');
    }
  };

  const takeCertificationPhoto = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        
        // Create a photo object with necessary metadata
        const certPhoto = {
          uri: photo.uri,
          name: `certification_${Date.now()}.jpg`,
          type: 'image/jpeg',
        };
        
        // Add to certification photos list
        setCertificationPhotos([...certificationPhotos, certPhoto]);
      }
    } catch (error) {
      console.error('Error taking certification photo:', error);
      Alert.alert('Error', 'There was an error capturing your photo. Please try again.');
    }
  };

  const removeCertificationPhoto = (index) => {
    const newPhotos = [...certificationPhotos];
    newPhotos.splice(index, 1);
    setCertificationPhotos(newPhotos);
  };

  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      return true;
    } else if (currentStep === 2) {
      if (!formData.specialization.trim()) {
        Alert.alert('Required Field', 'Please enter your specialization.');
        return false;
      }
      if (!formData.experience.trim()) {
        Alert.alert('Required Field', 'Please enter your experience.');
        return false;
      }
      if (!formData.education.trim()) {
        Alert.alert('Required Field', 'Please enter your education.');
        return false;
      }
      return true;
    } else if (currentStep === 3) {
      if (!formData.certifications.trim()) {
        Alert.alert('Required Field', 'Please enter your certifications.');
        return false;
      }
      if (documents.length === 0) {
        Alert.alert('Required Documents', 'Please upload at least one supporting document.');
        return false;
      }
      return true;
    }
    return true;
  };

  const submitApplication = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setLoading(true);

    try {
      const tokens = await storage.getTokens();
      if (!tokens || !tokens.access) {
        Alert.alert('Authentication Error', 'Please log in to submit an application.');
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.append('specialization', formData.specialization);
      form.append('experience', formData.experience);
      form.append('education', formData.education);
      form.append('certifications', formData.certifications);
      form.append('applicationNote', formData.applicationNote);

      // Add certification photos to form data
      certificationPhotos.forEach((photo, index) => {
        form.append('certificationPhotos', {
          uri: Platform.OS === 'android' ? photo.uri : photo.uri.replace('file://', ''),
          type: photo.type,
          name: photo.name
        });
      });

      // Add supporting documents
      documents.forEach((doc, index) => {
        const uriParts = doc.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const fileName = doc.name || `document_${index}.${fileType}`;
        
        form.append('documents', {
          uri: Platform.OS === 'android' ? doc.uri : doc.uri.replace('file://', ''),
          type: doc.type || `application/${fileType === 'pdf' ? 'pdf' : 'octet-stream'}`,
          name: fileName
        } as any);
      });

      const response = await axios.post(
        `${API_URL}/api/users/apply-advisor`,
        form,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000
        }
      );

      console.log('Application submitted:', response.data);
      
      Alert.alert(
        'Application Submitted',
        'Your application to become an agricultural advisor has been submitted successfully. We will review your application and get back to you soon.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
      
      setApplicationStatus('APPROVED');
      
    } catch (error) {
      console.error('Error submitting application:', error);
      
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
        
        if (error.response.data?.error?.includes("relation") && 
            error.response.data?.error?.includes("does not exist")) {
          
          Alert.alert(
            'Service Unavailable', 
            'The advisor application service is temporarily unavailable. Please try again later.', 
            [
              { text: 'OK' }
            ]
          );
        } else {
          Alert.alert(
            'Submission Failed', 
            error.response.data?.message || `Server error (${error.response.status}). Please try again later.`
          );
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        Alert.alert(
          'Network Error',
          'Could not connect to the server. Please check your internet connection.'
        );
      } else {
        Alert.alert(
          'Application Error',
          'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !applicationStatus) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={styles.loadingText}>Checking application status...</Text>
      </View>
    );
  }

  if (applicationStatus) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.statusCard}>
          <MaterialIcons 
            name={applicationStatus === 'APPROVED' ? 'verified' : 'pending'} 
            size={60} 
            color={applicationStatus === 'APPROVED' ? theme.colors.success : theme.colors.warning} 
          />
          
          <Text style={styles.statusTitle}>
            {applicationStatus === 'APPROVED' ? 'You are now an Advisor!' : 
             applicationStatus === 'REJECTED' ? 'Application Rejected' :
             'Application Pending'}
          </Text>
          
          <Text style={styles.statusDescription}>
            {applicationStatus === 'APPROVED' ? 
              'Congratulations! You are now a verified advisor. You can help other farmers with your expertise and knowledge.' : 
             applicationStatus === 'REJECTED' ? 
              'Unfortunately, your application was not approved. You may reapply after 30 days.' :
              'Your application is currently under review. We will notify you once a decision has been made.'}
          </Text>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Return to Blogs</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backArrow}
              onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.neutral.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Become an Advisor</Text>
          </View>
          
          <View style={styles.headerRight}></View>
        </View>
        
        <View style={styles.progressContainer}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View 
              key={index}
              style={[
                styles.progressDot,
                currentStep >= index + 1 ? styles.progressDotActive : {}
              ]}
            />
          ))}
        </View>
        
        <View style={styles.stepContainer}>
          {currentStep === 1 && (
            <>
              <Text style={styles.stepTitle}>Become an Agricultural Advisor</Text>
              
              <View style={styles.introIllustration}>
                <LinearGradient
                  colors={['#E6F2FF', '#C2E0FF']}
                  style={styles.illustrationBackground}
                >
                  <View style={styles.illustrationContent}>
                    <MaterialIcons name="agriculture" size={60} color={theme.colors.primary.base} />
                    <Text style={styles.illustrationText}>Become an Advisor</Text>
                    <View style={styles.illustrationIconsRow}>
                      <View style={[styles.illustrationIcon, {backgroundColor: '#E3F2FD'}]}>
                        <MaterialIcons name="verified-user" size={24} color="#1976D2" />
                      </View>
                      <View style={[styles.illustrationIcon, {backgroundColor: '#E8F5E9'}]}>
                        <MaterialIcons name="eco" size={24} color="#43A047" />
                      </View>
                      <View style={[styles.illustrationIcon, {backgroundColor: '#FFF8E1'}]}>
                        <MaterialIcons name="lightbulb" size={24} color="#FFB300" />
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
              
              <Text style={styles.introText}>
                Join our network of agricultural experts and help farmers across the country improve their yield and sustainability.
              </Text>
              
              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>As an Advisor, you'll be able to:</Text>
                
                <View style={styles.benefitItem}>
                  <MaterialIcons name="check-circle" size={24} color={theme.colors.primary.base} />
                  <Text style={styles.benefitText}>Provide expert advice to farmers</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <MaterialIcons name="check-circle" size={24} color={theme.colors.primary.base} />
                  <Text style={styles.benefitText}>Earn additional income through consultations</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <MaterialIcons name="check-circle" size={24} color={theme.colors.primary.base} />
                  <Text style={styles.benefitText}>Build your professional profile and reputation</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <MaterialIcons name="check-circle" size={24} color={theme.colors.primary.base} />
                  <Text style={styles.benefitText}>Access specialized tools and resources</Text>
                </View>
              </View>
            </>
          )}
          
          {currentStep === 2 && (
            <>
              <Text style={styles.stepTitle}>Professional Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Specialization*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.specialization}
                  onChangeText={(text) => handleInputChange('specialization', text)}
                  placeholder="e.g. Crop Management, Soil Science, etc."
                  placeholderTextColor={theme.colors.neutral.textSecondary}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Years of Experience*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.experience}
                  onChangeText={(text) => handleInputChange('experience', text)}
                  placeholder="e.g. 5 years in organic farming"
                  placeholderTextColor={theme.colors.neutral.textSecondary}
                  keyboardType="default"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Education*</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={formData.education}
                  onChangeText={(text) => handleInputChange('education', text)}
                  placeholder="Describe your educational background"
                  placeholderTextColor={theme.colors.neutral.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </>
          )}
          
          {currentStep === 3 && (
            <>
              <Text style={styles.stepTitle}>Certifications & Documents</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Certifications</Text>
                <Text style={styles.inputHelper}>
                  List any relevant certifications you have earned
                </Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Enter your certifications"
                  multiline
                  value={formData.certifications}
                  onChangeText={(text) => handleInputChange('certifications', text)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Certification Photos</Text>
                <Text style={styles.inputHelper}>
                  Add photos of your certificates or licenses
                </Text>

                <View style={styles.photoButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.photoButton, styles.galleryButton]}
                    onPress={pickCertificationPhoto}
                  >
                    <MaterialIcons name="photo-library" size={22} color={theme.colors.primary.base} />
                    <Text style={styles.photoButtonText}>Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.photoButton, styles.cameraButton]}
                    onPress={takeCertificationPhoto}
                  >
                    <MaterialIcons name="camera-alt" size={22} color={theme.colors.primary.base} />
                    <Text style={styles.photoButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>

                {certificationPhotos.length > 0 && (
                  <View style={styles.photosGrid}>
                    {certificationPhotos.map((photo, index) => (
                      <View key={index} style={styles.photoContainer}>
                        <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                        <TouchableOpacity
                          style={styles.removePhotoButton}
                          onPress={() => removeCertificationPhoto(index)}
                        >
                          <MaterialIcons name="cancel" size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Application Note</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={formData.applicationNote}
                  onChangeText={(text) => handleInputChange('applicationNote', text)}
                  placeholder="Any additional information you want to share"
                  placeholderTextColor={theme.colors.neutral.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.documentsContainer}>
                <Text style={styles.inputLabel}>Supporting Documents*</Text>
                <Text style={styles.inputHelper}>
                  Upload copies of your certificates, diplomas, or other relevant documents
                </Text>
                
                <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                  <Ionicons name="document-attach" size={24} color={theme.colors.primary.base} />
                  <Text style={styles.uploadButtonText}>Add Document</Text>
                </TouchableOpacity>
                
                {documents.length > 0 && (
                  <View style={styles.documentsList}>
                    {documents.map((doc, index) => (
                      <View key={index} style={styles.documentItem}>
                        <View style={styles.documentInfo}>
                          <Ionicons name="document-text" size={24} color={theme.colors.primary.base} />
                          <Text style={styles.documentName} numberOfLines={1} ellipsizeMode="middle">
                            {doc.name || `Document ${index + 1}`}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => removeDocument(index)}>
                          <MaterialIcons name="close" size={24} color={theme.colors.error.base} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
        
        <View style={styles.navigationButtons}>
          {currentStep > 1 ? (
            <TouchableOpacity 
              style={styles.backStepButton} 
              onPress={goToPreviousStep}
            >
              <MaterialIcons name="arrow-back" size={20} color={theme.colors.primary.base} />
              <Text style={styles.backStepButtonText}>Back</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 100 }} />}
          
          {currentStep < totalSteps ? (
            <TouchableOpacity 
              style={styles.nextStepButton} 
              onPress={goToNextStep}
            >
              <Text style={styles.nextStepButtonText}>Next</Text>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
              onPress={submitApplication}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit Application</Text>
                  <MaterialIcons name="send" size={20} color="white" style={styles.submitIcon} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.surface,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  backArrow: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.neutral.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.colors.neutral.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.neutral.gray.light,
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary.base,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.neutral.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  introIllustration: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  illustrationBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  illustrationText: {
    fontSize: 22,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.dark,
    marginTop: 12,
    marginBottom: 16,
  },
  illustrationIconsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  illustrationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  introText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  benefitsContainer: {
    backgroundColor: theme.colors.neutral.gray.lighter,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 8,
  },
  inputHelper: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  documentsContainer: {
    marginTop: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
    marginLeft: 8,
  },
  documentsList: {
    marginTop: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.neutral.gray.lighter,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
  },
  backStepButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
    marginLeft: 8,
  },
  nextStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.base,
    padding: 12,
    borderRadius: 8,
  },
  nextStepButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: 'white',
    marginRight: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.base,
    padding: 12,
    borderRadius: 8,
    minWidth: 180,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.neutral.gray.base,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: 'white',
  },
  submitIcon: {
    marginLeft: 8,
  },
  statusCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    ...theme.shadows.medium,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.neutral.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 16,
    color: theme.colors.neutral.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    width: '100%',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.surface,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    width: '48%',
  },
  galleryButton: {
    borderColor: theme.colors.primary.base,
  },
  cameraButton: {
    borderColor: theme.colors.primary.base,
  },
  photoButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
    marginLeft: 8,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  photoContainer: {
    width: '31%',
    aspectRatio: 1,
    marginBottom: 12,
    marginRight: '3.5%',
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.error.base,
    borderRadius: 12,
    padding: 2,
  },
});

export default AdvisorApplicationScreen; 