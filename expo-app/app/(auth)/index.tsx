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
          <View style={styles.logoBlock}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <Text style={[styles.logoText, { color: colors.onPrimary }]}>PF</Text>
            </View>
            <Text style={[styles.wordmark, { color: colors.text }]}>PropFolio</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{SUBTITLE}</Text>

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
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  logoText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  wordmark: {
    fontSize: 40,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.8,
    lineHeight: lineHeights.xxl,
  },
  subtitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xl,
    marginBottom: spacing.xl,
    textAlign: 'left',
  },
  buttons: {
    gap: spacing.m,
  },
  secondaryLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
});
