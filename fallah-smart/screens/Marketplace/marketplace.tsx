import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MarketplaceFeed, Product } from '../../components/marketplace/MarketplaceFeed';
import { AuctionHouse } from '../../components/marketplace/AuctionHouse';
import { CompanyProfile } from '../../components/marketplace/CompanyProfile';
import { theme } from '../../theme/theme';
import { normalize, scaleSize, isSmallDevice, responsivePadding } from '../../utils/responsive';

// Mock data
const marketplaceFeedData: Product[] = [
  {
    id: '1',
    companyName: 'Green Harvest Co.',
    avatar: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
    image: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
    description:
      'Premium quality wheat seeds available in bulk. Guaranteed 95% germination rate. Ideal for spring planting.',
    price: 'SAR 1,200 / ton',
    quantity: '50 tons available',
    timePosted: '2 hours ago',
    minimumOrder: '5 tons',
    deliveryTime: '7-10 days',
    certification: 'ISO 9001, Organic Certified',
    specifications: {
      variety: 'Hard Red Winter Wheat',
      purity: '99.5%',
      germination: '95%',
      moisture: '12%',
      origin: 'Saudi Arabia',
    } as { [key: string]: string },
  },
  {
    id: '2',
    companyName: 'Desert Oasis Farms',
    avatar: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
    image: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
    description:
      'Organic fertilizer made from natural composting. Enriched with micronutrients for better yield. Perfect for vegetables.',
    price: 'SAR 300 / bag',
    quantity: '1000 bags available',
    timePosted: '5 hours ago',
    minimumOrder: '50 bags',
    deliveryTime: '3-5 days',
    certification: 'Organic Certified, Safe for Food Crops',
    specifications: {
      type: 'Organic Compost',
      npk: '10-5-10',
      weight: '25kg per bag',
      ingredients: 'Plant matter, manure, beneficial microbes',
      shelfLife: '2 years',
    } as { [key: string]: string },
  },
  {
    id: '3',
    companyName: 'Al-Falah Agricultural Supplies',
    avatar: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
    image: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
    description:
      'High-efficiency irrigation systems. Reduces water usage by 40%. Complete installation available.',
    price: 'SAR 5,000 / system',
    quantity: '25 systems available',
    timePosted: '1 day ago',
    minimumOrder: '1 system',
    deliveryTime: '14-21 days',
    certification: 'Water Efficiency Grade A, 5-Year Warranty',
    specifications: {
      coverage: 'Up to 5 hectares',
      waterSaving: '40% compared to traditional methods',
      components: 'Pipes, drippers, controllers, sensors',
      powerSource: 'Solar with battery backup',
      lifespan: '10+ years with proper maintenance',
    } as { [key: string]: string },
  },
];

