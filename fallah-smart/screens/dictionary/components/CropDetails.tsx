import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Share,
  Animated,
  Image
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import axios from 'axios';
import { theme } from '../../../theme/theme';
import { Crop, CropDetails as ICropDetails } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

type RootStackParamList = {
  Dictionary: undefined;
  CropDetails: { id: number };
  AnimalDetails: { id: number };
};

type CropDetailsRouteProp = RouteProp<RootStackParamList, 'CropDetails'>;

type Props = {
  route: CropDetailsRouteProp;
};

const CropDetails: React.FC<Props> = ({ route }) => {
  const { id } = route.params;
  const [crop, setCrop] = useState<Crop | null>(null);
  const [details, setDetails] = useState<ICropDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [speaking, setSpeaking] = useState<{[key: string]: boolean}>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    fetchCropDetails();
  }, [id]);

  useEffect(() => {
    if (!loading && crop) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, crop]);
  
  // Clean up speech when component unmounts
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const fetchCropDetails = async () => {
    try {
      setLoading(true);
      const [cropResponse, detailsResponse] = await Promise.all([
        axios.get(`${API_URL}/crop/${id}`),
        axios.get(`${API_URL}/cropsDetails/${id}`)
      ]);
      setCrop(cropResponse.data);
      setDetails(detailsResponse.data);
    } catch (err) {
      setError('Failed to fetch crop details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!crop || !details) return;
    
    try {
      await Share.share({
        message: `معلومات عن ${crop.name}:\n\n` +
                `🌱 دليل الزراعة: ${details.plantingGuide || 'غير متوفر'}\n\n` +
                `🌾 دليل الحصاد: ${details.harvestingGuide || 'غير متوفر'}\n\n` +
                `🌤️ اعتبارات الطقس: ${details.weatherConsiderations || 'غير متوفر'}\n\n` +
                `🌿 الأسمدة والتربة: ${details.fertilizers || 'غير متوفر'}\n\n` +
                `⭐ أفضل الممارسات: ${details.bestPractices || 'غير متوفر'}\n\n` +
                `🦠 إدارة الأمراض: ${details.diseaseManagement || 'غير متوفر'}\n\n` +
                `🐛 مكافحة الآفات: ${details.pestControl || 'غير متوفر'}\n\n` +
                `💧 إدارة المياه: ${details.waterManagement || 'غير متوفر'}\n\n` +
                `🏞️ تحضير التربة: ${details.soilPreparation || 'غير متوفر'}\n\n` +
                `🏪 إرشادات التخزين: ${details.storageGuidelines || 'غير متوفر'}\n\n` +
                `📈 القيمة السوقية: ${details.marketValue || 'غير متوفر'}\n\n` +
                `🌍 الأثر البيئي: ${details.environmentalImpact || 'غير متوفر'}\n\n` +
                `🌿 الزراعة العضوية: ${details.organicFarming || 'غير متوفر'}`,
                
        title: `معلومات زراعية عن ${crop.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isSectionExpanded = (section: string) => {
    return expandedSections[section] === true; // Default to closed
  };

  // Dynamic header styles based on scroll position
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 120],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp'
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp'
  });

  const handleSpeech = (content: string, sectionKey: string) => {
    // If this section is already speaking, stop it and return
    if (speaking[sectionKey]) {
      Speech.stop();
      setSpeaking(prev => ({
        ...prev,
        [sectionKey]: false
      }));
      return;
    }
    
    // Stop any current speech first
    Speech.stop();
    
    // Reset all speaking states to false
    const newSpeakingState = Object.keys(speaking).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as {[key: string]: boolean});
    
    // Set only the current section to speaking
    newSpeakingState[sectionKey] = true;
    setSpeaking(newSpeakingState);
    
    // Speak the content
    Speech.speak(content || 'غير متوفر', {
      language: 'ar',
      onDone: () => {
        setSpeaking(prev => ({
          ...prev,
          [sectionKey]: false
        }));
      },
      onError: () => {
        setSpeaking(prev => ({
          ...prev,
          [sectionKey]: false
        }));
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (error || !crop || !details) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load crop details'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCropDetails}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderSection = (title: string, content: string, icon: keyof typeof MaterialCommunityIcons.glyphMap, section: string) => (
    <Animated.View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection(section)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitleContainer}>
          <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary.base} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <MaterialCommunityIcons 
          name={isSectionExpanded(section) ? "chevron-up" : "chevron-down"} 
          size={24} 
          color={theme.colors.neutral.textSecondary} 
        />
      </TouchableOpacity>
      
      {isSectionExpanded(section) && (
        <View style={styles.sectionContentContainer}>
          <View style={styles.sectionContentHeader}>
            <Text style={styles.sectionContent}>{content || 'غير متوفر'}</Text>
            <TouchableOpacity 
              style={styles.speechButton}
              onPress={() => handleSpeech(content, section)}
            >
              <MaterialCommunityIcons 
                name={speaking[section] ? "volume-high" : "volume-medium"} 
                size={24} 
                color={speaking[section] ? theme.colors.primary.dark : theme.colors.primary.base} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View style={[
          styles.header,
          { 
            height: headerHeight,
            opacity: headerOpacity
          }
        ]}>
          <Text style={styles.icon}>{crop.icon}</Text>
          <Animated.Text style={[styles.name, { transform: [{ scale: titleScale }] }]}>
            {crop.name}
          </Animated.Text>
          <Text style={styles.category}>{crop.category}</Text>
        </Animated.View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleShare}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color={theme.colors.primary.base} />
            <Text style={styles.actionButtonText}>مشاركة</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {renderSection('دليل الزراعة', details.plantingGuide, 'sprout', 'planting')}
          {renderSection('دليل الحصاد', details.harvestingGuide, 'leaf', 'harvesting')}
          {renderSection('اعتبارات الطقس', details.weatherConsiderations, 'weather-partly-cloudy', 'weather')}
          {renderSection('الأسمدة', details.fertilizers, 'flower', 'fertilizers')}
          {renderSection('أفضل الممارسات', details.bestPractices, 'star', 'bestPractices')}
          {renderSection('إدارة الأمراض', details.diseaseManagement, 'bacteria', 'diseaseManagement')}
          {renderSection('مكافحة الآفات', details.pestControl, 'bug', 'pestControl')}
          {renderSection('إدارة المياه', details.waterManagement, 'water', 'waterManagement')}
          {renderSection('تحضير التربة', details.soilPreparation, 'shovel', 'soilPreparation')}
          {renderSection('إرشادات التخزين', details.storageGuidelines, 'package-variant-closed', 'storageGuidelines')}
          {renderSection('القيمة السوقية', details.marketValue, 'currency-usd', 'marketValue')}
          {renderSection('الأثر البيئي', details.environmentalImpact, 'earth', 'environmentalImpact')}
          {renderSection('الزراعة العضوية', details.organicFarming, 'nature', 'organicFarming')}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  scrollView: {
    flex: 1,
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
    padding: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  retryButtonText: {
    color: theme.colors.neutral.surface,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: theme.colors.primary.base,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  icon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  name: {
    fontSize: theme.fontSizes.h1,
    color: theme.colors.neutral.surface,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  category: {
    fontSize: theme.fontSizes.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.small,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginHorizontal: theme.spacing.sm,
    ...theme.shadows.small,
  },
  actionButtonText: {
    color: theme.colors.primary.base,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  sectionHeader: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.h2,
    color: theme.colors.primary.base,
    fontWeight: 'bold',
  },
  sectionContentContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  sectionContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: theme.spacing.md,
  },
  speechButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginLeft: theme.spacing.sm,
  },
  sectionContent: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    lineHeight: 24,
    textAlign: 'right',
    flex: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.md,
    ...theme.shadows.small,
  },
  shareButtonText: {
    color: theme.colors.primary.base,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.body,
  },
});

export default CropDetails; 