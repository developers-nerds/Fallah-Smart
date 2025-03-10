import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface MessageAlertProps {
  visible: boolean;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
}

const MessageAlert: React.FC<MessageAlertProps> = ({ visible, message, type = 'error' }) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 50,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getAlertStyle = () => {
    switch (type) {
      case 'error':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.95)',
          icon: 'error-outline',
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.95)',
          icon: 'warning',
        };
      case 'info':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.95)',
          icon: 'info-outline',
        };
      case 'success':
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.95)',
          icon: 'check-circle-outline',
        };
    }
  };

  const alertStyle = getAlertStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}>
      <View style={[styles.alertBox, { backgroundColor: alertStyle.backgroundColor }]}>
        <MaterialIcons name={alertStyle.icon} size={24} color="#fff" style={styles.icon} />
        <Text style={styles.alertText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  icon: {
    marginRight: 12,
  },
  alertText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default MessageAlert;
