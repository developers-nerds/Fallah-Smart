import React, { createContext, useContext } from 'react';
import { theme } from '../theme/theme';

type Theme = typeof theme;

interface ThemeContextType {
  colors: Theme['colors'];
  fonts: Theme['fonts'];
  fontSizes: Theme['fontSizes'];
  spacing: Theme['spacing'];
  borderRadius: Theme['borderRadius'];
  typography: Theme['typography'];
  shadows: Theme['shadows'];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 