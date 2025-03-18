import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  Dimensions,
  Share,
  ActionSheetIOS,
  Linking,
  Modal,
  Animated,
  RefreshControl,
  GestureResponderEvent,
  FlatList
} from 'react-native';
import axios from 'axios';
import { 
  FontAwesome, 
  MaterialCommunityIcons, 
  Ionicons, 
  AntDesign, 
  Feather,
  MaterialIcons 
} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme/theme';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { storage } from '../../utils/storage';
import { Camera } from 'expo-camera';
import { ParsedTextPart, Author, Post } from '../../types/blog';
import { 
  PostDetailNavigationProps, 
  Comment, 
  MediaItem, 
  CommentImageGalleryProps, 
  PostImageGalleryProps,
  PostDetailState
} from '../../types/postDetail';

// Constants
const BASE_URL = process.env.EXPO_PUBLIC_API;
const API_URL = `${BASE_URL}/api/blog`;
const { width } = Dimensions.get('window');
const placeholderImage = 'https://via.placeholder.com/100';

// Enhanced getImageUrl function with better URL handling
const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) {
    console.log("No image URL provided");
    return placeholderImage;
  }
  
  try {
    // Log for debugging
    console.log("Processing image URL:", imageUrl);
    
    // Handle already complete URLs
    if (imageUrl.startsWith('http')) {
      // If it's a local development URL, replace with BASE_URL
      if (imageUrl.match(/http:\/\/\d+\.\d+\.\d+\.\d+:\d+/)) {
        return imageUrl.replace(/http:\/\/\d+\.\d+\.\d+\.\d+:\d+/, BASE_URL);
      }
      // Otherwise return as is (it's already a complete URL)
      return imageUrl;
    }
    
    // Handle relative URLs
    if (imageUrl.startsWith('/')) {
      return `${BASE_URL}${imageUrl}`;
    }
    
    // Default case - prepend BASE_URL
    return `${BASE_URL}/${imageUrl}`;
  } catch (error) {
    console.error("Error processing image URL:", error);
    return placeholderImage;
  }
};

// Helper function to format full name
const formatUserName = (user: Author | undefined, author: Author | undefined): string => {
  console.log('Formatting name for:', JSON.stringify({
    user: user ? {
      hasUsername: !!user.username,
      hasFirstName: !!user.firstName,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName
    } : 'null',
    author: author ? {
      hasUsername: !!author.username,
      hasFirstName: !!author.firstName,
      username: author.username,
      firstName: author.firstName,
      lastName: author.lastName
    } : 'null'
  }));

  // Use user if available, otherwise fall back to author
  const userData = user || author;
  
  if (!userData) return 'Unknown User';
  
  // Use username if available
  if (userData.username) return userData.username;
  
  // Otherwise use first and last name
  const firstName = userData.firstName || '';
  const lastName = userData.lastName || '';
  
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  
  // Final fallback
  return 'Anonymous User';
};

