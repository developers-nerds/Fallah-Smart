import 'react-native-gesture-handler';
import { ThemeProvider } from './context/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { StockNavigator } from './navigation/StockNavigator';
import { StockProvider } from './context/StockContext';
import { PesticideProvider } from './context/PesticideContext';
import { StatusBar } from 'react-native';

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <NavigationContainer
        onStateChange={(state) => {
          console.log('New navigation state:', state);
        }}
      >
        <ThemeProvider>
          <StockProvider>
            <PesticideProvider>
              <StockNavigator />
            </PesticideProvider>
          </StockProvider>
        </ThemeProvider>
      </NavigationContainer>
    </>
  );
}
