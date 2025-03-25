import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData, WeatherInsight, ForecastDay } from '../../screens/weather/WeatherScreen';
import { theme } from '../../theme/theme';

interface WeatherAlertsProps {
  weatherData: WeatherData;
  weatherInsights?: WeatherInsight[];
}

const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ weatherData, weatherInsights = [] }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState<{ [key: string]: boolean }>({
    heat: true,
    rain: true,
    frost: true,
    wind: true,
    drought: true,
  });

  // Toggle notification for a specific alert type
  const toggleNotification = (alertType: string) => {
    setNotificationsEnabled((prev) => ({
      ...prev,
      [alertType]: !prev[alertType],
    }));
  };

  // Get icon for alert type
  const getAlertIcon = (alertType: string): string => {
    switch (alertType) {
      case 'heat':
        return 'thermometer-high';
      case 'rain':
        return 'weather-pouring';
      case 'frost':
        return 'snowflake';
      case 'wind':
        return 'weather-windy';
      case 'drought':
        return 'water-off';
      case 'optimal':
        return 'check-circle';
      default:
        return 'alert-circle';
    }
  };

  // Get color for alert type
  const getAlertColor = (alertType: string): string => {
    switch (alertType) {
      case 'heat':
        return '#F44336'; // Red
      case 'rain':
        return '#2196F3'; // Blue
      case 'frost':
        return '#00BCD4'; // Cyan
      case 'wind':
        return '#FF9800'; // Orange
      case 'drought':
        return '#795548'; // Brown
      case 'optimal':
        return '#4CAF50'; // Green
      default:
        return '#9E9E9E'; // Gray
    }
  };

  // Get alert severity background color
  const getSeverityBackgroundColor = (severity: string): string => {
    switch (severity) {
      case 'high':
        return '#FEE7E6'; // Light red
      case 'medium':
        return '#FFF3E0'; // Light orange
      case 'low':
        return '#E8F5E9'; // Light green
      default:
        return '#F5F5F5'; // Light gray
    }
  };

  // Get arabic label for severity
  const getSeverityLabel = (severity: string): string => {
    switch (severity) {
      case 'high':
        return 'شديد';
      case 'medium':
        return 'متوسط';
      case 'low':
        return 'منخفض';
      default:
        return '';
    }
  };

  // Filter alerts by notification preferences
  const filteredInsights = weatherInsights.filter(
    (insight) => notificationsEnabled[insight.type] !== false
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>تنبيهات الطقس</Text>
        <Text style={styles.subtitle}>
          تنبيهات هامة عن الظروف الجوية التي قد تؤثر على المحاصيل
        </Text>
      </View>

      {/* Current weather summary */}
      <View style={styles.weatherSummary}>
        <Text style={styles.weatherSummaryTitle}>ملخص الطقس الحالي</Text>
        <View style={styles.weatherConditions}>
          <View style={styles.weatherCondition}>
            <MaterialCommunityIcons
              name="thermometer"
              size={22}
              color={theme.colors.primary.dark}
            />
            <Text style={styles.weatherValue}>
              {Math.round(weatherData.current.temp_c)}°C
            </Text>
          </View>

          <View style={styles.weatherCondition}>
            <MaterialCommunityIcons
              name="water-percent"
              size={22}
              color={theme.colors.primary.dark}
            />
            <Text style={styles.weatherValue}>
              {weatherData.current.humidity}%
            </Text>
          </View>

          <View style={styles.weatherCondition}>
            <MaterialCommunityIcons
              name="weather-windy"
              size={22}
              color={theme.colors.primary.dark}
            />
            <Text style={styles.weatherValue}>
              {Math.round(weatherData.current.wind_kph)} كم/س
            </Text>
          </View>
        </View>
      </View>

      {/* Notification preferences */}
      <View style={styles.notificationPreferences}>
        <Text style={styles.sectionTitle}>إعدادات التنبيهات</Text>
        <View style={styles.preferencesContainer}>
          {Object.entries(notificationsEnabled).map(([type, enabled]) => (
            <View key={type} style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <MaterialCommunityIcons
                  name={getAlertIcon(type) as any}
                  size={24}
                  color={getAlertColor(type)}
                />
                <Text style={styles.preferenceName}>
                  {type === 'heat' ? 'حرارة مرتفعة' :
                   type === 'rain' ? 'أمطار غزيرة' :
                   type === 'frost' ? 'صقيع' :
                   type === 'wind' ? 'رياح قوية' :
                   type === 'drought' ? 'جفاف' : ''}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={() => toggleNotification(type)}
                trackColor={{ false: '#e0e0e0', true: theme.colors.primary.light }}
                thumbColor={enabled ? theme.colors.primary.base : '#f4f3f4'}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Active alerts */}
      <View style={styles.alertsContainer}>
        <Text style={styles.sectionTitle}>التنبيهات النشطة</Text>
        
        {filteredInsights.length === 0 ? (
          <View style={styles.emptyAlerts}>
            <MaterialCommunityIcons
              name="weather-sunny"
              size={48}
              color="#AAAAAA"
            />
            <Text style={styles.emptyAlertsText}>
              لا توجد تنبيهات نشطة في الوقت الحالي
            </Text>
          </View>
        ) : (
          filteredInsights.map((insight, index) => (
            <View 
              key={`${insight.type}-${index}`}
              style={[
                styles.alertCard,
                { backgroundColor: getSeverityBackgroundColor(insight.severity) }
              ]}
            >
              <View style={styles.alertHeader}>
                <View style={styles.alertTitle}>
                  <MaterialCommunityIcons
                    name={getAlertIcon(insight.type) as any}
                    size={24}
                    color={getAlertColor(insight.type)}
                  />
                  <Text style={styles.alertTitleText}>{insight.title}</Text>
                </View>
                <View style={[
                  styles.severityBadge,
                  { borderColor: getAlertColor(insight.type) }
                ]}>
                  <Text style={[
                    styles.severityText,
                    { color: getAlertColor(insight.type) }
                  ]}>
                    {getSeverityLabel(insight.severity)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.alertDescription}>{insight.description}</Text>
              
              <View style={styles.recommendationContainer}>
                <Text style={styles.recommendationTitle}>التوصية:</Text>
                <Text style={styles.recommendationText}>{insight.recommendation}</Text>
              </View>
              
              <View style={styles.timeContainer}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color={theme.colors.neutral.gray.base}
                />
                <Text style={styles.timeText}>{insight.timeFrame}</Text>
              </View>
            </View>
          ))
        )}
      </View>
      
      {/* Forecast warnings */}
      <View style={styles.forecastContainer}>
        <Text style={styles.sectionTitle}>تنبيهات الأيام القادمة</Text>
        <View style={styles.forecastCards}>
          {weatherData.forecast.forecastday.slice(0, 3).map((day: ForecastDay, index: number) => {
            // Determine if there are any warnings for this day
            const hasWarning = day.day.maxtemp_c > 35 || day.day.mintemp_c < 5 || day.day.avgtemp_c > 30;
            const warningType = day.day.maxtemp_c > 35 ? 'heat' : 
                                day.day.mintemp_c < 5 ? 'frost' :
                                day.day.avgtemp_c > 30 ? 'wind' : '';
            
            return (
              <View key={index} style={styles.forecastCard}>
                <Text style={styles.forecastDay}>{day.date}</Text>
                <View style={styles.forecastIcon}>
                  <MaterialCommunityIcons
                    name={day.day.condition.text?.includes('rain') ? 'weather-pouring' :
                          day.day.condition.text?.includes('cloud') ? 'weather-partly-cloudy' :
                          'weather-sunny'}
                    size={32}
                    color={theme.colors.primary.base}
                  />
                </View>
                <Text style={styles.forecastTemp}>{Math.round(day.day.avgtemp_c)}°C</Text>
                
                {hasWarning && (
                  <View style={[
                    styles.forecastWarning,
                    { backgroundColor: getAlertColor(warningType) + '20' }
                  ]}>
                    <MaterialCommunityIcons
                      name={getAlertIcon(warningType) as any}
                      size={16}
                      color={getAlertColor(warningType)}
                    />
                    <Text style={[
                      styles.forecastWarningText,
                      { color: getAlertColor(warningType) }
                    ]}>
                      {warningType === 'heat' ? 'حرارة عالية' :
                       warningType === 'frost' ? 'صقيع محتمل' :
                       warningType === 'wind' ? 'رياح قوية' : ''}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.neutral.gray.base,
    marginTop: 4,
    textAlign: 'right',
  },
  weatherSummary: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
  },
  weatherSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 12,
    textAlign: 'right',
  },
  weatherConditions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherCondition: {
    alignItems: 'center',
  },
  weatherValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
  },
  notificationPreferences: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 12,
    textAlign: 'right',
  },
  preferencesContainer: {
    backgroundColor: '#fff',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceName: {
    fontSize: 16,
    color: theme.colors.neutral.gray.dark,
    marginLeft: 12,
  },
  alertsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  emptyAlerts: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAlertsText: {
    marginTop: 16,
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  alertCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
    marginLeft: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertDescription: {
    fontSize: 14,
    color: theme.colors.neutral.gray.dark,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'right',
  },
  recommendationContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginBottom: 4,
    textAlign: 'right',
  },
  recommendationText: {
    fontSize: 14,
    color: theme.colors.neutral.gray.dark,
    textAlign: 'right',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.neutral.gray.base,
    marginLeft: 4,
  },
  forecastContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    marginBottom: 100,
  },
  forecastCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.neutral.gray.dark,
    marginBottom: 8,
  },
  forecastIcon: {
    marginVertical: 8,
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
    marginVertical: 8,
  },
  forecastWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  forecastWarningText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default WeatherAlerts; 