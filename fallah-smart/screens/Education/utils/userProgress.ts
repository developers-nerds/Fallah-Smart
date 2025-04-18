import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Get user ID from stored user data
export const getUserIdFromToken = async (setError?: (error: string) => void, setLoading?: (loading: boolean) => void): Promise<number | null> => {
  try {
    const userStr = await AsyncStorage.getItem("@user");
    if (!userStr) {
      setError && setError("لم يتم العثور على بيانات المستخدم. الرجاء تسجيل الدخول.");
      setLoading && setLoading(false);
      return null;
    }
    const userData = JSON.parse(userStr);
    return userData.id;
  } catch (error) {
    setError && setError("بيانات المستخدم غير صالحة. الرجاء تسجيل الدخول مرة أخرى.");
    setLoading && setLoading(false);
    return null;
  }
};

// Get the current user data from storage
export const getCurrentUser = async (): Promise<any | null> => {
  try {
    const userStr = await AsyncStorage.getItem("@user");
    if (!userStr) {
      return null;
    }
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error retrieving user data:", error);
    return null;
  }
};

// Get user name and profile picture
export const getUserData = async (): Promise<{ username: string; profilePicture: string } | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }
    return {
      username: user.username || 'مستخدم',
      profilePicture: user.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
    };
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

// Get the auth token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("userToken");
  } catch (error) {
    console.error("Error retrieving auth token:", error);
    return null;
  }
};

// Get user progress for a specific quiz
export const getUserProgressForQuiz = async (userId: number, quizId: number): Promise<any | null> => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(
      `${API_URL}/education/userProgress/user/${userId}/quiz/${quizId}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching progress for quiz ${quizId}:`, error);
    return null;
  }
};

// Get all user progress
export const getAllUserProgress = async (userId: number): Promise<any[]> => {
  try {
    console.log(`Fetching all progress for user ID: ${userId}`);
    
    const token = await getAuthToken();
    const url = `${API_URL}/education/userProgress/user/${userId}`;
    
    console.log(`API request URL: ${url}`);
    
    const response = await axios.get(
      url,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    console.log(`API response status: ${response.status}`);
    console.log(`Received ${response.data?.length || 0} progress entries`);
    
    // Log quiz IDs and scores
    if (response.data && Array.isArray(response.data)) {
      const quizEntries = response.data.filter(entry => entry.quizId && entry.Education_Quiz);
      console.log(`Found ${quizEntries.length} quiz entries`);
      
      quizEntries.forEach(entry => {
        console.log(`Quiz ID: ${entry.quizId}, Type: ${entry.Education_Quiz?.type}, Score: ${entry.score}`);
      });
    }
    
    return response.data || [];
  } catch (error) {
    console.error(`Error fetching all user progress:`, error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API error response:', error.response.data);
      console.error('API error status:', error.response.status);
    }
    return [];
  }
};

// Get completed quiz count
export const getCompletedQuizCount = async (userId: number): Promise<number> => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(
      `${API_URL}/education/userProgress/user/${userId}/completed-count`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    return response.data?.completedQuizzes || 0;
  } catch (error) {
    console.error(`Error fetching completed quiz count:`, error);
    return 0;
  }
};

// Get total counts for animals and crops
export const getTotalCounts = async (): Promise<{ animals: number; crops: number }> => {
  try {
    // Fetch animals count
    const animalsResponse = await axios.get(`${API_URL}/education/animals`);
    const animalsTotal = animalsResponse.data.length;
    
    // Fetch crops count
    const cropsResponse = await axios.get(`${API_URL}/education/crops`);
    const cropsTotal = cropsResponse.data.length;
    
    return { animals: animalsTotal, crops: cropsTotal };
  } catch (error) {
    console.error('Error fetching total counts:', error);
    // If all else fails, return hardcoded defaults
    return { animals: 7, crops: 31 };
  }
};

