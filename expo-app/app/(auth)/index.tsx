/**
 * Welcome screen. Premium hero, value props, Get Started / Sign In.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Button, PillBadge, FeatureRow } from '../../src/components';
import { spacing, fontSizes, fontWeights, lineHeights, radius } from '../../src/theme';
import { useThemeColors } from '../../src/components/useThemeColors';
import { responsiveContentContainer } from '../../src/utils/responsive';
import { useAuth } from '../../src/contexts/AuthContext';

const BADGE_LABEL = '● AI DRIVEN REAL ESTATE INTELLIGENCE';
const HERO_LINE_1 = 'Find the deals';
const HERO_LINE_2 = 'others miss.';
const SUBHEAD_1 = 'Track, analyze & grow your portfolio.';
const SUBHEAD_2 = 'Your edge in real estate investing.';

const FEATURES: { icon: string; description: string }[] = [
  { icon: 'bolt.fill', description: 'Uncover hidden deals before the market does' },
  { icon: 'chart.bar.fill', description: 'Analyze cap rate, cash flow & ARV in seconds' },
  { icon: 'arrow.up.right', description: 'Track your portfolio like a pro investor' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { session, isLoading } = useAuth();

  // Only leave welcome after bootstrap confirms a validated session (avoids racing past login).
  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, responsiveContentContainer]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand lockup */}
        <View style={styles.brandRow}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <SymbolView name="building.2.fill" tintColor={colors.onPrimary} size={28} />
          </View>
          <Text style={[styles.wordmark, { color: colors.text }]}>PropFolio</Text>
        </View>

        <PillBadge label={BADGE_LABEL} />

        {/* Hero */}
        <Text style={[styles.heroLine1, { color: colors.text }]}>{HERO_LINE_1}</Text>
        <Text style={[styles.heroLine2, { color: colors.primary }]}>{HERO_LINE_2}</Text>

        <Text style={[styles.subhead, { color: colors.textSecondary }]}>
          {SUBHEAD_1}{'\n'}{SUBHEAD_2}
        </Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <FeatureRow key={i} icon={f.icon} description={f.description} />
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctaArea}>
          <Button
            title="Get Started For Free"
            onPress={() => router.push('/(auth)/sign-up')}
            fullWidth
            variant="primary"
            pill
            glow
            accessibilityLabel="Get started for free"
          />
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [
              styles.signInButton,
              { borderColor: colors.text },
              pressed && styles.signInPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={[styles.signInLabel, { color: colors.text }]}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.l,
    paddingBottom: spacing.xxxl + 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.s,
  },
  wordmark: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
  },
  heroLine1: {
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.hero,
    marginTop: spacing.xl,
    marginBottom: spacing.xxs,
    letterSpacing: -0.5,
  },
  heroLine2: {
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.hero,
    marginBottom: spacing.m,
    letterSpacing: -0.5,
  },
  subhead: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.lg,
    marginBottom: spacing.xl,
  },
  featureList: {
    marginBottom: spacing.xxl,
  },
  ctaArea: {
    gap: spacing.m,
  },
  signInButton: {
    borderWidth: 2,
    borderRadius: radius.pill,
    paddingVertical: spacing.s,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInPressed: { opacity: 0.85 },
  signInLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
});
