/**
 * Shared recovery UI for root boundary and route-level error.tsx.
 * Production-safe copy; technical details only in __DEV__.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { lightColors } from '../theme/colors';
import { spacing, fontSizes, fontWeights, lineHeights } from '../theme';

export type AppErrorFallbackProps = {
  error: Error;
  onRetry: () => void;
  /** root = full-screen after boundary; route = Expo Router error screen */
  recoveryMode: 'root' | 'route';
};

/**
 * Uses static light colors only so this screen never throws from theme hooks
 * if the theme system is implicated in the failure.
 */
export function AppErrorFallback({ error, onRetry, recoveryMode }: AppErrorFallbackProps) {
  const router = useRouter();
  const colors = lightColors;

  const handleGoHome = () => {
    try {
      router.replace('/(tabs)');
    } catch {
      onRetry();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.inner} accessibilityRole="none">
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          Something went wrong
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {__DEV__
            ? error.message
            : 'We couldn’t load this screen. You can try again or return to the home screen.'}
        </Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          If the problem continues, close the app completely and reopen it.
        </Text>
        {__DEV__ && error.stack ? (
          <Text
            style={[styles.body, { color: colors.textMuted, marginTop: spacing.s }]}
            numberOfLines={12}
          >
            {error.stack.slice(0, 800)}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Try again</Text>
          </Pressable>
          <Pressable
            onPress={handleGoHome}
            style={({ pressed }) => [
              styles.buttonSecondary,
              { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go to home"
            accessibilityHint={
              recoveryMode === 'root'
                ? 'Opens the main tabs after an app-level error'
                : 'Opens the main tabs after this screen failed to load'
            }
          >
            <Text style={[styles.buttonTextSecondary, { color: colors.primary }]}>Go to home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.m,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.title,
  },
  body: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.lg,
  },
  hint: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  actions: {
    marginTop: spacing.s,
    gap: spacing.s,
  },
  button: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonSecondary: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
  buttonTextSecondary: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
});
