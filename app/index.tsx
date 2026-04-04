import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AuthBootView, PrimaryButton, Screen, SecondaryButton } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { layout, semantic, spacing, textPresets } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isReady,
    isConfigured,
    isSignedIn,
    emailConfirmed,
    needsEmailVerification,
    isPasswordRecovery,
  } = useAuth();

  if (!isReady) {
    return <AuthBootView />;
  }

  if (isPasswordRecovery) {
    return <Redirect href="/reset-password" />;
  }

  if (isSignedIn && emailConfirmed) {
    return <Redirect href="/portfolio" />;
  }

  if (needsEmailVerification) {
    return <Redirect href="/verify-email-pending" />;
  }

  const bottomPad = Math.max(insets.bottom, spacing.lg);

  return (
    <Screen scroll={false} safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.screen}>
      <View style={styles.upper}>
        <View style={styles.brandMark} accessibilityLabel="PropFolio">
          <Ionicons name="home" size={40} color={semantic.navy} />
        </View>
        <Text style={styles.wordmark}>PropFolio</Text>
        <Text style={styles.tagline}>Invest with Clarity</Text>
        <Text style={styles.creditsTeaser}>
          Membership is $1.99/month after a free first month (via Apple). You get 3 import credits at signup (2 bonus +
          1 for your first cycle), then 1 credit each month with membership. Extra imports: packs from $1.99.
        </Text>
        {!isConfigured ? (
          <Text style={styles.configHint}>
            Add Supabase keys in `.env` (see `docs/AUTH_DEVELOPER_CHECKLIST.md`) to enable sign-in.
          </Text>
        ) : null}
      </View>

      <View style={[styles.actions, { paddingBottom: bottomPad }]}>
        <PrimaryButton
          label="Sign In"
          onPress={() => router.push('/sign-in')}
          disabled={!isConfigured}
          style={styles.btn}
        />
        <SecondaryButton
          label="Create Account"
          onPress={() => router.push('/create-account')}
          disabled={!isConfigured}
          style={styles.btn}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  upper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
    minHeight: 200,
  },
  brandMark: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: semantic.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    shadowColor: semantic.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  wordmark: {
    ...textPresets.pageTitleLarge,
    textAlign: 'center',
    color: semantic.textPrimary,
  },
  tagline: {
    ...textPresets.bodySecondary,
    textAlign: 'center',
    color: semantic.textSecondary,
    marginTop: spacing.xxs,
  },
  creditsTeaser: {
    ...textPresets.caption,
    textAlign: 'center',
    color: semantic.textSecondary,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    maxWidth: 360,
    marginTop: spacing.md,
  },
  configHint: {
    ...textPresets.caption,
    textAlign: 'center',
    color: semantic.textSecondary,
    paddingHorizontal: spacing.lg,
    maxWidth: 340,
    marginTop: spacing.md,
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: spacing.md,
  },
  btn: {
    alignSelf: 'stretch',
  },
});
