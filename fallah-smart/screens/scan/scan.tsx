import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker'; // Added for image picking
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios'; // Import axios for API calls
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { storage } from '../../utils/storage'; // Import the storage utility

// Define the API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL; // Replace with your actual backend IP/domain

const ScanScreen = () => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [flash, setFlash] = useState<'on' | 'off' | 'auto'>('off');
  const [zoom, setZoom] = useState(0);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const cameraRef = useRef<any>(null);
  const navigation = useNavigation();

  // Animation refs (unchanged)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.8)).current;
  const imageSlideAnim = useRef(new Animated.Value(100)).current;
  const responseSlideAnim = useRef(new Animated.Value(100)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
  // Existing effects (unchanged)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (photo) {
      Animated.parallel([
        Animated.spring(imageScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(imageSlideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
    if (aiResponse) {
      Animated.timing(responseSlideAnim, {
        toValue: 0,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [photo, aiResponse]);

  useEffect(() => {
    if (loading) {
      const dotAnimation = (dot: Animated.Value) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          ])
        );

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );

      const color = Animated.loop(
        Animated.timing(colorAnim, { toValue: 1, duration: 2000, useNativeDriver: false })
      );

      Animated.parallel([
        dotAnimation(dot1Anim),
        Animated.delay(200).start(() => dotAnimation(dot2Anim).start()),
        Animated.delay(400).start(() => dotAnimation(dot3Anim).start()),
        pulse,
        color,
      ]).start();
    } else {
      [dot1Anim, dot2Anim, dot3Anim].forEach((dot) => dot.setValue(0));
      pulseAnim.setValue(1);
      colorAnim.setValue(0);
    }
  }, [loading]);

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // New function to pick image from gallery
  const pickImage = async () => {
    animateButtonPress();

    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need gallery access to upload images. Please allow permission in settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
      setAiResponse(null);
      imageScaleAnim.setValue(0.8);
      imageSlideAnim.setValue(100);
      responseSlideAnim.setValue(100);
    }
  };

  const handlePermissionRequest = async () => {
    animateButtonPress();
    Alert.alert(
      'Camera Access Required',
      'We need camera permission to scan items. Would you like to grant access?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Allow', onPress: requestPermission },
      ]
    );
  };

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <Animated.View
        style={[
          styles.permissionContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
        <Animated.View style={{ transform: [{ scale: imageScaleAnim }] }}>
          <Ionicons name="camera-outline" size={80} color={theme.colors.neutral.gray.medium} />
        </Animated.View>
        <Text style={styles.permissionTitle}>Camera Permission Needed</Text>
        <Text style={styles.permissionText}>Please allow camera access to scan your items</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={handlePermissionRequest}>
          <Animated.Text
            style={[styles.permissionButtonText, { transform: [{ scale: buttonScaleAnim }] }]}>
            Grant Permission
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const toggleCameraFacing = () => {
    animateButtonPress();
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    animateButtonPress();
    setFlash((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    animateButtonPress();
    setZoom((current) => {
      const newZoom = direction === 'in' ? Math.min(current + 0.1, 1) : Math.max(current - 0.1, 0);
      return newZoom;
    });
  };

  const takePicture = async () => {
    if (cameraRef.current && !isButtonDisabled) {
      setIsButtonDisabled(true);
      animateButtonPress();
      const photoData = await cameraRef.current.takePictureAsync();
      setPhoto(photoData.uri);
      setAiResponse(null);
      imageScaleAnim.setValue(0.8);
      imageSlideAnim.setValue(100);
      responseSlideAnim.setValue(100);
      setTimeout(() => setIsButtonDisabled(false), 1000);
    }
  };

  const scanPhoto = async () => {
    if (photo) {
      animateButtonPress();
      setLoading(true);
      try {
        const base64Image = await FileSystem.readAsStringAsync(photo, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: "Whenever I upload an image, focus only on identifying any plant or crop present. If there's a plant or crop, tell me its name first. Then, check if it's healthy or sick. If it's sick, explain what's wrong (like disease, pests, or nutrient issues), why it got that way (e.g., environmental factors, care mistakes, or natural causes), and how to fix it with a clear, step-by-step plan—include specific actions like watering, pruning, or treatments, and mention any tools or products needed. Also, say how to prevent it from happening again. If the plant is healthy, give me details about its condition—like why it's thriving, what it needs to stay that way, and any tips to keep it growing strong. Always keep your response practical, detailed, and friendly, like a gardener talking to a friend, without sounding stiff or artificial. If there's no plant or crop in the image, just say, 'I don't see any plants or crops here,' and leave it at that.",
                },
                { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
              ],
            },
          ],
        };

        const response = await fetch(
          `${API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          }
        );

        const result = await response.json();
        const aiText = result.candidates[0].content.parts[0].text;
        setAiResponse(aiText);

        // After getting AI response, save to backend
        await saveToBackend(base64Image, aiText);
      } catch (error) {
        console.error('Error sending image to AI:', error);
        setAiResponse('Oops, something went wrong while analyzing the image.');
      } finally {
        setLoading(false);
      }
    }
  };

  // New function to save scan to backend
  const saveToBackend = async (base64Image: string, aiResponse: string, retryCount = 0) => {
    try {
      // Get the token from storage utility instead of directly from AsyncStorage
      const { accessToken } = await storage.getTokens();
      if (!accessToken) {
        console.log('No authentication token found, user may need to login');
        return;
      }

      // Create form data
      const formData = new FormData();

      // Create a file object from the base64 string
      // This approach avoids using fetch API which might not work properly in React Native
      const imageFile = {
        uri: photo, // Use the original photo URI which is already a file path
        type: 'image/jpeg',
        name: 'plant_scan.jpg',
      };

      // Append image and AI response to form data
      formData.append('image', imageFile as any);
      formData.append('ai_response', aiResponse);

      // Send to backend with timeout and proper error handling
      const apiResponse = await axios.post(`${API_BASE_URL}/scans`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 30000, // Changed from 2 to 30000 (30 seconds) for a reasonable timeout
      });
    } catch (error: any) {
      console.error('Error saving scan to backend:', error.message);

      // Implement retry logic for network errors (up to 2 retries)
      const MAX_RETRIES = 2;
      if (
        retryCount < MAX_RETRIES &&
        (error.message.includes('Network Error') ||
          error.code === 'ECONNABORTED' ||
          !error.response)
      ) {
        console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        // Wait for a short delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Retry the request
        return saveToBackend(base64Image, aiResponse, retryCount + 1);
      }

      let errorMessage =
        'Could not save your scan. Please check your internet connection and try again.';

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Response data:', error.response.data);
        console.log('Response status:', error.response.status);

        if (error.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.log('Request failed:', error.request);

        if (error.code === 'ECONNABORTED') {
          errorMessage = 'The request timed out. Please try again.';
        } else if (error.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your internet connection.';
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error details:', error);
      }

      // Show error alert to user
      Alert.alert('Upload Failed', errorMessage, [{ text: 'OK' }]);
    }
  };

  const retakePicture = () => {
    animateButtonPress();
    setPhoto(null);
    setAiResponse(null);
    imageScaleAnim.setValue(0.8);
    imageSlideAnim.setValue(100);
    responseSlideAnim.setValue(100);
  };

  const interpolatedColor = colorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      theme.colors.primary.base,
      theme.colors.secondary.base,
      theme.colors.primary.base,
    ],
  });

  return (
    <View style={styles.container}>
      {!photo ? (
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} flash={flash} zoom={zoom}>
          <View style={styles.overlay}>
            <Animated.View
              style={[
                styles.topBar,
                {
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 300],
                        outputRange: [-100, 0],
                      }),
                    },
                  ],
                },
              ]}>
              <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <Ionicons
                    name={flash === 'on' ? 'flash' : flash === 'auto' ? 'flash' : 'flash-off'}
                    size={28}
                    color={theme.colors.neutral.surface}
                  />
                </Animated.View>
              </TouchableOpacity>
              <View style={styles.zoomControls}>
                <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom('out')}>
                  <Ionicons
                    name="remove-circle-outline"
                    size={28}
                    color={theme.colors.neutral.surface}
                  />
                </TouchableOpacity>
                <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
                <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom('in')}>
                  <Ionicons
                    name="add-circle-outline"
                    size={28}
                    color={theme.colors.neutral.surface}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.navBar,
                {
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 300],
                        outputRange: [0, 150],
                      }),
                    },
                  ],
                },
              ]}>
              <TouchableOpacity style={styles.navButton} onPress={pickImage}>
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <Ionicons name="image-outline" size={32} color={theme.colors.neutral.surface} />
                </Animated.View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.captureButton, isButtonDisabled && styles.disabledButton]}
                onPress={takePicture}
                disabled={isButtonDisabled}>
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <Ionicons
                    name="camera-outline"
                    size={44}
                    color={
                      isButtonDisabled
                        ? theme.colors.neutral.gray.light
                        : theme.colors.neutral.surface
                    }
                  />
                </Animated.View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={toggleCameraFacing}>
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <Ionicons
                    name="camera-reverse-outline"
                    size={32}
                    color={theme.colors.neutral.surface}
                  />
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </CameraView>
      ) : (
        <View style={styles.previewContainer}>
          <Animated.View
            style={[
              styles.imageContainer,
              {
                transform: [{ scale: imageScaleAnim }, { translateY: imageSlideAnim }],
              },
            ]}>
            <Image source={{ uri: photo }} style={styles.previewImage} />
          </Animated.View>

          {loading ? (
            <Animated.View
              style={[
                styles.loadingContainerAnimated,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: responseSlideAnim }, { scale: pulseAnim }],
                },
              ]}>
              <Ionicons name="hourglass-outline" size={20} color={theme.colors.primary.base} />
              <Text style={styles.loadingText}>Analyzing your scan</Text>
              <View style={styles.dotContainer}>
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      transform: [
                        {
                          translateY: dot1Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -8],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      transform: [
                        {
                          translateY: dot2Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -8],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      transform: [
                        {
                          translateY: dot3Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -8],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </Animated.View>
          ) : aiResponse ? (
            <Animated.View
              style={[
                styles.responseContainer,
                { transform: [{ translateY: responseSlideAnim }] },
              ]}>
              <Text style={styles.responseTitle}>Scan Result</Text>
              <ScrollView style={styles.responseScroll}>
                <Text style={styles.responseText}>{aiResponse}</Text>
              </ScrollView>
            </Animated.View>
          ) : (
            <Animated.Text
              style={[styles.noResponseText, { transform: [{ translateY: responseSlideAnim }] }]}>
              Press "Scan" to analyze your image
            </Animated.Text>
          )}

          <Animated.View
            style={[
              styles.actionButtons,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 300],
                      outputRange: [0, 100],
                    }),
                  },
                ],
              },
            ]}>
            <TouchableOpacity
              style={[styles.actionButton, loading && styles.disabledButton]}
              onPress={scanPhoto}
              disabled={loading}>
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <Ionicons
                  name="scan-outline"
                  size={28}
                  color={loading ? theme.colors.neutral.gray.light : theme.colors.primary.base}
                />
                <Text style={styles.actionText}>Scan</Text>
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={retakePicture}>
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <Ionicons name="camera-outline" size={28} color={theme.colors.neutral.gray.dark} />
                <Text style={styles.actionText}>Retake</Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.neutral.background,
  },
  permissionTitle: {
    fontSize: theme.fontSizes.title + 2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  permissionText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.large,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  permissionButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  },
  camera: {
    flex: 1,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.xs,
  },
  zoomButton: {
    padding: theme.spacing.sm,
  },
  zoomText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    marginHorizontal: theme.spacing.sm,
  },
  iconButton: {
    padding: theme.spacing.sm,
  },
  navBar: {
    position: 'absolute',
    bottom: 40,
    right: '-4%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: theme.spacing.sm,
    borderRadius: 50,
    marginHorizontal: theme.spacing.md,
    elevation: 6,
  },
  navButton: {
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    marginHorizontal: theme.spacing.sm,
  },
  captureButton: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: 50,
    padding: theme.spacing.md + 2,
    marginHorizontal: theme.spacing.lg,
    borderWidth: 4,
    borderColor: theme.colors.neutral.surface,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
    paddingTop: theme.spacing.md,
  },
  imageContainer: {
    width: '85%',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.large,
    borderWidth: 2,
    borderColor: theme.colors.primary.base,
    marginBottom: theme.spacing.sm,
  },
  loadingContainerAnimated: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.medium,
    elevation: 4,
    marginVertical: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fontSizes.body - 2,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  dotContainer: {
    flexDirection: 'row',
    marginLeft: theme.spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.base,
    marginHorizontal: 2,
  },
  responseContainer: {
    width: '85%',
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.large,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginVertical: theme.spacing.sm,
    flex: 1,
  },
  responseTitle: {
    fontSize: theme.fontSizes.title - 2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginBottom: theme.spacing.xs,
  },
  responseScroll: {
    flex: 1,
  },
  responseText: {
    fontSize: theme.fontSizes.body - 2,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    lineHeight: 20,
  },
  noResponseText: {
    fontSize: theme.fontSizes.body - 2,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginVertical: theme.spacing.sm,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '85%',
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.large,
    elevation: 6,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginTop: theme.spacing.xs,
  },
});

export default ScanScreen;
