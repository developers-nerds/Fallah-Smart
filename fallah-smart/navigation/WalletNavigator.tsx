import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import HomeScreen from "../screens/Wallet/Wallet"
import AddIncome from "../screens/Wallet/components/AddIncome"

const Stack = createStackNavigator()

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddIncome" component={AddIncome} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

