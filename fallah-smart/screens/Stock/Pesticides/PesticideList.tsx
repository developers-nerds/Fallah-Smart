import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
  FadeInDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { usePesticide } from '../../../context/PesticideContext';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { Button as CustomButton } from '../../../components/Button';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/StockNavigator';

type PesticideListProps = {
  navigation: StackNavigationProp<StockStackParamList, 'PesticideList'>;
};

export const PesticideList = ({ navigation }: PesticideListProps) => {
  const theme = useTheme();
  const { pesticides, loading, error, refreshPesticides } = usePesticide();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollY = useSharedValue(0);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshPesticides();
    } catch (error) {
      console.error('Error refreshing pesticides:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshPesticides]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.9],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      backgroundColor: theme.colors.neutral.surface,
    };
  });

  const filteredPesticides = useMemo(() => {
    return pesticides.filter(pesticide =>
      pesticide.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pesticides, searchQuery]);

  if (loading && !pesticides.length) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <MaterialCommunityIcons 
          name="flask-empty-outline" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <CustomButton 
          title="Réessayer" 
          onPress={refreshPesticides}
          variant="primary"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          Pesticides
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddPesticide')}
        >
          <Feather name="plus" size={24} color={theme.colors.primary.base} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
          />
        }
      >
        <View style={styles.content}>
          {filteredPesticides.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons 
                name="flask-empty-outline" 
                size={64} 
                color={theme.colors.neutral.textSecondary} 
              />
              <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
                {searchQuery ? 'Aucun pesticide trouvé' : 'Aucun pesticide enregistré'}
              </Text>
              <CustomButton 
                title="Ajouter un pesticide" 
                onPress={() => navigation.navigate('AddPesticide')}
                variant="primary"
              />
            </View>
          ) : (
            <View style={styles.pesticideGrid}>
              {filteredPesticides.map((pesticide, index) => (
                <Animated.View
                  key={pesticide.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                >
                  <TouchableOpacity
                    style={[styles.pesticideCard, { backgroundColor: theme.colors.neutral.surface }]}
                    onPress={() => navigation.navigate('PesticideDetail', { pesticideId: pesticide.id })}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <MaterialCommunityIcons
                          name="flask-outline"
                          size={24}
                          color={pesticide.isNatural ? theme.colors.success : theme.colors.accent.base}
                        />
                        <Text style={[styles.pesticideName, { color: theme.colors.neutral.textPrimary }]}>
                          {pesticide.name}
                        </Text>
                      </View>
                      {pesticide.isNatural && (
                        <View style={[styles.naturalBadge, { backgroundColor: theme.colors.success }]}>
                          <Feather name="leaf" size={12} color="#FFF" />
                          <Text style={styles.naturalText}>Naturel</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.pesticideInfo}>
                      <View style={styles.infoRow}>
                        <View style={styles.quantityContainer}>
                          <MaterialCommunityIcons
                            name="package-variant"
                            size={20}
                            color={pesticide.quantity <= pesticide.lowStockThreshold 
                              ? theme.colors.error 
                              : theme.colors.success}
                          />
                          <Text style={[styles.quantity, { 
                            color: pesticide.quantity <= pesticide.lowStockThreshold 
                              ? theme.colors.error 
                              : theme.colors.success 
                          }]}>
                            {pesticide.quantity} {pesticide.unit}
                          </Text>
                        </View>
                        {pesticide.quantity <= pesticide.lowStockThreshold && (
                          <View style={[styles.warningBadge, { backgroundColor: theme.colors.error }]}>
                            <MaterialCommunityIcons name="alert" size={16} color="#FFF" />
                            <Text style={styles.warningText}>Stock faible</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.infoRow}>
                        <View style={styles.targetContainer}>
                          <MaterialCommunityIcons
                            name="bug-outline"
                            size={20}
                            color={theme.colors.neutral.textSecondary}
                          />
                          <Text style={[styles.targetText, { color: theme.colors.neutral.textSecondary }]}>
                            {pesticide.target || 'Cible non spécifiée'}
                          </Text>
                        </View>
                        {pesticide.waitingPeriod && (
                          <View style={styles.waitingPeriodContainer}>
                            <MaterialCommunityIcons
                              name="clock-outline"
                              size={20}
                              color={theme.colors.warning}
                            />
                            <Text style={[styles.waitingPeriodText, { color: theme.colors.warning }]}>
                              {pesticide.waitingPeriod} jours
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowColor: '#000000',
    zIndex: 1000,
  } as ViewStyle,
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginVertical: 16,
    textAlign: 'center',
  },
  pesticideGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  pesticideCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pesticideName: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
  },
  naturalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  naturalText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: theme.fonts.medium,
  },
  pesticideInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantity: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  warningText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: theme.fonts.medium,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetText: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
  },
  waitingPeriodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waitingPeriodText: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
}));

export default PesticideList;