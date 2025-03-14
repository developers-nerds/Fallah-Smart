import React, { useState, useRef } from 'react';
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
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

interface Answer {
  id: string;
  text: string;
  authorName: string;
  authorImage: string;
  timestamp: Date;
  likes: number;
  replies: Reply[];
}

interface Reply {
  id: string;
  text: string;
  authorName: string;
  authorImage: string;
  timestamp: Date;
  likes: number;
}

interface Question {
  id: string;
  text: string;
  authorName: string;
  authorImage: string;
  timestamp: Date;
  likes: number;
  answers: Answer[];
}

interface Props {
  videoId: string;
}

const QuestionAndAnswer: React.FC<Props> = ({ videoId }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ questionId?: string; answerId?: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'popular'>('newest');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Maximum character limits
  const MAX_QUESTION_LENGTH = 300;
  const MAX_ANSWER_LENGTH = 500;

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    if (newQuestion.length > MAX_QUESTION_LENGTH) {
      Alert.alert('السؤال طويل جدًا', `يرجى تقصير سؤالك إلى ${MAX_QUESTION_LENGTH} حرف أو أقل.`);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate network request
    setTimeout(() => {
      const question: Question = {
        id: Date.now().toString(),
        text: newQuestion,
        authorName: 'أنت', // You can replace with actual user name
        authorImage: 'https://via.placeholder.com/40', // Replace with actual user image
        timestamp: new Date(),
        likes: 0,
        answers: [],
      };

      setQuestions(prev => [question, ...prev]);
      setNewQuestion('');
      setIsSubmitting(false);
      
      // Animate the new question
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start();
      
      // Hide keyboard after submission
      Keyboard.dismiss();
    }, 500);
  };

  const addAnswer = (questionId: string) => {
    if (!replyText.trim()) return;
    if (replyText.length > MAX_ANSWER_LENGTH) {
      Alert.alert('الإجابة طويلة جدًا', `يرجى تقصير إجابتك إلى ${MAX_ANSWER_LENGTH} حرف أو أقل.`);
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate network request
    setTimeout(() => {
      const answer: Answer = {
        id: Date.now().toString(),
        text: replyText,
        authorName: 'أنت', // Replace with actual user name
        authorImage: 'https://via.placeholder.com/40', // Replace with actual user image
        timestamp: new Date(),
        likes: 0,
        replies: [],
      };

      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId
            ? { ...q, answers: [answer, ...q.answers] }
            : q
        )
      );

      setReplyText('');
      setReplyingTo(null);
      setIsSubmitting(false);
      
      // Hide keyboard after submission
      Keyboard.dismiss();
    }, 500);
  };

  const addReply = (questionId: string, answerId: string) => {
    if (!replyText.trim()) return;
    if (replyText.length > MAX_ANSWER_LENGTH) {
      Alert.alert('الرد طويل جدًا', `يرجى تقصير ردك إلى ${MAX_ANSWER_LENGTH} حرف أو أقل.`);
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate network request
    setTimeout(() => {
      const reply: Reply = {
        id: Date.now().toString(),
        text: replyText,
        authorName: 'أنت', // Replace with actual user name
        authorImage: 'https://via.placeholder.com/40', // Replace with actual user image
        timestamp: new Date(),
        likes: 0,
      };

      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId
            ? {
                ...q,
                answers: q.answers.map(a =>
                  a.id === answerId
                    ? { ...a, replies: [...a.replies, reply] }
                    : a
                ),
              }
            : q
        )
      );

      setReplyText('');
      setReplyingTo(null);
      setIsSubmitting(false);
      
      // Hide keyboard after submission
      Keyboard.dismiss();
    }, 500);
  };

  const likeQuestion = (questionId: string) => {
    // Add like animation or feedback here
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, likes: q.likes + 1 } : q
      )
    );
  };

  const likeAnswer = (questionId: string, answerId: string) => {
    // Add like animation or feedback here
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map(a =>
                a.id === answerId ? { ...a, likes: a.likes + 1 } : a
              ),
            }
          : q
      )
    );
  };

  const likeReply = (questionId: string, answerId: string, replyId: string) => {
    // Add like animation or feedback here
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map(a =>
                a.id === answerId
                  ? {
                      ...a,
                      replies: a.replies.map(r =>
                        r.id === replyId ? { ...r, likes: r.likes + 1 } : r
                      ),
                    }
                  : a
              ),
            }
          : q
      )
    );
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

              <Text style={styles.questionText}>{question.text}</Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => likeQuestion(question.id)}
                >
                  <MaterialCommunityIcons name="thumb-up" size={20} color={theme.colors.primary.base} />
                  <Text style={styles.actionText}>{question.likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setReplyingTo({ questionId: question.id });
                    // Scroll to the reply input after a short delay to ensure it's rendered
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                >
                  <MaterialCommunityIcons name="reply" size={20} color={theme.colors.primary.base} />
                  <Text style={styles.actionText}>إجابة</Text>
                </TouchableOpacity>
              </View>

              {replyingTo?.questionId === question.id && !replyingTo?.answerId && (
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
                      onPress={() => addAnswer(question.id)}
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

              {question.answers.map(answer => (
                <View key={answer.id} style={styles.answerContainer}>
                  <View style={styles.authorInfo}>
                    <Image source={{ uri: answer.authorImage }} style={styles.authorImage} />
                    <View style={styles.authorTextContainer}>
                      <Text style={styles.authorName}>{answer.authorName}</Text>
                      <Text style={styles.timestamp}>
                        {new Date(answer.timestamp).toLocaleString('fr-FR')}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.answerText}>{answer.text}</Text>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => likeAnswer(question.id, answer.id)}
                    >
                      <MaterialCommunityIcons name="thumb-up" size={20} color={theme.colors.primary.base} />
                      <Text style={styles.actionText}>{answer.likes}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setReplyingTo({ questionId: question.id, answerId: answer.id });
                        // Scroll to the reply input after a short delay
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                      }}
                    >
                      <MaterialCommunityIcons name="reply" size={20} color={theme.colors.primary.base} />
                      <Text style={styles.actionText}>رد</Text>
                    </TouchableOpacity>
                  </View>

                  {replyingTo?.answerId === answer.id && (
                    <View style={styles.replyContainer}>
                      <View style={styles.replyInputContainer}>
                        <TextInput
                          style={styles.replyInput}
                          placeholder="اكتب ردك..."
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
                          onPress={() => addReply(question.id, answer.id)}
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

                  {answer.replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                      {answer.replies.map(reply => (
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

                          <Text style={styles.replyText}>{reply.text}</Text>

                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => likeReply(question.id, answer.id, reply.id)}
                          >
                            <MaterialCommunityIcons name="thumb-up" size={18} color={theme.colors.primary.base} />
                            <Text style={styles.actionTextSmall}>{reply.likes}</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </Animated.View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
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
  answerContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.gray.light,
  },
  answerText: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'right',
  },
  repliesContainer: {
    marginTop: theme.spacing.sm,
    marginRight: theme.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.neutral.gray.light,
    paddingLeft: theme.spacing.sm,
  },
  replyItem: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
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
});

export default QuestionAndAnswer;
