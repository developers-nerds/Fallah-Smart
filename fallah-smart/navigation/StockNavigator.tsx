import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import StockScreen from '../screens/Stock/stock';
import { StockDetail } from '../screens/Stock/StockDetail';
import { StockForm } from '../screens/Stock/components/StockForm';
import { AnimalsScreen } from '../screens/Stock/Animals/Animals';
import { AddAnimalScreen } from '../screens/Stock/Animals/AddAnimal';
import { AnimalDetailScreen } from '../screens/Stock/Animals/AnimalDetail';
import { useStock } from '../context/StockContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import TabBar from './TabBar';
import Login from '../screens/Auth/Login';
import Register from '../screens/Auth/Register';
import PhoneLogin from '../screens/Auth/PhoneLogin';
import CompleteProfile from '../screens/Auth/CompleteProfile';
import { StockItem, StockFormValues } from '../screens/Stock/types';
import { View, ActivityIndicator, Text } from 'react-native';
import { PesticideDetail } from '../screens/Stock/Pesticides/PesticideDetail';
import AddPesticideScreen from '../screens/Stock/Pesticides/AddPesticide';
import EditPesticideScreen from '../screens/Stock/Pesticides/EditPesticide';
import PesticideListScreen from '../screens/Stock/Pesticides/PesticideList';
import { PesticideProvider } from '../context/PesticideContext';
import Blogs from '../screens/blogs/blogs';
import PostDetail from '../screens/blogs/PostDetail';
import StockStatisticsScreen from '../screens/Stock/StockStatics';
import { StockStackParamList } from './types';
import { ToolProvider } from '../context/ToolContext';
import { EquipmentProvider } from '../context/EquipmentContext';
import { SeedProvider } from '../context/SeedContext';
import { FeedProvider } from '../context/FeedContext';
import { HarvestProvider } from '../context/HarvestContext';
import { FertilizerProvider } from '../context/FertilizerContext';
import { AnimalProvider } from '../context/AnimalContext';
import WelcomeOnboarding from '../screens/Onboarding/WelcomeOnboarding';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Tool screens
import ToolListScreen from '../screens/Stock/Tools/ToolList';
import ToolDetailScreen from '../screens/Stock/Tools/ToolDetail';
import AddToolScreen from '../screens/Stock/Tools/AddTool';

// Import Equipment screens
import EquipmentListScreen from '../screens/Stock/Equipment/EquipmentList';
import EquipmentDetailScreen from '../screens/Stock/Equipment/EquipmentDetail';
import AddEquipmentScreen from '../screens/Stock/Equipment/AddEquipment';

// Import Seed screens
import SeedListScreen from '../screens/Stock/Seeds/SeedList';
import SeedDetailScreen from '../screens/Stock/Seeds/SeedDetail';
import AddSeedScreen from '../screens/Stock/Seeds/AddSeed';

// Import Feed screens
import FeedListScreen from '../screens/Stock/Feed/FeedList';
import FeedDetailScreen from '../screens/Stock/Feed/FeedDetail';
import AddFeedScreen from '../screens/Stock/Feed/AddFeed';

// Import Harvest screens
import HarvestListScreen from '../screens/Stock/Harvests/HarvestList';
import HarvestDetailScreen from '../screens/Stock/Harvests/HarvestDetail';
import AddHarvestScreen from '../screens/Stock/Harvests/AddHarvest';

// Import Fertilizer screens
import FertilizerListScreen from '../screens/Stock/Fertilizers/FertilizerList';
import FertilizerDetailScreen from '../screens/Stock/Fertilizers/FertilizerDetail';
import AddFertilizerScreen from '../screens/Stock/Fertilizers/AddFertilizer';

import AdvisorApplicationScreen from '../screens/Advisor/AdvisorApplicationScreen';
import { useTranslation } from 'react-i18next';
import NotificationSettingsScreen from '../screens/Settings/NotificationSettings';
import { SupplierRegistrationForm } from '../screens/form/form';
import MarketplaceScreen from '../screens/Marketplace/marketplace';
import AddProduct from '../screens/Marketplace/AddProduct';
import EditCompanyProfile from '../components/marketplace/EditCompanyProfile';

const Stack = createStackNavigator<StockStackParamList>();

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

