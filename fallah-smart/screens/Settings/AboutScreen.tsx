import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const AboutScreen = () => {
  const theme = useTheme();

  // Extract app version from Expo config
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  
  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  const contactLinks = [
    {
      name: 'البريد الإلكتروني',
      icon: 'email-outline',
      action: () => Linking.openURL('mailto:support@fallah-smart.com'),
    },
    {
      name: 'الموقع الإلكتروني',
      icon: 'web',
      action: () => openLink('https://fallah-smart.com'),
    },
    {
      name: 'فيسبوك',
      icon: 'facebook',
      action: () => openLink('https://facebook.com/fallah-smart'),
    },
    {
      name: 'انستغرام',
      icon: 'instagram',
      action: () => openLink('https://instagram.com/fallah-smart'),
    },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={[styles.appName, { color: theme.colors.text }]}>
        فلاح سمارت
      </Text>
      
      <Text style={[styles.version, { color: theme.colors.secondary }]}>
        الإصدار {appVersion}
      </Text>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary.base }]}>
          حول التطبيق
        </Text>
        <Text style={[styles.description, { color: theme.colors.text }]}>
          فلاح سمارت هو تطبيق متكامل يساعد المزارعين على إدارة مزارعهم بكفاءة وفعالية، ويقدم خدمات متنوعة مثل إدارة المخزون، ومتابعة الإنتاج الزراعي، والتواصل مع الخبراء الزراعيين، والحصول على نصائح وإرشادات زراعية.
        </Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary.base }]}>
          الاتصال بنا
        </Text>
        
        <View style={styles.contactLinks}>
          {contactLinks.map((link, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.contactItem,
                { backgroundColor: theme.colors.card?.background || theme.colors.neutral.surface }
              ]}
              onPress={link.action}
            >
              <MaterialCommunityIcons name={link.icon} size={24} color={theme.colors.primary.base} />
              <Text style={[styles.contactText, { color: theme.colors.text }]}>
                {link.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.copyright, { color: theme.colors.secondary }]}>
          © 2024 فلاح سمارت. جميع الحقوق محفوظة.
        </Text>
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
    alignItems: 'center',
  },
  logoContainer: {
    marginVertical: 24,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  version: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  sectionContainer: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'right',
  },
  description: {
    fontSize: 16,
    textAlign: 'right',
    lineHeight: 24,
  },
  contactLinks: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 16,
    marginRight: 12,
    fontWeight: '500',
  },
  footer: {
    marginTop: 24,
    marginBottom: 16,
  },
  copyright: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AboutScreen; 