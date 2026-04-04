import { Redirect, Stack, usePathname } from 'expo-router';
import { Platform } from 'react-native';

import { AuthBootView } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { useSubscription } from '@/features/subscription';
import { isRouteExemptFromSubscriptionGate } from '@/features/subscription';
import { semantic } from '@/theme';

export default function MainLayout() {
  const pathname = usePathname();
  const {
    isReady,
    isSignedIn,
    needsEmailVerification,
    isPasswordRecovery,
  } = useAuth();
  const sub = useSubscription();

  const onResetPassword = pathname.includes('reset-password');

  if (!isReady) {
    return <AuthBootView />;
  }

  if (isPasswordRecovery && !onResetPassword) {
    return <Redirect href="/reset-password" />;
  }

  if (!isSignedIn) {
    return <Redirect href="/" />;
  }

  if (needsEmailVerification) {
    return <Redirect href="/verify-email-pending" />;
  }

  if (!sub.accessHydrated) {
    return <AuthBootView />;
  }

  if (!sub.hasAppAccess && !isRouteExemptFromSubscriptionGate(pathname)) {
    return <Redirect href="/access-restricted" />;
  }

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        ...(Platform.OS === 'ios' ? { headerBlurEffect: 'systemMaterial' as const } : {}),
        headerTransparent: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: semantic.background },
        headerTintColor: semantic.textPrimary,
        headerLargeTitleStyle: { color: semantic.textPrimary },
        contentStyle: { backgroundColor: semantic.background },
      }}
    >
      <Stack.Screen
        name="access-restricted"
        options={{
          title: 'Membership',
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          title: 'Membership',
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="credit-top-up"
        options={{
          presentation: 'modal',
          title: 'Buy credits',
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen
        name="property/[id]"
        options={{
          headerLargeTitle: false,
          headerTitleAlign: 'center',
        }}
      />
    </Stack>
  );
}
