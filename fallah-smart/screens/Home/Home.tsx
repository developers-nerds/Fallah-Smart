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
};

// Update the timeIcon use to prevent undefined errors
// Update the getTimeBasedWeatherIcon function to ensure text is never undefined
const getTimeBasedWeatherIcon = () => {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 18) {
    return {
      icon: 'weather-sunny',
      color: '#FDB813',
      backgroundColor: 'rgba(255, 255, 255, 0.15)', // More transparent
      text: 'Day',
      textColor: '#FFFFFF', // White text for better contrast
      backgroundImage: require('../../assets/images/weather/sun.png'),
    };
  } else {
    return {
      icon: 'weather-night',
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
  const [weather, setWeather] = useState(null);
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

  // Update the dynamic weather card style to be taller when expanded to fit 5 days
  const weatherCardStyle = useMemo(
    () => ({
      ...styles.weatherCard,
      height: showForecast ? 350 : 160, // Increased from 320 to 350 to better fit 5 days
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

  // Add special handling for full width as the main issue
  const forecastContainerStyle = useMemo(
    () => ({
      ...styles.forecastContainer,
      width: '100%',
    }),
    []
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.neutral.surface} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ direction: 'rtl' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
          />
        }>
        {/* Weather Card */}
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
                          {weather.forecast.forecastday.map((day, index) => (
                            day ? renderForecastDay(day, index) : null
                          ))}
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* Heal your crop section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{arabicTranslations.healCrop.title}</Text>
          <View style={styles.healCropCard}>
            <View style={styles.healCropSteps}>
              {healCropSteps.map((step, index) => (
                <React.Fragment key={index}>
                  <View style={styles.stepItem}>
                    <View style={styles.stepIconContainer}>
                      {step.icon}
                    </View>
                    <Text style={styles.stepText}>{step.text}</Text>
                  </View>
                  
                  {index < healCropSteps.length - 1 && (
                    <MaterialIcons
                      name="chevron-left" // Change to left for RTL
                      size={24}
                      color={theme.colors.neutral.gray.base}
                      style={styles.stepArrow}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>

            <TouchableOpacity style={styles.takePictureButton} onPress={goToPlantDoctor}>
              <Text style={styles.takePictureButtonText}>{arabicTranslations.healCrop.button}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feature Cards */}
        <View style={styles.sectionContainer}>
          <View style={styles.featuresGrid}>
            <TouchableOpacity style={styles.featureCard} onPress={goToFertilizerCalculator}>
              <View style={styles.featureIconContainer}>
                <FontAwesome5 name="calculator" size={20} color={theme.colors.primary.base} />
              </View>
              <Text style={styles.featureTitle}>{arabicTranslations.features.fertilizerCalculator}</Text>
              <MaterialIcons
                name="chevron-left"
                size={20}
                color={theme.colors.neutral.gray.base}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={goToPestsAndDiseases}>
              <View style={styles.featureIconContainer}>
                <MaterialCommunityIcons
                  name="bug-outline"
                  size={20}
                  color={theme.colors.primary.base}
                />
              </View>
              <Text style={styles.featureTitle}>{arabicTranslations.features.pestsAndDiseases}</Text>
              <MaterialIcons
                name="chevron-left"
                size={20}
                color={theme.colors.neutral.gray.base}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={goToCultivationTips}>
              <View style={styles.featureIconContainer}>
                <MaterialCommunityIcons name="sprout" size={20} color={theme.colors.primary.base} />
              </View>
              <Text style={styles.featureTitle}>{arabicTranslations.features.cultivationTips}</Text>
              <MaterialIcons
                name="chevron-left"
                size={20}
                color={theme.colors.neutral.gray.base}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={goToPestAlert}>
              <View style={styles.featureIconContainer}>
                <MaterialIcons name="warning" size={20} color={theme.colors.primary.base} />
              </View>
              <Text style={styles.featureTitle}>{arabicTranslations.features.pestAlert}</Text>
              <MaterialIcons
                name="chevron-left"
                size={20}
                color={theme.colors.neutral.gray.base}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan History Section */}
        <ScanHistory refreshTrigger={scanHistoryRefreshTrigger} />
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
  weatherSection: {
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  weatherCard: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  weatherCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 1, // Full opacity for the image
  },
  weatherCardOverlay: {
    padding: 14,
    flex: 1,
    borderRadius: 16,
    background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)',
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  weatherInfo: {
    flex: 1,
  },
  timeIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  weatherTime: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'right',
  },
  weatherDate: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    marginBottom: 6,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'right',
  },
  weatherCondition: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    opacity: 0.9,
    textAlign: 'right',
  },
  weatherTemp: {
    fontSize: 28,
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
    padding: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  locationText: {
    marginLeft: 4,
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'right',
  },
  okButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  okButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
  },
  errorText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.error,
    textAlign: 'center',
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 12,
    textAlign: 'right',
  },
  healCropCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  healCropSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepItem: {
    alignItems: 'center',
    width: 80,
  },
  stepIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.colors.primary.light,
    backgroundColor: theme.colors.neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  stepArrow: {
    marginTop: -20,
  },
  takePictureButton: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  takePictureButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: 16,
    fontFamily: theme.fonts.bold,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 16,
    width: '48%',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row-reverse', // Change to row-reverse for RTL
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.lightest || '#E6F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12, // Change from marginRight to marginLeft
    marginRight: 0,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  forecastContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  forecastTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'right',
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
    fontSize: 10,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  forecastIcon: {
    width: 30,
    height: 30,
    marginVertical: 2,
  },
  forecastTemp: {
    fontSize: 10,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
    marginVertical: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  forecastCondition: {
    fontSize: 8,
    fontFamily: theme.fonts.regular,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    height: 20,
  },
});

export default HomeScreen;
