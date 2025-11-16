import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// ✅ Web: Use browser's SpeechSynthesis API
// ✅ Mobile: Use expo-speech (already installed)
let Speech;
if (Platform.OS !== 'web') {
  Speech = require('expo-speech');
}

const LANGUAGE_CODE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',  // ✅ FIXED: was 'ka'
  ml: 'ml-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  bn: 'bn-IN',
  or: 'or-IN',
  ur: 'ur-IN'
};

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'हिंदी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  pa: 'ਪੰਜਾਬੀ',
  bn: 'বাংলা',
  or: 'ଓଡିଆ',
  ur: 'اردو'
};

export class VoiceAssistant {
  static isSpeaking = false;
  static currentLanguage = 'en';
  static isEnabled = false;  // Global voice assistant state
  static speechQueue = [];
  static currentUtterance = null;

  // ✅ Initialize voice assistant
  static async initialize() {
    try {
      const savedLang = await AsyncStorage.getItem('userLanguage');
      const voiceEnabled = await AsyncStorage.getItem('voiceAssistantEnabled');
      
      VoiceAssistant.currentLanguage = savedLang || 'en';
      VoiceAssistant.isEnabled = voiceEnabled === 'true';
      
      console.log('🎤 VoiceAssistant initialized');
      console.log(`   Language: ${VoiceAssistant.currentLanguage} (${LANGUAGE_NAMES[VoiceAssistant.currentLanguage]})`);
      console.log(`   Status: ${VoiceAssistant.isEnabled ? 'ENABLED' : 'DISABLED'}`);
      
      await VoiceAssistant.stop();
    } catch (error) {
      console.error('❌ VoiceAssistant initialization error:', error);
    }
  }

  // ✅ Set language
  static async setLanguage(lang) {
    try {
      if (!LANGUAGE_CODE_MAP[lang]) {
        console.warn(`⚠️ Language ${lang} not supported, using English`);
        VoiceAssistant.currentLanguage = 'en';
        return;
      }

      console.log(`🔄 Changing language to: ${lang} (${LANGUAGE_NAMES[lang]})`);
      await VoiceAssistant.stop();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      VoiceAssistant.currentLanguage = lang;
      await AsyncStorage.setItem('userLanguage', lang);
      
      console.log(`✅ Language changed to: ${lang}`);
    } catch (error) {
      console.error('❌ Error setting language:', error);
    }
  }

