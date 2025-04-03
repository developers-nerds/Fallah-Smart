import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Animated,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { storage } from '../../utils/storage';
import { Product } from './MarketplaceFeed';
import { Auction } from './AuctionHouse';
import { SupplierRegistrationForm } from '../../screens/form/form';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StockStackParamList } from '../../navigation/types';
import {
  normalize,
  scaleSize,
  isSmallDevice,
  responsivePadding,
  responsiveHeight,
  responsiveWidth,
} from '../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = NativeStackNavigationProp<StockStackParamList>;

interface Supplier {
  id: number;
  company_name: string;
  about_us: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  company_logo: string;
  company_banner: string;
  open_time: string;
  close_time: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  hasAccount: boolean;
  productsNumber: number;
  ordersNumber: number;
  auctionsNumber: number;
  supplier?: Supplier;
  isVerified: boolean;
}

interface CompanyStats {
  totalProducts: number;
  activeAuctions: number;
  completedAuctions: number;
  totalOrders: number;
  totalRevenue: string;
  avgRating: number;
  totalReviews: number;
  memberSince: string;
}

interface CompanyDetails {
  name: string;
  logo: string;
  coverImage: string;
  description: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  certifications: string[];
  specializations: string[];
  stats: CompanyStats;
}

interface Order {
  id: string;
  productName: string;
  buyerName: string;
  amount: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
}

// Static data that isn't provided by the API
const staticData = {
  stats: {
    avgRating: 4.8,
    totalReviews: 450,
  },
  specializations: [
    'Smart Irrigation Systems',
    'Organic Farming Solutions',
    'Agricultural Equipment',
    'Premium Seeds',
    'Farm Management Systems',
  ],
};
const BaseUrl = process.env.EXPO_PUBLIC_API_URL;

// Temporary placeholder for missing images
const placeholderImages = {
  'company-profile':
    'https://img.freepik.com/free-vector/organic-flat-farming-profession-illustration_23-2148899111.jpg',
  marketplace: require('../../assets/images/onboarding/marketPlace.jpg'),
  auction: require('../../assets/images/onboarding/auctionhouse.jpg'),
  orders:
    'https://img.freepik.com/free-vector/organic-farming-concept-illustration_114360-9779.jpg',
};

// Onboarding animation component
interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
  icon: React.ReactNode;
}

