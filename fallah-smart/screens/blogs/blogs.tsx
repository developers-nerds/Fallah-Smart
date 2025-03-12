import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Share,
  Animated
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons, Feather, MaterialIcons, Ionicons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { storage } from '../../utils/storage';

import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

// Update API URL constants
const BASE_URL = process.env.EXPO_PUBLIC_API;
const BLOG_URL = process.env.EXPO_PUBLIC_BlOG;
const API_URL = `${BASE_URL}/api/blog`;

// Define blog categories with farmer-friendly icons
const CATEGORIES = [
  { 
    value: 'CROPS',
    label: 'Crops',
    icon: 'sprout',
    iconType: 'material' 
  },
  { 
    value: 'LIVESTOCK',
    label: 'Livestock',
    icon: 'cow',
    iconType: 'material'
  },
  { 
    value: 'EQUIPMENT',
    label: 'Equipment',
    icon: 'tractor',
    iconType: 'fontawesome'
  },
  { 
    value: 'WEATHER',
    label: 'Weather',
    icon: 'weather-sunny',
    iconType: 'material'
  },
  { 
    value: 'MARKET',
    label: 'Market',
    icon: 'store',
    iconType: 'material'
  },
  { 
    value: 'TIPS',
    label: 'Tips & Tricks',
    icon: 'lightbulb-outline',
    iconType: 'material'
  }
];

// Update the image URL handling in the PostItem component
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) {
    return imageUrl.replace(/http:\/\/\d+\.\d+\.\d+\.\d+:\d+/, BASE_URL);
  }
  return `${BASE_URL}${imageUrl}`;
};

