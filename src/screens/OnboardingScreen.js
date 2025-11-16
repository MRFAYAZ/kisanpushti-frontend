import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../theme/colors';
import { onboardingData } from '../constants/onboardingData';
import { VoiceAssistantToggle } from '../components/VoiceAssistantToggle';
import { VoiceService } from '../services/voiceAssistant';

const { width } = Dimensions.get('window');

const OnboardingCarouselItem = ({ item, i18n, t }) => {
  const getLocalizedText = (en, hi, ta, te, ml, mr, ka, ur, pa, gu) => {
    if (i18n.language === 'hi') return hi;
    if (i18n.language === 'ta') return ta;
    if (i18n.language === 'te') return te;
    if (i18n.language === 'ml') return ml;
    if (i18n.language === 'mr') return mr;
    if (i18n.language === 'ka') return ka;
    if (i18n.language === 'ur') return ur;
    if (i18n.language === 'pa') return pa;
    if (i18n.language === 'gu') return gu;
    return en;
  };

  return (
    <View
      style={[
        styles.carouselItem,
        { backgroundColor: item.backgroundColor }
      ]}
    >
      <View style={[styles.iconContainer, { borderColor: item.accentColor }]}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <Text style={[styles.title, { color: item.accentColor }]}>
        {getLocalizedText(item.title, item.titleHi, item.titleTa, item.titleTe)}
      </Text>
      <Text style={styles.description}>
        {getLocalizedText(item.description, item.descriptionHi, item.descriptionTa, item.descriptionTe)}
      </Text>
      <View style={styles.featuresContainer}>
        {item.features && item.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>
              {getLocalizedText(feature.en, feature.hi, feature.ta, feature.te)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const OnboardingScreen = ({ navigation }) => {
  const { i18n, t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const currentItem = onboardingData[activeIndex];
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  // Voice prompt on slide change, only when toggle is ON
  useEffect(() => {
    if (isVoiceEnabled) {
      const msg = currentItem.title || t('welcome');
      VoiceService.speak(typeof msg === 'string' ? msg : '', i18n.language);
    }
    // eslint-disable-next-line
  }, [activeIndex, isVoiceEnabled, i18n.language]);

  const handleVoiceToggle = (enabled) => {
    setIsVoiceEnabled(enabled);
    if (enabled) {
      VoiceService.speak(currentItem.title || t('welcome'), i18n.language);
    } else {
      VoiceService.stop();
    }
  };

  const handleNext = () => {
    if (activeIndex < onboardingData.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      navigation.replace('UserDetailsScreen');
    }
  };

  const handlePrevious = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleSkip = () => {
    navigation.replace('UserDetailsScreen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainCarouselContainer}>
        <OnboardingCarouselItem item={currentItem} i18n={i18n} t={t} />
      </View>

      <View style={styles.progressSection}>
        <View style={styles.dotsContainer}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
                { 
                  backgroundColor: index === activeIndex 
                    ? currentItem.accentColor 
                    : colors.border 
                }
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          {activeIndex + 1} {t('of')} {onboardingData.length}
        </Text>
      </View>

      <View style={styles.buttonSection}>
        {activeIndex > 0 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevious}
          >
            <Text style={styles.navButtonText}>{t('previous')}</Text>
          </TouchableOpacity>
        )}

        {!currentItem.isLastSlide && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>{t('skip')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: currentItem.accentColor }
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentItem.isLastSlide ? t('get_started') : t('next')}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.voiceFab}>
        <VoiceAssistantToggle onToggle={handleVoiceToggle} initialState={false} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface
  },
  mainCarouselContainer: {
    flex: 1,
    width: '100%'
  },
  carouselItem: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface
  },
  icon: {
    fontSize: 40,
    fontWeight: 'bold'
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center'
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg
  },
  featuresContainer: {
    width: '100%',
    marginTop: spacing.md
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
    marginTop: 8
  },
  featureText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: spacing.sm
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  buttonSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm
  },
  navButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    minWidth: 80,
    alignItems: 'center'
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary
  },
  skipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary
  },
  nextButton: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface
  },
  voiceFab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    zIndex: 1000,
    elevation: 20
  }
});

export default OnboardingScreen;

