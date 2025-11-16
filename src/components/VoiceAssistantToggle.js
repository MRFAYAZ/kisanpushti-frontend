import React, { useState } from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { VoiceService } from '../services/voiceAssistant';

export const VoiceAssistantToggle = ({ onToggle, initialState = false }) => {
  const [voiceEnabled, setVoiceEnabled] = useState(initialState);
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePress = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);

    // ✅ CRITICAL: When toggled OFF, stop any ongoing speech
    if (!newState) {
      console.log('🔇 Voice disabled - stopping speech');
      await VoiceService.stop();
    } else {
      console.log('🔊 Voice enabled');
      // Give haptic feedback
      await VoiceService.hapticFeedback('light');
    }

    // Call parent callback
    onToggle?.(newState);
    
    setIsAnimating(false);
  };

  return (
    <TouchableOpacity
      style={[styles.fab, voiceEnabled ? styles.fabActive : styles.fabInactive]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{voiceEnabled ? '🔊' : '🔇'}</Text>
      {voiceEnabled && <View style={styles.pulse} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabActive: {
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#388E3C'
  },
  fabInactive: {
    backgroundColor: '#ccc',
    borderWidth: 2,
    borderColor: '#999'
  },
  icon: {
    fontSize: 28,
    fontWeight: 'bold'
  },
  pulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    bottom: 5,
    right: 5,
    opacity: 0.8
  }
});

export default VoiceAssistantToggle;