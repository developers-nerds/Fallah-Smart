import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import { theme } from '../../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

// Define the navigation type
type RootDrawerParamList = {
  HomeContent: { refreshScanHistory?: boolean } | undefined;
  Scan: undefined;
  ScanDetailsScreen: {
    scan: ScanItem;
    imageUrl: string;
    aiResponse: string;
  };
};

type NavigationProp = DrawerNavigationProp<RootDrawerParamList>;

interface ScanItem {
  id: number;
  imageUrl: string;
  ai_response: string;
  createdAt: string;
  picture?: string;
  picture_mime_type?: string;
}

const ScanHistoryScreen = () => {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '');

  useEffect(() => {
    fetchScanHistory();
  }, []);

  const fetchScanHistory = async () => {
    try {
      setLoading(true);
      const { accessToken } = await storage.getTokens();

      if (!accessToken) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${baseUrl}/api/scans/getScans`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log('Scan response data:', response.data);
      console.log('Base URL:', baseUrl);

      if (response.data && Array.isArray(response.data)) {
        setScans(response.data);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid data format received');
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching scan history:', err);
      setError('Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleScanPress = (scan: ScanItem) => {
    console.log('Scan item:', scan);
    console.log('Image URL:', scan.imageUrl);
    console.log('Full image URL:', `${baseUrl}${scan.imageUrl}`);

    navigation.navigate('ScanDetailsScreen', {
      scan: scan,
      imageUrl: scan.imageUrl,
      aiResponse: scan.ai_response,
    });
  };

  const goToHome = () => {
    navigation.navigate('HomeContent', { refreshScanHistory: true });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={styles.loadingText}>Loading scan history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={24} color={theme.colors.error.base} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (scans.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="leaf-outline" size={40} color={theme.colors.neutral.gray.base} />
        <Text style={styles.emptyText}>No scan history yet</Text>
        <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('Scan')}>
          <Text style={styles.scanButtonText}>Scan a plant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={goToHome}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary.base} />
          </TouchableOpacity>
          <Text style={styles.title}>Scan History</Text>
        </View>
        <TouchableOpacity onPress={fetchScanHistory}>
          <Ionicons name="refresh-outline" size={24} color={theme.colors.primary.base} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={scans}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.scanItem} onPress={() => handleScanPress(item)}>
            <Image
              source={{
                uri: item.imageUrl.startsWith('http')
                  ? item.imageUrl
                  : `${baseUrl}${item.imageUrl}`,
              }}
              style={styles.scanImage}
              resizeMode="cover"
              onError={(error) => console.log('Image loading error:', error.nativeEvent.error)}
            />
            <View style={styles.scanInfo}>
              <Text style={styles.scanDate}>{formatDate(item.createdAt)}</Text>
              <Text style={styles.scanSummary} numberOfLines={2}>
                Tap to view details
              </Text>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
  },
  listContent: {
    paddingBottom: 20,
  },
  scanItem: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanImage: {
    width: '100%',
    height: 180,
  },
  scanInfo: {
    padding: 16,
  },
  scanDate: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 4,
  },
  scanSummary: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.error.base,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 18,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
  },
  scanButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  scanButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: 16,
    fontFamily: theme.fonts.medium,
  },
});

export default ScanHistoryScreen;