// First, create a new PostItem component at the top of your file (after imports)
const PostItem = ({ item, navigation, handlePostLike, handleCommentAdded, timeAgo, renderCategoryIcon, BASE_URL, openReportModal, handleSharePost, isCurrentUserPost, currentUserRole, currentUser }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const handleImagePress = (e) => {
    e.stopPropagation();
  };
  
  // Get the user data from the post
  const userData = item.user || item.author || {};
  
  // Check if this post is from an advisor
  const isAdvisor = userData.role?.toUpperCase() === 'ADVISOR';
  
  return (
    <TouchableOpacity
      style={[
        styles.postCard,
        // Apply refined styling for advisor posts
        isAdvisor && styles.advisorPostCard
      ]}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
    >
      {/* Elegant advisor badge with refined styling */}
      {isAdvisor && (
        <View style={styles.advisorBadge}>
          <LinearGradient
            colors={['#3172FF', '#1F6AFF']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.advisorBadgeGradient}
          >
            <MaterialIcons name="verified" size={14} color="#FFFFFF" />
            <Text style={styles.advisorBadgeText}>ADVISOR</Text>
          </LinearGradient>
        </View>
      )}
      
      {/* Post Header with enhanced styling */}
      <View style={[
        styles.postHeader,
        isAdvisor && styles.advisorPostHeader
      ]}>
        <View style={styles.authorContainer}>
          {/* Author avatar with elegant styling */}
          <View style={[
            styles.authorImageWrapper,
            isAdvisor && styles.advisorImageWrapper
          ]}>
            {userData.profilePicture ? (
              <Image 
                source={{ uri: getImageUrl(userData.profilePicture) }} 
                style={styles.authorImage}
              />
            ) : (
              <LinearGradient
                colors={isAdvisor ? ['#4F8DFF', '#1F6AFF'] : ['#6D7B93', '#505A69']}
                style={[
                  styles.authorImagePlaceholder,
                  isAdvisor && styles.advisorImagePlaceholder
                ]}
              >
                <Text style={styles.authorImageInitial}>
                  {(userData.firstName || userData.username || 'A').charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
          </View>
          
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={[
                styles.authorName,
                isAdvisor && styles.advisorName
              ]}>
                {userData.username || 
                  (userData.firstName && userData.lastName 
                    ? `${userData.firstName} ${userData.lastName}`
                    : 'Anonymous')}
              </Text>
              
              {/* Refined verification icon with subtle animation */}
              {isAdvisor && (
                <MaterialIcons 
                  name="verified" 
                  size={16} 
                  color="#1F6AFF" 
                  style={styles.verifiedIcon}
                />
              )}
            </View>
            <Text style={[
              styles.postTime,
              isAdvisor && styles.advisorPostTime
            ]}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>
        </View>
        
        {/* Category chip */}
        {item.category && (
          <View style={styles.categoryChipContainer}>
            {renderCategoryIcon(item.category)}
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
      </View>
      
      {/* Content with refined typography for advisor posts */}
      <View style={[
        styles.postContent,
        isAdvisor && styles.advisorPostContent
      ]}>
        <Text style={[
          styles.postTitle,
          isAdvisor && styles.advisorPostTitle
        ]}>
          {item.title || ''}
        </Text>
        
        <Text 
          style={[
            styles.postDescription,
            isAdvisor && styles.advisorPostDescription
          ]} 
          numberOfLines={3}
        >
          {item.description || ''}
        </Text>
      </View>
      
      {/* Post images */}
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
      
      {/* Post footer with interactions */}
      <View style={styles.postFooter}>
        {/* Left side: Like and comment counts */}
        <View style={styles.postStats}>
          {/* Like button */}
          <TouchableOpacity 
            style={styles.postActionButton} 
            onPress={() => handlePostLike(item.id)}
            activeOpacity={0.7}
          >
            <AntDesign 
              name={item.userLiked ? "heart" : "hearto"} 
              size={22} 
              color={item.userLiked ? theme.colors.error.base : theme.colors.neutral.textSecondary} 
            />
            <Text style={styles.postActionText}>
              {item.likesCount || 0}
            </Text>
          </TouchableOpacity>
          
          {/* Comment button */}
          <TouchableOpacity 
            style={styles.postAction}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            activeOpacity={0.7}
          >
            <Feather 
              name="message-circle" 
              size={22} 
              color={theme.colors.neutral.textSecondary} 
            />
            <Text style={styles.postActionText}>
              {item.commentsCount || 0}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Right side: Share and report buttons */}
        <View style={styles.postActions}>
          {/* Share button */}
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => handleSharePost(item)}
            activeOpacity={0.7}
          >
            <Feather 
              name="share" 
              size={20} 
              color={theme.colors.neutral.textSecondary} 
            />
          </TouchableOpacity>
          
          {/* Report button */}
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => openReportModal(item)}
            activeOpacity={0.7}
          >
            <Feather 
              name="flag" 
              size={20} 
              color={theme.colors.neutral.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// Add proper types at the top of the file
interface Author {
  firstName?: string;
  lastName?: string;
  username: string;
  profilePicture?: string;
}

interface Post {
  id: string;
  title: string;
  description?: string;
  category: string;
  author: Author;
  media?: Array<{ url: string }>;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  userLiked: boolean;
}

// Update the SearchBar component to a simpler version
const SearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <View style={styles.searchContainer}>
      <MaterialIcons 
        name="search" 
        size={24} 
        color={theme.colors.neutral.textSecondary} 
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Search posts..."
        placeholderTextColor={theme.colors.neutral.textSecondary}
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      {searchTerm ? (
        <TouchableOpacity onPress={() => setSearchTerm('')}>
          <MaterialIcons 
            name="close" 
            size={20} 
            color={theme.colors.neutral.textSecondary} 
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const Blogs = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    category: 'CROPS'
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [postToReport, setPostToReport] = useState(null);
  const [customReason, setCustomReason] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const searchDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
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
      
      // Get current user for authorization header
      const userData = await storage.getUser();
      console.log('Current user data:', userData);
      
      // Set user data in state
      if (userData) {
        setCurrentUser(userData);
        setUserRole(userData.role);
      }
      
      // Make the API request with auth token if available
      const token = userData?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_URL}/posts`, { headers });
      
      // Log the first post's complete data structure to see what we're receiving
      if (response.data.length > 0) {
        console.log('First post data structure:', JSON.stringify(response.data[0], null, 2));
        console.log('User object in post:', response.data[0].user || response.data[0].author);
      }
      
      setPosts(response.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
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
        category: 'CROPS'
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
    const categoryConfig = CATEGORIES.find(c => c.value === category);
    if (!categoryConfig) return null;

    switch (categoryConfig.iconType) {
      case 'material':
        return (
          <MaterialCommunityIcons 
            name={categoryConfig.icon} 
            size={24} 
            color={theme.colors.primary.base}
            style={styles.categoryIcon} 
          />
        );
      case 'fontawesome':
        return (
          <FontAwesome5 
            name={categoryConfig.icon} 
            size={20} 
            color={theme.colors.primary.base}
            style={styles.categoryIcon} 
          />
        );
      default:
        return null;
    }
  };

  // Add a function to handle post likes within the Blogs component
  const handlePostLike = async (postId) => {
    // Skip API calls for duplicated posts
    if (postId.toString().includes('enhanced-')) {
      // Extract the original post ID
      const originalId = postId.toString().split('-')[1];
      // Handle the original post instead
      return handlePostLike(originalId);
    }
    
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
  const renderPostItem = ({ item }) => {
    const isCurrentUserPost = currentUser && item.userId === currentUser.id;
    
    return (
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
        isCurrentUserPost={isCurrentUserPost}
        currentUserRole={userRole}
        currentUser={currentUser}
      />
    );
  };

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

  // Update filteredPosts to include search
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    
    return posts.filter(post => {
      // Category filter
      const categoryMatch = selectedCategory === 'all' || post.category === selectedCategory;
      
      // Search filter
      const searchMatch = !searchTerm || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return categoryMatch && searchMatch;
    });
  }, [posts, selectedCategory, searchTerm]);

  // Prepare data for FlatList with enhanced advisor visibility
  const enhancedPostsData = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    
    // Create a new array with advisor posts duplicated for more visibility
    const enhancedPosts = [...posts];
    
    // Find advisor posts
    const advisorPosts = posts.filter(post => post.user?.role === 'ADVISOR');
    
    // Only enhance if we have advisor posts and regular posts
    if (advisorPosts.length > 0 && advisorPosts.length < posts.length) {
      // For every 3 regular posts, insert an advisor post
      for (let i = 2; i < enhancedPosts.length; i += 3) {
        // Pick a random advisor post to insert
        const randomAdvisorPost = advisorPosts[Math.floor(Math.random() * advisorPosts.length)];
        // Insert a copy with a unique temporary id for React keys
        enhancedPosts.splice(i, 0, {
          ...randomAdvisorPost,
          id: `enhanced-${randomAdvisorPost.id}-${i}`,
          _isEnhancedDuplicate: true // Flag to identify duplicates
        });
      }
    }
    
    return enhancedPosts;
  }, [posts]);

  // Add this category filter component
  const CategoryFilter = () => (
    <Animated.View style={[
      styles.categoryFilterContainer,
      {
        transform: [{
          translateY: scrollY.interpolate({
            inputRange: [-50, 0, 50],
            outputRange: [0, 0, -100],
            extrapolate: 'clamp'
          })
        }]
      }
    ]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.categoryChipSelected
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryChipText,
            selectedCategory === 'all' && styles.categoryChipTextSelected
          ]}>
            All
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryChip,
              selectedCategory === category.value && styles.categoryChipSelected
            ]}
            onPress={() => setSelectedCategory(category.value)}
          >
            {category.iconType === 'material' ? (
              <MaterialCommunityIcons
                name={category.icon}
                size={18}
                color={selectedCategory === category.value ? 
                  theme.colors.neutral.surface : 
                  theme.colors.primary.base
                }
                style={styles.categoryChipIcon}
              />
            ) : (
              <FontAwesome5
                name={category.icon}
                size={16}
                color={selectedCategory === category.value ? 
                  theme.colors.neutral.surface : 
                  theme.colors.primary.base
                }
                style={styles.categoryChipIcon}
              />
            )}
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.value && styles.categoryChipTextSelected
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

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
        <AnimatedFlatList
          data={enhancedPostsData}
          renderItem={renderPostItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.postsList}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          ListHeaderComponent={
            <>
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
              <CategoryFilter />
            </>
          }
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchPosts}
              colors={[theme.colors.primary.base]}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons 
                  name={searchTerm ? "file-search-outline" : "post-outline"}
                  size={48} 
                  color={theme.colors.neutral.textSecondary} 
                />
                <Text style={styles.emptyTitle}>
                  {searchTerm ? "No matching posts found" : "No posts yet"}
                </Text>
                <Text style={styles.emptyText}>
                  {searchTerm 
                    ? "Try adjusting your search or category filter"
                    : "Be the first to share something with the community!"}
                </Text>
              </View>
            )
          }
        />
      )}
      
      {/* Become an Advisor button */}
      <TouchableOpacity
        style={[styles.askCommunityButton, styles.becomeAdvisorButton]}
        onPress={() => navigation.navigate('AdvisorApplication')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="verified-user" size={24} color="white" />
        <Text style={styles.askCommunityText}>Become an Advisor</Text>
      </TouchableOpacity>
      
      {/* Ask Community button with verified badge overlay */}
      <View style={{position: 'relative'}}>
        {/* Verified badge positioned ABOVE the button */}
        <View style={styles.advisorBadgeOverlay}>
          <MaterialIcons 
            name="verified" 
            size={24} 
            color="#1F6AFF" 
          />
        </View>
        
        <TouchableOpacity
          style={styles.askCommunityButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="comment-question-outline" size={24} color="white" />
          <Text style={styles.askCommunityText}>Ask Community</Text>
        </TouchableOpacity>
      </View>
      
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
    padding: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorImageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutral.gray.light,
  },
  authorImage: {
    width: '100%',
    height: '100%',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  authorInfo: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
  },
  postTime: {
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
    marginTop: 2,
  },
  categoryChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.neutral.textPrimary,
    marginLeft: 4,
    fontWeight: '500',
  },
  postContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.textPrimary,
    marginBottom: 4,
  },
  postDescription: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  postActionText: {
    marginLeft: 6,
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    fontFamily: theme.fonts.regular,
  },
  iconButton: {
    padding: 6,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    fontFamily: theme.fonts.medium,
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
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryIcon: {
    marginRight: 6,
  },
  dateText: {
    color: theme.colors.neutral.textSecondary,
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
    paddingTop: 12,
  },
  categoryFilterContainer: {
    backgroundColor: theme.colors.neutral.surface,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    zIndex: 1,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.fade,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary.fade,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary.base,
    borderColor: theme.colors.primary.base,
  },
  categoryChipIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    color: theme.colors.primary.base,
    fontSize: 14,
    fontFamily: theme.fonts.medium,
  },
  categoryChipTextSelected: {
    color: theme.colors.neutral.surface,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: 12,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    fontFamily: theme.fonts.regular,
  },
  askCommunityButton: {
    backgroundColor: theme.colors.primary.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    position: 'absolute',
    bottom: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  askCommunityText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  advisorBadgeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  becomeAdvisorButton: {
    bottom: 80, // Lower position (was 150, now 80)
    backgroundColor: '#1F6AFF', // Different color to distinguish it
  },
  advisorPostCard: {
    borderWidth: 1,
    borderColor: '#e8f1ff',
    backgroundColor: '#f2f8ff',
    borderRadius: 12,
    shadowColor: '#1F6AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 10,
    overflow: 'hidden',
  },
  advisorPostHeader: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingVertical: 12,
  },
  advisorImageWrapper: {
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  advisorImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  advisorImageInitial: {
    color: 'white',
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  advisorName: {
    color: '#1a73e8',
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
  },
  verifiedIcon: {
    marginLeft: 4,
    color: '#1a73e8',
  },
  advisorPostTime: {
    color: '#5D82B3',
  },
  advisorPostContent: {
    padding: 16,
    backgroundColor: 'rgba(240, 247, 255, 0.3)',
  },
  advisorPostTitle: {
    color: '#0B3D96',
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    letterSpacing: 0.3,
  },
  advisorPostDescription: {
    color: '#2B5C9E',
    fontFamily: theme.fonts.regular,
    lineHeight: 22,
  },
  advisorBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 50,
    overflow: 'hidden',
    elevation: 2,
    zIndex: 10,
  },
  advisorBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: '#1a73e8',
  },
  advisorBadgeText: {
    color: 'white',
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    marginLeft: 6,
  },
});

export default Blogs;