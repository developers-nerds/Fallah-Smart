import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Share,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

// Define the navigation type
type RootDrawerParamList = {
  HomeContent: undefined;
  ScanHistoryScreen: undefined;
};

type NavigationProp = DrawerNavigationProp<RootDrawerParamList>;

interface ScanDetailsProps {
  route: {
    params: {
      scan: {
        id: number;
        imageUrl: string;
        ai_response: string;
        createdAt: string;
      };
      imageUrl: string;
      aiResponse: string;
    };
  };
}

const ScanDetailsScreen = ({ route }: ScanDetailsProps) => {
  const { scan, imageUrl, aiResponse } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: aiResponse,
        url: imageUrl,
      });
    } catch (error) {
      // Silently handle error without console.error
    }
  };

  const goToHome = () => {
    navigation.navigate('HomeContent');
  };

  const renderStyledResponse = (text: string) => {
    const sections = text.split('\n');
    return sections.map((section, index) => {
      // What's Growing section
      if (section.includes("What's Growing?") && section.includes('نبات')) {
        const title = section.replace(/##/g, '').trim();
        return (
          <View key={index} style={styles.sectionWrapper}>
            <View style={styles.sectionTitleWrapper}>
              <Ionicons name="leaf-outline" size={24} color={theme.colors.primary.dark} />
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={styles.divider} />
          </View>
        );
      }

      // Health Report section
      else if (section.includes('++')) {
        const content = section.replace(/\+\+/g, '').trim();
        return (
          <View key={index} style={styles.healthReportWrapper}>
            <Text style={styles.healthReport}>{content}</Text>
            <View style={styles.iconContainer}>
              <Ionicons
                name="medical"
                size={20}
                color={theme.colors.secondary.base}
                style={styles.iconRTL}
              />
            </View>
          </View>
        );
      }

      // Plant Care Plan section
      else if (section.includes('>>') && section.includes('<<')) {
        const content = section.replace(/>>/g, '').replace(/<</g, '').trim();
        return (
          <View key={index} style={styles.carePlanWrapper}>
            <Text style={styles.carePlan}>{content}</Text>
            <Ionicons
              name="leaf"
              size={20}
              color={theme.colors.primary.dark}
              style={styles.iconRTL}
            />
          </View>
        );
      }

      // Bug Control section
      else if (section.includes('||') && section.includes('Bug Control')) {
        const content = section.replace(/\|\|/g, '').trim();
        return (
          <View key={index} style={styles.bugControlWrapper}>
            <Text style={styles.bugControl}>{content}</Text>
            <Ionicons
              name="bug"
              size={20}
              color={theme.colors.warning.dark}
              style={styles.iconRTL}
            />
          </View>
        );
      }

      // Mistakes section
      else if (section.includes('--')) {
        const content = section.replace(/--/g, '').trim();
        return (
          <View key={index} style={styles.mistakesWrapper}>
            <Text style={styles.mistakes}>{content}</Text>
            <View style={styles.iconContainer}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={theme.colors.error.base}
                style={styles.iconRTL}
              />
            </View>
          </View>
        );
      }

      // Keep Thriving section
      else if (section.includes('~~')) {
        const content = section.replace(/~~/g, '').trim();
        return (
          <View key={index} style={styles.thrivingWrapper}>
            <Text style={styles.thriving}>{content}</Text>
            <Ionicons
              name="sunny"
              size={20}
              color={theme.colors.success.base}
              style={styles.iconRTL}
            />
          </View>
        );
      }

      // Handle italic text and ## markers within regular text
      else {
        // Check if the section contains numbered items
        if (/^\d+\./.test(section)) {
          return (
            <View key={index} style={styles.listContainer}>
              {section.split('\n').map((line, i) => (
                <View key={i} style={styles.numberedListItem}>
                  <Text style={styles.numberedText}>{line}</Text>
                </View>
              ))}
            </View>
          );
        }

        // Handle both italic and ## markers
        const parts = section.split(/(##[^#]+##|_[^_]+_)/g);

        return (
          <Text key={index} style={styles.responseText}>
            {parts.map((part, i) => {
              if (part.startsWith('##') && part.endsWith('##')) {
                const content = part.slice(2, -2);
                return (
                  <Text key={i} style={styles.highlightedText}>
                    {content}
                  </Text>
                );
              } else if (part.startsWith('_') && part.endsWith('_')) {
                return (
                  <Text key={i} style={styles.italicText}>
                    {part.slice(1, -1)}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary.base} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Details</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={goToHome} style={styles.homeButton}>
            <Ionicons name="home-outline" size={24} color={theme.colors.primary.base} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color={theme.colors.primary.base} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`,
            }}
            style={styles.image}
          />
          <Text style={styles.dateText}>{formatDate(scan.createdAt)}</Text>
        </View>

        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>Analysis Results</Text>
          {renderStyledResponse(aiResponse)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray.lighter,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeButton: {
    padding: 8,
    marginRight: 8,
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    padding: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    marginTop: 4,
  },
  responseContainer: {
    padding: 16,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  responseTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginBottom: 16,
  },
  responseText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    lineHeight: 24,
    marginBottom: 8,
  },
  sectionWrapper: {
    backgroundColor: theme.colors.primary.lighter,
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary.base,
    elevation: 3,
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.dark,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  divider: {
    height: 2,
    backgroundColor: theme.colors.primary.light,
    marginVertical: 4,
  },
  healthReportWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary.lighter,
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: theme.colors.secondary.light,
    elevation: 3,
  },
  healthReport: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.secondary.dark,
    textAlign: 'right',
    lineHeight: 24,
  },
  carePlanWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.lighter,
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary.light,
    elevation: 2,
  },
  carePlan: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.dark,
    textAlign: 'right',
  },
  bugControlWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning.lighter,
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.warning.light,
  },
  bugControl: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.warning.dark,
    textAlign: 'right',
  },
  mistakesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error.lighter,
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: theme.colors.error.light,
    elevation: 3,
  },
  mistakes: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.error.dark,
    textAlign: 'right',
    lineHeight: 24,
  },
  thrivingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success.lighter,
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: theme.colors.success.light,
    elevation: 2,
  },
  thriving: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.success.dark,
    textAlign: 'right',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 4,
    marginLeft: 8,
  },
  iconRTL: {
    marginLeft: 0,
    marginRight: 8,
  },
  italicText: {
    fontStyle: 'italic',
    color: theme.colors.primary.dark,
    fontFamily: theme.fonts.mediumItalic,
    backgroundColor: theme.colors.primary.lighter,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  listContainer: {
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  numberedListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 4,
  },
  numberedText: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
    lineHeight: 24,
  },
  highlightedText: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.dark,
    backgroundColor: theme.colors.primary.lighter,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default ScanDetailsScreen;
