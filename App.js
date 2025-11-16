
import './src/utils/i18n';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { VoiceProvider } from './src/contexts/voiceContext';
import AppNavigator from './src/navigation/AppNavigator';


export default function App() {
  return (
    <SafeAreaProvider>
      <VoiceProvider>
        <AppNavigator />
      </VoiceProvider>
    </SafeAreaProvider>
  );
}