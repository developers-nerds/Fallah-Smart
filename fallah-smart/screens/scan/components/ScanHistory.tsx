import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import { theme } from '../../../theme/theme';
import { useNavigation } from '@react-navigation/native';

interface ScanItem {
  id: number;
  imageUrl: string;
  ai_response: string;
  createdAt: string;
  picture?: string;
  picture_mime_type?: string;
}

interface ScanHistoryProps {
  refreshTrigger?: number;
}

const ScanHistory: React.FC<ScanHistoryProps> = ({ refreshTrigger = 0 }) => {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '');

  useEffect(() => {
    fetchScanHistory();
  }, [refreshTrigger]);

  const fetchScanHistory = async () => {
    try {
      setLoading(true);
      const tokens = await storage.getTokens();
      
      if (!tokens.access) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${baseUrl}/api/scans/getScans`, {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
      });

      if (response.data && Array.isArray(response.data)) {
        setScans(response.data);
      } else {
        setError('Invalid data format received');
      }

      setError(null);
    } catch (err) {
      setError('Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  const extractSummary = (diagnosis: string) => {
    // Extract the first line or a summary from the diagnosis
    if (!diagnosis) return 'No diagnosis available';

    // Try to find the "What's Growing?" section
    if (diagnosis.includes("What's Growing?")) {
      const match = diagnosis.match(/What's Growing\?[^]+?([^\n]+)/);
      if (match && match[1]) return match[1].trim();
    }

    // Fallback to first line
    return diagnosis.split('\n')[0].substring(0, 50) + (diagnosis.length > 50 ? '...' : '');
  };

  const handleScanPress = (scan: ScanItem) => {
    navigation.navigate('ScanDetailsScreen', {
      scan: scan,
      imageUrl: scan.imageUrl,
      aiResponse: scan.ai_response,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary.base} />
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

  if (scans.length === 0 && !loading && !error) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Scan History</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('ScanHistoryScreen')}>
            <Text style={styles.viewAllText}>View all</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary.base} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={24} color={theme.colors.neutral.gray.base} />
          <Text style={styles.emptyText}>No scan history yet</Text>
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={() => navigation.navigate('Scan')}
          >
            <Text style={styles.scanButtonText}>Scan a plant</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Scans</Text>
        <TouchableOpacity onPress={fetchScanHistory}>
          <Ionicons name="refresh-outline" size={20} color={theme.colors.primary.base} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={scans.slice(0, 5)} // Show only the 5 most recent scans
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
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
              onError={() => {}}
            />
            <View style={styles.scanInfo}>
              <Text style={styles.scanDate}>{formatDate(item.createdAt)}</Text>
              {/* Only show a minimal preview in the home page */}
              <Text style={styles.scanSummary} numberOfLines={1}>
                Tap to view details
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => navigation.navigate('ScanHistoryScreen')}>
        <Text style={styles.viewAllText}>View all scans</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.primary.base} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
  },
  scanItem: {
    width: 160,
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scanImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  scanInfo: {
    padding: 10,
  },
  scanDate: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 4,
  },
  scanSummary: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.gray.lighter,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.base,
    marginRight: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  errorText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.error.base,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginBottom: 12,
  },
  scanButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  scanButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: 14,
    fontFamily: theme.fonts.medium,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
  },
});

export default ScanHistory;
