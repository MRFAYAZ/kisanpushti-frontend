import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../theme/colors';
import { useVoice } from '../contexts/voiceContext';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', confirmText: 'You have selected English. Press continue to proceed.' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', confirmText: 'आपने हिंदी चुना है। आगे बढ़ने के लिए जारी रखें दबाएं।' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', confirmText: 'మీరు తెలుగు ఎంచుకున్నారు। కొనసాగించడానికి కొనసాగించు నొక్కండి।' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', confirmText: 'நீங்கள் தமிழ் தேர்ந்தெடுத்துள்ளீர்கள்। தொடர பொத்தானைக் கிளிக் செய்யவும்।' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', confirmText: 'ನೀವು ಕನ್ನಡವನ್ನು ಆರಿಸಿದ್ದೀರಿ. ಮುಂದುವರಿಯಲು ಮುಂದುವರಿ ಕ್ಲಿಕ್ ಮಾಡಿ.' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', confirmText: 'നിങ്ങൾ മലയാളം തിരഞ്ഞെടുത്തു. തുടരാൻ തുടരുക ക്ലിക്ക് ചെയ്യുക.' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', confirmText: 'तुम्हाले मराठी निवडले आहे. पुढे जाण्यासाठी सुरू ठेवा दाबा.' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', confirmText: 'તમે ગુજરાતી પસંદ કર્યું છે. આગળ વધવા માટે ચાલુ રાખો દબાવો.' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', confirmText: 'ਤੁਸ ਪੰਜਾਬੀ ਚੁਣੀ ਹੈ। ਅੱਗੇ ਵਧਣ ਲਈ ਜਾਰੀ ਰੱਖੋ ਦਬਾਓ।' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', confirmText: 'আপনি বাংলা নির্বাচন করেছেন। এগিয়ে যেতে চালিয়ে যান ক্লিক করুন।' },
  { code: 'or', name: 'Odia', native: 'ଓଡିଆ', confirmText: 'ଆପଣ ଓଡିଆ ଚୟନ କରିଛନ୍ତି। ଅଗ୍ରଗତି ଜାରି ଠାପିଅନ୍ତୁ।' },
  { code: 'ur', name: 'Urdu', native: 'اردو', confirmText: 'آپ نے اردو منتخب کیا ہے۔ آگے بڑھنے کے لیے جاری رکھیں کو دبائیں۔' },
];

export const LanguageSelectionScreen = ({ navigation }) => {
  const { i18n, t } = useTranslation();
  const { isVoiceEnabled, toggleVoice, speak, stop, changeLanguage } = useVoice();

  const [selectedLang, setSelectedLang] = useState('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const saved = await AsyncStorage.getItem('userLanguage');
        if (saved) setSelectedLang(saved);
        else setSelectedLang('en');
      } catch {}
      setIsLoading(false);
    };
    init();
  }, []);

  const handleLanguageSelect = async (langCode) => {
    try {
      setIsProcessing(true);
      await stop();
      await i18n.changeLanguage(langCode);
      await AsyncStorage.setItem('userLanguage', langCode);
      await changeLanguage(langCode);
      setSelectedLang(langCode);

      await new Promise(resolve => setTimeout(resolve, 200));
      const langObj = LANGUAGES.find(l => l.code === langCode);
      const speakText = langObj?.confirmText || 'Language selected. Continue to proceed.';
      if (isVoiceEnabled) await speak(speakText, langCode);
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
    }
  };

  const handleContinue = async () => {
    try {
      if (isVoiceEnabled) {
        await speak('Proceeding to onboarding.', selectedLang);
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      navigation.navigate('OnboardingScreen');
    } catch {
      navigation.navigate('OnboardingScreen');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Voice Toggle Button - Top Right */}
        <View style={styles.voiceRow}>
          <Text style={styles.voiceTip}>{isVoiceEnabled ? 'Voice: ON' : 'Voice: OFF'}</Text>
          <TouchableOpacity style={styles.voiceToggleBtn} onPress={toggleVoice}>
            <Text style={[styles.voiceIcon, isVoiceEnabled && { color: colors.primary }]}>
              {isVoiceEnabled ? '🔊' : '🔇'}
            </Text>
            <Text style={styles.voiceToggleText}>{isVoiceEnabled ? 'Disable' : 'Enable'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>🌐 {t('select_your_language') || 'Select Your Language'}</Text>
          <Text style={styles.subtitle}>{t('choose_your_preferred_language')}</Text>
        </View>

        <View style={styles.languageGrid}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageCard,
                selectedLang === lang.code && styles.languageCardActive,
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.languageName}>{lang.native}</Text>
              <Text style={styles.languageCode}>{lang.name}</Text>
              {selectedLang === lang.code && (
                <View style={styles.checkmarkContainer}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, isProcessing && { opacity: 0.6 }]}
          onPress={handleContinue}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.continueButtonText}>Continue →</Text>
          )}
        </TouchableOpacity>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Voice assistant will describe all content as you navigate the app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: spacing.xl, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  voiceRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  voiceToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  voiceIcon: { fontSize: 22, marginRight: 6 },
  voiceToggleText: { fontSize: 12, color: colors.text },
  voiceTip: { fontSize: 12, color: colors.textSecondary, marginRight: spacing.md },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  languageCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  languageCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
    borderWidth: 3,
  },
  languageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  languageCode: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  checkmarkContainer: {
    marginTop: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    flexDirection: 'row',
  },
  continueButtonText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
});
export default LanguageSelectionScreen;
