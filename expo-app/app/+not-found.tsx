import React, { useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/components/useThemeColors';
import { spacing, fontSizes, fontWeights } from '../src/theme';
import { useAuth } from '../src/contexts/AuthContext';

export default function NotFoundScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();

  const goHome = useCallback(() => {
    if (authLoading) return;
    router.replace(session ? '/(tabs)' : '/(auth)');
  }, [authLoading, router, session]);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: true }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.inner}>
          <Text style={[styles.title, { color: colors.text }]}>This screen doesn&apos;t exist.</Text>
          {authLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
          ) : (
            <Pressable
              onPress={goHome}
              style={({ pressed }) => [styles.linkWrap, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel={session ? 'Go to home screen' : 'Go to welcome screen'}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {session ? 'Go to home screen' : 'Go to welcome screen'}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  linkWrap: {
    marginTop: spacing.xl,
    paddingVertical: spacing.s,
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
  spinner: {
    marginTop: spacing.xl,
  },
});
