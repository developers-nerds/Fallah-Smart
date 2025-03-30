import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../navigation/SettingsNavigator';
import { useLanguage } from '../../context/LanguageContext';

type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList>;

const SettingsScreen = () => {
  const theme = useTheme();
  const { language } = useLanguage();
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  // Navigate to notification settings
  const goToNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  // Navigate to language settings
  const goToLanguageSettings = () => {
    navigation.navigate('LanguageSettings');
  };

  // Navigate to About screen
  const goToAboutScreen = () => {
    navigation.navigate('About');
  };

  // Navigate to Contact screen
  const goToContactScreen = () => {
    navigation.navigate('Contact');
  };

  // Toggle for dark mode
  const toggleDarkMode = () => {
    if (theme.toggleTheme) {
      theme.toggleTheme();
    }
  };

  // Settings categories with their respective items
  const settingsCategories = [
    {
      title: 'العامة',
      items: [
        {
          title: 'المظهر',
          description: 'الوضع الداكن / الوضع الفاتح',
          icon: 'theme-light-dark',
          iconColor: '#4CAF50',
          type: 'toggle',
          value: theme.mode === 'dark',
          onPress: toggleDarkMode,
        },
        {
          title: 'اللغة',
          description: language === 'ar' ? 'العربية' : 'English',
          icon: 'translate',
          iconColor: '#2196F3',
          type: 'navigate',
          onPress: goToLanguageSettings,
        },
      ],
    },
    {
      title: 'الإشعارات والتنبيهات',
      items: [
        {
          title: 'إعدادات الإشعارات',
          description: 'تخصيص الإشعارات التي تريد استلامها',
          icon: 'bell-outline',
          iconColor: '#FFC107',
          type: 'navigate',
          onPress: goToNotificationSettings,
        },
        {
          title: 'اختبار الإشعارات',
          description: 'التأكد من عمل نظام الإشعارات',
          icon: 'bell-ring-outline',
          iconColor: '#FF5722',
          type: 'navigate',
          onPress: () => navigation.navigate('TestNotification'),
        },
      ],
    },
    {
      title: 'الدعم والمساعدة',
      items: [
        {
          title: 'حول التطبيق',
          description: 'معلومات عن التطبيق والإصدار',
          icon: 'information-outline',
          iconColor: '#9C27B0',
          type: 'navigate',
          onPress: goToAboutScreen,
        },
        {
          title: 'تواصل معنا',
          description: 'للاستفسارات والمساعدة',
          icon: 'email-outline',
          iconColor: '#607D8B',
          type: 'navigate',
          onPress: goToContactScreen,
        },
      ],
    },
  ];

  const renderSettingItem = (item, index) => {
    return (
      <TouchableOpacity
        key={`setting-${index}`}
        style={[
          styles.settingItem,
          { backgroundColor: theme.colors.card?.background || theme.colors.background }
        ]}
        onPress={item.type === 'navigate' ? item.onPress : undefined}
      >
        <View style={styles.settingContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}20` }]}>
            <MaterialCommunityIcons name={item.icon} size={24} color={item.iconColor} />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.secondary }]}>
              {item.description}
            </Text>
          </View>
        </View>
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onPress}
            trackColor={{ false: theme.colors.neutral.border, true: item.iconColor }}
            thumbColor={item.value ? '#fff' : theme.colors.background}
          />
        ) : (
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={theme.colors.secondary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          الإعدادات
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.secondary }]}>
          خصص تطبيقك حسب تفضيلاتك
        </Text>
      </View>

      {settingsCategories.map((category, index) => (
        <View key={`category-${index}`} style={styles.categoryContainer}>
          <Text style={[styles.categoryTitle, { color: theme.colors.primary.base }]}>
            {category.title}
          </Text>
          {category.items.map((item, itemIndex) => renderSettingItem(item, `${index}-${itemIndex}`))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
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
  categoryContainer: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'right',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  settingDescription: {
    fontSize: 14,
    textAlign: 'right',
  },
});

export default SettingsScreen; 