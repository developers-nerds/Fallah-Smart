import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AdvisorStackParamList } from './types';
import Advisor from '../screens/AdvisorEducation/Adivisor';
import QuestionManagement from '../screens/AdvisorEducation/components/QuestionManagement';
import QuizForm from '../screens/AdvisorEducation/components/QuizForm';
import QuestionForm from '../screens/AdvisorEducation/components/QuestionForm';
import QuizSelector from '../screens/AdvisorEducation/components/QuizSelector';

const Stack = createStackNavigator<AdvisorStackParamList>();

const AdvisorNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="AdvisorHome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="AdvisorHome" 
        component={Advisor} 
      />
      <Stack.Screen 
        name="QuizSelector" 
        component={QuizSelector} 
      />
      <Stack.Screen 
        name="QuestionManagement" 
        component={QuestionManagement} 
      />
      <Stack.Screen 
        name="QuestionForm" 
        component={QuestionForm} 
      />
    </Stack.Navigator>
  );
};

export default AdvisorNavigator; 