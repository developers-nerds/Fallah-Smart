import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const LanguageSettings = () => {
  const theme = useTheme();
  const { language, setLanguage } = useLanguage();
  const navigation = useNavigation();

  const languages = [
    { code: 'ar', name: 'العربية', icon: 'translate' },
    { code: 'en', name: 'English', icon: 'translate' },
  ];

  const handleLanguageSelect = async (langCode: Language) => {
    await setLanguage(langCode);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          اختر اللغة
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.secondary }]}>
          يمكنك تغيير لغة التطبيق من هنا
        </Text>
      </View>

      <View style={styles.languageList}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageItem,
              { backgroundColor: theme.colors.card?.background || theme.colors.background },
              language === lang.code && styles.selectedLanguage,
              language === lang.code && { borderColor: theme.colors.primary.base }
            ]}
            onPress={() => handleLanguageSelect(lang.code as Language)}
          >
            <View style={styles.languageContent}>
              <MaterialCommunityIcons
                name={lang.icon}
                size={24}
                color={language === lang.code ? theme.colors.primary.base : theme.colors.text}
              />
              <Text
                style={[
                  styles.languageName,
                  { color: language === lang.code ? theme.colors.primary.base : theme.colors.text }
                ]}
              >
                {lang.name}
              </Text>
            </View>
            {language === lang.code && (
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={theme.colors.primary.base}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.note, { color: theme.colors.secondary }]}>
        * تطبيق تغيير اللغة قد يتطلب إعادة تشغيل التطبيق
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  languageList: {
    marginTop: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLanguage: {
    borderWidth: 2,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  note: {
    marginTop: 24,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LanguageSettings; 