import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/components/useThemeColors';
import { spacing, fontSizes, fontWeights } from '../src/theme';

export default function NotFoundScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: true }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.inner}>
          <Text style={[styles.title, { color: colors.text }]}>This screen doesn&apos;t exist.</Text>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [styles.linkWrap, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel="Go to home screen"
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>Go to home screen</Text>
          </Pressable>
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
});
