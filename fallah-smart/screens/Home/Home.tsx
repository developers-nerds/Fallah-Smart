import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialIcons, FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import { theme } from '../../theme/theme';
import SideBar from '../../navigation/sideBar';
import ScanScreen from '../scan/scan';
import StockScreen from '../Stock/stock';
import WalletScreen from '../Wallet/Wallet';
import DictionaryScreen from '../dictionary/dictionary';
import ChatScreen from '../Chat/Chat';
import { DictionaryNavigator } from '../../navigation/DictionaryNavigator';
import Marketplace from '../Marketplace/marketplace';
import ScanHistory from '../scan/components/ScanHistory';
import ScanDetailsScreen from '../scan/components/ScanDetailsScreen';
import ScanHistoryScreen from '../scan/components/ScanHistoryScreen';
import WeatherScreen from '../weather/WeatherScreen';
import { DrawerNavigationProp } from '@react-navigation/drawer';

const Drawer = createDrawerNavigator();

// Update to use Expo's environment variables
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY 
const WEATHER_API_URL = process.env.EXPO_PUBLIC_WEATHER_API_URL 

// Add Arabic translations at the top of the file
const arabicTranslations = {
  today: 'اليوم',
  home: 'الرئيسية',
  chat: 'المحادثة',
  scan: 'فحص',
  stock: 'المخزون',
  wallet: 'المحفظة',
  dictionary: 'القاموس الزراعي',
  marketplace: 'السوق',
  scanDetails: 'تفاصيل الفحص',
  scanHistory: 'سجل الفحص',
  weather: {
    day: 'نهار',
    night: 'ليل',
    feelsLike: 'الشعور كأنه',
    forecast: 'توقعات الطقس لـ 5 أيام',
    activateGPS: 'يرجى تفعيل نظام تحديد المواقع لتلقي معلومات الطقس',
    screen: 'الطقس والزراعة',
  },
  healCrop: {
    title: 'عالج محصولك',
    takePicture: 'التقط صورة',
    seeDiagnosis: 'مشاهدة التشخيص',
    getMedicine: 'الحصول على الدواء',
    button: 'التقط صورة',
  },
  features: {
    fertilizerCalculator: 'حاسبة الأسمدة',
    pestsAndDiseases: 'الآفات والأمراض',
    cultivationTips: 'نصائح الزراعة',
    pestAlert: 'تنبيهات الآفات والأمراض',
  },
  comingSoon: 'قريباً!',
  failedToLoad: 'فشل تحميل بيانات الطقس',
  // Add day names in Arabic
  days: {
    Sun: 'الأحد',
    Mon: 'الإثنين',
    Tue: 'الثلاثاء',
    Wed: 'الأربعاء',
    Thu: 'الخميس',
    Fri: 'الجمعة',
    Sat: 'السبت',
  },
  allFeatures: {
    title: 'جميع الخدمات',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    notifications: 'الإشعارات',
    education: 'التعليم',
    blogs: 'المدونات',
    advisorEducation: 'تعليم المستشار',
    advisorApplication: 'طلب استشارة',
    form: 'النماذج',
    stockManagement: 'إدارة المخزون',
    walletFinance: 'المحفظة والمالية',
    weatherInfo: 'معلومات الطقس',
    marketplace: 'السوق',
    scanPlant: 'فحص النبات',
    dictionaryResource: 'القاموس والموارد',
    chatSupport: 'الدردشة والدعم',
  },
};

// Update the timeIcon use to prevent undefined errors
// Update the getTimeBasedWeatherIcon function to ensure text is never undefined
const getTimeBasedWeatherIcon = () => {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 18) {
    return {
      icon: 'weather-sunny' as const,
      color: '#FDB813',
      backgroundColor: 'rgba(255, 255, 255, 0.15)', // More transparent
      text: 'Day',
      textColor: '#FFFFFF', // White text for better contrast
      backgroundImage: require('../../assets/images/weather/sun.png'),
    };
  } else {
    return {
      icon: 'weather-night' as const,
      color: '#FFFFFF', // White icon for night
      backgroundColor: 'rgba(0, 0, 0, 0.2)', // Darker, more transparent overlay
      text: 'Night',
      textColor: '#FFFFFF',
      backgroundImage: require('../../assets/images/weather/moon.png'),
    };
  }
};

