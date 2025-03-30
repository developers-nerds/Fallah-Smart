import React, { createContext, useContext, useState, useEffect } from 'react';
import { theme as lightTheme } from '../theme/theme';
import { useColorScheme } from 'react-native';
import { storage } from '../utils/storage';

// Create a dark theme based on the light theme
const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#121212',
    text: '#FFFFFF',
    primary: {
      ...lightTheme.colors.primary,
      base: '#90CAF9',
    },
    secondary: '#A0A0A0',
    neutral: {
      ...lightTheme.colors.neutral,
      surface: '#1E1E1E',
      textPrimary: '#FFFFFF',
      textSecondary: '#CCCCCC',
      border: '#333333',
      gray: {
        light: '#333333',
        medium: '#505050',
        dark: '#707070',
      },
    },
    card: {
      ...lightTheme.colors.card,
      background: '#252525',
    },
  },
};

type Theme = typeof lightTheme;
type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  colors: Theme['colors'];
  fonts: Theme['fonts'];
  fontSizes: Theme['fontSizes'];
  spacing: Theme['spacing'];
  borderRadius: Theme['borderRadius'];
  typography: Theme['typography'];
  shadows: Theme['shadows'];
  mode: ThemeMode;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'userTheme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const activeTheme = themeMode === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    // Load saved theme preference from storage
    const loadTheme = async () => {
      try {
        const savedTheme = await storage.get<ThemeMode>(THEME_STORAGE_KEY);
        if (savedTheme) {
          setThemeMode(savedTheme);
        } else if (deviceTheme) {
          // Use device theme if no saved preference
          setThemeMode(deviceTheme === 'dark' ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadTheme();
  }, [deviceTheme]);

  const toggleTheme = async () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    try {
      await storage.set(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider 
      value={{
        ...activeTheme,
        mode: themeMode,
        toggleTheme,
      }}
    >
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