import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { normalize, isSmallDevice, responsivePadding } from '../../utils/responsive';
import axios from 'axios';

interface ProductDetails {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  unit: string;
  quantity: number;
  min_order_quantity: number;
  media: Array<{ url: string }>;
  supplier: {
    id: number;
    company_name: string;
    company_logo: string;
    company_phone: string;
  };
  category: string;
  sub_category: string;
  listing_type: string;
  status: string;
  createdAt: string;
}

const ProductDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params as { productId: number };
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  const windowWidth = Dimensions.get('window').width;

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/crops/listing/${productId}`);
      if (response.data.success) {
        setProduct(response.data.cropListing);
      } else {
        Alert.alert('خطأ', 'فشل في تحميل تفاصيل المنتج');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      Alert.alert('خطأ', 'فشل في تحميل تفاصيل المنتج');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>لا يمكن تحميل تفاصيل المنتج</Text>
      </View>
    );
  }

  const handleContactSupplier = () => {
    if (product.supplier.company_phone) {
      Linking.openURL(`tel:${product.supplier.company_phone}`);
    } else {
      Alert.alert('خطأ', 'رقم الهاتف غير متوفر');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary.dark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل المنتج</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
          {product.media.map((img, index) => (
            <Image
              key={index}
              source={{
                uri: img.url.startsWith('http')
                  ? img.url
                  : `${baseUrl?.replace('/api', '')}${img.url}`,
              }}
              style={[styles.productImage, { width: windowWidth }]}
            />
          ))}
        </ScrollView>

        {/* Image Pagination */}
        {product.media.length > 1 && (
          <View style={styles.paginationContainer}>
            {product.media.map((_, index) => (
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

        <View style={styles.detailsContainer}>
          {/* Supplier Info */}
          <View style={styles.supplierContainer}>
            <Image
              source={{
                uri: product.supplier.company_logo.startsWith('http')
                  ? product.supplier.company_logo
                  : `${baseUrl?.replace('/api', '')}${product.supplier.company_logo}`,
              }}
              style={styles.supplierLogo}
            />
            <View style={styles.supplierInfo}>
              <Text style={styles.supplierName}>{product.supplier.company_name}</Text>
              <Text style={styles.timePosted}>
                {new Date(product.createdAt).toLocaleDateString('ar-SA')}
              </Text>
            </View>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactSupplier}>
              <Text style={styles.contactButtonText}>اتصل بالمورد</Text>
            </TouchableOpacity>
          </View>

          {/* Product Details */}
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Pricing and Quantity */}
          <View style={styles.pricingContainer}>
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>السعر</Text>
              <Text style={styles.pricingValue}>
                {product.currency} {product.price} / {product.unit}
              </Text>
            </View>
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>الكمية المتوفرة</Text>
              <Text style={styles.pricingValue}>
                {product.quantity} {product.unit}
              </Text>
            </View>
          </View>

          {/* Additional Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons
                name="package-variant"
                size={20}
                color={theme.colors.primary.base}
              />
              <Text style={styles.infoText}>
                الحد الأدنى للطلب: {product.min_order_quantity} {product.unit}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons
                name="tag-outline"
                size={20}
                color={theme.colors.primary.base}
              />
              <Text style={styles.infoText}>
                الفئة: {product.category} - {product.sub_category}
              </Text>
            </View>
          </View>

          {/* Specifications */}
          <View style={styles.specificationsContainer}>
            <Text style={styles.sectionTitle}>المواصفات</Text>
            <View style={styles.specificationsList}>
              <View style={styles.specificationRow}>
                <Text style={styles.specKey}>نوع القائمة</Text>
                <Text style={styles.specValue}>{product.listing_type}</Text>
              </View>
              <View style={styles.specificationRow}>
                <Text style={styles.specKey}>الحالة</Text>
                <Text style={styles.specValue}>{product.status}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>طلب عرض سعر</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  },
  errorText: {
    fontSize: normalize(16),
    color: theme.colors.error,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary.base,
    paddingTop: Platform.OS === 'ios' ? 50 : theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: normalize(18),
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  productImage: {
    height: 250,
    resizeMode: 'cover',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
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
  detailsContainer: {
    padding: theme.spacing.md,
  },
  supplierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  supplierLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  supplierInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  supplierName: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
  },
  timePosted: {
    fontSize: normalize(12),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  contactButton: {
    backgroundColor: theme.colors.primary.base,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: normalize(12),
    fontFamily: theme.fonts.medium,
  },
  productName: {
    fontSize: normalize(20),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  pricingContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  pricingItem: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: normalize(12),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 4,
  },
  pricingValue: {
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
  },
  infoContainer: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  specificationsContainer: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  specificationsList: {
    gap: theme.spacing.sm,
  },
  specificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  specKey: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
  },
  specValue: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
  bottomContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  actionButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
  },
});

export default ProductDetails;
