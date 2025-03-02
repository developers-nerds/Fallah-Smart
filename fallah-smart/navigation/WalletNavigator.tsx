import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import HomeScreen from "../screens/Wallet/Wallet"
import AddIncome from "../screens/Wallet/components/AddIncome"
import AddExpense from "../screens/Wallet/components/AddExpense"

const Stack = createStackNavigator()

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AddIncome" 
          component={AddIncome} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AddExpense" 
          component={AddExpense} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

