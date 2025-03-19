import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

const TestNotification = () => {
  const { colors } = useTheme();
  const { scheduleTestNotification, deviceToken } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const sendTestNotification = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const notificationId = await scheduleTestNotification();
      
      if (notificationId) {
        setResult('تم إرسال الإشعار التجريبي بنجاح! يرجى التحقق من الإشعارات على جهازك.');
      } else {
        setResult('حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setResult('حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>اختبار الإشعارات</Text>
      <Text style={[styles.description, { color: colors.text }]}>
        انقر على الزر أدناه لإرسال إشعار تجريبي إلى جهازك للتأكد من عمل نظام الإشعارات بشكل صحيح.
      </Text>
      
      {deviceToken && (
        <View style={styles.tokenContainer}>
          <Text style={[styles.tokenLabel, { color: colors.text }]}>معرف الجهاز:</Text>
          <Text style={[styles.tokenText, { color: colors.text }]} numberOfLines={2} ellipsizeMode="middle">
            {deviceToken}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={sendTestNotification}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>إرسال إشعار تجريبي</Text>
        )}
      </TouchableOpacity>
      
      {result && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, { color: colors.text }]}>{result}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  description: {
    marginBottom: 16,
    textAlign: 'right',
  },
  tokenContainer: {
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  tokenLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  tokenText: {
    fontSize: 12,
    textAlign: 'center',
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
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
});

export default TestNotification; 