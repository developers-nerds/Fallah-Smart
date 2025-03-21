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
import notificationService from '../../services/NotificationService';

// Define the icon names as a type to avoid TypeScript errors
type IconName = 
  | 'package-variant-alert' 
  | 'timer-alert-outline' 
  | 'tools' 
  | 'needle' 
  | 'heart-pulse'
  | 'bell-ring'
  | 'alert-circle-outline';

// Define notification category colors
const categoryColors = {
  automatic: '#4CAF50', // Green
  stock: '#FF9800',     // Orange
  expiry: '#F44336',    // Red
  maintenance: '#2196F3', // Blue
  vaccination: '#9C27B0', // Purple
  breeding: '#E91E63',  // Pink
};

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
    automaticStockAlerts: true,
  });

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      setInitialLoading(true);
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
    settingKey: keyof typeof settings,
    color: string
  ) => (
    <View 
      style={[
        styles.settingItem, 
        { 
          backgroundColor: theme.colors.background,
          borderRightWidth: 4,
          borderRightColor: color
        }
      ]}
    >
      <View style={styles.settingInfo}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.settingDescription, { color: theme.colors.secondary }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={() => handleToggle(settingKey)}
        trackColor={{ false: theme.colors.border, true: color }}
        thumbColor={settings[settingKey] ? '#fff' : theme.colors.background}
        disabled={loading}
        style={styles.switchStyle}
      />
    </View>
  );

  if (initialLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          جاري تحميل الإعدادات...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="bell-badge-outline" 
          size={40} 
          color={theme.colors.primary} 
          style={styles.headerIcon} 
        />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          إعدادات الإشعارات
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
          خصص الإشعارات التي تريد استلامها لإدارة مزرعتك بشكل أفضل
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      <View style={styles.settingsContainer}>
        <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
          الإعدادات العامة
        </Text>

        {renderSettingItem(
          'التنبيهات التلقائية',
          'فحص تلقائي للمخزون وإرسال إشعارات عند الضرورة',
          'bell-ring',
          'automaticStockAlerts',
          categoryColors.automatic
        )}

        <Text style={[styles.categoryTitle, { color: theme.colors.text, marginTop: 24 }]}>
          تنبيهات المخزون
        </Text>

        {renderSettingItem(
          'المخزون المنخفض',
          'إعلامك عندما ينخفض المخزون عن الحد الأدنى',
          'package-variant-alert',
          'lowStockAlerts',
          categoryColors.stock
        )}

        {renderSettingItem(
          'إنتهاء الصلاحية',
          'تنبيهات قبل انتهاء صلاحية المنتجات بوقت كافٍ',
          'timer-alert-outline',
          'expiryAlerts',
          categoryColors.expiry
        )}

        <Text style={[styles.categoryTitle, { color: theme.colors.text, marginTop: 24 }]}>
          تنبيهات المعدات
        </Text>

        {renderSettingItem(
          'الصيانة الدورية',
          'تذكيرك بمواعيد صيانة المعدات والأدوات',
          'tools',
          'maintenanceAlerts',
          categoryColors.maintenance
        )}

        <Text style={[styles.categoryTitle, { color: theme.colors.text, marginTop: 24 }]}>
          تنبيهات الحيوانات
        </Text>

        {renderSettingItem(
          'التطعيمات',
          'تذكيرك بمواعيد تطعيم الحيوانات',
          'needle',
          'vaccinationAlerts',
          categoryColors.vaccination
        )}

        {renderSettingItem(
          'التكاثر والحمل',
          'تنبيهات حول مواعيد تكاثر الحيوانات وفترات الحمل',
          'heart-pulse',
          'breedingAlerts',
          categoryColors.breeding
        )}
      </View>
      
      <View style={styles.testSection}>
        <View style={styles.testHeaderContainer}>
          <MaterialCommunityIcons 
            name="test-tube" 
            size={24} 
            color={theme.colors.primary} 
          />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            إختبار النظام
          </Text>
        </View>
        <Text style={[styles.testDescription, { color: theme.colors.secondary }]}>
          يمكنك اختبار نظام الإشعارات للتأكد من عمله بشكل صحيح
        </Text>
        <View style={[styles.testContainer, { backgroundColor: theme.colors.background }]}>
          <TestNotification />
        </View>
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
    paddingBottom: 32,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'right',
  },
  settingsContainer: {
    marginBottom: 24,
  },
  testSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  testHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
    textAlign: 'right',
  },
  testDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'right',
  },
  testContainer: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
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
  settingInfo: {
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
  settingText: {
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
  switchStyle: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});

export default NotificationSettingsScreen; 