import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, ScrollView, Animated, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../../../theme/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import Chat from './Chat';
import QuestionAndAnswer from './QuestionAndAnswer';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserIdFromToken, saveVideoProgress } from '../utils/userProgress';

// API base URL
const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface VideoData {
  id: number;
  title: string;
  category: string;
  youtubeId: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
  Education_AdditionalVideos?: Array<{
    id: number;
    title: string;
    youtubeId: string;
    videoId: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface AdditionalVideo {
  id: number;
  title: string;
  youtubeId: string;
  videoId: number;
  createdAt: string;
  updatedAt: string;
}

const VideoLesson = () => {
  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [additionalVideos, setAdditionalVideos] = useState<AdditionalVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sidebarAnim = useRef(new Animated.Value(0)).current;
  
  const route = useRoute();
  const navigation = useNavigation();
  
  const params = route.params as { videoId: string; type: 'animal' | 'crop' };
  const requestedType = params.type;
  const requestedId = params.videoId;

  // Fetch video data from API
  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the numeric ID
        const numericId = parseInt(requestedId);
        
        if (isNaN(numericId)) {
          setError("Invalid video ID format");
          setLoading(false);
          return;
        }
        
        // Calculate the actual API ID based on type
        let apiVideoId = numericId;
        
        // If it's a crop video, map the ID:
        // Crop videos in the API start from ID 8, so we add 7 to the requested ID
        if (requestedType === 'crop') {
          if (numericId >= 1 && numericId <= 31) {
            apiVideoId = numericId + 7; // Map crop ID 1-31 to API ID 8-38
            console.log(`Mapping crop video ID ${numericId} to API ID ${apiVideoId}`);
          } else {
            setError(`رقم المعرف غير صالح. فيديوهات المحاصيل تكون من 1 إلى 31 فقط`);
            setLoading(false);
            return;
          }
        } else if (requestedType === 'animal') {
          // For animal videos, enforce the 1-7 range
          if (numericId < 1 || numericId > 7) {
            setError(`رقم المعرف غير صالح. فيديوهات الحيوانات تكون من 1 إلى 7 فقط`);
            setLoading(false);
            return;
          }
        }
        
        console.log(`Fetching ${requestedType} video with API ID: ${apiVideoId}`);
        
        // Fetch the video using the calculated API ID
        const videoResponse = await axios.get(`${API_URL}/education/videos/${apiVideoId}`);
        
        if (!videoResponse.data) {
          console.log(`No video found with ID ${apiVideoId}`);
          setError("عذراً، لم يتم العثور على الفيديو المطلوب");
          setLoading(false);
          return;
        }
        
        // Verify the video type matches the requested type
        if (videoResponse.data.type !== requestedType) {
          console.log(`Video type mismatch: requested ${requestedType}, got ${videoResponse.data.type}`);
          setError(`هذا الفيديو من نوع ${videoResponse.data.type === 'animal' ? 'حيواني' : 'زراعي'} وليس ${requestedType === 'animal' ? 'حيواني' : 'زراعي'}`);
          setLoading(false);
          return;
        }
        
        console.log(`Successfully loaded ${requestedType} video: ${videoResponse.data.title} (ID: ${videoResponse.data.id})`);
        
        // Set the video data
        setVideoData(videoResponse.data);
        if (videoResponse.data.youtubeId) {
          setSelectedVideoId(videoResponse.data.youtubeId);
          console.log(`Set YouTube ID: ${videoResponse.data.youtubeId}`);
        }
        
        // Handle additional videos
        if (videoResponse.data.Education_AdditionalVideos && 
            Array.isArray(videoResponse.data.Education_AdditionalVideos) && 
            videoResponse.data.Education_AdditionalVideos.length > 0) {
          
          setAdditionalVideos(videoResponse.data.Education_AdditionalVideos);
          console.log(`Loaded ${videoResponse.data.Education_AdditionalVideos.length} additional videos`);
          
        } else {
          // Try to fetch additional videos separately
          try {
            const additionalVideosResponse = await axios.get(`${API_URL}/education/additionalVideos/video/${apiVideoId}`);
            
            if (additionalVideosResponse.data && Array.isArray(additionalVideosResponse.data)) {
              setAdditionalVideos(additionalVideosResponse.data);
              console.log(`Loaded ${additionalVideosResponse.data.length} additional videos separately`);
            }
          } catch (additionalError) {
            console.error("Failed to fetch additional videos:", additionalError);
          }
        }
        
      } catch (err) {
        console.error("Error fetching video data:", err);
        setError("خطأ في تحميل بيانات الفيديو. يرجى التحقق من اتصالك والمحاولة مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [requestedId, requestedType]);

  // Mark video as watched when user spends more than 30 seconds on it
  useEffect(() => {
    if (!videoData) return;
    
    const timer = setTimeout(async () => {
      try {
        // Get user ID using the improved function
        const userId = await getUserIdFromToken();
        if (!userId) {
          console.log('User not authenticated, video progress will not be saved');
          return;
        }
        
        console.log(`Marking video ID ${videoData.id} as watched for user ${userId}`);
        
        // Save video progress using the utility function
        const saveSuccess = await saveVideoProgress(userId, videoData.id, true);
        
        if (saveSuccess) {
          console.log("Video marked as watched successfully");
        } else {
          console.error("Failed to mark video as watched");
        }
      } catch (err) {
        console.error("Error updating video progress:", err);
      }
    }, 30000); // 30 seconds
    
    return () => clearTimeout(timer);
  }, [videoData]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={styles.loadingText}>جاري تحميل الفيديو...</Text>
      </View>
    );
  }

  if (error || !videoData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}> هذا الفيديو غير متوفر حالياً</Text>
          <Text style={styles.errorSubText}>{error}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>العودة للدروس</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? 0 : 1;
    Animated.spring(sidebarAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 50
    }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{videoData.title}</Text>
          <Text style={styles.category}>{videoData.category} ({videoData.type === 'animal' ? 'حيواني' : 'زراعي'})</Text>
        </View>
        {additionalVideos.length > 0 && (
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <MaterialIcons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        <ScrollView style={styles.mainContent}>
          <View style={styles.videoWrapper}>
            {selectedVideoId ? (
              <WebView
                source={{
                  uri: `https://www.youtube.com/embed/${selectedVideoId}?playsinline=1&rel=0&showinfo=0&modestbranding=1`
                }}
                style={styles.video}
                allowsFullscreenVideo={true}
                javaScriptEnabled={true}
              />
            ) : (
              <View style={[styles.videoPlaceholder, styles.centered]}>
                <Text style={styles.placeholderText}>فيديو غير متوفر</Text>
              </View>
            )}
          </View>

          <View style={styles.questionSection}>
            <QuestionAndAnswer videoId={requestedId} />
          </View>
        </ScrollView>

        <Animated.View 
          style={[
            styles.sidebar,
            {
              transform: [{
                translateX: sidebarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>فيديوهات ذات صلة</Text>
            <TouchableOpacity onPress={toggleSidebar}>
              <Ionicons name="close" size={24} color={theme.colors.neutral.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <TouchableOpacity
              style={[
                styles.videoItem,
                selectedVideoId === videoData.youtubeId && styles.selectedVideoItem
              ]}
              onPress={() => setSelectedVideoId(videoData.youtubeId || undefined)}
            >
              <Text style={styles.videoItemText}>{videoData.title}</Text>
            </TouchableOpacity>
            {additionalVideos.map((video) => (
              <TouchableOpacity
                key={video.id}
                style={[
                  styles.videoItem,
                  selectedVideoId === video.youtubeId && styles.selectedVideoItem
                ]}
                onPress={() => setSelectedVideoId(video.youtubeId)}
              >
                <Text style={styles.videoItemText}>{video.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Help Button */}
      <TouchableOpacity 
        onPress={() => setIsChatVisible(!isChatVisible)} 
        style={[
          styles.helpButton,
          isChatVisible && styles.helpButtonActive
        ]}
      >
        <Text style={styles.helpButtonText}>مساعدة</Text>
      </TouchableOpacity>

      {/* Chat Overlay */}
      {isChatVisible && (
        <>
          <TouchableWithoutFeedback onPress={() => setIsChatVisible(false)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <View style={styles.chatOverlayContainer}>
            <View style={styles.chatOverlay}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatTitle}>المساعد الذكي</Text>
                <TouchableOpacity 
                  onPress={() => setIsChatVisible(false)}
                  style={styles.closeChatButton}
                >
                  <Ionicons name="close" size={24} color={theme.colors.neutral.textPrimary} />
                </TouchableOpacity>
              </View>
              <View style={styles.chatWrapper}>
                <Chat visible={true} />
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary.base,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  menuButton: {
    padding: theme.spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  category: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  mainContent: {
    flex: 1,
  },
  videoWrapper: {
    width: '100%',
    height: 230,
    backgroundColor: '#000',
  },
  videoPlaceholder: {
    width: '100%',
    height: 230,
    backgroundColor: '#000',
  },
  placeholderText: {
    color: '#FFF',
    fontSize: 16,
  },
  video: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: 20,
  },
  errorSubText: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: theme.colors.primary.base,
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 300,
    height: '100%',
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.large,
    zIndex: 2,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray.light,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
  },
  videoItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray.light,
  },
  selectedVideoItem: {
    backgroundColor: `${theme.colors.primary.base}15`,
    borderRightWidth: 3,
    borderRightColor: theme.colors.primary.base,
  },
  videoItemText: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 2,
  },
  helpButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: theme.colors.primary.base,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    ...theme.shadows.medium,
  },
  helpButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  helpButtonActive: {
    backgroundColor: theme.colors.primary.light,
  },
  chatOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  chatOverlay: {
    width: '100%',
    height: '80%',
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 16,
    ...theme.shadows.large,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary.base,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  chatTitle: {
    flex: 1,
    color: theme.colors.neutral.surface,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  closeChatButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  chatWrapper: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  questionSection: {
    flex: 1,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.neutral.background,
  },
});

export default VideoLesson;