  // ✅ Enable/Disable voice assistant globally
  static async setEnabled(enabled) {
    try {
      VoiceAssistant.isEnabled = enabled;
      await AsyncStorage.setItem('voiceAssistantEnabled', enabled ? 'true' : 'false');
      
      console.log(`🎤 Voice Assistant ${enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
      
      if (!enabled) {
        await VoiceAssistant.stop();
      }
      
      // Haptic feedback
      await VoiceAssistant.hapticFeedback(enabled ? 'success' : 'warning');
      
      return true;
    } catch (error) {
      console.error('❌ Error setting voice assistant state:', error);
      return false;
    }
  }

  // ✅ Get enabled state
  static async getEnabled() {
    try {
      const enabled = await AsyncStorage.getItem('voiceAssistantEnabled');
      VoiceAssistant.isEnabled = enabled === 'true';
      return VoiceAssistant.isEnabled;
    } catch (error) {
      return false;
    }
  }

  // ✅ Clean text (remove emojis, special characters)
  static cleanText(text) {
    if (!text) return '';
    
    return text
      // Remove emojis and icons
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Remove special symbols
      .replace(/[←→↑↓✓✕✅❌⚠️📍📊💊🔍]/g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ✅ MAIN SPEAK METHOD - Works on Web + Android
  static async speak(text, lang = null) {
    try {
      // Check if voice assistant is enabled
      if (!VoiceAssistant.isEnabled) {
        console.log('🔇 Voice assistant is disabled, skipping speech');
        return false;
      }

      if (!text || text.trim().length === 0) {
        console.warn('⚠️ Empty text, skipping speech');
        return false;
      }

      const speakLang = lang || VoiceAssistant.currentLanguage;
      
      if (!LANGUAGE_CODE_MAP[speakLang]) {
        console.warn(`⚠️ Language ${speakLang} not supported, falling back to English`);
        return await VoiceAssistant.speak(text, 'en');
      }

      const langCode = LANGUAGE_CODE_MAP[speakLang];
      const cleanedText = VoiceAssistant.cleanText(text);

      if (cleanedText.length === 0) {
        console.warn('⚠️ Text became empty after cleaning, skipping');
        return false;
      }

      console.log(`🔊 Speaking in ${speakLang} (${LANGUAGE_NAMES[speakLang]}): "${cleanedText.substring(0, 50)}..."`);

      // Stop any ongoing speech
      if (VoiceAssistant.isSpeaking) {
        await VoiceAssistant.stop();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      await VoiceAssistant.hapticFeedback('light');

      if (Platform.OS === 'web') {
        // ✅ WEB: Use browser's SpeechSynthesis API
        return await VoiceAssistant.speakWeb(cleanedText, langCode);
      } else {
        // ✅ MOBILE: Use expo-speech
        return await VoiceAssistant.speakMobile(cleanedText, langCode);
      }
    } catch (error) {
      console.error('❌ VoiceAssistant.speak() error:', error);
      VoiceAssistant.isSpeaking = false;
      return false;
    }
  }

  // ✅ WEB SPEECH (Browser API)
  static async speakWeb(text, langCode) {
    return new Promise((resolve) => {
      try {
        if (!window.speechSynthesis) {
          console.error('❌ SpeechSynthesis not supported in this browser');
          resolve(false);
          return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Get voices
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith(langCode.split('-')[0])) || voices[0];
        
        if (voice) {
          utterance.voice = voice;
          console.log(`✅ Using voice: ${voice.name} (${voice.lang})`);
        }

        utterance.onstart = () => {
          VoiceAssistant.isSpeaking = true;
          console.log(`✅ Web speech started`);
        };

        utterance.onend = () => {
          VoiceAssistant.isSpeaking = false;
          console.log(`✅ Web speech finished`);
          resolve(true);
        };

        utterance.onerror = (error) => {
          VoiceAssistant.isSpeaking = false;
          console.error(`❌ Web speech error:`, error);
          resolve(false);
        };

        VoiceAssistant.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('❌ Web speech error:', error);
        resolve(false);
      }
    });
  }

  // ✅ MOBILE SPEECH (expo-speech)
  static async speakMobile(text, langCode) {
    return new Promise((resolve) => {
      try {
        Speech.speak(text, {
          language: langCode,
          rate: 0.9,
          pitch: 1.0,
          volume: 1.0,
          onStart: () => {
            VoiceAssistant.isSpeaking = true;
            console.log(`✅ Mobile speech started`);
          },
          onDone: () => {
            VoiceAssistant.isSpeaking = false;
            console.log(`✅ Mobile speech finished`);
            resolve(true);
          },
          onStopped: () => {
            VoiceAssistant.isSpeaking = false;
            console.log(`⏹️ Mobile speech stopped`);
            resolve(true);
          },
          onError: (error) => {
            VoiceAssistant.isSpeaking = false;
            console.error(`❌ Mobile speech error:`, error);
            resolve(false);
          }
        });
      } catch (error) {
        console.error('❌ Mobile speech error:', error);
        resolve(false);
      }
    });
  }

  // ✅ Speak array of items sequentially
  static async speakItems(items, lang = null) {
    if (!VoiceAssistant.isEnabled) return;
    
    const speakLang = lang || VoiceAssistant.currentLanguage;
    
    for (let i = 0; i < items.length; i++) {
      if (!items[i] || items[i].trim().length === 0) continue;
      
      console.log(`📢 Speaking item ${i + 1}/${items.length}`);
      await VoiceAssistant.speak(items[i], speakLang);
      
      // Small pause between items
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }
  }

  // ✅ Stop speech
  static async stop() {
    try {
      if (VoiceAssistant.isSpeaking) {
        console.log('⏹️ Stopping speech');
        
        if (Platform.OS === 'web') {
          window.speechSynthesis.cancel();
        } else {
          await Speech.stop();
        }
        
        VoiceAssistant.isSpeaking = false;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return true;
    } catch (error) {
      console.error('❌ Error stopping speech:', error);
      VoiceAssistant.isSpeaking = false;
      return false;
    }
  }

  // ✅ Haptic feedback
  static async hapticFeedback(type = 'light') {
    if (Platform.OS === 'web') return; // Not available on web
    
    try {
      const feedbackMap = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      
      const style = feedbackMap[type] || Haptics.ImpactFeedbackStyle.Light;
      await Haptics.impactAsync(style);
    } catch (error) {
      console.warn('⚠️ Haptic feedback not available');
    }
  }

  // ✅ Helper methods
  static isSpeakingNow() {
    return VoiceAssistant.isSpeaking;
  }

  static isLanguageSupported(lang) {
    return LANGUAGE_CODE_MAP.hasOwnProperty(lang);
  }

  static getSupportedLanguages() {
    return Object.keys(LANGUAGE_CODE_MAP);
  }

  static getCurrentLanguage() {
    return VoiceAssistant.currentLanguage;
  }
}

export default VoiceAssistant;