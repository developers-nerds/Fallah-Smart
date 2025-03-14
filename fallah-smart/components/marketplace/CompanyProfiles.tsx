import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

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

export const CompanyProfiles: React.FC<CompanyProfilesProps> = ({ data }) => {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.companyCard}>
          <View style={styles.companyHeader}>
            <Image source={{ uri: item.logo }} style={styles.companyLogo} />
            <View style={styles.companyHeaderText}>
              <Text style={styles.companyTitle}>{item.name}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>★ {item.rating}</Text>
                <Text style={styles.reviews}>({item.reviews} reviews)</Text>
              </View>
            </View>
          </View>
          <Text style={styles.companyDescription}>{item.description}</Text>
          <View style={styles.companyDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Founded:</Text>
              <Text style={styles.detailValue}>{item.founded}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{item.location}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Specialization:</Text>
              <Text style={styles.detailValue}>{item.specialization}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewProfileButton}>
            <Text style={styles.viewProfileButtonText}>View Full Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  companyCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    ...theme.shadows.medium,
  },
  companyHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  companyHeaderText: {
    flex: 1,
    justifyContent: 'center',
  },
  companyTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.h2,
    color: theme.colors.primary.base,
    marginBottom: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.body,
    color: theme.colors.secondary.base,
    marginRight: theme.spacing.xs,
  },
  reviews: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textSecondary,
  },
  companyDescription: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.md,
  },
  companyDetails: {
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textPrimary,
    width: 120,
  },
  detailValue: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textPrimary,
    flex: 1,
  },
  viewProfileButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  viewProfileButtonText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.button,
    color: '#FFFFFF',
  },
  companyLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: theme.spacing.sm,
  },
});
