import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SubscriptionProvider } from '../src/contexts/SubscriptionContext';
import { ImportResumeProvider } from '../src/contexts/ImportResumeContext';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
const isIOS = Platform.OS === 'ios';

// Sentry: only init on iOS (native). Not used on web.
let Sentry: typeof import('@sentry/react-native') | null = null;
let navigationIntegration: ReturnType<typeof import('@sentry/react-native').reactNavigationIntegration> | null = null;
if (sentryDsn && isIOS) {
  try {
    Sentry = require('@sentry/react-native');
    const { isRunningInExpoGo } = require('expo');
    navigationIntegration = Sentry!.reactNavigationIntegration({
      enableTimeToInitialDisplay: !isRunningInExpoGo(),
    });
    // Production-safe: no PII; replay masks text/images. See docs/sentry_privacy_decision.md.
    Sentry!.init({
      dsn: sentryDsn,
      sendDefaultPii: false,
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      enableLogs: true,
      integrations: [
        navigationIntegration,
        Sentry!.mobileReplayIntegration({
          maskAllText: true,
          maskAllImages: true,
        }),
      ],
      enableNativeFramesTracking: !isRunningInExpoGo(),
      environment: __DEV__ ? 'development' : 'production',
    });
  } catch (_) {
    Sentry = null;
    navigationIntegration = null;
  }
}

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (navigationRef && navigationIntegration) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <ImportResumeProvider>
          <RootLayoutNav />
        </ImportResumeProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="paywall" options={{ headerShown: false }} />
        <Stack.Screen name="update-password" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default Sentry ? Sentry.wrap(RootLayout) : RootLayout;
