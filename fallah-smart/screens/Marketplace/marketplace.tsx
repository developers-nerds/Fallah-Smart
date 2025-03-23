import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StockStackParamList } from '../../navigation/types';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { MarketplaceFeed, Product } from '../../components/marketplace/MarketplaceFeed';
import { AuctionHouse } from '../../components/marketplace/AuctionHouse';
import { CompanyProfile } from '../../components/marketplace/CompanyProfile';
import { theme } from '../../theme/theme';
import { normalize, scaleSize, isSmallDevice, responsivePadding } from '../../utils/responsive';
import { storage } from '../../utils/storage';

// Define the navigation prop type
type MarketplaceScreenNavigationProp = NativeStackNavigationProp<
  StockStackParamList,
  'Marketplace'
>;

// Mock data for auctions (keeping this until you implement real auction fetching)
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
  const [isSupplier, setIsSupplier] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<MarketplaceScreenNavigationProp>();
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;

  // This will run once on component mount
  useEffect(() => {
    checkIfSupplier();
  }, []);

  // This will run every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Marketplace screen is focused, refreshing data...');
      // Check supplier status first, then fetch products
      checkIfSupplier().then(() => {
        fetchProducts();
      });

      return () => {
        // Optional cleanup if needed
      };
    }, [])
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      // First check if baseUrl is defined
      if (!baseUrl) {
        console.error('API URL is undefined. Check your .env file');
        setError('API configuration error. Please contact support.');
        setLoading(false);
        return;
      }

      const url = `${baseUrl}/crops/listings`;
      console.log(`Fetching marketplace listings from: ${url}`);

      // Use axios for consistent API handling
      const response = await axios.get(url);
      console.log('Response status:', response.status);

      // Axios automatically throws for non-200 responses and parses JSON
      const data = response.data;
      console.log('Fetched products data:', data);

      // Debug supplier information
      if (data.cropListings && data.cropListings.length > 0) {
        console.log('First listing supplier data:', data.cropListings[0].supplier);
      }

      // If no listings are found, handle that gracefully
      if (!data.cropListings || data.cropListings.length === 0) {
        console.log('No products found');
        setProducts([]);
        setLoading(false);
        return;
      }

      // Transform API data to match the Product interface
      const formattedProducts: Product[] = data.cropListings.map((listing: any) => {
        // Debug each supplier
        if (!listing.supplier) {
          console.log('Missing supplier for listing:', listing.id, listing);
        } else {
          console.log('Supplier found for listing:', listing.id, listing.supplier.company_name);
        }

        return {
          id: listing.id.toString(),
          companyName: listing.supplier?.company_name || 'Unknown Supplier',
          avatar:
            listing.supplier?.company_logo ||
            'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
          image: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png', // Default image for now
          description: listing.description || listing.crop_name, // Use crop_name if description is missing
          price: `${listing.currency} ${listing.price} / ${listing.unit}`,
          quantity: `${listing.quantity} ${listing.unit} available`,
          timePosted: new Date(listing.createdAt).toLocaleDateString(),
          minimumOrder: '1 unit', // Default
          deliveryTime: '2-5 days', // Default value
          certification: 'Standard Quality', // Default value
          specifications: {
            Category: listing.sub_category || 'General',
            'Listing Type': listing.listing_type || 'Fixed Price',
            Status: listing.status || 'Active',
          },
        };
      });

      console.log(`Processed ${formattedProducts.length} products for display`);
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      if (axios.isAxiosError(error)) {
        // Get more detailed error info
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        setError(`Failed to load products: ${error.response?.data?.message || error.message}`);
      } else {
        setError('Failed to load products. Please check your connection and try again.');
      }
      setProducts([]); // Set empty array so UI can render properly
    } finally {
      setLoading(false);
    }
  };

  const checkIfSupplier = async () => {
    try {
      const { access } = await storage.getTokens();
      if (!access) {
        console.log('No access token found');
        setIsSupplier(false);
        return;
      }

      console.log('Checking supplier status with token');

      const url = `${baseUrl}/suppliers/me`;
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

        console.log('Supplier check response:', response.status);
        console.log('Supplier data:', response.data);

        // Only set isSupplier to true if we have both a supplier account AND a valid userId
        const hasValidSupplier =
          response.data.hasAccount && response.data.supplier && response.data.supplier.id;

        console.log('Has valid supplier profile:', hasValidSupplier);

        // Update UI state based on the check
        if (hasValidSupplier !== isSupplier) {
          console.log('Updating supplier status from', isSupplier, 'to', hasValidSupplier);
          setIsSupplier(hasValidSupplier);
        }
      } catch (error) {
        console.error('Error in supplier check:', error);
        if (axios.isAxiosError(error)) {
          console.error('Supplier check error details:', error.response?.data);
        }
        setIsSupplier(false);
      }
    } catch (error) {
      console.error('Error checking supplier status:', error);
      setIsSupplier(false);
    }
  };

  const handleAddProduct = () => {
    try {
      console.log('Attempting to navigate to AddProduct screen');

      // Check if we're a supplier first
      if (!isSupplier) {
        Alert.alert('Permission Error', 'You must be registered as a supplier to add products');
        return;
      }

      // Navigate to AddProduct screen
      navigation.navigate('AddProduct');
      console.log('Navigation to AddProduct requested');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', 'Could not navigate to Add Product screen');
    }
  };

  // Function to force refresh supplier status
  const forceRefreshSupplierStatus = () => {
    console.log('Forcing refresh of supplier status');
    checkIfSupplier().then(() => {
      console.log('Supplier status refresh complete, current status:', isSupplier);
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        if (loading) {
          return (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary.base} />
            </View>
          );
        }

        if (error) {
          return (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          );
        }

        return <MarketplaceFeed data={products} />;
      case 'auction':
        return <AuctionHouse data={auctionData} />;
      case 'company':
        return <CompanyProfile />;
      default:
        return <MarketplaceFeed data={products} />;
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

      {isSupplier && activeTab === 'feed' && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddProduct}
          testID="add-product-button">
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      )}
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
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary.base,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.fonts.medium,
    textAlign: 'center',
  },
});

export default Marketplace;
