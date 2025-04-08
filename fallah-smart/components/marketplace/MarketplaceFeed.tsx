import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

// Types
export interface Product {
  id: string;
  supplierId: string;
  companyName: string;
  avatar: string;
  phoneNumber: string;
  image: string;
  images: string[];
  description: string;
  price: string;
  quantity: string;
  timePosted: string;
  minimumOrder: string;
  deliveryTime: string;
  certification: string;
  specifications: {
    [key: string]: string;
  };
}

interface MarketplaceFeedProps {
  data: Product[];
}

export const MarketplaceFeed: React.FC<MarketplaceFeedProps> = ({ data }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [viewingCompanyId, setViewingCompanyId] = useState<string | null>(null);

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  const closeProductDetail = () => {
    setDetailModalVisible(false);
    setSelectedProduct(null);
  };

  const handleRefresh = async () => {
    if (window && window.refreshMarketplaceProducts) {
      setRefreshing(true);
      try {
        await window.refreshMarketplaceProducts();
      } catch (error) {
        console.error('Error refreshing products:', error);
      } finally {
        setRefreshing(false);
      }
    }
  };

  const handleContactSupplier = (phoneNumber: string) => {
    console.log('Attempting to contact supplier with phone:', phoneNumber);

    if (phoneNumber && phoneNumber.trim() !== '') {
      console.log('Opening dialer with phone number:', phoneNumber);
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      console.log('Phone number missing, selectedProduct:', selectedProduct);
      Alert.alert('خطأ', 'رقم الهاتف غير متوفر');
    }
  };

  const handleCompanyLogoPress = (supplierId: string) => {
    setViewingCompanyId(supplierId);
    if (window && window.viewSupplierProfile) {
      window.viewSupplierProfile(supplierId);
    }
  };

  const renderProductImages = (product: Product) => {
    const images = product.images && product.images.length > 0 ? product.images : [product.image];

    if (images.length === 1) {
      return <Image source={{ uri: images[0] }} style={styles.productCardImage} />;
    } else if (images.length === 2) {
      return (
        <View style={styles.imageGrid}>
          <Image source={{ uri: images[0] }} style={styles.dualImage} />
          <Image source={{ uri: images[1] }} style={styles.dualImage} />
        </View>
      );
    } else if (images.length === 3) {
      return (
        <View style={styles.imageGrid}>
          <Image source={{ uri: images[0] }} style={styles.primaryImageWithMany} />
          <View style={styles.secondaryImagesContainer}>
            <Image source={{ uri: images[1] }} style={styles.largeSecondaryImage} />
            <Image source={{ uri: images[2] }} style={styles.largeSecondaryImage} />
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.imageGrid}>
          <Image source={{ uri: images[0] }} style={styles.primaryImageWithMany} />
          <View style={styles.secondaryImagesContainer}>
            <Image source={{ uri: images[1] }} style={styles.largeSecondaryImage} />
            <View style={styles.lastImageContainer}>
              <Image source={{ uri: images[2] }} style={styles.largeSecondaryImage} />
              {images.length > 3 && (
                <View style={styles.moreImagesOverlay}>
                  <Text style={styles.moreImagesText}>+{images.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      );
    }
  };

  const renderImageCarousel = () => {
    if (!selectedProduct) return null;

    const images =
      selectedProduct.images && selectedProduct.images.length > 0
        ? selectedProduct.images
        : [selectedProduct.image];

    return (
      <View>
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
          {images.map((img, index) => (
            <Image key={index} source={{ uri: img }} style={styles.carouselImage} />
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View style={styles.paginationContainer}>
            {images.map((_, index) => (
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
      </View>
    );
  };

  const renderProductDetailModal = () => {
    if (!selectedProduct) return null;

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
            {renderImageCarousel()}

            <View style={styles.detailSection}>
              <View style={styles.companyInfoContainer}>
                <TouchableOpacity
                  onPress={() => handleCompanyLogoPress(selectedProduct.supplierId)}>
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
                  onPress={() => handleContactSupplier(selectedProduct.phoneNumber)}>
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
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.feedContainer}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => openProductDetail(item)}
            activeOpacity={0.9}>
            {renderProductImages(item)}
            <View style={styles.productCardContent}>
              <TouchableOpacity
                style={styles.companyRow}
                onPress={() => handleCompanyLogoPress(item.supplierId)}>
                <Image source={{ uri: item.avatar }} style={styles.companyLogo} />
                <Text style={styles.companyName}>{item.companyName}</Text>
              </TouchableOpacity>

              <Text numberOfLines={2} style={styles.productDescription}>
                {item.description}
              </Text>

              <View style={styles.productCardFooter}>
                <View>
                  <Text style={styles.productPrice}>{item.price}</Text>
                  <Text style={styles.minOrder}>Min order: {item.minimumOrder}</Text>
                </View>
                <View style={styles.quantityBadge}>
                  <MaterialCommunityIcons
                    name="package-variant"
                    size={16}
                    color={theme.colors.secondary.base}
                  />
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => openProductDetail(item)}>
                <Text style={styles.viewDetailsButtonText}>عرض التفاصيل</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedListContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      {renderProductDetailModal()}
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  feedContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  feedListContent: {
    padding: theme.spacing.sm,
  },
  productCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  productCardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  productCardContent: {
    padding: theme.spacing.md,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
  },
  companyLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: theme.spacing.sm,
  },
  companyName: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    flex: 1,
  },
  productDescription: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  productCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
  },
  productPrice: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.body,
    color: theme.colors.primary.base,
  },
  minOrder: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textSecondary,
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.medium,
  },
  quantityText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.secondary.base,
    marginLeft: 4,
  },
  viewDetailsButton: {
    backgroundColor: theme.colors.accent.base,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    ...theme.shadows.small,
  },
  viewDetailsButtonText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.button,
    color: '#FFFFFF',
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
  productDetailImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
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
  imageGrid: {
    flexDirection: 'row',
    height: 180,
    width: '100%',
  },
  primaryImage: {
    resizeMode: 'cover',
  },
  primaryImageWithMany: {
    width: '50%',
    height: 180,
    resizeMode: 'cover',
  },
  secondaryImagesContainer: {
    width: '50%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  secondaryImage: {
    resizeMode: 'cover',
  },
  largeSecondaryImage: {
    width: '100%',
    height: 90,
  },
  smallSecondaryImage: {
    width: '50%',
    height: 90,
    resizeMode: 'cover',
  },
  dualImage: {
    width: '50%',
    height: 180,
    resizeMode: 'cover',
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  carouselImage: {
    width: windowWidth,
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
  lastImageContainer: {
    position: 'relative',
    width: '100%',
    height: 90,
  },
});
