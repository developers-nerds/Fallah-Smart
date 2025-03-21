import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  Alert,
  Keyboard,
  Pressable
} from 'react-native';
import { theme } from '../../../theme/theme';
import { MaterialIcons, MaterialCommunityIcons, Ionicons, AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getUserData,
  getCurrentUser,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createReply,
  updateReply,
  deleteReply,
  getQuestionsByVideoId,
  getRepliesByQuestionId,
  likeQuestion as likeQuestionApi,
  likeReply as likeReplyApi,
  hasUserLiked,
  getLikesCount,
  toggleLike
} from '../utils/userProgress';
import axios from 'axios';

// Add BASE_URL constant
const BASE_URL = process.env.EXPO_PUBLIC_API;

// Helper function to process image URLs
const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) {
    return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
  }
  
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
};

interface Reply {
  id: string;
  text: string;
  authorName: string;
  authorImage: string;
  timestamp: Date;
  likesisClicked: boolean;
  userId?: number;
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
}

interface Question {
  id: string;
  text: string;
  authorName: string;
  authorImage: string;
  timestamp: Date;
  likesisClicked: boolean;
  userId?: number;
  Education_Replies?: Reply[];
  replies?: Reply[];
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
  showAllReplies?: boolean;
}

interface Props {
  videoId: string | number;
  videoType?: 'animal' | 'crop';
}

