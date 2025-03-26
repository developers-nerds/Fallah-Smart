import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import { useIsFocused } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { theme } from '../../theme/theme';

// Import weather components
import WeatherAlerts from '../../components/weather/WeatherAlerts';
import PlantingCalendar from '../../components/weather/PlantingCalendar';
import FarmingRecommendations from '../../components/weather/FarmingRecommendations';

// Create top tabs navigator
const Tab = createMaterialTopTabNavigator();

// Update to use Expo's environment variables
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || '49b04b19a3614a6f86b503950631e71c';
const WEATHER_API_URL = process.env.EXPO_PUBLIC_WEATHER_API_URL || 'https://api.weatherapi.com/v1/forecast.json';

// Weather data interfaces
export interface WeatherCondition {
  text: string;
  code: number;
  icon: string;
}

export interface CurrentWeather {
  temp_c: number;
  feelslike_c: number;
  humidity: number;
  wind_kph: number;
  condition: WeatherCondition;
  uv: number;
  pressure_mb: number;
  precip_mm: number;
  cloud: number;
  is_day: number;
}

export interface WeatherDay {
  maxtemp_c: number;
  mintemp_c: number;
  avgtemp_c: number;
  daily_chance_of_rain: number;
  totalprecip_mm: number;
  condition: WeatherCondition;
  uv: number;
}

export interface ForecastDay {
  date: string;
  day: WeatherDay;
  hour: Array<{
    time: string;
    temp_c: number;
    condition: WeatherCondition;
    chance_of_rain: number;
  }>;
}

export interface WeatherLocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  localtime: string;
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: {
    forecastday: ForecastDay[];
  };
  location: WeatherLocation;
  alerts?: {
    alert: Array<{
      headline: string;
      severity: string;
      urgency: string;
      areas: string;
      category: string;
      desc: string;
      effective: string;
      expires: string;
    }>;
  };
}

export interface WeatherInsight {
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  icon: string;
  relevance: number; // 0-100 indicating how relevant this insight is
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
  timeFrame: string;
}

export interface FarmingRecommendation {
  category: 'planting' | 'harvesting' | 'irrigation' | 'protection' | 'soil' | 'equipment';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  benefitScore: number; // 0-100 indicating how beneficial this recommendation is
  icon: string;
}

