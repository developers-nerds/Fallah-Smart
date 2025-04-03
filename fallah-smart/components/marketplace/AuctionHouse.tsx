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
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

// Types
interface Bid {
  user: string;
  amount: string;
  time: string;
  isHighest: boolean;
}

interface Seller {
  name: string;
  rating: number;
  verified: boolean;
  image: string;
}

export interface Auction {
  id: string;
  itemName: string;
  image: string;
  images: string[];
  description: string;
  detailedSpecs: string;
  currentBid: string;
  startingBid: string;
  timeRemaining: string;
  bidCount: number;
  isFinished: boolean;
  seller: Seller;
  bids: Bid[];
}

interface AuctionHouseProps {
  data: Auction[];
}

export const AuctionHouse: React.FC<AuctionHouseProps> = ({ data }) => {
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentBidAmount, setCurrentBidAmount] = useState('');

  const openAuctionDetail = (auction: Auction) => {
    setSelectedAuction(auction);
    setModalVisible(true);
    // Set initial bid amount to be slightly higher than current highest
    const currentAmount = parseInt(auction.currentBid.replace(/[^0-9]/g, ''));
    setCurrentBidAmount((currentAmount + 5000).toString());
  };

  const closeAuctionDetail = () => {
    setModalVisible(false);
    setSelectedAuction(null);
  };

  const renderAuctionItem = ({ item }: { item: Auction }) => (
    <TouchableOpacity
      style={styles.auctionCard}
      onPress={() => openAuctionDetail(item)}
      activeOpacity={0.9}>
      <ImageBackground source={{ uri: item.image }} style={styles.auctionImage}>
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
          style={styles.auctionImageGradient}>
          {item.isFinished && (
            <View style={styles.finishedBadge}>
              <Text style={styles.finishedBadgeText}>مكتمل</Text>
            </View>
          )}
          <View style={styles.auctionImageContent}>
            <Text style={styles.auctionTimeRemaining}>
              {item.isFinished ? 'انتهى المزاد' : `متبقي ${item.timeRemaining}`}
            </Text>
            <Text style={styles.auctionItemNameOverlay}>{item.itemName}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.auctionDetails}>
        <View style={styles.auctionPriceRow}>
          <View>
            <Text style={styles.bidLabel}>المزايدة الحالية</Text>
            <Text style={styles.currentBid}>{item.currentBid}</Text>
          </View>
          <View style={styles.bidInfoRight}>
            <View style={styles.bidCountContainer}>
              <FontAwesome name="gavel" size={16} color={theme.colors.secondary.base} />
              <Text style={styles.bidCount}>{item.bidCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sellerContainer}>
          <Image source={{ uri: item.seller.image }} style={styles.sellerImage} />
          <View>
            <View style={styles.sellerNameRow}>
              <Text style={styles.sellerName}>{item.seller.name}</Text>
              {item.seller.verified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={14}
                  color={theme.colors.primary.base}
                />
              )}
            </View>
            <View style={styles.sellerRatingContainer}>
              <Text style={styles.sellerRating}>★ {item.seller.rating}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.bidButton, item.isFinished && styles.disabledButton]}
          disabled={item.isFinished}
          onPress={() => openAuctionDetail(item)}>
          <Text style={styles.bidButtonText}>
            {item.isFinished ? 'انتهى المزاد' : 'عرض التفاصيل والمزايدة'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderAuctionDetailModal = () => {
    if (!selectedAuction) return null;

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeAuctionDetail}>
        <StatusBar barStyle="light-content" />
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScrollView}>
            {/* Header with back button */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeAuctionDetail} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تفاصيل المزاد</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Image carousel */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.imageCarousel}>
              {selectedAuction.images.map((image, index) => (
                <Image key={index} source={{ uri: image }} style={styles.carouselImage} />
              ))}
            </ScrollView>

            {/* Item details */}
            <View style={styles.detailSection}>
              <Text style={styles.detailItemName}>{selectedAuction.itemName}</Text>

              <View style={styles.bidStatusContainer}>
                <View style={styles.bidStatusLeft}>
                  <Text style={styles.detailBidLabel}>المزايدة الحالية</Text>
                  <Text style={styles.detailCurrentBid}>{selectedAuction.currentBid}</Text>
                  <Text style={styles.startingBid}>بدأت في {selectedAuction.startingBid}</Text>
                </View>
                <View style={styles.bidStatusRight}>
                  <Text style={styles.detailTimeLabel}>متبقي الوقت</Text>
                  <Text
                    style={[
                      styles.detailTimeRemaining,
                      selectedAuction.isFinished && styles.auctionEndedText,
                    ]}>
                    {selectedAuction.timeRemaining}
                  </Text>
                </View>
              </View>

              <View style={styles.bidCountDetailContainer}>
                <FontAwesome name="gavel" size={18} color={theme.colors.secondary.base} />
                <Text style={styles.bidCountDetail}>{selectedAuction.bidCount} مزايدات موجهة</Text>
              </View>

              <View style={styles.sellerDetailContainer}>
                <Image
                  source={{ uri: selectedAuction.seller.image }}
                  style={styles.sellerDetailImage}
                />
                <View>
                  <View style={styles.sellerDetailNameRow}>
                    <Text style={styles.sellerDetailName}>{selectedAuction.seller.name}</Text>
                    {selectedAuction.seller.verified && (
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={16}
                        color={theme.colors.primary.base}
                      />
                    )}
                  </View>
                  <View style={styles.sellerDetailRatingContainer}>
                    <Text style={styles.sellerDetailRating}>★ {selectedAuction.seller.rating}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.contactSellerButton}>
                  <Text style={styles.contactSellerText}>اتصال</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.sectionTitle}>الوصف</Text>
                <Text style={styles.descriptionText}>{selectedAuction.description}</Text>
              </View>

              <View style={styles.specsContainer}>
                <Text style={styles.sectionTitle}>المواصفات</Text>
                <Text style={styles.specsText}>{selectedAuction.detailedSpecs}</Text>
              </View>

              <View style={styles.bidsHistoryContainer}>
                <Text style={styles.sectionTitle}>تاريخ المزايدة</Text>
                {selectedAuction.bids.map((bid, index) => (
                  <View
                    key={index}
                    style={[styles.bidHistoryItem, bid.isHighest && styles.highestBidItem]}>
                    <View style={styles.bidUserInfo}>
                      <Text style={styles.bidUserName}>{bid.user}</Text>
                      <Text style={styles.bidTime}>{bid.time}</Text>
                    </View>
                    <View>
                      <Text style={[styles.bidAmount, bid.isHighest && styles.highestBidAmount]}>
                        {bid.amount}
                      </Text>
                      {bid.isHighest && <Text style={styles.highestBidLabel}>أعلى مزايدة</Text>}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {!selectedAuction.isFinished ? (
            <View style={styles.bidActionContainer}>
              <View style={styles.minimumBidContainer}>
                <Text style={styles.minimumBidLabel}>الحد الأدنى للمزايدة</Text>
                <Text style={styles.minimumBidAmount}>{currentBidAmount}</Text>
              </View>
              <TouchableOpacity style={styles.placeBidButton}>
                <Text style={styles.placeBidButtonText}>تقديم عرض</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.auctionEndedContainer}>
              <MaterialCommunityIcons name="gavel" size={24} color={theme.colors.error} />
              <Text style={styles.auctionEndedMessage}>انتهى هذا المزاد</Text>
            </View>
          )}
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.auctionContainer}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderAuctionItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.auctionListContent}
      />
      {renderAuctionDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  auctionContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  auctionListContent: {
    padding: theme.spacing.md,
  },
  auctionCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  auctionImage: {
    height: 200,
    width: '100%',
  },
  auctionImageGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
  },
  auctionImageContent: {
    gap: theme.spacing.xs,
  },
  auctionTimeRemaining: {
    color: theme.colors.neutral.white,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.medium,
  },
  auctionItemNameOverlay: {
    color: theme.colors.neutral.white,
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.bold,
  },
  auctionDetails: {
    padding: theme.spacing.md,
  },
  auctionPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  bidLabel: {
    color: theme.colors.neutral.textSecondary,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.regular,
  },
  currentBid: {
    color: theme.colors.primary.base,
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.bold,
  },
  bidInfoRight: {
    alignItems: 'flex-end',
  },
  bidCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  bidCount: {
    color: theme.colors.secondary.base,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.medium,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sellerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sellerName: {
    color: theme.colors.neutral.text,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.medium,
  },
  sellerRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerRating: {
    color: theme.colors.neutral.textSecondary,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.regular,
  },
  bidButton: {
    backgroundColor: theme.colors.primary.base,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  bidButtonText: {
    color: theme.colors.neutral.white,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.medium,
  },
  disabledButton: {
    backgroundColor: theme.colors.neutral.disabled,
  },
  finishedBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  finishedBadgeText: {
    color: theme.colors.neutral.white,
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.bold,
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
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary.base,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  modalTitle: {
    color: theme.colors.neutral.white,
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.bold,
  },
  imageCarousel: {
    height: 300,
  },
  carouselImage: {
    width: Dimensions.get('window').width,
    height: 300,
    resizeMode: 'cover',
  },
  detailSection: {
    padding: theme.spacing.md,
  },
  detailItemName: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.text,
    marginBottom: theme.spacing.md,
  },
  bidStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  bidStatusLeft: {
    flex: 1,
  },
  bidStatusRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailBidLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.neutral.textSecondary,
    fontFamily: theme.fonts.regular,
  },
  detailCurrentBid: {
    fontSize: theme.fontSizes.xl,
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.bold,
  },
  startingBid: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.neutral.textSecondary,
    fontFamily: theme.fonts.regular,
  },
  detailTimeLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.neutral.textSecondary,
    fontFamily: theme.fonts.regular,
  },
  detailTimeRemaining: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.secondary.base,
    fontFamily: theme.fonts.bold,
  },
  auctionEndedText: {
    color: theme.colors.error,
  },
  bidCountDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  bidCountDetail: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.secondary.base,
    fontFamily: theme.fonts.medium,
  },
  sellerDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  sellerDetailImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.md,
  },
  sellerDetailNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sellerDetailName: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.neutral.text,
    fontFamily: theme.fonts.bold,
  },
  sellerDetailRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerDetailRating: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.neutral.textSecondary,
    fontFamily: theme.fonts.regular,
  },
  contactSellerButton: {
    marginLeft: 'auto',
    backgroundColor: theme.colors.secondary.base,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  contactSellerText: {
    color: theme.colors.neutral.white,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.medium,
  },
  descriptionContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.neutral.text,
    fontFamily: theme.fonts.bold,
    marginBottom: theme.spacing.sm,
  },
  descriptionText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.neutral.text,
    fontFamily: theme.fonts.regular,
    lineHeight: 24,
  },
  specsContainer: {
    marginBottom: theme.spacing.lg,
  },
  specsText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.neutral.text,
    fontFamily: theme.fonts.regular,
    lineHeight: 24,
  },
  bidsHistoryContainer: {
    marginBottom: theme.spacing.lg,
  },
  bidHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  highestBidItem: {
    backgroundColor: theme.colors.primary.surface,
  },
  bidUserInfo: {
    flex: 1,
  },
  bidUserName: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.neutral.text,
    fontFamily: theme.fonts.medium,
  },
  bidTime: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.neutral.textSecondary,
    fontFamily: theme.fonts.regular,
  },
  bidAmount: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.neutral.text,
    fontFamily: theme.fonts.bold,
    textAlign: 'right',
  },
  highestBidAmount: {
    color: theme.colors.primary.base,
  },
  highestBidLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.medium,
    textAlign: 'right',
  },
  bidActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  minimumBidContainer: {
    flex: 1,
  },
  minimumBidLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.neutral.textSecondary,
    fontFamily: theme.fonts.regular,
  },
  minimumBidAmount: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.bold,
  },
  placeBidButton: {
    backgroundColor: theme.colors.primary.base,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  placeBidButtonText: {
    color: theme.colors.neutral.white,
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.bold,
  },
  auctionEndedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  auctionEndedMessage: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.error,
    fontFamily: theme.fonts.medium,
  },
});
