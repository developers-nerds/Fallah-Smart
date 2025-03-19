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
  isItemLiked
} from '../utils/userProgress';

interface Reply {
  id: string;
  text: string;
  authorName: string;
  authorImage: string;
  timestamp: Date;
  likes: number;
  userId?: number;
}

interface Question {
  id: string;
  text: string;
  authorName: string;
  authorImage: string;
  timestamp: Date;
  likes: number;
  userId?: number;
  Education_Replies?: Reply[];
  replies?: Reply[];
}

interface Props {
  videoId: string | number;
  videoType?: 'animal' | 'crop';
}

const QuestionAndAnswer: React.FC<Props> = ({ videoId, videoType }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ questionId?: string } | null>(null);
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
  
  // Maximum character limits
  const MAX_QUESTION_LENGTH = 300;
  const MAX_ANSWER_LENGTH = 500;

  // Initial load - only happens once when component mounts
  useEffect(() => {
    console.log(`Initial load effect - videoId: ${videoId}, videoType: ${videoType}`);
    loadQuestions(true, true);
    loadCurrentUser();
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
    
    setIsSubmitting(true);
    
    try {
      const createdReply = await createReply(replyText, questionId);
      
      if (createdReply) {
        // Update questions state with the new reply
        setQuestions(prev =>
          prev.map(q =>
            q.id === questionId
              ? { 
                ...q, 
                replies: [createdReply, ...(q.replies || [])] 
              }
              : q
          )
        );
        
        setReplyText('');
        setReplyingTo(null);
      } else {
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

  const handleLikeQuestion = async (questionId: string) => {
    try {
      const success = await likeQuestionApi(questionId);
      
      if (success) {
        setQuestions(prev =>
          prev.map(q =>
            q.id === questionId ? { ...q, likes: q.likes + 1 } : q
          )
        );
      }
    } catch (error) {
      console.error(`Error liking question ${questionId}:`, error);
    }
  };

  const handleLikeReply = async (questionId: string, replyId: string) => {
    try {
      const success = await likeReplyApi(replyId);
      
      if (success) {
        setQuestions(prev =>
          prev.map(q =>
            q.id === questionId
              ? {
                  ...q,
                  replies: (q.replies || []).map(r =>
                    r.id === replyId ? { ...r, likes: r.likes + 1 } : r
                  ),
                }
              : q
          )
        );
      }
    } catch (error) {
      console.error(`Error liking reply ${replyId}:`, error);
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
      return b.likes - a.likes;
    }
  });
  
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
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا السؤال؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteQuestion(questionId);
              
              if (success) {
                setQuestions(prev => prev.filter(q => q.id !== questionId));
              } else {
                Alert.alert('خطأ', 'حدث خطأ أثناء حذف السؤال، يرجى المحاولة مرة أخرى.');
              }
            } catch (error) {
              console.error('Error deleting question:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف السؤال، يرجى المحاولة مرة أخرى.');
            }
          }
        }
      ]
    );
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
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الرد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteReply(replyId);
              
              if (success) {
                setQuestions(prev =>
                  prev.map(q =>
                    q.id === questionId
                      ? {
                          ...q,
                          replies: (q.replies || []).filter(r => r.id !== replyId)
                        }
                      : q
                  )
                );
              } else {
                Alert.alert('خطأ', 'حدث خطأ أثناء حذف الرد، يرجى المحاولة مرة أخرى.');
              }
            } catch (error) {
              console.error('Error deleting reply:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف الرد، يرجى المحاولة مرة أخرى.');
            }
          }
        }
      ]
    );
  };

  const renderQuestionActions = (question: Question) => {
    const isOwner = currentUser?.id === question.userId;
    
    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLikeQuestion(question.id)}
        >
          <MaterialCommunityIcons name="thumb-up" size={20} color={theme.colors.primary.base} />
          <Text style={styles.actionText}>{question.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setReplyingTo({ questionId: question.id });
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        >
          <MaterialCommunityIcons name="reply" size={20} color={theme.colors.primary.base} />
          <Text style={styles.actionText}>إجابة</Text>
        </TouchableOpacity>

        {isOwner && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setEditingQuestion(question.id);
                setEditText(question.text);
              }}
            >
              <MaterialIcons name="edit" size={20} color={theme.colors.primary.base} />
              <Text style={styles.actionText}>تعديل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteQuestion(question.id)}
            >
              <MaterialIcons name="delete" size={20} color={theme.colors.error} />
              <Text style={[styles.actionText, { color: theme.colors.error }]}>حذف</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderReplyActions = (questionId: string, reply: Reply) => {
    const isOwner = currentUser?.id === reply.userId;
    
    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLikeReply(questionId, reply.id)}
        >
          <MaterialCommunityIcons name="thumb-up" size={18} color={theme.colors.primary.base} />
          <Text style={styles.actionTextSmall}>{reply.likes}</Text>
        </TouchableOpacity>

        {isOwner && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setEditingReply(reply.id);
                setEditText(reply.text);
              }}
            >
              <MaterialIcons name="edit" size={18} color={theme.colors.primary.base} />
              <Text style={styles.actionTextSmall}>تعديل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteReply(questionId, reply.id)}
            >
              <MaterialIcons name="delete" size={18} color={theme.colors.error} />
              <Text style={[styles.actionTextSmall, { color: theme.colors.error }]}>حذف</Text>
            </TouchableOpacity>
          </>
        )}
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
                  <Image source={{ uri: question.authorImage }} style={styles.authorImage} />
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

                {replyingTo?.questionId === question.id && (
                  <View style={styles.replyContainer}>
                    <View style={styles.replyInputContainer}>
                      <TextInput
                        style={styles.replyInput}
                        placeholder="اكتب إجابتك..."
                        value={replyText}
                        onChangeText={setReplyText}
                        multiline
                        textAlign="right"
                        autoFocus
                        maxLength={MAX_ANSWER_LENGTH + 1}
                      />
                      {replyText.length > 0 && (
                        <Text style={[
                          styles.charCounter, 
                          getReplyRemainingChars() < 20 ? styles.charCounterWarning : null
                        ]}>
                          {getReplyRemainingChars()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.replyButtonsContainer}>
                      <TouchableOpacity
                        style={styles.cancelReplyButton}
                        onPress={cancelReply}
                      >
                        <Ionicons name="close" size={24} color={theme.colors.neutral.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.sendReplyButton,
                          !replyText.trim() && styles.disabledSendButton
                        ]}
                        onPress={() => addReply(question.id)}
                        disabled={!replyText.trim() || isSubmitting}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator size="small" color={theme.colors.primary.base} />
                        ) : (
                          <MaterialIcons 
                            name="send" 
                            size={24} 
                            color={!replyText.trim() ? theme.colors.neutral.gray.base : theme.colors.primary.base} 
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Display replies */}
                {question.replies && question.replies.length > 0 && (
                  <View style={styles.repliesContainer}>
                    {question.replies.map(reply => (
                      <View key={reply.id} style={styles.replyItem}>
                        <View style={styles.authorInfo}>
                          <Image source={{ uri: reply.authorImage }} style={styles.authorImageSmall} />
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
                          <Text style={styles.replyText}>{reply.text}</Text>
                        )}

                        {renderReplyActions(question.id, reply)}
                      </View>
                    ))}
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
    borderRadius: 8,
    margin: theme.spacing.md,
    ...theme.shadows.small,
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
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  disabledButton: {
    backgroundColor: theme.colors.primary.light,
    opacity: 0.7,
  },
  askButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: 16,
    fontWeight: '600',
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
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: theme.colors.neutral.surface,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: 8,
    ...theme.shadows.small,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: theme.spacing.sm,
  },
  authorImageSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: theme.spacing.sm,
  },
  authorTextContainer: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  authorNameSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'right',
  },
  timestampSmall: {
    fontSize: 10,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'right',
  },
  questionText: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  actionText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.neutral.textSecondary,
    fontSize: 14,
  },
  actionTextSmall: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.neutral.textSecondary,
    fontSize: 12,
  },
  replyContainer: {
    flexDirection: 'column',
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 8,
    padding: theme.spacing.sm,
  },
  replyInputContainer: {
    position: 'relative',
    width: '100%',
  },
  replyInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlignVertical: 'top',
    minHeight: 40,
    width: '100%',
  },
  replyButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  sendReplyButton: {
    padding: theme.spacing.sm,
  },
  disabledSendButton: {
    opacity: 0.5,
  },
  cancelReplyButton: {
    padding: theme.spacing.sm,
  },
  repliesContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.gray.light,
  },
  replyItem: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray.light,
  },
  replyText: {
    fontSize: 14,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'right',
  },
  bottomPadding: {
    height: 100,
  },
  editContainer: {
    marginVertical: theme.spacing.sm,
  },
  editInput: {
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 8,
    padding: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  editButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
    marginLeft: theme.spacing.sm,
  },
  editButtonText: {
    color: theme.colors.neutral.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.colors.primary.base,
  },
  saveButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  refreshContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 8,
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
  },
  debugInfo: {
    color: theme.colors.neutral.textSecondary,
    fontSize: 10,
    textAlign: 'right',
  },
});

export default QuestionAndAnswer;
