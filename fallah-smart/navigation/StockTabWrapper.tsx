// import React from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import TabBar from './TabBar';
// import { StockDetail } from '../screens/Stock/StockDetail';
// import { StockForm } from '../screens/Stock/components/StockForm';

// const Stack = createStackNavigator();

// const StockTabWrapper = () => {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen 
//         name="StockTab" 
//         component={TabBar}
//         options={{ title: 'Mes Stocks' }}
//       />
//       <Stack.Screen 
//         name="StockDetail" 
//         component={StockDetail}
//         options={{ title: 'Détails du Stock' }}
//       />
//       <Stack.Screen 
//         name="AddStock" 
//         component={StockForm}
//         options={{ title: 'Ajouter un Stock' }}
//       />
//     </Stack.Navigator>
//   );
// };

// export default StockTabWrapper; 