// AI Insights generator
const generateWeatherInsights = (data: WeatherData): WeatherInsight[] => {
  const insights: WeatherInsight[] = [];
  const currentTemp = data.current.temp_c;
  const humidity = data.current.humidity;
  const windSpeed = data.current.wind_kph;
  const rainChance = Math.max(...data.forecast.forecastday.slice(0, 3).map(day => day.day.daily_chance_of_rain));
  const maxTemp = Math.max(...data.forecast.forecastday.slice(0, 3).map(day => day.day.maxtemp_c));
  const minTemp = Math.min(...data.forecast.forecastday.slice(0, 3).map(day => day.day.mintemp_c));
  const precip = data.current.precip_mm;

  // Extreme heat alert
  if (maxTemp > 35) {
    insights.push({
      type: 'critical',
      title: 'موجة حرارة قادمة',
      description: 'سيكون الطقس حاراً جداً خلال الأيام القادمة مما قد يؤثر سلباً على المحاصيل. قم بتوفير الظل والري الكافي.',
      icon: 'weather-sunny-alert',
      relevance: 95,
      severity: 'high',
      recommendation: 'ري المحاصيل في الصباح الباكر أو المساء لتقليل التبخر.',
      timeFrame: 'الأيام القادمة'
    });
  }

  // Frost alert for cold temperatures
  if (minTemp < 5) {
    insights.push({
      type: 'warning',
      title: 'خطر الصقيع',
      description: 'درجات حرارة منخفضة متوقعة قد تسبب صقيعاً. قم بحماية المحاصيل الحساسة.',
      icon: 'snowflake-alert',
      relevance: 90,
      severity: 'high',
      recommendation: 'استخدم الأغطية الواقية من الصقيع ليلاً وقم بإزالتها صباحاً.',
      timeFrame: 'الأيام القادمة'
    });
  }

  // Strong wind alert
  if (windSpeed > 30) {
    insights.push({
      type: 'warning',
      title: 'رياح قوية',
      description: 'رياح قوية متوقعة. أمّن المحاصيل والهياكل والمعدات المعرضة للضرر.',
      icon: 'weather-windy',
      relevance: 85,
      severity: 'high',
      recommendation: 'أمّن المحاصيل والهياكل والمعدات المعرضة للضرر.',
      timeFrame: 'الأيام القادمة'
    });
  }

  // Heavy rain alert
  if (rainChance > 70) {
    insights.push({
      type: 'warning',
      title: 'توقع هطول أمطار غزيرة',
      description: 'احتمالية عالية لهطول أمطار غزيرة. تأكد من تصريف المياه الجيد في الحقول.',
      icon: 'weather-pouring',
      relevance: 80,
      severity: 'high',
      recommendation: 'تأكد من تصريف المياه الجيد في الحقول.',
      timeFrame: 'الأيام القادمة'
    });
  }

  // Drought conditions
  if (rainChance < 10 && maxTemp > 30 && data.current.humidity < 40) {
    insights.push({
      type: 'warning',
      title: 'ظروف جفاف محتملة',
      description: 'طقس حار وجاف متوقع. زد من معدل الري واستخدم تقنيات توفير المياه.',
      icon: 'water-off',
      relevance: 75,
      severity: 'medium',
      recommendation: 'زد من معدل الري واستخدم تقنيات توفير المياه.',
      timeFrame: 'الأيام القادمة'
    });
  }

  // Optimal conditions for field work
  if (maxTemp > 15 && maxTemp < 30 && windSpeed < 20 && rainChance < 30) {
    insights.push({
      type: 'success',
      title: 'ظروف مثالية للعمل الميداني',
      description: 'طقس معتدل مع رياح خفيفة واحتمالية منخفضة للأمطار. وقت مثالي للعمل في الحقول.',
      icon: 'check-circle',
      relevance: 70,
      severity: 'low',
      recommendation: 'استغل الظروف الجيدة لزراعة المحاصيل الموسمية.',
      timeFrame: 'الأيام القادمة'
    });
  }

  // Optimal conditions for planting
  if (data.current.temp_c > 18 && data.current.temp_c < 28 && data.current.humidity > 50 && data.current.humidity < 80) {
    insights.push({
      type: 'success',
      title: 'ظروف مثالية للزراعة',
      description: 'درجة الحرارة والرطوبة في المستويات المثلى للزراعة. فرصة جيدة لزراعة محاصيل جديدة.',
      icon: 'seed',
      relevance: 65,
      severity: 'low',
      recommendation: 'استغل الظروف الجيدة لزراعة المحاصيل الموسمية.',
      timeFrame: 'الأيام القادمة'
    });
  }

  return insights.sort((a, b) => b.relevance - a.relevance);
};