const auctionData = [
  {
    id: '1',
    itemName: 'John Deere 8R Tractor',
    image: 'https://via.placeholder.com/400x300',
    images: [
      'https://via.placeholder.com/800x600',
      'https://via.placeholder.com/800x600',
      'https://via.placeholder.com/800x600',
    ],
    description:
      'Well-maintained premium tractor with 2000 hours. Comes with full set of attachments including plough, harrow, and precision farming equipment. Recently serviced with all new fluids and filters.',
    detailedSpecs:
      'Engine: 410 HP\nTransmission: AutoPowr/IVT\nYear: 2020\nCondition: Excellent\nWarranty: 6 months remaining on drive train',
    currentBid: 'SAR 350,000',
    startingBid: 'SAR 300,000',
    timeRemaining: '2 days, 5 hours',
    bidCount: 12,
    isFinished: false,
    seller: {
      name: 'Al-Riyadh Farm Equipment',
      rating: 4.9,
      verified: true,
      image: 'https://via.placeholder.com/100',
    },
    bids: [
      { user: 'Abdullah M.', amount: 'SAR 350,000', time: '4 hours ago', isHighest: true },
      {
        user: 'Farming Solutions LLC',
        amount: 'SAR 345,000',
        time: '6 hours ago',
        isHighest: false,
      },
      { user: 'Mohammed A.', amount: 'SAR 340,000', time: '8 hours ago', isHighest: false },
      { user: 'AgriBusiness Co.', amount: 'SAR 335,000', time: '10 hours ago', isHighest: false },
      { user: 'Desert Farms Inc.', amount: 'SAR 330,000', time: '12 hours ago', isHighest: false },
    ],
  },
  {
    id: '2',
    itemName: 'Large Irrigation System',
    image: 'https://via.placeholder.com/400x300',
    images: [
      'https://via.placeholder.com/800x600',
      'https://via.placeholder.com/800x600',
      'https://via.placeholder.com/800x600',
    ],
    description:
      'Complete center pivot irrigation system covering 50 hectares. 3 years old. Includes smart control system with mobile app integration and weather sensors.',
    detailedSpecs:
      'Coverage: 50 hectares\nWater Efficiency: 95%\nYear: 2021\nSmart Control: Yes\nPower Source: Solar/Electric hybrid',
    currentBid: 'SAR 120,000',
    startingBid: 'SAR 90,000',
    timeRemaining: '8 hours',
    bidCount: 8,
    isFinished: false,
    seller: {
      name: 'Modern Irrigation Co.',
      rating: 4.7,
      verified: true,
      image: 'https://via.placeholder.com/100',
    },
    bids: [
      {
        user: 'Sustainable Farms Ltd.',
        amount: 'SAR 120,000',
        time: '2 hours ago',
        isHighest: true,
      },
      {
        user: 'Green Desert Collective',
        amount: 'SAR 115,000',
        time: '5 hours ago',
        isHighest: false,
      },
      { user: 'Faisal Agri-Tech', amount: 'SAR 110,000', time: '6 hours ago', isHighest: false },
      { user: 'Oasis Technologies', amount: 'SAR 100,000', time: '12 hours ago', isHighest: false },
    ],
  },
  {
    id: '3',
    itemName: 'Grain Storage Silos',
    image: 'https://via.placeholder.com/400x300',
    images: [
      'https://via.placeholder.com/800x600',
      'https://via.placeholder.com/800x600',
      'https://via.placeholder.com/800x600',
    ],
    description:
      'Set of 5 steel grain silos. 200 ton capacity each. Good condition with temperature monitoring system and aeration fans. Includes transport and installation.',
    detailedSpecs:
      'Capacity: 5 x 200 tons\nMaterial: Galvanized steel\nAge: 5 years\nMonitoring: Digital\nIncludes: Installation',
    currentBid: 'SAR 85,000',
    startingBid: 'SAR 70,000',
    timeRemaining: '4 days, 12 hours',
    bidCount: 5,
    isFinished: false,
    seller: {
      name: 'Saudi Storage Solutions',
      rating: 4.8,
      verified: true,
      image: 'https://via.placeholder.com/100',
    },
    bids: [
      { user: 'Grain Processing Co.', amount: 'SAR 85,000', time: '1 day ago', isHighest: true },
      { user: 'Al-Madinah Farms', amount: 'SAR 80,000', time: '2 days ago', isHighest: false },
      {
        user: 'Royal Agricultural Ventures',
        amount: 'SAR 75,000',
        time: '3 days ago',
        isHighest: false,
      },
    ],
  },
  {
    id: '4',
    itemName: 'Premium Harvester',
    image: 'https://via.placeholder.com/400x300',
    images: [
      'https://via.placeholder.com/800x600',
      'https://via.placeholder.com/800x600',
      'https://via.placeholder.com/800x600',
    ],
    description:
      'Top-of-the-line harvester with precision cutting technology and advanced cabin features. Only 500 operating hours.',
    detailedSpecs:
      'Model: CLAAS LEXION 8900\nHours: 500\nYear: 2022\nCutting width: 12m\nGrain tank: 13,500 L',
    currentBid: 'SAR 650,000',
    startingBid: 'SAR 600,000',
    timeRemaining: 'Auction Ended',
    bidCount: 15,
    isFinished: true,
    seller: {
      name: 'Premium Farm Equipment',
      rating: 4.9,
      verified: true,
      image: 'https://via.placeholder.com/100',
    },
    bids: [
      { user: 'Elite Farming Corp', amount: 'SAR 650,000', time: '4 days ago', isHighest: true },
      { user: 'AgriKing LLC', amount: 'SAR 645,000', time: '4 days ago', isHighest: false },
      {
        user: 'Royal Wheat Producers',
        amount: 'SAR 640,000',
        time: '5 days ago',
        isHighest: false,
      },
    ],
  },
];

const Marketplace = () => {
  const [activeTab, setActiveTab] = useState('feed');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return <MarketplaceFeed data={marketplaceFeedData} />;
      case 'auction':
        return <AuctionHouse data={auctionData} />;
      case 'company':
        return <CompanyProfile />;
      default:
        return <MarketplaceFeed data={marketplaceFeedData} />;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Farming Marketplace</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}>
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'auction' && styles.activeTab]}
          onPress={() => setActiveTab('auction')}>
          <Text style={[styles.tabText, activeTab === 'auction' && styles.activeTabText]}>
            Auctions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'company' && styles.activeTab]}
          onPress={() => setActiveTab('company')}>
          <Text style={[styles.tabText, activeTab === 'company' && styles.activeTabText]}>
            My Company
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>{renderTabContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  header: {
    fontSize: normalize(isSmallDevice ? 20 : 24),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    textAlign: 'center',
    padding: responsivePadding(theme.spacing.md),
    backgroundColor: theme.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    ...theme.shadows.medium,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral.surface,
    paddingHorizontal: responsivePadding(theme.spacing.sm),
    paddingVertical: responsivePadding(theme.spacing.xs),
    ...theme.shadows.small,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: responsivePadding(theme.spacing.sm),
    borderBottomWidth: isSmallDevice ? 2 : 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary.base,
  },
  tabText: {
    fontFamily: theme.fonts.medium,
    fontSize: normalize(isSmallDevice ? 13 : 14),
    color: theme.colors.neutral.textSecondary,
  },
  activeTabText: {
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.bold,
  },
  contentContainer: {
    flex: 1,
  },
});

export default Marketplace;
