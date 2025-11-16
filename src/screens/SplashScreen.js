import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { colors, spacing } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    let timer;

    // FORCE RESET BACKEND URL EVERY TIME APP LOADS
    const clearAndSetBackendUrl = async () => {
      try {
        // Remove any old value
        await AsyncStorage.removeItem('backendUrl');
        // Set the new Render backend URL
        const newBackendUrl = 'https://kisanpushti-backend.onrender.com';
        await AsyncStorage.setItem('backendUrl', newBackendUrl);
        console.log('✅ Backend URL forcibly set to:', newBackendUrl);

        // Wait 2 seconds then navigate to Language Selection
        timer = setTimeout(() => {
          console.log('📍 Navigating to LanguageSelection...');
          navigation.replace('LanguageSelectionScreen');
        }, 2000);
      } catch (error) {
        console.error('❌ SplashScreen Error:', error);
        timer = setTimeout(() => {
          navigation.replace('LanguageSelectionScreen');
        }, 1500);
      }
    };

    clearAndSetBackendUrl();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.emoji}>🌾</Text>
        </View>
        <Text style={styles.appName}>Kisan Pushti</Text>
        <Text style={styles.tagline}>Nourish Your Crop, Secure Your Future</Text>
      </View>
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    alignItems: 'center'
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  emoji: {
    fontSize: 40
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center'
  },
  loader: {
    marginTop: spacing.xl
  }
});

export default SplashScreen;
