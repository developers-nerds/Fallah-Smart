import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager } from 'react-native';
import i18next from '../translations/i18n';
import { storage } from '../utils/storage';

// Define the available languages
export type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
}

const LANGUAGE_STORAGE_KEY = 'userLanguage';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');

  useEffect(() => {
    // Load saved language preference
    const loadLanguage = async () => {
      try {
        const savedLanguage = await storage.get<Language>(LANGUAGE_STORAGE_KEY);
        if (savedLanguage) {
          applyLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      }
    };

    loadLanguage();
  }, []);

  const applyLanguage = (lang: Language) => {
    setLanguageState(lang);
    i18next.changeLanguage(lang);
    
    // Handle RTL/LTR
    const isRTL = lang === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(isRTL);
      // Note: In a real app, you'd need to reload the app here
      // But for our demo, we'll just update the language
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      applyLanguage(lang);
      await storage.set(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 