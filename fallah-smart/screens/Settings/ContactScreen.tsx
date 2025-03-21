import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ContactScreen = () => {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!name.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال الاسم');
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      Alert.alert('خطأ', 'الرجاء إدخال بريد إلكتروني صحيح');
      return;
    }

    if (!message.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال الرسالة');
      return;
    }

    setLoading(true);

    // Simulate sending message to backend
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'تم الإرسال', 
        'تم إرسال رسالتك بنجاح، سنتواصل معك قريبًا',
        [
          { 
            text: 'حسنًا', 
            onPress: () => {
              // Clear form
              setName('');
              setEmail('');
              setMessage('');
            } 
          }
        ]
      );
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            تواصل معنا
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.secondary }]}>
            نحن هنا للإجابة على استفساراتك ومساعدتك
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>الاسم</Text>
            <View style={[
              styles.inputWrapper, 
              { 
                borderColor: theme.colors.neutral.border,
                backgroundColor: theme.colors.neutral.surface
              }
            ]}>
              <MaterialCommunityIcons name="account" size={20} color={theme.colors.secondary} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="أدخل اسمك الكامل"
                placeholderTextColor={theme.colors.secondary}
                value={name}
                onChangeText={setName}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>البريد الإلكتروني</Text>
            <View style={[
              styles.inputWrapper, 
              { 
                borderColor: theme.colors.neutral.border,
                backgroundColor: theme.colors.neutral.surface
              }
            ]}>
              <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.secondary} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="أدخل بريدك الإلكتروني"
                placeholderTextColor={theme.colors.secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>الرسالة</Text>
            <View style={[
              styles.textAreaWrapper, 
              { 
                borderColor: theme.colors.neutral.border,
                backgroundColor: theme.colors.neutral.surface
              }
            ]}>
              <TextInput
                style={[styles.textArea, { color: theme.colors.text }]}
                placeholder="اكتب رسالتك هنا..."
                placeholderTextColor={theme.colors.secondary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                textAlign="right"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.colors.primary.base },
              loading && { opacity: 0.7 }
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>إرسال</Text>
                <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.contactInfo}>
          <Text style={[styles.contactInfoTitle, { color: theme.colors.primary.base }]}>
            وسائل التواصل الأخرى
          </Text>

          <View style={styles.contactMethods}>
            <View style={[
              styles.contactMethod, 
              { backgroundColor: theme.colors.card?.background || theme.colors.neutral.surface }
            ]}>
              <MaterialCommunityIcons name="email" size={24} color={theme.colors.primary.base} />
              <Text style={[styles.contactMethodText, { color: theme.colors.text }]}>
                support@fallah-smart.com
              </Text>
            </View>

            <View style={[
              styles.contactMethod, 
              { backgroundColor: theme.colors.card?.background || theme.colors.neutral.surface }
            ]}>
              <MaterialCommunityIcons name="phone" size={24} color={theme.colors.primary.base} />
              <Text style={[styles.contactMethodText, { color: theme.colors.text }]}>
                +216 XX XXX XXX
              </Text>
            </View>

            <View style={[
              styles.contactMethod, 
              { backgroundColor: theme.colors.card?.background || theme.colors.neutral.surface }
            ]}>
              <MaterialCommunityIcons name="map-marker" size={24} color={theme.colors.primary.base} />
              <Text style={[styles.contactMethodText, { color: theme.colors.text }]}>
                تونس، الجمهورية التونسية
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  textArea: {
    fontSize: 16,
    minHeight: 120,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  contactInfo: {
    marginTop: 8,
  },
  contactInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'right',
  },
  contactMethods: {
    gap: 12,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
    borderRadius: 8,
  },
  contactMethodText: {
    fontSize: 16,
    marginRight: 12,
  },
});

export default ContactScreen; 