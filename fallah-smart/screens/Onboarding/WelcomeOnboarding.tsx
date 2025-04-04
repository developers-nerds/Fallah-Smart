import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { StockStackParamList } from '../../navigation/types';

// Define the navigation type
type WelcomeOnboardingNavigationProp = NativeStackNavigationProp<StockStackParamList>;

// Define feature item type
interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconType: string;
  iconBackground: string;
  image: any;
}

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Define the feature data
const features = [
  {
    id: '1',
    title: 'إدارة المخزون',
    description: 'تتبع المنتجات والمواد بكفاءة عالية. تلقي إشعارات عند انخفاض المخزون.',
    icon: 'package-variant',
    iconType: 'material',
    iconBackground: '#4CAF50',
    image: require('../../assets/images/onboarding/stock management.png'),
  },
  {
    id: '2',
    title: 'السوق الإلكتروني',
    description: 'بيع منتجاتك وشراء المستلزمات بسهولة من المزارعين والموردين الآخرين.',
    icon: 'shopping',
    iconType: 'material',
    iconBackground: '#2196F3',
    image: require('../../assets/images/onboarding/market place.png'),
  },
  {
    id: '3',
    title: 'المساعد الذكي',
    description: 'الحصول على نصائح زراعية متخصصة من مساعدنا الذكي المدعوم بالذكاء الاصطناعي.',
    icon: 'robot',
    iconType: 'material',
    iconBackground: '#9C27B0',
    image: require('../../assets/images/onboarding/IA chat.png'),
  },
  {
    id: '4',
    title: 'فحص المحاصيل والأمراض',
    description: 'التعرف على الأمراض والآفات في محاصيلك من خلال التقاط صورة بسيطة.',
    icon: 'scanner',
    iconType: 'material',
    iconBackground: '#FF5722',
    image: require('../../assets/images/onboarding/Crop and disease scanning.png'),
  },
  {
    id: '5',
    title: 'المحفظة الإلكترونية',
    description: 'تتبع معاملاتك المالية وإدارة مبيعاتك ومشترياتك بسهولة.',
    icon: 'wallet',
    iconType: 'material',
    iconBackground: '#F44336',
    image: require('../../assets/images/onboarding/wallet.png'),
  },
  {
    id: '6',
    title: 'الطقس والزراعة',
    description: 'الحصول على توقعات الطقس والنصائح الزراعية المخصصة لمنطقتك.',
    icon: 'weather-sunny',
    iconType: 'material',
    iconBackground: '#FF9800',
    image: require('../../assets/images/onboarding/weather.png'),
  },
  {
    id: '7',
    title: 'القاموس والتعلم',
    description: 'تعلم تقنيات زراعية جديدة ومصطلحات من خلال قاموسنا ومكتبة المعرفة.',
    icon: 'book-open-variant',
    iconType: 'material',
    iconBackground: '#3F51B5',
    image: require('../../assets/images/onboarding/Dictionary and learning resources.png'),
  },
];

const WelcomeOnboarding = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<WelcomeOnboardingNavigationProp>();

  // Function to handle skip
  const handleSkip = () => {
    navigation.navigate('Login'); // Navigate to login screen
  };

  // Function to handle next
  const handleNext = () => {
    if (currentIndex < features.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ animated: true, index: nextIndex });
      setCurrentIndex(nextIndex);
    } else {
      handleSkip(); // If it's the last slide, go to login
    }
  };

  // Function to render each slide
  const renderSlide = ({ item, index }: { item: FeatureItem; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <Image source={item.image} style={styles.image} resizeMode="contain" />
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  // Render pagination indicators
  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        <View style={styles.dotsContainer}>
          {features.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 20, 8],
              extrapolate: 'clamp',
            });

            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor:
                      index === currentIndex
                        ? theme.colors.primary.base
                        : theme.colors.neutral.gray.base,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>مرحباً بك في تطبيق فلاح SMART</Text>
        <Text style={styles.subtitleText}>اكتشف كيف يمكن لتطبيقنا مساعدتك</Text>
      </View>
      
      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={features}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Pagination */}
      {renderPagination()}

      {/* Navigation buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.skipButtonBottom]} 
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonBottomText}>تخطي</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.nextButton]} 
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === features.length - 1 ? 'ابدأ الآن' : 'التالي'}
          </Text>
          {currentIndex === features.length - 1 ? (
            <AntDesign name="checkcircle" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          ) : (
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.dark,
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    padding: 20,
    justifyContent: 'center',
  },
  imageContainer: {
    width: width * 0.8,
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  button: {
    borderRadius: theme.borderRadius.medium,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  nextButton: {
    backgroundColor: theme.colors.primary.base,
    width: '65%',
  },
  skipButtonBottom: {
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
    backgroundColor: 'transparent',
    width: '30%',
  },
  skipButtonBottomText: {
    color: theme.colors.primary.base,
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
  },
  nextButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.button,
    fontFamily: theme.fonts.medium,
  },
});

export default WelcomeOnboarding; 