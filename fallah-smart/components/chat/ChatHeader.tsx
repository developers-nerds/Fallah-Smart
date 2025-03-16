import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface ChatHeaderProps {
  onMenuPress: () => void;
  onResetPress: () => void;
  showReset: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onMenuPress, onResetPress, showReset }) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;
  const isMediumScreen = width < 400;

  const getResponsiveFontSize = (baseSize: number) => {
    if (isSmallScreen) return baseSize - 2;
    if (isMediumScreen) return baseSize - 1;
    return baseSize;
  };

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md },
      ]}>
      <TouchableOpacity
        style={[
          styles.historyButton,
          { paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md },
        ]}
        onPress={onMenuPress}
        activeOpacity={0.7}>
        <MaterialIcons
          name="menu"
          size={isSmallScreen ? 20 : 22}
          color={theme.colors.primary.base}
        />
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              {
                fontSize: getResponsiveFontSize(theme.fontSizes.h2),
                lineHeight: getResponsiveFontSize(theme.fontSizes.h2) * 1.2,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            فلاح سمارت
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                fontSize: getResponsiveFontSize(theme.fontSizes.caption),
                lineHeight: getResponsiveFontSize(theme.fontSizes.caption) * 1.2,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            المساعد الذكي
          </Text>
        </View>
      </TouchableOpacity>
      {showReset && (
        <TouchableOpacity
          onPress={onResetPress}
          style={[
            styles.newChatButton,
            { paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md },
          ]}
          activeOpacity={0.7}>
          <MaterialIcons
            name="refresh"
            size={isSmallScreen ? 18 : 20}
            color={theme.colors.neutral.surface}
          />
          <Text
            style={[
              styles.newChatText,
              {
                fontSize: getResponsiveFontSize(theme.fontSizes.caption),
                lineHeight: getResponsiveFontSize(theme.fontSizes.caption) * 1.2,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            محادثة جديدة
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.select({
      ios: theme.spacing.md,
      android: theme.spacing.sm,
    }),
    backgroundColor: theme.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    ...theme.shadows.small,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.surface,
    paddingVertical: Platform.select({
      ios: theme.spacing.sm,
      android: theme.spacing.xs,
    }),
    borderRadius: theme.borderRadius.medium,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    textAlign: 'right',
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginTop: 2,
    textAlign: 'right',
    includeFontPadding: false,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.base,
    paddingVertical: Platform.select({
      ios: theme.spacing.sm,
      android: theme.spacing.xs,
    }),
    borderRadius: theme.borderRadius.medium,
    minWidth: 100,
    justifyContent: 'center',
    ...theme.shadows.small,
  },
  newChatText: {
    color: theme.colors.neutral.surface,
    fontFamily: theme.fonts.medium,
    marginLeft: theme.spacing.xs,
    textAlign: 'right',
    includeFontPadding: false,
  },
});

export default ChatHeader;
