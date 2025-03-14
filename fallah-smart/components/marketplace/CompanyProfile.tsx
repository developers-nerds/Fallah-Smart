import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { Product } from './MarketplaceFeed';
import { Auction } from './AuctionHouse';

interface CompanyStats {
  totalProducts: number;
  activeAuctions: number;
  completedAuctions: number;
  totalOrders: number;
  totalRevenue: string;
  avgRating: number;
  totalReviews: number;
  memberSince: string;
}

interface CompanyDetails {
  name: string;
  logo: string;
  coverImage: string;
  description: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  certifications: string[];
  specializations: string[];
  stats: CompanyStats;
}

interface Order {
  id: string;
  productName: string;
  buyerName: string;
  amount: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
}

// Mock data for the company profile
const companyData: CompanyDetails = {
  name: 'Al-Falah Agricultural Solutions',
  logo: 'https://via.placeholder.com/150',
  coverImage: 'https://via.placeholder.com/1200x400',
  description:
    'Leading provider of agricultural solutions in Saudi Arabia. Specializing in high-quality farming equipment, seeds, and smart irrigation systems. Committed to advancing sustainable agriculture through innovation and technology.',
  location: 'Riyadh, Saudi Arabia',
  website: 'www.alfalah-agri.sa',
  email: 'contact@alfalah-agri.sa',
  phone: '+966 11 234 5678',
  certifications: [
    'ISO 9001:2015',
    'Organic Farming Certified',
    'Saudi GAP Certified',
    'Agricultural Excellence Award 2023',
  ],
  specializations: [
    'Smart Irrigation Systems',
    'Organic Farming Solutions',
    'Agricultural Equipment',
    'Premium Seeds',
    'Farm Management Systems',
  ],
  stats: {
    totalProducts: 156,
    activeAuctions: 12,
    completedAuctions: 48,
    totalOrders: 1250,
    totalRevenue: 'SAR 12.5M',
    avgRating: 4.8,
    totalReviews: 450,
    memberSince: 'January 2020',
  },
};

const recentOrders: Order[] = [
  {
    id: '1',
    productName: 'Premium Wheat Seeds (50kg)',
    buyerName: 'Desert Farms Co.',
    amount: 'SAR 12,500',
    status: 'delivered',
    date: '2024-03-15',
  },
  {
    id: '2',
    productName: 'Smart Irrigation Controller',
    buyerName: 'Green Oasis Agriculture',
    amount: 'SAR 8,750',
    status: 'shipped',
    date: '2024-03-14',
  },
  {
    id: '3',
    productName: 'Organic Fertilizer (100 bags)',
    buyerName: 'Al-Madinah Farms',
    amount: 'SAR 15,000',
    status: 'processing',
    date: '2024-03-13',
  },
];

export const CompanyProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'auctions' | 'orders' | 'reviews'
  >('overview');

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statsCard}>
          <MaterialCommunityIcons
            name="package-variant"
            size={24}
            color={theme.colors.primary.base}
          />
          <Text style={styles.statsNumber}>{companyData.stats.totalProducts}</Text>
          <Text style={styles.statsLabel}>Products</Text>
        </View>
        <View style={styles.statsCard}>
          <FontAwesome5 name="gavel" size={24} color={theme.colors.primary.base} />
          <Text style={styles.statsNumber}>{companyData.stats.activeAuctions}</Text>
          <Text style={styles.statsLabel}>Active Auctions</Text>
        </View>
        <View style={styles.statsCard}>
          <MaterialCommunityIcons name="shopping" size={24} color={theme.colors.primary.base} />
          <Text style={styles.statsNumber}>{companyData.stats.totalOrders}</Text>
          <Text style={styles.statsLabel}>Orders</Text>
        </View>
        <View style={styles.statsCard}>
          <MaterialCommunityIcons name="star" size={24} color={theme.colors.primary.base} />
          <Text style={styles.statsNumber}>{companyData.stats.avgRating}</Text>
          <Text style={styles.statsLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Us</Text>
        <Text style={styles.description}>{companyData.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specializations</Text>
        <View style={styles.tagsContainer}>
          {companyData.specializations.map((spec, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{spec}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certifications</Text>
        <View style={styles.certificationsContainer}>
          {companyData.certifications.map((cert, index) => (
            <View key={index} style={styles.certificationItem}>
              <MaterialCommunityIcons
                name="certificate"
                size={20}
                color={theme.colors.secondary.base}
              />
              <Text style={styles.certificationText}>{cert}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {recentOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderProduct}>{order.productName}</Text>
              <Text style={styles.orderAmount}>{order.amount}</Text>
            </View>
            <View style={styles.orderDetails}>
              <Text style={styles.orderBuyer}>{order.buyerName}</Text>
              <View style={[styles.orderStatus, styles[`status${order.status}`]]}>
                <Text style={styles.orderStatusText}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={styles.orderDate}>{order.date}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary.base} />
            <Text style={styles.contactText}>{companyData.location}</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="web" size={20} color={theme.colors.primary.base} />
            <Text style={styles.contactText}>{companyData.website}</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary.base} />
            <Text style={styles.contactText}>{companyData.email}</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary.base} />
            <Text style={styles.contactText}>{companyData.phone}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Company Header */}
      <View style={styles.header}>
        <Image source={{ uri: companyData.coverImage }} style={styles.coverImage} />
        <View style={styles.headerContent}>
          <Image source={{ uri: companyData.logo }} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyData.name}</Text>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{companyData.stats.avgRating}</Text>
              <Text style={styles.reviews}>({companyData.stats.totalReviews} reviews)</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.primary.base} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}>
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'products' && styles.activeTab]}
            onPress={() => setActiveTab('products')}>
            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
              Products
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'auctions' && styles.activeTab]}
            onPress={() => setActiveTab('auctions')}>
            <Text style={[styles.tabText, activeTab === 'auctions' && styles.activeTabText]}>
              Auctions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
            onPress={() => setActiveTab('orders')}>
            <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
              Orders
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}>
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverviewTab()}
        {/* Other tabs will be implemented similarly */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  header: {
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.medium,
  },
  coverImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginTop: -30,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.neutral.surface,
    borderBottomLeftRadius: theme.borderRadius.medium,
    borderBottomRightRadius: theme.borderRadius.medium,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.colors.neutral.surface,
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.small,
  },
  companyInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  companyName: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
  },
  reviews: {
    marginLeft: 4,
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
  },
  tabsContainer: {
    backgroundColor: theme.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    marginBottom: theme.spacing.xs,
  },
  tab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary.base,
  },
  tabText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
  },
  activeTabText: {
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.bold,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statsCard: {
    width: '48%',
    backgroundColor: theme.colors.neutral.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  statsNumber: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginVertical: theme.spacing.xs,
  },
  statsLabel: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.primary.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  tagText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
  },
  certificationsContainer: {
    gap: theme.spacing.sm,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
  },
  certificationText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
  },
  orderCard: {
    backgroundColor: theme.colors.neutral.background,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  orderProduct: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    flex: 1,
  },
  orderAmount: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  orderBuyer: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  orderStatus: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
  },
  statuspending: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  statusprocessing: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  statusshipped: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  statusdelivered: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  statuscancelled: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
  },
  orderStatusText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
  },
  orderDate: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  contactInfo: {
    gap: theme.spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
  },
  contactText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
});