const OnboardingAnimation: React.FC<{ onFinish: () => void; onCreateProfile: () => void }> = ({
  onFinish,
  onCreateProfile,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRef = useRef<FlatList>(null);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const isExtraSmall = screenHeight <= 1136;
  const isVerySmall = screenHeight <= 667;

  // Improve swipe responsiveness with these configurations
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Add this function to handle viewable items change
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // Add animation effect for smooth transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade effect when slide changes
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  // Ensure last slide is shown correctly even if user swipes manually
  useEffect(() => {
    if (currentIndex === slides.length - 1) {
      // Pre-warm the navigation by checking if we can access it
      console.log('Ready for profile creation');
    }
  }, [currentIndex]);

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      title: 'مرحباً بك في ملف الشركة',
      description: 'أنشئ ملف شركتك وابدأ في بيع منتجاتك',
      image: { uri: placeholderImages['company-profile'] },
      icon: (
        <MaterialCommunityIcons
          name="store"
          size={scaleSize(isExtraSmall ? 35 : 40)}
          color={theme.colors.primary.base}
        />
      ),
    },
    {
      id: '2',
      title: 'البيع في السوق',
      description: 'اعرض منتجاتك الزراعية وتواصل مع آلاف المزارعين والمشترين في جميع أنحاء البلاد.',
      image: placeholderImages.marketplace,
      icon: (
        <MaterialCommunityIcons
          name="shopping"
          size={scaleSize(isExtraSmall ? 35 : 40)}
          color={theme.colors.primary.base}
        />
      ),
    },
    {
      id: '3',
      title: 'إدارة المزادات',
      description: 'أنشئ مزادات لمنتجاتك المميزة واحصل على أفضل الأسعار في السوق.',
      image: placeholderImages.auction,
      icon: (
        <FontAwesome5
          name="gavel"
          size={scaleSize(isExtraSmall ? 32 : 36)}
          color={theme.colors.primary.base}
        />
      ),
    },
    {
      id: '4',
      title: 'تتبع الطلبات والتحليلات',
      description: 'أدر جميع طلباتك واحصل على رؤى حول أداء عملك من خلال تحليلات مفصلة.',
      image: { uri: placeholderImages['orders'] },
      icon: (
        <MaterialCommunityIcons
          name="chart-line"
          size={scaleSize(isExtraSmall ? 35 : 40)}
          color={theme.colors.primary.base}
        />
      ),
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      // Fade out before transition
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // Go to next slide with improved animation
        slideRef.current?.scrollToIndex({
          index: currentIndex + 1,
          animated: true,
          viewPosition: 0.5, // Ensure center positioning
        });
        // No need to manually set currentIndex as onViewableItemsChanged will handle it
      });
    } else {
      // We're on the last slide, navigate to registration form
      console.log('Attempting to navigate to registration form');
      // Wrap in setTimeout to ensure UI updates complete first
      setTimeout(() => {
        onCreateProfile();
      }, 100);
    }
  };

  const renderDots = () => {
    return (
      <View style={styles.dotContainer}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * screenWidth,
            index * screenWidth,
            (index + 1) * screenWidth,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [scaleSize(6), scaleSize(16), scaleSize(6)],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return <Animated.View key={index} style={[styles.dot, { width: dotWidth, opacity }]} />;
        })}
      </View>
    );
  };

  const renderItem = ({ item }: { item: OnboardingSlide }) => {
    return (
      <Animated.View style={[styles.slide, { width: screenWidth, opacity: fadeAnim }]}>
        <View style={[styles.slideIconContainer, isExtraSmall && styles.slideIconContainerSmall]}>
          {item.icon}
        </View>
        <View
          style={[
            styles.imageContainer,
            isExtraSmall && styles.imageContainerSmall,
            isVerySmall && styles.imageContainerVerySmall,
          ]}>
          <Image source={item.image} style={styles.slideImage} resizeMode="contain" />
        </View>
        <Text style={[styles.slideTitle, isExtraSmall && styles.slideTitleSmall]}>
          {item.title}
        </Text>
        <Text style={[styles.slideDescription, isExtraSmall && styles.slideDescriptionSmall]}>
          {item.description}
        </Text>
      </Animated.View>
    );
  };

  // Improve swipe handling with this function
  const handleMomentumScrollEnd = (e: any) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <SafeAreaView style={styles.onboardingContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.neutral.background} />

      <Animated.FlatList
        ref={slideRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16} // Improve scroll performance
        snapToInterval={screenWidth} // Ensure snapping to each slide
        snapToAlignment="center" // Center the snapped slide
        decelerationRate="fast" // Faster deceleration for better snap feel
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
      />

      {renderDots()}

      <View style={[styles.bottomContainer, isExtraSmall && styles.bottomContainerSmall]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            currentIndex === slides.length - 1 ? styles.getStartedButton : {},
            isExtraSmall && styles.nextButtonSmall,
          ]}
          onPress={handleNext}
          activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? 'إنشاء ملف الشركة' : 'التالي'}
          </Text>
          {currentIndex < slides.length - 1 && (
            <MaterialCommunityIcons name="arrow-right" size={scaleSize(20)} color="white" />
          )}
        </TouchableOpacity>

        {currentIndex < slides.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={onFinish} activeOpacity={0.7}>
            <Text style={styles.skipButtonText}>تخطي</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export const CompanyProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplierData, setSupplierData] = useState<ApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'reviews'>(
    'overview'
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    fetchSupplierData();
    // Extract base URL from API URL by removing '/api'
    if (BaseUrl) {
      setBaseUrl(BaseUrl.replace('/api', ''));
    }
  }, []);

  // Use useFocusEffect to run side effects when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('CompanyProfile screen is focused, refreshing data...');
      fetchSupplierData();

      // Load products if supplier data is available and active tab is products
      if (supplierData?.supplier && activeTab === 'products') {
        fetchSupplierProducts(supplierData.supplier.id);
      }

      return () => {
        // Optional cleanup if needed
      };
    }, [activeTab])
  );

  // Add function to fetch supplier products
  const fetchSupplierProducts = async (supplierId: number) => {
    try {
      setProductsLoading(true);
      const response = await fetch(`${BaseUrl}/crops/supplier/${supplierId}`);

      if (!response.ok) {
        throw new Error('فشل في تحميل منتجات المورد');
      }

      const data = await response.json();
      if (data.success) {
        console.log('Loaded supplier products:', data.cropListings.length);
        setProducts(data.cropListings);
      } else {
        throw new Error(data.message || 'فشل في تحميل منتجات المورد');
      }
    } catch (err) {
      console.error('Error fetching supplier products:', err);
      // Don't set error state to prevent disrupting the whole page
    } finally {
      setProductsLoading(false);
    }
  };

  // Update useFocusEffect to also load products when tab changes
  useEffect(() => {
    if (supplierData?.supplier && activeTab === 'products') {
      fetchSupplierProducts(supplierData.supplier.id);
    }
  }, [supplierData?.supplier?.id, activeTab]);

  const fetchSupplierData = async () => {
    try {
      const { access } = await storage.getTokens();
      if (!access) {
        console.log('No access token found');
        setError('فشل في تحميل بيانات المورد');
        setLoading(false);
        return;
      }

      console.log('Using token from storage:', access);

      const response = await fetch(`${BaseUrl}/suppliers/me`, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      if (!response.ok) {
        console.log('Failed to fetch supplier data:', response.status, response.statusText);
        throw new Error('فشل في تحميل بيانات المورد');
      }

      const data: ApiResponse = await response.json();
      console.log('Received supplier data:', data);
      setSupplierData(data);
      setIsVerified(data.isVerified);

      if (data.supplier) {
        console.log('Company logo URL:', data.supplier.company_logo);
        console.log('Company banner URL:', data.supplier.company_banner);
      }

      // Show onboarding if user doesn't have an account
      if (!data.hasAccount) {
        console.log('User does not have an account, showing onboarding');
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('Error fetching supplier data:', err);
      setError(err instanceof Error ? err.message : 'فشل في تحميل بيانات المورد');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingFinish = () => {
    setShowOnboarding(false);
  };

  const navigateToRegistrationForm = () => {
    console.log('Navigating to SupplierRegistrationForm');
    // Add a small delay to ensure navigation works properly
    setTimeout(() => {
      navigation.navigate('SupplierRegistrationForm');
    }, 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={styles.loadingText}>جاري تحميل معلومات المورد...</Text>
      </View>
    );
  }

  if (error || !supplierData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'فشل في تحميل بيانات المورد'}</Text>
      </View>
    );
  }

  if (!supplierData.hasAccount) {
    if (showOnboarding) {
      return (
        <OnboardingAnimation
          onFinish={handleOnboardingFinish}
          onCreateProfile={navigateToRegistrationForm}
        />
      );
    }

    return (
      <View style={styles.noProfileContainer}>
        <Image
          source={{ uri: placeholderImages['company-profile'] }}
          style={styles.noProfileImage}
        />
        <Text style={styles.noProfileText}>لم تقم بإنشاء ملف شركة بعد</Text>
        <Text style={styles.noProfileSubtext}>
          أنشئ ملف شركتك لتبدأ في بيع منتجاتك وخدماتك في السوق
        </Text>
        <TouchableOpacity style={styles.createProfileButton} onPress={navigateToRegistrationForm}>
          <Text style={styles.createProfileButtonText}>إنشاء ملف الشركة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const supplier = supplierData.supplier!;

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statsCard}>
          <MaterialCommunityIcons
            name="package-variant"
            size={24}
            color={theme.colors.primary.base}
          />
          <Text style={styles.statsNumber}>{supplierData.productsNumber}</Text>
          <Text style={styles.statsLabel}>المنتجات</Text>
        </View>
        <View style={styles.statsCard}>
          <FontAwesome5 name="gavel" size={24} color={theme.colors.primary.base} />
          <Text style={styles.statsNumber}>{supplierData.auctionsNumber}</Text>
          <Text style={styles.statsLabel}>المزادات النشطة</Text>
        </View>
        <View style={styles.statsCard}>
          <MaterialCommunityIcons name="shopping" size={24} color={theme.colors.primary.base} />
          <Text style={styles.statsNumber}>{supplierData.ordersNumber}</Text>
          <Text style={styles.statsLabel}>الطلبات</Text>
        </View>
        <View style={styles.statsCard}>
          <MaterialCommunityIcons name="star" size={24} color={theme.colors.primary.base} />
          <Text style={styles.statsNumber}>{staticData.stats.avgRating}</Text>
          <Text style={styles.statsLabel}>التقييم</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>من نحن</Text>
        <Text style={styles.description}>{supplier.about_us}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>التخصصات</Text>
        <View style={styles.tagsContainer}>
          {staticData.specializations.map((spec, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{spec}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>معلومات الاتصال</Text>
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary.base} />
            <Text style={styles.contactText}>{supplier.company_address}</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="web" size={20} color={theme.colors.primary.base} />
            <Text style={styles.contactText}>{supplier.company_website}</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary.base} />
            <Text style={styles.contactText}>{supplier.company_email}</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary.base} />
            <Text style={styles.contactText}>{supplier.company_phone}</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="clock" size={20} color={theme.colors.primary.base} />
            <Text style={styles.contactText}>
              {supplier.open_time.slice(0, 5)} - {supplier.close_time.slice(0, 5)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Add a render function for products tab
  const renderProductsTab = () => (
    <View style={styles.tabContent}>
      {productsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
          <Text style={styles.loadingText}>جاري تحميل المنتجات...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons
            name="package-variant"
            size={60}
            color={theme.colors.neutral.textSecondary}
          />
          <Text style={styles.emptyStateText}>لا توجد منتجات حالياً</Text>
          <TouchableOpacity
            style={styles.addItemButton}
            onPress={() => navigation.navigate('AddProduct')}>
            <Text style={styles.addItemButtonText}>إضافة منتج جديد</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}>
              <Image
                source={{
                  uri:
                    item.media && item.media.length > 0
                      ? item.media[0].url.startsWith('http')
                        ? item.media[0].url
                        : `${baseUrl}${item.media[0].url}`
                      : 'https://via.placeholder.com/150',
                }}
                style={styles.productImage}
              />
              <View style={styles.productDetails}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.productPrice}>
                  {item.price} ريال / {item.unit}
                </Text>
                <View style={styles.productMetaRow}>
                  <View style={styles.productMeta}>
                    <MaterialCommunityIcons
                      name="food"
                      size={14}
                      color={theme.colors.primary.base}
                    />
                    <Text style={styles.productMetaText}>{item.category}</Text>
                  </View>
                  <View style={styles.productMeta}>
                    <MaterialCommunityIcons
                      name="weight"
                      size={14}
                      color={theme.colors.primary.base}
                    />
                    <Text style={styles.productMetaText}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: supplier.company_banner
              ? supplier.company_banner.startsWith('http')
                ? supplier.company_banner
                : `${baseUrl}${supplier.company_banner}`
              : 'https://via.placeholder.com/1200x400',
          }}
          style={styles.coverImage}
          onLoad={() => console.log('Banner image loaded successfully')}
          onError={(error) => console.log('Error loading banner image:', error.nativeEvent.error)}
        />
        <View style={styles.headerContent}>
          <Image
            source={{
              uri: supplier.company_logo
                ? supplier.company_logo.startsWith('http')
                  ? supplier.company_logo
                  : `${baseUrl}${supplier.company_logo}`
                : 'https://via.placeholder.com/150',
            }}
            style={styles.logo}
            onLoad={() => console.log('Logo image loaded successfully')}
            onError={(error) => console.log('Error loading logo image:', error.nativeEvent.error)}
          />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName} numberOfLines={1} ellipsizeMode="tail">
              {supplier.company_name}
            </Text>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{staticData.stats.avgRating}</Text>
              <Text style={styles.reviews}>({staticData.stats.totalReviews} تقييم)</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              navigation.navigate('EditCompanyProfile', {
                supplier: supplierData.supplier,
              })
            }>
            <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.primary.base} />
            <Text style={styles.editButtonText}>تعديل</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}>
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              نظرة عامة
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'products' && styles.activeTab]}
            onPress={() => setActiveTab('products')}>
            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
              المنتجات
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
            onPress={() => setActiveTab('orders')}>
            <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
              الطلبات
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}>
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
              التقييمات
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'products' && renderProductsTab()}
        {/* Other tabs will be implemented similarly */}
      </ScrollView>

      {/* Add verification bar */}
      {!isVerified && (
        <View style={styles.verificationBar}>
          <Text style={styles.verificationText}>
            حسابك غير موثق. يرجى توثيق حسابك لفتح جميع الميزات.
          </Text>
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() =>
              navigation.navigate('SupplierRegistrationForm', {
                showVerificationOnly: true,
                supplierEmail: supplier.company_email,
              })
            }>
            <Text style={styles.verifyButtonText}>وثّق الآن</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  header: {
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.medium,
  },
  coverImage: {
    width: '100%',
    height: responsiveHeight(isSmallDevice ? 12 : 15),
    resizeMode: 'cover',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsivePadding(theme.spacing.md),
    marginTop: isSmallDevice ? -20 : -30,
    paddingBottom: responsivePadding(theme.spacing.lg),
    backgroundColor: theme.colors.neutral.surface,
    borderBottomLeftRadius: theme.borderRadius.medium,
    borderBottomRightRadius: theme.borderRadius.medium,
  },
  logo: {
    width: scaleSize(isSmallDevice ? 50 : 60),
    height: scaleSize(isSmallDevice ? 50 : 60),
    borderRadius: scaleSize(isSmallDevice ? 25 : 30),
    borderWidth: 2,
    borderColor: theme.colors.neutral.surface,
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.small,
  },
  companyInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  companyName: {
    fontSize: normalize(isSmallDevice ? 16 : 20),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 2,
    lineHeight: normalize(isSmallDevice ? 20 : 24),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
  },
  reviews: {
    marginLeft: 4,
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
  },
  tabsContainer: {
    backgroundColor: theme.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    marginBottom: theme.spacing.xs,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    overflow: 'scroll',
  },
  tab: {
    paddingHorizontal: responsivePadding(theme.spacing.sm),
    paddingVertical: responsivePadding(theme.spacing.xs),
    marginHorizontal: responsivePadding(theme.spacing.xs),
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary.base,
  },
  tabText: {
    fontSize: normalize(isSmallDevice ? 12 : 14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
  },
  activeTabText: {
    color: theme.colors.primary.base,
    fontFamily: theme.fonts.bold,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: responsivePadding(theme.spacing.xs),
  },
  statsCard: {
    width: isSmallDevice ? '47%' : '48%',
    backgroundColor: theme.colors.neutral.surface,
    padding: responsivePadding(theme.spacing.sm),
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginBottom: responsivePadding(theme.spacing.sm),
    ...theme.shadows.small,
  },
  statsNumber: {
    fontSize: normalize(isSmallDevice ? 18 : 24),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginVertical: theme.spacing.xs,
  },
  statsLabel: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.primary.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  tagText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
  },
  orderCard: {
    backgroundColor: theme.colors.neutral.background,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  orderProduct: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    flex: 1,
  },
  orderAmount: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  orderBuyer: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  orderStatus: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
  },
  statuspending: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  statusprocessing: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  statusshipped: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  statusdelivered: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  statuscancelled: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
  },
  orderStatusText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
  },
  orderDate: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  contactInfo: {
    gap: theme.spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
  },
  contactText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
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
    color: '#FF3B30',
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
  },
  noProfileContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  noProfileImage: {
    width: Dimensions.get('window').width * 0.5,
    height: Dimensions.get('window').width * 0.5,
    marginBottom: theme.spacing.lg,
  },
  noProfileText: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  noProfileSubtext: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  createProfileButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.medium,
  },
  createProfileButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.bold,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
    justifyContent: 'center',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsivePadding(theme.spacing.md),
  },
  slideIconContainer: {
    width: responsiveWidth(16),
    height: responsiveWidth(16),
    borderRadius: responsiveWidth(8),
    backgroundColor: theme.colors.primary.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsivePadding(theme.spacing.md),
    ...theme.shadows.medium,
  },
  slideIconContainerSmall: {
    width: responsiveWidth(14),
    height: responsiveWidth(14),
    borderRadius: responsiveWidth(7),
    marginBottom: responsivePadding(theme.spacing.sm),
  },
  imageContainer: {
    width: '90%',
    height: responsiveHeight(30),
    marginBottom: responsivePadding(theme.spacing.md),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageContainerSmall: {
    height: responsiveHeight(24),
    marginBottom: responsivePadding(theme.spacing.sm),
  },
  imageContainerVerySmall: {
    height: responsiveHeight(20),
  },
  slideImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.medium,
  },
  slideTitle: {
    fontSize: normalize(20),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: responsivePadding(theme.spacing.sm),
    paddingHorizontal: responsivePadding(theme.spacing.md),
  },
  slideTitleSmall: {
    fontSize: normalize(18),
    marginBottom: responsivePadding(theme.spacing.xs),
  },
  slideDescription: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginTop: responsivePadding(theme.spacing.xs),
    paddingHorizontal: responsivePadding(theme.spacing.md),
    lineHeight: normalize(20),
  },
  slideDescriptionSmall: {
    fontSize: normalize(13),
    lineHeight: normalize(18),
    paddingHorizontal: responsivePadding(theme.spacing.sm),
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: responsiveHeight(4),
    marginVertical: responsivePadding(theme.spacing.xs),
  },
  dot: {
    height: scaleSize(6),
    borderRadius: scaleSize(3),
    backgroundColor: theme.colors.primary.base,
    marginHorizontal: scaleSize(3),
  },
  bottomContainer: {
    marginTop: 'auto',
    paddingHorizontal: responsivePadding(theme.spacing.lg),
    paddingBottom:
      Platform.OS === 'ios'
        ? responsivePadding(theme.spacing.xl)
        : responsivePadding(theme.spacing.lg),
    alignItems: 'center',
  },
  bottomContainerSmall: {
    paddingBottom:
      Platform.OS === 'ios'
        ? responsivePadding(theme.spacing.lg)
        : responsivePadding(theme.spacing.md),
    paddingHorizontal: responsivePadding(theme.spacing.md),
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary.base,
    paddingVertical: responsivePadding(theme.spacing.sm),
    paddingHorizontal: responsivePadding(theme.spacing.lg),
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
    width: '100%',
    marginBottom: responsivePadding(theme.spacing.md),
    elevation: 3,
  },
  nextButtonSmall: {
    paddingVertical: responsivePadding(theme.spacing.xs),
    marginBottom: responsivePadding(theme.spacing.sm),
  },
  getStartedButton: {
    backgroundColor: theme.colors.primary.dark || '#052420',
  },
  nextButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: normalize(16),
    fontFamily: theme.fonts.bold,
    marginRight: responsivePadding(theme.spacing.xs),
  },
  skipButton: {
    paddingVertical: responsivePadding(theme.spacing.xs),
    paddingHorizontal: responsivePadding(theme.spacing.sm),
  },
  skipButtonText: {
    color: theme.colors.neutral.textSecondary,
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
  },
  verificationBar: {
    backgroundColor: '#FFC107',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  verifyButton: {
    backgroundColor: theme.colors.neutral.surface,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.small,
    ...theme.shadows.small,
  },
  verifyButtonText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
  },
  productCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    margin: responsivePadding(theme.spacing.xs),
    overflow: 'hidden',
    width: '47%',
    ...theme.shadows.small,
  },
  productImage: {
    width: '100%',
    height: responsiveHeight(12),
    resizeMode: 'cover',
  },
  productDetails: {
    padding: responsivePadding(theme.spacing.sm),
  },
  productName: {
    fontSize: normalize(isSmallDevice ? 13 : 15),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  productPrice: {
    fontSize: normalize(isSmallDevice ? 12 : 14),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginBottom: theme.spacing.xs,
  },
  productMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productMetaText: {
    fontSize: normalize(isSmallDevice ? 10 : 12),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginLeft: 4,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsivePadding(theme.spacing.xl),
  },
  emptyStateText: {
    fontSize: normalize(16),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    marginVertical: theme.spacing.md,
  },
  addItemButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.md,
  },
  addItemButtonText: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.surface,
  },
});
