import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  I18nManager,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { TextInput } from '../../../components/TextInput';
import { TOOL_TYPES, TOOL_STATUS, TOOL_CONDITION, TOOL_ICONS, ToolType, ToolStatus, ToolCondition } from './constants';
import { storage } from '../../../utils/storage';
import axios from 'axios';
import { Animated } from 'react-native';
import { API_URL } from '../../../config/api';
import { withRetry } from '../../../services/api';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type ToolListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'ToolList'>;
};

interface Tool {
  id: string;
  name: string;
  quantity: number;
  minQuantityAlert: number;
  category: ToolType;
  status: ToolStatus;
  condition: ToolCondition;
  purchaseDate: string | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  maintenanceInterval: number | null;
  brand: string;
  model: string;
  purchasePrice: number | null;
  replacementCost: number | null;
  storageLocation: string;
  assignedTo: string;
  maintenanceNotes: string;
  usageInstructions: string;
  safetyGuidelines: string;
}

const ToolCard: React.FC<{
  tool: Tool;
  onPress: () => void;
  theme: any;
}> = ({ tool, onPress, theme }) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.neutral.surface,
          borderRadius: theme.borderRadius.medium,
          padding: 16,
          marginBottom: 12,
          ...theme.shadows.medium
        }
      ]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={[
          {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.colors.neutral.textPrimary 
          }
        ]}>
          {TOOL_ICONS.basic.name} {tool.name}
        </Text>
        <View style={styles.statusContainer}>
          <Text style={[
            {
              fontSize: 14,
              color: tool.status === 'available' ? theme.colors.success : theme.colors.error,
              backgroundColor: tool.status === 'available' ? theme.colors.success + '10' : theme.colors.error + '10',
              padding: 8,
              borderRadius: theme.borderRadius.medium
            }
          ]}>
            {tool.status === 'available' ? 'متاح' : 'غير متاح'}
          </Text>
        </View>
      </View>

      <View style={[styles.cardContent, { gap: 12 }]}>
        <View style={[
          styles.infoRow,
          {
            backgroundColor: theme.colors.neutral.background,
            padding: 12,
            borderRadius: theme.borderRadius.medium
          }
        ]}>
          <Text style={[
            { 
              fontSize: 14,
              color: theme.colors.neutral.textSecondary 
            }
          ]}>
            {TOOL_ICONS.basic.category} {TOOL_TYPES[tool.category].name}
          </Text>
          <Text style={[
            { 
              fontSize: 14,
              color: theme.colors.neutral.textPrimary 
            }
          ]}>
            {TOOL_ICONS.basic.quantity} {tool.quantity}
          </Text>
        </View>

        <View style={[
          styles.infoRow,
          {
            backgroundColor: theme.colors.neutral.background,
            padding: 12,
            borderRadius: theme.borderRadius.medium
          }
        ]}>
          <Text style={[
            { 
              fontSize: 14,
              color: theme.colors.neutral.textSecondary 
            }
          ]}>
            {TOOL_ICONS.basic.condition} {TOOL_CONDITION[tool.condition].name}
          </Text>
          {tool.storageLocation && (
            <Text style={[
              { 
                fontSize: 14,
                color: theme.colors.neutral.textPrimary 
              }
            ]}>
              {TOOL_ICONS.location.storage} {tool.storageLocation}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ToolListScreen: React.FC<ToolListScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolType | null>(null);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      setError(null);
      const tokens = await storage.getTokens();
      
      const response = await withRetry(async () => {
        return axios.get(
          `${API_URL}/stock/tools`,
          {
            headers: {
              'Authorization': `Bearer ${tokens?.access}`
            }
          }
        );
      }, 3, 1500);

      if (response.data) {
        setTools(response.data);
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
      if (error.message && error.message.includes('فشل الاتصال بالخادم')) {
        setError(error.message);
      } else {
        setError('فشل في تحميل الأدوات');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.storageLocation?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || tool.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const renderEmptyState = () => (
    <View style={[styles.emptyState, { backgroundColor: theme.colors.neutral.background }]}>
      <Text style={[
        styles.emptyStateText,
        theme.typography.arabic.h2,
        { color: theme.colors.neutral.textSecondary }
      ]}>
        {TOOL_ICONS.basic.tools} لا توجد أدوات
      </Text>
      <TouchableOpacity
        style={[
          styles.addButton,
          {
            backgroundColor: theme.colors.primary.base,
            ...theme.shadows.medium
          }
        ]}
        onPress={() => navigation.navigate('AddTool')}
      >
        <Text style={[
          theme.typography.arabic.body,
          { color: theme.colors.neutral.surface }
        ]}>
          إضافة أداة جديدة
            </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <Text style={{ color: theme.colors.neutral.textSecondary }}>جاري التحميل...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <Text style={{ color: theme.colors.error }}>{error}</Text>
        <Button title="إعادة المحاولة" onPress={fetchTools} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { borderBottomColor: theme.colors.neutral.border, borderBottomWidth: 1 }]}>
        <TextInput
          placeholder="بحث عن أداة..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.neutral.surface,
              borderColor: theme.colors.neutral.border,
              ...theme.shadows.small
            }
          ]}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilters}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              {
                backgroundColor: !selectedCategory ? theme.colors.primary.base : theme.colors.neutral.surface,
                borderColor: theme.colors.primary.base,
                borderWidth: 1,
                ...theme.shadows.small
              }
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              theme.typography.arabic.body,
              {
                color: !selectedCategory ? theme.colors.neutral.surface : theme.colors.primary.base
              }
            ]}>
              الكل
            </Text>
          </TouchableOpacity>
          {Object.entries(TOOL_TYPES).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === key ? theme.colors.primary.base : theme.colors.neutral.surface,
                  borderColor: theme.colors.primary.base,
                  borderWidth: 1,
                  ...theme.shadows.small
                }
              ]}
              onPress={() => setSelectedCategory(key as ToolType)}
            >
              <Text style={[
                theme.typography.arabic.body,
                {
                  color: selectedCategory === key ? theme.colors.neutral.surface : theme.colors.primary.base
                }
              ]}>
                {value.icon} {value.name}
              </Text>
        </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTools}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ToolCard
            tool={item}
            onPress={() => navigation.navigate('ToolDetail', { id: item.id })}
            theme={theme}
          />
        )}
        contentContainerStyle={[
          styles.list,
          { padding: theme.spacing.md }
        ]}
        ListEmptyComponent={renderEmptyState}
      />

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary.base,
            ...theme.shadows.large
          }
        ]}
        onPress={() => navigation.navigate('AddTool')}
      >
        <Text style={[styles.fabText, { color: theme.colors.neutral.surface }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    gap: 16,
  },
  searchInput: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    fontSize: 16,
  },
  categoryFilters: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  list: {
    gap: 12,
    padding: 16,
  },
  card: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    padding: 24,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
});

export default ToolListScreen; 