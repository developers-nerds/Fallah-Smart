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
import axios from 'axios';
import { storage } from '../../utils/storage';
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
  const { markAsRead, markAllAsRead, updateUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (pageNum: number = 1) => {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) return;

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications`,
        {
          params: {
            page: pageNum,
            limit: 20,
          },
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );

      // Handle different API response formats
      let newNotifications: Notification[] = [];
      if (Array.isArray(response.data)) {
        // If response.data is already an array of notifications
        newNotifications = response.data;
      } else if (response.data.notifications && Array.isArray(response.data.notifications)) {
        // If response.data has a notifications property that is an array
        newNotifications = response.data.notifications;
      } else {
        console.error('Unexpected notification data format:', response.data);
        newNotifications = [];
      }

      setNotifications(prev =>
        pageNum === 1 ? newNotifications : [...prev, ...newNotifications]
      );
      setHasMore(newNotifications.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response) {
        console.error('Response error details:', error.response.status, error.response.data);
      }
      Alert.alert('خطأ', 'فشل في تحميل الإشعارات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1);
  };

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    fetchNotifications(page + 1);
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
      await updateUnreadCount();
      await fetchNotifications(1);
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('خطأ', 'فشل في تحديث حالة الإشعارات');
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
          backgroundColor: theme.colors.neutral.surface,
          borderLeftColor: item.status === 'pending' ? theme.colors.primary.base : 'transparent',
        },
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <MaterialCommunityIcons
            name={getNotificationIcon(item.type)}
            size={24}
            color={theme.colors.primary.base}
          />
          <Text style={[styles.notificationTitle, { color: theme.colors.neutral.textPrimary }]}>
            {item.title}
          </Text>
        </View>
        <Text style={[styles.notificationMessage, { color: theme.colors.neutral.textSecondary }]}>
          {item.message}
        </Text>
        <Text style={[styles.notificationTime, { color: theme.colors.neutral.textTertiary }]}>
          {format(new Date(item.createdAt), 'PPp', { locale: ar })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
          الإشعارات
        </Text>
        {notifications.length > 0 && (
          <TouchableOpacity
            style={[styles.markAllRead, { backgroundColor: theme.colors.primary.base }]}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllReadText}>تعليم الكل كمقروء</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="bell-off"
              size={48}
              color={theme.colors.neutral.textSecondary}
            />
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              لا توجد إشعارات
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  markAllRead: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllReadText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default NotificationListScreen; 