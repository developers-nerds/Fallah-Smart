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
  Alert,
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
  const [selectedScan, setSelectedScan] = useState<number | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedScans, setSelectedScans] = useState<number[]>([]);
  const navigation = useNavigation<NavigationProp>();
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '');

  useEffect(() => {
    fetchScanHistory();
  }, []);

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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleScanPress = (scan: ScanItem) => {
    navigation.navigate('ScanDetailsScreen', {
      scan: scan,
      imageUrl: scan.imageUrl,
      aiResponse: scan.ai_response,
    });
  };

  const goToHome = () => {
    navigation.navigate('HomeContent', { refreshScanHistory: true });
  };

  const handleLongPress = (scanId: number) => {
    setIsSelectionMode(true);
    setSelectedScans([scanId]);
  };

  const handleSelection = (scanId: number) => {
    if (isSelectionMode) {
      setSelectedScans((prev) =>
        prev.includes(scanId) ? prev.filter((id) => id !== scanId) : [...prev, scanId]
      );
    } else {
      handleScanPress(scans.find((scan) => scan.id === scanId)!);
    }
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedScans([]);
  };

  const handleDelete = async (scanIds: number[]) => {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      await Promise.all(
        scanIds.map((id) =>
          axios.delete(`${baseUrl}/api/scans/${id}`, {
            headers: {
              Authorization: `Bearer ${tokens.access}`,
            },
          })
        )
      );

      setScans((prevScans) => prevScans.filter((scan) => !scanIds.includes(scan.id)));
      Alert.alert('نجاح', 'تم حذف عمليات المسح المحددة بنجاح');
      cancelSelectionMode();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حذف عمليات المسح المحددة');
    }
  };

  const confirmDelete = (scanIds: number[]) => {
    const message =
      scanIds.length === 1
        ? 'هل أنت متأكد من حذف هذا المسح؟'
        : `هل أنت متأكد من حذف ${scanIds.length} عمليات مسح؟`;

    Alert.alert('حذف المسح', message, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        onPress: () => handleDelete(scanIds),
        style: 'destructive',
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={styles.loadingText}>جاري تحميل سجل المسح...</Text>
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
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={goToHome}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary.base} />
        </TouchableOpacity>
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={40} color={theme.colors.neutral.gray.base} />
          <Text style={styles.emptyText}>لا يوجد سجل مسح حتى الآن</Text>
          <View style={styles.emptyStateButtons}>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchScanHistory}>
              <Ionicons name="refresh-outline" size={24} color={theme.colors.primary.base} />
              <Text style={styles.refreshButtonText}>تحديث</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('Scan')}>
              <Text style={styles.scanButtonText}>مسح نبات</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isSelectionMode ? (
            <TouchableOpacity style={styles.backButton} onPress={cancelSelectionMode}>
              <Ionicons name="close" size={24} color={theme.colors.primary.base} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.backButton} onPress={goToHome}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.primary.base} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>
            {isSelectionMode ? `تم اختيار ${selectedScans.length} عناصر` : 'سجل المسح'}
          </Text>
        </View>
        {isSelectionMode ? (
          selectedScans.length > 0 && (
            <TouchableOpacity onPress={() => confirmDelete(selectedScans)}>
              <Ionicons name="trash-outline" size={24} color={theme.colors.error.base} />
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity onPress={fetchScanHistory}>
            <Ionicons name="refresh-outline" size={24} color={theme.colors.primary.base} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={scans}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.scanItem, selectedScans.includes(item.id) && styles.selectedScanItem]}
            onPress={() => handleSelection(item.id)}
            onLongPress={() => handleLongPress(item.id)}>
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
              <View style={styles.scanHeader}>
                <Text style={styles.scanDate}>{formatDate(item.createdAt)}</Text>
                {!isSelectionMode && (
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => confirmDelete([item.id])}>
                    <Ionicons
                      name="ellipsis-vertical"
                      size={20}
                      color={theme.colors.neutral.textSecondary}
                    />
                  </TouchableOpacity>
                )}
                {isSelectionMode && selectedScans.includes(item.id) && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary.base} />
                  </View>
                )}
              </View>
              <Text style={styles.scanSummary} numberOfLines={2}>
                انقر للمزيد من التفاصيل
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
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
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
  menuButton: {
    padding: 4,
    borderRadius: 15,
  },
  selectedScanItem: {
    backgroundColor: theme.colors.primary.lighter,
    borderWidth: 2,
    borderColor: theme.colors.primary.base,
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 12,
    padding: 0,
  },
  emptyStateButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
  },
  refreshButtonText: {
    color: theme.colors.primary.base,
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    marginLeft: 8,
  },
});

export default ScanHistoryScreen;
