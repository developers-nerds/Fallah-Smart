import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const VideoLesson = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // This component will display a specific video lesson
  // Using a direct embed URL for the video with ID: UC2L2I54PH4
  const videoEmbedUrl = 'https://www.youtube.com/embed/UC2L2I54PH4?si=k61Sx0eZ7Ja7raTQ';
  
  // Video metadata
  const videoTitle = "Agricultural Technology: Modern Farming Methods";
  const videoDescription = "Learn about modern agricultural techniques and technologies that improve farming efficiency and sustainability. This video covers advanced irrigation methods, precision farming, and sustainable practices.";

  const handleRetry = () => {
    setLoading(true);
    setError(false);
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>{videoTitle}</Text>
        
        <View style={styles.videoContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary.base} />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
          
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="red" />
              <Text style={styles.errorText}>Failed to load video</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              style={styles.video}
              source={{ uri: videoEmbedUrl }}
              allowsFullscreenVideo
              javaScriptEnabled
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              startInLoadingState={true}
            />
          )}
        </View>
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>About this lesson</Text>
          <Text style={styles.description}>{videoDescription}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.neutral.textPrimary,
  },
  videoContainer: {
    width: '100%',
    height: Dimensions.get('window').width * (9/16), // 16:9 aspect ratio
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  errorText: {
    color: '#fff',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary.base,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  descriptionContainer: {
    backgroundColor: theme.colors.neutral.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.neutral.textPrimary,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.neutral.textSecondary,
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
      videoUrl: 'https://youtu.be/Uoen6G_Eu8I?si=mURLgDM5aqkq5wnI'
    });
  };
  
  return (
    <Button title="Watch Video Lesson" onPress={openVideoLesson} />
  );
};
*/ 