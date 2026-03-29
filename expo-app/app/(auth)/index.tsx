/**
 * Welcome screen. Premium landing-style hero, proof points, and account CTAs.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Button, PillBadge, FeatureRow } from '../../src/components';
import { spacing, fontSizes, fontWeights, lineHeights, radius, surfaceSubtle } from '../../src/theme';
import { useThemeColors } from '../../src/components/useThemeColors';
import { responsiveContentContainer } from '../../src/utils/responsive';
import { useAuth } from '../../src/contexts/AuthContext';

const BADGE_LABEL = 'AI-powered real estate intelligence';
const HERO_LINE_1 = 'Find the deals';
const HERO_LINE_2 = 'others miss.';
const SUBHEAD_LINE = 'Build conviction before you buy.';
const SECTION_LABEL = 'Get started';
const ACCOUNT_HINT =
  'Already with us? Sign in — or create a free account in under a minute.';

/** Bold segment + remainder — CAP / Cash Flow / ARV emphasized only. */
const WELCOME_FEATURES: { icon: string; bold: string; suffix: string }[] = [
  { icon: 'percent', bold: 'CAP', suffix: ' rate, instantly' },
  { icon: 'banknote.fill', bold: 'Cash Flow', suffix: ' made clear' },
  { icon: 'chart.line.uptrend.xyaxis', bold: 'ARV', suffix: ' at a glance' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { session, isLoading } = useAuth();

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
        <View style={styles.heroBlock}>
          <View style={styles.brandRow}>
            <View style={[styles.logoIcon, { backgroundColor: colors.primary }, surfaceSubtle]}>
              <SymbolView name="building.2.fill" tintColor={colors.onPrimary} size={34} />
            </View>
            <View style={styles.wordmarkBlock}>
              <Text
                style={[styles.wordmark, { color: colors.text }]}
                numberOfLines={1}
                allowFontScaling
                maxFontSizeMultiplier={1.25}
                {...(Platform.OS === 'ios'
                  ? { adjustsFontSizeToFit: true, minimumFontScale: 0.68 }
                  : {})}
              >
                PropFolio
              </Text>
            </View>
          </View>

          <View style={styles.badgeWrap}>
            <PillBadge label={BADGE_LABEL} />
          </View>

          <Text style={[styles.heroLine1, { color: colors.text }]}>{HERO_LINE_1}</Text>
          <Text style={[styles.heroLine2, { color: colors.primary }]}>{HERO_LINE_2}</Text>

          <View style={styles.subheadBlock}>
            <Text style={[styles.subhead, { color: colors.textSecondary }]}>{SUBHEAD_LINE}</Text>
          </View>

          <View style={styles.featureList}>
            {WELCOME_FEATURES.map((f) => (
              <FeatureRow
                key={f.bold}
                icon={f.icon}
                description={
                  <>
                    <Text style={styles.featureEmphasis}>{f.bold}</Text>
                    <Text style={styles.featureRest}>{f.suffix}</Text>
                  </>
                }
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionSpacer} />

        <View style={styles.accountSection}>
          <View style={[styles.sectionRule, { backgroundColor: colors.border }]} />
          <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>{SECTION_LABEL}</Text>
          <Text style={[styles.accountHint, { color: colors.textMuted }]}>{ACCOUNT_HINT}</Text>
          <View style={styles.ctaArea}>
            <Button
              title="Sign in"
              onPress={() => router.push('/(auth)/login')}
              fullWidth
              variant="primary"
              pill
              glow
              style={styles.primaryCta}
              accessibilityLabel="Sign in with email and password"
            />
            <Pressable
              onPress={() => router.push('/(auth)/sign-up')}
              style={({ pressed }) => [
                styles.secondaryCta,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
                pressed && styles.secondaryCtaPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              <Text style={[styles.secondaryCtaLabel, { color: colors.text }]}>Create account</Text>
            </Pressable>
          </View>
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
    paddingTop: spacing.s,
    paddingBottom: spacing.xxxl,
  },
  heroBlock: {
    flexShrink: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  logoIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  wordmarkBlock: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 54,
  },
  /** ~2× prior title (28) visual weight; iOS scales down on narrow widths via adjustsFontSizeToFit. */
  wordmark: {
    fontSize: 52,
    fontWeight: fontWeights.bold,
    letterSpacing: -1.2,
    lineHeight: 56,
  },
  badgeWrap: {
    marginBottom: spacing.m,
  },
  heroLine1: {
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.hero,
    marginBottom: spacing.xxs,
    letterSpacing: -1,
  },
  heroLine2: {
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.hero,
    marginBottom: spacing.m,
    letterSpacing: -0.75,
  },
  subheadBlock: {
    marginBottom: spacing.m,
  },
  subhead: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xl,
    letterSpacing: -0.2,
  },
  featureList: {
    gap: spacing.s,
    marginBottom: 0,
  },
  featureEmphasis: {
    fontWeight: fontWeights.bold,
  },
  featureRest: {
    fontWeight: fontWeights.medium,
  },
  sectionSpacer: {
    flexGrow: 1,
    minHeight: spacing.l,
  },
  accountSection: {
    flexShrink: 0,
    paddingBottom: spacing.xs,
  },
  sectionRule: {
    height: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.xs,
    opacity: 0.45,
    marginBottom: spacing.l,
    alignSelf: 'stretch',
  },
  accountLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    letterSpacing: -0.15,
    marginBottom: spacing.xs,
  },
  accountHint: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.lg,
    marginBottom: spacing.l,
    letterSpacing: -0.1,
  },
  ctaArea: {
    gap: spacing.m,
  },
  primaryCta: {
    minHeight: 54,
    paddingVertical: spacing.m,
  },
  secondaryCta: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.pill,
    paddingVertical: spacing.m,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaPressed: { opacity: 0.88 },
  secondaryCtaLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
});