const QuestionAndAnswer: React.FC<Props> = ({ videoId, videoType }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ 
    questionId?: string; 
    replyToUsername?: string;
  } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'newest' | 'popular'>('newest');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const initialLoadDone = useRef(false);
  const [userProfile, setUserProfile] = useState<{ username: string; profilePicture: string } | null>(null);
  const [likeData, setLikeData] = useState<{ 
    [key: string]: { count: number, isLiked: boolean } 
  }>({});
  const [expandedReplies, setExpandedReplies] = useState<{[key: string]: boolean}>({});
  
  // Maximum character limits
  const MAX_QUESTION_LENGTH = 300;
  const MAX_ANSWER_LENGTH = 500;

  // Initial load - only happens once when component mounts
  useEffect(() => {
    console.log(`Initial load effect - videoId: ${videoId}, videoType: ${videoType}`);
    loadQuestions(true, true);
    loadCurrentUser();
    loadUserProfile();
    initialLoadDone.current = true;
  }, []);
  
  // This effect runs when videoId changes - handles navigation between videos
  useEffect(() => {
    if (initialLoadDone.current) {
      console.log(`VideoId changed to: ${videoId}, type: ${videoType}`);
      loadQuestions(true, true);
    }
  }, [videoId]);

  // Use useFocusEffect to reload questions when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log(`Screen focused - videoId: ${videoId}, videoType: ${videoType}`);
      
      // Only refresh if it's been more than 2 seconds since the last refresh
      // This prevents double-loading when the component both mounts and gets focused
      const now = Date.now();
      if (now - lastRefreshTime > 2000) {
        // Don't show loading indicator on focus to avoid flickering
        loadQuestions(false, true);
        setLastRefreshTime(now);
      } else {
        console.log('Skipping refresh - too soon since last refresh');
      }
      
      return () => {
        // This runs when screen loses focus
        console.log('Question and Answer section unfocused');
      };
    }, [videoId, videoType, lastRefreshTime])
  );

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      console.log(`Current user loaded: ${user?.id || 'Not logged in'}`);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const userData = await getUserData();
      if (userData) {
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadQuestions = async (showLoading = true, forceRefresh = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      
      if (!videoId) {
        console.error('Cannot load questions: videoId is undefined or null');
        setQuestions([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Loading questions for videoId: ${videoId}, type: ${videoType || 'unknown'}, forceRefresh: ${forceRefresh}`);
      const fetchedQuestions = await getQuestionsByVideoId(videoId, videoType);
      console.log(`Loaded ${fetchedQuestions?.length || 0} questions`);
      
      // Process the questions to standardize the format
      const processedQuestions = fetchedQuestions.map(q => ({
        ...q,
        replies: q.Education_Replies || []
      }));
      
      setQuestions(processedQuestions);
      setLastRefreshTime(Date.now());
      
      // If we successfully loaded questions, animate them in
      if (processedQuestions.length > 0) {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: showLoading ? 500 : 300,
          useNativeDriver: true
        }).start();
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل الأسئلة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!newQuestion.trim()) return;
    if (newQuestion.length > MAX_QUESTION_LENGTH) {
      Alert.alert('السؤال طويل جدًا', `يرجى تقصير سؤالك إلى ${MAX_QUESTION_LENGTH} حرف أو أقل.`);
      return;
    }

    // Check if user is logged in and has profile
    if (!currentUser) {
      Alert.alert('تنبيه', 'يجب تسجيل الدخول لإضافة سؤال');
      return;
    }

    // Reload user profile if not available
    if (!userProfile) {
      await loadUserProfile();
    }

    setIsSubmitting(true);
    
    try {
      // Convert videoId to string if it's a number, since createQuestion expects a string
      const videoIdStr = typeof videoId === 'number' ? videoId.toString() : videoId;
      const createdQuestion = await createQuestion(newQuestion, videoIdStr, videoType);
      
      if (createdQuestion) {
        // Add created question to the state
        const questionWithReplies = {
          ...createdQuestion,
          replies: []
        };
        
        setQuestions(prev => [questionWithReplies, ...prev]);
        setNewQuestion('');
        
        // Animate the new question
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }).start();
      } else {
        Alert.alert('خطأ', 'حدث خطأ أثناء إرسال السؤال، يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال السؤال، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
      Keyboard.dismiss();
    }
  };

  const addReply = async (questionId: string) => {
    if (!replyText.trim()) return;
    if (replyText.length > MAX_ANSWER_LENGTH) {
      Alert.alert('الإجابة طويلة جدًا', `يرجى تقصير إجابتك إلى ${MAX_ANSWER_LENGTH} حرف أو أقل.`);
      return;
    }
    
    // Check if user is logged in and has profile
    if (!currentUser) {
      Alert.alert('تنبيه', 'يجب تسجيل الدخول لإضافة رد');
      return;
    }

    // Reload user profile if not available
    if (!userProfile) {
      await loadUserProfile();
    }
    
    setIsSubmitting(true);
    
    try {
      // If replying to a specific user, prepend their username
      const finalText = replyingTo?.replyToUsername 
        ? `@${replyingTo.replyToUsername}: ${replyText}` 
        : replyText;
      
      console.log(`Sending reply to question ${questionId}, text: ${finalText.substring(0, 20)}...`);
      
      const createdReply = await createReply(finalText, questionId);
      
      if (createdReply) {
        console.log(`Reply created successfully with ID: ${createdReply.id}`);
        
        // Make sure likesisClicked is initialized properly
        const replyWithLikeStatus = {
          ...createdReply,
          likesisClicked: false
        };
        
        // Update questions state with the new reply
        setQuestions(prev =>
          prev.map(q =>
            q.id === questionId
              ? { 
                  ...q, 
                  replies: [replyWithLikeStatus, ...(q.replies || [])]  // Add new reply at the beginning
                }
              : q
          )
        );
        
        setReplyText('');
        setReplyingTo(null);
      } else {
        console.error('createReply returned null/undefined response');
        Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الرد، يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الرد، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
      Keyboard.dismiss();
    }
  };

  const loadLikesInfo = async () => {
    if (!currentUser) return;
    
    try {
      // Create a temporary object to store like data
      const newLikeData: { [key: string]: { count: number, isLiked: boolean } } = {};
      
      // Process questions
      for (const question of questions) {
        const questionKey = `question_${question.id}`;
        const [count, isLiked] = await Promise.all([
          getLikesCount('question', question.id),
          hasUserLiked('question', question.id)
        ]);
        newLikeData[questionKey] = { count, isLiked };
        
        // Process replies for this question
        if (question.replies && question.replies.length > 0) {
          for (const reply of question.replies) {
            const replyKey = `reply_${reply.id}`;
            const [replyCount, replyIsLiked] = await Promise.all([
              getLikesCount('reply', reply.id),
              hasUserLiked('reply', reply.id)
            ]);
            newLikeData[replyKey] = { count: replyCount, isLiked: replyIsLiked };
          }
        }
      }
      
      setLikeData(newLikeData);
    } catch (error) {
      console.error('Error loading likes info:', error);
    }
  };
  
  // Load likes information when questions load or user changes
  useEffect(() => {
    if (questions.length > 0 && currentUser) {
      loadLikesInfo();
    }
  }, [questions.length, currentUser?.id]);

  const handleLikeQuestion = async (questionId: string) => {
    try {
      if (!currentUser) {
        Alert.alert('تنبيه', 'يجب تسجيل الدخول للإعجاب بالسؤال');
        return;
      }
      
      const question = questions.find(q => q.id === questionId);
      if (!question) return;
      
      const questionKey = `question_${questionId}`;
      const currentLikeData = likeData[questionKey] || { count: 0, isLiked: false };
      
      // Optimistically update UI
      setLikeData({
        ...likeData,
        [questionKey]: {
          count: currentLikeData.isLiked ? Math.max(0, currentLikeData.count - 1) : currentLikeData.count + 1,
          isLiked: !currentLikeData.isLiked
        }
      });
      
      // Call API to update server
      const result = await toggleLike('question', questionId);
      
      if (!result.success) {
        // If API call fails, revert the UI change
        setLikeData({
          ...likeData,
          [questionKey]: currentLikeData
        });
        Alert.alert('خطأ', 'فشل في تحديث الإعجاب، يرجى المحاولة مرة أخرى');
      } else {
        // If API call succeeds, update with accurate count from server
        setLikeData({
          ...likeData,
          [questionKey]: {
            count: result.totalLikes,
            isLiked: result.liked
          }
        });
      }
    } catch (error) {
      console.error(`Error toggling like for question ${questionId}:`, error);
    }
  };
  
  const handleLikeReply = async (questionId: string, replyId: string) => {
    try {
      if (!currentUser) {
        Alert.alert('تنبيه', 'يجب تسجيل الدخول للإعجاب بالرد');
        return;
      }
      
      const question = questions.find(q => q.id === questionId);
      if (!question) return;
  
      const reply = question.replies?.find(r => r.id === replyId);
      if (!reply) return;
      
      const replyKey = `reply_${replyId}`;
      const currentLikeData = likeData[replyKey] || { count: 0, isLiked: false };
      
      // Optimistically update UI
      setLikeData({
        ...likeData,
        [replyKey]: {
          count: currentLikeData.isLiked ? Math.max(0, currentLikeData.count - 1) : currentLikeData.count + 1,
          isLiked: !currentLikeData.isLiked
        }
      });
  
      // Call API to update server
      const result = await toggleLike('reply', replyId);
      
      if (!result.success) {
        // If API call fails, revert the UI change
        setLikeData({
          ...likeData,
          [replyKey]: currentLikeData
        });
        Alert.alert('خطأ', 'فشل في تحديث الإعجاب، يرجى المحاولة مرة أخرى');
      } else {
        // If API call succeeds, update with accurate count from server
        setLikeData({
          ...likeData,
          [replyKey]: {
            count: result.totalLikes,
            isLiked: result.liked
          }
        });
      }
    } catch (error) {
      console.error(`Error toggling like for reply ${replyId}:`, error);
    }
  };
  
  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
    Keyboard.dismiss();
  };
  
  const sortQuestions = () => {
    if (sortOrder === 'newest') {
      setSortOrder('popular');
    } else {
      setSortOrder('newest');
    }
  };
  
  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else {
      // Sort by "likesisClicked" status
      if (a.likesisClicked === b.likesisClicked) {
        // If both have the same like status, sort by timestamp
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      // Show liked questions first
      return a.likesisClicked ? -1 : 1;
    }
  });
  
  // Sort replies by timestamp (oldest first for a conversation flow)
  const sortReplies = (replies: Reply[] = []) => {
    return [...replies].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };
  
  const getRemainingChars = () => {
    return MAX_QUESTION_LENGTH - newQuestion.length;
  };
  
  const getReplyRemainingChars = () => {
    return MAX_ANSWER_LENGTH - replyText.length;
  };

  const handleUpdateQuestion = async (questionId: string) => {
    if (!editText.trim()) return;
    if (editText.length > MAX_QUESTION_LENGTH) {
      Alert.alert('السؤال طويل جدًا', `يرجى تقصير سؤالك إلى ${MAX_QUESTION_LENGTH} حرف أو أقل.`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updatedQuestion = await updateQuestion(questionId, editText);
      
      if (updatedQuestion) {
        setQuestions(prev =>
          prev.map(q =>
            q.id === questionId
              ? { ...q, text: editText }
              : q
          )
        );
        setEditingQuestion(null);
        setEditText('');
      } else {
        Alert.alert('خطأ', 'حدث خطأ أثناء تحديث السؤال، يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث السؤال، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;
      
      // Check if the current user is the owner of the question
      if (currentUser?.id !== question.userId) {
        Alert.alert('عذراً', 'لا يمكنك حذف أسئلة المستخدمين الآخرين');
        return;
      }
      
      Alert.alert(
        'تأكيد الحذف',
        'هل أنت متأكد أنك تريد حذف هذا السؤال؟',
        [
          {
            text: 'إلغاء',
            style: 'cancel',
          },
          {
            text: 'حذف',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsSubmitting(true);
                const success = await deleteQuestion(questionId);
                if (success) {
                  setQuestions(prev => prev.filter(q => q.id !== questionId));
                  Alert.alert('نجاح', 'تم حذف السؤال بنجاح');
                } else {
                  Alert.alert('خطأ', 'فشل في حذف السؤال، يرجى المحاولة مرة أخرى');
                }
              } catch (error) {
                console.error('Error deleting question:', error);
                if (axios.isAxiosError(error) && error.response?.status === 403) {
                  Alert.alert('غير مصرح', 'لا يمكنك حذف أسئلة المستخدمين الآخرين');
                } else {
                  Alert.alert('خطأ', 'حدث خطأ أثناء حذف السؤال');
                }
              } finally {
                setIsSubmitting(false);
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error handling delete question:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء محاولة حذف السؤال');
    }
  };

  const handleUpdateReply = async (questionId: string, replyId: string) => {
    if (!editText.trim()) return;
    if (editText.length > MAX_ANSWER_LENGTH) {
      Alert.alert('الرد طويل جدًا', `يرجى تقصير ردك إلى ${MAX_ANSWER_LENGTH} حرف أو أقل.`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updatedReply = await updateReply(replyId, editText);
      
      if (updatedReply) {
        setQuestions(prev =>
          prev.map(q =>
            q.id === questionId
              ? {
                  ...q,
                  replies: (q.replies || []).map(r =>
                    r.id === replyId ? { ...r, text: editText } : r
                  )
                }
              : q
          )
        );
        setEditingReply(null);
        setEditText('');
      } else {
        Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الرد، يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error('Error updating reply:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الرد، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async (questionId: string, replyId: string) => {
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;
      
      const reply = question.replies?.find(r => r.id === replyId);
      if (!reply) return;
      
      // Check if the current user is the owner of the reply
      if (currentUser?.id !== reply.userId) {
        Alert.alert('عذراً', 'لا يمكنك حذف ردود المستخدمين الآخرين');
        return;
      }
      
      Alert.alert(
        'تأكيد الحذف',
        'هل أنت متأكد أنك تريد حذف هذا الرد؟',
        [
          {
            text: 'إلغاء',
            style: 'cancel',
          },
          {
            text: 'حذف',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsSubmitting(true);
                const success = await deleteReply(replyId);
                if (success) {
                  setQuestions(prev =>
                    prev.map(q =>
                      q.id === questionId
                        ? {
                            ...q,
                            replies: (q.replies || []).filter(r => r.id !== replyId),
                          }
                        : q
                    )
                  );
                  Alert.alert('نجاح', 'تم حذف الرد بنجاح');
                } else {
                  Alert.alert('خطأ', 'فشل في حذف الرد، يرجى المحاولة مرة أخرى');
                }
              } catch (error) {
                console.error('Error deleting reply:', error);
                if (axios.isAxiosError(error) && error.response?.status === 403) {
                  Alert.alert('غير مصرح', 'لا يمكنك حذف ردود المستخدمين الآخرين');
                } else {
                  Alert.alert('خطأ', 'حدث خطأ أثناء حذف الرد');
                }
              } finally {
                setIsSubmitting(false);
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error handling delete reply:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء محاولة حذف الرد');
    }
  };

  const toggleReplies = (questionId: string) => {
    setQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { ...q, showAllReplies: !q.showAllReplies } 
          : q
      )
    );
  };

  const renderQuestionActions = (question: Question) => {
    const isOwner = currentUser?.id === question.userId;
    const questionKey = `question_${question.id}`;
    const likeInfo = likeData[questionKey] || { count: 0, isLiked: false };
    const replyCount = question.replies?.length || 0;
    
    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, likeInfo.isLiked && styles.likedActionButton]}
          onPress={() => handleLikeQuestion(question.id)}
          disabled={false}
        >
          <View style={styles.likeContainer}>
            <MaterialCommunityIcons 
              name={likeInfo.isLiked ? "thumb-up" : "thumb-up-outline"} 
              size={22} 
              color={likeInfo.isLiked ? theme.colors.primary.dark : theme.colors.primary.base} 
            />
            {likeInfo.count > 0 && (
              <Text style={[styles.likeCount, likeInfo.isLiked && styles.likedCount]}>
                {likeInfo.count}
              </Text>
            )}
          </View>
          <Text style={[
            styles.actionText,
            likeInfo.isLiked && styles.likedActionText
          ]}>
            {likeInfo.isLiked ? "معجب" : "إعجاب"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (replyCount > 0) {
              toggleReplies(question.id);
            } else {
              setReplyingTo({ questionId: question.id });
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }}
        >
          <View style={styles.likeContainer}>
            <MaterialCommunityIcons 
              name="comment-outline" 
              size={22} 
              color={theme.colors.primary.base} 
            />
            {replyCount > 0 && (
              <Text style={styles.likeCount}>
                {replyCount}
              </Text>
            )}
          </View>
          <Text style={styles.actionText}>
            {replyCount > 0 ? (question.showAllReplies ? "إخفاء" : "عرض") : "تعليق"}
          </Text>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'خيارات',
                'اختر أحد الخيارات',
                [
                  {
                    text: 'تعديل',
                    onPress: () => {
                      setEditingQuestion(question.id);
                      setEditText(question.text);
                    }
                  },
                  {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: () => handleDeleteQuestion(question.id)
                  },
                  {
                    text: 'إلغاء',
                    style: 'cancel'
                  }
                ]
              );
            }}
          >
            <MaterialIcons name="more-horiz" size={22} color={theme.colors.primary.base} />
            <Text style={styles.actionText}>خيارات</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderReplyActions = (questionId: string, reply: Reply) => {
    const isOwner = currentUser?.id === reply.userId;
    const replyKey = `reply_${reply.id}`;
    const likeInfo = likeData[replyKey] || { count: 0, isLiked: false };
    
    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, likeInfo.isLiked && styles.likedActionButton]}
          onPress={() => handleLikeReply(questionId, reply.id)}
          disabled={false}
        >
          <View style={styles.likeContainer}>
            <MaterialCommunityIcons 
              name={likeInfo.isLiked ? "thumb-up" : "thumb-up-outline"} 
              size={18} 
              color={likeInfo.isLiked ? theme.colors.primary.dark : theme.colors.primary.base} 
            />
            {likeInfo.count > 0 && (
              <Text style={[styles.likeCount, likeInfo.isLiked && styles.likedCount]}>
                {likeInfo.count}
              </Text>
            )}
          </View>
          <Text style={[
            styles.actionText,
            likeInfo.isLiked && styles.likedActionText
          ]}>
            {likeInfo.isLiked ? "معجب" : "إعجاب"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setReplyingTo({ 
              questionId: questionId,
              replyToUsername: reply.authorName 
            });
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        >
          <MaterialCommunityIcons name="reply" size={18} color={theme.colors.primary.base} />
          <Text style={styles.actionText}>رد</Text>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'خيارات',
                'اختر أحد الخيارات',
                [
                  {
                    text: 'تعديل',
                    onPress: () => {
                      setEditingReply(reply.id);
                      setEditText(reply.text);
                    }
                  },
                  {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: () => handleDeleteReply(questionId, reply.id)
                  },
                  {
                    text: 'إلغاء',
                    style: 'cancel'
                  }
                ]
              );
            }}
          >
            <MaterialIcons name="more-horiz" size={18} color={theme.colors.primary.base} />
            <Text style={styles.actionText}>خيارات</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderReplySection = (question: Question) => {
    if (!question.replies || question.replies.length === 0) {
      return null;
    }
    
    // Determine if we should show all replies or just a summary
    const sortedReplies = sortReplies(question.replies);
    const visibleReplies = question.showAllReplies 
      ? sortedReplies 
      : sortedReplies.slice(0, 1);
    const hiddenRepliesCount = sortedReplies.length - visibleReplies.length;
    
    return (
      <View style={styles.repliesContainer}>
        {/* Display replies based on collapsed or expanded state */}
        {visibleReplies.map(reply => (
          <View key={reply.id} style={styles.replyItem}>
            <View style={styles.authorInfo}>
              <Image source={{ uri: getImageUrl(reply.authorImage) }} style={styles.authorImageSmall} />
              <View style={styles.authorTextContainer}>
                <Text style={styles.authorNameSmall}>{reply.authorName}</Text>
                <Text style={styles.timestampSmall}>
                  {new Date(reply.timestamp).toLocaleString('fr-FR')}
                </Text>
              </View>
            </View>

            {editingReply === reply.id ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  textAlign="right"
                  autoFocus
                  maxLength={MAX_ANSWER_LENGTH + 1}
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setEditingReply(null);
                      setEditText('');
                    }}
                  >
                    <Text style={styles.editButtonText}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editButton, styles.saveButton]}
                    onPress={() => handleUpdateReply(question.id, reply.id)}
                  >
                    <Text style={styles.saveButtonText}>حفظ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.replyContent}>
                {/* Check if this is a reply to another user, and format it nicely */}
                {reply.text.startsWith('@') && reply.text.includes(':') ? (
                  <View>
                    <Text style={styles.replyToMention}>
                      {reply.text.substring(0, reply.text.indexOf(':') + 1)}
                    </Text>
                    <Text style={styles.replyText}>
                      {reply.text.substring(reply.text.indexOf(':') + 1)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.replyText}>{reply.text}</Text>
                )}
              </View>
            )}

            {renderReplyActions(question.id, reply)}
          </View>
        ))}
        
        {/* Show the "View more comments" button if needed */}
        {hiddenRepliesCount > 0 && (
          <Pressable 
            style={styles.viewMoreReplies}
            onPress={() => toggleReplies(question.id)}
          >
            <AntDesign name="down" size={16} color={theme.colors.primary.base} />
            <Text style={styles.viewMoreRepliesText}>
              عرض {hiddenRepliesCount} {hiddenRepliesCount === 1 ? 'تعليق' : 'تعليقات'} أخرى
            </Text>
          </Pressable>
        )}
        
        {/* Quick reply button at bottom of reply section */}
        <Pressable 
          style={styles.quickReplyButton}
          onPress={() => {
            setReplyingTo({ questionId: question.id });
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        >
          <MaterialCommunityIcons name="reply" size={18} color={theme.colors.primary.base} />
          <Text style={styles.quickReplyText}>أضف تعليقًا...</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.askContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="اطرح سؤالاً للمشاركة مع المتعلمين والخبراء وغيرهم."
            value={newQuestion}
            onChangeText={setNewQuestion}
            multiline
            textAlign="right"
            placeholderTextColor={theme.colors.neutral.gray.base}
            maxLength={MAX_QUESTION_LENGTH + 1}
          />
          {newQuestion.length > 0 && (
            <Text style={[
              styles.charCounter, 
              getRemainingChars() < 20 ? styles.charCounterWarning : null
            ]}>
              {getRemainingChars()}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={[
            styles.askButton, 
            !newQuestion.trim() && styles.disabledButton
          ]} 
          onPress={addQuestion}
          disabled={!newQuestion.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.colors.neutral.surface} />
          ) : (
            <Text style={styles.askButtonText}>اسأل</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.refreshContainer}>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={() => loadQuestions(true, true)}
          disabled={isLoading}
        >
          <MaterialIcons name="refresh" size={22} color={theme.colors.primary.base} />
          <Text style={styles.refreshText}>تحديث الأسئلة</Text>
        </TouchableOpacity>
        <Text style={styles.debugInfo}>الفيديو: {videoId} | النوع: {videoType || 'غير محدد'}</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
          <Text style={styles.loadingText}>جاري تحميل الأسئلة...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.questionsContainer}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={sortQuestions}
          >
            <Text style={styles.sortButtonText}>
              ترتيب حسب: {sortOrder === 'newest' ? 'الأحدث' : 'الأكثر إعجاباً'}
            </Text>
            <MaterialIcons 
              name={sortOrder === 'newest' ? 'sort' : 'thumb-up'} 
              size={18} 
              color={theme.colors.primary.base} 
            />
          </TouchableOpacity>
          {sortedQuestions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons 
                name="help-circle-outline" 
                size={60} 
                color={theme.colors.neutral.gray.base} 
              />
              <Text style={styles.emptyStateText}>لا توجد أسئلة حتى الآن</Text>
              <Text style={styles.emptyStateSubtext}>كن أول من يطرح سؤالاً!</Text>
            </View>
          ) : (
            sortedQuestions.map((question, index) => (
              <Animated.View 
                key={question.id} 
                style={[
                  styles.questionCard,
                  index === 0 && { opacity: fadeAnim }
                ]}
              >
                <View style={styles.authorInfo}>
                  <Image source={{ uri: getImageUrl(question.authorImage) }} style={styles.authorImage} />
                  <View style={styles.authorTextContainer}>
                    <Text style={styles.authorName}>{question.authorName}</Text>
                    <Text style={styles.timestamp}>
                      {new Date(question.timestamp).toLocaleString('fr-FR')}
                    </Text>
                  </View>
                </View>

                {editingQuestion === question.id ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.editInput}
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      textAlign="right"
                      autoFocus
                      maxLength={MAX_QUESTION_LENGTH + 1}
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                          setEditingQuestion(null);
                          setEditText('');
                        }}
                      >
                        <Text style={styles.editButtonText}>إلغاء</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editButton, styles.saveButton]}
                        onPress={() => handleUpdateQuestion(question.id)}
                      >
                        <Text style={styles.saveButtonText}>حفظ</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.questionText}>{question.text}</Text>
                )}

                {renderQuestionActions(question)}
                
                {/* Render the reply section with the new helper function */}
                {renderReplySection(question)}

                {replyingTo?.questionId === question.id && (
                  <View style={styles.replyContainer}>
                    <View style={styles.replyInputContainer}>
                      {userProfile && (
                        <Image 
                          source={{ uri: getImageUrl(userProfile.profilePicture) }} 
                          style={styles.replyUserImage} 
                        />
                      )}
                      <View style={{flex: 1}}>
                        {replyingTo.replyToUsername && (
                          <Text style={styles.replyToLabel}>
                            الرد على <Text style={styles.replyToUsername}>{replyingTo.replyToUsername}</Text>
                          </Text>
                        )}
                        <TextInput
                          style={styles.replyInput}
                          placeholder="اكتب تعليقك..."
                          value={replyText}
                          onChangeText={setReplyText}
                          multiline
                          textAlign="right"
                          autoFocus
                          maxLength={MAX_ANSWER_LENGTH + 1}
                        />
                      </View>
                    </View>
                    <View style={styles.replyButtonsContainer}>
                      <TouchableOpacity
                        style={styles.cancelReplyButton}
                        onPress={cancelReply}
                      >
                        <Ionicons name="close" size={24} color={theme.colors.neutral.surface} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.sendReplyButton,
                          !replyText.trim() && styles.disabledSendButton
                        ]}
                        onPress={() => addReply(replyingTo.questionId!)}
                        disabled={!replyText.trim() || isSubmitting}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator size="small" color={theme.colors.neutral.surface} />
                        ) : (
                          <MaterialIcons 
                            name="send" 
                            size={20} 
                            color={theme.colors.neutral.surface} 
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Animated.View>
            ))
          )}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  askContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 12,
    margin: theme.spacing.md,
    ...theme.shadows.medium,
    elevation: 4,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    marginRight: theme.spacing.md,
    textAlignVertical: 'top',
    minHeight: 40,
    fontFamily: 'System',
  },
  charCounter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
    padding: 2,
  },
  charCounterWarning: {
    color: theme.colors.error,
  },
  askButton: {
    backgroundColor: theme.colors.primary.base,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  disabledButton: {
    backgroundColor: theme.colors.primary.light,
    opacity: 0.7,
  },
  askButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  questionsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.neutral.textSecondary,
    fontFamily: 'System',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    fontFamily: 'System',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    fontFamily: 'System',
  },
  questionCard: {
    backgroundColor: theme.colors.neutral.surface,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  authorImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginLeft: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary.light,
  },
  authorImageSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary.light,
  },
  authorTextContainer: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
    fontFamily: 'System',
  },
  authorNameSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
    fontFamily: 'System',
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'right',
    fontFamily: 'System',
  },
  timestampSmall: {
    fontSize: 10,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'right',
    fontFamily: 'System',
  },
  questionText: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'right',
    lineHeight: 24,
    fontFamily: 'System',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.gray.base,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1,
  },
  likedActionButton: {
    backgroundColor: `${theme.colors.primary.base}15`,
  },
  actionText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.neutral.textSecondary,
    fontSize: 14,
    fontFamily: 'System',
  },
  likedActionText: {
    color: theme.colors.primary.base,
    fontWeight: '600',
  },
  replyContainer: {
    flexDirection: 'column',
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 12,
    padding: theme.spacing.md,
    ...theme.shadows.small,
  },
  replyInputContainer: {
    position: 'relative',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlignVertical: 'top',
    minHeight: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray.light,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontFamily: 'System',
    backgroundColor: theme.colors.neutral.surface,
  },
  replyButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  sendReplyButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primary.base,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
  disabledSendButton: {
    backgroundColor: theme.colors.neutral.gray.light,
  },
  cancelReplyButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repliesContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.gray.base,
    backgroundColor: `${theme.colors.neutral.background}80`,
    borderRadius: 12,
    padding: theme.spacing.xs,
  },
  replyItem: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray.base,
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 12,
    padding: theme.spacing.sm,
  },
  replyText: {
    fontSize: 14,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'right',
    lineHeight: 20,
    fontFamily: 'System',
  },
  bottomPadding: {
    height: 100,
  },
  editContainer: {
    marginVertical: theme.spacing.sm,
  },
  editInput: {
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 12,
    padding: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlignVertical: 'top',
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.primary.light,
    fontFamily: 'System',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  editButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 12,
    marginLeft: theme.spacing.sm,
  },
  editButtonText: {
    color: theme.colors.neutral.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  saveButton: {
    backgroundColor: theme.colors.primary.base,
  },
  saveButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  refreshContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 12,
    marginHorizontal: theme.spacing.md,
    marginTop: 0,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xs,
  },
  refreshText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.primary.base,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  debugInfo: {
    color: theme.colors.neutral.textSecondary,
    fontSize: 10,
    textAlign: 'right',
    fontFamily: 'System',
  },
  replyToLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral.textSecondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'right',
    fontFamily: 'System',
  },
  replyToUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary.base,
    fontFamily: 'System',
  },
  replyContent: {
    marginBottom: theme.spacing.sm,
    backgroundColor: `${theme.colors.neutral.surface}80`,
    borderRadius: 12,
    padding: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary.light,
  },
  replyToMention: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary.base,
    marginBottom: 2,
    textAlign: 'right',
    fontFamily: 'System',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 14,
    marginLeft: 4,
    color: theme.colors.neutral.textSecondary,
    fontFamily: 'System',
  },
  likedCount: {
    color: theme.colors.primary.base,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    padding: theme.spacing.sm,
    borderRadius: 12,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
    justifyContent: 'center',
  },
  sortButtonText: {
    color: theme.colors.primary.base,
    fontSize: 14,
    fontWeight: '600',
    marginRight: theme.spacing.xs,
    fontFamily: 'System',
  },
  replyUserImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: theme.spacing.sm,
  },
  viewMoreReplies: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginVertical: 5,
    borderRadius: 12,
    backgroundColor: `${theme.colors.primary.base}10`,
  },
  viewMoreRepliesText: {
    color: theme.colors.primary.base,
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 14,
  },
  quickReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 5,
    backgroundColor: `${theme.colors.neutral.gray.light}40`,
  },
  quickReplyText: {
    color: theme.colors.neutral.textSecondary,
    marginLeft: 8,
    fontSize: 14,
  },
});

export default QuestionAndAnswer;