// AI Recommendations generator
const generateFarmingRecommendations = (data: WeatherData): FarmingRecommendation[] => {
  const recommendations: FarmingRecommendation[] = [];
  const currentTemp = data.current.temp_c;
  const forecast = data.forecast.forecastday;
  
  // Irrigation recommendations
  if (currentTemp > 30) {
    recommendations.push({
      category: 'irrigation',
      title: 'زيادة معدل الري',
      description: 'نظراً لارتفاع درجات الحرارة، قم بزيادة معدل الري للمحاصيل.',
      priority: 'high',
      action: 'ري المحاصيل في الصباح الباكر أو المساء لتقليل التبخر.',
      benefitScore: 90,
      icon: 'water'
    });
  }
  
  if (forecast[0].day.daily_chance_of_rain > 70) {
    recommendations.push({
      category: 'irrigation',
      title: 'تقليل الري',
      description: 'احتمالية عالية لهطول الأمطار. يمكن تقليل معدل الري.',
      priority: 'medium',
      action: 'قم بتأجيل الري حتى بعد هطول الأمطار المتوقعة.',
      benefitScore: 75,
      icon: 'water-off'
    });
  }
  
  // Protection recommendations
  if (currentTemp > 35) {
    recommendations.push({
      category: 'protection',
      title: 'حماية المحاصيل من الحرارة',
      description: 'وفر الظل للمحاصيل الحساسة للحرارة باستخدام شباك التظليل.',
      priority: 'high',
      action: 'قم بتركيب شباك تظليل فوق المحاصيل الحساسة.',
      benefitScore: 85,
      icon: 'weather-sunny-off'
    });
  }
  
  const minTemp = Math.min(...forecast.slice(0, 3).map(f => f.day.mintemp_c));
  if (minTemp < 5) {
    recommendations.push({
      category: 'protection',
      title: 'حماية المحاصيل من الصقيع',
      description: 'قم بتغطية المحاصيل الحساسة ليلاً لحمايتها من الصقيع المتوقع.',
      priority: 'high',
      action: 'استخدم الأغطية الواقية من الصقيع ليلاً وقم بإزالتها صباحاً.',
      benefitScore: 95,
      icon: 'snowflake-alert'
    });
  }
  
  // Planting recommendations
  const isGoodPlantingCondition = forecast.some(f => 
    f.day.avgtemp_c > 18 && f.day.avgtemp_c < 28 && f.day.daily_chance_of_rain < 40
  );
  
  if (isGoodPlantingCondition) {
    recommendations.push({
      category: 'planting',
      title: 'وقت مناسب للزراعة',
      description: 'ظروف الطقس مناسبة لزراعة محاصيل جديدة خلال الأيام القادمة.',
      priority: 'medium',
      action: 'استغل الظروف الجيدة لزراعة المحاصيل الموسمية.',
      benefitScore: 80,
      icon: 'seed'
    });
  }
  
  // Soil management
  if (forecast.some(f => f.day.daily_chance_of_rain > 60)) {
    recommendations.push({
      category: 'soil',
      title: 'تحسين تصريف التربة',
      description: 'تأكد من وجود نظام تصريف جيد استعداداً للأمطار المتوقعة.',
      priority: 'medium',
      action: 'تفقد قنوات التصريف وصيانتها قبل هطول الأمطار.',
      benefitScore: 75,
      icon: 'water-percent'
    });
  }
  
  if (currentTemp > 28 && data.current.humidity < 50) {
    recommendations.push({
      category: 'soil',
      title: 'الحفاظ على رطوبة التربة',
      description: 'قم بتغطية التربة باستخدام مواد عضوية للمساعدة في الاحتفاظ بالرطوبة.',
      priority: 'medium',
      action: 'استخدم التغطية العضوية (mulch) حول النباتات.',
      benefitScore: 70,
      icon: 'grass'
    });
  }
  
  return recommendations.sort((a, b) => b.benefitScore - a.benefitScore);
};

// Arabic translations
const arabicTranslations = {
  title: 'الطقس والزراعة',
  updateTime: 'آخر تحديث: ',
  tabs: {
    alerts: 'تنبيهات',
    recommendations: 'توصيات',
    calendar: 'الزراعة والحصاد'
  },
  locationNotAvailable: 'موقعك غير متاح',
  getTunisiaWeather: 'عرض طقس تونس',
  failedToLoad: 'فشل تحميل بيانات الطقس',
  retry: 'إعادة المحاولة',
  locationPermission: {
    title: 'السماح بالوصول إلى الموقع',
    message: 'نحتاج إلى الوصول إلى موقعك للحصول على بيانات الطقس المحلية.',
    allow: 'السماح',
    deny: 'رفض'
  },
  refresh: 'اسحب للتحديث',
  today: 'اليوم',
  feelsLike: 'الشعور كأنه',
  humidity: 'الرطوبة',
  wind: 'الرياح',
  location: 'الموقع',
  weatherCurrently: 'الطقس حالياً',
  localClimate: 'المناخ المحلي',
  insights: 'رؤى مناخية',
  insightTypes: {
    critical: 'حرج',
    warning: 'تحذير',
    info: 'معلومات',
    success: 'إيجابي'
  }
};

interface TimeIconType {
  icon: string;
  color: string;
  backgroundColor: string;
  text: string;
  textColor: string;
  backgroundImage: any;
}

// Update timeIcon function for day/night visuals
const getTimeBasedWeatherIcon = (): TimeIconType => {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 18) {
    return {
      icon: 'weather-sunny',
      color: '#FDB813',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      text: 'Day',
      textColor: '#FFFFFF',
      backgroundImage: require('../../assets/images/weather/moon.png'), // Using moon.png for both temporarily
    };
  } else {
    return {
      icon: 'weather-night',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      text: 'Night',
      textColor: '#FFFFFF',
      backgroundImage: require('../../assets/images/weather/moon.png'),
    };
  }
};

