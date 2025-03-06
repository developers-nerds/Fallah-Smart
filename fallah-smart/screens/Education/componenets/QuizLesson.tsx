import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { theme } from '../../../theme/theme';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  questions: Question[];
}

interface Quizzes {
  [key: number]: Quiz;
}

// Sample quiz data - In a real app, this would come from an API or database
const quizzes: Quizzes = {
  1: {
    questions: [
      {
        id: 1,
        question: 'ما هي أفضل فترة لتغذية الأغنام؟',
        options: [
          'الصباح الباكر والمساء',
          'منتصف النهار',
          'ليلاً فقط',
          'في أي وقت'
        ],
        correctAnswer: 0
      },
      {
        id: 2,
        question: 'كم مرة يجب تلقيح الأغنام سنوياً؟',
        options: [
          'مرة واحدة',
          'مرتين',
          'ثلاث مرات',
          'أربع مرات'
        ],
        correctAnswer: 0
      }
    ]
  },
  2: {
    questions: [
      {
        id: 1,
        question: 'ما هو أفضل موسم لزراعة الزيتون؟',
        options: [
          'الربيع',
          'الصيف',
          'الخريف',
          'الشتاء'
        ],
        correctAnswer: 2
      }
    ]
  }
};

const QuizLesson = () => {
  const route = useRoute();
  const { lessonId } = route.params as { lessonId: number };
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const quiz = quizzes[lessonId];
  const questions = quiz.questions;

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q: Question, index: number) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return (correct / questions.length) * 100;
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <View style={styles.container}>
        <Text style={styles.header}>النتيجة</Text>
        <Text style={styles.score}>{score.toFixed(0)}%</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setCurrentQuestion(0);
            setSelectedAnswers([]);
            setShowResults(false);
          }}
        >
          <Text style={styles.buttonText}>إعادة الاختبار</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>السؤال {currentQuestion + 1} من {questions.length}</Text>
      <View style={styles.questionContainer}>
        <Text style={styles.question}>{questions[currentQuestion].question}</Text>
        {questions[currentQuestion].options.map((option: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              selectedAnswers[currentQuestion] === index && styles.selectedOption
            ]}
            onPress={() => handleAnswer(index)}
          >
            <Text style={[
              styles.optionText,
              selectedAnswers[currentQuestion] === index && styles.selectedOptionText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {selectedAnswers[currentQuestion] !== undefined && (
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentQuestion === questions.length - 1 ? 'إنهاء' : 'التالي'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
    padding: 20,
  },
  header: {
    fontSize: theme.typography.arabic.h2.fontSize,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.colors.primary.base,
    marginBottom: 20,
  },
  questionContainer: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: 20,
    marginBottom: 20,
    ...theme.shadows.small,
  },
  question: {
    fontSize: theme.typography.arabic.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
    marginBottom: 20,
    textAlign: 'right',
  },
  option: {
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: theme.borderRadius.small,
    padding: 15,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary.surface,
    borderColor: theme.colors.primary.base,
    borderWidth: 1,
  },
  optionText: {
    fontSize: theme.typography.arabic.body.fontSize,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  selectedOptionText: {
    color: theme.colors.primary.base,
    fontWeight: '600',
  },
  button: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: theme.borderRadius.medium,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.arabic.body.fontSize,
    fontWeight: '600',
  },
  score: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.primary.base,
    textAlign: 'center',
    marginVertical: 30,
  },
});

export default QuizLesson; 