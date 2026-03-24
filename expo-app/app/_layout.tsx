import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { MonitoringAttributesSync } from '../src/components/MonitoringAttributesSync';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SubscriptionProvider } from '../src/contexts/SubscriptionContext';
import { ImportResumeProvider } from '../src/contexts/ImportResumeContext';
import { RootErrorBoundary } from '../src/components/RootErrorBoundary';
import { useStartupEnvGate } from '../src/hooks/useStartupEnvGate';
import { logStartupPhase } from '../src/startup/startupTelemetry';
import { logErrorSafe } from '../src/services/diagnostics';
import { initMonitoring } from '../src/services/monitoring';

initMonitoring();

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

try {
  void SplashScreen.preventAutoHideAsync();
} catch (e) {
  // Native splash API should not block JS bundle evaluation if it fails.
  if (__DEV__) console.warn('[PropFolio] SplashScreen.preventAutoHideAsync failed', e);
}

function RootLayout() {
  useStartupEnvGate();

  const [loaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      logErrorSafe('startup_font_load', fontError);
    }
  }, [fontError]);

  const fontsResolved = loaded || !!fontError;

  useEffect(() => {
    if (!fontsResolved) return;
    logStartupPhase('fonts_ready', fontError ? 'using_system_fallback' : 'custom_font_loaded');
    void SplashScreen.hideAsync().catch(() => {
      // Splash may already be hidden; never crash launch.
    });
  }, [fontsResolved, fontError]);

  if (!fontsResolved) {
    return null;
  }

  return (
    <RootErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <ImportResumeProvider>
            <RootLayoutNav />
          </ImportResumeProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </RootErrorBoundary>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MonitoringAttributesSync />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="paywall" options={{ headerShown: false }} />
        <Stack.Screen name="update-password" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default RootLayout;
