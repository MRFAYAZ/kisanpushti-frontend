import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  // State
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en-US');

  // Initialize voice settings on app start
  useEffect(() => {
    initializeVoice();
  }, []);

  const initializeVoice = async () => {
    try {
      // Get saved language preference
      const savedLang = await AsyncStorage.getItem('voiceLanguage');
      if (savedLang) {
        setCurrentLanguage(savedLang);
      }

      // Get saved voice enabled state
      const savedEnabled = await AsyncStorage.getItem('voiceEnabled');
      if (savedEnabled !== null) {
        setIsVoiceEnabled(JSON.parse(savedEnabled));
      }

      console.log('✅ Voice Assistant initialized');
    } catch (error) {
      console.error('❌ Voice initialization error:', error);
    }
  };

  // Speak with proper error handling
  const speak = useCallback(
    async (text, language = null) => {
      if (!isVoiceEnabled) {
        console.log('⚠️ Voice is disabled');
        return;
      }

      try {
        setIsSpeaking(true);
        const lang = language || currentLanguage;

        // Language mapping for expo-speech
        const languageMap = {
          en: 'en-US',
          hi: 'hi-IN',
          te: 'te-IN',
          ta: 'ta-IN',
          kn: 'kn-IN',
          ml: 'ml-IN',
          gu: 'gu-IN',
          mr: 'mr-IN',
          pa: 'pa-IN',
          bn: 'bn-IN',
          as: 'as-IN',
          or: 'or-IN',
        };

        const mappedLang = languageMap[lang] || 'en-US';

        console.log(`🔊 Speaking in ${mappedLang}: "${text}"`);

        await Speech.speak(text, {
          language: mappedLang,
          rate: 0.9,
          pitch: 1.0,
          onDone: () => {
            setIsSpeaking(false);
            console.log('✅ Speech completed');
          },
          onError: (error) => {
            console.error('❌ Speech error:', error);
            setIsSpeaking(false);
          },
        });
      } catch (error) {
        console.error('❌ Speak error:', error);
        setIsSpeaking(false);
      }
    },
    [isVoiceEnabled, currentLanguage]
  );

  // Toggle voice on/off
  const toggleVoice = useCallback(async () => {
    const newState = !isVoiceEnabled;
    setIsVoiceEnabled(newState);

    // Save preference
    await AsyncStorage.setItem('voiceEnabled', JSON.stringify(newState));

    console.log(`🎤 Voice ${newState ? 'enabled' : 'disabled'}`);

    // Announce state change
    if (newState) {
      await speak('Voice assistant enabled', currentLanguage);
    } else {
      // Stop any ongoing speech
      await Speech.stop();
    }
  }, [isVoiceEnabled, currentLanguage, speak]);

  // Change language
  const changeLanguage = useCallback(
    async (lang) => {
      setCurrentLanguage(lang);
      await AsyncStorage.setItem('voiceLanguage', lang);

      console.log(`🌍 Language changed to ${lang}`);

      // Announce language change
      await speak(`Language changed to ${lang}`, lang);
    },
    [speak]
  );

  // Stop speech
  const stop = useCallback(async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
      console.log('⏹️ Speech stopped');
    } catch (error) {
      console.error('❌ Stop error:', error);
    }
  }, []);

  const value = {
    // State
    isVoiceEnabled,
    isSpeaking,
    currentLanguage,

    // Methods
    speak,
    toggleVoice,
    changeLanguage,
    stop,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
};

// Custom hook to use voice context
export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within VoiceProvider');
  }
  return context;
};

export default VoiceProvider;