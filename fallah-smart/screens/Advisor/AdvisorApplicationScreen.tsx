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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { storage } from '../../utils/storage';

const AdvisorApplicationScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    specialization: '',
    experience: '',
    education: '',
    certifications: '',
    applicationNotes: ''
  });
  
  const [documents, setDocuments] = useState([]);
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
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedDoc = result.assets[0];
        
        // Check file size (10MB limit)
        const fileSize = selectedDoc.size || 0;
        if (fileSize > 10 * 1024 * 1024) {
          Alert.alert("File too large", "Please select a file smaller than 10MB");
          return;
        }
        
        // Add to documents list
        setDocuments([...documents, {
          uri: selectedDoc.uri,
          name: selectedDoc.name,
          type: selectedDoc.mimeType
        }]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Could not select document. Please try again.');
    }
  };
  
  const removeDocument = (index) => {
    const newDocs = [...documents];
    newDocs.splice(index, 1);
    setDocuments(newDocs);
  };

  const submitApplication = async () => {
    // Validate form data
    if (!formData.specialization || !formData.experience || !formData.education) {
      Alert.alert(
        'Missing Information',
        'Please fill in all required fields (specialization, experience, and education).'
      );
      return;
    }

    if (documents.length === 0) {
      Alert.alert(
        'Documents Required',
        'Please upload at least one document to support your application.'
      );
      return;
    }

    setLoading(true);
    try {
      const tokens = await storage.getTokens();
      if (!tokens || !tokens.access) {
        Alert.alert('Authentication Error', 'Please log in to continue');
        setLoading(false);
        return;
      }

      // Create form data with all required fields
      const form = new FormData();
      
      // Add text fields
      form.append('specialization', formData.specialization);
      form.append('experience', formData.experience);
      form.append('education', formData.education);
      
      if (formData.certifications) {
        form.append('certifications', formData.certifications);
      }
      
      if (formData.applicationNotes) {
        form.append('applicationNotes', formData.applicationNotes);
      }

      // Add documents - with proper file handling for iOS and Android
      documents.forEach((doc, index) => {
        // Create a file name if none exists
        const uriParts = doc.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const fileName = doc.name || `document_${index}.${fileType}`;
        
        form.append('documents', {
          uri: Platform.OS === 'android' ? doc.uri : doc.uri.replace('file://', ''),
          type: doc.type || `application/${fileType === 'pdf' ? 'pdf' : 'octet-stream'}`,
          name: fileName
        } as any);
      });

      console.log('Submitting application to:', `${API_URL}/api/users/apply-advisor`);

      // Make the API call with proper headers
      const response = await axios.post(
        `${API_URL}/api/users/apply-advisor`,
        form,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000 // 30 second timeout for uploads
        }
      );

      console.log('Application submitted successfully:', response.data);
      
      Alert.alert(
        'Application Approved!',
        'Congratulations! You are now an advisor. You can start helping other users immediately.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      
      setApplicationStatus('APPROVED');
      
    } catch (error) {
      console.error('Error submitting application:', error);
      
      // Provide more detailed error information
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
        
        // Check if this is the specific database relation error
        if (error.response.data?.error?.includes("relation") && 
            error.response.data?.error?.includes("does not exist")) {
          
          Alert.alert(
            'Service Unavailable', 
            'The advisor application service is not fully set up on the server yet. Please try again later or contact support.',
            [
              { 
                text: 'OK', 
                onPress: () => navigation.goBack() 
              }
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
          'Error',
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

  // Show application status if exists
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
          <TouchableOpacity 
            style={styles.backArrow}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.neutral.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Become an Advisor</Text>
          <Text style={styles.description}>
            Share your agricultural expertise with the community as a verified advisor.
            Complete this form to get instant approval and start helping farmers today!
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Become an Advisor?</Text>
          <Text style={styles.sectionText}>
            As an advisor, you'll be able to provide expert guidance, answer community questions,
            and help fellow farmers with your specialized knowledge. Advisors receive a verification
            badge and have access to additional platform features.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Form</Text>
          <Text style={styles.sectionText}>
            Please complete the form below. Fields marked with an asterisk (*) are required.
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Specialization *</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Crop Management, Livestock, Organic Farming"
              value={formData.specialization}
              onChangeText={(text) => handleInputChange('specialization', text)}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Professional Experience *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your relevant work experience in agriculture"
              value={formData.experience}
              onChangeText={(text) => handleInputChange('experience', text)}
              multiline
              numberOfLines={4}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Education *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="List your relevant education, degrees, or training"
              value={formData.education}
              onChangeText={(text) => handleInputChange('education', text)}
              multiline
              numberOfLines={4}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Certifications (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="List any professional certifications you hold"
              value={formData.certifications}
              onChangeText={(text) => handleInputChange('certifications', text)}
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Additional Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional information you'd like to share"
              value={formData.applicationNotes}
              onChangeText={(text) => handleInputChange('applicationNotes', text)}
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Supporting Documents *</Text>
            <Text style={styles.helperText}>
              Upload certificates, degrees, or other documents supporting your expertise (PDF, DOC, Images).
              Max file size: 10MB per file. Up to 5 files.
            </Text>
            
            {documents.map((doc, index) => (
              <View key={index} style={styles.documentItem}>
                <View style={styles.documentInfo}>
                  <Ionicons name="document-text" size={24} color={theme.colors.primary.base} />
                  <Text style={styles.documentName} numberOfLines={1} ellipsizeMode="middle">
                    {doc.name || `Document ${index + 1}`}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeDocument(index)}>
                  <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            
            {documents.length < 5 && (
              <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary.base} />
                <Text style={styles.uploadButtonText}>Add Document</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.submitContainer}>
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={submitApplication}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit and Get Approved</Text>
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
  contentContainer: {
    padding: 16,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backArrow: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.neutral.textPrimary,
    marginLeft: 16,
  },
  description: {
    fontSize: 16,
    color: theme.colors.neutral.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 8,
    padding: 16,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.base,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: theme.colors.neutral.textPrimary,
    lineHeight: 20,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.neutral.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.neutral.background,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.neutral.background,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentName: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.neutral.textPrimary,
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.neutral.background,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary.base,
    borderRadius: 8,
    padding: 12,
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.primary.base,
  },
  submitContainer: {
    marginVertical: 24,
  },
  submitButton: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.neutral.surface,
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
});

export default AdvisorApplicationScreen; 