// Add proper type definition for the forecast day data
interface ForecastDay {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    condition?: {
      text?: string;
      icon?: string;
    };
  };
}

interface HomeContentProps {
  navigation: DrawerNavigationProp<any>;
  route: {
    params?: {
      refreshScanHistory?: boolean;
    };
  };
}

export const HomeContent = ({ navigation, route }: HomeContentProps) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeIcon, setTimeIcon] = useState(getTimeBasedWeatherIcon());
  const [showForecast, setShowForecast] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scanHistoryRefreshTrigger, setScanHistoryRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchWeatherData();

    // Update time icon every minute
    const interval = setInterval(() => {
      setTimeIcon(getTimeBasedWeatherIcon());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Handle scan history refresh
  useEffect(() => {
    if (route?.params?.refreshScanHistory) {
      // Only refresh the scan history by updating the trigger
      setScanHistoryRefreshTrigger((prev) => prev + 1);
      // Reset the param to avoid multiple refreshes
      navigation.setParams({ refreshScanHistory: undefined });
    }
  }, [route?.params?.refreshScanHistory]);

  // Handle full refresh
  const onRefresh = () => {
    setRefreshing(true);
    setScanHistoryRefreshTrigger((prev) => prev + 1);
    fetchWeatherData();
  };

  // Fetch weather data from API
  const fetchWeatherData = async () => {
    try {
      setLoading(true);

      // Try to get user's location for more accurate weather
      let locationQuery = 'Tunisia'; // Default to Tunisia

      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          locationQuery = `${location.coords.latitude},${location.coords.longitude}`;
        }
      } catch (locationError) {
        console.log('Location permission not granted, using default location');
      }

      console.log('Weather API URL:', WEATHER_API_URL);
      console.log('Weather API Key:', WEATHER_API_KEY.substring(0, 5) + '...');
      console.log('Location query:', locationQuery);

      // Fetch weather data with better error handling
      try {
        // Create the request config
        const requestConfig = {
          params: {
            key: WEATHER_API_KEY,
            q: locationQuery,
            days: 5,
            aqi: 'no',
          },
          timeout: 15000,
        };
        
        console.log('Weather API request config:', JSON.stringify(requestConfig));
        
        const response = await axios.get(WEATHER_API_URL, requestConfig);

        // Log response status
        console.log('Weather API response status:', response.status);
        
        // Check if response data exists before setting state
        if (response && response.data) {
          // Add detailed logging about the forecast days
          console.log('Full forecast days:', 
            JSON.stringify(response.data.forecast?.forecastday?.map(day => ({
              date: day.date,
              day_name: new Date(day.date).toLocaleDateString('en-US', {weekday: 'short'})
            })))
          );
          
          setWeather(response.data);
          setError(null);
        } else {
          console.error('No valid data in response');
          throw new Error('No data received from weather API');
        }
      } catch (apiError: any) {
        console.error('API request error details:', apiError);
        if (apiError.response) {
          console.error('API error response:', apiError.response.status, apiError.response.data);
        }
        if (apiError.request) {
          console.error('API error request:', apiError.request._url);
        }
        console.error('API request error:', apiError.message);
        throw new Error(`API request failed: ${apiError.message}`);
      }
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(arabicTranslations.failedToLoad);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format date to display as "Today, 3 Mar"
  const formatDate = () => {
    const arabicMonths = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ];
    const now = new Date();
    const date = now.getDate();
    const month = arabicMonths[now.getMonth()];

    return `${arabicTranslations.today}، ${date} ${month}`;
  };

  // Navigation functions
  const goToPlantDoctor = () => {
    navigation.navigate('Scan');
  };

  const goToFertilizerCalculator = () => {
    Alert.alert('حاسبة الأسمدة', arabicTranslations.comingSoon);
  };

  const goToPestsAndDiseases = () => {
    Alert.alert('الآفات والأمراض', arabicTranslations.comingSoon);
  };

  const goToCultivationTips = () => {
    Alert.alert('نصائح الزراعة', arabicTranslations.comingSoon);
  };

  const goToPestAlert = () => {
    Alert.alert('تنبيهات الآفات والأمراض', arabicTranslations.comingSoon);
  };

  const toggleForecast = () => {
    setShowForecast((prevState) => !prevState);
  };

  // Update the renderForecastDay function with proper types
  const renderForecastDay = (day: ForecastDay, index: number) => {
    // Add a safety check
    if (!day || !day.date || !day.day) {
      return null;
    }

    const date = new Date(day.date);
    const englishDayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    // Map to Arabic day name
    const dayName = arabicTranslations.days[englishDayName] || englishDayName;
    
    // Log each rendered day to debug which days are being shown
    console.log(`Rendering forecast day ${index}: ${day.date} (${dayName})`);

    return (
      <View key={index} style={styles.forecastDay}>
        <Text style={styles.forecastDayName}>{dayName}</Text>
        <Image 
          source={{ uri: day.day.condition?.icon ? `https:${day.day.condition.icon}` : undefined }} 
          style={styles.forecastIcon} 
          defaultSource={require('../../assets/images/weather/sun.png')}
        />
        <Text style={styles.forecastTemp}>
          {Math.round(day.day.maxtemp_c || 0)}°/{Math.round(day.day.mintemp_c || 0)}°
        </Text>
        <Text style={styles.forecastCondition}>{day.day.condition?.text || ''}</Text>
      </View>
    );
  };

  // Add categories for the features display
  const featureCategories = [
    {
      title: 'الخدمات الرئيسية',
      items: [
        {
          name: arabicTranslations.allFeatures.profile,
          icon: <MaterialIcons name="person" size={24} color={theme.colors.primary.base} />,
          onPress: () => navigation.navigate('Profile')
        },
        {
          name: arabicTranslations.allFeatures.walletFinance,
          icon: <MaterialIcons name="account-balance-wallet" size={24} color={theme.colors.primary.base} />,
          onPress: () => navigation.navigate('Wallet')
        },
        {
          name: arabicTranslations.allFeatures.stockManagement,
          icon: <MaterialIcons name="inventory" size={24} color={theme.colors.primary.base} />,
          onPress: () => navigation.navigate('Stock')
        },
        {
          name: arabicTranslations.allFeatures.marketplace,
          icon: <MaterialIcons name="storefront" size={24} color={theme.colors.primary.base} />,
          onPress: () => navigation.navigate('Marketplace')
        }
      ]
    },
    {
      title: 'المعلومات والتواصل',
      items: [
        {
          name: arabicTranslations.allFeatures.education,
          icon: <MaterialIcons name="school" size={24} color={theme.colors.primary.base} />,
          onPress: () => navigation.navigate('Education')
        },
        {
          name: arabicTranslations.allFeatures.blogs,
          icon: <FontAwesome5 name="blog" size={24} color={theme.colors.primary.base} />,
          onPress: () => navigation.navigate('Blogs')
        },
        {
          name: arabicTranslations.allFeatures.chatSupport,
          icon: <MaterialIcons name="chat" size={24} color={theme.colors.primary.base} />,
          onPress: () => navigation.navigate('Chat')
        },
        {
          name: arabicTranslations.allFeatures.dictionaryResource,
          icon: <MaterialIcons name="menu-book" size={24} color={theme.colors.primary.base} />,
          onPress: () => navigation.navigate('Dictionary')
        }
      ]
    },
    {
      title: 'الأدوات والخدمات',
      items: [
        {
          name: arabicTranslations.allFeatures.scanPlant,
          icon: <MaterialIcons name="document-scanner" size={24} color={theme.colors.primary.base} />,
          onPress: () => navigation.navigate('Scan')
        },
        {
          name: arabicTranslations.allFeatures.weatherInfo,
          icon: <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color={theme.colors.primary.base} />,
          onPress: () => navigation.navigate('Weather')
        }
      ]
    }
  ];

  // Update the forecastContainerStyle
  const forecastContainerStyle = useMemo(
    () => ({
      ...styles.forecastContainer,
      width: '100%' as const, // Fixed type error by adding 'as const'
    }),
    []
  );

  // Update the weather card style for a more modern look
  const weatherCardStyle = useMemo(
    () => ({
      ...styles.weatherCard,
      height: showForecast ? 350 : 180, // Increased height for better spacing
    }),
    [showForecast]
  );

  const refreshScanHistory = () => {
    console.log('Refreshing scan history');
    setScanHistoryRefreshTrigger((prev) => prev + 1);
  };

  // Update the healCropSteps to display in reverse order for RTL
  const healCropSteps = [
    {
      icon: <MaterialIcons name="medical-services" size={24} color={theme.colors.primary.base} />,
      text: arabicTranslations.healCrop.getMedicine
    },
    {
      icon: <Feather name="file-text" size={24} color={theme.colors.primary.base} />,
      text: arabicTranslations.healCrop.seeDiagnosis
    },
    {
      icon: <FontAwesome5 name="leaf" size={24} color={theme.colors.primary.base} />,
      text: arabicTranslations.healCrop.takePicture
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.neutral.surface} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ direction: 'rtl', paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
          />
        }>
        {/* User greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>مرحباً بك</Text>
          <Text style={styles.dateText}>{formatDate()}</Text>
        </View>

        {/* Enhanced Weather Card */}
        <View style={styles.weatherSection}>
          <TouchableOpacity activeOpacity={0.9} onPress={toggleForecast}>
            <ImageBackground
              source={timeIcon.backgroundImage}
              style={weatherCardStyle}
              imageStyle={styles.weatherCardImage}
              resizeMode="cover">
              <View
                style={[styles.weatherCardOverlay, { backgroundColor: timeIcon.backgroundColor }]}>
                {loading ? (
                  <ActivityIndicator size="large" color={theme.colors.primary.base} />
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : (
                  <>
                    <View style={styles.weatherHeader}>
                      <View style={styles.weatherInfo}>
                        <View style={styles.timeIconContainer}>
                          <MaterialCommunityIcons
                            name={timeIcon?.icon || 'weather-sunny'}
                            size={24}
                            color={timeIcon?.color || '#FDB813'}
                          />
                          <Text style={[styles.weatherTime, { color: timeIcon?.textColor || '#FFFFFF' }]}>
                            {timeIcon?.text === 'Day' ? arabicTranslations.weather.day : arabicTranslations.weather.night}
                          </Text>
                        </View>
                        <Text style={[styles.weatherDate, { color: timeIcon?.textColor || '#FFFFFF' }]}>
                          {formatDate()}
                        </Text>
                        <Text style={[styles.weatherCondition, { color: timeIcon?.textColor || '#FFFFFF' }]}>
                          {(weather?.current?.condition?.text || 'صافي')} •{' '}
                          {Math.round(weather?.current?.temp_c || 24)}°C /{' '}
                          {Math.round(weather?.forecast?.forecastday?.[0]?.day?.mintemp_c || 20)}°C
                        </Text>
                      </View>
                      <Text style={[styles.weatherTemp, { color: timeIcon?.textColor || '#FFFFFF' }]}>
                        {Math.round(weather?.current?.temp_c || 24)}°C
                      </Text>
                    </View>
                    <View style={styles.locationInfo}>
                      <MaterialIcons name="location-on" size={14} color="#FFFFFF" />
                      <Text style={[styles.locationText, { color: timeIcon?.textColor || '#FFFFFF' }]}>
                        {weather?.location?.name
                          ? `${weather.location.name}، ${weather.location.country || ''}`
                          : arabicTranslations.weather.activateGPS}
                      </Text>
                    </View>

                    {/* Show forecast when expanded */}
                    {showForecast && weather?.forecast?.forecastday && Array.isArray(weather.forecast.forecastday) && weather.forecast.forecastday.length > 0 && (
                      <View style={forecastContainerStyle}>
                        <Text style={styles.forecastTitle}>{arabicTranslations.weather.forecast}</Text>
                        <View style={styles.forecastDaysContainer}>
                          {weather.forecast.forecastday.map((day: any, index: number) => (
                            day ? renderForecastDay(day, index) : null
                          ))}
                        </View>
                      </View>
                    )}
                    
                    {/* Show expand/collapse indicator */}
                    <View style={styles.expandIndicator}>
                      <MaterialIcons 
                        name={showForecast ? "expand-less" : "expand-more"} 
                        size={24} 
                        color="rgba(255,255,255,0.7)" 
                      />
                    </View>
                  </>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* Improved All Features Section */}
        <View style={styles.allFeaturesContainer}>
          <Text style={styles.sectionTitle}>{arabicTranslations.allFeatures.title}</Text>
          
          {featureCategories.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <View style={styles.featuresGrid}>
                {category.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    style={styles.enhancedFeatureCard}
                    onPress={item.onPress}
                  >
                    <View style={styles.enhancedIconContainer}>
                      {item.icon}
                    </View>
                    <Text style={styles.enhancedFeatureTitle}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Scan History Section with improved styling */}
        <View style={styles.scanHistoryContainer}>
          <ScanHistory refreshTrigger={scanHistoryRefreshTrigger} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const HomeScreen = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <SideBar {...props} />}
      screenOptions={{ headerShown: true }}>
      <Drawer.Screen name="HomeContent" component={HomeContent} options={{ title: arabicTranslations.home }} />
      <Drawer.Screen name="Chat" component={ChatScreen} options={{ title: arabicTranslations.chat }} />
      <Drawer.Screen name="Scan" component={ScanScreen} options={{ title: arabicTranslations.scan }} />
      <Drawer.Screen name="Stock" component={StockScreen} options={{ title: arabicTranslations.stock }} />
      <Drawer.Screen name="Wallet" component={WalletScreen} options={{ title: arabicTranslations.wallet }} />
      <Drawer.Screen
        name="Weather"
        component={WeatherScreen}
        options={{ 
          title: arabicTranslations.weather.screen,
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons name="weather-partly-cloudy" size={22} color={color} />
          )
        }} 
      />
      <Drawer.Screen
        name="Dictionary"
        component={DictionaryNavigator}
        options={{ title: arabicTranslations.dictionary }}
      />
      <Drawer.Screen name="Marketplace" component={Marketplace} options={{ title: arabicTranslations.marketplace }} />
      <Drawer.Screen
        name="ScanDetailsScreen"
        component={ScanDetailsScreen}
        options={{
          title: arabicTranslations.scanDetails,
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="ScanHistoryScreen"
        component={ScanHistoryScreen}
        options={{
          title: arabicTranslations.scanHistory,
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  greetingSection: {
    marginVertical: 8,
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 22,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginBottom: 4,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
  },
  weatherSection: {
    marginVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  weatherCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
  },
  weatherCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 1,
  },
  weatherCardOverlay: {
    padding: 16,
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)', // Use backgroundColor instead of background
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherInfo: {
    flex: 1,
    alignItems: 'center',
  },
  timeIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 6,
    borderRadius: 12,
    alignSelf: 'center',
  },
  weatherTime: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
  weatherDate: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    marginBottom: 6,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
  weatherCondition: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    opacity: 0.9,
    textAlign: 'center',
  },
  weatherTemp: {
    fontSize: 36, // Increased for better visibility
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 8,
    borderRadius: 12,
    alignSelf: 'center',
  },
  locationText: {
    marginLeft: 4,
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
  expandIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    left: 0,
    alignItems: 'center',
  },
  forecastContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  forecastTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  forecastDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'nowrap',
  },
  forecastDay: {
    alignItems: 'center',
    width: '18%',
    marginHorizontal: 1,
  },
  forecastDayName: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  forecastIcon: {
    width: 36,
    height: 36,
    marginVertical: 4,
  },
  forecastTemp: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
    marginVertical: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  forecastCondition: {
    fontSize: 9,
    fontFamily: theme.fonts.regular,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    height: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.error,
    textAlign: 'center',
    padding: 16,
  },
  allFeaturesContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  enhancedFeatureCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 16,
    width: '48%',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
  },
  enhancedIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F7FF', // Use direct color to avoid errors
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  enhancedFeatureTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  scanHistoryContainer: {
    marginTop: 10,
  },
});

export default HomeScreen;
