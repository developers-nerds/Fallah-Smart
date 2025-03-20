import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NotificationService from '../../services/NotificationService';
import StockNotificationService from '../../services/StockNotificationService';
import axios from 'axios';
import { storage } from '../../utils/storage';

const TestNotification = () => {
  const theme = useTheme();
  const { 
    scheduleTestNotification: contextScheduleTestNotification, 
    deviceToken,
    schedulePesticideAlert,
    scheduleAnimalAlert,
    scheduleEquipmentAlert,
    scheduleFeedAlert,
    scheduleFertilizerAlert,
    scheduleHarvestAlert,
    scheduleSeedAlert,
    scheduleToolAlert
  } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const sendTestNotification = async (isDirectDeviceTest = false) => {
    try {
      setLoading(true);
      setResult(null);
      
      let notificationId;
      
      if (isDirectDeviceTest) {
        const notificationService = NotificationService.getInstance();
        notificationId = await notificationService.scheduleDeviceTestNotification();
        setResult(`تم إرسال إشعار مباشر للجهاز برقم: ${notificationId}`);
      } else {
        notificationId = await contextScheduleTestNotification();
        if (notificationId) {
          setResult('تم إرسال الإشعار التجريبي بنجاح! يرجى التحقق من الإشعارات على جهازك.');
        } else {
          setResult('حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
        }
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setResult('حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const testModelNotification = async (type, sendFunction) => {
    setLoading(true);
    setResult(null);
    try {
      const notificationId = await sendFunction(
        `اختبار ${type}`,
        `هذا إشعار تجريبي للتأكد من عمل ${type} بشكل صحيح`,
        type.includes('مبيدات') || type.includes('أعلاف') || type.includes('أسمدة') || type.includes('بذور') ? 'low_stock' : 
        type.includes('معدات') || type.includes('أدوات') ? 'maintenance' : 
        type.includes('حيوانات') ? 'vaccination' : 
        type.includes('محاصيل') ? 'expiry' : 'other'
      );
      
      if (notificationId) {
        setResult(`تم إرسال إشعار ${type} بنجاح! يرجى التحقق من الإشعارات على جهازك.`);
      } else {
        setResult('حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error(`Error sending ${type} notification:`, error);
      setResult('حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const runStockCheck = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const stockService = StockNotificationService.getInstance();
      await stockService.runManualStockCheck();
      
      setResult('تم تشغيل فحص المخزون يدويًا. تحقق من الإشعارات عند العثور على عناصر منخفضة أو منتهية الصلاحية.');
    } catch (error) {
      console.error('Error running stock check:', error);
      setResult('حدث خطأ أثناء تشغيل فحص المخزون. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Direct API test methods - try to directly load items from each API with proper error handling
  const testApiPesticides = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        setResult('يرجى تسجيل الدخول أولاً');
        return;
      }
      
      let notificationSent = false;
      
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/pesticides`,
          {
            headers: {
              'Authorization': `Bearer ${tokens.access}`
            }
          }
        );
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Get the first pesticide
          const pesticide = response.data[0];
          await schedulePesticideAlert(
            pesticide.name,
            `المخزون: ${pesticide.quantity}, الحد الأدنى: ${pesticide.minQuantityAlert}`,
            'low_stock'
          );
          notificationSent = true;
          setResult(`تم إرسال إشعار للمبيد: ${pesticide.name}`);
        } else {
          setResult('لم يتم العثور على مبيدات');
        }
      } catch (err) {
        console.error('Error fetching pesticides:', err);
        
        try {
          // Fallback to direct DB
          const response = await axios.get(
            `${process.env.EXPO_PUBLIC_API_URL}/pesticides`,
            {
              headers: {
                'Authorization': `Bearer ${tokens.access}`
              }
            }
          );
          
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            // Get the first pesticide
            const pesticide = response.data[0];
            await schedulePesticideAlert(
              pesticide.name,
              `تنبيه: المبيد ${pesticide.name} متاح`,
              'other'
            );
            notificationSent = true;
            setResult(`تم إرسال إشعار للمبيد: ${pesticide.name}`);
          } else {
            setResult('لم يتم العثور على مبيدات في قاعدة البيانات المباشرة');
          }
        } catch (innerError) {
          console.error('Error fetching from direct DB:', innerError);
          setResult('فشل في الوصول إلى المبيدات من جميع المصادر');
        }
      }
      
      if (!notificationSent) {
        // Send a general test pesticide alert
        await schedulePesticideAlert('اختبار مبيد', 'هذا اختبار إشعار مبيدات يدوي', 'low_stock');
        setResult('تم إرسال إشعار اختبار للمبيدات');
      }
    } catch (error) {
      console.error('General error testing pesticides:', error);
      setResult('خطأ عام في اختبار المبيدات');
    } finally {
      setLoading(false);
    }
  };

  const testApiTools = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        setResult('يرجى تسجيل الدخول أولاً');
        return;
      }
      
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/tools`,
          {
            headers: {
              'Authorization': `Bearer ${tokens.access}`
            }
          }
        );
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Get the first tool
          const tool = response.data[0];
          
          // Check for maintenance need
          if (tool.nextMaintenanceDate) {
            await scheduleToolAlert(
              tool.name,
              `أداة ${tool.name} تحتاج إلى صيانة`,
              'maintenance'
            );
            setResult(`تم إرسال إشعار صيانة للأداة: ${tool.name}`);
          } else {
            // Send a low stock alert instead
            await scheduleToolAlert(
              tool.name,
              `الكمية: ${tool.quantity}`,
              'low_stock'
            );
            setResult(`تم إرسال إشعار للأداة: ${tool.name}`);
          }
        } else {
          // Send a test alert
          await scheduleToolAlert('أداة اختبار', 'هذا اختبار إشعار أدوات', 'maintenance');
          setResult('تم إرسال إشعار اختبار للأدوات');
        }
      } catch (error) {
        console.error('Error testing tools:', error);
        // Send a test alert
        await scheduleToolAlert('أداة اختبار', 'هذا اختبار إشعار أدوات', 'maintenance');
        setResult('تم إرسال إشعار اختبار للأدوات');
      }
    } catch (error) {
      console.error('General error testing tools:', error);
      setResult('خطأ عام في اختبار الأدوات');
    } finally {
      setLoading(false);
    }
  };

  const testApiAnimals = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        setResult('يرجى تسجيل الدخول أولاً');
        return;
      }
      
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/animals`,
          {
            headers: {
              'Authorization': `Bearer ${tokens.access}`
            }
          }
        );
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Get the first animal
          const animal = response.data[0];
          
          await scheduleAnimalAlert(
            animal.name || 'حيوان',
            `حيوان ${animal.name || ''} يحتاج إلى اهتمام`,
            'vaccination'
          );
          setResult(`تم إرسال إشعار للحيوان: ${animal.name || 'حيوان'}`);
        } else {
          // Send a test alert
          await scheduleAnimalAlert('حيوان اختبار', 'هذا اختبار إشعار حيوانات', 'vaccination');
          setResult('تم إرسال إشعار اختبار للحيوانات');
        }
      } catch (error) {
        console.error('Error testing animals:', error);
        // Send a test alert
        await scheduleAnimalAlert('حيوان اختبار', 'هذا اختبار إشعار حيوانات', 'vaccination');
        setResult('تم إرسال إشعار اختبار للحيوانات');
      }
    } catch (error) {
      console.error('General error testing animals:', error);
      setResult('خطأ عام في اختبار الحيوانات');
    } finally {
      setLoading(false);
    }
  };

  const testApiEquipment = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        setResult('يرجى تسجيل الدخول أولاً');
        return;
      }
      
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/equipment`,
          {
            headers: {
              'Authorization': `Bearer ${tokens.access}`
            }
          }
        );
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Get the first equipment item
          const equipment = response.data[0];
          
          // Check for maintenance need
          if (equipment.nextMaintenanceDate) {
            const nextMaintenanceDate = new Date(equipment.nextMaintenanceDate);
            const now = new Date();
            const daysUntilMaintenance = Math.ceil((nextMaintenanceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            await scheduleEquipmentAlert(
              equipment.name,
              `معدات ${equipment.name} تحتاج إلى صيانة خلال ${daysUntilMaintenance} أيام`,
              'maintenance'
            );
            setResult(`تم إرسال إشعار صيانة للمعدات: ${equipment.name}`);
          } else {
            // Send a low stock alert instead
            await scheduleEquipmentAlert(
              equipment.name,
              `معدات ${equipment.name} متاحة حاليًا`,
              'other'
            );
            setResult(`تم إرسال إشعار للمعدات: ${equipment.name}`);
          }
        } else {
          // Send a test alert
          await scheduleEquipmentAlert('معدات اختبار', 'هذا اختبار إشعار معدات', 'maintenance');
          setResult('تم إرسال إشعار اختبار للمعدات');
        }
      } catch (error) {
        console.error('Error testing equipment:', error);
        // Send a test alert
        await scheduleEquipmentAlert('معدات اختبار', 'هذا اختبار إشعار معدات', 'maintenance');
        setResult('تم إرسال إشعار اختبار للمعدات');
      }
    } catch (error) {
      console.error('General error testing equipment:', error);
      setResult('خطأ عام في اختبار المعدات');
    } finally {
      setLoading(false);
    }
  };

  const testApiFeed = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        setResult('يرجى تسجيل الدخول أولاً');
        return;
      }
      
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/feed`,
          {
            headers: {
              'Authorization': `Bearer ${tokens.access}`
            }
          }
        );
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Get the first feed
          const feed = response.data[0];
          
          await scheduleFeedAlert(
            feed.name,
            `علف ${feed.name} - الكمية: ${feed.quantity}`,
            'low_stock'
          );
          setResult(`تم إرسال إشعار للعلف: ${feed.name}`);
        } else {
          // Send a test alert
          await scheduleFeedAlert('علف اختبار', 'هذا اختبار إشعار علف', 'low_stock');
          setResult('تم إرسال إشعار اختبار للعلف');
        }
      } catch (error) {
        console.error('Error testing feed:', error);
        // Send a test alert
        await scheduleFeedAlert('علف اختبار', 'هذا اختبار إشعار علف', 'low_stock');
        setResult('تم إرسال إشعار اختبار للعلف');
      }
    } catch (error) {
      console.error('General error testing feed:', error);
      setResult('خطأ عام في اختبار العلف');
    } finally {
      setLoading(false);
    }
  };

  const testApiFertilizer = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        setResult('يرجى تسجيل الدخول أولاً');
        return;
      }
      
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/fertilizer`,
          {
            headers: {
              'Authorization': `Bearer ${tokens.access}`
            }
          }
        );
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Get the first fertilizer
          const fertilizer = response.data[0];
          
          await scheduleFertilizerAlert(
            fertilizer.name,
            `سماد ${fertilizer.name} - الكمية: ${fertilizer.quantity}`,
            'low_stock'
          );
          setResult(`تم إرسال إشعار للسماد: ${fertilizer.name}`);
        } else {
          // Send a test alert
          await scheduleFertilizerAlert('سماد اختبار', 'هذا اختبار إشعار سماد', 'low_stock');
          setResult('تم إرسال إشعار اختبار للسماد');
        }
      } catch (error) {
        console.error('Error testing fertilizer:', error);
        // Send a test alert
        await scheduleFertilizerAlert('سماد اختبار', 'هذا اختبار إشعار سماد', 'low_stock');
        setResult('تم إرسال إشعار اختبار للسماد');
      }
    } catch (error) {
      console.error('General error testing fertilizer:', error);
      setResult('خطأ عام في اختبار السماد');
    } finally {
      setLoading(false);
    }
  };

  // Test button data - organized by category with icons and colors
  const testButtons = [
    { 
      id: 'test', 
      label: 'إشعار إختبار',
      description: 'إرسال إشعار عام للتأكد من عمل التنبيهات',
      icon: 'bell-ring', 
      color: '#4CAF50',
      action: () => sendTestNotification(false),
      primary: true
    },
    { 
      id: 'device-test', 
      label: 'إختبار الجهاز',
      description: 'إرسال إشعار مباشر إلى جهازك',
      icon: 'cellphone-check', 
      color: '#2196F3',
      action: () => sendTestNotification(true),
      primary: true
    },
    { 
      id: 'stock-check', 
      label: 'فحص المخزون الآن',
      description: 'فحص جميع العناصر ذات المخزون المنخفض والتواريخ المنتهية',
      icon: 'package-variant-closed-check', 
      color: '#FF9800',
      action: runStockCheck,
      primary: true
    },
  ];

  // Additional test options
  const additionalTests = [
    { id: 'pesticides', label: 'المبيدات', icon: 'spray', color: '#F44336', action: testApiPesticides },
    { id: 'tools', label: 'الأدوات', icon: 'tools', color: '#9C27B0', action: testApiTools },
    { id: 'animals', label: 'الحيوانات', icon: 'sheep', color: '#CDDC39', action: testApiAnimals },
    { id: 'equipment', label: 'المعدات', icon: 'tractor', color: '#2196F3', action: testApiEquipment },
    { id: 'feed', label: 'الأعلاف', icon: 'barley', color: '#795548', action: testApiFeed },
    { id: 'fertilizer', label: 'الأسمدة', icon: 'leaf', color: '#4CAF50', action: testApiFertilizer },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.header, { color: theme.colors.text }]}>
        إختبار نظام الإشعارات
      </Text>
      
      <Text style={[styles.subHeader, { color: theme.colors.text }]}>
        الإشعارات الأساسية
      </Text>
      
      <View style={styles.primaryButtonsContainer}>
        {testButtons.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={[
              styles.primaryButton,
              { backgroundColor: loading ? theme.colors.cardDisabled : button.color }
            ]}
            onPress={button.action}
            disabled={loading}
          >
            <MaterialCommunityIcons 
              name={button.icon} 
              size={28} 
              color="#fff" 
            />
            <Text style={styles.primaryButtonText}>{button.label}</Text>
            <Text style={styles.buttonDescription}>{button.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.subHeader, { color: theme.colors.text }]}>
        إشعارات حسب النوع
      </Text>

      <View style={styles.buttonGrid}>
        {additionalTests.map((test) => (
          <TouchableOpacity
            key={test.id}
            style={[
              styles.button,
              { backgroundColor: loading ? theme.colors.cardDisabled : test.color }
            ]}
            onPress={test.action}
            disabled={loading}
          >
            <MaterialCommunityIcons 
              name={test.icon} 
              size={28} 
              color="#fff" 
            />
            <Text style={styles.buttonText}>{test.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            جاري إرسال الإشعار...
          </Text>
        </View>
      )}

      {result && (
        <View 
          style={[
            styles.resultContainer, 
            { backgroundColor: result.includes('خطأ') ? '#FFEBEE' : '#E8F5E9' }
          ]}
        >
          <MaterialCommunityIcons 
            name={result.includes('خطأ') ? 'alert-circle' : 'check-circle'} 
            size={24} 
            color={result.includes('خطأ') ? '#D32F2F' : '#388E3C'} 
          />
          <Text 
            style={[
              styles.resultText, 
              { color: result.includes('خطأ') ? '#D32F2F' : '#388E3C' }
            ]}
          >
            {result}
          </Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <MaterialCommunityIcons 
          name="information-outline" 
          size={18} 
          color={theme.colors.secondary} 
        />
        <Text style={[styles.infoText, { color: theme.colors.text }]}>
          معلومات حول رمز الجهاز:
        </Text>
        <View style={styles.tokenContainer}>
          <Text style={[styles.tokenText, { color: theme.colors.secondary }]}>
            {deviceToken ? deviceToken.substring(0, 16) + '...' : 'لم يتم العثور على رمز'}
          </Text>
        </View>
      </View>
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 16,
    textAlign: 'right',
    paddingHorizontal: 8,
  },
  primaryButtonsContainer: {
    flexDirection: 'column',
    marginBottom: 16,
    gap: 12,
  },
  primaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-end',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flexGrow: 1,
    textAlign: 'right',
    marginHorizontal: 12,
  },
  buttonDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    position: 'absolute',
    bottom: 10,
    right: 56,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    width: '48%',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
  },
  resultText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    textAlign: 'right',
  },
  infoContainer: {
    marginTop: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 10,
    alignItems: 'flex-end',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tokenContainer: {
    width: '100%',
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  tokenText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default TestNotification; 