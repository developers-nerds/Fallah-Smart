import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EducationScreen from '../screens/Education/education';
import AnimalsLessons from '../screens/Education/componenets/AnimalsLessons';
import CropsLessons from '../screens/Education/componenets/CropsLessons';
import VideoLesson from '../screens/Education/componenets/VideoLesson';
import QuizLesson from '../screens/Education/componenets/QuizLesson';

export type EducationStackParamList = {
  Education: undefined;
  AnimalsLessons: undefined;
  CropsLessons: undefined;
  VideoLesson: { videoUrl: string };
  QuizLesson: { lessonId: number };
};

const Stack = createStackNavigator<EducationStackParamList>();

export const EducationNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="Education"
        component={EducationScreen}
        options={{
          title: 'تعلم للفلاح',
        }}
      />
      <Stack.Screen
        name="AnimalsLessons"
        component={AnimalsLessons}
        options={{
          title: 'دروس تربية الحيوانات',
        }}
      />
      <Stack.Screen
        name="CropsLessons"
        component={CropsLessons}
        options={{
          title: 'دروس زراعة المحاصيل',
        }}
      />
      <Stack.Screen
        name="VideoLesson"
        component={VideoLesson}
        options={{
          title: 'درس فيديو',
        }}
      />
      <Stack.Screen
        name="QuizLesson"
        component={QuizLesson}
        options={{
          title: 'اختبار',
        }}
      />
    </Stack.Navigator>
  );
}; 