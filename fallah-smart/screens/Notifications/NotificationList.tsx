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
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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
    if (notification.status === 'pending') {
      await markAsRead(notification.id);
      await updateUnreadCount();
    }

    // Navigate to related item if available
    if (notification.relatedModelType && notification.relatedModelId) {
      // Add navigation logic here based on relatedModelType
      // For example:
      // navigation.navigate(notification.relatedModelType, { id: notification.relatedModelId });
    }
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

  const getNotificationIcon = (type: string) => {
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
      default:
        return 'bell';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
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
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={getNotificationIcon(item.type)}
          size={24}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
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
});

export default NotificationListScreen; 