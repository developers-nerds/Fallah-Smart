import { Alert, ToastAndroid, Platform } from 'react-native';

/**
 * Helper utility for showing simple notifications and toasts
 * to enhance the user experience with immediate feedback
 */
const NotificationHelper = {
  /**
   * Show a toast message on Android or an alert on iOS
   */
  showToast: (message: string, duration: 'short' | 'long' = 'short') => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, duration === 'short' ? ToastAndroid.SHORT : ToastAndroid.LONG);
    } else {
      // On iOS we use an alert with a timeout
      const alert = Alert.alert('تنبيه', message);
      setTimeout(() => {
        // @ts-ignore - Alert returns void but we still want to dismiss it if possible
        if (alert && typeof alert.dismiss === 'function') {
          alert.dismiss();
        }
      }, duration === 'short' ? 2000 : 3500);
    }
  },

  /**
   * Show a success message
   */
  showSuccess: (message: string) => {
    NotificationHelper.showToast(`✅ ${message}`, 'short');
  },

  /**
   * Show an error message
   */
  showError: (message: string) => {
    NotificationHelper.showToast(`❌ ${message}`, 'long');
  },

  /**
   * Show a warning message
   */
  showWarning: (message: string) => {
    NotificationHelper.showToast(`⚠️ ${message}`, 'long');
  },

  /**
   * Show an info message
   */
  showInfo: (message: string) => {
    NotificationHelper.showToast(`ℹ️ ${message}`, 'short');
  },

  /**
   * Show a confirmation dialog with Yes/No options
   */
  showConfirmation: (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void
  ) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'لا',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'نعم',
          onPress: onConfirm,
        },
      ],
      { cancelable: false }
    );
  }
};

export default NotificationHelper; 