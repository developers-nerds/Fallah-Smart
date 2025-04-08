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
  ScrollView,
  Modal,
  StatusBar,
  Dimensions,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StockStackParamList } from '../../navigation/types';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { MarketplaceFeed, Product } from '../../components/marketplace/MarketplaceFeed';
import { CompanyProfile } from '../../components/marketplace/CompanyProfile';
import { SupplierProfile } from '../../components/marketplace/SupplierProfile';
import { theme } from '../../theme/theme';
import { normalize, scaleSize, isSmallDevice, responsivePadding } from '../../utils/responsive';
import { storage } from '../../utils/storage';

// Define the navigation prop type
type MarketplaceScreenNavigationProp = NativeStackNavigationProp<
  StockStackParamList,
  'Marketplace'
>;

const Marketplace = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [isSupplier, setIsSupplier] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
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

  // Add this to make the refresh function globally available
  useEffect(() => {
    // Create a global function that can be called from the MarketplaceFeed component
    if (window) {
      window.refreshMarketplaceProducts = fetchProducts;
      window.viewSupplierProfile = viewSupplierProfile;
    }

    return () => {
      // Clean up when component unmounts
      if (window) {
        delete window.refreshMarketplaceProducts;
        delete window.viewSupplierProfile;
      }
    };
  }, []);

  // Add this to make the showProductDetail function globally available
  useEffect(() => {
    // Create global functions that can be called from other components
    if (window) {
      window.refreshMarketplaceProducts = fetchProducts;
      window.viewSupplierProfile = viewSupplierProfile;
      window.showProductDetail = handleProductSelect;
    }

    return () => {
      // Clean up when component unmounts
      if (window) {
        delete window.refreshMarketplaceProducts;
        delete window.viewSupplierProfile;
        delete window.showProductDetail;
      }
    };
  }, []);

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
        // Debug supplier data for each listing
        console.log(`Supplier for listing ${listing.id}:`, listing.supplier);
        console.log(`Phone number from supplier:`, listing.supplier?.company_phone);

        // Extract media/images from the listing
        const mediaItems = listing.media || [];

        // Format image URLs correctly - remove '/api' if present
        const imageUrls = mediaItems.map((media: any) => {
          let imageUrl = media.url || '';
          // Make sure URLs don't have /api prefix
          if (imageUrl.startsWith('/api/')) {
            imageUrl = imageUrl.replace('/api/', '/');
          }
          // Ensure URL starts with baseUrl (without the /api part)
          return `${baseUrl.replace('/api', '')}${imageUrl}`;
        });

        // Format company logo URL correctly
        let companyLogo = listing.supplier?.company_logo || '';
        if (companyLogo.startsWith('/api/')) {
          companyLogo = companyLogo.replace('/api/', '/');
        }
        companyLogo = companyLogo
          ? `${baseUrl.replace('/api', '')}${companyLogo}`
          : 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';

        // Default image if no images are available
        const defaultImage =
          'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';

        return {
          id: listing.id.toString(),
          supplierId: listing.supplierId.toString(),
          companyName: listing.supplier?.company_name || 'Unknown Supplier',
          avatar: companyLogo,
          phoneNumber: listing.supplier?.company_phone || '',
          image: imageUrls.length > 0 ? imageUrls[0] : defaultImage,
          images: imageUrls.length > 0 ? imageUrls : [defaultImage],
          description: listing.description || listing.crop_name,
          price: `${listing.currency} ${listing.price} / ${listing.unit}`,
          quantity: `${listing.quantity} ${listing.unit} available`,
          timePosted: new Date(listing.createdAt).toLocaleDateString(),
          minimumOrder: `${listing.min_order_quantity || 1} ${listing.unit}`,
          deliveryTime: '2-5 days',
          certification: 'Standard Quality',
          specifications: {
            Category: listing.sub_category || 'General',
            'Listing Type': listing.listing_type || 'Fixed Price',
            Status: listing.status || 'Active',
            'Minimum Order': `${listing.min_order_quantity || 1} ${listing.unit}`,
          },
        };
      });

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      if (axios.isAxiosError(error)) {
        // Get more detailed error info
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        setError(
          `فشل في تحميل المنتجات. يرجى التحقق من اتصالك والمحاولة مرة أخرى. ${error.response?.data?.message || error.message}`
        );
      } else {
        setError('فشل في تحميل المنتجات. يرجى التحقق من اتصالك والمحاولة مرة أخرى.');
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
        Alert.alert('خطأ في الصلاحيات', 'يجب أن تكون مسجلاً كمورد لإضافة المنتجات');
        return;
      }

      // Navigate to AddProduct screen
      navigation.navigate('AddProduct');
      console.log('Navigation to AddProduct requested');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('خطأ في التنقل', 'لا يمكن الانتقال إلى صفحة إضافة المنتج');
    }
  };

  // Function to force refresh supplier status
  const forceRefreshSupplierStatus = () => {
    console.log('Forcing refresh of supplier status');
    checkIfSupplier().then(() => {
      console.log('Supplier status refresh complete, current status:', isSupplier);
    });
  };

  const viewSupplierProfile = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setActiveTab('supplier');
  };

  const handleBackToFeed = () => {
    setSelectedSupplierId(null);
    setActiveTab('feed');
  };

  // Add this function to handle product selection and show details
  const handleProductSelect = (product: Product) => {
    console.log('Product selected for details:', product.id);
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  // Add this function to close product details
  const closeProductDetail = () => {
    setDetailModalVisible(false);
    setSelectedProduct(null);
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
      case 'company':
        return (
          <View style={{ flex: 1 }}>
            <CompanyProfile />
          </View>
        );
      case 'supplier':
        return (
          <SupplierProfile
            supplierId={selectedSupplierId}
            onProductSelect={handleProductSelect}
            onBackToAllSuppliers={handleBackToFeed}
          />
        );
      default:
        return <MarketplaceFeed data={products} />;
    }
  };

  // Add a function to render product detail modal
  const renderProductDetailModal = () => {
    if (!selectedProduct) return null;

    const windowWidth = Dimensions.get('window').width;

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={detailModalVisible}
        onRequestClose={closeProductDetail}>
        <StatusBar barStyle="light-content" />
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeProductDetail} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>تفاصيل المنتج</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalScrollView}>
            {/* Image Carousel */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const contentOffset = event.nativeEvent.contentOffset;
                const viewSize = event.nativeEvent.layoutMeasurement;
                const index = Math.floor(contentOffset.x / viewSize.width);
                setActiveImageIndex(index);
              }}
              scrollEventThrottle={16}>
              {selectedProduct.images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img }}
                  style={[styles.carouselImage, { width: windowWidth }]}
                />
              ))}
            </ScrollView>

            {selectedProduct.images.length > 1 && (
              <View style={styles.paginationContainer}>
                {selectedProduct.images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === activeImageIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}

            <View style={styles.detailSection}>
              <View style={styles.companyInfoContainer}>
                <TouchableOpacity onPress={() => viewSupplierProfile(selectedProduct.supplierId)}>
                  <Image
                    source={{ uri: selectedProduct.avatar }}
                    style={styles.companyDetailLogo}
                  />
                </TouchableOpacity>
                <View>
                  <Text style={styles.companyDetailName}>{selectedProduct.companyName}</Text>
                  <Text style={styles.timePostedDetail}>{selectedProduct.timePosted}</Text>
                </View>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => {
                    if (selectedProduct.phoneNumber) {
                      Linking.openURL(`tel:${selectedProduct.phoneNumber}`);
                    } else {
                      Alert.alert('خطأ', 'رقم الهاتف غير متوفر');
                    }
                  }}>
                  <Text style={styles.contactButtonText}>تواصل مع المورد</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.productDetailTitle}>{selectedProduct.description}</Text>

              <View style={styles.pricingContainer}>
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>السعر</Text>
                  <Text style={styles.pricingValue}>{selectedProduct.price}</Text>
                </View>
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>متوفر</Text>
                  <Text style={styles.pricingValue}>{selectedProduct.quantity}</Text>
                </View>
              </View>

              <View style={styles.orderInfoContainer}>
                <View style={styles.orderInfoItem}>
                  <MaterialCommunityIcons
                    name="package-variant"
                    size={20}
                    color={theme.colors.primary.base}
                  />
                  <Text style={styles.orderInfoText}>
                    الحد الأدنى للطلب: {selectedProduct.minimumOrder}
                  </Text>
                </View>
                <View style={styles.orderInfoItem}>
                  <MaterialCommunityIcons
                    name="truck-delivery"
                    size={20}
                    color={theme.colors.primary.base}
                  />
                  <Text style={styles.orderInfoText}>التوصيل: {selectedProduct.deliveryTime}</Text>
                </View>
              </View>

              <View style={styles.certificationContainer}>
                <Text style={styles.sectionTitle}>الشهادات</Text>
                <View style={styles.certificationBadge}>
                  <MaterialCommunityIcons
                    name="certificate"
                    size={18}
                    color={theme.colors.secondary.base}
                  />
                  <Text style={styles.certificationText}>{selectedProduct.certification}</Text>
                </View>
              </View>

              <View style={styles.specificationsContainer}>
                <Text style={styles.sectionTitle}>المواصفات</Text>
                {Object.entries(selectedProduct.specifications).map(([key, value], index) => (
                  <View key={index} style={styles.specificationRow}>
                    <Text style={styles.specificationKey}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                    <Text style={styles.specificationValue}>{value}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.requestQuoteButton}>
                <Text style={styles.requestQuoteButtonText}>طلب عرض سعر</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>سوق المزارع</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}>
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            المنتجات
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'company' && styles.activeTab]}
          onPress={() => setActiveTab('company')}>
          <Text style={[styles.tabText, activeTab === 'company' && styles.activeTabText]}>
            شركتي
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>{renderTabContent()}</View>

      {/* Add the product detail modal */}
      {renderProductDetailModal()}

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