// Save or update user progress
export const saveUserProgress = async (
  userId: number, 
  quizId: number, 
  score: number, 
  completed: boolean = true
): Promise<boolean> => {
  try {
    console.log(`Saving progress - User ID: ${userId}, Quiz ID: ${quizId}, Score: ${score}, Completed: ${completed}`);
    
    // First, try to get quiz details to verify we're saving to the correct quiz
    try {
      const quizDetails = await getQuizDetails(quizId);
      if (quizDetails) {
        console.log(`Verified quiz ID ${quizId} is for: ${quizDetails.title}, Type: ${quizDetails.type}`);
      } else {
        console.warn(`Could not verify quiz ID ${quizId} - quiz details not found`);
      }
    } catch (error) {
      console.warn(`Error verifying quiz ID ${quizId}:`, error);
    }
    
    const token = await getAuthToken();
    const payload = { userId, quizId, score, completed };
    
    console.log('Request payload:', payload);
    
    const response = await axios.post(
      `${API_URL}/education/userProgress`,
      payload,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    console.log('API response status:', response.status);
    console.log('API response data:', response.data);
    
    return true;
  } catch (error) {
    console.error(`Error saving user progress:`, error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API error response:', error.response.data);
      console.error('API error status:', error.response.status);
    }
    return false;
  }
};

// Save video progress
// export const saveVideoProgress = async (
//   userId: number,
//   videoId: number,
//   completed: boolean = true
// ): Promise<boolean> => {
//   try {
//     const token = await getAuthToken();
//     await axios.post(
//       `${API_URL}/education/userProgress`,
//       { 
//         userId, 
//         videoId, 
//         score: 100, // Videos are always 100% when watched
//         completed 
//       },
//       token ? { headers: { Authorization: `Bearer ${token}` } } : {}
//     );
//     return true;
//   } catch (error) {
//     console.error(`Error saving video progress:`, error);
//     return false;
//   }
// };

// Calculate total progress
export const calculateTotalProgress = (
  userProgress: any[], 
  totalQuizzes: number
): { completedCount: number; totalScore: number; progressPercentage: number } => {
  const completedCount = userProgress.length;
  const totalScore = userProgress.reduce((sum, progress) => sum + progress.score, 0);
  const progressPercentage = totalQuizzes > 0 ? totalScore / (totalQuizzes * 100) : 0;
  
  return { completedCount, totalScore, progressPercentage };
};

// Get quiz details by ID
export const getQuizDetails = async (quizId: number): Promise<any | null> => {
  try {
    console.log(`Fetching details for quiz ID: ${quizId}`);
    
    const token = await getAuthToken();
    const url = `${API_URL}/education/quizzes/${quizId}`;
    
    console.log(`API request URL: ${url}`);
    
    const response = await axios.get(
      url,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    console.log(`API response status: ${response.status}`);
    console.log(`Quiz details:`, response.data);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching quiz details for ID ${quizId}:`, error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API error response:', error.response.data);
      console.error('API error status:', error.response.status);
    }
    return null;
  }
};

// Q&A API Functions
export const getQuestionsByVideoId = async (videoId: string | number, videoType?: 'animal' | 'crop'): Promise<any[]> => {
  try {
    if (!videoId) {
      console.error('getQuestionsByVideoId called with invalid videoId:', videoId);
      return [];
    }
    
    const numericVideoId = typeof videoId === 'string' ? parseInt(videoId, 10) : videoId;
    
    if (isNaN(numericVideoId)) {
      console.error(`Invalid videoId format: ${videoId}`);
      return [];
    }
    
    console.log(`Fetching questions for video ID: ${numericVideoId}, type: ${videoType || 'unknown'}`);
    
    const token = await getAuthToken();
    // Add timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    const url = `${API_URL}/education/questionsAndAnswers/video/${numericVideoId}?_t=${timestamp}`;
    
    console.log(`API request URL: ${url}`);
    
    const response = await axios.get(
      url,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    console.log(`API response status: ${response.status}, data length: ${response.data?.length || 0}`);
    
    if (!response.data || !Array.isArray(response.data)) {
      console.warn(`Unexpected response format for video ID ${numericVideoId}:`, response.data);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching questions for video ${videoId}:`, error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API error response:', error.response.data);
      console.error('API error status:', error.response.status);
    }
    return [];
  }
};

export const createQuestion = async (text: string, videoId: string | number, videoType?: 'animal' | 'crop'): Promise<any | null> => {
  try {
    if (!videoId) {
      console.error('createQuestion called with invalid videoId:', videoId);
      return null;
    }
    
    if (!text || !text.trim()) {
      console.error('createQuestion called with empty text');
      return null;
    }
    
    const token = await getAuthToken();
    const userData = await getUserData();
    const userId = await getUserIdFromToken();
    
    if (!userData || !userId) {
      console.error("Cannot create question: User data not available");
      return null;
    }
    
    // Convert to numeric ID
    const numericVideoId = typeof videoId === 'string' ? parseInt(videoId, 10) : videoId;
    
    if (isNaN(numericVideoId)) {
      console.error(`Invalid videoId format: ${videoId}`);
      return null;
    }
    
    console.log(`Creating question for video ID: ${numericVideoId}, type: ${videoType || 'unknown'}, user: ${userId}`);
    
    const requestPayload = {
      text,
      authorName: userData.username,
      authorImage: userData.profilePicture,
      timestamp: new Date(),
      likesisClicked: false, // Initialize as not liked
      videoId: numericVideoId,
      userId
    };
    
    console.log('Request payload:', requestPayload);
    
    const response = await axios.post(
      `${API_URL}/education/questionsAndAnswers`,
      requestPayload,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    console.log(`Create question response status: ${response.status}`);
    console.log('Created question:', response.data);
    
    return response.data;
  } catch (error) {
    console.error("Error creating question:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API error response:', error.response.data);
      console.error('API error status:', error.response.status);
    }
    return null;
  }
};

export const updateQuestion = async (questionId: string, text: string): Promise<any | null> => {
  try {
    const token = await getAuthToken();
    const userId = await getUserIdFromToken();
    
    if (!userId) {
      console.error("Cannot update question: User data not available");
      return null;
    }
    
    const response = await axios.put(
      `${API_URL}/education/questionsAndAnswers/${questionId}`,
      { text, userId },
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error updating question ${questionId}:`, error);
    return null;
  }
};

export const deleteQuestion = async (questionId: string): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    const userId = await getUserIdFromToken();
    
    if (!userId) {
      console.error("Cannot delete question: User data not available");
      return false;
    }
    
    // Send userId in the request body for owner verification
    const response = await axios.delete(
      `${API_URL}/education/questionsAndAnswers/${questionId}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        data: { userId } // Include userId in request body
      }
    );
    
    return response.status === 200;
  } catch (error) {
    console.error(`Error deleting question ${questionId}:`, error);
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Server returned status: ${error.response.status}`);
      console.error('Error response data:', error.response.data);
    }
    return false;
  }
};

export const createReply = async (text: string, questionAndAnswerId: string): Promise<any | null> => {
  try {
    const token = await getAuthToken();
    const userData = await getUserData();
    const userId = await getUserIdFromToken();
    
    if (!userData || !userId) {
      console.error("Cannot create reply: User data not available");
      return null;
    }
    
    console.log(`Creating reply for question ${questionAndAnswerId} by user ${userId}`);
    
    const payload = {
      text,
      authorName: userData.username,
      authorImage: userData.profilePicture,
      timestamp: new Date(),
      likesisClicked: false, // Initialize as not liked
      questionAndAnswerId: parseInt(questionAndAnswerId),
      userId
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(
      `${API_URL}/education/replies`,
      payload,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    console.log(`Reply creation response status: ${response.status}`);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error("Error creating reply:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Server returned status: ${error.response.status}`);
      console.error('Error response data:', error.response.data);
    }
    return null;
  }
};

