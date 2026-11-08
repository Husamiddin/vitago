import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getSavedToken } from '../services/api';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    getSavedToken().then((token) => {
      setIsAuthenticated(Boolean(token));
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="medicines" options={{ headerShown: true, title: 'Dorilar jadvali' }} />
        <Stack.Screen name="pharmacy-ai" options={{ headerShown: true, title: '24/7 AI Farmatsevt' }} />
        <Stack.Screen name="nutrition" options={{ headerShown: true, title: 'AI Ovqatlanish' }} />
        <Stack.Screen name="alarm" options={{ headerShown: true, title: 'Aqlli Budilnik' }} />
        <Stack.Screen name="statistics" options={{ headerShown: true, title: 'Faollik statistikasi' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