// Main Weather Screen component
const WeatherScreen = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [timeIcon, setTimeIcon] = useState<TimeIconType>(getTimeBasedWeatherIcon());
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [insights, setInsights] = useState<WeatherInsight[]>([]);
  const [recommendations, setRecommendations] = useState<FarmingRecommendation[]>([]);
  const isFocused = useIsFocused();

  // Format time in Arabic-friendly format
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' });
  };

  // Fetch weather data from API
  const fetchWeatherData = async (useDefaultLocation = false) => {
    try {
      setLoading(true);
      setError(null);

      let locationQuery = 'Tunisia'; // Default to Tunisia

      if (!useDefaultLocation) {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({});
            locationQuery = `${location.coords.latitude},${location.coords.longitude}`;
            setLocationPermissionDenied(false);
          } else {
            setLocationPermissionDenied(true);
            // Still continue with default location
          }
        } catch (locationError) {
          console.log('Location permission not granted, using default location');
          setLocationPermissionDenied(true);
        }
      }

      // Fetch weather data with better error handling
      try {
        // Create the request config
        const requestConfig = {
          params: {
            key: WEATHER_API_KEY,
            q: locationQuery,
            days: 7, // Increased to 7 days for better planning
            aqi: 'yes', // Include air quality
            alerts: 'yes', // Include weather alerts
          },
          timeout: 15000,
        };
        
        const response = await axios.get(WEATHER_API_URL, requestConfig);
        
        // Check if response data exists before setting state
        if (response && response.data) {
          const weatherData = response.data as WeatherData;
          setWeather(weatherData);
          setLastUpdated(new Date());
          
          // Generate AI insights and recommendations
          const generatedInsights = generateWeatherInsights(weatherData);
          const generatedRecommendations = generateFarmingRecommendations(weatherData);
          
          setInsights(generatedInsights);
          setRecommendations(generatedRecommendations);
        } else {
          throw new Error('No data received from weather API');
        }
      } catch (apiError: any) {
        console.error('API error details:', apiError);
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

  // Refresh data when the screen is focused
  useEffect(() => {
    if (isFocused) {
      fetchWeatherData();
    }
  }, [isFocused]);

  // Update time icon every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeIcon(getTimeBasedWeatherIcon());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchWeatherData();
  };

  // Prompt user for location permission
  const promptLocationPermission = () => {
    Alert.alert(
      arabicTranslations.locationPermission.title,
      arabicTranslations.locationPermission.message,
      [
        {
          text: arabicTranslations.locationPermission.deny,
          onPress: () => fetchWeatherData(true),
          style: 'cancel'
        },
        {
          text: arabicTranslations.locationPermission.allow,
          onPress: () => fetchWeatherData(false)
        }
      ]
    );
  };

  // Render weather insights
  const renderInsights = () => {
    if (!insights || insights.length === 0) return null;
    
    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>{arabicTranslations.insights}</Text>
        {insights.slice(0, 3).map((insight, index) => (
          <View 
            key={`insight-${index}`}
            style={[
              styles.insightCard, 
              { borderLeftColor: getInsightTypeColor(insight.type) }
            ]}
          >
            <View style={styles.insightHeader}>
              <MaterialCommunityIcons 
                name={insight.icon as any} 
                size={24} 
                color={getInsightTypeColor(insight.type)} 
              />
              <View style={styles.insightTitleContainer}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <View style={[
                  styles.insightTypeTag, 
                  { backgroundColor: getInsightTypeColor(insight.type) + '20' }
                ]}>
                  <Text style={[
                    styles.insightTypeText, 
                    { color: getInsightTypeColor(insight.type) }
                  ]}>
                    {arabicTranslations.insightTypes[insight.type]}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Get color based on insight type
  const getInsightTypeColor = (type: string): string => {
    switch (type) {
      case 'critical':
        return '#F44336'; // Red
      case 'warning':
        return '#FF9800'; // Orange
      case 'info':
        return '#2196F3'; // Blue
      case 'success':
        return '#4CAF50'; // Green
      default:
        return '#757575'; // Gray
    }
  };

  // Render weather information header
  const renderWeatherHeader = () => {
    if (!weather) return null;

    const current = weather.current;
    const location = weather.location;

    return (
      <ImageBackground
        source={timeIcon.backgroundImage}
        style={styles.weatherHeader}
        imageStyle={styles.weatherBackgroundImage}
      >
        <View style={[styles.weatherOverlay, { backgroundColor: timeIcon.backgroundColor }]}>
          <View style={styles.weatherTopRow}>
            <View>
              <Text style={styles.locationName}>
                {location?.name || arabicTranslations.locationNotAvailable}
                {location?.country && `, ${location.country}`}
              </Text>
              <Text style={styles.lastUpdated}>
                {arabicTranslations.updateTime} {formatTime(lastUpdated)}
              </Text>
            </View>
            
            {locationPermissionDenied && (
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={promptLocationPermission}
              >
                <MaterialIcons name="my-location" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.weatherMainInfo}>
            <View style={styles.weatherCondition}>
              <MaterialCommunityIcons 
                name={(timeIcon.icon as any) || 'weather-sunny'} 
                size={40} 
                color={timeIcon.color} 
              />
              <Text style={styles.tempText}>{Math.round(current.temp_c)}°C</Text>
            </View>
            
            <Text style={styles.conditionText}>
              {current.condition.text}
            </Text>
            
            <View style={styles.weatherDetailsRow}>
              <View style={styles.weatherDetail}>
                <MaterialCommunityIcons name="thermometer" size={16} color="#fff" />
                <Text style={styles.weatherDetailText}>
                  {arabicTranslations.feelsLike}: {Math.round(current.feelslike_c)}°C
                </Text>
              </View>
              
              <View style={styles.weatherDetail}>
                <MaterialCommunityIcons name="water-percent" size={16} color="#fff" />
                <Text style={styles.weatherDetailText}>
                  {arabicTranslations.humidity}: {current.humidity}%
                </Text>
              </View>
              
              <View style={styles.weatherDetail}>
                <MaterialCommunityIcons name="weather-windy" size={16} color="#fff" />
                <Text style={styles.weatherDetailText}>
                  {arabicTranslations.wind}: {Math.round(current.wind_kph)} كم/س
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  };

  // Render loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
          <Text style={styles.loadingText}>جاري تحميل بيانات الطقس...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error && !weather) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="cloud-alert" size={64} color="#FF5722" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchWeatherData()}>
            <Text style={styles.retryButtonText}>{arabicTranslations.retry}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render tab screens with properly typed weather data
  const AlertsTab = () => weather ? <WeatherAlerts weatherData={weather} weatherInsights={insights} /> : null;
  const RecommendationsTab = () => weather ? (
    <FarmingRecommendations 
      weatherData={weather} 
      farmingRecommendations={recommendations}
    />
  ) : null;
  const CalendarTab = () => weather ? <PlantingCalendar weatherData={weather} /> : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>{arabicTranslations.title}</Text>
      </View>
      
      {renderWeatherHeader()}
      
      {/* AI Insights Section */}
      {renderInsights()}
      
      <View style={styles.tabContainer}>
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabLabel,
            tabBarIndicatorStyle: { backgroundColor: theme.colors.primary.base },
            tabBarActiveTintColor: theme.colors.primary.base,
            tabBarInactiveTintColor: theme.colors.neutral.gray.base,
          }}
        >
          <Tab.Screen 
            name="Alerts" 
            component={AlertsTab} 
            options={{ 
              tabBarLabel: arabicTranslations.tabs.alerts,
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons name="alert-circle" color={color} size={20} />
              )
            }} 
          />
          <Tab.Screen 
            name="Recommendations" 
            component={RecommendationsTab} 
            options={{ 
              tabBarLabel: arabicTranslations.tabs.recommendations,
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons name="lightbulb-on" color={color} size={20} />
              )
            }} 
          />
          <Tab.Screen 
            name="Calendar" 
            component={CalendarTab} 
            options={{ 
              tabBarLabel: arabicTranslations.tabs.calendar,
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons name="calendar-month" color={color} size={20} />
              )
            }} 
          />
        </Tab.Navigator>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary.dark,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  weatherHeader: {
    height: 200,
    width: '100%',
  },
  weatherBackgroundImage: {
    resizeMode: 'cover',
  },
  weatherOverlay: {
    flex: 1,
    padding: 16,
  },
  weatherTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  locationButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 20,
  },
  weatherMainInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tempText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  conditionText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
  },
  weatherDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherDetailText: {
    marginLeft: 4,
    color: '#fff',
    fontSize: 12,
  },
  insightsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 12,
    textAlign: 'right',
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
  },
  insightTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  insightTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  insightDescription: {
    fontSize: 14,
    color: theme.colors.neutral.gray.dark,
    lineHeight: 20,
    textAlign: 'right',
  },
  tabContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBar: {
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderBottomWidth: 0,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'none',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.neutral.gray.dark,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#555',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary.base,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default WeatherScreen; 