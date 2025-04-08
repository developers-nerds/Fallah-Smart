import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { Product } from './MarketplaceFeed';
import { normalize } from '../../utils/responsive';

interface EnhancedProductDetailProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
}

export const EnhancedProductDetail: React.FC<EnhancedProductDetailProps> = ({
  product,
  visible,
  onClose,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!product) return null;

  const renderImageCarousel = () => {
    const images = product.images && product.images.length > 0 ? product.images : [product.image];

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

  return (
    <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>تفاصيل المنتج</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalScrollView}>
          {renderImageCarousel()}

          <View style={styles.detailSection}>
            <Text style={styles.productDetailTitle}>{product.description}</Text>

            <View style={styles.pricingContainer}>
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>السعر</Text>
                <Text style={styles.pricingValue}>{product.price}</Text>
              </View>
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>متوفر</Text>
                <Text style={styles.pricingValue}>{product.quantity}</Text>
              </View>
            </View>

            <View style={styles.orderInfoContainer}>
              <View style={styles.orderInfoItem}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={20}
                  color={theme.colors.primary.base}
                />
                <Text style={styles.orderInfoText}>الحد الأدنى للطلب: {product.minimumOrder}</Text>
              </View>
              <View style={styles.orderInfoItem}>
                <MaterialCommunityIcons
                  name="truck-delivery"
                  size={20}
                  color={theme.colors.primary.base}
                />
                <Text style={styles.orderInfoText}>التوصيل: {product.deliveryTime}</Text>
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
                <Text style={styles.certificationText}>{product.certification}</Text>
              </View>
            </View>

            <View style={styles.specificationsContainer}>
              <Text style={styles.sectionTitle}>المواصفات</Text>
              {Object.entries(product.specifications).map(([key, value], index) => (
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

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
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
  detailSection: {
    padding: theme.spacing.md,
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
