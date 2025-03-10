import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { Animated } from 'react-native';
import { storage } from '../../utils/storage';
import axios from 'axios';

// Components
import PermissionScreen from './components/PermissionScreen';
import CameraScreen from './components/CameraScreen';
import PhotoPreviewScreen from './components/PhotoPreviewScreen';
import { LoadingIndicator } from './components/LoadingIndicator';
import ImagePickerService from './components/ImagePickerService';

// Constants
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

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

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.8)).current;
  const imageSlideAnim = useRef(new Animated.Value(100)).current;
  const responseSlideAnim = useRef(new Animated.Value(100)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Loading animation refs
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  // Handle initial animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  // Handle photo and response animations
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

  // Handle loading animations
  useEffect(() => {
    if (loading) {
      runLoadingAnimations();
    } else {
      resetLoadingAnimations();
    }
  }, [loading]);

  const runLoadingAnimations = () => {
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
  };

  const resetLoadingAnimations = () => {
    [dot1Anim, dot2Anim, dot3Anim].forEach((dot) => dot.setValue(0));
    pulseAnim.setValue(1);
    colorAnim.setValue(0);
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const pickImage = async () => {
    animateButtonPress();
    const result = await ImagePickerService.pickImageFromGallery();
    if (result) {
      setPhoto(result);
      resetImageState();
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !isButtonDisabled) {
      setIsButtonDisabled(true);
      animateButtonPress();
      const photoData = await cameraRef.current.takePictureAsync();
      setPhoto(photoData.uri);
      resetImageState();
      setTimeout(() => setIsButtonDisabled(false), 1000);
    }
  };

  const resetImageState = () => {
    setAiResponse(null);
    imageScaleAnim.setValue(0.8);
    imageSlideAnim.setValue(100);
    responseSlideAnim.setValue(100);
  };

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

  const scanPhoto = async () => {
    if (photo) {
      animateButtonPress();
      setLoading(true);
      try {
        const base64Image = await FileSystem.readAsStringAsync(photo, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const aiText = await sendImageToAI(base64Image);
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

  const sendImageToAI = async (base64Image: string) => {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Whenever I upload an image, focus only on identifying any plant, crop, or bug present. Ignore everything else in the image unless it directly affects the plant, crop, or bug. Here’s how to respond:

1. If there’s a plant, crop, or bug, start by telling me its name (e.g., "That’s a tomato plant!" or "Looks like a ladybug!").  
   - If there’s nothing to identify, just say, “I don’t see any plants, crops, or bugs here,” and stop there—keep it short and sweet.

2. If it’s a plant or crop, check if it’s healthy or sick.  
   - If it’s a bug, say whether it’s a pest (harmful to plants) or beneficial (helps plants), and name the plant it’s tied to if obvious.

3. For plants or crops:  
   - If healthy: Tell me it’s healthy and explain why it’s doing well (e.g., "It’s thriving because it’s got great sunlight and no pests nibbling at it"). Add practical tips to keep it strong (e.g., "Keep watering it evenly, and maybe add some compost next month for a boost"). Mention any tools or products if needed (e.g., "A watering can with a fine spout works great").  
   - If sick: Say it’s sick and name allways say the name of Disease and its must be correct and accurate at the start of the problem (e.g., "It’s got powdery mildew" or "Those yellow leaves mean a nitrogen deficiency"). Explain what’s wrong—like disease, pests, or nutrient issues. Tell me why it happened (e.g., "Too much humidity caused the mildew" or "Overwatering drowned the roots"). Give a clear, step-by-step fix-it plan (e.g., "Step 1: Snip off the yellow leaves with clean scissors. Step 2: Mix 1 tablespoon of neem oil with a quart of water and spray it weekly"). Mention tools or products (e.g., "Grab some pruning shears and a spray bottle"). End with prevention tips (e.g., "Space plants out next time for better airflow").

4. For bugs:  
   - If it’s a pest, say how it harms plants (e.g., "Aphids suck sap and weaken leaves"). Suggest a fix (e.g., "Blast them off with a hose or use insecticidal soap").  
   - If it’s beneficial, explain why (e.g., "Ladybugs eat aphids—plant protectors!"). Suggest keeping them around (e.g., "Plant some dill nearby to attract more").

5. Add a quick “Mistakes to Avoid” section with 1-2 common slip-ups (e.g., "Don’t drown it with too much water—that’ll make root rot worse" or "Don’t use harsh chemicals near ladybugs—they’ll take off").

6. Keep it friendly and practical, like a gardener buddy chatting over the fence—none of that stiff, robotic stuff. Use examples or little nudges (e.g., "You’ve got this—just a little TLC and it’ll bounce back!").

**Styling Protocols for Responses**  
- **## What’s Growing? ##**: Start with this bold title to name the plant, crop, or bug—like "## What’s Growing? ## That’s a tomato plant!"  
- **++ Health Report ++**: Use this to kick off the health check—like "++ Health Report ++ This one’s sick with powdery mildew."  
- **>> Plant Care Plan <<**: For plants (healthy or sick), use this to frame the explanation and care steps—like ">> Plant Care Plan << Here’s why it’s sick and how to fix it." Italicize key insights—like _"Too much water’s the culprit"_. Number each step (e.g., "1. Snip the bad leaves").  
- **|| Bug Control ||**: For bugs (pest or beneficial), use this to detail what they do and how to handle them—like "|| Bug Control || Aphids are pests—here’s the fix." Italicize key effects—like _"They weaken stems fast"_.  
- **-- Mistakes to Skip --**: Tag the mistakes section with this—like "-- Mistakes to Skip -- Don’t overwater!" Keep it short and sharp.  
- **~~ Keep It Thriving ~~**: End with prevention or maintenance tips under this—like "~~ Keep It Thriving ~~ Space ‘em out next time."  
- Wrap up with a chill closer like "You’re set now, bud!" or "Holler if you need more help!"—no extra fluff, just friendly vibes.`,
            },
            { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
          ],
        },
      ],
    };

    const response = await fetch(`${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  };

  const saveToBackend = async (base64Image: string, aiResponse: string, retryCount = 0) => {
    try {
      const { accessToken } = await storage.getTokens();
      if (!accessToken) {
        console.log('No authentication token found, user may need to login');
        return;
      }

      const formData = new FormData();
      const imageFile = {
        uri: photo,
        type: 'image/jpeg',
        name: 'plant_scan.jpg',
      };

      formData.append('image', imageFile as any);
      formData.append('ai_response', aiResponse);

      await axios.post(`${API_BASE_URL}/scans`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 30000,
      });
    } catch (error: any) {
      handleSaveError(error, base64Image, aiResponse, retryCount);
    }
  };

  const handleSaveError = async (
    error: any,
    base64Image: string,
    aiResponse: string,
    retryCount: number
  ) => {
    console.error('Error saving scan to backend:', error.message);

    const MAX_RETRIES = 2;
    if (
      retryCount < MAX_RETRIES &&
      (error.message.includes('Network Error') || error.code === 'ECONNABORTED' || !error.response)
    ) {
      console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return saveToBackend(base64Image, aiResponse, retryCount + 1);
    }

    // Error handling already implemented in the component
  };

  const retakePicture = () => {
    animateButtonPress();
    setPhoto(null);
    setAiResponse(null);
    imageScaleAnim.setValue(0.8);
    imageSlideAnim.setValue(100);
    responseSlideAnim.setValue(100);
  };

  // Loading state
  if (!permission) {
    return <LoadingIndicator />;
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <PermissionScreen
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
        buttonScaleAnim={buttonScaleAnim}
        requestPermission={requestPermission}
        animateButtonPress={animateButtonPress}
      />
    );
  }

  return (
    <View style={styles.container}>
      {!photo ? (
        <CameraScreen
          cameraRef={cameraRef}
          facing={facing}
          flash={flash}
          zoom={zoom}
          isButtonDisabled={isButtonDisabled}
          slideAnim={slideAnim}
          buttonScaleAnim={buttonScaleAnim}
          toggleFlash={toggleFlash}
          handleZoom={handleZoom}
          takePicture={takePicture}
          toggleCameraFacing={toggleCameraFacing}
          pickImage={pickImage}
        />
      ) : (
        <PhotoPreviewScreen
          photo={photo}
          loading={loading}
          aiResponse={aiResponse}
          imageScaleAnim={imageScaleAnim}
          imageSlideAnim={imageSlideAnim}
          responseSlideAnim={responseSlideAnim}
          slideAnim={slideAnim}
          buttonScaleAnim={buttonScaleAnim}
          dot1Anim={dot1Anim}
          dot2Anim={dot2Anim}
          dot3Anim={dot3Anim}
          pulseAnim={pulseAnim}
          colorAnim={colorAnim}
          scanPhoto={scanPhoto}
          retakePicture={retakePicture}
        />
      )}
    </View>
  );
};

// Only keeping the main container style here
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
});

export default ScanScreen;