// Gallery component for comment images
const CommentImageGallery = ({ media }: CommentImageGalleryProps) => {
  if (!media || media.length === 0) return null;
  
  const getCommentImageUrl = (mediaItem: MediaItem): string => {
    if (typeof mediaItem === 'string') {
      return getImageUrl(mediaItem);
    }
    return getImageUrl(mediaItem.url || mediaItem.uri);
  };

  // For a single image
  if (media.length === 1) {
    const imageUrl = getCommentImageUrl(media[0]);
    if (!imageUrl) return null;
    
    return (
      <View style={styles.commentImageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.commentSingleImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  // We won't implement multiple images for comments for simplicity
  return (
    <View style={styles.commentImageContainer}>
      <Image
        source={{ uri: getCommentImageUrl(media[0]) }}
        style={styles.commentSingleImage}
        resizeMode="cover"
      />
      {media.length > 1 && (
        <View style={styles.moreImagesIndicator}>
          <Text style={styles.moreImagesText}>+{media.length - 1}</Text>
        </View>
      )}
    </View>
  );
};

// Add the getCommentImageUrl function at file level (not inside any component)
const getCommentImageUrl = (comment: Comment): string | null => {
  // First try direct image field
  if (comment && comment.image) {
    return getImageUrl(comment.image);
  }
  
  // Then check media array
  if (comment && comment.media && comment.media.length > 0) {
    if (typeof comment.media[0] === 'string') {
      return getImageUrl(comment.media[0]);
    }
    return comment.media[0].url ? getImageUrl(comment.media[0].url) : null;
  }
  
  // If no image found
  return null;
};

// Gallery component for post images
const PostImageGallery = ({ media }: PostImageGalleryProps) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  if (!media || media.length === 0) return null;
  
  const processMediaUrl = (mediaItem: MediaItem): string => {
    if (typeof mediaItem === 'string') {
      return getImageUrl(mediaItem);
    }
    return mediaItem.url ? getImageUrl(mediaItem.url) : placeholderImage;
  };

  return (
    <View style={styles.galleryContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const pageWidth = width - 32; // Adjust for padding
          const newIndex = Math.round(offsetX / pageWidth);
          if (newIndex !== activeImageIndex) {
          setActiveImageIndex(newIndex);
          }
        }}
        scrollEventThrottle={200}
        style={styles.galleryScrollView}
      >
        {media.map((item, idx) => {
          const mediaUrl = processMediaUrl(item);
          if (!mediaUrl) return null;
          
          return (
              <Image
              key={idx}
                source={{ uri: mediaUrl }}
                style={styles.galleryImage}
              resizeMode="cover"
              onError={(e) => console.error(`Image load error:`, e.nativeEvent.error)}
              />
          );
        })}
      </ScrollView>
      
      {media.length > 1 && (
        <View style={styles.galleryPaginationContainer}>
          {media.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.galleryPaginationDot, 
                index === activeImageIndex && styles.galleryPaginationDotActive
              ]} 
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Optimize the hashtag regex pattern and add hashtag handling
const parseTextForHashtags = (text: string | undefined): ParsedTextPart[] => {
  if (!text) return [{ type: 'text' as const, content: '' }];
  
  // Improved regex that better matches hashtags
  const hashtagRegex = /#[a-zA-Z0-9_]+\b/g;
  
  // Find all hashtags in the text
  const hashtags = text.match(hashtagRegex) || [];
  
  // If no hashtags, return just the original text
  if (hashtags.length === 0) {
    return [{ type: 'text' as const, content: text }];
  }
  
  // Split text into parts with hashtags preserved
  let result: ParsedTextPart[] = [];
  let lastIndex = 0;
  
  // Find each hashtag position and split accordingly
  for (const hashtag of hashtags) {
    const hashtagIndex = text.indexOf(hashtag, lastIndex);
    
    // Add any text before the hashtag
    if (hashtagIndex > lastIndex) {
      result.push({ 
        type: 'text' as const, 
        content: text.substring(lastIndex, hashtagIndex)
      });
    }
    
    // Add the hashtag
    result.push({ 
      type: 'hashtag' as const, 
      content: hashtag,
      tag: hashtag.substring(1) // Store the tag without the # symbol
    });
    
    lastIndex = hashtagIndex + hashtag.length;
  }
  
  // Add any remaining text after the last hashtag
  if (lastIndex < text.length) {
    result.push({
      type: 'text' as const,
      content: text.substring(lastIndex)
    });
  }
  
  return result;
};

// Add a handler for hashtag taps
const handleHashtagPress = (tag: string, navigation: any) => {
  // Remove the # symbol if present
  const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
  
  // Set search term in the blogs screen and navigate back
  navigation.navigate('Blogs', { 
    searchTerm: cleanTag,
    searchByHashtag: true 
  });
};

// Add this helper function to get profile picture URL
const getProfilePictureUrl = (postData: Post): string => {
  // Log the data we're working with for debugging
  console.log("Getting profile picture from:", {
    hasUserData: !!postData?.user,
    hasAuthorData: !!postData?.author,
    userPic: postData?.user?.profilePicture,
    authorPic: postData?.author?.profilePicture
  });
  
  // Try to get profile picture from user or author
  const profilePicture = 
    postData?.user?.profilePicture || 
    postData?.author?.profilePicture;
  
  if (!profilePicture) {
    return placeholderImage;
  }
  
  return getImageUrl(profilePicture);
};

// Add this improved function to check for advisor role
const isUserAdvisor = (user: Author | undefined, author: Author | undefined): boolean => {
  // Debug log the data we're checking
  console.log('Checking advisor status for:', {
    userRole: user?.role,
    authorRole: author?.role,
  });
  
  // Check from post data if this is an advisor - use uppercase comparison
  const isAdvisor = 
    user?.role?.toUpperCase() === 'ADVISOR' || 
    author?.role?.toUpperCase() === 'ADVISOR';
  
  console.log('Is advisor result:', isAdvisor);
  return isAdvisor;
};

const PostDetail = ({ route, navigation }: PostDetailNavigationProps) => {
  const { postId } = route.params;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState<MediaItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentInputRef = useRef<TextInput | null>(null);
  const [content, setContent] = useState('');
  const [likeCount, setLikeCount] = useState(0);

  // Add the report reasons array
  const reportReasons = [
    'محتوى غير لائق',
    'محتوى مزعج',
    'معلومات مضللة',
    'تنمر أو مضايقة',
    'عنف',
    'خطاب كراهية',
    'أخرى'
  ];

  // Fetch post details including comments
  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      
      // Get current user data for authentication
      const userData = await storage.getUser();
      setCurrentUser(userData);
      console.log('Current user data:', userData);
      
      // Make authenticated API request
      const token = userData?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_URL}/posts/${postId}`, { headers });
      const postData = response.data;
      
      // Debug log the complete post data to see if roles are included
      console.log('Post author data:', {
        user: postData.user,
        author: postData.author,
        hasUserRole: !!postData.user?.role,
        hasAuthorRole: !!postData.author?.role
      });
      
      setPost(postData);
      setContent(postData.content);
      setLikeCount(postData.likesCount || 0);
      
      // Update likes and comments
      if (postData.likes?.length > 0) {
        setLiked(postData.likes.some((like: { userId: string }) => like.userId === userData?.id));
      }
      
      if (postData.comments) {
        setComments(postData.comments);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
      setLoading(false);
    }
  };

  // Update useEffect to also get the current user
  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  // Toggle like 
  const toggleLike = async () => {
    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/like`);
      
      const newLiked = !liked;
      setLiked(newLiked);
      
      // Update post with new like count
      setPost((prevPost: Post | null) => ({
        ...prevPost!,
        likesCount: newLiked 
          ? (prevPost?.likesCount || 0) + 1 
          : Math.max(0, (prevPost?.likesCount || 0) - 1)
      }));
    } catch (err) {
      console.error('Error toggling like:', err);
      Alert.alert('Error', 'Could not update like status. Please try again.');
    }
  };

  // Pick an image for a comment
  const pickCommentImage = async () => {
    try {
      // Check permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      // Launch image picker with better options
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Selected image:', result.assets[0]);
        
        // Create a properly formatted file object
        const selectedAsset = {
          uri: result.assets[0].uri,
          type: result.assets[0].type || 'image/jpeg',
          name: result.assets[0].fileName || 'photo.jpg'
        };
        
        // Update state with the selected image
        setCommentImage(selectedAsset);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Add this function to take a photo with the camera
  const takeCommentPhoto = async () => {
    try {
      // Check camera permissions first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Photo taken:', result.assets[0]);
        
        // Create a properly formatted file object
        const selectedAsset = {
          uri: result.assets[0].uri,
          type: result.assets[0].type || 'image/jpeg',
          name: `photo_${Date.now()}.jpg`
        };
        
        // Update state with the captured image
        setCommentImage(selectedAsset);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Add function to show image options
  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takeCommentPhoto
        },
        {
          text: 'Choose from Gallery',
          onPress: pickCommentImage
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    );
  };

  // Submit a new comment
  const submitComment = async () => {
    if (!newComment.trim() && !commentImage) {
      Alert.alert('تعليق فارغ', 'يرجى كتابة تعليق أو إضافة صورة.');
      return;
    }

    try {
      setIsSubmittingComment(true);
      
      // Get auth token
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        Alert.alert('تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول للتعليق على المنشورات.');
        setIsSubmittingComment(false);
        return;
      }

      // Create form data
      const formData = new FormData();
      formData.append('content', newComment.trim());

      // Add image if selected
      if (commentImage && commentImage.uri) {
        console.log('Adding image to comment:', commentImage);
        
        // Create a properly formatted file object that multer can process
        const fileUri = Platform.OS === 'android' 
          ? commentImage.uri 
          : commentImage.uri.replace('file://', '');
        
        // Extract file extension and determine MIME type
        const uriParts = commentImage.uri ? commentImage.uri.split('.') : [];
        const fileExtension = uriParts[uriParts.length - 1];
        
        let mimeType;
        if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
          mimeType = 'image/jpeg';
        } else if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else {
          mimeType = 'image/jpeg';  // Default to JPEG
        }
        
        // Add the file to form data
        formData.append('image', {
          uri: fileUri,
          name: `comment_image_${Date.now()}.${fileExtension}`,
          type: mimeType
        } as any);
        
        console.log('Appended image to form data:', {
          uri: fileUri ? fileUri.substring(0, 50) + '...' : 'undefined',
          type: mimeType
        });
      }

      // Log form data for debugging
      console.log('FormData created with:', {
        text: newComment.trim(),
        hasImage: !!commentImage
      });

      // Submit the comment
      const response = await axios({
        method: 'POST',
        url: `${API_URL}/posts/${postId}/comments`,
        data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${tokens.access}`
        }
      });

      console.log('Comment submitted successfully:', response.data);
      
      // Update the UI
      if (response.data) {
        // Add the new comment to the list
        const newCommentData = response.data;
        setComments(prevComments => [newCommentData, ...prevComments]);
        
        // Reset the form
      setNewComment('');
      setCommentImage(null);

        // Show confirmation
        console.log('Comment added successfully');
      }
    } catch (error: unknown) {
      console.error('Failed to submit comment:', error);
      
      const typedError = error as any;
      if (typedError.response) {
        Alert.alert('خطأ', `خطأ في الخادم: ${typedError.response.status}. يرجى المحاولة مرة أخرى.`);
      } else if (typedError.request) {
        Alert.alert('خطأ في الشبكة', 'تعذر الوصول إلى الخادم. يرجى التحقق من اتصالك.');
      } else {
        Alert.alert('خطأ', 'تعذر تحميل التعليق. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Time ago formatter for dates
  const timeAgo = (date: string): string => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} ث`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} د`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} س`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ي`;
    return `${Math.floor(diffInSeconds / 604800)} أ`;
  };

  // Update the renderComment function
  const renderComment = ({ item }: { item: Comment }) => {
    // Get user data from the comment
    const userData = item.user || item.author || {};
    
    // Debug log user data including role
    console.log('Comment user data:', {
      username: userData.username,
      role: userData.role,
      isAdvisor: isUserAdvisor(item.user, item.author)
    });
    
    // Get image URL using our helper function
    const imageUrl = getCommentImageUrl(item);
    
    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          {/* Comment author avatar */}
          {userData.profilePicture ? (
            <Image
              source={{ uri: getImageUrl(userData.profilePicture) }}
              style={styles.commentAvatar}
            />
          ) : (
            <View style={styles.commentAvatarPlaceholder}>
              <Text style={styles.commentAvatarInitial}>
                {(userData.firstName || userData.username || 'A').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={styles.commentContentContainer}>
            {/* Comment author name with advisor badge */}
            <View style={styles.commentAuthorRow}>
              <Text style={styles.commentUsername}>
                {formatUserName(item.user, item.author)}
              </Text>
              
              {/* Verified icon for advisor comments */}
              {isUserAdvisor(item.user, item.author) && (
                <MaterialIcons 
                  name="verified" 
                  size={14} 
                  color="#1F6AFF" 
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            
            {/* Comment content */}
            <Text style={styles.commentText}>{item.text}</Text>
            
            {/* Comment images */}
            {imageUrl && (
              <View style={styles.commentImageContainer}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.commentSingleImage}
                  resizeMode="cover"
                />
              </View>
            )}
            
            {/* Comment footer with timestamp */}
            <View style={styles.commentFooter}>
              <Text style={styles.commentTime}>
                {timeAgo(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Share post function
  const handleSharePost = async () => {
    if (!post) return;
    
    try {
      const url = `${process.env.EXPO_PUBLIC_WEBSITE_URL}/post/${post.id}`;
      const title = post.title || 'Check out this post';
      const message = `${title}\n\n${post.description || ''}\n\nShared from Fallah Smart`;
      
      const result = await Share.share(
        {
          title: title,
          message: Platform.OS === 'ios' ? message : message + '\n\n' + url,
          url: Platform.OS === 'ios' ? url : undefined, // URL only works on iOS
        },
        {
          // Only iOS
          subject: title,
          dialogTitle: 'Share this post',
          // Only Android
          tintColor: theme.colors.primary.base
        }
      );
      
      if (result.action === Share.sharedAction) {
        console.log('Post shared successfully');
        // You can track analytics here if needed
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Could not share this post. Please try again.');
    }
  };

  // Replace the handleReportPost function with this version
  const handleReportPost = () => {
    setReportModalVisible(true);
  };

  // Update the submitReport function to match blogs.tsx behavior
  const submitReport = async () => {
    if (!post || !reportReason || (reportReason === 'Other' && !customReason)) {
      Alert.alert('Error', 'Please provide a reason for reporting this post');
      return;
    }
    
    setIsSubmittingReport(true);
    
    try {
      const tokens = await storage.getTokens();
      if (!tokens || !tokens.access) {
        Alert.alert('Authentication Required', 'Please log in to report this post');
        setIsSubmittingReport(false);
        return;
      }
      
      // Fix: Use the correct API endpoint matching the backend route
      const response = await axios({
        method: 'POST',
        url: `${API_URL}/posts/${postId}/report`,
        data: {
        reason: reportReason === 'Other' ? customReason : reportReason
        },
        headers: {
          'Authorization': `Bearer ${tokens.access}`
        }
      });
      
      console.log('Report response:', response.data);
      
      // Close the modal first
      setReportModalVisible(false);
      
      // Reset form values
      setReportReason('');
      setCustomReason('');
      
      // Show success message after a brief delay (to allow modal to close)
      setTimeout(() => {
        Alert.alert(
          'Report Submitted',
          'Thank you for helping us maintain a safe community. We will review this post shortly.',
          [{ text: 'OK' }]
        );
      }, 300);
      
    } catch (error: unknown) {
      console.error('Error reporting post:', error);
      
      // Show more detailed error message based on the error
      const typedError = error as any;
      if (typedError.response) {
        Alert.alert('Error', 
          `Could not submit report (${typedError.response.status}). ${typedError.response.data?.message || 'Please try again later.'}`
        );
      } else {
        Alert.alert('Error', 'Could not submit report. Please check your connection and try again.');
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Loading state - enhanced design
  if (loading && !post) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={styles.loadingText}>جارِ التحميل...</Text>
      </SafeAreaView>
    );
  }

  // Error state - enhanced design
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <AntDesign name="exclamationcircleo" size={48} color={theme.colors.error} />
        <Text style={styles.errorTitle}>عفواً!</Text>
          <Text style={styles.errorText}>{error}</Text>
        <Button 
          title="حاول مرة أخرى" 
          onPress={fetchPostDetails}
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  // Main content render with enhanced styling
    return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <SafeAreaView style={styles.container}>
        {/* Enhanced header with shadow and better alignment */}
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>تفاصيل المنشور</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {post && (
            <View style={styles.postContainer}>
              {/* Post header with author info - enhanced design */}
              <View style={styles.postHeader}>
                {/* Author info section with verified badge */}
                <View style={styles.postAuthorSection}>
                  <View style={styles.authorContainer}>
                    {/* Author avatar */}
                    <View style={styles.authorImageWrapper}>
                      {post?.user?.profilePicture || post?.author?.profilePicture ? (
                        <Image
                          source={{ uri: getProfilePictureUrl(post) }}
                          style={styles.authorImage}
                          onError={(e) => {
                            console.log("Profile image load error:", e.nativeEvent.error);
                          }}
                        />
                      ) : (
                        <View style={styles.defaultAvatar}>
                          <Text style={styles.avatarText}>
                            {(formatUserName(post?.user, post?.author)).charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.authorDetails}>
                      <View style={styles.authorNameRow}>
                        <Text style={styles.authorName}>
                          {formatUserName(post?.user, post?.author)}
                        </Text>
                        
                        {/* Show verified icon for advisors */}
                        {isUserAdvisor(post?.user, post?.author) && (
                          <MaterialIcons 
                            name="verified" 
                            size={16} 
                            color="#1F6AFF"
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </View>
                      
                      <Text style={styles.postTime}>{timeAgo(post?.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Post content - enhanced styling */}
              <View style={styles.postContent}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postDescription}>
                  {parseTextForHashtags(post.description).map((part, index) => (
                    part.type === 'hashtag' ? (
                      <Text 
                        key={index} 
                        style={styles.hashtag}
                        onPress={() => handleHashtagPress(part.tag || '', navigation)}
                      >
                        {part.content}
                      </Text>
                    ) : (
                      <Text key={index}>{part.content}</Text>
                    )
                  ))}
                </Text>
          
                {/* Post images - kept as is */}
          {post.media && post.media.length > 0 && (
                  <PostImageGallery media={post.media} />
                )}
              </View>
              
              {/* Post stats with enhanced design */}
              <View style={styles.postStats}>
                <View style={styles.statsItem}>
                  <Ionicons name="heart" size={14} color={theme.colors.neutral.textSecondary} />
                  <Text style={styles.statsText}>{post.likesCount || 0} إعجاب</Text>
                </View>
                
                <View style={styles.statsItem}>
                  <Ionicons name="chatbubble-outline" size={14} color={theme.colors.neutral.textSecondary} />
                  <Text style={styles.statsText}>{post.comments?.length || 0} تعليق</Text>
                </View>
              </View>
              
              {/* Post actions with better icons */}
              <View style={styles.postActions}>
            <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={toggleLike}
                  disabled={loading}
                >
                  {liked ? (
                    <MaterialCommunityIcons 
                      name="sprout" 
                      size={24} 
                      color={theme.colors.primary.base} 
                    />
                  ) : (
                    <MaterialCommunityIcons 
                      name="sprout-outline" 
                      size={24} 
                      color={theme.colors.neutral.textSecondary} 
                    />
                  )}
                  <Text style={[
                    styles.actionText, 
                    liked && { color: theme.colors.primary.base }
                  ]}>
                    {post?.likesCount || 0}
                  </Text>
                </TouchableOpacity>
            
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => commentInputRef.current?.focus()}
                >
                  <MaterialCommunityIcons 
                    name="leaf" 
                    size={24} 
                    color={theme.colors.neutral.textSecondary} 
                  />
                  <Text style={styles.actionText}>
                    {comments.length}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleSharePost}
                >
                  <Ionicons 
                    name="share-social-outline" 
                    size={22} 
                    color={theme.colors.neutral.textPrimary} 
                  />
                  <Text style={styles.actionText}>مشاركة</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleReportPost}
                >
                  <Ionicons 
                    name="flag-outline" 
                    size={22} 
                    color={theme.colors.neutral.textPrimary} 
                  />
                  <Text style={styles.actionText}>إبلاغ</Text>
                </TouchableOpacity>
              </View>
              
              {/* Comments section with enhanced design */}
              <View style={styles.commentsSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="chatbubbles-outline" size={18} color={theme.colors.neutral.textPrimary} />
                  <Text style={styles.commentsHeader}>
                    التعليقات ({comments.length})
              </Text>
            </View>
            
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <View key={comment.id} style={styles.commentContainer}>
                      {renderComment({ item: comment })}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCommentsContainer}>
                    <Ionicons 
                      name="chatbubble-ellipses-outline" 
                      size={48} 
                      color={theme.colors.neutral.gray.base} 
                    />
                    <Text style={styles.noCommentsText}>
                      لا توجد تعليقات بعد. كن أول من يعلق!
              </Text>
            </View>
                )}
          </View>
            </View>
          )}
        </ScrollView>
        
        {/* Comment input area with improved design */}
        <View style={styles.commentInputContainer}>
          {/* Image preview - show this when an image is selected */}
          {commentImage && (
            <View style={styles.commentImagePreviewContainer}>
              <Image 
                source={{ uri: commentImage.uri }}
                style={styles.commentImagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setCommentImage(null)}
              >
                <FontAwesome name="remove" size={18} color="white" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.commentInputRow}>
            <TextInput
              ref={commentInputRef}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="اكتب تعليقًا..."
              placeholderTextColor={theme.colors.neutral.textSecondary}
              style={styles.commentInput}
              multiline={true}
            />
            
            <View style={styles.commentInputActions}>
              <TouchableOpacity 
                style={styles.attachmentButton} 
                onPress={showImageOptions}
              >
                <Feather name="camera" size={24} color={theme.colors.primary.base} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.sendButton, 
                  { opacity: (newComment.trim() || commentImage) ? 1 : 0.5 }
                ]} 
                onPress={submitComment}
                disabled={!newComment.trim() && !commentImage}
              >
                <Ionicons name="send" size={24} color={theme.colors.primary.base} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
      
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
              <Text style={styles.reportModalTitle}>الإبلاغ عن منشور</Text>
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
            
            <Text style={styles.reportModalSubtitle}>لماذا تريد الإبلاغ عن هذا المنشور؟</Text>
            
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
                  placeholder="يرجى تحديد السبب"
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
                <Text style={styles.reportCancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.reportSubmitButton,
                  (!reportReason || (reportReason === 'Other' && !customReason) || isSubmittingReport) && 
                    styles.reportSubmitButtonDisabled
                ]}
                onPress={submitReport}
                disabled={!reportReason || (reportReason === 'Other' && !customReason) || isSubmittingReport}
              >
                {isSubmittingReport ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.reportSubmitButtonText}>إرسال</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// Enhanced styles with better visual hierarchy and spacing
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.neutral.textSecondary,
    fontFamily: theme.fonts.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.neutral.surface,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    minWidth: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
  },
  headerRight: {
    width: 36, // Balance with back button
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    backgroundColor: theme.colors.primary.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorAvatarInitial: {
    fontSize: 20,
    color: 'white',
    fontFamily: theme.fonts.bold,
  },
  postHeaderInfo: {
    flex: 1,
  },
  authorInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 4,
  },
  postTimestamp: {
    fontSize: 13,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginLeft: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.light + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
  },
  postContent: {
    marginBottom: 16,
  },
  postTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    lineHeight: 24,
    marginBottom: 16,
  },
  galleryContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    backgroundColor: theme.colors.neutral.gray.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  galleryScrollView: {
    borderRadius: 12,
  },
  galleryImage: {
    width: width - 32, // Adjust for padding
    height: 240,
    borderRadius: 12,
  },
  galleryPaginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
  },
  galleryPaginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  galleryPaginationDotActive: {
    backgroundColor: 'white',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  postStats: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statsText: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginLeft: 4,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.neutral.border,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    color: theme.colors.neutral.textPrimary,
    marginLeft: 4,
    fontFamily: theme.fonts.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentsSection: {
    marginTop: 8,
  },
  commentsHeader: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginLeft: 8,
  },
  emptyCommentsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCommentsText: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.gray.base || '#8A8A8A',
    textAlign: 'center',
    marginTop: 8,
  },
  commentContainer: {
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginTop: 2,
  },
  commentAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  commentAvatarInitial: {
    fontSize: 16,
    color: 'white',
    fontFamily: theme.fonts.bold,
  },
  commentContentContainer: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: 'rgba(0,0,0,0.03)', // Very light gray that's almost white
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  commentUsername: {
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary || '#333333',
  },
  commentFooter: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'center',
  },
  commentTime: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary || '#8A8A8A',
  },
  commentImageContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
    backgroundColor: theme.colors.neutral.gray.light,
  },
  commentSingleImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  commentInputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    backgroundColor: theme.colors.neutral.surface,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    backgroundColor: '#FFFFFF',
    color: theme.colors.neutral.textPrimary,
  },
  commentInputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  attachmentButton: {
    padding: 6,
  },
  sendButton: {
    padding: 6,
    marginLeft: 4,
  },
  commentImagePreviewContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  commentImagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reportModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  reportModalTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
  },
  reportModalSubtitle: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 16,
  },
  reportReasonsList: {
    marginBottom: 16,
  },
  reportReasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  reportReasonItemSelected: {
    backgroundColor: `${theme.colors.primary.base}10`,
  },
  reportReasonText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
  customReasonContainer: {
    marginBottom: 16,
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlignVertical: 'top',
  },
  reportModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  reportCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
  },
  reportCancelButtonText: {
    color: theme.colors.neutral.textPrimary,
    fontFamily: theme.fonts.medium,
    fontSize: 16,
  },
  reportSubmitButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  reportSubmitButtonDisabled: {
    backgroundColor: theme.colors.primary.disabled,
  },
  reportSubmitButtonText: {
    color: 'white',
    fontFamily: theme.fonts.medium,
    fontSize: 16,
  },
  imageSourceIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageSourceText: {
    color: 'white',
    fontSize: 12,
    fontFamily: theme.fonts.medium,
  },
  hashtag: {
    color: theme.colors.primary.base,
    fontWeight: '600',
  },
  postAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorDetails: {
    flex: 1,
  },
  postTime: {
    fontSize: 13,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  authorImageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    overflow: 'hidden',
  },
  authorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    color: 'white',
    fontFamily: theme.fonts.bold,
  },
  moreImagesIndicator: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moreImagesText: {
    color: 'white',
    fontSize: 12,
    fontFamily: theme.fonts.medium,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
});

export default PostDetail;