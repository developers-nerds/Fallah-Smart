import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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
export const saveVideoProgress = async (
  userId: number,
  videoId: number,
  completed: boolean = true
): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    await axios.post(
      `${API_URL}/education/userProgress`,
      { 
        userId, 
        videoId, 
        score: 100, // Videos are always 100% when watched
        completed 
      },
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    return true;
  } catch (error) {
    console.error(`Error saving video progress:`, error);
    return false;
  }
};

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