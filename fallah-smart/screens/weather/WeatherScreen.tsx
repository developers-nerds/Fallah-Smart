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
  const pressure = data.current.pressure_mb;
  const uv = data.current.uv;

  // Extreme heat alert with detailed impact analysis
  if (maxTemp > 35) {
    insights.push({
      type: 'critical',
      title: 'موجة حرارة شديدة قادمة',
      description: `درجة الحرارة ستصل إلى ${maxTemp}°C. هذا يمكن أن يؤثر على المحاصيل بعدة طرق:
      - جفاف التربة وزيادة التبخر
      - إجهاد المحاصيل وتوقف النمو
      - زيادة خطر الإصابة بالآفات`,
      icon: 'weather-sunny-alert',
      relevance: 95,
      severity: 'high',
      recommendation: `للحماية من الحرارة الشديدة:
      1. ري المحاصيل في الصباح الباكر أو المساء
      2. استخدام التغطية العضوية للتربة
      3. تركيب شبكات تظليل للمحاصيل الحساسة
      4. مراقبة علامات الإجهاد الحراري`,
      timeFrame: 'خلال 72 ساعة القادمة'
    });
  }

  // Frost alert with crop protection details
  if (minTemp < 5) {
    insights.push({
      type: 'warning',
      title: 'تحذير من الصقيع',
      description: `درجة الحرارة ستنخفض إلى ${minTemp}°C. المحاصيل المعرضة للخطر:
      - الخضروات الورقية
      - النباتات المزهرة
      - الشتلات الصغيرة
      - المحاصيل الاستوائية`,
      icon: 'snowflake-alert',
      relevance: 90,
      severity: 'high',
      recommendation: `إجراءات الحماية من الصقيع:
      1. تغطية المحاصيل بأغطية خاصة
      2. ري المحاصيل قبل انخفاض الحرارة
      3. استخدام مراوح الهواء إن وجدت
      4. إزالة الأغطية صباحاً لتجنب ارتفاع الحرارة`,
      timeFrame: 'الليلة وغداً صباحاً'
    });
  }

  // Strong wind alert with specific risks
  if (windSpeed > 30) {
    insights.push({
      type: 'warning',
      title: 'رياح قوية متوقعة',
      description: `سرعة الرياح ${windSpeed} كم/س. المخاطر المحتملة:
      - تلف المحاصيل وكسر الفروع
      - جفاف التربة وزيادة التبخر
      - تلف المعدات والهياكل الزراعية
      - صعوبة الري بالرش`,
      icon: 'weather-windy',
      relevance: 85,
      severity: 'high',
      recommendation: `إجراءات الحماية من الرياح:
      1. تثبيت المحاصيل المتسلقة
      2. تأمين معدات الري والتظليل
      3. تأجيل عمليات الرش والتسميد
      4. زيادة الري لتعويض التبخر`,
      timeFrame: 'خلال 24 ساعة'
    });
  }

  // Heavy rain alert with flood prevention
  if (rainChance > 70) {
    insights.push({
      type: 'warning',
      title: 'أمطار غزيرة متوقعة',
      description: `احتمال هطول الأمطار ${rainChance}%. التأثيرات المحتملة:
      - تشبع التربة وتجمع المياه
      - خطر تعفن الجذور
      - انجراف التربة والمغذيات
      - تأخر عمليات الزراعة`,
      icon: 'weather-pouring',
      relevance: 80,
      severity: 'high',
      recommendation: `إجراءات التعامل مع الأمطار:
      1. تحسين نظام الصرف في الحقول
      2. حماية التربة من الانجراف
      3. تأجيل الري والتسميد
      4. مراقبة مستويات المياه في الحقول`,
      timeFrame: 'خلال 48 ساعة'
    });
  }

  // UV index warning
  if (uv > 8) {
    insights.push({
      type: 'warning',
      title: 'مؤشر أشعة UV مرتفع',
      description: `مؤشر الأشعة فوق البنفسجية ${uv}. التأثيرات:
      - حروق المحاصيل وجفاف الأوراق
      - إجهاد النباتات
      - تأثر جودة الثمار
      - زيادة احتياجات الري`,
      icon: 'white-balance-sunny',
      relevance: 75,
      severity: 'medium',
      recommendation: `إجراءات الحماية من الأشعة:
      1. استخدام شبكات التظليل
      2. زيادة معدل الري
      3. تجنب الزراعة في وقت الذروة
      4. حماية العاملين في المزرعة`,
      timeFrame: 'خلال ساعات النهار'
    });
  }

  // Drought conditions with water management
  if (rainChance < 10 && maxTemp > 30 && humidity < 40) {
    insights.push({
      type: 'warning',
      title: 'ظروف جفاف محتملة',
      description: `مؤشرات الجفاف:
      - درجة حرارة مرتفعة: ${maxTemp}°C
      - رطوبة منخفضة: ${humidity}%
      - فرصة أمطار ضئيلة: ${rainChance}%`,
      icon: 'water-off',
      relevance: 75,
      severity: 'medium',
      recommendation: `إدارة المياه في ظروف الجفاف:
      1. تطبيق نظام ري بالتنقيط
      2. استخدام تقنيات توفير المياه
      3. تغطية التربة لتقليل التبخر
      4. اختيار محاصيل مقاومة للجفاف`,
      timeFrame: 'الأيام القادمة'
    });
  }

  // Optimal planting conditions
  if (currentTemp > 18 && currentTemp < 28 && humidity > 50 && humidity < 80) {
    insights.push({
      type: 'success',
      title: 'ظروف مثالية للزراعة',
      description: `الظروف الحالية مثالية:
      - درجة حرارة معتدلة: ${currentTemp}°C
      - رطوبة مناسبة: ${humidity}%
      - ضغط جوي مستقر: ${pressure} mb`,
      icon: 'seed',
      relevance: 70,
      severity: 'low',
      recommendation: `استغلال الظروف المثالية:
      1. بدء زراعة المحاصيل الموسمية
      2. نقل الشتلات للحقول المفتوحة
      3. إجراء عمليات التسميد
      4. تجهيز التربة للزراعة`,
      timeFrame: 'اليوم وغداً'
    });
  }

  return insights.sort((a, b) => b.relevance - a.relevance);
};

