import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../../../theme/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

interface VideoData {
  id: string;
  title: string;
  category: string;
  youtubeId?: string;
  additionalVideos?: Array<{
    id: string;
    title: string;
    youtubeId: string;
  }>;
}

const videoDatabase: { [key: string]: VideoData } = {
  // Animal videos (1-7)
  'animal_1': {
    id: '1',
    title: 'تربية الأبقار الحديثة',
    category: 'ماشية',
    youtubeId: 'QKRoup18Fgw',
    additionalVideos: [
      {
        id: '1_2',
        title: 'تغذية الأبقار',
        youtubeId: 'xZYjCZF5EdU'
      },
      {
        id: '1_3',
        title: 'الرعاية الصحية للأبقار',
        youtubeId: 'f1yhB1_hjIA'
      }
    ]
  },
  'animal_2': {
    id: '2',
    title: 'تربية الأغنام الحديثة',
    category: 'ماشية'
  },
  'animal_3': {
    id: '3',
    title: 'تربية الماعز',
    category: 'ماشية'
  },
  'animal_4': {
    id: '4',
    title: 'تربية الدجاج',
    category: 'دواجن'
  },
  'animal_5': {
    id: '5',
    title: 'تربية الديك الرومي',
    category: 'دواجن'
  },
  'animal_6': {
    id: '6',
    title: 'تربية الأرانب',
    category: 'حيوانات صغيرة'
  },
  'animal_7': {
    id: '7',
    title: 'تربية الحمام',
    category: 'طيور'
  },

  // Crop videos (1-31)
  'crop_1': {
    id: '1',
    title: 'زراعة القمح الحديثة',
    category: 'الحبوب والأرز'
  },
  'crop_2': {
    id: '2',
    title: 'زراعة الأرز',
    category: 'الحبوب والأرز'
  },
  'crop_3': {
    id: '3',
    title: 'زراعة الذرة',
    category: 'الحبوب والأرز'
  },
  'crop_4': {
    id: '4',
    title: 'زراعة الطماطم',
    category: 'الخضروات'
  },
  'crop_5': {
    id: '5',
    title: 'زراعة البطاطس',
    category: 'الخضروات'
  },
  'crop_6': {
    id: '6',
    title: 'زراعة الباذنجان',
    category: 'الخضروات'
  },
  'crop_7': {
    id: '7',
    title: 'زراعة الفول',
    category: 'البقوليات'
  },
  'crop_8': {
    id: '8',
    title: 'زراعة العدس',
    category: 'البقوليات'
  },
  'crop_9': {
    id: '9',
    title: 'زراعة البرتقال',
    category: 'الفواكه'
  },
  'crop_10': {
    id: '10',
    title: 'زراعة التفاح',
    category: 'الفواكه'
  },
  'crop_11': {
    id: '11',
    title: 'زراعة عباد الشمس',
    category: 'المحاصيل الزيتية'
  },
  'crop_12': {
    id: '12',
    title: 'زراعة الزيتون',
    category: 'المحاصيل الزيتية'
  }
};

const VideoLesson = () => {
  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(0)).current;
  
  const route = useRoute();
  const navigation = useNavigation();
  
  const { videoId, type } = route.params as { videoId: string; type: 'animal' | 'crop' };
  const videoKey = `${type}_${videoId}`;
  const videoData = videoDatabase[videoKey];

  useEffect(() => {
    if (videoData?.youtubeId) {
      setSelectedVideoId(videoData.youtubeId);
    }
  }, [videoData]);

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

  if (!videoData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>عذراً، هذا الفيديو غير متوفر حالياً</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{videoData.title}</Text>
          <Text style={styles.category}>{videoData.category}</Text>
        </View>
        {videoData.additionalVideos && (
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <MaterialIcons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.mainContent}>
          <View style={styles.videoWrapper}>
            <WebView
              source={{
                uri: `https://www.youtube.com/embed/${selectedVideoId}?playsinline=1&rel=0&showinfo=0&modestbranding=1`
              }}
              style={styles.video}
              allowsFullscreenVideo={true}
              javaScriptEnabled={true}
            />
          </View>
        </View>

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
            <Text style={styles.sidebarTitle}>Related Videos</Text>
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
              onPress={() => setSelectedVideoId(videoData.youtubeId!)}
            >
              <Text style={styles.videoItemText}>{videoData.title}</Text>
            </TouchableOpacity>
            {videoData.additionalVideos?.map((video) => (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
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
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 300,
    backgroundColor: theme.colors.neutral.surface,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.neutral.gray.light,
    ...theme.shadows.large,
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
  },
  videoItemText: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.primary.base,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    marginTop: theme.spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoLesson; 

/*
Example usage from another component:

import { useNavigation } from '@react-navigation/native';

const SomeComponent = () => {
  const navigation = useNavigation();
  
  const openVideoLesson = () => {
    navigation.navigate('VideoLesson', {
      videoId: 'Uoen6G_Eu8I',
      type: 'animal'
    });
  };
  
  return (
    <Button title="Watch Video Lesson" onPress={openVideoLesson} />
  );
};
*/ 