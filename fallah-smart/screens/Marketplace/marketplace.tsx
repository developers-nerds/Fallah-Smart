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
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, styles as themeStyles } from '../../theme/theme';

// Updated fake data for marketplace feed with professional details
const marketplaceFeedData = [
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
    },
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
    },
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
    },
  },
];

// Fake data for auction house with enhanced details
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

// Fake data for company profiles
const companyData = [
  {
    id: '1',
    name: 'Al-Noor Agricultural Corporation',
    logo: 'https://via.placeholder.com/100',
    description: 'Leading supplier of premium seeds, fertilizers, and farming equipment.',
    founded: '1985',
    location: 'Riyadh, Saudi Arabia',
    specialization: 'Seeds, Fertilizers, Equipment',
    rating: 4.8,
    reviews: 156,
  },
  {
    id: '2',
    name: 'Oasis Irrigation Technologies',
    logo: 'https://via.placeholder.com/100',
    description: 'Innovative irrigation solutions for dry climates. Water conservation experts.',
    founded: '2002',
    location: 'Jeddah, Saudi Arabia',
    specialization: 'Irrigation, Water Conservation',
    rating: 4.6,
    reviews: 89,
  },
  {
    id: '3',
    name: 'Saudi Agricultural Services',
    logo: 'https://via.placeholder.com/100',
    description: 'Full-service agricultural consulting and implementation company.',
    founded: '1998',
    location: 'Dammam, Saudi Arabia',
    specialization: 'Consulting, Farm Management, Supply Chain',
    rating: 4.7,
    reviews: 112,
  },
];