export const updateReply = async (replyId: string, text: string): Promise<any | null> => {
  try {
    const token = await getAuthToken();
    const userId = await getUserIdFromToken();
    
    if (!userId) {
      console.error("Cannot update reply: User data not available");
      return null;
    }
    
    const response = await axios.put(
      `${API_URL}/education/replies/${replyId}`,
      { text, userId },
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error updating reply ${replyId}:`, error);
    return null;
  }
};

export const deleteReply = async (replyId: string): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    const userId = await getUserIdFromToken();
    
    if (!userId) {
      console.error("Cannot delete reply: User data not available");
      return false;
    }
    
    // Send userId in the request body for owner verification
    const response = await axios.delete(
      `${API_URL}/education/replies/${replyId}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        data: { userId } // Include userId in request body
      }
    );
    
    return response.status === 200;
  } catch (error) {
    console.error(`Error deleting reply ${replyId}:`, error);
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Server returned status: ${error.response.status}`);
      console.error('Error response data:', error.response.data);
    }
    return false;
  }
};

export const getRepliesByQuestionId = async (questionId: string): Promise<any[]> => {
  try {
    const token = await getAuthToken();
    const userId = await getUserIdFromToken();
    
    // Add timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    
    console.log(`Fetching replies for question ID: ${questionId}`);
    
    const response = await axios.get(
      `${API_URL}/education/replies/question/${questionId}?_t=${timestamp}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    console.log(`Received ${response.data?.length || 0} replies for question ${questionId}`);
    
    // Map the response to ensure we have the likesisClicked field for each reply
    const replies = response.data || [];
    
    // If we have a user ID, we can determine which replies the user has liked
    if (userId) {
      console.log(`Checking likes status for user ${userId}`);
    }
    
    return replies;
  } catch (error) {
    console.error(`Error fetching replies for question ${questionId}:`, error);
    return [];
  }
};

// Get the liked items from storage
const getLikedItems = async (): Promise<{ questions: string[], replies: string[] }> => {
  try {
    const likedItemsStr = await AsyncStorage.getItem("likedItems");
    if (!likedItemsStr) {
      return { questions: [], replies: [] };
    }
    return JSON.parse(likedItemsStr);
  } catch (error) {
    console.error("Error retrieving liked items:", error);
    return { questions: [], replies: [] };
  }
};

// Save liked items to storage
const saveLikedItems = async (likedItems: { questions: string[], replies: string[] }): Promise<void> => {
  try {
    await AsyncStorage.setItem("likedItems", JSON.stringify(likedItems));
  } catch (error) {
    console.error("Error saving liked items:", error);
  }
};