// AI Recommendations generator
const generateFarmingRecommendations = (data: WeatherData): FarmingRecommendation[] => {
  const recommendations: FarmingRecommendation[] = [];
  const currentTemp = data.current.temp_c;
  const forecast = data.forecast.forecastday;
  const humidity = data.current.humidity;
  const windSpeed = data.current.wind_kph;
  const pressure = data.current.pressure_mb;
  const uv = data.current.uv;
  
  // Smart irrigation recommendations
  if (currentTemp > 30) {
    recommendations.push({
      category: 'irrigation',
      title: 'تعديل نظام الري للحرارة المرتفعة',
      description: `مع ارتفاع درجة الحرارة إلى ${currentTemp}°C، يجب تعديل نظام الري:
      • زيادة كمية المياه لتعويض التبخر
      • تعديل أوقات الري لتجنب ساعات الذروة
      • مراقبة رطوبة التربة بانتظام
      • التأكد من كفاءة نظام الري`,
      priority: 'high',
      action: `خطة الري المقترحة:
      1. الري في الصباح الباكر (قبل 6 صباحاً)
      2. الري في المساء (بعد 6 مساءً)
      3. زيادة عدد مرات الري مع تقليل الكمية
      4. فحص وصيانة نظام الري للتأكد من كفاءته`,
      benefitScore: 90,
      icon: 'water'
    });
  }

  // Advanced soil management
  if (forecast[0].day.daily_chance_of_rain > 60) {
    recommendations.push({
      category: 'soil',
      title: 'إدارة التربة قبل الأمطار',
      description: `مع توقع هطول أمطار بنسبة ${forecast[0].day.daily_chance_of_rain}%:
      • تحسين تصريف المياه في الحقول
      • حماية التربة من الانجراف
      • الحفاظ على المغذيات
      • منع تجمع المياه حول النباتات`,
      priority: 'high',
      action: `إجراءات تحضير التربة:
      1. تنظيف قنوات التصريف وفحص كفاءتها
      2. إضافة مواد عضوية لتحسين بنية التربة
      3. عمل حواجز لمنع انجراف التربة
      4. رفع مستوى التربة حول النباتات الحساسة`,
      benefitScore: 85,
      icon: 'shovel'
    });
  }

  // Crop protection strategies
  if (currentTemp > 35 || windSpeed > 30) {
    recommendations.push({
      category: 'protection',
      title: 'حماية المحاصيل من الظروف القاسية',
      description: `الظروف الحالية تتطلب حماية خاصة:
      • درجة الحرارة: ${currentTemp}°C
      • سرعة الرياح: ${windSpeed} كم/س
      • الرطوبة: ${humidity}%
      • مؤشر UV: ${uv}`,
      priority: 'high',
      action: `إجراءات الحماية المطلوبة:
      1. تركيب شبكات تظليل (50-70% تظليل)
      2. إنشاء مصدات رياح مؤقتة
      3. رش المحاصيل برذاذ ماء في الصباح الباكر
      4. تقوية دعامات النباتات المتسلقة`,
      benefitScore: 95,
      icon: 'shield'
    });
  }

  // Equipment maintenance
  recommendations.push({
    category: 'equipment',
    title: 'صيانة وتجهيز المعدات الزراعية',
    description: `تحضير المعدات للظروف المتوقعة:
    • معدات الري والتسميد
    • أدوات الحماية والتظليل
    • معدات الحصاد والتخزين
    • أجهزة القياس والمراقبة`,
    priority: 'medium',
    action: `قائمة الصيانة المطلوبة:
    1. فحص وتنظيف فلاتر نظام الري
    2. صيانة مضخات المياه ومعدات الرش
    3. تجهيز معدات التظليل والحماية
    4. معايرة أجهزة قياس رطوبة التربة`,
    benefitScore: 75,
    icon: 'tools'
  });

  // Planting recommendations based on conditions
  const isGoodPlantingCondition = forecast.some(f => 
    f.day.avgtemp_c > 18 && f.day.avgtemp_c < 28 && f.day.daily_chance_of_rain < 40
  );
  
  if (isGoodPlantingCondition) {
    recommendations.push({
      category: 'planting',
      title: 'خطة الزراعة المثالية',
      description: `الظروف مناسبة للزراعة:
      • درجة الحرارة معتدلة
      • رطوبة التربة مناسبة
      • ضغط جوي مستقر
      • فرصة نجاح عالية`,
      priority: 'medium',
      action: `خطوات الزراعة الموصى بها:
      1. تجهيز التربة وإضافة الأسمدة العضوية
      2. اختيار الأصناف المناسبة للموسم
      3. تحديد المسافات المثالية بين النباتات
      4. تجهيز نظام الري بالتنقيط`,
      benefitScore: 80,
      icon: 'seed'
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
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
            title={arabicTranslations.refresh}
            titleColor={theme.colors.neutral.gray.base}
          />
        }
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    minHeight: 500, // Add minimum height to make tabs visible
  },
  tabBar: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'none',
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