import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  PixelRatio,
} from 'react-native';
import { theme } from '../../theme/theme';
import { normalize, scaleSize, isSmallDevice, responsivePadding } from '../../utils/responsive';

// Types
export interface Company {
  id: string;
  name: string;
  logo: string;
  description: string;
  founded: string;
  location: string;
  specialization: string;
  rating: number;
  reviews: number;
}

interface CompanyProfilesProps {
  data: Company[];
}

// Get screen dimensions for responsive calculations
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scale factor based on screen size - optimized for iPhone SE as baseline
const scale = SCREEN_WIDTH / 320;

// Function to normalize font sizes across different screen sizes
const normalize = (size: number) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

// Utility function to scale dimensions for spacing
const scaleSize = (size: number) => {
  return Math.max(size * scale, size * 0.7); // Sets a minimum scaling of 70% of original size
};

export const CompanyProfiles: React.FC<CompanyProfilesProps> = ({ data }) => {
  console.log('CompanyProfiles received data:', data);

  const [baseUrl, setBaseUrl] = useState<string>('');
  const BaseUrl = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    // Extract base URL from API URL by removing '/api'
    if (BaseUrl) {
      setBaseUrl(BaseUrl.replace('/api', ''));
    }
  }, []);

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => {
        console.log('Rendering company profile:', item.name);
        return (
          <View style={styles.companyCard}>
            <View style={styles.companyHeader}>
              <View style={styles.logoContainer}>
                <Image
                  source={{
                    uri: item.logo.startsWith('http') ? item.logo : `${baseUrl}${item.logo}`,
                  }}
                  style={styles.companyLogo}
                  onLoad={() => console.log(`Company logo loaded for ${item.name}`)}
                  onError={(error) =>
                    console.log(`Error loading logo for ${item.name}:`, error.nativeEvent.error)
                  }
                />
              </View>
              <View style={styles.companyHeaderText}>
                <Text style={styles.companyTitle} numberOfLines={1} ellipsizeMode="tail">
                  {item.name}
                </Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}>★ {item.rating}</Text>
                  <Text style={styles.reviews}>({item.reviews} reviews)</Text>
                </View>
              </View>
            </View>

            <Text
              style={styles.companyDescription}
              numberOfLines={SCREEN_WIDTH < 350 ? 2 : 3}
              ellipsizeMode="tail">
              {item.description}
            </Text>

            <View style={styles.companyDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Founded:</Text>
                <Text style={styles.detailValue}>{item.founded}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                  {item.location}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Specialization:</Text>
                <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                  {item.specialization}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.viewProfileButton,
                SCREEN_WIDTH < 350 ? styles.smallDeviceButton : {},
              ]}>
              <Text style={styles.viewProfileButtonText}>
                {SCREEN_WIDTH < 350 ? 'View Profile' : 'View Full Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: scaleSize(theme.spacing.sm),
  },
  companyCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: scaleSize(theme.borderRadius.medium),
    marginBottom: responsivePadding(theme.spacing.sm),
    padding: responsivePadding(theme.spacing.md),
    ...theme.shadows.medium,
    width: '100%',
  },
  companyHeader: {
    flexDirection: 'row',
    marginBottom: scaleSize(theme.spacing.md),
    alignItems: 'center',
  },
  logoContainer: {
    // Adding a dedicated container for the logo ensures consistent spacing
    width: scaleSize(isSmallDevice ? 35 : 40),
    height: scaleSize(isSmallDevice ? 35 : 40),
    borderRadius: scaleSize(isSmallDevice ? 17.5 : 20),
    overflow: 'hidden',
    marginRight: scaleSize(theme.spacing.sm),
    backgroundColor: theme.colors.neutral.gray.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogo: {
    width: '100%',
    height: '100%',
    borderRadius: scaleSize(20),
  },
  companyHeaderText: {
    flex: 1,
    justifyContent: 'center',
  },
  companyTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: normalize(isSmallDevice ? 14 : 16),
    lineHeight: normalize(isSmallDevice ? 18 : 20),
    color: theme.colors.primary.base,
    marginBottom: scaleSize(theme.spacing.xs),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontFamily: theme.fonts.bold,
    fontSize: normalize(theme.fontSizes.body),
    color: theme.colors.secondary.base,
    marginRight: scaleSize(theme.spacing.xs),
  },
  reviews: {
    fontFamily: theme.fonts.regular,
    fontSize: normalize(theme.fontSizes.caption),
    color: theme.colors.neutral.textSecondary,
  },
  companyDescription: {
    fontFamily: theme.fonts.regular,
    fontSize: normalize(isSmallDevice ? 13 : 14),
    lineHeight: normalize(isSmallDevice ? 18 : 20),
    color: theme.colors.neutral.textPrimary,
    marginBottom: responsivePadding(theme.spacing.sm),
  },
  companyDetails: {
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: scaleSize(theme.borderRadius.small),
    padding: SCREEN_WIDTH < 350 ? scaleSize(theme.spacing.xs) : scaleSize(theme.spacing.sm),
    marginBottom: scaleSize(theme.spacing.md),
  },
  detailItem: {
    flexDirection: isSmallDevice ? 'column' : 'row',
    marginBottom: responsivePadding(theme.spacing.xs),
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: normalize(isSmallDevice ? 12 : 13),
    color: theme.colors.neutral.textPrimary,
    width: isSmallDevice ? '100%' : '35%',
    minWidth: isSmallDevice ? 0 : scaleSize(90),
  },
  detailValue: {
    fontFamily: theme.fonts.regular,
    fontSize: normalize(isSmallDevice ? 12 : 13),
    color: theme.colors.neutral.textPrimary,
    flex: 1,
    marginTop: isSmallDevice ? responsivePadding(2) : 0,
  },
  viewProfileButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: responsivePadding(isSmallDevice ? theme.spacing.xs : theme.spacing.sm),
    paddingHorizontal: responsivePadding(theme.spacing.md),
    borderRadius: scaleSize(theme.borderRadius.medium),
    alignItems: 'center',
    ...theme.shadows.small,
  },
  smallDeviceButton: {
    paddingVertical: scaleSize(theme.spacing.xs),
    paddingHorizontal: scaleSize(theme.spacing.sm),
  },
  viewProfileButtonText: {
    fontFamily: theme.fonts.medium,
    fontSize: normalize(isSmallDevice ? 13 : 14),
    color: '#FFFFFF',
  },
});
