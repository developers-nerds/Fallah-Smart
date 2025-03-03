import "react-native-gesture-handler"
import { ThemeProvider } from "./context/ThemeContext"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { StockNavigator } from "./navigation/StockNavigator"
import { StockProvider } from "./context/StockContext"
import AddIncome from "./screens/Wallet/components/AddIncome"

// To this
import AddExpense from "./screens/Wallet/components/AddExpense"
const Stack = createStackNavigator()

// Update the Stack.Navigator to include AddExpense
const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {() => (
          <StockProvider>
            <StockNavigator />
          </StockProvider>
        )}
      </Stack.Screen>
      <Stack.Screen name="AddIncome" component={AddIncome} />
      <Stack.Screen name="AddExpense" component={AddExpense} />
    </Stack.Navigator>
  )
}

const AppContent = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

