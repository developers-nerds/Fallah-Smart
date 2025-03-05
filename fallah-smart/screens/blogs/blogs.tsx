import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  Button,
  Dimensions,
  Share
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons, Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { theme } from '../../theme/theme';

import * as ImagePicker from 'expo-image-picker';

// Update API URL constants
const BASE_URL = process.env.EXPO_PUBLIC_API;
const BLOG_URL = process.env.EXPO_PUBLIC_BlOG;
const API_URL = `${BASE_URL}/api/blog`;

// Post category options for creation only, not filtering
const CATEGORIES = [
  { label: 'Questions', value: 'Question', icon: 'help-circle', iconType: 'feather' },
  { label: 'Market', value: 'Market', icon: 'shopping', iconType: 'material' },
  { label: 'News', value: 'News', icon: 'newspaper', iconType: 'material' }
];

// Update the image URL handling in the PostItem component
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) {
    // Replace any hardcoded IP with the environment variable
    return imageUrl.replace(/http:\/\/\d+\.\d+\.\d+\.\d+:\d+/, BASE_URL);
  }
  return `${BASE_URL}${imageUrl}`;
};

// First, create a new PostItem component at the top of your file (after imports)
const PostItem = ({ item, navigation, handlePostLike, handleCommentAdded, timeAgo, renderCategoryIcon, BASE_URL, openReportModal, handleSharePost }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const handleImagePress = (e) => {
    e.stopPropagation();
  };
  
  return (
    <View style={styles.postCard}>
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('PostDetail', { 
          postId: item.id,
          onCommentAdded: () => handleCommentAdded(item.id)
        })}
      >
        {/* Header section with user info and category */}
        <View style={styles.postHeader}>
          <View style={styles.userInfoContainer}>
            {/* User avatar */}
            {item.author?.profilePicture && (
              <Image 
                source={{ 
                  uri: getImageUrl(item.author.profilePicture)
                }} 
                style={styles.userAvatar} 
              />
            )}
            
            {/* User info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {item.author?.firstName 
                  ? `${item.author.firstName} ${item.author.lastName}` 
                  : item.author?.username || 'Anonymous'}
              </Text>
              <Text style={styles.postTime}>{timeAgo(item.createdAt)}</Text>
            </View>
          </View>
          
          {/* Category tag */}
          {item.category && (
            <View style={styles.categoryTag}>
              {renderCategoryIcon(item.category)}
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
        
        {/* Post title - make it prominent */}
        <Text style={styles.postTitle}>{item.title}</Text>
        
        {/* Post description with limited lines */}
        {item.description && (
          <Text style={styles.postDescription} numberOfLines={3}>
            {item.description}
          </Text>
        )}
        
        {/* Media section - updated to support horizontal scrolling */}
        {item.media && item.media.length > 0 && (
          <View style={styles.mediaContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const offset = event.nativeEvent.contentOffset.x;
                const newIndex = Math.round(offset / event.nativeEvent.layoutMeasurement.width);
                setActiveImageIndex(newIndex);
              }}
              scrollEventThrottle={200}
              onTouchStart={handleImagePress}
              onTouchEnd={handleImagePress}
              style={styles.imageScrollView}
            >
              {item.media.map((media, index) => (
                <Image 
                  key={index} 
                  source={{ 
                    uri: getImageUrl(media.url)
                  }} 
                  style={styles.postImage} 
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            
            {/* Pagination indicators */}
            {item.media.length > 1 && (
              <View style={styles.paginationContainer}>
                {item.media.map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.paginationDot, 
                      index === activeImageIndex && styles.paginationDotActive
                    ]} 
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
      
      {/* Footer section with interactions */}
      <View style={styles.postFooter}>
        <View style={styles.interactionButtons}>
          {/* Like button */}
          <TouchableOpacity 
            style={styles.interactionButton}
            onPress={() => handlePostLike(item.id)}
          >
            <MaterialCommunityIcons 
              name={item.userLiked ? "thumb-up" : "thumb-up-outline"} 
              size={18} 
              color={item.userLiked ? theme.colors.primary.base : theme.colors.neutral.textSecondary} 
            />
            <Text style={styles.interactionCount}>{item.likesCount || 0}</Text>
          </TouchableOpacity>
          
          {/* Comment button */}
          <TouchableOpacity style={styles.interactionButton}>
            <MaterialCommunityIcons 
              name="comment-outline" 
              size={18} 
              color={theme.colors.neutral.textSecondary} 
            />
            <Text style={styles.interactionCount}>{item.commentsCount || 0}</Text>
          </TouchableOpacity>
          
          {/* Share button */}
          <TouchableOpacity 
            style={styles.interactionButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent navigation
              handleSharePost(item);
            }}
          >
            <MaterialCommunityIcons 
              name="share-outline" 
              size={18} 
              color={theme.colors.neutral.textSecondary} 
            />
            <Text style={styles.interactionCount}>Share</Text>
          </TouchableOpacity>
          
          {/* Report button */}
          <TouchableOpacity 
            style={styles.interactionButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent navigation
              openReportModal(item);
            }}
          >
            <MaterialCommunityIcons 
              name="flag-outline" 
              size={18} 
              color={theme.colors.neutral.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const Blogs = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    category: 'Question'
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [postToReport, setPostToReport] = useState(null);
  const [customReason, setCustomReason] = useState('');
  
  // Add the report reasons array
  const reportReasons = [
    'Inappropriate content',
    'Spam',
    'Misleading information',
    'Harassment or bullying',
    'Violence',
    'Hate speech',
    'Other'
  ];

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Fetch all posts from API (no filtering)
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching posts from:', `${API_URL}/posts`);
      const response = await axios.get(`${API_URL}/posts`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      console.log('✅ Posts fetched successfully');
      setPosts(response.data);
    } catch (err) {
      console.error('❌ Error fetching posts:', err);
      
      // More detailed error reporting
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        setError(`Server error: ${err.response.status}. Please try again later.`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received from server');
        setError('Network error. Please check your connection and ensure the server is running.');
      } else {
        // Something happened in setting up the request
        setError('Failed to load posts. Please try again later.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  // Replace camera with direct image picker access
  const openCamera = async () => {
    try {
      // Check if permission was granted
      if (cameraPermission !== true) {
        Alert.alert(
          "Permission Required", 
          "Camera permission is needed to take photos.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Settings", 
              onPress: () => ImagePicker.requestCameraPermissionsAsync() 
            }
          ]
        );
        return;
      }
      
      // Launch camera directly through image picker
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log("Photo captured:", result.assets[0].uri);
        
        // Create a photo asset from the camera result
        const photoAsset = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `camera_${Date.now()}.jpg`,
          width: result.assets[0].width || 500,
          height: result.assets[0].height || 500
        };
        
        // Add to selected images
        setSelectedImages(prev => [...prev, photoAsset]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  // Add this function to pick images from the gallery
  const pickFromGallery = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required", 
          "Gallery access is needed to select photos.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Settings", 
              onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() 
            }
          ]
        );
        return;
      }
      
      // Launch gallery picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Process all selected images
        const newAssets = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg',
          name: `gallery_${Date.now()}_${Math.random().toString(36).substring(7)}.${asset.uri.split('.').pop() || 'jpg'}`,
          width: asset.width || 500,
          height: asset.height || 500
        }));
        
        // Add to selected images
        setSelectedImages(prev => [...prev, ...newAssets]);
      }
    } catch (error) {
      console.error("Error picking images from gallery:", error);
      Alert.alert("Error", "Failed to access gallery. Please try again.");
    }
  };

  // Add a function to show image options
  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: openCamera
        },
        {
          text: 'Choose from Gallery',
          onPress: pickFromGallery
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Handler for removing an image
  const removeImage = (index) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  // Updated submit handler with better null checking
  const createPost = async () => {
    if (!newPost.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your post.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create form data with strict null checking
      const formData = new FormData();
      formData.append('title', newPost.title.trim());
      formData.append('description', newPost.description.trim());
      formData.append('category', newPost.category || 'Question');
      
      // Safely append images with null checks
      if (selectedImages && selectedImages.length > 0) {
        selectedImages.forEach((image, index) => {
          if (!image || !image.uri) return; // Skip invalid images
          
          const uriParts = image.uri.split('/');
          const fileName = uriParts[uriParts.length - 1] || `image_${index}.jpg`;
          
          // Default to jpeg if can't determine type
          const fileType = image.uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
          
          formData.append('images', {
            uri: image.uri,
            name: fileName,
            type: fileType
          });
        });
      }
      
      await axios.post(`${API_URL}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Reset form and fetch posts
      setNewPost({
        title: '',
        description: '',
        category: 'Question'
      });
      setSelectedImages([]);
      setModalVisible(false);
      fetchPosts();
      
      Alert.alert('Success', 'Your post has been created!');
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render time ago from date
  const timeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Render category icon
  const renderCategoryIcon = (category) => {
    if (!category) return null;
    
    const categoryConfig = CATEGORIES.find(c => c.value === category);
    if (!categoryConfig) return null;
    
    if (categoryConfig.iconType === 'feather') {
      return <Feather name={categoryConfig.icon} size={14} color={theme.colors.neutral.textSecondary} />;
    } else {
      return <MaterialCommunityIcons name={categoryConfig.icon} size={14} color={theme.colors.neutral.textSecondary} />;
    }
  };

  // Add a function to handle post likes within the Blogs component
  const handlePostLike = async (postId) => {
  try {
    const response = await axios.post(`${API_URL}/posts/${postId}/like`);
    
    // Update the post in state to reflect the new like count
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likesCount: post.userLiked 
            ? Math.max(0, post.likesCount - 1) // If unliking, decrease
            : post.likesCount + 1, // If liking, increase
          userLiked: !post.userLiked // Toggle liked status
        };
      }
      return post;
    }));
  } catch (error) {
    console.error('Error toggling like:', error);
  }
};

// Now use this simplified renderPostItem that returns our PostItem component
const renderPostItem = ({ item }) => (
  <PostItem 
    item={item} 
    navigation={navigation} 
    handlePostLike={handlePostLike}
    handleCommentAdded={handleCommentAdded}
    timeAgo={timeAgo}
    renderCategoryIcon={renderCategoryIcon}
    BASE_URL={BASE_URL}
    openReportModal={openReportModal}
    handleSharePost={handleSharePost}
  />
);

// Function to handle comment additions
const handleCommentAdded = (postId) => {
  // Update the post's comment count in state
  setPosts(prevPosts => prevPosts.map(post => {
    if (post.id === postId) {
      return {
        ...post,
        commentsCount: (post.commentsCount || 0) + 1
      };
    }
    return post;
  }));
};

// Add a function to handle reporting
const handleReportPost = async () => {
  if (!reportReason || (reportReason === 'Other' && !customReason)) {
    Alert.alert('Error', 'Please provide a reason for reporting this post');
    return;
  }
  
  setIsSubmittingReport(true);
  
  try {
    await axios.post(`${API_URL}/posts/${postToReport.id}/report`, {
      reason: reportReason === 'Other' ? customReason : reportReason
    });
    
    setReportModalVisible(false);
    setReportReason('');
    setCustomReason('');
    setPostToReport(null);
    Alert.alert('Success', 'Thank you for your report. Our team will review it shortly.');
  } catch (error) {
    console.error('Error reporting post:', error);
    Alert.alert('Error', 'Failed to submit report. Please try again later.');
  } finally {
    setIsSubmittingReport(false);
  }
};

// Add a function to open the report modal
const openReportModal = (post) => {
  setPostToReport(post);
  setReportModalVisible(true);
};

// Update the navigation to PostDetail to include a callback for when comments are added
// Add this inside the Blogs component, possibly in useEffect or a navigation function
useEffect(() => {
  // Set up a listener for when we return from PostDetail
  const unsubscribe = navigation.addListener('focus', () => {
    // Refresh the posts when returning to this screen
    fetchPosts();
  });

  return unsubscribe;
}, [navigation]);

// Update the handleSharePost function
const handleSharePost = async (post) => {
  try {
    // Include post author if available
    const author = post.author?.firstName 
      ? `${post.author.firstName} ${post.author.lastName}` 
      : 'A Fallah Smart user';

    // Create the share content
    const title = post.title || 'Check out this post';
    const message = `${title}\n\n${post.description || ''}\n\nShared by ${author} via Fallah Smart app`;

    // Get the first image URL if available
    let imageUrl = null;
    if (post.media && post.media.length > 0) {
      imageUrl = getImageUrl(post.media[0].url);
    }

    // Configure share options based on platform
    const shareOptions = Platform.select({
      ios: {
        activityItemSources: [
          {
            placeholderItem: { type: 'text', content: message },
            item: {
              default: { type: 'text', content: message },
            },
            linkMetadata: {
              title: title,
            },
          },
          imageUrl && {
            placeholderItem: { type: 'url', content: imageUrl },
            item: {
              default: { type: 'url', content: imageUrl },
            },
            linkMetadata: {
              title: title,
              icon: imageUrl
            },
          },
        ].filter(Boolean),
      },
      android: {
        title,
        message,
        ...(imageUrl && { url: imageUrl }),
      },
      default: {
        title,
        message,
      },
    });

    const result = await Share.share(shareOptions, {
      dialogTitle: 'Share this post',
      subject: title,
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        console.log('Shared with activity type:', result.activityType);
      } else {
        console.log('Shared successfully');
      }
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dialog dismissed');
    }
  } catch (error) {
    console.error('Error sharing post:', error);
    Alert.alert(
      'Sharing Failed', 
      'Unable to share this post. Please try again or use a different sharing method.'
    );
  }
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.neutral.background }}>
      <StatusBar backgroundColor={theme.colors.neutral.background} barStyle="dark-content" />
      
      {loading && !posts.length ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Try Again" onPress={fetchPosts} style={{ marginTop: 16 }} />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.postsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No posts yet.</Text>
            </View>
          }
        />
      )}
      
      {/* Floating Action Button for creating a new post - styled like "Ask Community" */}
      <TouchableOpacity 
        style={styles.askCommunityButton}
        onPress={() => setModalVisible(true)}
      >
        <Feather name="edit" size={20} color="white" />
        <Text style={styles.askCommunityText}>Ask Community</Text>
      </TouchableOpacity>
      
      {/* New Post Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Feather name="x" size={24} color={theme.colors.neutral.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity 
              onPress={createPost}
              disabled={submitting || !newPost.title.trim()}
              style={[
                styles.modalSubmitButton,
                (!newPost.title.trim() || submitting) && styles.modalSubmitButtonDisabled
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={theme.colors.neutral.surface} />
              ) : (
                <Text style={styles.modalSubmitButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView style={styles.modalContent}>
              <TextInput
                style={styles.titleInput}
                placeholder="Title"
                placeholderTextColor={theme.colors.neutral.gray.base}
                value={newPost.title}
                onChangeText={title => setNewPost(prev => ({ ...prev, title }))}
                maxLength={100}
              />
              
              <TextInput
                style={styles.descriptionInput}
                placeholder="What would you like to share?"
                placeholderTextColor={theme.colors.neutral.gray.base}
                value={newPost.description}
                onChangeText={description => setNewPost(prev => ({ ...prev, description }))}
                multiline
              />
              
              <Text style={styles.sectionLabel}>Category</Text>
              <View style={styles.categoryOptions}>
                {CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryButton,
                      newPost.category === category.value && { backgroundColor: theme.colors.primary.base }
                    ]}
                    onPress={() => setNewPost(prev => ({ ...prev, category: category.value }))}
                  >
                    {category.iconType === 'feather' ? (
                      <Feather 
                        name={category.icon} 
                        size={16} 
                        color={newPost.category === category.value ? 
                          theme.colors.neutral.surface : 
                          theme.colors.neutral.textSecondary
                        } 
                      />
                    ) : (
                      <MaterialCommunityIcons 
                        name={category.icon} 
                        size={16} 
                        color={newPost.category === category.value ? 
                          theme.colors.neutral.surface : 
                          theme.colors.neutral.textSecondary
                        }
                      />
                    )}
                    <Text style={[
                      styles.categoryButtonText,
                      newPost.category === category.value && { color: theme.colors.neutral.surface }
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.sectionLabel}>Add Photos</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={showImageOptions}>
                <MaterialIcons name="add-photo-alternate" size={24} color={theme.colors.primary.base} />
                <Text style={styles.imagePickerText}>Add Images</Text>
              </TouchableOpacity>
              
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                style={selectedImages.length > 0 ? styles.selectedImagesContainer : null}
              >
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.selectedImageContainer}>
                    <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Feather name="x" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      
      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setReportModalVisible(false);
          setReportReason('');
          setCustomReason('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalContainer}>
            <View style={styles.reportModalHeader}>
              <Text style={styles.reportModalTitle}>Report Post</Text>
              <TouchableOpacity 
                onPress={() => {
                  setReportModalVisible(false);
                  setReportReason('');
                  setCustomReason('');
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.neutral.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.reportModalSubtitle}>Why are you reporting this post?</Text>
            
            <ScrollView style={styles.reportReasonsList}>
              {reportReasons.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reportReasonItem,
                    reportReason === reason && styles.reportReasonItemSelected
                  ]}
                  onPress={() => setReportReason(reason)}
                >
                  <Text style={styles.reportReasonText}>{reason}</Text>
                  {reportReason === reason && (
                    <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary.base} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Add custom reason input when 'Other' is selected */}
            {reportReason === 'Other' && (
              <View style={styles.customReasonContainer}>
                <TextInput
                  style={styles.customReasonInput}
                  placeholder="Please specify your reason"
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  maxLength={200}
                />
              </View>
            )}
            
            <View style={styles.reportModalActions}>
              <TouchableOpacity
                style={styles.reportCancelButton}
                onPress={() => {
                  setReportModalVisible(false);
                  setReportReason('');
                  setCustomReason('');
                }}
              >
                <Text style={styles.reportCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.reportSubmitButton,
                  (!reportReason || (reportReason === 'Other' && !customReason) || isSubmittingReport) && 
                    styles.reportSubmitButtonDisabled
                ]}
                onPress={handleReportPost}
                disabled={!reportReason || (reportReason === 'Other' && !customReason) || isSubmittingReport}
              >
                {isSubmittingReport ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.reportSubmitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  headerSpacer: {
    height: 50, // This pushes down the header for status bar
  },
  header: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.neutral.surface,
  },
  headerTitle: {
    fontSize: theme.fontSizes.h1,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral.gray.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
    marginBottom: 2,
  },
  postTime: {
    fontSize: 13,
    color: theme.colors.neutral.textSecondary,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.gray.light,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    marginLeft: 4,
    color: theme.colors.neutral.textSecondary,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  postDescription: {
    fontSize: 15,
    color: theme.colors.neutral.textPrimary,
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 20,
  },
  mediaContainer: {
    width: '100%',
    position: 'relative',
  },
  imageScrollView: {
    width: '100%',
  },
  postImage: {
    width: Dimensions.get('window').width - 32, // Full width minus padding
    height: 200,
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: 'white',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  postFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.gray.light,
  },
  interactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  interactionCount: {
    marginLeft: 4,
    fontSize: theme.fontSizes.small,
    color: theme.colors.neutral.textSecondary,
  },
  askCommunityButton: {
    backgroundColor: theme.colors.primary.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    position: 'absolute',
    bottom: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  askCommunityText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  modalTitle: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
  },
  modalSubmitButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.small,
  },
  modalSubmitButtonDisabled: {
    backgroundColor: theme.colors.primary.disabled,
  },
  modalSubmitButtonText: {
    color: theme.colors.neutral.surface,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  titleInput: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    marginBottom: theme.spacing.md,
  },
  descriptionInput: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.neutral.gray.light,
  },
  categoryButtonText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    marginLeft: 6,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  imagePickerText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.body,
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.medium,
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  selectedImageContainer: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.medium,
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  postsList: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  createPostButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.small,
  },
  createPostButtonText: {
    color: theme.colors.neutral.surface,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
  },
  errorText: {
    color: theme.colors.error.text,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.neutral.textSecondary,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  reportModalContainer: {
    width: '100%',
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.large,
    padding: 16,
    maxHeight: '80%',
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportModalTitle: {
    fontSize: theme.fontSizes.h3,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
  },
  reportModalSubtitle: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 16,
  },
  reportReasonsList: {
    maxHeight: 300,
  },
  reportReasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray.light,
  },
  reportReasonItemSelected: {
    backgroundColor: theme.colors.primary.fade,
  },
  reportReasonText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
  reportModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  reportCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  reportCancelButtonText: {
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
  },
  reportSubmitButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.small,
  },
  reportSubmitButtonDisabled: {
    backgroundColor: theme.colors.primary.disabled,
  },
  reportSubmitButtonText: {
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.surface,
  },
  customReasonContainer: {
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: theme.colors.neutral.gray.lighter,
    borderRadius: theme.borderRadius.medium,
  },
  customReasonInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    marginLeft: 4,
    fontSize: theme.fontSizes.small,
    color: theme.colors.neutral.textSecondary,
  },
});

export default Blogs;