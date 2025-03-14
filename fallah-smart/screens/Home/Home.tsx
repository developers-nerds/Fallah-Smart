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
import { WEATHER_CONFIG } from '../../api/apiConfig';
import ScanHistory from '../scan/components/ScanHistory';
import ScanDetailsScreen from '../scan/components/ScanDetailsScreen';
import ScanHistoryScreen from '../scan/components/ScanHistoryScreen';
import { DrawerNavigationProp } from '@react-navigation/drawer';

const Drawer = createDrawerNavigator();

// Update the weather API configuration
const WEATHER_API_KEY = WEATHER_CONFIG.API_KEY;
const WEATHER_API_URL = WEATHER_CONFIG.API_URL;

// Add this helper function at the top of the file
const getTimeBasedWeatherIcon = () => {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 18) {
    return {
      icon: 'weather-sunny',
      color: '#FDB813',
      backgroundColor: 'rgba(255, 255, 255, 0.15)', // More transparent
      text: 'Day',
      textColor: '#FFFFFF', // White text for better contrast
      backgroundImage: require('../../assets/images/weather/sun.png')
    };
  } else {
    return {
      icon: 'weather-night',
      color: '#FFFFFF', // White icon for night
      backgroundColor: 'rgba(0, 0, 0, 0.2)', // Darker, more transparent overlay
      text: 'Night',
      textColor: '#FFFFFF',
      backgroundImage: require('../../assets/images/weather/moon.png')
    };
  }
};



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

      // Fetch weather data
      const response = await axios.get(WEATHER_API_URL, {
        params: {
          key: WEATHER_API_KEY,
          q: locationQuery,
          days: 7,
          aqi: 'no',
        },
      });

      setWeather(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format date to display as "Today, 3 Mar"
  const formatDate = () => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const now = new Date();
    const date = now.getDate();
    const month = months[now.getMonth()];

    return `Today, ${date} ${month}`;
  };

  // Navigation functions
  const goToPlantDoctor = () => {
    navigation.navigate('Scan');
  };

  const goToFertilizerCalculator = () => {
    // Navigate to fertilizer calculator screen
    Alert.alert('Fertilizer Calculator', 'This feature is coming soon!');
  };

  const goToPestsAndDiseases = () => {
    // Navigate to pests and diseases screen
    Alert.alert('Pests & Diseases', 'This feature is coming soon!');
  };

  const goToCultivationTips = () => {
    // Navigate to cultivation tips screen
    Alert.alert('Cultivation Tips', 'This feature is coming soon!');
  };

  const goToPestAlert = () => {
    // Navigate to pest alert screen
    Alert.alert('Pest Alerts', 'This feature is coming soon!');
  };

  const toggleForecast = () => {
    setShowForecast(prevState => !prevState);
  };

  const renderForecastDay = (day, index) => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    return (
      <View key={index} style={styles.forecastDay}>
        <Text style={styles.forecastDayName}>{dayName}</Text>
        <Image 
          source={{ uri: `https:${day.day.condition.icon}` }} 
          style={styles.forecastIcon} 
        />
        <Text style={styles.forecastTemp}>
          {Math.round(day.day.maxtemp_c)}°/{Math.round(day.day.mintemp_c)}°
        </Text>
        <Text style={styles.forecastCondition}>{day.day.condition.text}</Text>
      </View>
    );
  };

  // Add this dynamic style that uses the state variable
  const weatherCardStyle = useMemo(() => ({
    ...styles.weatherCard,
    height: showForecast ? 320 : 160
  }), [showForecast]);
  
  const refreshScanHistory = () => {
    console.log('Refreshing scan history');
    setScanHistoryRefreshTrigger(prev => prev + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.neutral.surface} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
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
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={toggleForecast}
          >
            <ImageBackground
              source={timeIcon.backgroundImage}
              style={weatherCardStyle}
              imageStyle={styles.weatherCardImage}
              resizeMode="cover"
            >
              <View style={[styles.weatherCardOverlay, { backgroundColor: timeIcon.backgroundColor }]}>
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
                            name={timeIcon.icon} 
                            size={24} 
                            color={timeIcon.color}
                          />
                          <Text style={[styles.weatherTime, { color: timeIcon.textColor }]}>
                            {timeIcon.text}
                          </Text>
                        </View>
                        <Text style={[styles.weatherDate, { color: timeIcon.textColor }]}>
                          {formatDate()}
                        </Text>
                        <Text style={[styles.weatherCondition, { color: timeIcon.textColor }]}>
                          {weather?.current?.condition?.text || 'Clear'} • {Math.round(weather?.current?.temp_c || 24)}°C / {Math.round(weather?.forecast?.forecastday?.[0]?.day?.mintemp_c || 20)}°C
                        </Text>
                      </View>
                      <Text style={[styles.weatherTemp, { color: timeIcon.textColor }]}>
                        {Math.round(weather?.current?.temp_c || 24)}°C
                      </Text>
                    </View>
                    <View style={styles.locationInfo}>
                      <MaterialIcons 
                        name="location-on" 
                        size={14} 
                        color="#FFFFFF"
                      />
                      <Text style={[styles.locationText, { color: timeIcon.textColor }]}>
                        {weather?.location?.name 
                          ? `${weather.location.name}, ${weather.location.country}` 
                          : 'Please activate your GPS to receive weather information'}
                      </Text>
                    </View>

                    {/* Show forecast when expanded */}
                    {showForecast && weather?.forecast?.forecastday && (
                      <View style={styles.forecastContainer}>
                        <Text style={styles.forecastTitle}>5-Day Forecast</Text>
                        <View style={styles.forecastDaysContainer}>
                          {weather.forecast.forecastday.slice(0, 5).map((day, index) => 
                            renderForecastDay(day, index)
                          )}
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
          <Text style={styles.sectionTitle}>Heal your crop</Text>
          <View style={styles.healCropCard}>
            <View style={styles.healCropSteps}>
              <View style={styles.stepItem}>
                <View style={styles.stepIconContainer}>
                  <FontAwesome5 name="leaf" size={24} color={theme.colors.primary.base} />
                </View>
                <Text style={styles.stepText}>Take a picture</Text>
              </View>

              <MaterialIcons
                name="chevron-right"
                size={24}
                color={theme.colors.neutral.gray.base}
                style={styles.stepArrow}
              />

              <View style={styles.stepItem}>
                <View style={styles.stepIconContainer}>
                  <Feather name="file-text" size={24} color={theme.colors.primary.base} />
                </View>
                <Text style={styles.stepText}>See diagnosis</Text>
              </View>

              <MaterialIcons
                name="chevron-right"
                size={24}
                color={theme.colors.neutral.gray.base}
                style={styles.stepArrow}
              />

              <View style={styles.stepItem}>
                <View style={styles.stepIconContainer}>
                  <MaterialIcons
                    name="medical-services"
                    size={24}
                    color={theme.colors.primary.base}
                  />
                </View>
                <Text style={styles.stepText}>Get medicine</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.takePictureButton} onPress={goToPlantDoctor}>
              <Text style={styles.takePictureButtonText}>Take a picture</Text>
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
              <Text style={styles.featureTitle}>Fertilizer calculator</Text>
              <MaterialIcons
                name="chevron-right"
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
              <Text style={styles.featureTitle}>Pests & diseases</Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={theme.colors.neutral.gray.base}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={goToCultivationTips}>
              <View style={styles.featureIconContainer}>
                <MaterialCommunityIcons name="sprout" size={20} color={theme.colors.primary.base} />
              </View>
              <Text style={styles.featureTitle}>Cultivation Tips</Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={theme.colors.neutral.gray.base}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={goToPestAlert}>
              <View style={styles.featureIconContainer}>
                <MaterialIcons name="warning" size={20} color={theme.colors.primary.base} />
              </View>
              <Text style={styles.featureTitle}>Pests and Disease Alert</Text>
              <MaterialIcons
                name="chevron-right"
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
      <Drawer.Screen name="HomeContent" component={HomeContent} options={{ title: 'Home' }} />
      <Drawer.Screen name="Chat" component={ChatScreen} />
      <Drawer.Screen name="Scan" component={ScanScreen} />
      <Drawer.Screen name="Stock" component={StockScreen} />
      <Drawer.Screen name="Wallet" component={WalletScreen} />
      <Drawer.Screen
        name="Dictionary"
        component={DictionaryNavigator}
        options={{ title: 'القاموس الزراعي' }}
      />
      <Drawer.Screen name="Marketplace" component={Marketplace} />
      <Drawer.Screen
        name="ScanDetailsScreen"
        component={ScanDetailsScreen}
        options={{
          title: 'Scan Details',
          drawerItemStyle: { display: 'none' }, // Hide from drawer menu
        }}
      />
      <Drawer.Screen
        name="ScanHistoryScreen"
        component={ScanHistoryScreen}
        options={{
          title: 'Scan History',
          drawerItemStyle: { display: 'none' }, // Hide from drawer menu
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
  },
  weatherDate: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    marginBottom: 6,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  weatherCondition: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    opacity: 0.9,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.lightest || '#E6F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    flex: 1,
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
  },
  forecastDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastDay: {
    alignItems: 'center',
    width: '18%', // 5 days with some spacing
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
    fontSize: 10,
    fontFamily: theme.fonts.regular,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default HomeScreen;