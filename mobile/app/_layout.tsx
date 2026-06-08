import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { registerForPushNotifications } from '@/utils/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications();
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0E1A' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(teacher)" />
        <Stack.Screen name="(student)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
