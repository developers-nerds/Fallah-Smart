import React from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';

// Add SpeechRecognition type declarations for web
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceRecognitionServiceProps {
  onTranscriptReceived: (text: string) => void;
}

const VoiceRecognitionService: React.FC<VoiceRecognitionServiceProps> = ({
  onTranscriptReceived,
}) => {
  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch (err) {
        console.warn('Microphone permission error:', err);
        return false;
      }
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to enable voice input.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
  };

  const startVoiceRecognition = async () => {
    try {
      const hasPermission = await requestMicrophonePermission();
      console.log('hasPermission', hasPermission);

      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Microphone access is required for voice input.');
        return;
      }

      Alert.alert('Select Language', 'Please select a language:', [
        {
          text: 'English',
          onPress: () => startWebSpeechRecognition('en-US'),
        },
        {
          text: 'Arabic',
          onPress: () => startWebSpeechRecognition('ar-SA'),
        },
        {
          text: 'French',
          onPress: () => startWebSpeechRecognition('fr-FR'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (error) {
      console.error('Error in startVoiceRecognition:', error);
      Alert.alert('Error', 'Failed to start voice recognition. Please try again.');
    }
  };

  const startWebSpeechRecognition = async (lang: string) => {
    if (Platform.OS === 'web' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Web Speech recognition started');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Web Speech result:', transcript);
        onTranscriptReceived(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Web Speech recognition error:', event.error);
        Alert.alert('Error', 'Voice recognition failed: ' + event.error);
      };

      recognition.onend = () => {
        console.log('Web Speech recognition ended');
      };

      recognition.start();
    } else {
      Alert.alert('Not Supported', 'Speech recognition is only available on web platforms.');
    }
  };

  return null; // This is a service component, no UI needed
};

export default VoiceRecognitionService;
