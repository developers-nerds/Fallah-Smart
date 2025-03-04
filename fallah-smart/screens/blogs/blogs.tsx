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
  StatusBar
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons, Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { theme } from '../../theme/theme';

import * as ImagePicker from 'expo-image-picker';

// API Base URL
const API_URL = "http://192.168.11.225:5000/api/blog";

// Post category options for creation only, not filtering
const CATEGORIES = [
  { label: 'Questions', value: 'Question', icon: 'help-circle', iconType: 'feather' },
  { label: 'Market', value: 'Market', icon: 'shopping', iconType: 'material' },
  { label: 'News', value: 'News', icon: 'newspaper', iconType: 'material' }
];

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

// Update the renderPostItem function to use the handlePostLike function
const renderPostItem = ({ item }) => (
  <TouchableOpacity 
    style={styles.postCard}
    onPress={() => navigation.navigate('PostDetail', { 
      postId: item.id,
      onCommentAdded: () => handleCommentAdded(item.id)
    })}
    activeOpacity={0.9}
  >
    <View style={styles.postHeader}>
      <View style={styles.authorInfo}>
        {item.author?.profilePicture ? (
          <Image 
            source={{ 
              uri: item.author.profilePicture.startsWith('http') 
                ? item.author.profilePicture 
                : `http://192.168.11.225:5000${item.author.profilePicture}` // Fixed URL
            }} 
            style={styles.authorAvatar} 
          />
        ) : (
          <View style={styles.authorAvatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={18} color="#fff" />
          </View>
        )}
        <View>
          <Text style={styles.authorName}>
            {item.author?.firstName 
              ? `${item.author.firstName} ${item.author.lastName}` 
              : item.author?.username || 'Anonymous'}
          </Text>
          <Text style={styles.postDate}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
      
      {item.category && (
        <View style={styles.categoryBadge}>
          {renderCategoryIcon(item.category)}
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      )}
    </View>
    
    <Text style={styles.postTitle}>{item.title}</Text>
    
    {item.description && (
      <Text style={styles.postDescription} numberOfLines={3}>
        {item.description}
      </Text>
    )}
    
    {item.media && item.media.length > 0 && (
      <View style={styles.mediaContainer}>
        {item.media.slice(0, 1).map((media, index) => (
          <Image 
            key={index} 
            source={{ uri: media.url }} 
            style={styles.postImage} 
            resizeMode="cover"
          />
        ))}
        {item.media.length > 1 && (
          <View style={styles.mediaCountBadge}>
            <Text style={styles.mediaCountText}>+{item.media.length - 1}</Text>
          </View>
        )}
      </View>
    )}
    
    <View style={styles.postFooter}>
      <TouchableOpacity 
        style={styles.footerAction}
        onPress={(e) => {
          e.stopPropagation(); // Prevent post navigation
          handlePostLike(item.id);
        }}
      >
        <MaterialCommunityIcons 
          name={item.userLiked ? "heart" : "heart-outline"} 
          size={20} 
          color={item.userLiked ? theme.colors.error : theme.colors.neutral.textSecondary} 
        />
        <Text style={styles.footerActionText}>{item.likesCount || 0} Likes</Text>
      </TouchableOpacity>
      
      <View style={styles.footerAction}>
        <MaterialCommunityIcons name="comment-outline" size={20} color={theme.colors.neutral.textSecondary} />
        <Text style={styles.footerActionText}>{item.commentsCount || 0} Comments</Text>
      </View>
    </View>
  </TouchableOpacity>
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
      
      {/* Header with spacer to push down content */}
      <View style={styles.headerSpacer} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>
      
      {/* Main content */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchPosts}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.postsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary.base]}
              tintColor={theme.colors.primary.base}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="post-outline" 
                size={64} 
                color={theme.colors.neutral.gray.base} 
              />
              <Text style={styles.emptyTitle}>No Posts Yet</Text>
              <Text style={styles.emptyDescription}>
                Be the first to share something with the community!
              </Text>
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.createPostButtonText}>Create Post</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      
      {/* Floating ask community button */}
      <TouchableOpacity 
        style={styles.askCommunityButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
      >
        <Feather name="edit" size={18} color={theme.colors.neutral.surface} style={styles.editIcon} />
        <Text style={styles.askCommunityButtonText}>Ask Community</Text>
      </TouchableOpacity>
      
      {/* Create Post Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
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
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  authorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral.gray.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  authorName: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
  },
  postDate: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.gray.light,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginLeft: 4,
  },
  postTitle: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  postDescription: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginBottom: theme.spacing.md,
  },
  mediaContainer: {
    position: 'relative',
    width: '100%',
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.medium,
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
    color: 'white',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerActionText: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.small,
  },
  retryButtonText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.surface,
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
  askCommunityButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: theme.colors.primary.base,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  askCommunityButtonText: {
    color: theme.colors.neutral.surface,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    marginLeft: 8,
  },
  editIcon: {
    marginRight: 4,
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
  mediaCountBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 4,
    borderRadius: 12,
  },
  mediaCountText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.bold,
    color: 'white',
  },
});

export default Blogs;
