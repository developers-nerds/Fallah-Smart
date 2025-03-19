import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import { storage } from '../../utils/storage';

const TestNotification = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const sendTestNotification = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        setResult('يرجى تسجيل الدخول أولا');
        setLoading(false);
        return;
      }
      
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications/test`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );
      
      console.log('Test notification response:', response.data);
      
      if (response.data.success) {
        setResult(
          response.data.note 
            ? `${response.data.message}. ملاحظة: ${response.data.note}`
            : 'تم إرسال الإشعار التجريبي بنجاح! يرجى التحقق من الإشعارات على جهازك.'
        );
      } else {
        setResult('حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      if (error.response) {
        console.error('Server error details:', {
          status: error.response.status,
          data: error.response.data
        });
      }
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