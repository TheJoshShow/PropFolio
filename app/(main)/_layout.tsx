import { Redirect, Stack, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppBackButton,
  HeaderActionSpacer,
  headerLeadingInset,
  headerTrailingInset,
  stackHeaderBarStyle,
  stackHeaderTitleStyle,
  stackModalHeaderBarStyle,
} from '@/components/navigation';
import { AuthBootView } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { useSubscription } from '@/features/subscription';
import { isRouteExemptFromSubscriptionGate } from '@/features/subscription';
import { semantic } from '@/theme';

export default function MainLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
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
      screenOptions={({ navigation }) => ({
        headerLargeTitle: true,
        headerTransparent: false,
        headerShadowVisible: false,
        headerStyle: stackHeaderBarStyle,
        headerTintColor: semantic.textPrimary,
        headerTitleStyle: stackHeaderTitleStyle,
        headerLargeTitleStyle: { color: semantic.textPrimary },
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: semantic.background },
        headerBackVisible: false,
        headerLeftContainerStyle: headerLeadingInset(insets.left),
        headerRightContainerStyle: headerTrailingInset(insets.right),
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <AppBackButton onPress={() => navigation.goBack()} testID="propfolio.stack.header.back" />
          ) : null,
        headerRight: ({ canGoBack }) => (canGoBack ? <HeaderActionSpacer /> : null),
      })}
    >
      <Stack.Screen
        name="access-restricted"
        options={{
          title: 'Membership',
          headerLargeTitle: false,
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          title: 'Membership',
          headerLargeTitle: false,
          headerStyle: stackModalHeaderBarStyle,
          headerTitleStyle: stackHeaderTitleStyle,
        }}
      />
      <Stack.Screen
        name="credit-top-up"
        options={{
          presentation: 'modal',
          title: 'Buy credits',
          headerLargeTitle: false,
          headerStyle: stackModalHeaderBarStyle,
          headerTitleStyle: stackHeaderTitleStyle,
        }}
      />
      <Stack.Screen
        name="portfolio"
        options={{
          headerShown: false,
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
