import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone SE)
const baseWidth = 320;
const baseHeight = 568;

// Scaling factors
const widthScale = SCREEN_WIDTH / baseWidth;
const heightScale = SCREEN_HEIGHT / baseHeight;

// Use the smaller scale for fonts to prevent too large text on wider devices
const scale = Math.min(widthScale, heightScale);

export const normalize = (size: number) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

export const scaleSize = (size: number) => {
  return Math.round(size * scale);
};

export const isSmallDevice = SCREEN_WIDTH < 375;
export const isLargeDevice = SCREEN_WIDTH >= 768;

export const responsivePadding = (size: number) => {
  if (isSmallDevice) return size * 0.8;
  if (isLargeDevice) return size * 1.2;
  return size;
};

export const responsiveWidth = (percentage: number) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

export const responsiveHeight = (percentage: number) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};