// Check if an item is already liked
export const isItemLiked = async (itemId: string, itemType: 'question' | 'reply'): Promise<boolean> => {
  const likedItems = await getLikedItems();
  if (itemType === 'question') {
    return likedItems.questions.includes(itemId);
  } else {
    return likedItems.replies.includes(itemId);
  }
};

// Get the count of likes for a content
export const getLikesCount = async (contentType: 'question' | 'reply', contentId: string): Promise<number> => {
  try {
    const token = await getAuthToken();
    
    const response = await axios.get(
      `${API_URL}/education/likes/count/${contentType}/${contentId}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    return response.data.totalLikes || 0;
  } catch (error) {
    console.error(`Error getting likes count for ${contentType} ${contentId}:`, error);
    return 0;
  }
};

// Check if a user has liked content
export const hasUserLiked = async (contentType: 'question' | 'reply', contentId: string): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    const userId = await getUserIdFromToken();
    
    if (!userId) {
      return false;
    }
    
    const response = await axios.get(
      `${API_URL}/education/likes/check/${userId}/${contentType}/${contentId}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    return response.data.hasLiked || false;
  } catch (error) {
    console.error(`Error checking if user liked ${contentType} ${contentId}:`, error);
    return false;
  }
};

// Add a like to content
export const addLike = async (contentType: 'question' | 'reply', contentId: string): Promise<{ success: boolean, totalLikes: number }> => {
  try {
    const token = await getAuthToken();
    const userId = await getUserIdFromToken();
    
    if (!userId) {
      console.error("Cannot add like: User data not available");
      Alert.alert('تنبيه', 'يجب تسجيل الدخول للإعجاب');
      return { success: false, totalLikes: 0 };
    }
    
    console.log(`Adding like for ${contentType} ${contentId} by user ${userId}`);
    
    const response = await axios.post(
      `${API_URL}/education/likes/add`,
      { userId, contentType, contentId },
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    return { 
      success: true, 
      totalLikes: response.data.totalLikes || 0 
    };
  } catch (error) {
    console.error(`Error adding like for ${contentType} ${contentId}:`, error);
    
    // If the user already liked this content, don't show an error
    if (axios.isAxiosError(error) && error.response?.status === 400 && 
        error.response?.data?.message === 'User already liked this content') {
      return { success: true, totalLikes: await getLikesCount(contentType, contentId) };
    }
    
    Alert.alert('خطأ', 'حدث خطأ أثناء الإعجاب، يرجى المحاولة مرة أخرى.');
    return { success: false, totalLikes: 0 };
  }
};

// Remove a like from content
export const removeLike = async (contentType: 'question' | 'reply', contentId: string): Promise<{ success: boolean, totalLikes: number }> => {
  try {
    const token = await getAuthToken();
    const userId = await getUserIdFromToken();
    
    if (!userId) {
      console.error("Cannot remove like: User data not available");
      Alert.alert('تنبيه', 'يجب تسجيل الدخول لإزالة الإعجاب');
      return { success: false, totalLikes: 0 };
    }
    
    console.log(`Removing like for ${contentType} ${contentId} by user ${userId}`);
    
    const response = await axios.post(
      `${API_URL}/education/likes/remove`,
      { userId, contentType, contentId },
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    
    return { 
      success: true, 
      totalLikes: response.data.totalLikes || 0 
    };
  } catch (error) {
    console.error(`Error removing like for ${contentType} ${contentId}:`, error);
    Alert.alert('خطأ', 'حدث خطأ أثناء إزالة الإعجاب، يرجى المحاولة مرة أخرى.');
    return { success: false, totalLikes: 0 };
  }
};

// Toggle like (add or remove)
export const toggleLike = async (contentType: 'question' | 'reply', contentId: string): Promise<{ success: boolean, liked: boolean, totalLikes: number }> => {
  try {
    const isLiked = await hasUserLiked(contentType, contentId);
    
    if (isLiked) {
      // If already liked, remove the like
      const result = await removeLike(contentType, contentId);
      return {
        success: result.success,
        liked: false,
        totalLikes: result.totalLikes
      };
    } else {
      // If not liked, add a like
      const result = await addLike(contentType, contentId);
      return {
        success: result.success,
        liked: true,
        totalLikes: result.totalLikes
      };
    }
  } catch (error) {
    console.error(`Error toggling like for ${contentType} ${contentId}:`, error);
    return { success: false, liked: false, totalLikes: 0 };
  }
};

// Backward compatibility for existing code
export const likeQuestion = async (questionId: string): Promise<boolean> => {
  const result = await toggleLike('question', questionId);
  return result.success;
};

export const likeReply = async (replyId: string): Promise<boolean> => {
  const result = await toggleLike('reply', replyId);
  return result.success;
}; 