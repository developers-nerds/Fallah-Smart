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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

// Types
export interface Product {
  id: string;
  companyName: string;
  avatar: string;
  image: string;
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

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  const closeProductDetail = () => {
    setDetailModalVisible(false);
    setSelectedProduct(null);
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
            <Text style={styles.modalTitle}>Product Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalScrollView}>
            <Image source={{ uri: selectedProduct.image }} style={styles.productDetailImage} />

            <View style={styles.detailSection}>
              <View style={styles.companyInfoContainer}>
                <Image source={{ uri: selectedProduct.avatar }} style={styles.companyDetailLogo} />
                <View>
                  <Text style={styles.companyDetailName}>{selectedProduct.companyName}</Text>
                  <Text style={styles.timePostedDetail}>{selectedProduct.timePosted}</Text>
                </View>
                <TouchableOpacity style={styles.contactButton}>
                  <Text style={styles.contactButtonText}>Contact Supplier</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.productDetailTitle}>{selectedProduct.description}</Text>

              <View style={styles.pricingContainer}>
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>Price</Text>
                  <Text style={styles.pricingValue}>{selectedProduct.price}</Text>
                </View>
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>Available</Text>
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
                    Min. Order: {selectedProduct.minimumOrder}
                  </Text>
                </View>
                <View style={styles.orderInfoItem}>
                  <MaterialCommunityIcons
                    name="truck-delivery"
                    size={20}
                    color={theme.colors.primary.base}
                  />
                  <Text style={styles.orderInfoText}>Delivery: {selectedProduct.deliveryTime}</Text>
                </View>
              </View>

              <View style={styles.certificationContainer}>
                <Text style={styles.sectionTitle}>Certification</Text>
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
                <Text style={styles.sectionTitle}>Specifications</Text>
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
                <Text style={styles.requestQuoteButtonText}>Request Quotation</Text>
              </TouchableOpacity>
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
            <Image source={{ uri: item.image }} style={styles.productCardImage} />
            <View style={styles.productCardContent}>
              <View style={styles.companyRow}>
                <Image source={{ uri: item.avatar }} style={styles.companyLogo} />
                <Text style={styles.companyName}>{item.companyName}</Text>
              </View>

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

              <TouchableOpacity style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedListContent}
      />
      {renderProductDetailModal()}
    </View>
  );
};

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
