import { Platform } from 'react-native';

// Export a single universally safe function
export async function getImageBase64(uri) {
  if (Platform.OS === 'web') {
    // Web: Use fetch + FileReader
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new window.FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    // Native: Only require when needed
    const FileSystem = require('expo-file-system');
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
}
