import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Share, Animated } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import axios from 'axios';
import { theme } from '../../../theme/theme';
import { Animal, AnimalDetails as IAnimalDetails } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type RootStackParamList = {
  Dictionary: undefined;
  CropDetails: { id: number };
  AnimalDetails: { id: number };
};

type AnimalDetailsRouteProp = RouteProp<RootStackParamList, 'AnimalDetails'>;

type Props = {
  route: AnimalDetailsRouteProp;
};

const AnimalDetails: React.FC<Props> = ({ route }) => {
  const { id } = route.params;
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [details, setDetails] = useState<IAnimalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAnimalDetails();
  }, [id]);

  useEffect(() => {
    if (!loading && animal) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, animal]);

  const fetchAnimalDetails = async () => {
    try {
      setLoading(true);
      const [animalResponse, detailsResponse] = await Promise.all([
        axios.get(`http://192.168.104.24:5000/api/animal/get/${id}`),
        axios.get(`http://192.168.104.24:5000/api/animalDetails/get/${id}`)
      ]);
      setAnimal(animalResponse.data);
      setDetails(detailsResponse.data);
    } catch (err) {
      setError('Failed to fetch animal details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!animal || !details) return;
    
    try {
      await Share.share({
        message: `معلومات عن ${animal.name}:\n\n` +
                `🍽️ التغذية: ${details.feeding || 'غير متوفر'}\n\n` +
                `💆‍♂️ العناية: ${details.care || 'غير متوفر'}\n\n` +
                `🏥 الصحة: ${details.health || 'غير متوفر'}\n\n` +
                `🏠 السكن: ${details.housing || 'غير متوفر'}\n\n` +
                `👪 التربية: ${details.breeding || 'غير متوفر'}\n\n` +
                `🦠 الأمراض: ${details.diseases || 'غير متوفر'}\n\n` +
                `💊 الأدوية: ${details.medications || 'غير متوفر'}\n\n` +
                `🐾 السلوك: ${details.behavior || 'غير متوفر'}\n\n` +
                `💰 الاقتصاد: ${details.economics || 'غير متوفر'}\n\n` +
                `💉 التطعيم: ${details.vaccination || 'غير متوفر'}`,
                
        title: `معلومات عن تربية ${animal.name}`,
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
    return expandedSections[section] !== false; // Default to expanded
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (error || !animal || !details) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load animal details'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAnimalDetails}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderSection = (
    title: string, 
    content: string, 
    iconName: keyof typeof MaterialCommunityIcons.glyphMap, 
    sectionKey: string
  ) => (
    <Animated.View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection(sectionKey)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitleContainer}>
          <MaterialCommunityIcons 
            name={iconName} 
            size={24} 
            color={theme.colors.primary.base} 
            style={styles.sectionIcon} 
          />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <MaterialCommunityIcons 
          name={isSectionExpanded(sectionKey) ? "chevron-up" : "chevron-down"} 
          size={24} 
          color={theme.colors.neutral.textSecondary} 
        />
      </TouchableOpacity>
      
      {isSectionExpanded(sectionKey) && (
        <View style={styles.sectionContentContainer}>
          <Text style={styles.sectionContent}>{content || 'غير متوفر'}</Text>
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
          <Text style={styles.icon}>{animal.icon}</Text>
          <Animated.Text style={[styles.name, { transform: [{ scale: titleScale }] }]}>
            {animal.name}
          </Animated.Text>
          <Text style={styles.category}>{animal.category}</Text>
        </Animated.View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleShare}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color={theme.colors.primary.base} />
            <Text style={styles.actionButtonText}>مشاركة</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
          >
            <MaterialCommunityIcons name="star-outline" size={20} color={theme.colors.primary.base} />
            <Text style={styles.actionButtonText}>المفضلة</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {renderSection('التغذية', details.feeding, 'food', 'feeding')}
          {renderSection('العناية', details.care, 'hand-heart', 'care')}
          {renderSection('الصحة', details.health, 'heart-pulse', 'health')}
          {renderSection('السكن', details.housing, 'home', 'housing')}
          {renderSection('التربية', details.breeding, 'baby-carriage', 'breeding')}
          {renderSection('الأمراض', details.diseases, 'virus', 'diseases')}
          {renderSection('الأدوية', details.medications, 'pill', 'medications')}
          {renderSection('السلوك', details.behavior, 'paw', 'behavior')}
          {renderSection('الاقتصاد', details.economics, 'cash', 'economics')}
          {renderSection('التطعيم', details.vaccination, 'needle', 'vaccination')}
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
  sectionContent: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    lineHeight: 24,
    textAlign: 'right',
    paddingTop: theme.spacing.md,
  },
});

export default AnimalDetails; 