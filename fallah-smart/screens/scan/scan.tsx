import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, EventArg } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { theme } from '../../theme/theme';
import { Animated } from 'react-native';
import { storage } from '../../utils/storage';
import axios from 'axios';
import { Alert } from 'react-native';

// Components
import PermissionScreen from './components/PermissionScreen';
import CameraScreen from './components/CameraScreen';
import PhotoPreviewScreen from './components/PhotoPreviewScreen';
import { LoadingIndicator } from './components/LoadingIndicator';
import ImagePickerService from './components/ImagePickerService';

// Constants
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

type RootDrawerParamList = {
  HomeContent: { shouldRefresh?: boolean; refreshScanHistory?: boolean } | undefined;
  Scan: undefined;
  // ... other routes
};

type ScanScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Scan'>;

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
  const navigation = useNavigation<ScanScreenNavigationProp>();

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

        // Update scan history without navigation
        const parentNav = navigation.getParent();
        if (parentNav) {
          parentNav.setParams({ refreshScanHistory: true });
        }
      } catch (error) {
        // Replace console.error with setting error message in state
        setAiResponse('عذرًا، حدث خطأ أثناء تحليل الصورة.');
      } finally {
        setLoading(false);
      }
    }
  };

  const sendImageToAI = async (base64Image: string) => {
    // Detect MIME type from the photo URI
    let mimeType = 'image/jpeg'; // Default MIME type
    if (photo) {
      const extension = photo.split('.').pop()?.toLowerCase();
      if (extension) {
        // Map common image extensions to MIME types
        const mimeTypes: Record<string, string> = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
          heic: 'image/heic',
          heif: 'image/heif',
          bmp: 'image/bmp',
          tiff: 'image/tiff',
          tif: 'image/tiff',
        };
        mimeType = mimeTypes[extension] || mimeType;
      }
    }

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text:
                "Whenever I upload an image, focus ONLY on identifying any plant,fake plant, crop,fake crop 'crop can be fruits,Vegetables,Cereals/Grains,Legumes,Oilseeds,Fodder Crops,Fiber Crops,Root and Tuber Crops,Sugar Crops,Spice and Herb CropsMedicinal Crops,Ornamental Crops,Nut Crops', or bug present or anything related to farming or agriculture. Ignore everything else in the image unless it directly affects the plant, crop, or bug. Always respond in Arabic and strictly follow the Styling Protocols for Responses outlined below. Here's how to respond:\n\n" +
                "1. **Identification**: If there's a plant, crop, or bug, start by naming it under the '## What's Growing? ##' section (e.g., \"## What's Growing? ## هذا نبات طماطس!\" or \"## What's Growing? ## يبدو أنها خنفساء الدعسوقة!\"). If there's nothing to identify, write ONLY \"## What's Growing? ## لا أرى أي نباتات أو محاصيل أو حشرات هنا\" and stop—no extra text.\n\n" +
                '2. **Health or Role Check**: \n' +
                "   - For plants/crops: Assess if it's healthy or sick under `++ Health Report ++`.\n" +
                "   - For bugs: State if it's a pest (harmful) or beneficial (helpful) under `|| Bug Control ||`, and name the affected plant if obvious.\n\n" +
                '3. **Plants/Crops Details**: \n' +
                '   - **Healthy**: Under `>> Plant Care Plan <<`, say it\'s healthy and explain why (e.g., "إنه مزدهر بسبب الشمس الجيدة وغياب الآفات"). Add practical tips to maintain it (e.g., "استمر في الري بانتظام، أضف سمادًا بعد شهر"). Suggest tools if needed (e.g., "استخدم رذاذة ناعمة"). \n' +
                '   - **Sick**: Under `>> Plant Care Plan <<`, name the disease or issue accurately at the start (e.g., "++ Health Report ++ هذا العفن البودرة" or "الأوراق الصفراء تعني نقص النيتروجين"). Explain the cause (e.g., "الرطوبة الزائدة تسببت في العفن"). Provide a numbered step-by-step fix (e.g., "1. اقطع الأوراق الصفراء بمقص نظيف. 2. رش زيت النيم أسبوعيًا"). Suggest tools (e.g., "استخدم مقص تقليم"). \n\n' +
                '4. **Bugs Details**: \n' +
                '   - **Pest**: Under `|| Bug Control ||`, explain the harm (e.g., "المن يمتص النسغ ويضعف الأوراق"). Suggest a fix (e.g., "اغسلها بالماء أو استخدم صابون حشري"). \n' +
                '   - **Beneficial**: Under `|| Bug Control ||`, explain the benefit (e.g., "الدعسوقة تأكل المن—حامية النباتات!"). Suggest attracting more (e.g., "ازرع الشبت لجذب المزيد"). \n\n' +
                '5. **Mistakes Section**: Under `-- Mistakes to Skip --`, ALWAYS include 1-2 common mistakes (e.g., "لا تفرط في الري—سيؤدي ذلك لتعفن الجذور" or "لا تستخدم كيماويات قاسية قرب الدعسوقة"). If no mistakes apply, write "لا توجد أخطاء شائعة هنا". \n\n' +
                '6. **Prevention Tips**: Under `~~ Keep It Thriving ~~`, ALWAYS add 1-2 tips to maintain or prevent issues (e.g., "اترك مسافات بين النباتات للتهوية"). If nothing applies, write "استمر في ما تفعله—كل شيء رائع!". \n\n' +
                '**Styling Protocols for Responses** \n' +
                "- **## What's Growing? ##**: Start EVERY response with this exact title (with spaces) to name the plant, crop, or bug. \n" +
                '- **++ Health Report ++**: Use this (with spaces) for plant/crop health status. Italicize key issues with underscores (e.g., _العفن البودرة_). \n' +
                '- **>> Plant Care Plan <<**: Use this (with spaces) for plant/crop explanation and care steps. Italicize insights (e.g., _الرطوبة الزائدة_) and number steps (e.g., "1. اقطع الأوراق"). \n' +
                '- **|| Bug Control ||**: Use this (with spaces) for bug details. Italicize effects (e.g., _يضعف السيقان_). \n' +
                '- **-- Mistakes to Skip --**: Use this (with spaces) for mistakes. Keep it short. \n' +
                '- **~~ Keep It Thriving ~~**: Use this (with spaces) for prevention tips. \n' +
                '- **Rules**: \n' +
                '  - ALWAYS include ALL sections in order, even if empty (e.g., "لا توجد أخطاء شائعة هنا"). \n' +
                '  - Separate EACH section with a newline (`\\n`). \n' +
                "  - Use EXACTLY these markers with spaces as shown (e.g., `## What's Growing? ##`, not `##What's Growing?##`). \n" +
                '- End with a friendly closer like "أنت جاهز الآن، يا صديق!" or "ناديني إذا احتجت مساعدة!". \n\n' +
                '**Example Response (Follow This Exactly)**:',
            },
            { inline_data: { mime_type: mimeType, data: base64Image } },
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
      const tokens = await storage.getTokens();
      
      // Create request body
      const requestBody = {
        picture: base64Image,
        ai_response: aiResponse
      };
      
      // Check for authentication token
      if (!tokens || !tokens.access) {
        Alert.alert(
          'تسجيل الدخول مطلوب',
          'يرجى تسجيل الدخول لحفظ نتائج الفحص',
          [
            { text: 'حسنًا' }
          ]
        );
        setIsButtonDisabled(false);
        return;
      }
      
      // Make API request
      const response = await axios.post(`${API_BASE_URL}/scans/create`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access}`
        }
      });
      
      setIsButtonDisabled(false);
      
      // We're done, show the response
      setAiResponse(aiResponse);
      
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
    const MAX_RETRIES = 2;
    if (
      retryCount < MAX_RETRIES &&
      (error.message.includes('Network Error') || error.code === 'ECONNABORTED' || !error.response)
    ) {
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
