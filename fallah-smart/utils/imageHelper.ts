import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the backend URL from environment variables
const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

// Default placeholder images
export const PLACEHOLDER_IMAGES = {
  PROFILE: 'https://via.placeholder.com/100',
  POST: 'https://via.placeholder.com/300',
  DEFAULT: 'https://via.placeholder.com/200',
};

/**
 * Formats an image URL correctly for the app
 * 
 * @param imageUrl - The image URL or path from the backend
 * @param type - The type of image (profile, post, etc.) to use appropriate placeholder
 * @returns A properly formatted URL
 */
export const getImageUrl = (
  imageUrl: string | undefined,
  type: 'profile' | 'post' | 'default' = 'default'
): string => {
  const logPrefix = `[ImageHelper] [${type}]`;
  
  // Select the appropriate placeholder based on type
  let placeholder = PLACEHOLDER_IMAGES.DEFAULT;
  if (type === 'profile') placeholder = PLACEHOLDER_IMAGES.PROFILE;
  if (type === 'post') placeholder = PLACEHOLDER_IMAGES.POST;
  
  // Handle missing URLs
  if (!imageUrl) {
    console.log(`${logPrefix} No image URL provided, using placeholder`);
    return placeholder;
  }

  console.log(`${logPrefix} Original image URL:`, imageUrl);

  // If the URL already starts with http, it's a full URL, return as is
  if (imageUrl.startsWith('http')) {
    console.log(`${logPrefix} Full URL detected, returning as is:`, imageUrl);
    return imageUrl;
  }

  // For relative paths, ensure we don't add an extra slash
  console.log(`${logPrefix} BASE_URL value:`, BASE_URL);
  
  let fullUrl;
  if (imageUrl.startsWith('/')) {
    fullUrl = `${BASE_URL}${imageUrl}`;
  } else {
    fullUrl = `${BASE_URL}/${imageUrl}`;
  }
  
  console.log(`${logPrefix} Constructed full URL:`, fullUrl);
  return fullUrl;
};

/**
 * Handles errors when loading images
 * 
 * @param error - The error object
 * @param context - Additional context to identify where the error occurred
 * @param fallbackUrl - URL to use if the image fails to load
 * @returns The fallback URL
 */
export const handleImageError = (
  error: any,
  context: string,
  fallbackUrl: string = PLACEHOLDER_IMAGES.DEFAULT
): string => {
  // Only log to console if in development mode
  if (__DEV__) {
    // Using console.debug instead of console.error to reduce noise
    console.debug(`[ImageError] ${context}: Silent handling`);
  }
  // Return the fallback URL without logging the error details
  return fallbackUrl;
}; 