import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../theme/colors';

export const OnboardingCarouselItem = ({ item, i18n }) => {
  const getLocalizedText = (englishKey, hindiKey, tamilKey, teluguKey, kannadaKey, gujaratiKey, bengaliKey, punjabiKey, urduKey, malyalamKey, odiaKey ) => {
    if (i18n.language === 'hi') return hindiKey;
    if (i18n.language === 'ta') return tamilKey;
    if (i18n.language === 'te') return teluguKey;
    if (i18n.language === 'ta') return tamilKey;
    if (i18n.langiage === 'ka') return kannadaKey;
    if (i18n.language === 'gu') return gujaratiKey;
    if (i18n.language === 'bn') return bengaliKey;
    if (i18n.language === 'ml') return malyalamKey;
    if (i18n.language === 'or') return odiaKey;
    if (i18n.language === 'pa') return punjabiKey;
    if (i18n.language === 'ur') return urduKey;
    return englishKey;
  };

  return (
    <View
      style={[
        styles.carouselItem,
        { backgroundColor: item.backgroundColor }
      ]}
    >
      {/* Icon Container - Professional */}
      <View style={[styles.iconContainer, { borderColor: item.accentColor }]}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: item.accentColor }]}>
        {getLocalizedText(item.title, item.titleHi, item.titleTa, item.titleUr)}
      </Text>

      {/* Description */}
      <Text style={styles.description}>
        {getLocalizedText(item.description, item.descriptionHi, item.descriptionTa)}
      </Text>

      {/* Features List - Professional */}
      <View style={styles.featuresContainer}>
        {item.features && item.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>
              {getLocalizedText(feature.en, feature.hi, feature.ta)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  VoiceFeedback: {
    padding: 20,
    margin: 10,
    textAlign: 'bottom-right',
  }
});
