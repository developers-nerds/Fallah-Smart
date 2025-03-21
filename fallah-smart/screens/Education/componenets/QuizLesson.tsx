import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../../theme/theme';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getUserIdFromToken, getUserProgressForQuiz, saveUserProgress } from '../utils/userProgress';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  quizId: number;
  createdAt: string;
  updatedAt: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

const QuizLesson = () => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [userScore, setUserScore] = useState(0);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [previousBestScore, setPreviousBestScore] = useState<number | null>(null);
  const [isNewBestScore, setIsNewBestScore] = useState(false);
  
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const optionAnimValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  
  const route = useRoute();
  const navigation = useNavigation();
  
  const { lessonId, type } = route.params as { lessonId: number; type: 'animal' | 'crop' };
  
  // Fetch user token and ID
  useEffect(() => {
    const getAuthInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
        
        // Get user ID using the improved function
        const id = await getUserIdFromToken();
        if (id) {
          setUserId(id.toString());
          console.log("User ID successfully retrieved:", id);
        } else {
          console.log("User is not authenticated");
        }
      } catch (error) {
        console.error("Error retrieving auth info:", error);
      }
    };
    getAuthInfo();
  }, []);
  
  // Fetch quiz data and questions from API
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, fetch all quizzes of the specified type
        const quizzesResponse = await axios.get(`${API_URL}/education/quizzes/type/${type}`);
        
        if (quizzesResponse.data && Array.isArray(quizzesResponse.data) && quizzesResponse.data.length > 0) {
          // Log debug information first
          console.log(`Looking for quiz with lessonId: ${lessonId} (type: ${typeof lessonId})`);
          console.log(`Available ${type} quiz IDs:`, quizzesResponse.data.map(q => ({ id: q.id, type: typeof q.id })));
          
          // Try multiple approaches to find the matching quiz
          let matchingQuiz = null;
          
          if (type === 'crop') {
            // For crop quizzes, handle mapping from sequential numbers to actual IDs
            // Sort the quizzes by ID to ensure we get them in order
            const sortedQuizzes = [...quizzesResponse.data].sort((a, b) => a.id - b.id);
            
            // Map the sequential number (1-based) to the actual quiz
            // e.g., if lessonId is 1, get the first quiz in the sorted list regardless of its actual ID
            const sequentialIndex = parseInt(lessonId.toString()) - 1;
            
            if (sequentialIndex >= 0 && sequentialIndex < sortedQuizzes.length) {
              matchingQuiz = sortedQuizzes[sequentialIndex];
              console.log(`Mapped sequential ID ${lessonId} to actual quiz ID ${matchingQuiz.id}`);
            }
          } else {
            // For animal quizzes, try direct ID matching as before
            // Try exact match (handles both types correctly)
            matchingQuiz = quizzesResponse.data.find(q => q.id == lessonId); // Use loose equality
          }
          
          if (matchingQuiz) {
            console.log(`Found quiz: ${matchingQuiz.id}`);
            setQuiz(matchingQuiz);
            
            // Check if user has a previous score for this quiz
            if (userId) {
              try {
                const existingProgress = await getUserProgressForQuiz(parseInt(userId), matchingQuiz.id);
                
                if (existingProgress) {
                  setPreviousBestScore(existingProgress.score);
                  console.log(`Previous best score for quiz ${matchingQuiz.id}: ${existingProgress.score}%`);
                } else {
                  console.log(`No previous score found for quiz ${matchingQuiz.id}`);
                }
              } catch (err) {
                console.error("Error fetching previous user progress:", err);
              }
            } else {
              console.log('User not authenticated, cannot fetch previous scores');
            }
            
            // Fetch questions for this quiz
            try {
              const questionsResponse = await axios.get(`${API_URL}/education/questions/quiz/${matchingQuiz.id}`);
              
              if (questionsResponse.data && questionsResponse.data.length > 0) {
                console.log(`Found ${questionsResponse.data.length} questions for quiz ID ${matchingQuiz.id}`);
                setQuestions(questionsResponse.data);
                setSelectedAnswers(new Array(questionsResponse.data.length).fill(undefined));
              } else {
                console.error(`No questions found for quiz ID ${matchingQuiz.id}`);
                setError(`لا توجد أسئلة متوفرة لهذا الاختبار (رقم ${matchingQuiz.id})`);
              }
            } catch (err) {
              console.error(`Error fetching questions for quiz ID ${matchingQuiz.id}:`, err);
              setError("حدث خطأ أثناء تحميل أسئلة الاختبار");
            }
          } else {
            console.log(`No quiz found with ID ${lessonId} for type ${type}`);
            // Find a valid quiz ID for the current type to redirect to
            if (quizzesResponse.data.length > 0) {
              // Sort quizzes by ID to find the first one
              const sortedQuizzes = [...quizzesResponse.data].sort((a, b) => a.id - b.id);
              const firstValidQuiz = sortedQuizzes[0];
              
              console.log(`Using first valid ${type} quiz with ID: ${firstValidQuiz.id} instead of invalid ID: ${lessonId}`);
              
              // Use the first valid quiz directly
              setQuiz(firstValidQuiz);
              
              // Fetch questions for this valid quiz
              const questionsResponse = await axios.get(`${API_URL}/education/questions/quiz/${firstValidQuiz.id}`);
              
              if (questionsResponse.data && questionsResponse.data.length > 0) {
                setQuestions(questionsResponse.data);
                setSelectedAnswers(new Array(questionsResponse.data.length).fill(undefined));
              } else {
                setError("لم يتم العثور على أسئلة لهذا الاختبار");
              }
            } else {
              if (type === 'crop') {
                setError(`لا يوجد اختبارات زراعية متوفرة حالياً`);
              } else {
                setError(`لا يوجد اختبار ${type === 'animal' ? 'حيواني' : 'زراعي'} برقم: ${lessonId}`);
              }
            }
          }
        } else {
          setError(`لم يتم العثور على اختبارات من نوع ${type === 'animal' ? 'حيواني' : 'زراعي'}`);
        }
      } catch (err) {
        console.error("Error fetching quiz data:", err);
        setError("فشل في تحميل بيانات الاختبار");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [lessonId, type]);

  // Animation for questions and options
  useEffect(() => {
    if (quizStarted && !showResults) {
      // Animate question card
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true
        })
      ]).start();
      
      // Animate options with sequential delay
      optionAnimValues.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          delay: 400 + (index * 100),
          useNativeDriver: true
        }).start();
      });
      
      // Start timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      setTimeLeft(30);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            // Auto-select no answer and show explanation if time runs out
            if (selectedAnswers[currentQuestion] === undefined) {
              const newAnswers = [...selectedAnswers];
              newAnswers[currentQuestion] = -1; // -1 represents timeout/no answer
              setSelectedAnswers(newAnswers);
              setShowExplanation(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestion, quizStarted, showResults]);
  
  // Calculate score when quiz is completed
  useEffect(() => {
    if (showResults && quiz && questions.length > 0) {
      let correctCount = 0;
      
      selectedAnswers.forEach((answer, index) => {
        if (answer === questions[index].correctAnswer) {
          correctCount++;
        }
      });
      
      const score = Math.round((correctCount / questions.length) * 100);
      setUserScore(score);
      
      // Check if this is a new best score
      if (previousBestScore === null || score > previousBestScore) {
        setIsNewBestScore(true);
      } else {
        setIsNewBestScore(false);
      }
      
      // Save quiz results to API
      const saveResults = async () => {
        try {
          if (!userId) {
            console.log('User not authenticated, quiz results will not be saved');
            // Show a temporary message or notification to the user
            Alert.alert(
              "تنبيه",
              "يجب تسجيل الدخول لحفظ نتائجك في الاختبارات",
              [{ text: "حسناً", style: "default" }]
            );
            return;
          }
          
          const userIdNumber = parseInt(userId);
          
          // Log detailed information about the quiz
          console.log(`Quiz details - ID: ${quiz.id}, Type: ${type}, Title: ${quiz.title}`);
          console.log(`User ID: ${userIdNumber}, Previous best score: ${previousBestScore}, New score: ${score}`);
          
          // Only update if new score is better than previous best (or no previous score exists)
          if (previousBestScore === null || score > previousBestScore) {
            console.log(`Saving score ${score} for quiz ID ${quiz.id} of type ${type}`);
            
            // Save to API with detailed logging
            console.log(`API Request - User ID: ${userIdNumber}, Quiz ID: ${quiz.id}, Score: ${score}, Type: ${type}`);
            const saveSuccess = await saveUserProgress(userIdNumber, quiz.id, score, true);
            
            if (saveSuccess) {
              console.log(`Quiz results saved with score: ${score}`);
            } else {
              console.error("Failed to save quiz results to API");
              
              // Try again after a short delay
              setTimeout(async () => {
                console.log(`Retrying save for quiz ID ${quiz.id} with score ${score}`);
                const retrySuccess = await saveUserProgress(userIdNumber, quiz.id, score, true);
                if (retrySuccess) {
                  console.log(`Quiz results saved on retry with score: ${score}`);
                } else {
                  console.error(`Retry failed for quiz ID ${quiz.id}`);
                }
              }, 1000);
            }
          } else {
            console.log(`Existing score (${previousBestScore}%) is higher, keeping previous best`);
          }
        } catch (error) {
          console.error('Error saving quiz results:', error);
        }
      };
      
      saveResults();
    }
  }, [showResults, quiz, questions, selectedAnswers, type, userToken, userId, previousBestScore]);
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={styles.loadingText}>جاري تحميل الاختبار...</Text>
      </View>
    );
  }
  
  if (error || !quiz || questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>عذراً، هذا الاختبار غير متوفر حالياً</Text>
          <Text style={styles.errorSubText}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Retry quiz - reset all states
  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(questions.length).fill(undefined));
    setShowExplanation(false);
    setShowResults(false);
    setQuizStarted(true);
  };
  
  // Go back to lessons
  // const handleBackToLessons = () => {
  //   navigation.navigate(type === 'animal' ? 'AnimalsLessons' : 'CropsLessons');
  // };
  
  // Show results screen after quiz completion
  if (showResults) {
    const correctCount = selectedAnswers.filter((answer, index) => 
      answer === questions[index].correctAnswer
    ).length;
    
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[theme.colors.primary.base, theme.colors.primary.dark]}
          style={styles.resultsHeader}
        >
          <Text style={styles.resultsTitle}>نتائج الاختبار</Text>
        </LinearGradient>
        
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>{userScore}%</Text>
          </View>
          
          <Text style={styles.scoreDetails}>
            الإجابات الصحيحة: {correctCount} من {questions.length}
          </Text>
          
          <Text style={[
            styles.scoreMessage,
            userScore >= 70 ? styles.successText : styles.warningText
          ]}>
            {userScore >= 70 ? 'أحسنت! لقد اجتزت الاختبار بنجاح' : 'حاول مرة أخرى للحصول على نتيجة أفضل'}
          </Text>
        </View>
        
        <View style={styles.resultActions}>
          <TouchableOpacity 
            style={[styles.resultButton, styles.retryButton]} 
            onPress={handleRetry}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.resultButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.resultButton, styles.backToLessonsButton]} 
            // onPress={handleBackToLessons}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            <Text style={styles.resultButtonText}>العودة للدروس</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.answersReview}>
          <Text style={styles.reviewTitle}>مراجعة الإجابات</Text>
          
          {questions.map((question, index) => (
            <View key={index} style={styles.reviewItem}>
              <View style={styles.reviewQuestion}>
                <Text style={styles.reviewQuestionNumber}>سؤال {index + 1}</Text>
                <Text style={styles.reviewQuestionText}>{question.question}</Text>
              </View>
              
              <View style={styles.reviewAnswers}>
                <View style={[
                  styles.reviewAnswer,
                  question.correctAnswer === selectedAnswers[index] 
                    ? styles.reviewCorrect 
                    : (selectedAnswers[index] !== undefined && selectedAnswers[index] !== -1)
                      ? styles.reviewWrong 
                      : {}
                ]}>
                  <Text style={styles.reviewAnswerLabel}>
                    {question.correctAnswer === selectedAnswers[index] 
                      ? 'إجابتك (صحيحة)' 
                      : selectedAnswers[index] === -1
                        ? 'لم تجب'
                        : selectedAnswers[index] !== undefined
                          ? 'إجابتك (خاطئة)'
                          : 'لم تجب'}
                  </Text>
                  <Text style={styles.reviewAnswerText}>
                    {selectedAnswers[index] === -1 
                      ? 'نفذ الوقت' 
                      : selectedAnswers[index] !== undefined 
                        ? question.options[selectedAnswers[index]] 
                        : 'لم تختر إجابة'}
                  </Text>
                </View>
                
                {question.correctAnswer !== selectedAnswers[index] && (
                  <View style={[styles.reviewAnswer, styles.reviewCorrect]}>
                    <Text style={styles.reviewAnswerLabel}>الإجابة الصحيحة</Text>
                    <Text style={styles.reviewAnswerText}>{question.options[question.correctAnswer]}</Text>
                  </View>
                )}
                
                <View style={styles.explanationCard}>
                  <View style={styles.explanationHeader}>
                    <MaterialCommunityIcons 
                      name="lightbulb-on" 
                      size={20} 
                      color={theme.colors.primary.base} 
                    />
                    <Text style={styles.explanationTitle}>التوضيح</Text>
                  </View>
                  <Text style={styles.explanationText}>{question.explanation}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (!quizStarted) {
    return (
      <View style={styles.startContainer}>
        <LinearGradient
          colors={[theme.colors.primary.base, theme.colors.primary.dark]}
          style={styles.startHeader}
        >
          <Text style={styles.startTitle}>{quiz.title}</Text>
        </LinearGradient>
        
        <View style={styles.startContent}>
          <View style={styles.quizInfoCard}>
            <Text style={styles.quizDescription}>{quiz.description}</Text>
            
            <View style={styles.quizMetaInfo}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="help-circle" size={24} color={theme.colors.primary.base} />
                <Text style={styles.metaText}>{questions.length} أسئلة</Text>
              </View>
              
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={24} color={theme.colors.primary.base} />
                <Text style={styles.metaText}>~{questions.length * 1} دقائق</Text>
              </View>
              
              <View style={styles.metaItem}>
                <MaterialCommunityIcons 
                  name={type === 'animal' ? 'cow' : 'sprout'} 
                  size={24} 
                  color={theme.colors.primary.base} 
                />
                <Text style={styles.metaText}>{type === 'animal' ? 'حيواني' : 'زراعي'}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setQuizStarted(true)}
          >
            <Text style={styles.startButtonText}>ابدأ الاختبار</Text>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>العودة للدروس</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentQ = questions[currentQuestion];

  const handleAnswer = (answerIndex: number) => {
    // Clear the timer when an answer is selected
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);
    
    // Scroll to explanation
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const handleNext = () => {
    // Reset animations
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    optionAnimValues.forEach(anim => anim.setValue(0));
    
    setShowExplanation(false);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.quizHeader}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={theme.colors.neutral.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentQuestion + 1) / questions.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentQuestion + 1}/{questions.length}
          </Text>
        </View>

        <View style={styles.timerContainer}>
          <MaterialCommunityIcons 
            name="clock-outline" 
            size={20} 
            color={timeLeft <= 10 ? theme.colors.error : theme.colors.primary.base} 
          />
          <Text style={[
            styles.timerText,
            timeLeft <= 10 && styles.timerWarning
          ]}>
            {timeLeft}s
          </Text>
        </View>
      </View>
      
      <Animated.View 
        style={[
          styles.questionCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.questionHeader}>
          <View style={styles.questionNumberBadge}>
            <Text style={styles.questionNumberText}>{currentQuestion + 1}</Text>
          </View>
          <Text style={styles.questionTitle}>سؤال</Text>
        </View>
        
        <Text style={styles.question}>{currentQ.question}</Text>
        
        {currentQ.options.map((option, index) => (
          <Animated.View 
            key={index}
            style={{ 
              opacity: optionAnimValues[index],
              transform: [{ 
                translateY: optionAnimValues[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }}
          >
            <TouchableOpacity
              style={[
                styles.option,
                selectedAnswers[currentQuestion] === index && styles.selectedOption,
                showExplanation && index === currentQ.correctAnswer && styles.correctOption,
                showExplanation && selectedAnswers[currentQuestion] === index && 
                index !== currentQ.correctAnswer && styles.wrongOption
              ]}
              onPress={() => !showExplanation && handleAnswer(index)}
              disabled={showExplanation}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.optionIndicator,
                  selectedAnswers[currentQuestion] === index && styles.selectedIndicator,
                  showExplanation && index === currentQ.correctAnswer && styles.correctIndicator,
                  showExplanation && selectedAnswers[currentQuestion] === index && 
                  index !== currentQ.correctAnswer && styles.wrongIndicator
                ]}>
                  {showExplanation && index === currentQ.correctAnswer ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : showExplanation && selectedAnswers[currentQuestion] === index && 
                    index !== currentQ.correctAnswer ? (
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.optionLetter}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  )}
                </View>
                
                <Text style={[
                  styles.optionText,
                  selectedAnswers[currentQuestion] === index && styles.selectedOptionText,
                  showExplanation && index === currentQ.correctAnswer && styles.correctOptionText,
                  showExplanation && selectedAnswers[currentQuestion] === index && 
                  index !== currentQ.correctAnswer && styles.wrongOptionText
                ]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {showExplanation && (
          <View style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <MaterialCommunityIcons 
                name="lightbulb-on" 
                size={20} 
                color={theme.colors.primary.base} 
              />
              <Text style={styles.explanationTitle}>التوضيح</Text>
            </View>
            <Text style={styles.explanationText}>{currentQ.explanation}</Text>
          </View>
        )}
      </Animated.View>

      {selectedAnswers[currentQuestion] !== undefined && (
        <TouchableOpacity 
          style={[styles.button, showExplanation ? styles.nextButton : styles.checkButton]} 
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentQuestion === questions.length - 1 ? 'إنهاء الاختبار' : 'السؤال التالي'}
          </Text>
          {showExplanation && (
            <Ionicons 
              name={currentQuestion === questions.length - 1 ? "checkmark-circle" : "arrow-forward"} 
              size={20} 
              color="#FFFFFF" 
              style={styles.buttonIcon}
            />
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: 20,
  },
  errorSubText: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  startContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  startHeader: {
    padding: theme.spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  startContent: {
    padding: 20,
    alignItems: 'center',
  },
  quizInfoCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginVertical: 20,
    ...theme.shadows.medium,
  },
  quizDescription: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 24,
  },
  quizMetaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
    marginLeft: 8,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary.base,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
    ...theme.shadows.medium,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: theme.colors.primary.base,
    fontSize: 16,
    fontWeight: '500',
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray.light,
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: `${theme.colors.primary.base}20`,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.base,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  questionCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    ...theme.shadows.medium,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  questionNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
  },
  question: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
    marginBottom: 20,
    lineHeight: 24,
  },
  option: {
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray.light,
    overflow: 'hidden',
  },
  selectedOption: {
    borderColor: theme.colors.primary.base,
    backgroundColor: `${theme.colors.primary.base}10`,
  },
  correctOption: {
    borderColor: theme.colors.success,
    backgroundColor: `${theme.colors.success}10`,
  },
  wrongOption: {
    borderColor: theme.colors.error,
    backgroundColor: `${theme.colors.error}10`,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.neutral.gray.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedIndicator: {
    backgroundColor: theme.colors.primary.base,
  },
  correctIndicator: {
    backgroundColor: theme.colors.success,
  },
  wrongIndicator: {
    backgroundColor: theme.colors.error,
  },
  optionLetter: {
    color: theme.colors.neutral.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  selectedOptionText: {
    color: theme.colors.primary.base,
    fontWeight: '500',
  },
  correctOptionText: {
    color: theme.colors.success,
    fontWeight: '500',
  },
  wrongOptionText: {
    color: theme.colors.error,
    fontWeight: '500',
  },
  explanationCard: {
    backgroundColor: `${theme.colors.primary.base}05`,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary.base,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary.base,
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 14,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary.base,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  checkButton: {
    backgroundColor: theme.colors.primary.base,
  },
  nextButton: {
    backgroundColor: theme.colors.secondary.base,
  },
  resultsHeader: {
    padding: theme.spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 16,
    padding: 24,
    margin: 16,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${theme.colors.primary.base}15`,
    borderWidth: 8,
    borderColor: theme.colors.primary.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  scoreText: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.primary.base,
  },
  scoreDetails: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  scoreMessage: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  successText: {
    color: theme.colors.success,
  },
  warningText: {
    color: theme.colors.warning,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    gap: 12,
  },
  resultButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  retryButton: {
    backgroundColor: theme.colors.primary.base,
  },
  backToLessonsButton: {
    backgroundColor: theme.colors.secondary.base,
  },
  resultButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  answersReview: {
    margin: 16,
    marginTop: 8,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  reviewItem: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.small,
  },
  reviewQuestion: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray.light,
    paddingBottom: 12,
  },
  reviewQuestionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary.base,
    marginBottom: 4,
  },
  reviewQuestionText: {
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  reviewAnswers: {
    gap: 8,
  },
  reviewAnswer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  reviewCorrect: {
    backgroundColor: `${theme.colors.success}10`,
    borderColor: theme.colors.success,
  },
  reviewWrong: {
    backgroundColor: `${theme.colors.error}10`,
    borderColor: theme.colors.error,
  },
  reviewAnswerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'right',
  },
  reviewAnswerText: {
    fontSize: 14,
    textAlign: 'right',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    padding: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary.base,
    marginLeft: 4,
  },
  timerWarning: {
    color: theme.colors.error,
  },
});

export default QuizLesson;