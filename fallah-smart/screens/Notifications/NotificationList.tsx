import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import WebView from 'react-native-webview';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  status: 'pending' | 'read' | 'actioned';
  createdAt: string;
  readAt: string | null;
  relatedModelType: string | null;
  relatedModelId: number | null;
  data?: {
    modelType?: string;
    itemName?: string;
    type?: string;
    fullMessage?: string;
    [key: string]: any;
  };
}

const NotificationListScreen: React.FC = () => {
  const theme = useTheme();
  const { 
    markAsRead, 
    markAllAsRead, 
    updateUnreadCount, 
    refreshNotifications, 
    notifications,
    scheduleTestNotification 
  } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('خطأ', 'فشل في تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (notification.status === 'pending') {
      await markAsRead(notification.id);
      await updateUnreadCount();
    }

    // Show the notification details modal
    setSelectedNotification(notification);
    setModalVisible(true);

    // Navigate to related item if available (after closing modal)
    if (notification.relatedModelType && notification.relatedModelId) {
      // Add navigation logic here based on relatedModelType
      // Will be executed when modal is closed if needed
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('خطأ', 'فشل في تحديث حالة الإشعارات');
    }
  };

  const handleTestNotification = async () => {
    try {
      const notificationId = await scheduleTestNotification();
      if (notificationId) {
        Alert.alert('تم', 'تم إرسال إشعار تجريبي');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('خطأ', 'فشل في إرسال الإشعار التجريبي');
    }
  };

  const getNotificationIcon = (type: string, modelType?: string) => {
    // First check type-specific icons
    switch (type) {
      case 'low_stock':
        return 'package-variant';
      case 'expiry':
        return 'clock-alert';
      case 'maintenance':
        return 'tools';
      case 'vaccination':
        return 'needle';
      case 'breeding':
        return 'heart-pulse';
      case 'harvest':
        return 'sprout';
      case 'feed':
        return 'food';
    }

    // Then check model-specific icons if type doesn't have a specific icon
    switch (modelType) {
      case 'pesticide':
        return 'flask';
      case 'animal':
        return 'cow';
      case 'equipment':
        return 'tractor';
      case 'feed':
        return 'food-variant';
      case 'fertilizer':
        return 'bottle-tonic';
      case 'harvest':
        return 'basket';
      case 'seed':
        return 'seed';
      case 'tool':
        return 'hammer';
      default:
        return 'bell';
    }
  };

  const getIconColor = (type: string, modelType?: string) => {
    switch (type) {
      case 'low_stock':
        return '#FF9800'; // Orange
      case 'expiry':
        return '#F44336'; // Red
      case 'maintenance':
        return '#2196F3'; // Blue
      case 'vaccination':
        return '#9C27B0'; // Purple
      case 'breeding':
        return '#E91E63'; // Pink
      default:
        // If no specific type, use model-based colors
        switch (modelType) {
          case 'pesticide':
            return '#F44336'; // Red
          case 'animal':
            return '#CDDC39'; // Lime
          case 'equipment':
            return '#2196F3'; // Blue
          case 'feed':
            return '#795548'; // Brown
          case 'fertilizer':
            return '#4CAF50'; // Green
          case 'harvest':
            return '#FF9800'; // Orange
          case 'seed':
            return '#8BC34A'; // Light Green
          case 'tool':
            return '#9C27B0'; // Purple
          default:
            return '#757575'; // Grey
        }
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    // Get model type from either the data object or the relatedModelType
    const modelType = item.data?.modelType || item.relatedModelType;
    // Get alert type from either the data object type or the main notification type
    const alertType = item.data?.type || item.type;
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.status === 'pending' 
              ? theme.colors.primaryLight 
              : theme.colors.background,
          },
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[
          styles.iconContainer, 
          { backgroundColor: `${getIconColor(alertType, modelType)}20` }
        ]}>
          <MaterialCommunityIcons
            name={getNotificationIcon(alertType, modelType)}
            size={24}
            color={getIconColor(alertType, modelType)}
          />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: theme.colors.text, fontSize: 17 }]}>
            {item.title}
            {item.data?.itemName && ` - ${item.data.itemName}`}
          </Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary, fontSize: 15 }]}>
            {item.message}
          </Text>
          <Text style={[styles.time, { color: theme.colors.textTertiary }]}>
            {format(new Date(item.createdAt), 'PPpp', { locale: ar })}
          </Text>
        </View>
        {item.status === 'pending' && (
          <View style={[styles.unreadIndicator, { backgroundColor: theme.colors.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="bell-outline"
        size={64}
        color={theme.colors.textTertiary}
      />
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        لا توجد إشعارات
      </Text>
    </View>
  );

  // Render notification detail modal
  const renderNotificationDetailModal = () => {
    if (!selectedNotification) return null;
    
    const modelType = selectedNotification.data?.modelType || selectedNotification.relatedModelType;
    const alertType = selectedNotification.data?.type || selectedNotification.type;
    const color = getIconColor(alertType, modelType);
    const iconName = getNotificationIcon(alertType, modelType);
    
    // If the notification has HTML fullMessage content, render it with WebView
    if (selectedNotification.data?.fullMessage) {
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Arial', sans-serif;
                direction: rtl;
                padding: 0;
                margin: 0;
                color: #333;
                background-color: ${theme.colors.background};
              }
            </style>
          </head>
          <body>
            ${selectedNotification.data.fullMessage}
          </body>
        </html>
      `;
      
      return (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  تفاصيل الإشعار
                </Text>
              </View>
              
              <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={styles.webView}
              />
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: color }]}
                onPress={handleCloseModal}
              >
                <Text style={styles.actionButtonText}>حسنًا</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }
    
    // Otherwise, render standard detail view
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                تفاصيل الإشعار
              </Text>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={[styles.modalIconContainer, { backgroundColor: `${color}20` }]}>
                <MaterialCommunityIcons name={iconName} size={48} color={color} />
              </View>
              
              <Text style={[styles.modalItemTitle, { color: theme.colors.text }]}>
                {selectedNotification.title}
                {selectedNotification.data?.itemName && 
                  ` - ${selectedNotification.data.itemName}`}
              </Text>
              
              <Text style={[styles.modalItemMessage, { color: theme.colors.textSecondary }]}>
                {selectedNotification.message}
              </Text>
              
              <Text style={[styles.modalItemTime, { color: theme.colors.textTertiary }]}>
                {format(new Date(selectedNotification.createdAt), 'PPpp', { locale: ar })}
              </Text>
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: color }]}
              onPress={handleCloseModal}
            >
              <Text style={styles.actionButtonText}>حسنًا</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>الإشعارات</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleTestNotification}
          >
            <MaterialCommunityIcons name="bell-ring" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
          {notifications.length > 0 && (
            <TouchableOpacity style={styles.headerButton} onPress={handleMarkAllAsRead}>
              <MaterialCommunityIcons
                name="check-all"
                size={22}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyListContent : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={renderEmptyList}
        />
      )}
      
      {renderNotificationDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.9,
    maxHeight: Dimensions.get('window').height * 0.8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    left: 12,
    top: 12,
    padding: 4,
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalItemTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalItemMessage: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  modalItemTime: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionButton: {
    margin: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webView: {
    flex: 1,
    height: 300,
    margin: 8,
  },
});

export default NotificationListScreen; 