// Updated MarketplaceFeed component
const MarketplaceFeed = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const openProductDetail = (product) => {
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
        <View style={marketplaceStyles.modalContainer}>
          <View style={marketplaceStyles.modalHeader}>
            <TouchableOpacity onPress={closeProductDetail} style={marketplaceStyles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={marketplaceStyles.modalTitle}>Product Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={marketplaceStyles.modalScrollView}>
            <Image
              source={{ uri: selectedProduct.image }}
              style={marketplaceStyles.productDetailImage}
            />

            <View style={marketplaceStyles.detailSection}>
              <View style={marketplaceStyles.companyInfoContainer}>
                <Image
                  source={{ uri: selectedProduct.avatar }}
                  style={marketplaceStyles.companyDetailLogo}
                />
                <View>
                  <Text style={marketplaceStyles.companyDetailName}>
                    {selectedProduct.companyName}
                  </Text>
                  <Text style={marketplaceStyles.timePostedDetail}>
                    {selectedProduct.timePosted}
                  </Text>
                </View>
                <TouchableOpacity style={marketplaceStyles.contactButton}>
                  <Text style={marketplaceStyles.contactButtonText}>Contact Supplier</Text>
                </TouchableOpacity>
              </View>

              <Text style={marketplaceStyles.productDetailTitle}>
                {selectedProduct.description}
              </Text>

              <View style={marketplaceStyles.pricingContainer}>
                <View style={marketplaceStyles.pricingItem}>
                  <Text style={marketplaceStyles.pricingLabel}>Price</Text>
                  <Text style={marketplaceStyles.pricingValue}>{selectedProduct.price}</Text>
                </View>
                <View style={marketplaceStyles.pricingItem}>
                  <Text style={marketplaceStyles.pricingLabel}>Available</Text>
                  <Text style={marketplaceStyles.pricingValue}>{selectedProduct.quantity}</Text>
                </View>
              </View>

              <View style={marketplaceStyles.orderInfoContainer}>
                <View style={marketplaceStyles.orderInfoItem}>
                  <MaterialCommunityIcons
                    name="package-variant"
                    size={20}
                    color={theme.colors.primary.base}
                  />
                  <Text style={marketplaceStyles.orderInfoText}>
                    Min. Order: {selectedProduct.minimumOrder}
                  </Text>
                </View>
                <View style={marketplaceStyles.orderInfoItem}>
                  <MaterialCommunityIcons
                    name="truck-delivery"
                    size={20}
                    color={theme.colors.primary.base}
                  />
                  <Text style={marketplaceStyles.orderInfoText}>
                    Delivery: {selectedProduct.deliveryTime}
                  </Text>
                </View>
              </View>

              <View style={marketplaceStyles.certificationContainer}>
                <Text style={marketplaceStyles.sectionTitle}>Certification</Text>
                <View style={marketplaceStyles.certificationBadge}>
                  <MaterialCommunityIcons
                    name="certificate"
                    size={18}
                    color={theme.colors.secondary.base}
                  />
                  <Text style={marketplaceStyles.certificationText}>
                    {selectedProduct.certification}
                  </Text>
                </View>
              </View>

              <View style={marketplaceStyles.specificationsContainer}>
                <Text style={marketplaceStyles.sectionTitle}>Specifications</Text>
                {Object.entries(selectedProduct.specifications).map(([key, value], index) => (
                  <View key={index} style={marketplaceStyles.specificationRow}>
                    <Text style={marketplaceStyles.specificationKey}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                    <Text style={marketplaceStyles.specificationValue}>{value}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={marketplaceStyles.requestQuoteButton}>
                <Text style={marketplaceStyles.requestQuoteButtonText}>Request Quotation</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={marketplaceStyles.feedContainer}>
      <FlatList
        data={marketplaceFeedData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={marketplaceStyles.productCard}
            onPress={() => openProductDetail(item)}
            activeOpacity={0.9}>
            <Image source={{ uri: item.image }} style={marketplaceStyles.productCardImage} />
            <View style={marketplaceStyles.productCardContent}>
              <View style={marketplaceStyles.companyRow}>
                <Image source={{ uri: item.avatar }} style={marketplaceStyles.companyLogo} />
                <Text style={marketplaceStyles.companyName}>{item.companyName}</Text>
              </View>

              <Text numberOfLines={2} style={marketplaceStyles.productDescription}>
                {item.description}
              </Text>

              <View style={marketplaceStyles.productCardFooter}>
                <View>
                  <Text style={marketplaceStyles.productPrice}>{item.price}</Text>
                  <Text style={marketplaceStyles.minOrder}>Min order: {item.minimumOrder}</Text>
                </View>
                <View style={marketplaceStyles.quantityBadge}>
                  <MaterialCommunityIcons
                    name="package-variant"
                    size={16}
                    color={theme.colors.secondary.base}
                  />
                  <Text style={marketplaceStyles.quantityText}>{item.quantity}</Text>
                </View>
              </View>

              <TouchableOpacity style={marketplaceStyles.viewDetailsButton}>
                <Text style={marketplaceStyles.viewDetailsButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={marketplaceStyles.feedListContent}
      />
      {renderProductDetailModal()}
    </View>
  );
};

const AuctionHouse = () => {
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentBidAmount, setCurrentBidAmount] = useState('');

  const openAuctionDetail = (auction) => {
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

  const renderAuctionItem = ({ item }) => (
    <TouchableOpacity
      style={marketplaceStyles.auctionCard}
      onPress={() => openAuctionDetail(item)}
      activeOpacity={0.9}>
      <ImageBackground source={{ uri: item.image }} style={marketplaceStyles.auctionImage}>
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
          style={marketplaceStyles.auctionImageGradient}>
          {item.isFinished && (
            <View style={marketplaceStyles.finishedBadge}>
              <Text style={marketplaceStyles.finishedBadgeText}>COMPLETED</Text>
            </View>
          )}
          <View style={marketplaceStyles.auctionImageContent}>
            <Text style={marketplaceStyles.auctionTimeRemaining}>
              {item.isFinished ? 'Auction Ended' : item.timeRemaining + ' left'}
            </Text>
            <Text style={marketplaceStyles.auctionItemNameOverlay}>{item.itemName}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={marketplaceStyles.auctionDetails}>
        <View style={marketplaceStyles.auctionPriceRow}>
          <View>
            <Text style={marketplaceStyles.bidLabel}>Current Bid</Text>
            <Text style={marketplaceStyles.currentBid}>{item.currentBid}</Text>
          </View>
          <View style={marketplaceStyles.bidInfoRight}>
            <View style={marketplaceStyles.bidCountContainer}>
              <FontAwesome name="gavel" size={16} color={theme.colors.secondary.base} />
              <Text style={marketplaceStyles.bidCount}>{item.bidCount}</Text>
            </View>
          </View>
        </View>

        <View style={marketplaceStyles.sellerContainer}>
          <Image source={{ uri: item.seller.image }} style={marketplaceStyles.sellerImage} />
          <View>
            <View style={marketplaceStyles.sellerNameRow}>
              <Text style={marketplaceStyles.sellerName}>{item.seller.name}</Text>
              {item.seller.verified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={14}
                  color={theme.colors.primary.base}
                />
              )}
            </View>
            <View style={marketplaceStyles.sellerRatingContainer}>
              <Text style={marketplaceStyles.sellerRating}>★ {item.seller.rating}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[marketplaceStyles.bidButton, item.isFinished && marketplaceStyles.disabledButton]}
          disabled={item.isFinished}
          onPress={() => openAuctionDetail(item)}>
          <Text style={marketplaceStyles.bidButtonText}>
            {item.isFinished ? 'Auction Ended' : 'View Details & Bid'}
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
        <View style={marketplaceStyles.modalContainer}>
          <ScrollView style={marketplaceStyles.modalScrollView}>
            {/* Header with back button */}
            <View style={marketplaceStyles.modalHeader}>
              <TouchableOpacity onPress={closeAuctionDetail} style={marketplaceStyles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={marketplaceStyles.modalTitle}>Auction Details</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Image carousel */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={marketplaceStyles.imageCarousel}>
              {selectedAuction.images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={marketplaceStyles.carouselImage}
                />
              ))}
            </ScrollView>

            {/* Item details */}
            <View style={marketplaceStyles.detailSection}>
              <Text style={marketplaceStyles.detailItemName}>{selectedAuction.itemName}</Text>

              <View style={marketplaceStyles.bidStatusContainer}>
                <View style={marketplaceStyles.bidStatusLeft}>
                  <Text style={marketplaceStyles.detailBidLabel}>Current Bid</Text>
                  <Text style={marketplaceStyles.detailCurrentBid}>
                    {selectedAuction.currentBid}
                  </Text>
                  <Text style={marketplaceStyles.startingBid}>
                    Started at {selectedAuction.startingBid}
                  </Text>
                </View>
                <View style={marketplaceStyles.bidStatusRight}>
                  <Text style={marketplaceStyles.detailTimeLabel}>Time Remaining</Text>
                  <Text
                    style={[
                      marketplaceStyles.detailTimeRemaining,
                      selectedAuction.isFinished && marketplaceStyles.auctionEndedText,
                    ]}>
                    {selectedAuction.timeRemaining}
                  </Text>
                </View>
              </View>

              <View style={marketplaceStyles.bidCountDetailContainer}>
                <FontAwesome name="gavel" size={18} color={theme.colors.secondary.base} />
                <Text style={marketplaceStyles.bidCountDetail}>
                  {selectedAuction.bidCount} bids placed
                </Text>
              </View>

              <View style={marketplaceStyles.sellerDetailContainer}>
                <Image
                  source={{ uri: selectedAuction.seller.image }}
                  style={marketplaceStyles.sellerDetailImage}
                />
                <View>
                  <View style={marketplaceStyles.sellerDetailNameRow}>
                    <Text style={marketplaceStyles.sellerDetailName}>
                      {selectedAuction.seller.name}
                    </Text>
                    {selectedAuction.seller.verified && (
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={16}
                        color={theme.colors.primary.base}
                      />
                    )}
                  </View>
                  <View style={marketplaceStyles.sellerDetailRatingContainer}>
                    <Text style={marketplaceStyles.sellerDetailRating}>
                      ★ {selectedAuction.seller.rating}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={marketplaceStyles.contactSellerButton}>
                  <Text style={marketplaceStyles.contactSellerText}>Contact</Text>
                </TouchableOpacity>
              </View>

              <View style={marketplaceStyles.descriptionContainer}>
                <Text style={marketplaceStyles.sectionTitle}>Description</Text>
                <Text style={marketplaceStyles.descriptionText}>{selectedAuction.description}</Text>
              </View>

              <View style={marketplaceStyles.specsContainer}>
                <Text style={marketplaceStyles.sectionTitle}>Specifications</Text>
                <Text style={marketplaceStyles.specsText}>{selectedAuction.detailedSpecs}</Text>
              </View>

              <View style={marketplaceStyles.bidsHistoryContainer}>
                <Text style={marketplaceStyles.sectionTitle}>Bid History</Text>
                {selectedAuction.bids.map((bid, index) => (
                  <View
                    key={index}
                    style={[
                      marketplaceStyles.bidHistoryItem,
                      bid.isHighest && marketplaceStyles.highestBidItem,
                    ]}>
                    <View style={marketplaceStyles.bidUserInfo}>
                      <Text style={marketplaceStyles.bidUserName}>{bid.user}</Text>
                      <Text style={marketplaceStyles.bidTime}>{bid.time}</Text>
                    </View>
                    <Text
                      style={[
                        marketplaceStyles.bidAmount,
                        bid.isHighest && marketplaceStyles.highestBidAmount,
                      ]}>
                      {bid.amount}
                      {bid.isHighest && (
                        <Text style={marketplaceStyles.highestBidLabel}> (Highest)</Text>
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Bid action footer */}
          {!selectedAuction.isFinished ? (
            <View style={marketplaceStyles.bidActionContainer}>
              <View style={marketplaceStyles.minimumBidContainer}>
                <Text style={marketplaceStyles.minimumBidLabel}>Minimum Bid:</Text>
                <Text style={marketplaceStyles.minimumBidAmount}>
                  SAR {parseInt(selectedAuction.currentBid.replace(/[^0-9]/g, '')) + 5000}
                </Text>
              </View>
              <TouchableOpacity style={marketplaceStyles.placeBidButton}>
                <Text style={marketplaceStyles.placeBidButtonText}>Place Bid Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={marketplaceStyles.auctionEndedContainer}>
              <FontAwesome name="clock-o" size={24} color={theme.colors.error} />
              <Text style={marketplaceStyles.auctionEndedMessage}>This auction has ended</Text>
            </View>
          )}
        </View>
      </Modal>
    );
  };

  return (
    <View style={marketplaceStyles.auctionContainer}>
      <FlatList
        data={auctionData}
        keyExtractor={(item) => item.id}
        renderItem={renderAuctionItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={marketplaceStyles.auctionListContent}
      />
      {renderAuctionDetailModal()}
    </View>
  );
};

const CompanyProfiles = () => {
  return (
    <FlatList
      data={companyData}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={marketplaceStyles.companyCard}>
          <View style={marketplaceStyles.companyHeader}>
            <Image source={{ uri: item.logo }} style={marketplaceStyles.companyLogo} />
            <View style={marketplaceStyles.companyHeaderText}>
              <Text style={marketplaceStyles.companyTitle}>{item.name}</Text>
              <View style={marketplaceStyles.ratingContainer}>
                <Text style={marketplaceStyles.rating}>★ {item.rating}</Text>
                <Text style={marketplaceStyles.reviews}>({item.reviews} reviews)</Text>
              </View>
            </View>
          </View>
          <Text style={marketplaceStyles.companyDescription}>{item.description}</Text>
          <View style={marketplaceStyles.companyDetails}>
            <View style={marketplaceStyles.detailItem}>
              <Text style={marketplaceStyles.detailLabel}>Founded:</Text>
              <Text style={marketplaceStyles.detailValue}>{item.founded}</Text>
            </View>
            <View style={marketplaceStyles.detailItem}>
              <Text style={marketplaceStyles.detailLabel}>Location:</Text>
              <Text style={marketplaceStyles.detailValue}>{item.location}</Text>
            </View>
            <View style={marketplaceStyles.detailItem}>
              <Text style={marketplaceStyles.detailLabel}>Specialization:</Text>
              <Text style={marketplaceStyles.detailValue}>{item.specialization}</Text>
            </View>
          </View>
          <TouchableOpacity style={marketplaceStyles.viewProfileButton}>
            <Text style={marketplaceStyles.viewProfileButtonText}>View Full Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
};

// Main component
const Marketplace = () => {
  const [activeTab, setActiveTab] = useState('feed');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return <MarketplaceFeed />;
      case 'auction':
        return <AuctionHouse />;
      case 'companies':
        return <CompanyProfiles />;
      default:
        return <MarketplaceFeed />;
    }
  };

  return (
    <View style={marketplaceStyles.container}>
      <Text style={marketplaceStyles.header}>Farming Marketplace</Text>

      <View style={marketplaceStyles.tabContainer}>
        <TouchableOpacity
          style={[marketplaceStyles.tab, activeTab === 'feed' && marketplaceStyles.activeTab]}
          onPress={() => setActiveTab('feed')}>
          <Text
            style={[
              marketplaceStyles.tabText,
              activeTab === 'feed' && marketplaceStyles.activeTabText,
            ]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[marketplaceStyles.tab, activeTab === 'auction' && marketplaceStyles.activeTab]}
          onPress={() => setActiveTab('auction')}>
          <Text
            style={[
              marketplaceStyles.tabText,
              activeTab === 'auction' && marketplaceStyles.activeTabText,
            ]}>
            Auctions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[marketplaceStyles.tab, activeTab === 'companies' && marketplaceStyles.activeTab]}
          onPress={() => setActiveTab('companies')}>
          <Text
            style={[
              marketplaceStyles.tabText,
              activeTab === 'companies' && marketplaceStyles.activeTabText,
            ]}>
            Companies
          </Text>
        </TouchableOpacity>
      </View>

      <View style={marketplaceStyles.contentContainer}>{renderTabContent()}</View>
    </View>
  );
};

const marketplaceStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  header: {
    fontSize: theme.fontSizes.h1,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    textAlign: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    ...theme.shadows.medium,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.small,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary.base,
  },
  tabText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textSecondary,
  },
  activeTabText: {
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.bold,
  },
  contentContainer: {
    flex: 1,
  },

  // Feed styles
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

  // Product detail modal styles
  productDetailImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
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
    fontSize: theme.fontSizes.h3,
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
  specificationsContainer: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
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

  // Auction styles
  auctionContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  auctionListContent: {
    padding: theme.spacing.sm,
  },
  auctionCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.large,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    ...theme.shadows.large,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  auctionImage: {
    width: '100%',
    height: 180,
  },
  auctionImageGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
  },
  auctionImageContent: {
    justifyContent: 'flex-end',
  },
  auctionTimeRemaining: {
    color: '#FFF',
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: theme.spacing.xs,
  },
  auctionItemNameOverlay: {
    color: '#FFF',
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.h3,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  auctionDetails: {
    padding: theme.spacing.md,
  },
  auctionPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  bidLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 2,
  },
  currentBid: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.h3,
    color: theme.colors.accent.base,
  },
  bidInfoRight: {
    alignItems: 'flex-end',
  },
  bidCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
  },
  bidCount: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.secondary.base,
    marginLeft: 4,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: theme.borderRadius.small,
  },
  sellerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary.light,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    marginRight: 4,
  },
  sellerRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerRating: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.secondary.base,
  },
  bidButton: {
    backgroundColor: theme.colors.accent.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  bidButtonText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.button,
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: theme.colors.neutral.gray.medium,
  },
  finishedBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
  },
  finishedBadgeText: {
    color: '#FFF',
    fontFamily: theme.fonts.bold,
    fontSize: 10,
  },

  // Modal styles
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
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.h1,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.md,
  },
  bidStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.neutral.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
    marginBottom: theme.spacing.md,
  },
  bidStatusLeft: {
    flex: 1,
  },
  bidStatusRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailBidLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textSecondary,
  },
  detailCurrentBid: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.h2,
    color: theme.colors.accent.base,
  },
  startingBid: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textSecondary,
    marginTop: 2,
  },
  detailTimeLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'right',
  },
  detailTimeRemaining: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.h3,
    color: theme.colors.secondary.base,
    textAlign: 'right',
  },
  auctionEndedText: {
    color: theme.colors.error,
  },
  bidCountDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  bidCountDetail: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    color: theme.colors.secondary.base,
    marginLeft: theme.spacing.xs,
  },
  sellerDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
    marginBottom: theme.spacing.lg,
  },
  sellerDetailImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary.light,
  },
  sellerDetailNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerDetailName: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    marginRight: 6,
  },
  sellerDetailRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerDetailRating: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.secondary.base,
  },
  contactSellerButton: {
    marginLeft: 'auto',
    backgroundColor: theme.colors.primary.base,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.medium,
  },
  contactSellerText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.h3,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  descriptionContainer: {
    marginBottom: theme.spacing.md,
  },
  descriptionText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    lineHeight: 22,
  },
  specsContainer: {
    backgroundColor: theme.colors.neutral.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.lg,
  },
  specsText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    lineHeight: 24,
  },
  bidsHistoryContainer: {
    marginBottom: theme.spacing.xl,
  },
  bidHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  highestBidItem: {
    backgroundColor: 'rgba(101, 196, 102, 0.1)',
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  bidUserInfo: {
    flex: 1,
  },
  bidUserName: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
  },
  bidTime: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textSecondary,
  },
  bidAmount: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.body,
    color: theme.colors.accent.base,
  },
  highestBidAmount: {
    color: theme.colors.success,
  },
  highestBidLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.success,
  },
  bidActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    ...theme.shadows.large,
  },
  minimumBidContainer: {
    flex: 1,
  },
  minimumBidLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textSecondary,
  },
  minimumBidAmount: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.body,
    color: theme.colors.accent.base,
  },
  placeBidButton: {
    backgroundColor: theme.colors.accent.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.medium,
  },
  placeBidButtonText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.button,
    color: '#FFFFFF',
  },
  auctionEndedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(255,59,48,0.1)',
  },
  auctionEndedMessage: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.body,
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
  },

  // Company profile styles
  companyCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    ...theme.shadows.medium,
  },
  companyHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.small,
    marginRight: theme.spacing.md,
  },
  companyHeaderText: {
    flex: 1,
    justifyContent: 'center',
  },
  companyTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.h2,
    color: theme.colors.primary.base,
    marginBottom: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.body,
    color: theme.colors.secondary.base,
    marginRight: theme.spacing.xs,
  },
  reviews: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textSecondary,
  },
  companyDescription: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.md,
  },
  companyDetails: {
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textPrimary,
    width: 120,
  },
  detailValue: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.neutral.textPrimary,
    flex: 1,
  },
  viewProfileButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  viewProfileButtonText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.button,
    color: '#FFFFFF',
  },
});

export default Marketplace;
