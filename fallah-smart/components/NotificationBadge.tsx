import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

interface NotificationBadgeProps {
  onPress?: () => void;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ onPress }) => {
  const theme = useTheme();
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) return null;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.primary.base }]}
      onPress={onPress}
    >
      <MaterialCommunityIcons name="bell" size={24} color="white" />
      <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
        <Text style={styles.badgeText}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default NotificationBadge; 