// Add these styles for the product detail modal
const windowWidth = Dimensions.get('window').width;

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
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  modalScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary.base,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.small,
  },
  backButton: {
    padding: 4,
  },
  modalTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.h2,
    color: '#FFFFFF',
  },
  carouselImage: {
    height: 250,
    resizeMode: 'cover',
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailSection: {
    padding: theme.spacing.md,
  },
  companyInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  companyDetailLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  companyDetailName: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
  },
  timePostedDetail: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textSecondary,
  },
  contactButton: {
    marginLeft: 'auto',
    backgroundColor: theme.colors.primary.base,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
  },
  contactButtonText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    color: '#FFFFFF',
  },
  productDetailTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.h2,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.md,
    lineHeight: 28,
  },
  pricingContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
    marginBottom: theme.spacing.md,
  },
  pricingItem: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  pricingLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 4,
  },
  pricingValue: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.h2,
    color: theme.colors.accent.base,
  },
  orderInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  orderInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderInfoText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    marginLeft: 6,
  },
  certificationContainer: {
    marginBottom: theme.spacing.md,
  },
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(101, 196, 102, 0.1)',
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  certificationText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    color: theme.colors.secondary.base,
    marginLeft: 6,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.h2,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  specificationsContainer: {
    backgroundColor: theme.colors.neutral.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.lg,
  },
  specificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  specificationKey: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textSecondary,
    flex: 1,
  },
  specificationValue: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  requestQuoteButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.medium,
    marginBottom: theme.spacing.xl,
  },
  requestQuoteButtonText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.button,
    color: '#FFFFFF',
  },
});

// Add TypeScript declaration to avoid type errors
declare global {
  interface Window {
    refreshMarketplaceProducts?: () => Promise<void>;
    viewSupplierProfile?: (supplierId: string) => void;
    showProductDetail?: (product: Product) => void;
  }
}

export default Marketplace;
