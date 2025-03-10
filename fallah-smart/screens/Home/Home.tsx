import React, { useState, useEffect } from 'react';
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

const Drawer = createDrawerNavigator();

// Weather API key and base URL
const WEATHER_API_KEY = WEATHER_CONFIG.API_KEY;
const WEATHER_API_URL = WEATHER_CONFIG.API_URL;

export const HomeContent = ({ navigation }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.neutral.surface} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Weather Card */}
        <View style={styles.weatherSection}>
          <View style={styles.weatherCard}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary.base} />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <>
                <View style={styles.weatherHeader}>
                  <View>
                    <Text style={styles.weatherDate}>{formatDate()}</Text>
                    <Text style={styles.weatherCondition}>
                      {weather?.current?.condition?.text || 'Clear'} •{' '}
                      {Math.round(weather?.current?.temp_c || 24)}°C /{' '}
                      {Math.round(weather?.forecast?.forecastday?.[0]?.day?.mintemp_c || 20)}°C
                    </Text>
                  </View>
                  <Text style={styles.weatherTemp}>
                    {Math.round(weather?.current?.temp_c || 24)}°C
                  </Text>
                </View>
                <View style={styles.locationInfo}>
                  <MaterialIcons name="location-on" size={18} color={theme.colors.primary.base} />
                  <Text style={styles.locationText}>
                    {weather?.location?.name
                      ? `${weather.location.name}, ${weather.location.country}`
                      : 'Please activate your GPS to receive weather information'}
                  </Text>
                </View>
              </>
            )}
          </View>
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
    marginVertical: 16,
  },
  weatherCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  weatherDate: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: 4,
  },
  weatherCondition: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  weatherTemp: {
    fontSize: 24,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
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
});

export default HomeScreen;
