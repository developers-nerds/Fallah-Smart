import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export default {
  pickImageFromGallery: async (): Promise<string | null> => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need gallery access to upload images. Please allow permission in settings.',
        [{ text: 'OK' }]
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  },
};
