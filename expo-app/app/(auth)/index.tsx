import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components';
import { spacing, fontSizes, fontWeights, lineHeights, radius } from '../../src/theme';
import { useThemeColors } from '../../src/components/useThemeColors';
import { useAuth } from '../../src/contexts/AuthContext';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { ModalCard } from '../../src/components/ModalCard';

const SUBTITLE = 'Invest with Clarity';

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
    <ScreenContainer>
      <View style={styles.centerWrapper}>
        <ModalCard>
          <View style={[styles.brandPanel, { backgroundColor: colors.surface }]}>
            <View style={styles.logoBlock}>
              <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
                <Text style={[styles.logoText, { color: colors.onPrimary }]}>PF</Text>
              </View>
              <View style={styles.wordmarkBlock}>
                <Text style={[styles.wordmark, { color: colors.text }]} numberOfLines={1} allowFontScaling>
                  PropFolio
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1} allowFontScaling>
                  {SUBTITLE}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttons}>
            <Button
              title="Sign In"
              onPress={() => router.push('/(auth)/login')}
              fullWidth
              variant="primary"
              pill
              glow
              accessibilityLabel="Sign in with email and password"
            />
            <Button
              title="Create Account"
              onPress={() => router.push('/(auth)/sign-up')}
              fullWidth
              variant="secondary"
              pill
              accessibilityLabel="Create a new PropFolio account"
            />
          </View>
        </ModalCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  brandPanel: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.l,
    marginBottom: spacing.xl,
  },
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  logoText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  wordmarkBlock: {
    flex: 1,
  },
  wordmark: {
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.8,
    lineHeight: lineHeights.hero,
  },
  subtitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.base,
    marginTop: spacing.xs,
  },
  buttons: {
    gap: spacing.m,
  },
  secondaryLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
});
