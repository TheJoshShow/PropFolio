import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/components/useThemeColors';
import { spacing, fontSizes, fontWeights, lineHeights, radius } from '../../src/theme';

/**
 * Deep-link entry point for Supabase email confirmation and magic-link / OAuth callbacks.
 * Native redirect URL (mobile/TestFlight) uses `propfolio://auth/callback`.
 *
 * Session restoration is handled by `AuthContext` listening for the callback URL and calling
 * `supabase.auth.setSession(...)`. This screen just waits for session state and routes.
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
          {isLoading ? 'Signing you in…' : 'Redirecting…'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {Platform.OS === 'ios'
            ? 'Completing authentication'
            : 'Completing sign-in'}
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

