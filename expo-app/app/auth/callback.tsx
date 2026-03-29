import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/components/useThemeColors';
import { spacing, fontSizes, fontWeights, lineHeights, radius } from '../../src/theme';

/**
 * Route shown when the app opens via `propfolio://auth/callback` (email confirm or password reset).
 * Session is completed in `AuthContext` via PKCE `exchangeCodeForSession` from the same URL (Linking).
 * This screen only bridges UX: wait for session, then go to tabs or login.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    // Wait until AuthContext finishes processing the callback URL (isLoading -> false).
    if (session) {
      router.replace('/(tabs)');
      return;
    }
    if (!isLoading) {
      router.replace('/(auth)/login');
    }
  }, [session, isLoading, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          {isLoading ? 'Opening your link…' : 'Redirecting…'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {Platform.OS === 'ios'
            ? 'Confirming your email or finishing password reset'
            : 'Finishing sign-in from your email link'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.m,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.lg,
    marginTop: spacing.m,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    textAlign: 'center',
    maxWidth: 320,
  },
});

