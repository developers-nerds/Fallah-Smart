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
  Alert,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'products'>('overview');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'sold' | 'expired'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: '',
    unit: '',
    category: '',
    quantity: '',
    description: '',
    min_order_quantity: '',
    status: 'active',
    currency: 'SAR',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [productStats, setProductStats] = useState({
    active: 0,
    sold: 0,
    expired: 0,
  });

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

      // Load products if supplier data is available
      if (supplierData?.supplier) {
        fetchSupplierProducts(supplierData.supplier.id);
      }

      return () => {
        // Optional cleanup if needed
      };
    }, [supplierData?.supplier?.id])
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

        // Set products
        setProducts(data.cropListings);

        // Calculate counts by status
        const stats = {
          active: 0,
          sold: 0,
          expired: 0,
        };

        data.cropListings.forEach((product: any) => {
          if (product.status === 'active') stats.active++;
          else if (product.status === 'sold') stats.sold++;
          else if (product.status === 'expired') stats.expired++;
        });

        setProductStats(stats);
      } else {
        throw new Error(data.message || 'فشل في تحميل منتجات المورد');
      }
    } catch (err) {
      console.error('Error fetching supplier products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Update useEffect to also load products when supplier data is available
  useEffect(() => {
    if (supplierData?.supplier) {
      fetchSupplierProducts(supplierData.supplier.id);
    }
  }, [supplierData?.supplier?.id]);

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

  const handleOptionsPress = (productId: number) => {
    setSelectedProductId(selectedProductId === productId ? null : productId);
  };

  const deleteProduct = async (productId: number) => {
    try {
      // Show custom confirmation dialog
      setProductToDelete(productId);
      setShowDeleteConfirm(true);
    } catch (err) {
      console.error('Error in delete confirmation:', err);
      setSelectedProductId(null);
    }
  };

  const confirmDelete = async () => {
    if (productToDelete === null) return;

    try {
      const { access } = await storage.getTokens();
      if (!access) {
        console.log('No access token found');
        Alert.alert('خطأ', 'يجب تسجيل الدخول لحذف المنتج');
        return;
      }

      // First close the confirmation dialog
      setShowDeleteConfirm(false);

      // Show loading state if needed
      setProductsLoading(true);

      const response = await fetch(`${BaseUrl}/crops/listings/${productToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      if (!response.ok) {
        throw new Error('فشل في حذف المنتج');
      }
      const data = await response.json();
      if (data.success) {
        // Remove the product from the local state
        setProducts(products.filter((product) => Number(product.id) !== productToDelete));
        setSuccessMessage('تم حذف المنتج بنجاح');
        setShowSuccessMessage(true);

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } else {
        throw new Error(data.message || 'فشل في حذف المنتج');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      Alert.alert('خطأ', err instanceof Error ? err.message : 'فشل في حذف المنتج');
    } finally {
      setSelectedProductId(null); // Close the popup menu
      setProductToDelete(null);
      setProductsLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
    setSelectedProductId(null);
  };

  // Custom Delete Confirmation Modal
  const renderDeleteConfirmation = () => {
    return (
      <Modal
        transparent={true}
        visible={showDeleteConfirm}
        animationType="fade"
        onRequestClose={cancelDelete}>
        <TouchableWithoutFeedback onPress={cancelDelete}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.deleteConfirmContainer}>
                <View style={styles.deleteIconContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={50}
                    color={theme.colors.error}
                  />
                </View>
                <Text style={styles.deleteConfirmTitle}>تأكيد الحذف</Text>
                <Text style={styles.deleteConfirmText}>
                  هل أنت متأكد من رغبتك في حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.
                </Text>
                <View style={styles.deleteButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.deleteButton, styles.cancelButton]}
                    onPress={cancelDelete}>
                    <Text style={styles.cancelButtonText}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteButton, styles.confirmButton]}
                    onPress={confirmDelete}>
                    <Text style={styles.confirmButtonText}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Success Message Toast
  const renderSuccessMessage = () => {
    return (
      <Modal transparent={true} visible={showSuccessMessage} animationType="fade">
        <View style={styles.successToastContainer}>
          <View style={styles.successToast}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
            <Text style={styles.successToastText}>{successMessage}</Text>
          </View>
        </View>
      </Modal>
    );
  };

  const handleEditPress = (item: any) => {
    setProductToEdit(item);
    // Fill the form with existing data - better parsing of existing values
    setEditFormData({
      name: item.name || item.crop_name || '',
      price: item.price ? item.price.split(' ')[1] || item.price : '',
      unit: item.unit || 'kg',
      category: item.category || item.sub_category || '',
      quantity: item.quantity ? item.quantity.toString().split(' ')[0] || item.quantity : '',
      description: item.description || '',
      min_order_quantity: item.min_order_quantity?.toString() || '1',
      status: item.status || 'active',
      currency: item.currency || 'SAR',
    });
    console.log('Editing product:', item);
    setShowEditProductModal(true);
    setSelectedProductId(null); // Close the popup menu
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const closeEditModal = () => {
    setShowEditProductModal(false);
    setProductToEdit(null);
  };

  const handleUpdateProduct = async () => {
    if (!productToEdit) return;

    try {
      setEditLoading(true);

      const { access } = await storage.getTokens();
      if (!access) {
        Alert.alert('خطأ', 'يجب تسجيل الدخول لتعديل المنتج');
        return;
      }

      // Prepare the data for API
      const updateData = {
        crop_name: editFormData.name,
        price: editFormData.price,
        unit: editFormData.unit,
        quantity: Number(editFormData.quantity),
        description: editFormData.description,
        sub_category: editFormData.category,
        min_order_quantity: Number(editFormData.min_order_quantity),
        status: editFormData.status as 'active' | 'sold' | 'expired',
        currency: editFormData.currency,
      };

      const response = await fetch(`${BaseUrl}/crops/listings/${productToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث المنتج');
      }

      const data = await response.json();

      if (data.success) {
        // Update the product in local state
        const updatedProducts = products.map((p) => {
          if (Number(p.id) === Number(productToEdit.id)) {
            return {
              ...p,
              name: editFormData.name,
              price: `${editFormData.currency} ${editFormData.price}`,
              unit: editFormData.unit,
              category: editFormData.category,
              quantity: Number(editFormData.quantity),
              description: editFormData.description,
              min_order_quantity: Number(editFormData.min_order_quantity),
              status: editFormData.status as 'active' | 'sold' | 'expired',
              currency: editFormData.currency,
            };
          }
          return p;
        });

        setProducts(updatedProducts);

        // Show success message
        setSuccessMessage('تم تحديث المنتج بنجاح');
        setShowSuccessMessage(true);

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);

        // Close the modal
        closeEditModal();
      } else {
        throw new Error(data.message || 'فشل في تحديث المنتج');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      Alert.alert('خطأ', err instanceof Error ? err.message : 'فشل في تحديث المنتج');
    } finally {
      setEditLoading(false);
    }
  };

  // Edit Product Modal
  const renderEditProductModal = () => {
    return (
      <Modal
        transparent={true}
        visible={showEditProductModal}
        animationType="slide"
        onRequestClose={closeEditModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.editModalContainer}>
                <View style={styles.editModalHeader}>
                  <TouchableOpacity onPress={closeEditModal} style={styles.closeButton}>
                    <MaterialCommunityIcons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.editModalTitle}>تعديل المنتج | {editFormData.name}</Text>
                </View>

                <ScrollView
                  style={styles.editFormScrollView}
                  contentContainerStyle={styles.editFormContentContainer}>
                  <View style={styles.editFormField}>
                    <Text style={styles.editFormLabel}>اسم المحصول*</Text>
                    <TextInput
                      style={styles.editFormInput}
                      value={editFormData.name}
                      onChangeText={(value) => handleEditFormChange('name', value)}
                      placeholder="اسم المحصول"
                      placeholderTextColor={theme.colors.neutral.textSecondary}
                    />
                  </View>

                  <View style={styles.editFormRow}>
                    <View
                      style={[styles.editFormField, { flex: 1, marginRight: theme.spacing.sm }]}>
                      <Text style={styles.editFormLabel}>السعر*</Text>
                      <TextInput
                        style={styles.editFormInput}
                        value={editFormData.price}
                        onChangeText={(value) => handleEditFormChange('price', value)}
                        placeholder="السعر"
                        placeholderTextColor={theme.colors.neutral.textSecondary}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={[styles.editFormField, { flex: 1 }]}>
                      <Text style={styles.editFormLabel}>العملة</Text>
                      <View style={styles.editFormSelectContainer}>
                        <Picker
                          selectedValue={editFormData.currency}
                          onValueChange={(value: string) => handleEditFormChange('currency', value)}
                          style={styles.editFormSelect}
                          dropdownIconColor={theme.colors.primary.base}>
                          <Picker.Item label="SAR - ريال سعودي" value="SAR" />
                          <Picker.Item label="USD - دولار أمريكي" value="USD" />
                          <Picker.Item label="EUR - يورو" value="EUR" />
                          <Picker.Item label="AED - درهم إماراتي" value="AED" />
                          <Picker.Item label="TND - دينار تونسي" value="TND" />
                        </Picker>
                      </View>
                    </View>
                  </View>

                  <View style={styles.editFormRow}>
                    <View
                      style={[styles.editFormField, { flex: 1, marginRight: theme.spacing.sm }]}>
                      <Text style={styles.editFormLabel}>الوحدة*</Text>
                      <View style={styles.editFormSelectContainer}>
                        <Picker
                          selectedValue={editFormData.unit}
                          onValueChange={(value: string) => handleEditFormChange('unit', value)}
                          style={styles.editFormSelect}
                          dropdownIconColor={theme.colors.primary.base}>
                          <Picker.Item label="كيلوغرام - kg" value="kg" />
                          <Picker.Item label="غرام - g" value="g" />
                          <Picker.Item label="لتر - l" value="l" />
                          <Picker.Item label="مليلتر - ml" value="ml" />
                          <Picker.Item label="قطعة - pcs" value="pcs" />
                          <Picker.Item label="كيس - bag" value="bag" />
                          <Picker.Item label="صندوق - box" value="box" />
                          <Picker.Item label="علبة - can" value="can" />
                          <Picker.Item label="زجاجة - bottle" value="bottle" />
                          <Picker.Item label="برطمان - jar" value="jar" />
                          <Picker.Item label="عبوة - packet" value="packet" />
                          <Picker.Item label="قطعة - piece" value="piece" />
                          <Picker.Item label="لفة - roll" value="roll" />
                          <Picker.Item label="ورقة - sheet" value="sheet" />
                          <Picker.Item label="أنبوب - tube" value="tube" />
                          <Picker.Item label="وحدة - unit" value="unit" />
                        </Picker>
                      </View>
                    </View>

                    <View style={[styles.editFormField, { flex: 1 }]}>
                      <Text style={styles.editFormLabel}>الحالة</Text>
                      <View style={styles.editFormSelectContainer}>
                        <Picker
                          selectedValue={editFormData.status}
                          onValueChange={(value: string) => handleEditFormChange('status', value)}
                          style={styles.editFormSelect}
                          dropdownIconColor={theme.colors.primary.base}>
                          <Picker.Item label="نشط - active" value="active" />
                          <Picker.Item label="تم البيع - sold" value="sold" />
                          <Picker.Item label="منتهي - expired" value="expired" />
                        </Picker>
                      </View>
                    </View>
                  </View>

                  <View style={styles.editFormField}>
                    <Text style={styles.editFormLabel}>التصنيف الفرعي*</Text>
                    <View style={styles.editFormSelectContainer}>
                      <Picker
                        selectedValue={editFormData.category}
                        onValueChange={(value: string) => handleEditFormChange('category', value)}
                        style={styles.editFormSelect}
                        dropdownIconColor={theme.colors.primary.base}>
                        <Picker.Item label="خضروات" value="خضروات" />
                        <Picker.Item label="فواكه" value="فواكه" />
                        <Picker.Item label="حبوب" value="حبوب" />
                        <Picker.Item label="أعشاب" value="أعشاب" />
                        <Picker.Item label="مكسرات" value="مكسرات" />
                        <Picker.Item label="زهور" value="زهور" />
                        <Picker.Item label="بذور" value="بذور" />
                        <Picker.Item label="شتلات" value="شتلات" />
                        <Picker.Item label="أخرى" value="أخرى" />
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.editFormRow}>
                    <View
                      style={[styles.editFormField, { flex: 1, marginRight: theme.spacing.sm }]}>
                      <Text style={styles.editFormLabel}>الكمية المتاحة*</Text>
                      <TextInput
                        style={styles.editFormInput}
                        value={editFormData.quantity}
                        onChangeText={(value) => handleEditFormChange('quantity', value)}
                        placeholder="الكمية"
                        placeholderTextColor={theme.colors.neutral.textSecondary}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={[styles.editFormField, { flex: 1 }]}>
                      <Text style={styles.editFormLabel}>الحد الأدنى للطلب*</Text>
                      <TextInput
                        style={styles.editFormInput}
                        value={editFormData.min_order_quantity}
                        onChangeText={(value) => handleEditFormChange('min_order_quantity', value)}
                        placeholder="الحد الأدنى"
                        placeholderTextColor={theme.colors.neutral.textSecondary}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.editFormField}>
                    <Text style={styles.editFormLabel}>الوصف*</Text>
                    <TextInput
                      style={[styles.editFormInput, styles.editFormTextArea]}
                      value={editFormData.description}
                      onChangeText={(value) => handleEditFormChange('description', value)}
                      placeholder="وصف المنتج"
                      placeholderTextColor={theme.colors.neutral.textSecondary}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.editFormActions}>
                    <TouchableOpacity
                      style={[styles.editFormButton, styles.editFormCancelButton]}
                      onPress={closeEditModal}
                      disabled={editLoading}>
                      <Text style={styles.editFormCancelButtonText}>إلغاء</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.editFormButton, styles.editFormSubmitButton]}
                      onPress={handleUpdateProduct}
                      disabled={editLoading}>
                      {editLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                          <Text style={styles.editFormSubmitButtonText}>حفظ التغييرات</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Add this handler function near handleOptionsPress
  const handleOutsidePress = () => {
    // Only close options popup if edit modal is not open
    if (selectedProductId !== null && !showEditProductModal) {
      setSelectedProductId(null);
    }
  };

  // Add this function to handle filtering
  const filterProducts = () => {
    let filtered = [...products];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((product) => product.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) =>
        (product.name || product.crop_name || '').toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  };

  // Update useEffect to include filtering
  useEffect(() => {
    filterProducts();
  }, [products, statusFilter, searchQuery]);

  // Add this function to handle status filter change
  const handleStatusFilterChange = (status: 'all' | 'active' | 'sold' | 'expired') => {
    setStatusFilter(status);
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
            name="package-variant-closed"
            size={24}
            color={theme.colors.primary.base}
          />
          <Text style={styles.statsNumber}>
            {productStats.active + productStats.sold + productStats.expired}
          </Text>
          <Text style={styles.statsLabel}>إجمالي المنتجات</Text>
        </View>
        <View style={styles.statsCard}>
          <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.success} />
          <Text style={styles.statsNumber}>{productStats.active}</Text>
          <Text style={styles.statsLabel}>المنتجات النشطة</Text>
        </View>
        <View style={styles.statsCard}>
          <MaterialCommunityIcons
            name="shopping"
            size={24}
            color={theme.colors.accent.base || theme.colors.secondary.base}
          />
          <Text style={styles.statsNumber}>{productStats.sold}</Text>
          <Text style={styles.statsLabel}>تم بيعها</Text>
        </View>
        <View style={styles.statsCard}>
          <MaterialCommunityIcons
            name="timer-sand-empty"
            size={24}
            color={theme.colors.warning || '#EF6C00'}
          />
          <Text style={styles.statsNumber}>{productStats.expired}</Text>
          <Text style={styles.statsLabel}>منتهية</Text>
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
          {supplier.company_website && supplier.company_website.trim() !== '' && (
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="web" size={20} color={theme.colors.primary.base} />
              <Text style={styles.contactText}>{supplier.company_website}</Text>
            </View>
          )}
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
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
          <Text style={styles.loadingText}>جاري تحميل المنتجات...</Text>
        </View>
      ) : (
        <>
          <View style={styles.filterContainer}>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={theme.colors.neutral.textSecondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="ابحث عن منتج..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={theme.colors.neutral.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}>
              <MaterialCommunityIcons
                name={showFilters ? 'filter-remove' : 'filter'}
                size={20}
                color={theme.colors.primary.base}
              />
              <Text style={styles.filterButtonText}>تصفية</Text>
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.statusFilterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.statusFilterButton,
                    statusFilter === 'all' && styles.statusFilterButtonActive,
                  ]}
                  onPress={() => handleStatusFilterChange('all')}>
                  <Text
                    style={[
                      styles.statusFilterText,
                      statusFilter === 'all' && styles.statusFilterTextActive,
                    ]}>
                    الكل
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusFilterButton,
                    statusFilter === 'active' && styles.statusFilterButtonActive,
                  ]}
                  onPress={() => handleStatusFilterChange('active')}>
                  <Text
                    style={[
                      styles.statusFilterText,
                      statusFilter === 'active' && styles.statusFilterTextActive,
                    ]}>
                    نشط
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusFilterButton,
                    statusFilter === 'sold' && styles.statusFilterButtonActive,
                  ]}
                  onPress={() => handleStatusFilterChange('sold')}>
                  <Text
                    style={[
                      styles.statusFilterText,
                      statusFilter === 'sold' && styles.statusFilterTextActive,
                    ]}>
                    تم البيع
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusFilterButton,
                    statusFilter === 'expired' && styles.statusFilterButtonActive,
                  ]}
                  onPress={() => handleStatusFilterChange('expired')}>
                  <Text
                    style={[
                      styles.statusFilterText,
                      statusFilter === 'expired' && styles.statusFilterTextActive,
                    ]}>
                    منتهي
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons
                name="package-variant"
                size={60}
                color={theme.colors.neutral.textSecondary}
              />
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد منتجات حالياً'}
              </Text>
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={() => navigation.navigate('AddProduct')}>
                <Text style={styles.addItemButtonText}>إضافة منتج جديد</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={styles.productGrid}
              renderItem={({ item }) => (
                <View style={styles.productCard}>
                  <View style={styles.productImageContainer}>
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

                    {/* Add a status badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        item.status === 'sold'
                          ? styles.statusSold
                          : item.status === 'expired'
                            ? styles.statusExpired
                            : styles.statusActive,
                      ]}>
                      <Text style={styles.statusText}>
                        {item.status === 'sold'
                          ? 'تم البيع'
                          : item.status === 'expired'
                            ? 'منتهي'
                            : 'نشط'}
                      </Text>
                    </View>
                  </View>

                  {/* Product Options Menu */}
                  <TouchableOpacity
                    style={[
                      styles.optionsButton,
                      selectedProductId === Number(item.id) && styles.optionsButtonActive,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation(); // Prevent event from bubbling to parent
                      handleOptionsPress(Number(item.id));
                    }}
                    activeOpacity={0.8}>
                    <MaterialCommunityIcons
                      name="dots-vertical"
                      size={20}
                      color={theme.colors.neutral.textPrimary}
                    />

                    {/* Options Popup - Only show when selected */}
                    {selectedProductId === Number(item.id) && (
                      <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View style={styles.optionsPopup}>
                          <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                              // Update to handle edit action
                              handleEditPress(item);
                            }}
                            activeOpacity={0.7}>
                            <MaterialCommunityIcons
                              name="pencil-outline"
                              size={18}
                              color={theme.colors.primary.base}
                            />
                            <Text style={styles.optionText}>تعديل</Text>
                          </TouchableOpacity>

                          <View style={styles.optionsDivider} />

                          <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                              // Handle delete action
                              deleteProduct(Number(item.id));
                            }}
                            activeOpacity={0.7}>
                            <MaterialCommunityIcons
                              name="delete-outline"
                              size={18}
                              color={theme.colors.error}
                            />
                            <Text style={[styles.optionText, styles.deleteText]}>حذف</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableWithoutFeedback>
                    )}
                  </TouchableOpacity>

                  <View style={styles.productDetails}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {item.name || item.crop_name || 'منتج'}
                    </Text>
                    <Text style={styles.productPrice}>
                      {item.price} {item.unit && `/ ${item.unit}`}
                    </Text>

                    <View style={styles.productMetaRow}>
                      <View style={styles.productMeta}>
                        <MaterialCommunityIcons
                          name="tag-outline"
                          size={14}
                          color={theme.colors.primary.base}
                        />
                        <Text style={styles.productMetaText}>
                          {item.category || item.sub_category || 'عام'}
                        </Text>
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

                    {/* Add listing date */}
                    <View style={styles.dateContainer}>
                      <MaterialCommunityIcons
                        name="calendar-outline"
                        size={12}
                        color={theme.colors.neutral.textSecondary}
                      />
                      <Text style={styles.dateText}>
                        {new Date(item.createdAt || Date.now()).toLocaleDateString('ar-SA')}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderDeleteConfirmation()}
      {renderSuccessMessage()}
      {renderEditProductModal()}

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
  productGrid: {
    padding: theme.spacing.sm,
  },
  productCard: {
    flex: 1,
    margin: responsivePadding(theme.spacing.xs),
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    position: 'relative', // Add this to allow absolute positioning within
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    maxWidth: '47%',
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: scaleSize(130),
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  statusActive: {
    backgroundColor: theme.colors.success,
  },
  statusSold: {
    backgroundColor: theme.colors.error,
  },
  statusExpired: {
    backgroundColor: theme.colors.warning.dark || '#EF6C00',
  },
  statusText: {
    color: 'white',
    fontSize: normalize(10),
    fontFamily: theme.fonts.medium,
  },
  productDetails: {
    padding: responsivePadding(theme.spacing.sm),
  },
  productName: {
    fontSize: normalize(isSmallDevice ? 12 : 14),
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: normalize(isSmallDevice ? 11 : 13),
    fontFamily: theme.fonts.medium,
    color: theme.colors.accent.base || theme.colors.primary.base,
    marginBottom: 4,
  },
  productMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productMetaText: {
    fontSize: normalize(isSmallDevice ? 9 : 10),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginLeft: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dateText: {
    fontSize: normalize(isSmallDevice ? 8 : 9),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginLeft: 4,
  },
  optionsButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  // Edit modal title with product name
  editModalTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: normalize(16),
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  optionsPopup: {
    position: 'absolute',
    top: 32, // Position below the options button
    left: -5,
    width: responsiveWidth(35),
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.xs,
    zIndex: 999, // Use a higher z-index
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
  },
  optionText: {
    marginLeft: theme.spacing.sm,
    fontSize: normalize(13),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
  },
  deleteText: {
    color: theme.colors.error,
  },
  optionsDivider: {
    height: 1,
    backgroundColor: theme.colors.neutral.border,
    marginVertical: theme.spacing.xs,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  // Delete confirmation modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  deleteIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  deleteConfirmTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: normalize(18),
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  deleteConfirmText: {
    fontFamily: theme.fonts.regular,
    fontSize: normalize(14),
    color: theme.colors.neutral.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  deleteButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  cancelButton: {
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  confirmButton: {
    backgroundColor: theme.colors.error,
  },
  cancelButtonText: {
    fontFamily: theme.fonts.medium,
    fontSize: normalize(14),
    color: theme.colors.neutral.textPrimary,
  },
  confirmButtonText: {
    fontFamily: theme.fonts.medium,
    fontSize: normalize(14),
    color: 'white',
  },

  // Success toast styles
  successToastContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successToastText: {
    fontFamily: theme.fonts.medium,
    fontSize: normalize(14),
    color: 'white',
    marginLeft: theme.spacing.sm,
  },
  // Edit product modal styles
  editModalContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.large,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Remove overflow: 'hidden' which can cause scrolling issues
  },
  editModalHeader: {
    flexDirection: 'row-reverse', // Changed to match Arabic RTL
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  editFormScrollView: {
    flexGrow: 1,
    // Remove maxHeight constraint which limits scrollability
  },
  editFormField: {
    marginBottom: theme.spacing.md,
  },
  editFormRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  editFormLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: normalize(14),
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.xs,
    textAlign: 'right',
  },
  editFormInput: {
    backgroundColor: theme.colors.neutral.background,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fonts.regular,
    fontSize: normalize(14),
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
    height: isSmallDevice ? 40 : 50,
  },
  editFormSelectContainer: {
    backgroundColor: theme.colors.neutral.background,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: theme.borderRadius.medium,
    height: isSmallDevice ? 40 : 50,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  editFormSelect: {
    height: isSmallDevice ? 40 : 50,
    width: '100%',
    color: theme.colors.neutral.textPrimary,
  },
  editFormTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    height: 'auto',
  },
  editFormActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  editFormButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isSmallDevice ? 44 : 50,
  },
  editFormCancelButton: {
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  editFormSubmitButton: {
    backgroundColor: theme.colors.primary.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  editFormCancelButtonText: {
    fontFamily: theme.fonts.medium,
    fontSize: normalize(14),
    color: theme.colors.neutral.textPrimary,
  },
  editFormSubmitButtonText: {
    fontFamily: theme.fonts.medium,
    fontSize: normalize(14),
    color: 'white',
  },
  optionsButtonActive: {
    backgroundColor: theme.colors.primary.surface,
  },
  editFormContentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl, // Add extra padding at bottom for better scroll experience
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    fontSize: normalize(14),
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
  },
  filterButtonText: {
    marginRight: theme.spacing.xs,
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
  },
  statusFilterContainer: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  statusFilterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.background,
    marginHorizontal: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  statusFilterButtonActive: {
    backgroundColor: theme.colors.primary.base,
    borderColor: theme.colors.primary.base,
  },
  statusFilterText: {
    fontSize: normalize(14),
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
  },
  statusFilterTextActive: {
    color: theme.colors.neutral.surface,
  },
});
