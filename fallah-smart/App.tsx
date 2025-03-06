import "react-native-gesture-handler"
import { ThemeProvider } from "./context/ThemeContext"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { StockNavigator } from "./navigation/StockNavigator"
import { StockProvider } from "./context/StockContext"
import AddIncome from "./screens/Wallet/components/AddIncome"
import AddExpense from "./screens/Wallet/components/AddExpense"
import { EducationNavigator } from "./navigation/EducationNavigator"
const Stack = createStackNavigator()

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
      <Stack.Screen name="Education" component={EducationNavigator} />
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

