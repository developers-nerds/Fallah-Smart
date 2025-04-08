import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { Product } from './MarketplaceFeed';
import { normalize, responsivePadding } from '../../utils/responsive';
import { EnhancedProductDetail } from './EnhancedProductDetail';

interface SupplierProfileProps {
  supplierId: string | null;
  onProductSelect: (product: Product) => void;
  onBackToAllSuppliers: () => void;
}

export const SupplierProfile: React.FC<SupplierProfileProps> = ({
  supplierId,
  onProductSelect,
  onBackToAllSuppliers,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplier, setSupplier] = useState<any>(null);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetailVisible, setProductDetailVisible] = useState(false);
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    if (supplierId) {
      fetchSupplierDetails();
    }
  }, [supplierId]);

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch supplier details
      const supplierResponse = await axios.get(`${baseUrl}/suppliers/${supplierId}`);
      setSupplier(supplierResponse.data.supplier);

      // Fetch supplier products
      const productsResponse = await axios.get(`${baseUrl}/crops/supplier/${supplierId}`);

      // Format products to match the Product interface
      const formattedProducts = productsResponse.data.cropListings.map((listing: any) => {
        const mediaItems = listing.media || [];
        const imageUrls = mediaItems.map((media: any) => {
          let imageUrl = media.url || '';
          if (imageUrl.startsWith('/api/')) {
            imageUrl = imageUrl.replace('/api/', '/');
          }
          return `${baseUrl?.replace('/api', '')}${imageUrl}`;
        });

        let companyLogo = supplier?.company_logo || '';
        if (companyLogo.startsWith('/api/')) {
          companyLogo = companyLogo.replace('/api/', '/');
        }
        companyLogo = companyLogo
          ? `${baseUrl?.replace('/api', '')}${companyLogo}`
          : 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';

        const defaultImage =
          'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';

        return {
          id: listing.id.toString(),
          supplierId: supplierId,
          companyName: supplier?.company_name || 'Unknown Supplier',
          avatar: companyLogo,
          phoneNumber: supplier?.company_phone || '',
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

      setSupplierProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching supplier details:', error);
      setError('Failed to load supplier details.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupplier = () => {
    if (supplier?.company_phone) {
      Linking.openURL(`tel:${supplier.company_phone}`);
    } else {
      console.log('No phone number available');
    }
  };

  const handleProductPress = (product: Product) => {
    console.log('Product clicked in SupplierProfile:', product.id);

    // Use our own enhanced product detail modal
    setSelectedProduct(product);
    setProductDetailVisible(true);

    // Don't call the parent's onProductSelect to avoid showing two modals
    // If you need to notify the parent without showing its modal,
    // you could implement a different callback or modify the parent's behavior
  };

  const closeProductDetail = () => {
    setProductDetailVisible(false);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (error || !supplier) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Supplier not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBackToAllSuppliers}>
          <Text style={styles.backButtonText}>Back to Marketplace</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <React.Fragment>
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.backButtonContainer} onPress={onBackToAllSuppliers}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary.base} />
          <Text style={styles.backText}>عودة إلى السوق</Text>
        </TouchableOpacity>

        {/* Company Banner */}
        <Image
          source={{
            uri: supplier.company_banner
              ? `${baseUrl?.replace('/api', '')}${supplier.company_banner}`
              : 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
          }}
          style={styles.bannerImage}
        />

        {/* Company Info */}
        <View style={styles.profileContainer}>
          <Image
            source={{
              uri: supplier.company_logo
                ? `${baseUrl?.replace('/api', '')}${supplier.company_logo}`
                : 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
            }}
            style={styles.logoImage}
          />

          <Text style={styles.companyName}>{supplier.company_name}</Text>

          <View style={styles.verificationBadge}>
            <MaterialCommunityIcons
              name={supplier.is_verified ? 'check-decagram' : 'alert-circle'}
              size={18}
              color={supplier.is_verified ? theme.colors.secondary.base : theme.colors.warning}
            />
            <Text style={styles.verificationText}>
              {supplier.is_verified ? 'مورد موثق' : 'في انتظار التوثيق'}
            </Text>
          </View>

          <TouchableOpacity style={styles.contactButton} onPress={handleContactSupplier}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>اتصل الآن</Text>
          </TouchableOpacity>

          {supplier.about_us && (
            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>عن الشركة</Text>
              <Text style={styles.aboutText}>{supplier.about_us}</Text>
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>معلومات التواصل</Text>

            <View style={styles.infoItem}>
              <Ionicons name="location" size={18} color={theme.colors.primary.base} />
              <Text style={styles.infoText}>{supplier.company_address}</Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="call" size={18} color={theme.colors.primary.base} />
              <Text style={styles.infoText}>{supplier.company_phone}</Text>
            </View>

            {supplier.company_email && (
              <View style={styles.infoItem}>
                <Ionicons name="mail" size={18} color={theme.colors.primary.base} />
                <Text style={styles.infoText}>{supplier.company_email}</Text>
              </View>
            )}

            {supplier.company_website && (
              <View style={styles.infoItem}>
                <Ionicons name="globe" size={18} color={theme.colors.primary.base} />
                <Text style={styles.infoText}>{supplier.company_website}</Text>
              </View>
            )}

            {supplier.open_time && supplier.close_time && (
              <View style={styles.infoItem}>
                <Ionicons name="time" size={18} color={theme.colors.primary.base} />
                <Text style={styles.infoText}>
                  ساعات العمل: {supplier.open_time} - {supplier.close_time}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Company Products */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>منتجات المورد</Text>

          {supplierProducts.length === 0 ? (
            <Text style={styles.noProductsText}>لا توجد منتجات متاحة حالياً</Text>
          ) : (
            <FlatList
              data={supplierProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productCard}
                  onPress={() => handleProductPress(item)}>
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                  <View style={styles.productInfo}>
                    <Text numberOfLines={2} style={styles.productTitle}>
                      {item.description}
                    </Text>
                    <Text style={styles.productPrice}>{item.price}</Text>
                    <Text style={styles.productQuantity}>{item.quantity}</Text>
                  </View>
                </TouchableOpacity>
              )}
              horizontal={false}
              numColumns={2}
              contentContainerStyle={styles.productsGrid}
              scrollEnabled={false} // Disable scrolling on the FlatList
            />
          )}
        </View>
      </ScrollView>

      <EnhancedProductDetail
        product={selectedProduct}
        visible={productDetailVisible}
        onClose={closeProductDetail}
      />
    </React.Fragment>
  );
};

const { width } = Dimensions.get('window');
const productCardWidth = (width - 48) / 2; // 2 columns with 16px padding

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  loadingContainer: {
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
    fontSize: normalize(16),
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsivePadding(theme.spacing.md),
    backgroundColor: theme.colors.neutral.surface,
  },
  backText: {
    marginLeft: 8,
    fontSize: normalize(16),
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.medium,
  },
  bannerImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  profileContainer: {
    padding: responsivePadding(theme.spacing.md),
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.divider,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: -40,
    borderWidth: 3,
    borderColor: theme.colors.neutral.surface,
    backgroundColor: theme.colors.neutral.surface,
  },
  companyName: {
    fontSize: normalize(20),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  verificationText: {
    marginLeft: 5,
    fontSize: normalize(14),
    color: theme.colors.neutral.textSecondary,
    fontFamily: theme.fonts.medium,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.base,
    paddingHorizontal: responsivePadding(theme.spacing.md),
    paddingVertical: responsivePadding(theme.spacing.sm),
    borderRadius: theme.borderRadius.medium,
    marginBottom: 20,
  },
  contactButtonText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
  },
  aboutSection: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: normalize(18),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  aboutText: {
    fontSize: normalize(15),
    lineHeight: 22,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'justify',
  },
  infoSection: {
    width: '100%',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 10,
    fontSize: normalize(14),
    color: theme.colors.neutral.textPrimary,
  },
  productsSection: {
    padding: responsivePadding(theme.spacing.md),
  },
  productsGrid: {
    paddingVertical: 10,
  },
  productCard: {
    width: productCardWidth,
    marginHorizontal: 8,
    marginBottom: 16,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 6,
  },
  productPrice: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: normalize(12),
    color: theme.colors.neutral.textSecondary,
  },
  noProductsText: {
    fontSize: normalize(16),
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginVertical: 20,
  },
  backButton: {
    backgroundColor: theme.colors.primary.base,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.medium,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: normalize(16),
    fontFamily: theme.fonts.medium,
  },
});
