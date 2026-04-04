import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/features/auth';
import { SubscriptionProvider } from '@/features/subscription';
import { semantic } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SubscriptionProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: semantic.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
          <Stack.Screen
            name="import-property"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Import Property',
              headerTintColor: semantic.textPrimary,
              headerStyle: { backgroundColor: semantic.surface },
            }}
          />
        </Stack>
        </SubscriptionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
