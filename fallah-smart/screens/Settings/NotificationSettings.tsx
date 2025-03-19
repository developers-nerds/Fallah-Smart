import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TestNotification from './TestNotification';
import NotificationService from '../../services/NotificationService';

// Define the icon names as a type to avoid TypeScript errors
type IconName = 
  | 'package-variant' 
  | 'clock-alert' 
  | 'tools' 
  | 'needle' 
  | 'heart-pulse';

const NotificationSettingsScreen: React.FC = () => {
  const theme = useTheme();
  const { updateSettings } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [settings, setSettings] = useState({
    lowStockAlerts: true,
    expiryAlerts: true,
    maintenanceAlerts: true,
    vaccinationAlerts: true,
    breedingAlerts: true,
  });

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      setInitialLoading(true);
      const notificationService = NotificationService.getInstance();
      const userSettings = await notificationService.getNotificationSettings();
      
      if (userSettings) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...userSettings,
        }));
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      Alert.alert('خطأ', 'فشل في جلب إعدادات الإشعارات');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleToggle = async (key: keyof typeof settings) => {
    try {
      setLoading(true);
      const newSettings = { ...settings, [key]: !settings[key] };
      setSettings(newSettings);
      await updateSettings(newSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('خطأ', 'فشل في تحديث إعدادات الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  const renderSettingItem = (
    title: string,
    description: string,
    icon: IconName,
    settingKey: keyof typeof settings
  ) => (
    <View style={[styles.settingItem, { backgroundColor: theme.colors.neutral.surface }]}>
      <View style={styles.settingInfo}>
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary.base} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.neutral.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.settingDescription, { color: theme.colors.neutral.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={() => handleToggle(settingKey)}
        trackColor={{ false: theme.colors.neutral.border, true: theme.colors.primary.base }}
        thumbColor={theme.colors.neutral.surface}
        disabled={loading}
      />
    </View>
  );

  if (initialLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.neutral.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
          إعدادات الإشعارات
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.neutral.textSecondary }]}>
          اختر نوع الإشعارات التي تريد تلقيها
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
        </View>
      )}

      <View style={styles.settingsContainer}>
        {renderSettingItem(
          'تنبيهات المخزون المنخفض',
          'تلقي إشعارات عندما ينخفض المخزون عن الحد الأدنى',
          'package-variant',
          'lowStockAlerts'
        )}

        {renderSettingItem(
          'تنبيهات انتهاء الصلاحية',
          'تلقي إشعارات قبل انتهاء صلاحية المنتجات',
          'clock-alert',
          'expiryAlerts'
        )}

        {renderSettingItem(
          'تنبيهات الصيانة',
          'تلقي إشعارات حول مواعيد صيانة المعدات',
          'tools',
          'maintenanceAlerts'
        )}

        {renderSettingItem(
          'تنبيهات التطعيم',
          'تلقي إشعارات حول مواعيد تطعيم الحيوانات',
          'needle',
          'vaccinationAlerts'
        )}

        {renderSettingItem(
          'تنبيهات التكاثر',
          'تلقي إشعارات حول مواعيد تكاثر الحيوانات',
          'heart-pulse',
          'breedingAlerts'
        )}
      </View>
      
      <View style={styles.testSection}>
        <TestNotification />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'right',
  },
  settingsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  testSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'right',
  },
  settingDescription: {
    fontSize: 14,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default NotificationSettingsScreen; 