export const StockNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stock = useStock();
  const theme = useTheme();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const navigation = useNavigation();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const onboardingComplete = await AsyncStorage.getItem('@onboarding_complete');
        setIsOnboardingComplete(onboardingComplete === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsNavigationReady(true);
      }
    };

    checkOnboardingStatus();
  }, []);

  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_complete', 'true');
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  // Modified useEffect to only fetch data after login
  useEffect(() => {
    // Only try to load initial data if user is authenticated
    if (isAuthenticated) {
      const loadInitialData = async () => {
        try {
          setIsLoading(true);
          setError(null);
          await stock.refreshStocks();
          await stock.refreshAnimals();
        } catch (err) {
          console.error('Failed to load initial data:', err);
          setError('Failed to load data. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };

      loadInitialData();
    } else {
      // If not authenticated, just mark as not loading
      setIsLoading(false);
    }
  }, [isAuthenticated]); // Depend on authentication state instead of component mount

  const screenOptions = {
    headerStyle: {
      backgroundColor: theme.colors.neutral.surface,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTintColor: theme.colors.neutral.textPrimary,
    headerTitleStyle: {
      fontWeight: '600' as const,
    },
    cardStyle: {
      backgroundColor: theme.colors.neutral.background,
    },
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  return (
    <AnimalProvider>
      <PesticideProvider>
        <ToolProvider>
          <EquipmentProvider>
            <SeedProvider>
              <FeedProvider>
                <HarvestProvider>
                  <FertilizerProvider>
                    <Stack.Navigator screenOptions={screenOptions}>
                      {!isOnboardingComplete ? (
                        <Stack.Screen
                          name="WelcomeOnboarding"
                          component={WelcomeOnboarding}
                          options={{ headerShown: false }}
                          listeners={{
                            beforeRemove: () => {
                              markOnboardingComplete();
                            },
                          }}
                        />
                      ) : null}
                      <Stack.Screen
                        name="Login"
                        component={Login}
                        options={{ headerShown: true }}
                      />
                      <Stack.Screen
                        name="Register"
                        component={Register}
                        options={{ headerShown: true }}
                      />
                      <Stack.Screen
                        name="PhoneLogin"
                        component={PhoneLogin}
                        options={{ headerShown: true, title: 'تسجيل الدخول برقم الهاتف' }}
                      />
                      <Stack.Screen
                        name="CompleteProfile"
                        component={CompleteProfile}
                        options={{ headerShown: true, title: 'إكمال الملف الشخصي' }}
                      />
                      <Stack.Screen
                        name="StockTab"
                        component={TabBar}
                        options={{ title: 'مخزوني', headerShown: false }}
                      />
                      <Stack.Screen
                        name="StockList"
                        component={StockScreen}
                        options={{
                          title: t('stock.title'),
                        }}
                      />
                      <Stack.Screen
                        name="StockDetail"
                        component={StockDetail}
                        options={{ title: 'تفاصيل المخزون', headerShown: true }}
                      />
                      <Stack.Screen name="AddStock">
                        {(props) => <AddStockScreenContainer {...props} />}
                      </Stack.Screen>
                      <Stack.Screen
                        name="Animals"
                        component={AnimalsScreen}
                        options={{
                          title: 'حيواناتي',
                        }}
                      />
                      <Stack.Screen
                        name="AddAnimal"
                        component={AddAnimalScreen}
                        options={{
                          title: 'إضافة حيوان',
                        }}
                      />
                      <Stack.Screen
                        name="AnimalDetail"
                        component={AnimalDetailScreen}
                        options={{
                          title: 'تفاصيل الحيوان',
                        }}
                      />
                      <Stack.Screen
                        name="PesticideList"
                        component={PesticideListScreen}
                        options={{ title: 'قائمة المبيدات', headerShown: true }}
                      />
                      <Stack.Screen
                        name="PesticideDetail"
                        component={PesticideDetail}
                        options={{ title: 'تفاصيل المبيد', headerShown: true }}
                      />
                      <Stack.Screen
                        name="AddPesticide"
                        component={AddPesticideScreen}
                        options={{ title: 'إضافة مبيد', headerShown: true }}
                      />
                      <Stack.Screen
                        name="EditPesticide"
                        component={EditPesticideScreen}
                        options={{ title: 'تعديل المبيد', headerShown: true }}
                      />
                      <Stack.Screen
                        name="ToolList"
                        component={ToolListScreen}
                        options={{ title: 'قائمة الأدوات', headerShown: true }}
                      />
                      <Stack.Screen
                        name="ToolDetail"
                        component={ToolDetailScreen}
                        options={{ title: 'تفاصيل الأداة', headerShown: true }}
                      />
                      <Stack.Screen
                        name="AddTool"
                        component={AddToolScreen}
                        options={{ title: 'إضافة أداة', headerShown: true }}
                      />
                      <Stack.Screen
                        name="EquipmentList"
                        component={EquipmentListScreen}
                        options={{ title: 'قائمة المعدات', headerShown: true }}
                      />
                      <Stack.Screen
                        name="EquipmentDetail"
                        component={EquipmentDetailScreen}
                        options={{ title: 'تفاصيل المعدة', headerShown: true }}
                      />
                      <Stack.Screen
                        name="AddEquipment"
                        component={AddEquipmentScreen}
                        options={{ title: 'إضافة معدة', headerShown: true }}
                      />
                      <Stack.Screen
                        name="SeedList"
                        component={SeedListScreen}
                        options={{ title: 'قائمة البذور', headerShown: true }}
                      />
                      <Stack.Screen
                        name="SeedDetail"
                        component={SeedDetailScreen}
                        options={{ title: 'تفاصيل البذور', headerShown: true }}
                      />
                      <Stack.Screen
                        name="AddSeed"
                        component={AddSeedScreen}
                        options={{ title: 'إضافة بذور', headerShown: true }}
                      />
                      <Stack.Screen
                        name="FeedList"
                        component={FeedListScreen}
                        options={{ title: 'قائمة الأعلاف', headerShown: true }}
                      />
                      <Stack.Screen
                        name="FeedDetail"
                        component={FeedDetailScreen}
                        options={{ title: 'تفاصيل العلف', headerShown: true }}
                      />
                      <Stack.Screen
                        name="AddFeed"
                        component={AddFeedScreen}
                        options={{ title: 'إضافة علف', headerShown: true }}
                      />
                      <Stack.Screen
                        name="HarvestList"
                        component={HarvestListScreen}
                        options={{ title: 'قائمة المحاصيل', headerShown: true }}
                      />
                      <Stack.Screen
                        name="HarvestDetail"
                        component={HarvestDetailScreen}
                        options={{ title: 'تفاصيل المحصول', headerShown: true }}
                      />
                      <Stack.Screen
                        name="AddHarvest"
                        component={AddHarvestScreen}
                        options={{ title: 'إضافة محصول', headerShown: true }}
                      />
                      <Stack.Screen
                        name="FertilizerList"
                        component={FertilizerListScreen}
                        options={{ title: 'قائمة الأسمدة', headerShown: true }}
                      />
                      <Stack.Screen
                        name="FertilizerDetail"
                        component={FertilizerDetailScreen}
                        options={{ title: 'تفاصيل السماد', headerShown: true }}
                      />
                      <Stack.Screen
                        name="AddFertilizer"
                        component={AddFertilizerScreen}
                        options={{ title: 'إضافة سماد', headerShown: true }}
                      />
                      <Stack.Screen
                        name="SupplierRegistrationForm"
                        component={SupplierRegistrationForm}
                        options={{
                          title: 'تسجيل مورد جديد',
                          headerShown: true,
                          headerTitleAlign: 'center',
                        }}
                      />
                      <Stack.Screen
                        name="Blogs"
                        component={Blogs}
                        options={{ title: 'المدونة', headerShown: true }}
                      />
                      <Stack.Screen
                        name="PostDetail"
                        component={PostDetail}
                        options={{ title: 'تفاصيل المنشور', headerShown: false }}
                      />
                      <Stack.Screen
                        name="Statistics"
                        component={StockStatisticsScreen}
                        options={{ title: 'إحصائيات المخزون', headerShown: true }}
                      />
                      <Stack.Screen
                        name="NotificationSettings"
                        component={NotificationSettingsScreen}
                        options={{ title: 'إعدادات الإشعارات', headerShown: true }}
                      />
                      <Stack.Screen
                        name="Marketplace"
                        component={MarketplaceScreen}
                        options={{ title: 'Marketplace', headerShown: true }}
                      />
                      <Stack.Screen
                        name="AddProduct"
                        component={AddProduct}
                        options={{ title: 'Add Product', headerShown: true }}
                      />
                      <Stack.Screen
                        name="EditCompanyProfile"
                        component={EditCompanyProfile}
                        options={{
                          headerShown: false,
                          presentation: 'card',
                        }}
                      />
                    </Stack.Navigator>
                  </FertilizerProvider>
                </HarvestProvider>
              </FeedProvider>
            </SeedProvider>
          </EquipmentProvider>
        </ToolProvider>
      </PesticideProvider>
    </AnimalProvider>
  );
};

const AddStockScreenContainer = () => {
  const { addStock, loading, error, refreshStocks } = useStock();
  const navigation = useNavigation<NavigationProp<StockStackParamList>>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: StockFormValues) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      await addStock({
        ...values,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiryDate: values.expiryDate?.toISOString(),
      });
      await refreshStocks();
      navigation.navigate('StockList');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigation.navigate('StockList');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <StockForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      error={submitError}
      isSubmitting={submitting}
    />
  );
};
