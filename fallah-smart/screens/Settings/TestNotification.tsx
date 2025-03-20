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

  const notificationTypes = [
    { 
      label: 'إشعار عام', 
      sendFunction: () => contextScheduleTestNotification(), 
      icon: 'bell' 
    },
    { label: 'إشعار مبيدات', sendFunction: schedulePesticideAlert, icon: 'spray' },
    { label: 'إشعار حيوانات', sendFunction: scheduleAnimalAlert, icon: 'cow' },
    { label: 'إشعار معدات', sendFunction: scheduleEquipmentAlert, icon: 'tractor' },
    { label: 'إشعار أعلاف', sendFunction: scheduleFeedAlert, icon: 'food-variant' },
    { label: 'إشعار أسمدة', sendFunction: scheduleFertilizerAlert, icon: 'barrel' },
    { label: 'إشعار محاصيل', sendFunction: scheduleHarvestAlert, icon: 'corn' },
    { label: 'إشعار بذور', sendFunction: scheduleSeedAlert, icon: 'seed' },
    { label: 'إشعار أدوات', sendFunction: scheduleToolAlert, icon: 'tools' }
  ];

  const additionalTests = [
    { 
      label: 'اختبار مبيد API', 
      action: testApiPesticides,
      icon: 'flask' 
    },
    { 
      label: 'اختبار أدوات API', 
      action: testApiTools,
      icon: 'tools' 
    },
    { 
      label: 'اختبار حيوانات API', 
      action: testApiAnimals,
      icon: 'cow' 
    },
    { 
      label: 'اختبار معدات API', 
      action: testApiEquipment,
      icon: 'tractor' 
    },
    { 
      label: 'اختبار علف API', 
      action: testApiFeed,
      icon: 'food-variant' 
    },
    { 
      label: 'اختبار سماد API', 
      action: testApiFertilizer,
      icon: 'bottle-tonic' 
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.surface }]}>
      <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
        اختبار الإشعارات
      </Text>
      
      <TouchableOpacity
        style={[styles.directButton, { backgroundColor: theme.colors.secondary.base }]}
        onPress={() => sendTestNotification(true)}
        disabled={loading}
      >
        <View style={styles.buttonContent}>
          <MaterialCommunityIcons name="cellphone" size={20} color="#fff" />
          <Text style={styles.buttonText}>اختبار مباشر للجهاز</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.directButton, { backgroundColor: theme.colors.error.base }]}
        onPress={() => runStockCheck()}
        disabled={loading}
      >
        <View style={styles.buttonContent}>
          <MaterialCommunityIcons name="package-variant-closed-check" size={20} color="#fff" />
          <Text style={styles.buttonText}>فحص المخزون الآن</Text>
        </View>
      </TouchableOpacity>
      
      {deviceToken && (
        <View style={styles.tokenContainer}>
          <Text style={[styles.tokenTitle, { color: theme.colors.neutral.textSecondary }]}>
            رمز الجهاز:
          </Text>
          <Text style={[styles.tokenText, { color: theme.colors.neutral.textPrimary }]}>
            {deviceToken || 'لم يتم العثور على رمز'}
          </Text>
        </View>
      )}

      <ScrollView style={styles.testButtonsContainer}>
        {notificationTypes.map((type, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.button, { 
              backgroundColor: theme.colors.primary.base,
              marginTop: index > 0 ? 8 : 0 
            }]}
            onPress={() => {
              if (index === 0) {
                sendTestNotification(false);
              } else {
                testModelNotification(type.label, type.sendFunction);
              }
            }}
            disabled={loading}
          >
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons name={type.icon} size={20} color="#fff" />
              <Text style={styles.buttonText}>{type.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Additional test section */}
      <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
        اختبارات API مباشرة
      </Text>
      <ScrollView style={styles.testButtonsContainer}>
        {additionalTests.map((test, index) => (
          <TouchableOpacity
            key={`direct-${index}`}
            style={[styles.button, { 
              backgroundColor: theme.colors.secondary.dark,
              marginTop: index > 0 ? 8 : 0 
            }]}
            onPress={test.action}
            disabled={loading}
          >
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons name={test.icon} size={20} color="#fff" />
              <Text style={styles.buttonText}>{test.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {loading && <ActivityIndicator size="large" color={theme.colors.primary.base} style={styles.loader} />}
      
      {result && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, { color: theme.colors.neutral.textPrimary }]}>{result}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'right',
  },
  directButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tokenContainer: {
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  tokenTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 12,
  },
  testButtonsContainer: {
    flex: 1,
    maxHeight: 300,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loader: {
    marginTop: 16,
  },
  resultContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  resultText: {
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'right',
  },
});

export default TestNotification; 