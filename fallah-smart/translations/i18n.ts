import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Arabic translations
const arTranslations = {
  settings: {
    title: 'الإعدادات',
    subtitle: 'خصص تطبيقك حسب تفضيلاتك',
    appearance: {
      title: 'المظهر',
      description: 'الوضع الداكن / الوضع الفاتح',
    },
    language: {
      title: 'اللغة',
      description: 'العربية',
      settingsTitle: 'إعدادات اللغة',
      selectLanguage: 'اختر اللغة',
      changeLanguageHint: 'يمكنك تغيير لغة التطبيق من هنا',
      restartNote: 'تطبيق تغيير اللغة قد يتطلب إعادة تشغيل التطبيق',
    },
    notifications: {
      title: 'إعدادات الإشعارات',
      description: 'تخصيص الإشعارات التي تريد استلامها',
      testTitle: 'اختبار الإشعارات',
      testDescription: 'التأكد من عمل نظام الإشعارات',
    },
    about: {
      title: 'حول التطبيق',
      description: 'معلومات عن التطبيق والإصدار',
      appDescription: 'فلاح سمارت هو تطبيق متكامل يساعد المزارعين على إدارة مزارعهم بكفاءة وفعالية، ويقدم خدمات متنوعة مثل إدارة المخزون، ومتابعة الإنتاج الزراعي، والتواصل مع الخبراء الزراعيين، والحصول على نصائح وإرشادات زراعية.',
      version: 'الإصدار',
      contactTitle: 'الاتصال بنا',
      copyright: '© 2024 فلاح سمارت. جميع الحقوق محفوظة.',
    },
    contact: {
      title: 'تواصل معنا',
      description: 'للاستفسارات والمساعدة',
      subtitle: 'نحن هنا للإجابة على استفساراتك ومساعدتك',
      nameLabel: 'الاسم',
      emailLabel: 'البريد الإلكتروني',
      messageLabel: 'الرسالة',
      submitButton: 'إرسال',
      otherContactTitle: 'وسائل التواصل الأخرى',
      error: 'خطأ',
      nameError: 'الرجاء إدخال الاسم',
      emailError: 'الرجاء إدخال بريد إلكتروني صحيح',
      messageError: 'الرجاء إدخال الرسالة',
      success: 'تم الإرسال',
      successMessage: 'تم إرسال رسالتك بنجاح، سنتواصل معك قريبًا',
      ok: 'حسنًا',
    },
    categories: {
      general: 'العامة',
      notificationsAlerts: 'الإشعارات والتنبيهات',
      supportHelp: 'الدعم والمساعدة',
    },
  },
};

// English translations
const enTranslations = {
  settings: {
    title: 'Settings',
    subtitle: 'Customize your app according to your preferences',
    appearance: {
      title: 'Appearance',
      description: 'Dark mode / Light mode',
    },
    language: {
      title: 'Language',
      description: 'English',
      settingsTitle: 'Language Settings',
      selectLanguage: 'Select Language',
      changeLanguageHint: 'You can change the app language here',
      restartNote: 'Applying language change may require restarting the app',
    },
    notifications: {
      title: 'Notification Settings',
      description: 'Customize notifications you want to receive',
      testTitle: 'Test Notifications',
      testDescription: 'Verify that the notification system is working',
    },
    about: {
      title: 'About the App',
      description: 'Information about the app and version',
      appDescription: 'Fallah Smart is an integrated application that helps farmers manage their farms efficiently and effectively, and provides various services such as inventory management, agricultural production tracking, communication with agricultural experts, and obtaining agricultural advice and guidance.',
      version: 'Version',
      contactTitle: 'Contact Us',
      copyright: '© 2024 Fallah Smart. All rights reserved.',
    },
    contact: {
      title: 'Contact Us',
      description: 'For inquiries and assistance',
      subtitle: 'We are here to answer your questions and help you',
      nameLabel: 'Name',
      emailLabel: 'Email',
      messageLabel: 'Message',
      submitButton: 'Send',
      otherContactTitle: 'Other Contact Methods',
      error: 'Error',
      nameError: 'Please enter your name',
      emailError: 'Please enter a valid email',
      messageError: 'Please enter a message',
      success: 'Sent',
      successMessage: 'Your message has been sent successfully, we will contact you soon',
      ok: 'OK',
    },
    categories: {
      general: 'General',
      notificationsAlerts: 'Notifications & Alerts',
      supportHelp: 'Support & Help',
    },
  },
};

// Configure i18next
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      ar: { translation: arTranslations },
      en: { translation: enTranslations },
    },
    lng: 'ar', // Default language
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 