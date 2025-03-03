import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { MaterialCommunityIcons, Feather, FontAwesome } from '@expo/vector-icons';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { BLOG_API_URL } from '../../config/api';

// Update API URL to use only one specific address
const getApiBaseUrl = () => {
  // Always use this specific URL regardless of platform
  return "http://192.168.104.24:5000/api/blog";
};

// Use the function to get the base URL
const API_URL = getApiBaseUrl();

// Add this utility function for retrying failed API calls
const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await axios(url, options);
    } catch (err) {
      console.log(`Attempt ${attempt + 1} failed. ${maxRetries - attempt - 1} retries left.`);
      lastError = err;
      
      // Only retry on network errors, not on 4xx/5xx responses
      if (err.response) {
        throw err; // Don't retry if server returned an error response
      }
      
      // Wait before retrying (with exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  
  throw lastError; // All retries failed
};

// Add this at the top with other constants
const BASE_URL = "http://192.168.104.24:5000";

const PostDetail = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [liked, setLiked] = useState(false);

  // Fetch post and comments
  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      console.log(`Fetching post details for ID: ${postId} from ${API_URL}/posts/${postId}`);
      
      // Instead of testing the base URL directly, test the health endpoint or skip this check
      // The base URL might not have a handler, which explains the 404
      try {
        // Don't test the base URL directly - it might not exist
        // Just log the API URL we're going to use
        console.log('Using API base URL:', API_URL);
      } catch (testError) {
        console.error('API base URL test error:', testError);
        // Continue anyway since this is just a test
      }
      
      // Directly fetch the post with the ID we know
      const postResponse = await axios.get(`${API_URL}/posts/${postId}`, {
        timeout: 10000, // 10 second timeout
      });
      
      console.log('Post data received:', postResponse.data ? 'Success' : 'Empty response');
      setPost(postResponse.data);
      setLiked(postResponse.data.userLiked || false);
      
      // Then fetch comments
      try {
        const commentsResponse = await axios.get(`${API_URL}/posts/${postId}/comments`);
        console.log(`Received ${commentsResponse.data.length} comments`);
        setComments(commentsResponse.data || []);
      } catch (commentsError) {
        console.error('Error fetching comments:', commentsError);
        setComments([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching post details:', err);
      
      // Detailed error reporting with API URL for debugging
      if (err.response) {
        console.error('Server error:', err.response.status, err.response.data);
        setError(`Server error (${err.response.status}): ${err.response.data.message || 'Unknown server error'}`);
      } else if (err.request) {
        console.error('No response received from:', `${API_URL}/posts/${postId}`);
        setError(`Network error: Could not connect to ${API_URL}. Please check your connection and ensure the server is running.`);
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  useEffect(() => {
    if (comments && comments.length > 0) {
      console.log('Comments loaded, first comment:', JSON.stringify(comments[0], null, 2));
      
      // Log if any comments have images
      const commentsWithImages = comments.filter(c => 
        c.image || c.imageUrl || (c.media && c.media.length > 0)
      );
      
      if (commentsWithImages.length > 0) {
        console.log(`Found ${commentsWithImages.length} comments with images`);
        console.log('First comment with image:', JSON.stringify(commentsWithImages[0], null, 2));
      } else {
        console.log('No comments with images found in response');
      }
    }
  }, [comments]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPostDetails();
  };

  // Handle like/unlike post
  const toggleLike = async () => {
    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/like`);
      setLiked(response.data.liked);
      
      // Update post with new like count
      setPost(prevPost => ({
        ...prevPost,
        likesCount: liked 
          ? Math.max(0, (prevPost.likesCount || 0) - 1) 
          : (prevPost.likesCount || 0) + 1
      }));
    } catch (err) {
      console.error('Error toggling like:', err);
      Alert.alert('Error', 'Failed to process your like. Please try again.');
    }
  };

  // Pick image for comment
  const pickCommentImage = async () => {
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Create a consistent object structure
        const selectedAsset = {
          uri: result.assets[0].uri,
          type: result.assets[0].type || 'image/jpeg',
          name: result.assets[0].fileName || 'photo.jpg'
        };
        setCommentImage(selectedAsset);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Remove comment image
  const removeCommentImage = () => {
    setCommentImage(null);
  };

  // Update the addComment function to handle the response format
  const handleSubmitComment = async () => {
    if (!newComment.trim() && !commentImage) return;

    try {
      const formData = new FormData();
      formData.append('content', newComment.trim());

      // Add image to form data if exists
      if (commentImage) {
        const fileExtension = commentImage.uri.split('.').pop() || 'jpg';
        const fileName = `comment_${Date.now()}.${fileExtension}`;
        
        formData.append('image', {
          uri: Platform.OS === 'android' ? commentImage.uri : commentImage.uri.replace('file://', ''),
          name: fileName,
          type: `image/${fileExtension}`
        });
      }

      // Send request
      const response = await axios.post(
        `${API_URL}/posts/${postId}/comments`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      // Clear form and refresh comments
      setNewComment('');
      setCommentImage(null);
      fetchPostDetails();

    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    }
  };

  // Time ago format
  const timeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  // Render category icon
  const renderCategoryIcon = (category) => {
    switch (category) {
      case 'Question':
        return <Feather name="help-circle" size={16} color={theme.colors.primary.base} />;
      case 'Market':
        return <MaterialCommunityIcons name="shopping" size={16} color={theme.colors.primary.base} />;
      case 'News':
        return <MaterialCommunityIcons name="newspaper" size={16} color={theme.colors.primary.base} />;
      default:
        return null;
    }
  };

  // Update the renderComment function to properly handle comment images
  const renderComment = ({ item }) => {
    // Function to get proper profile picture URL
    const getProfilePictureUrl = (profilePicture) => {
      if (!profilePicture) return null;
      if (profilePicture.startsWith('http')) {
        return profilePicture;
      }
      return `${BASE_URL}${profilePicture}`;
    };

    // Function to get proper comment image URL
    const getCommentImageUrl = (image) => {
      if (!image) return null;
      if (image.startsWith('http')) {
        return image;
      }
      return `${BASE_URL}${image}`;
    };

    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Profile Picture */}
            {item.user?.profilePicture ? (
              <Image
                source={{ 
                  uri: getProfilePictureUrl(item.user.profilePicture)
                }}
                style={styles.commentAvatar}
              />
            ) : (
              <View style={styles.commentAvatarPlaceholder}>
                <FontAwesome name="user" size={20} color="#FFF" />
              </View>
            )}
            
            {/* User name and timestamp */}
            <View>
              <Text style={styles.userName}>
                {item.user?.username || 'Anonymous'}
              </Text>
              <Text style={styles.commentTime}>
                {timeAgo(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Comment content */}
        <Text style={styles.commentContent}>{item.content}</Text>

        {/* Comment image - check multiple possible image properties */}
        {(item.image || item.media?.[0] || item.imageUrl) && (
          <View style={styles.commentImageContainer}>
            <Image
              source={{ 
                uri: getCommentImageUrl(item.image || item.media?.[0]?.url || item.imageUrl)
              }}
              style={styles.commentImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>
    );
  };

  // Update the post header section to show the author's profile picture
  const renderPostHeader = () => (
    <View style={styles.postHeader}>
      <View style={styles.authorInfo}>
        {post?.author?.profilePicture ? (
          <Image
            source={{ 
              uri: post.author.profilePicture.startsWith('http') 
                ? post.author.profilePicture 
                : `${BASE_URL}${post.author.profilePicture}`
            }}
            style={styles.authorAvatar}
          />
        ) : (
          <View style={styles.authorAvatarPlaceholder}>
            <FontAwesome name="user" size={24} color="#FFF" />
          </View>
        )}
        <View>
          <Text style={styles.authorName}>
            {post?.author?.username || 'Anonymous'}
          </Text>
          <Text style={styles.postTime}>
            {timeAgo(post?.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );

  // Add this function to help debug the image structure from your backend
  const inspectBackendImageStructure = async () => {
    try {
      console.log('Examining backend image structure...');
      
      // Fetch a single comment to inspect its structure
      const testResponse = await axios.get(`${API_URL}/posts/${postId}/comments`);
      if (testResponse.data && testResponse.data.length > 0) {
        const testComment = testResponse.data[0];
        console.log('Test comment full structure:', JSON.stringify(testComment, null, 2));
        
        // Look specifically for image-related properties
        const imageProps = Object.keys(testComment).filter(key => 
          key.includes('image') || 
          key.includes('media') || 
          key.includes('file') ||
          key.includes('upload') ||
          key.includes('photo')
        );
        
        console.log('Image-related properties:', imageProps);
        imageProps.forEach(prop => {
          console.log(`Property ${prop}:`, testComment[prop]);
        });
      }
    } catch (error) {
      console.error('Error inspecting backend structure:', error);
    }
  };

  // Call this function in useEffect
  useEffect(() => {
    inspectBackendImageStructure();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Post Detail</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Post Detail</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Try Again" onPress={fetchPostDetails} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Post Detail</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Post not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Post Detail</Text>
        <View style={{ width: 50 }} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {renderPostHeader()}
          
          <Text style={styles.postTitle}>{post.title}</Text>
          
          {post.description && (
            <Text style={styles.postDescription}>{post.description}</Text>
          )}
          
          {post.media && post.media.length > 0 && (
            <View style={styles.mediaContainer}>
              {post.media.map((media, idx) => {
                const mediaUrl = typeof media === 'string' 
                  ? `http://192.168.1.16:5000/uploads/${media}`
                  : media.url || `http://192.168.1.16:5000/uploads/${media.path || media.filename}`;
                
                return (
                  <View key={idx} style={styles.postImageContainer}>
                    <Image
                      source={{ uri: mediaUrl }}
                      style={styles.postImage}
                      resizeMode="cover"
                      onLoad={() => console.log(`Post image ${idx} loaded successfully`)}
                      onError={(e) => console.error(`Post image ${idx} load error:`, e.nativeEvent.error, mediaUrl)}
                    />
                  </View>
                );
              })}
            </View>
          )}
          
          <View style={styles.postFooter}>
            <TouchableOpacity 
              style={styles.interactionButton}
              onPress={toggleLike}
            >
              <MaterialCommunityIcons 
                name={liked ? "heart" : "heart-outline"} 
                size={24} 
                color={liked ? theme.colors.error : theme.colors.neutral.textSecondary} 
              />
              <Text style={styles.interactionText}>
                {post.likesCount || 0} {post.likesCount === 1 ? 'Like' : 'Likes'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.interactionButton}>
              <MaterialCommunityIcons 
                name="comment-outline" 
                size={24} 
                color={theme.colors.neutral.textSecondary} 
              />
              <Text style={styles.interactionText}>
                {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
              </Text>
            </View>
            
            <View style={styles.interactionButton}>
              <MaterialCommunityIcons 
                name="eye-outline" 
                size={24} 
                color={theme.colors.neutral.textSecondary} 
              />
              <Text style={styles.interactionText}>
                {post.counter || 0} {post.counter === 1 ? 'View' : 'Views'}
              </Text>
            </View>
          </View>
          
          {/* Add Comment Section */}
          <View style={styles.addCommentSection}>
            <Text style={styles.sectionTitle}>Add a Comment</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Write your comment here..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            
            {commentImage && (
              <View style={styles.selectedImageWrapper}>
                <Image source={{ uri: commentImage.uri }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={removeCommentImage}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.commentActions}>
              <TouchableOpacity 
                style={styles.imagePickerButton}
                onPress={pickCommentImage}
              >
                <MaterialCommunityIcons name="image-plus" size={24} color={theme.colors.primary.base} />
              </TouchableOpacity>
              
              <Button 
                title="Post Comment" 
                onPress={handleSubmitComment}
                disabled={!newComment.trim() && !commentImage}
              />
            </View>
          </View>
          
          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>
            
            {/* Comments List */}
            <View style={styles.commentsList}>
              {comments.length > 0 ? (
                comments.map((comment, index) => renderComment({ item: comment }))
              ) : (
                <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6DFD5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1810',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#C23616',
    marginBottom: 16,
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral.gray.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
  },
  postTime: {
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
    marginTop: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
  },
  commentTime: {
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECE9E4',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#2C1810',
    marginLeft: 4,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 14,
    color: '#2C1810',
    marginBottom: 12,
  },
  mediaContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#ECE9E4',
    paddingTop: 12,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionText: {
    fontSize: 14,
    color: '#6B5750',
    marginLeft: 4,
  },
  addCommentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: '#ECE9E4',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  selectedImageWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imagePickerButton: {
    padding: 8,
  },
  commentsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#6B5750',
    textAlign: 'center',
    marginVertical: 16,
  },
  commentContainer: {
    marginBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    paddingBottom: theme.spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: theme.spacing.sm,
  },
  commentAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.neutral.gray.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  commentContent: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  commentImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.neutral.background,
  },
  commentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  commentImagePreviewContainer: {
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    marginVertical: theme.spacing.sm,
    width: 100,
    height: 100,
    position: 'relative',
  },
  commentImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  commentFormActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  commentForm: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageButton: {
    padding: 8,
  },
  commentsList: {
    marginTop: theme.spacing.md,
  },
});

export default PostDetail; 