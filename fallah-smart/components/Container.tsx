import { StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const Container = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme();
  
  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: theme.colors.neutral.background }
    ]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});
