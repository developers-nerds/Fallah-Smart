import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { usePesticide } from '../../../context/PesticideContext';
import AddPesticideScreen from './AddPesticide';

type EditPesticideScreenProps = {
  route: RouteProp<StockStackParamList, 'EditPesticide'>;
  navigation: StackNavigationProp<StockStackParamList, 'EditPesticide'>;
};

const EditPesticideScreen = ({ route, navigation }: EditPesticideScreenProps) => {
  const { pesticideId } = route.params;
  const { pesticides } = usePesticide();
  const pesticide = pesticides.find(p => p.id === pesticideId);

  if (!pesticide) {
    return null; // Or show an error state
  }

  return (
    <AddPesticideScreen
      navigation={navigation}
      mode="edit"
      initialData={pesticide}
    />
  );
};

export default EditPesticideScreen; 